import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();

  return [
    { url: `${siteUrl}/` },
    { url: `${siteUrl}/privacy` },
    { url: `${siteUrl}/terms` },
  ];
}
