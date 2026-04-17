# Operator Uplift — Core (Python FastAPI)

## Role
Python FastAPI runtime. Hosts `demo_service`, `compliance_service`, `models_service`, and the agent registration layer. Runs as a sidecar in the DMG app (bundled as a local process) and standalone in staging for the web to call during demos.

## Must not touch
- Next.js, TypeScript, Supabase client code — that's `website/bucharest`.
- Tauri shell — that's `webview/san-francisco`. This repo provides the FastAPI binary; Tauri embeds it.
- UI components — none live here.

## May 14 priorities (in order)
1. Demo service returns canned model responses locally so the DMG can run offline. Must match the web's canned-reply shape for the 3 beats.
2. Compliance service returns deterministic answers for HIPAA/SOC2/GDPR attestations (these are real claims; wording must be accurate).
3. Models service supports Ollama + one cloud fallback; server-held keys only, never leaks to the client.
4. Stable REST surface — DMG and web both depend on the same JSON shapes.

## Verification
- `pytest` passes.
- `uvicorn main:app --port 8000` boots without error.
- `curl localhost:8000/demo/briefing` returns a shape identical to `website/bucharest/lib/cannedReplies.ts`.

## Current state snapshot
- Shipped: demo_service, compliance_service, models_service, permissions_stub, rate_limit.
- In-flight: alignment with the 3-beat canned-reply shape.
- Deferred post-May-15: Rust rewrite, session isolation pattern from claw-code.
