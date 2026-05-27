import Link from 'next/link';
import { BRAGA_TESTNET, PROJECT_ATTRIBUTE } from '@/lib/arkiv';
import { listAgents } from '@/lib/arkiv/agent';

export const dynamic = 'force-dynamic';

/**
 * Public Arkiv demo page.
 *
 * Surface for the Arkiv challenge entrant requirement plus the
 * judge-facing walkthrough. Loads the agent registry from Arkiv
 * Braga at request time so judges see live on-chain data rather than
 * a build snapshot.
 *
 * Honest-status: when Arkiv has no agents yet (e.g., before the
 * operator funds the wallet and runs the mint script) the page
 * surfaces an explicit "no entities yet" state instead of fabricating
 * results. Same hide-when-NULL contract Filecoin / 0G use on
 * /security.
 *
 * Does not auth-gate: the entire Arkiv data layer is public, so
 * judges shouldn't need a sign-in to see it.
 */

interface AgentRow {
    entityKey: string;
    slug: string;
    version: string;
    checksum: string;
    publishedAt: number;
    explorerUrl: string;
}

async function loadAgents(): Promise<{ agents: AgentRow[]; error: string | null }> {
    try {
        const agents = await listAgents();
        return { agents, error: null };
    } catch (err) {
        const message = err instanceof Error ? err.message : 'unknown';
        return { agents: [], error: message };
    }
}

