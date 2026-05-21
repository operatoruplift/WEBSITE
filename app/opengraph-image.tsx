import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Operator Uplift, commitment infrastructure. Keep your word. Bet on yourself. Declare. Stake. Honor. Watch.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'row',
                    backgroundColor: '#FAFAF9',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                }}
            >
                {/* Left column: brand + headline + subhead */}
                <div
                    style={{
                        flex: '1 1 58%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        padding: '0 30px 0 64px',
                    }}
                >
                    {/* Logo */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            marginBottom: 36,
                        }}
                    >
                        <div
                            style={{
                                width: 56,
                                height: 56,
                                background: '#F97316',
                                borderRadius: 10,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: 900,
                                fontSize: 24,
                                letterSpacing: -1,
                                boxShadow: '0 8px 24px rgba(249, 115, 22, 0.25)',
                            }}
                        >
                            OU
                        </div>
                    </div>

                    {/* Commitment Infrastructure eyebrow */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            marginBottom: 28,
                        }}
                    >
                        <div style={{ display: 'flex', width: 10, height: 10, borderRadius: 5, background: '#F97316' }} />
                        <div
                            style={{
                                color: '#737373',
                                fontSize: 14,
                                fontWeight: 700,
                                letterSpacing: 3,
                                textTransform: 'uppercase',
                                fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
                            }}
                        >
                            // Commitment Infrastructure
                        </div>
                    </div>

                    {/* Headline */}
                    <div
                        style={{
                            color: '#0A0A0A',
                            fontSize: 78,
                            fontWeight: 800,
                            letterSpacing: -3.5,
                            lineHeight: 0.95,
                            marginBottom: 30,
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        <div style={{ display: 'flex' }}>Keep your word.</div>
                        <div style={{ display: 'flex', color: '#F97316' }}>Bet on yourself.</div>
                    </div>

                    {/* Subhead */}
                    <div
                        style={{
                            color: '#525252',
                            fontSize: 20,
                            fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
                            lineHeight: 1.45,
                            maxWidth: 540,
                            display: 'flex',
                        }}
                    >
                        Declare a commitment. Stake real money on it. An AI Game Master adjudicates every check-in. We don&apos;t sell motivation. We sell consequences.
                    </div>
                </div>

                {/* Right column: iMessage-style approval card */}
                <div
                    style={{
                        flex: '1 1 42%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 64px 0 16px',
                    }}
                >
                    <div
                        style={{
                            width: 400,
                            background: 'white',
                            borderRadius: 22,
                            boxShadow: '0 30px 60px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04)',
                            padding: 24,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 10,
                        }}
                    >
                        {/* Card header */}
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 6,
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ display: 'flex', width: 10, height: 10, borderRadius: 5, background: '#22C55E' }} />
                                <div
                                    style={{
                                        fontSize: 12,
                                        fontWeight: 700,
                                        letterSpacing: 2,
                                        color: '#525252',
                                        fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
                                    }}
                                >
                                    ON TRACK
                                </div>
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#737373', display: 'flex' }}>Day 14 of 60</div>
                        </div>

                        {/* Commitment title */}
                        <div
                            style={{
                                fontSize: 22,
                                fontWeight: 700,
                                color: '#0A0A0A',
                                letterSpacing: -0.5,
                                marginTop: 4,
                                display: 'flex',
                            }}
                        >
                            Run 4× this week
                        </div>

                        {/* Stake row */}
                        <div
                            style={{
                                fontSize: 13,
                                color: '#525252',
                                marginTop: 2,
                                display: 'flex',
                                gap: 8,
                                fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
                            }}
                        >
                            <span style={{ color: '#F97316', display: 'flex' }}>$50</span>
                            <span style={{ display: 'flex' }}>→ @maya</span>
                            <span style={{ color: '#A3A3A3', display: 'flex' }}>·</span>
                            <span style={{ display: 'flex' }}>witness</span>
                        </div>

                        {/* Streak bars */}
                        <div style={{ display: 'flex', gap: 3, marginTop: 12 }}>
                            {Array.from({ length: 14 }).map((_, i) => (
                                <div key={i} style={{ display: 'flex', flex: 1, height: 20, background: '#F97316', opacity: 0.85 - (13 - i) * 0.04 }} />
                            ))}
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={'n' + i} style={{ display: 'flex', flex: 1, height: 20, border: '1px solid #E5E5E5', background: 'transparent' }} />
                            ))}
                        </div>

                        {/* Streak count line */}
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginTop: 6,
                                fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
                                fontSize: 10,
                                color: '#A3A3A3',
                                letterSpacing: 1,
                            }}
                        >
                            <div style={{ display: 'flex' }}>20 DAYS AGO</div>
                            <div style={{ display: 'flex', color: '#F97316' }}>14 HONORED</div>
                        </div>

                        {/* CHECK IN pill */}
                        <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 14 }}>
                            <div
                                style={{
                                    padding: '8px 14px',
                                    background: '#F97316',
                                    color: 'white',
                                    fontSize: 11,
                                    fontWeight: 700,
                                    letterSpacing: 2,
                                    textTransform: 'uppercase',
                                    fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
                                    display: 'flex',
                                }}
                            >
                                Check in today →
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        ),
        { ...size },
    );
}
