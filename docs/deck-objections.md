# Demo-day deck + objection handling

Wave 7 deliverable. The four-part pitch, eight memorized objection answers, the surface map for the deck, and the final story alignment.

## The pitch (under 30 seconds, read out loud)

> "Operator Uplift drafts the emails and schedules the meetings you've been putting off, and never sends or books anything until you tap yes. You keep the tap. The bot keeps the receipts. And because every action is signed on Solana, you can prove what happened, even after a model swap or a tool change. Pro is $50 a month, no per-action fees, cancel any time. Consumer first. Same trust layer scales to the enterprise paperwork later."

Mapped to the brief's four parts:

1. **What you get**: drafts your email, schedules your meetings.
2. **Why trust**: nothing irreversible without your tap; signed receipts; on-chain audit; receipts mirrored to two public networks (Filecoin via IPFS + 0G testnet via the indexer); agent identity cards independently published to Arkiv Braga testnet as a third tamper-proof verifier surface.
3. **What integrations do**: read Gmail, write Gmail draft, create Calendar event, store receipts on Solana, mirror receipts to Filecoin AND 0G Storage testnet, publish agent identity cards to Arkiv (user-ownable memory entities live there too), identify the agent via SNS + (optional) ERC-7857 Intelligent NFT on 0G Galileo Testnet.
4. **How monetization works**: Pro is $50/month, gas on us (no per-action surcharge to the user), Team pricing is custom (book a call). Server-side every write goes through an x402 micropayment on Solana so the receipt chain is real; that cost is on us, not the user.

## Objection answers (under 30 words each, memorize)

| Objection | Answer |
|---|---|
| Isn't this just Claude plus prompts? | Claude doesn't read your Gmail, schedule your meetings, or sign a receipt. We do, with your tap as the trigger. |
| Why not just use ChatGPT? | ChatGPT can't fire a Gmail send, write to your Calendar, or prove what it did. Plus you can use ChatGPT inside Operator Uplift; pick GPT-5.5 in the model dropdown. |
| Why does local-first matter? | When Anthropic ships a new Claude or you decide to switch to GPT, the bot forgets you. Local-first means the context is yours, not the model's. |
| Why Solana? | Two reasons: server-side x402 micropayments per tool call don't work on a card (we pay them so you don't see them). And every action signs to an on-chain receipt anyone can verify, not just our database. |
| Why would anyone pay? | Because the alternative is typing the same email twice. Pro is $50 a month, gas on us, cancel any time. Use it as much as you want; no per-action surcharge. |
| How is this different from a plugin? | A plugin runs inside one model's UI. We run across iMessage, web, and your inbox, with one consent gate and one receipt trail. |
| What if the model changes? | Switch the model in the dropdown. Memory, integrations, and receipts stay. That is the entire pitch. |
| What makes the demo real? | The Gmail draft you'll see is in a real Gmail account. The phone is a real phone. The receipt has an ed25519 signature you can verify with our public-key endpoint. |

## Slides to keep (7 max)

1. **Hero + tagline**: "AI that runs on your terms." One CTA: Sign in and connect Gmail.
2. **Approval-before-action**: three-step diagram (You ask -> Bot drafts -> You tap, then it sends).
3. **Tool execution today**: Gmail draft + send (live), Calendar create (live), more on the way.
4. **Trust layer**: SNS-anchored signer identity, ed25519 receipts, public-key verification endpoint, **three-network** trust stack (Filecoin via IPFS + 0G Storage testnet via indexer + Arkiv Braga testnet for agent identity cards and user-ownable memory entities), optional ERC-7857 Intelligent NFT for on-chain agent identity.
5. **Monetization**: Pro $50/month, gas on us, no per-action user surcharge. Team pricing is custom (book a call). Server-side x402 on Solana is what proves the receipt chain; users see a subscription, not a meter.
6. **Channel-agnostic**: iMessage shipping, Telegram + WhatsApp ready (Spectrum). Slack + Discord aren't on the marketing surface anymore (trimmed from the Channels section per the "make work or remove" rule); they come back when wired.
7. **Roadmap**: real-Gmail tool execution from iMessage (already shipping), enterprise OAuth tenant, audit dashboards.

