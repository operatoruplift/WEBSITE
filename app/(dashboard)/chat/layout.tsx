/**
 * /chat route group override. 2026-05-22 dashboard cleanup.
 *
 * Suppresses the parent (dashboard)/layout.tsx DashboardLayout
 * wrapper (sidebar + topbar + AuthGate) so the retired-surface card
 * renders against a clean v2 dark background. The route is kept alive
 * so external links and existing specs still resolve.
 */
export default function ChatLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
