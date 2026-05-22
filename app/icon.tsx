import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

/**
 * Browser favicon (32x32). 2026-05-22 brand-mark refresh.
 *
 * Stylized version of the real operator-uplift hexagon mark
 * (the peach-orange hex with a 4-point sparkle) that ships as
 * /brand/operator-uplift-mark.png. Drawn here via inline SVG so
 * the favicon stays vector-sharp at any DPR. The mark is a
 * single hexagon with a four-point sparkle cut-out, matching
 * the branding kit's primary logo silhouette.
 */
export default function Icon() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#0A0A0B',
                }}
            >
                <svg viewBox="0 0 32 32" width="32" height="32">
                    {/* Hexagon body, peach orange. */}
                    <polygon
                        points="16,2 28.5,9 28.5,23 16,30 3.5,23 3.5,9"
                        fill="#F08A4C"
                    />
                    {/* Four-point sparkle in the centre, knocked out in the
                        background colour so it reads as negative space. */}
                    <path
                        d="M16 8 L17.6 14.4 L24 16 L17.6 17.6 L16 24 L14.4 17.6 L8 16 L14.4 14.4 Z"
                        fill="#0A0A0B"
                    />
                </svg>
            </div>
        ),
        { ...size },
    );
}
