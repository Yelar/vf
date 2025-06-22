import { NextRequest, NextResponse } from 'next/server';
import { bundle } from '@remotion/bundler';
import { getCompositions, renderMedia } from '@remotion/renderer';
import { auth } from '@/lib/auth';
import { createVideo } from '@/lib/auth-db';
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

// Function to upload video to UploadThing
async function uploadToUploadThing(videoBuffer: Buffer, filename: string): Promise<{ url: string; key: string } | null> {
  try {
    // Use UploadThing SDK for server-side upload
    const { UTApi, UTFile } = await import("uploadthing/server");
    const utapi = new UTApi();

    // Create a UTFile object which works in Node.js environment
    const fileObject = new UTFile([videoBuffer], filename, { type: 'video/mp4' });
    
    // Upload to UploadThing
    const uploadResult = await utapi.uploadFiles([fileObject]);
    
    if (uploadResult && uploadResult[0] && uploadResult[0].data) {
      console.log('✅ UploadThing upload successful:', uploadResult[0].data.url);
      return {
        url: uploadResult[0].data.url,
        key: uploadResult[0].data.key
      };
    }

    console.error('UploadThing upload failed - no data returned:', uploadResult);
    return null;
  } catch (error) {
    console.error('Error uploading to UploadThing:', error);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check for required environment variables
    if (!process.env.UPLOADTHING_TOKEN) {
      console.error('Missing UPLOADTHING_TOKEN environment variable');
      return NextResponse.json({ error: 'Server configuration error - missing upload token' }, { status: 500 });
    }

    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      speechText, 
      backgroundVideo, 
      audioSrc, 
      audioDuration, 
      bgMusic, 
      fontStyle, 
      textColor, 
      fontSize, 
      textAlignment, 
      backgroundBlur, 
      textAnimation, 
      audioSegments,
      segmentImages,
      videoTitle,
      videoDescription
    } = await req.json();

    const userEmail = session.user.email || 'unknown';
    console.log(`🎬 User ${userEmail} starting video render and save to UploadThing`);

    if (!speechText) {
      return NextResponse.json({ error: 'Speech text is required' }, { status: 400 });
    }

    if (!videoTitle) {
      return NextResponse.json({ error: 'Video title is required' }, { status: 400 });
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
      resolvedBackgroundVideo = `http://localhost:3000${backgroundVideo}`;
    }

    let resolvedBgMusic = bgMusic;
    if (bgMusic && bgMusic.startsWith('/')) {
      resolvedBgMusic = `http://localhost:3000${bgMusic}`;
    }

    // Get compositions
    const inputProps = {
      speechText,
      backgroundVideo: resolvedBackgroundVideo,
      audioSrc: audioFilePath,
      audioDuration: finalAudioDuration,
      bgMusic: resolvedBgMusic,
      audioSegments: audioSegments,
      segmentImages: segmentImages,
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

    // Find the SampleVideo composition
    let comp = comps.find((c) => c.id === 'SampleVideo');
    if (!comp) {
      return NextResponse.json({ error: 'SampleVideo composition not found' }, { status: 404 });
    }

    // Calculate duration based on audio or use default
    const videoDuration = finalAudioDuration ? Math.max(finalAudioDuration, 5) : 5;
    const durationInFrames = finalAudioDuration ? Math.floor(Math.max(finalAudioDuration, 5) * 60) : 300;

    // Override composition duration if we have audio
    if (finalAudioDuration) {
      comp = {
        ...comp,
        durationInFrames,
      };
    }

    // Create temporary output file
    const outputPath = path.join('/tmp', `remotion-out-${uuid()}.mp4`);

    console.log('🎬 Starting Remotion render for UploadThing save:', {
      composition: comp.id,
      duration: videoDuration,
      frames: durationInFrames,
      title: videoTitle,
    });

    try {
      // Render the video with high quality settings
      await renderMedia({
        serveUrl: bundleLocation,
        composition: comp,
        codec: 'h264',
        outputLocation: outputPath,
        inputProps,
        crf: 10,
        pixelFormat: 'yuv420p',
        audioBitrate: '320k',
        enforceAudioTrack: false,
        muted: false,
        overwrite: true,
        chromiumOptions: {
          ignoreCertificateErrors: false,
          disableWebSecurity: false,
          gl: 'swiftshader',
        },
        everyNthFrame: 1,
        concurrency: 1,
        jpegQuality: 100,
        scale: 1,
      });

      // Read the rendered video file
      const fileBuffer = await fs.readFile(outputPath);
      const fileSize = fileBuffer.length;
      
      console.log(`✅ Video rendered successfully, size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);

      // Upload to UploadThing
      const uploadResult = await uploadToUploadThing(fileBuffer, `${videoTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.mp4`);
      
      if (!uploadResult) {
        return NextResponse.json({ error: 'Failed to upload video to UploadThing' }, { status: 500 });
      }

      console.log(`✅ Video uploaded to UploadThing: ${uploadResult.url}`);

      // Save video metadata to database
      const videoMetadata = {
        speechText,
        backgroundVideo,
        audioSrc: !!audioFilePath,
        audioDuration: finalAudioDuration,
        bgMusic,
        fontStyle,
        textColor,
        fontSize,
        textAlignment,
        backgroundBlur,
        textAnimation,
        segmentCount: audioSegments ? audioSegments.length : 0,
      };

      const savedVideo = await createVideo(
        parseInt(session.user.id),
        videoTitle,
        uploadResult.url,
        uploadResult.key,
        fileSize,
        videoMetadata,
        videoDescription,
        videoDuration
      );

      if (!savedVideo) {
        return NextResponse.json({ error: 'Failed to save video metadata' }, { status: 500 });
      }

      // Clean up temporary files
      await fs.unlink(outputPath).catch(() => {});
      if (audioFilePath && audioFilePath.startsWith('http://localhost:3000/api/temp-audio/')) {
        const tempFileName = audioFilePath.split('/').pop();
        if (tempFileName) {
          const tempFilePath = path.join('/tmp', tempFileName);
          await fs.unlink(tempFilePath).catch(() => {});
          console.log(`🧹 Cleaned up temporary audio file: ${tempFilePath}`);
        }
      }

      console.log('✅ Video successfully rendered, uploaded, and saved to library');

      return NextResponse.json({ 
        success: true,
        video: savedVideo,
        message: 'Video saved to your library!'
      });

    } catch (renderError) {
      // Clean up temporary files in case of error
      await fs.unlink(outputPath).catch(() => {});
      if (audioFilePath && audioFilePath.startsWith('http://localhost:3000/api/temp-audio/')) {
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
    console.error('❌ Error rendering and saving video:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
} 