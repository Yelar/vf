import { NextResponse } from 'next/server';
import { getSharedVideos } from '@/lib/auth-db-mongo';

// GET /api/videos/shared - Get all shared videos (public access, no auth required)
export async function GET() {
  try {
    const sharedVideos = await getSharedVideos();
    return NextResponse.json({ videos: sharedVideos });
  } catch (error) {
    console.error('Error fetching shared videos:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 