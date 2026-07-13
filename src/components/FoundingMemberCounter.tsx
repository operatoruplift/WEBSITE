'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { WAITLIST_OFFPLATFORM_BASE } from '@/lib/waitlist-constants';

const FoundingMemberCounter: React.FC = () => {
  const [target, setTarget] = useState<number | null>(null);
  const [displayed, setDisplayed] = useState(0);
  const rafRef = useRef<number | null>(null);

  const fetchCount = useCallback(() => {
    fetch('/api/waitlist/counts', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const total =
          data && typeof data.total === 'number'
            ? data.total
            : WAITLIST_OFFPLATFORM_BASE;
        setTarget(total);
      })
      .catch(() => {
        setTarget((prev) => prev ?? WAITLIST_OFFPLATFORM_BASE);
      });
  }, []);

  useEffect(() => { fetchCount(); }, [fetchCount]);

  useEffect(() => {
    window.addEventListener('waitlist:joined', fetchCount);
    return () => window.removeEventListener('waitlist:joined', fetchCount);
  }, [fetchCount]);

  useEffect(() => {
    if (target == null) return;
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) { setDisplayed(target); return; }

    const durationMs = 900;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayed(Math.round(target * eased));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current != null) cancelAnimationFrame(rafRef.current); };
  }, [target]);

  if (target == null || target <= 0) return null;

  return (
    <div
      className="inline-flex items-center gap-2.5 mb-8 md:mb-10 rounded-full px-4 py-2"
      style={{
        background: 'var(--color-card, #fff)',
        border: '1.5px solid var(--color-border, #EDE6DA)',
        boxShadow: 'var(--shadow-card, 0 8px 22px -12px rgba(120,90,50,0.20))',
        fontWeight: 800,
        fontSize: 13.5,
        color: 'var(--color-muted)',
      }}
      aria-label={`Waitlist open, ${target} joined`}
    >
      <span
        className="w-2.5 h-2.5 rounded-full flex-shrink-0 animate-pulse-ring"
        style={{ background: '#34D399', boxShadow: '0 0 0 4px rgba(52,211,153,0.18)' }}
        aria-hidden="true"
      />
      <span>
        Waitlist open &middot;{' '}
        <strong style={{ color: 'var(--color-foreground)' }}>
          {displayed.toLocaleString()}
        </strong>{' '}
        joined
      </span>
    </div>
  );
};

export default FoundingMemberCounter;
