import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Pages that don't require authentication
const publicPaths = [
  '/login',
  '/api/auth/wallet',
  '/api/telegram/webhook',  // Telegram webhooks need to be public
  '/api/websocket/health',  // WebSocket health check proxy (needs to be accessible for monitoring)
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Check for session cookie
  const sessionCookie = request.cookies.get('wallet_session')?.value;

  if (!sessionCookie) {
    // For API routes, return 401 instead of redirecting
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Unauthorized', reason: 'No session cookie' },
        { status: 401 }
      );
    }

    // For pages, redirect to login
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const session = JSON.parse(sessionCookie);
    const sessionAge = Date.now() - session.timestamp;

    // Check if session expired (24h)
    if (sessionAge > 24 * 60 * 60 * 1000) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Unauthorized', reason: 'Session expired' },
          { status: 401 }
        );
      }

      const loginUrl = new URL('/login', request.url);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('wallet_session');
      return response;
    }

    // Session valid, allow access
    return NextResponse.next();
  } catch (e) {
    // Invalid session
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Unauthorized', reason: 'Invalid session' },
        { status: 401 }
      );
    }

    // Redirect to login
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
