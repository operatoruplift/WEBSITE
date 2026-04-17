# Operator Uplift — Developer Console

## Role
Internal debug surface. Exposes a view of the capability state, the canned-reply router, the tool registry, and live `/api/*` request logs for the founder and ops team. Never shipped to users.

## Must not touch
- Consumer landing or `/chat` UI — that's `website/bucharest`.
- Production Supabase writes. This is a read-only console over real data + simulated test harness.

## May 14 priorities (in order)
1. Capability state inspector — paste a Privy JWT, see the three flags resolve live.
2. Canned-reply tester — type any user message, see which beat it matches and which `<tool_use>` it emits.
3. Tool registry view — every tool's tier + requires + comingSoon flag.
4. `/api/chat` request viewer (dev-only) with demo-vs-real branch highlighted.

## Verification
- `npm run dev` serves the console on localhost.
- Paste a known token → flags match the production `/api/capabilities` response.
- No production secrets committed to the repo.

## Current state snapshot
- Shipped: local dev server, token paste + inspect flow.
- In-flight: capability inspector, canned-reply tester.
- Deferred post-May-15: real-time Supabase query viewer, Solana tx explorer embed.
