import { NextRequest, NextResponse } from 'next/server';
import { AzureOpenAI } from 'openai';
import { auth } from '@/lib/auth';

const client = new AzureOpenAI({
  endpoint: process.env.AZURE_OPENAI_ENDPOINT,
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  apiVersion: process.env.AZURE_OPENAI_API_VERSION,
  deployment: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
});

interface Variant {
  id: string;
  type: 'single' | 'carousel';
  title: string;
  description: string;
  jsx?: string;
  slides?: string[];
  imagePrompts?: Array<{
    imagePrompt: string;
    style: string;
    mood: string;
    avoid: string;
  }>;
  metadata: {
    hashtags: string[];
    caption: string;
    engagement_tips: string[];
  };
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { prompt, requestId } = await req.json();
    const reqId = requestId || req.headers.get('x-request-id') || 'unknown';

    if (!prompt?.trim()) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    if (!process.env.AZURE_OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'Azure OpenAI API key not configured' },
        { status: 500 }
      );
    }

    console.log(`🎯 [${reqId}] Analyzing and generating content for: "${prompt}"`);

    // Step 1: Generate content structure without JSX
    const structureCompletion = await client.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are an expert Instagram content creator. Return a SINGLE, VALID JSON object with content structure ONLY.

CRITICAL: 
1. NO JSX code yet
2. Keep all text fields short and concise
3. Return ONLY raw JSON
4. NO markdown or code blocks

JSON SCHEMA:
{
  "reasoning": "short explanation",
  "variants": [{
    "id": "short-id",
    "type": "single|carousel",
    "title": "concise title",
    "description": "brief description",
    "metadata": {
      "hashtags": ["tags"],
      "caption": "engaging caption",
      "engagement_tips": ["tips"]
    }
  }]
}`
        },
        {
          role: "user",
          content: `Create content structure for: "${prompt}"

REQUIREMENTS:
1. Return ONLY the JSON structure
2. Keep all text fields concise
3. NO JSX or visual code yet
4. Focus on content strategy

SEED: ${Date.now()}`
        }
      ],
      temperature: 0.7,
      max_tokens: 1500,
      top_p: 0.95,
      frequency_penalty: 0.8,
      presence_penalty: 0.6,
      stream: false,
    });

    const structureContent = structureCompletion.choices[0]?.message?.content;
    if (!structureContent) {
      throw new Error('No response from Azure OpenAI for content structure');
    }

    // Parse the content structure
    let structure;
    try {
      structure = JSON.parse(structureContent.trim());
    } catch (error) {
      console.error('Failed to parse content structure:', error);
      throw new Error('Invalid content structure response');
    }

    // Step 2: Generate JSX for each variant
    const variants = await Promise.all(structure.variants.map(async (variant: Variant, index: number) => {
      const jsxCompletion = await client.chat.completions.create({
        model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are an expert React developer. Generate ONLY the JSX code for an Instagram post.

REQUIREMENTS:
1. Return ONLY raw JSX code, no JSON wrapping
2. Keep JSX compact (minimal whitespace)
3. Use Tailwind classes
4. Include all necessary className props
5. Proper element nesting and closing tags`
          },
          {
            role: "user",
            content: `Generate ${variant.type === 'carousel' ? 'slides' : 'JSX'} for:
Title: ${variant.title}
Description: ${variant.description}
Type: ${variant.type}

REQUIREMENTS:
1. Return ONLY the JSX code
2. Make it visually striking
3. Use bold typography
4. Implement proper responsive design
5. Keep code compact

For carousel slides, separate each slide with "---"

SEED: ${Date.now() + index}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 0.95,
        frequency_penalty: 0.8,
        presence_penalty: 0.6,
        stream: false,
      });

      const jsxContent = jsxCompletion.choices[0]?.message?.content?.trim();
      if (!jsxContent) {
        throw new Error(`Failed to generate JSX for variant ${index}`);
      }

      return {
        ...variant,
        jsx: variant.type === 'single' ? jsxContent : undefined,
        slides: variant.type === 'carousel' ? jsxContent.split('---').map(s => s.trim()) : undefined
      };
    }));

    // Return the complete response
    return NextResponse.json({
      success: true,
      reasoning: structure.reasoning,
      variants,
      timestamp: new Date().toISOString(),
      debug_info: {
        request_id: reqId,
        prompt_hash: Buffer.from(prompt).toString('base64').slice(0, 10),
        variants_count: variants.length
      }
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Post generation error:', error);
    
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate posts',
      reasoning: 'An error occurred during content generation. Please try again.',
      variants: []
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }
} 