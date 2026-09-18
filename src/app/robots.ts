import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Crawler guidance only. Authentication and tenant isolation are enforced separately.
      disallow: [
        '/login',
        '/signup',
        '/reset-password',
        '/invite',
        '/auth',
        '/onboarding',
        '/dashboard',
        '/visualize',
        '/gallery',
        '/catalog',
        '/analytics',
        '/settings',
        '/api',
        '/share',
      ],
    },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
