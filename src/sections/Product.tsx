import React, { useEffect, useRef, useState } from 'react';
import { TerminalIcon, GlobeIcon, ChevronRight, MessageIcon, KanbanIcon, CheckIcon } from '@/src/components/Icons';
import { APP_CONTENT } from '@/src/services/dataService';
import { SandboxVisual, StoreVisual, RuntimeVisual, TokenVisual, PermissionsVisual } from '@/src/components/ProductVisuals';
import { FadeIn, GlideText } from '@/src/components/Animators';

const Product: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [animStep, setAnimStep] = useState(0);

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

  const getStepHeight = () => window.innerHeight * 0.8;

  useEffect(() => {
    const handleScroll = () => {
      // Only handle scroll sync on desktop where the list is visible
      if (window.innerWidth < 1024) return;

      if (!sectionRef.current) return;
      const scrollY = window.scrollY;
      const offsetTop = sectionRef.current.offsetTop;
      const stepHeight = getStepHeight();
      const scrollDistance = scrollY - offsetTop;

      if (scrollDistance < -window.innerHeight * 0.2) return;

      const index = Math.min(
        features.length - 1,
        Math.max(0, Math.floor((scrollDistance + stepHeight * 0.3) / stepHeight))
      );

      if (index !== activeIndex) {
        setActiveIndex(index);
        setAnimStep(0);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeIndex, features.length]);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimStep((prev) => (prev + 1) % 4);
    }, 2000);
    return () => clearInterval(interval);
  }, [activeIndex]);

  const scrollToFeature = (index: number) => {
    if (!sectionRef.current) return;
    const offsetTop = sectionRef.current.offsetTop;
    const stepHeight = getStepHeight();
    const targetY = offsetTop + (index * stepHeight);

    window.scrollTo({
      top: targetY,
      behavior: 'smooth'
    });
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
      style={{ backgroundColor: '#0c0c0c' }}
    >

      {/* --- DESKTOP VIEW (Sticky & Scroll-linked) --- */}
      <div className="hidden lg:flex lg:sticky lg:top-0 h-screen w-full items-center overflow-hidden">
        <div className="max-w-[1600px] mx-auto px-6 md:px-12 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 h-full py-24 md:py-16 relative">

          {/* Left Side: Content & Navigation */}
          <div className="lg:col-span-5 flex flex-col h-full relative z-10">

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
            <div className="mt-auto mb-12 lg:mb-24 relative pl-4">
              <div className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-white/10 z-0 rounded-full"></div>
              <div
                className="absolute left-[7px] top-2 w-[2px] bg-primary z-0 rounded-full transition-all duration-500 ease-out"
                style={{ height: `${(activeIndex / (features.length - 1)) * 100}%` }}
              ></div>

              <div className="flex flex-col space-y-4">
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

          {/* Right Side: Split View (Text Box + Animation Box) */}
          <div className="lg:col-span-7 grid lg:grid-cols-12 gap-6 h-full relative lg:pt-24 lg:pb-6">

             {/* Box 1: Text Description */}
             <div className="lg:col-span-5 lg:self-end w-full h-fit order-1 lg:order-1">
                <TechBorderContainer>
                    <div className="w-full bg-[#080808] rounded-xl border border-white/5 p-6 md:p-8 flex flex-col justify-end shadow-2xl animate-fade-in relative">
                       <div key={activeIndex} className="animate-slide-up">
                          <div className="mb-4 md:mb-6 opacity-70 text-primary">
                              {getIcon(features[activeIndex].iconType)}
                          </div>
                          <h3 className="text-2xl md:text-3xl text-white font-medium mb-4 tracking-tight leading-tight">
                            {features[activeIndex].cardTitle}
                          </h3>
                          <p className="text-base md:text-lg text-gray-300 leading-relaxed mb-6 md:mb-8">
                            {features[activeIndex].description}
                          </p>
                          <a 
                            href="/product"
                            className="bg-white text-black px-6 py-3 rounded-sm text-xs font-bold tracking-widest uppercase transition-all hover:bg-gray-200 flex items-center w-fit group"
                          >
                            <span>Explore</span>
                            <ChevronRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                          </a>
                        </div>
                    </div>
                </TechBorderContainer>
             </div>

             {/* Box 2: Animation Visual */}
             <div className="lg:col-span-7 w-full lg:h-full order-2 lg:order-2 overflow-hidden">
                <TechBorderContainer className="h-full">
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

                        <div key={activeIndex} className="w-full h-full flex items-center justify-center relative">
                           {renderVisual(activeIndex)}
                        </div>
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