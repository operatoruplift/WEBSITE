'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { FadeIn } from '@/src/components/Animators';

const SocialProof: React.FC = () => {
  return (
    <section className="w-full bg-background px-6 md:px-12 flex justify-center aurora-glow">
      <div className="w-full max-w-[1200px] py-20">
        <div className="text-center">
          <FadeIn>
            <div className="inline-flex items-center gap-3 mb-6">
              <span className="h-px w-16 bg-primary/40" />
              <span className="text-xs font-bold tracking-[0.25em] text-primary uppercase">Community</span>
              <span className="h-px w-16 bg-primary/40" />
            </div>
          </FadeIn>
          <h2 className="text-3xl md:text-4xl font-medium text-white mb-4 tracking-tight">
            What Our Beta Community Says
          </h2>
          <p className="text-gray-400 max-w-lg mx-auto mb-8">
            We&apos;re collecting real feedback from our 300+ beta users. Join the waitlist to be part of the next cohort.
          </p>
          <FadeIn delay={200}>
            <Link href="/login"
              className="inline-flex items-center bg-primary text-white px-6 py-3 rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-primary/80 transition-colors shadow-[0_0_20px_rgba(231,118,48,0.3)]">
              Get Early Access <ArrowRight size={16} className="ml-2" />
            </Link>
          </FadeIn>
        </div>
      </div>
    </section>
  );
};

export default SocialProof;
