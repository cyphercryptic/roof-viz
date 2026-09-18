import Link from 'next/link';

export default function NotFound() {
  return (
    <main id="main-content" className="flex min-h-screen items-center justify-center bg-brand-cream px-6 py-12">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-orange shadow-lg shadow-brand-orange/20">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>
        <h1 className="mb-2 text-6xl font-bold text-brand-brown">404</h1>
        <h2 className="mb-3 text-xl font-semibold text-brand-brown">Page not found</h2>
        <p className="mb-8 text-brand-brown/70">
          This ExteriorViz page is unavailable. The address may be incorrect, or a shared preview may have expired.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-orange px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-orange hover:bg-brand-orange/90"
          >
            Back to ExteriorViz
          </Link>
          <Link
            href="/visualize"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-brand-brown/20 bg-white px-6 py-2.5 text-sm font-semibold text-brand-brown transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-orange hover:bg-brand-peach/20"
          >
            Open workspace
          </Link>
        </div>
      </div>
    </main>
  );
}
