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
  'Every agent runs inside an isolated, encrypted sandbox on your device. Memory is local-first with optional encrypted sync. Your data starts on your machine and stays under your control. No cloud leaks, no shared state between sessions.',
  'Discover, install, and manage agents from a marketplace. Developers publish agents with transparent pricing, and users get one-click deployment with full permission visibility. Each agent is cryptographically verified before installation.',
  'Tasks execute in session-based runtimes that start fast, stay isolated, and terminate cleanly. When a session ends, the agent loses all system access. No long-running background processes, no residual permissions.',
  'Time-limited access keys define exactly what an agent can see or do. Keys unlock the Agentic Vault only for the active session and can be revoked instantly. Permissions are precise, temporary, and always under your control.',
  'Every file read, device control action, and network call requires explicit permission. Operator Uplift enforces the boundaries you define. No silent behavior, no surprises. A human-in-the-loop firewall for every agent action.',
];

const technicalDetails = [
  ['Encrypted local memory', 'Per-session isolation', 'Optional sync with E2EE'],
  ['One-click deployment', 'Cryptographic verification', 'Transparent permissions'],
  ['Sub-second cold start', 'Automatic cleanup', 'Zero residual access'],
  ['Scoped access tokens', 'Instant revocation', 'Time-bound sessions'],
  ['Policy-as-code rules', 'Real-time action prompts', 'Granular allow/block lists'],
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
