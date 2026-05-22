# How It Works video script — for end users

> **Historical artifact — AI-assistant era.** Voice-over still pitches "real assistant with signed receipts." This script was the user-facing companion to the hackathon judge cut. For any new How-It-Works video, rewrite to the **commitment-infrastructure** brand: stake → upload proof → AI Game Master verifies → honor or redistribute. Tagline is "Keep your word. Bet on yourself." See [`BRAND_COMMITMENT_INFRASTRUCTURE.md`](./BRAND_COMMITMENT_INFRASTRUCTURE.md) for the canonical voice and the matching homepage HowItWorksSection for the five-step copy.

**Runtime target:** 2:00–2:30 minutes. One cut, no shortened version.

**Audience:** people who landed on `operatoruplift.com` from a tweet or a friend's recommendation. They want to know what they can do with this, not how it works under the hood. Visuals carry the explanation, voice-over is light.

**Sister doc:** `docs/pitch-video-script.md` is the 4:30 judge cut with the Problem → Architecture → Why 0G arc. This one shares the same screen-record footage but the narrative is completely different. Do NOT cut the same video twice with one voice-over swap.

**Canonical one-liner (use exactly once at the open, exactly once at the close):**

> AI that runs on your terms.

---

## Narrative arc

| Beat | Time | What the viewer feels |
|---|---|---|
| Hook | 0:00–0:15 | "Oh, this is the thing I keep meaning to start using." |
| What you can do | 0:15–0:50 | "I could draft a follow-up email faster than retyping it." |
| Approval moment | 0:50–1:15 | "I am not letting an AI loose in my Gmail without that tap." |
| What you get back | 1:15–1:45 | "There is a receipt of what it actually did." |
| Where it works | 1:45–2:00 | "Web today, iMessage soon." |
| Close | 2:00–2:15 | One CTA: "Connect Gmail in under a minute." |

The pitch video leads with the problem. **This video leads with the action.** Most viewers do not want to hear about decentralized storage; they want to see the email get drafted.

---

## Section 1 — Hook (0:00–0:15)

**On-screen:** clean shot of a real Gmail inbox with maybe 30 unread emails. Cursor hovers over the "Compose" button.

**Voice-over (0:00–0:15):**

> You know the email you have been meaning to send for three days. The one where you keep rewriting the first line and giving up. That email gets sent in the next two minutes.

**Cues:**

- 0:00 — Gmail inbox screenshot, cursor hovering on Compose.
- 0:08 — cursor tilts away from Compose, the inbox darkens slightly. Wordmark + tagline fade in.
- 0:12 — text overlay: "AI that runs on your terms."

**Cut to Section 2 on:** 0:15.

---

## Section 2 — What you can do (0:15–0:50)

**Voice-over (0:15–0:35):**

> Open the chat, type what you want done, and Operator Uplift drafts it. Coffee chat next week. Follow-up after that intro call. Calendar block for the deep-work block you keep skipping. Anything that lives in your Gmail or your Google Calendar, just type it.

**Screen-record cues — single take, slightly sped up:**

- 0:16 — `/chat` opens. Type: **"Schedule a coffee chat with alex@example.com next Tuesday at 3pm for 30 minutes."**
- 0:22 — type a second prompt right after: **"Draft a follow-up email to alex saying I am looking forward to our coffee chat."**
- 0:28 — type a third: **"Block 9 to 11am tomorrow for deep work, call it 'Writing time'."**
- 0:34 — pull back from the keyboard. Three pending actions sit in the chat, waiting for the user.

**Voice-over (0:35–0:50):**

> The assistant proposes the exact action. The exact email. The exact meeting. You are not handing the keys to your inbox. You are reviewing a draft.

**Cues:**

- 0:36 — zoom on one of the three pending action cards. The card shows the email body or the calendar block in full.
- 0:42 — text overlay: "Drafted, not sent."
- 0:48 — pull back to the three cards.

**Cut to Section 3 on:** 0:50.

---

## Section 3 — The approval moment (0:50–1:15)

**Voice-over (0:50–1:05):**

> Then you tap. One tap to confirm. One tap to cancel. No "remember this agent." No "send all the things automatically." Every action is an explicit yes from you. That is the whole reason this is different from autopilot.

**Screen-record cues:**

- 0:51 — click "Approve" on one of the three pending cards. The approval modal expands.
- 0:55 — modal hold. Show:
  - the tool name (Calendar — Create event)
  - the exact params (attendees, start, end, title)
  - the cost line: "$0.01 USDC on solana-devnet" (do not narrate the cost here; the visual is enough for a curious viewer)
- 1:02 — click **Pay & Allow Once**. Brief animation.
- 1:08 — cut to the real Google Calendar entry appearing in the user's actual Calendar tab.
- 1:12 — text overlay: "Your tap. Your action."

**Cut to Section 4 on:** 1:15.

---

## Section 4 — What you get back (1:15–1:45)

**Voice-over (1:15–1:35):**

> Every action you approve leaves a receipt. You can scroll back through `/security` and see exactly what happened, when, and to whom. If a recipient ever disputes the email you sent, the receipt is there. The bytes are also pinned to two public storage networks, so the proof outlives our database.

**Screen-record cues:**

- 1:16 — cut to `/security`. The new calendar receipt appears at the top of the list.
- 1:22 — hover on the receipt row. The `filecoin: bafy...` and `0g: 0x...` chips appear next to it.
- 1:28 — click "Copy JSON" — the receipt JSON copies. Brief flash on the button.
- 1:34 — pull back; the full /security list of past receipts visible.

