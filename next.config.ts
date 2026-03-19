import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
