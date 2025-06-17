import { NextRequest, NextResponse } from 'next/server';
import { renderVideoLambda } from '../../../lambdas/video-renderer';
import type { VideoRenderRequest } from '../../../lambdas/video-renderer';

export async function POST(request: NextRequest) {
  try {
    const { compositionId, props } = await request.json();

    console.log('Starting Lambda video render...');
    console.log('Composition ID:', compositionId);
    console.log('Props:', props);

    // Prepare Lambda request
    const lambdaRequest: VideoRenderRequest = {
      titleText: props.titleText,
      subtitleText: props.subtitleText,
      outputFormat: 'mp4',
      quality: 'high'
    };

    // Execute Lambda function
    const lambdaResponse = await renderVideoLambda(lambdaRequest);

    if (!lambdaResponse.success || !lambdaResponse.videoBuffer) {
      throw new Error(lambdaResponse.error || 'Lambda rendering failed');
    }

    console.log('Lambda render completed successfully');
    console.log('Video metadata:', lambdaResponse.metadata);

    return new NextResponse(lambdaResponse.videoBuffer, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="${compositionId}-${Date.now()}.mp4"`,
        'Content-Length': lambdaResponse.videoBuffer.length.toString(),
        'X-Video-Duration': String(lambdaResponse.metadata?.duration || 5),
        'X-Video-Resolution': `${lambdaResponse.metadata?.width || 1920}x${lambdaResponse.metadata?.height || 1080}`,
      },
    });

  } catch (error) {
    console.error('Error in Lambda video rendering:', error);
    return NextResponse.json(
      { 
        error: 'Failed to render video via Lambda', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 