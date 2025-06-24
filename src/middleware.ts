import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  // Add debug logging for production
  if (process.env.NODE_ENV === 'production') {
    console.log('Middleware - Path:', request.nextUrl.pathname);
  }

  // Protect API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Allow auth routes, public shared videos, and uploadthing
    if (request.nextUrl.pathname.startsWith('/api/auth/') || 
        request.nextUrl.pathname.startsWith('/api/videos/shared/') ||
        request.nextUrl.pathname.startsWith('/api/uploadthing') ||
        request.nextUrl.pathname.startsWith('/api/temp-audio/')) {
      return NextResponse.next();
    }
    
    // Check authentication using JWT token (Edge Runtime compatible)
    try {
      const token = await getToken({ 
        req: request,
        secret: process.env.NEXTAUTH_SECRET
      });
      
      if (!token) {
        return NextResponse.json(
          { 
            error: 'Unauthorized', 
            message: 'You must be authenticated to access this API endpoint',
            code: 'AUTHENTICATION_REQUIRED'
          },
          { status: 401 }
        );
      }

      // Add debug logging in production
      if (process.env.NODE_ENV === 'production') {
        console.log('Middleware - User:', token.email || 'No email');
      }

      return NextResponse.next();
    } catch (error) {
      console.error('Middleware auth error:', error);
      return NextResponse.json(
        { 
          error: 'Authentication Error', 
          message: 'Failed to verify authentication' 
        },
        { status: 500 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*']
};