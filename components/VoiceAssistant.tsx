import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { SYSTEM_INSTRUCTION } from '../constants';

// Raw PCM encoding/decoding helpers
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

interface TranscriptMessage {
  role: 'ai' | 'user';
  text: string;
}

interface VoiceAssistantProps {
  onBack?: () => void;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ onBack }) => {
  const [status, setStatus] = useState<'idle' | 'calling' | 'connected' | 'ended'>('idle');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [liveAiText, setLiveAiText] = useState(''); // Current live AI turn
  const [liveUserText, setLiveUserText] = useState(''); // Current live User turn
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [micVolume, setMicVolume] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<any>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Buffer for transcriptions
  const currentInputTransRef = useRef('');
  const currentOutputTransRef = useRef('');

  // Auto-scroll transcript
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript, liveAiText, liveUserText]);

  const stopCall = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (sessionRef.current) {
      try { sessionRef.current.close(); } catch (e) {}
      sessionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    sourcesRef.current.forEach(source => {
      try { source.stop(); } catch(e) {}
    });
    sourcesRef.current.clear();
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
      outputAudioContextRef.current.close().catch(() => {});
      outputAudioContextRef.current = null;
    }
    nextStartTimeRef.current = 0;
    setMicVolume(0);
    setStatus('ended');
    currentInputTransRef.current = '';
    currentOutputTransRef.current = '';
  };

  useEffect(() => {
    return () => stopCall();
  }, []);

  useEffect(() => {
    if (status === 'connected') {
      timerRef.current = setInterval(() => setCallDuration(prev => prev + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [status]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startCall = async () => {
    try {
      setStatus('calling');
      setLiveAiText('');
      setLiveUserText('');
      setTranscript([]);
      setCallDuration(0);
      currentInputTransRef.current = '';
      currentOutputTransRef.current = '';

      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = inputCtx;
      outputAudioContextRef.current = outputCtx;

      await inputCtx.resume();
      await outputCtx.resume();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const analyser = inputCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateVolume = () => {
        if (!analyserRef.current || status === 'ended') return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        setMicVolume(sum / dataArray.length);
        requestAnimationFrame(updateVolume);
      };

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setStatus('connected');
            updateVolume();
            const micSource = inputCtx.createMediaStreamSource(stream);
            micSource.connect(analyser);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              if (isMuted || !sessionRef.current) return;
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              const pcmBlob = { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
              try { sessionRef.current.sendRealtimeInput({ media: pcmBlob }); } catch (err) {}
            };
            micSource.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Transcriptions
            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              currentOutputTransRef.current += text;
              setLiveAiText(currentOutputTransRef.current);
            } else if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              currentInputTransRef.current += text;
              setLiveUserText(currentInputTransRef.current);
            }

            // End of turn
            if (message.serverContent?.turnComplete) {
              const finalAi = currentOutputTransRef.current;
              const finalUser = currentInputTransRef.current;
              
              setTranscript(prev => {
                const newHistory = [...prev];
                if (finalUser) newHistory.push({ role: 'user', text: finalUser });
                if (finalAi) newHistory.push({ role: 'ai', text: finalAi });
                return newHistory;
              });

              setLiveAiText('');
              setLiveUserText('');
              currentInputTransRef.current = '';
              currentOutputTransRef.current = '';
            }

            // Handle Audio Playback
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current) {
              const ctx = outputAudioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
              const sourceNode = ctx.createBufferSource();
              sourceNode.buffer = audioBuffer;
              sourceNode.connect(ctx.destination);
              sourceNode.onended = () => sourcesRef.current.delete(sourceNode);
              sourceNode.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(sourceNode);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => {
            console.error("Live Error:", e);
            stopCall();
          },
          onclose: () => stopCall()
        },
        config: {
          responseModalities: [Modality.AUDIO],
          // UPDATED INSTRUCTIONS: Strictly forbidding redirects and enforcing language parity
          systemInstruction: SYSTEM_INSTRUCTION + `
            
            CRITICAL VOICE CHANNEL PROTOCOLS:
            1. LANGUAGE PARITY: If the student speaks English, you MUST respond ONLY in English. If the student speaks Urdu, respond ONLY in Urdu. Match the input language perfectly.
            2. DIRECT SOLUTIONS ONLY: Never tell the user to "visit the website", "search for yourself", or "go to the portal". This is extremely unhelpful. You MUST provide the specific answer or solve the problem yourself.
            3. USE GOOGLE SEARCH: For any query about real-time events, current holiday dates, merit lists, or news, use the 'googleSearch' tool immediately to get the answer. DO NOT guess and DO NOT redirect.
            4. BE CONCISE: Voice responses should be short and direct (max 35 words).
            5. IDENTITY: You are a helpful IIUI assistant. If you don't know an answer even after searching, explain the exact physical office or person they should visit on campus.`,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          tools: [{ googleSearch: {} }],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Charon' } } }
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err) {
      setStatus('idle');
      alert("Microphone permission required.");
    }
  };

  const isUrdu = (text: string) => /[\u0600-\u06FF]/.test(text);

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white relative overflow-hidden font-sans">
      <div className={`absolute inset-0 bg-emerald-950/20 transition-opacity duration-1000 ${status === 'connected' ? 'opacity-100' : 'opacity-0'}`}></div>
      
      {/* Header */}
      <div className="p-4 md:p-6 flex justify-between items-center z-10 shrink-0 border-b border-white/5 bg-slate-950/50 backdrop-blur-md">
        <button 
          onClick={status === 'idle' ? onBack : stopCall} 
          className="p-3 bg-white/5 hover:bg-white/10 rounded-full border border-white/5 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg>
        </button>
        <div className="text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500/80 mb-0.5">H-10 Voice Support</p>
          <p className="text-[11px] font-bold text-slate-400">
            {status === 'connected' ? `Connected • ${formatTime(callDuration)}` : 'Secure Channel'}
          </p>
        </div>
        <div className="w-11"></div>
      </div>

      {/* Main Call UI */}
      <div className="flex-1 flex flex-col relative z-10 overflow-hidden">
        {status === 'idle' || status === 'ended' ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
            <div className="w-40 h-40 rounded-full bg-emerald-900/10 border-2 border-emerald-500/20 flex items-center justify-center mb-8 relative shadow-inner">
              <svg className="w-16 h-16 text-emerald-500/30" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
              {status === 'ended' && <span className="absolute -bottom-2 bg-red-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg text-white">Call Ended</span>}
            </div>
            <h2 className="text-3xl font-serif font-bold mb-4">Voice Assistant</h2>
            <p className="text-slate-500 text-sm text-center mb-10 max-w-xs italic">Ask naturally. I will search for answers directly instead of redirecting you to websites.</p>
            <button 
              onClick={startCall}
              className="w-24 h-24 bg-emerald-600 hover:bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.3)] transition-all active:scale-95 group"
            >
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Scrollable Transcript Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-4 mask-gradient-b pb-40"
            >
              {transcript.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-2xl text-sm font-medium ${msg.role === 'user' ? 'bg-emerald-600/20 text-emerald-100' : 'bg-white/5 text-slate-300'} ${isUrdu(msg.text) ? 'font-urdu text-base' : ''}`}>
                    {msg.text.replace(/\*\*/g, '')}
                  </div>
                </div>
              ))}
              {/* Active Visualizer during call */}
              <div className="flex justify-center py-10">
                <div className="relative">
                  <div 
                    className="absolute inset-0 rounded-full bg-emerald-500/20 blur-xl transition-all duration-75"
                    style={{ transform: `scale(${1 + micVolume / 100})`, opacity: micVolume / 100 + 0.1 }}
                  ></div>
                  <div 
                    className="w-32 h-32 rounded-full border-2 border-emerald-500/30 flex items-center justify-center bg-slate-900/50 backdrop-blur-md"
                    style={{ boxShadow: `0 0 ${micVolume}px rgba(16,185,129,0.2)` }}
                  >
                    <div className="flex gap-1.5 items-end h-8">
                       {[0.6, 1.2, 0.8].map((v, i) => (
                         <div key={i} className="w-1.5 bg-emerald-400 rounded-full transition-all duration-75" style={{ height: `${8 + (micVolume * v)}px` }}></div>
                       ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Subtitle Overlay (Bottom fixed during interaction) */}
            <div className="absolute bottom-32 left-0 right-0 px-6 flex flex-col items-center pointer-events-none z-30">
              <div className="w-full max-w-2xl bg-slate-950/80 backdrop-blur-xl border border-white/5 p-5 rounded-3xl shadow-2xl animate-in slide-in-from-bottom-4">
                <div className={`text-xl md:text-2xl font-serif font-bold text-center leading-snug line-clamp-2 ${isUrdu(liveAiText || liveUserText) ? 'font-urdu' : ''}`}>
                  {liveAiText.replace(/\*\*/g, '').replace(/\*/g, '') || 
                   (liveUserText ? `“${liveUserText}”` : 
                   (status === 'connected' ? (micVolume > 5 ? "Listening..." : "I am here to help. Ask me anything.") : ""))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Control Strip */}
      {(status === 'calling' || status === 'connected') && (
        <div className="pb-12 md:pb-8 flex justify-center items-center gap-8 z-20 shrink-0 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent pt-10">
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all border-2 ${isMuted ? 'bg-white text-slate-950 border-white' : 'bg-white/5 text-white border-white/10 hover:bg-white/10'}`}
          >
            {isMuted ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
            )}
          </button>

          <button 
            onClick={stopCall}
            className="w-20 h-20 bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center shadow-[0_15px_40px_rgba(220,38,38,0.4)] transition-all active:scale-90"
            title="End Call"
          >
            <svg className="w-9 h-9 text-white rotate-[135deg]" fill="currentColor" viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
          </button>

          <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center text-white/30 cursor-not-allowed">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
          </div>
        </div>
      )}

      <style>{`
        .mask-gradient-b {
          mask-image: linear-gradient(to bottom, transparent, black 5%, black 85%, transparent);
          -webkit-mask-image: linear-gradient(to bottom, transparent, black 5%, black 85%, transparent);
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default VoiceAssistant;