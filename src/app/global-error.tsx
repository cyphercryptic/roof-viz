'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect, useTransition } from 'react';

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <head><title>Something went wrong | ExteriorViz</title></head>
      <body style={{ margin: 0, backgroundColor: '#f7f9fc', color: '#172b45', fontFamily: 'system-ui, sans-serif' }}>
        <main id="main-content" aria-busy={isPending} style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '32px', boxSizing: 'border-box' }}>
          <div style={{ maxWidth: '440px', textAlign: 'center' }}>
            <p style={{ fontWeight: 700, marginBottom: '32px' }}>ExteriorViz</p>
            <h1 style={{ fontSize: '28px', marginBottom: '16px' }}>Something went wrong</h1>
            <p role="alert" style={{ color: '#52647a', lineHeight: 1.6, marginBottom: '24px' }}>
              ExteriorViz couldn’t load this page. Please try again or return to the home page.
            </p>
            <button
              type="button"
              disabled={isPending}
              onClick={() => startTransition(() => retry())}
              style={{
                minHeight: '44px',
                padding: '10px 24px',
                backgroundColor: '#2463eb',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: isPending ? 'wait' : 'pointer',
                opacity: isPending ? 0.6 : 1,
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              {isPending ? 'Trying again…' : 'Try again'}
            </button>
            <p style={{ marginTop: '24px' }}>
              {/* A document navigation works even if the client router has failed. */}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a href="/" style={{ color: '#1d4ed8', textUnderlineOffset: '4px' }}>Back to ExteriorViz</a>
            </p>
          </div>
        </main>
      </body>
    </html>
  );
}
