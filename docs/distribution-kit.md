# Distribution kit — first 100 users (Dragon's track #4)

> "Early traction is won by doing things that don't scale. Go where your users already hang out, and reply one by one. DM 10 potential users a day. Drop your product where your audience is already gathered, and pull the first 100 real pieces of feedback out by hand. Boring, manual, high-leverage. Most founders skip this and wonder why nothing sticks." — Dragon

This doc is **operator playbook + copy-paste assets**. I cannot post for you. I can give you the exact targets, exact templates, and the rules that keep us out of the spam bucket.

**Canonical one-liner** (use everywhere): `AI that runs on your terms.`

**Anchor URL** (this carries the trust stack in plain prose for skeptical readers): `https://operatoruplift.com/demo/hackathon`

---

## Audience model

We are not selling to "everyone who uses Gmail." We are selling to four narrow segments where the per-action consent + signed-receipt story actually matters:

1. **Solo founders / indie operators.** They live in email + calendar all day, hate the tax of writing the same email twice, and care about who is touching their inbox.
2. **VCs / scouts / angels who track AI infra.** Verifiable agents is a thesis bet for them. Trust-stack + 0G hackathon submission is a credentialing event.
3. **Crypto-native builders running with multiple AI providers.** They already understand on-chain receipts; "verifiable" is a feature for them, not jargon.
4. **AI ethics / safety / governance researchers.** They are the people who say "this should exist but doesn't." Trust stack speaks directly to them.

Skip the "general consumer" market for the first 100. The conversion is too slow and the feedback is too generic.

---

## Where each segment hangs out (target list)

### Segment 1 — Solo founders / indie operators

| Surface | Why | Approach |
|---|---|---|
| Indie Hackers (`indiehackers.com`) | The whole site is solo-founder traffic. | Post a milestone update: "Hit X users on the trust-stack AI assistant. Here is what surprised us." Avoid product pitch posts; they get downvoted. |
| `r/indiehackers` (Reddit) | 100k+ subscribers, very replies-friendly. | Same milestone framing. Cross-post the IH update verbatim. |
| `r/SaaS` | 100k+ subscribers, slightly harder mods. | Only post if you have a real metric or insight, not a launch. |
| Founders + indie operators on X | High signal, low effort. | The DM template below. 10/day. |
| Pioneer (`pioneer.app`) | Founder community + weekly tournament. | Submit weekly. |
| Hacker News (Show HN) | When you have an actual story to tell. | Only after you have at least 20 real users. See the HN template below. |
| `news.ycombinator.com` Ask HN / Show HN replies | Reply to threads where someone is asking exactly the problem we solve. | Reply with one paragraph + a link to `/demo/hackathon`. No DMs. |
| YC's Bookface (alumni only) | If you have access | Post in #ai-products with the canonical line + a 60-second loom. |

### Segment 2 — VCs / scouts / angels who track AI infra

| Surface | Why | Approach |
|---|---|---|
| Crypto-adjacent VC X accounts | They are talking about agentic AI all week. Quote-tweet, don't DM cold. | Reply with substance to their AI-infra threads. Link to `/demo/hackathon` only when relevant. |
| Solana Foundation grants / dev rel | We are devnet today, mainnet swap is a 30-min change. | Pitch as a verifiable-agent reference customer for Solana Pay v2. |
| 0G Foundation Discord | We are in their hackathon. Their team is already paying attention. | Post in `#projects-showcase`. Link the live deploy + GitHub. |
| Arkiv Network Discord / Network School Ethereum Hackathon AI track | We are an Network School Ethereum Hackathon entrant (AI theme) using their Braga testnet for agent identity cards + user-owned session memory. | Post in their hackathon channel with `/arkiv` live link + entityKey examples once published. PROJECT_ATTRIBUTE = `operatoruplift-bucharest-arkiv-7q3w`. |
| Filecoin / Lighthouse storage team | We are using Lighthouse as Filecoin provider. | DM with a 2-sentence intro: "We are mirroring every signed receipt through Lighthouse to Filecoin. Built it on top of your SDK." |
| Privy Discord | We use Privy for auth | Same as Filecoin. |
| Anthropic / OpenAI / Gemini dev advocates | BYOK is the wedge, they win when we win. | DM with the canonical line + `/demo/hackathon` link. Suggest you'd love to be a reference for "AI assistants that pay users' models, not bundle them." |

