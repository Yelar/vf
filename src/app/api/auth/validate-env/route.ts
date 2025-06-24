import { NextResponse } from 'next/server';

export async function GET() {
  const validation = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    nextauthSecret: process.env.NEXTAUTH_SECRET ? 'SET' : 'MISSING',
    nextauthUrl: process.env.NEXTAUTH_URL || 'MISSING',
    mongodbUri: process.env.MONGODB_URI ? 'SET' : 'MISSING',
    runtime: typeof window === 'undefined' ? 'server' : 'client',
    platform: process.platform,
  };

  console.log('🔍 Environment validation:', validation);

  return NextResponse.json(validation);
} 