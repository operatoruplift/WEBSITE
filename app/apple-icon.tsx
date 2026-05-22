import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

/**
 * Apple touch icon (180x180). 2026-05-22 brand-mark refresh.
 *
 * Same hexagon-with-sparkle silhouette as app/icon.tsx, sized for
 * iOS home-screen + Safari pinned tab. The rounded corners come
 * for free from iOS itself, so we ship a flat-edge dark plate
 * with the brand mark centered.
 */
export default function AppleIcon() {
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
                <svg viewBox="0 0 180 180" width="180" height="180">
                    <polygon
                        points="90,18 158,52 158,128 90,162 22,128 22,52"
                        fill="#F08A4C"
                    />
                    <path
                        d="M90 48 L99 84 L135 90 L99 96 L90 132 L81 96 L45 90 L81 84 Z"
                        fill="#0A0A0B"
                    />
                </svg>
            </div>
        ),
        { ...size },
    );
}
