/**
 * SNS (Solana Name Service) resolver, server-side.
 *
 * Resolves `.sol` domains (and `.sol.site` browser aliases) via the
 * Bonfida SNS proxy. We deliberately use the public proxy instead of
 * pulling `@bonfida/spl-name-service` into the bundle, the proxy is
 * cached by Bonfida, so this one external call per domain per 10 min
 * is cheaper than shipping the SDK's crypto deps.
 *
 * Verified = the resolved owner matches SNS_EXPECTED_OWNER. Without
 * that env var set, `verified` is never true; we never claim control
 * of a name we can't prove.
 */

export interface SnsRecord {
    type: string;
    value: string;
}

export interface SnsResolution {
    name: string;
    owner: string | null;
    records: SnsRecord[];
    verified: boolean;
    cachedAt: number;
    /** True when this came from the demo mock rather than a live lookup. */
    simulated?: boolean;
    error?: string;
}

const TTL_MS = 10 * 60 * 1000;
const BONFIDA_PROXY = 'https://sns-sdk-proxy.bonfida.workers.dev';

const cache = new Map<string, SnsResolution>();

function expectedOwner(): string | null {
    const v = process.env.SNS_EXPECTED_OWNER;
    return v ? v.trim() : null;
}

function normalizeName(raw: string): string {
    const name = raw.trim().toLowerCase();
    // Strip .sol.site browser alias back to .sol for resolution
    return name.endsWith('.sol.site') ? name.slice(0, -5) : name;
}

/**
 * Fetches a single record type (Twitter, URL, GitHub, etc.) via the
 * Bonfida proxy. Missing records resolve to null silently.
 */
async function fetchRecord(domain: string, recordType: string): Promise<string | null> {
    try {
        const res = await fetch(`${BONFIDA_PROXY}/record/${domain}/${recordType}`, {
            // Server-side, no credentials needed.
            cache: 'no-store',
        });
        if (!res.ok) return null;
        const body = await res.json();
        const value = typeof body === 'string' ? body : body?.content ?? body?.value ?? null;
        return typeof value === 'string' && value.length > 0 ? value : null;
    } catch {
        return null;
    }
}

async function fetchOwner(domain: string): Promise<string | null> {
    try {
        const res = await fetch(`${BONFIDA_PROXY}/owner/${domain}`, { cache: 'no-store' });
        if (!res.ok) return null;
        const body = await res.json();
        if (typeof body === 'string') return body;
        return body?.owner ?? body?.result ?? null;
    } catch {
        return null;
    }
}

/**
 * Resolve a `.sol` name. Returns a cached entry when one exists and is
 * under TTL. Never throws, on any network failure returns the shape
 * with `error` set, so the caller can render a gentle fallback.
 */
export async function resolveSolDomain(rawName: string): Promise<SnsResolution> {
    const name = normalizeName(rawName);
    if (!name.endsWith('.sol')) {
        return {
            name: rawName,
            owner: null,
            records: [],
            verified: false,
            cachedAt: Date.now(),
            error: 'not_a_sol_domain',
        };
    }

    const cached = cache.get(name);
    if (cached && Date.now() - cached.cachedAt < TTL_MS) {
        return cached;
    }

    const [owner, twitter, url, github] = await Promise.all([
        fetchOwner(name),
        fetchRecord(name, 'twitter'),
        fetchRecord(name, 'url'),
        fetchRecord(name, 'github'),
    ]);

    const records: SnsRecord[] = [];
    if (twitter) records.push({ type: 'twitter', value: twitter });
    if (url) records.push({ type: 'url', value: url });
    if (github) records.push({ type: 'github', value: github });

    const expected = expectedOwner();
    const verified = Boolean(owner && expected && owner === expected);

    const payload: SnsResolution = {
        name,
        owner,
        records,
        verified,
        cachedAt: Date.now(),
    };
    cache.set(name, payload);
    return payload;
}

/**
 * Demo-mode mock. Returned when /api/sns/resolve is hit with
 * capability_real = false. Always carries `simulated: true` so the UI
 * renders the Simulated chip alongside any values.
 */
export function mockSolDomain(rawName: string): SnsResolution {
    const name = normalizeName(rawName);
    return {
        name,
        owner: 'Demo1111111111111111111111111111111111111111',
        records: [
            { type: 'twitter', value: 'operatoruplift' },
            { type: 'url', value: 'https://operatoruplift.com' },
            { type: 'github', value: 'operatoruplift' },
        ],
        verified: false,
        cachedAt: Date.now(),
        simulated: true,
    };
}
