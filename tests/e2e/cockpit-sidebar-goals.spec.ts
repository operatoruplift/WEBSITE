import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

test.describe.configure({ timeout: 15_000 });

/**
 * Lock the cockpit sidebar's pivot-era layout. The dashboard nav must
 * lead with Goals, and the home/logo link must land on /goals so a
 * returning operator sees their questline first.
 */

const repoRoot = path.resolve(__dirname, '..', '..');
const sidebarSrc = fs.readFileSync(
    path.join(repoRoot, 'src', 'components', 'cockpit', 'CockpitSidebar.tsx'),
    'utf-8',
);

test('Cockpit sidebar lists Goals as the first nav item', () => {
    const navMatch = sidebarSrc.match(/const NAV_ITEMS[\s\S]+?];/);
    expect(navMatch).not.toBeNull();
    const items = navMatch![0];
    // The first href in the array literal must be /goals.
    const firstHref = items.match(/href:\s*'([^']+)'/);
    expect(firstHref?.[1]).toBe('/goals');
    expect(items).toContain("label: 'Goals'");
});

test('Cockpit logo home link points at /goals', () => {
    // The logo at the top of the sidebar is the implicit "home"
    // button in the dashboard. Post-pivot it lands on /goals.
    expect(sidebarSrc).toMatch(/<Link href="\/goals" aria-label="Home"/);
    expect(sidebarSrc).not.toMatch(/<Link href="\/chat" aria-label="Home"/);
});

test('Cockpit sidebar still carries Chat / Integrations / Security / Profile', () => {
    // These are not retired; they keep their slots below Goals so
    // returning users can find them. If a future trim removes one,
    // this fires so we reassess intent.
    expect(sidebarSrc).toContain("label: 'Chat'");
    expect(sidebarSrc).toContain("label: 'Integrations'");
    expect(sidebarSrc).toContain("label: 'Security'");
    expect(sidebarSrc).toContain("label: 'Profile'");
});
