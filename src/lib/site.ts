/**
 * Central site configuration. Nothing here should hardcode a specific domain — we're on
 * a *.vercel.app deployment until a custom domain is set up.
 *
 * Resolution order for the public site URL:
 *   1. NEXT_PUBLIC_SITE_URL          — set this once a custom domain exists
 *   2. VERCEL_PROJECT_PRODUCTION_URL — stable production *.vercel.app host (auto-set on Vercel)
 *   3. localhost                     — local dev
 *
 * VERCEL_PROJECT_PRODUCTION_URL is inlined at build time by Vercel, so it's safe to read
 * in both server and client bundles.
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, '');

  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelHost) return `https://${vercelHost}`;

  return 'http://localhost:3000';
}

/** Public support / contact address shown in the app and legal pages. */
export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@example.com';

/**
 * From-address for transactional email. Resend can only send from a VERIFIED domain;
 * until one is set up, it falls back to Resend's shared onboarding sender, which can
 * only deliver to your own account email. Set EMAIL_FROM once your domain is verified.
 */
export const EMAIL_FROM = process.env.EMAIL_FROM || 'RoofViz <onboarding@resend.dev>';
