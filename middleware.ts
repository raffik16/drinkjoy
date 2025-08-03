import { NextRequest, NextResponse } from 'next/server';

// Initialize services on first request
let servicesInitialized = false;

export async function middleware(request: NextRequest) {
  // Initialize services on server startup (only once)
  if (!servicesInitialized && request.nextUrl.pathname.startsWith('/api/')) {
    try {
      // Dynamic import to avoid issues with server-only modules
      const { initializeApp } = await import('./lib/startup');
      initializeApp();
      servicesInitialized = true;
    } catch (error) {
      console.error('Failed to initialize services in middleware:', error);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};