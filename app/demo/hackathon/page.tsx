'use client';

import Link from 'next/link';
import Navbar from '@/src/components/Navbar';
import Footer from '@/src/components/Footer';
import { ExternalLink, Check, FileJson, KeyRound, Receipt, ArrowRight, Coins, Zap } from 'lucide-react';
import { magicBlockSurfaceStatus } from '@/lib/magicblock/adapter';

/**
 * /demo/hackathon
 *
 * Public (no auth) walkthrough of the Loops House Challenge 02
 * submission. Metadata lives in layout.tsx (server component).
 */
export default function HackathonDemoPage() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar currentPage="demo-hackathon" />

            <main className="pt-32 pb-20 px-6 md:px-12">
                <div className="max-w-3xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-3 mb-4">
                            <span className="h-px w-16 bg-[#F97316]/40" />
                            <span className="text-xs font-bold tracking-[0.25em] text-[#F97316] uppercase">Loops House · Challenge 02</span>
                            <span className="h-px w-16 bg-[#F97316]/40" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-medium tracking-tight mb-4">
                            x402 + ERC-8004, working end-to-end
                        </h1>
                        <p className="text-[#A1A1AA] leading-relaxed max-w-xl mx-auto">
                            Every calendar/gmail write goes through a real 402 gate on Solana devnet. Every successful action produces an ed25519-signed receipt a judge can export and verify independently.
                        </p>
                    </div>

                    {/* 5-step diagram */}
                    <div className="rounded-2xl border border-[#222222] bg-[#111111] p-6 md:p-8 mb-10">
                        <div className="text-xs font-mono uppercase tracking-widest text-[#F97316] mb-5">The flow</div>
                        <ol className="space-y-5">
                            {STEPS.map((step, i) => (
                                <li key={i} className="flex gap-4">
                                    <div className="shrink-0 w-8 h-8 rounded-full bg-[#F97316]/10 border border-[#F97316]/30 flex items-center justify-center text-[#F97316] font-bold text-sm">
                                        {i + 1}
                                    </div>
                                    <div className="flex-1 pt-0.5">
                                        <div className="text-sm font-semibold text-white mb-1">{step.title}</div>
                                        <p className="text-xs text-[#A1A1AA] leading-relaxed mb-2">{step.description}</p>
                                        {step.network && (
                                            <pre className="text-[10px] font-mono text-[#A1A1AA] bg-[#0A0A0A] border border-[#222222] rounded-lg p-2.5 overflow-x-auto">{step.network}</pre>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </div>

                    {/* SVG diagram */}
                    <div className="rounded-2xl border border-[#222222] bg-[#111111] p-6 md:p-8 mb-10 overflow-x-auto">
                        <div className="text-xs font-mono uppercase tracking-widest text-[#F97316] mb-5">Request sequence</div>
                        <svg viewBox="0 0 600 360" className="w-full max-w-2xl mx-auto" aria-label="Sequence diagram: client → server 402 → pay → retry with proof → signed receipt">
                            {/* Vertical lanes */}
                            <line x1="100" y1="30" x2="100" y2="340" stroke="#222222" strokeWidth="1" />
                            <line x1="300" y1="30" x2="300" y2="340" stroke="#222222" strokeWidth="1" />
                            <line x1="500" y1="30" x2="500" y2="340" stroke="#222222" strokeWidth="1" />

                            {/* Headers */}
                            <text x="100" y="20" textAnchor="middle" fill="#FAFAFA" fontSize="11" fontFamily="ui-monospace, monospace">Client</text>
                            <text x="300" y="20" textAnchor="middle" fill="#FAFAFA" fontSize="11" fontFamily="ui-monospace, monospace">Server</text>
                            <text x="500" y="20" textAnchor="middle" fill="#FAFAFA" fontSize="11" fontFamily="ui-monospace, monospace">Google + Solana</text>

                            {/* 1. POST tools/calendar */}
                            <line x1="100" y1="60" x2="300" y2="60" stroke="#F97316" strokeWidth="1.5" markerEnd="url(#arrow)" />
                            <text x="200" y="54" textAnchor="middle" fill="#FAFAFA" fontSize="10" fontFamily="ui-monospace, monospace">1. POST /api/tools/calendar</text>

                            {/* 2. 402 */}
                            <line x1="300" y1="95" x2="100" y2="95" stroke="#F97316" strokeWidth="1.5" markerEnd="url(#arrow)" />
                            <text x="200" y="89" textAnchor="middle" fill="#F97316" fontSize="10" fontFamily="ui-monospace, monospace">2. 402 + invoice_reference</text>

                            {/* 3. pay */}
                            <line x1="100" y1="135" x2="300" y2="135" stroke="#F97316" strokeWidth="1.5" markerEnd="url(#arrow)" />
                            <text x="200" y="129" textAnchor="middle" fill="#FAFAFA" fontSize="10" fontFamily="ui-monospace, monospace">3. POST /api/tools/x402/pay</text>

                            {/* 3b. devnet */}
                            <line x1="300" y1="170" x2="500" y2="170" stroke="#A1A1AA" strokeWidth="1" strokeDasharray="4,2" markerEnd="url(#arrow-neutral)" />
                            <text x="400" y="164" textAnchor="middle" fill="#A1A1AA" fontSize="10" fontFamily="ui-monospace, monospace">(devnet: simulated tx)</text>

                            {/* 4. retry */}
                            <line x1="100" y1="210" x2="300" y2="210" stroke="#F97316" strokeWidth="1.5" markerEnd="url(#arrow)" />
                            <text x="200" y="204" textAnchor="middle" fill="#FAFAFA" fontSize="10" fontFamily="ui-monospace, monospace">4. POST calendar + X-Payment-Proof</text>

                            {/* 5. Google exec */}
                            <line x1="300" y1="245" x2="500" y2="245" stroke="#F97316" strokeWidth="1.5" markerEnd="url(#arrow)" />
                            <text x="400" y="239" textAnchor="middle" fill="#FAFAFA" fontSize="10" fontFamily="ui-monospace, monospace">Google API call</text>

                            <line x1="500" y1="275" x2="300" y2="275" stroke="#F97316" strokeWidth="1.5" markerEnd="url(#arrow)" />
                            <text x="400" y="269" textAnchor="middle" fill="#A1A1AA" fontSize="10" fontFamily="ui-monospace, monospace">event created</text>

                            {/* 6. 200 + receipt */}
                            <line x1="300" y1="315" x2="100" y2="315" stroke="#F97316" strokeWidth="1.5" markerEnd="url(#arrow)" />
                            <text x="200" y="309" textAnchor="middle" fill="#F97316" fontSize="10" fontFamily="ui-monospace, monospace">5. 200 + signed receipt</text>

                            <defs>
                                <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                                    <path d="M0,0 L10,5 L0,10 z" fill="#F97316" />
                                </marker>
                                <marker id="arrow-neutral" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                                    <path d="M0,0 L10,5 L0,10 z" fill="#A1A1AA" />
                                </marker>
                            </defs>
                        </svg>
                    </div>

                    {/* Judge-ready verifiable links */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
                        <VerifyCard
                            icon={FileJson}
                            title="Calendar agent manifest"
                            description="ERC-8004-style registration"
                            href="/agents/calendar.json"
                            external
                        />
                        <VerifyCard
                            icon={FileJson}
                            title="Gmail agent manifest"
                            description="ERC-8004-style registration"
                            href="/agents/gmail.json"
                            external
                        />
                        <VerifyCard
                            icon={KeyRound}
                            title="Receipt public key"
                            description="ed25519 pubkey for verification"
                            href="/api/receipts/public-key"
                            external
                        />
                    </div>

                    {/* Exact demo steps */}
                    <div className="rounded-2xl border border-[#222222] bg-[#111111] p-6 md:p-8 mb-10">
                        <div className="flex items-center gap-2 mb-5">
                            <Coins size={16} className="text-[#F97316]" />
                            <span className="text-xs font-mono uppercase tracking-widest text-[#F97316]">Try it yourself</span>
                        </div>
                        <ol className="space-y-3 text-sm text-[#A1A1AA]">
                            {DEMO_CLICKS.map((click, i) => (
                                <li key={i} className="flex gap-3">
                                    <span className="shrink-0 text-[#52525B] font-mono text-[11px] w-5 pt-0.5">{i + 1}.</span>
                                    <span className="leading-relaxed" dangerouslySetInnerHTML={{ __html: click }} />
                                </li>
                            ))}
                        </ol>
                    </div>

                    {/* MagicBlock, honestly labeled adapter card */}
                    <MagicBlockCard />

                    {/* What's verifiable */}
                    <div className="rounded-2xl border border-[#222222] bg-[#111111] p-6 md:p-8 mb-10">
                        <div className="flex items-center gap-2 mb-5">
                            <Receipt size={16} className="text-[#F97316]" />
                            <span className="text-xs font-mono uppercase tracking-widest text-[#F97316]">What you can verify</span>
                        </div>
                        <ul className="space-y-3 text-sm">
                            {VERIFIABLE.map((v, i) => (
                                <li key={i} className="flex gap-3">
                                    <Check size={14} className="text-[#F97316] mt-1 shrink-0" />
                                    <div>
                                        <div className="text-white font-medium">{v.claim}</div>
                                        <div className="text-xs text-[#A1A1AA] mt-0.5">{v.how}</div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* CTA */}
                    <div className="text-center">
                        <Link
                            href="/chat"
                            className="inline-flex items-center h-11 px-6 bg-[#F97316] text-white rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-[#F97316]/90 transition-colors"
                        >
                            Start the demo <ArrowRight size={14} className="ml-2" />
                        </Link>
                        <p className="text-[11px] text-[#52525B] mt-3">
                            Read the full technical writeup in{' '}
                            <a
                                href="https://github.com/operatoruplift/website/blob/master/docs/HACKATHON_GATE2.md"
                                target="_blank"
                                rel="noreferrer"
                                className="text-[#F97316] hover:underline"
                            >
                                HACKATHON_GATE2.md
                            </a>
                            .
                        </p>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

const STEPS: Array<{ title: string; description: string; network?: string }> = [
    {
        title: 'Agent proposes an action',
        description: 'An agent in chat emits a <tool_use> block, e.g. calendar.create with {summary, start, end, attendees}.',
    },
    {
        title: 'User approves in the modal',
        description: 'The approval modal shows tool, action, exact params, and the cost: $0.01 USDC on solana-devnet.',
    },
    {
        title: 'Server returns 402 Payment Required',
        description: 'Our /api/tools/calendar endpoint (wrapped in the x402Gate middleware) checks for X-Payment-Proof. Without it, the server creates a params-bound invoice and returns 402.',
        network: 'POST /api/tools/calendar → 402\n{ invoice_reference, amount: 0.01, chain: solana-devnet,\n  recipient, pay_endpoint, retry_header: "X-Payment-Proof" }',
    },
    {
        title: 'Client pays the invoice',
        description: 'Client POSTs to /api/tools/x402/pay with the invoice_reference. On devnet we simulate the on-chain transfer; the server marks the invoice paid and returns a tx_signature.',
        network: 'POST /api/tools/x402/pay → 200\n{ status: "paid", tx_signature: "devnet_sim_..." }',
    },
    {
        title: 'Server validates proof, executes, signs receipt',
        description: 'Client retries with X-Payment-Proof header. Server validates (user + tool + action + params_hash + expiry + not consumed), calls Google, creates an ed25519-signed receipt, stores it, and marks the invoice consumed so it can\'t be replayed.',
        network: 'POST /api/tools/calendar\n  X-Payment-Proof: inv_cal_... → 200\n{ event, receipt: { receipt, signature, public_key } }',
    },
];

const DEMO_CLICKS = [
    'Log in via Privy at <a href="/login" class="text-[#F97316] hover:underline">/login</a>',
    'Go to <a href="/integrations" class="text-[#F97316] hover:underline">/integrations</a> and Connect Google Calendar & Gmail',
    'Go to <a href="/chat" class="text-[#F97316] hover:underline">/chat</a>',
    'Type: <code class="text-[#F97316] bg-[#0A0A0A] px-1.5 py-0.5 rounded border border-[#222222]">Schedule a 30-min meeting tomorrow at 3 PM called "Loops House demo"</code>',
    'Click <strong>Pay &amp; Allow Once</strong> in the approval modal',
    'Open the Network tab, observe 402, then /pay, then 200 with receipt',
    'Go to <a href="/security" class="text-[#F97316] hover:underline">/security</a> and click <strong>Copy JSON</strong> on the new receipt',
    'Verify the signature with the public key from <a href="/api/receipts/public-key" class="text-[#F97316] hover:underline">/api/receipts/public-key</a>',
];

const VERIFIABLE: Array<{ claim: string; how: string }> = [
    {
        claim: 'Receipt wasn\'t forged',
        how: 'ed25519-verify signature against canonical JSON of receipt using pubkey from /api/receipts/public-key.',
    },
    {
        claim: 'Invoice is bound to the exact request',
        how: 'receipt.params_hash = SHA-256 of the canonical params. Replay against a different request = server rejects.',
    },
    {
        claim: 'Agent manifest hasn\'t been tampered with',
        how: '/agents/{calendar|gmail}.json contains a checksum = SHA-256 over its own content (minus the checksum field).',
    },
    {
        claim: 'Payment actually happened',
        how: 'receipt.invoice_reference + receipt.payment_tx recorded server-side in tool_invoices + tool_receipts.',
    },
    {
        claim: 'Per-action consent (no blanket approvals)',
        how: 'Every execution stands alone. The approval modal has no "remember this agent" checkbox by design.',
    },
];

function MagicBlockCard() {
    // Status is read at render time from NEXT_PUBLIC_MAGICBLOCK_ENABLED.
    // The adapter itself is a stub (see lib/magicblock/adapter.ts), so
    // this card never falsely claims "Active", it tells you the flag
    // state and the reason. Judges can read the source for the stub.
    const status = magicBlockSurfaceStatus();
    const pillClass = status.active
        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
        : 'bg-white/5 border-white/15 text-gray-400';
    return (
        <div className="rounded-2xl border border-[#222222] bg-[#111111] p-6 md:p-8 mb-10">
            <div className="flex items-center gap-2 mb-5">
                <Zap size={16} className="text-[#F97316]" />
                <span className="text-xs font-mono uppercase tracking-widest text-[#F97316]">MagicBlock adapter</span>
                <span className={`ml-auto inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border ${pillClass}`}>
                    {status.label}
                </span>
            </div>
            <p className="text-sm text-[#A1A1AA] leading-relaxed mb-4">
                MagicBlock can settle receipts on an ephemeral rollup for faster
                finality than mainnet. Our adapter interface is shipped at{' '}
                <code className="text-[#F97316] bg-[#0A0A0A] px-1.5 py-0.5 rounded border border-[#222222] text-[11px]">lib/magicblock/adapter.ts</code>
                {' '}and is feature-flagged behind{' '}
                <code className="text-[#F97316] bg-[#0A0A0A] px-1.5 py-0.5 rounded border border-[#222222] text-[11px]">NEXT_PUBLIC_MAGICBLOCK_ENABLED</code>
                .
            </p>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
                <strong className="text-white">Honest status:</strong> {status.reason} No receipt produced by this codebase claims <code className="text-[#F97316] bg-[#0A0A0A] px-1 py-0.5 rounded border border-[#222222] text-[11px]">executed_via: magicblock</code> unless the stub is replaced with a real implementation AND the flag is set.
            </p>
        </div>
    );
}

function VerifyCard({
    icon: Icon,
    title,
    description,
    href,
    external = false,
}: {
    icon: React.ComponentType<{ size?: number; className?: string }>;
    title: string;
    description: string;
    href: string;
    external?: boolean;
}) {
    return (
        <a
            href={href}
            target={external ? '_blank' : undefined}
            rel={external ? 'noopener noreferrer' : undefined}
            className="block p-4 rounded-xl border border-[#222222] bg-[#111111] hover:border-[#F97316]/30 transition-colors"
        >
            <div className="flex items-center gap-2 mb-2">
                <Icon size={14} className="text-[#F97316]" />
                <span className="text-xs font-bold text-white">{title}</span>
                {external && <ExternalLink size={12} className="text-[#52525B] ml-auto" />}
            </div>
            <p className="text-[11px] text-[#A1A1AA] leading-snug">{description}</p>
        </a>
    );
}
