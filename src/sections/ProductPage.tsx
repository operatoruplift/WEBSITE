import React from 'react';
import { TerminalIcon, GlobeIcon, KanbanIcon, MessageIcon, CheckIcon, ArrowUpRightIcon } from '@/src/components/Icons';
import { SandboxVisual, StoreVisual, RuntimeVisual, TokenVisual, PermissionsVisual } from '@/src/components/ProductVisuals';
import { APP_CONTENT } from '@/src/services/dataService';
import { FadeIn } from '@/src/components/Animators';

const getIcon = (type: string, className = "w-6 h-6") => {
  switch (type) {
    case 'kanban': return <KanbanIcon className={className} />;
    case 'globe': return <GlobeIcon className={className} />;
    case 'terminal': return <TerminalIcon className={className} />;
    case 'message': return <MessageIcon className={className} />;
    case 'check': return <CheckIcon className={className} />;
    default: return <KanbanIcon className={className} />;
  }
};

const visuals = [
  <SandboxVisual key="sandbox" />,
  <StoreVisual key="store" />,
  <RuntimeVisual key="runtime" />,
  <TokenVisual key="token" />,
  <PermissionsVisual key="permissions" />,
];

// Extended descriptions for the product deep-dive page
const extendedDescriptions = [
  'Each helper has its own scope: only the tools it needs, only the data you let it see, and only for the session it\u2019s active. Helpers can\u2019t reach into each other\u2019s state.',
  'Browse a built-in store of helpers, like an app store, but for AI. Each one tells you exactly what it does and what it costs. One tap to install, and the app double-checks the helper before it runs.',
  'When a helper finishes a job, its access shuts off. Nothing keeps running in the background. No leftover logins, no quiet permissions still active tomorrow.',
  'Helpers only see what you allow, for as long as you allow it. Cancel any helper\u2019s access in one tap, like revoking a guest pass.',
  'Sending an email, booking a meeting, hitting an external API, every one waits for your tap. The app enforces the limits you set. No silent activity, every action logged with a request ID.',
];

// Technical detail bullets per feature card. Each one points at a
// shipped surface so a reviewer can ground-truth the claim.
const technicalDetails = [
  ['Per-session scoping', 'Approval gate per tool', 'Capability flags (lib/capabilities.ts)'],
  ['Built-in helper registry', 'Capability check before install', 'Runtime tool classification (lib/toolSafety.ts)'],
  ['Session ends cleanly on sign-out', 'No background tool execution', 'Audit log keeps the trail'],
  ['Privy-issued JWTs (short-lived)', 'Server-side capability check per request', 'Sign out clears the token'],
  ['Approval modal before any side effect', 'Request ID per action', 'ed25519-signed receipts'],
];

const ProductPage: React.FC = () => {
  const features = APP_CONTENT.product.features;

  return (
    <div className="w-full min-h-screen bg-background pt-32 pb-24 px-6 md:px-12 flex flex-col items-center">

      {/* Header */}
      <div className="w-full max-w-[1200px] mb-24 text-center">
        <FadeIn>
          <div className="flex items-center justify-center mb-6">
            <span className="w-2 h-2 rounded-full bg-primary mr-3 shadow-[0_0_8px_rgba(255,85,0,0.6)]"></span>
            <span className="text-xs font-bold tracking-[0.2em] text-gray-400 uppercase">PRODUCT DEEP DIVE</span>
          </div>
          <h1 className="text-5xl md:text-7xl text-white font-medium tracking-tight mb-8">
            The Agentic Runtime
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            A comprehensive look at the architecture powering the next generation of autonomous software.
          </p>
        </FadeIn>
      </div>

      {/* Feature Sections, same visuals as landing page */}
      <div className="w-full max-w-[1200px] space-y-32">
        {features.map((feature, idx) => (
          <FadeIn key={feature.id} delay={idx * 100}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">

              {/* Visual, alternating sides */}
              <div className={`w-full ${idx % 2 === 1 ? 'lg:order-2' : 'lg:order-1'}`}>
                <div className="relative p-2 rounded-2xl border border-dashed border-white/10 bg-white/[0.01]">
                  <div className="absolute -top-[1px] -left-[1px] w-4 h-4 border-t border-l border-white/30 rounded-tl-lg" />
                  <div className="absolute -top-[1px] -right-[1px] w-4 h-4 border-t border-r border-white/30 rounded-tr-lg" />
                  <div className="absolute -bottom-[1px] -left-[1px] w-4 h-4 border-b border-l border-white/30 rounded-bl-lg" />
                  <div className="absolute -bottom-[1px] -right-[1px] w-4 h-4 border-b border-r border-white/30 rounded-br-lg" />
                  <div className="w-full aspect-[4/3] bg-[#0c0c0c] rounded-xl border border-white/5 overflow-hidden relative shadow-2xl">
                    <div className="absolute inset-0 opacity-10 pointer-events-none"
                      style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                    {visuals[idx]}
                  </div>
                </div>
              </div>

              {/* Text */}
              <div className={`flex flex-col ${idx % 2 === 1 ? 'lg:order-1 lg:items-end lg:text-right' : 'lg:order-2 lg:items-start lg:text-left'}`}>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="text-primary">{getIcon(feature.iconType)}</div>
                  <span className="text-primary font-mono text-sm">0{idx + 1}</span>
                  <div className="h-[1px] w-12 bg-primary/30" />
                </div>
                <h3 className="text-3xl md:text-4xl text-white font-medium mb-6 tracking-tight">{feature.cardTitle}</h3>
                <p className="text-lg text-gray-400 leading-relaxed mb-8 max-w-lg">{extendedDescriptions[idx]}</p>

                <div className={`border-t border-white/5 pt-6 w-full max-w-lg ${idx % 2 === 1 ? 'flex flex-col items-end' : ''}`}>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Technical Specs</div>
                  <ul className="space-y-3">
                    {technicalDetails[idx].map((detail, i) => (
                      <li key={i} className={`flex items-center text-sm text-gray-300 font-mono ${idx % 2 === 1 ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-1.5 h-1.5 rounded-full bg-primary/50 ${idx % 2 === 1 ? 'ml-3' : 'mr-3'}`} />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

            </div>
          </FadeIn>
        ))}
      </div>

      {/* Footer CTA */}
      <div className="w-full max-w-[1200px] mt-32 text-center border-t border-white/5 pt-24">
        <h2 className="text-3xl text-white mb-8">Ready to start building?</h2>
        <a
          href="https://help.operatoruplift.com"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center bg-white text-black px-8 py-4 rounded-sm text-sm font-bold tracking-widest uppercase hover:bg-gray-200 transition-colors group"
        >
          Read the Documentation <ArrowUpRightIcon className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
        </a>
      </div>

    </div>
  );
};

export default ProductPage;
