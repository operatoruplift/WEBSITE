# Build Context — Operator Uplift

## Stack

### Workspace 1: x402 Agent (biarritz) — ALREADY BUILT
- **Status:** 53 files, full implementation exists
- **Tech:** TypeScript, @solana/web3.js, Express, better-sqlite3
- **Components:** x402 client (intercept 402, parse header, construct tx), x402 server (Express middleware), wallet management, SQLite payment ledger, demo services, CLI
- **Next step:** Integrate into bucharest — wire the x402 client into the tool-call system so agents can pay for premium MCP tools

### Workspace 2: On-Chain Audit Trail — SCAFFOLDED
- **Status:** Anchor program written, not yet compiled (Anchor CLI not installed)
- **Tech:** Rust, Anchor 0.30, Solana
- **Architecture:** AuditTrail PDA per user, stores Merkle root of action hashes
- **Instructions:** initialize (create PDA), publish_root (authority-gated, overwrites root)
- **Location:** `/workspaces/core/guangzhou/programs/audit-trail/`
- **Next step:** Install Anchor CLI (`cargo install --git https://github.com/coral-xyz/anchor avm`), then `anchor build && anchor test`

### Workspace 3: Scheduled Agent Runner — SCAFFOLDED
- **Status:** Full TypeScript service scaffolded, ready to install + run
- **Tech:** TypeScript, node-cron, googleapis, web-push, @supabase/supabase-js
- **Architecture:** Cron scheduler with job system, morning briefing as first job
- **Location:** `/workspaces/core/guangzhou/services/scheduler/`
- **Next step:** `cd services/scheduler && npm install && npm run dev`

### Main Product: bucharest (website)
- **Status:** Deployed, 28 pages, 16 API routes, real Google OAuth, tool-call approval, Privy auth
- **Skills installed:** 181 (ECC + Superstack + Colosseum Copilot + Surf)
- **MCPs configured:** None yet (all API calls go through Next.js API routes)

## Architecture Decisions
- **Auth:** Privy (Google, GitHub, Solana wallet) — replaced Supabase email/password
- **Payment:** Solana Pay (0.1 SOL early access gate) — separate from Privy auth
- **Tool governance:** `<tool_use>` blocks in LLM output → ToolApprovalModal → executeToolCall → audit log
- **Audit:** localStorage audit log (current) → on-chain Merkle root (Workspace 2, pending)
- **Retention:** Morning calendar briefing cron (Workspace 3, pending)
- **Agent payments:** x402 client (Workspace 1, built, needs integration)

## Build Status
- mvp_complete: true (bucharest deployed, DMG built)
- tests_passing: false (no E2E tests yet — use `/e2e-testing` to generate)
- devnet_deployed: false (audit trail program not yet deployed)

## Milestones Completed (build-with-claude session)
1. ✅ Scheduler: npm install, TypeScript compiles, cron registers, config validates (needs Supabase env vars in production)
2. ✅ x402 bridge: lib/x402/client.ts + /api/tools/x402 route + tool type registered in toolCalls.ts
3. ✅ Anchor audit trail: Rust source compiles (cargo check passes, 0 errors), ready for `anchor build` when CLI is installed
