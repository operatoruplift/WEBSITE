'use client';

import React from 'react';
import { useLocation } from 'wouter';
import { Btn } from '@/src/uplift/system';

export default function NotFound() {
  const [, setLocation] = useLocation();
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '40px 30px',
        background: 'linear-gradient(to bottom, var(--orange), #fdac55)',
      }}
    >
      <div style={{ fontSize: 84, animation: 'ou_float 3s ease-in-out infinite' }}>{'\u{1F9ED}'}</div>
      <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 64, color: '#fff', lineHeight: 1, marginTop: 8, textShadow: '0 4px 16px rgba(150,70,20,0.35)' }}>404</div>
      <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 22, color: '#fff', marginTop: 10 }}>This screen wandered off</div>
      <p style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 15, color: 'rgba(255,255,255,0.92)', marginTop: 6, maxWidth: 280 }}>
        The page you were after does not exist. Your streak, thankfully, still does.
      </p>
      <div style={{ width: '100%', maxWidth: 280, marginTop: 28 }}>
        <Btn variant="dark" size="lg" onClick={() => setLocation('/app')} style={{ background: '#fff', color: 'var(--orange-d)' }}>
          Back to home
        </Btn>
      </div>
    </div>
  );
}
