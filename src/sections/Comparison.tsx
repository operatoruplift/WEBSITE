'use client';

import React from 'react';
import { FadeIn } from '@/src/components/Animators';

const features = [
  { name: 'Runs on your device', uplift: true, chatgpt: false, claude: false, gemini: false, grok: false },
  { name: 'Your data stays private', uplift: true, chatgpt: false, claude: true, gemini: false, grok: false },
  { name: 'No training on your data', uplift: true, chatgpt: false, claude: true, gemini: false, grok: false },
  { name: 'Works offline', uplift: true, chatgpt: false, claude: false, gemini: false, grok: false },
  { name: 'Use any AI model', uplift: true, chatgpt: false, claude: false, gemini: false, grok: false },
  { name: 'Agent marketplace', uplift: true, chatgpt: true, claude: false, gemini: false, grok: false },
  { name: 'Multi-agent swarms', uplift: true, chatgpt: false, claude: false, gemini: false, grok: false },
  { name: 'Permission controls', uplift: true, chatgpt: false, claude: false, gemini: false, grok: false },
  { name: 'Encrypted memory', uplift: true, chatgpt: false, claude: false, gemini: false, grok: false },
  { name: 'No vendor lock-in', uplift: true, chatgpt: false, claude: false, gemini: false, grok: false },
  { name: 'Open source', uplift: true, chatgpt: false, claude: false, gemini: false, grok: false },
];

const platforms = [
  { key: 'uplift', name: 'Operator Uplift', highlight: true },
  { key: 'chatgpt', name: 'ChatGPT' },
  { key: 'claude', name: 'Claude' },
  { key: 'gemini', name: 'Gemini' },
  { key: 'grok', name: 'Grok' },
];

const Comparison: React.FC = () => {
  return (
    <section className="w-full bg-background px-6 md:px-12 flex justify-center flex-col items-center aurora-section">
      <div className="w-full max-w-[1600px] py-16 flex items-center justify-center">
        <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-white/15 to-transparent relative">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-1 bg-background flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(231,118,48,0.6)]"></div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-[1200px] pb-24">
        <FadeIn>
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="h-px w-16 bg-primary/40" />
            <span className="text-xs font-bold tracking-[0.25em] text-primary uppercase">Compare</span>
            <span className="h-px w-16 bg-primary/40" />
          </div>
        </FadeIn>

        <h2 className="text-3xl md:text-4xl font-medium text-white text-center mb-4 tracking-tight">
          Why Operator Uplift?
        </h2>
        <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
          Every other AI platform runs on their servers, trains on your data, and locks you into their ecosystem. We do the opposite.
        </p>

        {/* Table */}
        <FadeIn delay={200}>
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/40 backdrop-blur-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-4 text-gray-500 font-mono text-xs uppercase tracking-wider">Feature</th>
                  {platforms.map(p => (
                    <th key={p.key} className={`p-4 text-center font-mono text-xs uppercase tracking-wider ${p.highlight ? 'text-primary bg-primary/5' : 'text-gray-500'}`}>
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {features.map((f, i) => (
                  <tr key={f.name} className={`border-b border-white/5 ${i % 2 === 0 ? 'bg-white/[0.01]' : ''}`}>
                    <td className="p-4 text-gray-300 font-medium">{f.name}</td>
                    {platforms.map(p => {
                      const val = f[p.key as keyof typeof f] as boolean;
                      return (
                        <td key={p.key} className={`p-4 text-center ${p.highlight ? 'bg-primary/5' : ''}`}>
                          {val ? (
                            <span className="text-emerald-400 text-lg">&#10003;</span>
                          ) : (
                            <span className="text-gray-700 text-lg">&#10005;</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-gray-600 text-center mt-4 font-mono">
            Based on publicly available privacy policies and product features as of March 2026.
          </p>
        </FadeIn>
      </div>
    </section>
  );
};

export default Comparison;
