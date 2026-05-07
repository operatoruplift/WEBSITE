# pay.sh + solana.new integration plan

Status: design doc. No code shipped yet. Decide which paths to wire.

## What's already in this repo (the x402 base we don't have to rebuild)

Operator Uplift already implements the seller side of the x402 protocol:

- `lib/x402/receipts.ts` - ed25519-signed receipts for every paid action.
- `lib/x402/invoices.ts` - canonical JSON for hashing.
- `app/api/tools/x402/pay/route.ts` - the gate that mints a 402 challenge and verifies the proof.
- `app/api/receipts/public-key` - exposes the public key so anyone can verify a receipt without trusting the server.
- `/security` page renders the receipt list with the SNS-anchored signer identity (`operatoruplift.sol`).

What we **do not** have today: a way for the agent to **buy** access to someone else's paid API. That's the gap pay.sh and the broader x402 ecosystem fill.

## What pay.sh actually is

`brew install pay`. Solana Foundation + Google Cloud, launched 2026-05-06.

- A CLI wrapper that detects HTTP 402 challenges, signs a Solana proof, and retries.
- Stores a wallet in macOS Keychain / GNOME Keyring / Windows Hello / 1Password.
- Has subcommands like `pay --sandbox curl ...`, `pay setup`, `pay topup`.
- Built on the same x402 protocol Coinbase incubated.
- Exposes a Model Context Protocol (MCP) integration via `pay setup --update`, so Claude Code and Cursor can use it as a tool.

It is **not** a server library. It binds to a local OS keychain. A Vercel serverless function cannot invoke it directly.

## The two integrations worth doing, separately

### Path A: pay.sh as the operator's local dev tool (zero code, takes 10 minutes)

Goal: when the operator (you) needs to test a paid API during development, route the call through pay.sh on your laptop.

Steps:

1. Already done: `brew install pay`.
2. Run `pay setup` once, fund the wallet via `pay topup` with $5 USDC on devnet.
3. Run `pay setup --update` to register the pay.sh MCP with Claude Code, so when you ask Claude Code to "fetch the Gemini Vision API for image X", the agent uses pay.sh instead of needing a Google API key.
4. Use `pay --sandbox curl https://api.example.com/...` from any local terminal during dev. The CLI prints the receipt CID after.

What this does not do: nothing in production. It only helps the dev loop.

### Path B: server-side x402 client so the iMessage agent can buy paid APIs (real wiring, ~1 hour of code)

Goal: when an iMessage user asks `summarize the front page of the New York Times`, the agent calls a paid news API via x402 with a server-held Solana wallet. No human in the loop.

The npm path that matches pay.sh's behavior:

```bash
pnpm add @x402/fetch @x402/svm @solana/kit @scure/base
```

Wallet provisioning (one-time, server side):

```bash
solana-keygen new --no-bip39-passphrase --outfile ~/.config/operatoruplift/x402-buyer.json
# Copy the base58 secret into Vercel as SVM_PRIVATE_KEY
# Fund the public key with $5 USDC on devnet to start
```

Server-side client (proposed `lib/paysh/client.ts`):

```ts
import { x402Client, wrapFetchWithPayment } from '@x402/fetch';
import { registerExactSvmScheme } from '@x402/svm/exact/client';
import { createKeyPairSignerFromBytes } from '@solana/kit';
import { base58 } from '@scure/base';

let cached: typeof fetch | null = null;

export async function paidFetch(): Promise<typeof fetch> {
    if (cached) return cached;
    if (!process.env.SVM_PRIVATE_KEY) {
        throw new Error('SVM_PRIVATE_KEY missing - x402 client not configured');
    }
    const signer = await createKeyPairSignerFromBytes(
        base58.decode(process.env.SVM_PRIVATE_KEY),
    );
    const client = new x402Client();
    registerExactSvmScheme(client, { signer });
    cached = wrapFetchWithPayment(fetch, client);
    return cached;
}
```

Call site (proposed integration into the agent intent matchers, behind a flag):

```ts
const fetchPaid = await paidFetch();
const res = await fetchPaid('https://api.weatherpro.example/v1/forecast?city=Austin');
const data = await res.json();
```

Risk + mitigation:

