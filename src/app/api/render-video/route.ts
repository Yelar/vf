import { NextRequest, NextResponse } from 'next/server';
import { bundle } from '@remotion/bundler';
import { getCompositions, renderMedia } from '@remotion/renderer';
import path from 'path';
import { v4 as uuid } from 'uuid';
import fs from 'fs/promises';

export async function POST(req: NextRequest) {
  try {
    const { speechText, backgroundVideo, audioSrc, audioDuration } = await req.json();

    const entry = path.join(process.cwd(), 'src', 'remotion', 'Root.tsx');

    // Bundle Remotion project
    const bundleLocation = await bundle({
      entryPoint: entry,
      outDir: path.join(process.cwd(), 'out'),
      onProgress: (p) => console.log(`Bundling: ${p}%`),
      webpackOverride: (config) => config,
    });

    // Convert relative paths to absolute URLs for Remotion
    let resolvedBackgroundVideo = backgroundVideo;
    if (backgroundVideo && backgroundVideo.startsWith('/')) {
      // Convert relative path to absolute URL for server-side rendering
      resolvedBackgroundVideo = `http://localhost:3000${backgroundVideo}`;
    }

    // Get compositions
    const inputProps = {
      speechText,
      backgroundVideo: resolvedBackgroundVideo,
      audioSrc,
      audioDuration,
    };

    const comps = await getCompositions(bundleLocation, {
      inputProps,
    });

    // Find the SampleVideo composition (the main one the dashboard expects)
    let comp = comps.find((c) => c.id === 'SampleVideo');
    if (!comp) {
      return NextResponse.json({ error: 'SampleVideo composition not found' }, { status: 404 });
    }

    // Calculate duration based on audio or use default
    const videoDuration = audioDuration ? Math.max(audioDuration, 5) : 5; // minimum 5 seconds
    const durationInFrames = Math.floor(videoDuration * 30); // 30 fps

    // Override composition duration if we have audio
    if (audioDuration) {
      comp = {
        ...comp,
        durationInFrames,
      };
    }

    // Create temporary output file
    const outputPath = path.join('/tmp', `remotion-out-${uuid()}.mp4`);

    console.log('🎬 Starting Remotion render:', {
      composition: comp.id,
      duration: videoDuration,
      frames: durationInFrames,
      speechText: speechText?.slice(0, 50) + '...',
      hasAudio: !!audioSrc,
      hasBackground: !!resolvedBackgroundVideo,
      backgroundVideoUrl: resolvedBackgroundVideo
    });

    // Render the video with high quality settings
    await renderMedia({
      serveUrl: bundleLocation,
      composition: comp,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps,
      // High quality settings - using CRF for best quality
      crf: 16, // Very high quality (lower = better, 16 is excellent quality)
      pixelFormat: 'yuv420p',
      audioBitrate: '320k', // High quality audio
      // Note: Can't use videoBitrate with CRF, CRF is better for quality
    });

    // Read the file and return as buffer
    const fileBuffer = await fs.readFile(outputPath);
    
    // Clean up temporary file
    await fs.unlink(outputPath).catch(() => {});

    console.log('✅ Remotion render completed successfully');

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': 'attachment; filename="video.mp4"',
      },
    });
  } catch (error) {
    console.error('❌ Error rendering video:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
} 