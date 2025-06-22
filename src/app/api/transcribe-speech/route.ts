import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    // Get user info from middleware headers
    const userEmail = request.headers.get('x-user-email') || 'unknown';
    console.log(`🎤 User ${userEmail} transcribing audio file: ${audioFile?.name || 'unknown'}`);

    if (!audioFile) {
      return NextResponse.json({ error: 'Audio file is required' }, { status: 400 });
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: 'GROQ API key not configured' }, { status: 500 });
    }

    // Validate file type
    if (!audioFile.type.startsWith('audio/')) {
      return NextResponse.json({ error: 'File must be an audio file' }, { status: 400 });
    }

    // Validate file size (limit to 25MB for Whisper)
    if (audioFile.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: 'Audio file too large. Maximum size is 25MB.' }, { status: 400 });
    }

    console.log(`🎵 Processing audio file: ${audioFile.name} (${(audioFile.size / 1024 / 1024).toFixed(2)} MB)`);

    try {
      // Use Groq's Whisper API for transcription
      const transcription = await groq.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-large-v3',
        prompt: 'Transcribe this audio clearly and accurately. Include proper punctuation.',
        response_format: 'json',
        temperature: 0.0, // Lower temperature for more accurate transcription
      });

      const transcribedText = transcription.text?.trim();

      if (!transcribedText) {
        throw new Error('No transcription result from Whisper');
      }

      console.log(`✅ Transcription successful: "${transcribedText.slice(0, 100)}${transcribedText.length > 100 ? '...' : ''}"`);

      return NextResponse.json({
        success: true,
        text: transcribedText,
        metadata: {
          duration: audioFile.size > 0 ? 'detected' : 'unknown',
          language: 'auto-detected',
          model: 'whisper-large-v3'
        }
      });

    } catch (whisperError) {
      console.error('❌ Whisper transcription error:', whisperError);
      
      // Handle specific Groq/Whisper errors
      if (whisperError instanceof Error) {
        if (whisperError.message.includes('rate limit')) {
          return NextResponse.json({ 
            error: 'Too many requests. Please wait a moment and try again.',
            errorType: 'rate_limit'
          }, { status: 429 });
        }
        
        if (whisperError.message.includes('audio')) {
          return NextResponse.json({ 
            error: 'Invalid audio format. Please use WAV, MP3, or M4A format.',
            errorType: 'invalid_audio'
          }, { status: 400 });
        }
      }
      
      throw whisperError;
    }

  } catch (error) {
    console.error('❌ Speech transcription error:', error);
    return NextResponse.json({ 
      error: 'Failed to transcribe audio',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 





