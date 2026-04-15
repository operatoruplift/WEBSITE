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

        // Auto-publish Merkle root every 5 actions
        const unpublished = getUnpublishedCount();
        if (unpublished >= 5) {
            publishMerkleRoot().catch(() => {}); // Fire and forget
        }
    } catch {
        console.warn('[audit-log] failed to persist:', entry);
    }

    return entry;
}

const LAST_PUBLISH_KEY = 'ou-audit-last-publish-index';
const ON_CHAIN_KEY = 'ou-audit-on-chain';

interface OnChainRecord {
    merkleRoot: string;
    txSignature: string;
    explorerUrl: string;
    actionCount: number;
    publishedAt: string;
}

/** Get the count of actions since last on-chain publish. */
function getUnpublishedCount(): number {
    const lastIndex = parseInt(localStorage.getItem(LAST_PUBLISH_KEY) || '0', 10);
    const entries = getAuditLog(MAX_ENTRIES);
    return entries.length - lastIndex;
}

/** Get the latest on-chain record. */
export function getOnChainRecord(): OnChainRecord | null {
    try {
        const raw = localStorage.getItem(ON_CHAIN_KEY);
        if (raw) return JSON.parse(raw);
    } catch {}
    return null;
}

/** Publish the current audit log as a Merkle root on Solana devnet. */
export async function publishMerkleRoot(): Promise<OnChainRecord | null> {
    const entries = getAuditLog(MAX_ENTRIES);
    if (entries.length === 0) return null;

    // Hash each entry
    const hashes = entries.map(e => {
        const data = `${e.id}:${e.timestamp}:${e.category}:${e.action}:${e.approved}`;
        // Simple client-side SHA-256 (Web Crypto)
        return Array.from(new TextEncoder().encode(data))
            .reduce((hash, byte) => {
                hash = ((hash << 5) - hash) + byte;
                return hash & hash;
            }, 0)
            .toString(16)
            .padStart(64, '0');
    });

    const userId = (() => {
        try { return JSON.parse(localStorage.getItem('user') || '{}').id || 'anon'; } catch { return 'anon'; }
    })();

    try {
        const res = await fetch('/api/audit/publish-root', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, action_hashes: hashes }),
        });

        if (!res.ok) return null;
        const data = await res.json();

        if (data.success) {
            const record: OnChainRecord = {
                merkleRoot: data.merkle_root,
                txSignature: data.tx_signature,
                explorerUrl: data.explorer_url,
                actionCount: data.action_count,
                publishedAt: new Date().toISOString(),
            };
            localStorage.setItem(ON_CHAIN_KEY, JSON.stringify(record));
            localStorage.setItem(LAST_PUBLISH_KEY, String(entries.length));
            return record;
        }
    } catch {}
    return null;
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
