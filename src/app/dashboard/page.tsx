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

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Play, Trash2, Video, Mic, Volume2, Music, LogOut, User, Zap, Wand2, Sparkles, Film, Clock } from "lucide-react";
import Link from 'next/link';
import { SpeechToText } from '@/components/SpeechToText';

function DashboardContent() {
  const { data: session } = useSession();
  const [backgroundVideo, setBackgroundVideo] = useState<string | null>(null);
  const [backgroundVideoFile, setBackgroundVideoFile] = useState<File | null>(null);
  const [selectedPresetVideo, setSelectedPresetVideo] = useState<string>('none');
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

  // Content generation states
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);

  // Font selection state
  const [selectedFont, setSelectedFont] = useState<string>('impact');

  // Text color selection state
  const [selectedColor, setSelectedColor] = useState<string>('gold');

  // New text styling states
  const [fontSize, setFontSize] = useState<number>(80);
  const [textAlignment, setTextAlignment] = useState<'left' | 'center' | 'right'>('center');
  const [backgroundBlur, setBackgroundBlur] = useState<boolean>(false);
  const [textAnimation, setTextAnimation] = useState<'none' | 'typewriter' | 'fade-in'>('fade-in');

  // Template/Preset state
  const [selectedTemplate, setSelectedTemplate] = useState<string>('none');
  const [templateVideoLength, setTemplateVideoLength] = useState<'short' | 'medium' | 'long' | 'extended'>('long');
  const [templateContentStyle, setTemplateContentStyle] = useState<'simple' | 'intermediate' | 'advanced'>('intermediate');
  const [templateContentTone, setTemplateContentTone] = useState<'default' | 'casual' | 'professional' | 'energetic' | 'dramatic' | 'humorous' | 'mysterious'>('default');

  // Unsplash images feature states
  const [addPictures, setAddPictures] = useState<boolean>(false);
  const [segmentImages, setSegmentImages] = useState<Array<{
    segmentIndex: number;
    imageUrl: string;
    description?: string;
  }> | null>(null);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);

  // Save to library states
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDescription, setVideoDescription] = useState('');

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

  // Video Templates/Presets with predefined styling combinations
  const videoTemplates = [
    {
      value: 'none',
      label: '🎬 No Template - Custom',
      description: 'Use your own custom settings',
      prompt: null,
      settings: null
    },
    {
      value: 'educational-content',
      label: '🎓 Educational Content',
      description: 'Engaging educational content on any topic',
      prompt: 'Create engaging educational content that teaches complex topics in simple, digestible ways. Focus on the most interesting and important aspects that would captivate viewers immediately. Use conversational tone, include fascinating facts or insights, and end with a compelling statement that encourages engagement. Make it 25-35 seconds of educational content that is both informative and entertaining.',
      settings: {
        font: 'montserrat',
        color: 'blue',
        fontSize: 85,
        alignment: 'center',
        blur: false,
        animation: 'fade-in',
        voice: 'EXAVITQu4vr4xnSDxMaL', // Bella - Friendly Female
        bgVideo: 'none',
        bgMusic: 'none'
      }
    },
    {
      value: 'drama-dialog',
      label: '🎭 Drama Dialog',
      description: 'Intense emotional storytelling',
      prompt: 'Create an intense, emotional dramatic dialog or monologue that would captivate viewers in 25-35 seconds. Focus on deep human emotions, conflict, or revelation. Use powerful, evocative language that builds tension and creates emotional impact. Make it feel like a scene from a compelling drama series.',
      settings: {
        font: 'oswald',
        color: 'red',
        fontSize: 100,
        alignment: 'center',
        blur: true,
        animation: 'fade-in',
        voice: 'VR6AewLTigWG4xSOukaG', // Arnold - Deep Male
        bgVideo: 'none',
        bgMusic: 'none'
      }
    },
    {
      value: 'pop-song',
      label: '🎵 Pop Song Lyrics',
      description: 'Catchy, rhythmic pop music vibes',
      prompt: 'Write catchy, rhythmic pop song lyrics or a verse that would be perfect for a viral music video. Focus on relatable themes like love, youth, dreams, or overcoming challenges. Use modern, trendy language with good rhythm and flow. Make it 25-35 seconds of engaging, singable content.',
      settings: {
        font: 'bangers',
        color: 'pink',
        fontSize: 120,
        alignment: 'center',
        blur: false,
        animation: 'typewriter',
        voice: 'MF3mGyEYCl7XYWbV9V6O', // Elli - Young Female
        bgVideo: 'none',
        bgMusic: 'mii'
      }
    },
    {
      value: 'motivational-quote',
      label: '💪 Motivational Quote',
      description: 'Inspiring and empowering content',
      prompt: 'Create a powerful, inspiring motivational message that will energize and empower viewers. Focus on themes like perseverance, success, self-improvement, or overcoming obstacles. Use strong, action-oriented language that motivates people to take action. Make it 25-35 seconds of pure inspiration.',
      settings: {
        font: 'impact',
        color: 'gold',
        fontSize: 100,
        alignment: 'center',
        blur: false,
        animation: 'fade-in',
        voice: 'pNInz6obpgDQGcFmaJgB', // Adam - Professional Male
        bgVideo: 'none',
        bgMusic: 'none'
      }
    },
    {
      value: 'horror-story',
      label: '👻 Horror Story',
      description: 'Spine-chilling scary narrative',
      prompt: 'Write a spine-chilling, atmospheric horror story or creepy narrative that will give viewers goosebumps. Focus on building suspense, using vivid imagery, and creating an eerie atmosphere. Include elements of mystery, fear, or the supernatural. Make it 25-35 seconds of pure terror.',
      settings: {
        font: 'fredoka',
        color: 'white',
        fontSize: 80,
        alignment: 'center',
        blur: true,
        animation: 'typewriter',
        voice: 'VR6AewLTigWG4xSOukaG', // Arnold - Deep Male
        bgVideo: 'none',
        bgMusic: 'none'
      }
    },
    {
      value: 'comedy-skit',
      label: '😂 Comedy Skit',
      description: 'Funny and entertaining humor',
      prompt: 'Create a hilarious, witty comedy skit or funny story that will make viewers laugh out loud. Use clever wordplay, unexpected twists, relatable humor, or absurd situations. Focus on timing and punchlines that work well in short-form content. Make it 25-35 seconds of pure entertainment.',
      settings: {
        font: 'bangers',
        color: 'yellow',
        fontSize: 90,
        alignment: 'center',
        blur: false,
        animation: 'fade-in',
        voice: 'TxGEqnHWrfWFTfGW9XjX', // Josh - Casual Male
        bgVideo: 'none',
        bgMusic: 'mii'
      }
    },
    {
      value: 'life-hack',
      label: '💡 Life Hack',
      description: 'Useful tips and tricks',
      prompt: 'Share a valuable, practical life hack or useful tip that will genuinely help viewers improve their daily lives. Focus on actionable advice, productivity tips, or clever solutions to common problems. Make it clear, concise, and immediately applicable. Provide 25-35 seconds of valuable content.',
      settings: {
        font: 'montserrat',
        color: 'blue',
        fontSize: 85,
        alignment: 'center',
        blur: false,
        animation: 'none',
        voice: 'EXAVITQu4vr4xnSDxMaL', // Bella - Friendly Female
        bgVideo: 'none',
        bgMusic: 'none'
      }
    }
  ];





  const generateSpeech = async () => {
    if (!speechText.trim()) {
      alert('Please enter text for speech generation');
      return;
    }

    setIsGeneratingSpeech(true);
    try {
      console.log('🎤 Generating segmented audio with intelligent LLM-based segmentation...');
      
      const response = await fetch('/api/generate-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: speechText,
          voiceId: selectedVoice,
          useSegments: true, // Use intelligent segmentation
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          alert('Your session has expired. Please sign in again.');
          return;
        }
        
        // Handle specific error types with better user messages
        if (response.status === 429 && errorData.errorType === 'rate_limit') {
          alert('⚠️ Eleven Labs Free Tier Limit Reached\n\nThe voice generation service is temporarily unavailable. This can happen due to:\n\n• High usage on the free tier\n• Multiple accounts detected\n• VPN/Proxy usage\n\nSolutions:\n✅ Wait a few hours and try again\n✅ Try with a different network\n✅ Consider upgrading to Eleven Labs paid plan\n\nYou can still create videos without voice - just type your text and generate the video!');
          return;
        }
        
        throw new Error(errorData.error || errorData.message || 'Failed to generate speech');
      }

      const data = await response.json();

      if (data.segments) {
        // Handle segmented audio response
        setAudioSegments(data.segments);
        setGeneratedAudio(null); // Don't use combined audio - use segments individually
        setAudioDuration(data.totalDuration);
        
        console.log('🎵 Segmented audio generated successfully:', {
          segments: data.segments.length,
          totalDuration: data.totalDuration.toFixed(1) + 's',
          averageSegmentDuration: (data.totalDuration / data.segments.length).toFixed(1) + 's',
          timingMethod: 'Individual audio segments with precise per-segment timing'
        });

        // Log segment details
        data.segments.forEach((segment: {text: string; duration: number; wordCount: number}, index: number) => {
          console.log(`📝 Segment ${index + 1}: "${segment.text}" (${segment.duration.toFixed(1)}s, ${segment.wordCount} words)`);
        });

        // Fetch images if the add pictures toggle is enabled
        if (addPictures) {
          await fetchSegmentImages(data.segments);
        }
      } else if (data.audio) {
        // Fallback to single audio response
      setGeneratedAudio(data.audio);
        setAudioSegments(null);
        setAudioDuration(data.audioDuration || null);
        
        console.log('🎵 Single audio generated (fallback):', {
          duration: data.audioDuration?.toFixed(1) + 's' || 'unknown',
          timingMethod: 'Single audio fallback'
        });
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

  const clearGeneratedContent = () => {
    setGeneratedContent(null);
    setSpeechText('');
    clearGeneratedAudio();
  };

  // Function to fetch images from Unsplash for segments
  const fetchSegmentImages = async (segments: Array<{text: string; chunkIndex: number}>) => {
    if (!addPictures || !segments || segments.length === 0) {
      return;
    }

    setIsGeneratingImages(true);
    console.log('🖼️ Generating keywords and fetching Unsplash images for segments...');

    try {
      // Step 1: Generate keywords using LLM
      console.log('🧠 Generating keywords using AI...');
      const keywordResponse = await fetch('/api/generate-keywords', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ segments }),
      });

      let keywordData = null;
      if (keywordResponse.ok) {
        const keywordResult = await keywordResponse.json();
        if (keywordResult.success && keywordResult.keywordData) {
          keywordData = keywordResult.keywordData;
          console.log('✅ Keywords generated successfully using AI');
        }
      } else {
        console.warn('⚠️ Keyword generation failed, falling back to basic extraction');
      }

      // Step 2: Fetch images using the generated keywords
      console.log('🖼️ Fetching images from Unsplash...');
      const imageResponse = await fetch('/api/fetch-unsplash-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ segments, keywordData }),
      });

      if (!imageResponse.ok) {
        const errorData = await imageResponse.json();
        throw new Error(errorData.message || 'Failed to fetch images');
      }

      const imageData = await imageResponse.json();
      
      if (imageData.success && imageData.images) {
        setSegmentImages(imageData.images);
        console.log(`✅ Successfully fetched ${imageData.images.length} images from Unsplash using ${keywordData ? 'AI-generated' : 'extracted'} keywords`);
      } else {
        throw new Error('Invalid images response');
      }
    } catch (error) {
      console.error('❌ Failed to fetch Unsplash images:', error);
      alert('Failed to fetch images. Please try again.');
    } finally {
      setIsGeneratingImages(false);
    }
  };

  // Apply template settings
  const applyTemplate = (templateValue: string) => {
    const template = videoTemplates.find(t => t.value === templateValue);
    if (!template || !template.settings) return;

    const settings = template.settings;
    setSelectedFont(settings.font);
    setSelectedColor(settings.color);
    setFontSize(settings.fontSize);
    setTextAlignment(settings.alignment as 'left' | 'center' | 'right');
    setBackgroundBlur(settings.blur);
    setTextAnimation(settings.animation as 'none' | 'typewriter' | 'fade-in');
    setSelectedVoice(settings.voice);
    
    // Apply background settings
    if (settings.bgVideo !== 'none') {
      setSelectedPresetVideo(settings.bgVideo);
      const preset = presetVideos.find(v => v.value === settings.bgVideo);
      if (preset?.path) {
        setBackgroundVideo(preset.path);
      }
    } else {
      setSelectedPresetVideo('none');
      setBackgroundVideo(null);
    }
    
    if (settings.bgMusic !== 'none') {
      setSelectedBgMusic(settings.bgMusic);
    } else {
      setSelectedBgMusic('none');
    }

    console.log(`🎬 Applied template: ${template.label}`, settings);
  };

  // Handle template selection
  const handleTemplateChange = (templateValue: string) => {
    setSelectedTemplate(templateValue);
    if (templateValue !== 'none') {
      applyTemplate(templateValue);
    }
  };

  // Generate content with template prompt
  const generateTemplateContent = async (
    templateValue: string, 
    customTopic?: string, 
    parameters?: {
      videoLength?: 'short' | 'medium' | 'long' | 'extended';
      contentStyle?: 'simple' | 'intermediate' | 'advanced';
      contentTone?: 'default' | 'casual' | 'professional' | 'energetic' | 'dramatic' | 'humorous' | 'mysterious';
    }
  ) => {
    const template = videoTemplates.find(t => t.value === templateValue);
    if (!template || !template.prompt) return;

    // Extract parameters with defaults
    const videoLength = parameters?.videoLength || 'long';
    const contentStyle = parameters?.contentStyle || 'intermediate';
    const contentTone = parameters?.contentTone || 'default';

    // Define length settings
    const lengthSettings = {
      short: { wordCount: '40-60', duration: '5-8 seconds' },
      medium: { wordCount: '60-90', duration: '10-15 seconds' },
      long: { wordCount: '100-150', duration: '20-30 seconds' },
      extended: { wordCount: '150-200', duration: '35-45 seconds' }
    };

    // Define style settings
    const styleSettings = {
      simple: 'simple language, basic concepts, easy to understand',
      intermediate: 'moderate complexity, balanced approach',
      advanced: 'detailed explanations, complex concepts, comprehensive coverage'
    };

    // Define tone settings
    const toneSettings = {
      default: '',
      casual: 'Use casual, friendly language like talking to a friend.',
      professional: 'Use professional, polished language suitable for business.',
      energetic: 'Use high-energy, exciting language that pumps up the audience.',
      dramatic: 'Use dramatic, intense language with emotional impact.',
      humorous: 'Use funny, witty language that makes people laugh.',
      mysterious: 'Use mysterious, intriguing language that creates suspense.'
    };

    const lengthSetting = lengthSettings[videoLength];
    const styleSetting = styleSettings[contentStyle];
    const toneSetting = toneSettings[contentTone];

    // Modify the prompt to include custom topic if provided for any template
    let finalPrompt = template.prompt;
    let finalTopic = template.label;
    
    if (customTopic && customTopic.trim()) {
      finalTopic = customTopic.trim();
      
      // Customize prompts based on template type with custom topic and parameters
      const baseInstructions = `Create content that is ${lengthSetting.wordCount} words for ${lengthSetting.duration}. Use ${styleSetting}. ${toneSetting}`;
      
      switch (templateValue) {
        case 'educational-content':
          finalPrompt = `Create engaging educational content about "${customTopic.trim()}" that teaches this topic in digestible ways. Focus on the most interesting aspects that would captivate viewers. Include fascinating facts or insights, and end with a compelling statement. ${baseInstructions} Make it educational but entertaining.`;
          break;
        case 'drama-dialog':
          finalPrompt = `Create an intense, emotional dramatic dialog or monologue about "${customTopic.trim()}" that would captivate viewers. Focus on deep human emotions, conflict, or revelation related to this topic. Use powerful, evocative language that builds tension and creates emotional impact. ${baseInstructions}`;
          break;
        case 'pop-song':
          finalPrompt = `Write catchy, rhythmic pop song lyrics about "${customTopic.trim()}" that would be perfect for a viral music video. Focus on relatable themes and emotions connected to this topic. Use modern, trendy language with good rhythm and flow. ${baseInstructions}`;
          break;
        case 'motivational-quote':
          finalPrompt = `Create a powerful, inspiring motivational message about "${customTopic.trim()}" that will energize and empower viewers. Focus on themes of perseverance, success, and overcoming obstacles related to this topic. Use strong, action-oriented language that motivates people to take action. ${baseInstructions}`;
          break;
        case 'horror-story':
          finalPrompt = `Write a spine-chilling, atmospheric horror story about "${customTopic.trim()}" that will give viewers goosebumps. Focus on building suspense, using vivid imagery, and creating an eerie atmosphere around this topic. Include elements of mystery, fear, or the supernatural. ${baseInstructions}`;
          break;
        case 'comedy-skit':
          finalPrompt = `Create a hilarious, witty comedy skit about "${customTopic.trim()}" that will make viewers laugh out loud. Use clever wordplay, unexpected twists, and relatable humor related to this topic. Focus on timing and punchlines that work well in short-form content. ${baseInstructions}`;
          break;
        case 'life-hack':
          finalPrompt = `Share valuable, practical life hacks or tips about "${customTopic.trim()}" that will genuinely help viewers improve their daily lives. Focus on actionable advice and clever solutions related to this topic. Make it clear, concise, and immediately applicable. ${baseInstructions}`;
          break;
        default:
          finalPrompt = `${template.prompt} Focus specifically on the topic: "${customTopic.trim()}". ${baseInstructions}`;
      }
    } else if (videoLength !== 'long' || contentStyle !== 'intermediate' || contentTone !== 'default') {
      // Apply parameters even without custom topic
      const baseInstructions = `Create content that is ${lengthSetting.wordCount} words for ${lengthSetting.duration}. Use ${styleSetting}. ${toneSetting}`;
      finalPrompt = `${template.prompt} ${baseInstructions}`;
    }

    setIsGeneratingContent(true);
    try {
      console.log(`🎭 Generating ${template.label} content${customTopic && customTopic.trim() ? ` for topic: "${customTopic.trim()}"` : ''}...`);
      
      const response = await fetch('/api/generate-educational-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: finalTopic,
          videoLength: videoLength,
          difficulty: contentStyle === 'simple' ? 'beginner' : contentStyle === 'advanced' ? 'advanced' : 'intermediate',
          templatePrompt: finalPrompt, // Send the template-specific prompt
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Failed to generate template content');
      }

      const data = await response.json();
      
      if (data.success && data.content) {
        setGeneratedContent(data.content);
        setSpeechText(data.content);
        clearGeneratedAudio();
        
        console.log(`✅ ${template.label} content generated:`, {
          topic: finalTopic,
          wordCount: data.content.split(' ').length,
          content: data.content.slice(0, 100) + '...'
        });
        } else {
        throw new Error('No content received from AI');
      }
    } catch (error) {
      console.error(`❌ ${template.label} content generation error:`, error);
      alert(`Failed to generate ${template.label} content: ${error}`);
    } finally {
      setIsGeneratingContent(false);
    }
  };

  // Function to download video from video ID
  const downloadVideoById = async (videoId: number) => {
    try {
      // Get video details first
      const videoResponse = await fetch(`/api/videos/${videoId}`);
      if (!videoResponse.ok) {
        throw new Error('Failed to get video details');
      }
      
      const video = await videoResponse.json();
      if (!video.uploadthing_url) {
        throw new Error('Video URL not found');
      }
      
      const safeTitle = video.title.replace(/[^a-zA-Z0-9\s-_]/g, '').replace(/\s+/g, '-');
      
      // Fast download - instant response
      const link = document.createElement('a');
      link.href = video.uploadthing_url;
      link.download = `${safeTitle}.mp4`;
      
      // Add download parameters to URL
      const url = new URL(video.uploadthing_url);
      url.searchParams.set('response-content-disposition', `attachment; filename="${safeTitle}.mp4"`);
      link.href = url.toString();
      
      // Click to start download
      link.click();
      
      console.log('Auto-download initiated for:', video.title);
      
    } catch (error) {
      console.error('Auto-download failed:', error);
      console.log('Auto-download failed, but video is saved to library');
    }
  };

  // Function to generate and save video to library
  const handleSaveToLibrary = async () => {
    if (!videoTitle.trim()) {
      alert('Please enter a title for your video');
      return;
    }

    setIsSaving(true);

    try {
      console.log('🚀 Starting YouTube Shorts video generation and save...');
      
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

      const response = await fetch('/api/render-and-save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          speechText,
          backgroundVideo: typeof videoSource === 'string' ? videoSource : null,
          audioSrc: generatedAudio,
          audioDuration,
          bgMusic: bgMusicSource,
          audioSegments,
          segmentImages,
          fontStyle: selectedFont,
          textColor: selectedColor,
          fontSize,
          textAlignment,
          backgroundBlur,
          textAnimation,
          videoTitle,
          videoDescription,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate and save video');
      }

      const result = await response.json();
      alert(`✅ Video generated and saved to your library successfully!`);
      
      // Auto-download the video after saving
      if (result.video && result.video.id) {
        try {
          console.log('🔄 Auto-downloading video...');
          await downloadVideoById(result.video.id);
          console.log('✅ Auto-download completed');
        } catch (downloadError) {
          console.error('❌ Auto-download failed:', downloadError);
          // Don't show error to user as the video is still saved successfully
        }
      }
      
      // Clear the save dialog
      setShowSaveDialog(false);
      setVideoTitle('');
      setVideoDescription('');
      
    } catch (error) {
      console.error('❌ Error generating/saving video:', error);
      alert(`❌ Failed to generate/save video: ${error instanceof Error ? error.message : 'Unknown error'}\n\nTry:\n1. Use a smaller background video file\n2. Use MP4 format for background\n3. Check browser console for details`);
    } finally {
      setIsSaving(false);
    }
  };



  const handleRenderVideo = async () => {
    // Generate a default title based on the speech text
    const defaultTitle = speechText.length > 50 
      ? speechText.substring(0, 50).trim() + '...' 
      : speechText.trim() || 'AI Generated Video';
    
    setVideoTitle(defaultTitle);
    setShowSaveDialog(true);
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
                <Link href="/library">
                  <Button variant="ghost" className="text-gray-300 hover:text-white">
                    <Film className="h-4 w-4 mr-2" />
                    My Library
                  </Button>
                </Link>
                <Link href="/shared">
                  <Button variant="ghost" className="text-green-300 hover:text-green-200">
                    <Video className="h-4 w-4 mr-2" />
                    Shared Library
                  </Button>
                </Link>
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

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Video Preview */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm xl:sticky xl:top-8 xl:h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded flex items-center justify-center">
                  <Play className="h-3 w-3 text-white" />
                </div>
                Live Preview
              </CardTitle>
              <CardDescription className="text-gray-400">
                Real-time preview of your AI-generated video
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mx-auto bg-black rounded-xl overflow-hidden border border-white/20 shadow-2xl" style={{ aspectRatio: '9/16', maxHeight: '600px' }}>
                <Player
                  component={SampleVideo}
                  inputProps={{
                    speechText,
                    backgroundVideo,
                    audioSrc: generatedAudio,
                    audioDuration,
                    bgMusic: selectedBgMusic !== 'none' ? bgMusicOptions.find(m => m.value === selectedBgMusic)?.path : null,
                    audioSegments: audioSegments,
                    segmentImages: segmentImages,
                    fontStyle: selectedFont,
                    textColor: selectedColor,
                    fontSize,
                    textAlignment,
                    backgroundBlur,
                    textAnimation,
                  }}
                  durationInFrames={
                    audioSegments && audioSegments.length > 0 
                      ? Math.floor(audioSegments.reduce((acc, seg) => acc + (seg.duration || 2), 0) * 60)
                      : audioDuration 
                        ? Math.floor(Math.max(audioDuration, 5) * 60) 
                        : 300
                  }
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
                {audioSegments && audioSegments.length > 0 && (
                  <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                    🎵 {audioSegments.length} Segments
                  </Badge>
                )}
                {segmentImages && segmentImages.length > 0 && (
                  <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">
                    🖼️ {segmentImages.length} Images
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Controls */}
          <div className="space-y-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg flex items-center justify-center">
                      <Mic className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {speechText ? speechText.split(' ').length : 0}
                      </p>
                      <p className="text-xs text-gray-400">Words</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {audioDuration ? `${audioDuration.toFixed(1)}s` : audioSegments ? `${audioSegments.reduce((acc, seg) => acc + (seg.duration || 2), 0).toFixed(1)}s` : '0s'}
                      </p>
                      <p className="text-xs text-gray-400">Duration</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-lg flex items-center justify-center">
                      <Video className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {audioSegments?.length || 0}
                      </p>
                      <p className="text-xs text-gray-400">Segments</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-pink-500/20 to-rose-500/20 rounded-lg flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-pink-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {segmentImages?.length || 0}
                      </p>
                      <p className="text-xs text-gray-400">Images</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Templates/Presets */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded flex items-center justify-center">
                    <Wand2 className="h-3 w-3 text-white" />
                  </div>
                  🪄 AI Templates & Presets
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Quick-start with AI-powered content generation and styling
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Choose Template</Label>
                  <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template..." />
                    </SelectTrigger>
                    <SelectContent>
                      {videoTemplates.map((template) => (
                        <SelectItem key={template.value} value={template.value}>
                          {template.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedTemplate !== 'none' && (
                  <div className="space-y-3">
                    <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                      <p className="text-sm text-gray-300">
                        {videoTemplates.find(t => t.value === selectedTemplate)?.description}
                      </p>
                    </div>

                    <div className="space-y-4">
                      {/* Topic Input with Speech-to-Text */}
                      <div className="space-y-2">
                        <Label htmlFor="template-topic">Topic (optional)</Label>
                        <div className="space-y-3">
                          <Input
                            id="template-topic"
                            placeholder={
                              selectedTemplate === 'educational-content' 
                                ? "e.g., Quantum Physics, Machine Learning, Ancient Rome..."
                                : selectedTemplate === 'drama-dialog'
                                ? "e.g., Betrayal, Lost Love, Family Secrets..."
                                : selectedTemplate === 'pop-song'
                                ? "e.g., Summer Romance, Chasing Dreams, Friendship..."
                                : selectedTemplate === 'motivational-quote'
                                ? "e.g., Overcoming Fear, Success Mindset, Personal Growth..."
                                : selectedTemplate === 'horror-story'
                                ? "e.g., Haunted House, Urban Legend, Paranormal..."
                                : selectedTemplate === 'comedy-skit'
                                ? "e.g., Awkward Situations, Daily Life, Relationships..."
                                : selectedTemplate === 'life-hack'
                                ? "e.g., Productivity, Organization, Money Saving..."
                                : "Enter a topic or theme for your content..."
                            }
                            className="w-full"
                          />
                          
                          {/* Speech-to-Text for Topic Input */}
                          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                            <div className="flex items-center gap-2 mb-2">
                              <Mic className="w-4 h-4 text-purple-400" />
                              <span className="text-sm font-medium text-white">🎤 Voice Input</span>
                            </div>
                            <SpeechToText
                              onTranscriptionComplete={(text) => {
                                const topicInput = document.getElementById('template-topic') as HTMLInputElement;
                                if (topicInput) {
                                  topicInput.value = text;
                                  topicInput.dispatchEvent(new Event('input', { bubbles: true }));
                                }
                              }}
                              placeholder="Record your topic idea"
                              disabled={isGeneratingContent}
                              className="w-full"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Template Parameters */}
                      <div className="grid grid-cols-2 gap-4">
                        {/* Video Length */}
                                                 <div className="space-y-2">
                           <Label className="text-xs">Video Length</Label>
                           <Select value={templateVideoLength} onValueChange={(value: 'short' | 'medium' | 'long' | 'extended') => setTemplateVideoLength(value)}>
                             <SelectTrigger>
                               <SelectValue placeholder="Choose length" />
                             </SelectTrigger>
                             <SelectContent>
                               <SelectItem value="short">📱 Short (5-8s)</SelectItem>
                               <SelectItem value="medium">⏱️ Medium (10-15s)</SelectItem>
                               <SelectItem value="long">🎬 Long (20-30s)</SelectItem>
                               <SelectItem value="extended">🎪 Extended (35-45s)</SelectItem>
                             </SelectContent>
                           </Select>
                         </div>

                         {/* Content Style/Difficulty */}
                         <div className="space-y-2">
                           <Label className="text-xs">Content Style</Label>
                           <Select value={templateContentStyle} onValueChange={(value: 'simple' | 'intermediate' | 'advanced') => setTemplateContentStyle(value)}>
                             <SelectTrigger>
                               <SelectValue placeholder="Choose style" />
                             </SelectTrigger>
                             <SelectContent>
                               <SelectItem value="simple">🌱 Simple & Clear</SelectItem>
                               <SelectItem value="intermediate">🔥 Balanced</SelectItem>
                               <SelectItem value="advanced">🚀 Complex & Detailed</SelectItem>
                             </SelectContent>
                           </Select>
                         </div>
                       </div>

                       {/* Content Tone */}
                       <div className="space-y-2">
                         <Label className="text-xs">Content Tone</Label>
                         <Select value={templateContentTone} onValueChange={(value: 'default' | 'casual' | 'professional' | 'energetic' | 'dramatic' | 'humorous' | 'mysterious') => setTemplateContentTone(value)}>
                           <SelectTrigger>
                             <SelectValue placeholder="Choose tone" />
                           </SelectTrigger>
                           <SelectContent>
                             <SelectItem value="default">🎯 Template Default</SelectItem>
                             <SelectItem value="casual">😎 Casual & Friendly</SelectItem>
                             <SelectItem value="professional">👔 Professional</SelectItem>
                             <SelectItem value="energetic">⚡ High Energy</SelectItem>
                             <SelectItem value="dramatic">🎭 Dramatic & Intense</SelectItem>
                             <SelectItem value="humorous">😂 Funny & Light</SelectItem>
                             <SelectItem value="mysterious">🔮 Mysterious</SelectItem>
                           </SelectContent>
                         </Select>
                       </div>

                      <p className="text-xs text-gray-400">
                        💡 Customize parameters to fine-tune your content generation
                      </p>
                      
                      <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Mic className="w-4 h-4 text-blue-400" />
                          <span className="text-sm font-medium text-blue-300">🚀 New: Voice Input</span>
                        </div>
                        <p className="text-xs text-blue-200">
                          Now you can speak your topic ideas! Just click the microphone button in the topic section to record your voice and let AI transcribe it instantly using Groq's Whisper.
                        </p>
                      </div>
                    </div>

                    <Button 
                      onClick={() => {
                        const topicInput = (document.getElementById('template-topic') as HTMLInputElement)?.value;
                        
                        generateTemplateContent(selectedTemplate, topicInput, {
                          videoLength: templateVideoLength,
                          contentStyle: templateContentStyle,
                          contentTone: templateContentTone
                        });
                      }}
                      disabled={isGeneratingContent}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                    >
                      {isGeneratingContent ? (
                        <>
                          <Zap className="mr-2 h-4 w-4 animate-spin" />
                          Generating {videoTemplates.find(t => t.value === selectedTemplate)?.label}...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Generate {videoTemplates.find(t => t.value === selectedTemplate)?.label}
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
                            onClick={clearGeneratedContent}
                            className="text-xs"
                          >
                            <Trash2 className="mr-1 h-3 w-3" />
                            Clear
                          </Button>
                        </div>
                        <div className="p-3 bg-white/10 rounded-lg text-sm border border-white/10">
                          {generatedContent}
                        </div>
                        <div className="text-xs text-gray-400">
                          ✅ Content generated! It has been automatically filled in the speech text below.
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>



            {/* Text-to-Speech */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-cyan-500 rounded flex items-center justify-center">
                      <Mic className="h-3 w-3 text-white" />
                    </div>
                    🎤 AI Voice Synthesis
                  </div>
                  {(generatedAudio || audioSegments) && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-xs text-green-400 font-medium">Ready</span>
                    </div>
                  )}
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Generate premium AI voice with intelligent text segmentation
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

                {/* Text Styling & Effects */}
                <div className="space-y-4 p-4 bg-white/5 border border-white/10 rounded-lg">
                  <Label className="text-sm font-medium text-white flex items-center gap-2">
                    <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded">
                      <Zap className="h-3 w-3 text-white p-0.5" />
                    </div>
                    Text Styling & Effects
                  </Label>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* Font Size */}
                    <div className="space-y-2">
                      <Label className="text-xs">Font Size</Label>
                      <Select value={fontSize.toString()} onValueChange={(value) => setFontSize(Number(value))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="60">📱 Small (60px)</SelectItem>
                          <SelectItem value="80">📺 Medium (80px)</SelectItem>
                          <SelectItem value="100">🎬 Large (100px)</SelectItem>
                          <SelectItem value="120">🎪 Extra Large (120px)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Text Alignment */}
                    <div className="space-y-2">
                      <Label className="text-xs">Text Alignment</Label>
                      <Select value={textAlignment} onValueChange={(value: 'left' | 'center' | 'right') => setTextAlignment(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left">⬅️ Left</SelectItem>
                          <SelectItem value="center">🎯 Center</SelectItem>
                          <SelectItem value="right">➡️ Right</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Background Blur */}
                    <div className="space-y-2">
                      <Label className="text-xs">Background Blur</Label>
                      <Select value={backgroundBlur.toString()} onValueChange={(value) => setBackgroundBlur(value === 'true')}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="false">🚫 No Blur</SelectItem>
                          <SelectItem value="true">🌫️ With Blur</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Text Animation */}
                    <div className="space-y-2">
                      <Label className="text-xs">Text Animation</Label>
                      <Select value={textAnimation} onValueChange={(value: 'none' | 'typewriter' | 'fade-in') => setTextAnimation(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">🚫 None</SelectItem>
                          <SelectItem value="fade-in">✨ Fade In</SelectItem>
                          <SelectItem value="typewriter">⌨️ Typewriter</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    🎨 Customize text appearance and animations
                  </p>
                </div>

                {/* Add Pictures Toggle */}
                <div className="space-y-3 p-4 bg-white/5 border border-white/10 rounded-lg">
                  <Label className="text-sm font-medium text-white flex items-center gap-2">
                    <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded">
                      <div className="h-3 w-3 text-white p-0.5">🖼️</div>
                    </div>
                    Add Pictures from Unsplash
                  </Label>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="add-pictures-toggle"
                      checked={addPictures}
                      onChange={(e) => setAddPictures(e.target.checked)}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="add-pictures-toggle" className="text-sm cursor-pointer">
                      Overlay relevant images on each text segment
                    </Label>
                  </div>
                  
                  {addPictures && (
                    <div className="text-xs text-gray-400 bg-blue-500/10 border border-blue-500/30 rounded p-2">
                      🧠 AI will analyze each segment and generate smart keywords to find the most relevant images from Unsplash
                    </div>
                  )}

                  {segmentImages && segmentImages.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>Images ready: {segmentImages.length}</span>
                        {isGeneratingImages && <span className="animate-pulse">🧠 Generating keywords & fetching images...</span>}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {segmentImages.slice(0, 6).map((img, index) => (
                          <div
                            key={index}
                            className="aspect-square bg-gray-700 rounded overflow-hidden"
                            title={img.description}
                          >
                            <img
                              src={img.imageUrl}
                              alt={img.description || 'Segment image'}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        ))}
                        {segmentImages.length > 6 && (
                          <div className="aspect-square bg-gray-700 rounded flex items-center justify-center text-xs text-gray-400">
                            +{segmentImages.length - 6} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <p className="text-xs text-muted-foreground">
                    🧠 AI analyzes your text and finds the perfect images for each segment
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
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-red-500 rounded flex items-center justify-center">
                      <Video className="h-3 w-3 text-white" />
                    </div>
                    📹 Background Video
                  </div>
                  {backgroundVideo && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                      <span className="text-xs text-orange-400 font-medium">Loaded</span>
                    </div>
                  )}
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Choose from presets or upload your own video
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
                <CardTitle className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-pink-500 to-rose-500 rounded flex items-center justify-center">
                      <Music className="h-3 w-3 text-white" />
                    </div>
                    🎵 Background Music
                  </div>
                  {selectedBgMusic && selectedBgMusic !== 'none' && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse"></div>
                      <span className="text-xs text-pink-400 font-medium">Selected</span>
                    </div>
                  )}
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Add ambient music to enhance your video (30% volume)
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
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm border-2 border-gradient-to-r from-purple-500/30 to-blue-500/30">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded flex items-center justify-center">
                      <Film className="h-3 w-3 text-white" />
                    </div>
                    🚀 Generate & Export
                  </div>
                  {speechText.trim() && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-xs text-green-400 font-medium">Ready to Generate</span>
                    </div>
                  )}
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Create and automatically save your AI video to library
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Readiness Checklist */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-white mb-2">📋 Generation Checklist</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${speechText.trim() ? 'bg-green-500' : 'bg-gray-600'}`}>
                        {speechText.trim() ? '✓' : '○'}
                      </div>
                      <span className={`text-sm ${speechText.trim() ? 'text-green-300' : 'text-gray-400'}`}>
                        Text Content ({speechText.split(' ').length} words)
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${(generatedAudio || audioSegments) ? 'bg-green-500' : 'bg-gray-600'}`}>
                        {(generatedAudio || audioSegments) ? '✓' : '○'}
                      </div>
                      <span className={`text-sm ${(generatedAudio || audioSegments) ? 'text-green-300' : 'text-gray-400'}`}>
                        AI Voice Generated {audioSegments && `(${audioSegments.length} segments)`}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${backgroundVideo ? 'bg-green-500' : 'bg-yellow-500'}`}>
                        {backgroundVideo ? '✓' : '○'}
                      </div>
                      <span className={`text-sm ${backgroundVideo ? 'text-green-300' : 'text-yellow-300'}`}>
                        Background Video {backgroundVideo ? '(Custom)' : '(Default will be used)'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${segmentImages && segmentImages.length > 0 ? 'bg-green-500' : 'bg-gray-600'}`}>
                        {segmentImages && segmentImages.length > 0 ? '✓' : '○'}
                      </div>
                      <span className={`text-sm ${segmentImages && segmentImages.length > 0 ? 'text-green-300' : 'text-gray-400'}`}>
                        Overlay Images {segmentImages && segmentImages.length > 0 && `(${segmentImages.length} images)`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Audio Segments Info */}
                {audioSegments && audioSegments.length > 0 && (
                  <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium text-purple-300">
                        🎵 Audio Segments Ready
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>Segments: {audioSegments.length}</span>
                        <span>Total Duration: {audioSegments.reduce((acc, seg) => acc + (seg.duration || 2), 0).toFixed(1)}s</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {audioSegments.map((segment, index) => (
                          <div
                            key={index}
                            className="px-2 py-1 bg-purple-500/20 rounded text-xs text-purple-200 border border-purple-500/30"
                            title={`Segment ${index + 1}: "${segment.text}" (${segment.duration?.toFixed(1) || '2.0'}s)`}
                          >
                            #{index + 1} ({segment.duration?.toFixed(1) || '2.0'}s)
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <Button 
                  onClick={handleRenderVideo}
                  disabled={isSaving || !speechText.trim()}
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg shadow-purple-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  size="lg"
                >
                  <Film className="mr-3 h-6 w-6" />
                  {isSaving ? 'Generating Video...' : 'Generate & Save to Library'}
                  <Sparkles className="ml-3 h-5 w-5" />
                </Button>
                
                <p className="text-xs text-center text-gray-400">
                  💾 Video will be automatically saved to your library and downloaded
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Save to Library Dialog */}
        {showSaveDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <Card className="w-full max-w-md mx-4 bg-white/10 border-white/20 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Film className="w-5 h-5" />
                  Save Video to Library
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Enter details for your video before saving to your library
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="video-title" className="text-white">
                    Video Title *
                  </Label>
                  <Input
                    id="video-title"
                    placeholder="Enter a title for your video..."
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    disabled={isSaving}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="video-description" className="text-white">
                    Description (optional)
                  </Label>
                  <Textarea
                    id="video-description"
                    placeholder="Add a description for your video..."
                    value={videoDescription}
                    onChange={(e) => setVideoDescription(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 resize-none"
                    rows={3}
                    disabled={isSaving}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowSaveDialog(false);
                      setVideoTitle('');
                      setVideoDescription('');
                    }}
                    disabled={isSaving}
                    className="flex-1 text-gray-400 hover:text-white"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveToLibrary}
                    disabled={isSaving || !videoTitle.trim()}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    {isSaving ? (
                      <>
                        <Upload className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Film className="mr-2 h-4 w-4" />
                        Save Video
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

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