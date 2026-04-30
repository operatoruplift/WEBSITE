import { test, expect } from '@playwright/test';
import { buildAgentManifest, generateAgentId } from '@/lib/agents/build-manifest';

/**
 * Unit tests for buildAgentManifest — the pure normaliser called by
 * /api/agents POST when a user publishes an agent to the marketplace.
 *
 * A regression in the defaults would mean published agents land in
 * Supabase with mismatched fields (e.g. price=undefined instead of
 * 'free'), and the marketplace UI would render broken cards or fail
 * the not-null DB constraint.
 *
 * Run:
 *   pnpm exec playwright test tests/e2e/agents-buildAgentManifest.spec.ts --reporter=list
 */

test.describe('generateAgentId', () => {
    test('uses agent- prefix + timestamp + random suffix', () => {
        const id = generateAgentId();
        expect(id).toMatch(/^agent-\d+-[a-z0-9]{1,6}$/);
    });

    test('clock-injectable for deterministic tests', () => {
        const id = generateAgentId(1234567890, () => 'abc1');
        expect(id).toBe('agent-1234567890-abc1');
    });

    test('different random suffixes produce different ids at same timestamp', () => {
        const a = generateAgentId(1000, () => 'a');
        const b = generateAgentId(1000, () => 'b');
        expect(a).not.toBe(b);
    });
});

test.describe('buildAgentManifest', () => {
    test('throws when name is missing', () => {
        expect(() => buildAgentManifest({}, 'user-1')).toThrow('requires `name`');
    });

    test('throws when name is empty string', () => {
        expect(() => buildAgentManifest({ name: '' }, 'user-1')).toThrow('requires `name`');
    });

    test('uses provided id when present (publish from existing draft)', () => {
        const m = buildAgentManifest({ id: 'agent-existing', name: 'X' }, 'user-1');
        expect(m.id).toBe('agent-existing');
    });

    test('generates id when missing (clock-injectable)', () => {
        const m = buildAgentManifest({ name: 'X' }, 'user-1', { now: 5000, rand: () => 'xyz1' });
        expect(m.id).toBe('agent-5000-xyz1');
    });

    test('preserves author_id from caller (not from body)', () => {
        const m = buildAgentManifest(
            { name: 'X', author: 'Forged Author' },
            'real-user-from-jwt',
        );
        expect(m.author_id).toBe('real-user-from-jwt');
        // body.author becomes the display name; author_id is the
        // verified Privy id. Documents the security invariant.
        expect(m.author).toBe('Forged Author');
    });

    test('applies all default values when body has only name', () => {
        const m = buildAgentManifest({ name: 'Bare' }, 'u-1');
        expect(m).toMatchObject({
            name: 'Bare',
            author_id: 'u-1',
            description: '',
            version: '1.0.0',
            author: 'Community',
            category: 'General',
            model: 'claude-sonnet-4-6',
            system_prompt: '',
            tools: [],
            permissions: [],
            price: 'free',
            avatar: '',
            tags: [],
        });
    });

    test('preserves explicit values across every documented field', () => {
        const m = buildAgentManifest(
            {
                name: 'My Agent',
                description: 'desc',
                version: '2.5.1',
                author: 'Acme Inc',
                category: 'Productivity',
                model: 'gpt-4o',
                systemPrompt: 'You are helpful.',
                tools: [{ tool: 'gmail', action: 'send' }],
                permissions: ['gmail.send'],
                price: '0.10',
                avatar: 'https://example.com/a.png',
                tags: ['email', 'productivity'],
            },
            'u-1',
        );
        expect(m.description).toBe('desc');
        expect(m.version).toBe('2.5.1');
        expect(m.author).toBe('Acme Inc');
        expect(m.category).toBe('Productivity');
        expect(m.model).toBe('gpt-4o');
        expect(m.system_prompt).toBe('You are helpful.');
        expect(m.tools).toHaveLength(1);
        expect(m.permissions).toEqual(['gmail.send']);
        expect(m.price).toBe('0.10');
        expect(m.avatar).toBe('https://example.com/a.png');
        expect(m.tags).toEqual(['email', 'productivity']);
    });

    test('accepts both systemPrompt (camelCase) and system_prompt (snake_case)', () => {
        const cam = buildAgentManifest({ name: 'X', systemPrompt: 'cam' }, 'u-1');
        const sna = buildAgentManifest({ name: 'X', system_prompt: 'sna' }, 'u-1');
        expect(cam.system_prompt).toBe('cam');
        expect(sna.system_prompt).toBe('sna');
    });

    test('camelCase systemPrompt wins over snake_case when both present', () => {
        // The route's original priority. Documents the contract so a
        // refactor that swapped the order would surface here.
        const m = buildAgentManifest(
            { name: 'X', systemPrompt: 'first', system_prompt: 'second' },
            'u-1',
        );
        expect(m.system_prompt).toBe('first');
    });

    test('empty arrays vs undefined: empty array is preserved, not replaced with default', () => {
        const m = buildAgentManifest({ name: 'X', tools: [], tags: [] }, 'u-1');
        expect(m.tools).toEqual([]);
        expect(m.tags).toEqual([]);
    });

    test('undefined description ⇒ empty string default', () => {
        const m = buildAgentManifest({ name: 'X' }, 'u-1');
        expect(m.description).toBe('');
    });

    test('explicit empty-string description is preserved (not replaced)', () => {
        // Documents the ?? vs || distinction. body.description = ''
        // should be preserved, not replaced with the default.
        const m = buildAgentManifest({ name: 'X', description: '' }, 'u-1');
        expect(m.description).toBe('');
    });

    test('explicit empty-string price falls back to default (uses ||, not ??)', () => {
        // The original route used `body.price || 'free'`, so empty
        // string was treated as missing. Documenting that specific
        // semantic so a refactor doesn't accidentally change it.
        const m = buildAgentManifest({ name: 'X', price: '' }, 'u-1');
        expect(m.price).toBe('free');
    });

    test('result is a fresh object each call (no shared reference)', () => {
        const m1 = buildAgentManifest({ name: 'X' }, 'u-1');
        const m2 = buildAgentManifest({ name: 'X' }, 'u-1');
        expect(m1).not.toBe(m2);
        // Tools array is also a fresh reference (the [] default is
        // re-evaluated each call).
        expect(m1.tools).not.toBe(m2.tools);
    });
});
