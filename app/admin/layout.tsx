import { notFound } from 'next/navigation';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { PrivyClient } from '@privy-io/server-auth';
import { isAdmin } from '@/lib/admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * /admin protected layout.
 *
 * Renders only for users on the PAYWALL_BYPASS_EMAILS allowlist. All
 * other requests get a 404 (notFound) instead of a 403, so the admin
 * surface isn't even confirmed to exist for non-admins. The middleware
 * already validates the Privy session cookie; this layer adds the
 * email-allowlist check.
 *
 * Three tabs:
 *   - /admin             dashboard landing (metric tiles)
 *   - /admin/waitlist    waitlist viewer
 *   - /admin/blog        blog manager (CMS)
 *   - /admin/analytics   analytics view
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const cookieStore = await cookies();
    const token =
        cookieStore.get('privy-token')?.value ||
        cookieStore.get('privy-id-token')?.value;
    if (!token) {
        notFound();
    }

    const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
    const appSecret = process.env.PRIVY_APP_SECRET;
    if (!appId || !appSecret) {
        notFound();
    }

    let userId: string;
    try {
        const privy = new PrivyClient(appId, appSecret);
        const claims = await privy.verifyAuthToken(token);
        userId = claims.userId;
    } catch {
        notFound();
    }

    const allowed = await isAdmin(userId);
    if (!allowed) {
        notFound();
    }

    return (
        <div className="theme-light min-h-screen bg-background text-foreground">
            <div className="border-b border-foreground/10 bg-background">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link href="/admin" className="font-semibold text-foreground">
                            Operator Admin
                        </Link>
                        <nav aria-label="Admin sections" className="hidden md:flex items-center gap-1 text-sm">
                            <Link
                                href="/admin"
                                className="px-3 py-1.5 rounded-md hover:bg-foreground/[0.04]"
                            >
                                Overview
                            </Link>
                            <Link
                                href="/admin/waitlist"
                                className="px-3 py-1.5 rounded-md hover:bg-foreground/[0.04]"
                            >
                                Waitlist
                            </Link>
                            <Link
                                href="/admin/blog"
                                className="px-3 py-1.5 rounded-md hover:bg-foreground/[0.04]"
                            >
                                Blog
                            </Link>
                            <Link
                                href="/admin/analytics"
                                className="px-3 py-1.5 rounded-md hover:bg-foreground/[0.04]"
                            >
                                Analytics
                            </Link>
                        </nav>
                    </div>
                    <Link
                        href="/"
                        className="text-sm text-muted hover:text-foreground"
                    >
                        Back to site
                    </Link>
                </div>
            </div>
            <main className="max-w-7xl mx-auto px-6 py-10">{children}</main>
        </div>
    );
}
