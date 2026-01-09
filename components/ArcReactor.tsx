import React, { useEffect, useRef } from 'react';

interface ArcReactorProps {
  isActive: boolean;
  isSpeaking: boolean;
  audioData?: Uint8Array;
}

const ArcReactor: React.FC<ArcReactorProps> = ({ isActive, isSpeaking, audioData }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let rotation = 0;

    const draw = () => {
      if (!ctx) return;
      
      // Clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // Base Glow
      const gradient = ctx.createRadialGradient(centerX, centerY, 50, centerX, centerY, 150);
      gradient.addColorStop(0, isActive ? 'rgba(6, 182, 212, 0.2)' : 'rgba(15, 23, 42, 0.1)');
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Core Ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, 60, 0, Math.PI * 2);
      ctx.strokeStyle = isActive ? '#22d3ee' : '#1e293b';
      ctx.lineWidth = 4;
      ctx.shadowBlur = isActive ? 15 : 0;
      ctx.shadowColor = '#06b6d4';
      ctx.stroke();
      ctx.shadowBlur = 0; // Reset

      // Rotating Segments
      rotation += 0.02;
      const segments = 3;
      for (let i = 0; i < segments; i++) {
        const angle = rotation + (i * (Math.PI * 2) / segments);
        ctx.beginPath();
        ctx.arc(centerX, centerY, 75, angle, angle + 1.5);
        ctx.strokeStyle = isActive ? '#0891b2' : '#334155';
        ctx.lineWidth = 6;
        ctx.stroke();
      }

      // Outer Ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, 90, 0, Math.PI * 2);
      ctx.strokeStyle = isActive ? 'rgba(34, 211, 238, 0.3)' : 'rgba(30, 41, 59, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Audio Visualization
      if (isActive && audioData && isSpeaking) {
         const freqData = audioData; 
         const bars = 40;
         const radius = 100;
         
         ctx.beginPath();
         for (let i = 0; i < bars; i++) {
            // Simulate frequency data usage if real data isn't perfect, 
            // but here we just use the passed array length or random if empty for effect
            // In a real analyser node setup, we'd use getByteFrequencyData
            const value = freqData[i % freqData.length] || 0; 
            // Normalize somewhat if raw PCM (128 is 0)
            const normalized = Math.abs(value - 128) / 128; 
            
            const barHeight = normalized * 50;
            const angle = (i / bars) * Math.PI * 2;
            
            const x1 = centerX + Math.cos(angle) * radius;
            const y1 = centerY + Math.sin(angle) * radius;
            const x2 = centerX + Math.cos(angle) * (radius + barHeight);
            const y2 = centerY + Math.sin(angle) * (radius + barHeight);
            
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
         }
         ctx.strokeStyle = '#67e8f9';
         ctx.lineWidth = 2;
         ctx.stroke();
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(animationId);
  }, [isActive, isSpeaking, audioData]);

  return (
    <div className="relative flex items-center justify-center p-8">
      <canvas 
        ref={canvasRef} 
        width={400} 
        height={400} 
        className="w-full max-w-[300px] h-auto"
      />
      <div className={`absolute text-cyan-400 font-sci-fi text-xl tracking-widest ${isActive ? 'opacity-100' : 'opacity-50'}`}>
        {isActive ? (isSpeaking ? 'SPEAKING' : 'LISTENING') : 'OFFLINE'}
      </div>
    </div>
  );
};

export default ArcReactor;