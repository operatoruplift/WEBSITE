"use client";

import { useEffect, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/src/components/Icons';
import { isGatedRoute, isFreeRoute } from '@/lib/subscription';

type SubTier = 'free' | 'pro' | 'enterprise';

/**
 * Routes reachable without auth. Anonymous visitors see these in Demo mode
 * (simulated tool calls, canned chat responses, no Supabase writes). The
 * page itself is responsible for fetching /api/capabilities and rendering
 * the correct Demo/Real badge.
 */
const AUTH_OPTIONAL_ROUTES = ['/chat'];

function isAuthOptional(pathname: string | null): boolean {
    if (!pathname) return false;
    return AUTH_OPTIONAL_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'));
}

export function AuthGate({ children }: { children: React.ReactNode }) {
    const [checked, setChecked] = useState(false);
    const [hasAccess, setHasAccess] = useState(false);
    const [subTier, setSubTier] = useState<SubTier>('free');
    const pathname = usePathname();
    const router = useRouter();
    const authOptional = isAuthOptional(pathname);

    const checkSession = useCallback(() => {
        const token = localStorage.getItem('token');
        const earlyAccess = localStorage.getItem('early_access');
        return !!(token || earlyAccess === 'granted');
    }, []);

    useEffect(() => {
        // Auth-optional routes (e.g., /chat) render in Demo mode when
        // unauthenticated. Skip the gate entirely, the page decides
        // what to show based on /api/capabilities.
        if (authOptional) {
            setChecked(true);
            setHasAccess(true);
            return;
        }

        const isAuthed = checkSession();
        if (!isAuthed) {
            setChecked(true);
            setHasAccess(false);
            return;
        }

        // Check subscription status server-side
        const token = localStorage.getItem('token');
        const cachedTier = localStorage.getItem('subscription_tier') as SubTier | null;

        // Use cached tier immediately for fast render, then verify
        if (cachedTier === 'pro' || cachedTier === 'enterprise') {
            setHasAccess(true);
            setSubTier(cachedTier);
            setChecked(true);
        }

        fetch('/api/subscription', {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
            .then(r => r.json())
            .then(data => {
                const tier = (data.tier || 'free') as SubTier;
                const active = data.active === true;

                localStorage.setItem('subscription_tier', tier);
                setSubTier(tier);

                if (active) {
                    setHasAccess(true);
                } else if (isFreeRoute(pathname || '')) {
                    // Free routes accessible without subscription
                    setHasAccess(true);
                } else if (isGatedRoute(pathname || '')) {
                    // Gated route without subscription → paywall
                    router.replace('/paywall');
                    return;
                } else {
                    setHasAccess(true);
                }

                setChecked(true);
            })
            .catch(() => {
                // API unreachable, allow access (dev mode / offline)
                setHasAccess(true);
                setChecked(true);
            });

        // Storage event listener
        const onStorage = (e: StorageEvent) => {
            if (e.key === 'token' || e.key === 'early_access') {
                if (!checkSession()) setHasAccess(false);
            }
        };
        window.addEventListener('storage', onStorage);

        return () => window.removeEventListener('storage', onStorage);
    }, [authOptional, checkSession, pathname, router]);

    if (!checked) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#0A0A0A]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-[#F97316]/30 border-t-[#F97316] rounded-full animate-spin" />
                    <span className="text-xs font-mono text-[#52525B]">Loading...</span>
                </div>
            </div>
        );
    }

    if (!hasAccess) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#0A0A0A]">
                <div className="flex flex-col items-center gap-4 max-w-md text-center px-6">
                    <Logo className="w-16 h-16 mb-2" />
                    <h1 className="text-2xl font-medium text-white">Private Beta</h1>
                    <p className="text-[#A1A1AA] text-sm leading-relaxed">
                        Get Pro for $19/mo or join the waitlist for free.
                    </p>
                    <div className="flex gap-3 mt-4">
                        <Link href="/paywall"
                            className="inline-flex items-center bg-[#F97316] text-white px-6 py-3 rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-[#F97316]/80 transition-colors shadow-[0_0_20px_rgba(249,115,22,0.3)]">
                            Get Access
                        </Link>
                        <Link href="/login"
                            className="inline-flex items-center bg-[#FAFAFA]/5 text-white px-6 py-3 rounded-lg text-sm font-medium border border-[#222222] hover:bg-[#FAFAFA]/10 transition-colors">
                            Sign In
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
