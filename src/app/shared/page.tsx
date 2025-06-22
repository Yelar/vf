'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { 
  Play, 
  Download, 
  Search, 
  Video, 
  Calendar, 
  Clock, 
  HardDrive, 
  User, 
  ArrowLeft,
  Film,
  X
} from "lucide-react";
import Link from 'next/link';

interface SharedVideo {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  uploadthing_url: string;
  uploadthing_key: string;
  file_size: number;
  duration?: number;
  thumbnail_url?: string;
  metadata: string;
  is_shared: number;
  created_at: string;
  creator_name: string;
}

export default function SharedLibraryPage() {
  const [videos, setVideos] = useState<SharedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [downloadingVideoId, setDownloadingVideoId] = useState<number | null>(null);
  const [playingVideoId, setPlayingVideoId] = useState<number | null>(null);

  // Fetch shared videos
  const fetchSharedVideos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/videos/shared');
      
      if (!response.ok) {
        throw new Error('Failed to fetch shared videos');
      }
      
      const data = await response.json();
      setVideos(data.videos || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching shared videos:', error);
      setError('Failed to load shared videos. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSharedVideos();
  }, []);

  // Filter videos based on search term
  const filteredVideos = videos.filter(video =>
    video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    video.creator_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (video.description && video.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Unknown date';
    }
  };

  // Fast download function
  const downloadVideo = async (video: SharedVideo) => {
    setDownloadingVideoId(video.id);
    
    const safeTitle = video.title.replace(/[^a-zA-Z0-9\s-_]/g, '').replace(/\s+/g, '-');
    
    // Create download link with proper attributes
    const link = document.createElement('a');
    link.href = video.uploadthing_url;
    link.download = `${safeTitle}.mp4`;
    
    // Force download by setting Content-Disposition
    const url = new URL(video.uploadthing_url);
    url.searchParams.set('response-content-disposition', `attachment; filename="${safeTitle}.mp4"`);
    link.href = url.toString();
    
    // Click the link to start download
    link.click();
    
    // Show success message immediately
    console.log(`Download started for: ${video.title}`);
    
    // Reset loading state quickly
    setTimeout(() => {
      setDownloadingVideoId(null);
    }, 500);
  };

  // Play video in modal
  const playVideo = (video: SharedVideo) => {
    setPlayingVideoId(video.id);
  };

  // Close video modal
  const closeVideoModal = () => {
    setPlayingVideoId(null);
  };

  // Copy download link to clipboard
  const copyDownloadLink = async (video: SharedVideo) => {
    try {
      await navigator.clipboard.writeText(video.uploadthing_url);
      alert(`✅ Download link copied!\n\nPaste this link in a new browser tab, then right-click the video and select "Save video as..." to download "${video.title}"`);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      alert(`Download link:\n${video.uploadthing_url}\n\nManually copy this link and paste it in a new browser tab.`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <Video className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Loading shared videos...</h2>
            <p className="text-gray-400">Please wait while we fetch community videos</p>
          </div>
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
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Studio
                  </Button>
                </Link>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
                    <Film className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                      Shared Library
                    </h1>
                    <p className="text-sm text-gray-400">
                      {videos.length} community video{videos.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search videos or creators..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-green-500/50 focus:ring-green-500/25"
                  />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-6 py-8">
          {error && (
            <Card className="bg-red-500/10 border-red-500/20 mb-6">
              <CardContent className="pt-6">
                <p className="text-red-400">{error}</p>
              </CardContent>
            </Card>
          )}

          {filteredVideos.length === 0 && !loading ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Video className="w-12 h-12 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-300 mb-4">
                {searchTerm ? 'No videos match your search' : 'No shared videos yet'}
              </h2>
              <p className="text-gray-400 mb-8">
                {searchTerm 
                  ? 'Try adjusting your search terms' 
                  : 'Be the first to share a video with the community!'
                }
              </p>
              {!searchTerm && (
                <Link href="/dashboard">
                  <Button className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
                    <Video className="w-4 h-4 mr-2" />
                    Create & Share Your First Video
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredVideos.map((video) => (
                <Card key={video.id} className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="aspect-video bg-black rounded-lg overflow-hidden mb-3 relative group cursor-pointer" onClick={() => playVideo(video)}>
                      <video
                        src={video.uploadthing_url}
                        className="w-full h-full object-cover"
                        muted
                        preload="metadata"
                        onMouseEnter={(e) => {
                          const videoEl = e.target as HTMLVideoElement;
                          videoEl.currentTime = 1; // Show frame at 1 second
                        }}
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                          <Play className="w-8 h-8 text-white" fill="currentColor" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <CardTitle className="text-white text-sm font-medium leading-tight">
                        {video.title}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-400">
                          by {video.creator_name}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(video.created_at)}
                        </div>
                        {video.duration && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDuration(video.duration)}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <HardDrive className="w-3 h-3" />
                        {formatFileSize(video.file_size)}
                      </div>

                      {video.description && (
                        <p className="text-xs text-gray-400 line-clamp-2">
                          {video.description}
                        </p>
                      )}

                      <div className="flex gap-1 pt-2">
                        <Button
                          size="sm"
                          onClick={() => downloadVideo(video)}
                          disabled={downloadingVideoId === video.id}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                        >
                          {downloadingVideoId === video.id ? (
                            <>
                              <div className="w-3 h-3 mr-1 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Downloading...
                            </>
                          ) : (
                            <>
                              <Download className="w-3 h-3 mr-1" />
                              Download
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyDownloadLink(video)}
                          className="px-2 bg-gray-700 hover:bg-gray-600 text-white border-gray-600 text-xs"
                          title="Copy download link"
                        >
                          📋
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Video Player Modal */}
      {playingVideoId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={closeVideoModal}>
          <div className="relative w-full max-w-4xl aspect-video bg-black rounded-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <video
              src={videos.find(v => v.id === playingVideoId)?.uploadthing_url}
              className="w-full h-full"
              controls
              autoPlay
              onEnded={closeVideoModal}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={closeVideoModal}
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 