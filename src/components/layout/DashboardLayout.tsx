"use client";

import { AgentProvider } from '@/src/components/providers/AgentProvider';
import { AuthGate } from '@/src/components/AuthGate';
import { ToastProvider } from '@/src/components/ui/Toast';

/**
 * DashboardLayout, 2026-05-22 chrome removal.
 *
 * Previously wrapped every dashboard route in a heavy sidebar +
 * topbar shell (CockpitSidebar + UserHeader / DecTopbar +
 * CommandBar + MobileNav). The user flagged the chrome as visually
 * incoherent with the v2 commitment-infrastructure marketing site:
 *
 *   > "the interface for the pages is using the old operator uplift
 *      ui ux like side bar and top bar and looks terrible and should
 *      not be"
 *
 * The mobile-first commitment app will live on iOS + Android when
 * those ship. The web dashboard is a leftover from the AI-assistant
 * product and does not need its own nav scaffolding.
 *
 * This component now keeps only the runtime guarantees:
 *
 *   - AuthGate: gates the dashboard routes behind a verified Privy
 *     session. Auth + paywall behavior is unchanged.
 *   - AgentProvider: dashboard-scoped agent registry.
 *   - ToastProvider: in-page toast surface.
 *
 * Pages can render their own headers, footers, or navigation in
 * their own `page.tsx` if they need one. The retired pages
 * (/chat, /integrations, /swarm, /profile, /security) keep their
 * route-group `layout.tsx` overrides that bypass this wrapper
 * entirely, so AuthGate doesn't fire for them either (they're
 * publicly readable retirement notices).
 */
export function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthGate>
            <AgentProvider>
                <ToastProvider>
                    <div className="dashboard-content min-h-screen bg-background text-foreground">
                        {children}
                    </div>
                </ToastProvider>
            </AgentProvider>
        </AuthGate>
    );
}
