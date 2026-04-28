/**
 * Download URLs for the Operator Uplift desktop companions.
 *
 * Source of truth for which installer each OS gets. Configurable via
 * NEXT_PUBLIC_DOWNLOAD_* env vars so a hotfix release does not require
 * a code change — rotating a URL is a Vercel env edit + redeploy.
 *
 * The fallback URLs point at the public releases bucket. When the
 * bucket is empty (pre-launch), the CTA links to /login with the
 * returnTo query param set, so the user is not left on a 404.
 *
 * Keep the detection logic tight: prefer the high-entropy
 * navigator.userAgentData when it is available (Chromium-only), fall
 * back to navigator.userAgent regex for Safari/Firefox. No UA-sniffing
 * for feature detection — only for picking a sensible default.
 */

export type OSKey = 'macos' | 'windows' | 'linux';

export interface DownloadOption {
    os: OSKey;
    label: string;
    fileSuffix: string;
    url: string;
    ctaLabel: string;
    /**
     * True when this option is in the pre-launch state, the CTA points
     * at /login instead of an actual installer because the
     * NEXT_PUBLIC_DOWNLOAD_<OS> env var is unset. Components can use
     * this to switch the button text from "Download" to a
     * roadmap-honest label like "Get early access".
     */
    isPreLaunch: boolean;
}

const fallbackUrl = (os: OSKey): string => {
    // Pre-launch fallback: route to /login so the user lands somewhere
    // actionable instead of a 404 if the installer URL is not set yet.
    return `/login?returnTo=/download&os=${os}`;
};

function env(name: string): string | undefined {
    const v = typeof process !== 'undefined' ? process.env?.[name] : undefined;
    return v && v.length > 0 ? v : undefined;
}

/**
 * Resolves a configured URL or the pre-launch fallback. Each env var
 * is prefixed with NEXT_PUBLIC_ so it inlines into the client bundle.
 *
 * When the env var is unset, isPreLaunch is true and the ctaLabel
 * becomes "Get early access for X" so the button text matches what
 * actually happens on click (a sign-in flow, not a binary download).
 * Once NEXT_PUBLIC_DOWNLOAD_<OS> is set in Vercel and a real installer
 * URL is in place, isPreLaunch flips to false and the ctaLabel reads
 * "Download for X" again.
 */
export function downloadOptions(): DownloadOption[] {
    const macUrl = env('NEXT_PUBLIC_DOWNLOAD_MACOS');
    const winUrl = env('NEXT_PUBLIC_DOWNLOAD_WINDOWS');
    const linUrl = env('NEXT_PUBLIC_DOWNLOAD_LINUX');
    return [
        {
            os: 'macos',
            label: 'macOS',
            fileSuffix: '.dmg',
            url: macUrl || fallbackUrl('macos'),
            ctaLabel: macUrl ? 'Download for Mac' : 'Get early access for Mac',
            isPreLaunch: !macUrl,
        },
        {
            os: 'windows',
            label: 'Windows',
            fileSuffix: '.exe',
            url: winUrl || fallbackUrl('windows'),
            ctaLabel: winUrl ? 'Download for Windows' : 'Get early access for Windows',
            isPreLaunch: !winUrl,
        },
        {
            os: 'linux',
            label: 'Linux',
            fileSuffix: '.AppImage',
            url: linUrl || fallbackUrl('linux'),
            ctaLabel: linUrl ? 'Download for Linux' : 'Get early access for Linux',
            isPreLaunch: !linUrl,
        },
    ];
}

/**
 * Pick a sensible default OS for the first render.
 *
 * Prefer the high-entropy navigator.userAgentData.platform when it is
 * available (Chromium 90+). Fall back to a regex match on the classic
 * userAgent string for Safari, Firefox, and older Chromium. Default to
 * macOS when we can't tell, since that's the platform we ship first.
 */
export function detectOS(): OSKey {
    if (typeof navigator === 'undefined') return 'macos';

    type NavigatorWithUAData = Navigator & {
        userAgentData?: { platform?: string };
    };
    const nav = navigator as NavigatorWithUAData;
    const hi = nav.userAgentData?.platform?.toLowerCase();
    if (hi) {
        if (hi.includes('mac')) return 'macos';
        if (hi.includes('win')) return 'windows';
        if (hi.includes('linux')) return 'linux';
    }

    const ua = (navigator.userAgent || '').toLowerCase();
    if (ua.includes('mac os') || ua.includes('macintosh')) return 'macos';
    if (ua.includes('windows')) return 'windows';
    if (ua.includes('linux') || ua.includes('x11')) return 'linux';

    return 'macos';
}

export function optionFor(os: OSKey): DownloadOption {
    const opt = downloadOptions().find(o => o.os === os);
    if (!opt) throw new Error(`unknown OS: ${os}`);
    return opt;
}
