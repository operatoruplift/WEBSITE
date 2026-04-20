/**
 * Live-agent registry — single source of truth for which agents ship.
 *
 * Rules:
 *   - `isLive: true` means the agent is wired end-to-end. The store
 *     renders it, clicking it lands in a working experience, and a
 *     test prompt returns a non-error response (possibly simulated).
 *   - `isLive: false` is a hidden pipeline entry. Never rendered in
 *     any store UI. Not a "coming soon" placeholder, just absent.
 *   - Never add `isLive: true` for an agent that isn't fully wired.
 *
 * Surfaces:
 *   - web:      the /chat page on operatoruplift.com
 *   - imessage: the Photon iMessage inbound/outbound worker
 *   - dmg:      the macOS DMG companion (offline fixtures mode)
 *
 * Dependencies (`requires*`):
 *   - requiresLogin:  user must be authenticated (Privy)
 *   - requiresKey:    at least one server LLM API key in Settings
 *   - requiresGoogle: Google OAuth connected in /integrations
 *
 * When a dependency is missing, `dependencyRoute(agent)` below returns
 * the right /integrations or /settings or /login route so the store
 * card can link to a calm gating screen instead of a dead end.
 *
 * See docs/research/AGENT_REGISTRY.md for the acceptance checklist.
 */

export interface LiveAgent {
    id: string;
    name: string;
    description: string;
    avatar: string;
    category: 'Briefing' | 'Inbox' | 'Reminders' | 'Research' | 'Trading' | 'Code';
    isLive: boolean;
    surfacesEnabled: { web: boolean; imessage: boolean; dmg: boolean };
    requiresLogin: boolean;
    requiresKey: boolean;
    requiresGoogle: boolean;
    /** Chat seed prompt — fed into /chat?agent=<id>&prompt=... */
    testPrompt: string;
    /** Tags shown on the store card. */
    tags: string[];
}

export const LIVE_AGENTS: LiveAgent[] = [
    {
        id: 'briefing',
        name: 'Daily Briefing',
        description: 'Scans your calendar each morning and flags what needs attention.',
        avatar: '☀️',
        category: 'Briefing',
        isLive: true,
        surfacesEnabled: { web: true, imessage: true, dmg: true },
        requiresLogin: false,
        requiresKey: false,
        requiresGoogle: false,
        testPrompt: 'What\u2019s on my calendar today?',
        tags: ['calendar', 'morning', 'free'],
    },
    {
        id: 'inbox',
        name: 'Inbox Triage',
        description: 'Drafts replies to the 3 emails most worth your time. Never sends without approval.',
        avatar: '✉️',
        category: 'Inbox',
        isLive: true,
        surfacesEnabled: { web: true, imessage: false, dmg: true },
        requiresLogin: false,
        requiresKey: false,
        requiresGoogle: false,
        testPrompt: 'Draft replies to my last 3 emails, ask me before sending.',
        tags: ['gmail', 'draft', 'approval'],
    },
    {
        id: 'reminders',
        name: 'Morning Nudges',
        description: 'iMessage-style nudges: weather, calendar, one small fun thing.',
        avatar: '⏰',
        category: 'Reminders',
        isLive: true,
        surfacesEnabled: { web: true, imessage: true, dmg: false },
        requiresLogin: false,
        requiresKey: false,
        requiresGoogle: false,
        testPrompt: 'Turn tomorrow morning into iMessage-style nudges: weather, calendar, one fun thing.',
        tags: ['reminders', 'imessage', 'routine'],
    },
    {
        id: 'tokens',
        name: 'Token Lookup',
        description: 'Price check, risk grade, and liquidity snapshots for any token.',
        avatar: '💠',
        category: 'Trading',
        isLive: true,
        surfacesEnabled: { web: true, imessage: false, dmg: true },
        requiresLogin: false,
        requiresKey: false,
        requiresGoogle: false,
        testPrompt: 'What\u2019s the price of SOL right now and what\u2019s the risk grade on the top market?',
        tags: ['tokens', 'price', 'risk'],
    },
    {
        id: 'web',
        name: 'Web Researcher',
        description: 'Fetches and summarizes a URL or search query with inline citations.',
        avatar: '🌐',
        category: 'Research',
        isLive: true,
        surfacesEnabled: { web: true, imessage: false, dmg: true },
        requiresLogin: false,
        requiresKey: false,
        requiresGoogle: false,
        testPrompt: 'Summarize the front page of operatoruplift.com in 3 bullets.',
        tags: ['web', 'research', 'fetch'],
    },
];

/**
 * Capability check. Returns a deep-link path to the gating screen if
 * the agent has unmet dependencies. Returns null if the agent is ready
 * to run for this user.
 *
 * @param agent  registry entry
 * @param caps   current user capabilities (auth + google + key state)
 */
export interface AgentCapabilityCheck {
    hasToken: boolean;
    hasGoogle: boolean;
    hasKey: boolean;
}

export function dependencyRoute(agent: LiveAgent, caps: AgentCapabilityCheck): string | null {
    if (agent.requiresLogin && !caps.hasToken) return '/login';
    if (agent.requiresGoogle && !caps.hasGoogle) return '/integrations';
    if (agent.requiresKey && !caps.hasKey) return '/settings';
    return null;
}

/**
 * Store listing — only live agents, ordered by category then name.
 * Consumers that need the hidden pipeline (internal debugging) should
 * import LIVE_AGENTS directly and filter themselves.
 */
export function listStoreAgents(): LiveAgent[] {
    return LIVE_AGENTS.filter(a => a.isLive).sort((a, b) => {
        if (a.category !== b.category) return a.category.localeCompare(b.category);
        return a.name.localeCompare(b.name);
    });
}

/**
 * Build the deep-link into /chat for this agent. Seeds the testPrompt
 * as the initial textarea value; the chat page reads the query string
 * and auto-fills.
 */
export function chatDeepLink(agent: LiveAgent): string {
    const params = new URLSearchParams({ agent: agent.id, prompt: agent.testPrompt });
    return `/chat?${params.toString()}`;
}

export function findAgent(id: string): LiveAgent | undefined {
    return LIVE_AGENTS.find(a => a.id === id);
}
