import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

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
      return NextResponse.json({ error: 'Groq API key not configured' }, { status: 500 });
    }

    // Validate file type
    if (!audioFile.type.startsWith('audio/')) {
      return NextResponse.json({ error: 'File must be an audio file' }, { status: 400 });
    }

    // Validate file size (limit to 25MB)
    if (audioFile.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: 'Audio file too large. Maximum size is 25MB.' }, { status: 400 });
    }

    console.log(`🎵 Processing audio file: ${audioFile.name} (${(audioFile.size / 1024 / 1024).toFixed(2)} MB)`);

    // Initialize Groq client
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });

    // Transcribe using Groq Whisper - pass the file directly
    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-large-v3-turbo',
      response_format: 'json',
      language: 'en',
      temperature: 0.0
    });

    if (!transcription.text) {
      throw new Error('No transcription result');
    }

    console.log(`✅ Transcription successful: "${transcription.text.slice(0, 100)}${transcription.text.length > 100 ? '...' : ''}"`);

    return NextResponse.json({
      success: true,
      text: transcription.text,
      metadata: {
        duration: 'detected',
        language: 'en',
        model: 'whisper-large-v3-turbo'
      }
    });

  } catch (error) {
    console.error('❌ Speech transcription error:', error);
    
    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('rate limit') || error.message.includes('429')) {
        return NextResponse.json({ 
          error: 'Too many requests. Please wait a moment and try again.',
          errorType: 'rate_limit'
        }, { status: 429 });
      }
      
      if (error.message.includes('audio') || error.message.includes('format')) {
        return NextResponse.json({ 
          error: 'Invalid audio format. Please use WAV, MP3, M4A, or FLAC format.',
          errorType: 'invalid_audio'
        }, { status: 400 });
      }

      if (error.message.includes('API key') || error.message.includes('401')) {
        return NextResponse.json({ 
          error: 'Invalid API credentials',
          errorType: 'auth_error'
        }, { status: 401 });
      }
    }

    return NextResponse.json({ 
      error: 'Failed to transcribe audio',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 