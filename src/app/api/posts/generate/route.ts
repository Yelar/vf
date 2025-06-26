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
  slideTopics?: string[];
  contentStrategy?: string;
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
          content: `You are an expert Instagram content strategist. Your PRIMARY GOAL is to fulfill the user's exact request.

CRITICAL RULES:
1. USER REQUEST IS HIGHEST PRIORITY - follow their intent exactly
2. Return ONLY valid JSON - NO markdown, NO code blocks, NO extra text
3. Create 2-3 diverse variants (mix single posts and carousels)
4. For carousels: ALWAYS include 3-5 slides minimum
5. Use double quotes, NO trailing commas, NO comments

EXACT JSON FORMAT:
{
  "reasoning": "How this content fulfills the user's specific request",
  "variants": [
    {
      "id": "variant1",
      "type": "single",
      "title": "Compelling title based on user request",
      "description": "How this variant addresses user needs",
      "contentStrategy": "Detailed content approach for this variant",
      "metadata": {
        "hashtags": ["#relevant", "#to", "#userrequest"],
        "caption": "Engaging caption that matches user intent",
        "engagement_tips": ["specific tip 1", "specific tip 2"]
      }
    },
    {
      "id": "variant2", 
      "type": "carousel",
      "title": "Multi-slide content title",
      "description": "Carousel approach to user request",
      "slideCount": 4,
      "slideTopics": ["Slide 1 topic", "Slide 2 topic", "Slide 3 topic", "Slide 4 topic"],
      "contentStrategy": "How slides work together to fulfill request",
      "metadata": {
        "hashtags": ["#carousel", "#specific", "#tags"],
        "caption": "Caption for carousel post",
        "engagement_tips": ["carousel tip 1", "carousel tip 2"]
      }
    }
  ]
}`
        },
        {
          role: "user",
          content: `USER REQUEST (HIGHEST PRIORITY): "${prompt}"

INSTRUCTIONS:
1. Analyze the user's exact request and intent
2. Create content that DIRECTLY addresses their needs
3. Generate 2-3 variants with different approaches
4. Include at least one carousel with 3-5 slides
5. Make content engaging and platform-optimized
6. Focus on what the user specifically asked for

RESPOND WITH VALID JSON ONLY - NO OTHER TEXT:`
        }
      ],
      temperature: 0.7,
      max_tokens: 2500,
      top_p: 0.9,
      frequency_penalty: 0.3,
      presence_penalty: 0.2,
      stream: false,
    });

    const structureContent = structureCompletion.choices[0]?.message?.content;
    if (!structureContent) {
      throw new Error('No response from Azure OpenAI for content structure');
    }

    console.log('🔍 Raw structure response:', structureContent.substring(0, 200) + '...');

    // Clean and parse the content structure
    let structure;
    try {
      // Remove any markdown code blocks or extra formatting
      let cleanContent = structureContent.trim();
      
      // Remove markdown code blocks if present
      cleanContent = cleanContent.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
      cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      
      // Find the JSON object boundaries
      const startIndex = cleanContent.indexOf('{');
      const lastIndex = cleanContent.lastIndexOf('}');
      
      if (startIndex === -1 || lastIndex === -1) {
        throw new Error('No JSON object found in response');
      }
      
      cleanContent = cleanContent.substring(startIndex, lastIndex + 1);
      
      console.log('🧹 Cleaned JSON:', cleanContent.substring(0, 150) + '...');
      
      structure = JSON.parse(cleanContent);
      
      // Validate structure
      if (!structure.reasoning || !Array.isArray(structure.variants)) {
        throw new Error('Invalid JSON structure - missing required fields');
      }
      
      if (structure.variants.length === 0) {
        throw new Error('No variants found in structure');
      }
      
      console.log('✅ Successfully parsed structure with', structure.variants.length, 'variants');
      
    } catch (error) {
      console.error('❌ Failed to parse content structure:', error);
      console.error('Raw content:', structureContent);
      
      // Fallback: create a default structure
      structure = {
        reasoning: "Generated fallback content due to parsing error",
        variants: [
          {
            id: "fallback-1",
            type: "single",
            title: "Motivational Post",
            description: "Inspiring content about overcoming challenges",
            metadata: {
              hashtags: ["#motivation", "#success", "#mindset"],
              caption: "Every challenge is an opportunity to grow stronger 💪",
              engagement_tips: ["Ask followers about their challenges", "Share personal stories"]
            }
          }
        ]
      };
      console.log('🔄 Using fallback structure');
    }

    // Step 2: Generate JSX for each variant
    const variants = await Promise.all(structure.variants.map(async (variant: Variant, index: number) => {
      
      if (variant.type === 'carousel') {
        // Generate carousel slides
        const slidePrompt = variant.slideTopics && variant.slideTopics.length > 0 
          ? `Generate ${variant.slideTopics.length} slides for: "${variant.title}"

SLIDE TOPICS:
${variant.slideTopics.map((topic, i) => `Slide ${i + 1}: ${topic}`).join('\n')}

USER REQUEST CONTEXT: "${prompt}"
CONTENT STRATEGY: ${variant.contentStrategy || variant.description}`
          : `Generate 4-5 slides for carousel: "${variant.title}"
          
USER REQUEST: "${prompt}"
DESCRIPTION: ${variant.description}
STRATEGY: ${variant.contentStrategy || 'Create engaging educational carousel'}`;

        const carouselCompletion = await client.chat.completions.create({
          model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4",
          messages: [
            {
              role: "system",
              content: `You are an expert React developer creating Instagram carousel slides. 

CRITICAL REQUIREMENTS:
1. Generate 4-5 distinct JSX slides
2. Each slide must be complete, standalone JSX
3. Separate slides with exactly "---" on its own line
4. Use vibrant Tailwind classes and gradients
5. Make each slide visually distinct but cohesive
6. Focus on the user's original request

JSX FORMAT PER SLIDE:
- Use 1080x1080 Instagram format
- Bold, readable typography
- Engaging visual hierarchy
- Proper Tailwind classes
- Self-contained div structure`
            },
            {
              role: "user", 
              content: `${slidePrompt}

REQUIREMENTS:
- Return ONLY JSX code for slides
- Separate each slide with "---"
- Make slides that fulfill the user's request
- Use engaging visuals and typography
- Each slide should build on the previous

GENERATE CAROUSEL SLIDES:`
            }
          ],
          temperature: 0.8,
          max_tokens: 2000,
          top_p: 0.95,
          frequency_penalty: 0.4,
          presence_penalty: 0.3,
          stream: false,
        });

        const carouselContent = carouselCompletion.choices[0]?.message?.content?.trim();
        if (!carouselContent) {
          throw new Error(`Failed to generate carousel slides for variant ${index}`);
        }

        return {
          ...variant,
          slides: carouselContent.split('---').map(s => s.trim()).filter(s => s.length > 0)
        };

      } else {
        // Generate single post JSX
        const jsxCompletion = await client.chat.completions.create({
          model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4",
          messages: [
            {
              role: "system",
              content: `You are an expert React developer creating Instagram posts.

REQUIREMENTS:
1. Return ONLY raw JSX code, no JSON wrapping
2. Create visually striking 1080x1080 Instagram post
3. Use bold Tailwind typography and gradients
4. Make content that directly addresses user request
5. Include proper className props and element nesting`
            },
            {
              role: "user",
              content: `Generate Instagram post JSX for:

TITLE: ${variant.title}
DESCRIPTION: ${variant.description}
USER REQUEST: "${prompt}"
CONTENT STRATEGY: ${variant.contentStrategy || variant.description}

REQUIREMENTS:
- Return ONLY the JSX code
- Make it visually compelling
- Address the user's specific request
- Use engaging typography and colors
- Create something scroll-stopping

GENERATE SINGLE POST JSX:`
            }
          ],
          temperature: 0.8,
          max_tokens: 1500,
          top_p: 0.95,
          frequency_penalty: 0.4,
          presence_penalty: 0.3,
          stream: false,
        });

        const jsxContent = jsxCompletion.choices[0]?.message?.content?.trim();
        if (!jsxContent) {
          throw new Error(`Failed to generate JSX for variant ${index}`);
        }

        // Clean JSX content
        let cleanJSX = jsxContent;
        // Remove markdown code blocks if present
        cleanJSX = cleanJSX.replace(/^```jsx?\s*/i, '').replace(/\s*```$/, '');
        cleanJSX = cleanJSX.replace(/^```\s*/, '').replace(/\s*```$/, '');

        return {
          ...variant,
          jsx: cleanJSX
        };
      }
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