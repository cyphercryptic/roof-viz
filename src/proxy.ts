import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  // Static marketing and discovery resources do not need a database round trip.
  const publicPaths = ['/', '/privacy', '/terms', '/robots.txt', '/sitemap.xml', '/opengraph-image', '/twitter-image', '/auth/callback'];
  if (publicPaths.includes(request.nextUrl.pathname)) return NextResponse.next();
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
          supabaseResponse.headers.set('Cache-Control', 'private, no-store');
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthPage = pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/invite');
  // Publicly reachable pages (marketing, legal, share links, password reset) — no
  // session required. Reset-password is here rather than in isAuthPage because the
  // recovery link establishes a session, and authenticated users must still reach it.
  const isPublicPage = pathname === '/' ||
    pathname.startsWith('/share') ||
    pathname.startsWith('/privacy') ||
    pathname.startsWith('/terms') ||
    pathname.startsWith('/reset-password') ||
    pathname === '/auth/callback';

  function redirectWithSession(url: URL) {
    const response = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach(cookie => response.cookies.set(cookie));
    response.headers.set('Cache-Control', 'private, no-store');
    return response;
  }

  // Redirect unauthenticated users to login (except auth pages and API routes)
  if (!user && !isAuthPage && !isPublicPage && !request.nextUrl.pathname.startsWith('/api')) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return redirectWithSession(url);
  }

  // Redirect authenticated users away from auth pages
  if (user && isAuthPage && !request.nextUrl.pathname.startsWith('/invite')) {
    const url = request.nextUrl.clone();
    url.pathname = '/visualize';
    return redirectWithSession(url);
  }

  // Restrict demo users to visualize page only
  if (user && !isAuthPage && !request.nextUrl.pathname.startsWith('/api')) {
    const restrictedForDemo = ['/catalog', '/settings', '/analytics'];
    const isRestrictedRoute = restrictedForDemo.some((r) =>
      request.nextUrl.pathname.startsWith(r)
    );

    if (isRestrictedRoute) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role === 'demo') {
        const url = request.nextUrl.clone();
        url.pathname = '/visualize';
        return redirectWithSession(url);
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
