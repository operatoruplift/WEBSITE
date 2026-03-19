import { DashboardLayout } from '@/src/components/layout/DashboardLayout';

export default function DashboardRootLayout({ children }: { children: React.ReactNode }) {
    return <DashboardLayout>{children}</DashboardLayout>;
}
