# UX principles for the operatoruplift.com surfaces

This doc names two principles that every UI change has to pass before merge. They are not vibes. They produce concrete edits that ship.

## Principle 1: Norman doors (affordance must match action)

Don Norman's rule: if a thing looks like you push it, it should push. If it looks like you pull, it should pull. A door that needs to be pulled but has a flat plate that begs to be pushed is a Norman door, and every person who walks through it feels stupid for half a second. That feeling is the bug.

**On our site, a Norman door is any element that lies about what it does.**

### Norman door patterns to ban

- A **button that looks clickable but does nothing** (disabled state must be visually obvious: 50% opacity + `cursor: not-allowed` + `aria-disabled="true"`, no full-color fill).
- A **card with hover affordance but no `href`** (it lifts on hover, the cursor turns into a pointer, and clicking does nothing).
- An **input that looks editable but is read-only** (must use `<output>` or a styled `<div>`, not a styled `<input>`).
- A **link styled as a button that opens in the same tab when users expect a new tab** (use `target="_blank"` + `rel="noopener"` for off-site links).
- A **loading spinner with no following state** (every spinner promises a result; if the result never lands, you have lied).
- **Hover-only tooltips on touch devices** (the affordance doesn't exist for half your users).

### Norman door fixes already shipped

- Wallet checkout buttons on `/waitlist` are visually downgraded (`bg-background` border-only, `text-foreground/40`, `cursor: not-allowed`) so they don't promise interactivity until the wallet flow lands.
- `/arkiv` honest empty state: the page does not show a fake entity list when no entities exist.
- `/security` receipts page: the `filecoin:` and `0g:` links only appear when the cron has actually written a CID for that receipt.

## Principle 2: Jakob's Law (match the conventions users already know)

Jakob Nielsen's rule: users spend most of their time on other sites. They expect ours to work the same way. Every place we invent a new pattern is a place we pay a tax in confusion.

**On our site, every pattern that breaks user expectations is a bug.**

### Conventions we are matching (do not break these)

- **Email signup form**: `<input type="email" autoComplete="email" autoFocus />`, Enter key submits, error appears under the field (not in a modal), success state replaces the form (not appends below).
- **Login button placement**: top-right of the navbar. Always.
- **Form submit button**: bottom-right of the form, primary color, single-word verb (Join, Pay, Send).
- **Link color**: foreground with underline-on-hover. Not blue, not purple. Same across the site.
- **Loading state**: spinner inline with the button label, button stays the same width to prevent layout shift.
- **Currency**: always written `$50` or `$50 USDC`, never `50 USD` or `50 $`.
- **Time/date**: relative when recent ("3 hours ago"), absolute when historical ("April 17, 2026").
- **Card hover**: subtle border-color shift + tiny `translateY(-1px)` lift. Same animation duration (150ms) site-wide.
- **Mobile breakpoints**: matches Tailwind defaults (sm 640, md 768, lg 1024, xl 1280) so reviewers can predict behavior.

### Frictionless defaults

- **Autofocus** the first input on every form-driven page.
- **Enter to submit** every form. No "Submit" button at the bottom of a form that doesn't fire on Enter.
- **Submit on click, render immediately** (optimistic UI when the server call is fast enough that failure is rare).
- **One CTA per screen** (Norman + Jakob agree: more than one primary action is a Norman door).
- **No confirmation modals** for actions a user can undo in one click. Confirmation modals are friction debt.
- **Skip-on-back** for hub pages so the back button doesn't trap users in a /pricing → /paywall → /pricing loop.

## Principle 3 (consequence): the copy itself is part of the UX

Tom Sachs has a rule: "the work is the work, but the explanation is the work too." Our blog posts and marketing copy follow:

- **Lead with the user benefit, not the technology.** "Your memory stays yours" not "we shipped Arkiv entity transferable-owner semantics."
- **One idea per paragraph.** A reader scanning should land on the headline of each para and get the gist.
- **No jargon that we have not first defined in plain English.** If we have to use `ed25519`, the sentence before it explains what a signature does in everyday terms.
- **The empty state is the copy.** If a feature is not live yet, the page says so in the same voice as if it were live.

### Jargon list to scrub from consumer copy

These belong in `/docs` (where the reader has self-selected for technical detail), NOT in `/blog` or marketing pages:

- `ed25519`, `SHA-256`, `Merkle`, `Risc0`, `zk` (use "a signature you can check", "a fingerprint nobody can forge", "a proof")
- `ERC-7857`, `Intelligent NFT`, `chainscan-galileo` (use "an on-chain agent identity")
- `Solana devnet`, `Braga testnet`, `Galileo Testnet` (use "a public network we use for testing" or just "a public record")
- `x402`, `PROJECT_ATTRIBUTE`, `entityKey`, `$creator`, `$owner` (these never belong in consumer copy)
- `IPFS gateway`, `Turbo indexer`, `cron`, `webhook` (use "a public link", "an automatic backup", "an automatic message")

## How to enforce

Every UI change PR must answer two questions in the description:

1. **Norman**: does any new element look like it does X but actually do Y? If yes, what is the fix?
2. **Jakob**: does any new pattern depart from the convention list above? If yes, why is the new pattern worth the user-tax?

If both answers are "no" or "addressed," merge. If either is "yes," fix or document the tradeoff.

Hermetic specs that lock these:
- `tests/e2e/norman-doors-honest.spec.ts` — bans disabled-looking-enabled buttons and similar lies.
- `tests/e2e/*-honest.spec.ts` — the marketing-honesty net already enforces the empty-state-as-copy rule.
