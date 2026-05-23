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
            <p className="lead">Every write action stands alone. The agent reads freely. It cannot act until you click Approve.</p>
            <h2>What triggers a modal</h2>
            <p>Anything the agent emits as a <code>&lt;tool_use&gt;</code> block with a side-effect. Create calendar event, draft or send email, schedule a reminder, post to Slack (when that ships). Reads are automatic. Writes are gated.</p>
            <h2>What the modal shows</h2>
            <ul>
                <li>The tool and action being called.</li>
                <li>A risk pill: LOW, MEDIUM, HIGH. Gmail sends are always HIGH.</li>
                <li>Every parameter the agent wants to send, recipient, subject, body, event time, attendees.</li>
                <li>In Real mode with a paid tool: a Cost block showing the USDC amount and the chain.</li>
                <li>In Demo mode: a gray Simulated chip and footer text explaining nothing will actually run.</li>
            </ul>
            <h2>Why no &ldquo;always allow&rdquo; option</h2>
            <p>A blanket approval can be weaponised by a future prompt injection. Every action stands on its own. You approve once, then again next time. The friction is the feature.</p>
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
            <p>Each receipt row on <a href="/security">/security</a> renders <strong>two</strong> independent public-archive links so a single provider outage cannot break verification:</p>
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
            <p className="lead">x402 is an HTTP payment standard. A server can answer <code>402 Payment Required</code> with an invoice; the client pays, then retries with proof. We use it for paid tool calls.</p>
            <h2>Flow</h2>
            <ol>
                <li><code>POST /api/tools/calendar</code>, server returns <code>402</code> with <code>invoice_reference</code> and pay endpoint.</li>
                <li><code>POST /api/tools/x402/pay</code> with that reference, devnet simulates the on-chain transfer and marks the invoice paid.</li>
                <li>Client retries the original request with <code>X-Payment-Proof</code> header.</li>
                <li>Server validates the proof and executes the tool. Receipt lands in <a href="/security">/security</a>.</li>
            </ol>
            <h2>Why MCPay-compatible</h2>
            <p>We conform to MCPay (<code>github.com/microchipgnu/MCPay</code>) so any MCP-aware agent can pay our gate without custom glue. The invoice format, the pay endpoint, and the retry header are their names, not ours.</p>
            <h2>What this enables next</h2>
            <p>Third-party agents can pay us per-call for privileged execution. We can pay third parties for their tools too. The plumbing is the same in both directions.</p>
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
            <h2>&ldquo;Demo rate limit reached&rdquo; on /chat</h2>
            <p>Anonymous visitors are capped at 10 requests per hour per IP. Sign in with Google or add an API key to move to the authenticated limits.</p>
            <h2>&ldquo;Google not connected&rdquo; after I connected it</h2>
            <p>The refresh token may have expired or been revoked. Go to <a href="/integrations">/integrations</a> and click Reconnect. If it still fails, check the Google security page for revoked app access.</p>
            <h2>I don&apos;t see my receipt on /security</h2>
            <p>Receipts only exist for real tool executions. If you approved a Simulated call, nothing will appear. Also: Merkle roots publish every five receipts, so a newly-created receipt may take a moment to show a root.</p>
            <h2>Where are the logs?</h2>
            <ul>
                <li>Vercel: <code>vercel logs &lt;deployment&gt;</code>.</li>
                <li>Supabase: <code>logs</code> schema via the dashboard.</li>
                <li>Client: browser console + <code>localStorage[&quot;ou-audit-log&quot;]</code>.</li>
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
