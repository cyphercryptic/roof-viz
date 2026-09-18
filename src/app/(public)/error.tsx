'use client';

import * as Sentry from '@sentry/nextjs';
import Link from 'next/link';
import { useEffect, useTransition } from 'react';

export default function PublicError({
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
    <section aria-labelledby="page-error-title" aria-busy={isPending} className="flex min-h-[60vh] items-center justify-center px-6 py-16">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-orange/10 text-brand-orange">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h1 id="page-error-title" className="mb-2 text-2xl font-semibold text-brand-brown">Something went wrong</h1>
        <p role="alert" className="mb-6 text-sm text-muted-foreground">
          ExteriorViz couldn’t load this page. Please try again.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            disabled={isPending}
            onClick={() => startTransition(() => retry())}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-orange px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-orange/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-orange disabled:cursor-wait disabled:opacity-60"
          >
            {isPending ? 'Trying again…' : 'Try again'}
          </button>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-brand-brown/20 bg-white px-6 py-2.5 text-sm font-semibold text-brand-brown transition hover:bg-brand-peach/20 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-orange"
          >
            Back to ExteriorViz
          </Link>
        </div>
      </div>
    </section>
  );
}
