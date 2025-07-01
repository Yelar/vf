import { NextRequest, NextResponse } from 'next/server';
import { AzureOpenAI } from 'openai';
import { processUploadedFiles } from '@/lib/file-processor';
import { deleteS3Objects } from '@/lib/s3';
import { auth } from '@/lib/auth';
import { checkGenerationLimit, decrementGenerationLimit } from '@/lib/auth-db-mongo';

const client = new AzureOpenAI({
  endpoint: process.env.AZURE_OPENAI_ENDPOINT || "https://vfs-gpt.openai.azure.com/",
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  deployment: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4o",
  apiVersion: process.env.AZURE_OPENAI_API_VERSION || "2024-04-01-preview",
});

export async function POST(request: NextRequest) {
  const filesToCleanup: string[] = [];
  const startTime = Date.now();

  try {
    console.log('\n🚀 === QUIZ GENERATION REQUEST STARTED ===');
    
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
    
    const { topic, questionCount = 5, difficulty = 'intermediate', additionalContent = null, uploadedFiles = [] } = await request.json();

    // Get user info from middleware headers
    const userEmail = request.headers.get('x-user-email') || 'unknown';
    console.log(`👤 User: ${userEmail}`);
    console.log(`📝 Topic: "${topic}"`);
    console.log(`🔢 Question Count: ${questionCount}`);
    console.log(`📊 Difficulty: ${difficulty}`);
    console.log(`📁 Uploaded Files: ${uploadedFiles.length}`);
    console.log(`💬 Additional Content: ${additionalContent ? 'Yes' : 'No'}`);

    // Extract file keys for cleanup if files were uploaded
    if (uploadedFiles && uploadedFiles.length > 0) {
      console.log('\n📂 === FILE PROCESSING SETUP ===');
      uploadedFiles.forEach((file: { key?: string; url: string; name: string; type: string }, index: number) => {
        console.log(`📄 File ${index + 1}: ${file.name} (${file.type}) - ${file.url}`);
        if (file.key) {
          filesToCleanup.push(file.key);
          console.log(`🗂️ Added to cleanup queue: ${file.key}`);
        }
      });
      console.log(`🗑️ Total files queued for cleanup: ${filesToCleanup.length}`);
    }

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    if (!process.env.AZURE_OPENAI_API_KEY) {
      return NextResponse.json({ error: 'Azure OpenAI API key not configured' }, { status: 500 });
    }

    // Define difficulty settings
    const difficultySettings = {
      beginner: 'simple language, basic concepts, easy multiple choice questions',
      intermediate: 'moderate complexity, some detailed explanations, balanced difficulty',
      advanced: 'complex concepts, detailed technical questions, challenging scenarios'
    };

    const difficultyDesc = difficultySettings[difficulty as keyof typeof difficultySettings];

    const systemPrompt = `You are an expert quiz creator and educational content designer. Your goal is to create engaging, well-structured quiz content that can be used for video generation.

Your task is to create a quiz script that will be animated step by step. Each element in the output array represents a segment that will be shown sequentially in the video.

CRITICAL REQUIREMENTS:
1. Return ONLY a valid JSON array - no explanations, no markdown, no additional text
2. Each array element must be an object with one of these types:
   - Question objects: {"type": "question", "question_text": "...", "choices": {"A": "...", "B": "...", "C": "...", "D": "..."}, "wait_time": 5, "answer": "A"}
   - Text/Introduction objects: {"type": "text", "content": "..."}

3. Use exactly ${questionCount} questions
4. Use ${difficultyDesc}
5. Include engaging introductory text segments to connect the content
6. Wait time should always be 5 seconds for the countdown
7. Answer should be one of A, B, C, or D
8. Make questions educational and engaging for video content
9. Include variety in question types while keeping multiple choice format

EXAMPLE OUTPUT FORMAT:
[
  {"type": "text", "content": "Welcome to our quiz on quantum physics! Let's test your knowledge with some fascinating questions."},
  {"type": "question", "question_text": "What is the smallest unit of matter that retains the properties of an element?", "choices": {"A": "Proton", "B": "Atom", "C": "Electron", "D": "Neutron"}, "wait_time": 5, "answer": "B"},
  {"type": "text", "content": "Great! Now let's explore another fundamental concept."},
  {"type": "question", "question_text": "Which principle states that you cannot know both position and momentum of a particle precisely?", "choices": {"A": "Pauli Exclusion", "B": "Uncertainty Principle", "C": "Wave-Particle Duality", "D": "Superposition"}, "wait_time": 5, "answer": "B"}
]`;

    let userPrompt = `Create an engaging quiz about: "${topic}"

Generate exactly ${questionCount} multiple choice questions with connecting text segments.`;

    // Process uploaded files if provided
    let fileContent = '';
    if (uploadedFiles && uploadedFiles.length > 0) {
      console.log('\n🔄 === FILE CONTENT EXTRACTION ===');
      try {
        const processed = await processUploadedFiles(uploadedFiles);
        fileContent = processed.combinedContent;
        console.log(`✅ Extracted ${fileContent.length} characters from ${uploadedFiles.length} files`);
        console.log(`📊 Processed files:`, processed.processedFiles.map(f => ({ name: f.fileName, chars: f.textContent.length, error: f.error })));
        if (processed.errors.length > 0) {
          console.warn('⚠️ File processing errors:', processed.errors);
        }
      } catch (error) {
        console.error('❌ Error processing uploaded files:', error);
      }
    }

    // Add file content to context
    if (fileContent && fileContent.trim()) {
      userPrompt += `\n\nContent from uploaded files:\n${fileContent}`;
    }

    // Add additional content context if provided (manual input)
    if (additionalContent && additionalContent.trim()) {
      userPrompt += `\n\nAdditional context to include:\n${additionalContent.trim()}`;
    }

    userPrompt += `\n\nMake it educational, engaging, and perfect for video content. Include interesting facts and varied question types based on the provided content.`;

    console.log('\n🤖 === AI QUIZ GENERATION ===');
    console.log(`🎯 Generating quiz with Azure OpenAI GPT-4o`);
    console.log(`📏 Prompt length: ${userPrompt.length} characters`);

    const completion = await client.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4o",
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 2000,
      temperature: 0.7,
      top_p: 0.9,
      stream: false,
    });

    const generatedContent = completion.choices[0]?.message?.content?.trim();

    if (!generatedContent) {
      throw new Error('No quiz content generated from Azure OpenAI');
    }

    // Parse the JSON response
    let quizData: Array<{
      type: 'question' | 'text';
      question_text?: string;
      choices?: { A: string; B: string; C: string; D: string };
      wait_time?: number;
      answer?: 'A' | 'B' | 'C' | 'D';
      content?: string;
    }>;
    try {
      quizData = JSON.parse(generatedContent);
    } catch {
      console.error('❌ Failed to parse quiz JSON:', generatedContent);
      throw new Error('Invalid JSON format in quiz generation');
    }

    // Validate the structure
    if (!Array.isArray(quizData)) {
      throw new Error('Quiz data must be an array');
    }

    // Validate each element
    for (let i = 0; i < quizData.length; i++) {
      const item = quizData[i];
      if (!item.type) {
        throw new Error(`Item ${i} missing type field`);
      }
      
      if (item.type === 'question') {
        if (!item.question_text || !item.choices || !item.answer || typeof item.wait_time !== 'number') {
          throw new Error(`Item ${i} has invalid question structure`);
        }
        if (!['A', 'B', 'C', 'D'].includes(item.answer)) {
          throw new Error(`Item ${i} has invalid answer: ${item.answer}`);
        }
      } else if (item.type === 'text') {
        if (!item.content) {
          throw new Error(`Item ${i} has invalid text structure`);
        }
      } else {
        throw new Error(`Item ${i} has invalid type: ${item.type}`);
      }
    }

    const questionCount_actual = quizData.filter(item => item.type === 'question').length;
    const textCount = quizData.filter(item => item.type === 'text').length;

    // After successful generation, decrement the limit
    await decrementGenerationLimit(session.user.id);

    const endTime = Date.now();
    const processingTime = endTime - startTime;
    
    console.log('\n✅ === QUIZ GENERATION SUCCESS ===');
    console.log(`📊 Quiz Statistics:`, {
      topic,
      totalSegments: quizData.length,
      questions: questionCount_actual,
      textSegments: textCount,
      difficulty,
      processingTimeMs: processingTime
    });

    // Cleanup uploaded files after successful processing
    if (filesToCleanup.length > 0) {
      console.log('\n🗑️ === FILE CLEANUP ===');
      try {
        await deleteS3Objects(filesToCleanup);
        console.log(`✅ Successfully cleaned up ${filesToCleanup.length} temporary files`);
      } catch (cleanupError) {
        console.error('⚠️ Error cleaning up files (non-critical):', cleanupError);
        // Don't fail the request if cleanup fails
      }
    }

    console.log('🎉 === QUIZ GENERATION REQUEST COMPLETED SUCCESSFULLY ===\n');

    return NextResponse.json({
      success: true,
      quiz: quizData,
      topic,
      metadata: {
        questionCount: questionCount_actual,
        textSegments: textCount,
        totalSegments: quizData.length,
        difficulty,
        estimatedDuration: `${quizData.length * 10-15} seconds`, // Rough estimate
        processingTimeMs: processingTime
      },
      stats: {
        questions: questionCount_actual,
        textSegments: textCount,
        processingTime
      }
    });

  } catch (error) {
    const endTime = Date.now();
    const processingTime = endTime - startTime;
    
    console.log('\n❌ === QUIZ GENERATION ERROR ===');
    console.error('💥 Error details:', error);
    console.log(`⏱️ Processing time before error: ${processingTime}ms`);
    
    // Cleanup uploaded files even if processing failed
    if (filesToCleanup.length > 0) {
      console.log('\n🗑️ === ERROR CLEANUP ===');
      try {
        await deleteS3Objects(filesToCleanup);
        console.log(`✅ Cleaned up ${filesToCleanup.length} temporary files after error`);
      } catch (cleanupError) {
        console.error('⚠️ Error cleaning up files after error (non-critical):', cleanupError);
        // Don't fail the request further if cleanup fails
      }
    }
    
    console.log('🔚 === QUIZ GENERATION REQUEST ENDED (ERROR) ===\n');
    
    return NextResponse.json({ 
      error: 'Failed to generate quiz',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 