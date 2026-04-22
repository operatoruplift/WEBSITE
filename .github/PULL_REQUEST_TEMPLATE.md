<!--
Thanks for opening a PR. Fill in every section below, then delete this
comment block. The template enforces the Definition-of-Done rules from
docs/research/CONTROL_PLANE.md in the meta-research workspace:
- One workspace touched
- Exactly one acceptance test, actually run
- Explicit non-goals
- Rollback line
- RISK + TRUST tags
- Frozen-surfaces check
- Pattern/Spec/Backlog cross-references
-->

## Scope

<!-- One sentence: what user-visible or dev-visible thing changes? -->

## PR Task ID

<!-- e.g. W1B-trust-gate. Link to PR_BACKLOG.md if applicable. -->

## Pattern / Spec / Backlog references

<!-- e.g. PATTERNS.md #10, INTEGRATION_SPECS.md Spec 1, PR_BACKLOG.md W1B-adapter-503 -->

## What changed

<!-- File-level summary. Group by file or by concern. -->

-

## Acceptance test (single)

<!-- Paste the exact command + its output. Every PR has exactly one. -->

```
$ pnpm ...
```

## Non-goals

<!-- Explicit list of what this PR does NOT do. At least one bullet. -->

-

## RISK + TRUST

- **RISK:** low / med / high
- **TRUST impact:** none / low / high

<!-- Default: RISK=low, TRUST=none. Upgrade if the PR touches auth,
     receipts, x402, capabilities, or writes to user data. -->

## Frozen surfaces check

<!-- Tick each that stayed untouched. If any got touched, explain why
     and cite the backlog item authorizing it. -->

- [ ] receipts
- [ ] Merkle anchor
- [ ] x402 semantics
- [ ] capabilities rules
- [ ] AuthGate rules
- [ ] cron schedule
- [ ] pricing

## Rollback

<!-- One command. Default: `git revert <commit>`. Note any side-effects
     (e.g. migration rollback SQL, env var to unset). -->

```
git revert <commit>
```

## Screenshots (if UI)

<!-- Before/after, mobile + desktop if the change is visual. Otherwise
     delete this section. -->

## Deploy notes

<!-- Env vars to add/remove, migrations to run, feature flags to flip.
     "None" is a valid answer; write it explicitly. -->

-

---

<sub>See `docs/research/CONTROL_PLANE.md` (in the meta-research
workspace) for the full Definition of Done. See `docs/research/
DECISIONS.md` for will-do / will-not-do rules.</sub>
