import { NextRequest, NextResponse } from 'next/server';
// Note: Azure OpenAI doesn't have built-in speech transcription
// You'll need to implement Azure Speech Service or another transcription service

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

    if (!process.env.AZURE_OPENAI_API_KEY) {
      return NextResponse.json({ error: 'Azure OpenAI API key not configured' }, { status: 500 });
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

    try {
      // Note: Azure OpenAI doesn't have Whisper transcription built-in
      // You'll need to use Azure Speech Service or another transcription service
      // For now, this is a placeholder that will need to be implemented with Azure Speech Service
      
      // Placeholder response - you'll need to implement actual transcription
      const transcribedText = "This is a placeholder. You need to implement Azure Speech Service for audio transcription.";

      if (!transcribedText) {
        throw new Error('No transcription result');
      }

      console.log(`✅ Transcription successful: "${transcribedText.slice(0, 100)}${transcribedText.length > 100 ? '...' : ''}"`);

      return NextResponse.json({
        success: true,
        text: transcribedText,
        metadata: {
          duration: audioFile.size > 0 ? 'detected' : 'unknown',
          language: 'auto-detected',
          model: 'azure-speech-service-placeholder'
        }
      });

    } catch (transcriptionError) {
      console.error('❌ Transcription error:', transcriptionError);
      
      // Handle specific transcription errors
      if (transcriptionError instanceof Error) {
        if (transcriptionError.message.includes('rate limit')) {
          return NextResponse.json({ 
            error: 'Too many requests. Please wait a moment and try again.',
            errorType: 'rate_limit'
          }, { status: 429 });
        }
        
        if (transcriptionError.message.includes('audio')) {
          return NextResponse.json({ 
            error: 'Invalid audio format. Please use WAV, MP3, or M4A format.',
            errorType: 'invalid_audio'
          }, { status: 400 });
        }
      }
      
      throw transcriptionError;
    }

  } catch (error) {
    console.error('❌ Speech transcription error:', error);
    return NextResponse.json({ 
      error: 'Failed to transcribe audio',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 