export default async function ArkivPage() {
    const { agents, error } = await loadAgents();

    return (
        <main data-always-dark className="min-h-screen bg-[#0A0A0A] text-[#FAFAFA]">
            <section className="max-w-5xl mx-auto px-6 pt-16 pb-12">
                <div className="flex items-center gap-3 mb-6">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.25em] text-[#F08A4C] bg-[#F08A4C]/10 border border-[#F08A4C]/30 px-2.5 py-1 rounded">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#F08A4C]" />
                        Arkiv challenge entrant
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.25em] text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/30 px-2.5 py-1 rounded">
                        Theme: AI
                    </span>
                </div>

                <h1 className="text-4xl md:text-5xl font-medium tracking-tight mb-4">
                    Agents whose memory you actually own.
                </h1>
                <p className="text-[#A1A1AA] leading-relaxed max-w-2xl">
                    Every agent identity card and every memory event Operator Uplift writes lives on
                    the public Arkiv Braga testnet, scoped by a unique{' '}
                    <code className="bg-[#1A1A1A] border border-[#222] text-[#F08A4C] px-1.5 py-0.5 rounded text-sm">
                        {PROJECT_ATTRIBUTE.key}={PROJECT_ATTRIBUTE.value}
                    </code>{' '}
                    attribute. The platform never owns your memory: <code>$owner</code> can be
                    transferred to your own wallet and the platform loses the ability to update or
                    delete it. <code>$creator</code> is immutable, so the audit trail can never be
                    rewritten.
                </p>
            </section>

            <section className="max-w-5xl mx-auto px-6 pb-12 grid md:grid-cols-3 gap-4">
                <NetworkCard label="Network" value={BRAGA_TESTNET.name} />
                <NetworkCard label="Chain ID" value={String(BRAGA_TESTNET.chainId)} mono />
                <NetworkCard label="RPC" value={BRAGA_TESTNET.rpcUrl} mono small />
            </section>

            <section className="max-w-5xl mx-auto px-6 pb-12">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xs font-mono uppercase tracking-widest text-[#F08A4C]">
                        Entity 1 / Agent identity cards
                    </h2>
                    <span className="text-xs text-[#525252] font-mono">
                        {agents.length === 0 ? 'no entities published yet' : `${agents.length} on Arkiv`}
                    </span>
                </div>

                {error ? (
                    <div className="bg-[#1A1A1A] border border-[#3A3A3A] rounded-lg p-6 text-sm text-[#A1A1AA]">
                        <p className="text-[#F08A4C] font-bold mb-2">Arkiv read error</p>
                        <p>
                            The on-Arkiv agent list could not be loaded. This is expected before the
                            operator funds the wallet and runs the publish script. Once entities are
                            written, this section populates automatically.
                        </p>
                        <p className="mt-3 font-mono text-xs text-[#525252]">{error}</p>
                    </div>
                ) : agents.length === 0 ? (
                    <div className="bg-[#1A1A1A] border border-[#222] rounded-lg p-6 text-sm text-[#A1A1AA]">
                        <p>
                            No agent identity cards have been published to Arkiv yet. The publish
                            script (<code>scripts/arkiv-publish-agents.mjs</code>) writes each
                            agent&apos;s manifest as an Arkiv entity once the wallet is funded.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {agents.map((a) => (
                            <a
                                key={a.entityKey}
                                href={a.explorerUrl}
                                target="_blank"
                                rel="noreferrer noopener"
                                className="block bg-[#1A1A1A] hover:bg-[#1F1F1F] border border-[#222] hover:border-[#F08A4C]/40 rounded-lg p-4 transition-colors"
                            >
                                <div className="flex items-center justify-between gap-4 mb-2">
                                    <div className="flex items-center gap-3">
                                        <span className="text-base font-medium">{a.slug}</span>
                                        <span className="text-[10px] font-mono uppercase tracking-widest bg-[#F08A4C]/10 border border-[#F08A4C]/30 text-[#F08A4C] px-1.5 py-0.5 rounded">
                                            v{a.version}
                                        </span>
                                    </div>
                                    <span className="text-xs text-[#525252] font-mono">
                                        view on Braga explorer →
                                    </span>
                                </div>
                                <div className="text-xs text-[#737373] font-mono break-all">
                                    checksum {a.checksum}
                                </div>
                            </a>
                        ))}
                    </div>
                )}
            </section>

            <section className="max-w-5xl mx-auto px-6 pb-12">
                <h2 className="text-xs font-mono uppercase tracking-widest text-[#F08A4C] mb-4">
                    Entity 2 / Memory events
                </h2>
                <div className="bg-[#1A1A1A] border border-[#222] rounded-lg p-6 text-sm text-[#A1A1AA] space-y-3">
                    <p>
                        Each conversation turn between a user and one of our agents writes a{' '}
                        <code className="bg-[#0A0A0A] border border-[#222] text-[#F08A4C] px-1.5 py-0.5 rounded">
                            memory-event
                        </code>{' '}
                        entity to Arkiv. The attributes index the rows so the next turn loads
                        context with a single query:
                    </p>
                    <pre className="text-xs font-mono text-[#A1A1AA] bg-[#0A0A0A] border border-[#222] rounded p-3 overflow-x-auto">{`GET /api/arkiv/memories?agent=calendar&session=<sessionId>`}</pre>
                    <p>
                        The page that uses this data is the existing <code>/chat</code> surface; the
                        Arkiv layer adds nothing the user has to opt into.
                    </p>
                </div>
            </section>

            <section className="max-w-5xl mx-auto px-6 pb-16 flex flex-wrap gap-3">
                <Link
                    href="/demo/hackathon"
                    className="inline-flex items-center h-10 px-5 bg-[#F08A4C] text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-[#F08A4C]/90"
                >
                    Trust stack demo
                </Link>
                <a
                    href={BRAGA_TESTNET.explorer}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center h-10 px-5 border border-[#3A3A3A] text-[#FAFAFA] rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-[#1F1F1F]"
                >
                    Braga explorer
                </a>
                <a
                    href={BRAGA_TESTNET.faucet}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center h-10 px-5 border border-[#3A3A3A] text-[#FAFAFA] rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-[#1F1F1F]"
                >
                    Braga faucet
                </a>
                <Link
                    href="/api/arkiv/agents"
                    className="inline-flex items-center h-10 px-5 border border-[#3A3A3A] text-[#FAFAFA] rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-[#1F1F1F]"
                >
                    Raw agents API
                </Link>
            </section>
        </main>
    );
}

function NetworkCard({
    label,
    value,
    mono,
    small,
}: {
    label: string;
    value: string;
    mono?: boolean;
    small?: boolean;
}) {
    return (
        <div className="bg-[#1A1A1A] border border-[#222] rounded-lg p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#737373] mb-1">
                {label}
            </p>
            <p
                className={`${mono ? 'font-mono' : ''} ${small ? 'text-xs break-all' : 'text-sm'} text-[#FAFAFA]`}
            >
                {value}
            </p>
        </div>
    );
}
