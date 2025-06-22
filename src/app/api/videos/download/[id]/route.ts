import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getVideoById } from '@/lib/auth-db';

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
    const videoId = parseInt(resolvedParams.id);
    if (isNaN(videoId)) {
      return NextResponse.json({ error: 'Invalid video ID' }, { status: 400 });
    }

    // Get video from database
    const video = await getVideoById(videoId);
    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    // Check if user owns the video
    if (video.user_id !== parseInt(session.user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch video from UploadThing with timeout and retry
    let videoResponse: Response;
    let retryCount = 0;
    const maxRetries = 3;
    const timeoutMs = 30000; // 30 seconds

    while (retryCount < maxRetries) {
      try {
        console.log(`Attempting to fetch video from UploadThing (attempt ${retryCount + 1}/${maxRetries})`);
        
        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        videoResponse = await fetch(video.uploadthing_url, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; VideoDownloader/1.0)',
          },
        });

        clearTimeout(timeoutId);

        if (videoResponse.ok) {
          break; // Success, exit retry loop
        } else {
          throw new Error(`HTTP ${videoResponse.status}: ${videoResponse.statusText}`);
        }
      } catch (error) {
        retryCount++;
        console.error(`Fetch attempt ${retryCount} failed:`, error);
        
        if (retryCount >= maxRetries) {
          console.error('All fetch attempts failed');
          return NextResponse.json({ 
            error: 'Failed to fetch video from storage. The video may be temporarily unavailable.' 
          }, { status: 500 });
        }
        
        // Wait before retry (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 5000);
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // Get video data with streaming for large files
    console.log('Successfully fetched video, reading data...');
    const videoBuffer = await videoResponse!.arrayBuffer();
    const safeTitle = video.title.replace(/[^a-zA-Z0-9\s-_]/g, '').replace(/\s+/g, '-');
    const filename = `${safeTitle}.mp4`;

    // Return video with proper headers for download
    return new NextResponse(videoBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': videoBuffer.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error('Error downloading video:', error);
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