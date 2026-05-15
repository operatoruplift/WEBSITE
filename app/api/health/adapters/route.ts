import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withRequestMeta, errorResponse } from '@/lib/apiHelpers';
import { getCapabilities } from '@/lib/capabilities';
import { photonStatus } from '@/lib/photon/adapter';
import { magicBlockSurfaceStatus } from '@/lib/magicblock/adapter';
import { paymentsEnabled } from '@/lib/magicblock/payments';
import { filecoinStatus } from '@/lib/filecoin/anchor';
import { elevenLabsStatus } from '@/lib/elevenlabs/synth';
import { og0Status } from '@/lib/og/storage';
import { og0AgentIdStatus } from '@/lib/og/agent-id';

export const runtime = 'nodejs';

/**
 * GET /api/health/adapters
 *
 * Operational view of which external adapters are wired and which
 * aren't. Validates Pattern 10 (honest-status rule) from a single
 * surface, so ops can curl one endpoint and see which env vars are
 * missing, rather than probing tool routes one by one and reading
 * their 503 responses.
 *
 * Authenticated-only. Anonymous = 401 to avoid leaking configuration
 * posture to scanners. The information isn't strictly secret (an
 * end user with real execution would see the same posture via tool
 * calls) but health endpoints that list missing credentials are a
 * well-known scanner target.
 *
 * Response shape (200):
 *   {
 *     requestId, timestamp,
 *     adapters: [
 *       { name, active, reason, details? },
 *       ...
 *     ]
 *   }
 *
 * Each adapter entry is honest about its active state. The `details`
 * block carries non-sensitive config (base URL, path, flag value) so
 * ops can read it without SSHing into the Vercel project. Secrets
 * (API keys, tokens, private keys) NEVER appear in the response.
 */
export async function GET(request: Request) {
    const meta = withRequestMeta(request, 'health.adapters');
    try {
        const caps = await getCapabilities(request);
        if (!caps.userId) {
            return NextResponse.json(
                {
                    error: 'unauthorized',
                    errorClass: 'reauth_required',
                    reason: 'not_authenticated',
                    recovery: 'reauth',
                    requestId: meta.requestId,
                    timestamp: meta.startedAt,
                    message: 'Sign in to view adapter status.',
                    nextAction: 'Sign in with Privy and retry.',
                },
                { status: 401, headers: meta.headers },
            );
        }

        const photon = photonStatus();
        const mbEr = magicBlockSurfaceStatus();
        const mbPaymentsActive = paymentsEnabled();
        const anthropic = anthropicStatus();
        const google = googleOAuthStatus();
        const photonInbox = await photonInboxStatus();
        const filecoin = filecoinStatus();
        const elevenlabs = elevenLabsStatus();
        const og0 = og0Status();
        const og0AgentId = og0AgentIdStatus();

        const adapters = [
            {
                name: 'photon',
                active: photon.active,
                reason: photon.reason,
                details: {
                    base: photon.base,
                    path: photon.path,
                    projectIdConfigured: Boolean(photon.projectId),
                },
            },
            {
                name: 'anthropic',
                active: anthropic.active,
                reason: anthropic.reason,
                details: { model: anthropic.model },
            },
            {
                name: 'google_oauth',
                active: google.active,
                reason: google.reason,
                details: google.details,
            },
            {
                name: 'photon_inbox',
                active: photonInbox.active,
                reason: photonInbox.reason,
                details: photonInbox.details,
            },
            {
                name: 'magicblock_er',
                active: mbEr.active,
                reason: mbEr.reason,
                details: { rpcUrl: mbEr.rpcUrl },
            },
            {
                name: 'magicblock_payments',
                active: mbPaymentsActive,
                reason: mbPaymentsActive
                    ? 'MAGICBLOCK_PAYMENTS_ENABLED=1 and MAGICBLOCK_PAYMENTS_TOKEN present.'
                    : 'Needs MAGICBLOCK_PAYMENTS_ENABLED=1 and MAGICBLOCK_PAYMENTS_TOKEN in Vercel env.',
            },
            {
                name: 'filecoin',
                active: filecoin.active,
                reason: filecoin.active
                    ? `Filecoin anchoring active via ${filecoin.provider}. Cron at /api/cron/filecoin-anchor publishes signed receipts.`
                    : 'Set FILECOIN_PROVIDER + provider token (LIGHTHOUSE_API_KEY or PINATA_JWT) in Vercel env to activate.',
                details: { provider: filecoin.provider },
            },
            {
                name: 'elevenlabs',
                active: elevenlabs.active,
                reason: elevenlabs.active
                    ? `ElevenLabs TTS active via voice ${elevenlabs.voiceId}. Endpoint at /api/voice/synth.`
                    : 'Set ELEVENLABS_API_KEY in Vercel env to activate.',
                details: { voiceId: elevenlabs.voiceId },
            },
            {
                name: 'og_storage',
                active: og0.active,
                reason: og0.active
                    ? `0G Storage anchoring active on ${og0.network}. Cron at /api/cron/og-anchor publishes signed receipts; the 0g: <rootHash> link on /security points at /api/og/storage/[rootHash].`
                    : 'Set OG_PRIVATE_KEY in Vercel env to activate 0G Storage anchoring. Optional overrides: OG_RPC_URL, OG_INDEXER_RPC.',
                details: og0.active
                    ? { network: og0.network, rpcUrl: og0.rpcUrl, indexerRpc: og0.indexerRpc }
                    : { network: og0.network },
            },
            {
                name: 'og_agent_id',
                active: og0AgentId.active,
                reason: `0G Agent ID (ERC-7857) module wired to ${og0AgentId.contract} on ${og0AgentId.network}. Run scripts/og-agent-id-mint.mjs against a funded OG_PRIVATE_KEY wallet to mint; tokenIds persist to data/og-agent-ids.json and surface on /agents/{slug}.json.`,
                details: {
                    contract: og0AgentId.contract,
                    network: og0AgentId.network,
                    explorer: og0AgentId.explorer,
                },
            },
        ];

        return NextResponse.json(
            {
                requestId: meta.requestId,
                timestamp: meta.startedAt,
                adapters,
            },
            { headers: meta.headers },
        );
    } catch (err) {
        return errorResponse(err, meta);
    }
}

