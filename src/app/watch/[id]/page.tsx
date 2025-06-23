'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { NavigationHeader } from '@/components/ui/navigation-header';
import { ModernCard, ModernCardContent } from '@/components/ui/modern-card';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  Download, 
  Share2, 
  Edit3,
  Globe,
  Lock,
  Calendar,
  HardDrive,
  Clock,
  Copy,
  Check,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Settings
} from "lucide-react";
import Link from 'next/link';

interface VideoData {
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
  user_name?: string;
}

function WatchVideoContent() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const videoId = params.id as string;
  
  const [video, setVideo] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Video player states
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (videoId) {
      fetchVideo();
    }
  }, [videoId]);

  const fetchVideo = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/videos/${videoId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Video not found');
        } else {
          setError('Failed to load video');
        }
        return;
      }
      
      const data = await response.json();
      setVideo(data.video);
      setError(null);
    } catch (err) {
      console.error('Error fetching video:', err);
      setError('Failed to load video');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const copyVideoUrl = async () => {
    try {
      const url = window.location.href;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  const downloadVideo = async () => {
    if (!video) return;
    
    try {
      const response = await fetch(`/api/videos/download/${video.id}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${video.title}.mp4`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const togglePlayPause = () => {
    const videoElement = document.getElementById('main-video') as HTMLVideoElement;
    if (videoElement) {
      if (isPlaying) {
        videoElement.pause();
      } else {
        videoElement.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    const videoElement = document.getElementById('main-video') as HTMLVideoElement;
    if (videoElement) {
      videoElement.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    const videoElement = document.getElementById('main-video') as HTMLVideoElement;
    if (videoElement) {
      videoElement.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const handleTimeUpdate = () => {
    const videoElement = document.getElementById('main-video') as HTMLVideoElement;
    if (videoElement) {
      setCurrentTime(videoElement.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    const videoElement = document.getElementById('main-video') as HTMLVideoElement;
    if (videoElement) {
      setDuration(videoElement.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    const videoElement = document.getElementById('main-video') as HTMLVideoElement;
    if (videoElement) {
      videoElement.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const toggleFullscreen = () => {
    const videoElement = document.getElementById('main-video') as HTMLVideoElement;
    if (videoElement) {
      if (!isFullscreen) {
        if (videoElement.requestFullscreen) {
          videoElement.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
      setIsFullscreen(!isFullscreen);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-purple-950/50">
        <NavigationHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <Skeleton className="h-8 w-64 bg-white/5" />
            <Skeleton className="aspect-video w-full bg-white/5" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <Skeleton className="h-6 w-48 bg-white/5" />
                <Skeleton className="h-20 w-full bg-white/5" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-32 w-full bg-white/5" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-purple-950/50">
        <NavigationHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎬</div>
            <h1 className="text-2xl font-bold text-white mb-2">
              {error === 'Video not found' ? 'Video Not Found' : 'Failed to Load Video'}
            </h1>
            <p className="text-gray-400 mb-6">
              {error === 'Video not found' 
                ? "This video doesn't exist or has been removed." 
                : "There was an error loading the video. Please try again."}
            </p>
            <Link href="/library">
              <Button variant="outline" className="border-purple-500/50 text-purple-300">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Library
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-purple-950/50">
      <NavigationHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Back Button */}
          <div className="flex items-center space-x-4">
            <Link href="/library">
              <Button variant="ghost" className="text-gray-400 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Library
              </Button>
            </Link>
          </div>

          {/* Video Player */}
          <ModernCard className="overflow-hidden">
            <ModernCardContent className="p-0">
              <div className="relative">
                <video
                  id="main-video"
                  className="w-full aspect-video bg-black"
                  controls
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onVolumeChange={() => {
                    const videoElement = document.getElementById('main-video') as HTMLVideoElement;
                    if (videoElement) {
                      setVolume(videoElement.volume);
                      setIsMuted(videoElement.muted);
                    }
                  }}
                >
                  <source src={video.uploadthing_url} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </ModernCardContent>
          </ModernCard>

          {/* Video Info and Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Video Details */}
            <div className="lg:col-span-2 space-y-6">
              <ModernCard>
                <ModernCardContent className="p-6">
                  <div className="space-y-4">
                    {/* Title and Status */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h1 className="text-2xl font-bold text-white mb-2">{video.title}</h1>
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(video.created_at)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <HardDrive className="w-4 h-4" />
                            <span>{formatFileSize(video.file_size)}</span>
                          </div>
                          {video.duration && (
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{formatDuration(video.duration)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={video.is_shared === 1 ? "bg-green-500/20 text-green-300 border-green-500/30" : "bg-gray-500/20 text-gray-300 border-gray-500/30"}>
                          {video.is_shared === 1 ? (
                            <>
                              <Globe className="w-3 h-3 mr-1" />
                              Public
                            </>
                          ) : (
                            <>
                              <Lock className="w-3 h-3 mr-1" />
                              Private
                            </>
                          )}
                        </Badge>
                      </div>
                    </div>

                    {/* Description */}
                    {video.description && (
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
                        <p className="text-gray-300 leading-relaxed">{video.description}</p>
                      </div>
                    )}
                  </div>
                </ModernCardContent>
              </ModernCard>
            </div>

            {/* Action Panel */}
            <div className="space-y-6">
              <ModernCard>
                <ModernCardContent className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Actions</h3>
                  <div className="space-y-3">
                    {/* Edit Video - Only show if user owns the video */}
                    {session?.user?.email && video.user_id === session.user.id && (
                      <Link href={`/video/${video.id}`} className="w-full">
                        <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                          <Edit3 className="w-4 h-4 mr-2" />
                          Edit Video
                        </Button>
                      </Link>
                    )}

                    {/* Download */}
                    <Button 
                      onClick={downloadVideo}
                      variant="outline" 
                      className="w-full border-blue-500/50 text-blue-300 hover:bg-blue-500/10"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>

                    {/* Share */}
                    <Button 
                      onClick={copyVideoUrl}
                      variant="outline" 
                      className="w-full border-green-500/50 text-green-300 hover:bg-green-500/10"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 mr-2" />
                      ) : (
                        <Copy className="w-4 h-4 mr-2" />
                      )}
                      {copied ? 'Copied!' : 'Copy Link'}
                    </Button>
                  </div>
                </ModernCardContent>
              </ModernCard>

              {/* Video Stats */}
              <ModernCard>
                <ModernCardContent className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Video Details</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">File Size:</span>
                      <span className="text-white">{formatFileSize(video.file_size)}</span>
                    </div>
                    {video.duration && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Duration:</span>
                        <span className="text-white">{formatDuration(video.duration)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-400">Created:</span>
                      <span className="text-white">{formatDate(video.created_at)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Visibility:</span>
                      <span className={video.is_shared === 1 ? "text-green-300" : "text-gray-300"}>
                        {video.is_shared === 1 ? 'Public' : 'Private'}
                      </span>
                    </div>
                  </div>
                </ModernCardContent>
              </ModernCard>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function WatchVideoPage() {
  return (
    <AuthGuard>
      <WatchVideoContent />
    </AuthGuard>
  );
}