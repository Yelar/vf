import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getVideoById } from '@/lib/auth-db-mongo';

async function handleRequest(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const videoId = resolvedParams.id;
    if (!videoId) {
      return NextResponse.json({ error: 'Invalid video ID' }, { status: 400 });
    }

    // Get video from database
    const video = await getVideoById(videoId);
    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    // Check if user owns the video
    if (video.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if video has uploaded URL
    if (!video.s3_url) {
      return NextResponse.json({ error: 'Video not yet processed' }, { status: 404 });
    }

    // Since server-side fetch keeps timing out, let's create a download-forcing redirect
    const safeTitle = video.title.replace(/[^a-zA-Z0-9\s-_]/g, '').replace(/\s+/g, '-');
    const filename = `${safeTitle}.mp4`;
    
    // Try to add download parameters to the URL
    const downloadUrl = new URL(video.s3_url);
    downloadUrl.searchParams.set('response-content-disposition', `attachment; filename="${filename}"`);
    downloadUrl.searchParams.set('response-content-type', 'video/mp4');
    
    console.log('Redirecting to S3 with download parameters...');
    return NextResponse.redirect(downloadUrl.toString());

  } catch (error) {
    console.error('Error getting video URL:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleRequest(request, { params });
}

export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleRequest(request, { params });
} 