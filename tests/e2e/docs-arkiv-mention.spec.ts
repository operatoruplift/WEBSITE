import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

test.describe.configure({ timeout: 30_000 });

/**
 * Lock the Arkiv mention in the /docs "What ships today" list.
 *
 * After PR #570 added a 0G Storage line and PR #515 added the
 * Filecoin line, this spec locks the Arkiv line that lists agent
 * identity cards + user-ownable memory entities on Braga testnet
 * (PRs #620..#629). If a future copy edit drops Arkiv from "what
 * ships today" while it is still live, the docs page goes silently
 * out of sync with the homepage Built-on strip, /demo/hackathon
 * VerifyCard grid, README + TRUTH_TABLE, and the deck objection
 * surface map.
 *
 * Companion to:
 *   - localfirst-built-on-honest.spec.ts (Built-on Arkiv pill)
 *   - demo-hackathon-judge-links.spec.ts (Arkiv VerifyCard href)
 *   - blog-arkiv-post.spec.ts (launch post)
 *   - arkiv-routes.spec.ts (API envelopes)
 *
 * File-scope only (no webserver bootstrap), per the same pattern as
 * demo-hackathon-hero-copy.spec.ts.
 */

const repoRoot = path.resolve(__dirname, '..', '..');
const docContent = fs.readFileSync(
    path.join(repoRoot, 'app', 'docs', '_components', 'DocContent.tsx'),
    'utf-8',
);

test('/docs getting-started lists Arkiv as a shipped surface', () => {
    expect(docContent).toMatch(/Arkiv Braga testnet/);
});

test('/docs Arkiv line points readers at /arkiv (the user-visible route)', () => {
    expect(docContent).toMatch(/href="\/arkiv"/);
});

test('/docs Arkiv line stays honest about the empty-until-funded state', () => {
    // The hermetic empty-state contract has to mirror what /arkiv
    // actually renders, otherwise the docs imply a populated entity
    // list when there isn't one. Catches future copy edits that
    // upgrade the line from "stays empty until..." to a fabricated
    // claim about deployed agents.
    expect(docContent).toMatch(/stays empty until/i);
});

test('/docs Arkiv line is categorized as agent identity, not as a third receipt mirror', () => {
    // Arkiv stores agent identity cards + memory entities; it is
    // NOT a third receipt anchor. The receipt mirror story stops
    // at Filecoin + 0G Storage. Conflating them in copy would
    // misrepresent what each network does and break the docs
    // contract with /security (which only renders two receipt
    // mirror links per receipt). Lock the framing here.
    expect(docContent).toMatch(/Agent identity cards/);
    // The receipt-mirror sentence must stay scoped to TWO networks.
    expect(docContent).toMatch(/two parallel public-storage mirrors/);
});
