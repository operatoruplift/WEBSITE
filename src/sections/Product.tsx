import React, { useEffect, useRef, useState } from 'react';
import { TerminalIcon, GlobeIcon, ChevronRight, MessageIcon, KanbanIcon, CheckIcon } from '@/src/components/Icons';
import { APP_CONTENT } from '@/src/services/dataService';
import { SandboxVisual, StoreVisual, RuntimeVisual, TokenVisual, PermissionsVisual } from '@/src/components/ProductVisuals';
import { FadeIn, GlideText } from '@/src/components/Animators';

const Product: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [animStep, setAnimStep] = useState(0);
  const [isInView, setIsInView] = useState(false);
  const CYCLE_MS = 10000; // 10 seconds per feature

  const data = APP_CONTENT.product;
  const features = data.features;

  // Map string icon types to components
  const getIcon = (type: string) => {
    switch (type) {
      case 'kanban': return <KanbanIcon className="w-5 h-5" />;
      case 'globe': return <GlobeIcon className="w-5 h-5" />;
      case 'terminal': return <TerminalIcon className="w-5 h-5" />;
      case 'message': return <MessageIcon className="w-5 h-5" />;
      case 'check': return <CheckIcon className="w-5 h-5" />;
      default: return <KanbanIcon className="w-5 h-5" />;
    }
  };

  // Track when section is in view
  useEffect(() => {
    if (!sectionRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Auto-advance on a fixed timer when in view
  useEffect(() => {
    if (!isInView) return;
    const timer = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % features.length);
      setAnimStep(0);
    }, CYCLE_MS);
    return () => clearInterval(timer);
  }, [isInView, features.length]);

  // Scroll wheel advances features when section is in view (desktop only)
  // Uses a ref for activeIndex so the non-passive wheel handler always has current state
  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.innerWidth < 1024) return;
    let lastWheelTime = 0;
    const WHEEL_COOLDOWN = 600;

    const handleWheel = (e: WheelEvent) => {
      const section = sectionRef.current;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      // Only intercept when section is mostly in view
      if (rect.top > window.innerHeight * 0.3 || rect.bottom < window.innerHeight * 0.5) return;

      const now = Date.now();
      if (Math.abs(e.deltaY) < 20) return;

      const idx = activeIndexRef.current;
      // At first feature scrolling up, or last feature scrolling down — let page scroll
      if (e.deltaY < 0 && idx === 0) return;
      if (e.deltaY > 0 && idx === features.length - 1) return;

      // Prevent page scroll — we handle it
      e.preventDefault();

      if (now - lastWheelTime < WHEEL_COOLDOWN) return;
      lastWheelTime = now;

      if (e.deltaY > 0) {
        setActiveIndex(prev => Math.min(features.length - 1, prev + 1));
      } else {
        setActiveIndex(prev => Math.max(0, prev - 1));
      }
      setAnimStep(0);
    };

    // Must be non-passive to allow preventDefault
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [features.length]);

  const scrollToFeature = (index: number) => {
    setActiveIndex(index);
    setAnimStep(0);
  };

  const renderVisual = (index: number) => {
      switch(index) {
          case 0: return <SandboxVisual />;
          case 1: return <StoreVisual />;
          case 2: return <RuntimeVisual />;
          case 3: return <TokenVisual />;
          case 4: return <PermissionsVisual />;
          default: return <SandboxVisual />;
      }
  };

  // Reusable Technical Border Wrapper
  const TechBorderContainer = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <div className={`rounded-2xl border border-dashed border-white/20 p-2 relative bg-background/50 backdrop-blur-sm ${className}`}>
        <div className="absolute -top-[1px] -left-[1px] w-4 h-4 border-t border-l border-white/40 rounded-tl-lg"></div>
        <div className="absolute -top-[1px] -right-[1px] w-4 h-4 border-t border-r border-white/40 rounded-tr-lg"></div>
        <div className="absolute -bottom-[1px] -left-[1px] w-4 h-4 border-b border-l border-white/40 rounded-bl-lg"></div>
        <div className="absolute -bottom-[1px] -right-[1px] w-4 h-4 border-b border-r border-white/40 rounded-br-lg"></div>
        {children}
    </div>
  );

  return (
    <div
      id="product"
      ref={sectionRef}
      className="relative bg-slanted-lines w-full lg:min-h-[500vh] min-h-screen"
      style={{ backgroundColor: '#050505' }}
    >

      {/* --- DESKTOP VIEW --- */}
      <div className="hidden lg:flex lg:sticky lg:top-0 h-screen w-full items-center">
        <div className="max-w-[1600px] mx-auto px-6 md:px-12 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 relative">

          {/* Left Side: Content & Navigation */}
          <div className="lg:col-span-5 flex flex-col relative z-10">

            {/* Top: Headline */}
            <div className="mt-8 md:mt-16">
              <FadeIn direction="right">
                <div className="flex items-center mb-4">
                    <span className="w-2 h-2 rounded-full bg-primary mr-3 shadow-[0_0_8px_rgba(255,85,0,0.8)]"></span>
                    <span className="text-xs font-bold tracking-[0.2em] text-white uppercase">{data.tag}</span>
                </div>
              </FadeIn>
              <h2 className="text-4xl md:text-5xl lg:text-6xl text-white tracking-tight mb-6 leading-tight font-medium min-h-[1.2em]">
                 <GlideText text={data.headline} />
              </h2>
              <FadeIn delay={200}>
                <p className="text-muted text-lg font-mono leading-relaxed max-w-md">
                    {data.subhead}
                </p>
              </FadeIn>
            </div>

            {/* Bottom: Progress Navigation List */}
            <div className="mt-auto mb-12 lg:mb-24 relative pl-4 pt-8">
              <div className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-white/10 z-0 rounded-full"></div>
              <div
                className="absolute left-[7px] top-2 w-[2px] bg-primary z-0 rounded-full transition-all duration-500 ease-out"
                style={{ height: `${(activeIndex / (features.length - 1)) * 100}%` }}
              ></div>

              <div className="flex flex-col space-y-5">
                {features.map((feature, index) => {
                  const isActive = index === activeIndex;
                  const isPast = index <= activeIndex;
                  return (
                    <button
                      key={feature.id}
                      onClick={() => scrollToFeature(index)}
                      className={`group flex items-center text-left relative z-10 transition-all duration-300 ${isActive ? 'translate-x-2' : ''}`}
                    >
                      <div className={`relative flex items-center justify-center w-4 h-4 mr-4 transition-all duration-300`}>
                        <div className={`w-2 h-2 rounded-full transition-all duration-300 ${isActive
                            ? 'bg-primary shadow-[0_0_10px_rgba(255,85,0,0.8)] scale-125'
                            : isPast
                              ? 'bg-primary'
                              : 'bg-gray-700 group-hover:bg-gray-500'
                          }`}></div>
                      </div>
                      <div className="flex items-baseline space-x-2">
                        <span className={`font-mono text-[10px] transition-colors ${isActive ? 'text-primary' : 'text-gray-600'}`}>
                          0{index + 1}
                        </span>
                        <span className={`text-xs font-bold tracking-widest uppercase transition-colors ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'}`}>
                          {feature.navTitle}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Side: Stacked (Animation on top, Description below) */}
          <div className="lg:col-span-7 flex flex-col gap-4 relative">

             {/* Box 1: Animation Visual */}
             <div className="w-full">
                <TechBorderContainer className="h-[340px]">
                    <div className="w-full h-full bg-[#080808] rounded-xl border border-white/5 relative overflow-hidden shadow-2xl flex flex-col">
                      <div className="h-10 md:h-12 border-b border-white/5 flex items-center justify-between px-4 md:px-6 z-20 bg-[#080808]/80 backdrop-blur-md">
                        <div className="flex space-x-2">
                          <div className="w-3 h-3 rounded-full bg-white/10"></div>
                          <div className="w-3 h-3 rounded-full bg-white/10"></div>
                        </div>
                        <div className="text-xs font-mono text-primary/70 tracking-widest uppercase border-l border-white/10 pl-4">
                            {features[activeIndex].id}.mod
                        </div>
                      </div>

                      <div className="flex-1 relative flex items-center justify-center p-0 overflow-hidden">
                        <div className="absolute inset-0 opacity-10"
                          style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
                        </div>

                        {/* Only mount the active visual — remounts on index change to restart animation */}
                        <div key={`visual-${activeIndex}`} className="absolute inset-0 flex items-center justify-center animate-fade-in">
                          {renderVisual(activeIndex)}
                        </div>
                      </div>
                    </div>
                </TechBorderContainer>
             </div>

             {/* Box 2: Text Description */}
             <div className="w-full">
                <TechBorderContainer>
                    <div className="w-full bg-[#080808] rounded-xl border border-white/5 p-4 md:p-5 shadow-2xl relative">
                       <div key={activeIndex} className="animate-slide-up">
                          <div className="mb-3 opacity-70 text-primary">
                              {getIcon(features[activeIndex].iconType)}
                          </div>
                          <h3 className="text-lg md:text-xl text-white font-medium mb-2 tracking-tight leading-tight">
                            {features[activeIndex].cardTitle}
                          </h3>
                          <p className="text-sm text-gray-300 leading-relaxed mb-3 line-clamp-3">
                            {features[activeIndex].description}
                          </p>
                          <a href="/product" className="bg-white text-black px-5 py-2.5 rounded-sm text-xs font-bold tracking-widest uppercase transition-all hover:bg-gray-200 flex items-center w-fit group">
                            <span>Explore</span>
                            <ChevronRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                          </a>
                        </div>
                    </div>
                </TechBorderContainer>
             </div>

          </div>
        </div>
      </div>

      {/* --- MOBILE VIEW (Stacked Vertical List) --- */}
      <div className="lg:hidden w-full px-6 py-24 flex flex-col">
        {/* Header */}
        <div className="mb-16 w-full">
           <FadeIn>
            <div className="flex items-center mb-4">
                <span className="w-2 h-2 rounded-full bg-primary mr-3 shadow-[0_0_8px_rgba(255,85,0,0.8)]"></span>
                <span className="text-xs font-bold tracking-[0.2em] text-white uppercase">{data.tag}</span>
            </div>
            <h2 className="text-4xl text-white tracking-tight mb-4 leading-tight font-medium">
                {data.headline}
            </h2>
            <p className="text-muted text-lg font-mono leading-relaxed">
                {data.subhead}
            </p>
           </FadeIn>
        </div>

        {/* Feature List */}
        <div className="flex flex-col space-y-16 w-full">
            {features.map((feature, index) => (
                <FadeIn key={feature.id} delay={index * 100}>
                    <div className="flex flex-col space-y-6">
                        {/* Text Container */}
                        <TechBorderContainer>
                            <div className="w-full bg-[#080808] rounded-xl border border-white/5 p-6 shadow-2xl relative">
                                <div className="mb-4 opacity-70 text-primary">
                                    {getIcon(feature.iconType)}
                                </div>
                                <h3 className="text-2xl text-white font-medium mb-3 tracking-tight">
                                    {feature.cardTitle}
                                </h3>
                                <p className="text-base text-gray-300 leading-relaxed">
                                    {feature.description}
                                </p>
                                
                                {/* Mobile Explore Button on last item */}
                                {index === features.length - 1 && (
                                    <a 
                                    href="/product"
                                    className="mt-6 bg-white text-black px-6 py-3 rounded-sm text-xs font-bold tracking-widest uppercase transition-all hover:bg-gray-200 flex items-center w-fit group"
                                >
                                    <span>Explore</span>
                                    <ChevronRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                                </a>
                                )}
                            </div>
                        </TechBorderContainer>

                        {/* Visual Container */}
                        <TechBorderContainer className="h-[450px]">
                            <div className="w-full h-full bg-[#080808] rounded-xl border border-white/5 relative overflow-hidden shadow-2xl flex flex-col">
                                <div className="h-10 border-b border-white/5 flex items-center justify-between px-4 z-20 bg-[#080808]/80 backdrop-blur-md">
                                    <div className="flex space-x-2">
                                        <div className="w-2 h-2 rounded-full bg-white/10"></div>
                                        <div className="w-2 h-2 rounded-full bg-white/10"></div>
                                    </div>
                                    <div className="text-[10px] font-mono text-primary/70 tracking-widest uppercase border-l border-white/10 pl-4">
                                        {feature.id}.mod
                                    </div>
                                </div>
                                <div className="flex-1 relative flex items-center justify-center overflow-hidden">
                                    <div className="absolute inset-0 opacity-10"
                                        style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
                                    </div>
                                    <div className="w-full h-full relative order-first">
                                        {renderVisual(index)}
                                    </div>
                                </div>
                            </div>
                        </TechBorderContainer>
                    </div>
                </FadeIn>
            ))}
        </div>
      </div>

    </div>
  );
};

export default Product;