import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  // Only protect API routes (except auth routes)
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Allow auth routes to pass through
    if (request.nextUrl.pathname.startsWith('/api/auth/')) {
      return NextResponse.next();
    }

    try {
      // Check authentication using NextAuth JWT token (Edge Runtime compatible)
      const token = await getToken({ 
        req: request,
        secret: process.env.NEXTAUTH_SECRET || "your-secret-key-change-this-in-production"
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

      // Add user info to request headers for debugging
      const response = NextResponse.next();
      response.headers.set('x-user-email', token.email || '');
      response.headers.set('x-user-id', token.id?.toString() || '');
      
      return response;
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
  // Match all API routes except static files and specific exclusions
  matcher: [
    '/api/((?!auth/|_next/static|_next/image|favicon.ico).*)' 
  ]
};