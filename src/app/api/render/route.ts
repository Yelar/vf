import { NextRequest } from 'next/server'
import { bundle } from '@remotion/bundler'
import { getCompositions, renderMedia } from '@remotion/renderer'
import path from 'path'
import { v4 as uuid } from 'uuid'
import fs from 'fs/promises'

export const POST = async (req: NextRequest) => {
  try {
    const inputProps = await req.json()

    // Get user info from middleware headers
    const userEmail = req.headers.get('x-user-email') || 'unknown';
    console.log(`🎬 User ${userEmail} starting DialogueVideo render`);

    if (!inputProps.transcript || !Array.isArray(inputProps.transcript)) {
      return new Response('Transcript is required', { status: 400 });
    }

    const entry = path.join(process.cwd(), 'src', 'remotion', 'Root.tsx')

    const bundleLocation = await bundle({
      entryPoint: entry,
      outDir: path.join(process.cwd(), 'out'),
      onProgress: (p) => console.log(`Bundling: ${p}%`),
      webpackOverride: (config) => config,
    })

    const comps = await getCompositions(bundleLocation, {
      inputProps,
    })

    const comp = comps.find((c) => c.id === 'DialogueVideo')
    if (!comp) return new Response('Composition not found', { status: 404 })

    const outputPath = path.join('/tmp', `video-${uuid()}.mp4`)

    await renderMedia({
      serveUrl: bundleLocation,
      composition: comp,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps,
    })

    const file = await fs.readFile(outputPath)
    
    // Clean up temporary file
    await fs.unlink(outputPath).catch(() => {})
    
    console.log(`✅ User ${userEmail} successfully rendered video`);
    
    return new Response(file, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': 'attachment; filename=video.mp4',
      },
    })
  } catch (error) {
    console.error('Error rendering video:', error)
    return new Response('Internal server error', { status: 500 })
  }
}