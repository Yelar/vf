import { auth } from "@/lib/auth-edge";
import { NextResponse } from "next/server";

// Middleware runs in Edge Runtime by default

export default auth((req) => {
  // Only protect API routes, let page routes handle their own auth
  if (req.nextUrl.pathname.startsWith('/api/')) {
    // Allow auth routes, public endpoints, and UploadThing callbacks
    if (req.nextUrl.pathname.startsWith('/api/auth/') || 
        req.nextUrl.pathname.startsWith('/api/videos/shared/') ||
        req.nextUrl.pathname.startsWith('/api/uploadthing')) {
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

  // For all other routes, just continue
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
     */
    '/((?!_next/static|_next/image|favicon.ico|.swa).*)',
  ],
};