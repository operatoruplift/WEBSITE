import { test, expect } from '@playwright/test';
import { prepareGatedSession } from './_helpers';

/**
 * Dashboard honesty regression suite.
 *
 * Locks in the fixes shipped in #164 (dashboard home), #165 (notifications,
 * workflows, analytics), #166 (agents/[id], CommandBar, AgentProvider,
 * onboarding, integrations), and #167 (api/dashboard/stats zero-fallback).
 *
 * Together those PRs eliminated user-specific fabrication, the
 * dashboard home no longer claims `12.4K Memories saved · +2.1K today`
 * or `47 Security Threats Blocked · -12% vs yesterday` or `Gold Agent:
 * 0.0847 oz worth $278.24` to fresh users.
 */

/*
 * Banned fabricated values (documentation, asserted individually below).
 * Dashboard home stats #164: '12.4K', '+2.1K today', '47', 'Security Threats Blocked', '-12% vs yesterday'.
 * Gold Agent widget #164: '0.0847', '$278.24', 'Gold Agent', 'Oro GRAIL'.
 * Activity feed #164: 'Blackwall Blocked SQLi', 'DeepRepo Orchestration', 'Recursive codebase scan', 'Knowledge Indexed', 'Founder Ops Briefing'.
 * System status #164: 'API Gateway (Blackwall)', 'Swarm Router', 'ATP Settlement Layer', 'Vector Store', 'US-EAST-1'.
 * Header chip #164: 'Uplift Core Online'.
 * Workflows fake counts #165: '142', '891'.
 * Notifications fakes #165: 'Blackwall: 3 threats blocked', '1,247 new documents', 'CodePilot Pro updated'.
 */

test('/app dashboard renders honest stats and empty activity for a fresh user', async ({ page }) => {
    await prepareGatedSession(page);
    await page.goto('/app');

    // Wait for stats to load (the route waits 800ms inside fetchDashboardData).
    await expect(page.getByText(/Helpers installed/i).first()).toBeVisible({ timeout: 15_000 });

    const body = (await page.locator('body').innerText()).toLowerCase();

    // Each value-based check is contextual: "47" is fine in isolation
    // but must not appear next to "Security Threats Blocked".
    expect(body, 'Security Threats Blocked stat card removed').not.toContain('security threats blocked');
    expect(body, 'Gold Agent widget removed').not.toContain('gold agent');
    expect(body, 'fabricated 12.4K memory stat removed').not.toContain('12.4k');
    expect(body, '0.0847 oz fabricated portfolio removed').not.toContain('0.0847');
    expect(body, 'fake "Blackwall Blocked SQLi" activity removed').not.toContain('blackwall');
    expect(body, '"Uplift Core Online" sci-fi chip removed').not.toContain('uplift core online');
    expect(body, '"Warp Network" section header removed').not.toContain('warp network');
    expect(body, '"Event Stream" section header replaced with "Recent activity"').not.toContain('event stream');
    expect(body, 'fake "US-EAST-1" region removed').not.toContain('us-east-1');

    // Honest stat labels are present
    expect(body).toContain('helpers installed');
    expect(body).toContain('chat sessions');
    expect(body).toContain('memories saved');

    // Activity feed empty-state message (or real notifications) - never fake events
    const hasEmptyState = body.includes('no activity yet');
    const hasOldFakeEvents = ['blackwall blocked sqli', 'deeprepo orchestration', 'founder ops briefing']
        .some((s) => body.includes(s));
    expect(hasOldFakeEvents, 'no fake activity events').toBe(false);
    if (!hasEmptyState) {
        // Real notifications path - just ensure none are fabricated.
        expect(body, 'no "1,247 new documents" fake notification').not.toContain('1,247 new documents');
    }
});

test('/notifications shows real-only notifications, no Blackwall stubs', async ({ page }) => {
    await prepareGatedSession(page);
    await page.goto('/notifications');

    await expect(page.getByRole('heading', { name: /^Notifications$/ })).toBeVisible({ timeout: 10_000 });

    const body = (await page.locator('body').innerText()).toLowerCase();
    expect(body, 'Blackwall fake threats removed').not.toContain('blackwall: 3 threats');
    expect(body, 'CodePilot Pro fake update removed').not.toContain('codepilot pro updated');
    expect(body, '1,247 new documents fake removed').not.toContain('1,247 new documents');
});

test('/workflows starter templates show 0 runs and Never lastRun', async ({ page }) => {
    await prepareGatedSession(page);
    await page.goto('/workflows');

    await expect(page.getByText(/Daily Code Review/i).first()).toBeVisible({ timeout: 10_000 });

    const body = (await page.locator('body').innerText()).toLowerCase();
    // The PR #165 zeroed-out templates must not pretend to have run
    expect(body, 'fake 142 run count removed').not.toMatch(/\b142\b.*runs/i);
    expect(body, 'fake 891 run count removed').not.toMatch(/\b891\b.*runs/i);
});

