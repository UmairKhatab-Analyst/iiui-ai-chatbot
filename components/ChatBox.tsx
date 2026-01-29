import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { ChatMessage } from '../types.ts';
import { SYSTEM_INSTRUCTION, COMMON_QUESTIONS } from '../constants.ts';

const STORAGE_KEY = 'iiui_chat_final_v1';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

/**
 * FormattedText: Professional AI response renderer.
 * Focuses on a distinct visual hierarchy: Strong headings followed by clean body text.
 */
const FormattedText: React.FC<{ text: string; role: string }> = ({ text, role }) => {
  const isUrdu = (t: string) => /[\u0600-\u06FF]/.test(t);
  const textIsUrdu = isUrdu(text);

  if (role === 'user') {
    return (
      <div className={`whitespace-pre-wrap leading-relaxed ${textIsUrdu ? 'font-urdu text-right text-lg' : 'text-sm md:text-[15px]'}`}>
        {text}
      </div>
    );
  }

  const lines = text.split('\n');
  const renderedElements: React.ReactNode[] = [];
  
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) {
      renderedElements.push(<div key={`br-${idx}`} className="h-4" />);
      return;
    }

    // Bold text parsing (**bold**)
    const parts = trimmed.split(/(\*\*.*?\*\*)/g);
    const content = parts.map((part, pIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={pIdx} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
      }
      return part;
    });

    // Professional Heading Detection: Lines starting with # or ending with :
    // Optimized for "Heading then Text" flow.
    if (trimmed.startsWith('#') || (trimmed.endsWith(':') && trimmed.length < 65)) {
      renderedElements.push(
        <h4 key={idx} className={`font-bold text-emerald-950 text-base md:text-[16px] mt-6 mb-2 tracking-tight flex items-center gap-2 ${textIsUrdu ? 'font-urdu text-right text-xl' : 'text-left'}`}>
          {!textIsUrdu && <span className="w-1 h-4 bg-emerald-600 rounded-full inline-block"></span>}
          {trimmed.replace(/^#+\s*/, '')}
        </h4>
      );
    } 
    // List Detection
    else if (trimmed.startsWith('-') || trimmed.startsWith('*') || /^\d+\./.test(trimmed)) {
      renderedElements.push(
        <div key={idx} className={`flex gap-3 mb-2.5 ${textIsUrdu ? 'flex-row-reverse text-right' : 'flex-row text-left'}`}>
          <span className="text-emerald-600 font-bold shrink-0 mt-1.5">•</span>
          <span className={`text-slate-600 text-sm md:text-[15px] leading-relaxed flex-1 ${textIsUrdu ? 'font-urdu text-lg' : ''}`}>
            {content}
          </span>
        </div>
      );
    } 
    // Standard Paragraph / Subtext
    else {
      renderedElements.push(
        <p key={idx} className={`text-slate-600 text-sm md:text-[15px] leading-relaxed mb-4 ${textIsUrdu ? 'font-urdu text-right text-lg' : 'text-left'}`}>
          {content}
        </p>
      );
    }
  });

  return <div className="w-full space-y-1">{renderedElements}</div>;
};

interface ChatBoxProps {
  onStartCall?: () => void;
  onViewResources?: () => void;
}

