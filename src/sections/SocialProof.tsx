'use client';

import React from 'react';
import Link from 'next/link';
import { FadeIn } from '@/src/components/Animators';
import { MessageSquare } from 'lucide-react';

const SocialProof: React.FC = () => {
  return (
    <section className="w-full bg-background px-6 md:px-12 flex justify-center aurora-glow">
      <div className="w-full max-w-[800px] py-20">
        <div className="text-center mb-12">
          <FadeIn>
            <div className="inline-flex items-center gap-3 mb-6">
              <span className="h-px w-16 bg-primary/40" />
              <span className="text-xs font-bold tracking-[0.25em] text-primary uppercase">Community</span>
              <span className="h-px w-16 bg-primary/40" />
            </div>
          </FadeIn>
          <h2 className="text-3xl md:text-4xl font-medium text-white mb-4 tracking-tight">
            What people are saying
          </h2>
        </div>

        <FadeIn delay={200}>
          <div className="p-8 md:p-12 rounded-2xl border border-white/10 bg-white/[0.02] text-center">
            <MessageSquare size={32} className="text-primary/40 mx-auto mb-4" />
            <p className="text-gray-300 text-lg mb-2">Beta feedback coming soon.</p>
            <p className="text-gray-500 text-sm mb-6">Join the waitlist to be part of our early community.</p>
            <Link href="/login" className="inline-flex items-center bg-primary/10 border border-primary/20 text-primary px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-primary/20 transition-colors">
              Get Early Access
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};

export default SocialProof;
