import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getVideoById } from '@/lib/auth-db-mongo';

// Enhanced retry configuration
const RETRY_CONFIG = {
  maxRetries: 5,
  baseDelay: 1000,
  maxDelay: 30000,
  timeoutMs: 120000, // 2 minutes
  connectionTimeoutMs: 15000, // 15 seconds for initial connection
};

async function fetchWithRetry(url: string, attempt: number = 1): Promise<Response> {
  const controller = new AbortController();
  
  // Set timeout based on attempt number
  const timeoutMs = Math.min(
    RETRY_CONFIG.timeoutMs + (attempt * 10000), 
    RETRY_CONFIG.timeoutMs * 2
  );
  
  const timeoutId = setTimeout(() => {
    console.log(`⏰ Request timeout after ${timeoutMs}ms on attempt ${attempt}`);
    controller.abort();
  }, timeoutMs);

  try {
    console.log(`🌐 Fetching video (attempt ${attempt}/${RETRY_CONFIG.maxRetries})`);
    console.log(`⏱️ Timeout set to: ${timeoutMs}ms`);
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; VideoDownloader/2.0)',
        'Accept': 'video/mp4,video/webm,video/*,*/*',
        'Accept-Encoding': 'identity',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache, must-revalidate',
        'Pragma': 'no-cache',
        // Add range support for resumable downloads
        'Range': 'bytes=0-',
      },
      // Disable keep-alive for better connection handling
      keepalive: false,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    console.log(`✅ Successfully fetched video on attempt ${attempt}`);
    console.log(`📊 Response status: ${response.status}`);
    console.log(`📏 Content-Length: ${response.headers.get('content-length') || 'unknown'}`);
    console.log(`🔧 Content-Type: ${response.headers.get('content-type') || 'unknown'}`);
    
    return response;
    
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Fetch attempt ${attempt} failed:`, errorMessage);
    
    if (attempt >= RETRY_CONFIG.maxRetries) {
      throw new Error(`All ${RETRY_CONFIG.maxRetries} fetch attempts failed. Last error: ${errorMessage}`);
    }
    
    // Calculate exponential backoff with jitter
    const baseDelay = Math.min(
      RETRY_CONFIG.baseDelay * Math.pow(2, attempt - 1),
      RETRY_CONFIG.maxDelay
    );
    const jitter = Math.random() * 1000;
    const delay = baseDelay + jitter;
    
    console.log(`⏳ Waiting ${Math.round(delay)}ms before retry ${attempt + 1}...`);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return fetchWithRetry(url, attempt + 1);
  }
}

async function streamVideoResponse(response: Response, filename: string): Promise<NextResponse> {
  try {
    // Check if we can use streaming
    const contentLength = response.headers.get('content-length');
    const supportsRanges = response.headers.get('accept-ranges') === 'bytes';
    
    console.log(`📦 Starting video stream processing:`);
    console.log(`📏 Content-Length: ${contentLength ? `${Math.round(parseInt(contentLength) / 1024 / 1024)}MB` : 'unknown'}`);
    console.log(`🔄 Supports ranges: ${supportsRanges}`);

    // For smaller files or when streaming is not supported, read the entire buffer
    if (!contentLength || parseInt(contentLength) < 50 * 1024 * 1024) { // Less than 50MB
      console.log(`📋 Reading entire file into buffer (small file)`);
      const buffer = await response.arrayBuffer();
      
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'video/mp4',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': buffer.byteLength.toString(),
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          // Add CORS headers for better compatibility
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          'Access-Control-Allow-Headers': 'Range, Content-Range, Content-Length',
        },
      });
    }

    // For larger files, try to stream if possible
    console.log(`🌊 Attempting to stream large file`);
    
    // Create streaming response
    const headers = new Headers({
      'Content-Type': 'video/mp4',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Content-Range, Content-Length',
    });

    if (contentLength) {
      headers.set('Content-Length', contentLength);
    }

    // Use the response body directly for streaming
    return new NextResponse(response.body, {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error(`💥 Error in streamVideoResponse:`, error);
    throw error;
  }
}

async function handleRequest(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  
  try {
    console.log(`\n🎬 === VIDEO DOWNLOAD REQUEST STARTED ===`);
    
    const session = await auth();
    if (!session?.user?.id) {
      console.log(`❌ Unauthorized request`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const videoId = parseInt(resolvedParams.id);
    if (isNaN(videoId)) {
      console.log(`❌ Invalid video ID: ${resolvedParams.id}`);
      return NextResponse.json({ error: 'Invalid video ID' }, { status: 400 });
    }

    console.log(`👤 User: ${session.user.email} (ID: ${session.user.id})`);
    console.log(`🎥 Video ID: ${videoId}`);

    // Get video from database
    const video = await getVideoById(videoId);
    if (!video) {
      console.log(`❌ Video not found: ${videoId}`);
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    console.log(`📝 Video: "${video.title}"`);
    console.log(`🔗 UploadThing URL: ${video.uploadthing_url}`);
    console.log(`💾 File size: ${Math.round(video.file_size / 1024 / 1024)}MB`);

    // Check if user owns the video
    if (video.user_id !== session.user.id) {
      console.log(`❌ Access denied - user ${session.user.id} does not own video owned by ${video.user_id}`);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch video with enhanced retry mechanism
    let videoResponse: Response;
    try {
      videoResponse = await fetchWithRetry(video.uploadthing_url);
    } catch {
      console.error(`💥 All fetch attempts failed, falling back to redirect`);
      
      // Final fallback - direct redirect with download parameters
      const safeTitle = video.title.replace(/[^a-zA-Z0-9\s-_]/g, '').replace(/\s+/g, '-');
      const filename = `${safeTitle}.mp4`;
      
      try {
        const downloadUrl = new URL(video.uploadthing_url);
        downloadUrl.searchParams.set('response-content-disposition', `attachment; filename="${filename}"`);
        downloadUrl.searchParams.set('response-content-type', 'video/mp4');
        downloadUrl.searchParams.set('download', '1');
        
        console.log(`🔄 Redirecting to: ${downloadUrl.toString()}`);
        return NextResponse.redirect(downloadUrl.toString());
      } catch (urlError) {
        console.error(`💥 Failed to create redirect URL:`, urlError);
        return NextResponse.json({ 
          error: 'Video temporarily unavailable. Please try again later.' 
        }, { status: 503 });
      }
    }

    // Process and stream the video response
    const safeTitle = video.title.replace(/[^a-zA-Z0-9\s-_]/g, '').replace(/\s+/g, '-');
    const filename = `${safeTitle}.mp4`;
    
    const result = await streamVideoResponse(videoResponse, filename);
    
    const duration = Date.now() - startTime;
    console.log(`✅ Video download completed successfully in ${duration}ms`);
    console.log(`📊 Final filename: ${filename}`);
    
    return result;

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`💥 Fatal error in video download after ${duration}ms:`, error);
    
    return NextResponse.json({ 
      error: 'Internal server error. Please try again later.' 
    }, { status: 500 });
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