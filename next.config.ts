import type { NextConfig } from "next";

// Desktop build flag — set by `npm run build:desktop` (NEXT_PUBLIC_DESKTOP=1).
// In desktop mode we produce a static export that Tauri wraps into a DMG.
// `headers()` and `redirects()` are not supported with `output: 'export'`,
// so they're omitted when the flag is set. The web build is unchanged.
const isDesktop = process.env.NEXT_PUBLIC_DESKTOP === '1';

const baseConfig: NextConfig = isDesktop
    ? {
          output: 'export',
          images: { unoptimized: true },
          trailingSlash: true,
      }
    : {
          async headers() {
              return [
                  {
                      source: '/(.*)',
                      headers: [
                          { key: 'X-Frame-Options', value: 'DENY' },
                          { key: 'X-Content-Type-Options', value: 'nosniff' },
                          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                          { key: 'X-DNS-Prefetch-Control', value: 'on' },
                          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
                          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
                      ],
                  },
                  // Long-cache static media in /public. Vercel defaults
                  // unhashed public assets to cache-control: max-age=0,
                  // so every visit re-downloads the 235KB brand mark,
                  // 3.3MB hero MP4, and 3.9MB hero WebM. Cap at 30 days
                  // (immutable) and ship a new filename when we need to
                  // swap content. Hashed Next-emitted chunks under
                  // /_next/static already cache for 1 year so they are
                  // not affected by this rule.
                  {
                      source: '/:path*.:ext(png|jpg|jpeg|webp|avif|svg|ico|woff|woff2|mp4|webm|m4v|mov)',
                      headers: [
                          {
                              key: 'Cache-Control',
                              value: 'public, max-age=2592000, immutable',
                          },
                      ],
                  },
              ];
          },
          async redirects() {
              // /docs is now an in-repo GitBook-style route at app/docs,
              // so it resolves locally without redirect. /changelog still
              // redirects to /blog because we never built a separate
              // changelog route.
              return [
                  {
                      source: '/changelog',
                      destination: '/blog',
                      permanent: false,
                  },
              ];
          },
      };

export default baseConfig;
