import React, { useState } from 'react';
import { AppView } from './types.ts';
import ChatBox from './components/ChatBox.tsx';
import VoiceAssistant from './components/VoiceAssistant.tsx';
import Navigation from './components/Navigation.tsx';
import ResourcesView from './components/ResourcesView.tsx';
import AnalyticsView from './components/AnalyticsView.tsx';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.CHAT);

  const renderView = () => {
    switch (currentView) {
      case AppView.CHAT:
        return (
          <ChatBox 
            onStartCall={() => setCurrentView(AppView.VOICE)} 
            onViewResources={() => setCurrentView(AppView.RESOURCES)}
          />
        );
      case AppView.VOICE:
        return <VoiceAssistant onBack={() => setCurrentView(AppView.CHAT)} />;
      case AppView.RESOURCES:
        return <ResourcesView onBack={() => setCurrentView(AppView.CHAT)} />;
      case AppView.ANALYTICS:
        return <AnalyticsView />;
      default:
        return <ChatBox onStartCall={() => setCurrentView(AppView.VOICE)} />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white text-slate-900 overflow-hidden font-sans">
      <header className="bg-emerald-900 text-white shadow-sm shrink-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView(AppView.CHAT)}>
            <div className="bg-white p-1 rounded-md shadow-sm">
               <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-emerald-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>
            </div>
            <h1 className="text-base font-serif font-bold tracking-tight">IIUI Student Support</h1>
          </div>

          <div className="hidden lg:flex gap-6">
            {[
              { id: AppView.CHAT, label: 'Chat Support' },
              { id: AppView.VOICE, label: 'Voice Link' },
              { id: AppView.RESOURCES, label: 'Resource Hub' },
            ].map((item) => (
               <button 
                 key={item.id}
                 onClick={() => setCurrentView(item.id)}
                 className={`text-[11px] font-bold uppercase tracking-wider transition-all py-1 ${
                   currentView === item.id ? 'text-white border-b-2 border-white' : 'text-emerald-200 hover:text-white'
                 }`}
               >
                 {item.label}
               </button>
            ))}
          </div>
        </div>
      </header>

      {/* Added bottom padding to main to account for footer and nav */}
      <main className="flex-1 flex flex-col max-w-7xl mx-auto w-full overflow-hidden relative pb-24 md:pb-12">
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          {renderView()}
        </div>
      </main>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-8 left-0 right-0 z-[60] bg-white border-t border-slate-100 shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
        <Navigation currentView={currentView} setView={setCurrentView} />
      </div>

      {/* Persistent Static Watermark */}
      <footer className="fixed bottom-0 left-0 right-0 z-[70] bg-white/95 backdrop-blur-md border-t border-slate-100 py-2.5 text-center pointer-events-none">
        <p className="text-[10px] text-slate-400 font-semibold tracking-wide">
          Developed by Umair Khatab Abbasi, Business Analyst at IIUI
        </p>
      </footer>
    </div>
  );
};

export default App;