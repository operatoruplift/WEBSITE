# Operator Uplift — x402 Agent

## Role
MCPay-compatible payment gate for premium tool calls. Sits between `website/bucharest` and tool backends: returns 402 + invoice reference on first call, accepts `X-Payment-Proof` header on retry, records the payment on Solana devnet.

## Must not touch
- Chat UI, ApprovalModal copy, sidebar — that's `website/bucharest`.
- Tool business logic (calendar, gmail) — that's `calendar_agent/cambridge`.
- Demo-mode path at all — demo traffic never hits this gate. Only real capability_real=true requests do.

## May 14 priorities (in order)
1. Conform to MCPay protocol (`github.com/microchipgnu/MCPay`). Do not invent a parallel rail.
2. Devnet-only for May 14. Real USDC mainnet is a post-May-15 scope.
3. Invoice reference must survive a round-trip to `/api/tools/x402/pay` and be validated by the tool retry.
4. Log every paid request into the Solana audit trail so `/security` can render receipts end to end.

## Verification
- `tests/x402-gate.spec.ts` in `website/bucharest` passes.
- Smoke: `calendar.create` → 402 → pay → retry with proof → 200.
- `/security` ledger shows a row with Merkle root and devnet tx hash.

## Current state snapshot
- Shipped: 402 flow + invoice reference + retry with proof + devnet tx publish.
- In-flight: MCPay spec alignment, better error body on malformed proofs.
- Deferred post-May-15: mainnet USDC, Stripe fallback, per-tier pricing.
