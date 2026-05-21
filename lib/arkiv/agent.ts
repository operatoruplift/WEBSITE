import { eq } from '@arkiv-network/sdk/query';
import { ExpirationTime, jsonToPayload } from '@arkiv-network/sdk/utils';
import { z } from 'zod';

import { ENTITY_TYPE, PROJECT_ATTRIBUTE, getCreatorWalletAddress } from './constants';
import { getArkivPublicClient, getArkivWalletClient } from './client';

/**
 * Agent entity — the on-Arkiv identity card for one of our agents
 * (Calendar, Gmail, etc.). Mirrors the ERC-8004-style document we
 * already publish at /agents/<slug>.json with two important
 * differences:
 *
 *   - Arkiv stores it tamper-proof on a public, queryable layer
 *     (any judge can read /agents/calendar from any wallet),
 *   - The on-Arkiv version carries the same `checksum` as the JSON
 *     manifest, so the two surfaces can be cross-verified.
 *
 * Backend-written. `$creator` is the operator's wallet
 * (NEXT_PUBLIC_ARKIV_CREATOR_ADDRESS); reads filter by `.createdBy()`
 * so a malicious third party can't poison the public agent list.
 */

export const AgentPayloadSchema = z.object({
    slug: z.string().min(1),
    name: z.string().min(1),
    description: z.string().min(1),
    version: z.string().min(1),
    publisher: z.object({
        name: z.string(),
        url: z.string().url(),
    }),
    capabilities: z.array(
        z.object({
            tool: z.string(),
            action: z.string(),
            description: z.string(),
            paid: z.boolean(),
        }),
    ),
    checksum: z.string().regex(/^[a-f0-9]{64}$/, 'checksum must be sha256 hex'),
});

export type AgentPayload = z.infer<typeof AgentPayloadSchema>;

/**
 * Publish (or republish) an agent identity card to Arkiv. Idempotent
 * by `slug` — if an entity already exists with the same slug under
 * our PROJECT_ATTRIBUTE, the caller should look it up first and
 * decide whether to update vs create a new one (per Network School Ethereum Hackathon skill
 * pitfall 1.2, `updateEntity` is full-replace).
 *
 * Returns `{ entityKey, txHash }` so the caller can deep-link to the
 * explorer for verification on the spot.
 */
export async function publishAgent(payload: AgentPayload): Promise<{
    entityKey: string;
    txHash: string;
}> {
    const validated = AgentPayloadSchema.parse(payload);
    const wallet = getArkivWalletClient();

    const result = await wallet.createEntity({
        payload: jsonToPayload(validated),
        contentType: 'application/json',
        attributes: [
            PROJECT_ATTRIBUTE,
            { key: 'entityType', value: ENTITY_TYPE.AGENT },
            { key: 'slug', value: validated.slug },
            { key: 'version', value: validated.version },
            { key: 'checksum', value: validated.checksum },
            { key: 'publishedAt', value: Date.now() },
        ],
        // Agent identity cards are long-lived; we extend rather than
        // let them expire silently. 30 days is the longest TTL we
        // commit upfront so we don't over-allocate (best practice #6).
        expiresIn: ExpirationTime.fromDays(30),
    });

    return {
        entityKey: result.entityKey as string,
        txHash: result.txHash as string,
    };
}

/**
 * Look up the most recent on-Arkiv identity card for a given agent
 * slug, filtered to entities our trusted backend wallet created. Falls
 * back to project-attribute-only filtering when the creator address
 * is unset (e.g., dev environments). Returns `null` when the agent
 * has not been published yet (hide-when-NULL contract).
 */
export async function getAgentBySlug(slug: string): Promise<{
    entityKey: string;
    payload: AgentPayload;
    publishedAt: number;
    explorerUrl: string;
} | null> {
    const publicClient = getArkivPublicClient();
    const creatorAddress = getCreatorWalletAddress();

    let query = publicClient
        .buildQuery()
        .where([
            eq(PROJECT_ATTRIBUTE.key, PROJECT_ATTRIBUTE.value),
            eq('entityType', ENTITY_TYPE.AGENT),
            eq('slug', slug),
        ])
        .withPayload(true)
        .withAttributes(true)
        .withMetadata(true)
        .limit(10);

    if (creatorAddress) {
        query = query.createdBy(creatorAddress as `0x${string}`);
    }

    const result = await query.fetch();
    if (result.entities.length === 0) return null;

    // Most-recent wins (the same slug may have been re-published).
    const sorted = [...result.entities].sort((a, b) => {
        const aPublished = Number(a.attributes.find((x) => x.key === 'publishedAt')?.value ?? 0);
        const bPublished = Number(b.attributes.find((x) => x.key === 'publishedAt')?.value ?? 0);
        return bPublished - aPublished;
    });

    const entity = sorted[0];
    const validated = AgentPayloadSchema.parse(entity.toJson());

    return {
        entityKey: entity.key as string,
        payload: validated,
        publishedAt: Number(entity.attributes.find((x) => x.key === 'publishedAt')?.value ?? 0),
        explorerUrl: `https://explorer.braga.hoodi.arkiv.network/entity/${entity.key}`,
    };
}

/**
 * List every agent identity card our backend has published. Used by
 * the /arkiv demo page so a judge can browse all our agents in one
 * place without prior knowledge of the slugs.
 */
export async function listAgents(): Promise<
    Array<{
        entityKey: string;
        slug: string;
        version: string;
        checksum: string;
        publishedAt: number;
        explorerUrl: string;
    }>
> {
    const publicClient = getArkivPublicClient();
    const creatorAddress = getCreatorWalletAddress();

    let query = publicClient
        .buildQuery()
        .where([
            eq(PROJECT_ATTRIBUTE.key, PROJECT_ATTRIBUTE.value),
            eq('entityType', ENTITY_TYPE.AGENT),
        ])
        .withAttributes(true)
        .limit(50);

    if (creatorAddress) {
        query = query.createdBy(creatorAddress as `0x${string}`);
    }

    const result = await query.fetch();

    return result.entities.map((e) => {
        const slug = String(e.attributes.find((x) => x.key === 'slug')?.value ?? '');
        const version = String(e.attributes.find((x) => x.key === 'version')?.value ?? '');
        const checksum = String(e.attributes.find((x) => x.key === 'checksum')?.value ?? '');
        const publishedAt = Number(e.attributes.find((x) => x.key === 'publishedAt')?.value ?? 0);
        return {
            entityKey: e.key as string,
            slug,
            version,
            checksum,
            publishedAt,
            explorerUrl: `https://explorer.braga.hoodi.arkiv.network/entity/${e.key}`,
        };
    });
}
