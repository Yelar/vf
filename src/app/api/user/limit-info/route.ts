import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { checkGenerationLimit } from '@/lib/auth-db-mongo';

export async function GET() {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get limit info
    const limitInfo = await checkGenerationLimit(session.user.id);
    if (!limitInfo) {
      return NextResponse.json({ error: 'Failed to fetch limit information' }, { status: 500 });
    }

    return NextResponse.json({
      remaining: limitInfo.remaining,
      total: 70, // This is the monthly limit we set
      resetDate: limitInfo.resetDate,
    });

  } catch (error) {
    console.error('Error fetching user limit info:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch limit information',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 