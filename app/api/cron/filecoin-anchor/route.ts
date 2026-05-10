import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withRequestMeta, errorResponse } from '@/lib/apiHelpers';
import { safeLog, safeWarn } from '@/lib/safeLog';
import { anchorReceipt, getFilecoinProvider } from '@/lib/filecoin/anchor';
import type { SignedReceipt, ReceiptPayload } from '@/lib/x402/receipts';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * GET /api/cron/filecoin-anchor
 *
 * Picks up the oldest N un-anchored signed receipts and pushes their
 * canonical SignedReceipt JSON to the configured Filecoin storage
 * provider, recording the resulting CID + provider on the row.
 *
 * Auth: shared CRON_SECRET via Authorization: Bearer header (matches
 * /api/cron/photon-cleanup pattern). Manually triggerable; not in
 * vercel.json because Hobby caps at 2 scheduled crons.
 *
 *   curl -H "Authorization: Bearer $CRON_SECRET" \
 *        https://www.operatoruplift.com/api/cron/filecoin-anchor
 *
 * Honest-status:
 *   - 401 if CRON_SECRET missing/mismatch
 *   - 503 if Supabase or Filecoin provider unconfigured (no work to
 *     do; the column stays NULL on every receipt)
 *   - 200 with `{ anchored, skipped, errors }` per run so the operator
 *     can verify the cron is doing work
 *
 * The receipt itself is not modified — `filecoin_cid` and
 * `filecoin_provider` are external provenance metadata stored on the
 * tool_receipts row. The signed canonical JSON contract is preserved
 * (PR #510 + lib/x402/receipts.ts agree on it).
 */

const BATCH_SIZE = 25;

interface ReceiptRow extends ReceiptPayload {
    signature: string;
    public_key: string;
    created_at: string;
    filecoin_cid: string | null;
}

export async function GET(request: Request) {
    const meta = withRequestMeta(request, 'cron.filecoin-anchor');
    try {
        const expected = process.env.CRON_SECRET;
        if (!expected) {
            return errorResponse(
                new Error('CRON_SECRET not configured'),
                meta,
                { errorClass: 'provider_unavailable' },
            );
        }
        const auth = request.headers.get('authorization');
        if (auth !== `Bearer ${expected}`) {
            return NextResponse.json(
                { error: 'unauthorized', requestId: meta.requestId, timestamp: meta.startedAt },
                { status: 401, headers: meta.headers },
            );
        }

        const cfg = getFilecoinProvider();
        if (!cfg) {
            return errorResponse(
                new Error('filecoin_provider_not_configured'),
                meta,
                { errorClass: 'provider_unavailable' },
            );
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseUrl || !supabaseKey) {
            return errorResponse(
                new Error('supabase_not_configured'),
                meta,
                { errorClass: 'provider_unavailable' },
            );
        }
        const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

        // Pull un-anchored rows oldest-first. The migration's partial
        // index (filecoin_cid IS NULL) keeps this query cheap as the
        // table grows.
        const { data, error } = await supabase
            .from('tool_receipts')
            .select('*')
            .is('filecoin_cid', null)
            .order('created_at', { ascending: true })
            .limit(BATCH_SIZE);

        if (error) {
            return errorResponse(
                new Error(error.message),
                meta,
                { errorClass: 'provider_unavailable' },
            );
        }

        const rows = (data || []) as ReceiptRow[];
        if (rows.length === 0) {
            return NextResponse.json(
                {
                    anchored: 0,
                    skipped: 0,
                    errors: 0,
                    requestId: meta.requestId,
                    timestamp: meta.startedAt,
                },
                { headers: meta.headers },
            );
        }

        let anchored = 0;
        let skipped = 0;
        let errors = 0;

        // Sequential to keep upstream rate-limits gentle. BATCH_SIZE
        // is small enough this stays well under maxDuration.
        for (const row of rows) {
            const signed: SignedReceipt = {
                receipt: {
                    receipt_reference: row.receipt_reference,
                    timestamp: row.timestamp,
                    user_id: row.user_id,
                    agent_id: row.agent_id,
                    tool: row.tool,
                    action: row.action,
                    params_hash: row.params_hash,
                    result_hash: row.result_hash,
                    invoice_reference: row.invoice_reference,
                    amount_usdc: row.amount_usdc,
                    chain: row.chain,
                    payment_tx: row.payment_tx,
                },
                signature: row.signature,
                public_key: row.public_key,
            };

            const result = await anchorReceipt(signed);
            if (!result.ok || !result.cid) {
                errors += 1;
                safeWarn({
                    at: 'cron.filecoin-anchor',
                    event: 'anchor_failed',
                    receipt: row.receipt_reference,
                    reason: result.reason,
                });
                continue;
            }

            const { error: updateError } = await supabase
                .from('tool_receipts')
                .update({
                    filecoin_cid: result.cid,
                    filecoin_provider: result.provider,
                    filecoin_anchored_at: new Date().toISOString(),
                })
                .eq('receipt_reference', row.receipt_reference);

            if (updateError) {
                skipped += 1;
                safeWarn({
                    at: 'cron.filecoin-anchor',
                    event: 'db_update_failed',
                    receipt: row.receipt_reference,
                    error: updateError.message,
                });
                continue;
            }

            anchored += 1;
        }

        safeLog({
            at: 'cron.filecoin-anchor',
            event: 'batch_complete',
            anchored,
            skipped,
            errors,
            provider: cfg.provider,
        });

        return NextResponse.json(
            {
                anchored,
                skipped,
                errors,
                provider: cfg.provider,
                requestId: meta.requestId,
                timestamp: meta.startedAt,
            },
            { headers: meta.headers },
        );
    } catch (err) {
        return errorResponse(err, meta);
    }
}
