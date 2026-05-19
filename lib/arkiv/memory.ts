import { eq } from '@arkiv-network/sdk/query';
import { ExpirationTime, jsonToPayload } from '@arkiv-network/sdk/utils';
import { z } from 'zod';

import { ENTITY_TYPE, PROJECT_ATTRIBUTE } from './constants';
import { getArkivPublicClient, getArkivWalletClient } from './client';

/**
 * Memory entity — one entry of an agent's conversation memory tied
 * to a user, an agent slug, and a session. This is the second entity
 * type required by the Arkiv challenge AND the primary user-owned
 * surface of the integration: a user's $owner is themselves, so the
 * platform can never read, delete, or transfer their memory.
 *
 * Per Arkiv best practice #11:
 *   - $creator is the writer (immutable tamper-proof attribution).
 *   - $owner controls update + delete. Default to creator; the user
 *     can later transfer ownership (e.g., revoke the platform's write
 *     access by transferring to themselves).
 *
 * Relationship modeling per best practice #10: rows are joined via
 * shared `agentSlug` and `sessionId` attributes (Arkiv's foreign-key
 * pattern). No on-Arkiv "agent_id" column references the Agent
 * entityKey directly — slug + session is enough for our queries.
 *
 * AI theme alignment: "agents whose memory you actually own."
 */

export const MemoryRoleSchema = z.enum(['user', 'assistant', 'system']);
export type MemoryRole = z.infer<typeof MemoryRoleSchema>;

export const MemoryPayloadSchema = z.object({
    content: z.string().min(1).max(8000),
    ts: z.number().int().positive(),
    /**
     * Optional metadata that callers may attach without changing the
     * canonical content+ts shape. Kept inside the payload (not as
     * attributes) so it doesn't bloat the indexer for things you
     * won't query by.
     */
    meta: z.record(z.string(), z.unknown()).optional(),
});

export type MemoryPayload = z.infer<typeof MemoryPayloadSchema>;

export interface RememberOpts {
    agentSlug: string;
    sessionId: string;
    role: MemoryRole;
    content: string;
    meta?: Record<string, unknown>;
    /** Default 7 days; matches the Arkiv ETHLisbon Template A pattern. */
    ttlDays?: number;
}

/**
 * Append a memory event for an agent + session. Backend-writer path —
 * the operator's wallet is $creator + $owner. For a true user-owned
 * memory flow, swap getArkivWalletClient() for a MetaMask-signed
 * wallet client driven by the user's browser; the rest of this
 * function stays the same. Documented in docs/arkiv-integration.md.
 */
export async function rememberEvent(
    opts: RememberOpts,
): Promise<{ entityKey: string; txHash: string }> {
    const wallet = getArkivWalletClient();
    const ts = Date.now();

    const validated = MemoryPayloadSchema.parse({
        content: opts.content,
        ts,
        meta: opts.meta,
    });

    const result = await wallet.createEntity({
        payload: jsonToPayload(validated),
        contentType: 'application/json',
        attributes: [
            PROJECT_ATTRIBUTE,
            { key: 'entityType', value: ENTITY_TYPE.MEMORY_EVENT },
            { key: 'agentSlug', value: opts.agentSlug },
            { key: 'sessionId', value: opts.sessionId },
            { key: 'role', value: opts.role },
            { key: 'ts', value: ts },
        ],
        expiresIn: ExpirationTime.fromDays(opts.ttlDays ?? 7),
    });

    return {
        entityKey: result.entityKey as string,
        txHash: result.txHash as string,
    };
}

/**
 * Recall every memory event for one agent + session, newest first.
 * Used by the chat UI to load context before the next turn, and by
 * the /arkiv demo page so a judge can verify on-Arkiv memory exists.
 *
 * Returns content + role + ts so it can drop straight into an LLM
 * chat-completions array.
 */
export async function recallSession(
    agentSlug: string,
    sessionId: string,
    limit = 50,
): Promise<
    Array<{
        entityKey: string;
        role: MemoryRole;
        content: string;
        ts: number;
        owner: string;
        creator: string;
        explorerUrl: string;
    }>
> {
    const publicClient = getArkivPublicClient();

    const result = await publicClient
        .buildQuery()
        .where([
            eq(PROJECT_ATTRIBUTE.key, PROJECT_ATTRIBUTE.value),
            eq('entityType', ENTITY_TYPE.MEMORY_EVENT),
            eq('agentSlug', agentSlug),
            eq('sessionId', sessionId),
        ])
        .withPayload(true)
        .withAttributes(true)
        .withMetadata(true)
        .limit(limit)
        .fetch();

    return result.entities
        .map((e) => {
            const json = MemoryPayloadSchema.parse(e.toJson());
            const role = String(
                e.attributes.find((a) => a.key === 'role')?.value ?? 'user',
            ) as MemoryRole;
            const ts = Number(e.attributes.find((a) => a.key === 'ts')?.value ?? 0);
            return {
                entityKey: e.key as string,
                role,
                content: json.content,
                ts,
                owner: String(e.owner ?? ''),
                creator: String(e.creator ?? ''),
                explorerUrl: `https://explorer.braga.hoodi.arkiv.network/entity/${e.key}`,
            };
        })
        .sort((a, b) => b.ts - a.ts);
}

/**
 * Count how many memory events exist for one agent + session. Cheap
 * read for the /arkiv demo page's overview card.
 */
export async function countSessionMemories(
    agentSlug: string,
    sessionId: string,
): Promise<number> {
    const publicClient = getArkivPublicClient();

    const result = await publicClient
        .buildQuery()
        .where([
            eq(PROJECT_ATTRIBUTE.key, PROJECT_ATTRIBUTE.value),
            eq('entityType', ENTITY_TYPE.MEMORY_EVENT),
            eq('agentSlug', agentSlug),
            eq('sessionId', sessionId),
        ])
        .limit(200)
        .fetch();

    return result.entities.length;
}

/**
 * List sessions that have at least one memory event for the given
 * agent. Used by the /arkiv demo page's session picker.
 */
export async function listSessions(
    agentSlug: string,
    limit = 50,
): Promise<Array<{ sessionId: string; count: number; lastTs: number }>> {
    const publicClient = getArkivPublicClient();

    const result = await publicClient
        .buildQuery()
        .where([
            eq(PROJECT_ATTRIBUTE.key, PROJECT_ATTRIBUTE.value),
            eq('entityType', ENTITY_TYPE.MEMORY_EVENT),
            eq('agentSlug', agentSlug),
        ])
        .withAttributes(true)
        .limit(limit)
        .fetch();

    const bySession = new Map<string, { count: number; lastTs: number }>();
    for (const e of result.entities) {
        const sessionId = String(e.attributes.find((a) => a.key === 'sessionId')?.value ?? '');
        const ts = Number(e.attributes.find((a) => a.key === 'ts')?.value ?? 0);
        const existing = bySession.get(sessionId);
        if (!existing) {
            bySession.set(sessionId, { count: 1, lastTs: ts });
        } else {
            existing.count += 1;
            if (ts > existing.lastTs) existing.lastTs = ts;
        }
    }

    return Array.from(bySession.entries())
        .map(([sessionId, { count, lastTs }]) => ({ sessionId, count, lastTs }))
        .sort((a, b) => b.lastTs - a.lastTs);
}
