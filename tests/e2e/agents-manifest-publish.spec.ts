import { test, expect } from '@playwright/test';
import crypto from 'node:crypto';

test.describe.configure({ timeout: 90_000 });

/**
 * Hermetic spec for the public /agents/<slug>.json manifest endpoints.
 *
 * These are the ERC-8004-style agent registration documents the README
 * walkthrough sends judges to. demo-hackathon-judge-links.spec.ts
 * already locks the LINK shape (the VerifyCard hrefs point at the
 * right URL). This spec locks the JSON ENVELOPE shape — if a future
 * refactor of lib/agent-registration drops a field, renames og_agent_id,
 * or breaks the canonical-checksum contract, every judge fetching the
 * manifest sees a silently-wrong document.
 *
 * The checksum is SHA-256 of canonicalJson(manifest minus checksum).
 * The hide-when-NULL contract on og_agent_id means the field is
 * omitted from the JSON until a real tokenId is minted.
 */

async function fetchManifest(request: import('@playwright/test').APIRequestContext, slug: string) {
    const res = await request.get(`/agents/${slug}.json`);
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('application/json');
    return res.json();
}

function canonicalize(obj: unknown): string {
    if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
    if (Array.isArray(obj)) return '[' + obj.map(canonicalize).join(',') + ']';
    const keys = Object.keys(obj as Record<string, unknown>).sort();
    return '{' + keys.map(k => JSON.stringify(k) + ':' + canonicalize((obj as Record<string, unknown>)[k])).join(',') + '}';
}

for (const slug of ['calendar', 'gmail']) {
    test(`/agents/${slug}.json has the ERC-8004 manifest shape`, async ({ request }) => {
        const manifest = await fetchManifest(request, slug);

        // Required top-level fields.
        expect(typeof manifest.name).toBe('string');
        expect(manifest.name.length).toBeGreaterThan(0);
        expect(typeof manifest.description).toBe('string');
        expect(manifest.description.length).toBeGreaterThan(0);
        expect(Array.isArray(manifest.capabilities)).toBe(true);
        expect(manifest.capabilities.length).toBeGreaterThan(0);
        expect(typeof manifest.checksum).toBe('string');
        expect(manifest.checksum).toMatch(/^[a-f0-9]{64}$/);

        // Capabilities entries have shape: { tool, action, description, paid, model? }.
        for (const cap of manifest.capabilities) {
            expect(typeof cap.tool).toBe('string');
            expect(typeof cap.action).toBe('string');
            expect(typeof cap.description).toBe('string');
            expect(typeof cap.paid).toBe('boolean');
        }
    });

    test(`/agents/${slug}.json checksum recomputes from canonical JSON`, async ({ request }) => {
        // Lock the "checksum = sha256(canonicalJson(everything but checksum))"
        // contract. If a future refactor changes the canonicalization
        // algorithm or stops folding in og_agent_id, the embedded
        // checksum will diverge from the recomputed one.
        const manifest = await fetchManifest(request, slug);
        const { checksum, ...rest } = manifest;
        const recomputed = crypto.createHash('sha256').update(canonicalize(rest)).digest('hex');
        expect(recomputed).toBe(checksum);
    });

    test(`/agents/${slug}.json honors the hide-when-NULL contract for og_agent_id`, async ({ request }) => {
        // PR #571 documents this: the og_agent_id field is OMITTED from
        // the published JSON until a real tokenId is minted into the
        // ERC-7857 contract on 0G Galileo. If a future change starts
        // emitting { tokenId: null } as a placeholder, we'd be overclaiming
        // an on-chain identity that doesn't exist yet — a fabrication-rot
        // regression.
        const manifest = await fetchManifest(request, slug);
        if ('og_agent_id' in manifest) {
            // If present, it must carry a non-null tokenId — the whole
            // point of the field. A null tokenId means the persistence
            // file shouldn't have surfaced it.
            expect(manifest.og_agent_id).not.toBeNull();
            expect(manifest.og_agent_id.tokenId).toBeDefined();
            expect(manifest.og_agent_id.tokenId).not.toBeNull();
        }
    });
}

test('/agents manifest cache headers allow public consumption', async ({ request }) => {
    // Judges need to be able to fetch + share + re-fetch the manifest
    // from a CDN cache. PR #571 set Cache-Control: public, max-age=300.
    // If that gets walked back to no-store, every chainscan diff workflow
    // re-hits origin needlessly and the demo-day fetch budget rises.
    const res = await request.get('/agents/calendar.json');
    expect(res.headers()['cache-control']).toMatch(/public/);
});
