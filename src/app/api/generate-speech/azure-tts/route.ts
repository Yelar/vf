import { NextRequest, NextResponse } from 'next/server';
import { parseBuffer } from 'music-metadata';
import { auth } from '@/lib/auth';
import { checkGenerationLimit, decrementGenerationLimit } from '@/lib/auth-db-mongo';

// Azure OpenAI TTS voice options
const AZURE_VOICES = {
  alloy: { name: 'alloy', quality: 'neural' },
  echo: { name: 'echo', quality: 'neural' },
  fable: { name: 'fable', quality: 'neural' },
  onyx: { name: 'onyx', quality: 'neural' },
  nova: { name: 'nova', quality: 'neural' },
  shimmer: { name: 'shimmer', quality: 'neural' }
};

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

// Function to generate word-level timings based on total duration
function generateWordTimings(text: string, totalDuration: number): Array<{
  word: string;
  start: number;
  end: number;
}> {
  const words = text.split(/\s+/).filter(word => word.length > 0);
  if (words.length === 0) return [];

  if (totalDuration <= 0) {
    console.warn('Invalid audio duration:', totalDuration);
    return [];
  }

  // Calculate equal time interval per word based on chunk length and word count
  const timePerWord = totalDuration / words.length;
  
  console.log(`📊 Chunk analysis: ${words.length} words in ${totalDuration.toFixed(3)}s = ${timePerWord.toFixed(3)}s per word`);

  const wordTimings: Array<{ word: string; start: number; end: number }> = [];
  let currentTime = 0;

  words.forEach((word) => {
    const start = currentTime;
    const end = currentTime + timePerWord;

    wordTimings.push({
      word,
      start: Math.round(start * 1000) / 1000,
      end: Math.round(end * 1000) / 1000
    });

    currentTime = end;
  });

  // FORCE the last word to end exactly at the total duration
  if (wordTimings.length > 0) {
    wordTimings[wordTimings.length - 1].end = Math.round(totalDuration * 1000) / 1000;
  }

  // Validation logging
  const calculatedEnd = wordTimings[wordTimings.length - 1]?.end || 0;
  const timingError = Math.abs(calculatedEnd - totalDuration);
  
  console.log(`🎯 Word timings: ${words.length} words, ${timePerWord.toFixed(3)}s per word, last word ends at ${calculatedEnd.toFixed(3)}s (error: ${(timingError * 1000).toFixed(1)}ms)`);
  
  if (timingError > 0.01) { // More than 10ms error
    console.warn(`⚠️ Timing sync error: ${(timingError * 1000).toFixed(1)}ms difference between word end and audio end`);
  }

  return wordTimings;
}

// Function to generate audio for a single text chunk using Azure OpenAI TTS
async function generateAudioChunk(text: string, voiceId: string): Promise<{
  audio: string; 
  duration: number; 
  wordTimings: Array<{ word: string; start: number; end: number }>;
}> {
  if (!process.env.AZURE_OPENAI_SPEECH_API_KEY || !process.env.AZURE_OPENAI_SPEECH_ENDPOINT) {
    throw new Error('Azure OpenAI Speech credentials not configured');
  }

  const voice = AZURE_VOICES[voiceId as keyof typeof AZURE_VOICES];
  if (!voice) {
    throw new Error('Invalid voice ID');
  }

  // For Azure OpenAI TTS, we send a JSON payload instead of SSML
  const payload = {
    model: voice.name, // The voice name is the model
    input: text,
    voice: voice.name
  };

  const response = await fetch(
    process.env.AZURE_OPENAI_SPEECH_ENDPOINT,
    {
      method: 'POST',
      headers: {
        'api-key': process.env.AZURE_OPENAI_SPEECH_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Azure OpenAI TTS API error details:', {
      status: response.status,
      statusText: response.statusText,
      errorText,
      endpoint: process.env.AZURE_OPENAI_SPEECH_ENDPOINT
    });
    throw new Error(`Azure OpenAI TTS API error (${response.status}): ${errorText}`);
  }

  const audioBuffer = await response.arrayBuffer();
  const audioBase64 = Buffer.from(audioBuffer).toString('base64');

  // Get REAL MP3 duration instead of estimation
  const realDuration = await getRealAudioDuration(audioBuffer);
  const estimatedDuration = estimateAudioDuration(text);
  
  console.log(`🎯 Duration comparison for "${text.slice(0, 30)}...": Real=${realDuration.toFixed(2)}s, Estimated=${estimatedDuration.toFixed(2)}s`);
  
  // Use real duration if available, otherwise fallback to estimation
  const finalDuration = realDuration > 0 ? realDuration : estimatedDuration;

  // Adjust duration for word timing calculation to account for end pause
  // Azure TTS adds natural pauses at the end, so we subtract 4s for word timing
  const adjustedDurationForTiming = Math.max(0.1, finalDuration - 4);
  
  // Generate word-level timings using adjusted duration
  const wordTimings = generateWordTimings(text, adjustedDurationForTiming);

  return {
    audio: audioBase64,
    duration: finalDuration, // Use REAL duration
    wordTimings
  };
}

