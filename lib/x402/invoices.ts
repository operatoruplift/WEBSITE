/**
 * Invoice CRUD — server-side. Backing store: tool_invoices in Supabase.
 *
 * Lifecycle:
 *   pending   — 402 response has been sent to the client
 *   paid      — client submitted payment proof, we verified (devnet: sim)
 *   consumed  — tool executed using this invoice; cannot be reused
 *   expired   — 10 minutes passed without consumption
 */
import crypto from 'crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export interface Invoice {
    invoice_reference: string;
    user_id: string;
    tool: string;
    action: string;
    amount_usdc: number;
    chain: string;
    status: 'pending' | 'paid' | 'consumed' | 'expired';
    params_hash: string | null;
    tx_signature: string | null;
    created_at: string;
    paid_at: string | null;
    consumed_at: string | null;
    expires_at: string;
}

function supa(): SupabaseClient | null {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return null;
    return createClient(url, key, { auth: { persistSession: false } });
}

/** SHA-256 hex digest of a JSON-serializable value (stable key order). */
export function hashParams(value: unknown): string {
    return crypto.createHash('sha256').update(canonicalJson(value)).digest('hex');
}

/** Canonical JSON stringify — sort keys recursively so hashing is stable. */
export function canonicalJson(value: unknown): string {
    if (value === null || typeof value !== 'object') return JSON.stringify(value);
    if (Array.isArray(value)) return '[' + value.map(canonicalJson).join(',') + ']';
    const keys = Object.keys(value as Record<string, unknown>).sort();
    return '{' + keys.map(k => JSON.stringify(k) + ':' + canonicalJson((value as Record<string, unknown>)[k])).join(',') + '}';
}

/** Create a pending invoice for a gated tool call. */
export async function createInvoice(args: {
    user_id: string;
    tool: string;
    action: string;
    amount_usdc: number;
    chain: string;
    params_hash: string;
}): Promise<Invoice | null> {
    const ref = `inv_${args.tool.slice(0, 3)}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const client = supa();
    const now = new Date();
    const expires = new Date(now.getTime() + 10 * 60 * 1000);

    const invoice: Invoice = {
        invoice_reference: ref,
        user_id: args.user_id,
        tool: args.tool,
        action: args.action,
        amount_usdc: args.amount_usdc,
        chain: args.chain,
        status: 'pending',
        params_hash: args.params_hash,
        tx_signature: null,
        created_at: now.toISOString(),
        paid_at: null,
        consumed_at: null,
        expires_at: expires.toISOString(),
    };

    if (client) {
        await client.from('tool_invoices').insert(invoice);
    }
    return invoice;
}

/** Find an invoice by reference. */
export async function getInvoice(ref: string): Promise<Invoice | null> {
    const client = supa();
    if (!client) return null;
    const { data } = await client
        .from('tool_invoices')
        .select('*')
        .eq('invoice_reference', ref)
        .single();
    return (data as Invoice) || null;
}

/** Mark an invoice paid. Devnet: trust the simulated tx signature. */
export async function markInvoicePaid(ref: string, txSignature: string): Promise<boolean> {
    const client = supa();
    if (!client) return false;
    const { error } = await client
        .from('tool_invoices')
        .update({
            status: 'paid',
            tx_signature: txSignature,
            paid_at: new Date().toISOString(),
        })
        .eq('invoice_reference', ref)
        .eq('status', 'pending');
    return !error;
}

/** Mark an invoice consumed — tool has executed using this payment. */
export async function markInvoiceConsumed(ref: string): Promise<boolean> {
    const client = supa();
    if (!client) return false;
    const { error } = await client
        .from('tool_invoices')
        .update({
            status: 'consumed',
            consumed_at: new Date().toISOString(),
        })
        .eq('invoice_reference', ref)
        .eq('status', 'paid');
    return !error;
}

/**
 * Validate that an invoice can be consumed for the given user/tool/action.
 * Returns the invoice if valid, null otherwise.
 */
export async function validateInvoiceForConsumption(
    ref: string,
    userId: string,
    tool: string,
    action: string,
    paramsHash: string,
): Promise<Invoice | null> {
    const inv = await getInvoice(ref);
    if (!inv) return null;
    if (inv.user_id !== userId) return null;
    if (inv.tool !== tool || inv.action !== action) return null;
    if (inv.status !== 'paid') return null;
    if (inv.params_hash && inv.params_hash !== paramsHash) return null; // params-bound
    if (new Date(inv.expires_at) < new Date()) return null;
    return inv;
}
