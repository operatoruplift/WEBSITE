import React from 'react';
import Link from 'next/link';
import HeroAnimation from '@/src/components/HeroAnimation';
import TrustedBy from '@/src/components/TrustedBy';
import { APP_CONTENT } from '@/src/services/dataService';
import { FadeIn, GlideText } from '@/src/components/Animators';

const Hero: React.FC = () => {
  const data = APP_CONTENT.hero;
  
  return (
    <div className="relative min-h-screen w-full bg-background overflow-hidden selection:bg-primary/30 selection:text-white flex flex-col aurora-hero">
      
      {/* Background Visualization Layer - Desktop Only, covers full viewport */}
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

          {/* Headline. Mirrors the subtle vertical text gradient
              applied to every section h2 via SectionHeader (PR #354)
              so the hero's most prominent surface ties into the same
              editorial system as the rest of the page. The
              `text-foreground` fallback keeps the headline visible on
              browsers that don't render bg-clip-text. GlideText's
              opacity transition still applies through the fade-in. */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl tracking-tight text-foreground bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text [-webkit-text-fill-color:transparent] mb-5 md:mb-6 leading-[1.05] min-h-[1.1em]">
            <GlideText text={data.headline} />
          </h1>

          {/* Subhead */}
          <FadeIn delay={400}>
            <p className="text-sm sm:text-base md:text-lg text-muted font-mono mb-2 md:mb-3 max-w-2xl">
              {data.subhead}
            </p>
          </FadeIn>

          {/* The mobile/tablet duplicate of HeroAnimation was a 400-600px
              empty card on the new light palette: the canvas particles
              were tuned for a dark background so they read as a faded
              ghost on white, and the surrounding bg-white/5 box pushed
              the CTAs an extra screen below the fold. Removed in favor
              of the cleaner above-the-fold copy + CTA stack. The
              desktop (lg+) keeps its full-bleed background canvas. */}

          {/* Single primary action (sign in for the web app) plus a
              secondary anchor to the recorded demo. The desktop
              installer CTA was dropped per user feedback (the Hero
              already pushes sign-in, and a second orange button for
              "Get early access for Mac" + the OS picker read as
              repetitive). Desktop installers stay reachable via /docs. */}
          <FadeIn delay={800}>
            <div className="flex flex-col sm:flex-row items-start gap-3 mb-4">
              <Link href="/login?returnTo=/integrations"
                className="inline-flex items-center px-6 py-3 bg-primary text-white font-bold text-sm rounded-lg hover:bg-primary/90 transition-colors uppercase tracking-wide shadow-[0_0_20px_rgba(249,115,22,0.25)]">
                Sign in and connect Gmail
                <svg className="ml-2 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </Link>
              <a href="#demo-video"
                className="inline-flex items-center px-6 py-3 bg-white/5 text-white font-bold text-sm rounded-lg border border-white/10 hover:bg-white/10 transition-all uppercase tracking-wide">
                <svg className="mr-2 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                Watch 90s demo
              </a>
            </div>
          </FadeIn>

          {/* Works With Any Model (Marquee) */}
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
