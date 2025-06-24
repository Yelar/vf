'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Player } from '@remotion/player';
import { SampleVideo } from '@/remotion/SampleVideo';
import { QuizVideo } from '@/remotion/QuizVideo';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { 
  Upload, 
  Play, 
  Trash2, 
  Video, 
  Mic, 
  Volume2, 
  Music, 
  ArrowLeft, 
  Zap, 
  Wand2, 
  Sparkles, 
  Film, 
  Clock,
  Share2,
  Copy,
  Check,
  Brain,
  FileIcon,
  GripVertical,
  Image,
  Edit3,
  Plus
} from "lucide-react";
import Link from 'next/link';
import { SpeechToText } from '@/components/SpeechToText';
import { UploadButton } from '@uploadthing/react';
import type { OurFileRouter } from '@/lib/uploadthing';

function VideoCreationContent() {
  const params = useParams();
  const videoId = params.id as string;
  const isNew = videoId === 'new';
  
  // Loading and error states
  const [loading, setLoading] = useState(!isNew);
  const [error, setError] = useState<string | null>(null);
  
  // Video data for editing mode
  const [videoData, setVideoData] = useState<{
    id: string;
    title: string;
    description?: string;
    metadata?: string;
  } | null>(null);
  
  // Share video URL states
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Load video data if editing existing video
  useEffect(() => {
    if (!isNew && videoId) {
      fetchVideoData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, isNew]);

  const fetchVideoData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/videos/${videoId}`);
      
      if (!response.ok) {
        throw new Error('Video not found');
      }
      
      const data = await response.json();
      setVideoData(data.video);
      
      // Load video settings from metadata
      if (data.video.metadata) {
        const metadata = JSON.parse(data.video.metadata);
        setSpeechText(metadata.speechText || '');
        setSelectedVoice(metadata.voice || 'EXAVITQu4vr4xnSDxMaL');
        setSelectedFont(metadata.font || 'impact');
        setSelectedColor(metadata.color || 'gold');
        setFontSize(metadata.fontSize || 80);
        setTextAlignment(metadata.textAlignment || 'center');
        setBackgroundBlur(metadata.backgroundBlur || false);
        setTextAnimation(metadata.textAnimation || 'fade-in');
        setSelectedPresetVideo(metadata.presetVideo || 'none');
        setSelectedBgMusic(metadata.bgMusic || 'none');
        setAddPictures(metadata.addPictures || false);
        setVideoTitle(data.video.title);
        setVideoDescription(data.video.description || '');
        
        // Set the actual video URL for sharing
        setVideoUrl(data.video.url || '');
      }
    } catch (error) {
      console.error('Error fetching video data:', error);
      setError('Failed to load video data');
    } finally {
      setLoading(false);
    }
  };

  // Copy video URL to clipboard
  const copyVideoUrl = async () => {
    try {
      await navigator.clipboard.writeText(videoUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };
  
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

  // Quiz generation states
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [quizData, setQuizData] = useState<Array<{
    type: 'question' | 'text';
    question_text?: string;
    choices?: { A: string; B: string; C: string; D: string };
    wait_time?: number;
    answer?: 'A' | 'B' | 'C' | 'D';
    content?: string;
    id: string; // For managing order and editing
  }>>([]);
  const [quizTopic, setQuizTopic] = useState('');
  const [quizDifficulty, setQuizDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [uploadedQuizFiles, setUploadedQuizFiles] = useState<Array<{
    key: string;
    url: string;
    name: string;
    type: string;
    size: number;
  }>>([]);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [quizAudioSegments, setQuizAudioSegments] = useState<Array<{
    id: string;
    type: 'question' | 'choices' | 'wait' | 'answer' | 'text';
    text: string;
    audio?: string;
    duration?: number;
  }>>([]);
  const [questionCount, setQuestionCount] = useState(5);
  const [additionalContent, setAdditionalContent] = useState('');
  const [generateQuizImages, setGenerateQuizImages] = useState(false);

  // Quiz editing states
  const [editingQuizItem, setEditingQuizItem] = useState<string | null>(null);
  const [showAddQuizDialog, setShowAddQuizDialog] = useState(false);
  const [newQuizItem, setNewQuizItem] = useState<{
    type: 'question' | 'text';
    question_text: string;
    choices: { A: string; B: string; C: string; D: string };
    wait_time: number;
    answer: 'A' | 'B' | 'C' | 'D';
    content: string;
  }>({
    type: 'question',
    question_text: '',
    choices: { A: '', B: '', C: '', D: '' },
    wait_time: 5,
    answer: 'A',
    content: ''
  });

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
    },
    {
      value: 'quiz',
      label: '🧠 Interactive Quiz',
      description: 'Generate interactive quiz videos with questions and answers',
      prompt: null, // Special handling for quiz generation
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

  // Function to generate AI images for segments
  const fetchSegmentImages = async (segments: Array<{text: string; chunkIndex: number}>) => {
    if (!addPictures || !segments || segments.length === 0) {
      return;
    }

    setIsGeneratingImages(true);
    console.log('🎨 Generating prompts and creating AI images for segments...');

    try {
      // Step 1: Generate image prompts using LLM
      console.log('🧠 Generating image prompts using AI...');
      const promptResponse = await fetch('/api/generate-prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ segments }),
      });

      let promptData = null;
      if (promptResponse.ok) {
        const promptResult = await promptResponse.json();
        if (promptResult.success && promptResult.promptData) {
          promptData = promptResult.promptData;
          console.log('✅ Image prompts generated successfully using AI');
        }
      } else {
        console.warn('⚠️ Prompt generation failed, falling back to basic prompt creation');
      }

      // Step 2: Generate images using the AI prompts
      console.log('🎨 Generating images with AI...');
      const imageResponse = await fetch('/api/generate-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ segments, promptData }),
      });

      if (!imageResponse.ok) {
        const errorData = await imageResponse.json();
        throw new Error(errorData.message || 'Failed to generate images');
      }

      const imageData = await imageResponse.json();
      
      if (imageData.success && imageData.images) {
        setSegmentImages(imageData.images);
        console.log(`✅ Successfully generated ${imageData.images.length} AI images using ${promptData ? 'AI-generated' : 'auto-generated'} prompts`);
      } else {
        throw new Error('Invalid images response');
      }
    } catch (error) {
      console.error('❌ Failed to generate AI images:', error);
      alert('Failed to generate images. Please try again.');
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
    
    // Enable quiz mode for quiz template
    if (templateValue === 'quiz') {
      setIsQuizMode(true);
      // Clear existing speech text when switching to quiz mode
      setSpeechText('');
      clearGeneratedAudio();
    } else {
      setIsQuizMode(false);
      // Clear quiz data when switching away from quiz mode
      setQuizData([]);
      setQuizTopic('');
      setUploadedQuizFiles([]);
      setQuizAudioSegments([]);
    }
    
    if (templateValue !== 'none' && templateValue !== 'quiz') {
      applyTemplate(templateValue);
    }
  };

  // Generate quiz content
  const generateQuizContent = async () => {
    if (!quizTopic.trim()) {
      alert('Please enter a quiz topic');
      return;
    }

    setIsGeneratingQuiz(true);
    try {
      console.log('🧠 Generating quiz content...');
      
      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: quizTopic,
          questionCount: questionCount,
          difficulty: quizDifficulty,
          additionalContent: additionalContent.trim() || null,
          uploadedFiles: uploadedQuizFiles
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Failed to generate quiz');
      }

      const data = await response.json();
      
      // Add unique IDs to quiz items
      const quizWithIds = data.quiz.map((item: {
        type: 'question' | 'text';
        question_text?: string;
        choices?: { A: string; B: string; C: string; D: string };
        wait_time?: number;
        answer?: 'A' | 'B' | 'C' | 'D';
        content?: string;
      }, index: number) => ({
        ...item,
        id: `quiz-item-${index}-${Date.now()}`
      }));
      
      setQuizData(quizWithIds);
      console.log('✅ Quiz generated successfully:', quizWithIds);
      
    } catch (error) {
      console.error('❌ Quiz generation error:', error);
      alert(`Failed to generate quiz: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  // Generate audio segments for quiz
  const generateQuizAudio = async () => {
    if (quizData.length === 0) {
      alert('Please generate quiz content first');
      return;
    }

    setIsGeneratingSpeech(true);
    try {
      console.log('🎤 Generating quiz audio segments...');
      
      // Create audio segments based on quiz structure
      const audioSegments: Array<{
        id: string;
        type: 'question' | 'choices' | 'wait' | 'answer' | 'text';
        text: string;
        audio?: string;
        duration?: number;
      }> = [];

      // Process each quiz item
      for (const item of quizData) {
        if (item.type === 'text') {
          // For text items, add directly
          audioSegments.push({
            id: `${item.id}-text`,
            type: 'text',
            text: item.content || ''
          });
        } else if (item.type === 'question') {
          // For questions, break into segments: question -> choices -> wait -> answer
          
          // 1. Question text
          audioSegments.push({
            id: `${item.id}-question`,
            type: 'question',
            text: item.question_text || ''
          });

          // 2. Choices
          const choicesText = item.choices ? 
            `A: ${item.choices.A}. B: ${item.choices.B}. C: ${item.choices.C}. D: ${item.choices.D}` : '';
          audioSegments.push({
            id: `${item.id}-choices`,
            type: 'choices',
            text: choicesText
          });

          // 3. Wait time (countdown)
          const waitTime = item.wait_time || 5;
          // Create countdown text: "5, 4, 3, 2, 1" for 5 seconds
          const countdownNumbers = Array.from({length: waitTime}, (_, i) => waitTime - i);
          const countdownText = countdownNumbers.join(', ');
          
          audioSegments.push({
            id: `${item.id}-wait`,
            type: 'wait',
            text: countdownText,
            duration: waitTime
          });

          // 4. Answer
          const answerText = item.answer && item.choices ? 
            `The correct answer is ${item.answer}: ${item.choices[item.answer]}` : '';
          audioSegments.push({
            id: `${item.id}-answer`,
            type: 'answer',
            text: answerText
          });
        }
      }

      console.log('📋 Audio segments to generate:', audioSegments.length);

      // Generate audio for non-wait segments
      for (const segment of audioSegments) {
        if (segment.type !== 'wait' && segment.text.trim()) {
          console.log(`🎤 Generating audio for: ${segment.text.slice(0, 50)}...`);
          
          const response = await fetch('/api/generate-speech', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: segment.text,
              voiceId: selectedVoice,
              useSegments: false // Generate individual audio
            }),
          });

          if (!response.ok) {
            throw new Error(`Failed to generate audio for segment: ${segment.text.slice(0, 30)}...`);
          }

          const audioData = await response.json();
          segment.audio = audioData.audio;
          segment.duration = audioData.audioDuration;
        }
      }

      setQuizAudioSegments(audioSegments);
      
      // Clear regular audio segments since we're using quiz audio
      setAudioSegments(null);
      setGeneratedAudio(null);

      // Generate images for quiz questions if enabled
      if (generateQuizImages) {
        await fetchQuizImages(audioSegments);
      }

      console.log('✅ Quiz audio generation complete:', audioSegments.length, 'segments');
      
    } catch (error) {
      console.error('❌ Quiz audio generation error:', error);
      alert(`Failed to generate quiz audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGeneratingSpeech(false);
    }
  };

  // File upload handlers for quiz
  const handleQuizFileUpload = (files: Array<{
    key: string;
    url: string;
    name: string;
    type?: string;
    size: number;
  }>) => {
    const newFiles = files.map(file => ({
      key: file.key,
      url: file.url,
      name: file.name,
      type: file.type || 'unknown',
      size: file.size
    }));
    setUploadedQuizFiles(prev => [...prev, ...newFiles]);
  };

  const removeQuizFile = (keyToRemove: string) => {
    setUploadedQuizFiles(prev => prev.filter(file => file.key !== keyToRemove));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Quiz reordering functions
  const moveQuizItem = (fromIndex: number, toIndex: number) => {
    const newQuizData = [...quizData];
    const [removed] = newQuizData.splice(fromIndex, 1);
    newQuizData.splice(toIndex, 0, removed);
    setQuizData(newQuizData);
  };

  const removeQuizItem = (index: number) => {
    setQuizData(prev => prev.filter((_, i) => i !== index));
  };

  // Edit quiz item functionality
  const startEditingItem = (id: string) => {
    const item = quizData.find(q => q.id === id);
    if (item) {
      setNewQuizItem({
        type: item.type,
        question_text: item.question_text || '',
        choices: item.choices || { A: '', B: '', C: '', D: '' },
        wait_time: item.wait_time || 5,
        answer: item.answer || 'A',
        content: item.content || ''
      });
      setEditingQuizItem(id);
      setShowAddQuizDialog(true);
    }
  };

  const saveQuizItem = () => {
    if (editingQuizItem) {
      // Update existing item
      setQuizData(prev => prev.map(item => 
        item.id === editingQuizItem 
          ? {
              ...item,
              ...newQuizItem,
              id: item.id // Keep the same ID
            }
          : item
      ));
    } else {
      // Add new item
      const newItem = {
        ...newQuizItem,
        id: `${Date.now()}-${Math.random()}`
      };
      setQuizData(prev => [...prev, newItem]);
    }
    
    // Reset form
    setNewQuizItem({
      type: 'question',
      question_text: '',
      choices: { A: '', B: '', C: '', D: '' },
      wait_time: 5,
      answer: 'A',
      content: ''
    });
    setEditingQuizItem(null);
    setShowAddQuizDialog(false);
  };

  const cancelEditingQuizItem = () => {
    setNewQuizItem({
      type: 'question',
      question_text: '',
      choices: { A: '', B: '', C: '', D: '' },
      wait_time: 5,
      answer: 'A',
      content: ''
    });
    setEditingQuizItem(null);
    setShowAddQuizDialog(false);
  };

  // Generate images for quiz questions
  const fetchQuizImages = async (audioSegments: Array<{
    id: string;
    type: 'question' | 'choices' | 'wait' | 'answer' | 'text';
    text: string;
    audio?: string;
    duration?: number;
  }>) => {
    setIsGeneratingImages(true);
    try {
      console.log('🖼️ Generating quiz images with OpenAI DALL-E...');
      
      // Filter for question segments only and map to proper segment index
      const questionSegments = audioSegments
        .map((seg, originalIndex) => ({ ...seg, originalIndex }))
        .filter(seg => seg.type === 'question');
      
      if (questionSegments.length === 0) {
        console.log('No question segments found for image generation');
        return;
      }

      console.log('📝 Question segments for image generation:', questionSegments.map(seg => ({
        text: seg.text,
        type: seg.type,
        originalIndex: seg.originalIndex
      })));

      const response = await fetch('/api/generate-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          segments: questionSegments.map((seg) => ({
            text: seg.text,
            chunkIndex: seg.originalIndex // Use original index for proper mapping
          }))
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Failed to generate quiz images');
      }

      const data = await response.json();
      
      // Map the images back to the correct segment indices
      const mappedImages = data.images.map((img: {
        segmentIndex: number;
        imageUrl: string;
        description?: string;
        prompt?: string;
      }) => ({
        ...img,
        segmentIndex: questionSegments.find((_, qIndex) => qIndex === img.segmentIndex)?.originalIndex || img.segmentIndex
      }));
      
      setSegmentImages(mappedImages);
      console.log('✅ Quiz images generated with OpenAI:', mappedImages.length, 'images');
      
    } catch (error) {
      console.error('❌ Quiz image generation error:', error);
      alert(`Failed to generate quiz images: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGeneratingImages(false);
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



  // Function to generate and save video to library
  const handleSaveToLibrary = async () => {
    if (!videoTitle.trim()) {
      alert('Please enter a title for your video');
      return;
    }

    setIsSaving(true);

    try {
      console.log('🚀 Starting video generation and save...');
      
      if (isQuizMode && selectedTemplate === 'quiz') {
        // Interactive Quiz template: Use dedicated quiz video endpoint for cloud processing
        console.log('🧠 Using quiz video rendering endpoint...');
        
        // Determine which background music to use
        let bgMusicSource: string | null = null;
        if (selectedBgMusic && selectedBgMusic !== 'none') {
          const musicOption = bgMusicOptions.find(m => m.value === selectedBgMusic);
          bgMusicSource = musicOption?.path || null;
        }
        
        const response = await fetch('/api/render-quiz-video', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            segments: quizAudioSegments,
            font: selectedFont,
            fontSize,
            textColor: selectedColor,
            textAlignment,
            backgroundBlur,
            backgroundVideo: backgroundVideo || undefined,
            bgMusic: bgMusicSource,
            segmentImages,
            videoTitle,
            videoDescription,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.details || error.error || 'Failed to render quiz video');
        }

        const result = await response.json();
        
        if (result.success) {
          alert(`🧠 Quiz video "${videoTitle}" is being processed!\n\n${result.message}\n\nEstimated time: ${result.estimatedTime}\n\nYou'll receive an email notification when it's ready.`);
          // If this is a new video and we got a video ID back, do NOT navigate away, just close dialog
          setShowSaveDialog(false);
          setVideoTitle('');
          setVideoDescription('');
        } else {
          throw new Error(result.error || 'Failed to start quiz video processing');
        }
        
      } else {
        // Regular mode OR quiz mode with other templates: Use cloud processing endpoint
        console.log('📹 Using regular video processing endpoint...');
        
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
        
        if (result.success) {
          alert(`🎬 Video "${videoTitle}" is being processed!\n\n${result.message}\n\nEstimated time: ${result.estimatedTime}\n\nYou'll receive an email notification when it's ready.`);
          // If this is a new video and we got a video ID back, do NOT navigate away, just close dialog
          if (result.videoUrl) {
            setVideoUrl(result.videoUrl);
          }
          setShowSaveDialog(false);
          setVideoTitle('');
          setVideoDescription('');
        } else {
          throw new Error(result.error || 'Failed to start video processing');
        }
      }
      
    } catch (error) {
      console.error('❌ Error generating/saving video:', error);
      alert(`❌ Failed to generate/save video: ${error instanceof Error ? error.message : 'Unknown error'}\n\nTry:\n1. Use a smaller background video file\n2. Use MP4 format for background\n3. Check browser console for details`);
    } finally {
      setIsSaving(false);
    }
  };



  const handleRenderVideo = async () => {
    // Generate a default title based on the content
    let defaultTitle: string;
    
    if (isQuizMode && quizTopic) {
      defaultTitle = `Quiz: ${quizTopic}`;
    } else if (speechText.length > 50) {
      defaultTitle = speechText.substring(0, 50).trim() + '...';
    } else {
      defaultTitle = speechText.trim() || 'AI Generated Video';
    }
    
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading video...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

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
                <Link href="/dashboard">
                  <Button variant="ghost" className="text-gray-300 hover:text-white">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <div className="h-6 w-px bg-white/20"></div>
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <Video className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">
                    {isNew ? '🎬 Create New Video' : `✏️ Edit: ${videoData?.title || 'Video'}`}
                  </h1>
                  <p className="text-sm text-gray-400">
                    AI-Powered Video Generation
                  </p>
                </div>
                {!isNew && videoUrl && (
                  <div className="flex items-center gap-2 ml-6">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyVideoUrl}
                      className="text-blue-300 hover:text-blue-200"
                    >
                      {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                      {copied ? 'Copied!' : 'Copy Video URL'}
                    </Button>
                  </div>
                )}
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
                    <Share2 className="h-4 w-4 mr-2" />
                    Shared
                  </Button>
                </Link>
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
                {isQuizMode ? (
                  <Player
                    component={QuizVideo}
                    inputProps={{
                      segments: quizAudioSegments || [],
                      font: selectedFont,
                      fontSize,
                      textColor: selectedColor,
                      textAlignment,
                      backgroundBlur,
                      backgroundVideo: backgroundVideo || undefined,
                      bgMusic: selectedBgMusic !== 'none' ? bgMusicOptions.find(m => m.value === selectedBgMusic)?.path : null,
                      segmentImages,
                      voice: selectedVoice,
                    }}
                    durationInFrames={
                      quizAudioSegments.length > 0
                        ? Math.floor(quizAudioSegments.reduce((acc, seg) => acc + (seg.duration || 2), 0) * 60)
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
                ) : (
                  <Player
                    component={SampleVideo}
                    inputProps={{
                      speechText,
                      backgroundVideo,
                      audioSrc: generatedAudio,
                      audioDuration,
                      bgMusic: selectedBgMusic !== 'none' ? bgMusicOptions.find(m => m.value === selectedBgMusic)?.path : null,
                      audioSegments,
                      segmentImages,
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
                )}
              </div>
              <div className="flex items-center justify-center gap-3 mt-4">
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                  📱 9:16 Vertical
                </Badge>
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                  🚀 AI Powered
                </Badge>
                {isQuizMode && quizAudioSegments.length > 0 ? (
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                    🧠 {quizAudioSegments.length} Quiz Segments
                  </Badge>
                ) : audioSegments && audioSegments.length > 0 && (
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
                        {isQuizMode ? quizData.filter(item => item.type === 'question').length : (speechText ? speechText.split(' ').length : 0)}
                      </p>
                      <p className="text-xs text-gray-400">{isQuizMode ? 'Questions' : 'Words'}</p>
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
                        {isQuizMode && quizAudioSegments.length > 0 
                          ? `${quizAudioSegments.reduce((acc, seg) => acc + (seg.duration || 2), 0).toFixed(1)}s`
                          : audioDuration ? `${audioDuration.toFixed(1)}s` 
                          : audioSegments ? `${audioSegments.reduce((acc, seg) => acc + (seg.duration || 2), 0).toFixed(1)}s` 
                          : '0s'
                        }
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
                        {isQuizMode ? quizAudioSegments?.length || 0 : audioSegments?.length || 0}
                      </p>
                      <p className="text-xs text-gray-400">{isQuizMode ? 'Quiz Parts' : 'Segments'}</p>
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

                {selectedTemplate === 'quiz' && (
                  <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                    <p className="text-sm text-purple-200">
                      🧠 {videoTemplates.find(t => t.value === selectedTemplate)?.description}
                    </p>
                    <p className="text-xs text-purple-300 mt-1">
                      Use the quiz generation section below to create your interactive quiz content.
                    </p>
                  </div>
                )}

                {selectedTemplate !== 'none' && selectedTemplate !== 'quiz' && (
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
                          Now you can speak your topic ideas! Just click the microphone button in the topic section to record your voice and let AI transcribe it instantly using Azure Speech Service.
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



            {/* Text-to-Speech or Quiz Generation */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-cyan-500 rounded flex items-center justify-center">
                      {isQuizMode ? (
                        <Brain className="h-3 w-3 text-white" />
                      ) : (
                        <Mic className="h-3 w-3 text-white" />
                      )}
                    </div>
                    {isQuizMode ? '🧠 Quiz Generation' : '🎤 AI Voice Synthesis'}
                  </div>
                  {((generatedAudio || audioSegments) && !isQuizMode) || (quizAudioSegments && quizAudioSegments.length > 0) && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-xs text-green-400 font-medium">Ready</span>
                    </div>
                  )}
                </CardTitle>
                <CardDescription className="text-gray-400">
                  {isQuizMode 
                    ? 'Generate interactive quiz videos with questions and answers'
                    : 'Generate premium AI voice with intelligent text segmentation'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isQuizMode ? (
                  /* Enhanced Quiz Generation UI */
                  <>
                    {/* Basic Quiz Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="quiz-topic">Quiz Topic *</Label>
                        <Textarea
                          id="quiz-topic"
                          value={quizTopic}
                          onChange={(e) => setQuizTopic(e.target.value)}
                          placeholder="e.g., JavaScript Fundamentals, Machine Learning, History..."
                          rows={2}
                          className="resize-none"
                        />
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Number of Questions</Label>
                          <Select value={questionCount.toString()} onValueChange={(value) => setQuestionCount(parseInt(value))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="3">3 Questions</SelectItem>
                              <SelectItem value="5">5 Questions</SelectItem>
                              <SelectItem value="7">7 Questions</SelectItem>
                              <SelectItem value="10">10 Questions</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Difficulty Level</Label>
                          <Select value={quizDifficulty} onValueChange={(value: 'beginner' | 'intermediate' | 'advanced') => setQuizDifficulty(value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="beginner">🌱 Beginner</SelectItem>
                              <SelectItem value="intermediate">📚 Intermediate</SelectItem>
                              <SelectItem value="advanced">🎓 Advanced</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* File Upload Section */}
                    <div className="space-y-4">
                      <Label>Upload Reference Files (Optional)</Label>
                      <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
                        <UploadButton<OurFileRouter, "quizContentUploader">
                          endpoint="quizContentUploader"
                          onClientUploadComplete={(res) => {
                            console.log('📎 Files uploaded:', res);
                            if (res) handleQuizFileUpload(res);
                          }}
                          onUploadError={(error: Error) => {
                            console.error('❌ Upload error:', error);
                            alert(`Upload failed: ${error.message}`);
                          }}
                          appearance={{
                            button: "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md",
                            allowedContent: "text-gray-400 text-sm"
                          }}
                        />
                        <p className="text-gray-400 text-sm mt-2">
                          PDFs, text files, and documents (up to 32MB each)
                        </p>
                      </div>

                      {/* Uploaded Files List */}
                      {uploadedQuizFiles.length > 0 && (
                        <div className="space-y-2">
                          <Label>Uploaded Files ({uploadedQuizFiles.length})</Label>
                          <div className="space-y-2">
                            {uploadedQuizFiles.map((file) => (
                              <div key={file.key} className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/10">
                                <div className="flex items-center space-x-3">
                                  <FileIcon className="h-4 w-4 text-gray-400" />
                                  <div>
                                    <p className="text-sm font-medium">{file.name}</p>
                                    <p className="text-xs text-gray-400">
                                      {file.type} • {formatFileSize(file.size)}
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeQuizFile(file.key)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Additional Content */}
                    <div className="space-y-2">
                      <Label htmlFor="additionalContent">Additional Context (Optional)</Label>
                      <Textarea
                        id="additionalContent"
                        placeholder="Enter any additional context, instructions, or specific requirements for the quiz..."
                        value={additionalContent}
                        onChange={(e) => setAdditionalContent(e.target.value)}
                        rows={3}
                        className="resize-none"
                      />
                    </div>

                    {/* Generate Quiz Button */}
                    <Button
                      onClick={generateQuizContent}
                      disabled={isGeneratingQuiz || !quizTopic.trim()}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                    >
                      {isGeneratingQuiz ? (
                        <>
                          <Zap className="mr-2 h-4 w-4 animate-spin" />
                          Generating Quiz...
                        </>
                      ) : (
                        <>
                          <Brain className="mr-2 h-4 w-4" />
                          Generate Quiz Content
                        </>
                      )}
                    </Button>

                    {/* Generated Quiz Content with Reordering */}
                    {quizData.length > 0 ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">Quiz Content ({quizData.length} items):</Label>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowAddQuizDialog(true)}
                              className="text-xs bg-green-600/20 border-green-500/30 text-green-300 hover:bg-green-600/30"
                            >
                              <Plus className="mr-1 h-3 w-3" />
                              Add Item
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setQuizData([])}
                              className="text-xs"
                            >
                              <Trash2 className="mr-1 h-3 w-3" />
                              Clear All
                            </Button>
                          </div>
                        </div>
                        
                        <div className="space-y-2 max-h-96 overflow-y-auto border border-white/10 rounded-lg p-3 bg-white/5">
                          {quizData.map((item, index) => (
                            <div key={item.id} className="group relative p-3 bg-white/10 rounded-lg border border-white/10 hover:bg-white/15 transition-colors">
                              {/* Reorder Controls */}
                              <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="flex flex-col gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => index > 0 && moveQuizItem(index, index - 1)}
                                    disabled={index === 0}
                                    className="h-6 w-6 p-0"
                                  >
                                    <GripVertical className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>

                              {/* Edit and Delete Buttons */}
                              <div className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => startEditingItem(item.id)}
                                  className="h-6 w-6 p-0 text-blue-400 hover:text-blue-300"
                                >
                                  <Edit3 className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeQuizItem(index)}
                                  className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>

                              {/* Content */}
                              <div className="ml-8 mr-8">
                                {item.type === 'question' ? (
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                                        Q{index + 1}
                                      </Badge>
                                      <span className="text-sm font-medium">{item.question_text}</span>
                                    </div>
                                    {item.choices && (
                                      <div className="grid grid-cols-2 gap-1 text-xs text-gray-300">
                                        {Object.entries(item.choices).map(([key, value]) => (
                                          <div 
                                            key={key}
                                            className={`p-1 rounded ${
                                              item.answer === key 
                                                ? 'bg-green-500/20 text-green-300' 
                                                : 'bg-gray-800/50'
                                            }`}
                                          >
                                            <span className="font-bold">{key}:</span> {value}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    <div className="flex items-center gap-2 text-xs">
                                      <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                                        Answer: {item.answer}
                                      </Badge>
                                      <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">
                                        Wait: {item.wait_time}s
                                      </Badge>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                                      Text
                                    </Badge>
                                    <span className="text-sm">{item.content}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Image Generation Toggle */}
                        <div className="flex items-center space-x-2 p-3 bg-white/5 border border-white/10 rounded-lg">
                          <input
                            type="checkbox"
                            id="generate-quiz-images"
                            checked={generateQuizImages}
                            onChange={(e) => setGenerateQuizImages(e.target.checked)}
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <Label htmlFor="generate-quiz-images" className="text-sm cursor-pointer flex items-center gap-2">
                            <Image className="h-4 w-4" />
                            Generate AI images for questions
                          </Label>
                        </div>
                        
                        {/* Quiz Styling Controls */}
                        <div className="space-y-4 p-4 bg-white/5 border border-white/10 rounded-lg">
                          <Label className="text-sm font-medium text-white flex items-center gap-2">
                            <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded">
                              <Zap className="h-3 w-3 text-white p-0.5" />
                            </div>
                            Quiz Styling & Effects
                          </Label>

                          <div className="grid grid-cols-2 gap-4">
                            {/* Voice Selection */}
                            <div className="space-y-2">
                              <Label className="text-xs">Voice</Label>
                              <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                                <SelectTrigger>
                                  <SelectValue />
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

                            {/* Font Style */}
                            <div className="space-y-2">
                              <Label className="text-xs">Font Style</Label>
                              <Select value={selectedFont} onValueChange={setSelectedFont}>
                                <SelectTrigger>
                                  <SelectValue />
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
                            </div>

                            {/* Text Color */}
                            <div className="space-y-2">
                              <Label className="text-xs">Text Color</Label>
                              <Select value={selectedColor} onValueChange={setSelectedColor}>
                                <SelectTrigger>
                                  <SelectValue />
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
                            </div>

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
                            🎨 Customize quiz video appearance and animations
                          </p>
                        </div>

                        {/* Generate Audio Button */}
                        <Button
                          onClick={generateQuizAudio}
                          disabled={isGeneratingSpeech}
                          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                        >
                          {isGeneratingSpeech ? (
                            <>
                              <Zap className="mr-2 h-4 w-4 animate-spin" />
                              Generating Audio...
                            </>
                          ) : (
                            <>
                              <Volume2 className="mr-2 h-4 w-4" />
                              Generate Audio for Quiz
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      /* Empty Quiz State */
                      <div className="text-center py-8 space-y-4">
                        <div className="text-gray-400">
                          <Brain className="mx-auto h-12 w-12 mb-2 opacity-50" />
                          <p className="text-sm">No quiz content yet.</p>
                          <p className="text-xs">Generate quiz content or add items manually.</p>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => setShowAddQuizDialog(true)}
                          className="bg-green-600/20 border-green-500/30 text-green-300 hover:bg-green-600/30"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add First Item
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  /* Regular Text-to-Speech UI */
                  <>
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
                              <SelectItem value="true">✨ Blur Effect</SelectItem>
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
                        Generate AI Images
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
                          Generate custom AI images for each text segment
                        </Label>
                      </div>
                      
                      {addPictures && (
                        <div className="text-xs text-gray-400 bg-blue-500/10 border border-blue-500/30 rounded p-2">
                          🎨 AI will analyze each segment and generate unique, custom images tailored to your content
                        </div>
                      )}

                      {segmentImages && segmentImages.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs text-gray-400">
                            <span>AI Images ready: {segmentImages.length}</span>
                            {isGeneratingImages && <span className="animate-pulse">🎨 Generating AI images...</span>}
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
                        🎨 AI analyzes your text and creates unique, custom images for each segment
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
                  </>
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
                  {(isQuizMode ? (quizData && quizData.length > 0) : speechText.trim()) && (
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
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                        isQuizMode 
                          ? (quizData && quizData.length > 0 ? 'bg-green-500' : 'bg-gray-600')
                          : (speechText.trim() ? 'bg-green-500' : 'bg-gray-600')
                      }`}>
                        {(isQuizMode ? (quizData && quizData.length > 0) : speechText.trim()) ? '✓' : '○'}
                      </div>
                      <span className={`text-sm ${
                        (isQuizMode ? (quizData && quizData.length > 0) : speechText.trim()) 
                          ? 'text-green-300' 
                          : 'text-gray-400'
                      }`}>
                        Text Content {isQuizMode 
                          ? (quizData ? `(${quizData.length} quiz items)` : '(0 quiz items)')
                          : `(${speechText.split(' ').length} words)`
                        }
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                        isQuizMode 
                          ? (quizAudioSegments && quizAudioSegments.length > 0 ? 'bg-green-500' : 'bg-gray-600')
                          : ((generatedAudio || audioSegments) ? 'bg-green-500' : 'bg-gray-600')
                      }`}>
                        {(isQuizMode ? (quizAudioSegments && quizAudioSegments.length > 0) : (generatedAudio || audioSegments)) ? '✓' : '○'}
                      </div>
                      <span className={`text-sm ${
                        (isQuizMode ? (quizAudioSegments && quizAudioSegments.length > 0) : (generatedAudio || audioSegments)) 
                          ? 'text-green-300' 
                          : 'text-gray-400'
                      }`}>
                        AI Voice Generated {isQuizMode 
                          ? (quizAudioSegments ? `(${quizAudioSegments.length} segments)` : '')
                          : (audioSegments ? `(${audioSegments.length} segments)` : '')
                        }
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
                {((isQuizMode && quizAudioSegments && quizAudioSegments.length > 0) || 
                  (!isQuizMode && audioSegments && audioSegments.length > 0)) && (
                  <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium text-purple-300">
                        {isQuizMode ? '🧠 Quiz Audio Ready' : '🎵 Audio Segments Ready'}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {isQuizMode && quizAudioSegments ? (
                        <>
                          <div className="flex items-center justify-between text-xs text-gray-400">
                            <span>Quiz Segments: {quizAudioSegments.length}</span>
                            <span>Total Duration: {quizAudioSegments.reduce((acc, seg) => acc + (seg.duration || 2), 0).toFixed(1)}s</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {quizAudioSegments.map((segment, index) => (
                              <div
                                key={index}
                                className={`px-2 py-1 rounded text-xs border ${
                                  segment.type === 'question' ? 'bg-blue-500/20 text-blue-200 border-blue-500/30' :
                                  segment.type === 'choices' ? 'bg-green-500/20 text-green-200 border-green-500/30' :
                                  segment.type === 'wait' ? 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30' :
                                  segment.type === 'answer' ? 'bg-purple-500/20 text-purple-200 border-purple-500/30' :
                                  'bg-gray-500/20 text-gray-200 border-gray-500/30'
                                }`}
                                title={`${segment.type}: "${segment.text}" (${segment.duration?.toFixed(1) || '2.0'}s)`}
                              >
                                {segment.type.charAt(0).toUpperCase()}#{index + 1} ({segment.duration?.toFixed(1) || '2.0'}s)
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center justify-between text-xs text-gray-400">
                            <span>Segments: {audioSegments?.length || 0}</span>
                            <span>Total Duration: {audioSegments?.reduce((acc, seg) => acc + (seg.duration || 2), 0).toFixed(1) || '0.0'}s</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {audioSegments?.map((segment, index) => (
                              <div
                                key={index}
                                className="px-2 py-1 bg-purple-500/20 rounded text-xs text-purple-200 border border-purple-500/30"
                                title={`Segment ${index + 1}: "${segment.text}" (${segment.duration?.toFixed(1) || '2.0'}s)`}
                              >
                                #{index + 1} ({segment.duration?.toFixed(1) || '2.0'}s)
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                <Button 
                  onClick={handleRenderVideo}
                  disabled={isSaving || (isQuizMode ? (!quizData || quizData.length === 0) : !speechText.trim())}
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg shadow-purple-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  size="lg"
                >
                  <Film className="mr-3 h-6 w-6" />
                  {isSaving ? 'Starting Video Processing...' : 'Generate & Save to Library'}
                  <Sparkles className="ml-3 h-5 w-5" />
                </Button>
                
                <p className="text-xs text-center text-gray-400">
                  📧 Video will be processed in background. You&apos;ll receive an email when ready!
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

        {/* Quiz Edit/Add Dialog */}
        {showAddQuizDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <Card className="w-full max-w-2xl mx-4 bg-white/10 border-white/20 backdrop-blur-xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  {editingQuizItem ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  {editingQuizItem ? 'Edit Quiz Item' : 'Add New Quiz Item'}
                </CardTitle>
                <CardDescription className="text-gray-400">
                  {editingQuizItem ? 'Modify your quiz item' : 'Create a new question or text for your quiz'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Item Type Selection */}
                <div className="space-y-2">
                  <Label className="text-white">Item Type</Label>
                  <Select 
                    value={newQuizItem.type} 
                    onValueChange={(value: 'question' | 'text') => 
                      setNewQuizItem(prev => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="question">❓ Question with Multiple Choice</SelectItem>
                      <SelectItem value="text">📝 Text/Information</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newQuizItem.type === 'question' ? (
                  <>
                    {/* Question Text */}
                    <div className="space-y-2">
                      <Label className="text-white">Question Text *</Label>
                      <Textarea
                        placeholder="Enter your question..."
                        value={newQuizItem.question_text}
                        onChange={(e) => setNewQuizItem(prev => ({ 
                          ...prev, 
                          question_text: e.target.value 
                        }))}
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 resize-none"
                        rows={2}
                      />
                    </div>

                    {/* Answer Choices */}
                    <div className="space-y-3">
                      <Label className="text-white">Answer Choices *</Label>
                      <div className="grid grid-cols-1 gap-3">
                        {(['A', 'B', 'C', 'D'] as const).map((letter) => (
                          <div key={letter} className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 bg-blue-500/20 border border-blue-500/30 rounded text-blue-300 font-bold">
                              {letter}
                            </div>
                            <Input
                              placeholder={`Choice ${letter}...`}
                              value={newQuizItem.choices[letter]}
                              onChange={(e) => setNewQuizItem(prev => ({ 
                                ...prev, 
                                choices: { ...prev.choices, [letter]: e.target.value }
                              }))}
                              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 flex-1"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Correct Answer */}
                    <div className="space-y-2">
                      <Label className="text-white">Correct Answer *</Label>
                      <Select 
                        value={newQuizItem.answer} 
                        onValueChange={(value: 'A' | 'B' | 'C' | 'D') => 
                          setNewQuizItem(prev => ({ ...prev, answer: value }))
                        }
                      >
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A">A: {newQuizItem.choices.A || 'Choice A'}</SelectItem>
                          <SelectItem value="B">B: {newQuizItem.choices.B || 'Choice B'}</SelectItem>
                          <SelectItem value="C">C: {newQuizItem.choices.C || 'Choice C'}</SelectItem>
                          <SelectItem value="D">D: {newQuizItem.choices.D || 'Choice D'}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Wait Time */}
                    <div className="space-y-2">
                      <Label className="text-white">Wait Time (seconds)</Label>
                      <Select 
                        value={newQuizItem.wait_time.toString()} 
                        onValueChange={(value) => 
                          setNewQuizItem(prev => ({ ...prev, wait_time: parseInt(value) }))
                        }
                      >
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3 seconds</SelectItem>
                          <SelectItem value="5">5 seconds</SelectItem>
                          <SelectItem value="7">7 seconds</SelectItem>
                          <SelectItem value="10">10 seconds</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                ) : (
                  /* Text Content */
                  <div className="space-y-2">
                    <Label className="text-white">Text Content *</Label>
                    <Textarea
                      placeholder="Enter your text content..."
                      value={newQuizItem.content}
                      onChange={(e) => setNewQuizItem(prev => ({ 
                        ...prev, 
                        content: e.target.value 
                      }))}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 resize-none"
                      rows={4}
                    />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="ghost"
                    onClick={cancelEditingQuizItem}
                    className="flex-1 text-gray-400 hover:text-white"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={saveQuizItem}
                    disabled={
                      newQuizItem.type === 'question' 
                        ? (!newQuizItem.question_text.trim() || 
                           !newQuizItem.choices.A.trim() || 
                           !newQuizItem.choices.B.trim() || 
                           !newQuizItem.choices.C.trim() || 
                           !newQuizItem.choices.D.trim())
                        : !newQuizItem.content.trim()
                    }
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    {editingQuizItem ? (
                      <>
                        <Edit3 className="mr-2 h-4 w-4" />
                        Update Item
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Item
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

export default function VideoCreationPage() {
  return (
    <AuthGuard>
      <VideoCreationContent />
    </AuthGuard>
  );
}