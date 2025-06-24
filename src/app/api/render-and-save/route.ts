import { NextRequest, NextResponse } from 'next/server';
import { bundle } from '@remotion/bundler';
import { getCompositions, renderMedia } from '@remotion/renderer';
import { auth } from '@/lib/auth';
import { createVideo, updateVideo } from '@/lib/auth-db';
import { sendVideoCompletionEmail } from '@/lib/email';
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
  const maxRetries = 3;
  const timeoutMs = 300000; // 5 minutes for upload
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📤 UploadThing upload attempt ${attempt}/${maxRetries}`);
      console.log(`📁 File: ${filename}`);
      console.log(`📏 Size: ${(videoBuffer.length / 1024 / 1024).toFixed(2)}MB`);
      
      // Use UploadThing SDK for server-side upload with timeout
      const { UTApi, UTFile } = await import("uploadthing/server");
      
      // Initialize UTApi with timeout configuration
      const utapi = new UTApi({
        logLevel: 'Info'
      });

      // Create a UTFile object with proper metadata
      const fileObject = new UTFile([videoBuffer], filename, { 
        type: 'video/mp4',
        lastModified: Date.now()
      });
      
      console.log(`⏳ Starting upload to UploadThing...`);
      const uploadStartTime = Date.now();
      
      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Upload timeout after ${timeoutMs}ms`));
        }, timeoutMs);
      });
      
      // Race the upload against the timeout
      const uploadResult = await Promise.race([
        utapi.uploadFiles([fileObject]),
        timeoutPromise
      ]);
      
      const uploadDuration = Date.now() - uploadStartTime;
      console.log(`⏱️ Upload completed in ${uploadDuration}ms`);
      
      if (uploadResult && uploadResult[0] && uploadResult[0].data) {
        const result = uploadResult[0].data;
        console.log(`✅ UploadThing upload successful:`);
        console.log(`🔗 URL: ${result.url}`);
        console.log(`🔑 Key: ${result.key}`);
        console.log(`📊 Final size: ${(result.size / 1024 / 1024).toFixed(2)}MB`);
        
        return {
          url: result.url,
          key: result.key
        };
      }

      throw new Error('UploadThing upload failed - no data returned');
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ UploadThing upload attempt ${attempt} failed:`, errorMessage);
      
      if (attempt === maxRetries) {
        console.error(`💥 All ${maxRetries} upload attempts failed`);
        return null;
      }
      
      // Wait before retry (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      console.log(`⏳ Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return null;
}

