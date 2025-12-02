import React, { useEffect, useState } from 'react';
import { ChevronRight } from '@/src/components/Icons';
import { APP_CONTENT } from '@/src/services/dataService';
import { FadeIn, GlideText } from '@/src/components/Animators';

const Security: React.FC = () => {
  const [time, setTime] = useState(0);
  const data = APP_CONTENT.security;

  useEffect(() => {
    let animationFrameId: number;
    const animate = () => {
      setTime(t => t + 0.02);
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const TechCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`relative p-2 rounded-2xl border border-dashed border-white/10 bg-white/[0.01] flex flex-col transition-all duration-300 hover:bg-white/[0.03] hover:border-white/20 ${className}`}>
        <div className="absolute -top-[1px] -left-[1px] w-4 h-4 border-t border-l border-white/30 rounded-tl-lg"></div>
        <div className="absolute -top-[1px] -right-[1px] w-4 h-4 border-t border-r border-white/30 rounded-tr-lg"></div>
        <div className="absolute -bottom-[1px] -left-[1px] w-4 h-4 border-b border-l border-white/30 rounded-bl-lg"></div>
        <div className="absolute -bottom-[1px] -right-[1px] w-4 h-4 border-b border-r border-white/30 rounded-br-lg"></div>
        
        <div className="flex-1 w-full bg-[#0c0c0c] rounded-xl border border-white/5 overflow-hidden flex flex-col relative group hover:border-white/10 transition-colors duration-500">
            {children}
        </div>
    </div>
  );

  return (
    <section id="security" className="w-full bg-background pb-24 px-6 md:px-12 flex justify-center flex-col items-center">
      
      <div className="w-full max-w-[1600px] py-24 flex items-center justify-center">
        <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-white/15 to-transparent relative">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-1 bg-background flex items-center justify-center">
                 <div className="w-1.5 h-1.5 rounded-full bg-primary/50 shadow-[0_0_8px_rgba(255,85,0,0.6)]"></div>
            </div>
        </div>
      </div>

      <div className="w-full max-w-[1600px] flex flex-col">
        
        <div className="mb-20 max-w-4xl">
           <FadeIn>
            <div className="flex items-center mb-6">
                <span className="w-2 h-2 rounded-full bg-primary mr-3 shadow-[0_0_8px_rgba(255,85,0,0.6)]"></span>
                <span className="text-xs font-bold tracking-[0.2em] text-gray-400 uppercase">{data.tag}</span>
            </div>
           </FadeIn>
           <h2 className="text-3xl md:text-5xl mb-6 text-white font-medium tracking-tight leading-[1.15] min-h-[1.2em]">
                <GlideText text={data.headline} />
           </h2>
           <FadeIn delay={300}>
                <h4 className="text-muted text-lg font-mono leading-relaxed">{data.subhead}</h4>
           </FadeIn>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Card 1: Security */}
            <FadeIn delay={200} className="h-full">
            <TechCard className="h-full">
                <div className="p-8 md:p-12 relative z-10 flex flex-col h-full">
                    <div className="text-xs font-bold tracking-[0.2em] text-primary uppercase mb-4">{data.features.security.tag}</div>
                    <h3 className="text-3xl text-white font-medium mb-4 tracking-tight leading-tight">{data.features.security.title}</h3>
                    <p className="text-lg text-muted  leading-relaxed mb-8 max-w-lg">
                      {data.features.security.description}
                    </p>
                    <a href={data.features.security.linkUrl} className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-white hover:text-primary transition-colors mt-auto">
                        {data.features.security.linkText} <ChevronRight className="ml-1 w-3 h-3" />
                    </a>
                </div>

                {/* Adjusted padding/transform to prevent cropping */}
                <div className="h-64 w-full flex items-center justify-center relative bg-gradient-to-t from-black/50 to-transparent overflow-visible">
                    <div className="absolute inset-0 opacity-10" 
                        style={{ 
                            backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', 
                            backgroundSize: '20px 20px',
                            maskImage: 'radial-gradient(circle at center, black 40%, transparent 100%)'
                        }}>
                    </div>

                    <div className="relative w-64 h-64 flex items-center justify-center transform scale-90 md:scale-100">
                        <div className="absolute w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center blur-sm animate-pulse"></div>
                        <div className="absolute w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,85,0,0.4)]">
                             <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                             </svg>
                        </div>
                        <div 
                            className="absolute w-32 h-32 border border-primary/30 rounded-full"
                            style={{ transform: `rotate(${time * 20}deg)` }}
                        >
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full"></div>
                        </div>
                        <div 
                            className="absolute w-48 h-48 border border-white/10 rounded-full border-dashed"
                            style={{ transform: `rotate(${-time * 15}deg)` }}
                        >
                             <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-3 h-3 bg-gray-600 rounded-full"></div>
                        </div>
                    </div>
                </div>
            </TechCard>
            </FadeIn>

            {/* Card 2: Enterprise */}
            <FadeIn delay={400} className="h-full">
            <TechCard className="h-full">
                <div className="p-8 md:p-12 relative z-10 flex flex-col h-full">
                    <div className="text-xs font-bold tracking-[0.2em] text-blue-400 uppercase mb-4">{data.features.enterprise.tag}</div>
                    <h3 className="text-3xl text-white font-medium mb-4 tracking-tight leading-tight">{data.features.enterprise.title}</h3>
                    <p className="text-lg text-muted  leading-relaxed mb-8 max-w-lg">
                      {data.features.enterprise.description}
                    </p>
                    <a href={data.features.enterprise.linkUrl} className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-white hover:text-blue-400 transition-colors mt-auto">
                        {data.features.enterprise.linkText} <ChevronRight className="ml-1 w-3 h-3" />
                    </a>
                </div>

                {/* Adjusted scale/padding to fix cropping */}
                <div className="h-64 w-full flex items-center justify-center relative bg-gradient-to-t from-black/50 to-transparent overflow-visible">
                    <div className="relative z-20 flex flex-col items-center justify-center w-20 h-20 bg-blue-500/10 border border-blue-500/50 rounded-xl backdrop-blur-md shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                        <div className="w-8 h-8 border-2 border-blue-500 rounded-md"></div>
                        <span className="text-[8px] font-mono text-blue-400 mt-2 tracking-widest">UPLIFT</span>
                    </div>

                    {/* Scaled down container to keep orbiting elements within bounds */}
                    <div className="absolute w-full h-full flex items-center justify-center transform scale-75 md:scale-100">
                        {[0, 1, 2, 3, 4].map(i => {
                            const angle = (i * (360/5) + time * 10) * (Math.PI / 180);
                            const radius = 100;
                            const x = Math.cos(angle) * radius;
                            const y = Math.sin(angle) * radius;
                            
                            return (
                                <React.Fragment key={i}>
                                    <div 
                                        className="absolute w-10 h-10 bg-[#1a1a1a] border border-white/10 rounded-lg flex items-center justify-center shadow-lg transition-all duration-500"
                                        style={{ 
                                            transform: `translate(${x}px, ${y}px)`,
                                        }}
                                    >
                                        {i === 0 && <div className="w-4 h-4 rounded-full bg-green-500/50"></div>}
                                        {i === 1 && <div className="w-4 h-4 border border-purple-500/50"></div>}
                                        {i === 2 && <div className="w-4 h-4 bg-orange-500/50 rotate-45"></div>}
                                        {i === 3 && <div className="w-4 h-4 border-b-2 border-red-500/50 rounded-full"></div>}
                                        {i === 4 && <div className="w-4 h-1 bg-white/50"></div>}
                                    </div>
                                </React.Fragment>
                            );
                        })}
                        <div className="absolute w-64 h-64 border border-blue-500/5 rounded-full animate-ping opacity-20" style={{ animationDuration: '3s' }}></div>
                    </div>
                </div>
            </TechCard>
            </FadeIn>

        </div>
      </div>
    </section>
  );
};

export default Security;