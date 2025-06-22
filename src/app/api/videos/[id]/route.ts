import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { deleteVideo, updateVideoTitle, getVideoById } from '@/lib/auth-db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/videos/[id] - Get a specific video
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const videoId = parseInt(resolvedParams.id);
    if (isNaN(videoId)) {
      return NextResponse.json({ error: 'Invalid video ID' }, { status: 400 });
    }

    const video = getVideoById(videoId);
    
    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    // Check if user owns the video
    if (video.user_id !== parseInt(session.user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(video);
  } catch (error) {
    console.error('Error getting video:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/videos/[id] - Delete a video
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const videoId = parseInt(resolvedParams.id);
    if (isNaN(videoId)) {
      return NextResponse.json({ error: 'Invalid video ID' }, { status: 400 });
    }

    const success = deleteVideo(videoId, parseInt(session.user.id));
    
    if (!success) {
      return NextResponse.json({ error: 'Video not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Error deleting video:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/videos/[id] - Update video title
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const videoId = parseInt(resolvedParams.id);
    if (isNaN(videoId)) {
      return NextResponse.json({ error: 'Invalid video ID' }, { status: 400 });
    }

    const { title } = await req.json();
    
    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Valid title is required' }, { status: 400 });
    }

    const success = updateVideoTitle(videoId, parseInt(session.user.id), title);
    
    if (!success) {
      return NextResponse.json({ error: 'Video not found or unauthorized' }, { status: 404 });
    }

    const updatedVideo = getVideoById(videoId);
    return NextResponse.json({ video: updatedVideo });
  } catch (error) {
    console.error('Error updating video:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 