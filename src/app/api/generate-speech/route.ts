import { NextRequest, NextResponse } from 'next/server';
import { parseBuffer } from 'music-metadata';

// Function to get intelligent text segmentation using LLM
async function getIntelligentSegmentation(text: string): Promise<string[]> {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/segment-text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error('Failed to get intelligent segmentation');
    }

    const data = await response.json();
    if (data.success && data.segments) {
      return data.segments;
    }
    
    throw new Error('Invalid segmentation response');
  } catch (error) {
    console.error('❌ Intelligent segmentation failed, using fallback:', error);
    return fallbackSegmentation(text);
  }
}

// Fallback function for basic text segmentation
function fallbackSegmentation(text: string): string[] {
  // Split by multiple delimiters: sentences, newlines, and other natural breaks
  const chunks = text
    .split(/[.!?]+|\n+/)  // Split by sentence endings or newlines
    .map(chunk => chunk.trim())
    .filter(chunk => chunk.length > 0)
    .map(chunk => {
      // If chunk doesn't end with punctuation, add a period for natural speech
      if (!/[.!?]$/.test(chunk)) {
        chunk += '.';
      }
      return chunk;
    });

  // If no meaningful splits found, split by length (fallback)
  if (chunks.length === 1 && chunks[0].length > 100) {
    const words = chunks[0].split(' ');
    const maxWordsPerChunk = 15; // ~15 words per chunk for good pacing
    const newChunks: string[] = [];
    
    for (let i = 0; i < words.length; i += maxWordsPerChunk) {
      const chunk = words.slice(i, i + maxWordsPerChunk).join(' ');
      newChunks.push(chunk + (chunk.endsWith('.') ? '' : '.'));
    }
    
    return newChunks;
  }

  return chunks;
}

// Function to get REAL MP3 duration from audio buffer
async function getRealAudioDuration(audioBuffer: ArrayBuffer): Promise<number> {
  try {
    const metadata = await parseBuffer(Buffer.from(audioBuffer));
    const duration = metadata.format.duration;
    
    if (duration && duration > 0) {
      console.log(`🎵 Real MP3 duration detected: ${duration.toFixed(2)}s`);
      return duration;
    }
    
    throw new Error('Could not detect duration from metadata');
  } catch (error) {
    console.error('❌ Failed to get real MP3 duration:', error);
    // Fallback to conservative estimation
    return 3.0; // Default fallback
  }
}

// Function to calculate audio duration based on text length and voice characteristics (FALLBACK ONLY)
function estimateAudioDuration(text: string): number {
  // More conservative duration estimation to ensure text doesn't finish before audio
  const wordCount = text.split(' ').length;
  const charCount = text.length;
  
  // Conservative speaking rates for TTS (slower than human speech):
  // - TTS tends to be slower: ~1.5 words per second (vs 2 for humans)
  // - With punctuation, pauses, and TTS processing: ~1.2 words per second
  // - Character-based backup: ~8 characters per second (vs 12 for humans)
  
  const wordBasedDuration = wordCount / 1.2; // 1.2 words per second (conservative)
  const charBasedDuration = charCount / 8.0; // 8 characters per second (conservative)
  
  // Use the longer estimate for safety, add larger buffer for TTS
  const estimatedDuration = Math.max(wordBasedDuration, charBasedDuration) + 1.0; // Bigger buffer
  
  return Math.max(estimatedDuration, 2.0); // Minimum 2 seconds for very short segments
}

// Function to generate audio for a single text chunk
async function generateAudioChunk(text: string, voiceId: string, apiKey: string): Promise<{audio: string; duration: number}> {
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_monolingual_v1',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { detail: { message: errorText } };
    }
    
    // Handle specific Eleven Labs errors more gracefully
    if (errorData.detail?.status === "detected_unusual_activity") {
      throw new Error(`Eleven Labs Free Tier temporarily unavailable. Please try again later or consider upgrading to a paid plan.`);
    }
    
    throw new Error(`Eleven Labs API error for chunk "${text.slice(0, 30)}...": ${errorData.detail?.message || errorText}`);
  }

  const audioBuffer = await response.arrayBuffer();
  const audioBase64 = Buffer.from(audioBuffer).toString('base64');
  
  // Get REAL MP3 duration instead of estimation
  const realDuration = await getRealAudioDuration(audioBuffer);
  const estimatedDuration = estimateAudioDuration(text);
  
  console.log(`🎯 Duration comparison for "${text.slice(0, 30)}...": Real=${realDuration.toFixed(2)}s, Estimated=${estimatedDuration.toFixed(2)}s`);
  
  return {
    audio: audioBase64,
    duration: realDuration // Use REAL duration
  };
}

