# Demo day walkthrough

Use this on the day of (2026-05-14). Walks every public surface a judge
or first-time visitor will actually touch, with the **exact** thing to
look for, the **exact** thing that would be wrong, and the **fastest
fix** if it is wrong.

Companion to `docs/demo-day-execution-checklist.md` (operator setup +
recording) and `docs/demo-recording-script.md` (the 90-second beat
sheet). This file is the visual / copy verification pass.

## Order

Walk the surfaces in the order a cold visitor would encounter them, so
the verification mirrors the actual reader journey.

### 1. Homepage `/`

Open `https://operatoruplift.com` in a fresh incognito window.

| Section | Look for | Wrong if | Fix |
|---|---|---|---|
| **Hero** | "AI that runs on your terms." headline, "Sign in and connect Gmail" + "Watch 90s demo" buttons | Headline missing, buttons broken | Check `src/sections/Hero.tsx` + `src/services/dataService.ts::APP_CONTENT.hero` |
| **HowItWorks** | 4 numbered cards, "From sign-in to first action in under a minute" title | Section missing, fewer than 4 steps | PR #559 added this. Check `src/sections/HowItWorks.tsx` |
| **LocalFirst** | "Your data, your keys, your audit log", 4-step flow, "Signed audit trail" trust card naming Filecoin | Filecoin missing from trust card body | PR #536 added Filecoin mention; verify `src/sections/LocalFirst.tsx` `TRUST_SIGNALS[2].body` |
| **LocalFirst Built On strip** | Solana, Vercel, Supabase, Photon, Filecoin, ElevenLabs (all "shipping"); Base + Ethereum with "Soon" pill | Filecoin or ElevenLabs marked "Soon" | PR #515 + #516 flipped them. Check `src/sections/LocalFirst.tsx` strip |
| **Channels** | iMessage "Shipping" pill, Telegram + WhatsApp "Ready" pills, no Slack/Discord | Slack or Discord visible | Removed in PR #513. Check `src/sections/Channels.tsx` |
| **Comparison** | Operator Uplift vs. niche peers (Zo / Poke / Hermes / OpenClaw), Solana audit log row, Filecoin mirror row | Filecoin row missing, ChatGPT/Claude back as columns | PR #489 + #542 locked this. Check `src/sections/Comparison.tsx` |
| **Pricing** | Free (Try the demo), Pro $50/mo USDC (Start Pro), Team "Custom" with "Book a call" CTA | Team shows $299 | PR #558 dropped $299. Check `src/sections/Pricing.tsx` |
| **FAQ** | 9 questions including "What's a signed receipt and why should I care?" | Signed-receipt Q missing | PR #564 added it. Check `src/sections/FAQ.tsx` |
| **FinalCta** | "AI that runs on your terms." + "Start free" CTA pointing at /login | CTA broken | Check `src/sections/FinalCta.tsx` |
| **Cookie banner** | Bottom-right region with Accept/Decline | Missing or unlabeled | PR #553 added `role="region"` + aria-label |

### 2. `/blog`

| Item | Look for | Wrong if | Fix |
|---|---|---|---|
| **Header** | Centered "Blog & Changelog" eyebrow + h1 + lede | Left-aligned, off-axis next to featured card | PR (in batch) re-centered. Check `app/blog/page.tsx` header block |
| **Featured post** | "Balaji told me to pivot. I didn't. Here's why." | Filecoin/ElevenLabs post is featured instead | Set `featured: true` on balaji entry in `app/blog/posts.ts` |
| **Grid** | 14 cards in the grid (15 total - 1 featured = 14) | Fewer than 14 | None of the 15 posts should be deleted |
| **Filecoin post title** | "Receipts now have a public backup nobody can edit, not even us" | Old "Your receipts no longer live only on our servers" | PR #557 retitled. Check `app/blog/posts.ts` |
| **Filecoin post body** | Opens with "Your assistant sent a follow-up email last Tuesday." Structure: What was already true, What was missing, What changed | Old structure | PR #557 rewrote. Check `app/blog/[id]/page.tsx` |

### 3. `/imessage`

| Item | Look for | Wrong if | Fix |
|---|---|---|---|
| **Channels shipping pill** | iMessage marked as shipping today | Removed | Check `app/imessage/page.tsx` |
| **How the round trip works** | Step 2 says "Our iMessage bridge forwards" (NOT "Photon Spectrum POSTs") | Old "Spectrum" jargon | PR #560 cleaned. Check `app/imessage/page.tsx:77` |
| **What's not here yet** | "Our message bridge already handles Telegram and WhatsApp" (NOT "The Spectrum bridge already speaks") | Old "Spectrum" jargon | PR #560 cleaned. Check `app/imessage/page.tsx:120, 126` |

### 4. `/security` (sign in first)

This is the trust-pillar surface. Judges will click here.

