import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Video, Sparkles, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center space-y-8 mb-16">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Image
              className="dark:invert"
              src="/next.svg"
              alt="Next.js logo"
              width={120}
              height={25}
              priority
            />
            <span className="text-2xl font-bold text-muted-foreground">×</span>
            <div className="flex items-center gap-1">
              <Smartphone className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold text-primary">Shorts</span>
            </div>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              YouTube Shorts
            </h1>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground">
              Video Generator
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Create stunning vertical videos perfect for YouTube Shorts, Instagram Reels, and TikTok with custom backgrounds and text
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button asChild size="lg" className="text-lg px-8 py-6">
              <Link href="/dashboard">
                <Video className="mr-2 h-5 w-5" />
                Start Creating
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            
            <Button variant="outline" size="lg" asChild className="text-lg px-8 py-6">
              <Link 
                href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
                target="_blank"
                rel="noopener noreferrer"
              >
                Read Documentation
              </Link>
            </Button>
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="secondary">Free to Use</Badge>
            <Badge variant="secondary">No Sign-up Required</Badge>
            <Badge variant="secondary">High Quality Output</Badge>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <Card className="text-center">
            <CardHeader>
              <Smartphone className="h-12 w-12 mx-auto text-primary mb-4" />
              <CardTitle>Perfect Mobile Format</CardTitle>
              <CardDescription>
                9:16 vertical aspect ratio optimized for all mobile platforms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Your videos will look perfect on YouTube Shorts, Instagram Reels, TikTok, and other mobile-first platforms.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Video className="h-12 w-12 mx-auto text-purple-600 mb-4" />
              <CardTitle>Custom Backgrounds</CardTitle>
              <CardDescription>
                Upload your own videos or choose from beautiful presets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Make your content unique with custom background videos that automatically scale to fit the vertical format.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Sparkles className="h-12 w-12 mx-auto text-orange-600 mb-4" />
              <CardTitle>Smart Text Layout</CardTitle>
              <CardDescription>
                Automatic text wrapping and positioning for vertical videos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Your text will always look perfect with automatic sizing, wrapping, and shadow effects for maximum readability.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Specifications */}
        <Card className="bg-gradient-to-r from-primary/5 to-purple-600/5 border-primary/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Video Specifications</CardTitle>
            <CardDescription>
              Professional quality output for all platforms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div className="space-y-2">
                <div className="text-2xl font-bold text-primary">1080×1920</div>
                <Badge variant="outline">Full HD Vertical</Badge>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-green-600">30 FPS</div>
                <Badge variant="outline">Smooth Playback</Badge>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-purple-600">5 Seconds</div>
                <Badge variant="outline">Perfect Length</Badge>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-orange-600">WebM</div>
                <Badge variant="outline">High Quality</Badge>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-blue-600">6 Mbps</div>
                <Badge variant="outline">Fast Upload</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-border">
          <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
            <Link 
              href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-foreground transition-colors"
            >
              <Image
                aria-hidden
                src="/file.svg"
                alt="File icon"
                width={16}
                height={16}
              />
              Learn Next.js
            </Link>
            <Link
              href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-foreground transition-colors"
            >
              <Image
                aria-hidden
                src="/window.svg"
                alt="Window icon"
                width={16}
                height={16}
              />
              Deploy Examples
            </Link>
            <Link
              href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-foreground transition-colors"
            >
              <Image
                aria-hidden
                src="/globe.svg"
                alt="Globe icon"
                width={16}
                height={16}
              />
              Visit Next.js
            </Link>
          </div>
          
          <div className="text-center mt-8 text-sm text-muted-foreground">
            <p>Built with Next.js, Tailwind CSS, and shadcn/ui</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
