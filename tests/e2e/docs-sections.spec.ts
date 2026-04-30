import { test, expect } from '@playwright/test';
import { DOC_SECTIONS, DOC_GROUPS, findDoc, type DocEntry } from '@/lib/docs/sections';

/**
 * Unit tests for the /docs sidebar index in lib/docs/sections.ts.
 *
 * The /docs/[slug] dynamic route looks up entries via findDoc(slug)
 * and renders 404 when null. The sidebar nav iterates DOC_GROUPS to
 * build group → entries lists.
 *
 * A regression in:
 *   findDoc        — clicking a sidebar link 404s instead of rendering
 *   DOC_SECTIONS   — entry slugs collide, breaking deep links
 *   DOC_GROUPS     — sidebar group order drifts from the documented one
 *   group field    — orphan group (entry with group not in DOC_GROUPS)
 *                    means the sidebar silently drops the entry
 *
 * Run:
 *   pnpm exec playwright test tests/e2e/docs-sections.spec.ts --reporter=list
 */

test.describe('findDoc', () => {
    test('returns the first DOC_SECTIONS entry when slug is undefined (/docs landing)', () => {
        const result = findDoc(undefined);
        expect(result).toBeTruthy();
        expect(result?.slug).toBe(DOC_SECTIONS[0].slug);
    });

    test('returns the first entry when slug is empty string (treated as undefined)', () => {
        // The current contract is `if (!slug) return DOC_SECTIONS[0]`,
        // so empty string falls into the same branch as undefined.
        const result = findDoc('');
        expect(result?.slug).toBe(DOC_SECTIONS[0].slug);
    });

    test('returns the matching entry for each known slug', () => {
        for (const entry of DOC_SECTIONS) {
            const found = findDoc(entry.slug);
            expect(found?.slug).toBe(entry.slug);
            expect(found?.title).toBe(entry.title);
        }
    });

    test('returns undefined for unknown slug (caller renders 404)', () => {
        expect(findDoc('does-not-exist')).toBeUndefined();
        expect(findDoc('random-slug-xyz')).toBeUndefined();
    });

    test('case-sensitive: uppercase slug returns undefined', () => {
        // Documents the contract — slugs are lowercase. A regression
        // that normalized case would change routing behavior.
        expect(findDoc('GETTING-STARTED')).toBeUndefined();
    });
});

test.describe('DOC_SECTIONS contract', () => {
    test('every entry has slug + title + summary + group', () => {
        for (const entry of DOC_SECTIONS) {
            expect(entry.slug).toBeTruthy();
            expect(entry.title).toBeTruthy();
            expect(entry.summary).toBeTruthy();
            expect(entry.group).toBeTruthy();
        }
    });

    test('every slug is unique (no duplicate dynamic routes)', () => {
        const slugs = DOC_SECTIONS.map(d => d.slug);
        expect(new Set(slugs).size).toBe(slugs.length);
    });

    test('every slug is lowercase URL-safe (no spaces, no uppercase)', () => {
        for (const entry of DOC_SECTIONS) {
            expect(entry.slug).toMatch(/^[a-z0-9-]+$/);
        }
    });

    test('every entry.group is in DOC_GROUPS (sidebar contract)', () => {
        for (const entry of DOC_SECTIONS) {
            expect(DOC_GROUPS).toContain(entry.group);
        }
    });

    test('first entry is the landing page documented as /docs (no slug)', () => {
        // The findDoc(undefined) → DOC_SECTIONS[0] contract relies on
        // this. Documenting it explicitly so a refactor that re-orders
        // the sidebar doesn't accidentally swap the landing page.
        expect(DOC_SECTIONS[0].slug).toBe('getting-started');
    });
});

test.describe('DOC_GROUPS contract', () => {
    test('exposes the documented 5 groups in the sidebar order', () => {
        expect(DOC_GROUPS).toEqual([
            'Start here',
            'Core concepts',
            'Economics',
            'Integrations',
            'Reference',
        ]);
    });

    test('every group has at least one entry (no empty sections in the sidebar)', () => {
        for (const group of DOC_GROUPS) {
            const inGroup = DOC_SECTIONS.filter(d => d.group === group);
            expect(inGroup.length).toBeGreaterThan(0);
        }
    });
});

test.describe('Type contract', () => {
    test('DocEntry shape matches the documented fields', () => {
        // Compile-time check via assignment. Runtime: verify entry[0]
        // has the four documented fields.
        const e: DocEntry = DOC_SECTIONS[0];
        expect(typeof e.slug).toBe('string');
        expect(typeof e.title).toBe('string');
        expect(typeof e.summary).toBe('string');
        expect(typeof e.group).toBe('string');
    });
});
