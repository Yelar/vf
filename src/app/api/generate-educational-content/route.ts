import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { topic, videoLength = 'short', difficulty = 'beginner' } = await request.json();

    // Get user info from middleware headers
    const userEmail = request.headers.get('x-user-email') || 'unknown';
    console.log(`🎓 User ${userEmail} generating educational content for topic: "${topic}"`);

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: 'GROQ API key not configured' }, { status: 500 });
    }

    // Define prompts based on video length and difficulty
    const lengthSettings = {
      short: { wordCount: '20-30', duration: '5-8 seconds' },
      medium: { wordCount: '40-60', duration: '10-15 seconds' },
      long: { wordCount: '80-120', duration: '20-30 seconds' }
    };

    const difficultySettings = {
      beginner: 'simple language, basic concepts, easy to understand',
      intermediate: 'moderate complexity, some technical terms with explanations',
      advanced: 'technical language, complex concepts, detailed explanations'
    };

    const settings = lengthSettings[videoLength as keyof typeof lengthSettings];
    const difficultyDesc = difficultySettings[difficulty as keyof typeof difficultySettings];

    const systemPrompt = `You are an expert educational content creator specializing in YouTube Shorts. Your goal is to create engaging, concise educational content that teaches complex topics in simple, digestible ways.

Key requirements:
- Create content that is exactly ${settings.wordCount} words
- Use ${difficultyDesc}
- Write in a conversational, engaging tone
- Make it perfect for a ${settings.duration} video
- Use simple, clear sentences that work well with text-to-speech
- Include interesting facts or insights that will hook viewers
- End with a compelling statement or question that encourages engagement
- NO '"content"' in the content. 
The content should be educational but entertaining, perfect for social media consumption.`;

    const userPrompt = `Create educational content about: "${topic}"

Make it engaging, informative, and perfect for a YouTube Short video. Focus on the most interesting and important aspects that would captivate viewers immediately.`;

    console.log(`🤖 Generating educational content with GROQ for topic: "${topic}"`);

    const completion = await groq.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct', // Fast and capable GROQ model
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 300,
      temperature: 0.7,
      top_p: 0.9,
      stream: false,
    });

    const generatedContent = completion.choices[0]?.message?.content?.trim();

    if (!generatedContent) {
      throw new Error('No content generated from GROQ');
    }

    console.log(`✅ Generated educational content (${generatedContent.split(' ').length} words): "${generatedContent.slice(0, 100)}..."`);

    return NextResponse.json({
      success: true,
      content: generatedContent,
      topic,
      settings: {
        videoLength,
        difficulty,
        wordCount: generatedContent.split(' ').length,
        estimatedDuration: settings.duration
      }
    });

  } catch (error) {
    console.error('❌ Educational content generation error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate educational content',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 