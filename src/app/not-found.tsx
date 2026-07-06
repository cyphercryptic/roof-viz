import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-cream px-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-orange shadow-lg shadow-brand-orange/20">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>
        <h1 className="mb-2 text-6xl font-bold text-brand-brown">404</h1>
        <h2 className="mb-3 text-xl font-semibold text-brand-brown">Page not found</h2>
        <p className="mb-8 text-brand-brown/70">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-brand-orange px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-orange/90"
          >
            Back home
          </Link>
          <Link
            href="/visualize"
            className="inline-flex items-center justify-center rounded-lg border border-brand-brown/20 bg-white px-6 py-2.5 text-sm font-semibold text-brand-brown transition hover:bg-brand-peach/20"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
