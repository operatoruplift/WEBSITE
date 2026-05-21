import { getSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

interface CountResult {
    label: string;
    value: number | null;
    description: string;
}

async function safeCount(table: string): Promise<number | null> {
    try {
        const supabase = getSupabase();
        const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });
        if (error) return null;
        return count ?? 0;
    } catch {
        return null;
    }
}

async function safeSinceCount(table: string, days: number): Promise<number | null> {
    try {
        const supabase = getSupabase();
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
        const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true })
            .gte('created_at', since);
        if (error) return null;
        return count ?? 0;
    } catch {
        return null;
    }
}

export default async function AdminAnalyticsPage() {
    const [
        waitlistTotal,
        waitlist7d,
        waitlist30d,
        receiptsTotal,
        receipts7d,
        invoicesTotal,
    ] = await Promise.all([
        safeCount('waitlist'),
        safeSinceCount('waitlist', 7),
        safeSinceCount('waitlist', 30),
        safeCount('tool_receipts'),
        safeSinceCount('tool_receipts', 7),
        safeCount('tool_invoices'),
    ]);

    const tiles: CountResult[] = [
        {
            label: 'Waitlist total',
            value: waitlistTotal,
            description: 'All-time sign-ups',
        },
        {
            label: 'Waitlist last 7 days',
            value: waitlist7d,
            description: 'Joined in the past week',
        },
        {
            label: 'Waitlist last 30 days',
            value: waitlist30d,
            description: 'Joined in the past month',
        },
        {
            label: 'Signed receipts total',
            value: receiptsTotal,
            description: 'Lifetime ed25519-signed tool actions',
        },
        {
            label: 'Receipts last 7 days',
            value: receipts7d,
            description: 'Tool execution velocity',
        },
        {
            label: 'x402 invoices total',
            value: invoicesTotal,
            description: 'Lifetime gated tool calls (paid or pending)',
        },
    ];

    const fmt = (n: number | null) => (n === null ? '?' : n.toLocaleString());

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
                <p className="text-sm text-muted mt-1">
                    Read-only metric tiles pulled live from Supabase. Counts that fail to load show as &quot;?&quot; rather than blocking the page.
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {tiles.map((tile) => (
                    <div
                        key={tile.label}
                        className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-5"
                    >
                        <div className="text-xs font-medium uppercase tracking-wider text-muted">
                            {tile.label}
                        </div>
                        <div className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
                            {fmt(tile.value)}
                        </div>
                        <div className="mt-2 text-sm text-muted">{tile.description}</div>
                    </div>
                ))}
            </div>

            <section className="space-y-4">
                <h2 className="text-lg font-medium tracking-tight">Page views and traffic</h2>
                <div className="rounded-xl border border-foreground/10 bg-foreground/[0.02] p-5 text-sm text-muted">
                    <p className="font-medium text-foreground">Not wired yet.</p>
                    <p className="mt-2">
                        Page-view + referrer analytics need a tracker that doesn&apos;t conflict with the trust-stack story (no third-party fingerprinting). Options on the table: self-hosted Plausible or Umami via Docker, or first-party Vercel Analytics (already included with the Vercel plan).
                    </p>
                    <p className="mt-2">
                        Until one is wired, traffic numbers live in Vercel&apos;s built-in dashboard at vercel.com/operatoruplift/website.
                    </p>
                </div>
            </section>

            <section className="space-y-4">
                <h2 className="text-lg font-medium tracking-tight">Subscriptions and revenue</h2>
                <div className="rounded-xl border border-foreground/10 bg-foreground/[0.02] p-5 text-sm text-muted">
                    <p className="font-medium text-foreground">Counts are accurate; MRR is not wired yet.</p>
                    <p className="mt-2">
                        Active Pro subscriptions live in the <code className="font-mono">subscriptions</code> table; MRR + churn require a rollup that joins by status + start date. The active-only count and the per-month rollup are the next thing to ship in this tile group.
                    </p>
                </div>
            </section>
        </div>
    );
}
