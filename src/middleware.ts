import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Auth gating for:
// - /search (page)
// - all /api/* except /api/auth/*
// Admin gating for /admin and /api/admin
// Uses NextAuth session cookie presence as a lightweight check; server routes enforce authorization.

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // allow landing and next static
  if (
    pathname === '/' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/api/auth') ||
    pathname === '/robots.txt'
  ) {
    return NextResponse.next();
  }

  const hasSessionCookie =
    req.cookies.has('next-auth.session-token') ||
    req.cookies.has('__Secure-next-auth.session-token');

  if (pathname.startsWith('/api/')) {
    if (!hasSessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (pathname.startsWith('/search') || pathname.startsWith('/admin')) {
    if (!hasSessionCookie) {
      const url = req.nextUrl.clone();
      url.pathname = '/api/auth/signin';
      url.searchParams.set('callbackUrl', req.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!.*\\.).*)'],
};
