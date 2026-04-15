import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

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
          background: 'linear-gradient(135deg, #F97316, #F59E0B)',
          borderRadius: 6,
        }}
      >
        <div style={{ color: 'white', fontSize: 18, fontWeight: 900 }}>⬡</div>
      </div>
    ),
    { ...size }
  );
}
