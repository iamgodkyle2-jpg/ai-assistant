import React, { useState } from 'react';
import { generateFastResponse } from '../services/geminiService';
import { Zap, Activity, ShieldCheck, Database, Server } from 'lucide-react';

const Dashboard: React.FC = () => {
    const [quickQuery, setQuickQuery] = useState('');
    const [quickResponse, setQuickResponse] = useState('');
    const [loading, setLoading] = useState(false);

    const handleFastAction = async () => {
        if(!quickQuery) return;
        setLoading(true);
        try {
            const res = await generateFastResponse(quickQuery);
            setQuickResponse(res || "No response.");
        } catch (e) {
            setQuickResponse("ERR: Processing Failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-full w-full p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto">
            
            {/* System Status Panel */}
            <div className="glass-panel p-6 relative overflow-hidden group">
                <h3 className="text-cyan-400 font-sci-fi text-xl mb-4 flex items-center gap-2">
                    <Activity size={24} /> SYSTEM DIAGNOSTICS
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="border border-cyan-900/50 p-4 bg-slate-900/50">
                        <div className="text-xs text-slate-400 mb-1">CPU LOAD</div>
                        <div className="text-2xl text-cyan-300 font-mono">12%</div>
                        <div className="w-full h-1 bg-slate-800 mt-2">
                            <div className="h-full bg-cyan-500 w-[12%]"></div>
                        </div>
                    </div>
                    <div className="border border-cyan-900/50 p-4 bg-slate-900/50">
                        <div className="text-xs text-slate-400 mb-1">MEMORY</div>
                        <div className="text-2xl text-cyan-300 font-mono">64 TB</div>
                        <div className="w-full h-1 bg-slate-800 mt-2">
                             <div className="h-full bg-cyan-500 w-[45%]"></div>
                        </div>
                    </div>
                    <div className="border border-cyan-900/50 p-4 bg-slate-900/50">
                         <div className="text-xs text-slate-400 mb-1">NETWORK</div>
                         <div className="text-xl text-green-400 font-mono flex items-center gap-2">
                            <ShieldCheck size={16} /> SECURE
                         </div>
                    </div>
                    <div className="border border-cyan-900/50 p-4 bg-slate-900/50">
                         <div className="text-xs text-slate-400 mb-1">MODEL</div>
                         <div className="text-xl text-purple-400 font-mono">GEMINI 3.0</div>
                    </div>
                </div>
                {/* Decorative spinning ring */}
                <div className="absolute -right-10 -bottom-10 w-40 h-40 border-4 border-cyan-900/20 rounded-full animate-spin-slow pointer-events-none"></div>
            </div>

            {/* Fast Response Unit */}
            <div className="glass-panel p-6 flex flex-col">
                 <h3 className="text-yellow-400 font-sci-fi text-xl mb-4 flex items-center gap-2">
                    <Zap size={24} /> FLASH PROCESSING UNIT
                </h3>
                <p className="text-slate-400 text-sm mb-4">
                    Utilizing Gemini 2.5 Flash Lite for ultra-low latency queries.
                </p>
                <div className="flex-1 flex flex-col gap-2">
                    <div className="bg-slate-950 border border-yellow-900/50 p-4 flex-1 overflow-auto font-mono text-yellow-100 text-sm min-h-[100px]">
                        {loading ? <span className="animate-pulse">COMPUTING...</span> : (quickResponse || "WAITING FOR INPUT...")}
                    </div>
                    <div className="flex gap-2 mt-2">
                        <input 
                            className="flex-1 bg-slate-900 border border-slate-700 p-2 text-white font-mono outline-none focus:border-yellow-500" 
                            placeholder="Execute rapid command..."
                            value={quickQuery}
                            onChange={(e) => setQuickQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleFastAction()}
                        />
                        <button 
                            onClick={handleFastAction}
                            className="bg-yellow-900/20 border border-yellow-600 text-yellow-500 p-2 px-4 hover:bg-yellow-900/40 uppercase font-bold text-sm tracking-wider"
                        >
                            EXEC
                        </button>
                    </div>
                </div>
            </div>

            {/* Static Data Visuals */}
            <div className="glass-panel p-6 col-span-1 md:col-span-2">
                <h3 className="text-slate-400 font-sci-fi text-lg mb-4 flex items-center gap-2">
                    <Database size={20} /> DATA STREAMS
                </h3>
                <div className="flex items-end justify-between space-x-1 h-32 opacity-70">
                    {[...Array(20)].map((_, i) => (
                        <div 
                            key={i} 
                            className="w-full bg-cyan-900/40 hover:bg-cyan-500/60 transition-all duration-500"
                            style={{ height: `${Math.random() * 100}%` }}
                        ></div>
                    ))}
                </div>
            </div>

        </div>
    );
}

export default Dashboard;