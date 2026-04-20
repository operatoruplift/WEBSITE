'use client';

import React from 'react';
import Link from 'next/link';
import { Logo } from '@/src/components/Icons';

/**
 * Dec-style topbar, h-8 strip matching the Electron WindowNavbar.
 * Only rendered when NEXT_PUBLIC_DEC_UI=1.
 *
 * Reference: docs/DEC_DMG_SNAPSHOT/nav-flow.md + screens/chat.md
 */
export function DecTopbar() {
    return (
        <div className="flex z-10 relative items-center justify-between h-8 bg-[#0A0A0A] border-b border-[#222222] px-3 gap-2 shrink-0">
            <div className="flex items-center gap-2">
                <Link href="/chat" className="flex items-center gap-2" aria-label="Home">
                    <Logo className="w-4 h-4" />
                    <span className="text-[11px] font-semibold text-[#FAFAFA]/80 tracking-tight">
                        Operator Uplift
                    </span>
                </Link>
                {/* StatusChip-equivalent, live indicator */}
                <span className="inline-flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-[9px] font-semibold uppercase tracking-wider text-emerald-500">
                    <span className="w-1 h-1 rounded-full bg-emerald-500" />
                    Live
                </span>
            </div>
            <div className="flex items-center gap-2">
                <span className="hidden md:inline text-[9px] font-mono text-[#A1A1AA]/60 tracking-wider">
                    ⌘K
                </span>
            </div>
        </div>
    );
}