### Segment 3 — Crypto-native AI builders

| Surface | Why | Approach |
|---|---|---|
| `r/CryptoCurrency`, `r/ethereum`, `r/solana` | Cross-cutting | Only post about specific technical primitives (ERC-7857, x402, Merkle anchoring), not the product. The product is a side effect of the primitives for this audience. |
| 0G, Solana, Filecoin Discords | Native audience | Same as above — share the architecture diagram, link to the README. |
| ETHGlobal / Solana Hackathon discord servers | Other hackathon entrants in adjacent spaces | DM 10 builders/day asking about their stacks; offer to show ours. |
| Crypto Twitter (CT) AI/agents accounts | Daily volume, easy quote-tweets | Watch for x402, ERC-8004, ERC-7857 threads. Reply with our reference impl. |
| Farcaster (Warpcast) | Smaller, higher signal | Post a single Frame demo (link to `/demo/hackathon`). |

### Segment 4 — AI ethics / safety / governance researchers

| Surface | Why | Approach |
|---|---|---|
| AI Alignment Forum, LessWrong | "This should exist" audience | Post a long-form "what we built and why" essay, not a launch. |
| EA Forum | Same audience | Cross-post the AAF essay. |
| AI policy newsletters (Import AI, Last Week in AI, Stratechery) | Tip line | Send a 3-paragraph email: "Verifiable AI agents launched, here is the primitive, here is the live demo." |
| OpenAI / Anthropic policy team contacts on LinkedIn | If you have any | Same intro. |

---

## Where competitors' negative reviews live

Dragon: "Even the negative reviews of your competitors — reply one by one."

The competitors and where their unhappy users post:

| Competitor | Where unhappy users post |
|---|---|
| Superhuman | `r/Superhuman` complaints, X replies to @Superhuman complaining about price |
| Reply.io | G2 reviews ≤ 4 stars, Twitter |
| Lavender.ai | G2 reviews ≤ 4 stars |
| Notion AI / Gemini in Workspace | `r/googleworkspace`, `r/productivity` complaints |
| Operator (OpenAI) | `r/ChatGPT`, `r/OpenAI` complaints about it being broken |
| Anthropic's Claude with computer-use | `r/ClaudeAI` complaints about cost / reliability |

**Reply pattern (never spammy):** find a specific complaint, reply with the substance of how we solve that specific complaint, link to `/demo/hackathon` only if directly relevant. Never paste the same reply twice.

---

## DM templates

### Cold DM — solo founder / indie operator (X)

> hey [name], saw your thread on [specific recent post]. We just shipped a Gmail+Calendar AI assistant where every action waits for your tap and produces a signed receipt anyone can verify. Bunch of founders are using it as a "real autopilot replacement that won't fire off a wrong email." Would love your take if useful: operatoruplift.com/demo/hackathon

**Limits:**

- 10/day, hand-crafted intro line each time. No copy-paste of the intro.
- Wait 5 days minimum before a second DM.
- If they reply with a question, respond within 2 hours during business hours.

### Cold DM — VC / scout / angel (X)

> [Name] — operatoruplift is our submission to the 0G APAC hackathon. AI assistant for Gmail + Calendar where every action is gated by a tap and produces a verifiable on-chain receipt. We are using 0G Storage for the receipt mirror and ERC-7857 for agent identity. We are at [N] real users today. 90 seconds: operatoruplift.com/demo/hackathon

**Limits:** Send only to VCs whose recent tweets mention AI agents, AI infra, verifiable AI, or 0G. Cold DMs to generalist VCs without that signal go to spam.

### Cold DM — crypto-native builder

> [Name] — built a real-world reference for ERC-7857 + x402 + dual-mirror provenance. AI assistant on top of it, but the primitives are the interesting part. README has the full architecture: github.com/operatoruplift/website. Open to your read on the trust stack.

### Warm reply — someone tweeting a complaint about a competitor

