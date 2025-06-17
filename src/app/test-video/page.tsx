'use client';

import React, { useState } from 'react';

export default function TestVideo() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const generateTestVideo = async () => {
    setIsGenerating(true);
    setVideoUrl(null);

    try {
      console.log('🎬 Starting HIGH QUALITY video generation...');
      
      // Create HIGH RESOLUTION canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      canvas.width = 1920;  // Full HD width
      canvas.height = 1080; // Full HD height
      
      console.log('✅ HD Canvas created:', canvas.width, 'x', canvas.height);

      // Enable high-quality rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Create HIGH QUALITY stream
      const stream = canvas.captureStream(60); // 60 FPS for smooth motion
      
      // Use high-quality recording settings
      const options: MediaRecorderOptions = {
        mimeType: 'video/webm;codecs=vp9', // VP9 for better quality
        videoBitsPerSecond: 8000000, // 8 Mbps for high quality
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
        chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        console.log('🛑 Recording stopped');
        const blob = new Blob(chunks, { type: 'video/webm' });
        console.log('📹 Final HD video blob:', blob.size, 'bytes');
        
        if (blob.size > 0) {
          const url = URL.createObjectURL(blob);
          setVideoUrl(url);
          
          // Auto-download
          const a = document.createElement('a');
          a.href = url;
          a.download = 'high-quality-animated-video.webm';
          a.click();
          
          console.log('✅ HIGH QUALITY Video generated and download triggered!');
        } else {
          console.error('❌ Empty video blob');
        }
      };

      // Start recording with data collection every 16ms for smooth recording
      mediaRecorder.start(16);
      console.log('🔴 HD Recording started at 60fps');

      // Animate for 180 frames (3 seconds at 60fps)
      let frame = 0;
      const totalFrames = 180;
      
      const animate = () => {
        if (frame >= totalFrames) {
          mediaRecorder.stop();
          return;
        }

        // Clear with HIGH QUALITY animated gradient background
        const time = frame / 60; // time in seconds
        const gradient = ctx.createRadialGradient(
          canvas.width / 2, canvas.height / 2, 0,
          canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 2
        );
        
        const hue1 = (time * 30) % 360;
        const hue2 = (time * 30 + 120) % 360;
        const hue3 = (time * 30 + 240) % 360;
        
        gradient.addColorStop(0, `hsl(${hue1}, 80%, 60%)`);
        gradient.addColorStop(0.5, `hsl(${hue2}, 70%, 50%)`);
        gradient.addColorStop(1, `hsl(${hue3}, 80%, 40%)`);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Add subtle noise/texture for premium look
        for (let i = 0; i < 100; i++) {
          ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.1})`;
          ctx.fillRect(
            Math.random() * canvas.width,
            Math.random() * canvas.height,
            2, 2
          );
        }

        // Draw HIGH QUALITY animated text with shadows and effects
        const scale = 0.8 + Math.sin(time * 2) * 0.2;
        const rotation = Math.sin(time * 0.5) * 0.1;
        
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(rotation);
        ctx.scale(scale, scale);
        
        // Text shadow
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;
        
        // Main title with gradient fill
        const titleGradient = ctx.createLinearGradient(-300, -50, 300, 50);
        titleGradient.addColorStop(0, '#ffffff');
        titleGradient.addColorStop(0.5, '#f0f0f0');
        titleGradient.addColorStop(1, '#e0e0e0');
        
        ctx.fillStyle = titleGradient;
        ctx.strokeStyle = 'rgba(0,0,0,0.8)';
        ctx.lineWidth = 8;
        ctx.font = 'bold 120px "Helvetica Neue", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.strokeText('HIGH QUALITY', 0, -60);
        ctx.fillText('HIGH QUALITY', 0, -60);

        // Subtitle
        ctx.font = 'bold 60px "Helvetica Neue", Arial, sans-serif';
        ctx.strokeText('TEST VIDEO', 0, 40);
        ctx.fillText('TEST VIDEO', 0, 40);

        // Frame counter (smaller)
        ctx.font = '32px "Helvetica Neue", Arial, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fillText(`Frame ${frame}/${totalFrames}`, 0, 120);

        ctx.restore();

        // Add animated particles for premium effect
        for (let i = 0; i < 20; i++) {
          const particleTime = (time + i * 0.1) * 2;
          const x = canvas.width / 2 + Math.cos(particleTime) * (200 + i * 20);
          const y = canvas.height / 2 + Math.sin(particleTime * 1.3) * (150 + i * 15);
          const size = 3 + Math.sin(particleTime * 3) * 2;
          
          ctx.fillStyle = `hsl(${(particleTime * 100 + i * 36) % 360}, 80%, 70%)`;
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }

        frame++;
        if (frame % 30 === 0) {
          console.log('🎬 HD Animation progress:', Math.round((frame / totalFrames) * 100) + '%');
        }
        
        requestAnimationFrame(animate);
      };

      animate();

    } catch (error) {
      console.error('❌ Error:', error);
      alert('HD Video generation failed: ' + error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-4 text-white">
          High Quality Video Test
        </h1>
        <p className="text-center text-gray-300 mb-8">
          Generates 1920x1080 HD video at 60fps with VP9 codec
        </p>
        
        <div className="bg-white/10 backdrop-blur-lg rounded-lg shadow-xl p-6 text-center">
          <button
            onClick={generateTestVideo}
            disabled={isGenerating}
            className={`px-8 py-4 rounded-lg font-bold text-white text-lg transition-all ${
              isGenerating 
                ? 'bg-gray-600 cursor-not-allowed scale-95' 
                : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 hover:scale-105 shadow-lg'
            }`}
          >
            {isGenerating ? '🎬 Generating HD Video...' : '🚀 Generate HD Video'}
          </button>
          
          <div className="mt-4 text-sm text-gray-300">
            <p>• Full HD 1920x1080 resolution</p>
            <p>• 60 FPS smooth animation</p>
            <p>• VP9 codec for best quality</p>
            <p>• 8 Mbps bitrate</p>
          </div>
          
          {videoUrl && (
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4 text-white">Generated HD Video:</h3>
              <video 
                src={videoUrl} 
                controls 
                className="w-full max-w-2xl mx-auto rounded-lg shadow-lg"
                style={{ maxHeight: '400px' }}
              />
              <p className="mt-4 text-sm text-gray-300">
                Video auto-downloaded as WebM. Right-click to save again if needed.
              </p>
            </div>
          )}
        </div>
        
        <div className="mt-8 text-center">
          <a href="/dashboard" className="text-blue-400 hover:text-blue-300 hover:underline text-lg">
            ← Back to Main Dashboard
          </a>
        </div>
      </div>
    </div>
  );
} 