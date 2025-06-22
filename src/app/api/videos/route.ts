import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getVideosByUserId, createVideo } from '@/lib/auth-db';

// GET /api/videos - Get user's videos
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const videos = getVideosByUserId(parseInt(session.user.id));
    return NextResponse.json({ videos });
  } catch (error) {
    console.error('Error fetching videos:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/videos - Save video metadata after upload
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      title, 
      description, 
      uploadthingUrl, 
      uploadthingKey, 
      fileSize, 
      duration, 
      thumbnailUrl, 
      metadata 
    } = await req.json();

    if (!title || !uploadthingUrl || !uploadthingKey || !fileSize) {
      return NextResponse.json({ 
        error: 'Missing required fields: title, uploadthingUrl, uploadthingKey, fileSize' 
      }, { status: 400 });
    }

    const video = await createVideo(
      parseInt(session.user.id),
      title,
      uploadthingUrl,
      uploadthingKey,
      fileSize,
      metadata || {},
      description,
      duration,
      thumbnailUrl
    );

    if (!video) {
      return NextResponse.json({ error: 'Failed to save video' }, { status: 500 });
    }

    return NextResponse.json({ video });
  } catch (error) {
    console.error('Error saving video:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 