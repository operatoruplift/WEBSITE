import React from 'react';
import Link from 'next/link';

/**
 * Doc content map, one TSX block per slug in lib/docs/sections.ts.
 *
 * Keep content honest. Every claim here must correspond to shipped
 * behaviour. Verification commands and file paths should be real.
 */

const CONTENT: Record<string, React.ReactNode> = {
    'getting-started': (
        <>
            <p className="lead">Operator Uplift is commitment infrastructure. You declare a goal with money on the line, an AI Game Master runs your daily check-ins, and the protocol settles your stake on-chain when you honor or miss the commitment.</p>
            <h2>Get started</h2>
            <ol>
                <li><strong>Declare.</strong> Join the waitlist at <a href="/waitlist">/waitlist</a>. When the next cohort opens, you&apos;ll get an invite to set your first commitment with stake size and check-in cadence.</li>
                <li><strong>Stake.</strong> Lock money against the goal. Miss a check-in and the stake is forfeit. Honor it and the stake comes back to you with the streak intact.</li>
                <li><strong>Honor.</strong> The AI Game Master pings you on the cadence you specified. Reply YES, NO, or upload a photo as evidence. The mobile apps (iOS + Android, coming soon) will be the primary check-in surface.</li>
                <li><strong>Watch.</strong> Each settled check-in produces an ed25519-signed receipt. Anchored on-chain so you can verify the streak record independently.</li>
            </ol>
            <h2>What ships today</h2>
            <ul>
                <li>The protocol UI is in pre-launch. The waitlist accepts signups and the engineering primitives below are live and verifiable today.</li>
                <li>ed25519 signed receipts, Merkle root published to Solana devnet every five actions, and two parallel public-storage mirrors (Filecoin via IPFS + 0G testnet via the indexer) so the receipt bytes outlive our database. The same rail will carry commitment settlements when the product opens.</li>
                <li>Agent identity cards and (opt-in) user-ownable session memories on Arkiv Braga testnet. Listed at <a href="/arkiv">/arkiv</a>; the bytes mirror <a href="/agents/calendar.json">/agents/calendar.json</a> and <a href="/agents/gmail.json">/agents/gmail.json</a>. The entity list reflects the live state and stays empty until the operator funds the Braga wallet and runs the publish script.</li>
                <li>The legacy AI-assistant web surfaces (chat, integrations, profile, security, swarm) and the /app, /agents, /workflows, /memory, /settings, /onboarding, /analytics, /notifications, /marketplace dashboards have all been retired (PRs #696 + #709). Each route still resolves and renders a polite retired-surface card so external links never 404, but the marketing happy path is the commitment-infrastructure homepage. The dashboard /goals route stays as the only product surface until the mobile apps ship.</li>
            </ul>
        </>
    ),
    'approvals': (
        <>
            <p className="lead">Approvals are retired. This page documents the per-action consent modal that shipped with the prior AI-assistant product; the commitment-infrastructure product has a different consent surface.</p>
            <h2>What was built (historical)</h2>
            <p>The AI-assistant product surfaced a modal for every write action (calendar event create, gmail draft, gmail send). The modal showed the tool name, action, risk pill (LOW/MEDIUM/HIGH), every parameter, and a Cost block in Real mode. Approval was per-call: no &ldquo;always allow&rdquo; option, because a blanket approval can be weaponised by a future prompt injection.</p>
            <h2>How the new product handles consent</h2>
            <p>The commitment-infrastructure product asks for consent twice: once when you set the commitment + lock the stake, and once when you upload proof for a check-in. There is no agent emitting write actions on your behalf, the user is the actor, the AI Game Master only adjudicates uploaded evidence and streams reasoning back. The escrow lock and the upload step are both deliberate, single-click actions in the mobile app when it ships.</p>
            <p>The trust-stack guarantees (ed25519 signed verdicts, Solana audit roots, Filecoin + 0G mirrors) survive the brand reframe.</p>
        </>
    ),
    'receipts': (
        <>
            <p className="lead">A receipt is a small signed JSON blob that proves a specific action happened with specific parameters on a specific account at a specific time.</p>
            <h2>Shape</h2>
            <p>Two layers: an inner <code>ReceiptPayload</code> (what gets signed) and an outer <code>SignedReceipt</code> envelope (the signature + the pubkey beside it).</p>
            <pre><code>{`{
  "receipt": {
    "receipt_reference": "rcpt_cal_1700000000000_abcd1234",
    "timestamp": "2026-04-17T09:15:22.000Z",
    "user_id": "did:privy:...",
    "agent_id": null,
    "tool": "calendar",
    "action": "create",
    "params_hash": "sha256-...",
    "result_hash": "sha256-...",
    "invoice_reference": "inv_cal_...",
    "amount_usdc": 0.01,
    "chain": "solana-devnet",
    "payment_tx": "devnet-sim"
  },
  "signature": "<base64 ed25519 over canonical JSON of receipt>",
  "public_key": "<base64 raw 32-byte ed25519 pubkey>"
}`}</code></pre>
            <h2>Verifying a receipt</h2>
            <ol>
                <li>Fetch the public key from <a href="/api/receipts/public-key">/api/receipts/public-key</a> (returns the same base64 32-byte pubkey as the <code>public_key</code> field).</li>
                <li>Canonicalise the inner <code>receipt</code> object (sort keys, no whitespace). Don&apos;t include <code>signature</code> or <code>public_key</code> &mdash; only the inner payload.</li>
                <li>Verify the ed25519 signature of the canonical JSON with that public key. The <code>signature</code> field is base64-encoded.</li>
                <li>If the signature checks, the receipt is authentic. If it doesn&apos;t, we faked it and you caught us.</li>
            </ol>
            <h2>Independent verification via two storage networks</h2>
            <p>Each receipt row on <a href="/demo/hackathon">/demo/hackathon</a> renders <strong>two</strong> independent public-archive links so a single provider outage cannot break verification:</p>
            <ul>
                <li><code>filecoin: &lt;cid&gt;</code> via the cron at <code>/api/cron/filecoin-anchor</code> (Lighthouse provider). Click it to fetch the same <code>SignedReceipt</code> JSON at <code>https://&lt;cid&gt;.ipfs.dweb.link</code>.</li>
                <li><code>0g: &lt;rootHash&gt;</code> via the sister cron at <code>/api/cron/og-anchor</code> (0G Storage testnet, Turbo indexer). Click it to land on <code>/api/og/storage/[rootHash]</code>, our public verifier passthrough returning a JSON envelope with the rootHash + indexer endpoint + verification instructions.</li>
            </ul>
            <p>The bytes on each network are byte-identical to the bytes our server signed; if either doesn&apos;t match what <a href="/api/receipts">/api/receipts</a> returns, something has been tampered with. Both networks are <strong>provenance</strong>, not the source of truth. The ed25519 signature in step 3 above is what proves authenticity. The two mirrors prove the bytes are public + immutable + independently retrievable from whichever network is up.</p>
            <h2>Optional on-chain agent identity (ERC-7857)</h2>
            <p>Each agent has an additional identity surface: an ERC-7857 <strong>Intelligent NFT</strong> on 0G Galileo Testnet (0G AgenticID standard). The agent JSON at <a href="/agents/calendar.json">/agents/calendar.json</a> exposes an optional <code>og_agent_id</code> field whose <code>explorer_url</code> points at the token on <code>chainscan-galileo.0g.ai</code> once a tokenId has been minted. The on-chain <code>IntelligentData[]</code> array carries SHA-256 hashes of the agent&apos;s name, description, capabilities, system prompt, and model. Until the operator funds the mint wallet at <code>https://faucet.0g.ai</code> and runs <code>scripts/og-agent-id-mint.mjs</code>, the field is omitted from the JSON: the deploy never claims a tokenId it does not have.</p>
            <h2>Merkle root and Solana devnet</h2>
            <p>Every five receipts, the server computes a Merkle root and publishes it via our Anchor <code>publish_root</code> program on Solana devnet. That gives you a public commitment that makes silently-rewriting history detectable. See <Link href="/blog/audit-trail">the audit-trail post</Link> for the full pipeline.</p>
        </>
    ),
    'x402': (
        <>
            <p className="lead">x402 is an HTTP payment standard: a server answers <code>402 Payment Required</code> with an invoice, the client pays, then retries with proof. Operator Uplift shipped an x402 gate as part of the prior AI-assistant product. This page documents what was built; the commitment-infrastructure product uses a different settlement path.</p>
            <h2>What was built (historical, AI-assistant era)</h2>
            <ol>
                <li><code>POST /api/tools/calendar</code> or <code>/api/tools/gmail</code>, server returns <code>402</code> with an <code>invoice_reference</code> and pay endpoint.</li>
                <li><code>POST /api/tools/x402/pay</code> with that reference, devnet simulated the on-chain transfer and marked the invoice paid.</li>
                <li>Client retried the original request with <code>X-Payment-Proof</code> header.</li>
                <li>Server validated the proof and executed the tool. Receipt anchored as a signed ed25519 envelope.</li>
            </ol>
            <p>The flow was MCPay-compatible so MCP-aware agents could pay the gate without custom glue.</p>
            <h2>How commitment-infrastructure settles instead</h2>
            <p>The new product locks user stakes in escrow when a commitment is declared, then either returns the stake or redistributes it to the pool when the AI Game Master adjudicates a check-in. There is no per-tool-call invoice; there is a per-commitment settlement at the end of the cycle. The same ed25519 signing + Solana Merkle root + Filecoin/0G mirroring primitives carry forward as the trust stack.</p>
            <p>The retired x402 tool routes (<code>/api/tools/calendar</code>, <code>/api/tools/gmail</code>, <code>/api/tools/x402/pay</code>) still exist in the codebase but are no longer the marketing happy path. The retired dashboard surfaces (PR #696, PR #709) bypass them entirely.</p>
        </>
    ),
    'integrations': (
        <>
            <p className="lead">Integrations are retired. This page stays as a historical reference; the live product no longer connects to Gmail, Calendar, iMessage, or other third-party tools.</p>
            <h2>What changed</h2>
            <p>The Operator Uplift AI-assistant product (May 2026 and earlier) wired Google Calendar + Gmail behind a Privy-authenticated session, with per-action approval modals and ed25519-signed receipts. The commitment-infrastructure product that replaced it on 2026-05-22 uses uploaded proof (photo, GPS, integration ping, short note) as the verification surface, not server-side tool execution.</p>
            <p>The dashboard route that hosted Gmail + Calendar connections was retired in PR #696. The route still resolves and renders a polite retired-surface card so external links never 404.</p>
            <h2>What you connect today</h2>
            <p>Nothing on the web. Check-ins happen in the iOS and Android apps when they ship; until then, the homepage waitlist captures your interest. The mobile apps will host any future integrations.</p>
            <h2>For developers + reviewers</h2>
            <p>The trust-stack primitives are unchanged: ed25519 signed receipts, Solana devnet Merkle roots every five receipts, Filecoin + 0G Storage mirrors, Arkiv user-owned agent memory. See the verifier cookbook at <a href="/demo/hackathon">/demo/hackathon</a>.</p>
        </>
    ),
    'troubleshooting': (
        <>
            <p className="lead">If something isn&apos;t working, this is where to start.</p>
            <h2>&ldquo;I can&apos;t connect Google / I can&apos;t use the chat&rdquo;</h2>
            <p>The /chat, /integrations, and related AI-assistant dashboards were retired on 2026-05-22. The routes resolve to a polite retired-surface card so external links never 404, but they no longer expose the connect flow. The commitment-infrastructure product replaces them; join the waitlist at <a href="/waitlist">/waitlist</a> for early access to the mobile apps.</p>
            <h2>&ldquo;Where did my agent / workflow / memory go?&rdquo;</h2>
            <p>The /app, /agents, /workflows, /memory, /settings, /onboarding, /analytics, /notifications, /marketplace dashboards were retired in PR #709. The only remaining product surface is /goals, dark-themed, while the iOS + Android apps are built.</p>
            <h2>Verifying a receipt independently</h2>
            <p>The trust-stack primitives are unchanged. For the full verifier cookbook, see <a href="/demo/hackathon">/demo/hackathon</a>: ed25519 signed receipts, Solana devnet Merkle root every five receipts, Filecoin (via Lighthouse) + 0G Storage (via Turbo indexer) mirrors.</p>
            <h2>Where are the logs?</h2>
            <ul>
                <li>Vercel: <code>vercel logs &lt;deployment&gt;</code>.</li>
                <li>Supabase: <code>logs</code> schema via the dashboard.</li>
                <li>Client: browser console + <code>localStorage[&quot;ou-audit-log&quot;]</code> (legacy AI-assistant audit log).</li>
            </ul>
        </>
    ),
};

export function DocContent({ slug }: { slug: string }) {
    const body = CONTENT[slug];
    if (!body) {
        return (
            <div className="docs-prose">
                <p>This page hasn&apos;t been written yet.</p>
            </div>
        );
    }
    return <div className="docs-prose">{body}</div>;
}
