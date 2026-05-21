import { getSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

interface WaitlistRow {
    id: string;
    email: string;
    created_at: string;
    source?: string | null;
}

async function loadWaitlist(): Promise<{ rows: WaitlistRow[]; error: string | null }> {
    try {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from('waitlist')
            .select('id, email, created_at, source')
            .order('created_at', { ascending: false })
            .limit(500);
        if (error) {
            return { rows: [], error: error.message };
        }
        return { rows: (data as WaitlistRow[]) ?? [], error: null };
    } catch (err) {
        return {
            rows: [],
            error: err instanceof Error ? err.message : 'unknown error',
        };
    }
}

function formatDate(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
}

export default async function AdminWaitlistPage() {
    const { rows, error } = await loadWaitlist();

    return (
        <div className="space-y-6">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Waitlist</h1>
                    <p className="text-sm text-muted mt-1">
                        Most recent 500 sign-ups from the press-kit, paywall, and login forms.
                    </p>
                </div>
                <div className="text-sm text-muted">
                    <span className="font-medium text-foreground">{rows.length}</span> rows shown
                </div>
            </div>

            {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
                    Could not load waitlist: <code className="font-mono">{error}</code>
                </div>
            ) : rows.length === 0 ? (
                <div className="rounded-xl border border-foreground/10 bg-foreground/[0.02] p-10 text-center text-sm text-muted">
                    No sign-ups yet. Once someone joins via /press-kit, /paywall, or /login, they show up here.
                </div>
            ) : (
                <div className="overflow-x-auto rounded-xl border border-foreground/10">
                    <table className="min-w-full text-sm">
                        <thead className="bg-foreground/[0.02]">
                            <tr className="text-left text-xs uppercase tracking-wider text-muted">
                                <th className="px-4 py-3 font-medium">Email</th>
                                <th className="px-4 py-3 font-medium">Source</th>
                                <th className="px-4 py-3 font-medium">Joined</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-foreground/10">
                            {rows.map((row) => (
                                <tr key={row.id} className="hover:bg-foreground/[0.02]">
                                    <td className="px-4 py-3 font-mono text-foreground">{row.email}</td>
                                    <td className="px-4 py-3 text-muted">{row.source || '-'}</td>
                                    <td className="px-4 py-3 text-muted">{formatDate(row.created_at)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="text-xs text-muted">
                The waitlist table also accepts an optional <code className="font-mono">source</code> column. If your row shows <code className="font-mono">-</code> the row was written before the source field was added or the form didn&apos;t set it.
            </div>
        </div>
    );
}
