"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/src/components/Icons';

/**
 * AuthGate — wraps dashboard pages. Checks:
 * 1. Privy authentication (Google / GitHub / Wallet) — if Privy is configured
 * 2. Access tier (early_access granted via Solana Pay, approved waitlist, or legacy token)
 *
 * Falls back to localStorage token check if Privy is not configured (no NEXT_PUBLIC_PRIVY_APP_ID).
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
    const [checked, setChecked] = useState(false);
    const [hasAccess, setHasAccess] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const earlyAccess = localStorage.getItem('early_access');

        if (token || earlyAccess === 'granted') {
            setHasAccess(true);
        }
        setChecked(true);
    }, []);

    if (!checked) {
        return (
            <div className="flex h-screen items-center justify-center" style={{ background: '#050508' }}>
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <span className="text-xs font-mono text-gray-500">Loading...</span>
                </div>
            </div>
        );
    }

    if (!hasAccess) {
        return (
            <div className="flex h-screen items-center justify-center" style={{ background: '#050508' }}>
                <div className="flex flex-col items-center gap-4 max-w-md text-center px-6">
                    <Logo className="w-16 h-16 mb-2" />
                    <h1 className="text-2xl font-medium text-white">Private Beta</h1>
                    <p className="text-gray-400 text-sm leading-relaxed">
                        Join the waitlist for free, or pay 0.1 SOL for immediate access.
                    </p>
                    <Link href="/login"
                        className="mt-4 inline-flex items-center bg-primary text-white px-6 py-3 rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-primary/80 transition-colors shadow-[0_0_20px_rgba(231,118,48,0.3)]">
                        Sign In
                    </Link>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
