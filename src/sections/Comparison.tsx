'use client';

import React from 'react';
import { FadeIn } from '@/src/components/Animators';
import { OpenAILogo, AnthropicLogo, GoogleLogo, XAILogo } from '@/src/components/ProviderLogos';
import { Logo as UpliftLogo } from '@/src/components/Icons';
import { SectionHeader } from '@/src/components/SectionHeader';

// Comparison rows lean on properties we can actually demonstrate today.
// "Runs on your computer" / "Works offline" rows were removed in the
// honesty sweep that fixed the same claim in the Privacy Policy and
// ProblemStatement pillars; the cloud-deployed website doesn't have
// either property and the desktop+Ollama path is on the roadmap.
const features = [
  { name: 'Tap to approve before every action', uplift: true, chatgpt: false, claude: false, gemini: false, grok: false },
  { name: 'Signed receipt for every action', uplift: true, chatgpt: false, claude: false, gemini: false, grok: false },
  { name: 'On-chain audit log (Solana)', uplift: true, chatgpt: false, claude: false, gemini: false, grok: false },
  { name: 'Pick any AI you want, mid-conversation', uplift: true, chatgpt: false, claude: false, gemini: false, grok: false },
  { name: 'Built-in store of helpers', uplift: true, chatgpt: true, claude: false, gemini: false, grok: false },
  { name: 'Helpers that work as a team', uplift: true, chatgpt: false, claude: false, gemini: false, grok: false },
  { name: 'Real Gmail + Calendar via Google OAuth', uplift: true, chatgpt: false, claude: false, gemini: false, grok: false },
  { name: 'Memory you can export and erase', uplift: true, chatgpt: false, claude: false, gemini: false, grok: false },
  { name: 'Open-source codebase, MIT licensed', uplift: true, chatgpt: false, claude: false, gemini: false, grok: false },
  { name: 'Privacy posture (HIPAA-aware, GDPR workflows)', uplift: true, chatgpt: false, claude: false, gemini: false, grok: false },
];

/** Logo component renders at the same fixed size so mobile doesn't wrap
    or overlap. Alt text is the brand name for a11y. */
const platforms: Array<{
  key: string;
  name: string;
  highlight?: boolean;
  Logo: React.FC<{ className?: string }>;
}> = [
  { key: 'uplift', name: 'Operator Uplift', highlight: true, Logo: UpliftLogo },
  { key: 'chatgpt', name: 'ChatGPT', Logo: OpenAILogo },
  { key: 'claude', name: 'Claude', Logo: AnthropicLogo },
  { key: 'gemini', name: 'Gemini', Logo: GoogleLogo },
  { key: 'grok', name: 'Grok', Logo: XAILogo },
];

const Comparison: React.FC = () => {
  return (
    <section className="w-full bg-background px-6 md:px-12 flex justify-center aurora-section">
      <div className="w-full max-w-[1200px] pt-16 pb-24">
        <SectionHeader
          eyebrow="Compare"
          title="Why Operator Uplift?"
          description="Other AIs run on their servers, learn from your messages, and only work if you stay loyal to one company. We don't do any of that."
        />

        {/* Table - scrollable on mobile with a right-edge fade so the
            last column visibly "hints" more content, instead of looking
            like it's been cut off by the viewport. */}
        <FadeIn delay={200} className="w-full block">
          <div className="relative -mx-6 px-6 md:mx-0 md:px-0">
            {/* Right-side fade, visible on mobile only, signals horizontal scroll.
                Uses bg-background so the fade tracks the theme palette. The
                earlier hardcoded #0A0A0A rendered as a black bar on the
                light marketing page. */}
            <div className="pointer-events-none absolute top-0 right-0 w-8 h-full bg-gradient-to-l from-background to-transparent z-10 md:hidden" />
            <div className="overflow-x-auto">
              <div className="max-w-[900px] mx-auto rounded-2xl border border-white/10 bg-black/40 backdrop-blur-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left p-2.5 sm:p-4 text-gray-500 font-mono text-[10px] sm:text-xs uppercase tracking-wider min-w-[120px] sm:w-[35%]">Feature</th>
                      {platforms.map(p => {
                      const PlatformLogo = p.Logo;
                      return (
                        <th
                          key={p.key}
                          className={`p-3 sm:p-4 text-center font-mono text-[10px] uppercase tracking-wider ${
                            p.highlight ? 'text-primary bg-primary/5' : 'text-gray-500'
                          }`}
                          aria-label={p.name}
                        >
                          {/* Mobile: logo only (fixed w-5 h-5, centered).
                              md+: logo + name side-by-side, no wrap. */}
                          <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5">
                            <PlatformLogo
                              className={`w-5 h-5 shrink-0 ${p.highlight ? 'text-primary' : 'text-gray-400'}`}
                            />
                            <span className="hidden md:inline whitespace-nowrap">{p.name}</span>
                            {/* Screen readers only, mobile shows logo visually but keeps the name for accessibility */}
                            <span className="sr-only md:hidden">{p.name}</span>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {features.map((f, i) => (
                    <tr key={f.name} className={`border-b border-white/5 ${i % 2 === 0 ? 'bg-white/[0.01]' : ''}`}>
                      <td className="p-2.5 sm:p-4 text-gray-300 font-medium text-[11px] sm:text-xs">{f.name}</td>
                      {platforms.map(p => {
                        const val = f[p.key as keyof typeof f] as boolean;
                        return (
                          <td key={p.key} className={`p-2.5 sm:p-4 text-center ${p.highlight ? 'bg-primary/5' : ''}`}>
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