export async function POST(req: NextRequest) {
  try {
    // Check for required environment variables
    if (!process.env.UPLOADTHING_TOKEN) {
      console.error('Missing UPLOADTHING_TOKEN environment variable');
      return NextResponse.json({ error: 'Server configuration error - missing upload token' }, { status: 500 });
    }

    if (!process.env.RESEND_API_KEY) {
      console.error('Missing RESEND_API_KEY environment variable');
      return NextResponse.json({ error: 'Server configuration error - missing email service' }, { status: 500 });
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
    const userName = session.user.name || 'User';
    console.log(`🎬 User ${userEmail} starting async video render and save to UploadThing`);

    if (!speechText) {
      return NextResponse.json({ error: 'Speech text is required' }, { status: 400 });
    }

    if (!videoTitle) {
      return NextResponse.json({ error: 'Video title is required' }, { status: 400 });
    }

    // Create video record immediately with placeholder URL
    const videoMetadata = {
      speechText,
      backgroundVideo,
      audioSrc: !!audioSrc,
      audioDuration,
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
      '', // Placeholder URL - will be updated after processing
      '', // Placeholder key - will be updated after processing
      0, // Placeholder size - will be updated after processing
      videoMetadata,
      videoDescription,
      audioDuration || 5 // Estimated duration
    );

    if (!savedVideo) {
      return NextResponse.json({ error: 'Failed to create video record' }, { status: 500 });
    }

    // Return immediately with processing status and video ID
    const processingId = uuid();
    
    // Start async video processing
    processVideoAsync({
      processingId,
      videoId: savedVideo.id, // Pass the created video ID
      userId: parseInt(session.user.id),
      userEmail: session.user.email!,
      userName,
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
    }).catch(error => {
      console.error(`❌ Async video processing failed for ${processingId}:`, error);
    });

    console.log(`✅ Video processing started with ID: ${processingId}`);

    return NextResponse.json({ 
      success: true,
      processingId,
      videoId: savedVideo.id, // Return the video ID so frontend can navigate
      message: 'Video is being processed. You will receive an email notification when it\'s ready!',
      estimatedTime: '2-5 minutes'
    });

  } catch (error) {
    console.error('❌ Error starting video processing:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// Async function to process video in the background
async function processVideoAsync({
  processingId,
  videoId,
  userEmail,
  userName,
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
}: {
  processingId: string;
  videoId: number;
  userId: number;
  userEmail: string;
  userName: string;
  speechText: string;
  backgroundVideo?: string;
  audioSrc?: string;
  audioDuration?: number;
  bgMusic?: string;
  fontStyle?: string;
  textColor?: string;
  fontSize?: number;
  textAlignment?: string;
  backgroundBlur?: number;
  textAnimation?: string;
  audioSegments?: Array<{text: string; audio: string; chunkIndex: number; wordCount: number; duration?: number}>;
  segmentImages?: Array<{url: string; text: string}> | null;
  videoTitle: string;
  videoDescription?: string;
}) {
  try {
    console.log(`🎬 Starting async video processing for ${processingId}`);

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
        throw new Error('Failed to process audio segments');
      }
    } else if (audioSrc) {
      // Use single audio source (fallback)
      const finalAudioSrc = audioSrc;
      if (finalAudioSrc.startsWith('blob:')) {
        console.error('❌ Blob URL detected in audioSrc - Remotion cannot handle blob URLs');
        throw new Error('Blob URLs are not supported for server-side rendering. Audio segments should provide base64 data.');
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
          throw new Error('Failed to process audio data');
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
      onProgress: (p) => console.log(`Bundling ${processingId}: ${p}%`),
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
      throw new Error('SampleVideo composition not found');
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
    const outputPath = path.join('/tmp', `remotion-out-${processingId}.mp4`);

    console.log(`🎬 Starting Remotion render for ${processingId}:`, {
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
      
      console.log(`✅ Video ${processingId} rendered successfully, size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);

      // Upload to UploadThing
      const uploadResult = await uploadToUploadThing(fileBuffer, `${videoTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.mp4`);
      
      if (!uploadResult) {
        throw new Error('Failed to upload video to UploadThing');
      }

      console.log(`✅ Video ${processingId} uploaded to UploadThing: ${uploadResult.url}`);

      // Update video record with actual URL and file info
      const updateSuccess = updateVideo(
        videoId,
        uploadResult.url,
        uploadResult.key,
        fileSize,
        videoDuration
      );

      if (!updateSuccess) {
        throw new Error('Failed to update video record');
      }

      // Send completion email
      const libraryUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/library`;
      
      try {
        await sendVideoCompletionEmail({
          to: userEmail,
          name: userName,
          videoTitle,
          videoDuration,
          libraryUrl,
          videoUrl: uploadResult.url
        });
        console.log(`📧 Video completion email sent for ${processingId}`);
      } catch (emailError) {
        console.error(`❌ Failed to send completion email for ${processingId}:`, emailError);
        // Don't throw here - video is still successfully created
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

      console.log(`✅ Video ${processingId} successfully rendered, uploaded, and saved to library`);

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
    console.error(`❌ Error processing video ${processingId}:`, error);
    
    // Send error notification email (optional)
    try {
      await sendVideoCompletionEmail({
        to: userEmail,
        name: userName,
        videoTitle: `${videoTitle} (Failed)`,
        videoDuration: 0,
        libraryUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/library`,
      });
    } catch (emailError) {
      console.error(`❌ Failed to send error notification email for ${processingId}:`, emailError);
    }
  }
} 