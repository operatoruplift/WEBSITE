/**
 * /swarm route group override. 2026-05-22 dashboard cleanup.
 * Suppresses the parent DashboardLayout wrapper.
 */
export default function SwarmLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
