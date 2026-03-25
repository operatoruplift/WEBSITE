import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/app', '/chat', '/marketplace', '/security', '/settings', '/agents', '/notifications', '/workflows', '/swarm', '/memory', '/analytics', '/profile', '/integrations', '/onboarding', '/login', '/signup'],
    },
    sitemap: 'https://operatoruplift.com/sitemap.xml',
  };
}
