import { NextRequest, NextResponse } from 'next/server';
import { bundle } from '@remotion/bundler';
import { getCompositions, renderMedia } from '@remotion/renderer';
import { auth } from '@/lib/auth';
import { createVideo, updateVideo } from '@/lib/auth-db-mongo';
import { checkGenerationLimit, decrementGenerationLimit } from '@/lib/auth-db-mongo';
import { sendVideoCompletionEmail } from '@/lib/email';
import path from 'path';
import { v4 as uuid } from 'uuid';
import fs from 'fs/promises';
import Video from '@/lib/models/Video';

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
      const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';
      return {
        audioPath: `${baseUrl}/api/temp-audio/${tempFileName}`,
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
  const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';
  return {
    audioPath: `${baseUrl}/api/temp-audio/${tempFileName}`,
    totalDuration
  };
}

// Function to upload video to S3
async function uploadVideoToS3(videoBuffer: Buffer, filename: string): Promise<{ url: string; key: string } | null> {
  const maxRetries = 3;

  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📤 S3 upload attempt ${attempt}/${maxRetries}`);
      console.log(`📁 File: ${filename}`);
      console.log(`📏 Size: ${(videoBuffer.length / 1024 / 1024).toFixed(2)}MB`);
      
      // Use S3 SDK for server-side upload
      const { uploadToS3 } = await import("@/lib/s3");
      
      console.log(`⏳ Starting upload to S3...`);
      const uploadStartTime = Date.now();
      
      const key = `videos/${Date.now()}-${filename.replace(/[^a-z0-9.-]/gi, '-').toLowerCase()}`;
      
      const result = await uploadToS3(
        videoBuffer,
        key,
        'video/mp4',
        {
          originalName: filename,
          uploadedAt: new Date().toISOString(),
          fileType: 'video',
        }
      );
      
      const uploadDuration = Date.now() - uploadStartTime;
      console.log(`⏱️ Upload completed in ${uploadDuration}ms`);
      console.log(`✅ S3 upload successful:`);
      console.log(`🔗 URL: ${result.url}`);
      console.log(`🔑 Key: ${result.key}`);
      console.log(`📊 Final size: ${(result.size / 1024 / 1024).toFixed(2)}MB`);
      
      return {
        url: result.url,
        key: result.key
      };
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ S3 upload attempt ${attempt} failed:`, errorMessage);
      
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
    // Check for required S3 environment variables
    const requiredS3Vars = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_S3_REGION', 'AWS_S3_BUCKET_NAME'];
    const missingS3Vars = requiredS3Vars.filter(key => !process.env[key]);
    
    if (missingS3Vars.length > 0) {
      console.error('Missing S3 environment variables:', missingS3Vars);
      return NextResponse.json({ error: `Server configuration error - missing S3 variables: ${missingS3Vars.join(', ')}` }, { status: 500 });
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

    // Check generation limit
    const limitCheck = await checkGenerationLimit(session.user.id);
    if (!limitCheck) {
      return NextResponse.json({ error: 'Failed to check generation limit' }, { status: 500 });
    }
    if (!limitCheck.canGenerate) {
      return NextResponse.json({ 
        error: 'Generation limit reached', 
        details: {
          remaining: limitCheck.remaining,
          resetDate: limitCheck.resetDate,
          message: `You have reached your monthly limit of generations. Your limit will reset on ${limitCheck.resetDate.toLocaleDateString()}.`
        }
      }, { status: 429 });
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
          console.log(`🧠 User ${userEmail} starting quiz video render and save to S3`);

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
      session.user.id,
      videoTitle,
      undefined,
      undefined,
      0,
      videoMetadata,
      videoDescription,
      totalDuration
    );

    if (!savedVideo) {
      return NextResponse.json({ error: 'Failed to create video record' }, { status: 500 });
    }

    // Decrement the generation limit
    const decremented = await decrementGenerationLimit(session.user.id);
    if (!decremented) {
      // If we fail to decrement, delete the video record to maintain consistency
      await Video.findByIdAndDelete(savedVideo.id);
      return NextResponse.json({ error: 'Failed to update generation limit' }, { status: 500 });
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
  videoId: string;
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
    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';
    
    let resolvedBackgroundVideo = backgroundVideo;
    if (backgroundVideo && backgroundVideo.startsWith('/')) {
      resolvedBackgroundVideo = `${baseUrl}${backgroundVideo}`;
    }

    let resolvedBgMusic = bgMusic;
    if (bgMusic && bgMusic.startsWith('/')) {
      resolvedBgMusic = `${baseUrl}${bgMusic}`;
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
        // Add timeout configuration
        timeoutInMilliseconds: 120000, // 2 minutes total timeout
        // Add progress tracking
        onProgress: (progress) => {
          console.log(`🎬 Rendering progress for ${processingId}: ${(progress.progress * 100).toFixed(1)}%`);
        },
      });

      // Read the rendered video file
      const fileBuffer = await fs.readFile(outputPath);
      const fileSize = fileBuffer.length;
      
      console.log(`✅ Quiz video ${processingId} rendered successfully, size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);

      // Upload to S3
      const uploadResult = await uploadVideoToS3(fileBuffer, `quiz-${videoTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.mp4`);
      
      if (!uploadResult) {
        throw new Error('Failed to upload quiz video to S3');
      }

      console.log(`✅ Quiz video ${processingId} uploaded to S3: ${uploadResult.url}`);

      // Update video record with actual URL and file info
      const updateSuccess = await updateVideo(
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
      const libraryUrl = `${process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000'}/library`;
      
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
      if (audioFilePath && audioFilePath.includes('/api/temp-audio/')) {
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
      if (audioFilePath && audioFilePath.includes('/api/temp-audio/')) {
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
        libraryUrl: `${process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000'}/library`,
      });
    } catch (emailError) {
      console.error(`❌ Failed to send quiz error notification email for ${processingId}:`, emailError);
    }
  }
} 