import { NextRequest, NextResponse } from 'next/server';
import { getSharedVideoById } from '@/lib/auth-db-mongo';

// GET /api/videos/shared/[id] - Get specific shared video data (public access)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const videoId = resolvedParams.id;
    
    if (!videoId) {
      return NextResponse.json({ error: 'Invalid video ID' }, { status: 400 });
    }

    const video = await getSharedVideoById(videoId);
    
    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    return NextResponse.json({ video });
  } catch (error) {
    console.error('Error fetching shared video:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 