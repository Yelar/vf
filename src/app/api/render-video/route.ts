import { NextRequest, NextResponse } from 'next/server';
import { renderMedia } from '@remotion/renderer';
import path from 'path';
import os from 'os';
import fs from 'fs';

export async function POST(req: NextRequest) {
  const { speechText, backgroundVideo, audioSrc, audioDuration } = await req.json();

  // Path to your Remotion project (must be built or served)
  // If your Next.js app serves the Remotion preview at /, use that:
  const serveUrl = 'http://localhost:3000'; // Or your deployed Remotion preview server

  // Temporary output file
  const outPath = path.join(os.tmpdir(), `remotion-out-${Date.now()}.mp4`);

  try {
    await renderMedia({
      serveUrl,
      composition: 'SampleVideo',
      codec: 'h264',
      outName: outPath,
      inputProps: { speechText, backgroundVideo, audioSrc, audioDuration },
      // You can add more options here (fps, width, height, etc.)
    });

    // Read the file and return as a stream
    const fileBuffer = fs.readFileSync(outPath);
    fs.unlinkSync(outPath); // Clean up

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': 'attachment; filename=\"video.mp4\"',
      },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
} 