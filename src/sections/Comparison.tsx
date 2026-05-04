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
//
// Niche-agent columns added: Zo Computer (cloud computer for AI),
// Poke (iMessage assistant), Hermes Agent (open-source by Nous
// Research, NOT General Agents' Ace, which is a separate product),
// OpenClaw (open-source agent gateway by Peter Steinberger). Each
// column is conservative: only true if the platform's own docs
// confirm the feature. Sources verified 2026-05-03 via vendor sites.
const features = [
  { name: 'Tap to approve before every action',          uplift: true, chatgpt: false, claude: false, gemini: false, grok: false, zo: false, poke: true,  hermes: false, openclaw: false },
  { name: 'Signed receipt for every action',             uplift: true, chatgpt: false, claude: false, gemini: false, grok: false, zo: false, poke: false, hermes: false, openclaw: false },
  { name: 'On-chain audit log (Solana)',                 uplift: true, chatgpt: false, claude: false, gemini: false, grok: false, zo: false, poke: false, hermes: false, openclaw: false },
  { name: 'Pick any AI you want, mid-conversation',      uplift: true, chatgpt: false, claude: false, gemini: false, grok: false, zo: true,  poke: false, hermes: true,  openclaw: true },
  { name: 'Built-in store of helpers',                   uplift: true, chatgpt: true,  claude: true,  gemini: false, grok: false, zo: false, poke: true,  hermes: true,  openclaw: true },
  { name: 'Helpers that work as a team',                 uplift: true, chatgpt: false, claude: false, gemini: false, grok: false, zo: false, poke: false, hermes: true,  openclaw: true },
  { name: 'Real Gmail + Calendar via Google OAuth',      uplift: true, chatgpt: false, claude: false, gemini: true,  grok: false, zo: true,  poke: true,  hermes: true,  openclaw: true },
  { name: 'Memory you can export and erase',             uplift: true, chatgpt: true,  claude: true,  gemini: false, grok: false, zo: false, poke: false, hermes: false, openclaw: false },
  { name: 'Open-source codebase, MIT licensed',          uplift: true, chatgpt: false, claude: false, gemini: false, grok: false, zo: false, poke: false, hermes: true,  openclaw: true },
  { name: 'Privacy posture (HIPAA-aware, GDPR workflows)', uplift: true, chatgpt: false, claude: false, gemini: false, grok: false, zo: false, poke: false, hermes: false, openclaw: false },
];

/** Branded SVG marks for the four niche competitors that don't have
 *  a public vendor logo we can ship verbatim. Each is hand-drawn from
 *  brand-cues on the platform's own site so the column headers read
 *  as intentional brand marks rather than placeholder monograms.
 *  - Zo Computer: pixel cube (cloud computer for AI agents).
 *  - Poke: chat-bubble + dot (iMessage-native assistant).
 *  - Hermes Agent: caduceus-derived double helix wing (Nous Research).
 *  - OpenClaw: clawed bracket (open-source agent gateway). */
const ZoLogo = ({ className = 'w-5 h-5', ...rest }: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...rest}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M7 8h10L7 16h10" />
  </svg>
);

const PokeLogo = ({ className = 'w-5 h-5', ...rest }: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...rest}>
    <path d="M4 12c0-4.4 3.6-8 8-8s8 3.6 8 8c0 3.6-2.4 6.7-5.7 7.6L12 22l-2.3-2.4C6.4 18.7 4 15.6 4 12z" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
  </svg>
);

const HermesLogo = ({ className = 'w-5 h-5', ...rest }: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...rest}>
    <path d="M12 3v18" />
    <path d="M8 6c0 3 4 4 4 4s4-1 4-4" />
    <path d="M8 10c0 3 4 4 4 4s4-1 4-4" />
    <path d="M9 21h6" />
  </svg>
);

const OpenClawLogo = ({ className = 'w-5 h-5', ...rest }: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...rest}>
    <path d="M7 4v8c0 2.8 2.2 5 5 5s5-2.2 5-5V4" />
    <path d="M9 8l-2-2" />
    <path d="M15 8l2-2" />
    <path d="M12 17v3" />
  </svg>
);

/** Logo component renders at the same fixed size so mobile doesn't wrap
    or overlap. Alt text is the brand name for a11y. */
const platforms: Array<{
  key: string;
  name: string;
  highlight?: boolean;
  Logo: React.FC<React.SVGProps<SVGSVGElement>>;
}> = [
  { key: 'uplift',   name: 'Operator Uplift', highlight: true, Logo: UpliftLogo },
  { key: 'chatgpt',  name: 'ChatGPT',                          Logo: OpenAILogo },
  { key: 'claude',   name: 'Claude',                           Logo: AnthropicLogo },
  { key: 'gemini',   name: 'Gemini',                           Logo: GoogleLogo },
  { key: 'grok',     name: 'Grok',                             Logo: XAILogo },
  { key: 'zo',       name: 'Zo Computer',                      Logo: ZoLogo },
  { key: 'poke',     name: 'Poke',                             Logo: PokeLogo },
  { key: 'hermes',   name: 'Hermes Agent',                     Logo: HermesLogo },
  { key: 'openclaw', name: 'OpenClaw',                         Logo: OpenClawLogo },
];

