import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { checkGenerationLimit, decrementGenerationLimit } from '@/lib/auth-db-mongo';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check generation limit
    const limitCheck = await checkGenerationLimit(session.user.id);
    if (!limitCheck) {
      return NextResponse.json({ error: 'Failed to check generation limit' }, { status: 500 });
    }
    if (!limitCheck.canGenerate) {
      return NextResponse.json({ 
        error: 'Generation limit reached', 
        details: {
          remaining: limitCheck.remaining,
          resetDate: limitCheck.resetDate
        }
      }, { status: 429 });
    }

    const { segments, promptData } = await request.json();

    // Get user info from middleware headers
    const userEmail = request.headers.get('x-user-email') || 'unknown';
    console.log(`🎨 User ${userEmail} generating images for ${segments?.length || 0} segments`);

    if (!segments || !Array.isArray(segments)) {
      return NextResponse.json({ error: 'Segments array is required' }, { status: 400 });
    }

    const AZURE_API_KEY = process.env.AZURE_OPENAI_API_KEY;
    const AZURE_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT || "https://vfs-gpt.openai.azure.com";
    const API_VERSION = process.env.AZURE_OPENAI_API_VERSION || "2024-02-01";
    
    if (!AZURE_API_KEY) {
      return NextResponse.json({ error: 'Azure OpenAI API key not configured' }, { status: 500 });
    }

    // Function to generate image prompt from text segment (fallback)
    function generateImagePrompt(text: string): string {
      // Extract key concepts and create a descriptive prompt
      const cleanText = text.replace(/[^\w\s]/g, '').toLowerCase();
      const words = cleanText.split(' ').filter(word => word.length > 2);
      
      // Create a descriptive prompt based on the text content
      if (words.length === 0) {
        return "A clean, professional abstract background image";
      }
      
      // Build a descriptive prompt
      const mainConcepts = words.slice(0, 5).join(' ');
      return `A high-quality, professional image depicting ${mainConcepts}. Clean, modern style with good lighting and composition. Suitable for educational content.`;
    }

    // Generate images for each segment
    const imagePromises = segments.map(async (segment: { text: string; chunkIndex: number }, index: number) => {
      try {
        // Use LLM-generated prompts if available, otherwise fallback to generation
        const prompt = promptData && promptData[index] 
          ? promptData[index].prompt 
          : generateImagePrompt(segment.text);
        
        const promptSource = promptData && promptData[index] ? 'LLM-generated' : 'auto-generated';
        console.log(`🎨 Segment ${index + 1} (${promptSource}): "${segment.text}" -> prompt: "${prompt}"`);
        
        const azureUrl = `${AZURE_ENDPOINT}/openai/deployments/dall-e-3/images/generations?api-version=${API_VERSION}`;
        const openaiResponse = await fetch(azureUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${AZURE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: "dall-e-3",
            prompt: prompt,
            n: 1,
            size: "1024x1024", // Azure DALL-E 3 supports 1024x1024, 1024x1792, 1792x1024
            quality: "standard",
            style: "vivid"
          }),
        });

        if (!openaiResponse.ok) {
          console.error(`❌ Azure OpenAI API error for segment ${index + 1}:`, openaiResponse.statusText);
          
          // Try a simpler fallback prompt
          const fallbackPrompt = "A clean, professional background image suitable for educational content";
          const fallbackUrl = `${AZURE_ENDPOINT}/openai/deployments/dall-e-3/images/generations?api-version=${API_VERSION}`;
          const fallbackResponse = await fetch(fallbackUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${AZURE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: "dall-e-3",
              prompt: fallbackPrompt,
              n: 1,
              size: "1024x1024",
              quality: "standard",
              style: "vivid"
            }),
          });
          
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            return {
              segmentIndex: index,
              imageUrl: fallbackData.data[0]?.url || '',
              description: 'AI-generated fallback image',
              prompt: fallbackPrompt
            };
          }
          
          return null;
        }

        const data = await openaiResponse.json();
        const image = data.data[0]; // OpenAI returns data array with generated images
        
        if (image && image.url) {
          return {
            segmentIndex: index,
            imageUrl: image.url,
            description: `AI-generated image for: ${prompt}`,
            prompt: prompt
          };
        }
        
        return null;
      } catch (error) {
        console.error(`❌ Error generating image for segment ${index + 1}:`, error);
        return null;
      }
    });

    const results = await Promise.all(imagePromises);
    const validImages = results.filter(result => result !== null);

    // Decrement the generation limit after successful generation
    await decrementGenerationLimit(session.user.id);

    console.log(`✅ Successfully generated ${validImages.length}/${segments.length} images with Azure OpenAI DALL-E 3`);

    return NextResponse.json({
      success: true,
      images: validImages,
      total: validImages.length
    });

  } catch (error) {
    console.error('❌ Azure OpenAI image generation error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate images',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 