**Voice-over (1:35–1:45):**

> One inbox you trust. One calendar you trust. One receipt for each action.

**Cut to Section 5 on:** 1:45.

---

## Section 5 — Where it works (1:45–2:00)

**Voice-over (1:45–2:00):**

> Today it runs on the web. Soon it answers iMessage too, so you can text the bot from your phone and the same approval lands as a one-tap message. The web app works on every device with a browser. No download. No "install our agent on your machine."

**Cues:**

- 1:47 — three-up screen showing operatoruplift.com loaded on desktop, on tablet, on mobile-browser. Hold for 4 seconds.
- 1:54 — iMessage chat bubble overlay slides in from the right: "Operator (Soon): Tap to draft that follow-up?" Then fades.

**Cut to Section 6 on:** 2:00.

---

## Section 6 — Close (2:00–2:15)

**Voice-over (2:00–2:15):**

> Operator Uplift. AI that runs on your terms. Connect Gmail in under a minute at operatoruplift.com.

**Cues:**

- 2:00 — wordmark + tagline lockup, centered.
- 2:06 — single CTA card: "Connect Gmail in under a minute" with the URL.
- 2:12 — fade.

---

## What this script does NOT do

This is the user-facing video, not the judge-facing video. The pitch video covers all of these; do not duplicate them here:

- No 0G mention. Users do not care.
- No mention of "verifiable on-chain receipt" or "ERC-7857." Use "receipt" + "two public storage networks" only.
- No architecture diagram.
- No "Why this team" section. Users want to see the product, not the founder.
- No mention of x402, Solana, Filecoin, or any specific chain. The cost line in the approval modal carries that detail visually for the small slice of users who notice it.
- No discount, coupon, or pricing framing. The CTA is "Connect Gmail," not "Subscribe for $50."

---

## Shot list (single recording session)

| # | Shot | Duration | Source |
|---|---|---|---|
| 1 | Gmail inbox, hover Compose | 8s | static screenshot or screen-record |
| 2 | Three-prompt sequence in /chat | 18s | screen-record at 1440x900 |
| 3 | One pending action card zoom | 6s | continuation of shot 2 |
| 4 | Approval modal hold | 7s | screen-record |
| 5 | Pay & Allow Once click + transition | 5s | continuation of shot 4 |
| 6 | Real Google Calendar entry | 5s | screen-record |
| 7 | /security receipt list | 8s | screen-record |
| 8 | Receipt row hover + mirror chips | 6s | continuation of shot 7 |
| 9 | Copy JSON click | 4s | continuation of shot 7 |
| 10 | Three-up device screens | 7s | composite, can fake mobile via dev tools |
| 11 | iMessage bubble overlay | 5s | text card, animated |
| 12 | Wordmark + tagline + CTA close | 15s | static cards animated in |

Total: ~95 seconds of recording. The rest is voice-over over the visuals plus brief text overlays.

---

## Voice-over recording notes

- **Tone:** conversational, the cadence of a friend who is sharing a tip. Not "marketing." Read each beat the way you would explain the product to your most skeptical friend.
- **Avoid:** "transform", "unlock", "leverage", "delve", "holistic", "AI Operating System", anything from the banned-words list in `scripts/copy-check.mjs`.
- **Pace:** 165–175 words per minute. Slower than the pitch video, which targets judges who can follow density.
- **Pauses:** half-second breath between sections, no longer. Viewers drop off if there is silence.
- **Hit hard:** "your tap", "your action", "drafted, not sent", "every action you approve." These are the consent verbs that distinguish us from autopilot.

---

## Honesty fences (same as pitch video)

To avoid tripping `scripts/fabrication-rot-check.mjs` or the copy-check guard:

- Do not say "runs on your computer" or imply local-machine execution. Desktop+Ollama is roadmap, not shipped.
- Do not say "AI Operating System", "Multi-agent orchestration", or "Local-first AI agent platform."
- iMessage is honestly shipped (the agent loop works end-to-end). It is correct to say "soon" only if you mean the public iMessage **number** is not yet open beyond the team. If the public number IS open at recording time, drop the "soon."
- The "two public storage networks" claim is honest today regardless of whether `OG_PRIVATE_KEY` is funded — the path is wired; if uncalled at recording time, judges and users hitting `/security` simply do not see the `0g:` link on rows that have not been anchored yet. Voice-over should not claim every receipt is mirrored; say "every action you approve leaves a receipt, and the bytes are also pinned to two public storage networks."

---

## Distribution

| Surface | Action |
|---|---|
| operatoruplift.com homepage | Embed as the hero video below the headline (auto-play muted, click to unmute) |
| /demo/hackathon | Embed at the top of the page before the verifier walkthrough |
| YouTube | Public, with a 0-second cold open (no intro screen) |
| TikTok / Reels / Shorts | Vertical re-cut, 0:00–0:50 of this script + the close. Hook + first three prompts only. |
| Twitter / X | Native upload of the full 2:15 cut |
| Product Hunt | Embed in the PH listing |
| README | Add a "Watch the 2-minute walkthrough" link in the hero block above "Live at operatoruplift.com" |

This is the video that lives on the homepage and gets shared. The pitch video (separate doc) lives behind the submission form and on `/demo/hackathon` for judges who want the deeper cut.
