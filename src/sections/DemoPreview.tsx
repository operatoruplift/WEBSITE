'use client';

import React, { useState, useEffect } from 'react';
import { FadeIn } from '@/src/components/Animators';

const DemoPreview: React.FC = () => {
  const [step, setStep] = useState(0);
  const [charIndex, setCharIndex] = useState(0);

  const demoSteps = [
    { label: 'INITIALIZE', command: '> uplift init --agent codepilot', output: 'Agent loaded. Model: Claude Opus 4.6' },
    { label: 'CONFIGURE', command: '> uplift config --memory local --encrypt aes-256', output: 'Memory vault configured. Encryption: AES-256-GCM' },
    { label: 'CONNECT', command: '> uplift connect github.com/myrepo', output: 'Repository linked. 847 files indexed in 3.2s' },
    { label: 'DEPLOY', command: '> uplift deploy --sandbox isolated', output: 'Sandbox ready. Session: 0xF7A3...8B1C' },
    { label: 'EXECUTE', command: '> uplift run "refactor auth module"', output: 'Task complete. 14 files modified. PR #47 created.' },
    { label: 'COMPLETE', command: '> uplift status', output: 'All tasks complete. Session terminated cleanly.' },
  ];

  // Typing effect for current command
  useEffect(() => {
    setCharIndex(0);
    const currentCmd = demoSteps[step].command;
    const typeInterval = setInterval(() => {
      setCharIndex(prev => {
        if (prev >= currentCmd.length) { clearInterval(typeInterval); return prev; }
        return prev + 1;
      });
    }, 40);
    return () => clearInterval(typeInterval);
  }, [step]);

  // Step progression
  useEffect(() => {
    const interval = setInterval(() => setStep(s => (s + 1) % 6), 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="w-full bg-background px-6 md:px-12 flex justify-center flex-col items-center pb-16 aurora-section">
      {/* Divider */}
      <div className="w-full max-w-[1600px] py-12 flex items-center justify-center">
        <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-white/15 to-transparent relative">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-1 bg-background flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(231,118,48,0.6)]"></div>
          </div>
        </div>
      </div>

      {/* Title, centered above CLI */}
      <FadeIn>
        <div className="w-full flex flex-col items-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="h-px w-16 bg-primary/40" />
            <span className="text-xs font-bold tracking-[0.25em] text-primary uppercase">See It In Action</span>
            <span className="h-px w-16 bg-primary/40" />
          </div>
          <p className="text-gray-500 text-sm font-mono text-center max-w-md">
            From open to first reply in seconds. Every step waits for your tap.
          </p>
        </div>
      </FadeIn>

      {/* CLI Terminal */}
      <FadeIn delay={200}>
        <div className="w-full max-w-[900px]">
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
                <span className="text-[10px] font-mono text-primary/60 tracking-widest">OPERATOR UPLIFT CLI v0.1.0</span>
                <div className="flex items-center gap-1.5">
                  {demoSteps.map((_, i) => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${i <= step ? 'bg-primary shadow-[0_0_4px_rgba(231,118,48,0.6)]' : 'bg-white/10'}`} />
                  ))}
                </div>
              </div>

              {/* Terminal body */}
              <div className="p-6 font-mono text-sm min-h-[320px] relative">
                <div className="space-y-5">
                  {demoSteps.map((s, i) => {
                    if (i > step) return null;
                    const isActive = i === step;
                    const typedCmd = isActive ? s.command.slice(0, charIndex) : s.command;
                    const showOutput = isActive ? charIndex >= s.command.length : true;
                    const showCursor = isActive && charIndex < s.command.length;

                    return (
                      <div key={i} className={`transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`text-[9px] font-bold tracking-widest px-2 py-0.5 rounded border ${
                            i < step ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            isActive ? 'bg-primary/10 text-primary border-primary/20' :
                            'bg-white/5 text-gray-500 border-white/10'
                          }`}>
                            {i < step ? '✓' : ''} {s.label}
                          </span>
                        </div>
                        <div className="text-gray-300">
                          {typedCmd}
                          {showCursor && <span className="inline-block w-2 h-4 bg-primary/80 ml-0.5 animate-pulse" />}
                        </div>
                        {showOutput && (
                          <div className={`mt-1 pl-3 border-l-2 text-xs ${
                            i < step ? 'border-emerald-500/20 text-emerald-400/60' :
                            'border-primary/30 text-primary/70'
                          }`}>
                            {s.output}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Ambient glow */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-primary/5 blur-3xl rounded-full pointer-events-none" />
              </div>

              {/* Status bar */}
              <div className="flex items-center justify-between px-5 py-2.5 border-t border-white/5 bg-black/40">
                <span className="text-[9px] font-mono text-gray-600 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  SANDBOX ACTIVE
                </span>
                <div className="flex items-center gap-4">
                  <span className="text-[9px] font-mono text-gray-600">SESSION: 0xF7A3...8B1C</span>
                  <span className="text-[9px] font-mono text-primary/50">STEP {step + 1}/{demoSteps.length}</span>
                </div>
                <span className="text-[9px] font-mono text-gray-600">MEM: 42MB | CPU: 3%</span>
              </div>
            </div>
          </div>
        </div>
      </FadeIn>
    </section>
  );
};

export default DemoPreview;
