import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

test.describe.configure({ timeout: 30_000 });

/**
 * Lock Phase 6 of the Gamify Your Growth pivot: blog metadata
 * + featured post pin point at the new pivot announcement, not
 * the (now outdated) "I didn't pivot" Balaji post.
 *
 * Source of truth: docs/PIVOT_GAMIFY_GROWTH.md Phase 6.
 *
 * The Balaji post stays on the site as historical record (and the
 * pivot post explicitly references it), but the featured/pinned
 * slot moves to the pivot announcement.
 */

const repoRoot = path.resolve(__dirname, '..', '..');
const postsSrc = fs.readFileSync(path.join(repoRoot, 'app', 'blog', 'posts.ts'), 'utf-8');
const articleSrc = fs.readFileSync(
    path.join(repoRoot, 'app', 'blog', '[id]', 'page.tsx'),
    'utf-8',
);

test('Pivot post is registered with the canonical id', () => {
    expect(postsSrc).toContain("id: 'why-we-pivoted-to-gamify-your-growth'");
});

test('Pivot post title carries the tagline', () => {
    expect(postsSrc).toContain('Keep your word. Bet on yourself.');
});

test('Pivot post is the new featured post', () => {
    // The pivot post entry must carry featured: true; if a future
    // edit pins a different post, this fires so we review intent.
    const pivotBlock = postsSrc.match(/\{\s*id:\s*'why-we-pivoted-to-gamify-your-growth'[\s\S]+?\}/);
    expect(pivotBlock).not.toBeNull();
    expect(pivotBlock![0]).toContain('featured: true');
});

test('Balaji post is unpinned (post-pivot)', () => {
    // The Balaji "I didn't pivot" post was featured before the
    // pivot. With the pivot now live, the featured slot moves to
    // the pivot announcement. The Balaji entry must not carry
    // featured: true anymore.
    const balajiBlock = postsSrc.match(/\{\s*id:\s*'balaji-pivot-advice'[\s\S]+?\}/);
    expect(balajiBlock).not.toBeNull();
    expect(balajiBlock![0]).not.toContain('featured: true');
});

test('Balaji excerpt acknowledges the pivot', () => {
    // The pre-pivot excerpt read as if no pivot ever happened.
    // Post-pivot, the excerpt must point at the eventual pivot so
    // a reader landing on the Balaji post via search has context.
    const balajiBlock = postsSrc.match(/\{\s*id:\s*'balaji-pivot-advice'[\s\S]+?\}/);
    expect(balajiBlock!).not.toBeNull();
    expect(balajiBlock![0]).toMatch(/pivoted anyway|May 21 post/);
});

test('Pivot post body covers the four required beats', () => {
    // Every pivot announcement should answer the four questions a
    // reader will have: what changes, what stays, what about
    // existing paying users, and (most importantly) why.
    expect(articleSrc).toContain('What stays');
    expect(articleSrc).toContain('What changes for you');
    expect(articleSrc).toContain('What I owe the people who already paid');
    expect(articleSrc).toContain('The math I could not unsee');
});

test('Pivot post offers a no-friction refund to existing AI-assistant users', () => {
    // This is the founder-to-customer covenant. Locking it in spec
    // form means a future copy edit cannot quietly weaken or
    // remove the refund promise.
    expect(articleSrc).toContain('want a refund');
    expect(articleSrc).toContain('No friction');
});
