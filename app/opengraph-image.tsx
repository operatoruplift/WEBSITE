import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Operator Uplift - Local-First AI OS';
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
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#050508',
          backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(231, 118, 48, 0.08) 0%, transparent 60%)',
        }}
      >
        {/* Top border accent */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: 'linear-gradient(to right, transparent, #E77630, transparent)',
          }}
        />

        {/* Logo area */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #E77630, #F59E0B)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 40px rgba(231, 118, 48, 0.4)',
            }}
          >
            <div style={{ color: 'white', fontSize: 32, fontWeight: 900 }}>⬡</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ color: 'white', fontSize: 42, fontWeight: 700, letterSpacing: -1 }}>
              Operator Uplift
            </div>
          </div>
        </div>

        {/* Tagline */}
        <div
          style={{
            color: 'white',
            fontSize: 56,
            fontWeight: 700,
            textAlign: 'center',
            letterSpacing: -2,
            lineHeight: 1.1,
            marginBottom: 20,
          }}
        >
          Your Life, Automated.
        </div>

        {/* Description */}
        <div
          style={{
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: 24,
            textAlign: 'center',
            maxWidth: 700,
            lineHeight: 1.4,
          }}
        >
          Local-first AI agents with secure, private memory. No cloud required.
        </div>

        {/* Bottom stats bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            display: 'flex',
            gap: 60,
          }}
        >
          {[
            { value: '40+', label: 'Apps Replaced' },
            { value: '96%', label: 'Retention' },
            { value: '100%', label: 'Encrypted' },
          ].map((stat) => (
            <div key={stat.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ color: '#E77630', fontSize: 28, fontWeight: 700 }}>{stat.value}</div>
              <div style={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: 14, textTransform: 'uppercase', letterSpacing: 2 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
