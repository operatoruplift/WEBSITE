/**
 * Route-group layout for (auth) pages: login, paywall, signup.
 *
 * These pages all consume `usePrivy()` at the top of their client
 * components. Privy's context is undefined during static prerender in
 * CI (GitHub Actions), which throws `Cannot read properties of
 * undefined (reading 'current')`. Forcing dynamic rendering skips the
 * prerender step and the pages instead render on request. This matches
 * how Vercel already renders them in production.
 */
export const dynamic = 'force-dynamic';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
