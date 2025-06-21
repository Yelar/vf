import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Zap, 
  Brain, 
  Mic, 
  Film, 
  ArrowRight, 
  Sparkles, 
  VideoIcon,
  Bot,
  Wand2
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(120,119,198,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(120,119,198,0.1),transparent_50%)]"></div>
      </div>

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="border-b border-white/10 backdrop-blur-xl bg-black/30">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <VideoIcon className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  VFS
                </span>
              </div>
              <Button asChild variant="outline" className="border-purple-500/30 hover:bg-purple-500/10">
                <Link href="/auth/signin">
                  Launch App
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="container mx-auto px-6 py-20">
          <div className="text-center space-y-8 max-w-4xl mx-auto">
            <div className="space-y-4">
              <Badge className="bg-purple-500/10 text-purple-300 border-purple-500/30 px-4 py-2">
                <Bot className="w-4 h-4 mr-2" />
                AI-Powered Video Generation
              </Badge>
              
              <h1 className="text-6xl md:text-8xl font-black bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent leading-tight">
                Create Viral
                <br />
                <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  AI Videos
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Generate stunning YouTube Shorts, TikToks, and Instagram Reels with AI-powered content, 
                voice synthesis, and precise timing in seconds.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-8">
              <Button 
                asChild 
                size="lg" 
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-6 text-lg font-semibold shadow-lg shadow-purple-500/25"
              >
                <Link href="/auth/signin">
                  <Play className="mr-2 h-5 w-5" />
                  Start Creating
                  <Sparkles className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              
              <Button 
                variant="outline" 
                size="lg" 
                className="border-white/20 text-white hover:bg-white/10 px-8 py-6 text-lg backdrop-blur-sm"
              >
                <Film className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </div>

            <div className="flex flex-wrap justify-center gap-3 pt-4">
              <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
                ⚡ Lightning Fast
              </Badge>
              <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
                🧠 AI Content
              </Badge>
              <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
                🎤 Voice Synthesis
              </Badge>
              <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
                📱 Mobile Ready
              </Badge>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="container mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              AI-Powered Features
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Everything you need to create viral content with artificial intelligence
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 group">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-white text-xl">AI Content Generation</CardTitle>
                <CardDescription className="text-gray-400">
                  GROQ-powered educational content creation for any topic
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm">
                  Generate engaging, educational content optimized for short-form videos with adjustable difficulty and length.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 group">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Mic className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-white text-xl">Voice Synthesis</CardTitle>
                <CardDescription className="text-gray-400">
                  Premium AI voices with Eleven Labs integration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm">
                  Choose from professional AI voices with precise timing and segmented audio for perfect synchronization.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 group">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-white text-xl">Precise Timing</CardTitle>
                <CardDescription className="text-gray-400">
                  Word-by-word subtitle synchronization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm">
                  Advanced timing algorithms ensure every word appears exactly when spoken for professional results.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 group">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <VideoIcon className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-white text-xl">Custom Backgrounds</CardTitle>
                <CardDescription className="text-gray-400">
                  Dynamic video backgrounds or upload your own
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm">
                  Choose from preset videos or upload custom backgrounds that automatically scale for vertical format.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 group">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-violet-500 to-purple-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Wand2 className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-white text-xl">Dual Rendering</CardTitle>
                <CardDescription className="text-gray-400">
                  Canvas and Remotion rendering options
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm">
                  Choose between real-time canvas rendering or high-quality Remotion server-side processing.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 group">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Film className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-white text-xl">Mobile Optimized</CardTitle>
                <CardDescription className="text-gray-400">
                  Perfect 9:16 format for all platforms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm">
                  1080×1920 resolution optimized for YouTube Shorts, TikTok, Instagram Reels, and all mobile platforms.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Tech Specs */}
        <section className="container mx-auto px-6 py-20">
          <Card className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-purple-500/30 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-white mb-2">
                Technical Specifications
              </CardTitle>
              <CardDescription className="text-gray-300 text-lg">
                Professional-grade output for viral content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                <div className="space-y-3">
                  <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                    1080×1920
                  </div>
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                    Vertical HD
                  </Badge>
                </div>
                <div className="space-y-3">
                  <div className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                    60 FPS
                  </div>
                  <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                    Ultra Smooth
                  </Badge>
                </div>
                <div className="space-y-3">
                  <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    MP4
                  </div>
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                    Universal Format
                  </Badge>
                </div>
                <div className="space-y-3">
                  <div className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                    HQ Audio
                  </div>
                  <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">
                    320k Bitrate
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-6 py-20 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Ready to Go Viral?
            </h2>
            <p className="text-xl text-gray-300">
              Join creators using AI to generate millions of views with VFS
            </p>
            <Button 
              asChild 
              size="lg" 
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-12 py-6 text-xl font-semibold shadow-xl shadow-purple-500/25"
            >
              <Link href="/auth/signin">
                <Play className="mr-3 h-6 w-6" />
                Start Creating Now
                <ArrowRight className="ml-3 h-6 w-6" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 bg-black/50 backdrop-blur-xl">
          <div className="container mx-auto px-6 py-8">
            <div className="text-center text-gray-400">
              <p>&copy; 2024 VFS. Powered by AI. Built for creators.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
