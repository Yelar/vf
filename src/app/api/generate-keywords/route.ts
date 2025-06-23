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
    console.log(`🧠 User ${userEmail} generating keywords for ${segments?.length || 0} segments`);

    if (!segments || !Array.isArray(segments)) {
      return NextResponse.json({ error: 'Segments array is required' }, { status: 400 });
    }

    if (!process.env.AZURE_OPENAI_API_KEY) {
      return NextResponse.json({ error: 'Azure OpenAI API key not configured' }, { status: 500 });
    }

    const systemPrompt = `You are an expert image search keyword generator. Your job is to analyze text segments and generate the most relevant, specific keywords that would find appropriate images on Unsplash.

Rules for keyword generation:
1. Focus on visual, concrete concepts that can be photographed
2. Avoid abstract concepts unless they have clear visual representations
3. Generate 2-4 keywords per segment that are most likely to find relevant stock photos
4. Consider the context and mood of the text
5. Prioritize nouns and visual adjectives
6. Think about what kind of image would best represent or complement this text visually

Return ONLY a JSON array where each element corresponds to a segment and contains an array of keywords.

Example input: ["Quantum physics is fascinating", "The ocean waves crash against the shore"]
Example output: [["science laboratory microscope technology"], ["ocean waves beach coastline"]]`;

    const segmentTexts = segments.map((seg: {text: string} | string) => 
      typeof seg === 'string' ? seg : seg.text
    );
    const userPrompt = `Generate relevant image search keywords for these text segments:

${segmentTexts.map((text: string, index: number) => `${index + 1}. "${text}"`).join('\n')}

Return a JSON array of keyword arrays, one for each segment.`;

    console.log(`🤖 Using Azure OpenAI GPT-4o to generate keywords for ${segmentTexts.length} segments...`);

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

    const keywordResult = completion.choices[0]?.message?.content?.trim();

    if (!keywordResult) {
      throw new Error('No keyword result from Azure OpenAI');
    }

    // Parse the JSON response
    let generatedKeywords: string[][];
    try {
      generatedKeywords = JSON.parse(keywordResult);
    } catch {
      console.error('❌ Failed to parse Azure OpenAI response as JSON:', keywordResult);
      // Fallback to simple keyword extraction if LLM response is malformed
      generatedKeywords = segmentTexts.map((text: string) => {
        const words = text.toLowerCase()
          .replace(/[^\w\s]/g, '')
          .split(' ')
          .filter(word => word.length > 3)
          .slice(0, 3);
        return [words.join(' ') || text.split(' ')[0]];
      });
    }

    // Validate and clean keywords
    if (!Array.isArray(generatedKeywords) || generatedKeywords.length !== segmentTexts.length) {
      throw new Error('Invalid keyword result format');
    }

    // Process and clean keywords
    const processedKeywords = generatedKeywords.map((keywords: string[] | string, index: number) => {
      let keywordArray: string[];
      if (!Array.isArray(keywords)) {
        // If it's a single string, split it
        keywordArray = [String(keywords)];
      } else {
        keywordArray = keywords;
      }
      
      // Join keywords for search and clean up
      const searchQuery = keywordArray
        .join(' ')
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      return {
        segmentIndex: index,
        originalText: segmentTexts[index],
        keywords: searchQuery || segmentTexts[index].split(' ')[0]
      };
    });

    console.log(`✅ Successfully generated keywords:`, 
      processedKeywords.map(item => `"${item.originalText}" -> "${item.keywords}"`));

    return NextResponse.json({
      success: true,
      keywordData: processedKeywords,
      method: 'llm-generated'
    });

  } catch (error) {
    console.error('❌ Keyword generation error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate keywords',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 