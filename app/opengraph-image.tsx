import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Operator Uplift. Keep your word. Bet on yourself. Commitment infrastructure.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * Open Graph image, v2 design canvas refresh (2026-05-22).
 *
 * Mirrors the OGCard board from the founder's v2 design canvas
 * (/tmp/disrupt-onboarding-v2/index.html, lines 296-321):
 *
 *   - dark bg with a square-grid masked backdrop
 *   - soft accent radial in top-right
 *   - brand row: OU logo + operator·uplift wordmark with accent "·"
 *   - centered headline area: COMMITMENT INFRASTRUCTURE eyebrow +
 *     "Keep your word. / Bet on yourself." (second line in accent)
 *   - footer row: operatoruplift.com + iOS · ANDROID · WEB
 *
 * Earlier version (PR #670) carried a 4-step protocol pill strip at
 * the bottom; v2 dropped that for simplicity. The new layout reads
 * at any preview size (iMessage, Slack, LinkedIn, Twitter).
 */
export default async function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    background: '#0A0A0B',
                    color: '#F4F4F5',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    padding: '64px 72px',
                    boxSizing: 'border-box',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {/* Square-grid backdrop with elliptical mask. */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        pointerEvents: 'none',
                        backgroundImage:
                            'linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)',
                        backgroundSize: '48px 48px',
                        maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, #000, transparent)',
                    }}
                />
                {/* Soft accent radial in the top-right. */}
                <div
                    style={{
                        position: 'absolute',
                        top: '-30%',
                        right: '-20%',
                        width: 700,
                        height: 700,
                        background: 'radial-gradient(circle, rgba(240, 138, 76, 0.20), transparent 60%)',
                        pointerEvents: 'none',
                    }}
                />

                {/* Brand row: OU logo block + wordmark with accent "·". */}
                <div
                    style={{
                        position: 'relative',
                        zIndex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                    }}
                >
                    <div
                        style={{
                            width: 44,
                            height: 44,
                            background: '#F08A4C',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#0A0A0B',
                            fontWeight: 900,
                            fontSize: 20,
                            letterSpacing: -0.5,
                        }}
                    >
                        OU
                    </div>
                    <div
                        style={{
                            fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
                            fontSize: 18,
                            letterSpacing: '0.04em',
                            color: '#F4F4F5',
                            display: 'flex',
                        }}
                    >
                        operator<span style={{ color: '#F08A4C', display: 'flex' }}>·</span>uplift
                    </div>
                </div>

                {/* Centered headline. flex: 1 fills the space between
                    brand row and footer row, centered vertically. */}
                <div
                    style={{
                        position: 'relative',
                        zIndex: 1,
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                    }}
                >
                    <div
                        style={{
                            fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
                            fontSize: 16,
                            color: '#F08A4C',
                            letterSpacing: '0.14em',
                            marginBottom: 22,
                            display: 'flex',
                        }}
                    >
                        // COMMITMENT INFRASTRUCTURE
                    </div>
                    <div
                        style={{
                            fontSize: 96,
                            fontWeight: 500,
                            letterSpacing: '-0.045em',
                            lineHeight: 0.93,
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        <div style={{ display: 'flex' }}>Keep your word.</div>
                        <div style={{ display: 'flex', color: '#F08A4C' }}>Bet on yourself.</div>
                    </div>
                </div>

                {/* Footer row: domain + platforms in mono. */}
                <div
                    style={{
                        position: 'relative',
                        zIndex: 1,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                        fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
                        fontSize: 17,
                        color: '#71717A',
                        letterSpacing: '0.06em',
                    }}
                >
                    <div style={{ display: 'flex' }}>OPERATORUPLIFT.COM</div>
                    <div style={{ display: 'flex', color: '#D4D4D8' }}>iOS · ANDROID · WEB · COMING SOON</div>
                </div>
            </div>
        ),
        { ...size },
    );
}
