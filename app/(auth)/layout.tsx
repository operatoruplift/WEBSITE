/**
 * Route-group layout for (auth) pages: login, paywall, signup.
 *
 * These pages all consume `usePrivy()` at the top of their client
 * components. Privy's context is undefined during static prerender in
 * CI (GitHub Actions), which throws `Cannot read properties of
 * undefined (reading 'current')`. Forcing dynamic rendering skips the
 * prerender step and the pages instead render on request. This matches
 * how Vercel already renders them in production.
 *
 * 2026-06-03: PrivyWrapper moved here from app/layout.tsx. Mounting
 * Privy at the root forced every marketing page (homepage, /pricing,
 * /docs, /blog, /faq, /press-kit, etc.) to download the full
 * @privy-io/react-auth bundle plus the Solana wallet connectors,
 * about 367KB brotli of JS that none of those pages use. The audit
 * flagged this as the single largest perf win on the homepage
 * (rules/web/performance.md landing-page budget is 150KB; we were at
 * ~858KB brotli total).
 *
 * Marketing pages no longer mount Privy. Auth state is still
 * available to the dashboard because AuthGate reads
 * localStorage.token directly (written by PrivyTokenSync inside
 * the auth routes after login).
 */
import { PrivyWrapper } from '@/src/components/providers/PrivyWrapper';

export const dynamic = 'force-dynamic';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return <PrivyWrapper>{children}</PrivyWrapper>;
}
