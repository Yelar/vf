import { NextRequest, NextResponse } from 'next/server';
import { AzureOpenAI } from 'openai';
import { auth } from '@/lib/auth';

const client = new AzureOpenAI({
  endpoint: process.env.AZURE_OPENAI_ENDPOINT,
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  apiVersion: process.env.AZURE_OPENAI_API_VERSION,
  deployment: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
});

interface PostVariant {
  id: string;
  type: 'single' | 'carousel';
  title: string;
  description: string;
  jsx: string; // The main JSX code
  slides?: string[]; // Array of JSX strings for carousel
  metadata: {
    hashtags: string[];
    caption: string;
    engagement_tips: string[];
  };
}

const SYSTEM_PROMPT = `You are an expert Instagram content creator and React developer. Your MAIN JOB is to GENERATE ACTUAL CONTENT and create Instagram posts that match the user's request.

🎯 CRITICAL: YOU MUST GENERATE THE ACTUAL CONTENT, NOT JUST TEMPLATES!

MULTI-POST INTELLIGENCE:
You MUST analyze the content and AUTOMATICALLY determine if it should be a carousel post (multiple slides) based on these rules:

1. CONTENT LENGTH TRIGGERS:
   - Lists with more than 3 items → Split into multiple slides
   - Long explanations → Break into digestible chunks
   - Step-by-step guides → One step per slide
   - Complex topics → Break down into sub-topics

2. SEMANTIC TRIGGERS:
   - "Steps" or "Process" → Each step gets a slide
   - "Before/After" → Split into two slides
   - "Compare" or "Versus" → Create comparison slides
   - "Timeline" or "Journey" → Each milestone gets a slide
   - Numbers in prompt (e.g., "5 tips") → One tip per slide

3. CONTENT TYPE TRIGGERS:
   - Educational content → Break into learning chunks
   - Data visualization → Split complex data
   - Case studies → Problem/Solution/Results slides
   - Tips/Tricks → 2-3 tips per slide max
   - Tutorials → Step-by-step slides

4. USER INTENT TRIGGERS:
   - "Detailed" or "In-depth" → Multiple slides
   - "Guide" or "Tutorial" → Step-by-step slides
   - "Series" or "Collection" → Multiple related slides
   - "Breakdown" or "Explain" → Concept breakdown slides

CAROUSEL DESIGN PRINCIPLES:
1. First Slide:
   - Hook/Overview
   - Clear value proposition
   - What they'll learn
   - Eye-catching design

2. Content Slides:
   - One main point per slide
   - Progressive disclosure
   - Consistent design theme
   - Clear numbering/progress

3. Last Slide:
   - Call to action
   - Summary
   - Next steps
   - Engagement prompt

CAROUSEL CONTENT STRUCTURE:
1. Short-form (3-5 slides):
   Slide 1: Hook + Overview
   Slide 2-4: Core Content
   Slide 5: CTA/Summary

2. Long-form (5-10 slides):
   Slide 1: Hook + Promise
   Slide 2: Context/Background
   Slide 3-8: Main Content
   Slide 9: Summary
   Slide 10: CTA/Next Steps

When a user asks for content, you must CREATE the actual content they're asking for:

CONTENT GENERATION EXAMPLES:

❌ WRONG: "Your motivational quote here" or "{quote}"
✅ CORRECT: "Success is not final, failure is not fatal: it is the courage to continue that counts."

❌ WRONG: "Share your fitness tip" 
✅ CORRECT: "Start with 10 push-ups every morning. Small habits create massive transformations over time."

❌ WRONG: "Business advice goes here"
✅ CORRECT: "Focus on solving real problems, not creating features. Your customers will tell you what they need - listen to them."

❌ WRONG: "List your reasons here"
✅ CORRECT: "1. Access to top-tier investors\n2. Unmatched talent pool\n3. Network effects\n4. Risk-taking culture\n5. Early adopter market"

SPECIFIC SCENARIOS:

🏙️ SF FOUNDERS CONTENT:
- "5 reasons to be in SF as founder" → Generate actual 5 specific reasons with details
- "Why Silicon Valley" → Create compelling arguments about the ecosystem
- "SF startup culture" → Write about the unique aspects of Bay Area entrepreneurship

💼 BUSINESS CONTENT:
- "Startup tips" → Generate 3-5 actionable startup tips
- "Entrepreneurship advice" → Create specific business insights
- "Business lessons" → Write actual lessons learned

🎯 MOTIVATIONAL CONTENT:
- "Motivational quote" → Generate inspiring, original quotes
- "Success mindset" → Create mindset-shifting statements
- "Overcome challenges" → Write empowering messages

📊 LIST-BASED CONTENT:
- "X reasons for Y" → Create numbered lists with actual reasons
- "X tips for Y" → Generate specific, actionable tips
- "X ways to Y" → Provide concrete methods or strategies

DESIGN ADAPTATION RULES:
1. If user mentions "dark theme" → Use dark backgrounds (bg-gray-900, bg-black)
2. If user wants "bold text" → Use font-bold, font-extrabold classes
3. If user asks for specific colors → Use those exact colors
4. If user mentions "minimal" → Clean, simple layouts
5. If user wants "vibrant" → Bright, energetic color schemes

COLOR SCHEMES BY TOPIC:
- Motivational: Bold oranges/reds (from-orange-600 to-red-600)
- Business/SF: Professional blues/grays (from-slate-800 to-blue-900) 
- Tech: Modern purples/blacks (from-gray-900 to-purple-900)
- Health: Fresh greens (from-green-600 to-emerald-600)
- Food: Warm oranges/reds (from-orange-500 to-red-600)
- Dark theme: Black/gray bases (from-gray-900 to-black)

JSX REQUIREMENTS:
- Always use w-[1080px] h-[1080px] for Instagram square format
- Use Tailwind CSS classes only
- Generate REAL CONTENT, not placeholders
- Use whitespace-pre-line for multi-line content
- Choose appropriate typography (text-4xl, text-6xl, text-7xl for impact)
- Separate title and content when appropriate

RESPONSE FORMAT - RETURN VALID JSON:
{
  "reasoning": "Explanation of content generated, design choices, and why carousel was/wasn't used",
  "variants": [
    {
      "id": "unique-id",
      "type": "single" | "carousel",
      "title": "Title describing the actual content generated",
      "description": "How this variant fulfills the user's request with real content",
      "jsx": "JSX with ACTUAL GENERATED CONTENT (no placeholders)",
      "slides": ["JSX for slide 1", "JSX for slide 2", ...], // Only for carousel type
      "metadata": {
        "hashtags": ["relevant", "hashtags"],
        "caption": "Caption with the generated content",
        "engagement_tips": ["Specific engagement tips"]
      }
    }
  ]
}

EXAMPLES OF PROPER CONTENT GENERATION:

USER: "5 reasons why you should be in SF as an aspiring founder"
RESPONSE: Generate a carousel with 6 slides:
Slide 1: "Why San Francisco is Your Startup's Home 🌉"
Slide 2: "1. Access to top-tier VCs and Angel investors"
Slide 3: "2. Unmatched talent pool from Stanford, Berkeley, and Big Tech"
Slide 4: "3. Network effects - everyone's building something"
Slide 5: "4. Higher risk tolerance and growth mindset culture"
Slide 6: "5. Direct access to early adopters and beta users"

USER: "Dark theme motivational quote in bold"
RESPONSE: Generate single post with "The only impossible journey is the one you never begin" in bold white text on dark background

USER: "Guide to startup funding stages"
RESPONSE: Generate a carousel with:
Slide 1: "Complete Guide to Startup Funding 💰"
Slide 2: "Pre-seed: Friends & Family ($25k-500k)"
Slide 3: "Seed Round: Angels & Early VCs ($500k-2M)"
Slide 4: "Series A: Product-Market Fit ($2M-15M)"
Slide 5: "Series B: Scaling Growth ($15M-50M)"
Slide 6: "Series C+: Expansion & Beyond ($50M+)"
Slide 7: "Key Tips for Each Stage 🎯"

BANNED BEHAVIORS:
- Using placeholder text like "Your quote here" or "{content}"
- Generic motivational templates without real content
- Ignoring the user's specific requests (lists, reasons, tips)
- Using the same design regardless of content type
- Not generating actual quotes/tips/advice when requested
- Missing opportunities for carousel posts when content warrants it

REMEMBER: Your goal is to be a content creator who generates real, valuable, specific content that directly answers what the user is asking for. AUTOMATICALLY use carousels when the content type or length demands it for better engagement and readability.`;

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

    // Generate posts using Azure OpenAI GPT-4o with enhanced parameters
    const completion = await client.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4o", // Use deployment name for Azure
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT
        },
        {
          role: "user",
          content: `🎯 GENERATE ACTUAL CONTENT FOR THIS EXACT REQUEST:

"${prompt}"

CRITICAL INSTRUCTIONS:
1. GENERATE THE ACTUAL CONTENT (quotes, tips, advice) - NO PLACEHOLDERS!
2. ANALYZE THE REQUEST AND CONTENT TYPE:
   - Is this a list? → Consider one item per slide
   - Is this educational? → Break into learning chunks
   - Is this a guide/tutorial? → Step-by-step slides
   - Is this complex content? → Break into sub-topics
   - Does it have multiple parts? → Split logically

3. AUTOMATICALLY DETERMINE POST TYPE:
   - Single Post: For simple quotes, single tips, or concise messages
   - Carousel Post: For lists, guides, tutorials, or complex topics
   
4. FOR CAROUSEL POSTS:
   - Create a compelling first slide (hook + overview)
   - One main point per content slide
   - End with a strong CTA or summary slide
   - Keep consistent design across slides
   - Use clear numbering/progress indicators

5. DESIGN REQUIREMENTS:
   - If they want dark theme → USE dark backgrounds
   - If they want bold text → USE font-bold/extrabold
   - Match colors to content type
   - Keep design consistent across slides

CONTENT EXAMPLES:
- "Motivational quote" → Single post with actual quote
- "5 productivity tips" → Carousel with overview + 5 tip slides + summary
- "Guide to X" → Carousel with step-by-step breakdown
- "Compare A vs B" → Carousel with comparison slides

Generate 2-3 variants with REAL CONTENT that matches their exact request. Make the design match their style preferences (dark theme, bold, colors, etc.).

Remember: AUTOMATICALLY use carousel format when the content warrants it for better engagement and readability!`
        }
      ],
      temperature: 0.7,
      max_tokens: 6000,
      top_p: 0.9,
      frequency_penalty: 0.3,
      presence_penalty: 0.2,
      stream: false,
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No response from Azure OpenAI GPT-4o');
    }

    console.log('🔍 GPT-4o response length:', responseContent.length);

    // Clean and parse the JSON response
    let aiResponse;
    try {
      // Remove markdown code blocks if present
      let cleanedContent = responseContent.trim();
      
      if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      aiResponse = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse GPT-4o response:', parseError);
      console.error('Raw response content:', responseContent.substring(0, 500));
      
      // INTELLIGENT FALLBACK - Generate actual content based on the specific prompt
      console.log('🔧 Using intelligent fallback for prompt:', prompt);
      
      // Analyze the specific prompt to generate relevant content
      let colors = 'from-blue-600 to-indigo-600';
      let actualContent = '';
      let title = '';
      
      // SF Founders specific content
      if (/SF|san francisco|silicon valley|founder|startup|bay area/i.test(prompt)) {
        colors = 'from-slate-700 to-blue-800';
        if (/reason|why/i.test(prompt)) {
          title = '5 Reasons to Build in SF';
          actualContent = `1. Access to top-tier VCs and Angel investors
2. Unmatched talent pool from Stanford, Berkeley, and Big Tech
3. Network effects - everyone's building something
4. Higher risk tolerance and growth mindset culture
5. Direct access to early adopters and beta users`;
        } else {
          actualContent = 'San Francisco: Where impossible ideas become inevitable realities. The ecosystem that built the future.';
        }
      }
      // Business/startup content
      else if (/business|startup|entrepreneur|founder/i.test(prompt)) {
        colors = 'from-slate-800 to-blue-900';
        if (/reason|tip|advice/i.test(prompt)) {
          actualContent = 'Focus on solving real problems, not creating perfect solutions. Your customers will guide you to success.';
        } else {
          actualContent = 'Build something people want. Everything else is just noise.';
        }
      }
      // Tech content  
      else if (/tech|technology|AI|software|coding|digital|app/i.test(prompt)) {
        colors = 'from-gray-900 to-purple-900';
        actualContent = 'Code is poetry, but shipping is everything. Build, test, learn, repeat.';
      }
      // Health/fitness content
      else if (/health|fitness|wellness|exercise|nutrition|medical/i.test(prompt)) {
        colors = 'from-green-600 to-emerald-600';
        actualContent = 'Start with 10 minutes of movement daily. Small consistent actions create lasting transformations.';
      }
      // Food content
      else if (/food|recipe|cooking|restaurant|meal|diet/i.test(prompt)) {
        colors = 'from-orange-600 to-red-600';
        actualContent = 'Great cooking starts with fresh ingredients and ends with love on the plate.';
      }
      // Motivational content
      else if (/motivat|inspir|quote|success|mindset|goal/i.test(prompt)) {
        colors = 'from-orange-600 to-red-600';
        actualContent = 'The only impossible journey is the one you never begin. Start today.';
      }
      // Dark theme detection
      if (/dark|black/i.test(prompt)) {
        colors = 'from-gray-900 to-black';
      }
      
             // If no specific content generated, create something based on prompt keywords
       if (!actualContent) {
         const promptWords = prompt.toLowerCase().split(' ').filter((word: string) => word.length > 3);
         const keyWords = promptWords.slice(0, 3).join(', ');
         actualContent = `${keyWords}: The foundation of extraordinary achievements starts with extraordinary focus.`;
       }
       
       // Enhanced fallback with topic-appropriate content
       const fontWeight = /bold/i.test(prompt) ? 'font-extrabold' : 'font-bold';
       const isDarkTheme = /dark|black/i.test(prompt);
       const displayTitle = title || actualContent.split('\n')[0] || actualContent.split(' ').slice(0, 6).join(' ');
       
       aiResponse = {
         success: true,
         reasoning: `Analyzed prompt for topic-specific design. Generated actual content and applied appropriate styling for: ${prompt}`,
         variants: [
           {
             id: `variant-${Date.now()}-0`,
             type: 'single',
             title: `📋 ${displayTitle}...`,
             description: `Generated real content with ${isDarkTheme ? 'dark theme' : 'topic-focused'} design for: ${prompt}`,
                         jsx: `<div className="w-[1080px] h-[1080px] bg-gradient-to-br ${colors} flex flex-col justify-center items-center p-20 relative overflow-hidden">
  <div className="absolute inset-0 bg-black/20"></div>
  <div className="relative z-10 text-center max-w-5xl space-y-8">
    ${title ? `<h1 className="text-7xl ${fontWeight} text-white mb-8 leading-tight">${title}</h1>` : ''}
    <div className="text-4xl ${fontWeight} text-white leading-relaxed whitespace-pre-line">
      ${actualContent}
    </div>
    ${prompt.includes('quote') ? '<div className="w-20 h-1 bg-white/60 mx-auto mt-8"></div>' : ''}
  </div>
</div>`,
            metadata: {
              hashtags: prompt.toLowerCase().split(' ').filter((word: string) => word.length > 3).slice(0, 8),
              caption: `${actualContent}\n\nWhat resonates with you? 💭\n\n#motivation #inspiration #mindset`,
              engagement_tips: [
                'Post during peak engagement hours for your audience',
                'Ask a thought-provoking question to encourage discussion',
                'Use a mix of popular and niche hashtags'
              ]
            }
          }
        ]
      };
    }

    // Validate and enhance the response
    const variants: PostVariant[] = (aiResponse.variants || []).map((variant: unknown, index: number) => {
      const v = variant as Record<string, unknown>;
      const metadata = (v.metadata as Record<string, unknown>) || {};
      
      return {
        id: (v.id as string) || `variant-${Date.now()}-${index}`,
        type: (v.type as string) || 'single',
        title: (v.title as string) || `✨ ${prompt.split(' ').slice(0, 3).join(' ')}`,
        description: (v.description as string) || `Content tailored for: ${prompt}`,
        jsx: (v.jsx as string) || '',
        slides: Array.isArray(v.slides) ? (v.slides as string[]) : undefined,
        metadata: {
          hashtags: Array.isArray(metadata.hashtags) ? (metadata.hashtags as string[]).slice(0, 30) : prompt.toLowerCase().split(' ').filter((word: string) => word.length > 3).slice(0, 5),
          caption: (metadata.caption as string) || prompt,
          engagement_tips: Array.isArray(metadata.engagement_tips) ? (metadata.engagement_tips as string[]) : []
        }
      };
    });

    // Ensure we have at least one variant that matches the prompt
    if (variants.length === 0) {
      // Analyze prompt for appropriate styling
      const promptLower = prompt.toLowerCase();
      let bgGradient = 'from-blue-600 to-indigo-600';
      
      if (promptLower.includes('business') || promptLower.includes('professional')) {
        bgGradient = 'from-slate-700 to-blue-800';
      } else if (promptLower.includes('food') || promptLower.includes('recipe')) {
        bgGradient = 'from-orange-500 to-red-600';
      } else if (promptLower.includes('fitness') || promptLower.includes('health')) {
        bgGradient = 'from-green-500 to-emerald-600';
      } else if (promptLower.includes('tech') || promptLower.includes('digital')) {
        bgGradient = 'from-gray-800 to-purple-800';
      }
      
      variants.push({
        id: `variant-${Date.now()}-fallback`,
        type: 'single',
        title: `🎯 ${prompt.split(' ').slice(0, 4).join(' ')}`,
        description: `Custom design matching your topic: ${prompt}`,
        jsx: `<div className="w-[1080px] h-[1080px] bg-gradient-to-br ${bgGradient} flex flex-col justify-center items-center p-16 relative overflow-hidden">
  <div className="text-center">
    <h1 className="text-7xl font-bold text-white mb-8 leading-tight">${prompt.split(' ').slice(0, 5).join(' ')}</h1>
    <p className="text-2xl text-white/90 leading-relaxed max-w-4xl">${prompt}</p>
  </div>
  <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-white/50 rounded-full"></div>
</div>`,
        metadata: {
          hashtags: prompt.toLowerCase().split(' ').filter((word: string) => word.length > 3).slice(0, 5),
          caption: prompt,
          engagement_tips: ['Tailor your posting time to your audience', 'Use relevant hashtags for your topic']
        }
      });
    }

    console.log(`✅ [${reqId}] Generated ${variants.length} topic-specific Instagram posts for: "${prompt}"`);

    const response = NextResponse.json({
      success: true,
      reasoning: aiResponse.reasoning || `Analyzed and created content specifically tailored for: ${prompt}`,
      variants,
      timestamp: new Date().toISOString(),
      debug_info: {
        request_id: reqId,
        prompt_hash: Buffer.from(prompt).toString('base64').slice(0, 10),
        variants_count: variants.length,
        generation_source: aiResponse.variants?.length > 0 ? 'ai_generated' : 'fallback'
      }
    });

    // Prevent any caching
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;

  } catch (error) {
    console.error('Post generation error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate posts',
        reasoning: '',
        variants: []
      },
      { status: 500 }
    );
  }
} 