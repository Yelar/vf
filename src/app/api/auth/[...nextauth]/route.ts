import { handlers } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// Handle OPTIONS preflight requests
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || '*';
  
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
      'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}

// Add CORS headers to all auth responses
function addCorsHeaders(response: NextResponse, origin: string) {
  response.headers.set('Access-Control-Allow-Origin', origin);
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  response.headers.set('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
  return response;
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin') || '*';
  try {
    const response = await handlers.GET(request);
    return addCorsHeaders(response as NextResponse, origin);
  } catch (error) {
    console.error('Auth GET error:', error);
    const errorResponse = NextResponse.json(
      { error: 'Authentication error' },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse, origin);
  }
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin') || '*';
  try {
    const response = await handlers.POST(request);
    return addCorsHeaders(response as NextResponse, origin);
  } catch (error) {
    console.error('Auth POST error:', error);
    const errorResponse = NextResponse.json(
      { error: 'Authentication error' },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse, origin);
  }
} 