const Comparison: React.FC = () => {
  return (
    // Inner padding-div gets `flex flex-col items-center gap-12` to
    // match the rhythm of the homepage sections that use the shared
    // Section component (LocalFirst, DemoVideo, UseCases, Pricing).
    // Earlier this section used asymmetric `pt-16 pb-24` + no flex
    // wrapper, so the SectionHeader and the table sat at different
    // horizontal anchors and the vertical gap between them was tighter
    // than every other section on the page.
    <section aria-labelledby="comparison-heading" className="w-full bg-background px-6 md:px-12 flex justify-center aurora-section">
      <div className="w-full max-w-[1200px] py-14 md:py-20 flex flex-col items-center gap-12">
        <SectionHeader
          headingId="comparison-heading"
          eyebrow="Compare"
          title="Why Operator Uplift?"
          description="Other AIs run on their servers, learn from your messages, and only work if you stay loyal to one company. We don't do any of that."
        />

        {/* Table - scrollable on mobile with a right-edge fade so the
            last column visibly "hints" more content, instead of looking
            like it's been cut off by the viewport. The bigger column
            count (9 platforms) makes the horizontal scroll on smaller
            viewports the load-bearing affordance, not a fallback. */}
        <FadeIn delay={200} className="w-full block">
          <div className="relative -mx-6 px-6 md:mx-0 md:px-0">
            {/* Right-side fade, visible on mobile only, signals horizontal scroll.
                Uses bg-background so the fade tracks the theme palette. The
                earlier hardcoded #0A0A0A rendered as a black bar on the
                light marketing page. */}
            <div className="pointer-events-none absolute top-0 right-0 w-8 h-full bg-gradient-to-l from-background to-transparent z-10 md:hidden" />
            <div className="overflow-x-auto">
              <div className="min-w-[640px] mx-auto rounded-2xl border border-foreground/10 bg-card/60 backdrop-blur-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-foreground/10">
                      <th className="text-left p-2.5 sm:p-4 text-muted font-mono text-[10px] sm:text-xs uppercase tracking-wider min-w-[120px] sm:w-[28%]">Feature</th>
                      {platforms.map(p => {
                      const PlatformLogo = p.Logo;
                      return (
                        <th
                          key={p.key}
                          className={`p-2 sm:p-3 text-center font-mono text-[10px] uppercase tracking-wider ${
                            p.highlight ? 'text-primary bg-primary/5' : 'text-muted'
                          }`}
                          aria-label={p.name}
                        >
                          {/* Mobile: logo only (fixed w-5 h-5, centered).
                              md+: logo + name side-by-side, no wrap. The
                              `aria-label` on the th carries the column's
                              accessible name; the logo SVG inside is
                              decorative chrome and is marked aria-hidden
                              so screen readers don't double-announce. */}
                          <div className="flex flex-col lg:flex-row items-center justify-center gap-1 lg:gap-1.5">
                            <PlatformLogo
                              aria-hidden
                              className={`w-5 h-5 shrink-0 ${p.highlight ? 'text-primary' : 'text-foreground/60'}`}
                            />
                            <span className="hidden lg:inline whitespace-nowrap">{p.name}</span>
                            {/* Screen readers only, mobile shows logo visually but keeps the name for accessibility */}
                            <span className="sr-only lg:hidden">{p.name}</span>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {features.map((f, i) => (
                    <tr key={f.name} className={`border-b border-foreground/[0.06] ${i % 2 === 0 ? 'bg-foreground/[0.015]' : ''}`}>
                      <td className="p-2.5 sm:p-4 text-foreground font-medium text-[11px] sm:text-xs">{f.name}</td>
                      {platforms.map(p => {
                        const val = f[p.key as keyof typeof f] as boolean;
                        return (
                          <td key={p.key} className={`p-2 sm:p-3 text-center ${p.highlight ? 'bg-primary/5' : ''}`}>
                            {val ? (
                              <span className="text-emerald-600">&#10003;</span>
                            ) : (
                              <span className="text-foreground/25">&#10005;</span>
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
          <p className="text-[10px] text-muted text-center mt-4 font-mono">
            Based on publicly available privacy policies and product features as of May 2026.
          </p>
        </FadeIn>
      </div>
    </section>
  );
};

export default Comparison;
