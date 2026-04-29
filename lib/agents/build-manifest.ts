/**
 * Pure helper for /api/agents POST.
 *
 * The agent publish flow takes a body from the marketplace UI and
 * normalises it into the row shape the `agents` Supabase table
 * expects. This file extracts the manifest-building logic so it
 * can be unit-tested without spinning up a Next.js Request,
 * verifySession, or Supabase.
 *
 * Defaults applied (matching what the route used to inline):
 *   id            → `agent-${Date.now()}-${random6}` when missing
 *   description   → ''
 *   version       → '1.0.0'
 *   author        → 'Community'
 *   category      → 'General'
 *   model         → 'claude-sonnet-4-6'
 *   system_prompt → systemPrompt | system_prompt | ''
 *   tools         → []
 *   permissions   → []
 *   price         → 'free'
 *   avatar        → ''
 *   tags          → []
 */

export interface AgentPublishBody {
    id?: string;
    name?: string;
    description?: string;
    version?: string;
    author?: string;
    category?: string;
    model?: string;
    systemPrompt?: string;
    system_prompt?: string;
    tools?: unknown[];
    permissions?: unknown[];
    price?: string;
    avatar?: string;
    tags?: string[];
}

export interface AgentManifest {
    id: string;
    name: string;
    description: string;
    version: string;
    author: string;
    author_id: string;
    category: string;
    model: string;
    system_prompt: string;
    tools: unknown[];
    permissions: unknown[];
    price: string;
    avatar: string;
    tags: string[];
}

/**
 * Generate an agent id with random suffix for uniqueness across
 * back-to-back publishes in the same millisecond. Matches the
 * pattern used by lib/notifications.ts and lib/auditLog.ts.
 */
export function generateAgentId(now?: number, rand?: () => string): string {
    const t = now ?? Date.now();
    const r = (rand ?? (() => Math.random().toString(36).slice(2, 6)))();
    return `agent-${t}-${r}`;
}

/**
 * Build an agent manifest from a publish body.
 *
 * Throws when body.name is missing — the route handler catches this
 * via a validationError before calling Supabase. The route already
 * gates on body.name; this fn enforces the contract for callers
 * that bypass the route (e.g. seeded data tools).
 */
export function buildAgentManifest(
    body: AgentPublishBody,
    authorId: string,
    opts?: { now?: number; rand?: () => string },
): AgentManifest {
    if (!body.name) {
        throw new Error('Agent manifest requires `name`.');
    }
    return {
        id: body.id || generateAgentId(opts?.now, opts?.rand),
        name: body.name,
        description: body.description ?? '',
        version: body.version || '1.0.0',
        author: body.author || 'Community',
        author_id: authorId,
        category: body.category || 'General',
        model: body.model || 'claude-sonnet-4-6',
        system_prompt: body.systemPrompt ?? body.system_prompt ?? '',
        tools: body.tools ?? [],
        permissions: body.permissions ?? [],
        price: body.price || 'free',
        avatar: body.avatar ?? '',
        tags: body.tags ?? [],
    };
}
