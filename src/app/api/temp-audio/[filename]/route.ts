import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    
    // Security: Only allow files that start with 'audio-' and end with '.mp3'
    if (!filename.startsWith('audio-') || !filename.endsWith('.mp3')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }
    
    const filePath = path.join('/tmp', filename);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json({ 
        error: 'File not found',
        statusCode: 404,
        message: `The requested path (${filePath}) could not be found`
      }, { status: 404 });
    }
    
    // Read and serve the file
    const fileBuffer = await fs.readFile(filePath);
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('❌ Error serving temporary audio file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 