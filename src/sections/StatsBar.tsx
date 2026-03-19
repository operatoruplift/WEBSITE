'use client';

import React from 'react';
import { FadeIn } from '@/src/components/Animators';

const stats = [
  { value: '59', label: 'Product Routes', suffix: '+' },
  { value: '100', label: 'Encrypted', suffix: '%' },
  { value: '40', label: 'Apps Replaced', suffix: '+' },
  { value: '0', label: 'Cloud Dependency', suffix: '' },
];

const StatsBar: React.FC = () => {
  return (
    <section className="w-full bg-background px-6 md:px-12 flex justify-center">
      <div className="w-full max-w-[1200px] py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <FadeIn key={stat.label} delay={i * 100}>
              <div className="text-center group">
                <div className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight group-hover:text-primary transition-colors">
                  {stat.value}<span className="text-primary">{stat.suffix}</span>
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-widest font-mono">{stat.label}</div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsBar;
