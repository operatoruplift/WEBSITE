# Demo-day deck + objection handling

Wave 7 deliverable. The four-part pitch, eight memorized objection answers, the surface map for the deck, and the final story alignment.

## The pitch (under 30 seconds, read out loud)

> "Operator Uplift drafts the emails and schedules the meetings you've been putting off, and never sends or books anything until you tap yes. You keep the tap. The bot keeps the receipts. And because every action is signed on Solana, you can prove what happened, even after a model swap or a tool change. Pay $50 once, get $50 of work done, refill when you want. Consumer first. Same trust layer scales to the enterprise paperwork later."

Mapped to the brief's four parts:

1. **What you get**: drafts your email, schedules your meetings.
2. **Why trust**: nothing irreversible without your tap; signed receipts; on-chain audit.
3. **What integrations do**: read Gmail, write Gmail draft, create Calendar event, store receipts on Solana, identify the agent via SNS.
4. **How monetization works**: $50 USDC deposit, $0.01 per write action, refundable, no subscription.

## Objection answers (under 30 words each, memorize)

| Objection | Answer |
|---|---|
| Isn't this just Claude plus prompts? | Claude doesn't read your Gmail, schedule your meetings, or sign a receipt. We do, with your tap as the trigger. |
| Why not just use ChatGPT? | ChatGPT can't fire a Gmail send, write to your Calendar, or prove what it did. Plus you can use ChatGPT inside Operator Uplift; pick GPT-5.5 in the model dropdown. |
| Why does local-first matter? | When Anthropic ships a new Claude or you decide to switch to GPT, the bot forgets you. Local-first means the context is yours, not the model's. |
| Why Solana? | Two reasons: $0.01 micropayments per tool call don't work on a card. And every action signs to an on-chain receipt anyone can verify, not just our database. |
| Why would anyone pay? | Because the alternative is typing the same email twice. The deposit is $50 once, refundable, and tracks to actual work done. |
| How is this different from a plugin? | A plugin runs inside one model's UI. We run across iMessage, web, and your inbox, with one consent gate and one receipt trail. |
| What if the model changes? | Switch the model in the dropdown. Memory, integrations, and receipts stay. That is the entire pitch. |
| What makes the demo real? | The Gmail draft you'll see is in a real Gmail account. The phone is a real phone. The receipt has an ed25519 signature you can verify with our public-key endpoint. |

## Slides to keep (7 max)

1. **Hero + tagline**: "Stop typing the same email twice." One CTA: Sign in and connect Gmail.
2. **Approval-before-action**: three-step diagram (You ask -> Bot drafts -> You tap, then it sends).
3. **Tool execution today**: Gmail draft + send (live), Calendar create (live), more on the way.
4. **Trust layer**: SNS-anchored signer identity, ed25519 receipts, public-key verification endpoint.
5. **Monetization**: deposit-to-credit, $50 USDC minimum, $0.01 per write action, refundable.
6. **Channel-agnostic**: iMessage shipping, Telegram + WhatsApp ready (Spectrum), Slack + Discord on the roadmap.
7. **Roadmap**: real-Gmail tool execution from iMessage (already shipping), enterprise OAuth tenant, audit dashboards.

## Slides to cut

- **Filecoin slide**: there is no Filecoin code in the product. Don't claim what isn't shipped. (See `docs/filecoin-decision.md`.)
- **ElevenLabs slide**: voice is not a product feature. The demo voiceover may use ElevenLabs but that is presentation, not pillar.
- **"Trusted by" logo wall**: there is no proof of company adoption. Replace with the "Built on the model you already pay for" marquee, which is honest.
- **Multiple consumer-vs-enterprise pillars**: lead with consumer wedge. Mention enterprise as expansion in one bullet on the monetization slide.
- **Tauri / desktop screen**: `desktop/tauri.conf.json` exists but `src-tauri/` doesn't. Don't show a desktop binary that isn't building.
- **Repeated model logos in the hero**: the `Built on the model you already pay for` marquee already covers the model menu. Don't double-place.

## Final story alignment

| Element | Website | Product | Demo | Deck |
|---|---|---|---|---|
| iMessage agent | `/imessage` page, hero CTA, Channels section | `/integrations` verify card, full agent loop | live (5-step sequence in `docs/demo-recording-script.md`) | central, slide 1 + 3 |
| Gmail / Calendar | Channels section, `/integrations` integrations grid | `/integrations` Connect button | step 4 (draft) + step 5 (Gmail visible) | slide 3 |
| Solana + signed receipts | LocalFirst section | `/api/tools/x402/pay` + signed receipts on `/security` | step 5 fall-through if time permits | slide 4 |
| SNS identity on receipts | nowhere | `/security` receipts header | only if showing slide 4 substance | one bullet on slide 4 |
| Photon Spectrum | implicit | webhook + adapter | invisible plumbing | one logo bullet on slide 6 |
| Telegram / WhatsApp | Channels section with status pills | platform-agnostic, no separate code | not in demo | slide 6 (channel-agnostic) |
| Slack / Discord | roadmap pill on Channels section | not implemented | not in demo | slide 7 (roadmap), single line |
| Anthropic / OpenAI / Gemini / Grok / DeepSeek / Llama / Ollama | `Built on the model you already pay for` marquee | `/chat` model picker | implicit | slide 1 footer ("Built on") |
| Filecoin | cut from hero | not implemented | not in demo | cut |
| ElevenLabs | cut | not implemented | demo voiceover only | cut |
| Tauri / desktop | mentioned in `/imessage` "What's not here yet" block | `desktop/tauri.conf.json` only | not in demo | cut |
| Base / Ethereum | not added | not added | not in demo | cut (one chain story) |
| MagicBlock | not surfaced | flag-gated, off by default | not in demo | one optional bullet on slide 4 only if asked |
| Pricing model | homepage Pricing section | `/paywall` (currently $19/month subscription, deposit-to-credit pivot deferred) | not in demo | slide 5 |

## What stays "roadmap" honestly

If a feature is labeled `roadmap` in code (via `src/sections/Channels.tsx` status pills, `app/(dashboard)/integrations/page.tsx` `coming_soon` status, or the `/imessage` "What's not here yet" block), do NOT promote it to live in the deck. The honesty is the wedge. Examples:

- Slack / Discord: still `roadmap`. Don't claim they ship.
- Calendar event from iMessage: ships (PR #451). OK to claim.
- Gmail draft from iMessage: ships (PR #446). OK to claim.
- Gmail send from iMessage: ships (PR #452). OK to claim.
- Daily summary across model swaps: ships (PR #455). OK to claim.
- Tauri desktop binary: does NOT ship (`src-tauri/` missing). Don't claim.
- Filecoin storage: does NOT ship. Don't claim. See `docs/filecoin-decision.md`.

## What the demo will actually prove

Three things the audience will see, all live or recorded from live:

1. A real iPhone texts a real bot's iMessage number.
2. The bot creates a real Gmail draft (visible in a real Gmail account).
3. A signed receipt for the draft action exists on `/security`, with `operatoruplift.sol` linked next to the public-key endpoint.

If those three artifacts can be produced on stage or in the recording, the entire pitch is provable. If any one fails, fall to the simulator path in `docs/demo-recording-script.md`.