## Slides to cut

- **"Trusted by" logo wall**: there is no proof of company adoption. Replace with the "Built on the model you already pay for" marquee, which is honest.
- **Multiple consumer-vs-enterprise pillars**: lead with consumer wedge. Mention enterprise as expansion in one bullet on the monetization slide.
- **Tauri / desktop screen**: `desktop/tauri.conf.json` exists but `src-tauri/` doesn't. Don't show a desktop binary that isn't building.
- **Repeated model logos in the hero**: the `Built on the model you already pay for` marquee already covers the model menu. Don't double-place.

## Slides now OK to ship (post PR #515)

- **Filecoin slide** is back on the table. Every signed receipt anchors to a Filecoin CID via the cron at `/api/cron/filecoin-anchor`; a judge can fetch `https://<cid>.ipfs.dweb.link` and verify the bytes match what `/api/receipts/public-key` signs. See `docs/filecoin-decision.md` "Shipped" section.
- **0G Storage second-mirror slide** is on the table too (post PRs #569-#577). Same per-receipt anchor pattern, second public network. Sister cron at `/api/cron/og-anchor`; public verifier passthrough at `/api/og/storage/[rootHash]`. See `docs/0g-integration-decision.md`.
- **0G AgenticID (ERC-7857) bullet** is OK to use as an additive trust signal — say "agent identities are also wired to mint as ERC-7857 Intelligent NFTs on 0G Galileo Testnet; the `og_agent_id` field surfaces a chainscan link once we mint." Be honest that mint requires a funded faucet wallet (operator-side).
- **ElevenLabs voiceover** is also fine to use for the recording narration. The endpoint at `/api/voice/synth` is what generated it. Still NOT a product pillar; one mention max if asked.

## Final story alignment

| Element | Website | Product | Demo | Deck |
|---|---|---|---|---|
| iMessage agent | `/imessage` page, hero CTA, Channels section | `/integrations` verify card, full agent loop | live (5-step sequence in `docs/demo-recording-script.md`) | central, slide 1 + 3 |
| Gmail / Calendar | Channels section, `/integrations` integrations grid | `/integrations` Connect button | step 4 (draft) + step 5 (Gmail visible) | slide 3 |
| Solana + signed receipts | LocalFirst section | `/api/tools/x402/pay` + signed receipts on `/security` | step 5 fall-through if time permits | slide 4 |
| SNS identity on receipts | nowhere | `/security` receipts header | only if showing slide 4 substance | one bullet on slide 4 |
| Photon Spectrum | implicit | webhook + adapter | invisible plumbing | one logo bullet on slide 6 |
| Telegram / WhatsApp | Channels section with status pills | platform-agnostic, no separate code | not in demo | slide 6 (channel-agnostic) |
| Slack / Discord | not on the marketing surface (trimmed from Channels per "make work or remove" rule) | not implemented | not in demo | cut from the deck until wired |
| Anthropic / OpenAI / Gemini / Grok / DeepSeek | `Built on the model you already pay for` marquee | `/chat` model picker | implicit | slide 1 footer ("Built on") |
| Llama / Ollama | not on the marquee (would-be hosted-API claim, but local-only via Ollama path in `lib/llm.ts:189`) | not in `/chat` picker (desktop app required) | not in demo | one optional roadmap bullet on slide 7 only if asked |
| Filecoin | LocalFirst "Built on" strip (Shipping) | `tool_receipts.filecoin_cid` + cron at `/api/cron/filecoin-anchor` + "View on Filecoin" link on `/security` | judge clicks the IPFS gateway URL from `/security` to verify bytes match `/api/receipts/public-key` | one bullet on slide 4 (durability + independence) |
| 0G Storage | LocalFirst "Built on" strip (Shipping) | `tool_receipts.og_storage_root_hash` + cron at `/api/cron/og-anchor` + `0g: <rootHash>` link on `/security` → `/api/og/storage/[rootHash]` | judge clicks the `0g:` link, lands on JSON envelope with indexer endpoint + verify-it-yourself instructions | same slide 4 bullet as Filecoin (two-network archive) |
| 0G AgenticID (ERC-7857) | not yet on marketing strip | `lib/og/agent-id.ts` + `data/og-agent-ids.json` + mint script + optional `og_agent_id` field on `/agents/{slug}.json` | once minted, judge opens `chainscan-galileo.0g.ai` to see the Intelligent NFT with hashed identity data | one bullet on slide 4 (on-chain agent identity), honest about mint-pending status |
| Arkiv (ETHLisbon AI theme) | LocalFirst "Built on" strip (Shipping) | `lib/arkiv/` + `/api/arkiv/agents` + `/api/arkiv/memories` + `/arkiv` demo + `scripts/arkiv/publish-agents.mjs` | judge curls `/api/arkiv/agents` (no auth) for the on-chain agent card list, then clicks any `entityKey` through to `explorer.braga.hoodi.arkiv.network` to verify the bytes match `/agents/{slug}.json` | one bullet on slide 4 (third tamper-proof verifier + user-ownable memory). Honest empty state until operator funds `ARKIV_PRIVATE_KEY` and runs the publish script. |
| ElevenLabs | LocalFirst "Built on" strip (Shipping) | `/api/voice/synth` endpoint, auth-gated | narration MP3 used in the recording | recording credit only; not a product slide |
| Tauri / desktop | mentioned in `/imessage` "What's not here yet" block | `desktop/tauri.conf.json` only | not in demo | cut |
| Base / Ethereum | not added | not added | not in demo | cut (one chain story) |
| MagicBlock | not surfaced | flag-gated, off by default | not in demo | one optional bullet on slide 4 only if asked |
| Pricing model | homepage Pricing section | `/paywall` (currently $50/month Pro subscription; Team pricing is custom via Book-a-call; deposit-to-credit pivot deferred) | not in demo | slide 5 |

## What stays "roadmap" honestly

If a feature is labeled `roadmap` in code (via `src/sections/Channels.tsx` status pills, `app/(dashboard)/integrations/page.tsx` `coming_soon` status, or the `/imessage` "What's not here yet" block), do NOT promote it to live in the deck. The honesty is the wedge. Examples:

- Slack / Discord: trimmed from the Channels section entirely per the "make work or remove" rule. Don't claim they ship and don't promote them on the deck until they actually do.
- Calendar event from iMessage: ships (PR #451). OK to claim.
- Gmail draft from iMessage: ships (PR #446). OK to claim.
- Gmail send from iMessage: ships (PR #452). OK to claim.
- Daily summary across model swaps: ships (PR #455). OK to claim.
- Tauri desktop binary: does NOT ship (`src-tauri/` missing). Don't claim.
- Filecoin storage: ships (PR #515). OK to claim. Each receipt has a `filecoin_cid` visible on `/security` once the cron has run. See `docs/filecoin-decision.md` "Shipped" section.
- 0G Storage mirror: ships (PR #569 + #570). OK to claim. Each receipt gets an `og_storage_root_hash` visible as a `0g:` link on `/security` once `/api/cron/og-anchor` runs (operator triggers manually with `CRON_SECRET`). See `docs/0g-integration-decision.md`.
- 0G AgenticID (ERC-7857) Intelligent NFTs: scaffolded (PRs #571 + #574). OK to claim **conditionally** — say "the mint script is shipped, the persistence file ships with `null` tokenIds, and the JSON manifest's `og_agent_id` field is omitted until we fund a Galileo testnet wallet and run the script." Do NOT claim that tokens are already minted unless `data/og-agent-ids.json` has been updated with real tokenIds.

## What the demo will actually prove

Three things the audience will see, all live or recorded from live:

1. A real iPhone texts a real bot's iMessage number.
2. The bot creates a real Gmail draft (visible in a real Gmail account).
3. A signed receipt for the draft action exists on `/security`, with `operatoruplift.sol` linked next to the public-key endpoint.

If those three artifacts can be produced on stage or in the recording, the entire pitch is provable. If any one fails, fall to the simulator path in `docs/demo-recording-script.md`.
