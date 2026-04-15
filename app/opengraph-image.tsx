import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Operator Uplift — Your AI Operating System';
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
          backgroundImage: 'radial-gradient(circle at 50% 40%, rgba(231, 118, 48, 0.1) 0%, transparent 55%)',
        }}
      >
        {/* Top accent bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: 'linear-gradient(to right, transparent, #F97316, transparent)',
          }}
        />

        {/* Logo + brand name */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            marginBottom: 36,
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              background: '#F97316',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 50px rgba(231, 118, 48, 0.35)',
            }}
          >
            <div style={{ color: 'white', fontSize: 36, fontWeight: 900, letterSpacing: -1 }}>OU</div>
          </div>
          <div style={{ color: 'white', fontSize: 44, fontWeight: 700, letterSpacing: -1 }}>
            Operator Uplift
          </div>
        </div>

        {/* Hero tagline */}
        <div
          style={{
            color: 'white',
            fontSize: 52,
            fontWeight: 700,
            textAlign: 'center',
            letterSpacing: -2,
            lineHeight: 1.15,
            marginBottom: 24,
            maxWidth: 800,
          }}
        >
          Your AI Operating System
        </div>

        {/* Description */}
        <div
          style={{
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: 22,
            textAlign: 'center',
            maxWidth: 680,
            lineHeight: 1.5,
          }}
        >
          Multi-agent orchestration with on-device encryption. Calendar, email, and on-chain tools — governed by you.
        </div>

        {/* Bottom capability chips */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            display: 'flex',
            gap: 20,
          }}
        >
          {[
            'Multi-Agent Swarm',
            'AES-256 Encrypted',
            'Solana Native',
            'Real Google APIs',
          ].map((label) => (
            <div
              key={label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                borderRadius: 8,
                border: '1px solid rgba(231, 118, 48, 0.25)',
                backgroundColor: 'rgba(231, 118, 48, 0.06)',
              }}
            >
              <div style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#F97316' }} />
              <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.5 }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
