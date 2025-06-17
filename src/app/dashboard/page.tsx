'use client';

import React, { useState, useRef } from 'react';
import { Player } from '@remotion/player';
import { SampleVideo } from '@/remotion/SampleVideo';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Upload, Play, Download, Trash2, Smartphone, Video, Sparkles } from "lucide-react";

export default function Dashboard() {
  const [titleText, setTitleText] = useState('Your Title');
  const [subtitleText, setSubtitleText] = useState('Your Subtitle');
  const [isRendering, setIsRendering] = useState(false);
  const [backgroundVideo, setBackgroundVideo] = useState<string | null>(null);
  const [backgroundVideoFile, setBackgroundVideoFile] = useState<File | null>(null);
  const [selectedPresetVideo, setSelectedPresetVideo] = useState<string>('none');
  const [renderProgress, setRenderProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // List of preset background videos (update this list when you add new videos)
  const presetVideos = [
    { value: 'none', label: 'No preset video', path: '' },
    { value: 'minecraft-parkour', label: '🎮 Minecraft Parkour', path: '/bg-videos/minecraft-parkour.mp4' },
    
    // TO ADD MORE VIDEOS:
    // 1. Place your MP4 file in public/bg-videos/ folder
    // 2. Add a new line here like: { value: 'filename', label: '🎬 Display Name', path: '/bg-videos/filename.mp4' }
    // 3. Save and refresh browser
  ];

  const handleRenderVideo = async () => {
    setIsRendering(true);
    setRenderProgress(0);

    try {
      console.log('🚀 Starting YouTube Shorts video generation...');
      
      // Determine which video source to use
      let videoSource: File | string | null = null;
      if (backgroundVideoFile) {
        videoSource = backgroundVideoFile; // Custom uploaded file
      } else if (selectedPresetVideo && selectedPresetVideo !== 'none') {
        const preset = presetVideos.find(v => v.value === selectedPresetVideo);
        videoSource = preset?.path || null; // Preset video path
      }
      
      await createAndDownloadVideo(titleText, subtitleText, videoSource);
      
    } catch (error) {
      console.error('❌ Error creating YouTube Shorts video:', error);
      alert(`❌ Video generation failed: ${error}\n\nTry:\n1. Use a smaller background video file\n2. Use MP4 format for background\n3. Check browser console for details`);
    } finally {
      setIsRendering(false);
      setRenderProgress(0);
    }
  };

  const handlePresetVideoChange = (value: string) => {
    setSelectedPresetVideo(value);
    
    if (value && value !== 'none') {
      // Clear custom upload when preset is selected
      setBackgroundVideo(null);
      setBackgroundVideoFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Set preview to preset video
      const preset = presetVideos.find(v => v.value === value);
      if (preset?.path) {
        setBackgroundVideo(preset.path);
      }
    } else {
      setBackgroundVideo(null);
    }
  };

  const handleBackgroundVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('📹 File selected:', {
        name: file.name,
        size: file.size,
        type: file.type
      });

      // Validate file type
      if (!file.type.startsWith('video/')) {
        alert('Please select a video file (MP4, WebM, MOV, etc.)');
        return;
      }

      // Validate file size (limit to 100MB)
      if (file.size > 100 * 1024 * 1024) {
        alert('File size too large. Please select a video smaller than 100MB.');
        return;
      }

      // Clear preset selection when custom file is uploaded
      setSelectedPresetVideo('none');
      
      try {
        setBackgroundVideoFile(file);
        const url = URL.createObjectURL(file);
        setBackgroundVideo(url);
        console.log('✅ Background video uploaded successfully:', file.name);
      } catch (error) {
        console.error('❌ Error processing video file:', error);
        alert('Error processing video file. Please try a different file.');
      }
    }
  };

  const clearBackgroundVideo = () => {
    setBackgroundVideo(null);
    setBackgroundVideoFile(null);
    setSelectedPresetVideo('none');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const createAndDownloadVideo = async (title: string, subtitle: string, videoSource: File | string | null) => {
    return new Promise<void>((resolve, reject) => {
      try {
        console.log('🎬 Starting YouTube Shorts video generation...');
        console.log('Creating vertical video with title:', title, 'subtitle:', subtitle);
        
        // Create VERTICAL canvas for YouTube Shorts (9:16 aspect ratio) - MAXIMUM QUALITY
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { 
          alpha: false, // No transparency for better performance
          desynchronized: true, // Better performance for animations
          colorSpace: 'srgb', // Standard color space for maximum compatibility
          willReadFrequently: false // Optimized for video recording
        })!;
        canvas.width = 1080;  // YouTube Shorts width
        canvas.height = 1920; // YouTube Shorts height (9:16 ratio)

        console.log('✅ MAXIMUM QUALITY Vertical Canvas created:', canvas.width, 'x', canvas.height);

        // Enable MAXIMUM quality rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Optimize for maximum quality
        canvas.style.willChange = 'auto';
        canvas.style.imageRendering = 'high-quality';

        // Create background video element if provided
        let backgroundVideoElement: HTMLVideoElement | null = null;
        if (videoSource) {
          backgroundVideoElement = document.createElement('video');
          
          if (typeof videoSource === 'string') {
            // Preset video from public folder
            backgroundVideoElement.src = videoSource;
            console.log('📹 Using preset background video:', videoSource);
          } else {
            // Custom uploaded file
            backgroundVideoElement.src = URL.createObjectURL(videoSource);
            console.log('📹 Using custom uploaded video:', videoSource.name);
          }
          
          backgroundVideoElement.muted = true;
          backgroundVideoElement.loop = true;
          backgroundVideoElement.preload = 'auto';
          backgroundVideoElement.crossOrigin = 'anonymous';
          backgroundVideoElement.currentTime = 0;
          
          // Optimize video playback for smooth rendering
          backgroundVideoElement.playbackRate = 1.0;
        }

        // Create stream matching YouTube Shorts specs - MAXIMUM QUALITY
        const stream = canvas.captureStream(60); // 60 FPS for maximum smoothness
        console.log('🎥 Canvas stream created at 60 FPS for maximum quality');
        
        // Use MAXIMUM quality recording settings
        const baseOptions = {
          videoBitsPerSecond: 20000000, // 20 Mbps for maximum quality
        };

        let options: MediaRecorderOptions;
        // Try MP4 first (best compatibility and quality)
        if (MediaRecorder.isTypeSupported('video/mp4')) {
          options = { ...baseOptions, mimeType: 'video/mp4' };
          console.log('✅ Using MP4 format');
        } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
          options = { ...baseOptions, mimeType: 'video/webm;codecs=vp9' };
          console.log('🔄 Falling back to WebM VP9');
        } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
          options = { ...baseOptions, mimeType: 'video/webm;codecs=vp8' };
          console.log('🔄 Falling back to WebM VP8');
        } else {
          options = baseOptions;
          console.log('⚠️ Using default codec');
        }

        const mediaRecorder = new MediaRecorder(stream, options);
        const chunks: Blob[] = [];
        let recordingStartTime: number;

        mediaRecorder.onstart = () => {
          recordingStartTime = Date.now();
          console.log('🎬 MediaRecorder started at:', new Date().toISOString());
        };

        mediaRecorder.ondataavailable = (event) => {
          console.log('📦 YouTube Shorts data chunk:', event.data.size, 'bytes');
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const recordingDuration = (Date.now() - recordingStartTime) / 1000;
          console.log('🛑 Recording stopped. Total chunks:', chunks.length);
          console.log('⏱️ Actual recording duration:', recordingDuration.toFixed(2), 'seconds');
          
          // Determine the correct MIME type and file extension
          const mimeType = options.mimeType || 'video/webm';
          const fileExtension = mimeType.includes('mp4') ? 'mp4' : 'webm';
          
          const blob = new Blob(chunks, { type: mimeType });
          console.log('📹 Final YouTube Shorts video blob:', blob.size, 'bytes');
          
          if (blob.size === 0) {
            reject(new Error('Generated video is empty'));
            return;
          }
          
          // Success notification
          const videoSize = (blob.size / (1024 * 1024)).toFixed(1);
          alert(`🎬 YouTube Shorts Video Created Successfully!\n\n✅ Size: ${videoSize}MB\n✅ Format: 1080×1920 (9:16)\n✅ Duration: 5 seconds\n✅ Type: ${fileExtension.toUpperCase()}\n✅ Perfect for mobile!`);
          
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-youtube-shorts.${fileExtension}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          // Clean up background video URL (only for custom uploads)
          if (backgroundVideoElement && typeof videoSource !== 'string') {
            URL.revokeObjectURL(backgroundVideoElement.src);
          }
          
          console.log('✅ YouTube Shorts Video download triggered');
          resolve();
        };

        mediaRecorder.onerror = (event) => {
          console.error('❌ MediaRecorder error:', event);
          reject(new Error('MediaRecorder error: ' + JSON.stringify(event)));
        };

        // Animation variables for YouTube Shorts - MAXIMUM SMOOTHNESS
        let frame = 0;
        const totalFrames = 300; // 5 seconds at 60fps for maximum smoothness
        
        console.log('🎬 Starting animation with', totalFrames, 'frames for 5 seconds at 60fps - MAXIMUM QUALITY');
        
        const animate = () => {
          // NO FRAME RATE LIMITING - Maximum smoothness like original video

          if (frame >= totalFrames) {
            console.log('🎬 Animation complete, stopping recorder... Frame:', frame, '/', totalFrames);
            console.log('🎬 Total animation time should be:', (totalFrames / 60).toFixed(1), 'seconds');
            
            // Force final frame capture and stop recording
            setTimeout(() => {
              if (mediaRecorder.state === 'recording') {
                console.log('🛑 Stopping MediaRecorder after', totalFrames, 'frames');
                mediaRecorder.requestData(); // Force final data collection
                setTimeout(() => {
                  if (mediaRecorder.state === 'recording') {
                    mediaRecorder.stop();
                  }
                }, 100);
              }
            }, 200);
            return;
          }

          // Update progress (less frequently to reduce lag)
          if (frame % 5 === 0) {
            const progress = Math.round((frame / totalFrames) * 100);
            setRenderProgress(progress);
          }

          // Draw background
          if (backgroundVideoElement && backgroundVideoElement.readyState >= 2) {
            // BACKGROUND VIDEO MODE: Use video as the only background
            
            // Scale and center the background video to fit the vertical canvas
            const videoAspect = backgroundVideoElement.videoWidth / backgroundVideoElement.videoHeight;
            const canvasAspect = canvas.width / canvas.height;
            
            let drawWidth, drawHeight, drawX, drawY;
            
            if (videoAspect > canvasAspect) {
              // Video is wider - fit to height and crop sides
              drawHeight = canvas.height;
              drawWidth = drawHeight * videoAspect;
              drawX = (canvas.width - drawWidth) / 2;
              drawY = 0;
            } else {
              // Video is taller - fit to width and crop top/bottom
              drawWidth = canvas.width;
              drawHeight = drawWidth / videoAspect;
              drawX = 0;
              drawY = (canvas.height - drawHeight) / 2;
            }
            
            // Draw the background video (fills entire canvas)
            ctx.drawImage(backgroundVideoElement, drawX, drawY, drawWidth, drawHeight);
            
            // Add subtle dark overlay for text readability over video (optimized)
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
          } else {
            // CLEAN MODE: Simple solid dark background (no particles, no gradients)
            ctx.fillStyle = '#1a1a1a'; // Clean dark gray background
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }

          // Text animations optimized for 60fps - MAXIMUM SMOOTHNESS
          const fadeInDuration = 60; // 1 second fade-in at 60fps for smooth animation
          const fadeOutStart = totalFrames - 60; // 1 second fade-out
          
          let opacity = 1;
          let translateY = 0;
          let scale = 1;
          
          if (frame <= fadeInDuration) {
            opacity = frame / fadeInDuration;
            translateY = 20 - (frame / fadeInDuration) * 20;
            scale = 0.9 + (frame / fadeInDuration) * 0.1;
          } else if (frame >= fadeOutStart) {
            const fadeOutProgress = (frame - fadeOutStart) / 60;
            opacity = 1 - fadeOutProgress;
            scale = 1 + fadeOutProgress * 0.05;
          }
          
          ctx.save();
          ctx.globalAlpha = opacity;
          ctx.translate(canvas.width / 2, canvas.height / 2 + translateY);
          ctx.scale(scale, scale);
          
          // Text styling optimized for vertical format
          ctx.shadowColor = 'rgba(0,0,0,0.8)';
          ctx.shadowBlur = 8;
          ctx.shadowOffsetX = 3;
          ctx.shadowOffsetY = 3;
          
          // Title - optimized size for vertical format
          ctx.fillStyle = 'white';
          ctx.strokeStyle = 'rgba(0,0,0,0.5)';
          ctx.lineWidth = 4;
          ctx.font = 'bold 80px Arial, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          // Wrap text if too long for vertical format
          const maxWidth = canvas.width * 0.9;
          const words = title.split(' ');
          let line = '';
          let y = -60;
          
          for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            
            if (testWidth > maxWidth && n > 0) {
              ctx.strokeText(line, 0, y);
              ctx.fillText(line, 0, y);
              line = words[n] + ' ';
              y += 90;
            } else {
              line = testLine;
            }
          }
          ctx.strokeText(line, 0, y);
          ctx.fillText(line, 0, y);

          // Subtitle
          ctx.globalAlpha = opacity * 0.9;
          ctx.font = '50px Arial, sans-serif';
          ctx.lineWidth = 3;
          ctx.shadowBlur = 6;
          
          const subtitleWords = subtitle.split(' ');
          let subtitleLine = '';
          let subtitleY = y + 120;
          
          for (let n = 0; n < subtitleWords.length; n++) {
            const testLine = subtitleLine + subtitleWords[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            
            if (testWidth > maxWidth && n > 0) {
              ctx.strokeText(subtitleLine, 0, subtitleY);
              ctx.fillText(subtitleLine, 0, subtitleY);
              subtitleLine = subtitleWords[n] + ' ';
              subtitleY += 70;
            } else {
              subtitleLine = testLine;
            }
          }
          ctx.strokeText(subtitleLine, 0, subtitleY);
          ctx.fillText(subtitleLine, 0, subtitleY);

          ctx.restore();

          // Add floating particles ONLY when no background video is present
          if (!backgroundVideoElement || backgroundVideoElement.readyState < 2) {
            for (let i = 0; i < 6; i++) {
              const particleFrame = (frame + i * 10) % 90;
              const particleOpacity = particleFrame <= 45 ? particleFrame / 45 : 
                                     particleFrame >= 45 ? (90 - particleFrame) / 45 : 0;
              const particleY = canvas.height * 0.85 - (particleFrame / 90) * (canvas.height * 0.7);
              const particleX = canvas.width * (0.15 + i * 0.12);
              
              if (particleOpacity > 0) {
                ctx.save();
                ctx.globalAlpha = particleOpacity * 0.4;
                ctx.fillStyle = 'rgba(255,255,255,0.8)';
                ctx.beginPath();
                ctx.arc(particleX, particleY, 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
              }
            }
          }

          frame++;
          
          // Progress logging for 60fps
          if (frame % 60 === 0) {
            const progressPercent = Math.round((frame / totalFrames) * 100);
            const timeElapsed = (frame / 60).toFixed(1);
            console.log(`🎬 Progress: ${progressPercent}% (Frame ${frame}/${totalFrames}, Time: ${timeElapsed}s)`);
          }
          
          // Use requestAnimationFrame for smooth animation, but control timing
          requestAnimationFrame(animate);
        };

        // Start background video if available
        if (backgroundVideoElement) {
          backgroundVideoElement.onloadeddata = () => {
            console.log('📹 Background video loaded, starting recording...');
            // Start video from beginning and let it play naturally
            backgroundVideoElement.currentTime = 0;
            backgroundVideoElement.play();
            
            // Add small delay to ensure first frame is ready
            setTimeout(() => {
              console.log('🎬 Starting MediaRecorder for MAXIMUM QUALITY 5-second video...');
              mediaRecorder.start(50); // Collect data every 50ms for maximum quality
              animate();
            }, 50);
          };
          backgroundVideoElement.load();
        } else {
          console.log('🔴 Starting recording without background video...');
          // Add small delay to ensure first frame is ready
          setTimeout(() => {
            console.log('🎬 Starting MediaRecorder for MAXIMUM QUALITY 5-second video...');
            mediaRecorder.start(50); // Collect data every 50ms for maximum quality
            animate();
          }, 50);
        }

      } catch (error) {
        console.error('❌ YouTube Shorts video creation error:', error);
        reject(error);
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Smartphone className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              YouTube Shorts Generator
            </h1>
            <Sparkles className="h-8 w-8 text-purple-600" />
          </div>
          <p className="text-muted-foreground text-lg">
            Create stunning vertical videos perfect for YouTube Shorts, Instagram Reels, and TikTok
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Video Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Preview
              </CardTitle>
              <CardDescription>
                Live preview of your YouTube Shorts video
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mx-auto bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '9/16', maxHeight: '500px' }}>
                <Player
                  component={SampleVideo}
                  inputProps={{
                    titleText,
                    subtitleText,
                    backgroundVideo,
                  }}
                  durationInFrames={300}
                  fps={60}
                  compositionWidth={1080}
                  compositionHeight={1920}
                  style={{
                    width: '100%',
                    height: '100%',
                  }}
                  controls
                  loop
                />
              </div>
              <div className="flex items-center justify-center gap-2 mt-3">
                <Badge variant="secondary">9:16 Vertical</Badge>
                <Badge variant="secondary">Mobile Optimized</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Controls */}
          <div className="space-y-6">
            {/* Text Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Text Content</CardTitle>
                <CardDescription>
                  Customize your video text and messaging
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={titleText}
                    onChange={(e) => setTitleText(e.target.value)}
                    placeholder="Enter your title"
                    className="text-lg"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="subtitle">Subtitle</Label>
                  <Input
                    id="subtitle"
                    value={subtitleText}
                    onChange={(e) => setSubtitleText(e.target.value)}
                    placeholder="Enter your subtitle"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Background Video */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Background Video
                </CardTitle>
                <CardDescription>
                  Choose a preset video or upload your own
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Preset Videos</Label>
                  <Select value={selectedPresetVideo} onValueChange={handlePresetVideoChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a preset video" />
                    </SelectTrigger>
                    <SelectContent>
                      {presetVideos.map((preset) => (
                        <SelectItem key={preset.value} value={preset.value}>
                          {preset.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="relative">
                  <Separator />
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2">
                    <Badge variant="outline">OR</Badge>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Upload Custom Video</Label>
                  <div className="space-y-2">
                    <div className="relative">
                      <Input
                        ref={fileInputRef}
                        type="file"
                        accept="video/*"
                        onChange={handleBackgroundVideoUpload}
                        className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                      />
                      {backgroundVideo && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearBackgroundVideo}
                          className="absolute right-2 top-1/2 -translate-y-1/2"
                          title="Clear background video"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      📁 Upload MP4, WebM, or MOV files (max 100MB). Will be automatically scaled for vertical format.
                    </p>
                  </div>
                </div>

                {/* Debug info */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                    <strong>Debug:</strong><br/>
                    Background Video URL: {backgroundVideo || 'None'}<br/>
                    Selected Preset: {selectedPresetVideo}<br/>
                    File Selected: {backgroundVideoFile ? backgroundVideoFile.name : 'None'}
                  </div>
                )}

                {backgroundVideo && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Background Video Preview:</Label>
                    <video
                      src={backgroundVideo}
                      className="w-full max-h-40 rounded-md border bg-black"
                      controls
                      muted
                      preload="metadata"
                      onLoadedMetadata={(e) => {
                        const video = e.target as HTMLVideoElement;
                        console.log('📹 Video loaded:', {
                          duration: video.duration,
                          width: video.videoWidth,
                          height: video.videoHeight,
                          src: video.src
                        });
                      }}
                      onError={(e) => {
                        console.error('❌ Video load error:', e);
                      }}
                    />
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="w-fit">
                        ✅ Background video loaded
                      </Badge>
                      {backgroundVideoFile && (
                        <Badge variant="secondary" className="w-fit">
                          {(backgroundVideoFile.size / (1024 * 1024)).toFixed(1)} MB
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Generation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Generate Video
                </CardTitle>
                <CardDescription>
                  Create and download your YouTube Shorts video
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={handleRenderVideo}
                  disabled={isRendering}
                  className="w-full h-12 text-lg font-semibold"
                  size="lg"
                >
                  {isRendering ? (
                    <>
                      <Upload className="mr-2 h-5 w-5 animate-spin" />
                      Generating... {renderProgress}%
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-5 w-5" />
                      Generate YouTube Shorts Video
                    </>
                  )}
                </Button>

                {isRendering && (
                  <div className="space-y-2">
                    <Progress value={renderProgress} className="w-full" />
                    <p className="text-sm text-muted-foreground text-center">
                      Creating your vertical video...
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Video Specifications */}
        <Card>
          <CardHeader>
            <CardTitle>📱 Video Specifications</CardTitle>
            <CardDescription>
              Perfect format for all mobile platforms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div className="space-y-2">
                <div className="text-2xl font-bold text-primary">1080×1920</div>
                <Badge variant="secondary">Vertical HD</Badge>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-green-600">30 FPS</div>
                <Badge variant="secondary">Smooth</Badge>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-purple-600">5s</div>
                <Badge variant="secondary">Duration</Badge>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-orange-600">WebM</div>
                <Badge variant="secondary">VP9/VP8</Badge>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-blue-600">6 Mbps</div>
                <Badge variant="secondary">High Quality</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <Card className="bg-gradient-to-r from-primary/10 to-purple-600/10 border-primary/20">
          <CardHeader>
            <CardTitle className="text-center">🚀 Platform Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center space-y-2">
                <Smartphone className="h-8 w-8 mx-auto text-primary" />
                <h3 className="font-semibold">Perfect Format</h3>
                <p className="text-sm text-muted-foreground">
                  9:16 vertical aspect ratio optimized for mobile viewing
                </p>
              </div>
              <div className="text-center space-y-2">
                <Video className="h-8 w-8 mx-auto text-purple-600" />
                <h3 className="font-semibold">Custom Backgrounds</h3>
                <p className="text-sm text-muted-foreground">
                  Upload your own videos or choose from preset options
                </p>
              </div>
              <div className="text-center space-y-2">
                <Sparkles className="h-8 w-8 mx-auto text-orange-600" />
                <h3 className="font-semibold">Smart Text Wrapping</h3>
                <p className="text-sm text-muted-foreground">
                  Automatically optimizes text layout for vertical format
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 