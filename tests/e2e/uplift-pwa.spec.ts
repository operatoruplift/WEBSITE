import { test, expect, type Page } from '@playwright/test';

/**
 * Uplift PWA at /app: the full usable loop against the localStorage
 * store. Every context starts fresh (no ou_uplift_db_v1), so each test
 * sees the seeded state: $60 practice balance, six open batches, no
 * active enrollment, onboarding not yet seen.
 */

async function skipOnboarding(page: Page) {
  await page.goto('/app');
  await expect(page.getByText('Put a little on the line')).toBeVisible({ timeout: 15_000 });
  await page.getByText('Skip intro').click();
  await expect(page.getByText('Welcome back,')).toBeVisible();
}

test.describe('uplift pwa', () => {
  test('serves manifest and service worker', async ({ request }) => {
    const manifest = await request.get('/manifest.json');
    expect(manifest.ok()).toBeTruthy();
    const body = await manifest.json();
    expect(body.start_url).toBe('/app');
    expect(body.icons.some((i: { sizes: string }) => i.sizes === '512x512')).toBeTruthy();

    const sw = await request.get('/sw.js');
    expect(sw.ok()).toBeTruthy();
    expect(await sw.text()).toContain('ou-uplift');
  });

  test('onboarding shows once, then home with seeded state', async ({ page }) => {
    await skipOnboarding(page);
    await expect(page.getByText('Operator', { exact: true })).toBeVisible();
    await expect(page.getByText('No active challenge')).toBeVisible();
    await expect(page.getByText('Find your next challenge')).toBeVisible();

    // Reload: onboarding is remembered as seen.
    await page.reload();
    await expect(page.getByText('Welcome back,')).toBeVisible();
  });

  test('browse lists challenges and filters', async ({ page }) => {
    await skipOnboarding(page);
    await page.getByText('See all').click();
    await expect(page.getByText('All challenges')).toBeVisible();
    await expect(page.getByText('The 6 AM Club')).toBeVisible();
    await expect(page.getByText('Deep Work 66')).toBeVisible();
    await page.getByRole('button', { name: '100% back' }).click();
    await expect(page.getByText('Deep Work 66')).toBeVisible();
    await expect(page.getByText('The 6 AM Club')).toBeHidden();
  });

  test('join, prove via dispute, and land the streak', async ({ page }) => {
    await skipOnboarding(page);

    // Join The 6 AM Club from the home discovery rail.
    await page.getByText('The 6 AM Club').first().click();
    await expect(page.getByText('Commit to 28 Days')).toBeVisible();
    await page.getByRole('button', { name: /Lock It In for \$28/ }).click();

    // Home now shows the active hero + Prove It. The button pulses
    // forever (ou_pulse), so Playwright's stability wait never settles;
    // force the click.
    await expect(page.getByText('ACTIVE · DAY 1 OF 28')).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: /Prove It/ }).click({ force: true });

    // Camera screen: submit without a photo so verification fails.
    await expect(page.getByText('Snap your proof!')).toBeVisible();
    await page.getByRole('button', { name: 'Submit without a photo' }).click();

    // Verdict: rejected with the signal list revealed.
    await expect(page.getByText('Proof rejected')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('No photo was submitted')).toBeVisible();

    // Dispute: human review approves, victory screen, day counts.
    await page.getByRole('button', { name: /Dispute: request human review/ }).click();
    await expect(page.getByText('Nailed It!')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Day 1 of 28 complete')).toBeVisible();
    await page.getByRole('button', { name: 'Awesome!' }).click();

    // Back home: proven today, streak of 1 in the header.
    await expect(page.getByRole('button', { name: /Proven Today/ })).toBeVisible();
  });

  test('vault topup and cashout update the balance', async ({ page }) => {
    await skipOnboarding(page);
    await page.getByRole('button', { name: 'Vault' }).click();
    await expect(page.getByText('Your Vault')).toBeVisible();
    await expect(page.getByText('$60.00')).toBeVisible();

    // Top up $25 via preset.
    await page.getByRole('button', { name: 'Top Up' }).click();
    await expect(page.getByText('Amount to add')).toBeVisible();
    await page.getByRole('button', { name: '$25', exact: true }).click();
    await page.getByRole('button', { name: /Add \$25\.00 with Apple Pay/ }).click();
    await expect(page.getByText('$85.00')).toBeVisible({ timeout: 10_000 });

    // Activity shows the transaction.
    await page.getByRole('button', { name: 'Activity' }).click();
    await expect(page.getByText('Added funds').first()).toBeVisible();
  });

  test('journey, community, and notifications render seeded content', async ({ page }) => {
    await skipOnboarding(page);

    await page.getByRole('button', { name: 'Journey' }).click();
    await expect(page.getByText('My Journey')).toBeVisible();
    await expect(page.getByText('Trophy room')).toBeVisible();
    await expect(page.getByText('Early Riser')).toBeVisible();

    await page.getByRole('button', { name: 'Community' }).click();
    await expect(page.getByText('Leaderboard').first()).toBeVisible();
    await page.getByRole('button', { name: 'Friends' }).click();
    await expect(page.getByText('Maya R.')).toBeVisible();
    await page.getByRole('button', { name: 'Groups' }).click();
    await expect(page.getByText('Dawn Patrol')).toBeVisible();

    await page.getByRole('button', { name: 'Home' }).click();
    await expect(page.getByText('Welcome back,')).toBeVisible();
  });

  test('homepage links into the app', async ({ page }) => {
    await page.goto('/');
    const cta = page.getByRole('link', { name: /Try the live app/ });
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href', '/app');
  });
});
