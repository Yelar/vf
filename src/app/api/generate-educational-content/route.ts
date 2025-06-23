import { NextRequest, NextResponse } from 'next/server';
import { AzureOpenAI } from 'openai';

const client = new AzureOpenAI({
  endpoint: process.env.AZURE_OPENAI_ENDPOINT || "https://vfs-gpt.openai.azure.com/",
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  deployment: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4o",
  apiVersion: process.env.AZURE_OPENAI_API_VERSION || "2024-04-01-preview",
});

export async function POST(request: NextRequest) {
  try {
    const { topic, videoLength = 'short', difficulty = 'beginner', templatePrompt = null } = await request.json();

    // Get user info from middleware headers
    const userEmail = request.headers.get('x-user-email') || 'unknown';
    const contentType = templatePrompt ? 'template content' : 'educational content';
    console.log(`🎓 User ${userEmail} generating ${contentType} for topic: "${topic}"`);

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    if (!process.env.AZURE_OPENAI_API_KEY) {
      return NextResponse.json({ error: 'Azure OpenAI API key not configured' }, { status: 500 });
    }

    // Define prompts based on video length and difficulty
    const lengthSettings = {
      short: { wordCount: '20-30', duration: '5-8 seconds' },
      medium: { wordCount: '40-60', duration: '10-15 seconds' },
      long: { wordCount: '80-120', duration: '20-30 seconds' },
      extended: { wordCount: '120-180', duration: '35-45 seconds' }
    };

    const difficultySettings = {
      beginner: 'simple language, basic concepts, easy to understand',
      intermediate: 'moderate complexity, some technical terms with explanations',
      advanced: 'technical language, complex concepts, detailed explanations'
    };

    const settings = lengthSettings[videoLength as keyof typeof lengthSettings];
    const difficultyDesc = difficultySettings[difficulty as keyof typeof difficultySettings];

    let systemPrompt: string;
    let userPrompt: string;

    if (templatePrompt) {
      // Template-based content generation with longer word count
      systemPrompt = `You are an expert content creator specializing in viral short-form video content. Your goal is to create engaging, captivating content that hooks viewers immediately and keeps them watching.

Key requirements:
- Create content that is 100-150 words (longer than educational content for better engagement)
- Write in a conversational, engaging tone perfect for text-to-speech
- Use vivid, descriptive language that creates mental images
- Build tension, emotion, or curiosity throughout
- Include dramatic pauses and emphasis points
- End with a powerful conclusion or cliffhanger
- Make every word count for maximum impact

CRITICAL: Return ONLY the content text. No quotes, no explanations, no formatting, no additional text. Just the raw content that will be spoken.`;

      userPrompt = templatePrompt;
    } else {
      // Regular educational content generation
      systemPrompt = `You are an expert educational content creator specializing in YouTube Shorts. Your goal is to create engaging, concise educational content that teaches complex topics in simple, digestible ways.

Key requirements:
- Create content that is exactly ${settings.wordCount} words
- Use ${difficultyDesc}
- Write in a conversational, engaging tone
- Make it perfect for a ${settings.duration} video
- Use simple, clear sentences that work well with text-to-speech
- Include interesting facts or insights that will hook viewers
- End with a compelling statement or question that encourages engagement

CRITICAL: Return ONLY the content text. No quotes, no explanations, no formatting, no additional text. Just the raw content that will be spoken.`;

      userPrompt = `Create educational content about: "${topic}"

Make it engaging, informative, and perfect for a YouTube Short video. Focus on the most interesting and important aspects that would captivate viewers immediately.`;
    }

    console.log(`🤖 Generating ${contentType} with Azure OpenAI GPT-4o for topic: "${topic}"`);

    const completion = await client.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4o", // Use GPT-4o deployment
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: templatePrompt ? 400 : 300, // More tokens for template content
      temperature: templatePrompt ? 0.8 : 0.7, // Higher creativity for templates
      top_p: 0.9,
      stream: false,
    });

    const generatedContent = completion.choices[0]?.message?.content?.trim();

    if (!generatedContent) {
      throw new Error('No content generated from Azure OpenAI');
    }

    console.log(`✅ Generated ${contentType} (${generatedContent.split(' ').length} words): "${generatedContent.slice(0, 100)}..."`);

    return NextResponse.json({
      success: true,
      content: generatedContent,
      topic,
      isTemplate: !!templatePrompt,
      settings: {
        videoLength,
        difficulty,
        wordCount: generatedContent.split(' ').length,
        estimatedDuration: templatePrompt ? '25-35 seconds' : settings.duration
      }
    });

  } catch (error) {
    console.error('❌ Content generation error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate content',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 