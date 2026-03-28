import React from 'react';
import Link from 'next/link';
import HeroAnimation from '@/src/components/HeroAnimation';
import DownloadWidget from '@/src/components/DownloadWidget';
import TrustedBy from '@/src/components/TrustedBy';
import AddressDisplay from '@/src/components/AddressDisplay';
import { APP_CONTENT } from '@/src/services/dataService';
import { FadeIn, GlideText } from '@/src/components/Animators';

const Hero: React.FC = () => {
  const data = APP_CONTENT.hero;
  
  return (
    <div className="relative min-h-screen w-full bg-background overflow-hidden selection:bg-primary/30 selection:text-white flex flex-col aurora-hero">
      
      {/* Background Visualization Layer - Desktop Only — covers full viewport */}
      <div className="hidden lg:block absolute inset-0 z-0 pointer-events-none opacity-70">
        <HeroAnimation className="w-full h-full" />
        {/* Left fade so text remains readable */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" style={{ width: '45%' }}></div>
        {/* Bottom fade into next section */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent"></div>
        {/* Top fade under navbar */}
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-background/80 to-transparent"></div>
      </div>

      <div className="relative z-10 pt-20 sm:pt-24 md:pt-28 pb-6 sm:pb-8 md:pb-10 px-4 sm:px-6 md:px-12 lg:pt-28 max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 lg:gap-10 flex-grow">
        
        {/* Left Content Column */}
        <div className="lg:col-span-7 flex flex-col justify-center">
          
          {/* Vision Tag */}
          <FadeIn delay={100} direction="down">
            <div className="flex items-center mb-4 md:mb-6">
              <span className="w-2 h-2 rounded-full bg-primary mr-3 shadow-[0_0_8px_rgba(231,118,48,0.6)] animate-pulse"></span>
              <span className="text-xs font-bold tracking-[0.2em] text-white uppercase">{data.visionTag}</span>
            </div>
          </FadeIn>

          {/* Headline */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl tracking-tight text-white mb-5 md:mb-6 leading-[1.05] min-h-[1.1em]">
            <GlideText text={data.headline} />
          </h1>

          {/* Subhead */}
          <FadeIn delay={400}>
            <p className="text-sm sm:text-base md:text-lg text-muted font-mono mb-2 md:mb-3 max-w-2xl">
              {data.subhead}
            </p>
          </FadeIn>

          {/* Description */}
          <FadeIn delay={600}>
            <p className="text-xs sm:text-sm md:text-base text-gray-400 mb-4 md:mb-6 max-w-xl leading-relaxed">
              {data.description}
            </p>
            {data.contractAddress && (
              <div className="mb-6 md:mb-8">
                <AddressDisplay address={data.contractAddress} label={data.contractLabel} />
              </div>
            )}
          </FadeIn>

          {/* Mobile & Tablet Animation Container - Placed between Text and Download */}
          <div className="block lg:hidden w-full h-[400px] sm:h-[500px] md:h-[600px] relative mb-6 md:mb-8 rounded-xl overflow-hidden bg-white/5 border border-white/10">
            <HeroAnimation className="w-full h-full" />
            {/* Gradients to blend edges slightly */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/50 pointer-events-none"></div>
          </div>

          {/* CTAs */}
          <FadeIn delay={800}>
            <div className="flex flex-col sm:flex-row items-start gap-3 mb-8">
              <Link href="/login"
                className="inline-flex items-center px-6 py-3 bg-primary text-white font-bold text-sm rounded-lg hover:bg-primary/80 transition-all shadow-[0_0_20px_rgba(231,118,48,0.3)] hover:shadow-[0_0_30px_rgba(231,118,48,0.5)] uppercase tracking-wide">
                Join Waitlist
                <svg className="ml-2 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </Link>
              <Link href="/product"
                className="inline-flex items-center px-6 py-3 bg-white/5 text-white font-bold text-sm rounded-lg border border-white/10 hover:bg-white/10 transition-all uppercase tracking-wide">
                Explore Product
              </Link>
            </div>
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
