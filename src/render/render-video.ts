import { bundle } from '@remotion/bundler'
import { getCompositions, renderMedia } from '@remotion/renderer'
import path from 'path'
import { v4 as uuid } from 'uuid'

const entry = path.join(process.cwd(), 'src', 'remotion', 'Root.tsx')

async function main() {
  const bundleLocation = await bundle({
    entryPoint: entry,
    outDir: path.join(process.cwd(), 'out'),
    onProgress: (p) => console.log(`Bundling: ${p}%`),
    webpackOverride: (config) => config,
  })

  const inputProps = {
    transcript: [
      { word: 'Hello', start: 0 },
      { word: 'World', start: 15 }
    ],
    voiceChunks: [],
    images: [],
    bgVideo: '/assets/bg.mp4',
    bgMusic: '/assets/music.mp3'
  }

  const comps = await getCompositions(bundleLocation, {
    inputProps,
  })

  const composition = comps.find((c) => c.id === 'DialogueVideo')
  if (!composition) throw new Error('Composition not found')

  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: 'h264',
    outputLocation: path.join(process.cwd(), 'out', `video-${uuid()}.mp4`),
    inputProps,
  })

  console.log('✅ Video rendered successfully!')
}

main().catch(console.error) 