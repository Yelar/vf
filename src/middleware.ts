import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

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

  return NextResponse.next();
});

export const config = {
  matcher: ['/api/:path*', '/dashboard/:path*', '/library/:path*', '/video/:path*']
};