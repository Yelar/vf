import { auth } from "@/lib/auth-edge";
import { NextResponse } from "next/server";
import { getRateLimitMiddleware } from "@/lib/rate-limit";

// Rate limit configurations
const generalLimiter = getRateLimitMiddleware({
  limit: 100,         // 100 requests
  windowMs: 60000,    // per minute
  trustProxy: true    // Trust X-Forwarded-For header
});

const authLimiter = getRateLimitMiddleware({
  limit: 200,          // 200 requests
  windowMs: 300000,   // per 5 minutes
  trustProxy: true    // Trust X-Forwarded-For header
});

const speechLimiter = getRateLimitMiddleware({
  limit: 300,          // 300 requests
  windowMs: 60000,    // per minute
  trustProxy: true    // Trust X-Forwarded-For header
});

const renderLimiter = getRateLimitMiddleware({
  limit: 100,          // 100 requests
  windowMs: 60000,    // per minute
  trustProxy: true    // Trust X-Forwarded-For header
});

// Middleware runs in Edge Runtime by default

export default auth(async (req) => {
  // Only protect API routes, let page routes handle their own auth
  if (req.nextUrl.pathname.startsWith('/api/')) {
    // Check rate limits based on route type
    let rateLimitResult;

    if (req.nextUrl.pathname.startsWith('/api/auth/')) {
      rateLimitResult = await authLimiter(req);
    } else if (req.nextUrl.pathname.startsWith('/api/generate-speech/')) {
      rateLimitResult = await speechLimiter(req);
    } else if (req.nextUrl.pathname.startsWith('/api/render')) {
      rateLimitResult = await renderLimiter(req);
    } else {
      rateLimitResult = await generalLimiter(req);
    }

    // If rate limited, return 429 response
    if (rateLimitResult.blocked) {
      return NextResponse.json(
        {
          error: 'Too Many Requests',
          message: 'Please try again later',
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': rateLimitResult.remaining.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString()
          }
        }
      );
    }

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