const ChatBox: React.FC<ChatBoxProps> = ({ onStartCall, onViewResources }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
      } catch (e) { return []; }
    }
    return [];
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [sources, setSources] = useState<{title: string, uri: string}[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };
      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (e) {
        alert("Mic permission needed.");
      }
    }
  };

  const handleClearChat = () => {
    localStorage.removeItem(STORAGE_KEY);
    setMessages([]);
    setSources([]);
    setInput('');
    setIsLoading(false);
    setIsListening(false);
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  };

  const handleSend = async (customText?: string) => {
    const text = (customText || input).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setSources([]);

try {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: text }),
  });

  const data = await res.json();

  const botMsg: ChatMessage = {
    role: "assistant",
    text: data.reply,
    timestamp: new Date(),
  };

  setMessages(prev => [...prev, botMsg]);
} catch (error) {
  setMessages(prev => [
    ...prev,
    {
      role: "assistant",
      text: "Network issue. Please try again.",
      timestamp: new Date(),
    },
  ]);
} finally {
  setIsLoading(false);
}


      let fullText = '';
      const aiMsg: ChatMessage = { role: 'model', text: '', timestamp: new Date(), isStreaming: true };
      setMessages(prev => [...prev, aiMsg]);

      for await (const chunk of responseStream) {
        fullText += chunk.text || '';
        const chunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (chunks) {
          const newSources = chunks.filter(c => c.web).map(c => ({ title: c.web!.title, uri: c.web!.uri }));
          setSources(prev => {
            const combined = [...prev, ...newSources];
            return combined.filter((v, i, a) => a.findIndex(t => t.uri === v.uri) === i);
          });
        }
        setMessages(prev => {
          const updated = [...prev];
          if (updated.length > 0) {
            updated[updated.length - 1] = { ...updated[updated.length - 1], text: fullText };
          }
          return updated;
        });
      }
      setMessages(prev => {
        const updated = [...prev];
        if (updated.length > 0) {
          updated[updated.length - 1].isStreaming = false;
        }
        return updated;
      });
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'model', text: `Network issue. Please try again.`, timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-white border-b border-slate-200 p-3 flex justify-between items-center sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-2 px-3">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
          <h3 className="font-bold text-emerald-900 text-[10px] uppercase tracking-widest">H-10 Node Active</h3>
        </div>
        <button 
          onClick={handleClearChat}
          className="text-[10px] font-black text-slate-400 hover:text-red-600 transition-all uppercase px-4 py-1.5 rounded-full hover:bg-red-50 border border-transparent hover:border-red-100"
        >
          Clear Current Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth bg-pattern">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-8 max-w-lg mx-auto py-12 animate-in fade-in zoom-in">
            <div className="w-16 h-16 bg-emerald-900 rounded-2xl flex items-center justify-center shadow-lg">
               <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-serif font-bold text-slate-900">As-salamu alaykum</h2>
              <p className="text-slate-500 text-sm italic px-10">How can Node-H10 assist you with your campus queries today?</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full px-4">
              {COMMON_QUESTIONS.map((q, i) => (
                <button 
                  key={i} 
                  onClick={() => handleSend(q)}
                  className="p-4 bg-white border border-slate-200 rounded-xl text-[12px] font-bold text-slate-600 hover:border-emerald-600 hover:text-emerald-800 transition-all shadow-sm hover:shadow-md text-left flex items-center justify-between group"
                >
                  {q}
                  <svg className="w-3 h-3 text-slate-200 group-hover:text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
            <div className={`w-fit max-w-[95%] md:max-w-[80%] px-6 py-5 rounded-3xl shadow-sm transition-all ${
              msg.role === 'user' 
                ? 'bg-emerald-900 text-white rounded-tr-none ml-auto' 
                : 'bg-white border border-slate-200 rounded-tl-none mr-auto border-l-4 border-l-emerald-600 text-left'
            }`}>
              <FormattedText text={msg.text} role={msg.role} />
              
              {!msg.isStreaming && msg.role === 'model' && idx === messages.length - 1 && sources.length > 0 && (
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Institutional References</p>
                  <div className="flex flex-wrap gap-2">
                    {sources.map((s, i) => (
                      <a key={i} href={s.uri} target="_blank" rel="noopener" className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 flex items-center gap-1.5 hover:bg-emerald-100">
                        {s.title.split('|')[0].trim().slice(0, 35)}
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && !messages[messages.length-1]?.isStreaming && (
          <div className="flex justify-start">
             <div className="bg-white border border-slate-200 px-4 py-2 rounded-xl flex items-center gap-3 shadow-sm">
               <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"></div>
               <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.1s]"></div>
               <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
             </div>
          </div>
        )}
        <div ref={scrollRef} className="h-4" />
      </div>

      <div className="p-4 md:p-6 bg-white border-t border-slate-200">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="max-w-md mx-auto flex gap-2">
          <div className="flex-1 relative flex items-center group">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="How can I help you?"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-5 pr-12 py-3 focus:outline-none focus:border-emerald-600 transition-all text-sm font-medium"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={toggleListening}
              className={`absolute right-2 p-2 rounded-lg transition-all ${
                isListening ? 'text-red-500 bg-red-50' : 'text-slate-300 hover:text-emerald-600'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>
            </button>
          </div>
          <button 
            type="submit" 
            disabled={isLoading || !input.trim()} 
            className="bg-emerald-900 text-white rounded-xl px-5 py-3 hover:bg-emerald-950 transition-all disabled:opacity-50 flex items-center justify-center active:scale-95 shadow-md"
          >
            {isLoading ? (
               <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 5l7 7m0 0l-7 7m7-7H3"/></svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatBox;
