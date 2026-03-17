import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    async redirects() {
          return [
            {
                      source: '/docs',
                      destination: 'https://help.operatoruplift.com/',
                      permanent: true,
            },
            {
                      source: '/docs/:path*',
                      destination: 'https://help.operatoruplift.com/:path*',
                      permanent: true,
            },
            {
                      source: '/pricing',
                      destination: '/contact',
                      permanent: false,
            },
                ];
    },
};

export default nextConfig;
