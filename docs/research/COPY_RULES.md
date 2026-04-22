# Copy Rules

Small set of punctuation + tone rules for user-facing copy on the
Operator Uplift site. Not a style guide, just the stuff we want to
catch automatically so it never sneaks back in.

## 1. No em dashes or en dashes

Em dash `—` (U+2014) and en dash `–` (U+2013) are banned in product
copy. They look out of place in short UI strings and machine-written
copy tends to overuse them. Use commas or periods instead.

Rewrite examples:

| Before | After |
|--------|-------|
| `Draft replies, ask me before sending — no surprises.` | `Draft replies, ask me before sending. No surprises.` |
| `9:00 AM — Standup` | `9:00 AM, Standup` |
| `Every tool call in this clip is labeled SIMULATED — the real versions run after you sign in.` | `Every tool call in this clip is labeled SIMULATED. The real versions run after you sign in.` |

### Automated check

```bash
# Must return zero in src/ and app/
grep -rn "—\|–" src/ app/ --include="*.ts" --include="*.tsx"
```

This is the grep referenced by the W1A-demo-1b acceptance test.

### One-shot scrub

If a batch of new copy lands with em dashes, regenerate with the scrub
script (also in the W1A-demo-1b PR history):

```bash
node <<'EOF'
// See tests/e2e/demo-flow.spec.ts PR for the full version.
// Blanket replace: " — " → ", ", " – " → ", ", bare → ",".
EOF
```

Always diff the result before committing. The blanket replace is safe
on natural copy but can produce `, ` in weird spots inside code
comments. Spot-check and tidy as needed.

## 2. No literal "Demo" in user-facing UI

Say `Simulated`. The only exception is an internal settings toggle
label. The product does not call itself a demo, even when it's in
simulated mode for anonymous visitors.

Rewrite examples:

| Before | After |
|--------|-------|
| `Demo · Simulated` | `Simulated` |
| `Demo, Approve runs a simulated call...` | `Simulated. Approve runs a simulated call...` |
| `You're on the demo. Approve returns...` | `This run is simulated. Approve returns...` |
| `Anonymous demo, every reply is simulated.` | `Every reply and tool action is simulated.` |

Variable names (`DemoBeat`, `demoBannerDismissed`, `DEMO_CAPABILITIES`)
are internal and stay as-is. This rule is about text rendered to the
user, not source symbols.

## 3. Short, no hype

- Avoid: "revolutionary", "game-changing", "AI-powered" as a product
  descriptor
- Prefer: concrete verbs, honest trade-offs, calm tone
- If a sentence survives two em-dash rewrites it probably wants to be
  two sentences

## Review checklist before ship

- [ ] `grep -rn "—\|–" src/ app/` returns zero
- [ ] No visible "Demo" text outside an explicit settings toggle
- [ ] No hype words
- [ ] Each CTA maps to a concrete action the user can complete
