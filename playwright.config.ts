import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for Operator Uplift smoke tests.
 *
 * Run locally:
 *   pnpm add -D @playwright/test
 *   npx playwright install chromium
 *   pnpm exec playwright test
 *
 * Run against staging:
 *   PLAYWRIGHT_BASE_URL=https://operatoruplift-staging.vercel.app pnpm exec playwright test
 */
export default defineConfig({
    testDir: './tests/e2e',
    timeout: 30_000,
    expect: { timeout: 5_000 },
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    reporter: process.env.CI ? 'github' : 'list',
    use: {
        baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    webServer: process.env.PLAYWRIGHT_BASE_URL
        ? undefined
        : {
              command: 'pnpm dev',
              url: 'http://localhost:3000',
              reuseExistingServer: !process.env.CI,
              timeout: 120_000,
          },
});
