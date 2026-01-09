import React, { useState } from 'react';
import { Mic, MessageSquare, LayoutDashboard, Aperture } from 'lucide-react';
import LiveVoiceInterface from './components/LiveVoiceInterface';
import ChatInterface from './components/ChatInterface';
import Dashboard from './components/Dashboard';
import { AppMode } from './types';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.DASHBOARD);

  return (
    <div className="w-screen h-screen bg-slate-950 text-cyan-100 flex flex-col overflow-hidden scanline">
      {/* Top Navigation Bar */}
      <header className="h-16 border-b border-cyan-900 bg-slate-900/80 flex items-center justify-between px-6 z-20 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="relative w-10 h-10 flex items-center justify-center">
             <div className="absolute inset-0 border-2 border-cyan-500 rounded-full animate-pulse-slow"></div>
             <Aperture className="text-cyan-400 animate-spin-slow" size={24} />
          </div>
          <h1 className="font-sci-fi text-2xl font-bold tracking-[0.2em] text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
            J.A.R.V.I.S.
          </h1>
        </div>
        
        <nav className="flex items-center space-x-1 bg-slate-950/50 p-1 border border-cyan-900 rounded-lg">
          <button
            onClick={() => setMode(AppMode.DASHBOARD)}
            className={`flex items-center space-x-2 px-4 py-2 rounded transition-all font-mono text-sm ${
              mode === AppMode.DASHBOARD 
              ? 'bg-cyan-900/40 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]' 
              : 'text-slate-500 hover:text-cyan-400'
            }`}
          >
            <LayoutDashboard size={18} />
            <span className="hidden md:inline">SYSTEM</span>
          </button>
          <button
            onClick={() => setMode(AppMode.CHAT_COMMAND)}
            className={`flex items-center space-x-2 px-4 py-2 rounded transition-all font-mono text-sm ${
              mode === AppMode.CHAT_COMMAND 
              ? 'bg-cyan-900/40 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]' 
              : 'text-slate-500 hover:text-cyan-400'
            }`}
          >
            <MessageSquare size={18} />
            <span className="hidden md:inline">COMMAND</span>
          </button>
          <button
            onClick={() => setMode(AppMode.LIVE_VOICE)}
            className={`flex items-center space-x-2 px-4 py-2 rounded transition-all font-mono text-sm ${
              mode === AppMode.LIVE_VOICE 
              ? 'bg-cyan-900/40 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]' 
              : 'text-slate-500 hover:text-cyan-400'
            }`}
          >
            <Mic size={18} />
            <span className="hidden md:inline">VOICE</span>
          </button>
        </nav>
        
        <div className="hidden md:block font-mono text-xs text-cyan-700">
           v3.0.1_BETA
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
        {/* Background Grid */}
        <div className="absolute inset-0 pointer-events-none opacity-10" 
             style={{ 
               backgroundImage: 'linear-gradient(#0891b2 1px, transparent 1px), linear-gradient(90deg, #0891b2 1px, transparent 1px)', 
               backgroundSize: '40px 40px' 
             }}>
        </div>

        <div className="relative z-10 h-full w-full">
            {mode === AppMode.DASHBOARD && <Dashboard />}
            {mode === AppMode.CHAT_COMMAND && <ChatInterface />}
            {mode === AppMode.LIVE_VOICE && <LiveVoiceInterface />}
        </div>
      </main>
    </div>
  );
};

export default App;