export async function POST(request: NextRequest) {
  try {
    const { text, voiceId = 'EXAVITQu4vr4xnSDxMaL', useSegments = true } = await request.json();

    // Get user info from middleware headers
    const userEmail = request.headers.get('x-user-email') || 'unknown';
    console.log(`🎤 User ${userEmail} generating speech for text: "${text.slice(0, 50)}..."`);

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const ELEVEN_LABS_API_KEY = process.env.ELEVEN_LABS_API_KEY;
    if (!ELEVEN_LABS_API_KEY) {
      return NextResponse.json({ error: 'Eleven Labs API key not configured' }, { status: 500 });
    }

    // If useSegments is false, use the old single-request method
    if (!useSegments) {
      const audioResult = await generateAudioChunk(text, voiceId, ELEVEN_LABS_API_KEY);
      return NextResponse.json({
        audio: `data:audio/mpeg;base64,${audioResult.audio}`,
        audioDuration: audioResult.duration,
        success: true,
        segments: null // Indicate this is not segmented
      });
    }

    // Split text into chunks using intelligent LLM-based segmentation
    const textChunks = await getIntelligentSegmentation(text);
    console.log(`📝 Intelligently segmented text into ${textChunks.length} chunks:`, textChunks.map((chunk: string) => `"${chunk.slice(0, 30)}..."`));

    // Generate audio for each chunk
    const audioSegments: Array<{
      text: string;
      audio: string;
      chunkIndex: number;
      wordCount: number;
      duration: number;
    }> = [];

    let totalDuration = 0;

    for (let i = 0; i < textChunks.length; i++) {
      const chunk = textChunks[i];
      console.log(`🎤 Generating audio for chunk ${i + 1}/${textChunks.length}: "${chunk}"`);
      
      try {
        const audioResult = await generateAudioChunk(chunk, voiceId, ELEVEN_LABS_API_KEY);
        
        audioSegments.push({
          text: chunk,
          audio: `data:audio/mpeg;base64,${audioResult.audio}`,
          chunkIndex: i,
          wordCount: chunk.split(' ').length,
          duration: audioResult.duration
        });

        totalDuration += audioResult.duration;
        
        console.log(`✅ Chunk ${i + 1} audio generated: ${audioResult.duration.toFixed(2)}s (${chunk.split(' ').length} words, ${chunk.length} chars)`);
        
        // Small delay between requests to be respectful to the API
        if (i < textChunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`❌ Failed to generate audio for chunk ${i + 1}:`, error);
        
        // If it's an Eleven Labs API limitation, throw a more helpful error
        if (error instanceof Error && error.message.includes('Free Tier temporarily unavailable')) {
          throw error; // Pass through the helpful error message
        }
        
        throw new Error(`Failed to generate audio for segment: "${chunk.slice(0, 30)}..." - ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log(`✅ Successfully generated ${audioSegments.length} audio segments (${totalDuration.toFixed(2)}s total)`);

    return NextResponse.json({
      success: true,
      segments: audioSegments,
      totalChunks: textChunks.length,
      totalDuration: totalDuration,
      originalText: text
    });

  } catch (error) {
    console.error('Speech generation error:', error);
      
      // Provide more helpful error messages to the user
      if (error instanceof Error) {
        if (error.message.includes('Free Tier temporarily unavailable')) {
          return NextResponse.json({ 
            error: 'Eleven Labs Free Tier is temporarily unavailable. This may be due to high usage or account limitations. Please try again later or consider upgrading to a paid plan.',
            errorType: 'rate_limit'
          }, { status: 429 });
        }
        
        return NextResponse.json({ 
          error: error.message,
          errorType: 'generation_error'
        }, { status: 500 });
      }
      
      return NextResponse.json({ 
        error: 'An unexpected error occurred during speech generation',
        errorType: 'unknown_error'
      }, { status: 500 });
  }
}