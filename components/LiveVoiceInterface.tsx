import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { decodeBase64, createPcmBlob, decodeAudioData } from '../services/audioUtils';
import ArcReactor from './ArcReactor';
import { Mic, MicOff, Power, Volume2 } from 'lucide-react';

const API_KEY = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey: API_KEY });

const LiveVoiceInterface: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false); // Model is speaking
  const [error, setError] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string>('');
  
  // Audio Refs
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Visualizer Data
  const [visualizerData, setVisualizerData] = useState<Uint8Array>(new Uint8Array(40).fill(128));

  const connect = async () => {
    try {
      setError(null);
      // Initialize Audio Contexts
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      inputAudioContextRef.current = new AudioContextClass({ sampleRate: 16000 });
      outputAudioContextRef.current = new AudioContextClass({ sampleRate: 24000 });

      // Get Mic Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Connect to Live API
      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          systemInstruction: "You are JARVIS, a highly intelligent, polite, and efficient AI assistant. Keep responses concise and spoken naturally. Address the user as 'Sir' or 'Boss' occasionally.",
          inputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            console.log('Live Session Connected');
            setIsConnected(true);
            setupAudioInput();
          },
          onmessage: handleMessage,
          onclose: () => {
            console.log('Live Session Closed');
            setIsConnected(false);
            stopAudio();
          },
          onerror: (e) => {
            console.error('Live Session Error', e);
            setError("Connection Error");
            setIsConnected(false);
            stopAudio();
          },
        },
      });

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to connect");
    }
  };

  const setupAudioInput = () => {
    if (!inputAudioContextRef.current || !mediaStreamRef.current || !sessionPromiseRef.current) return;

    const source = inputAudioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
    const scriptProcessor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);

    scriptProcessor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      
      // Simple visualizer hook for input (not perfect but reactive)
      const dataForVis = new Uint8Array(inputData.length);
      for(let i=0; i<inputData.length; i++) dataForVis[i] = (inputData[i] * 127) + 128;
      // Sampling for UI (only update occasionally to save render)
      if (Math.random() > 0.8) setVisualizerData(dataForVis.slice(0, 40));

      const pcmBlob = createPcmBlob(inputData);
      
      sessionPromiseRef.current?.then((session: any) => {
        session.sendRealtimeInput({ media: pcmBlob });
      });
    };

    source.connect(scriptProcessor);
    scriptProcessor.connect(inputAudioContextRef.current.destination);
  };

  const handleMessage = async (message: LiveServerMessage) => {
    // Handle Text Transcription
    if (message.serverContent?.modelTurn?.parts?.[0]?.text) {
        // Sometimes text comes separately
    }
    
    if (message.serverContent?.inputTranscription) {
       // User spoke
       // Optional: Display what user said
    }

    // Handle Audio
    const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    if (base64Audio && outputAudioContextRef.current) {
      setIsSpeaking(true);
      
      // Update visualizer for output
      const rawBytes = decodeBase64(base64Audio);
      setVisualizerData(rawBytes.slice(0, 40)); // Just taking a chunk for the visualizer

      const ctx = outputAudioContextRef.current;
      nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
      
      const audioBuffer = await decodeAudioData(rawBytes, ctx, 24000, 1);
      
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      
      source.addEventListener('ended', () => {
        sourcesRef.current.delete(source);
        if (sourcesRef.current.size === 0) setIsSpeaking(false);
      });

      source.start(nextStartTimeRef.current);
      nextStartTimeRef.current += audioBuffer.duration;
      sourcesRef.current.add(source);
    }

    // Handle Interruption
    if (message.serverContent?.interrupted) {
      sourcesRef.current.forEach(src => src.stop());
      sourcesRef.current.clear();
      nextStartTimeRef.current = 0;
      setIsSpeaking(false);
    }
  };

  const stopAudio = () => {
    // Stop tracks
    mediaStreamRef.current?.getTracks().forEach(t => t.stop());
    // Close context
    inputAudioContextRef.current?.close();
    outputAudioContextRef.current?.close();
    // Reset state
    setIsConnected(false);
    setIsSpeaking(false);
  };

  const disconnect = () => {
    if (sessionPromiseRef.current) {
        sessionPromiseRef.current.then((s:any) => s.close());
    }
    stopAudio();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full relative">
      <div className="absolute top-4 left-4 text-cyan-500 font-mono text-xs border border-cyan-900 p-2 glass-panel">
        <div>PROTOCOL: WEBRTC_STREAM</div>
        <div>LATENCY: {isConnected ? 'LOW' : 'N/A'}</div>
        <div>STATUS: {isConnected ? 'CONNECTED' : 'STANDBY'}</div>
      </div>

      <div className="mb-8 relative">
        <ArcReactor isActive={isConnected} isSpeaking={isSpeaking} audioData={visualizerData} />
      </div>

      {error && (
        <div className="text-red-500 mb-4 font-mono bg-red-900/20 p-2 border border-red-500/50">
          ERROR: {error}
        </div>
      )}

      {transcription && (
          <div className="absolute bottom-32 max-w-lg text-center text-cyan-200 opacity-80 font-mono text-sm">
              &gt; {transcription}
          </div>
      )}

      <div className="flex space-x-6 z-10">
        {!isConnected ? (
          <button
            onClick={connect}
            className="flex items-center space-x-2 bg-cyan-950 hover:bg-cyan-900 text-cyan-400 border border-cyan-500 px-8 py-3 rounded-none uppercase font-bold tracking-widest transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)]"
          >
            <Power size={20} />
            <span>Initialize Voice Protocol</span>
          </button>
        ) : (
          <button
            onClick={disconnect}
            className="flex items-center space-x-2 bg-red-950 hover:bg-red-900 text-red-400 border border-red-500 px-8 py-3 rounded-none uppercase font-bold tracking-widest transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)]"
          >
            <MicOff size={20} />
            <span>Terminate Link</span>
          </button>
        )}
      </div>
      
      <div className="absolute bottom-4 right-4 flex items-center space-x-2 text-cyan-700">
         <Volume2 size={16} />
         <span className="font-mono text-xs">AUDIO OUTPUT ACTIVE</span>
      </div>
    </div>
  );
};

export default LiveVoiceInterface;