'use client';

import { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { NavigationHeader } from '@/components/ui/navigation-header';
import { Copy, Code, Sparkles, Palette, Camera, Wand2 } from 'lucide-react';
import html2canvas from 'html2canvas-pro';
import JSZip from 'jszip';
import { LimitWarning } from '@/components/ui/limit-warning';
import { ModernCard, ModernCardContent } from '@/components/ui/modern-card';
import { SpeechToText } from '@/components/SpeechToText';
import { motion } from 'framer-motion';

interface PostVariant {
  id: string;
  type: 'single' | 'carousel';
  title: string;
  description: string;
  jsx: string;
  slides?: string[];
  metadata: {
    hashtags: string[];
    caption: string;
    engagement_tips: string[];
  };
  imageUrl?: string;
}

interface GenerationResult {
  success: boolean;
  reasoning: string;
  variants: PostVariant[];
  timestamp: string;
  debug_info?: {
    request_id: string;
    prompt_hash: string;
    variants_count: number;
  };
}

interface JSXPreviewRef {
  takeScreenshotAndGetBlob: () => Promise<Blob | null>;
}

const GenerationProgress = ({ step }: { step: string }) => {
  const steps = [
    { id: 'preparing', label: 'Preparing Content' },
    { id: 'generating', label: 'Generating Post' },
    { id: 'designing', label: 'Designing Layout' },
    { id: 'finalizing', label: 'Finalizing' }
  ];

  const currentIndex = steps.findIndex(s => s.id === step);

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="relative">
        {/* Progress Bar */}
        <div className="absolute top-5 left-0 w-full h-0.5 bg-white/10">
          <motion.div 
            className="absolute top-0 left-0 h-full bg-purple-500"
            initial={{ width: "0%" }}
            animate={{ width: `${((currentIndex + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Steps */}
        <div className="relative flex justify-between">
          {steps.map((s, i) => {
            const isActive = i <= currentIndex;
            return (
              <div key={s.id} className="flex flex-col items-center">
                <motion.div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isActive ? 'bg-purple-500' : 'bg-white/10'
                  }`}
                  initial={false}
                  animate={{
                    scale: isActive ? [1, 1.1, 1] : 1,
                    transition: { duration: 0.5 }
                  }}
                >
                  <Wand2 className={`w-5 h-5 ${isActive ? 'text-white' : 'text-white/40'}`} />
                </motion.div>
                <span className={`mt-2 text-sm ${isActive ? 'text-white' : 'text-white/40'}`}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const JSXPreview = forwardRef<JSXPreviewRef, {
  jsx: string;
  className?: string;
  imageUrl?: string;
}>(({ jsx, className = "", imageUrl = undefined }, ref) => {
  const [copied, setCopied] = useState(false);
  const [isScreenshotting, setIsScreenshotting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    takeScreenshotAndGetBlob: async () => {
      if (!containerRef.current) return null;
      
      try {
        const canvas = await html2canvas(containerRef.current, {
          backgroundColor: null,
          scale: 2,
          logging: false,
          useCORS: true,
          allowTaint: true,
          width: 400,
          height: 400,
          windowWidth: 400,
          windowHeight: 400
        });

        return new Promise((resolve) => {
          canvas.toBlob((blob) => {
            resolve(blob);
          }, 'image/png');
        });
      } catch (error) {
        console.error('Failed to take screenshot:', error);
        return null;
      }
    }
  }));

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(jsx);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const takeScreenshot = async () => {
    if (!containerRef.current) return;
    
    setIsScreenshotting(true);
    try {
      console.log('📸 Taking screenshot of JSX preview...');
      
      const canvas = await html2canvas(containerRef.current, {
        backgroundColor: null,
        scale: 2, // Higher quality
        logging: false,
        useCORS: true,
        allowTaint: true,
        width: 400,
        height: 400,
        windowWidth: 400,
        windowHeight: 400
      });

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `instagram-post-${Date.now()}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          console.log('✅ Screenshot saved successfully');
        }
      }, 'image/png');
      
    } catch (error) {
      console.error('❌ Failed to take screenshot:', error);
      alert('Failed to take screenshot. Please try again.');
    } finally {
      setIsScreenshotting(false);
    }
  };

  // Extract content from JSX for preview - IMPROVED to show actual AI content
  const extractContentFromJSX = (jsxString: string) => {
    try {
      console.log('🔍 Parsing JSX for preview:', jsxString.substring(0, 200) + '...');
      
      // Extract all text content between JSX tags with better regex
      const textMatches = jsxString.match(/>([^<]+)</g);
      const texts = textMatches?.map(match => 
        match.slice(1, -1)
          .trim()
          .replace(/\s+/g, ' ')
          .replace(/^\$\{.*?\}$/, '') // Remove template literals
      ).filter(text => text.length > 0 && !text.match(/^className|^style|^\s*$/)) || [];
      
      console.log('📝 Extracted texts:', texts);
      
             // Extract background gradient from JSX
       const gradientMatch = jsxString.match(/bg-gradient-to-[\w-]+\s+from-[\w-]+-\d+(?:\s+via-[\w-]+-\d+)?\s+to-[\w-]+-\d+/);
       const backgroundClass = gradientMatch?.[0] || 'bg-gradient-to-br from-purple-600 to-pink-600';
      
      // Extract font weight
      const fontWeightMatch = jsxString.match(/font-(bold|extrabold|black)/);
      const fontWeight = fontWeightMatch?.[1] || 'bold';
      
      // Extract text sizes
      const titleSizeMatch = jsxString.match(/text-(\d+xl)/);
      const titleSize = titleSizeMatch?.[1] || '6xl';
      
             // Separate title and content properly to avoid duplication
       const sortedTexts = texts
         .filter(text => text.length > 3)
         .sort((a, b) => b.length - a.length);
       
       let titleText = '';
       let mainContent = '';
       
       if (sortedTexts.length >= 2) {
         // If we have multiple texts, use the shorter one as title and longer as content
         const [longest, second] = sortedTexts;
         if (second.length < 50 && longest.length > second.length * 1.5) {
           titleText = second;
           mainContent = longest;
         } else {
           mainContent = longest;
           titleText = longest.substring(0, 50);
         }
       } else if (sortedTexts.length === 1) {
         // If only one text, check if it's a numbered list or long content
         const text = sortedTexts[0];
         if (text.includes('\n') || text.includes('1.') || text.includes('•')) {
           // It's a list or multi-line content
           const lines = text.split(/\n|(?=\d+\.)/);
           if (lines.length > 1 && lines[0].length < 50) {
             titleText = lines[0].trim();
             mainContent = lines.slice(1).join('\n').trim();
           } else {
             mainContent = text;
           }
         } else {
           mainContent = text;
         }
       } else {
         mainContent = 'AI Generated Content';
       }
      
      console.log('🎨 Preview config:', {
        backgroundClass,
        fontWeight,
        titleSize,
        mainContent: mainContent.substring(0, 50) + '...',
        titleText: titleText.substring(0, 30) + '...'
      });
      
      return {
        title: titleText,
        content: mainContent,
        emoji: '✨', // Keep simple for now
        backgroundClass,
        titleSize,
        fontWeight
      };
    } catch (error) {
      console.error('❌ Failed to parse JSX:', error);
      return {
        title: 'Preview Error',
        content: 'Unable to parse generated content', 
        emoji: '⚠️',
        backgroundClass: 'bg-gradient-to-br from-red-600 to-orange-600',
        titleSize: '6xl',
        fontWeight: 'bold'
      };
    }
  };

  const content = extractContentFromJSX(jsx);

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Isolated Preview */}
      <div className="relative bg-gray-900 rounded-xl overflow-hidden border border-gray-700">
        <div className="bg-gray-800 px-3 py-1.5 flex items-center justify-between border-b border-gray-700">
          <div className="flex items-center gap-1.5">
            <div className="flex gap-1">
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div>
              <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full"></div>
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
            </div>
            <span className="text-gray-400 text-xs ml-2">Instagram Post Preview</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={takeScreenshot}
              disabled={isScreenshotting}
              className="text-gray-400 hover:text-white h-6 px-2"
              title="Download as PNG"
            >
              {isScreenshotting ? (
                <div className="w-3 h-3 border border-gray-400 border-t-white rounded-full animate-spin" />
              ) : (
                <Camera className="w-3 h-3" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyToClipboard}
              className="text-gray-400 hover:text-white h-6 px-2"
            >
              {copied ? '✓ Copied' : <Copy className="w-3 h-3" />}
            </Button>
          </div>
        </div>
        
        {/* Preview Container with Comfortable Size */}
        <div className="bg-gray-100 p-4">
          <div className="relative flex items-center justify-center">
            {/* Instagram Post Container */}
            <div 
              className="border-2 border-white rounded-xl shadow-xl overflow-hidden bg-white"
              style={{ width: '400px', height: '400px' }}
            >
              <div 
                ref={containerRef}
                className="w-full h-full relative"
                style={{
                  width: '400px',
                  height: '400px',
                  overflow: 'hidden',
                  isolation: 'isolate',
                  contain: 'layout style'
                }}
              >
                {/* Actual Instagram Post Content */}
                <div className={`w-full h-full ${content.backgroundClass} flex flex-col items-center justify-center p-8 relative overflow-hidden`}>
                  {/* Background image if available */}
                  {imageUrl && (
                    <div 
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ 
                        backgroundImage: `url(${imageUrl})`,
                        filter: 'brightness(0.6)'
                      }}
                    />
                  )}
                  
                  {/* Background overlay */}
                  <div className="absolute inset-0 bg-black/40"></div>
                  
                  {/* Main content */}
                  <div className="relative z-10 flex flex-col items-center justify-center text-center px-8 py-6">
                    {/* Title (only if different from content) */}
                    {content.title && content.title !== content.content && content.title.length < 50 && (
                      <h1 
                        className={`text-3xl font-${content.fontWeight || 'bold'} mb-4 leading-tight text-white max-w-[320px]`}
                        style={{ 
                          lineHeight: 1.2,
                          fontWeight: content.fontWeight === 'extrabold' ? 800 : content.fontWeight === 'black' ? 900 : 700,
                          textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
                        }}
                      >
                        {content.title}
                      </h1>
                    )}
                    
                    {/* Main Content */}
                    <div 
                      className={`text-lg font-${content.fontWeight || 'bold'} text-white leading-relaxed max-w-[320px] whitespace-pre-line`}
                      style={{ 
                        fontSize: content.title && content.title !== content.content ? '1rem' : '1.5rem', 
                        lineHeight: 1.4,
                        fontWeight: content.fontWeight === 'extrabold' ? 700 : content.fontWeight === 'black' ? 800 : 600,
                        textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
                      }}
                    >
                      {content.content}
                    </div>
                    
                    {/* Bottom accent */}
                    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-white/50 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* JSX Code Display */}
      <div className="relative">
        <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
          <div className="bg-gray-800 px-3 py-1.5 flex items-center justify-between border-b border-gray-700">
            <div className="flex items-center gap-1.5">
              <Code className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-gray-300 text-xs">Generated JSX Component</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyToClipboard}
              className="text-gray-400 hover:text-white h-6 px-2"
            >
              {copied ? '✓ Copied!' : 'Copy Code'}
            </Button>
          </div>
          <div className="p-3 max-h-48 overflow-y-auto">
            <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
              <code>{jsx}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
});

// Add display name
JSXPreview.displayName = 'JSXPreview';

// Carousel Preview
const CarouselPreview = ({ slides, currentSlide = 0, className = "", imageUrl = undefined }: { 
  slides: string[]; 
  currentSlide?: number; 
  className?: string;
  imageUrl?: string;
}) => {
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const previewRef = useRef<JSXPreviewRef>(null);

  const downloadAllSlides = async () => {
    if (!slides || slides.length === 0) return;
    
    setIsDownloadingAll(true);
    setDownloadProgress(0);

    try {
      // Create a zip file
      const zip = new JSZip();
      
      // Download each slide sequentially
      for (let i = 0; i < slides.length; i++) {
        if (previewRef.current) {
          const blob = await previewRef.current.takeScreenshotAndGetBlob();
          if (blob) {
            zip.file(`slide-${i + 1}.png`, blob);
          }
        }
        setDownloadProgress(((i + 1) / slides.length) * 100);
      }

      // Generate and download zip file
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `instagram-carousel-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Failed to download all slides:', error);
      alert('Failed to download all slides. Please try again.');
    } finally {
      setIsDownloadingAll(false);
      setDownloadProgress(0);
    }
  };

  if (!slides || slides.length === 0) return null;
  
  const jsx = slides[currentSlide] || slides[0];
  return (
    <div className="space-y-4">
      {slides.length > 1 && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={downloadAllSlides}
            disabled={isDownloadingAll}
            className="text-gray-400 hover:text-white border-gray-700 hover:border-purple-500"
          >
            {isDownloadingAll ? (
              <>
                <div className="w-3 h-3 border border-gray-400 border-t-white rounded-full animate-spin mr-2" />
                Downloading {Math.round(downloadProgress)}%
              </>
            ) : (
              <>
                <Camera className="w-3 h-3 mr-1" />
                Download All Slides
              </>
            )}
          </Button>
        </div>
      )}
      <JSXPreview 
        ref={previewRef}
        jsx={jsx} 
        className={className} 
        imageUrl={imageUrl} 
      />
    </div>
  );
};

const EXAMPLE_PROMPTS = [
  "Create a motivational post about overcoming challenges with bold typography",
  "Design a minimalist tips post about productivity with clean layout", 
  "Make an inspirational quote about success with modern gradients",
  "Create educational content about AI with tech-style design",
  "Design a post about healthy habits with organic shapes",
  "Make a post about entrepreneurship with professional styling"
];

export default function CreatePost() {
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [useAiImage, setUseAiImage] = useState(false);
  const [showLimitWarning, setShowLimitWarning] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerationStep('preparing');
    
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      setIsGenerating(false);
      setGenerationStep('');
      return;
    }

    setError(null);
    setResult(null);
    setSelectedVariant(null);
    setCurrentSlide(0);

    try {
      const requestId = Date.now().toString();
      console.log(`🚀 Starting generation request ${requestId} for prompt:`, prompt);
      
      // Simulate progress steps
      await new Promise(resolve => setTimeout(resolve, 1000));
      setGenerationStep('generating');
      
      // First generate the post content
      const response = await fetch('/api/posts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': requestId,
        },
        body: JSON.stringify({ 
          prompt: prompt.trim(),
          requestId 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      
      // If AI images are enabled, generate images for each variant
      if (useAiImage) {
        const imagePromises = data.variants.map(async (variant: PostVariant) => {
          try {
            const imageResponse = await fetch('/api/generate-images', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                segments: [{ text: variant.title }],
                promptData: [{
                  prompt: `Create a high-quality, professional image for an Instagram post about: ${variant.title}. Style: modern, clean, visually striking. Make it suitable for social media.`
                }]
              }),
            });

            if (imageResponse.ok) {
              const imageData = await imageResponse.json();
              if (imageData.success && imageData.images?.[0]?.imageUrl) {
                variant.imageUrl = imageData.images[0].imageUrl;
              }
            }
          } catch (error) {
            console.error('Failed to generate image:', error);
          }
          return variant;
        });

        data.variants = await Promise.all(imagePromises);
      }
      
      console.log('🔍 Received generation result:', {
        timestamp: data.timestamp,
        debug_info: data.debug_info,
        variants_count: data.variants?.length,
        prompt_used: prompt
      });
      
      if (!data.success) {
        throw new Error(data.error || 'Generation failed');
      }

      await new Promise(resolve => setTimeout(resolve, 500));
      setGenerationStep('finalizing');
      
      setResult(data);
      
      // Auto-select first variant
      if (data.variants && data.variants.length > 0) {
        setSelectedVariant(data.variants[0].id);
      }

    } catch (error) {
      console.error('Generation error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  const handleSpeechToText = (text: string, shouldAppend: boolean) => {
    if (shouldAppend) {
      setPrompt(prev => prev + ' ' + text);
    } else {
      setPrompt(text);
    }
  };

  const selectedVariantData = result?.variants.find(v => v.id === selectedVariant);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-purple-950/50">
        <NavigationHeader />

        <LimitWarning 
          show={showLimitWarning}
          onClose={() => setShowLimitWarning(false)}
          message="You've reached your monthly post generation limit"
        />

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8 space-y-8">
          {/* Page Header */}
          <div className="flex flex-col items-center justify-center text-center space-y-6 py-12">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-300 font-medium">AI Post Creator</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold">
              <span className="bg-gradient-to-r from-purple-400 via-purple-300 to-blue-400 bg-clip-text text-transparent">
                Create Instagram Posts
              </span>
            </h1>
            
            <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Generate stunning Instagram posts with AI. Perfect for creators, marketers, and social media managers.
            </p>
          </div>

          {/* Main Card */}
          <ModernCard gradient="purple" glow className="relative overflow-hidden">
            <ModernCardContent className="p-8">
              {/* Input Section */}
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex flex-col gap-4">
                    <div className="flex gap-4 items-center">
                      <Input
                        placeholder="e.g., Create a motivational post about overcoming challenges with bold typography..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="h-14 text-lg bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-purple-500 focus:ring-purple-500/20"
                        onKeyPress={(e) => e.key === 'Enter' && !handleGenerate() && handleGenerate()}
                      />
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-400">AI Images</label>
                        <input
                          type="checkbox"
                          checked={useAiImage}
                          onChange={(e) => setUseAiImage(e.target.checked)}
                          className="w-4 h-4 text-purple-600 bg-gray-800 border-gray-600 rounded focus:ring-purple-500"
                        />
                      </div>
                    </div>
                    <SpeechToText
                      onTranscriptionComplete={handleSpeechToText}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
                    <div className="flex flex-wrap gap-2">
                      {EXAMPLE_PROMPTS.slice(0, 3).map((example, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => setPrompt(example)}
                          className="text-xs bg-gray-800/50 border-gray-700 text-gray-300 hover:text-white hover:border-purple-500 hover:bg-purple-500/10"
                        >
                          {example.slice(0, 35)}...
                        </Button>
                      ))}
                    </div>
                    <Button 
                      onClick={handleGenerate}
                      disabled={!prompt.trim()}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 h-auto font-semibold shadow-lg"
                    >
                      Generate Posts
                    </Button>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                    <p className="text-red-400 font-medium">❌ Error: {error}</p>
                  </div>
                )}
              </div>
            </ModernCardContent>
          </ModernCard>

          {/* Results Section */}
          {result && (
            <div className="space-y-6">
              {/* AI Reasoning */}
              <ModernCard gradient="blue" glow className="relative overflow-hidden">
                <ModernCardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      🧠
                    </div>
                    <h2 className="text-xl font-bold text-white">AI Strategy & Analysis</h2>
                  </div>
                  <p className="text-gray-300 leading-relaxed">{result.reasoning}</p>
                </ModernCardContent>
              </ModernCard>

              <div className="grid lg:grid-cols-12 gap-6">
                {/* Variants Sidebar */}
                <div className="lg:col-span-3">
                  <ModernCard gradient="none" className="bg-gray-900/50 backdrop-blur sticky top-20">
                    <ModernCardContent className="p-4">
                      <div className="flex items-center gap-2 mb-4">
                        <Palette className="w-5 h-5 text-purple-400" />
                        <h3 className="text-lg font-bold text-white">Variants ({result.variants.length})</h3>
                      </div>
                      <div className="space-y-2">
                        {result.variants.map((variant) => (
                          <div
                            key={variant.id}
                            className={`p-3 rounded-lg cursor-pointer transition-all border ${
                              selectedVariant === variant.id
                                ? 'border-purple-500 bg-purple-500/10'
                                : 'border-gray-700 bg-gray-800/30 hover:border-gray-600 hover:bg-gray-800/50'
                            }`}
                            onClick={() => {
                              setSelectedVariant(variant.id);
                              setCurrentSlide(0);
                            }}
                          >
                            <div className="space-y-2">
                              <h3 className="font-semibold text-white text-sm">{variant.title}</h3>
                              <p className="text-xs text-gray-400">{variant.description}</p>
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${
                                  selectedVariant === variant.id 
                                    ? 'border-purple-400 text-purple-400' 
                                    : 'border-gray-600 text-gray-400'
                                }`}
                              >
                                {variant.type === 'carousel' ? `${variant.slides?.length || 0} slides` : 'Single Post'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ModernCardContent>
                  </ModernCard>
                </div>

                {/* Main Preview Area */}
                <div className="lg:col-span-9">
                  {selectedVariantData && (
                    <ModernCard gradient="none" className="bg-gray-900/50 backdrop-blur">
                      <ModernCardContent className="p-4">
                        <Tabs defaultValue="preview" className="w-full">
                          <TabsList className="grid grid-cols-2 w-full mb-4 bg-gray-800 border-gray-700">
                            <TabsTrigger value="preview" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                              Preview & Code
                            </TabsTrigger>
                            <TabsTrigger value="details" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                              Caption & Details
                            </TabsTrigger>
                          </TabsList>

                          <TabsContent value="preview" className="space-y-4 focus-visible:outline-none">
                            {/* Carousel Controls */}
                            {selectedVariantData.type === 'carousel' && selectedVariantData.slides && (
                              <div className="flex items-center justify-between bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
                                  disabled={currentSlide === 0}
                                  className="border-gray-600 text-gray-300 hover:text-white hover:border-purple-500"
                                >
                                  ← Previous
                                </Button>
                                <span className="text-sm font-medium text-gray-300">
                                  Slide {currentSlide + 1} of {selectedVariantData.slides.length}
                                </span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setCurrentSlide(Math.min(selectedVariantData.slides!.length - 1, currentSlide + 1))}
                                  disabled={currentSlide === selectedVariantData.slides.length - 1}
                                  className="border-gray-600 text-gray-300 hover:text-white hover:border-purple-500"
                                >
                                  Next →
                                </Button>
                              </div>
                            )}

                            {/* Preview Component */}
                            <div className="flex justify-center">
                              {selectedVariantData.type === 'carousel' && selectedVariantData.slides ? (
                                <CarouselPreview 
                                  slides={selectedVariantData.slides} 
                                  currentSlide={currentSlide}
                                  imageUrl={selectedVariantData.imageUrl}
                                />
                              ) : (
                                <JSXPreview 
                                  jsx={selectedVariantData.jsx} 
                                  imageUrl={selectedVariantData.imageUrl}
                                />
                              )}
                            </div>
                          </TabsContent>

                          <TabsContent value="details" className="space-y-4 focus-visible:outline-none">
                            {/* Caption */}
                            <div>
                              <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                                📝 Caption
                              </h3>
                              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                                <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                                  {selectedVariantData.metadata.caption}
                                </p>
                              </div>
                            </div>

                            {/* Hashtags */}
                            <div>
                              <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                                🏷️ Hashtags
                              </h3>
                              <div className="flex flex-wrap gap-2">
                                {selectedVariantData.metadata.hashtags.map((tag, index) => (
                                  <Badge key={index} variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                                    #{tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            {/* Engagement Tips */}
                            {selectedVariantData.metadata.engagement_tips.length > 0 && (
                              <>
                                <Separator className="bg-gray-700" />
                                <div>
                                  <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                                    💡 Engagement Tips
                                  </h3>
                                  <ul className="space-y-2">
                                    {selectedVariantData.metadata.engagement_tips.map((tip, index) => (
                                      <li key={index} className="flex items-start gap-2">
                                        <span className="text-green-400 mt-1">✓</span>
                                        <span className="text-gray-300">{tip}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </>
                            )}
                          </TabsContent>
                        </Tabs>
                      </ModernCardContent>
                    </ModernCard>
                  )}
                </div>
              </div>
            </div>
          )}

          {isGenerating && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="w-full max-w-lg p-8">
                <GenerationProgress step={generationStep} />
              </div>
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  );
} 