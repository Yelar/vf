import { auth } from "@/lib/auth-edge";
import { NextResponse } from "next/server";

// Middleware runs in Edge Runtime by default

export default auth((req) => {
  // Add debug logging for production
  if (process.env.NODE_ENV === 'production') {
    console.log('Middleware - Path:', req.nextUrl.pathname);
    console.log('Middleware - User:', req.auth?.user?.email || 'Not authenticated');
  }

  // Protect API routes
  if (req.nextUrl.pathname.startsWith('/api/')) {
    // Allow auth routes and public endpoints
    if (req.nextUrl.pathname.startsWith('/api/auth/') || 
        req.nextUrl.pathname.startsWith('/api/videos/shared/')) {
      return NextResponse.next();
    }
    
    // Require auth for other API routes
    if (!req.auth) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be authenticated to access this API endpoint', code: 'AUTHENTICATION_REQUIRED' },
        { status: 401 }
      );
    }
  }

  // Protect dashboard pages
  if (req.nextUrl.pathname.startsWith('/dashboard') || 
      req.nextUrl.pathname.startsWith('/library') ||
      req.nextUrl.pathname.startsWith('/video/')) {
    
    if (!req.auth) {
      return NextResponse.redirect(new URL('/auth/signin', req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files) 
     * - favicon.ico (favicon file)
     * - .swa (Azure Static Web Apps internal routes)
     * - debug (debug pages for troubleshooting)
     */
    '/((?!_next/static|_next/image|favicon.ico|.swa|debug).*)',
  ],
};