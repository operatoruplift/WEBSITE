import type { Metadata, Viewport } from 'next';

/**
 * /app: the installable Uplift PWA (phone-framed habit-staking app).
 * The route is fully client-rendered; this layout only contributes
 * install metadata. The manifest lives at /manifest.json with
 * start_url /app, so installing from here lands users back in the app.
 */

export const viewport: Viewport = {
  themeColor: '#F08A4C',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: 'Operator Uplift App',
  description:
    'Lock a little practice money on a daily habit, prove it with a photo, and get it all back when you finish. Streaks, levels, and gentle accountability.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Uplift',
  },
  icons: {
    apple: '/uplift/icons/icon-180.png',
  },
};

export default function UpliftAppLayout({ children }: { children: React.ReactNode }) {
  return children;
}
