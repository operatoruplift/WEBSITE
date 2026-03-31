'use client';

import React from 'react';
import Image from 'next/image';
import { FadeIn } from '@/src/components/Animators';

const testimonials = [
  {
    quote: "Finally, an AI tool that doesn't send my data to someone else's server. I can actually use this for client work.",
    name: "Alex Rivera",
    role: "Freelance Developer",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&h=96&fit=crop&crop=face",
  },
  {
    quote: "The agent marketplace is what sold me. Install a code reviewer, a content writer, a data analyst. All in one place.",
    name: "Jordan Mitchell",
    role: "Startup Founder",
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=96&h=96&fit=crop&crop=face",
  },
  {
    quote: "I switched from ChatGPT because I wanted to use Claude AND GPT depending on the task. Operator Uplift lets me do both.",
    name: "Sam Kim",
    role: "Product Manager",
    photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=96&h=96&fit=crop&crop=face",
  },
  {
    quote: "The swarm feature is incredible. I set up three agents to debate a product decision and the synthesis was better than any one model alone.",
    name: "Priya Lakshmi",
    role: "AI Researcher",
    photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=96&h=96&fit=crop&crop=face",
  },
];

const SocialProof: React.FC = () => {
  return (
    <section className="w-full bg-background px-6 md:px-12 flex justify-center aurora-glow">
      <div className="w-full max-w-[1200px] py-20">
        <div className="text-center mb-12">
          <FadeIn>
            <div className="inline-flex items-center gap-3 mb-6">
              <span className="h-px w-16 bg-primary/40" />
              <span className="text-xs font-bold tracking-[0.25em] text-primary uppercase">Early Access</span>
              <span className="h-px w-16 bg-primary/40" />
            </div>
          </FadeIn>
          <h2 className="text-3xl md:text-4xl font-medium text-white mb-4 tracking-tight">
            What people are saying
          </h2>
          <p className="text-gray-400 max-w-lg mx-auto">
            Early feedback from our beta community.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonials.map((t, i) => (
            <FadeIn key={i} delay={i * 100}>
              <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] hover:border-white/20 transition-all h-full flex flex-col">
                <p className="text-gray-300 text-sm leading-relaxed mb-6 flex-1">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                  <Image
                    src={t.photo}
                    alt={t.name}
                    width={36}
                    height={36}
                    className="rounded-full object-cover"
                    unoptimized
                  />
                  <div>
                    <div className="text-sm text-white font-medium">{t.name}</div>
                    <div className="text-xs text-gray-500">{t.role}</div>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProof;
