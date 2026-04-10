'use client';

import * as Sentry from '@sentry/nextjs';
import Link from 'next/link';
import { useEffect } from 'react';

export default function PublicError({
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
    <div className="flex min-h-[60vh] items-center justify-center px-6 py-16">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-orange/10">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F58025" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2 className="mb-2 text-2xl font-semibold text-brand-brown">Something went wrong</h2>
        <p className="mb-6 text-sm text-brand-brown/70">
          We hit an unexpected error loading this page.
        </p>
        {error.digest && (
          <p className="mb-6 font-mono text-xs text-brand-brown/40">Error ID: {error.digest}</p>
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => unstable_retry()}
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
    </div>
  );
}
