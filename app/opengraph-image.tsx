import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Operator Uplift. Keep your word. Bet on yourself. Commitment infrastructure.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * Open Graph image, v10 reframe.
 *
 * Previous version stacked a left text column + right "commitment card"
 * mockup with fake handle, day counters, streak bars, and a CTA pill.
 * At iMessage / Discord / Twitter preview sizes (~200x100, the card on
 * the right collapsed into unreadable mush, and the eyebrow `//
 * Commitment Infrastructure` dev-jargon prefix did not survive
 * downscaling either.
 *
 * v10 OG is single-column, mega-headline first, supporting copy second.
 * Reads at any preview size:
 *   - 1200x630 social cards: clean and confident
 *   - 200x100 iMessage previews: the headline + brand still parse
 *   - LinkedIn 1200x627 cards: same
 *
 * The four-step protocol sits at the bottom as a horizontal step strip
 * so the visual reinforces the deck story (DECLARE / STAKE / HONOR /
 * WATCH) without overloading the card.
 */
export default async function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: '#FAFAF9',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    padding: '72px 80px',
                    justifyContent: 'space-between',
                }}
            >
                {/* Top bar: logo + wordmark */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 18,
                    }}
                >
                    <div
                        style={{
                            width: 56,
                            height: 56,
                            background: '#F97316',
                            borderRadius: 12,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 900,
                            fontSize: 26,
                            letterSpacing: -1,
                            boxShadow: '0 8px 24px rgba(249, 115, 22, 0.25)',
                        }}
                    >
                        OU
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        <div
                            style={{
                                color: '#0A0A0A',
                                fontSize: 22,
                                fontWeight: 700,
                                letterSpacing: -0.4,
                                display: 'flex',
                            }}
                        >
                            Operator Uplift
                        </div>
                        <div
                            style={{
                                color: '#737373',
                                fontSize: 14,
                                fontWeight: 600,
                                letterSpacing: 2.5,
                                textTransform: 'uppercase',
                                fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
                                marginTop: 2,
                                display: 'flex',
                            }}
                        >
                            Commitment Infrastructure
                        </div>
                    </div>
                </div>

                {/* Mega headline + subhead. Centered vertically by the
                    parent's space-between layout. */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <div
                        style={{
                            color: '#0A0A0A',
                            fontSize: 108,
                            fontWeight: 800,
                            letterSpacing: -5,
                            lineHeight: 0.95,
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        <div style={{ display: 'flex' }}>Keep your word.</div>
                        <div style={{ display: 'flex', color: '#F97316' }}>Bet on yourself.</div>
                    </div>
                    <div
                        style={{
                            color: '#525252',
                            fontSize: 24,
                            fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
                            lineHeight: 1.4,
                            marginTop: 28,
                            maxWidth: 920,
                            display: 'flex',
                        }}
                    >
                        Stake real money on what you say you&apos;ll do. An AI Game Master adjudicates every check-in. We don&apos;t sell motivation. We sell consequences.
                    </div>
                </div>

                {/* Four-step protocol strip. Horizontal pills with
                    arrows between so the deck story reads at a glance. */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
                    }}
                >
                    {['DECLARE', 'STAKE', 'HONOR', 'WATCH'].map((step, i) => (
                        <div
                            key={step}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                            }}
                        >
                            <div
                                style={{
                                    padding: '12px 22px',
                                    background: i === 0 ? '#F97316' : 'transparent',
                                    color: i === 0 ? 'white' : '#0A0A0A',
                                    border: i === 0 ? 'none' : '1.5px solid #D4D4D4',
                                    borderRadius: 999,
                                    fontSize: 18,
                                    fontWeight: 700,
                                    letterSpacing: 3,
                                    display: 'flex',
                                }}
                            >
                                {step}
                            </div>
                            {i < 3 && (
                                <div
                                    style={{
                                        color: '#A3A3A3',
                                        fontSize: 22,
                                        fontWeight: 700,
                                        display: 'flex',
                                    }}
                                >
                                    →
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        ),
        { ...size },
    );
}
