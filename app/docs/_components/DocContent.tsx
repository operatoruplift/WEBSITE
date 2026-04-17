import React from 'react';

/**
 * Doc content map — one TSX block per slug in lib/docs/sections.ts.
 *
 * Keep content honest. Every claim here must correspond to shipped
 * behaviour. Verification commands and file paths should be real.
 */

const CONTENT: Record<string, React.ReactNode> = {
    'getting-started': (
        <>
            <p className="lead">Operator Uplift is a personal AI operator for your inbox and calendar. Every action waits for your Approve click, and every real action leaves a signed receipt.</p>
            <h2>Try it in 60 seconds</h2>
            <ol>
                <li>Open <a href="/chat">/chat</a>. No signup required.</li>
                <li>Type one of: <em>&quot;What&apos;s on my calendar today?&quot;</em>, <em>&quot;Draft replies to these 3 emails&quot;</em>, or <em>&quot;Schedule an iMessage nudge for tomorrow morning.&quot;</em></li>
                <li>The Approve modal shows. Click Approve — you&apos;ll see a Simulated chip on the result. No real email was sent.</li>
                <li>Want real execution? Sign in with Google at <a href="/integrations">/integrations</a>. The orange Demo pill turns green and says Real.</li>
            </ol>
            <h2>What ships today</h2>
            <ul>
                <li>Anonymous Demo mode on <code>/chat</code> with canned replies for three consumer beats.</li>
                <li>Google Calendar and Gmail tools behind per-action approval.</li>
                <li>ed25519 signed receipts on <a href="/security">/security</a>, Merkle root published to Solana devnet every five actions.</li>
                <li>Daily 8am calendar briefing (opt-in from <a href="/profile">/profile</a>).</li>
                <li>Tier 1 tools that don&apos;t need Google: web search, web fetch, notes, tasks, reminders.</li>
            </ul>
        </>
    ),
    'demo-vs-real': (
        <>
            <p className="lead">Two user-visible states. Nothing in between.</p>
            <h2>Demo (simulated)</h2>
            <p>Demo mode activates when you are logged out, or logged in without either Google connected or an LLM API key on the server. You see an orange <strong>Demo · Simulated</strong> pill at the top of <code>/chat</code>.</p>
            <ul>
                <li>Every chat reply is a deterministic canned response. Zero LLM spend.</li>
                <li>Every tool approval returns a mock result labelled <code>Simulated</code>. Nothing is sent, booked, or charged.</li>
                <li>No Supabase writes. No receipt. No rate-limit cost to you beyond <code>10 requests per hour per IP</code>.</li>
            </ul>
            <h2>Real</h2>
            <p>Real mode activates when you are authenticated (Privy) AND <code>capability_real = capability_google || capability_key</code> is true. Green <strong>Real</strong> pill with a sub-label showing which capability is active.</p>
            <ul>
                <li>Chat uses the real LLM. Supabase persists the thread.</li>
                <li>Approve triggers a real API call to Google (Calendar/Gmail) or whichever Tier 2 tool you have connected.</li>
                <li>Every successful action produces an ed25519 receipt and lands in <a href="/security">/security</a>.</li>
            </ul>
            <h2>The rule we never break</h2>
            <blockquote>Never claim real execution unless it truly ran. Demo mode never produces a receipt.</blockquote>
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
                <li>Every parameter the agent wants to send — recipient, subject, body, event time, attendees.</li>
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
            <pre><code>{`{
  "user_id": "did:privy:...",
  "tool": "calendar",
  "action": "create",
  "params_hash": "sha256:...",
  "invoice_reference": "inv_cal_...",
  "payment_tx": "devnet_sim_...",
  "executed_at": "2026-04-17T09:15:22Z",
  "receipt_id": "rec_...",
  "signature": "<ed25519 over canonical JSON>",
  "public_key": "<server pubkey>"
}`}</code></pre>
            <h2>Verifying a receipt</h2>
            <ol>
                <li>Fetch the public key from <a href="/api/receipts/public-key">/api/receipts/public-key</a>.</li>
                <li>Canonicalise the receipt (everything except the <code>signature</code> field).</li>
                <li>Verify the ed25519 signature of the canonical JSON with that public key.</li>
                <li>If the signature checks, the receipt is authentic. If it doesn&apos;t, we faked it and you caught us.</li>
            </ol>
            <h2>Merkle root and Solana devnet</h2>
            <p>Every five receipts, the server computes a Merkle root and publishes it via our Anchor <code>publish_root</code> program on Solana devnet. That gives you a public commitment that makes silently-rewriting history detectable. See <a href="/blog/audit-trail">the audit-trail post</a> for the full pipeline.</p>
        </>
    ),
    'x402': (
        <>
            <p className="lead">x402 is an HTTP payment standard. A server can answer <code>402 Payment Required</code> with an invoice; the client pays, then retries with proof. We use it for paid tool calls.</p>
            <h2>Flow</h2>
            <ol>
                <li><code>POST /api/tools/calendar</code> — server returns <code>402</code> with <code>invoice_reference</code> and pay endpoint.</li>
                <li><code>POST /api/tools/x402/pay</code> with that reference — devnet simulates the on-chain transfer and marks the invoice paid.</li>
                <li>Client retries the original request with <code>X-Payment-Proof</code> header.</li>
                <li>Server validates the proof and executes the tool. Receipt lands in <a href="/security">/security</a>.</li>
            </ol>
            <h2>Why MCPay-compatible</h2>
            <p>We conform to MCPay (<code>github.com/microchipgnu/MCPay</code>) so any MCP-aware agent can pay our gate without custom glue. The invoice format, the pay endpoint, and the retry header are their names, not ours.</p>
            <h2>What this enables (post-May-15)</h2>
            <p>Third-party agents can pay us per-call for privileged execution. We can pay third parties for their tools too. The plumbing is the same in both directions.</p>
        </>
    ),
    'integrations': (
        <>
            <p className="lead">What you can connect today. What&apos;s coming next.</p>
            <h2>Shipped</h2>
            <ul>
                <li><strong>Google Calendar</strong> — list events, find free slots, create events.</li>
                <li><strong>Gmail</strong> — list messages, draft replies, send on approval.</li>
            </ul>
            <p>Connect both at <a href="/integrations">/integrations</a>. We store the refresh token in <code>user_integrations</code> on Supabase; the service-role key never leaves the server.</p>
            <h2>Tier 1 tools (no connection needed)</h2>
            <ul>
                <li>Web search (via server-held Serper or Brave key).</li>
                <li>Web fetch (reads any public URL, strips scripts and returns readable text).</li>
                <li>Notes, tasks, reminders — stored in Supabase per user.</li>
            </ul>
            <h2>Post-May-15 (registered, coming soon)</h2>
            <p>Slack, Linear, Jira, Notion, GitHub, Drive, Stripe checkout, SMS. All listed in the tool registry as <code>comingSoon: true</code> so they appear in the picker with Approve disabled until we ship them.</p>
        </>
    ),
    'troubleshooting': (
        <>
            <p className="lead">If something isn&apos;t working, this is where to start.</p>
            <h2>&ldquo;Demo rate limit reached&rdquo; on /chat</h2>
            <p>Anonymous visitors are capped at 10 requests per hour per IP. Sign in with Google or add an API key to move to the authenticated limits.</p>
            <h2>Approval modal is greyed out with &ldquo;Coming post-May-15&rdquo;</h2>
            <p>You hit a Tier 2 tool that&apos;s registered but not yet wired (Slack, Linear, etc). Pick a Tier 1 tool or wait for the post-launch drop.</p>
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
