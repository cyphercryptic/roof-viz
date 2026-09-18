'use client';

import * as Sentry from '@sentry/nextjs';
import Link from 'next/link';
import { useEffect } from 'react';

export default function AuthError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <main id="main-content" className="flex min-h-screen items-center justify-center bg-brand-cream px-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-orange/10">
          <svg aria-hidden="true" className="text-brand-orange" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h1 className="mb-2 text-2xl font-semibold text-brand-brown">Let&apos;s try that again</h1>
        <p role="alert" className="mb-6 text-sm text-brand-brown-soft">
          ExteriorViz could not load this page. Try again or return home to continue.
        </p>
        {error.digest && (
          <p className="mb-6 font-mono text-xs text-brand-brown/40">Error ID: {error.digest}</p>
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => retry()}
            className="inline-flex items-center justify-center rounded-lg bg-brand-orange px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-orange/90"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-brand-brown/20 bg-white px-6 py-2.5 text-sm font-semibold text-brand-brown transition hover:bg-brand-peach/20"
          >
            Back home
          </Link>
        </div>
      </div>
    </main>
  );
}
