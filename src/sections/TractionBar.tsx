import React from 'react';
import { FadeIn } from '@/src/components/Animators';

const TractionBar: React.FC = () => {
  const stats = [
    { value: '300+', label: 'Beta Users (Previous Build)' },
    { value: '90%', label: 'Retention Rate' },
    { value: '$0', label: 'Paid Marketing' },
  ];

  return (
    <section className="w-full bg-background px-6 md:px-12 flex justify-center">
      <FadeIn className="w-full max-w-[1200px]" delay={100} threshold={0.05}>
        <div className="py-16 flex flex-col items-center">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
            {stats.map((stat, index) => (
              <React.Fragment key={index}>
                {index > 0 && (
                  <div className="hidden md:block w-px h-12 bg-white/10" />
                )}
                <div className="flex flex-col items-center text-center">
                  <span className="text-3xl md:text-4xl font-bold text-white">{stat.value}</span>
                  <span className="text-sm text-gray-400 font-mono mt-1">{stat.label}</span>
                </div>
              </React.Fragment>
            ))}
          </div>
          <p className="text-gray-500 text-sm font-mono mt-8 text-center max-w-lg">
            We validated demand with our first build. Now we&apos;re rebuilding the right foundation.
          </p>
        </div>
      </FadeIn>
    </section>
  );
};

export default TractionBar;
