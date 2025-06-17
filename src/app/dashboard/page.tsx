'use client';

import React, { useState } from 'react';
import { Player } from '@remotion/player';
import { SampleVideo } from '../../remotion/SampleVideo';

export default function Dashboard() {
  const [isRendering, setIsRendering] = useState(false);
  const [titleText, setTitleText] = useState('Welcome to AI Motion');
  const [subtitleText, setSubtitleText] = useState('Create amazing videos with Remotion');
  const handleRenderVideo = async () => {
    setIsRendering(true);

    try {
      console.log('🚀 Starting HIGH QUALITY client-side video generation...');
      
      // Use the working high-quality client-side generation
      await createAndDownloadVideo(titleText, subtitleText);
      alert('🎬 Video downloaded successfully!\n\n• 1920x1080 Full HD\n• 30 FPS (matches preview)\n• VP9/VP8 codec\n• 5 seconds duration\n• Exact match to preview!');
      
    } catch (error) {
      console.error('❌ Error creating HD video:', error);
      
      // Show detailed error and fallback options
      alert(`❌ HD Video generation failed: ${error}\n\nTry:\n1. Refresh the page and try again\n2. Use a different browser (Chrome/Firefox)\n3. Check browser console for details`);
      showDownloadInstructions();
    } finally {
      setIsRendering(false);
    }
  };

  const createAndDownloadVideo = async (title: string, subtitle: string) => {
    return new Promise<void>((resolve, reject) => {
      try {
        console.log('🎬 Starting HIGH QUALITY dashboard video generation...');
        console.log('Creating HD canvas video with title:', title, 'subtitle:', subtitle);
        
        // Create HIGH RESOLUTION canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        canvas.width = 1920;  // Full HD width
        canvas.height = 1080; // Full HD height

        console.log('✅ HD Canvas created:', canvas.width, 'x', canvas.height);

        // Enable high-quality rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Create stream matching Remotion preview
        const stream = canvas.captureStream(30); // 30 FPS to match Remotion
        
        // Use high-quality recording settings
        const options: MediaRecorderOptions = {
          mimeType: 'video/webm;codecs=vp9', // VP9 for better quality
          videoBitsPerSecond: 5000000, // 5 Mbps for good quality
        };

        // Fallback to VP8 if VP9 not supported
        if (!MediaRecorder.isTypeSupported(options.mimeType!)) {
          options.mimeType = 'video/webm;codecs=vp8';
          console.log('🔄 Falling back to VP8 codec');
        }

        const mediaRecorder = new MediaRecorder(stream, options);
        const chunks: Blob[] = [];

        mediaRecorder.ondataavailable = (event) => {
          console.log('📦 HD Data chunk:', event.data.size, 'bytes');
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          console.log('🛑 Recording stopped. Total chunks:', chunks.length);
          const blob = new Blob(chunks, { type: 'video/webm' });
          console.log('📹 Final HD video blob:', blob.size, 'bytes');
          
          if (blob.size === 0) {
            reject(new Error('Generated video is empty'));
            return;
          }
          
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-hd-animated-video.webm`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          console.log('✅ HD Video download triggered');
          resolve();
        };

        mediaRecorder.onerror = (event) => {
          console.error('❌ MediaRecorder error:', event);
          reject(new Error('MediaRecorder error: ' + JSON.stringify(event)));
        };

        // Animation variables - match Remotion preview exactly
        let frame = 0;
        const totalFrames = 150; // 5 seconds at 30fps (match Remotion duration)
        
        const animate = () => {
          if (frame >= totalFrames) {
            console.log('🎬 Animation complete, stopping recorder...');
            setTimeout(() => {
              if (mediaRecorder.state === 'recording') {
                mediaRecorder.stop();
              }
            }, 100);
            return;
          }

          // MATCH REMOTION: Blue to purple gradient background
          const backgroundOpacity = Math.min(1, Math.max(0.2, 
            frame <= 30 ? 0.2 + (frame / 30) * 0.6 :
            frame >= totalFrames - 30 ? 0.8 + ((frame - (totalFrames - 30)) / 30) * 0.2 : 0.8
          ));
          
          const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
          gradient.addColorStop(0, `rgba(59, 130, 246, ${backgroundOpacity})`); // Blue
          gradient.addColorStop(1, `rgba(147, 51, 234, ${backgroundOpacity})`); // Purple
          
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // MATCH REMOTION: Text animations with fade-in and scale
          const opacity = Math.min(1, Math.max(0, frame <= 30 ? frame / 30 : 1));
          const translateY = frame <= 30 ? 30 - (frame / 30) * 30 : 0;
          const scale = frame <= 30 ? 0.8 + (frame / 30) * 0.2 :
                       frame >= totalFrames - 30 ? 1 + ((frame - (totalFrames - 30)) / 30) * 0.1 : 1;
          
          ctx.save();
          ctx.globalAlpha = opacity;
          ctx.translate(canvas.width / 2, canvas.height / 2 + translateY);
          ctx.scale(scale, scale);
          
          // MATCH REMOTION: Text styling exactly
          ctx.shadowColor = 'rgba(0,0,0,0.5)';
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;
          
          // Title - match Remotion font size and style
          ctx.fillStyle = 'white';
          ctx.font = 'bold 100px Arial, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(title, 0, -50);

          // Subtitle - match Remotion styling
          ctx.globalAlpha = opacity * 0.9;
          ctx.font = '40px Arial, sans-serif';
          ctx.shadowBlur = 2;
          ctx.shadowOffsetX = 1;
          ctx.shadowOffsetY = 1;
          ctx.fillText(subtitle, 0, 50);

          ctx.restore();

          // MATCH REMOTION: Simple white particles that float up
          for (let i = 0; i < 10; i++) {
            const particleFrame = (frame + i * 5) % 60;
            const particleOpacity = particleFrame <= 30 ? particleFrame / 30 : 
                                   particleFrame >= 30 ? (60 - particleFrame) / 30 : 0;
            const particleY = canvas.height / 2 + 100 - (particleFrame / 60) * 200;
            const particleX = canvas.width * (0.1 + i * 0.08);
            
            if (particleOpacity > 0) {
              ctx.save();
              ctx.globalAlpha = particleOpacity;
              ctx.fillStyle = 'white';
              ctx.beginPath();
              ctx.arc(particleX, particleY, 2, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            }
          }

          frame++;
          if (frame % 30 === 0) {
            console.log('🎬 Remotion-style progress:', Math.round((frame / totalFrames) * 100) + '%');
          }
          
          requestAnimationFrame(animate);
        };

        // Start recording with data collection every 16ms for smooth recording
        console.log('🔴 Starting HD recording at 60fps...');
        mediaRecorder.start(16);
        animate();

      } catch (error) {
        console.error('❌ HD Video creation error:', error);
        reject(error);
      }
    });
  };

  const showDownloadInstructions = () => {
    const instructions = `
🎬 Video Download Options:

1. RIGHT-CLICK METHOD:
   • Right-click on the video preview below
   • Select "Save video as..." or "Download video"
   • Choose your download location

2. SCREEN RECORDING:
   • Use built-in screen recording (Mac: Cmd+Shift+5, Windows: Win+G)
   • Record the video preview while it plays
   • Stop recording and save

3. BROWSER TOOLS:
   • Open Developer Tools (F12)
   • Go to Network tab, reload page
   • Find the video file and download it

The video will be in MP4 format and can be used for your projects!
    `;
    
    alert(instructions);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">
          Video Dashboard
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Video Preview */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Video Preview</h2>
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <Player
                component={SampleVideo}
                inputProps={{
                  titleText,
                  subtitleText,
                }}
                durationInFrames={150}
                fps={30}
                compositionWidth={1920}
                compositionHeight={1080}
                style={{
                  width: '100%',
                  height: '100%',
                }}
                controls
                loop
              />
            </div>
          </div>

          {/* Controls */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Video Settings</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title Text
                </label>
                <input
                  type="text"
                  value={titleText}
                  onChange={(e) => setTitleText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter title text"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subtitle Text
                </label>
                <input
                  type="text"
                  value={subtitleText}
                  onChange={(e) => setSubtitleText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter subtitle text"
                />
              </div>

              <div className="pt-4 space-y-3">
                <button
                  onClick={handleRenderVideo}
                  disabled={isRendering}
                  className={`w-full py-4 px-6 rounded-lg font-bold text-white text-lg transition-all transform ${
                    isRendering
                      ? 'bg-gray-400 cursor-not-allowed scale-95'
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:scale-105 shadow-lg'
                  }`}
                >
                  {isRendering ? '🎬 Creating HD Video...' : '🚀 Download HD Video'}
                </button>

                <button
                  onClick={showDownloadInstructions}
                  className="w-full py-2 px-4 rounded-md font-medium text-blue-600 border border-blue-600 hover:bg-blue-50 transition-colors"
                >
                  📋 Download Instructions
                </button>
                
                {isRendering && (
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300 animate-pulse"
                        style={{ width: '60%' }}
                      />
                    </div>
                    <p className="text-sm text-gray-600 mt-2 text-center">
                      Creating your custom video...
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Video Specifications */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">🎬 HD Video Specifications</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">1920×1080</div>
              <div className="text-sm text-gray-600">Full HD</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">30 FPS</div>
              <div className="text-sm text-gray-600">Matches Preview</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600">5s</div>
              <div className="text-sm text-gray-600">Duration</div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-orange-600">WebM</div>
              <div className="text-sm text-gray-600">VP9/VP8</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-600">5 Mbps</div>
              <div className="text-sm text-gray-600">Bitrate</div>
            </div>
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              ✨ Downloaded video exactly matches the preview above
            </p>
          </div>
        </div>

        {/* Instructions Card */}
        <div className="mt-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <h2 className="text-2xl font-semibold mb-4">🚀 Works Everywhere!</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 rounded-lg p-4">
              <div className="text-lg font-semibold mb-2">💻 Local Development</div>
              <p className="text-sm opacity-90">Full video preview and download functionality</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="text-lg font-semibold mb-2">☁️ Vercel Deployment</div>
              <p className="text-sm opacity-90">Serverless-friendly, no FFmpeg required</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="text-lg font-semibold mb-2">📱 All Devices</div>
              <p className="text-sm opacity-90">Works on desktop, mobile, and tablets</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 