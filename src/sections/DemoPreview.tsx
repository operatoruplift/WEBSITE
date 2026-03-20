'use client';

import React, { useState, useEffect } from 'react';
import { FadeIn } from '@/src/components/Animators';

const DemoPreview: React.FC = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setStep(s => (s + 1) % 6), 3000);
    return () => clearInterval(interval);
  }, []);

  const demoSteps = [
    { label: 'INITIALIZE', command: '> uplift init --agent codepilot', output: 'Agent loaded. Model: Claude Opus 4.6' },
    { label: 'CONFIGURE', command: '> uplift config --memory local --encrypt aes-256', output: 'Memory vault configured. Encryption enabled.' },
    { label: 'CONNECT', command: '> uplift connect github.com/myrepo', output: 'Repository linked. 847 files indexed.' },
    { label: 'DEPLOY', command: '> uplift deploy --sandbox isolated', output: 'Sandbox ready. Session: 0xF7A3...8B1C' },
    { label: 'EXECUTE', command: '> uplift run "refactor auth module"', output: 'Task running... 14 files modified. PR #47 created.' },
    { label: 'COMPLETE', command: '> uplift status', output: 'All tasks complete. Session terminated cleanly.' },
  ];

  return (
    <section className="w-full bg-background px-6 md:px-12 flex justify-center flex-col items-center pb-16">
      <div className="w-full max-w-[1600px] py-12 flex items-center justify-center">
        <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-white/15 to-transparent relative">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-1 bg-background flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(231,118,48,0.6)]"></div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-[900px]">
        <FadeIn>
          <div className="flex items-center justify-center mb-8">
            <span className="h-px w-12 bg-primary/40" />
            <span className="text-xs font-bold tracking-[0.25em] text-primary uppercase mx-4">See It In Action</span>
            <span className="h-px w-12 bg-primary/40" />
          </div>
        </FadeIn>

        <FadeIn delay={200}>
          <div className="relative p-2 rounded-2xl border border-dashed border-white/10 bg-white/[0.01]">
            <div className="absolute -top-[1px] -left-[1px] w-4 h-4 border-t border-l border-white/30 rounded-tl-lg"></div>
            <div className="absolute -top-[1px] -right-[1px] w-4 h-4 border-t border-r border-white/30 rounded-tr-lg"></div>
            <div className="absolute -bottom-[1px] -left-[1px] w-4 h-4 border-b border-l border-white/30 rounded-bl-lg"></div>
            <div className="absolute -bottom-[1px] -right-[1px] w-4 h-4 border-b border-r border-white/30 rounded-br-lg"></div>

            <div className="bg-[#0c0c0c] rounded-xl border border-white/5 overflow-hidden">
              {/* Terminal header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-black/40">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/60"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/60"></div>
                </div>
                <span className="text-[10px] font-mono text-primary/60 tracking-widest">OPERATOR UPLIFT CLI</span>
                <div className="flex items-center gap-1.5">
                  {demoSteps.map((_, i) => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${i <= step ? 'bg-primary' : 'bg-white/10'}`} />
                  ))}
                </div>
              </div>

              {/* Terminal body */}
              <div className="p-6 font-mono text-sm space-y-6 min-h-[280px]">
                {demoSteps.map((s, i) => (
                  <div key={i} className={`transition-all duration-700 ${i <= step ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[9px] font-bold tracking-widest px-2 py-0.5 rounded border ${i < step ? 'bg-green-500/10 text-green-400 border-green-500/20' : i === step ? 'bg-primary/10 text-primary border-primary/20 animate-pulse' : 'bg-white/5 text-gray-500 border-white/10'}`}>
                        {s.label}
                      </span>
                    </div>
                    <div className="text-gray-400">{s.command}</div>
                    {i < step && <div className="text-gray-600 mt-1 pl-2 border-l border-white/5">{s.output}</div>}
                    {i === step && <div className="text-primary/60 mt-1 pl-2 border-l border-primary/20 animate-pulse">{s.output}</div>}
                  </div>
                ))}
              </div>

              {/* Status bar */}
              <div className="flex items-center justify-between px-5 py-2 border-t border-white/5 bg-black/40">
                <span className="text-[9px] font-mono text-gray-600">SESSION: 0xF7A3...8B1C</span>
                <span className="text-[9px] font-mono text-primary/50">STEP {step + 1}/6</span>
                <span className="text-[9px] font-mono text-gray-600 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  SANDBOX ACTIVE
                </span>
              </div>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={400}>
          <p className="text-center text-sm text-gray-500 font-mono mt-6">
            Local-first. Encrypted. Session-isolated. No cloud dependency.
          </p>
        </FadeIn>
      </div>
    </section>
  );
};

export default DemoPreview;