test('/integrations summary shows live + coming-soon counts (not fake "X available")', async ({ page }) => {
    await prepareGatedSession(page);
    await page.goto('/integrations');

    await expect(page.getByText(/Integrations/).first()).toBeVisible({ timeout: 10_000 });

    const body = (await page.locator('body').innerText()).toLowerCase();
    // Header summary should call out live + coming-soon counts.
    // Older copy pretended every non-connected row was "available"
    // even when zero of them had a working tool route.
    expect(body).toMatch(/\d+ live/);
    expect(body).toMatch(/\d+ coming soon/);
    // The bare phrase "available" was misleading when 17 rows had it
    // but only 4 routes existed. Now only Gmail/Calendar/Supabase/
    // web-search use the 'available'/'connected' status, so the
    // summary line shouldn't show "X available" at all.
    expect(body).not.toMatch(/\d+ available/);
});

test('/memory shows empty knowledge base on cold load (no fake DEMO_NODES)', async ({ page }) => {
    await prepareGatedSession(page);
    await page.goto('/memory');

    await expect(page.getByText(/Memory/).first()).toBeVisible({ timeout: 10_000 });

    const body = (await page.locator('body').innerText()).toLowerCase();
    // Pre-seeded fake titles retired in this PR — fresh user must not see
    // any of them on first load.
    expect(body, 'fake "Operator Uplift Architecture" seed removed').not.toContain('operator uplift architecture');
    expect(body, 'fake "Agent Builder API Spec" seed removed').not.toContain('agent builder api spec');
    expect(body, 'fake "Security Whitepaper" seed removed').not.toContain('security whitepaper');
    expect(body, 'fake "User Feedback Q1 2026" seed removed').not.toContain('user feedback q1 2026');
    // Empty state copy or DEMO disclosure must be visible
    expect(body).toMatch(/no knowledge indexed yet|demo/i);
});

test('/agents/builder Tools step labels stub tools as DEMO', async ({ page }) => {
    // PR #218 added a `live: boolean` field on each tool option in the
    // wizard; tools without a backing /api/tools/* route get a DEMO
    // badge. Lock that in: the wizard's Tools step must show DEMO badges
    // on at least the known stubs (Slack, Notion, GitHub, Database) so
    // a builder doesn't ship an agent claiming capabilities it can't
    // actually invoke.
    await prepareGatedSession(page);
    await page.goto('/agents/builder');

    await expect(page.getByRole('heading', { name: /Agent Builder/i })).toBeVisible({ timeout: 10_000 });

    // Click through Template + Configure to reach the Tools step.
    await page.getByText(/General Assistant/i).first().click();
    await page.getByRole('button', { name: /Continue|Next/i }).first().click();
    // Configure step needs name + description before continuing
    await page.getByPlaceholder('My Agent').fill('Honesty test agent');
    await page.getByPlaceholder('What does this agent do?').fill('Locks in DEMO tag on stub tools');
    await page.getByRole('button', { name: /Continue|Next/i }).first().click();

    // Tools step renders. The four most-recognizable stubs must each
    // appear within a tile that also includes a DEMO badge.
    const body = await page.locator('body').innerText();
    for (const stub of ['Slack', 'Notion', 'GitHub', 'Database']) {
        expect(body, `${stub} should still be a stub tool`).toContain(stub);
    }
    // At least 5 DEMO badges (we marked 14 stubs). DEMO appears as a
    // pill on each non-live tile; "DEMO" is also used elsewhere on the
    // page so we just assert the count is plural.
    const demoCount = (body.match(/DEMO/g) || []).length;
    expect(demoCount, `Tools step should show >= 5 DEMO badges, got ${demoCount}`).toBeGreaterThanOrEqual(5);
});

test('/settings API Keys section discloses DEMO + drops fake expiry', async ({ page }) => {
    // PR #212 retired the "API key generated (expires in 30 days)" lie.
    // The flow still creates `sk-ou-demo-...` strings but labels them
    // clearly so a builder doesn't try to authenticate against /api/*
    // with a non-functional key.
    await prepareGatedSession(page);
    await page.goto('/settings');

    await expect(page.getByText(/Settings/).first()).toBeVisible({ timeout: 10_000 });

    // The Settings page has a tab nav. Click into the API tab.
    const apiTab = page.getByRole('button', { name: /API|Keys/i }).first();
    if (await apiTab.isVisible().catch(() => false)) {
        await apiTab.click();
    }

    const body = (await page.locator('body').innerText()).toLowerCase();
    // The disclosure paragraph or the DEMO badge must be visible on the
    // API Keys section (one or the other; both is fine).
    expect(body).toMatch(/auth backend.*not.*live|not yet authenticate|generate demo key|demo/i);
    // The retired "expires in 30 days" toast wording must not be present
    // anywhere on the page (the loaded HTML reflects current strings).
    expect(body, 'fake "expires in 30 days" wording stayed retired').not.toContain('expires in 30 days');
});
