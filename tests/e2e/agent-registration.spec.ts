import { test, expect } from '@playwright/test';
import crypto from 'node:crypto';
import {
    CALENDAR_AGENT,
    GMAIL_AGENT,
    getRegistrationBySlug,
    type AgentRegistration,
} from '@/lib/agent-registration';
import { canonicalJson } from '@/lib/x402/invoices';

/**
 * Unit tests for the ERC-8004-style agent registration manifests.
 *
 * The /agents/{slug}.json route serves these as machine-readable
 * descriptors so external agents can discover capabilities, endpoints,
 * pricing, and receipt-verification public keys. The contract is:
 *
 *   - Each registration ships with a SHA-256 checksum over
 *     canonicalJson(everything except the checksum field)
 *   - getRegistrationBySlug returns the right manifest for "calendar"
 *     and "gmail", null otherwise
 *   - Paid capabilities carry an amount_usdc; free capabilities don't
 *
 * A regression in any of:
 * - Checksum computation -> external verifiers reject our manifests
 * - Registration shape -> ERC-8004 consumers misparse
 * - Pricing metadata -> mismatch between manifest and actual gate
 *
 * Run:
 *   pnpm exec playwright test tests/e2e/agent-registration.spec.ts --reporter=list
 */

test.describe('getRegistrationBySlug', () => {
    test('returns CALENDAR_AGENT for "calendar"', () => {
        expect(getRegistrationBySlug('calendar')).toBe(CALENDAR_AGENT);
    });

    test('returns GMAIL_AGENT for "gmail"', () => {
        expect(getRegistrationBySlug('gmail')).toBe(GMAIL_AGENT);
    });

    test('returns null for unknown slug', () => {
        expect(getRegistrationBySlug('todoist')).toBeNull();
        expect(getRegistrationBySlug('')).toBeNull();
        expect(getRegistrationBySlug('CALENDAR')).toBeNull(); // case-sensitive
    });
});

test.describe('Registration shape contract', () => {
    function recomputeChecksum(reg: AgentRegistration): string {
        const { checksum: _drop, ...rest } = reg;
        void _drop;
        const canonical = canonicalJson(rest);
        return crypto.createHash('sha256').update(canonical).digest('hex');
    }

    for (const reg of [CALENDAR_AGENT, GMAIL_AGENT]) {
        test(`${reg.id} has the documented top-level fields`, () => {
            expect(reg.id.length).toBeGreaterThan(0);
            expect(reg.name.length).toBeGreaterThan(0);
            expect(reg.description.length).toBeGreaterThan(0);
            expect(reg.version).toMatch(/^\d+\.\d+\.\d+$/);
            expect(reg.publisher.name).toBeTruthy();
            expect(reg.publisher.url).toMatch(/^https?:\/\//);
            expect(Array.isArray(reg.capabilities)).toBe(true);
            expect(reg.capabilities.length).toBeGreaterThan(0);
            expect(Array.isArray(reg.endpoints)).toBe(true);
            expect(reg.endpoints.length).toBeGreaterThan(0);
            expect(reg.pricing.model).toBe('x402');
            expect(reg.pricing.currency).toBe('USDC');
            expect(reg.receipt_public_key_url).toMatch(/^https?:\/\//);
            expect(reg.receipt_public_key_url).toContain('/api/receipts/public-key');
            expect(reg.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
        });

        test(`${reg.id} checksum matches recomputed SHA-256(canonicalJson(...))`, () => {
            const recomputed = recomputeChecksum(reg);
            expect(reg.checksum).toBe(recomputed);
        });

        test(`${reg.id} checksum is 64 hex chars (SHA-256)`, () => {
            expect(reg.checksum).toMatch(/^[a-f0-9]{64}$/);
        });

        test(`${reg.id} every capability has tool + action + description + paid`, () => {
            for (const cap of reg.capabilities) {
                expect(cap.tool.length, `${cap.tool}.${cap.action} tool`).toBeGreaterThan(0);
                expect(cap.action.length, `${cap.tool}.${cap.action} action`).toBeGreaterThan(0);
                expect(cap.description.length, `${cap.tool}.${cap.action} desc`).toBeGreaterThan(0);
                expect(typeof cap.paid, `${cap.tool}.${cap.action} paid`).toBe('boolean');
            }
        });

        test(`${reg.id} paid capabilities carry amount_usdc; free ones don't`, () => {
            for (const cap of reg.capabilities) {
                if (cap.paid) {
                    expect(cap.amount_usdc, `${cap.tool}.${cap.action} amount`).toBeGreaterThan(0);
                } else {
                    expect(cap.amount_usdc, `${cap.tool}.${cap.action} no amount`).toBeUndefined();
                }
            }
        });
    }
});

test.describe('Calendar agent capabilities', () => {
    test('exposes list (free), free_slots (free), create (paid)', () => {
        const caps = CALENDAR_AGENT.capabilities;
        const list = caps.find(c => c.action === 'list');
        const slots = caps.find(c => c.action === 'free_slots');
        const create = caps.find(c => c.action === 'create');

        expect(list?.paid).toBe(false);
        expect(slots?.paid).toBe(false);
        expect(create?.paid).toBe(true);
        expect(create?.amount_usdc).toBe(0.01);
    });
});

test.describe('Gmail agent capabilities', () => {
    test('reads are free, draft + send + send_draft are paid at $0.01', () => {
        const caps = GMAIL_AGENT.capabilities;
        const free = caps.filter(c => !c.paid).map(c => c.action);
        const paid = caps.filter(c => c.paid);
        expect(free).toContain('list');
        for (const cap of paid) {
            expect(cap.amount_usdc).toBe(0.01);
        }
    });
});

test.describe('Determinism', () => {
    test('CALENDAR_AGENT and GMAIL_AGENT have different ids + checksums', () => {
        expect(CALENDAR_AGENT.id).not.toBe(GMAIL_AGENT.id);
        expect(CALENDAR_AGENT.checksum).not.toBe(GMAIL_AGENT.checksum);
    });

    test('module-level constants are stable references (not regenerated)', () => {
        // The registrations are computed at module-load time, so two
        // imports of the same agent should be the same object reference.
        expect(getRegistrationBySlug('calendar')).toBe(CALENDAR_AGENT);
        expect(getRegistrationBySlug('calendar')).toBe(getRegistrationBySlug('calendar'));
    });
});
