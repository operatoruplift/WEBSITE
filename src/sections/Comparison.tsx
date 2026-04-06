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
  { name: 'Enterprise compliance (HIPAA/SOC2/GDPR)', uplift: true, chatgpt: false, claude: false, gemini: false, grok: false },
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
    <section className="w-full bg-background px-6 md:px-12 flex justify-center aurora-section">
      {/* Divider */}
      <div className="w-full max-w-[1200px] pt-16 pb-24">
        <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-white/15 to-transparent relative mb-16">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-1 bg-background flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(231,118,48,0.6)]"></div>
          </div>
        </div>

        {/* Header - centered */}
        <div className="text-center mb-12">
          <FadeIn>
            <div className="inline-flex items-center gap-3 mb-6">
              <span className="h-px w-16 bg-primary/40" />
              <span className="text-xs font-bold tracking-[0.25em] text-primary uppercase">Compare</span>
              <span className="h-px w-16 bg-primary/40" />
            </div>
          </FadeIn>
          <h2 className="text-3xl md:text-4xl font-medium text-white mb-4 tracking-tight">
            Why Operator Uplift?
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Every other AI platform runs on their servers, trains on your data, and locks you into their ecosystem. We do the opposite.
          </p>
        </div>

        {/* Table - scrollable on mobile */}
        <FadeIn delay={200} className="w-full block">
          <div className="overflow-x-auto -mx-6 px-6 md:mx-0 md:px-0">
            <div className="max-w-[900px] mx-auto rounded-2xl border border-white/10 bg-black/40 backdrop-blur-sm">
              <table className="w-full text-sm table-fixed">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-4 text-gray-500 font-mono text-xs uppercase tracking-wider w-[35%]">Feature</th>
                    {platforms.map(p => (
                      <th key={p.key} className={`p-4 text-center font-mono text-[10px] uppercase tracking-wider whitespace-nowrap ${p.highlight ? 'text-primary bg-primary/5' : 'text-gray-500'}`}>
                        {p.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {features.map((f, i) => (
                    <tr key={f.name} className={`border-b border-white/5 ${i % 2 === 0 ? 'bg-white/[0.01]' : ''}`}>
                      <td className="p-4 text-gray-300 font-medium text-xs">{f.name}</td>
                      {platforms.map(p => {
                        const val = f[p.key as keyof typeof f] as boolean;
                        return (
                          <td key={p.key} className={`p-4 text-center ${p.highlight ? 'bg-primary/5' : ''}`}>
                            {val ? (
                              <span className="text-emerald-400">&#10003;</span>
                            ) : (
                              <span className="text-gray-700">&#10005;</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-[10px] text-gray-600 text-center mt-4 font-mono">
            Based on publicly available privacy policies and product features as of April 2026.
          </p>
        </FadeIn>
      </div>
    </section>
  );
};

export default Comparison;
