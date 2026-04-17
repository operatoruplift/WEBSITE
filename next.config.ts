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
              ];
          },
          async redirects() {
              // NOTE: /docs previously redirected to help.operatoruplift.com
              // (GitBook). We now ship an in-repo GitBook-style docs route at
              // app/docs — that redirect is removed so the local route resolves.
              // Keep /changelog → /blog since we never built a changelog route.
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
