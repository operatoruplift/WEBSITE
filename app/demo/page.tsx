'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Check, RotateCcw } from 'lucide-react';

// Illustrative transaction signature shown in the walkthrough demo.
// Not a real on-chain tx, real audit-trail publishes are linked from /security.
const EXAMPLE_TX = '4sGjMW1sUnHzSxGspuhSqn4JmAx8Q5Y7InAzAi4QyJNRQiuRcoKdAm7qPHLM6kb6sPAR7YXq';

export default function DemoPage() {
  const [step, setStep] = useState(0);
  const [typing, setTyping] = useState('');
  const [showCursor, setShowCursor] = useState(true);

  const reset = useCallback(() => {
    setStep(0);
    setTyping('');
  }, []);

  // Auto-advance steps
  useEffect(() => {
    if (step >= 6) return;
    const delays = [3000, 3000, 3000, 3000, 4000, 3000];
    const timer = setTimeout(() => setStep(s => s + 1), delays[step] || 3000);
    return () => clearTimeout(timer);
  }, [step]);

  // Typing animation for step 4
  useEffect(() => {
    if (step !== 4) return;
    const text = 'Schedule a demo call for tomorrow at 10am';
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) { setTyping(text.slice(0, i + 1)); i++; }
      else clearInterval(interval);
    }, 50);
    return () => clearInterval(interval);
  }, [step]);

  // Blinking cursor
  useEffect(() => {
    const interval = setInterval(() => setShowCursor(c => !c), 530);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative px-6" style={{ background: '#050508' }}>
      {/* Reset button */}
      <button onClick={reset} className="absolute top-6 right-6 flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors font-mono uppercase tracking-widest">
        <RotateCcw size={14} /> Reset Demo
      </button>

      <Link href="/" className="absolute top-6 left-6 text-xs text-gray-500 hover:text-white transition-colors font-mono uppercase tracking-widest">
        &larr; Back
      </Link>

      {/* Terminal container */}
      <div className="w-full max-w-[700px]">
        {/* Terminal window */}
        <div className="rounded-xl border border-white/10 bg-[#0c0c0f] overflow-hidden shadow-2xl">
          {/* Title bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/50" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
              <div className="w-3 h-3 rounded-full bg-green-500/50" />
            </div>
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Operator Uplift Demo</span>
            <div className="w-16" />
          </div>

          {/* Content */}
          <div className="p-6 min-h-[400px] font-mono text-sm">
            {/* Step 1: Agent Store */}
            {step >= 0 && (
              <div className="mb-4 animate-fadeInUp">
                <span className="text-gray-500">$</span> <span className="text-primary">uplift store browse</span>
                <div className="mt-2 space-y-1">
                  <div className="text-gray-400">  Task Manager     <span className="text-gray-600">0.01 SOL</span></div>
                  <div className={`text-white ${step >= 1 ? 'bg-primary/10 -mx-2 px-2 py-0.5 rounded' : ''}`}>
                    {step >= 1 ? '> ' : '  '}Calendar Agent    <span className="text-gray-600">0.01 SOL</span>
                    {step >= 1 && <span className="text-primary ml-2">&larr; selected</span>}
                  </div>
                  <div className="text-gray-400">  Research Agent    <span className="text-gray-600">0.02 SOL</span></div>
                </div>
              </div>
            )}

            {/* Step 2: Deploy */}
            {step >= 1 && (
              <div className="mb-4 animate-fadeInUp">
                <span className="text-gray-500">$</span> <span className="text-primary">uplift deploy calendar-agent --pay 0.01</span>
              </div>
            )}

            {/* Step 3: Phantom approval */}
            {step >= 2 && (
              <div className="mb-4 animate-fadeInUp">
                <div className="text-gray-400">  Connecting to Phantom wallet...</div>
                <div className="text-gray-400">  Requesting approval for 0.01 SOL on devnet...</div>
                {step >= 3 && (
                  <>
                    <div className="text-emerald-400">  <Check size={12} className="inline" /> Transaction confirmed on Solana devnet</div>
                    <div className="text-gray-500">  tx (example): {EXAMPLE_TX.slice(0, 20)}…</div>
                    <div className="text-emerald-400">  <Check size={12} className="inline" /> Calendar Agent deployed successfully</div>
                  </>
                )}
              </div>
            )}

            {/* Step 4: Chat */}
            {step >= 4 && (
              <div className="mb-4 animate-fadeInUp">
                <span className="text-gray-500">$</span> <span className="text-primary">uplift chat calendar-agent</span>
                <div className="mt-2 p-3 rounded-lg border border-white/5 bg-black/40">
                  <div className="text-gray-500 text-xs mb-2">You:</div>
                  <div className="text-white">{typing}{showCursor ? '|' : ''}</div>
                </div>
              </div>
            )}

            {/* Step 5: Agent response */}
            {step >= 5 && (
              <div className="mb-4 animate-fadeInUp">
                <div className="p-3 rounded-lg border border-primary/20 bg-primary/5">
                  <div className="text-primary text-xs mb-2">Calendar Agent:</div>
                  <div className="text-gray-300">Done. I&apos;ve added &quot;Operator Uplift Demo&quot; to your Google Calendar for tomorrow at 10am. Invite sent.</div>
                </div>
              </div>
            )}

            {/* Step 6: Success */}
            {step >= 6 && (
              <div className="mt-8 text-center animate-fadeInUp">
                <div className="inline-flex items-center gap-2 text-emerald-400 text-lg font-bold mb-2">
                  <Check size={20} /> Complete
                </div>
                <p className="text-gray-400">Approval before every action. Signed receipt for the audit log.</p>
                <div className="mt-6 flex items-center justify-center gap-4">
                  <Link href="/login" className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/80 transition-colors">
                    Try it free
                  </Link>
                  <button onClick={reset} className="px-4 py-2 bg-white/5 text-gray-400 rounded-lg text-sm hover:bg-white/10 transition-colors">
                    Watch Again
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {[0, 1, 2, 3, 4, 5, 6].map(s => (
            <div key={s} className={`w-1.5 h-1.5 rounded-full transition-all ${s <= step ? 'bg-primary' : 'bg-gray-700'}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
