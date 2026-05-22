# Pitch video script — 0G APAC Hackathon (judges)

> **Historical artifact — 0G APAC Hackathon submission (AI-assistant era).** Trust-stack architecture and the "verifiable bytes against either mirror" judge cookbook are still accurate. Brand framing is retired: do **not** copy the AI-assistant voice-over into anything user-facing. Current brand: commitment infrastructure, see [`BRAND_COMMITMENT_INFRASTRUCTURE.md`](./BRAND_COMMITMENT_INFRASTRUCTURE.md).

**Runtime target:** 3:30–4:30 minutes. Two cuts below — a 3:00 short for tight platforms and a 4:30 long for the submission portal.

**Structure (Dragon's framework):** Problem → Product → Architecture → Why 0G → Why Your Team.

**Canonical one-liner (do not deviate from this line in voice-over):**

> AI that runs on your terms.

**Voice-over notes:**

- Use a US-keyboard cadence; no em-dashes in delivery, treat the script punctuation as breath marks.
- Speak in present tense for shipped pieces. Use future-conditional for the AgenticID mint and 0G mainnet swap-over.
- The on-screen text under each scene is read by the viewer, not the voice-over. Keep voice-over and on-screen text as parallel tracks, not a duplicate.

---

## Section 1 — Problem (0:00–0:30)

**On-screen open:** clean cut on the wordmark "Operator Uplift" + tagline "AI that runs on your terms".

**Voice-over (0:00–0:30):**

> Today's AI assistants either talk a great game but cannot touch your actual Gmail or Calendar, or they execute actions silently with no proof of what they did. When the model changes next quarter, when a vendor goes down, or when a recipient disputes an email a year later, there is no auditable record. We built Operator Uplift to fix both halves: an AI that actually does the work, and a trust stack that proves what it did.

**B-roll cues:**

- 0:05 — three logo cards float in (ChatGPT, Claude, Gemini) with a struck-through icon over each, then dissolve. The voice-over hits "cannot touch your actual Gmail."
- 0:15 — a Gmail inbox screenshot with a faded "no proof" stamp over it, dissolving as the voice-over hits "silently with no proof."
- 0:25 — the wordmark returns, then the tagline lands.

**Cut to Section 2 on:** 0:30.

---

## Section 2 — Product (0:30–1:30)

**On-screen text strip across the bottom (sticky for the section):** "Approve before action · Verify after."

**Voice-over (0:30–1:00):**

> Here is the user flow. You ask the assistant to schedule a meeting or draft an email. It proposes the exact action with the exact parameters. You tap once to approve. The assistant executes against your real Google Calendar or Gmail, and produces a signed receipt that lands on `/security`. No "remember this agent." Every action is an explicit consent.

**Screen-record cues — live walkthrough in this segment:**

- 0:32 — record `/chat`. Type: "Schedule a coffee chat with alex@example.com tomorrow at 3pm for 30 minutes."
- 0:42 — the approval modal appears. Pause on it long enough for the viewer to read the params and the "$0.01 USDC on solana-devnet" cost line. About 4 seconds.
- 0:48 — click **Pay & Allow Once**. Briefly show the network tab if it can be done without losing the viewer (optional).
- 0:54 — cut to the real Google Calendar entry appearing. Cursor highlights the meeting block.

**Voice-over (1:00–1:30):**

> Behind the scenes, every approved action gets an ed25519 signature, a public IPFS pin on Filecoin, and a separate pin on 0G Storage testnet. Every five receipts, we publish a Merkle root to Solana devnet. A judge in this video right now can copy any receipt and verify the bytes against either network. No need to trust our database.

**Screen-record cues:**

- 1:02 — cut to `/security`. Hover the cursor over a receipt row. Zoom the `filecoin: bafyrei...` and `0g: 0xabc...` links so they are readable.
- 1:12 — click the `0g:` link. The browser lands on `/api/og/storage/<rootHash>`. Read the JSON envelope for half a second.
- 1:20 — cut back to `/security` and click **Copy JSON** on the receipt. The clipboard copies the signed receipt.
- 1:25 — text overlay: "Same bytes, two networks, anyone can verify."

**Cut to Section 3 on:** 1:30.

---

## Section 3 — Architecture (1:30–2:30)

**On-screen visual:** the ASCII diagram from `README.md` redrawn as a clean architecture graphic. Keep four lanes:

1. Browser → x402Gate middleware → tool execution
2. ed25519 signature → Supabase row
3. Solana devnet Merkle root cron
4. Filecoin + 0G Storage anchor crons

**Voice-over (1:30–2:00):**

> The request flow is HTTP 402. When you ask for a write action, the server returns 402 Payment Required with an invoice. The client pays via x402, retries with a payment proof, and only then does the tool run. This is the real x402 protocol, not a mock. Reads stay free. Writes cost a cent each. No subscription lock-in.

**Cues:** highlight the x402Gate box and the 402 → pay → retry loop as the voice-over names it.

**Voice-over (2:00–2:30):**

> After execution, the receipt gets signed with ed25519, pinned to two decentralized storage networks in parallel, and committed to Solana as a Merkle root every five actions. Three independent layers of provenance, none of which we control alone. If our Supabase disappears tomorrow, the proofs survive.

**Cues:** highlight the three branches (Supabase, Solana, Filecoin+0G) as the voice-over names each.

**Cut to Section 4 on:** 2:30.

---

## Section 4 — Why 0G (2:30–3:15)

**On-screen text on entry:** "Why 0G specifically."

**Voice-over (2:30–3:00):**

> We integrated two of 0G's five modules, both additively. **0G Storage** gives every receipt a second public mirror beyond Filecoin. The cron at `/api/cron/og-anchor` pushes the same SignedReceipt JSON to 0G testnet via the Turbo indexer. The rootHash surfaces as a clickable link on `/security` and lands on a verifier route that documents the exact SDK call a judge would make to fetch the bytes themselves.

**Cues:**

- 2:32 — code snippet on-screen: `pnpm install @0gfoundation/0g-storage-ts-sdk ethers` (5 seconds, then fade).
- 2:42 — overlay the 0G testnet endpoints: `evmrpc-testnet.0g.ai` + `indexer-storage-testnet-turbo.0g.ai`.
- 2:50 — show the `0g: <rootHash>` link being clicked on `/security`, lands on the verifier JSON.

**Voice-over (3:00–3:15):**

> **0G AgenticID** gives each of our agents an on-chain identity as an ERC-7857 Intelligent NFT on 0G Galileo Testnet. The agent's hashed name, capabilities, system prompt, and model all live on chain. A judge or auditor can verify our agent identity has not drifted by recomputing each SHA-256 and comparing against the chainscan record.

**Cues:**

- 3:02 — cut to `chainscan-galileo.0g.ai/address/0x2700F6A3e505402C9daB154C5c6ab9cAEC98EF1F`. Pause on the contract page for 3 seconds.
- 3:10 — overlay the IntelligentData[] array structure: `{ dataDescription, dataHash }[]` with concrete fields.

**Cut to Section 5 on:** 3:15.

---

## Section 5 — Why Your Team (3:15–4:00)

> **Operator action required to fill this section.** I (the AI) can give you the structural scaffold, but the actual content depends on facts about the team that aren't in the codebase.

**Recommended structure (60–90 seconds of voice-over):**

A. **Domain expertise (15–20s):** What does this team know that other teams don't? Concrete prior shipping experience, the specific user-insight problem this team is closest to.

B. **Distribution advantage (15–20s):** Where do these users already hang out, and do you have a way to reach them that other teams don't? Existing audience, community, customer base, lead-list, etc.

C. **Shipping track record (15–20s):** What have you shipped before that gives a judge confidence you ship under pressure? Open-source repos, prior products, prior demos.

D. **Personal stake (10–15s):** Why this problem, for you specifically? The 60-second answer to "would you still be working on this in 2 years if the hackathon didn't exist?"

**Suggested talk-track template — REPLACE THE BRACKETED PARTS:**

> I am [Matt Sim], the founder of Operator Uplift. I have been building [X for Y years]; before this I shipped [specific prior product]. The reason this team can ship this stack in 5 days and not 5 months is [specific competitive advantage — domain, distribution, prior infrastructure]. And the reason I keep working on this is [the personal-stake answer]. We are betting that "verifiable AI for everyday tools" is the wedge for the next billion AI users — not "AI that talks better."

**Cues:**

- 3:15 — cut to a clean shot of the founder on camera. Or, if no camera, a wordmark + simple title card with the name + role.
- 3:30 — overlay the X handle + LinkedIn URL at the bottom of the frame.
- 3:50 — cut back to the wordmark + tagline.

---

## Section 6 — Close + CTA (4:00–4:30)

**On-screen text:** wordmark + tagline + two URLs.

**Voice-over (4:00–4:30):**

> Operator Uplift is live at operatoruplift.com. The judge walkthrough with click-through verifier links is at `operatoruplift.com/demo/hackathon`. Repo and full architecture doc on GitHub. Built on 0G Storage and 0G AgenticID, Solana devnet, Filecoin via Lighthouse. Verifiable AI that actually does your work. AI that runs on your terms.

**Cues:**

- 4:00 — wordmark and tagline animate in.
- 4:08 — two URL cards slide up: `operatoruplift.com/demo/hackathon` and `github.com/operatoruplift/website`.
- 4:18 — partner-logo strip: 0G, Filecoin, Solana, ElevenLabs (small).
- 4:25 — fade to black.

---

## 3-minute cut (alternative for tight platforms)

Cut Sections 1 + 5 to half-length, drop Section 6's partner-logo strip, and tighten Section 3 to "we use HTTP 402, ed25519, and three independent provenance layers — here is the diagram."

| Section | Long cut | Short cut |
|---|---|---|
| Problem | 0:30 | 0:15 |
| Product | 1:00 | 0:55 |
| Architecture | 1:00 | 0:40 |
| Why 0G | 0:45 | 0:35 |
| Why Your Team | 0:45 | 0:25 |
| Close | 0:30 | 0:10 |
| **Total** | **4:30** | **3:00** |

---

## Shot list (everything to record before assembly)

| # | Shot | Duration | Source |
|---|---|---|---|
| 1 | Wordmark + tagline title card | 5s | `app/opengraph-image.tsx` is the visual reference |
| 2 | Three competitor logos struck through | 5s | export from your slide deck |
| 3 | Gmail inbox screenshot, no-proof stamp | 5s | static screenshot |
| 4 | `/chat` typing the calendar prompt | 15s | screen-record at 1440x900, web cam mic off |
| 5 | Approval modal pause + click "Pay & Allow Once" | 8s | continuation of shot 4 |
| 6 | Real Google Calendar entry appearing | 8s | continuation of shot 4 |
| 7 | `/security` receipts with mirror links highlighted | 10s | screen-record |
| 8 | Click 0G link, land on JSON envelope | 6s | continuation of shot 7 |
| 9 | Copy JSON button click | 4s | continuation of shot 7 |
| 10 | Architecture diagram animation | 60s | re-draw the ASCII diagram from README as a clean graphic in Figma/Canva |
| 11 | 0G testnet endpoints overlay | 5s | text card |
| 12 | Chainscan contract page | 8s | screen-record `chainscan-galileo.0g.ai/address/0x2700F6A3e505402C9daB154C5c6ab9cAEC98EF1F` |
| 13 | IntelligentData[] structure overlay | 5s | text card |
| 14 | Founder on camera (or wordmark fallback) | 45s | record separately, lavalier mic if possible |
| 15 | Close cards (wordmark, URLs, partner strip) | 30s | static cards animated in |

Total recording: ~3:30 of screen-record + 45s of camera + 1:30 of motion-graphic cards.

---

## Voice-over recording notes

- **Length per take:** record each section as a separate take. Sections 1, 2, 4, 5, 6 are short enough that doing them as single takes is plausible. Section 3 (Architecture) is dense; consider splitting into 2A (request flow) and 2B (post-execution provenance).
- **Provider:** if you do not record your own voice, use the ElevenLabs endpoint that already ships at `/api/voice/synth`. Pin a single voice across all sections for continuity (Rachel is the default; see `ELEVENLABS_VOICE_ID`).
- **Avoid:** "delve", "leverage", "holistic", em-dashes spoken as long pauses, and any phrase from the banned-words list in `scripts/copy-check.mjs`.
- **Hit hard:** the words "verify", "signed", "approve", "tap", "real Gmail", "real Calendar". These map to the trust stack pillars.

---

## Things to NOT say in this video

To avoid honesty regressions caught by `scripts/fabrication-rot-check.mjs` and the copy-check guard:

- Do not say "runs on your computer" or imply local-machine execution. The desktop+Ollama path is roadmap, not shipped.
- Do not say "AI Operating System", "Multi-agent orchestration", or "Local-first AI agent platform" — all retired phrases.
- Do not name LLMs we do not actually surface (Llama, Ollama in the chat picker — those are desktop-roadmap only).
- Do not say "tokens minted" for AgenticID unless `data/og-agent-ids.json` has been updated with real tokenIds at recording time.
- Do not claim mainnet for x402; it is Solana devnet today.

---

## After recording: where to upload + linkbacks

| Surface | Action |
|---|---|
| 0G submission form | Direct upload, primary asset |
| YouTube | Public unlisted, embedded on `/demo/hackathon` |
| X | Pinned tweet with the public YouTube link + the 30-second hook clip natively |
| LinkedIn | Native video upload, with the LOOPS_HOUSE_SUBMISSION style 1-paragraph context |
| Discord (0G Foundation) | Drop in `#projects-showcase` or wherever the hackathon coordinates |
| README | Add an "Pitch video" link at the top, between the tagline and the live-site line |

The README + `docs/positioning.md` are the source of truth for the voice-over copy. If the script and those docs disagree, the docs win.
