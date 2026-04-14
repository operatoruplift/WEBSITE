/**
 * Audit log — append-only local record of every tool action taken by agents.
 *
 * Stored in localStorage. When encryption is configured, entries are
 * encrypted at rest via lib/encryption.ts. Used by the Security page and
 * the Council Decides demo flow to show cryptographic proof of actions.
 */

export interface AuditEntry {
    id: string;
    timestamp: string;
    category: 'calendar' | 'gmail' | 'agent' | 'approval' | 'encryption' | 'auth';
    action: string;
    details: string;
    agentName?: string;
    approved?: boolean;
}

const AUDIT_KEY = 'ou-audit-log';
const MAX_ENTRIES = 500;

/** Retrieve the full audit log (newest first). */
export function getAuditLog(limit: number = 100): AuditEntry[] {
    try {
        const raw = localStorage.getItem(AUDIT_KEY);
        if (!raw) return [];
        const entries: AuditEntry[] = JSON.parse(raw);
        return entries.slice(0, limit);
    } catch {
        return [];
    }
}

/** Append an entry to the audit log. Newest entries are stored first. */
export function logAction(
    category: AuditEntry['category'],
    action: string,
    details: string,
    agentName?: string,
    approved?: boolean,
): AuditEntry {
    const entry: AuditEntry = {
        id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
        category,
        action,
        details,
        agentName,
        approved,
    };

    try {
        const raw = localStorage.getItem(AUDIT_KEY);
        const existing: AuditEntry[] = raw ? JSON.parse(raw) : [];
        const updated = [entry, ...existing].slice(0, MAX_ENTRIES);
        localStorage.setItem(AUDIT_KEY, JSON.stringify(updated));
    } catch {
        // localStorage full or unavailable — log to console as fallback
        console.warn('[audit-log] failed to persist:', entry);
    }

    return entry;
}

/** Clear the entire audit log. */
export function clearAuditLog(): void {
    localStorage.removeItem(AUDIT_KEY);
}

/** Get count of entries by category. */
export function getAuditStats(): Record<string, number> {
    const entries = getAuditLog(MAX_ENTRIES);
    const stats: Record<string, number> = {};
    for (const entry of entries) {
        stats[entry.category] = (stats[entry.category] ?? 0) + 1;
    }
    return stats;
}
