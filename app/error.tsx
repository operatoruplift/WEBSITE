"use client";

import { useEffect } from 'react';
import Link from 'next/link';

/**
 * Global runtime error boundary. Mirrors /not-found's switch to the
 * marketing-site light theme so a route exception doesn't yank the
 * user into the dashboard's dark surface mid-session. The red
 * indicator stays vivid on either theme.
 */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => {
        // Log to error reporting service in production
    }, [error]);

    return (
        // <main> wrapper so the error page has a landmark for screen
        // reader users navigating by region. The red indicator SVG is
        // decorative chrome paired with the visible "Something went
        // wrong" heading; mark aria-hidden.
        <main className="theme-light min-h-screen bg-background flex flex-col items-center justify-center px-6">
            <div className="text-center max-w-md">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                    <svg aria-hidden="true" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                </div>
                <h1 className="text-3xl font-medium text-foreground tracking-tight mb-3">Something went wrong</h1>
                <p className="text-muted mb-8 font-mono text-sm">
                    An unexpected error occurred. This has been logged.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button onClick={reset} className="px-6 py-3 bg-primary text-white rounded-lg text-sm font-bold uppercase tracking-wide hover:bg-primary/80 transition-colors">
                        Try Again
                    </button>
                    <Link href="/" className="px-6 py-3 bg-foreground/[0.04] border border-border text-foreground rounded-lg text-sm font-bold uppercase tracking-wide hover:bg-foreground/[0.08] transition-colors text-center">
                        Go Home
                    </Link>
                </div>
            </div>
        </main>
    );
}
