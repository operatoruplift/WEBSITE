'use client';

import Navbar from '@/src/components/Navbar';
import Footer from '@/src/components/Footer';
import RetiredSurface from '@/src/components/RetiredSurface';

/**
 * /imessage marketing landing page, 2026-05-22 retirement.
 *
 * The page used to pitch the iMessage agent as a standalone check-in
 * channel for the prior AI-assistant product. The /integrations
 * dashboard that hosted the connection flow was retired in PR #696;
 * the iMessage channel + Photon transport are no longer on the
 * commitment-infrastructure happy path.
 *
 * The route stays alive so external links never 404 and renders a
 * polite retired-surface card. The mobile apps (iOS + Android, coming
 * soon) will be the primary check-in surface; until then, the
 * waitlist captures interest.
 */
export default function IMessagePage() {
    return (
        <div className="relative w-full bg-background min-h-screen text-foreground">
            {/* Page-level dot grid + warm radial. Was missing on this
                route while every other public page mounts it, so
                /imessage rendered as a flat bg-background slab. */}
            <div className="bg-grid-dots" aria-hidden="true" />
            <Navbar currentPage="imessage" />
            <main id="main" className="relative z-10">
                <RetiredSurface
                    title="The iMessage check-in surface is retired."
                    body="Operator Uplift used to pitch iMessage as the daily check-in channel for the AI-assistant product. That product was retired on 2026-05-22 in favour of the commitment-infrastructure brand. The new product is mobile-first; the iOS and Android apps will be the primary check-in surface when they ship. Join the waitlist for early access."
                    relatedLabel="See how it works"
                    relatedHref="/#how-it-works"
                />
            </main>
            <Footer />
        </div>
    );
}
