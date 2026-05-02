import Link from 'next/link';

/**
 * Global 404. Uses the marketing-site light theme so users who type
 * a wrong URL land on a page that matches the rest of the public
 * surface (homepage, /docs, /pricing, /blog), not the dashboard's
 * dark dashboard chrome they may never have seen before.
 *
 * The decorative giant "404" uses `text-foreground/[0.04]` instead
 * of `text-white/[0.03]` so it follows the theme token: a faint
 * dark watermark on light, faint white watermark on dark. Plain
 * `text-white/[0.03]` is not in the .theme-light override list and
 * would render as 3% white on a near-white surface, invisible.
 */
export default function NotFound() {
    return (
        <div className="theme-light min-h-screen bg-background flex flex-col items-center justify-center px-6">
            <div className="text-center max-w-md">
                <div className="text-[120px] font-black leading-none text-foreground/[0.04] select-none">404</div>
                <h1 className="text-4xl font-medium text-foreground tracking-tight -mt-16 mb-4">Page Not Found</h1>
                <p className="text-muted mb-8 font-mono text-sm">
                    The route you requested doesn&apos;t exist or has been moved.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link href="/" className="px-6 py-3 bg-primary text-white rounded-lg text-sm font-bold uppercase tracking-wide hover:bg-primary/80 transition-colors text-center">
                        Go Home
                    </Link>
                    <Link href="/contact" className="px-6 py-3 bg-foreground/[0.04] border border-border text-foreground rounded-lg text-sm font-bold uppercase tracking-wide hover:bg-foreground/[0.08] transition-colors text-center">
                        Contact Us
                    </Link>
                </div>
                <div className="mt-12 flex items-center justify-center gap-2 text-[10px] font-mono text-muted uppercase tracking-widest">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                    Operator Uplift
                </div>
            </div>
        </div>
    );
}
