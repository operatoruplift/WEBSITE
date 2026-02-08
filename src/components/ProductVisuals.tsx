import React, { useEffect, useRef, useState } from 'react';
import { GlobeIcon } from './Icons';

export const SandboxVisual = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animationFrameId: number;
    let particles: {x: number, y: number, vx: number, vy: number}[] = [];
    
    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.offsetWidth;
        canvas.height = parent.offsetHeight;
      }
    };
    window.addEventListener('resize', resize);
    resize();
    
    let width = canvas.width;
    let height = canvas.height;
    let boxSize = Math.min(width, height) * 0.7;
    let boxX = (width - boxSize) / 2;
    let boxY = (height - boxSize) / 2;
    
    for(let i=0; i<15; i++) {
      particles.push({
        x: boxX + Math.random() * boxSize,
        y: boxY + Math.random() * boxSize,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2
      });
    }

    const animate = () => {
      const w = canvas.width;
      const h = canvas.height;
      const bSize = Math.min(w, h) * 0.7;
      const bX = (w - bSize) / 2;
      const bY = (h - bSize) / 2;
      ctx.clearRect(0, 0, w, h);
      
      ctx.strokeStyle = '#E77630';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 4]);
      ctx.strokeRect(bX, bY, bSize, bSize);
      ctx.setLineDash([]);
      
      ctx.fillStyle = '#E77630';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('ISOLATED_PROCESS', w/2, bY - 10);

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x <= bX + 2 || p.x >= bX + bSize - 2) p.vx *= -1;
        if (p.y <= bY + 2 || p.y >= bY + bSize - 2) p.vy *= -1;
        p.x = Math.max(bX + 2, Math.min(bX + bSize - 2, p.x));
        p.y = Math.max(bY + 2, Math.min(bY + bSize - 2, p.y));
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI*2);
        ctx.fill();
      });

      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('HOST_SECURE', 15, 25);
      
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);
  
  return <canvas ref={canvasRef} className="w-full h-full block" />;
};

