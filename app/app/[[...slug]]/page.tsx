'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';

/**
 * Optional catch-all so every /app/* path serves the same client bundle;
 * wouter takes over routing from window.location. SSR is disabled: the
 * app reads window + localStorage during render by design.
 */
const UpliftApp = dynamic(() => import('@/src/uplift/UpliftApp'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1c1917',
        color: '#a8a29e',
        fontWeight: 700,
      }}
    >
      Loading the app...
    </div>
  ),
});

export default function AppPage() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  return <UpliftApp />;
}
