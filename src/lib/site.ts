/**
 * Central site configuration. Nothing here should hardcode a specific domain — we're on
 * a *.vercel.app deployment until a custom domain is set up.
 *
 * Server-side URL for links and redirects. Preview links must stay on their own
 * deployment even when production has a configured custom domain. Never trust a
 * request Host header for billing or email redirects.
 */
export function getSiteUrl(): string {
  if (process.env.VERCEL_ENV === 'preview') {
    const previewHost = process.env.VERCEL_BRANCH_URL || process.env.VERCEL_URL;
    if (previewHost) return `https://${previewHost}`;
  }

  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, '');

  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelHost) return `https://${vercelHost}`;

  return 'http://localhost:3000';
}

/** Public support / contact address shown in the app and legal pages. */
export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'connor@bar9.ai';

/**
 * From-address for transactional email. Resend can only send from a VERIFIED domain;
 * until one is set up, it falls back to Resend's shared onboarding sender, which can
 * only deliver to your own account email. Set EMAIL_FROM once your domain is verified.
 */
export const EMAIL_FROM = process.env.EMAIL_FROM || 'ExteriorViz <onboarding@resend.dev>';