- **Funded wallet at risk if leaked**: keep the private key out of git, only in Vercel server-side env. Cap the wallet at $5 USDC and refill with `pay topup` when low.
- **Per-request runaway cost**: wrap `paidFetch` with a per-day spend ceiling (read a counter from Supabase, refuse calls past $1/day until reset). I can ship that helper alongside the client if you want.
- **Latency**: each x402 call adds a Solana signing round-trip (~50-200ms on devnet). Not a blocker for chat; reconsider for hot paths.

Concrete first endpoints worth wiring once Path B is live:

| API | Cost per call | Why |
|---|---|---|
| Gemini Vision | ~$0.001 | iMessage user sends a photo, bot describes it |
| Anthropic Claude (via x402-gated proxy) | varies | drop-in for `ANTHROPIC_API_KEY` flow |
| BigQuery (small queries) | varies | "summarize this CSV from a URL" |
| Vertex AI search | varies | grounded answers without a Google search account |

## What solana.new actually is

`curl -fsSL https://www.solana.new/setup.sh | bash`. AI-powered scaffolding CLI for new Solana projects. Provides:

- 100+ skills, MCPs, CLIs targeted at Claude Code, Cursor, Codex.
- Protocol integrations: Jupiter, Phantom, Helius, Meteora.
- Workflow phases: Idea -> Build -> Launch -> Raise.

It is a **dev-environment tool**, not a runtime SDK. It accelerates building a new dApp from scratch. We already have a shipped Solana stack (receipts + SNS + x402 receipts), so the integration story is narrower:

### What solana.new is good for in this repo

- Run the install once on the operator's dev box. The MCPs become available to Claude Code when working inside this repo.
- Use it the next time a new Solana subsystem is needed. Examples that would benefit: a Helius-backed wallet observer for the receipt-spending wallet from Path B, or a Jupiter-backed swap if a user wants to top up the x402 wallet with non-USDC tokens.
- Skip it for code that already exists. Don't regenerate receipts/SNS/x402 with solana.new templates - we have working code.

### What solana.new is not

- Not a runtime dependency. The agent on Vercel never calls into solana.new.
- Not a replacement for the existing x402 / Solana code. It's a code-generation accelerator, not a library.

## Recommended sequencing

1. **This week (Path A, low risk)**: operator runs `pay setup` + `pay setup --update` locally. Use pay.sh from Claude Code during dev. Run `solana.new/setup.sh` once on the dev box.
2. **Next 1-2 weeks (Path B, real product)**: ship `lib/paysh/client.ts` behind a `X402_BUYER_ENABLED` flag. Wire one paid endpoint end-to-end (Gemini Vision is the most legible demo). Add the per-day spend ceiling.
3. **After demo day**: open the buyer wallet to power users. Surface "powered by pay.sh + Solana micropayments" as a real differentiator on /security.

## What this doc deliberately doesn't do

- Doesn't ship code. Path B is a 1-hour PR but the cost ceiling design needs a 10-minute review first.
- Doesn't wire pay.sh into the iMessage agent yet. The agent already has Anthropic via `ANTHROPIC_API_KEY`; switching that to pay.sh is a bigger swap than a demo-day-relevant change.
- Doesn't claim solana.new generated any of our existing code. Our Solana stack predates solana.new.

## Sources

- [Solana and Google Cloud Launch Pay.sh for AI Agent Micropayments - BanklessTimes](https://www.banklesstimes.com/articles/2026/05/06/solana-and-google-cloud-launch-pay-sh-for-ai-agent-micropayments/)
- [Solana Foundation Launches Pay.sh in Collaboration with Google Cloud - Solana](https://solana.com/news/solana-foundation-launches-pay-sh-in-collaboration-with-google-cloud)
- [pay.sh install docs](https://pay.sh/docs/get-started/install/index.md)
- [pay.sh: Call paid APIs](https://pay.sh/docs/pay-for-apis/call-paid-apis/index.md)
- [@x402/fetch on npm](https://www.npmjs.com/package/@x402/fetch)
- [x402 fetch TypeScript example - x402-foundation](https://github.com/x402-foundation/x402/tree/main/examples/typescript/clients/fetch)
- [x402-solana on npm](https://www.npmjs.com/package/x402-solana)
- [x402 Quickstart for Buyers - Coinbase Developer Docs](https://docs.cdp.coinbase.com/x402/quickstart-for-buyers)
- [solana.new homepage](https://www.solana.new/)
