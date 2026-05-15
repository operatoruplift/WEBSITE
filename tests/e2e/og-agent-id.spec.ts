import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import {
    agentIdContractExplorerUrl,
    agentIdTokenExplorerUrl,
    og0AgentIdStatus,
    sha256Hex32,
    agentToIntelligentData,
} from '@/lib/og/agent-id';
import { CALENDAR_AGENT, GMAIL_AGENT } from '@/lib/agent-registration';

/**
 * Hermetic spec for the 0G Agent ID (ERC-7857) integration shipped in
 * PR #571 (module) and PR #574 (mint scaffolding + registration field).
 *
 * Locks four things that judges and external verifiers depend on:
 *
 *   1. data/og-agent-ids.json carries the documented schema
 *      (slugs match registered agents, contract is the 0G Foundation
 *      reference deployment on Galileo Testnet, _network is correct)
 *   2. The hide-when-NULL contract — when a tokenId is null in the
 *      persistence file, the og_agent_id field is omitted from the
 *      public agent JSON; we never claim a tokenId we don't have
 *   3. agentIdTokenExplorerUrl + agentIdContractExplorerUrl produce
 *      chainscan URLs that match the 0G Galileo Testnet format
 *   4. agentToIntelligentData hashes every identity-relevant field
 *      (name, description, version, capabilities, systemPrompt, model)
 *      with deterministic SHA-256 + canonicalization
 *
 * Run:
 *   pnpm exec playwright test tests/e2e/og-agent-id.spec.ts --reporter=list
 */

const REFERENCE_CONTRACT = '0x2700F6A3e505402C9daB154C5c6ab9cAEC98EF1F';
const REFERENCE_EXPLORER = 'https://chainscan-galileo.0g.ai';

test.describe('data/og-agent-ids.json persistence file', () => {
    const persistPath = path.join(process.cwd(), 'data', 'og-agent-ids.json');

    test('file exists and is valid JSON', () => {
        const raw = fs.readFileSync(persistPath, 'utf-8');
        expect(() => JSON.parse(raw)).not.toThrow();
    });

    test('documents the 0G Foundation reference contract on Galileo Testnet', () => {
        const file = JSON.parse(fs.readFileSync(persistPath, 'utf-8'));
        expect(file._contract).toBe(REFERENCE_CONTRACT);
        expect(file._network).toBe('galileo-testnet');
        expect(file._explorer).toBe(REFERENCE_EXPLORER);
        expect(file._standard).toBe('ERC-7857');
    });

    test('agents map has entries for every registered slug', () => {
        const file = JSON.parse(fs.readFileSync(persistPath, 'utf-8'));
        expect(file.agents).toBeDefined();
        expect(file.agents).toHaveProperty('calendar');
        expect(file.agents).toHaveProperty('gmail');
    });

    test('every tokenId is either a number or null (no strings, no objects)', () => {
        const file = JSON.parse(fs.readFileSync(persistPath, 'utf-8'));
        for (const [slug, tokenId] of Object.entries(file.agents)) {
            expect(
                typeof tokenId === 'number' || tokenId === null,
                `slug ${slug} has non-{number|null} tokenId`,
            ).toBe(true);
        }
    });
});

