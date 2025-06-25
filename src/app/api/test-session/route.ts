import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    
    return NextResponse.json({
      authenticated: !!session,
      user: session?.user || null,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      hasSecret: !!process.env.NEXTAUTH_SECRET,
      hasUrl: !!process.env.NEXTAUTH_URL
    });
  } catch (error) {
    console.error('Session test error:', error);
    return NextResponse.json({
      error: 'Session test failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 