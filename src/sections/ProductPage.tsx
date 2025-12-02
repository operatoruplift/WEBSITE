
import React, { useEffect, useRef, useState } from 'react';
import { TerminalIcon, GlobeIcon, KanbanIcon, MessageIcon, CheckIcon, ArrowUpRightIcon } from '@/src/components/Icons';

// --- Visual Components ---

const SandboxVisual = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: {x: number, y: number, vx: number, vy: number}[] = [];
    const width = canvas.width = canvas.offsetWidth;
    const height = canvas.height = canvas.offsetHeight;
    
    // Boundary box
    const boxSize = 200;
    const boxX = (width - boxSize) / 2;
    const boxY = (height - boxSize) / 2;

    for(let i=0; i<15; i++) {
        particles.push({
            x: boxX + Math.random() * boxSize,
            y: boxY + Math.random() * boxSize,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4
        });
    }

    const animate = () => {
        ctx.clearRect(0, 0, width, height);
        
        // Draw Boundary
        ctx.strokeStyle = '#FF5500';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 5]);
        ctx.strokeRect(boxX, boxY, boxSize, boxSize);
        ctx.setLineDash([]);
        
        // Label
        ctx.fillStyle = '#FF5500';
        ctx.font = '10px monospace';
        ctx.fillText('ISOLATED_PROCESS_ID_99', boxX, boxY - 10);

        // Draw Particles
        ctx.fillStyle = '#fff';
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;

            // Bounce off walls
            if (p.x <= boxX + 2 || p.x >= boxX + boxSize - 2) p.vx *= -1;
            if (p.y <= boxY + 2 || p.y >= boxY + boxSize - 2) p.vy *= -1;

            // Clamp
            p.x = Math.max(boxX + 2, Math.min(boxX + boxSize - 2, p.x));
            p.y = Math.max(boxY + 2, Math.min(boxY + boxSize - 2, p.y));

            ctx.beginPath();
            ctx.arc(p.x, p.y, 2, 0, Math.PI*2);
            ctx.fill();
        });

        // Draw Host (Outside)
        ctx.fillStyle = '#333';
        ctx.font = '12px monospace';
        ctx.fillText('HOST SYSTEM', 20, 30);
        ctx.fillText('UNTOUCHED', 20, 50);

        requestAnimationFrame(animate);
    };
    animate();
  }, []);

  return <canvas ref={canvasRef} className="w-full h-full" />;
};

const StoreVisual = () => {
  const [activeItem, setActiveItem] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveItem(prev => (prev + 1) % 6);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-black/20">
        <div className="grid grid-cols-3 gap-4 w-full max-w-sm">
            {[0,1,2,3,4,5].map(i => (
                <div key={i} className={`aspect-square border rounded-lg flex flex-col items-center justify-center transition-all duration-500 relative
                    ${i === activeItem ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(255,85,0,0.3)]' : 'border-white/10 bg-white/5 opacity-50'}`}>
                    <div className="w-8 h-8 rounded bg-white/20 mb-2"></div>
                    <div className="w-12 h-1 bg-white/20 rounded"></div>
                    
                    {i === activeItem && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[1px] rounded-lg">
                            <div className="text-[8px] font-mono text-primary font-bold">INSTALLING</div>
                        </div>
                    )}
                </div>
            ))}
        </div>
        <div className="mt-8 flex items-center space-x-2 text-xs font-mono text-gray-400">
            <GlobeIcon className="w-4 h-4" />
            <span>CONNECTING TO REGISTRY...</span>
        </div>
    </div>
  );
};

