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
import { Upload, Play, Download, Trash2, Video, Mic, Volume2, Music, LogOut, User, BookOpen, Brain, Zap } from "lucide-react";

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
  const [audioSegments, setAudioSegments] = useState<Array<{
    text: string;
    audio: string;
    chunkIndex: number;
    wordCount: number;
    duration?: number;
  }> | null>(null);
  const [isGeneratingSpeech, setIsGeneratingSpeech] = useState(false);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [selectedVoice, setSelectedVoice] = useState('EXAVITQu4vr4xnSDxMaL');

  
  // Render method selection

  
  // Background music states
  const [selectedBgMusic, setSelectedBgMusic] = useState<string>('none');

  // Educational content generation states
  const [educationalTopic, setEducationalTopic] = useState('');
  const [videoLength, setVideoLength] = useState<'short' | 'medium' | 'long'>('short');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);

  // Font selection state
  const [selectedFont, setSelectedFont] = useState<string>('impact');

  // Text color selection state
  const [selectedColor, setSelectedColor] = useState<string>('gold');

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

  // Available font styles
  const fontOptions = [
    { value: 'impact', label: '💥 Impact - Bold & Strong', font: 'Impact, "Arial Black", Helvetica, sans-serif', weight: '900' },
    { value: 'arial-black', label: '⚡ Arial Black - Modern & Clean', font: '"Arial Black", Arial, sans-serif', weight: '900' },
    { value: 'anton', label: '🔥 Anton - Condensed Power', font: 'var(--font-anton), Anton, Impact, sans-serif', weight: '400' },
    { value: 'oswald', label: '⭐ Oswald - Professional', font: 'var(--font-oswald), Oswald, Impact, sans-serif', weight: '700' },
    { value: 'bangers', label: '💥 Bangers - Comic Style', font: 'var(--font-bangers), Bangers, Impact, sans-serif', weight: '400' },
    { value: 'fredoka', label: '🌟 Fredoka - Friendly & Fun', font: 'var(--font-fredoka), Fredoka, Arial, sans-serif', weight: '700' },
    { value: 'montserrat', label: '✨ Montserrat - Elegant', font: 'var(--font-montserrat), Montserrat, Arial, sans-serif', weight: '900' },
  ];

  // Available text colors
  const colorOptions = [
    { value: 'gold', label: '✨ Gold - Classic', color: '#FFD700', shadowColor: 'rgba(255, 215, 0, 0.6)' },
    { value: 'white', label: '⚪ White - Clean', color: '#FFFFFF', shadowColor: 'rgba(255, 255, 255, 0.6)' },
    { value: 'red', label: '🔴 Red - Bold', color: '#FF4444', shadowColor: 'rgba(255, 68, 68, 0.6)' },
    { value: 'blue', label: '🔵 Blue - Cool', color: '#4A90E2', shadowColor: 'rgba(74, 144, 226, 0.6)' },
    { value: 'green', label: '🟢 Green - Fresh', color: '#4CAF50', shadowColor: 'rgba(76, 175, 80, 0.6)' },
    { value: 'purple', label: '🟣 Purple - Royal', color: '#9C27B0', shadowColor: 'rgba(156, 39, 176, 0.6)' },
    { value: 'orange', label: '🟠 Orange - Energy', color: '#FF9800', shadowColor: 'rgba(255, 152, 0, 0.6)' },
    { value: 'cyan', label: '🔷 Cyan - Modern', color: '#00BCD4', shadowColor: 'rgba(0, 188, 212, 0.6)' },
    { value: 'pink', label: '💗 Pink - Vibrant', color: '#E91E63', shadowColor: 'rgba(233, 30, 99, 0.6)' },
    { value: 'yellow', label: '🟡 Yellow - Bright', color: '#FFEB3B', shadowColor: 'rgba(255, 235, 59, 0.6)' },
  ];

  // Function to combine multiple audio segments into one using Web Audio API
  const combineAudioSegments = async (segments: Array<{audio: string, duration?: number}>) => {
    if (segments.length === 0) return null;
    if (segments.length === 1) return segments[0].audio;

    try {
      // Create audio context
      const AudioContextClass = window.AudioContext || (window as typeof window & {webkitAudioContext: typeof AudioContext}).webkitAudioContext;
      const audioContext = new AudioContextClass();
      
      // Convert base64 audio to audio buffers
      const audioBuffers: AudioBuffer[] = [];
      let totalDuration = 0;

      for (const segment of segments) {
        // Convert data URL to array buffer
        const base64Data = segment.audio.split(',')[1];
        const arrayBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0)).buffer;
        
        // Decode audio data
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        audioBuffers.push(audioBuffer);
        totalDuration += audioBuffer.duration;
      }

      // Create a new buffer to hold the combined audio
      const combinedBuffer = audioContext.createBuffer(
        audioBuffers[0].numberOfChannels,
        Math.ceil(totalDuration * audioBuffers[0].sampleRate),
        audioBuffers[0].sampleRate
      );

      // Copy each segment into the combined buffer
      let offset = 0;
      for (let i = 0; i < audioBuffers.length; i++) {
        const buffer = audioBuffers[i];
        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
          const channelData = buffer.getChannelData(channel);
          combinedBuffer.getChannelData(channel).set(channelData, offset);
        }
        offset += buffer.length;
      }

      // Convert combined buffer back to base64 audio
      const length = combinedBuffer.length * combinedBuffer.numberOfChannels * 2;
      const arrayBuffer = new ArrayBuffer(length);
      const view = new DataView(arrayBuffer);
      
      let pos = 0;
      for (let i = 0; i < combinedBuffer.length; i++) {
        for (let channel = 0; channel < combinedBuffer.numberOfChannels; channel++) {
          const sample = Math.max(-1, Math.min(1, combinedBuffer.getChannelData(channel)[i]));
          view.setInt16(pos, sample * 0x7FFF, true);
          pos += 2;
        }
      }

      // Create WAV file
      const wavBuffer = createWavFile(arrayBuffer, combinedBuffer.sampleRate, combinedBuffer.numberOfChannels);
      const blob = new Blob([wavBuffer], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      
      return url;
    } catch (error) {
      console.error('❌ Error combining audio segments:', error);
      // Fallback: return first segment
      return segments[0]?.audio || null;
    }
  };

  // Helper function to create WAV file header
  const createWavFile = (audioData: ArrayBuffer, sampleRate: number, numChannels: number) => {
    const length = audioData.byteLength;
    const buffer = new ArrayBuffer(44 + length);
    const view = new DataView(buffer);

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * 2, true);
    view.setUint16(32, numChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length, true);

    // Copy audio data
    const audioArray = new Uint8Array(audioData);
    const wavArray = new Uint8Array(buffer);
    wavArray.set(audioArray, 44);

    return buffer;
  };

  // Function to get duration of audio segments
  const getSegmentDurations = async (segments: Array<{audio: string}>) => {
    const durationsPromises = segments.map(segment => {
      return new Promise<number>((resolve) => {
        const audio = new Audio(segment.audio);
        audio.onloadedmetadata = () => resolve(audio.duration);
        audio.onerror = () => resolve(0); // Fallback
      });
    });
    
    return Promise.all(durationsPromises);
  };

  const generateSpeech = async () => {
    if (!speechText.trim()) {
      alert('Please enter text for speech generation');
      return;
    }

    setIsGeneratingSpeech(true);
    try {
      console.log('🎤 Generating segmented speech with Eleven Labs...');
      
      const response = await fetch('/api/generate-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: speechText,
          voiceId: selectedVoice,
          useSegments: true, // ALWAYS use segmented generation for precise subtitles
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          alert('Your session has expired. Please sign in again.');
          return;
        }
        throw new Error(errorData.message || 'Failed to generate speech');
      }

      const data = await response.json();

      if (data.segments) {
        // Handle segmented response
        console.log(`✅ Generated ${data.segments.length} audio segments`);
        setAudioSegments(data.segments);

        // Get durations for all segments
        const durations = await getSegmentDurations(data.segments);
        const totalDuration = durations.reduce((sum, duration) => sum + duration, 0);
        
        // Update segments with durations
        const segmentsWithDurations = data.segments.map((segment: {
          text: string;
          audio: string;
          chunkIndex: number;
          wordCount: number;
        }, index: number) => ({
          ...segment,
          duration: durations[index]
        }));
        setAudioSegments(segmentsWithDurations);

        // Create combined audio for playback (using first segment for now)
        const combinedAudio = await combineAudioSegments(segmentsWithDurations);
        setGeneratedAudio(combinedAudio);
        setAudioDuration(totalDuration);
        
        console.log('🎵 Segmented audio generated successfully:', {
          segments: data.segments.length,
          totalDuration: totalDuration.toFixed(1) + 's',
          chunks: data.segments.map((s: {text: string}) => s.text.slice(0, 30) + '...')
        });
      } else {
        // Handle single audio response (fallback)
        setGeneratedAudio(data.audio);
        setAudioSegments(null);

        const audio = new Audio(data.audio);
        audio.onloadedmetadata = () => {
          setAudioDuration(audio.duration);
        };
      }

      console.log('✅ Speech generated successfully');
    } catch (error) {
      console.error('❌ Speech generation error:', error);
      alert(`Failed to generate speech: ${error}`);
    } finally {
      setIsGeneratingSpeech(false);
    }
  };

  const clearGeneratedAudio = () => {
    // Clean up blob URL if it exists
    if (generatedAudio && generatedAudio.startsWith('blob:')) {
      URL.revokeObjectURL(generatedAudio);
    }
    setGeneratedAudio(null);
    setAudioDuration(null);
    setAudioSegments(null);
  };

  // Generate educational content using AI
  const generateEducationalContent = async () => {
    if (!educationalTopic.trim()) {
      alert('Please enter a topic for educational content generation');
      return;
    }

    setIsGeneratingContent(true);
    try {
      console.log(`🎓 Generating educational content for topic: "${educationalTopic}"`);
      
      const response = await fetch('/api/generate-educational-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: educationalTopic,
          videoLength,
          difficulty,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          alert('Your session has expired. Please sign in again.');
          return;
        }
        throw new Error(errorData.details || errorData.error || 'Failed to generate educational content');
      }

      const data = await response.json();
      
      if (data.success && data.content) {
        setGeneratedContent(data.content);
        setSpeechText(data.content); // Automatically fill the speech text
        
        console.log('✅ Educational content generated successfully:', {
          topic: data.topic,
          wordCount: data.settings.wordCount,
          estimatedDuration: data.settings.estimatedDuration,
          content: data.content.slice(0, 100) + '...'
        });
        
        // Clear any previous audio
        clearGeneratedAudio();
      } else {
        throw new Error('No content received from AI');
      }
    } catch (error) {
      console.error('❌ Educational content generation error:', error);
      alert(`Failed to generate educational content: ${error}`);
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const clearEducationalContent = () => {
    setGeneratedContent(null);
    setEducationalTopic('');
    setSpeechText('');
    clearGeneratedAudio();
  };

  const renderWithRemotion = async (
    text: string, 
    videoSource: File | string | null, 
    audioSrc: string | null = null, 
    audioDur: number | null = null, 
    bgMusicSrc: string | null = null,
    segments: Array<{text: string; audio: string; chunkIndex: number; wordCount: number; duration?: number}> | null = null,
    fontStyle: string = selectedFont,
    textColor: string = selectedColor
  ) => {
    // TODO: Use segments for precise subtitle generation in future updates
    console.log('🎬 Starting server-side Remotion rendering...', segments ? `with ${segments.length} audio segments` : 'with single audio');
    
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
        audioSegments: segments,
        fontStyle,
        textColor,
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
      
      // Always use Remotion server-side rendering for high quality
      console.log('🎬 Starting Remotion with segmented audio:', {
        hasSegments: !!audioSegments,
        segmentCount: audioSegments?.length || 0,
        hasFallbackAudio: !!generatedAudio
      });
      
      await renderWithRemotion(speechText, videoSource, generatedAudio, audioDuration, bgMusicSource, audioSegments, selectedFont, selectedColor);
      
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

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/10 via-black to-blue-900/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(120,119,198,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(120,119,198,0.05),transparent_50%)]"></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-white/10 backdrop-blur-xl bg-black/30">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                  <Video className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                    VFS Studio
                  </h1>
                  <p className="text-sm text-gray-400">
                    AI-Powered Video Generation
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-lg border border-white/10">
                  <User className="h-4 w-4 text-purple-400" />
                  <span className="text-sm text-gray-300">{session?.user?.name || session?.user?.email}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => signOut()}
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-6 py-8 space-y-8">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Video Preview */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded flex items-center justify-center">
                  <Play className="h-3 w-3 text-white" />
                </div>
                Preview
              </CardTitle>
              <CardDescription className="text-gray-400">
                Live preview of your AI-generated video
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mx-auto bg-black rounded-xl overflow-hidden border border-white/20" style={{ aspectRatio: '9/16', maxHeight: '500px' }}>
                <Player
                  component={SampleVideo}
                  inputProps={{
                    speechText,
                    backgroundVideo,
                    audioSrc: generatedAudio,
                    audioDuration,
                    bgMusic: selectedBgMusic !== 'none' ? bgMusicOptions.find(m => m.value === selectedBgMusic)?.path : null,
                    audioSegments,
                    fontStyle: selectedFont,
                    textColor: selectedColor,
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
              <div className="flex items-center justify-center gap-3 mt-4">
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                  📱 9:16 Vertical
                </Badge>
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                  🚀 AI Powered
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Controls */}
          <div className="space-y-6">

            {/* Educational Content Generation */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded flex items-center justify-center">
                    <Brain className="h-3 w-3 text-white" />
                  </div>
                  AI Content Generator
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Generate engaging educational content using GROQ AI
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="educational-topic">Topic to Study</Label>
                  <Input
                    id="educational-topic"
                    value={educationalTopic}
                    onChange={(e) => setEducationalTopic(e.target.value)}
                    placeholder="e.g., Quantum Physics, Machine Learning, Ancient Rome..."
                    className="w-full"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Video Length</Label>
                    <Select value={videoLength} onValueChange={(value: 'short' | 'medium' | 'long') => setVideoLength(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose length" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="short">📱 Short (5-8s)</SelectItem>
                        <SelectItem value="medium">⏱️ Medium (10-15s)</SelectItem>
                        <SelectItem value="long">🎬 Long (20-30s)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Difficulty Level</Label>
                    <Select value={difficulty} onValueChange={(value: 'beginner' | 'intermediate' | 'advanced') => setDifficulty(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">🌱 Beginner</SelectItem>
                        <SelectItem value="intermediate">🔥 Intermediate</SelectItem>
                        <SelectItem value="advanced">🚀 Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button 
                  onClick={generateEducationalContent}
                  disabled={isGeneratingContent || !educationalTopic.trim()}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                >
                  {isGeneratingContent ? (
                    <>
                      <Zap className="mr-2 h-4 w-4 animate-spin" />
                      Generating Content...
                    </>
                  ) : (
                    <>
                      <BookOpen className="mr-2 h-4 w-4" />
                      Generate AI Content
                    </>
                  )}
                </Button>

                {generatedContent && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Generated Content:</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearEducationalContent}
                        className="text-xs"
                      >
                        <Trash2 className="mr-1 h-3 w-3" />
                        Clear
                      </Button>
                    </div>
                    <div className="p-3 bg-muted rounded-lg text-sm">
                      {generatedContent}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ✅ Content generated! It has been automatically filled in the speech text below.
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Text-to-Speech */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-cyan-500 rounded flex items-center justify-center">
                    <Mic className="h-3 w-3 text-white" />
                  </div>
                  AI Voice Synthesis
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Generate premium AI voice with Eleven Labs
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

                <div className="space-y-2">
                  <Label>Font Style</Label>
                  <Select value={selectedFont} onValueChange={setSelectedFont}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a font style" />
                    </SelectTrigger>
                    <SelectContent>
                      {fontOptions.map((font) => (
                        <SelectItem key={font.value} value={font.value}>
                          <span style={{ fontFamily: font.font, fontWeight: font.weight }}>
                            {font.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    ✨ Choose font style for your video text
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Text Color</Label>
                  <Select value={selectedColor} onValueChange={setSelectedColor}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose text color" />
                    </SelectTrigger>
                    <SelectContent>
                      {colorOptions.map((colorOption) => (
                        <SelectItem key={colorOption.value} value={colorOption.value}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-4 h-4 rounded-full border border-white/20" 
                              style={{ backgroundColor: colorOption.color }}
                            />
                            <span>{colorOption.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    🎨 Choose color for your video text
                  </p>
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
                    
                    {audioSegments && (
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground">
                          Audio Segments ({audioSegments.length} chunks for precise subtitles):
                        </Label>
                        <div className="grid gap-2 max-h-32 overflow-y-auto">
                          {audioSegments.map((segment, index) => (
                            <div key={index} className="flex items-center gap-2 text-xs bg-muted/50 p-2 rounded">
                              <Badge variant="outline" className="text-xs">
                                {index + 1}
                              </Badge>
                              <span className="flex-1 truncate">
                                {segment.text}
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                {segment.duration ? `${segment.duration.toFixed(1)}s` : '...'}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="w-fit">
                        ✅ Audio ready {audioSegments ? `(${audioSegments.length} segments)` : ''}
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
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-red-500 rounded flex items-center justify-center">
                    <Video className="h-3 w-3 text-white" />
                  </div>
                  Background Video
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Choose preset video or upload custom
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
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <div className="w-6 h-6 bg-gradient-to-r from-pink-500 to-rose-500 rounded flex items-center justify-center">
                    <Music className="h-3 w-3 text-white" />
                  </div>
                  Background Music
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Add ambient music to enhance your video
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
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded flex items-center justify-center">
                    <Download className="h-3 w-3 text-white" />
                  </div>
                  Generate Video
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Create and download your AI video
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={handleRenderVideo}
                  disabled={isRendering}
                  className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg shadow-green-500/25"
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
                      Generate AI Video
                    </>
                  )}
                </Button>

                {isRendering && (
                  <div className="space-y-2">
                    <Progress value={renderProgress} className="w-full" />
                    <p className="text-sm text-muted-foreground text-center">
                      Creating your ultra-high quality video with Remotion...
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>


        </div>
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