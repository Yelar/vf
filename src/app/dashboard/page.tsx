'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Video, 
  Play, 
  LogOut, 
  User, 
  Film, 
  Clock,
  TrendingUp,
  Globe,
  Plus,
  Library,
  Share2,
  Copy,
  Check
} from "lucide-react";
import Link from 'next/link';

interface DashboardStats {
  totalVideos: number;
  totalViews: number;
  sharedVideos: number;
  totalDuration: number;
  recentVideos: Array<{
    id: number;
    title: string;
    created_at: string;
    is_shared: number;
    duration?: number;
    url: string;
  }>;
}

function DashboardContent() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedVideoId, setCopiedVideoId] = useState<number | null>(null);

  // Copy video URL to clipboard
  const copyVideoUrl = async (url: string, videoId: number) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedVideoId(videoId);
      setTimeout(() => setCopiedVideoId(null), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  // Fetch dashboard statistics
  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard-stats');
      
      if (response.ok) {
      const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchStats();
    }
  }, [session]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900">
        {/* Header */}
      <header className="border-b border-gray-800 bg-black/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <Film className="w-5 h-5 text-white" />
          </div>
                <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                    VFS Studio
                </span>
        </div>
              </div>
            
            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link 
                href="/library" 
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
              >
                <Library className="w-4 h-4" />
                <span>Library</span>
                </Link>
              <Link 
                href="/shared" 
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
              >
                <Globe className="w-4 h-4" />
                <span>Shared</span>
                </Link>
            </nav>

            {/* User menu */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <User className="w-4 h-4" />
                <span>{session?.user?.name || session?.user?.email}</span>
                </div>
                <Button
                variant="ghost"
                  size="sm"
                  onClick={() => signOut()}
                className="text-gray-300 hover:text-white"
                >
                <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome back, {session?.user?.name?.split(' ')[0] || 'Creator'}! 🎬
          </h1>
          <p className="text-xl text-gray-300">
            Ready to create your next viral video?
          </p>
                    </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link href="/video/new">
            <Card className="bg-gradient-to-br from-purple-600 to-blue-600 border-none hover:scale-105 transition-transform cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white/20 rounded-full">
                    <Plus className="w-6 h-6 text-white" />
                    </div>
                    <div>
                    <h3 className="text-lg font-semibold text-white">Create New Video</h3>
                    <p className="text-purple-100">Start with AI-powered content</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
          </Link>

          <Link href="/library">
            <Card className="bg-gradient-to-br from-green-600 to-teal-600 border-none hover:scale-105 transition-transform cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white/20 rounded-full">
                    <Library className="w-6 h-6 text-white" />
                    </div>
                    <div>
                    <h3 className="text-lg font-semibold text-white">My Library</h3>
                    <p className="text-green-100">Manage your videos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
          </Link>

          <Link href="/shared">
            <Card className="bg-gradient-to-br from-orange-600 to-red-600 border-none hover:scale-105 transition-transform cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white/20 rounded-full">
                    <Globe className="w-6 h-6 text-white" />
                    </div>
                    <div>
                    <h3 className="text-lg font-semibold text-white">Shared Videos</h3>
                    <p className="text-orange-100">Community content</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
          </Link>
            </div>

        {/* Statistics Grid */}
        {!loading && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-black/30 border-gray-700">
              <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Videos</p>
                    <p className="text-2xl font-bold text-white">{stats.totalVideos}</p>
                        </div>
                  <Video className="w-8 h-8 text-purple-400" />
                        </div>
              </CardContent>
            </Card>

            <Card className="bg-black/30 border-gray-700">
              <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Shared Videos</p>
                    <p className="text-2xl font-bold text-white">{stats.sharedVideos}</p>
                </div>
                  <Share2 className="w-8 h-8 text-blue-400" />
                  </div>
              </CardContent>
            </Card>

            <Card className="bg-black/30 border-gray-700">
              <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Duration</p>
                    <p className="text-2xl font-bold text-white">{formatDuration(stats.totalDuration)}</p>
                    </div>
                  <Clock className="w-8 h-8 text-green-400" />
                  </div>
              </CardContent>
            </Card>

            <Card className="bg-black/30 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">This Month</p>
                    <p className="text-2xl font-bold text-white">
                      {stats.recentVideos.filter(v => {
                        const videoDate = new Date(v.created_at);
                        const now = new Date();
                        return videoDate.getMonth() === now.getMonth() && 
                               videoDate.getFullYear() === now.getFullYear();
                      }).length}
                  </p>
                </div>
                  <TrendingUp className="w-8 h-8 text-orange-400" />
                    </div>
              </CardContent>
            </Card>
                    </div>
                  )}

        {/* Recent Videos */}
        {!loading && stats && stats.recentVideos.length > 0 && (
          <Card className="bg-black/30 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>Recent Videos</span>
                </CardTitle>
              <CardDescription>Your latest creations</CardDescription>
              </CardHeader>
            <CardContent>
                <div className="space-y-3">
                {stats.recentVideos.slice(0, 5).map((video) => (
                  <div 
                    key={video.id} 
                    className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                        <Play className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{video.title}</p>
                        <p className="text-sm text-gray-400">
                          {formatDate(video.created_at)}
                          {video.duration && ` • ${formatDuration(video.duration)}`}
                          {video.is_shared === 1 && (
                            <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded">
                              Shared
                      </span>
                          )}
                        </p>
                    </div>
                      </div>
                    <div className="flex items-center space-x-2">
                      {video.url && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => copyVideoUrl(video.url, video.id)}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          {copiedVideoId === video.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      )}
                      <Link href={`/video/${video.id}`}>
                        <Button variant="ghost" size="sm" className="text-purple-400 hover:text-purple-300">
                          <Film className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                          </div>
                        ))}
                      </div>
              
              {stats.recentVideos.length > 5 && (
                <div className="mt-4 text-center">
                  <Link href="/library">
                    <Button variant="outline" className="text-purple-400 border-purple-400 hover:bg-purple-400 hover:text-white">
                      View All Videos
                </Button>
                  </Link>
                </div>
              )}
              </CardContent>
            </Card>
        )}

        {/* Empty State */}
        {!loading && stats && stats.totalVideos === 0 && (
          <Card className="bg-black/30 border-gray-700">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Video className="w-8 h-8 text-white" />
                </div>
              <h3 className="text-xl font-semibold text-white mb-2">No videos yet</h3>
              <p className="text-gray-400 mb-6">
                Create your first AI-powered video to get started!
              </p>
              <Link href="/video/new">
                <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Video
                  </Button>
              </Link>
              </CardContent>
            </Card>
        )}
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