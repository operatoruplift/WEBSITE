/**
 * Lightweight reachability probe for each LLM provider.
 *
 * We intentionally hit low-cost "list models" style endpoints (or `/models`
 * on the OpenAI-compatible providers). Failures are silent, a provider is
 * either `ok:true` with a latency in ms, or `ok:false` with a short reason.
 * Never throws. Never logs secrets. Never spends tokens.
 *
 * Scope: called only by `/api/health/llm` (a GET endpoint) and by the
 * retry helper in `lib/llm.ts` when it wants to decide whether to escalate
 * a failure as "provider down" vs "transient".
 */

export interface ProviderProbe {
    provider: string;
    configured: boolean;
    ok: boolean;
    latencyMs?: number;
    reason?: string;
}

const PROBE_TIMEOUT_MS = 3_000;

async function probe(url: string, headers: Record<string, string>): Promise<{ ok: boolean; latencyMs: number; reason?: string }> {
    const started = Date.now();
    try {
        const res = await fetch(url, {
            method: 'GET',
            headers,
            signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
        });
        const latencyMs = Date.now() - started;
        if (!res.ok) return { ok: false, latencyMs, reason: `${res.status} ${res.statusText}` };
        return { ok: true, latencyMs };
    } catch (err) {
        const latencyMs = Date.now() - started;
        const reason = err instanceof Error ? err.name : 'unknown';
        return { ok: false, latencyMs, reason };
    }
}

export async function probeAllProviders(): Promise<ProviderProbe[]> {
    const checks: Array<() => Promise<ProviderProbe>> = [
        async () => {
            const configured = !!process.env.ANTHROPIC_API_KEY;
            if (!configured) return { provider: 'anthropic', configured: false, ok: false, reason: 'no key' };
            const r = await probe('https://api.anthropic.com/v1/models', {
                'x-api-key': process.env.ANTHROPIC_API_KEY!,
                'anthropic-version': '2023-06-01',
            });
            return { provider: 'anthropic', configured, ...r };
        },
        async () => {
            const configured = !!process.env.OPENAI_API_KEY;
            if (!configured) return { provider: 'openai', configured: false, ok: false, reason: 'no key' };
            const r = await probe('https://api.openai.com/v1/models', {
                authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            });
            return { provider: 'openai', configured, ...r };
        },
        async () => {
            const configured = !!process.env.GOOGLE_AI_API_KEY;
            if (!configured) return { provider: 'google', configured: false, ok: false, reason: 'no key' };
            const r = await probe(
                `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GOOGLE_AI_API_KEY}`,
                {},
            );
            return { provider: 'google', configured, ...r };
        },
        async () => {
            const configured = !!process.env.XAI_API_KEY;
            if (!configured) return { provider: 'xai', configured: false, ok: false, reason: 'no key' };
            const r = await probe('https://api.x.ai/v1/models', {
                authorization: `Bearer ${process.env.XAI_API_KEY}`,
            });
            return { provider: 'xai', configured, ...r };
        },
        async () => {
            const configured = !!process.env.DEEPSEEK_API_KEY;
            if (!configured) return { provider: 'deepseek', configured: false, ok: false, reason: 'no key' };
            const r = await probe('https://api.deepseek.com/v1/models', {
                authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
            });
            return { provider: 'deepseek', configured, ...r };
        },
        async () => {
            const host = process.env.OLLAMA_HOST;
            if (!host) return { provider: 'ollama', configured: false, ok: false, reason: 'no OLLAMA_HOST' };
            const r = await probe(`${host}/api/tags`, {});
            return { provider: 'ollama', configured: true, ...r };
        },
    ];

    return Promise.all(checks.map(c => c()));
}

export async function probeProviderForModel(model: string): Promise<ProviderProbe | null> {
    const all = await probeAllProviders();
    const map: Record<string, string> = {
        claude: 'anthropic',
        gpt: 'openai',
        gemini: 'google',
        grok: 'xai',
        deepseek: 'deepseek',
        llama: 'ollama',
        mistral: 'ollama',
        ollama: 'ollama',
    };
    const prefix = Object.keys(map).find(p => model.startsWith(p));
    if (!prefix) return null;
    return all.find(p => p.provider === map[prefix]) || null;
}
