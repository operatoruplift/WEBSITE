import { DashboardLayout } from '@/src/components/layout/DashboardLayout';
import { PrivyWrapper } from '@/src/components/providers/PrivyWrapper';

/**
 * Dashboard root layout. Wraps the dashboard surface in PrivyWrapper
 * so PrivyTokenSync can keep localStorage.token fresh on long sessions
 * (the JWT expires after ~1 hour without it, which breaks every
 * server-side verification under /api).
 *
 * 2026-06-03: Privy was moved out of app/layout.tsx (where it loaded
 * its 367KB brotli bundle on every marketing page including the
 * homepage). It now mounts on the routes that actually need it:
 * (auth)/* for the login/paywall flow and (dashboard)/* for the
 * post-auth surface where AuthGate reads the token Privy refreshes.
 */
export default function DashboardRootLayout({ children }: { children: React.ReactNode }) {
    return (
        <PrivyWrapper>
            <DashboardLayout>{children}</DashboardLayout>
        </PrivyWrapper>
    );
}
