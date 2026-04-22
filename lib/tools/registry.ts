/**
 * Tool registry, single source of truth for what tools exist, what tier
 * they belong to, and what capability they require.
 *
 * Used by:
 *  - ToolApprovalModal picker (filter by capability state)
 *  - /api/tool-execute routes (capability guard)
 *  - /demo page + canned replies (catalog rendering)
 *
 * Tiers:
 *  - 1: safe for anonymous demo (returns Simulated result in demo mode).
 *  - 2: requires a connected account (OAuth, API key, or server secret).
 *
 * comingSoon: true  → render in catalog + modal disabled. Approve button
 *                     shows "Coming post-May-15". Prevents over-promising.
 */

export type ToolRequires = 'none' | 'google' | 'api_key' | 'slack' | 'linear' | 'jira' | 'notion' | 'github' | 'stripe' | 'twilio' | 'photon' | 'tokens';

export interface ToolMeta {
    id: string;
    tool: string;
    action: string;
    label: string;
    description: string;
    tier: 1 | 2;
    requires: ToolRequires;
    comingSoon?: boolean;
}

export const TOOL_REGISTRY: ToolMeta[] = [
    // --- Tier 1: no connection needed, safe for anonymous demo ---
    { id: 'web.search', tool: 'web', action: 'search', label: 'Web search', description: 'Search the web and return ranked results.', tier: 1, requires: 'none' },
    { id: 'web.fetch', tool: 'web', action: 'fetch', label: 'Fetch webpage', description: 'Load a URL and return the readable text.', tier: 1, requires: 'none' },
    { id: 'notes.create', tool: 'notes', action: 'create', label: 'Create note', description: 'Save a free-form note to your notes.', tier: 1, requires: 'none' },
    { id: 'notes.list', tool: 'notes', action: 'list', label: 'List notes', description: 'List your recent notes.', tier: 1, requires: 'none' },
    { id: 'tasks.create', tool: 'tasks', action: 'create', label: 'Create task', description: 'Add a task to your list.', tier: 1, requires: 'none' },
    { id: 'tasks.list', tool: 'tasks', action: 'list', label: 'List tasks', description: 'List your pending tasks.', tier: 1, requires: 'none' },
    { id: 'reminders.schedule', tool: 'reminders', action: 'schedule', label: 'Schedule reminder', description: 'Schedule an iMessage-style nudge.', tier: 1, requires: 'none' },
    // Tokens API, Solana market/price/risk data. Server-held key so
    // the user doesn't need to connect anything; Tier 1 / none-required.
    { id: 'tokens.search', tool: 'tokens', action: 'search', label: 'Search token', description: 'Find a Solana token by name or symbol.', tier: 1, requires: 'none' },
    { id: 'tokens.price', tool: 'tokens', action: 'price', label: 'Token price chart', description: 'OHLCV candles for a canonical asset.', tier: 1, requires: 'none' },
    { id: 'tokens.risk', tool: 'tokens', action: 'risk', label: 'Token risk score', description: 'Quick risk + quality rating for a token mint.', tier: 1, requires: 'none' },
    { id: 'tokens.markets', tool: 'tokens', action: 'markets', label: 'Token DEX markets', description: 'List the DEX markets for a token mint.', tier: 1, requires: 'none' },
    // Tier 1 but shipped post-May-15. Visible in modal, Approve disabled.
    { id: 'files.pdf_summarize', tool: 'files', action: 'pdf_summarize', label: 'Summarize PDF', description: 'Upload a PDF and get a summary.', tier: 1, requires: 'none', comingSoon: true },
    { id: 'contacts.search', tool: 'contacts', action: 'search', label: 'Search contacts', description: 'Look up people in your CRM.', tier: 1, requires: 'none', comingSoon: true },
    { id: 'contacts.upsert', tool: 'contacts', action: 'upsert', label: 'Save contact', description: 'Create or update a contact.', tier: 1, requires: 'none', comingSoon: true },
    { id: 'files.explorer', tool: 'files', action: 'explorer', label: 'Local file explorer', description: 'Browse local files (desktop app only).', tier: 1, requires: 'none', comingSoon: true },

    // --- Tier 2: Google (real in May 14 demo) ---
    { id: 'calendar.list', tool: 'calendar', action: 'list', label: 'List calendar events', description: 'Show upcoming events.', tier: 2, requires: 'google' },
    { id: 'calendar.free_slots', tool: 'calendar', action: 'free_slots', label: 'Find free slots', description: 'Find open times on your calendar.', tier: 2, requires: 'google' },
    { id: 'calendar.create', tool: 'calendar', action: 'create', label: 'Create event', description: 'Create a calendar event.', tier: 2, requires: 'google' },
    { id: 'gmail.list', tool: 'gmail', action: 'list', label: 'Read inbox', description: 'List recent Gmail messages.', tier: 2, requires: 'google' },
    { id: 'gmail.draft', tool: 'gmail', action: 'draft', label: 'Draft reply', description: 'Compose an email draft.', tier: 2, requires: 'google' },
    { id: 'gmail.send', tool: 'gmail', action: 'send', label: 'Send email', description: 'Send an email on your behalf.', tier: 2, requires: 'google' },

    // --- Tier 2: other providers (all comingSoon for May 14) ---
    { id: 'slack.post_message', tool: 'slack', action: 'post_message', label: 'Post to Slack', description: 'Send a message to a Slack channel.', tier: 2, requires: 'slack', comingSoon: true },
    { id: 'slack.read_channel', tool: 'slack', action: 'read_channel', label: 'Read Slack channel', description: 'Read recent Slack messages.', tier: 2, requires: 'slack', comingSoon: true },
    { id: 'linear.create_issue', tool: 'linear', action: 'create_issue', label: 'Create Linear issue', description: 'Open a Linear ticket.', tier: 2, requires: 'linear', comingSoon: true },
    { id: 'linear.search', tool: 'linear', action: 'search', label: 'Search Linear', description: 'Search Linear tickets.', tier: 2, requires: 'linear', comingSoon: true },
    { id: 'jira.create_issue', tool: 'jira', action: 'create_issue', label: 'Create Jira issue', description: 'Open a Jira ticket.', tier: 2, requires: 'jira', comingSoon: true },
    { id: 'notion.create_page', tool: 'notion', action: 'create_page', label: 'Create Notion page', description: 'Create a page in Notion.', tier: 2, requires: 'notion', comingSoon: true },
    { id: 'notion.search', tool: 'notion', action: 'search', label: 'Search Notion', description: 'Search Notion.', tier: 2, requires: 'notion', comingSoon: true },
    { id: 'github.open_issue', tool: 'github', action: 'open_issue', label: 'Open GitHub issue', description: 'Open a GitHub issue.', tier: 2, requires: 'github', comingSoon: true },
    { id: 'github.search_code', tool: 'github', action: 'search_code', label: 'Search GitHub code', description: 'Search code across GitHub.', tier: 2, requires: 'github', comingSoon: true },
    { id: 'drive.list', tool: 'drive', action: 'list', label: 'List Google Drive', description: 'List files in Drive.', tier: 2, requires: 'google', comingSoon: true },
    { id: 'drive.fetch', tool: 'drive', action: 'fetch', label: 'Open Drive file', description: 'Fetch a Drive file.', tier: 2, requires: 'google', comingSoon: true },
    { id: 'stripe.create_checkout', tool: 'stripe', action: 'create_checkout', label: 'Stripe checkout', description: 'Create a Stripe checkout session.', tier: 2, requires: 'stripe', comingSoon: true },
    { id: 'comms.send_email', tool: 'comms', action: 'send_email', label: 'Send email (any)', description: 'Send a transactional email.', tier: 2, requires: 'google', comingSoon: true },
    { id: 'comms.send_sms', tool: 'comms', action: 'send_sms', label: 'Send SMS', description: 'Send an SMS via Twilio.', tier: 2, requires: 'twilio', comingSoon: true },

    // iMessage via the Photon adapter (lib/photon/adapter.ts). Tier 2
    // because a real provider key has to be configured; the registry
    // treats `requires: 'photon'` as "configured server-side", we
    // don't expose that env state to clients.
    { id: 'imessage.send', tool: 'imessage', action: 'send', label: 'Send iMessage', description: 'Send an iMessage via the Photon adapter.', tier: 2, requires: 'photon' },
];

export function findTool(tool: string, action: string): ToolMeta | undefined {
    return TOOL_REGISTRY.find(t => t.tool === tool && t.action === action);
}

export interface CapabilityState {
    capability_google: boolean;
    capability_key: boolean;
    capability_real: boolean;
}

/**
 * Returns true when the user's capabilities satisfy the tool's requirement.
 * Tier 1 tools with `requires: 'none'` are always satisfied; Demo mode just
 * runs them as simulated.
 */
export function isToolAvailable(meta: ToolMeta, caps: CapabilityState): boolean {
    if (meta.comingSoon) return false;
    if (meta.requires === 'none') return true;
    if (meta.requires === 'google') return caps.capability_google;
    if (meta.requires === 'api_key') return caps.capability_key;
    // `photon` and `tokens` are server-env-configured, not per-user.
    // The handler routes enforce the real config check. We treat them
    // as available so the modal isn't greyed out when the server has
    // the key, the route will 503 honestly if it doesn't.
    if (meta.requires === 'photon' || meta.requires === 'tokens') return true;
    // External-provider tools (slack, linear, jira, notion, github, stripe,
    // twilio) are all comingSoon in May 14, so we never reach here. Return
    // false for safety.
    return false;
}
