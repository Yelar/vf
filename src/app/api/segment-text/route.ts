import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    // Get user info from middleware headers
    const userEmail = request.headers.get('x-user-email') || 'unknown';
    console.log(`🧠 User ${userEmail} segmenting text: "${text.slice(0, 50)}..."`);

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: 'GROQ API key not configured' }, { status: 500 });
    }

    const systemPrompt = `You are an expert text segmentation specialist. Your job is to divide text into natural, meaningful segments that work well for text-to-speech and video subtitles.

Rules for segmentation:
1. Group related ideas together in the same segment
2. Each segment should feel complete and natural when spoken
3. Segments should be 8-25 words each for optimal pacing
4. Break at natural pauses: after complete thoughts, before transitions, at punctuation
5. Maintain the flow and meaning of the original text
6. Don't break in the middle of important phrases or concepts

Return ONLY a JSON array of strings, where each string is a text segment. Do not include any other text, explanations, or formatting.

Example input: "Quantum physics is fascinating. It deals with the smallest particles in the universe. These particles behave in ways that seem impossible. They can be in multiple places at once, which is called superposition."

Example output: ["Quantum physics is fascinating.", "It deals with the smallest particles in the universe.", "These particles behave in ways that seem impossible.", "They can be in multiple places at once, which is called superposition."]`;

    const userPrompt = `Segment this text into natural, meaningful chunks for text-to-speech:

"${text}"`;

    console.log(`🤖 Using GROQ to segment text intelligently...`);

    const completion = await groq.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 1000,
      temperature: 0.3, // Lower temperature for consistent formatting
      top_p: 0.9,
      stream: false,
    });

    const segmentationResult = completion.choices[0]?.message?.content?.trim();

    if (!segmentationResult) {
      throw new Error('No segmentation result from GROQ');
    }

    // Parse the JSON response
    let segments: string[];
    try {
      segments = JSON.parse(segmentationResult);
    } catch {
      console.error('❌ Failed to parse GROQ response as JSON:', segmentationResult);
      // Fallback to basic segmentation if LLM response is malformed
      segments = text
        .split(/[.!?]+/)
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0)
        .map((s: string) => s + (s.endsWith('.') || s.endsWith('!') || s.endsWith('?') ? '' : '.'));
    }

    // Validate segments
    if (!Array.isArray(segments) || segments.length === 0) {
      throw new Error('Invalid segmentation result');
    }

    // Clean up segments
    const cleanedSegments = segments
      .map(segment => segment.trim())
      .filter(segment => segment.length > 0)
      .map(segment => {
        // Ensure proper punctuation for natural speech
        if (!/[.!?]$/.test(segment)) {
          segment += '.';
        }
        return segment;
      });

    console.log(`✅ Successfully segmented text into ${cleanedSegments.length} intelligent segments:`, 
      cleanedSegments.map(s => `"${s.slice(0, 30)}${s.length > 30 ? '...' : ''}"`));

    return NextResponse.json({
      success: true,
      segments: cleanedSegments,
      originalText: text,
      method: 'llm-intelligent'
    });

  } catch (error) {
    console.error('❌ Text segmentation error:', error);
    return NextResponse.json({ 
      error: 'Failed to segment text',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 