'use client';

import React, { useState, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { AuthGuard } from '@/components/auth/AuthGuard';
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
import { Textarea } from "@/components/ui/textarea";
import { Upload, Play, Download, Trash2, Smartphone, Video, Sparkles, Mic, Volume2, Music, LogOut, User } from "lucide-react";

function DashboardContent() {
  const { data: session } = useSession();
  const [isRendering, setIsRendering] = useState(false);
  const [backgroundVideo, setBackgroundVideo] = useState<string | null>(null);
  const [backgroundVideoFile, setBackgroundVideoFile] = useState<File | null>(null);
  const [selectedPresetVideo, setSelectedPresetVideo] = useState<string>('none');
  const [renderProgress, setRenderProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Text-to-speech states
  const [speechText, setSpeechText] = useState('');
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  const [isGeneratingSpeech, setIsGeneratingSpeech] = useState(false);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [selectedVoice, setSelectedVoice] = useState('EXAVITQu4vr4xnSDxMaL');
  
  // Render method selection
  const [renderMethod, setRenderMethod] = useState<'canvas' | 'remotion'>('canvas');
  
  // Background music states
  const [selectedBgMusic, setSelectedBgMusic] = useState<string>('none');

  // List of preset background videos (update this list when you add new videos)
  const presetVideos = [
    { value: 'none', label: 'No preset video', path: '' },
    { value: 'minecraft-parkour', label: '🎮 Minecraft Parkour', path: '/bg-videos/minecraft-parkour.mp4' },
    
    // TO ADD MORE VIDEOS:
    // 1. Place your MP4 file in public/bg-videos/ folder
    // 2. Add a new line here like: { value: 'filename', label: '🎬 Display Name', path: '/bg-videos/filename.mp4' }
    // 3. Save and refresh browser
  ];

  // List of preset background music (update this list when you add new music)
  const bgMusicOptions = [
    { value: 'none', label: 'No background music', path: '' },
    { value: 'mii', label: '🎵 Mii Theme - Nintendo', path: '/bg-music/Mii.mp3' },
    
    // TO ADD MORE MUSIC:
    // 1. Place your MP3 file in public/bg-music/ folder
    // 2. Add a new line here like: { value: 'filename', label: '🎵 Song Name', path: '/bg-music/filename.mp3' }
    // 3. Save and refresh browser
  ];

  // Available Eleven Labs voices
  const voiceOptions = [
    { value: 'EXAVITQu4vr4xnSDxMaL', label: '👩 Bella - Friendly Female' },
    { value: 'pNInz6obpgDQGcFmaJgB', label: '👨 Adam - Professional Male' },
    { value: 'ErXwobaYiN019PkySvjV', label: '👨 Antoni - Warm Male' },
    { value: 'VR6AewLTigWG4xSOukaG', label: '👨 Arnold - Deep Male' },
    { value: 'MF3mGyEYCl7XYWbV9V6O', label: '👩 Elli - Young Female' },
    { value: 'TxGEqnHWrfWFTfGW9XjX', label: '👨 Josh - Casual Male' },
  ];

  const generateSpeech = async () => {
    if (!speechText.trim()) {
      alert('Please enter text for speech generation');
      return;
    }

    setIsGeneratingSpeech(true);
    try {
      console.log('🎤 Generating speech with Eleven Labs...');
      
      const response = await fetch('/api/generate-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: speechText,
          voiceId: selectedVoice,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate speech');
      }

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          alert('Your session has expired. Please sign in again.');
          return;
        }
        throw new Error(errorData.message || 'Failed to generate speech');
      }

      const data = await response.json();
      setGeneratedAudio(data.audio);

      // Get audio duration by creating a temporary audio element
      const audio = new Audio(data.audio);
      audio.onloadedmetadata = () => {
        setAudioDuration(audio.duration);
        console.log('🎵 Audio generated successfully, duration:', audio.duration, 'seconds');
      };

      console.log('✅ Speech generated successfully');
    } catch (error) {
      console.error('❌ Speech generation error:', error);
      alert(`Failed to generate speech: ${error}`);
    } finally {
      setIsGeneratingSpeech(false);
    }
  };

  const clearGeneratedAudio = () => {
    setGeneratedAudio(null);
    setAudioDuration(null);
  };

  const renderWithRemotion = async (text: string, videoSource: File | string | null, audioSrc: string | null = null, audioDur: number | null = null, bgMusicSrc: string | null = null) => {
    console.log('🎬 Starting server-side Remotion rendering...');
    
    // For file uploads, we need to convert to a data URL or upload to a temporary location
    let backgroundVideoUrl = null;
    if (typeof videoSource === 'string') {
      backgroundVideoUrl = videoSource; // Preset video path
    } else if (videoSource) {
      // Convert file to data URL for API
      backgroundVideoUrl = URL.createObjectURL(videoSource);
    }

    const response = await fetch('/api/render-video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        speechText: text,
        backgroundVideo: backgroundVideoUrl,
        audioSrc,
        audioDuration: audioDur,
        bgMusic: bgMusicSrc,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      if (response.status === 401) {
        alert('Your session has expired. Please sign in again.');
        return;
      }
      throw new Error(error.error || 'Server rendering failed');
    }

    // Download the rendered video
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${text.slice(0, 30).replace(/[^a-z0-9]/gi, '-').toLowerCase()}-remotion-video.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Clean up background video URL if it was created
    if (backgroundVideoUrl && typeof videoSource !== 'string') {
      URL.revokeObjectURL(backgroundVideoUrl);
    }

    console.log('✅ Remotion video downloaded successfully!');
  };

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
      
      // Determine which background music to use
      let bgMusicSource: string | null = null;
      if (selectedBgMusic && selectedBgMusic !== 'none') {
        const musicOption = bgMusicOptions.find(m => m.value === selectedBgMusic);
        bgMusicSource = musicOption?.path || null;
      }
      
      // Choose rendering method
      if (renderMethod === 'remotion') {
        await renderWithRemotion(speechText, videoSource, generatedAudio, audioDuration, bgMusicSource);
      } else {
        await createAndDownloadVideo(speechText, videoSource, generatedAudio, audioDuration, bgMusicSource);
      }
      
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

  const createAndDownloadVideo = async (text: string, videoSource: File | string | null, audioSrc: string | null = null, audioDur: number | null = null, bgMusicSrc: string | null = null) => {
    return new Promise<void>((resolve, reject) => {
      try {
        console.log('🎬 Starting YouTube Shorts video generation...');
        console.log('Creating vertical video with text:', text);
        
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

        // Create audio context and destination for mixing audio
        let audioContext: AudioContext | null = null;
        let audioDestination: MediaStreamAudioDestinationNode | null = null;
        let audioElement: HTMLAudioElement | null = null;
        let bgMusicElement: HTMLAudioElement | null = null;

        if (audioSrc || bgMusicSrc) {
          audioContext = new AudioContext();
          audioDestination = audioContext.createMediaStreamDestination();
          
          // Create speech audio element if available
          if (audioSrc) {
            audioElement = new Audio(audioSrc);
            audioElement.crossOrigin = 'anonymous';
            audioElement.preload = 'auto';
            audioElement.volume = 1.0;
            
            // Connect speech audio element to the destination
            const speechSource = audioContext.createMediaElementSource(audioElement);
            speechSource.connect(audioDestination);
            speechSource.connect(audioContext.destination); // Also play through speakers for monitoring
          }
          
          // Create background music element if available
          if (bgMusicSrc) {
            bgMusicElement = new Audio(bgMusicSrc);
            bgMusicElement.crossOrigin = 'anonymous';
            bgMusicElement.preload = 'auto';
            bgMusicElement.volume = 0.3; // Lower volume for background music
            bgMusicElement.loop = true; // Loop the background music
            
            // Connect background music to the destination
            const musicSource = audioContext.createMediaElementSource(bgMusicElement);
            musicSource.connect(audioDestination);
            musicSource.connect(audioContext.destination); // Also play through speakers for monitoring
          }
          
          console.log('🎵 Audio context created:', {
            hasSpeech: !!audioSrc,
            hasBgMusic: !!bgMusicSrc
          });
        }

        // Create stream matching YouTube Shorts specs - MAXIMUM QUALITY
        const stream = canvas.captureStream(60); // 60 FPS for maximum smoothness
        
        // Add audio track to the stream if available
        if (audioDestination && audioDestination.stream.getAudioTracks().length > 0) {
          const audioTrack = audioDestination.stream.getAudioTracks()[0];
          stream.addTrack(audioTrack);
          console.log('🎵 Audio track added to video stream');
        }
        
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
          const actualDuration = audioDur || 5;
          const hasAudio = audioSrc ? '✅ With AI Speech Audio' : '⚪ No audio';
          alert(`🎬 YouTube Shorts Video Created Successfully!\n\n✅ Size: ${videoSize}MB\n✅ Format: 1080×1920 (9:16)\n✅ Duration: ${actualDuration.toFixed(1)}s\n${hasAudio}\n✅ Word-by-word text\n✅ Type: ${fileExtension.toUpperCase()}\n✅ Perfect for mobile!`);
          
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${text.slice(0, 30).replace(/[^a-z0-9]/gi, '-').toLowerCase()}-youtube-shorts.${fileExtension}`;
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
        let audioStarted = false;
        
        // Adjust video duration based on audio duration (minimum 5 seconds)
        const videoDuration = audioDur ? Math.max(audioDur, 5) : 5;
        const totalFrames = Math.floor(videoDuration * 60); // 60fps for maximum smoothness
        
        console.log('🎬 Starting animation with', totalFrames, 'frames for', videoDuration, 'seconds at 60fps - MAXIMUM QUALITY');
        

        
        const animate = () => {
          // Mark when audio actually starts
          if (audioElement && audioElement.currentTime > 0 && !audioStarted) {
            audioStarted = true;
            console.log('🎵 Audio playback detected, syncing animation');
          }

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
          
          // Word-by-word text display synchronized with audio
          let currentTime = frame / 60;
          
          // Use actual audio time if audio is playing for better sync
          if (audioElement && !audioElement.paused && !audioElement.ended) {
            currentTime = audioElement.currentTime;
          }
          
          const words = text.split(' ');
          
          // Improved timing calculation for natural speech
          let currentWordIndex = 0;
          
          if (words.length > 0 && currentTime > 0) {
            // Use actual speech duration with slight delay for natural start
            const speechStartDelay = 0.3; // 300ms delay before first word
            const effectiveTime = Math.max(0, currentTime - speechStartDelay);
            const speechDuration = Math.max(videoDuration - speechStartDelay - 0.5, 2); // Leave 500ms at end
            
            // Adjust timing based on word length (longer words get more time)
            let totalTimeUnits = 0;
            const wordTimeUnits = words.map(word => {
              const baseTime = 1;
              const lengthMultiplier = Math.max(0.7, Math.min(1.5, word.length / 6)); // Longer words get more time
              const timeUnit = baseTime * lengthMultiplier;
              totalTimeUnits += timeUnit;
              return timeUnit;
            });
            
            // Find current word based on accumulated time
            let accumulatedTime = 0;
            const timePerUnit = speechDuration / totalTimeUnits;
            
            for (let i = 0; i < words.length; i++) {
              const wordDuration = wordTimeUnits[i] * timePerUnit;
              if (effectiveTime <= accumulatedTime + wordDuration) {
                currentWordIndex = i;
                break;
              }
              accumulatedTime += wordDuration;
              currentWordIndex = i + 1;
            }
            
            // Ensure we don't go beyond the last word
            currentWordIndex = Math.min(currentWordIndex, words.length - 1);
          }

          ctx.shadowColor = 'rgba(0,0,0,0.8)';
          ctx.shadowBlur = 8;
          ctx.shadowOffsetX = 3;
          ctx.shadowOffsetY = 3;
          
          ctx.fillStyle = 'white';
          ctx.strokeStyle = 'rgba(0,0,0,0.5)';
          ctx.lineWidth = 4;
          ctx.font = 'bold 80px Arial, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
                    const y = -40;
          
          // Show ONLY the current word - ONE WORD AT A TIME
          if (currentWordIndex >= 0 && currentWordIndex < words.length) {
            const currentWord = words[currentWordIndex];
            
            // Set style for the current word
            ctx.fillStyle = '#FFD700'; // Gold color
            ctx.strokeStyle = 'rgba(0,0,0,0.8)';
            ctx.lineWidth = 6;
            
            // Draw the current word only
            ctx.strokeText(currentWord, 0, y);
            ctx.fillText(currentWord, 0, y);
          }

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

        // Start recording with audio sync
        const startRecording = async () => {
          console.log('🎬 Starting MediaRecorder for MAXIMUM QUALITY video...');
          
          // Start MediaRecorder first
          mediaRecorder.start(50); // Collect data every 50ms for maximum quality
          
          // Small delay to ensure recording has started
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Start audio playback if available
          if (audioContext) {
            try {
              // Resume audio context if suspended
              if (audioContext.state === 'suspended') {
                await audioContext.resume();
              }
              
              // Start speech audio
              if (audioElement) {
                audioElement.currentTime = 0;
                await audioElement.play();
                console.log('🎵 Speech audio playback started');
              }
              
              // Start background music
              if (bgMusicElement) {
                bgMusicElement.currentTime = 0;
                await bgMusicElement.play();
                console.log('🎵 Background music playback started');
              }
              
              // Small delay to ensure all audio has started
              await new Promise(resolve => setTimeout(resolve, 50));
            } catch (error) {
              console.error('❌ Error starting audio:', error);
            }
          }
          
          // Start animation after audio
          animate();
        };

        // Start background video if available
        if (backgroundVideoElement) {
          backgroundVideoElement.onloadeddata = () => {
            console.log('📹 Background video loaded, starting recording...');
            // Start video from beginning and let it play naturally
            backgroundVideoElement.currentTime = 0;
            backgroundVideoElement.play();
            
            // Add small delay to ensure first frame is ready
            setTimeout(startRecording, 50);
          };
          backgroundVideoElement.load();
        } else {
          console.log('🔴 Starting recording without background video...');
          // Add small delay to ensure first frame is ready
          setTimeout(startRecording, 50);
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
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-center gap-2 flex-1">
              <Smartphone className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                YouTube Shorts Generator
              </h1>
              <Sparkles className="h-8 w-8 text-purple-600" />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{session?.user?.name || session?.user?.email}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut()}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
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
                    speechText,
                    backgroundVideo,
                    audioSrc: generatedAudio,
                    audioDuration,
                    bgMusic: selectedBgMusic !== 'none' ? bgMusicOptions.find(m => m.value === selectedBgMusic)?.path : null,
                  }}
                  durationInFrames={audioDuration ? Math.floor(Math.max(audioDuration, 5) * 60) : 300}
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


            {/* Text-to-Speech */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="h-5 w-5" />
                  Text-to-Speech
                </CardTitle>
                <CardDescription>
                  Generate AI voice narration using Eleven Labs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="speech-text">Speech Text</Label>
                  <Textarea
                    id="speech-text"
                    value={speechText}
                    onChange={(e) => setSpeechText(e.target.value)}
                    placeholder="Enter text to convert to speech..."
                    rows={3}
                    className="resize-none"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Voice Selection</Label>
                  <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a voice" />
                    </SelectTrigger>
                    <SelectContent>
                      {voiceOptions.map((voice) => (
                        <SelectItem key={voice.value} value={voice.value}>
                          {voice.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={generateSpeech}
                  disabled={isGeneratingSpeech || !speechText.trim()}
                  className="w-full"
                >
                  {isGeneratingSpeech ? (
                    <>
                      <Upload className="mr-2 h-4 w-4 animate-spin" />
                      Generating Speech...
                    </>
                  ) : (
                    <>
                      <Volume2 className="mr-2 h-4 w-4" />
                      Generate Speech
                    </>
                  )}
                </Button>

                {generatedAudio && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Generated Audio:</Label>
                    <audio
                      src={generatedAudio}
                      controls
                      className="w-full"
                      preload="metadata"
                    />
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="w-fit">
                        ✅ Audio ready
                      </Badge>
                      {audioDuration && (
                        <Badge variant="secondary" className="w-fit">
                          {audioDuration.toFixed(1)}s duration
                        </Badge>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearGeneratedAudio}
                        title="Clear generated audio"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                </div>
                  </div>
                )}
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

            {/* Background Music */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="h-5 w-5" />
                  Background Music
                </CardTitle>
                <CardDescription>
                  Add background music to enhance your video
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Music Selection</Label>
                  <Select value={selectedBgMusic} onValueChange={setSelectedBgMusic}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose background music" />
                    </SelectTrigger>
                    <SelectContent>
                      {bgMusicOptions.map((music) => (
                        <SelectItem key={music.value} value={music.value}>
                          {music.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    🎵 Music will be played at 30% volume to not overpower speech
                  </p>
                </div>

                {selectedBgMusic && selectedBgMusic !== 'none' && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Background Music Preview:</Label>
                    {(() => {
                      const selectedMusic = bgMusicOptions.find(m => m.value === selectedBgMusic);
                      return selectedMusic?.path ? (
                                                 <audio
                           src={selectedMusic.path}
                           className="w-full"
                           controls
                           preload="metadata"
                         />
                      ) : null;
                    })()}
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="w-fit">
                        🎵 Background music selected
                      </Badge>
                      <Badge variant="secondary" className="w-fit">
                        Loops automatically
                      </Badge>
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
                <div className="space-y-2">
                  <Label>Render Method</Label>
                  <Select value={renderMethod} onValueChange={(value: 'canvas' | 'remotion') => setRenderMethod(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose render method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="canvas">
                        🎨 Canvas Rendering (Client-side, faster)
                      </SelectItem>
                      <SelectItem value="remotion">
                        🎬 Remotion Rendering (Server-side, higher quality)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {renderMethod === 'canvas' 
                      ? '⚡ Fast browser-based rendering with MediaRecorder API'
                      : '🔥 Professional server-side rendering with Remotion (better quality, MP4 output)'
                    }
                  </p>
                </div>

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
                <Badge variant="secondary">YouTube Shorts</Badge>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-green-600">30 FPS</div>
                <Badge variant="secondary">Smooth</Badge>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-purple-600">
                  {audioDuration ? `${audioDuration.toFixed(1)}s` : '5s'}
                </div>
                <Badge variant="secondary">
                  {audioDuration ? 'Audio Length' : 'Duration'}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-orange-600">
                  {renderMethod === 'remotion' ? 'MP4' : 'WebM'}
                </div>
                <Badge variant="secondary">
                  {renderMethod === 'remotion' ? 'H.264' : 'VP9/VP8'}
                </Badge>
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

export default function Dashboard() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}