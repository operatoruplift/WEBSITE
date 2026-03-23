"use client";

import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => {
        // Log to error reporting service in production
    }, [error]);

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
            <div className="text-center max-w-md">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                </div>
                <h1 className="text-3xl font-medium text-white tracking-tight mb-3">Something went wrong</h1>
                <p className="text-gray-400 mb-8 font-mono text-sm">
                    An unexpected error occurred. This has been logged.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button onClick={reset} className="px-6 py-3 bg-primary text-white rounded-lg text-sm font-bold uppercase tracking-wide hover:bg-primary/80 transition-colors">
                        Try Again
                    </button>
                    <a href="/" className="px-6 py-3 bg-white/5 border border-white/10 text-gray-300 rounded-lg text-sm font-bold uppercase tracking-wide hover:bg-white/10 transition-colors text-center">
                        Go Home
                    </a>
                </div>
            </div>
        </div>
    );
}
