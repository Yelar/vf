'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { NavigationHeader } from '@/components/ui/navigation-header';
import { ModernCard, ModernCardContent } from '@/components/ui/modern-card';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Video, 
  Play, 
  Globe,
  Plus,
  Copy,
  Check,
  Sparkles,
  ChevronRight,
  Calendar,
  Download
} from "lucide-react";
import Link from 'next/link';

interface DashboardStats {
  totalVideos: number;
  totalViews: number;
  sharedVideos: number;
  totalDuration: number;
  recentVideos: Array<{
    id: string;
    title: string;
    created_at: string;
    is_shared: boolean;
    duration?: number;
    url: string;
  }>;
}

function DashboardContent() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedVideoId, setCopiedVideoId] = useState<string | null>(null);

  // Debug session in production
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      console.log('Dashboard - Session Status:', status);
      console.log('Dashboard - Session Data:', session);
    }
  }, [session, status]);

  // Copy video URL to clipboard - optimized with useCallback
  const copyVideoUrl = useCallback(async (url: string, videoId: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedVideoId(videoId);
      setTimeout(() => setCopiedVideoId(null), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  }, []);

  // Fetch dashboard statistics - optimized with useCallback
  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard-stats', {
        // Add cache headers for better performance
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      if (response.ok) {
      const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user) {
      fetchStats();
    }
  }, [session, fetchStats]);

  // Memoized utility functions for performance
  const formatDuration = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const formatDateFull = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  // Memoize recent videos for performance
  const recentVideos = useMemo(() => {
    return stats?.recentVideos?.slice(0, 6) || [];
  }, [stats?.recentVideos]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-purple-950/50">
      <NavigationHeader />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Welcome Section */}
        <div className="flex flex-col items-center justify-center text-center space-y-6 py-20 min-h-[50vh] w-full">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-purple-300 font-medium">Welcome to VFS Studio</span>
          </div>
          
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold w-full">
            <span className="text-white">Hello, </span>
            <span className="bg-gradient-to-r from-purple-400 via-purple-300 to-blue-400 bg-clip-text text-transparent">
              {session?.user?.name?.split(' ')[0] || 'Creator'}!
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-400 max-w-4xl mx-auto leading-relaxed">
            Ready to create amazing content? Let&apos;s turn your ideas into engaging posts and videos with AI.
          </p>

          {/* Main Call to Action */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Link href="/video/new">
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 h-14 px-8 text-lg">
                <Video className="w-5 h-5 mr-2" />
                Create Video
              </Button>
            </Link>
            <Link href="/posts/create">
              <Button size="lg" variant="outline" className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10 h-14 px-8 text-lg">
                <Plus className="w-5 h-5 mr-2" />
                Generate Post
              </Button>
            </Link>
          </div>
        </div>

        {/* Recent Videos */}
        <div className="space-y-6">
                        <div className="flex items-center justify-between">
                  <div>
              <h2 className="text-2xl font-bold text-white mb-1">Recent Videos</h2>
              <p className="text-gray-400">Your latest AI-generated content</p>
                    </div>
            <Link href="/library">
              <Button variant="outline" className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10">
                View All
                <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
            </Link>
                </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-9 h-9 border-t-2 border-purple-500 rounded-full animate-spin" />
            </div>
          ) : recentVideos.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentVideos.map((video) => (
                <ModernCard key={video.id} hover glow className="group">
                  <ModernCardContent className="p-0">
                    {/* Video Thumbnail Placeholder */}
                    <Link href={`/watch/${video.id}`}>
                      <div className="aspect-video bg-gradient-to-br from-purple-900/50 to-blue-900/50 rounded-t-lg flex items-center justify-center relative overflow-hidden cursor-pointer">
                        <Play className="w-12 h-12 text-white/70 group-hover:scale-110 transition-transform" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      
                      {/* Video Duration */}
                      {video.duration && (
                        <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 rounded text-xs text-white font-medium">
                          {formatDuration(video.duration)}
                  </div>
                )}

                      {/* Shared Badge */}
                      {video.is_shared === true && (
                        <div className="absolute top-2 left-2">
                          <Badge className="bg-green-500/80 text-white border-0">
                            <Globe className="w-3 h-3 mr-1" />
                            Shared
                      </Badge>
                  </div>
                )}
                  </div>
                    </Link>
                    
                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="font-semibold text-white line-clamp-2 group-hover:text-purple-300 transition-colors">
                          {video.title}
                        </h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <Calendar className="w-3 h-3 text-gray-500" />
                          <span className="text-xs text-gray-500">
                            {formatDateFull(video.created_at)}
                      </span>
                    </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex space-x-2">
                          <Link href={`/watch/${video.id}`}>
                            <Button size="sm" variant="outline" className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10">
                              <Play className="w-3 h-3 mr-1" />
                              Watch
                </Button>
                          </Link>
                          
                  <Button
                            size="sm"
                    variant="ghost"
                          onClick={() => copyVideoUrl(video.url, video.id)}
                            className="text-gray-400 hover:text-white"
                  >
                            {copiedVideoId === video.id ? (
                              <Check className="w-3 h-3" />
                    ) : (
                              <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>

                        <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white">
                          <Download className="w-3 h-3" />
                        </Button>
              </div>
      </div>
                  </ModernCardContent>
                </ModernCard>
                        ))}
              </div>
          ) : (
            <ModernCard className="text-center py-12">
              <ModernCardContent>
                <Video className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Videos Yet</h3>
                <p className="text-gray-400 mb-6">Create your first AI-powered video to get started!</p>
              <Link href="/video/new">
                <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                    Create First Video
                  </Button>
              </Link>
              </ModernCardContent>
            </ModernCard>
        )}
              </div>
      </main>
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