> Operator Uplift takes a different approach here. Every action is gated by an explicit tap, and you get a signed receipt you can verify against a public IPFS gateway. Worth a look if [specific pain point they mentioned] is the deal-breaker: operatoruplift.com/demo/hackathon

### Demo invite — once they've reacted positively

> Want me to walk you through it? 15 minutes, screen-share, no slides. I can show you the actual receipt-verification flow with your own Gmail draft. [calendly link]

---

## Pinned tweet (X / @OperatorUplift)

```
AI that runs on your terms.

A real assistant for your Gmail and Calendar. Every action waits for your tap. Each one ships an ed25519-signed receipt mirrored to Filecoin + 0G testnet.

90-second walkthrough: operatoruplift.com/demo/hackathon
Repo: github.com/operatoruplift/website
```

(Replace the URLs once the pitch + how-it-works videos are uploaded; pin the how-it-works video natively if X allows.)

---

## Product Hunt launch copy

**Tagline (60-char limit):**

> AI that runs on your terms

**Description (260-char limit):**

> Operator Uplift is an AI assistant for Gmail and Calendar where every action waits for your tap and produces a verifiable receipt. Mirrored to Filecoin and 0G testnet. Built on x402 + ERC-7857. operatoruplift.com

**First comment (the hunter's note, ~500 chars):**

> Hi PH. We built this because every AI assistant either talks but cannot touch your real Gmail, or it executes silently with no proof. Operator Uplift fixes both halves: per-action approval + a signed receipt mirrored to two public storage networks. Made for solo operators who hate retyping the same email but won't hand the keys to a black box. Loved hearing your feedback on what to ship next, especially around iMessage and the BYOK provider story.

**Maker reply template (within 4 hours of launch):**

> Thanks [name]! [Specific reply to their specific question, never canned.] Want a 15-min walkthrough? Reply with a time and I'll send a Calendly.

**Pre-launch:**

- Build a hunter list in advance — at least 30 X mutuals who will commit to upvote in the first hour.
- Schedule launch for 12:01am PT on a Tuesday or Wednesday.
- Pin the launch on your X for the full day.

---

## Hacker News (Show HN) copy

**Title (80-char limit):**

> Show HN: Operator Uplift – AI for Gmail/Calendar with signed, verifiable receipts

**Body (HN doesn't render markdown; plain prose):**

> Hi HN. I built Operator Uplift because every "AI assistant" today is either chat-only (can't touch your Gmail) or fully autonomous with no audit trail. This one sits in the middle: every action is proposed in chat, requires an explicit tap to approve, then executes against your real Gmail or Calendar and produces an ed25519-signed receipt. Bytes are pinned to two public storage networks (Filecoin via Lighthouse, 0G Storage testnet) plus a Merkle root on Solana devnet. Anyone can verify a receipt against either network independently of our database.
>
> Architecture and the full trust-stack story is in the README: github.com/operatoruplift/website
>
> Live demo for judges/skeptics (no signup needed for the walkthrough): operatoruplift.com/demo/hackathon
>
> The HTTP 402 micropayment gate is from the x402 spec; agent registration uses ERC-8004-style JSON manifests with optional ERC-7857 Intelligent NFT on 0G Galileo Testnet for on-chain identity.
>
> Happy to answer anything about the design choices. Especially curious about HN reads on the "tap per action vs autopilot" tradeoff and the dual-mirror provenance approach.

**Rules:**

- Submit on a Tuesday or Wednesday morning PT. Friday afternoons and weekends get less reach.
- Reply to every comment within 30 minutes for the first 4 hours.
- Never argue with downvoted commenters. Acknowledge the substance, agree to disagree, move on.
- Do NOT post the same link to multiple HN threads.

---

## LinkedIn launch post

```
Built and shipped: Operator Uplift — AI that runs on your terms.

A real AI assistant for your Gmail and Calendar where every action waits for your tap and produces a verifiable receipt. Built for solo operators who hate retyping the same email but won't hand the keys to a black box.

Three things that make it different from the autopilot generation:
→ Per-action approval, not "remember this agent"
→ ed25519-signed receipt for every action you approve
→ Receipt bytes mirrored to two public storage networks (Filecoin + 0G testnet) so the proof outlives our database

We submitted this to the 0G APAC Hackathon. Architecture, code, and reproducible setup in the README: github.com/operatoruplift/website

90-second walkthrough: operatoruplift.com/demo/hackathon

DMs open if this is the kind of thing your team is thinking about.
```

(LinkedIn rewards verbosity less than Twitter; keep this under 1300 chars and put the URLs at the end.)

---

## Reddit posts

### r/indiehackers — milestone format

```
Title: Hit [N] users on a real-action AI assistant — built it on a "tap per action" model instead of autopilot

Body:
Quick milestone share. Built Operator Uplift over the past [X months] — AI assistant for Gmail and Calendar, but every action waits for an explicit tap. No "send all the things." No "remember this agent."

What surprised me:
- Users are way less afraid of trying it because the approval is right there
- The signed receipt feature ([file mirror description]) got more questions from non-crypto-native users than I expected
- Solo founders convert better than power users

Stack: Next.js + Privy auth + Supabase, x402 spec for the per-action micropayment gate, Filecoin + 0G Storage for receipt mirrors.

Open source: github.com/operatoruplift/website
Live: operatoruplift.com/demo/hackathon
Happy to answer anything.
```

### r/SaaS

Same content, slightly less personal. Lead with the metric, not the story.

### r/Productivity / r/EmailMarketing

Re-frame entirely. Drop all crypto/Web3 framing. Lead with "AI assistant that drafts and sends but waits for your tap." Only mention the receipt as "audit trail" — never "on-chain."

---

## Outreach tracking

Keep a spreadsheet with columns:

| date | surface | target name | DM/post template used | status (sent, replied, ignored, signed up, churned) | notes |

Three reasons:

1. **Avoid double DM.** Most platforms will mark you spam if you message the same person twice in a week.
2. **A/B test templates.** Different intro lines convert at different rates. After 30 DMs you have data.
3. **Follow-up triggers.** "Replied positively but did not sign up" gets a different follow-up than "ignored" — and the 5-day-later check-in is when most conversions happen.

---

## What to avoid

- **Mass DMs with the same intro line.** Even on X, this trips spam classifiers within 20 messages.
- **Posting in subreddits before reading the rules.** /r/SaaS bans most product launches; /r/startups bans them outright.
- **Posting at the wrong time of day.** US Pacific 9-11am or 4-6pm hits the most surfaces. Hacker News skews earlier (6am PT).
- **Replying to negative reviews of competitors with our URL pasted with no context.** This is the textbook way to get blocked.
- **Using a corporate-sounding voice on X.** Twitter rewards informal, founder-voice. Save the corporate voice for LinkedIn.
- **Asking for upvotes on Hacker News.** Get-rich-quick. You will get flagged and de-listed in 30 minutes.
- **Sending the cold-VC DM to a generalist VC who hasn't tweeted about AI agents in the last 90 days.** Their inbox is already full.

---

## Daily rhythm (10 DMs / day rule)

A boring template that works:

- **9:00am** — pick 10 targets from one segment (rotate by day: M=founders, T=VCs, W=builders, Th=ethics/researchers, F=competitors' negative reviews)
- **9:30am** — research each target for 5 minutes (most recent tweet, what they care about). Write 10 hand-crafted intros from the template.
- **10:00am** — send the 10 DMs over 30 minutes (spaced out, not in one batch)
- **Throughout the day** — reply to incoming responses within 2 hours
- **End of day** — log the 10 DMs in the spreadsheet, note any patterns

Five days of this = 50 DMs. Two weeks = 100 DMs. Conservative conversion: 100 DMs → 25 replies → 8 signups → 3 active users. Real conversion if the segment is well-targeted: 100 → 40 → 18 → 9 active.

**Most founders skip this and wonder why nothing sticks.** — Dragon

---

## After 30 days

Reassess every segment. Drop the ones with <5% positive reply rate. Double down on the ones with >15%. By day 60 you should have a model of which 1-2 segments are your wedge, and the cold outreach narrows to those.
