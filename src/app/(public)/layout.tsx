import Link from 'next/link';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-brand-cream">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 text-brand-brown">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-orange shadow-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <span className="text-lg font-semibold">RoofViz</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-brand-brown"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-brand-orange px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-orange-dark"
            >
              Sign Up
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border bg-white">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} RoofViz. All rights reserved.
          </p>
          <nav className="flex gap-6">
            <Link href="/terms" className="text-sm text-muted-foreground transition-colors hover:text-brand-brown">
              Terms of Service
            </Link>
            <Link href="/privacy" className="text-sm text-muted-foreground transition-colors hover:text-brand-brown">
              Privacy Policy
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
