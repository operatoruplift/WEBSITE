import Link from 'next/link';
import { getSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * Admin dashboard overview tile grid.
 *
 * Shows fresh counts from the underlying tables (waitlist, receipts,
 * subscriptions, blog posts) so an operator can see at a glance
 * whether the funnel is moving without clicking through to each tab.
 *
 * Errors fall back to "?" rather than failing the whole page; an
 * individual count missing is not a reason to break the overview.
 */
async function loadTiles() {
    const supabase = getSupabase();
    const safeCount = async (table: string): Promise<number | null> => {
        try {
            const { count, error } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });
            if (error) return null;
            return count ?? 0;
        } catch {
            return null;
        }
    };
    const [waitlist, receipts, invoices] = await Promise.all([
        safeCount('waitlist'),
        safeCount('tool_receipts'),
        safeCount('tool_invoices'),
    ]);
    return { waitlist, receipts, invoices };
}

export default async function AdminOverviewPage() {
    const tiles = await loadTiles();
    const fmt = (n: number | null) => (n === null ? '?' : n.toLocaleString());

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
                <p className="text-sm text-muted mt-1">
                    Snapshot of the operator-side counters that drive the funnel and the trust surface.
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Tile
                    label="Waitlist sign-ups"
                    value={fmt(tiles.waitlist)}
                    href="/admin/waitlist"
                    description="Total rows in the waitlist table"
                />
                {/* /security is a retired RetiredSurface route.
                    Drop the href and show the tile as a stat-only card
                    until a replacement admin receipts surface ships. */}
                <Tile
                    label="Signed receipts"
                    value={fmt(tiles.receipts)}
                    description="Lifetime tool_receipts written"
                />
                <Tile
                    label="x402 invoices"
                    value={fmt(tiles.invoices)}
                    description="Lifetime tool_invoices created"
                />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <NavCard
                    title="Blog"
                    href="/admin/blog"
                    description="Add, edit, or unpublish posts. Edits go live on next deploy."
                />
                <NavCard
                    title="Analytics"
                    href="/admin/analytics"
                    description="Page views, subscriptions, receipts, and waitlist funnel signal."
                />
            </div>
        </div>
    );
}

function Tile({
    label,
    value,
    href,
    description,
}: {
    label: string;
    value: string;
    href?: string;
    description: string;
}) {
    const body = (
        <>
            <div className="text-xs font-medium uppercase tracking-wider text-muted">{label}</div>
            <div className="mt-3 text-3xl font-semibold tracking-tight text-foreground">{value}</div>
            <div className="mt-2 text-sm text-muted">{description}</div>
        </>
    );
    const className =
        'block rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-5 hover:border-foreground/20 transition-colors';
    return href ? (
        <Link href={href} className={className}>
            {body}
        </Link>
    ) : (
        <div className={className}>{body}</div>
    );
}

function NavCard({ title, href, description }: { title: string; href: string; description: string }) {
    return (
        <Link
            href={href}
            className="block rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-5 hover:border-foreground/20 transition-colors"
        >
            <div className="text-base font-medium text-foreground">{title}</div>
            <div className="mt-2 text-sm text-muted">{description}</div>
            <div className="mt-3 text-xs text-foreground/60">Open {title.toLowerCase()} →</div>
        </Link>
    );
}
