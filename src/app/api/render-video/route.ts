import { NextRequest, NextResponse } from 'next/server';
import { bundle } from '@remotion/bundler';
import { getCompositions, renderMedia } from '@remotion/renderer';
import path from 'path';
import { v4 as uuid } from 'uuid';
import fs from 'fs/promises';

// Function to combine audio segments on the server
async function combineAudioSegments(segments: Array<{audio: string}>): Promise<string> {
  if (segments.length === 0) throw new Error('No audio segments provided');
  if (segments.length === 1) return segments[0].audio;

  console.log(`🔗 Combining ${segments.length} audio segments for Remotion`);
  
  try {
    // For server-side combination, we'll create a simple concatenation
    // by converting each base64 audio to buffer and combining them
    const audioBuffers: Buffer[] = [];
    
    for (const segment of segments) {
      // Extract base64 data from data URL
      const base64Data = segment.audio.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      audioBuffers.push(buffer);
    }
    
    // Simple concatenation - this works for MP3 files
    const combinedBuffer = Buffer.concat(audioBuffers);
    const combinedBase64 = combinedBuffer.toString('base64');
    
    console.log(`✅ Successfully combined ${segments.length} audio segments`);
    return `data:audio/mpeg;base64,${combinedBase64}`;
    
  } catch (error) {
    console.error('❌ Error combining audio segments:', error);
    console.log('🔄 Falling back to first segment');
    return segments[0].audio;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { speechText, backgroundVideo, audioSrc, audioDuration, bgMusic, audioSegments } = await req.json();

    // Get user info from middleware headers
    const userEmail = req.headers.get('x-user-email') || 'unknown';
    
    // Log segments info for debugging (audioSegments will be used for future subtitle generation)
    if (audioSegments) {
      console.log(`📝 Received ${audioSegments.length} audio segments for future subtitle precision`);
    }
    console.log(`🎬 User ${userEmail} starting Remotion video render`);

    if (!speechText) {
      return NextResponse.json({ error: 'Speech text is required' }, { status: 400 });
    }

    // Handle audio - prefer segments, fallback to single audio
    let finalAudioSrc = audioSrc;
    
    if (audioSegments && audioSegments.length > 0) {
      console.log(`🎵 Processing ${audioSegments.length} audio segments for Remotion`);
      try {
        finalAudioSrc = await combineAudioSegments(audioSegments);
        console.log('✅ Audio segments processed for Remotion');
      } catch (error) {
        console.error('❌ Error processing audio segments:', error);
        if (!audioSrc) {
          return NextResponse.json({ 
            error: 'Failed to process audio segments and no fallback audio provided' 
          }, { status: 400 });
        }
        console.log('🔄 Falling back to single audio source');
      }
    }

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
      audioSegments,
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
      hasAudio: !!audioFilePath,
      audioPath: audioFilePath,
      hasSegments: !!(audioSegments && audioSegments.length > 0),
      segmentCount: audioSegments ? audioSegments.length : 0,
      hasBackground: !!resolvedBackgroundVideo,
      backgroundVideoUrl: resolvedBackgroundVideo,
      hasBgMusic: !!resolvedBgMusic,
      bgMusicUrl: resolvedBgMusic
    });

    try {
      // Render the video with high quality settings
      await renderMedia({
        serveUrl: bundleLocation,
        composition: comp,
        codec: 'h264',
        outputLocation: outputPath,
        inputProps,
        // Ultra high quality settings for smooth playback
        crf: 14, // Even higher quality (lower = better, 14 is premium quality)
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
        // Frame rate consistency
        everyNthFrame: 1, // Render every frame for smoothness
        concurrency: 1, // Single thread for consistency
        // Quality settings
        jpegQuality: 95, // High JPEG quality for frames
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