test.describe('Hide-when-NULL contract on agent registrations', () => {
    test('CALENDAR_AGENT omits og_agent_id when tokenId is null', () => {
        const file = JSON.parse(
            fs.readFileSync(path.join(process.cwd(), 'data', 'og-agent-ids.json'), 'utf-8'),
        );
        // Only assert the omission contract when the persistence file
        // still has null for calendar. Once minted, this test naturally
        // becomes a no-op (and the next test below applies).
        if (file.agents.calendar === null) {
            expect(CALENDAR_AGENT.og_agent_id).toBeUndefined();
        }
    });

    test('GMAIL_AGENT omits og_agent_id when tokenId is null', () => {
        const file = JSON.parse(
            fs.readFileSync(path.join(process.cwd(), 'data', 'og-agent-ids.json'), 'utf-8'),
        );
        if (file.agents.gmail === null) {
            expect(GMAIL_AGENT.og_agent_id).toBeUndefined();
        }
    });

    test('when og_agent_id IS present, it carries the documented fields', () => {
        for (const reg of [CALENDAR_AGENT, GMAIL_AGENT]) {
            if (reg.og_agent_id) {
                expect(typeof reg.og_agent_id.token_id).toBe('number');
                expect(reg.og_agent_id.contract).toMatch(/^0x[a-fA-F0-9]{40}$/);
                expect(reg.og_agent_id.network).toBe('galileo-testnet');
                expect(reg.og_agent_id.standard).toBe('ERC-7857');
                expect(reg.og_agent_id.explorer_url).toMatch(/^https?:\/\//);
                expect(reg.og_agent_id.explorer_url).toContain('chainscan-galileo.0g.ai');
            }
        }
    });
});

test.describe('og0AgentIdStatus()', () => {
    test('returns active=true with reference contract by default', () => {
        const status = og0AgentIdStatus();
        expect(status.active).toBe(true);
        expect(status.contract).toBe(REFERENCE_CONTRACT);
        expect(status.explorer).toBe(REFERENCE_EXPLORER);
        expect(status.network).toBe('galileo-testnet');
    });
});

test.describe('Chainscan URL builders', () => {
    test('agentIdTokenExplorerUrl builds galileo chainscan URL with tokenId', () => {
        const url = agentIdTokenExplorerUrl(42);
        expect(url).toContain('chainscan-galileo.0g.ai/token/');
        expect(url).toContain(REFERENCE_CONTRACT);
        expect(url).toMatch(/[?&]a=42(&|$)/);
    });

    test('agentIdTokenExplorerUrl URL-encodes string tokenIds', () => {
        const url = agentIdTokenExplorerUrl('1&malicious=1');
        expect(url).toContain('1%26malicious%3D1');
        expect(url).not.toContain('1&malicious=1');
    });

    test('agentIdContractExplorerUrl points at the contract address page', () => {
        const url = agentIdContractExplorerUrl();
        expect(url).toBe(`${REFERENCE_EXPLORER}/address/${REFERENCE_CONTRACT}`);
    });
});

test.describe('sha256Hex32 — bytes32 hash builder', () => {
    test('returns 0x + 64 hex chars (32 bytes)', () => {
        const hash = sha256Hex32('hello');
        expect(hash).toMatch(/^0x[a-f0-9]{64}$/);
    });

    test('is deterministic for the same input', () => {
        expect(sha256Hex32('a')).toBe(sha256Hex32('a'));
    });

    test('produces different hashes for different inputs', () => {
        expect(sha256Hex32('a')).not.toBe(sha256Hex32('b'));
    });

    test('handles empty string without throwing', () => {
        const hash = sha256Hex32('');
        expect(hash).toMatch(/^0x[a-f0-9]{64}$/);
    });
});

test.describe('agentToIntelligentData — ERC-7857 payload builder', () => {
    const agentBase = {
        id: 'test-agent',
        name: 'Test Agent',
        description: 'A test agent for the spec',
    };

    test('always emits name + description entries', () => {
        const entries = agentToIntelligentData(agentBase);
        expect(entries.find(e => e.dataDescription === 'name')).toBeDefined();
        expect(entries.find(e => e.dataDescription === 'description')).toBeDefined();
    });

    test('omits optional fields when not provided', () => {
        const entries = agentToIntelligentData(agentBase);
        expect(entries.find(e => e.dataDescription === 'version')).toBeUndefined();
        expect(entries.find(e => e.dataDescription === 'capabilities')).toBeUndefined();
        expect(entries.find(e => e.dataDescription === 'systemPrompt')).toBeUndefined();
        expect(entries.find(e => e.dataDescription === 'model')).toBeUndefined();
    });

    test('includes optional fields when provided', () => {
        const entries = agentToIntelligentData({
            ...agentBase,
            version: '1.0.0',
            capabilities: ['read', 'write'],
            systemPrompt: 'You are helpful',
            model: 'gpt-4',
        });
        expect(entries.find(e => e.dataDescription === 'version')).toBeDefined();
        expect(entries.find(e => e.dataDescription === 'capabilities')).toBeDefined();
        expect(entries.find(e => e.dataDescription === 'systemPrompt')).toBeDefined();
        expect(entries.find(e => e.dataDescription === 'model')).toBeDefined();
    });

    test('canonicalizes capabilities — same set in different order produces same hash', () => {
        const a = agentToIntelligentData({ ...agentBase, capabilities: ['read', 'write'] });
        const b = agentToIntelligentData({ ...agentBase, capabilities: ['write', 'read'] });
        const aHash = a.find(e => e.dataDescription === 'capabilities')?.dataHash;
        const bHash = b.find(e => e.dataDescription === 'capabilities')?.dataHash;
        expect(aHash).toBe(bHash);
    });

    test('different capabilities sets produce different hashes', () => {
        const a = agentToIntelligentData({ ...agentBase, capabilities: ['read'] });
        const b = agentToIntelligentData({ ...agentBase, capabilities: ['write'] });
        const aHash = a.find(e => e.dataDescription === 'capabilities')?.dataHash;
        const bHash = b.find(e => e.dataDescription === 'capabilities')?.dataHash;
        expect(aHash).not.toBe(bHash);
    });

    test('every entry has a 0x-prefixed 32-byte hash', () => {
        const entries = agentToIntelligentData({
            ...agentBase,
            version: '1.0.0',
            capabilities: ['a', 'b'],
            systemPrompt: 'x',
            model: 'm',
        });
        for (const entry of entries) {
            expect(entry.dataHash, entry.dataDescription).toMatch(/^0x[a-f0-9]{64}$/);
        }
    });

    test('order is stable — name, description, version, capabilities, systemPrompt, model', () => {
        const entries = agentToIntelligentData({
            ...agentBase,
            version: '1.0.0',
            capabilities: ['a'],
            systemPrompt: 'x',
            model: 'm',
        });
        const order = entries.map(e => e.dataDescription);
        expect(order).toEqual(['name', 'description', 'version', 'capabilities', 'systemPrompt', 'model']);
    });
});

test.describe('Library defaults match persistence file', () => {
    // If someone updates the library default contract but forgets to
    // bump data/og-agent-ids.json (or vice versa), the persistence file
    // and the chainscan links it implies would point at two different
    // contracts. og0AgentIdStatus() is the single source of truth at
    // runtime, so it must match what we ship on disk.
    test('og0AgentIdStatus() contract matches persistence file _contract', () => {
        const file = JSON.parse(
            fs.readFileSync(path.join(process.cwd(), 'data', 'og-agent-ids.json'), 'utf-8'),
        );
        const status = og0AgentIdStatus();
        expect(status.contract).toBe(file._contract);
        expect(status.explorer).toBe(file._explorer);
        expect(status.network).toBe(file._network);
    });
});
