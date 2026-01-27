import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Pages that don't require authentication
const publicPaths = ['/login', '/api/auth/wallet'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Check for session cookie
  const sessionCookie = request.cookies.get('wallet_session')?.value;

  if (!sessionCookie) {
    // Redirect to login
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const session = JSON.parse(sessionCookie);
    const sessionAge = Date.now() - session.timestamp;

    // Check if session expired (24h)
    if (sessionAge > 24 * 60 * 60 * 1000) {
      const loginUrl = new URL('/login', request.url);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('wallet_session');
      return response;
    }

    // Session valid, allow access
    return NextResponse.next();
  } catch (e) {
    // Invalid session, redirect to login
    const loginUrl = new URL('/login', request.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('wallet_session');
    return response;
  }
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sw.js, manifest.json (static assets)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.json|icon-.*\\.png|generate-icons.html).*)',
  ],
};
