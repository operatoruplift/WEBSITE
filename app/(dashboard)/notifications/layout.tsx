/**
 * /notifications route group override. 2026-05-22 dashboard cleanup.
 * Suppresses the parent DashboardLayout wrapper so the retired-
 * surface card renders on a clean v2 dark background.
 */
export default function NotificationsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
