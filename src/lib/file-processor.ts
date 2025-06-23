/**
 * Utility functions for processing uploaded files and extracting text content
 * for quiz generation and other content creation purposes.
 */

export interface ProcessedFileContent {
  fileName: string;
  fileType: string;
  textContent: string;
  error?: string;
}

/**
 * Extract text content from an uploaded file
 * Currently supports basic text extraction from various file types
 */
export async function extractTextFromFile(
  fileUrl: string, 
  fileName: string, 
  fileType: string
): Promise<ProcessedFileContent> {
  try {
    console.log(`📄 Processing file: ${fileName} (${fileType})`);
    
    // Fetch the file content
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }

    let textContent = '';

    // Handle different file types
    if (fileType.includes('text/plain') || fileType.includes('text/')) {
      // Plain text files
      textContent = await response.text();
    } else if (fileType.includes('application/pdf')) {
      // For PDFs, we'll return a placeholder for now
      // In a production environment, you'd use a library like pdf-parse
      textContent = '[PDF content - manual text extraction required]';
      console.log('⚠️ PDF processing not implemented - manual extraction needed');
    } else if (fileType.includes('application/json')) {
      // JSON files
      const jsonContent = await response.json();
      textContent = JSON.stringify(jsonContent, null, 2);
    } else if (fileType.includes('image/')) {
      // For images, provide a placeholder since we can't extract text from them
      textContent = `[Image file: ${fileName} - Image content analysis not implemented. Consider using OCR for text extraction from images.]`;
      console.log('ℹ️ Image file detected - no text extraction available');
    } else {
      // Try to treat as text for other types
      textContent = await response.text();
    }

    // Clean and validate text content
    if (!textContent || textContent.trim().length === 0) {
      throw new Error('No text content found in file');
    }

    // Limit content length to prevent token overflow
    const maxLength = 8000; // Adjust based on your needs
    if (textContent.length > maxLength) {
      textContent = textContent.substring(0, maxLength) + '\n\n[Content truncated due to length...]';
      console.log(`📝 Content truncated to ${maxLength} characters`);
    }

    console.log(`✅ Successfully extracted ${textContent.length} characters from ${fileName}`);

    return {
      fileName,
      fileType,
      textContent: textContent.trim()
    };

  } catch (error) {
    console.error(`❌ Error processing file ${fileName}:`, error);
    return {
      fileName,
      fileType,
      textContent: '',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Process multiple uploaded files and combine their text content
 */
export async function processUploadedFiles(
  files: Array<{ url: string; name: string; type: string }>
): Promise<{
  combinedContent: string;
  processedFiles: ProcessedFileContent[];
  errors: string[];
}> {
  const processedFiles: ProcessedFileContent[] = [];
  const errors: string[] = [];
  let combinedContent = '';

  console.log(`📂 Processing ${files.length} uploaded files...`);

  for (const file of files) {
    const result = await extractTextFromFile(file.url, file.name, file.type);
    processedFiles.push(result);

    if (result.error) {
      errors.push(`${result.fileName}: ${result.error}`);
    } else if (result.textContent) {
      combinedContent += `\n\n--- Content from ${result.fileName} ---\n${result.textContent}`;
    }
  }

  // Clean up the combined content
  combinedContent = combinedContent.trim();

  console.log(`✅ Processed ${processedFiles.length} files, ${errors.length} errors`);
  console.log(`📄 Combined content length: ${combinedContent.length} characters`);

  return {
    combinedContent,
    processedFiles,
    errors
  };
}

/**
 * Validate file types for quiz content
 */
export function validateQuizFiles(files: Array<{ name: string; type: string; size: number }>) {
  const allowedTypes = [
    'text/plain',
    'text/markdown',
    'text/csv',
    'application/pdf',
    'application/json',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/gif',
    'image/webp'
  ];

  const maxSize = 32 * 1024 * 1024; // 32MB
  const errors: string[] = [];

  for (const file of files) {
    // Check file type
    if (!allowedTypes.some(type => file.type.includes(type))) {
      errors.push(`${file.name}: Unsupported file type (${file.type})`);
    }

    // Check file size
    if (file.size > maxSize) {
      errors.push(`${file.name}: File too large (${Math.round(file.size / 1024 / 1024)}MB > 32MB)`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
} 