import React, { useState, useEffect, useRef } from 'react';
import { Send, Cpu, Globe, BrainCircuit, PlayCircle, Loader2 } from 'lucide-react';
import { generateChatResponse, generateSpeech } from '../services/geminiService';
import { Message } from '../types';
import { decodeAudioData } from '../services/audioUtils';

const ChatInterface: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      role: 'model',
      content: 'J.A.R.V.I.S. Systems Online. How may I assist you, Sir?',
      timestamp: Date.now(),
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [useSearch, setUseSearch] = useState(false);
  const [useThinking, setUseThinking] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));

      // Determine model based on complexity toggle (Thinking) or Speed (default/search)
      // Request says: Search -> gemini-3-flash-preview
      // Thinking -> gemini-3-pro-preview
      // Chatbot -> gemini-3-pro-preview
      
      let model = 'gemini-3-pro-preview';
      if (useSearch && !useThinking) {
        model = 'gemini-3-flash-preview'; 
      }

      const result = await generateChatResponse(userMsg.content, history, {
        model,
        useSearch,
        useThinking,
        systemInstruction: "You are JARVIS. Answer concisely and with technical precision unless asked for detail. If using search, cite sources.",
      });
      
      const responseText = result.response.text;
      const chunks = result.response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      
      const sources = chunks?.map((c: any) => ({
        uri: c.web?.uri,
        title: c.web?.title
      })).filter((s: any) => s.uri);

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: responseText,
        timestamp: Date.now(),
        sources,
        isThinking: useThinking
      };

      setMessages(prev => [...prev, botMsg]);

    } catch (error) {
      console.error(error);
      const errorMsg: Message = {
        id: Date.now().toString(),
        role: 'system',
        content: 'Error: Connection interrupted or quota exceeded.',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const playTTS = async (text: string) => {
    if (isPlayingAudio) return;
    try {
      setIsPlayingAudio(true);
      const result = await generateSpeech(text);
      const base64Audio = result.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      
      if (base64Audio) {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        // Decode base64
        const binaryString = atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        const audioBuffer = await decodeAudioData(bytes, ctx, 24000, 1);
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.onended = () => {
             setIsPlayingAudio(false);
             ctx.close();
        };
        source.start();
      } else {
        setIsPlayingAudio(false);
      }
    } catch (e) {
      console.error("TTS Error", e);
      setIsPlayingAudio(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto border-x border-cyan-900/30 bg-slate-900/50 backdrop-blur-sm">
      {/* HUD Header */}
      <div className="flex items-center justify-between p-4 border-b border-cyan-800/50 bg-slate-950/80">
        <h2 className="text-cyan-400 font-sci-fi tracking-widest text-lg">SECURE CHANNEL</h2>
        <div className="flex space-x-2">
            <button 
                onClick={() => setUseSearch(!useSearch)}
                className={`p-2 border ${useSearch ? 'bg-cyan-900/50 border-cyan-400 text-cyan-300' : 'border-slate-700 text-slate-500'} transition-all`}
                title="Enable Google Search"
            >
                <Globe size={18} />
            </button>
            <button 
                onClick={() => setUseThinking(!useThinking)}
                className={`p-2 border ${useThinking ? 'bg-purple-900/50 border-purple-400 text-purple-300' : 'border-slate-700 text-slate-500'} transition-all`}
                title="Enable Deep Thinking"
            >
                <BrainCircuit size={18} />
            </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] ${msg.role === 'user' ? 'bg-cyan-900/20 border-cyan-700/50' : 'bg-slate-800/40 border-slate-700'} border p-4 backdrop-blur-md relative group`}>
                {/* Decorative corners */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-500/50"></div>
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-500/50"></div>

                {/* Header */}
                <div className="flex items-center space-x-2 mb-2 border-b border-white/5 pb-1">
                    <span className={`text-xs font-mono uppercase tracking-widest ${msg.role === 'user' ? 'text-cyan-500' : 'text-orange-400'}`}>
                        {msg.role === 'user' ? 'COMMAND' : 'SYSTEM RESPONSE'}
                    </span>
                    {msg.isThinking && <Cpu size={12} className="text-purple-400 animate-pulse" />}
                </div>
                
                {/* Content */}
                <div className="text-sm md:text-base leading-relaxed text-gray-200 whitespace-pre-wrap font-sans">
                    {msg.content}
                </div>

                {/* Sources */}
                {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-white/10 text-xs font-mono">
                        <div className="text-cyan-600 mb-1">DATA SOURCES:</div>
                        {msg.sources.map((src, i) => (
                            <a key={i} href={src.uri} target="_blank" rel="noreferrer" className="block text-cyan-400 hover:text-cyan-200 truncate underline">
                                [{i+1}] {src.title || src.uri}
                            </a>
                        ))}
                    </div>
                )}
                
                {/* Actions */}
                {msg.role === 'model' && (
                    <div className="absolute -bottom-6 left-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                            onClick={() => playTTS(msg.content)} 
                            disabled={isPlayingAudio}
                            className="text-cyan-500 hover:text-cyan-300 text-xs flex items-center gap-1"
                        >
                            <PlayCircle size={14} /> PLAY AUDIO
                        </button>
                    </div>
                )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
        
        {isLoading && (
            <div className="flex justify-start animate-pulse">
                <div className="bg-slate-800/40 border border-slate-700 p-4 flex items-center space-x-3">
                    <Loader2 className="animate-spin text-cyan-500" size={20} />
                    <span className="text-cyan-500 font-mono text-xs uppercase tracking-widest">
                        {useThinking ? 'Processing deep logic chains...' : 'Analyzing...'}
                    </span>
                </div>
            </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-slate-950 border-t border-cyan-900">
        <div className="flex items-center space-x-2 border border-cyan-800 p-2 bg-slate-900/50">
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Enter Command..."
                className="flex-1 bg-transparent border-none outline-none text-cyan-100 font-mono placeholder-cyan-800/50"
            />
            <button 
                onClick={handleSend}
                disabled={isLoading}
                className="p-2 text-cyan-500 hover:text-cyan-300 disabled:opacity-50"
            >
                <Send size={20} />
            </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;