"use client";

import { AgentProvider } from '@/src/components/providers/AgentProvider';
import { AuthGate } from '@/src/components/AuthGate';
import { CockpitSidebar } from '@/src/components/cockpit/CockpitSidebar';
import { NebulaBackground, ParticleBackground } from '@/src/components/effects/CinematicBackgrounds';
import { CommandBar } from '@/src/components/ui/CommandBar';
import { UserHeader } from '@/src/components/ui/UserHeader';
import { ToastProvider } from '@/src/components/ui/Toast';
import { MobileNav } from '@/src/components/mobile';

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
    return (
        <div className="dashboard-content flex h-screen overflow-hidden relative bg-background" style={{ fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
            <NebulaBackground />
            <ParticleBackground particleCount={20} colors={['#F97316', '#F97316', '#FFEDD5']} speed={0.15} interactive={false} />
            <CommandBar />
            <CockpitSidebar />
            <div className="flex-1 flex flex-col overflow-hidden relative z-10">
                <UserHeader />
                <div className="flex-1 overflow-y-auto">{children}</div>
            </div>
            <MobileNav />
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
