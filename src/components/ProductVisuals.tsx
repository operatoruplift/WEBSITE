
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
    
    // Handle resizing
    const resize = () => {
        const parent = canvas.parentElement;
        if (parent) {
            canvas.width = parent.offsetWidth;
            canvas.height = parent.offsetHeight;
        }
    };
    window.addEventListener('resize', resize);
    // Call resize immediately to set initial size
    resize();
    
    // Boundary box config
    let width = canvas.width;
    let height = canvas.height;
    let boxSize = Math.min(width, height) * 0.6;
    let boxX = (width - boxSize) / 2;
    let boxY = (height - boxSize) / 2;

    for(let i=0; i<10; i++) {
        particles.push({
            x: boxX + Math.random() * boxSize,
            y: boxY + Math.random() * boxSize,
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3
        });
    }

    const animate = () => {
        // Re-read dims in case of resize during anim
        const w = canvas.width;
        const h = canvas.height;
        const bSize = Math.min(w, h) * 0.6;
        const bX = (w - bSize) / 2;
        const bY = (h - bSize) / 2;

        ctx.clearRect(0, 0, w, h);
        
        // Draw Boundary
        ctx.strokeStyle = '#FF5500';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 5]);
        ctx.strokeRect(bX, bY, bSize, bSize);
        ctx.setLineDash([]);
        
        // Label
        ctx.fillStyle = '#FF5500';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('ISOLATED_PROCESS', w/2, bY - 10);

        // Draw Particles
        ctx.fillStyle = '#fff';
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;

            // Bounce off walls
            if (p.x <= bX + 2 || p.x >= bX + bSize - 2) p.vx *= -1;
            if (p.y <= bY + 2 || p.y >= bY + bSize - 2) p.vy *= -1;

            // Clamp
            p.x = Math.max(bX + 2, Math.min(bX + bSize - 2, p.x));
            p.y = Math.max(bY + 2, Math.min(bY + bSize - 2, p.y));

            ctx.beginPath();
            ctx.arc(p.x, p.y, 2, 0, Math.PI*2);
            ctx.fill();
        });

        // Draw Host (Outside)
        ctx.fillStyle = '#333';
        ctx.font = '12px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('HOST SYSTEM', 20, 30);
        ctx.fillText('SECURE', 20, 50);

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

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveItem(prev => (prev + 1) % 6);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-black/20 overflow-hidden">
        <div className="grid grid-cols-3 gap-2 md:gap-4 w-full max-w-[240px]">
            {[0,1,2,3,4,5].map(i => (
                <div key={i} className={`aspect-square border rounded-lg flex flex-col items-center justify-center transition-all duration-500 relative
                    ${i === activeItem ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(255,85,0,0.3)]' : 'border-white/10 bg-white/5 opacity-50'}`}>
                    <div className="w-4 h-4 md:w-8 md:h-8 rounded bg-white/20 mb-1 md:mb-2"></div>
                    <div className="w-6 md:w-12 h-1 bg-white/20 rounded"></div>
                    
                    {i === activeItem && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[1px] rounded-lg">
                            <div className="text-[8px] font-mono text-primary font-bold">GET</div>
                        </div>
                    )}
                </div>
            ))}
        </div>
        <div className="mt-4 md:mt-8 flex items-center space-x-2 text-[10px] md:text-xs font-mono text-gray-400">
            <GlobeIcon className="w-3 h-3 md:w-4 md:h-4" />
            <span>CONNECTING...</span>
        </div>
    </div>
  );
};

