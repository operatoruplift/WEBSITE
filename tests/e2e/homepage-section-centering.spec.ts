import { test, expect } from '@playwright/test';

/**
 * Hermetic regression test for the FadeIn inline-block centering
 * trap (PR #738).
 *
 * Symptom that returned across 8+ rounds of feedback:
 *
 *   > "sections still hugging left of page instead of centered"
 *
 * Cause: <FadeIn> defaults to display:inline-block, which collapses
 * to the child's natural width. text-center inside centers the TEXT
 * within that collapsed box, but the box itself sits left-anchored
 * against the parent column. Fix is to pass `block` prop on every
 * section-wrapper FadeIn.
 *
 * This spec walks every named section on the homepage and asserts
 * the h2 sits with symmetric leftGap/rightGap inside its section
 * (within 30px tolerance to absorb subpixel rounding). If the
 * inline-block trap ever returns, leftGap and rightGap diverge
 * sharply and the test fails.
 *
 * Sister spec: tests/e2e/blog-header-centered.spec.ts (the original
 * incarnation of the same bug on /blog, fixed in PR #587).
 */

// 2026-06-03: trimmed to match the live homepage. market-now
// (TrustedByStrip) was removed earlier, faq moved to /faq, and
// FaqSection no longer mounts on the homepage. ProblemSection,
// AppSection, and HowItWorksSection remain.
const SECTIONS = [
    { id: 'problem', name: 'ProblemSection (01 - The problem)' },
    { id: 'app', name: 'AppSection (02 - The app)' },
    { id: 'how-it-works', name: 'HowItWorksSection (03)' },
];

test.describe('homepage section h2 centering', () => {
    test('each section h2 sits with symmetric left/right gap inside its section', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto('/', { waitUntil: 'load', timeout: 60_000 });

        // Walk the page so every FadeIn IntersectionObserver fires
        // and content is in its final position. Without this, the
        // h2 might be transformed (translateY) and the bounding
        // box would be off-center on the cross-axis.
        for (let y = 0; y < 12000; y += 600) {
            await page.evaluate((sy) => window.scrollTo(0, sy), y);
            await page.waitForTimeout(80);
        }
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(400);

        for (const section of SECTIONS) {
            const probe = await page.locator('#' + section.id).evaluate((s) => {
                const inner = s.querySelector('h2');
                if (!inner) return null;
                const r = s.getBoundingClientRect();
                const ir = inner.getBoundingClientRect();
                return {
                    leftGap: ir.left - r.left,
                    rightGap: r.right - ir.right,
                    h2Width: ir.width,
                    sectionWidth: r.width,
                };
            });

            if (!probe) {
                throw new Error(`section #${section.id} has no h2`);
            }

            const delta = Math.abs(probe.leftGap - probe.rightGap);
            expect(
                delta,
                `${section.name} (#${section.id}): h2 left/right gaps must be symmetric. ` +
                `leftGap=${probe.leftGap.toFixed(0)} rightGap=${probe.rightGap.toFixed(0)} ` +
                `delta=${delta.toFixed(0)} h2Width=${probe.h2Width.toFixed(0)} ` +
                `sectionWidth=${probe.sectionWidth.toFixed(0)}. ` +
                `If this fails check the wrapper FadeIn passes the \`block\` prop ` +
                `(see PR #738, FadeIn inline-block trap).`,
            ).toBeLessThan(30);
        }
    });
});
