import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

test.describe.configure({ timeout: 30_000 });

/**
 * Lock the marketing CTA to "Join the waitlist" pointing at /waitlist.
 *
 * Product pivot per operator: users should NOT be able to log in /
 * sign up bypassing the waitlist. The first wave of that pivot is
 * the marketing CTA swap on every primary surface from "Try it free"
 * / "Start free" / "Start Pro" (all pointing at /paywall or /login)
 * to "Join the waitlist" pointing at /waitlist.
 *
 * /login still exists for invited users and admins; the marketing
 * surfaces just stop sending strangers there.
 */

const repoRoot = path.resolve(__dirname, '..', '..');

test('Navbar primary CTA is "Join the waitlist" pointing at /waitlist', () => {
    const src = fs.readFileSync(path.join(repoRoot, 'src', 'components', 'Navbar.tsx'), 'utf-8');
    // Desktop CTA: href="/waitlist" with "Join the waitlist" label
    expect(src).toMatch(/href="\/waitlist"[^>]*>\s*\n?\s*Join the waitlist/);
    // No stale "Try it free" copy anywhere in the navbar
    expect(src).not.toContain('Try it free');
});

test('FinalCta primary CTA is "Join the waitlist" pointing at /waitlist', () => {
    const src = fs.readFileSync(path.join(repoRoot, 'src', 'sections', 'FinalCta.tsx'), 'utf-8');
    expect(src).toMatch(/href="\/waitlist"/);
    expect(src).toContain('Join the waitlist');
    // No stale /login?returnTo=/integrations or "Start free" copy
    expect(src).not.toContain('Start free');
    expect(src).not.toMatch(/\/login\?returnTo=/);
});

test('Pricing Pro tier CTA is "Join the waitlist" pointing at /waitlist', () => {
    const src = fs.readFileSync(path.join(repoRoot, 'src', 'sections', 'Pricing.tsx'), 'utf-8');
    expect(src).toMatch(/ctaLink:\s*'\/waitlist'/);
    expect(src).toMatch(/cta:\s*'Join the waitlist'/);
    // No stale "Start Pro" / "/paywall" CTA on the Pro tier
    expect(src).not.toMatch(/cta:\s*'Start Pro'/);
});

test('Pricing section header copy no longer promises "Start free"', () => {
    // We are not free anymore; we are gated by the waitlist.
    // The section description has to match. Catches a future copy
    // edit that reverts to the old free-tier framing.
    const src = fs.readFileSync(path.join(repoRoot, 'src', 'sections', 'Pricing.tsx'), 'utf-8');
    expect(src).not.toMatch(/Start free\./);
});

test('Team tier keeps the "Book a call" CTA (unchanged)', () => {
    // The waitlist pivot is consumer-facing. Team customers still
    // book a call. Lock that so the swap PR doesn't accidentally
    // funnel enterprise leads into the same waitlist as consumers.
    const src = fs.readFileSync(path.join(repoRoot, 'src', 'sections', 'Pricing.tsx'), 'utf-8');
    expect(src).toMatch(/cta:\s*'Book a call'/);
});