const RuntimeVisual = () => {
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
      { label: "EXECUTE", status: "RUNNING" },
      { label: "DESTROY", status: "CLEAN" }
  ];

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-12">
        <div className="w-full max-w-sm space-y-6 relative">
            {/* Connecting Line */}
            <div className="absolute left-[15px] top-4 bottom-4 w-[2px] bg-white/10 z-0"></div>
            
            {steps.map((s, i) => (
                <div key={i} className={`relative z-10 flex items-center space-x-4 transition-all duration-500 ${i <= step ? 'opacity-100' : 'opacity-30'}`}>
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors duration-300 bg-[#0c0c0c]
                        ${i === step ? 'border-primary shadow-[0_0_10px_rgba(255,85,0,0.5)]' : i < step ? 'border-green-500' : 'border-gray-700'}`}>
                        {i < step && <div className="w-2 h-2 bg-green-500 rounded-full"></div>}
                        {i === step && <div className="w-2 h-2 bg-primary rounded-full animate-ping"></div>}
                    </div>
                    <div className="flex-1 border border-white/10 bg-white/5 rounded p-3 flex justify-between items-center">
                        <span className="font-mono text-sm text-white">{s.label}</span>
                        <span className={`font-mono text-[10px] px-2 py-0.5 rounded 
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

const TokenVisual = () => {
  return (
    <div className="w-full h-full flex items-center justify-center p-8 overflow-hidden">
        <div className="relative w-64 h-32 flex flex-col items-center justify-center">
            {/* Vault */}
            <div className="w-24 h-24 border-2 border-white/20 rounded-xl flex items-center justify-center relative bg-black z-10">
                <div className="w-16 h-16 border border-dashed border-white/20 rounded-full animate-spin-slow"></div>
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
                    <div className="w-16 h-6 bg-primary/20 border border-primary text-primary font-mono text-[10px] flex items-center justify-center rounded">
                        KEY_{i}8F
                    </div>
                    <div className="w-4 h-[1px] bg-primary"></div>
                </div>
            ))}
        </div>
        <style>{`
            @keyframes slide-right {
                0% { transform: translateX(-50px); opacity: 0; }
                20% { opacity: 1; }
                80% { opacity: 1; }
                100% { transform: translateX(100px); opacity: 0; }
            }
        `}</style>
    </div>
  );
};

const PermissionsVisual = () => {
  const [toggle, setToggle] = useState(false);
  useEffect(() => {
      const interval = setInterval(() => setToggle(t => !t), 2000);
      return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full flex items-center justify-center p-8">
        <div className="w-full max-w-xs bg-[#111] border border-white/10 rounded-xl p-6 shadow-2xl">
            <div className="text-xs font-bold text-gray-500 mb-6 uppercase tracking-widest">Access Request</div>
            
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <GlobeIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-200 font-mono">api.stripe.com</span>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${toggle ? 'bg-green-500' : 'bg-red-500'}`}></div>
                </div>

                <div className="h-[1px] bg-white/10 w-full my-2"></div>

                <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Action</span>
                    <div className={`transition-colors duration-300 text-xs font-bold px-2 py-1 rounded ${toggle ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {toggle ? 'ALLOWED' : 'BLOCKED'}
                    </div>
                </div>

                {/* Toggle Animation */}
                <div className="mt-4 flex justify-center">
                    <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-500 ${toggle ? 'bg-primary' : 'bg-gray-700'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-500 ${toggle ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

const ProductPage: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const features = [
    {
      title: "Isolated Environment",
      description: "Every agent runs in a distinct, sandboxed process using lightweight virtualization. Code execution in one agent cannot affect the host system or other agents, providing enterprise-grade security by default.",
      details: ["Kernel-level isolation", "Ephemeral file systems", "Resource quotas (CPU/RAM)"],
      visual: <SandboxVisual />
    },
    {
      title: "Agent Store",
      description: "A centralized registry for discovering and deploying verified agents. Support for private internal registries allows enterprises to share proprietary agents securely across teams.",
      details: ["Version control", "Cryptographic signing", "Dependency management"],
      visual: <StoreVisual />
    },
    {
      title: "Session Runtime",
      description: "Agents are instantiated on-demand for specific tasks. The runtime manages the lifecycle: spawning, context injection, execution, and tear-down. This ensures no residual state is left behind.",
      details: ["Sub-millisecond startup", "Context injection API", "Automatic cleanup"],
      visual: <RuntimeVisual />
    },
    {
      title: "Session Tokens",
      description: "Security is handled via short-lived, cryptographically secure tokens. These tokens grant specific, granular permissions to the Agentic Vault for the duration of a session only.",
      details: ["Time-bound access", "Scope-limited", "Audit logging"],
      visual: <TokenVisual />
    },
    {
      title: "Permission Actions",
      description: "A human-in-the-loop permission system that acts as a firewall for agent actions. Define policies for network access, file system reads/writes, and API calls.",
      details: ["Policy-as-code", "Real-time prompting", "Allow/Block lists"],
      visual: <PermissionsVisual />
    }
  ];

  return (
    <div className="w-full min-h-screen bg-background pt-32 pb-24 px-6 md:px-12 flex flex-col items-center">
      
      {/* Header */}
      <div className="w-full max-w-[1200px] mb-24 text-center">
         <div className="flex items-center justify-center mb-6">
            <span className="w-2 h-2 rounded-full bg-primary mr-3 shadow-[0_0_8px_rgba(255,85,0,0.6)]"></span>
            <span className="text-xs font-bold tracking-[0.2em] text-gray-400 uppercase">PRODUCT DEEP DIVE</span>
         </div>
         <h1 className="text-5xl md:text-7xl text-white font-medium tracking-tight mb-8">
            The Agentic Runtime
         </h1>
         <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            A comprehensive look at the architecture powering the next generation of autonomous software development.
         </p>
      </div>

      {/* Feature Sections */}
      <div className="w-full max-w-[1200px] space-y-32">
         {features.map((feature, idx) => (
            <div key={idx} className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center group">
               
               {/* Visual Column */}
               <div className={`w-full ${idx % 2 === 1 ? 'lg:order-2' : 'lg:order-1'}`}>
                  {/* Technical Container for Visual */}
                  <div className="relative p-2 rounded-2xl border border-dashed border-white/10 bg-white/[0.01]">
                        <div className="absolute -top-[1px] -left-[1px] w-4 h-4 border-t border-l border-white/30 rounded-tl-lg"></div>
                        <div className="absolute -top-[1px] -right-[1px] w-4 h-4 border-t border-r border-white/30 rounded-tr-lg"></div>
                        <div className="absolute -bottom-[1px] -left-[1px] w-4 h-4 border-b border-l border-white/30 rounded-bl-lg"></div>
                        <div className="absolute -bottom-[1px] -right-[1px] w-4 h-4 border-b border-r border-white/30 rounded-br-lg"></div>
                        
                        <div className="w-full aspect-[4/3] bg-[#0c0c0c] rounded-xl border border-white/5 overflow-hidden relative shadow-2xl">
                           <div className="absolute inset-0 opacity-10 pointer-events-none" 
                                style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                           </div>
                           {feature.visual}
                        </div>
                  </div>
               </div>

               {/* Text Column */}
               <div className={`flex flex-col ${idx % 2 === 1 ? 'lg:order-1 lg:items-end lg:text-right' : 'lg:order-2 lg:items-start lg:text-left'}`}>
                  <div className="flex items-center space-x-3 mb-6">
                      <span className="text-primary font-mono text-sm">0{idx + 1}</span>
                      <div className="h-[1px] w-12 bg-primary/30"></div>
                  </div>
                  <h3 className="text-3xl md:text-4xl text-white font-medium mb-6 tracking-tight">{feature.title}</h3>
                  <p className="text-lg text-gray-400 leading-relaxed mb-8 max-w-lg">{feature.description}</p>
                  
                  <div className={`border-t border-white/5 pt-6 w-full max-w-lg ${idx % 2 === 1 ? 'flex flex-col items-end' : ''}`}>
                      <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Technical Specs</div>
                      <ul className={`space-y-3 ${idx % 2 === 1 ? 'items-end' : ''}`}>
                        {feature.details.map((detail, i) => (
                            <li key={i} className={`flex items-center text-sm text-gray-300 font-mono ${idx % 2 === 1 ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-1.5 h-1.5 rounded-full bg-primary/50 ${idx % 2 === 1 ? 'ml-3' : 'mr-3'}`}></div>
                                {detail}
                            </li>
                        ))}
                      </ul>
                  </div>
               </div>

            </div>
         ))}
      </div>

      {/* Footer CTA */}
      <div className="w-full max-w-[1200px] mt-32 text-center border-t border-white/5 pt-24">
         <h2 className="text-3xl text-white mb-8">Ready to start building?</h2>
         <a 
           href="https://docs.operatoruplift.com" 
           target="_blank" 
           rel="noreferrer"
           className="inline-flex items-center bg-white text-black px-8 py-4 rounded-sm text-sm font-bold tracking-widest uppercase hover:bg-gray-200 transition-colors group"
         >
            Read the Documentation <ArrowUpRightIcon className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
         </a>
      </div>

    </div>
  );
};

export default ProductPage;
