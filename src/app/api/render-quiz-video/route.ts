import { NextRequest, NextResponse } from 'next/server';
import { bundle } from '@remotion/bundler';
import { getCompositions, renderMedia } from '@remotion/renderer';
import { auth } from '@/lib/auth';
import { createVideo, updateVideo } from '@/lib/auth-db';
import { sendVideoCompletionEmail } from '@/lib/email';
import path from 'path';
import { v4 as uuid } from 'uuid';
import fs from 'fs/promises';

// Define types for segments and segmentImages
interface QuizSegment {
  id?: string;
  type: 'question' | 'choices' | 'wait' | 'answer' | 'text';
  text: string;
  audio?: string;
  duration?: number;
  image?: string;
  originalIndex?: number;
}

interface SegmentImage {
  segmentIndex: number;
  imageUrl: string;
  description?: string;
}

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

export async function POST(request: NextRequest) {
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

    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      segments,
      font = 'montserrat',
      fontSize = 85,
      textColor = 'white',
      textAlignment = 'center',
      backgroundBlur = false,
      backgroundVideo,
      bgMusic,
      segmentImages,
      videoTitle = 'Quiz Video',
      videoDescription
    } = body;

    if (!segments || !Array.isArray(segments) || segments.length === 0) {
      return NextResponse.json({ error: 'No quiz segments provided' }, { status: 400 });
    }

    if (!videoTitle) {
      return NextResponse.json({ error: 'Video title is required' }, { status: 400 });
    }

    const userEmail = session.user.email || 'unknown';
    const userName = session.user.name || 'User';
    console.log(`🧠 User ${userEmail} starting quiz video render and save to UploadThing`);

    // Filter audio segments to only include those with actual audio data
    // (excludes 'wait' segments which have duration but no audio)
    const audioSegments = segments.map((seg: QuizSegment, index: number) => ({
      text: seg.text,
      audio: seg.audio || '',
      chunkIndex: index,
      wordCount: seg.text.split(' ').length,
      duration: seg.duration || 2
    })).filter((seg) => seg.audio && seg.audio.trim() !== '');

    console.log(`🎵 Audio segments (with actual audio): ${audioSegments.length}/${segments.length}`);
    console.log(`📋 Segments breakdown:`, segments.map((seg: QuizSegment) => ({
      type: seg.type,
      hasAudio: !!(seg.audio && seg.audio.trim()),
      duration: seg.duration || 2
    })));

    // Calculate total duration (includes ALL segments, even those without audio)
    const totalDuration = segments.reduce((acc: number, seg: QuizSegment) => {
      return acc + (seg.duration || 2);
    }, 0);

    console.log(`⏱️ Total video duration: ${totalDuration}s (includes wait segments without audio)`);

    // Create video record immediately with placeholder URL
    const videoMetadata = {
      speechText: segments.map((seg: QuizSegment) => seg.text).join(' '),
      backgroundVideo,
      audioSrc: audioSegments.length > 0, // Only true if we have actual audio segments
      audioDuration: totalDuration, // Use total duration, not just audio duration
      bgMusic,
      fontStyle: font,
      textColor,
      fontSize,
      textAlignment,
      backgroundBlur,
      textAnimation: 'none',
      segmentCount: segments.length,
      isQuizMode: true, // Mark as quiz video
    };

    const savedVideo = await createVideo(
      parseInt(session.user.id),
      videoTitle,
      '', // Placeholder URL - will be updated after processing
      '', // Placeholder key - will be updated after processing
      0, // Placeholder size - will be updated after processing
      videoMetadata,
      videoDescription,
      totalDuration
    );

    if (!savedVideo) {
      return NextResponse.json({ error: 'Failed to create video record' }, { status: 500 });
    }

    // Return immediately with processing status and video ID
    const processingId = uuid();
    
    // Start async quiz video processing
    processQuizVideoAsync({
      processingId,
      videoId: savedVideo.id,
      userEmail: session.user.email!,
      userName,
      segments: segments as QuizSegment[],
      font,
      fontSize,
      textColor,
      textAlignment,
      backgroundBlur,
      backgroundVideo,
      bgMusic,
      segmentImages: segmentImages as SegmentImage[],
      videoTitle,
      audioSegments
    }).catch(error => {
      console.error(`❌ Async quiz video processing failed for ${processingId}:`, error);
    });

    console.log(`✅ Quiz video processing started with ID: ${processingId}`);

    return NextResponse.json({ 
      success: true,
      processingId,
      videoId: savedVideo.id,
      message: 'Quiz video is being processed. You will receive an email notification when it\'s ready!',
      estimatedTime: '2-5 minutes'
    });

  } catch (error) {
    console.error('❌ Quiz video render error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to render quiz video',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

// Async function to process quiz video in the background
async function processQuizVideoAsync({
  processingId,
  videoId,
  userEmail,
  userName,
  segments,
  font,
  fontSize,
  textColor,
  textAlignment,
  backgroundBlur,
  backgroundVideo,
  bgMusic,
  segmentImages,
  videoTitle,
  audioSegments
}: {
  processingId: string;
  videoId: number;
  userEmail: string;
  userName: string;
  segments: QuizSegment[];
  font: string;
  fontSize: number;
  textColor: string;
  textAlignment: string;
  backgroundBlur: boolean;
  backgroundVideo?: string;
  bgMusic?: string | null;
  segmentImages?: SegmentImage[];
  videoTitle: string;
  audioSegments: Array<{text: string; audio: string; chunkIndex: number; wordCount: number; duration?: number}>;
}) {
  try {
    console.log(`🧠 Starting async quiz video processing for ${processingId}`);

    // Handle audio segments
    let audioFilePath: string | null = null;
    let finalAudioDuration = 0;
    
    if (audioSegments.length > 0) {
      console.log(`🎤 Processing ${audioSegments.length} audio segments for combination...`);
      try {
        const combinedAudio = await combineAudioSegments(audioSegments);
        audioFilePath = combinedAudio.audioPath;
        finalAudioDuration = combinedAudio.totalDuration;
        console.log(`✅ Quiz audio segments combined successfully: ${audioFilePath}`);
        console.log(`🎵 Combined audio duration: ${finalAudioDuration}s`);
      } catch (error) {
        console.error('❌ Failed to combine quiz audio segments:', error);
        throw new Error('Failed to process quiz audio segments');
      }
    } else {
      console.log(`⚠️ No audio segments to combine (quiz may contain only wait segments)`);
      // Set final audio duration to 0 since there's no actual audio
      finalAudioDuration = 0;
    }

    const entry = path.join(process.cwd(), 'src', 'remotion', 'Root.tsx');

    // Bundle Remotion project
    const bundleLocation = await bundle({
      entryPoint: entry,
      outDir: path.join(process.cwd(), 'out'),
      onProgress: (p) => console.log(`Bundling quiz ${processingId}: ${p}%`),
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

    // Prepare input props for QuizVideo
    const inputProps = {
      segments: segments.map((seg: QuizSegment) => ({
        id: seg.id || uuid(),
        type: seg.type,
        text: seg.text,
        audio: seg.audio,
        duration: seg.duration || 2,
        image: seg.image,
        originalIndex: seg.originalIndex
      })),
      font,
      fontSize,
      textColor,
      textAlignment,
      backgroundBlur,
      backgroundVideo: resolvedBackgroundVideo,
      bgMusic: resolvedBgMusic,
      segmentImages
    };

    console.log('🎨 Input props prepared for QuizVideo');

    // Get compositions
    const comps = await getCompositions(bundleLocation, {
      inputProps,
    });

    // Find the QuizVideo composition
    let comp = comps.find((c) => c.id === 'QuizVideo');
    if (!comp) {
      throw new Error('QuizVideo composition not found');
    }

    // Calculate duration based on segments - INCLUDE ALL SEGMENTS
    // Don't rely solely on audio duration since wait segments have no audio but still take time
    const totalSegmentDuration = segments.reduce((acc: number, seg: QuizSegment) => {
      return acc + (seg.duration || 2);
    }, 0);
    
    console.log(`📊 Duration calculations:`, {
      audioOnlyDuration: finalAudioDuration,
      totalSegmentDuration,
      segments: segments.length
    });
    
    // Use the longer of the two durations to ensure we capture all content
    const videoDuration = Math.max(finalAudioDuration || 0, totalSegmentDuration);
    const durationInFrames = Math.floor(videoDuration * 60); // 60 FPS

    console.log(`⏱️ Final video duration: ${videoDuration}s (${durationInFrames} frames)`);

    // Override composition duration
    comp = {
      ...comp,
      durationInFrames,
    };

    // Create temporary output file
    const outputPath = path.join('/tmp', `quiz-video-${processingId}.mp4`);

    console.log(`🎬 Starting QuizVideo render for ${processingId}:`, {
      composition: comp.id,
      duration: videoDuration,
      frames: durationInFrames,
      title: videoTitle,
    });

    try {
      // Render the quiz video with high quality settings
      await renderMedia({
        serveUrl: bundleLocation,
        composition: comp,
        codec: 'h264',
        outputLocation: outputPath,
        inputProps,
        crf: 18, // Good quality
        pixelFormat: 'yuv420p',
        audioBitrate: '192k',
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
        jpegQuality: 90,
        scale: 1,
      });

      // Read the rendered video file
      const fileBuffer = await fs.readFile(outputPath);
      const fileSize = fileBuffer.length;
      
      console.log(`✅ Quiz video ${processingId} rendered successfully, size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);

      // Upload to UploadThing
      const uploadResult = await uploadToUploadThing(fileBuffer, `quiz-${videoTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.mp4`);
      
      if (!uploadResult) {
        throw new Error('Failed to upload quiz video to UploadThing');
      }

      console.log(`✅ Quiz video ${processingId} uploaded to UploadThing: ${uploadResult.url}`);

      // Update video record with actual URL and file info
      const updateSuccess = updateVideo(
        videoId,
        uploadResult.url,
        uploadResult.key,
        fileSize,
        videoDuration
      );

      if (!updateSuccess) {
        throw new Error('Failed to update quiz video record');
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
        console.log(`📧 Quiz video completion email sent for ${processingId}`);
      } catch (emailError) {
        console.error(`❌ Failed to send quiz video completion email for ${processingId}:`, emailError);
        // Don't throw here - video is still successfully created
      }

      // Clean up temporary files
      await fs.unlink(outputPath).catch(() => {});
      if (audioFilePath && audioFilePath.startsWith('http://localhost:3000/api/temp-audio/')) {
        const tempFileName = audioFilePath.split('/').pop();
        if (tempFileName) {
          const tempFilePath = path.join('/tmp', tempFileName);
          await fs.unlink(tempFilePath).catch(() => {});
          console.log(`🧹 Cleaned up temporary quiz audio file: ${tempFilePath}`);
        }
      }

      console.log(`✅ Quiz video ${processingId} successfully rendered, uploaded, and saved to library`);

    } catch (renderError) {
      // Clean up temporary files in case of error
      await fs.unlink(outputPath).catch(() => {});
      if (audioFilePath && audioFilePath.startsWith('http://localhost:3000/api/temp-audio/')) {
        const tempFileName = audioFilePath.split('/').pop();
        if (tempFileName) {
          const tempFilePath = path.join('/tmp', tempFileName);
          await fs.unlink(tempFilePath).catch(() => {});
          console.log(`🧹 Cleaned up temporary quiz audio file after error: ${tempFilePath}`);
        }
      }
      throw renderError;
    }
  } catch (error) {
    console.error(`❌ Error processing quiz video ${processingId}:`, error);
    
    // Send error notification email
    try {
      await sendVideoCompletionEmail({
        to: userEmail,
        name: userName,
        videoTitle: `${videoTitle} (Failed)`,
        videoDuration: 0,
        libraryUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/library`,
      });
    } catch (emailError) {
      console.error(`❌ Failed to send quiz error notification email for ${processingId}:`, emailError);
    }
  }
} 