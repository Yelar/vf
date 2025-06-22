import { NextRequest, NextResponse } from 'next/server';
import { bundle } from '@remotion/bundler';
import { getCompositions, renderMedia } from '@remotion/renderer';
import path from 'path';
import { v4 as uuid } from 'uuid';
import fs from 'fs/promises';



export async function POST(req: NextRequest) {
  try {
    const { speechText, backgroundVideo, audioSrc, audioDuration, bgMusic, fontStyle, textColor, fontSize, textAlignment, backgroundBlur, textAnimation } = await req.json();

    // Get user info from middleware headers
    const userEmail = req.headers.get('x-user-email') || 'unknown';
    
    console.log(`🎬 User ${userEmail} starting Remotion video render`);

    if (!speechText) {
      return NextResponse.json({ error: 'Speech text is required' }, { status: 400 });
    }

    // Use single audio source
    const finalAudioSrc = audioSrc;

    // Handle audio for Remotion - convert data URLs to temporary files
    let audioFilePath: string | null = null;
    if (finalAudioSrc) {
      if (finalAudioSrc.startsWith('blob:')) {
        console.error('❌ Blob URL detected in audioSrc - Remotion cannot handle blob URLs');
        return NextResponse.json({ 
          error: 'Blob URLs are not supported for server-side rendering. Audio segments should provide base64 data.' 
        }, { status: 400 });
      }
      
      if (finalAudioSrc.startsWith('data:audio/')) {
        // Convert base64 data URL to temporary file for Remotion
        try {
          const base64Data = finalAudioSrc.split(',')[1];
          const audioBuffer = Buffer.from(base64Data, 'base64');
          const tempFileName = `audio-${uuid()}.mp3`;
          const tempFilePath = path.join('/tmp', tempFileName);
          await fs.writeFile(tempFilePath, audioBuffer);
          
          // Create HTTP URL for Remotion to access the file
          audioFilePath = `http://localhost:3000/api/temp-audio/${tempFileName}`;
          console.log(`🎵 Audio saved to temporary file: ${tempFilePath}`);
          console.log(`🌐 Audio accessible at: ${audioFilePath}`);
        } catch (error) {
          console.error('❌ Error saving audio to temporary file:', error);
          return NextResponse.json({ 
            error: 'Failed to process audio data' 
          }, { status: 500 });
        }
      } else {
        // Use the audio source directly if it's already a file path/URL
        audioFilePath = finalAudioSrc;
      }
    }

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

    let resolvedBgMusic = bgMusic;
    if (bgMusic && bgMusic.startsWith('/')) {
      // Convert relative path to absolute URL for server-side rendering
      resolvedBgMusic = `http://localhost:3000${bgMusic}`;
    }

    // Get compositions
    const inputProps = {
      speechText,
      backgroundVideo: resolvedBackgroundVideo,
      audioSrc: audioFilePath, // Use the file path instead of data URL
      audioDuration,
      bgMusic: resolvedBgMusic,
      fontStyle,
      textColor,
      fontSize,
      textAlignment,
      backgroundBlur,
      textAnimation,
    };

    const comps = await getCompositions(bundleLocation, {
      inputProps,
    });

    // Find the SampleVideo composition (the main one the dashboard expects)
    let comp = comps.find((c) => c.id === 'SampleVideo');
    if (!comp) {
      return NextResponse.json({ error: 'SampleVideo composition not found' }, { status: 404 });
    }

    // Calculate duration based on audio or use default - MATCH PREVIEW EXACTLY
    const videoDuration = audioDuration ? Math.max(audioDuration, 5) : 5; // minimum 5 seconds
    const durationInFrames = audioDuration ? Math.floor(Math.max(audioDuration, 5) * 60) : 300; // 60fps to match preview

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
      hasAudio: !!audioFilePath,
      audioPath: audioFilePath,
      hasSegments: false,
      segmentCount: 0,
      hasBackground: !!resolvedBackgroundVideo,
      backgroundVideoUrl: resolvedBackgroundVideo,
      hasBgMusic: !!resolvedBgMusic,
      bgMusicUrl: resolvedBgMusic,
      fontStyle: fontStyle || 'default',
      textColor: textColor || 'default',
      fontSize: fontSize || 80,
      textAlignment: textAlignment || 'center',
      backgroundBlur: backgroundBlur || false,
      textAnimation: textAnimation || 'fade-in'
    });

    try {
      // Render the video with ULTRA HIGH quality settings - MATCH PREVIEW QUALITY
      await renderMedia({
        serveUrl: bundleLocation,
        composition: comp,
        codec: 'h264',
        outputLocation: outputPath,
        inputProps,
        // ULTRA HIGH QUALITY SETTINGS
        crf: 10, // Maximum quality (lower = better, 10 is ultra premium)
        pixelFormat: 'yuv420p',
        audioBitrate: '320k', // High quality audio
        // Additional optimization settings for smooth video
        enforceAudioTrack: false, // Don't enforce if no audio
        muted: false,
        overwrite: true,
        // Performance optimizations
        chromiumOptions: {
          // Disable GPU sandbox for better performance
          ignoreCertificateErrors: false,
          disableWebSecurity: false,
          gl: 'swiftshader',
        },
        // Frame rate consistency - 60fps for ultra smoothness
        everyNthFrame: 1, // Render every frame for smoothness
        concurrency: 1, // Single thread for consistency
        // Quality settings
        jpegQuality: 100, // Maximum JPEG quality for frames
        scale: 1, // No scaling for maximum quality
      });

      // Read the file and return as buffer
      const fileBuffer = await fs.readFile(outputPath);
      
      // Clean up temporary files
      await fs.unlink(outputPath).catch(() => {});
      if (audioFilePath && audioFilePath.startsWith('http://localhost:3000/api/temp-audio/')) {
        // Extract filename from URL and delete the actual file
        const tempFileName = audioFilePath.split('/').pop();
        if (tempFileName) {
          const tempFilePath = path.join('/tmp', tempFileName);
          await fs.unlink(tempFilePath).catch(() => {});
          console.log(`🧹 Cleaned up temporary audio file: ${tempFilePath}`);
        }
      }

      console.log('✅ Remotion render completed successfully with segmented audio');

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'video/mp4',
          'Content-Disposition': 'attachment; filename="video.mp4"',
      },
    });
    } catch (renderError) {
      // Clean up temporary files in case of error
      await fs.unlink(outputPath).catch(() => {});
      if (audioFilePath && audioFilePath.startsWith('http://localhost:3000/api/temp-audio/')) {
        // Extract filename from URL and delete the actual file
        const tempFileName = audioFilePath.split('/').pop();
        if (tempFileName) {
          const tempFilePath = path.join('/tmp', tempFileName);
          await fs.unlink(tempFilePath).catch(() => {});
          console.log(`🧹 Cleaned up temporary audio file after error: ${tempFilePath}`);
        }
      }
      throw renderError;
    }
  } catch (error) {
    console.error('❌ Error rendering video:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}