"use client";

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Marketing routes use the light palette (PR #309). The dashboard
 * keeps the dark palette. The cookie banner is rendered at root
 * layout so it doesn't sit inside either themed wrapper, which
 * means we route-switch the banner's class set explicitly.
 *
 * /demo/hackathon explicitly stays dark (PR #321) because its design
 * language is dark-first, so it's intentionally NOT in this list. The
 * dark variant of the banner reads correctly there.
 */
const MARKETING_PREFIXES = [
    '/',
    '/blog',
    '/contact',
    '/docs',
    '/press-kit',
    '/pricing',
    '/privacy',
    '/store',
    '/terms',
];

const DARK_DEMO_PATHS = new Set(['/demo/hackathon']);

function isMarketingRoute(pathname: string | null): boolean {
    if (!pathname) return true;
    if (pathname === '/') return true;
    if (DARK_DEMO_PATHS.has(pathname)) return false;
    return MARKETING_PREFIXES.some(p => p !== '/' && pathname.startsWith(p));
}

export function CookieConsent() {
    const [show, setShow] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        const consent = localStorage.getItem('cookie-consent');
        if (!consent) {
            // Delay slightly so it doesn't flash on load
            const timer = setTimeout(() => setShow(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const accept = () => {
        localStorage.setItem('cookie-consent', 'accepted');
        setShow(false);
    };

    const decline = () => {
        localStorage.setItem('cookie-consent', 'declined');
        setShow(false);
        // Disable Google Analytics
        if (typeof window !== 'undefined') {
            // @ts-expect-error, GA opt-out property is not in Window type
            window[`ga-disable-G-9VBF7HTRBJ`] = true;
        }
    };

    if (!show) return null;

    const lightTheme = isMarketingRoute(pathname);

    const cardClass = lightTheme
        ? 'bg-white border border-zinc-200 rounded-xl p-5 shadow-2xl'
        : 'bg-[#0a0a0f] border border-white/10 rounded-xl p-5 shadow-2xl backdrop-blur-xl';
    const copyClass = lightTheme ? 'text-sm text-zinc-700 mb-4' : 'text-sm text-gray-300 mb-4';
    const declineClass = lightTheme
        ? 'flex-1 px-4 py-2 bg-zinc-100 text-zinc-600 text-xs font-bold rounded-lg border border-zinc-200 hover:bg-zinc-200 transition-colors uppercase tracking-wide'
        : 'flex-1 px-4 py-2 bg-white/5 text-gray-400 text-xs font-bold rounded-lg border border-white/10 hover:bg-white/10 transition-colors uppercase tracking-wide';

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-[90] animate-slideInRight">
            <div className={cardClass}>
                <p className={copyClass}>
                    We use cookies and analytics to improve your experience. By continuing, you agree to our{' '}
                    <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.
                </p>
                <div className="flex gap-3">
                    <button onClick={accept} className="flex-1 px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/80 transition-colors uppercase tracking-wide">
                        Accept
                    </button>
                    <button onClick={decline} className={declineClass}>
                        Decline
                    </button>
                </div>
            </div>
        </div>
    );
}
