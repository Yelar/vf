import { NextRequest, NextResponse } from 'next/server';
import { bundle } from '@remotion/bundler';
import { getCompositions, renderMedia } from '@remotion/renderer';
import path from 'path';
import { v4 as uuid } from 'uuid';
import fs from 'fs/promises';



// Function to combine audio segments into a single audio file
async function combineAudioSegments(segments: Array<{text: string; audio: string; chunkIndex: number; wordCount: number; duration?: number}>): Promise<{audioPath: string; totalDuration: number}> {
  if (!segments || segments.length === 0) {
    throw new Error('No audio segments provided');
  }

  if (segments.length === 1) {
    // Single segment - just convert to file
    const segment = segments[0];
    if (segment.audio.startsWith('data:audio/')) {
      const base64Data = segment.audio.split(',')[1];
      const audioBuffer = Buffer.from(base64Data, 'base64');
      const tempFileName = `audio-${uuid()}.mp3`;
      const tempFilePath = path.join('/tmp', tempFileName);
      await fs.writeFile(tempFilePath, audioBuffer);
      
      // Calculate duration (rough estimate: ~150 words per minute)
      const estimatedDuration = segment.duration || (segment.wordCount * 0.4); // 0.4 seconds per word
      
      return {
        audioPath: `http://localhost:3000/api/temp-audio/${tempFileName}`,
        totalDuration: estimatedDuration
      };
    }
  }

  // Multiple segments - combine them
  const audioBuffers: Buffer[] = [];
  let totalDuration = 0;

  for (const segment of segments) {
    if (segment.audio.startsWith('data:audio/')) {
      const base64Data = segment.audio.split(',')[1];
      const audioBuffer = Buffer.from(base64Data, 'base64');
      audioBuffers.push(audioBuffer);
      
      // Add estimated duration for this segment
      const segmentDuration = segment.duration || (segment.wordCount * 0.4); // 0.4 seconds per word
      totalDuration += segmentDuration;
    }
  }

  // Combine all audio buffers
  const combinedBuffer = Buffer.concat(audioBuffers);
  const tempFileName = `combined-audio-${uuid()}.mp3`;
  const tempFilePath = path.join('/tmp', tempFileName);
  await fs.writeFile(tempFilePath, combinedBuffer);

  console.log(`🎵 Combined ${segments.length} audio segments into single file: ${tempFilePath}`);
  console.log(`⏱️ Total estimated duration: ${totalDuration.toFixed(2)} seconds`);

  return {
    audioPath: `http://localhost:3000/api/temp-audio/${tempFileName}`,
    totalDuration
  };
}

export async function POST(req: NextRequest) {
  try {
    const { speechText, backgroundVideo, audioSrc, audioDuration, bgMusic, fontStyle, textColor, fontSize, textAlignment, backgroundBlur, textAnimation, audioSegments, segmentImages } = await req.json();

    // Get user info from middleware headers
    const userEmail = req.headers.get('x-user-email') || 'unknown';
    
    console.log(`🎬 User ${userEmail} starting Remotion video render`);

    if (!speechText) {
      return NextResponse.json({ error: 'Speech text is required' }, { status: 400 });
    }

    // Handle audio - prioritize segments over single audio source
    let audioFilePath: string | null = null;
    let finalAudioDuration = audioDuration;

    if (audioSegments && audioSegments.length > 0) {
      // Use segmented audio - combine segments
      console.log(`🎵 Processing ${audioSegments.length} audio segments for rendering...`);
      try {
        const combinedAudio = await combineAudioSegments(audioSegments);
        audioFilePath = combinedAudio.audioPath;
        finalAudioDuration = combinedAudio.totalDuration;
        console.log(`✅ Audio segments combined successfully: ${audioFilePath}`);
      } catch (error) {
        console.error('❌ Failed to combine audio segments:', error);
        return NextResponse.json({ 
          error: 'Failed to process audio segments' 
        }, { status: 500 });
      }
    } else if (audioSrc) {
      // Use single audio source (fallback)
      const finalAudioSrc = audioSrc;
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
      audioDuration: finalAudioDuration,
      bgMusic: resolvedBgMusic,
      audioSegments: audioSegments, // Pass segments for subtitle timing
      segmentImages: segmentImages, // Pass segment images for overlay
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
    const videoDuration = finalAudioDuration ? Math.max(finalAudioDuration, 5) : 5; // minimum 5 seconds
    const durationInFrames = finalAudioDuration ? Math.floor(Math.max(finalAudioDuration, 5) * 60) : 300; // 60fps to match preview

    // Override composition duration if we have audio
    if (finalAudioDuration) {
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
      hasSegments: !!(audioSegments && audioSegments.length > 0),
      segmentCount: audioSegments ? audioSegments.length : 0,
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