export const StoreVisual = () => {
  const [activeItem, setActiveItem] = useState(0);
  const [completed, setCompleted] = useState(false);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveItem(prev => {
        if (prev >= 5) {
          setCompleted(true);
          clearInterval(interval);
          return 5;
        }
        return prev + 1;
      });
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-black/20">
      <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
        {[0,1,2,3,4,5].map(i => (
          <div key={i} className={`aspect-square border rounded-lg flex flex-col items-center justify-center transition-all duration-500 relative
            ${i === activeItem ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(255,85,0,0.3)]' : 
              i < activeItem ? 'border-primary/40 bg-primary/5 opacity-80' : 'border-white/10 bg-white/5 opacity-40'}`}>
            <div className={`w-6 h-6 rounded bg-white/20 mb-2 ${i <= activeItem ? 'opacity-100' : 'opacity-40'}`}></div>
            <div className={`w-10 h-1 bg-white/20 rounded ${i <= activeItem ? 'opacity-100' : 'opacity-40'}`}></div>
            
            {i === activeItem && !completed && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[1px] rounded-lg">
                <div className="text-[8px] font-mono text-primary font-bold animate-pulse">GET</div>
              </div>
            )}
            {i <= activeItem && (i < activeItem || completed) && (
              <div className="absolute top-1 right-1">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-8 flex items-center space-x-2 text-[10px] font-mono text-gray-400">
        <GlobeIcon className={`w-4 h-4 ${completed ? 'text-primary' : 'animate-spin'}`} />
        <span>{completed ? 'STORE_SYNC_COMPLETE' : 'FETCHING_AGENTS...'}</span>
      </div>
    </div>
  );
};

export const RuntimeVisual = () => {
  const [step, setStep] = useState(0);
  const [completed, setCompleted] = useState(false);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setStep(prev => {
        if (prev >= 3) {
          setCompleted(true);
          clearInterval(interval);
          return 3;
        }
        return prev + 1;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const steps = [
    { label: "SPAWN", status: "OK" },
    { label: "INJECT", status: "OK" },
    { label: "EXECUTE", status: "RUN" },
    { label: "CLEANUP", status: "OK" }
  ];

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-[240px] space-y-5 relative">
        <div className="absolute left-[15px] top-4 bottom-4 w-[2px] bg-white/10 z-0"></div>
        
        {steps.map((s, i) => (
          <div key={i} className={`relative z-10 flex items-center space-x-4 transition-all duration-500 ${i <= step ? 'opacity-100' : 'opacity-20'}`}>
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors duration-300 bg-[#0c0c0c]
              ${i === step && !completed ? 'border-primary shadow-[0_0_10px_rgba(255,85,0,0.5)]' : i < step || completed ? 'border-green-500' : 'border-gray-700'}`}>
              {(i < step || (i === step && completed)) && <div className="w-2 h-2 bg-green-500 rounded-full"></div>}
              {i === step && !completed && <div className="w-2 h-2 bg-primary rounded-full animate-ping"></div>}
            </div>
            <div className={`flex-1 border rounded p-3 flex justify-between items-center transition-all ${i === step ? 'border-white/20 bg-white/10' : 'border-white/5 bg-white/5'}`}>
              <span className="font-mono text-xs text-white">{s.label}</span>
              <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded 
                ${i === step && !completed ? 'bg-primary/20 text-primary' : i < step || completed ? 'bg-green-500/20 text-green-400' : 'bg-gray-800 text-gray-500'}`}>
                {i < step || (i === step && completed) ? 'DONE' : i === step ? s.status : 'WAIT'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const TokenVisual = () => {
  const [completed, setCompleted] = useState(false);
  const [keys, setKeys] = useState([0, 1, 2]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCompleted(true);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-full h-full flex items-center justify-center p-6">
      <div className="relative w-full max-w-[280px] h-40 flex flex-col items-center justify-center">
        <div className="w-24 h-24 border-2 border-white/20 rounded-2xl flex items-center justify-center relative bg-black/40 z-10 backdrop-blur-sm">
          <div className={`w-16 h-16 border border-dashed border-primary/40 rounded-full ${!completed ? 'animate-spin-slow' : ''}`}></div>
          <div className="absolute text-[10px] font-mono text-primary/70 top-3 tracking-widest">VAULT</div>
          {completed && <div className="absolute inset-0 flex items-center justify-center text-primary font-mono text-xs">LOCKED</div>}
        </div>

        {!completed && keys.map(i => (
          <div key={i} className="absolute left-0 flex items-center space-x-2 animate-access-key" 
            style={{ 
              top: `${25 + i * 25}%`, 
              animationDelay: `${i * 0.8}s`,
            }}>
            <div className="w-20 h-7 bg-primary/20 border border-primary/60 text-primary font-mono text-[10px] flex items-center justify-center rounded shadow-lg shadow-primary/10">
              SECRET_{i}X9
            </div>
            <div className="w-6 h-[1px] bg-primary/40"></div>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes access-key {
          0% { transform: translateX(-40px); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateX(100px); opacity: 0; }
        }
        .animate-access-key {
          animation: access-key 2.5s ease-in-out forwards;
        }
        .animate-spin-slow {
          animation: spin 6s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export const PermissionsVisual = () => {
  const [status, setStatus] = useState('PENDING');
  
  useEffect(() => {
    const timer1 = setTimeout(() => setStatus('REQUESTING'), 1000);
    const timer2 = setTimeout(() => setStatus('ALLOWED'), 3000);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <div className="w-full h-full flex items-center justify-center p-6">
      <div className="w-full max-w-[280px] bg-[#0c0c0c] border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent"></div>
        <div className="text-[10px] font-bold text-gray-500 mb-6 uppercase tracking-widest flex justify-between">
          <span>Security_Protocol</span>
          <span className="text-primary/60">v1.0.4</span>
        </div>
        
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center">
                <GlobeIcon className="w-4 h-4 text-gray-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-200 font-mono">api.stripe.com</span>
                <span className="text-[9px] text-gray-500 font-mono">Outbound_Request</span>
              </div>
            </div>
            <div className={`w-2 h-2 rounded-full ${status === 'ALLOWED' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : status === 'PENDING' ? 'bg-gray-600' : 'bg-primary animate-pulse'}`}></div>
          </div>
          
          <div className="h-[1px] bg-white/5 w-full"></div>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 font-mono">ACCESS_LEVEL</span>
            <div className={`transition-all duration-500 text-[10px] font-bold px-3 py-1 rounded border ${
              status === 'ALLOWED' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
              status === 'REQUESTING' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-gray-800 text-gray-500 border-transparent'}`}>
              {status}
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <div className={`w-14 h-7 rounded-full p-1 transition-colors duration-700 relative ${status === 'ALLOWED' ? 'bg-primary' : 'bg-gray-800'}`}>
              <div className={`w-5 h-5 bg-white rounded-full shadow-lg transition-transform duration-700 ${status === 'ALLOWED' ? 'translate-x-7' : 'translate-x-0'}`}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
