import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getVideoById, updateVideoTitle, deleteVideo, toggleVideoSharing } from '@/lib/auth-db';

// GET /api/videos/[id] - Get specific video data
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const videoId = parseInt(params.id);
    if (isNaN(videoId)) {
      return NextResponse.json({ error: 'Invalid video ID' }, { status: 400 });
    }

    const video = getVideoById(videoId);
    
    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    // Check if user owns this video
    if (video.user_id !== parseInt(session.user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ video });
  } catch (error) {
    console.error('Error fetching video:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/videos/[id] - Update video
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const videoId = parseInt(params.id);
    if (isNaN(videoId)) {
      return NextResponse.json({ error: 'Invalid video ID' }, { status: 400 });
    }

    const { title } = await req.json();

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const success = updateVideoTitle(videoId, parseInt(session.user.id), title.trim());
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to update video or video not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating video:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/videos/[id] - Delete video
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const videoId = parseInt(params.id);
    if (isNaN(videoId)) {
      return NextResponse.json({ error: 'Invalid video ID' }, { status: 400 });
    }

    const success = deleteVideo(videoId, parseInt(session.user.id));
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to delete video or video not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting video:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/videos/[id] - Update video sharing status
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const videoId = parseInt(params.id);
    if (isNaN(videoId)) {
      return NextResponse.json({ error: 'Invalid video ID' }, { status: 400 });
    }

    const success = toggleVideoSharing(videoId, parseInt(session.user.id));
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to update sharing status or video not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating video sharing status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 