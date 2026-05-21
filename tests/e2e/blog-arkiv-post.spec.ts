import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

test.describe.configure({ timeout: 30_000 });

/**
 * Lock the existence of the Arkiv launch post on /blog.
 *
 * The Arkiv Network School Ethereum Hackathon integration shipped across PRs #620..#627 with
 * matching surface coherence on the homepage Built-on strip, the
 * /demo/hackathon judge grid, README + TRUTH_TABLE, deck objections,
 * and operator smoke. The blog entry is the user-facing "what
 * shipped this week" narrative; if it drops out of the index or its
 * full article body disappears, the launch story goes silent on the
 * one surface a non-judge reader would actually hit.
 *
 * This spec is file-scope only (no webserver bootstrap), in the same
 * shape as `tests/e2e/demo-hackathon-hero-copy.spec.ts`.
 */

const repoRoot = path.resolve(__dirname, '..', '..');
const postsSrc = fs.readFileSync(path.join(repoRoot, 'app', 'blog', 'posts.ts'), 'utf-8');
const detailSrc = fs.readFileSync(
    path.join(repoRoot, 'app', 'blog', '[id]', 'page.tsx'),
    'utf-8',
);

test('/blog index lists the Arkiv launch post by id', () => {
    expect(postsSrc).toMatch(/id:\s*'arkiv-agent-memory-you-own'/);
});

test('/blog index titles the Arkiv post around user-owned memory', () => {
    // Brand voice rule: titles speak to the user, not the vendor.
    // "Agents whose memory you actually own" is the locked phrasing
    // and the Network School Ethereum Hackathon (AI track) one-liner. If a future edit swaps
    // it for vendor-first framing ("We shipped Arkiv...") the
    // marketing-honesty net catches it.
    expect(postsSrc).toContain('Agents whose memory you actually own');
});

test('/blog detail page renders the Arkiv article body', () => {
    expect(detailSrc).toMatch(/'arkiv-agent-memory-you-own'/);
    expect(detailSrc).toContain('Agent identity cards');
    expect(detailSrc).toContain('Session memory events');
});

test('/blog Arkiv post is honest about the empty state', () => {
    // Same rule that locks the /arkiv page: until the operator funds
    // ARKIV_PRIVATE_KEY and runs the publish script, the entity list
    // is empty. The blog post has to mirror that, not fabricate a
    // launched dashboard. Catches the case where future copy edits
    // accidentally upgrade the post from "honest empty state" to
    // "look at all our published agents."
    expect(detailSrc).toMatch(/honest empty state/i);
});

test('/blog Arkiv post stays em-dash-free per the copy-check rule', () => {
    // scripts/copy-check.mjs scans app/ + src/ for em-dashes. The
    // blog post lives in app/blog/, so it has to keep that rule
    // hermetically. Re-asserts at the spec layer so a CI run that
    // skips the copy-check still flags it.
    const arkivBlock = detailSrc.slice(
        detailSrc.indexOf("'arkiv-agent-memory-you-own'"),
        detailSrc.indexOf("'og-storage-second-mirror'"),
    );
    expect(arkivBlock).not.toMatch(/—/);
});