export const RuntimeVisual = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
        setStep(prev => (prev + 1) % 4);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const steps = [
      { label: "SPAWN", status: "OK" },
      { label: "INJECT", status: "OK" },
      { label: "EXECUTE", status: "RUN" },
      { label: "DESTROY", status: "OK" }
  ];

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 md:p-12 overflow-hidden">
        <div className="w-full max-w-[200px] md:max-w-sm space-y-4 md:space-y-6 relative">
            {/* Connecting Line */}
            <div className="absolute left-[11px] md:left-[15px] top-4 bottom-4 w-[2px] bg-white/10 z-0"></div>
            
            {steps.map((s, i) => (
                <div key={i} className={`relative z-10 flex items-center space-x-3 md:space-x-4 transition-all duration-500 ${i <= step ? 'opacity-100' : 'opacity-30'}`}>
                    <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full border-2 flex items-center justify-center transition-colors duration-300 bg-[#0c0c0c]
                        ${i === step ? 'border-primary shadow-[0_0_10px_rgba(255,85,0,0.5)]' : i < step ? 'border-green-500' : 'border-gray-700'}`}>
                        {i < step && <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-500 rounded-full"></div>}
                        {i === step && <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-primary rounded-full animate-ping"></div>}
                    </div>
                    <div className="flex-1 border border-white/10 bg-white/5 rounded p-2 md:p-3 flex justify-between items-center">
                        <span className="font-mono text-xs md:text-sm text-white">{s.label}</span>
                        <span className={`font-mono text-[9px] md:text-[10px] px-1.5 py-0.5 rounded 
                            ${i === step ? 'bg-primary/20 text-primary' : i < step ? 'bg-green-500/20 text-green-400' : 'bg-gray-800 text-gray-500'}`}>
                            {i < step ? 'DONE' : i === step ? s.status : 'WAIT'}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};

export const TokenVisual = () => {
  return (
    <div className="w-full h-full flex items-center justify-center p-4 md:p-8 overflow-hidden">
        <div className="relative w-full max-w-[240px] h-32 flex flex-col items-center justify-center">
            {/* Vault */}
            <div className="w-20 h-20 md:w-24 md:h-24 border-2 border-white/20 rounded-xl flex items-center justify-center relative bg-black z-10">
                <div className="w-12 h-12 md:w-16 md:h-16 border border-dashed border-white/20 rounded-full animate-spin-slow"></div>
                <div className="absolute text-[8px] font-mono text-gray-500 top-2">VAULT</div>
            </div>

            {/* Keys moving */}
            {[0, 1, 2].map(i => (
                <div key={i} className="absolute left-0 flex items-center space-x-2 animate-slide-right" 
                     style={{ 
                         top: `${20 + i * 30}%`, 
                         animationDuration: '3s', 
                         animationDelay: `${i}s`,
                         opacity: 0 
                     }}>
                    <div className="w-12 md:w-16 h-5 md:h-6 bg-primary/20 border border-primary text-primary font-mono text-[9px] md:text-[10px] flex items-center justify-center rounded">
                        KEY_{i}8
                    </div>
                    <div className="w-4 h-[1px] bg-primary"></div>
                </div>
            ))}
        </div>
        <style>{`
            @keyframes slide-right {
                0% { transform: translateX(-20px); opacity: 0; }
                20% { opacity: 1; }
                80% { opacity: 1; }
                100% { transform: translateX(80px); opacity: 0; }
            }
            .animate-slide-right {
                animation-name: slide-right;
                animation-iteration-count: infinite;
                animation-timing-function: linear;
            }
            .animate-spin-slow {
                animation: spin 8s linear infinite;
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
  const [toggle, setToggle] = useState(false);
  useEffect(() => {
      const interval = setInterval(() => setToggle(t => !t), 2000);
      return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full flex items-center justify-center p-4 md:p-8 overflow-hidden">
        <div className="w-full max-w-[240px] md:max-w-xs bg-[#111] border border-white/10 rounded-xl p-4 md:p-6 shadow-2xl">
            <div className="text-[10px] md:text-xs font-bold text-gray-500 mb-4 md:mb-6 uppercase tracking-widest">Access Request</div>
            
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <GlobeIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-xs md:text-sm text-gray-200 font-mono">api.stripe.com</span>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${toggle ? 'bg-green-500' : 'bg-red-500'}`}></div>
                </div>

                <div className="h-[1px] bg-white/10 w-full my-2"></div>

                <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Action</span>
                    <div className={`transition-colors duration-300 text-[10px] md:text-xs font-bold px-2 py-1 rounded ${toggle ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {toggle ? 'ALLOWED' : 'BLOCKED'}
                    </div>
                </div>

                {/* Toggle Animation */}
                <div className="mt-4 flex justify-center">
                    <div className={`w-10 md:w-12 h-5 md:h-6 rounded-full p-1 transition-colors duration-500 ${toggle ? 'bg-primary' : 'bg-gray-700'}`}>
                        <div className={`w-3 h-3 md:w-4 md:h-4 bg-white rounded-full transition-transform duration-500 ${toggle ? 'translate-x-5 md:translate-x-6' : 'translate-x-0'}`}></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};
