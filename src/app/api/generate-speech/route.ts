import { NextRequest, NextResponse } from 'next/server';

// Function to split text into meaningful chunks
function splitTextIntoChunks(text: string): string[] {
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

// Function to generate audio for a single text chunk
async function generateAudioChunk(text: string, voiceId: string, apiKey: string): Promise<string> {
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
    throw new Error(`Eleven Labs API error for chunk "${text.slice(0, 30)}...": ${errorText}`);
  }

  const audioBuffer = await response.arrayBuffer();
  return Buffer.from(audioBuffer).toString('base64');
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
      const audioBase64 = await generateAudioChunk(text, voiceId, ELEVEN_LABS_API_KEY);
      return NextResponse.json({
        audio: `data:audio/mpeg;base64,${audioBase64}`,
        success: true,
        segments: null // Indicate this is not segmented
      });
    }

    // Split text into chunks for better subtitle precision
    const textChunks = splitTextIntoChunks(text);
    console.log(`📝 Split text into ${textChunks.length} chunks:`, textChunks.map(chunk => `"${chunk.slice(0, 30)}..."`));

    // Generate audio for each chunk
    const audioSegments: Array<{
      text: string;
      audio: string;
      chunkIndex: number;
      wordCount: number;
    }> = [];

    for (let i = 0; i < textChunks.length; i++) {
      const chunk = textChunks[i];
      console.log(`🎤 Generating audio for chunk ${i + 1}/${textChunks.length}: "${chunk}"`);
      
      try {
        const audioBase64 = await generateAudioChunk(chunk, voiceId, ELEVEN_LABS_API_KEY);
        
        audioSegments.push({
          text: chunk,
          audio: `data:audio/mpeg;base64,${audioBase64}`,
          chunkIndex: i,
          wordCount: chunk.split(' ').length
        });
        
        // Small delay between requests to be respectful to the API
        if (i < textChunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`❌ Failed to generate audio for chunk ${i + 1}:`, error);
        throw new Error(`Failed to generate audio for segment: "${chunk.slice(0, 30)}..."`);
      }
    }

    console.log(`✅ Successfully generated ${audioSegments.length} audio segments`);

    return NextResponse.json({
      success: true,
      segments: audioSegments,
      totalChunks: textChunks.length,
      originalText: text
    });

  } catch (error) {
    console.error('Speech generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}