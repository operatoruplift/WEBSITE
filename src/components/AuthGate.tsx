"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function AuthGate({ children }: { children: React.ReactNode }) {
    const [checked, setChecked] = useState(false);
    const [authed, setAuthed] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            setAuthed(true);
        } else {
            router.replace('/login');
        }
        setChecked(true);
    }, [router]);

    if (!checked) {
        return (
            <div className="flex h-screen items-center justify-center" style={{ background: '#050508' }}>
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <span className="text-xs font-mono text-gray-500">Authenticating...</span>
                </div>
            </div>
        );
    }

    if (!authed) return null;

    return <>{children}</>;
}
