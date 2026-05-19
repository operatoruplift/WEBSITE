/**
 * Arkiv integration for Operator Uplift.
 *
 * Theme: AI - agents whose memory you actually own.
 *
 * Two entity types:
 *   1. Agent          - on-Arkiv mirror of /agents/<slug>.json
 *   2. memory-event   - one entry of an agent's conversation memory,
 *                       tied to a user, agent slug, and session.
 *
 * Both carry PROJECT_ATTRIBUTE. Relationships use shared attribute
 * keys (agentSlug + sessionId), per Arkiv best practice #10.
 *
 * Trust posture:
 *   - Agent entities: backend-written. Reads filter by .createdBy()
 *     against the trusted backend wallet so a malicious third party
 *     cannot poison the public agent list.
 *   - memory-event entities: user-ownable. The default writer is the
 *     backend, but $owner can be transferred to the user so they
 *     control update + delete. This is the load-bearing claim of
 *     "agents whose memory you actually own".
 */

export {
    PROJECT_ATTRIBUTE,
    ENTITY_TYPE,
    BRAGA_TESTNET,
    getCreatorWalletAddress,
} from './constants';
export type { EntityType } from './constants';

export {
    getArkivPublicClient,
    getArkivWalletClient,
    hasArkivWriteKey,
} from './client';

export {
    AgentPayloadSchema,
    publishAgent,
    getAgentBySlug,
    listAgents,
} from './agent';
export type { AgentPayload } from './agent';

export {
    MemoryPayloadSchema,
    MemoryRoleSchema,
    rememberEvent,
    recallSession,
    countSessionMemories,
    listSessions,
} from './memory';
export type { MemoryPayload, MemoryRole, RememberOpts } from './memory';
