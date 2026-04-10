'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'system-ui' }}>
          <h2 style={{ marginBottom: '16px' }}>Something went wrong</h2>
          <p style={{ color: '#666', marginBottom: '24px' }}>
            An unexpected error occurred. Our team has been notified.
          </p>
          <button
            onClick={() => unstable_retry()}
            style={{
              padding: '10px 24px',
              backgroundColor: '#F58025',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
