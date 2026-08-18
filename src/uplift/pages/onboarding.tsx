'use client';

import React, { useState } from 'react';
import { Btn, Icon } from '@/src/uplift/system';

const STEPS = [
  {
    icon: 'lock',
    color: 'var(--orange)',
    title: 'Put a little on the line',
    description:
      'Lock in a small amount of practice money on a daily habit. It keeps you honest, and it stays totally safe as long as you show up.',
  },
  {
    icon: 'camera',
    color: 'var(--mint)',
    title: 'Prove it daily',
    description:
      'Snap a quick photo every day. The AI checks it in seconds, your streak grows, and your profile levels up.',
  },
  {
    icon: 'gift',
    color: 'var(--sky)',
    title: 'Finish and keep it all',
    description:
      'Complete the challenge and every dollar comes back, plus a bonus funded by the people who quit. Ready?',
  },
];

export default function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step]!;
  const last = step === STEPS.length - 1;

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 28px',
        background: 'var(--bg)',
        position: 'relative',
        overflow: 'hidden',
        textAlign: 'center',
      }}
    >
      {/* Soft background blobs */}
      <div aria-hidden="true" style={{ position: 'absolute', top: '-12%', right: '-14%', width: '60%', aspectRatio: '1', borderRadius: '50%', background: 'color-mix(in srgb, var(--orange) 14%, transparent)', filter: 'blur(60px)', pointerEvents: 'none' }} />
      <div aria-hidden="true" style={{ position: 'absolute', bottom: '-14%', left: '-14%', width: '60%', aspectRatio: '1', borderRadius: '50%', background: 'color-mix(in srgb, var(--sky) 12%, transparent)', filter: 'blur(60px)', pointerEvents: 'none' }} />

      <div key={step} style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        <div
          style={{
            width: 128,
            height: 128,
            borderRadius: 36,
            background: `color-mix(in srgb, ${current.color} 16%, transparent)`,
            display: 'grid',
            placeItems: 'center',
            boxShadow: `0 18px 44px -16px ${current.color}`,
            animation: 'ou_pop 0.5s cubic-bezier(0.34,1.7,0.5,1) both',
          }}
        >
          <Icon name={current.icon} size={62} color={current.color} />
        </div>

        <div className="ou-fadein" style={{ marginTop: 34, minHeight: 130 }}>
          <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 29, color: 'var(--text)' }}>
            {current.title}
          </div>
          <p style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 16, color: 'var(--text2)', marginTop: 10, lineHeight: 1.55, maxWidth: 320 }}>
            {current.description}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, margin: '10px 0 30px', zIndex: 2 }}>
        {STEPS.map((_, i) => (
          <div
            key={i}
            style={{
              height: 8,
              borderRadius: 999,
              width: i === step ? 30 : 8,
              background: i === step ? 'var(--orange)' : 'var(--border-s)',
              transition: 'all 0.3s cubic-bezier(0.22,1,0.36,1)',
            }}
          />
        ))}
      </div>

      <div style={{ width: '100%', zIndex: 2, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Btn size="xl" onClick={() => (last ? onDone() : setStep(step + 1))}>
          {last ? "Let's Go!" : 'Next'}
        </Btn>
        {!last && (
          <button
            onClick={onDone}
            className="ou-squish"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-app-body)', fontWeight: 800, fontSize: 14.5, color: 'var(--text3)', padding: 10 }}
          >
            Skip intro
          </button>
        )}
      </div>
    </div>
  );
}
