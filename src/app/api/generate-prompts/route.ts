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
    const { segments } = await request.json();

    // Get user info from middleware headers
    const userEmail = request.headers.get('x-user-email') || 'unknown';
    console.log(`🎨 User ${userEmail} generating image prompts for ${segments?.length || 0} segments`);

    if (!segments || !Array.isArray(segments)) {
      return NextResponse.json({ error: 'Segments array is required' }, { status: 400 });
    }

    if (!process.env.AZURE_OPENAI_API_KEY) {
      return NextResponse.json({ error: 'Azure OpenAI API key not configured' }, { status: 500 });
    }

    const systemPrompt = `You are an expert AI image generation prompt creator. Your job is to analyze text segments and generate detailed, specific prompts that will create high-quality, relevant images using AI image generation.

Rules for prompt generation:
1. Create descriptive, detailed prompts that specify visual style, composition, and mood
2. Include lighting, color palette, and artistic style suggestions
3. Focus on creating images that complement and enhance the text content
4. Use professional photography/artistic terminology
5. Ensure prompts will generate appropriate, safe-for-work content
6. Consider the educational/content context and create suitable imagery

Return ONLY a JSON array where each element is a detailed prompt string.

Example input: ["Quantum physics is fascinating", "The ocean waves crash against the shore"]
Example output: ["A high-quality scientific illustration showing quantum physics concepts, with floating particles and energy waves, clean modern style with blue and purple color palette, professional educational content", "A stunning photograph of powerful ocean waves crashing against rocky shore, dramatic lighting with spray and foam, high resolution nature photography, blue and white tones"]`;

    const segmentTexts = segments.map((seg: {text: string} | string) => 
      typeof seg === 'string' ? seg : seg.text
    );
    const userPrompt = `Generate detailed AI image generation prompts for these text segments:

${segmentTexts.map((text: string, index: number) => `${index + 1}. "${text}"`).join('\n')}

Return a JSON array of detailed prompt strings, one for each segment.`;

    console.log(`🤖 Using Azure OpenAI GPT-4o to generate image prompts for ${segmentTexts.length} segments...`);

    const completion = await client.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4o",
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 1000,
      temperature: 0.3, // Lower temperature for consistent formatting
      top_p: 0.9,
      stream: false,
    });

    const promptResult = completion.choices[0]?.message?.content?.trim();

    if (!promptResult) {
      throw new Error('No prompt result from Azure OpenAI');
    }

    // Parse the JSON response
    let generatedPrompts: string[];
    try {
      generatedPrompts = JSON.parse(promptResult);
    } catch {
      console.error('❌ Failed to parse Azure OpenAI response as JSON:', promptResult);
      // Fallback to simple prompt generation if LLM response is malformed
      generatedPrompts = segmentTexts.map((text: string) => {
        const words = text.toLowerCase()
          .replace(/[^\w\s]/g, '')
          .split(' ')
          .filter(word => word.length > 3)
          .slice(0, 5);
        const concepts = words.join(' ');
        return `A high-quality, professional image depicting ${concepts || text}. Clean, modern style with good lighting and composition. Suitable for educational content.`;
      });
    }

    // Validate prompts
    if (!Array.isArray(generatedPrompts) || generatedPrompts.length !== segmentTexts.length) {
      throw new Error('Invalid prompt result format');
    }

    // Process prompts
    const processedPrompts = generatedPrompts.map((prompt: string, index: number) => {
      return {
        segmentIndex: index,
        originalText: segmentTexts[index],
        prompt: String(prompt).trim() || `A professional image representing: ${segmentTexts[index]}`
      };
    });

    console.log(`✅ Successfully generated image prompts:`, 
      processedPrompts.map(item => `"${item.originalText}" -> "${item.prompt}"`));

    return NextResponse.json({
      success: true,
      promptData: processedPrompts,
      method: 'llm-generated'
    });

  } catch (error) {
    console.error('❌ Image prompt generation error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate image prompts',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 