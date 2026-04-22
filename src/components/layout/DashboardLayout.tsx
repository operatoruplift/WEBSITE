"use client";

import { AgentProvider } from '@/src/components/providers/AgentProvider';
import { AuthGate } from '@/src/components/AuthGate';
import { CockpitSidebar } from '@/src/components/cockpit/CockpitSidebar';
import { CommandBar } from '@/src/components/ui/CommandBar';
import { UserHeader } from '@/src/components/ui/UserHeader';
import { ToastProvider } from '@/src/components/ui/Toast';
import { MobileNav } from '@/src/components/mobile';
import { DecTopbar } from '@/src/components/dec/DecTopbar';
import { isDecUiEnabled } from '@/lib/flags';

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
    const decUi = isDecUiEnabled();

    return (
        <div className="dashboard-content flex flex-col h-screen overflow-hidden relative bg-background">
            {/* Dec-style topbar, flag-gated. Always at the very top, above dock+content */}
            {decUi && <DecTopbar />}

            <div className="flex flex-1 overflow-hidden relative">
                <CommandBar />
                <CockpitSidebar />
                <div className="flex-1 flex flex-col overflow-hidden relative z-10">
                    {/* Hide UserHeader when Dec topbar is on, avoid double header */}
                    {!decUi && <UserHeader />}
                    <div className="flex-1 overflow-y-auto">{children}</div>
                </div>
                <MobileNav />
            </div>
        </div>
    );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthGate>
            <AgentProvider>
                <ToastProvider>
                    <DashboardLayoutContent>{children}</DashboardLayoutContent>
                </ToastProvider>
            </AgentProvider>
        </AuthGate>
    );
}
