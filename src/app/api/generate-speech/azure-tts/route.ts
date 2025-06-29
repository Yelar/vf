import { NextRequest, NextResponse } from 'next/server';

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
  const chunks = text
    .split(/[.!?]+|\n+/)
    .map(chunk => chunk.trim())
    .filter(chunk => chunk.length > 0)
    .map(chunk => {
      if (!/[.!?]$/.test(chunk)) {
        chunk += '.';
      }
      return chunk;
    });

  if (chunks.length === 1 && chunks[0].length > 100) {
    const words = chunks[0].split(' ');
    const maxWordsPerChunk = 15;
    const newChunks: string[] = [];
    
    for (let i = 0; i < words.length; i += maxWordsPerChunk) {
      const chunk = words.slice(i, i + maxWordsPerChunk).join(' ');
      newChunks.push(chunk + (chunk.endsWith('.') ? '' : '.'));
    }
    
    return newChunks;
  }

  return chunks;
}

// Function to generate audio for a single text chunk
async function generateAudioChunk(text: string, voiceId: string): Promise<{ audio: string; duration: number }> {
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

  // Estimate duration based on word count (rough estimate)
  const wordCount = text.split(' ').length;
  const estimatedDuration = wordCount * 0.4; // Roughly 0.4 seconds per word

  return {
    audio: audioBase64,
    duration: estimatedDuration
  };
}

export async function POST(request: NextRequest) {
  try {
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
      return NextResponse.json({
        audio: `data:audio/mpeg;base64,${audioResult.audio}`,
        audioDuration: audioResult.duration,
        success: true,
        segments: null
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
        const audioResult = await generateAudioChunk(chunk, voiceId);
        
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
    
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'An unexpected error occurred during speech generation',
      errorType: 'generation_error'
    }, { status: 500 });
  }
} 