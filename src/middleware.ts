import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
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
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const isAuthPage = request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/signup') ||
    request.nextUrl.pathname.startsWith('/invite');
  const isPublicPage = request.nextUrl.pathname.startsWith('/share');

  // Redirect unauthenticated users to login (except auth pages and API routes)
  if (!user && !isAuthPage && !isPublicPage && !request.nextUrl.pathname.startsWith('/api')) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages
  if (user && isAuthPage && !request.nextUrl.pathname.startsWith('/invite')) {
    const url = request.nextUrl.clone();
    url.pathname = '/visualize';
    return NextResponse.redirect(url);
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
        return NextResponse.redirect(url);
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
