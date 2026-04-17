/**
 * MagicBlock Private Payments API client.
 *
 * Reference: https://payments.magicblock.app/reference
 * Docs root: docs.magicblock.gg/pages/private-ephemeral-rollups-pers/reference-material/private-payments-api
 *
 * Endpoints observed from the docs sidebar:
 *   GET  /health
 *   POST /deposit
 *   POST /transfer
 *   POST /withdraw
 *   POST /mint/initialize
 *   GET  /balance
 *   GET  /balance/private
 *   GET  /mint/initialized
 *   POST /mcp
 *
 * Exact shapes are still being finalised by MagicBlock, so this
 * client exposes a small typed surface and a generic `call()` escape
 * hatch for routes we don't yet model. Configure via env:
 *
 *   MAGICBLOCK_PAYMENTS_BASE   — default https://payments.magicblock.app
 *   MAGICBLOCK_PAYMENTS_TOKEN  — bearer auth from the MagicBlock console
 *   MAGICBLOCK_PAYMENTS_ENABLED — 0/1 flag so the adapter stays honest
 *                                 when we haven't finished wiring it
 */

const DEFAULT_BASE = 'https://payments.magicblock.app';

export interface PaymentsClientOptions {
    baseUrl?: string;
    token?: string;
}

export class MagicBlockPaymentsClient {
    private baseUrl: string;
    private token: string | null;

    constructor(opts: PaymentsClientOptions = {}) {
        this.baseUrl = (opts.baseUrl ?? process.env.MAGICBLOCK_PAYMENTS_BASE ?? DEFAULT_BASE).replace(/\/$/, '');
        this.token = opts.token ?? process.env.MAGICBLOCK_PAYMENTS_TOKEN ?? null;
    }

    isReady(): boolean {
        return Boolean(this.token);
    }

    async health(): Promise<{ ok: boolean; status?: number; body?: unknown }> {
        return this.call('GET', '/health');
    }

    async getBalance(params: { owner: string; mint: string }): Promise<{ ok: boolean; status?: number; body?: unknown }> {
        const qs = new URLSearchParams(params as Record<string, string>).toString();
        return this.call('GET', `/balance?${qs}`);
    }

    async getPrivateBalance(params: { owner: string; mint: string }): Promise<{ ok: boolean; status?: number; body?: unknown }> {
        const qs = new URLSearchParams(params as Record<string, string>).toString();
        return this.call('GET', `/balance/private?${qs}`);
    }

    async transferSpl(params: {
        from: string;
        to: string;
        mint: string;
        amount: string | number;
        memo?: string;
    }): Promise<{ ok: boolean; status?: number; body?: unknown }> {
        return this.call('POST', '/transfer', params);
    }

    async depositSpl(params: {
        owner: string;
        mint: string;
        amount: string | number;
    }): Promise<{ ok: boolean; status?: number; body?: unknown }> {
        return this.call('POST', '/deposit', params);
    }

    /**
     * Escape hatch for endpoints we don't model yet. Keeps header
     * + base URL handling consistent.
     */
    async call(method: 'GET' | 'POST', path: string, body?: unknown): Promise<{ ok: boolean; status?: number; body?: unknown }> {
        if (!this.token) {
            return { ok: false, body: { error: 'MAGICBLOCK_PAYMENTS_TOKEN not configured' } };
        }
        try {
            const res = await fetch(`${this.baseUrl}${path}`, {
                method,
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: body ? JSON.stringify(body) : undefined,
                signal: AbortSignal.timeout(15_000),
            });
            const json = await res.json().catch(() => ({}));
            return { ok: res.ok, status: res.status, body: json };
        } catch (err) {
            return { ok: false, body: { error: err instanceof Error ? err.message : 'network_error' } };
        }
    }
}

export function paymentsEnabled(): boolean {
    return process.env.MAGICBLOCK_PAYMENTS_ENABLED === '1' && Boolean(process.env.MAGICBLOCK_PAYMENTS_TOKEN);
}
