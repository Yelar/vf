import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text, voiceId = 'EXAVITQu4vr4xnSDxMaL' } = await request.json(); // Default to Bella voice

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const ELEVEN_LABS_API_KEY = process.env.ELEVEN_LABS_API_KEY;
    if (!ELEVEN_LABS_API_KEY) {
      return NextResponse.json({ error: 'Eleven Labs API key not configured' }, { status: 500 });
    }

    // Call Eleven Labs API
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVEN_LABS_API_KEY,
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
      console.error('Eleven Labs API error:', errorText);
      return NextResponse.json({ error: 'Failed to generate speech' }, { status: 500 });
    }

    // Get the audio data
    const audioBuffer = await response.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');

    // Get duration by creating a temporary audio element (we'll return the base64 and let client handle duration)
    return NextResponse.json({
      audio: `data:audio/mpeg;base64,${audioBase64}`,
      success: true
    });

  } catch (error) {
    console.error('Speech generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}