export async function POST(request: NextRequest) {
  try {
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
          resetDate: limitCheck.resetDate
        }
      }, { status: 429 });
    }

    const { text, voiceId = 'alloy', useSegments = true } = await request.json();

    // Get user info from middleware headers
    const userEmail = request.headers.get('x-user-email') || 'unknown';
    console.log(`🎤 User ${userEmail} generating speech using Azure OpenAI TTS for text: "${text.slice(0, 50)}..."`);

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    if (!process.env.AZURE_OPENAI_SPEECH_API_KEY || !process.env.AZURE_OPENAI_SPEECH_ENDPOINT) {
      return NextResponse.json({ error: 'Azure OpenAI Speech credentials not configured' }, { status: 500 });
    }

    // If useSegments is false, use the old single-request method
    if (!useSegments) {
      const audioResult = await generateAudioChunk(text, voiceId);
      
      // Decrement the generation limit after successful generation
      await decrementGenerationLimit(session.user.id);
      
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
      wordTimings: Array<{ word: string; start: number; end: number }>;
    }> = [];

    let totalDuration = 0;

    for (let i = 0; i < textChunks.length; i++) {
      const chunk = textChunks[i];
      console.log(`🎤 Generating audio for chunk ${i + 1}/${textChunks.length}: "${chunk}"`);
      
      try {
        const audioResult = await generateAudioChunk(chunk, voiceId);
        
        // Adjust word timings to be cumulative (offset by previous chunks' duration)
        const cumulativeWordTimings = audioResult.wordTimings.map(timing => ({
          word: timing.word,
          start: Math.round((timing.start + totalDuration) * 1000) / 1000,
          end: Math.round((timing.end + totalDuration) * 1000) / 1000
        }));
        
        audioSegments.push({
          text: chunk,
          audio: `data:audio/mpeg;base64,${audioResult.audio}`,
          chunkIndex: i,
          wordCount: chunk.split(' ').length,
          duration: audioResult.duration,
          wordTimings: cumulativeWordTimings
        });

        totalDuration += audioResult.duration;
        
        console.log(`✅ Chunk ${i + 1} audio generated: ${audioResult.duration.toFixed(2)}s (${chunk.split(' ').length} words, ${chunk.length} chars)`);
        
        // Small delay between requests to be respectful to the API
        if (i < textChunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`❌ Failed to generate audio for chunk ${i + 1}:`, error);
        throw new Error(`Failed to generate audio for segment: "${chunk.slice(0, 30)}..." - ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Decrement the generation limit after successful generation
    await decrementGenerationLimit(session.user.id);

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
    
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'An unexpected error occurred during speech generation',
      errorType: 'generation_error'
    }, { status: 500 });
  }
} 