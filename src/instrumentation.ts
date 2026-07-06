import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
  }
}

// Required for Sentry to capture errors thrown in Server Components, route handlers,
// and other server-side code. Without this, API-route failures never reach Sentry.
export const onRequestError = Sentry.captureRequestError;
