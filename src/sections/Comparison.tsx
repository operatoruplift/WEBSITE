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
  { name: 'Built-in store of helpers',                   uplift: true, chatgpt: true,  claude: false, gemini: false, grok: false, zo: false, poke: true,  hermes: false, openclaw: true },
  { name: 'Helpers that work as a team',                 uplift: true, chatgpt: false, claude: false, gemini: false, grok: false, zo: false, poke: false, hermes: true,  openclaw: true },
  { name: 'Real Gmail + Calendar via Google OAuth',      uplift: true, chatgpt: false, claude: false, gemini: false, grok: false, zo: true,  poke: true,  hermes: false, openclaw: true },
  { name: 'Memory you can export and erase',             uplift: true, chatgpt: false, claude: false, gemini: false, grok: false, zo: false, poke: false, hermes: false, openclaw: false },
  { name: 'Open-source codebase, MIT licensed',          uplift: true, chatgpt: false, claude: false, gemini: false, grok: false, zo: false, poke: false, hermes: true,  openclaw: true },
  { name: 'Privacy posture (HIPAA-aware, GDPR workflows)', uplift: true, chatgpt: false, claude: false, gemini: false, grok: false, zo: false, poke: false, hermes: false, openclaw: false },
];

/** Letter-monogram placeholder for the niche-agent columns that don't
 *  have a vendor logo wired in. Renders a circular badge with the
 *  initial inside, sized to match the existing 20px provider logos
 *  so the table header row stays visually balanced. The component
 *  accepts the full SVGProps set so callers can forward aria-hidden,
 *  matching the ProviderLogos signature widened in PR #378. */
function Monogram({ letter, className, ...rest }: React.SVGProps<SVGSVGElement> & { letter: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...rest}>
      <circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <text x="12" y="16" textAnchor="middle" fontSize="11" fontFamily="ui-monospace, SFMono-Regular, monospace" fontWeight="700" fill="currentColor">
        {letter}
      </text>
    </svg>
  );
}

const ZoLogo = (props: React.SVGProps<SVGSVGElement>) => <Monogram letter="Z" {...props} />;
const PokeLogo = (props: React.SVGProps<SVGSVGElement>) => <Monogram letter="P" {...props} />;
const HermesLogo = (props: React.SVGProps<SVGSVGElement>) => <Monogram letter="H" {...props} />;
const OpenClawLogo = (props: React.SVGProps<SVGSVGElement>) => <Monogram letter="C" {...props} />;

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
              <div className="min-w-[640px] mx-auto rounded-2xl border border-white/10 bg-black/40 backdrop-blur-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left p-2.5 sm:p-4 text-gray-500 font-mono text-[10px] sm:text-xs uppercase tracking-wider min-w-[120px] sm:w-[28%]">Feature</th>
                      {platforms.map(p => {
                      const PlatformLogo = p.Logo;
                      return (
                        <th
                          key={p.key}
                          className={`p-2 sm:p-3 text-center font-mono text-[10px] uppercase tracking-wider ${
                            p.highlight ? 'text-primary bg-primary/5' : 'text-gray-500'
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
                              className={`w-5 h-5 shrink-0 ${p.highlight ? 'text-primary' : 'text-gray-400'}`}
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
                    <tr key={f.name} className={`border-b border-white/5 ${i % 2 === 0 ? 'bg-white/[0.01]' : ''}`}>
                      <td className="p-2.5 sm:p-4 text-gray-300 font-medium text-[11px] sm:text-xs">{f.name}</td>
                      {platforms.map(p => {
                        const val = f[p.key as keyof typeof f] as boolean;
                        return (
                          <td key={p.key} className={`p-2 sm:p-3 text-center ${p.highlight ? 'bg-primary/5' : ''}`}>
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
            Based on publicly available privacy policies and product features as of May 2026.
          </p>
        </FadeIn>
      </div>
    </section>
  );
};

export default Comparison;