interface AnthropicStatus {
    active: boolean;
    reason: string;
    model: string;
}

function anthropicStatus(): AnthropicStatus {
    const hasKey = Boolean(process.env.ANTHROPIC_API_KEY?.trim());
    const model = process.env.PHOTON_AGENT_MODEL?.trim() || 'claude-haiku-4-5-20251001';
    if (hasKey) {
        return {
            active: true,
            reason: `ANTHROPIC_API_KEY present; agent will reply with ${model}.`,
            model,
        };
    }
    return {
        active: false,
        reason: 'ANTHROPIC_API_KEY missing; iMessage agent will fall back to a fixed-string ack.',
        model,
    };
}

interface GoogleOAuthStatus {
    active: boolean;
    reason: string;
    details: {
        clientIdConfigured: boolean;
        clientSecretConfigured: boolean;
        stateSecretConfigured: boolean;
        redirectUriConfigured: boolean;
    };
}

/**
 * Checks Google OAuth env vars without importing lib/google so this
 * route stays a pure read of `process.env`. Reports the four vars
 * needed for the connect flow + agent's iMessage YES executor:
 *   GOOGLE_OAUTH_CLIENT_ID
 *   GOOGLE_OAUTH_CLIENT_SECRET
 *   GOOGLE_OAUTH_STATE_SECRET
 *   GOOGLE_OAUTH_REDIRECT_URI
 *
 * Without all four, the iMessage agent receives the YES, hits the
 * Google bridge, and returns a `google_not_connected` reply to the
 * user, even when the user expects the Gmail draft to materialize.
 */
function googleOAuthStatus(): GoogleOAuthStatus {
    const clientIdConfigured = Boolean(process.env.GOOGLE_OAUTH_CLIENT_ID?.trim());
    const clientSecretConfigured = Boolean(process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim());
    const stateSecretConfigured = Boolean(process.env.GOOGLE_OAUTH_STATE_SECRET?.trim());
    const redirectUriConfigured = Boolean(process.env.GOOGLE_OAUTH_REDIRECT_URI?.trim());
    const allSet = clientIdConfigured && clientSecretConfigured && stateSecretConfigured && redirectUriConfigured;

    if (allSet) {
        return {
            active: true,
            reason: 'Google OAuth wired: clients can Connect Google and the iMessage YES path can fire Gmail/Calendar tools.',
            details: { clientIdConfigured, clientSecretConfigured, stateSecretConfigured, redirectUriConfigured },
        };
    }
    const missing: string[] = [];
    if (!clientIdConfigured) missing.push('GOOGLE_OAUTH_CLIENT_ID');
    if (!clientSecretConfigured) missing.push('GOOGLE_OAUTH_CLIENT_SECRET');
    if (!stateSecretConfigured) missing.push('GOOGLE_OAUTH_STATE_SECRET');
    if (!redirectUriConfigured) missing.push('GOOGLE_OAUTH_REDIRECT_URI');
    return {
        active: false,
        reason: `Google OAuth incomplete: missing ${missing.join(', ')}. Connect Google flow will fail, and the iMessage YES path will reply google_not_connected.`,
        details: { clientIdConfigured, clientSecretConfigured, stateSecretConfigured, redirectUriConfigured },
    };
}

interface InboxStatus {
    active: boolean;
    reason: string;
    details: {
        tableExists: boolean;
        last24hReceived: number | null;
        last24hReplied: number | null;
        last24hUnreplied: number | null;
    };
}

async function photonInboxStatus(): Promise<InboxStatus> {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const empty: InboxStatus['details'] = {
        tableExists: false,
        last24hReceived: null,
        last24hReplied: null,
        last24hUnreplied: null,
    };

    if (!url || !serviceKey) {
        return {
            active: false,
            reason: 'Supabase env not set; the webhook still 200s but no audit row is written.',
            details: empty,
        };
    }

    const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

    const total = await supabase
        .from('inbound_messages')
        .select('id', { count: 'exact', head: true })
        .gte('received_at', since);

    if (total.error) {
        const msg = total.error.message || 'unknown';
        const tableMissing = /relation .* does not exist|Could not find the table/i.test(msg);
        return {
            active: false,
            reason: tableMissing
                ? 'inbound_messages table missing; run lib/photon-webhook-migration.sql against Supabase.'
                : `Supabase query failed: ${msg.slice(0, 200)}`,
            details: empty,
        };
    }

    const replied = await supabase
        .from('inbound_messages')
        .select('id', { count: 'exact', head: true })
        .gte('received_at', since)
        .not('processed_at', 'is', null);

    const received = total.count ?? 0;
    const repliedCount = replied.count ?? 0;
    return {
        active: true,
        reason: `inbound_messages table healthy: ${received} received / ${repliedCount} replied in last 24h.`,
        details: {
            tableExists: true,
            last24hReceived: received,
            last24hReplied: repliedCount,
            last24hUnreplied: Math.max(0, received - repliedCount),
        },
    };
}
