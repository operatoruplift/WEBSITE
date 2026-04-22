/**
 * Tool Safety classification, SAFE (read-only, cheap, reversible)
 * vs RISKY (writes, spends, sends, irreversible side-effects).
 *
 * UNKNOWN tools/actions default to RISKY (fail-closed): the UI shows
 * a stronger confirmation state rather than letting an unclassified
 * action slip through with the light approve flow.
 *
 * This is the UI-layer trust signal. The authoritative gate on the
 * server is x402 + capabilities, this module just controls how
 * loudly the approval modal asks the user to think.
 *
 * @see docs/research/TOOL_SAFETY.md
 */

export type ToolSafety = 'SAFE' | 'RISKY';

export interface ToolActionRef {
    /** The tool bucket, calendar, gmail, tokens, imessage, ... */
    toolName: string;
    /** The action within that tool, list, create, send, ... */
    operation?: string;
    /** Optional route hint for tools that multiplex many ops on one endpoint. */
    route?: string;
}

/**
 * Hard-coded map of known actions. Key format: `${toolName}.${operation}`.
 * Any entry absent here → classifyToolAction returns 'RISKY'.
 *
 * Keep this map conservative. When in doubt, leave the action out ,  * RISKY is the safer default for an unclassified action. New tools
 * should be added here explicitly as they ship.
 */
const KNOWN_ACTIONS: Record<string, ToolSafety> = {
    // Calendar, reads cheap, writes touch a real Google Calendar.
    'calendar.list': 'SAFE',
    'calendar.free_slots': 'SAFE',
    'calendar.get': 'SAFE',
    'calendar.create': 'RISKY',
    'calendar.update': 'RISKY',
    'calendar.delete': 'RISKY',

    // Gmail, reads cheap, any draft/send touches the user's mailbox.
    'gmail.list': 'SAFE',
    'gmail.read': 'SAFE',
    'gmail.search': 'SAFE',
    'gmail.draft': 'RISKY',
    'gmail.send': 'RISKY',
    'gmail.send_draft': 'RISKY',

    // Reminders / Notes / Tasks, list is SAFE, any write mutates user data.
    'reminders.list': 'SAFE',
    'reminders.create': 'RISKY',
    'reminders.update': 'RISKY',
    'reminders.delete': 'RISKY',
    'notes.list': 'SAFE',
    'notes.read': 'SAFE',
    'notes.create': 'RISKY',
    'notes.update': 'RISKY',
    'notes.delete': 'RISKY',
    'tasks.list': 'SAFE',
    'tasks.create': 'RISKY',
    'tasks.update': 'RISKY',
    'tasks.delete': 'RISKY',

    // Web + Tokens, read-only lookups against public data.
    'web.fetch': 'SAFE',
    'web.search': 'SAFE',
    'tokens.search': 'SAFE',
    'tokens.price': 'SAFE',
    'tokens.risk': 'SAFE',

    // iMessage (Photon), any send is user-visible and irreversible.
    'imessage.send': 'RISKY',
    'imessage.send_tapback': 'RISKY',

    // x402 payments, always RISKY (moves money on devnet/mainnet).
    'x402.pay': 'RISKY',
};

/**
 * Return 'SAFE' only if the action is explicitly known to be read-only.
 * Everything else, unknown toolNames, typos, new actions not yet
 * mapped, returns 'RISKY'. Deliberate fail-closed default.
 */
export function classifyToolAction(action: ToolActionRef): ToolSafety {
    if (!action || !action.toolName) return 'RISKY';
    const op = action.operation ?? action.route ?? '';
    const key = op ? `${action.toolName}.${op}` : action.toolName;
    return KNOWN_ACTIONS[key] ?? 'RISKY';
}

/**
 * True when the action is present in the classification map.
 * The UI uses this to distinguish "known RISKY" (expected write flow)
 * from "UNKNOWN" (classified RISKY because we've never seen it).
 * UNKNOWN actions get an extra "not classified yet" notice.
 */
export function isKnownAction(action: ToolActionRef): boolean {
    if (!action || !action.toolName) return false;
    const op = action.operation ?? action.route ?? '';
    const key = op ? `${action.toolName}.${op}` : action.toolName;
    return key in KNOWN_ACTIONS;
}