| Item | Look for | Wrong if | Fix |
|---|---|---|---|
| **Signed by line** | "Signed by operatoruplift.sol, resolves on-chain to the public key above." (note: NO space before the comma) | Stray space, "operatoruplift.sol , resolves" | PR #547 fixed. Check `app/(dashboard)/security/page.tsx:258-265` |
| **Filecoin sub-line** | "Each receipt is also mirrored to Filecoin; click any filecoin: link below to verify the bytes on a public IPFS gateway." | Missing | PR #515 added. Check `app/(dashboard)/security/page.tsx:272-275` |
| **Receipt rows** | Each row has tool.action + amount badge + tx + filecoin: link (when cron has fired) | filecoin: link missing on EVERY row | Trigger `/api/cron/filecoin-anchor` manually. Check FILECOIN_PROVIDER + LIGHTHOUSE_API_KEY env vars |
| **Public Key link** | Top-right, opens `/api/receipts/public-key` in new tab | 404 | Public allowlist in middleware.ts. PR #501. |

### 5. `/docs`

| Item | Look for | Wrong if | Fix |
|---|---|---|---|
| **Getting Started page** | "ed25519 signed receipts on /security, Merkle root published to Solana devnet every five actions, and a Filecoin mirror of every receipt via a public IPFS gateway." | Filecoin missing from the bullet | PR #537 added. Check `app/docs/_components/DocContent.tsx:25` |
| **Sidebar Receipts entry summary** | "ed25519 signatures, Merkle roots on Solana, Filecoin mirror via IPFS gateway." | Old "and Solana devnet publishes" only | PR #539 fixed. Check `lib/docs/sections.ts` |
| **x402 doc** | "What this enables next" heading (NOT "post-May-15") | Old date-rotted heading | PR #543 fixed |

### 6. `/demo/hackathon` (judge surface)

| Item | Look for | Wrong if | Fix |
|---|---|---|---|
| **Hero** | "x402 + ERC-8004, working end-to-end" headline | Different | Don't change pre-demo |
| **Verify cards** | 4 cards: Sequence diagram, Agent manifest, Receipt public key, **Signed receipts on Filecoin** (-> /security) | Filecoin card missing | PR #516 added. Check `app/demo/hackathon/page.tsx` |
| **DEMO_CLICKS** | "Log in via Privy" step references /login | /login broken | Check `app/(auth)/login/page.tsx` (PR #462 made it fail-closed in prod) |
| **VERIFIABLE list** | Includes "Every signed receipt is also pushed to Filecoin via Lighthouse..." | Filecoin verification step missing | PR #516 added |

### 7. Mobile (open Chrome DevTools, switch to mobile breakpoint 320 px)

| Surface | Look for | Wrong if | Fix |
|---|---|---|---|
| Hamburger nav | Opens menu, screen reader announces "Open menu, button, collapsed" | aria-expanded missing | PR #552 added |
| HowItWorks | Stacks to 1 column cleanly | Cards overflow | PR #559 grid is responsive |
| Comparison table | Horizontal scroll affordance (right-edge gradient) | Cells wrap badly | Already responsive |
| Cookie banner | Appears bottom-right (or full-width on mobile) | Position broken | PR #553 |

## Pre-demo env checklist (operator runs)

These must be set on Vercel before judges click:

- [ ] `FILECOIN_PROVIDER=lighthouse` + `LIGHTHOUSE_API_KEY=...`
- [ ] `ELEVENLABS_API_KEY=...` (for the recording, optional but referenced in deck)
- [ ] `PHOTON_PROJECT_ID` + `PHOTON_API_KEY` (iMessage agent)
- [ ] `ANTHROPIC_API_KEY` (assistant fallback)
- [ ] `GOOGLE_OAUTH_CLIENT_ID` + secret + redirect URI + state secret
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `RECEIPT_SIGNING_PRIVATE_KEY` + `RECEIPT_SIGNING_PUBLIC_KEY`
- [ ] `CRON_SECRET` (for the manual cron trigger below)

Then trigger the Filecoin cron once so `/security` has at least one
`filecoin: <cid>...` link:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://www.operatoruplift.com/api/cron/filecoin-anchor
```

## What we deliberately are NOT showing today

If a judge asks about any of these, the answer is "deferred, here is
why":

- **Tauri desktop binary** — `desktop/tauri.conf.json` exists, `src-tauri/` doesn't. Web app is the canonical surface.
- **Mainnet Solana** — devnet only today; audit gate before mainnet.
- **Cross-chain (Base, Ethereum)** — labeled "Soon" on the Built on strip. x402 buyer client not wired.
- **Slack and Discord** — not on the Channels section. Roadmap only.
- **0G integration** — deferred per `docs/0g-integration-decision.md`. Persistent Memory is the only piece we'd revisit.
- **Deposit-to-credit usage pricing** — the original wedge. Multi-PR refactor, deferred per `docs/deck-objections.md` "Slides to cut" + "Slides now OK".

## Time budget for the walkthrough

- Sections 1-3 (public marketing): 8 minutes
- Section 4 (/security, requires login): 5 minutes
- Section 5 (/docs): 3 minutes
- Section 6 (/demo/hackathon judge): 4 minutes
- Section 7 (mobile): 5 minutes
- Env + cron trigger: 5 minutes

Total ~30 minutes. Run it once with coffee in hand before the demo.
