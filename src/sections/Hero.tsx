import React from 'react';
import HeroAnimation from '@/src/components/HeroAnimation';
import DownloadWidget from '@/src/components/DownloadWidget';
import TrustedBy from '@/src/components/TrustedBy';
import { APP_CONTENT } from '@/src/services/dataService';
import { FadeIn, GlideText } from '@/src/components/Animators';

const Hero: React.FC = () => {
  const data = APP_CONTENT.hero;

  return (
    <div className="relative min-h-screen w-full bg-background overflow-hidden selection:bg-primary/30 selection:text-white flex flex-col">
      
      {/* Background Visualization Layer - Desktop Only */}
      <div className="hidden lg:block absolute inset-0 z-0 lg:left-[10%] pointer-events-none opacity-60 mix-blend-screen">
        <HeroAnimation />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent w-1/3"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent h-32 bottom-0"></div>
      </div>

      <div className="relative z-10 pt-32 pb-12 px-6 md:px-12 lg:pt-32 max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 flex-grow">
        
        {/* Left Content Column */}
        <div className="lg:col-span-7 flex flex-col justify-center">
          
          {/* Vision Tag */}
          <FadeIn delay={100} direction="down">
            <div className="flex items-center mb-8">
                <span className="w-2 h-2 rounded-full bg-primary mr-3 shadow-[0_0_8px_rgba(255,85,0,0.6)] animate-pulse"></span>
                <span className="text-xs font-bold tracking-[0.2em] text-white uppercase">{data.visionTag}</span>
            </div>
          </FadeIn>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl tracking-tight text-white mb-8 leading-[1.05] min-h-[1.1em]">
            <GlideText text={data.headline} />
          </h1>

          {/* Subhead */}
          <FadeIn delay={400}>
            <p className="text-lg md:text-xl text-muted font-mono mb-4 max-w-2xl">
                {data.subhead}
            </p>
          </FadeIn>

          {/* Description */}
          <FadeIn delay={600}>
            <p className="text-base md:text-lg text-gray-400 mb-8 max-w-xl leading-relaxed">
                {data.description}
            </p>
          </FadeIn>

          {/* Mobile Animation Container - Placed between Text and Download */}
          <div className="block lg:hidden w-full h-[300px] relative mb-8 rounded-xl overflow-hidden bg-white/5 border border-white/10">
              <HeroAnimation className="w-full h-full" />
              {/* Gradients to blend edges slightly */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/50 pointer-events-none"></div>
          </div>

          {/* Download Widget */}
          <FadeIn delay={800}>
             <DownloadWidget data={data} />
          </FadeIn>

          {/* Powered By (Marquee) */}
          <FadeIn delay={1000}>
             <TrustedBy />
          </FadeIn>

        </div>

        {/* Right Column Spacer - Desktop Animation lives behind here */}
        <div className="hidden lg:block lg:col-span-5 pointer-events-none">
        </div>

      </div>
    </div>
  );
};

export default Hero;