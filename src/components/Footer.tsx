import React from 'react';
import Link from 'next/link';
import { Logo } from './Icons';

/**
 * Footer, 2026-05-22 v2-canvas refresh.
 *
 * The earlier footer was a large dark-rounded card with corner
 * accents, an oversized logo column, a 3-column nav block, and a
 * Solana "powered by" badge. It pulled visual weight away from the
 * page content and used a different design language than the rest
 * of the v2 site.
 *
 * The v2 design canvas closes with a tight editorial-magazine
 * footer:
 *
 *   - Left: small mark + operator·uplift wordmark + one-line
 *     positioning + "Built in San Francisco, 2026."
 *   - PRODUCT column: Problem · How it works · Market
 *   - COMPANY column: Manifesto · Careers · Press kit
 *   - REACH US column: operatoruplift@gmail.com · @operatoruplift ·
 *     Investor deck
 *   - Bottom rule + small © + version stamp
 *
 * The component reads no APP_CONTENT.footer state because the v2
 * design canvas is the source of truth and the link list is fully
 * static. If a future PR needs A/B copy here, lift the lists back
 * out into dataService.ts.
 */
const Footer: React.FC = () => {
    return (
        <footer
            className="relative w-full border-t border-foreground/[0.07] bg-background"
            style={{ padding: 'clamp(56px, 8vw, 96px) 24px 40px' }}
        >
            <div className="max-w-[1200px] mx-auto">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-14">
                    {/* Brand column. */}
                    <div className="col-span-2 max-w-[360px]">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2.5 hover:opacity-90 transition-opacity"
                            aria-label="Operator Uplift home"
                        >
                            <Logo className="w-7 h-7" />
                            <span className="inline-flex items-baseline font-mono text-sm tracking-[0.02em] text-foreground">
                                operator
                                <span className="text-primary px-[2px]">·</span>
                                uplift
                            </span>
                        </Link>
                        <p className="mt-5 text-foreground/65 leading-relaxed text-[14px]">
                            Commitment infrastructure for people who actually ship. Built in San Francisco, 2026.
                        </p>
                    </div>

                    {/* PRODUCT column. */}
                    <nav aria-label="Product" className="flex flex-col gap-3">
                        <h4 className="font-mono text-[10px] tracking-[0.2em] text-muted/80 uppercase mb-1">
                            Product
                        </h4>
                        <FooterLink href="/#problem" label="Problem" />
                        <FooterLink href="/#how-it-works" label="How it works" />
                        <FooterLink href="/#market" label="Market" />
                        <FooterLink href="/pricing" label="Pricing" />
                        <FooterLink href="/docs" label="Docs" />
                    </nav>

                    {/* COMPANY column. */}
                    <nav aria-label="Company" className="flex flex-col gap-3">
                        <h4 className="font-mono text-[10px] tracking-[0.2em] text-muted/80 uppercase mb-1">
                            Company
                        </h4>
                        <FooterLink href="/blog" label="Blog" />
                        <FooterLink href="/press-kit" label="Press kit" />
                        <FooterLink href="/contact" label="Contact" />
                        <FooterLink href="https://github.com/operatoruplift" external label="Open source" />
                    </nav>
                </div>

                {/* REACH US row spans full width so emails + handles read
                    in a single line on desktop. */}
                <div className="mt-12 md:mt-16 pt-8 border-t border-foreground/[0.06] grid grid-cols-1 md:grid-cols-4 gap-6 items-baseline">
                    <h4 className="font-mono text-[10px] tracking-[0.2em] text-muted/80 uppercase">
                        Reach us
                    </h4>
                    <div className="md:col-span-3 flex flex-wrap gap-x-8 gap-y-3">
                        <FooterLink href="mailto:operatoruplift@gmail.com" label="operatoruplift@gmail.com" />
                        <FooterLink href="https://x.com/OperatorUplift" external label="@operatoruplift" />
                        <FooterLink href="https://www.linkedin.com/company/operatoruplift" external label="LinkedIn" />
                        <FooterLink href="/press-kit" label="Investor deck" />
                    </div>
                </div>

                {/* Closing rule + copyright + version stamp. */}
                <div className="mt-12 pt-6 border-t border-foreground/[0.06] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-[12px] text-muted/70 font-mono tracking-wide">
                    <div>© 2026 Operator Uplift, Inc.</div>
                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                        <Link href="/privacy" className="hover:text-foreground transition-colors">
                            Privacy
                        </Link>
                        <Link href="/terms" className="hover:text-foreground transition-colors">
                            Terms
                        </Link>
                        <span className="text-muted/50">V.01 · COMMITMENT INFRASTRUCTURE</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

function FooterLink({
    href,
    label,
    external = false,
}: {
    href: string;
    label: string;
    external?: boolean;
}) {
    const className = 'text-[14px] text-foreground/70 hover:text-foreground transition-colors';
    if (external) {
        return (
            <a href={href} target="_blank" rel="noreferrer" className={className}>
                {label}
                <span className="sr-only"> (opens in new tab)</span>
            </a>
        );
    }
    return (
        <Link href={href} className={className}>
            {label}
        </Link>
    );
}

export default Footer;
