import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { segments, keywordData } = await request.json();

    // Get user info from middleware headers
    const userEmail = request.headers.get('x-user-email') || 'unknown';
    console.log(`🖼️ User ${userEmail} fetching Unsplash images for ${segments?.length || 0} segments`);

    if (!segments || !Array.isArray(segments)) {
      return NextResponse.json({ error: 'Segments array is required' }, { status: 400 });
    }

    const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
    if (!UNSPLASH_ACCESS_KEY) {
      return NextResponse.json({ error: 'Unsplash API key not configured' }, { status: 500 });
    }

    // Function to extract keywords from text segment (fallback)
    function extractKeywords(text: string): string {
      // Remove punctuation and common words
      const commonWords = new Set([
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
        'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
        'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those',
        'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'
      ]);
      
      const words = text.toLowerCase()
        .replace(/[^\w\s]/g, '') // Remove punctuation
        .split(' ')
        .filter(word => word.length > 2 && !commonWords.has(word))
        .slice(0, 3); // Take first 3 meaningful words
      
      return words.join(' ') || text.split(' ')[0]; // Fallback to first word if no keywords found
    }

    // Fetch images for each segment
    const imagePromises = segments.map(async (segment: { text: string; chunkIndex: number }, index: number) => {
      try {
        // Use LLM-generated keywords if available, otherwise fallback to extraction
        const keywords = keywordData && keywordData[index] 
          ? keywordData[index].keywords 
          : extractKeywords(segment.text);
        
        const keywordSource = keywordData && keywordData[index] ? 'LLM-generated' : 'extracted';
        console.log(`🔍 Segment ${index + 1} (${keywordSource}): "${segment.text}" -> keywords: "${keywords}"`);
        
        const unsplashUrl = `https://api.unsplash.com/photos/random?query=${encodeURIComponent(keywords)}&count=1&orientation=portrait`;
        
        const response = await fetch(unsplashUrl, {
          headers: {
            'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
          },
        });

        if (!response.ok) {
          console.error(`❌ Unsplash API error for segment ${index + 1}:`, response.statusText);
          // Return a fallback image if the specific query fails
          const fallbackResponse = await fetch(`https://api.unsplash.com/photos/random?count=1&orientation=portrait`, {
            headers: {
              'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
            },
          });
          
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            return {
              segmentIndex: index,
              imageUrl: fallbackData[0]?.urls?.regular || '',
              description: fallbackData[0]?.description || 'Fallback image',
              keywords: 'general'
            };
          }
          
          return null;
        }

        const data = await response.json();
        const image = data[0]; // Since we're requesting count=1, it returns an array with one item
        
        if (image && image.urls && image.urls.regular) {
          return {
            segmentIndex: index,
            imageUrl: image.urls.regular,
            description: image.description || image.alt_description || `Image for "${keywords}"`,
            keywords: keywords
          };
        }
        
        return null;
      } catch (error) {
        console.error(`❌ Error fetching image for segment ${index + 1}:`, error);
        return null;
      }
    });

    const results = await Promise.all(imagePromises);
    const validImages = results.filter(result => result !== null);

    console.log(`✅ Successfully fetched ${validImages.length}/${segments.length} images from Unsplash`);

    return NextResponse.json({
      success: true,
      images: validImages,
      total: validImages.length
    });

  } catch (error) {
    console.error('❌ Unsplash images fetch error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch images',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 