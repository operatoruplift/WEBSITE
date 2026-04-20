'use client';

import React from 'react';
import { isDecUiEnabled } from '@/lib/flags';

/**
 * Page container that renders with Dec rhythm when DEC_UI is on,
 * or passes through children unchanged when the flag is off.
 *
 * Dec spec (from docs/DEC_DMG_SNAPSHOT/ui-inventory.md):
 *   max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4
 *   + `page-fade` animation on mount
 *
 * Usage:
 *   <PageContainer>
 *     {children}
 *   </PageContainer>
 *
 * When the flag is off, this renders children in a plain div,
 * existing pages keep their current spacing.
 */
export function PageContainer({
    children,
    className = '',
}: {
    children: React.ReactNode;
    className?: string;
}) {
    if (!isDecUiEnabled()) {
        // Pass-through, no layout injection when flag is off
        return <>{children}</>;
    }

    return (
        <div className={`page-fade-dec max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4 ${className}`}>
            {children}
        </div>
    );
}
