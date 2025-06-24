import { NextResponse } from 'next/server';

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// Azure Static Web Apps sometimes has issues with dynamic NextAuth routes
// This provides an explicit /api/auth/providers endpoint
export async function GET() {
  console.log('🔍 Providers route called');
  console.log('Environment check:');
  console.log('- NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? 'SET' : 'MISSING');
  console.log('- NEXTAUTH_URL:', process.env.NEXTAUTH_URL || 'MISSING');
  console.log('- NODE_ENV:', process.env.NODE_ENV);

  try {
    const providers = {
      credentials: {
        id: "credentials",
        name: "credentials",
        type: "credentials",
        signinUrl: "/api/auth/signin/credentials",
        callbackUrl: "/api/auth/callback/credentials"
      }
    };

    const response = NextResponse.json(providers);
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');

    console.log('✅ Providers response successful');
    return response;
  } catch (error) {
    console.error('❌ Providers route error:', error);
    
    const errorResponse = NextResponse.json(
      { 
        error: 'Failed to load providers',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
    
    // Add CORS headers to error response too
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    return errorResponse;
  }
} 