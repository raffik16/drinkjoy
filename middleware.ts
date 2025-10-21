import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Performance and caching headers
  const pathname = request.nextUrl.pathname;

  // Cache static assets aggressively
  if (
    pathname.startsWith('/_next/static') ||
    pathname.startsWith('/images') ||
    pathname.match(/\.(jpg|jpeg|png|gif|svg|webp|avif|ico|woff|woff2)$/)
  ) {
    response.headers.set(
      'Cache-Control',
      'public, max-age=31536000, immutable'
    );
  }

  // Cache API responses strategically
  if (pathname.startsWith('/api/')) {
    if (pathname.includes('/drinks') || pathname.includes('/beers') || pathname.includes('/wines')) {
      // Drink data can be cached for 5 minutes
      response.headers.set(
        'Cache-Control',
        'public, max-age=300, s-maxage=300, stale-while-revalidate=600'
      );
    } else {
      // Other API endpoints should not be cached
      response.headers.set(
        'Cache-Control',
        'no-cache, no-store, must-revalidate'
      );
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/webpack-hmr (hot module reloading)
     * - sw.js (service worker)
     */
    '/((?!_next/webpack-hmr|sw.js).*)',
  ],
};