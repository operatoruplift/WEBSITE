'use client';

import React from 'react';
import { Shield, Globe, Eye } from 'lucide-react';
import { FadeIn } from '@/src/components/Animators';

const items = [
  {
    icon: Shield,
    title: 'HIPAA Ready',
    description: 'Your agents process sensitive data inside your firewall. Nothing leaves your environment.',
  },
  {
    icon: Globe,
    title: 'GDPR Compliant',
    description: 'All data stays in your jurisdiction. No cross-border transfers. Full right to erasure.',
  },
  {
    icon: Eye,
    title: 'SOC 2 Ready',
    description: 'Open-source runtime means anyone can audit exactly how your data is handled.',
  },
];

const Compliance: React.FC = () => {
  return (
    <section className="w-full bg-[#08080c] px-6 md:px-12 flex justify-center">
      <div className="w-full max-w-[1200px] py-20">
        <div className="text-center mb-12">
          <FadeIn>
            <div className="inline-flex items-center gap-3 mb-6">
              <span className="h-px w-16 bg-emerald-400/40" />
              <span className="text-xs font-bold tracking-[0.25em] text-emerald-400 uppercase">Compliance</span>
              <span className="h-px w-16 bg-emerald-400/40" />
            </div>
          </FadeIn>
          <h2 className="text-3xl md:text-4xl font-medium text-white mb-4 tracking-tight">
            Built for Compliance
          </h2>
          <p className="text-gray-400 max-w-lg mx-auto">
            Enterprise-grade privacy and security, built into every layer.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((item, i) => {
            const Icon = item.icon;
            return (
              <FadeIn key={item.title} delay={i * 100}>
                <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] text-center h-full">
                  <div className="w-12 h-12 rounded-xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center mx-auto mb-4">
                    <Icon size={24} className="text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{item.description}</p>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Compliance;
