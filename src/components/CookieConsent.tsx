"use client";

import { useState, useEffect } from 'react';

export function CookieConsent() {
    const [show, setShow] = useState(false);

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
            // @ts-expect-error — GA opt-out property is not in Window type
            window[`ga-disable-G-9VBF7HTRBJ`] = true;
        }
    };

    if (!show) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-[90] animate-slideInRight">
            <div className="bg-[#0a0a0f] border border-white/10 rounded-xl p-5 shadow-2xl backdrop-blur-xl">
                <p className="text-sm text-gray-300 mb-4">
                    We use cookies and analytics to improve your experience. By continuing, you agree to our{' '}
                    <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.
                </p>
                <div className="flex gap-3">
                    <button onClick={accept} className="flex-1 px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/80 transition-colors uppercase tracking-wide">
                        Accept
                    </button>
                    <button onClick={decline} className="flex-1 px-4 py-2 bg-white/5 text-gray-400 text-xs font-bold rounded-lg border border-white/10 hover:bg-white/10 transition-colors uppercase tracking-wide">
                        Decline
                    </button>
                </div>
            </div>
        </div>
    );
}
