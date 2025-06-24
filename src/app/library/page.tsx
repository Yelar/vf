'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { NavigationHeader } from '@/components/ui/navigation-header';
import { ModernCard, ModernCardContent } from '@/components/ui/modern-card';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Video, 
  Play, 
  Download, 
  Trash2, 
  Edit3, 
  Save, 
  X, 
  Calendar,
  HardDrive,
  Search,
  Grid3X3,
  List,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Globe,
  Copy,
  Check,
  MoreVertical,
  SortAsc,
  SortDesc
} from "lucide-react";
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserVideo {
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
}

type ViewMode = 'grid' | 'list';
type SortField = 'created_at' | 'title' | 'file_size' | 'duration';
type SortOrder = 'asc' | 'desc';

function LibraryContent() {
  const { data: session } = useSession();
  const [videos, setVideos] = useState<UserVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingVideoId, setEditingVideoId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [copyingVideoId, setCopyingVideoId] = useState<number | null>(null);
  
  // Modern UX state
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [videosPerPage] = useState(12);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'shared' | 'private'>('all');

  // Fetch user videos - optimized with useCallback
  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/videos', {
        // Add cache headers for better performance
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch videos');
      }
      
      const data = await response.json();
      setVideos(data.videos || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching videos:', err);
      setError('Failed to load your videos. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user) {
      fetchVideos();
    }
  }, [session, fetchVideos]);

  // Advanced filtering and sorting
  const filteredAndSortedVideos = useMemo(() => {
    const filtered = videos.filter(video => {
      // Search filter
      const searchMatch = video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (video.description && video.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Sharing filter
      const shareMatch = selectedFilter === 'all' || 
        (selectedFilter === 'shared' && video.is_shared === 1) ||
        (selectedFilter === 'private' && video.is_shared === 0);
      
      return searchMatch && shareMatch;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: string | number, bValue: string | number;
      
      switch (sortField) {
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'file_size':
          aValue = a.file_size;
          bValue = b.file_size;
          break;
        case 'duration':
          aValue = a.duration || 0;
          bValue = b.duration || 0;
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [videos, searchTerm, selectedFilter, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedVideos.length / videosPerPage);
  const paginatedVideos = filteredAndSortedVideos.slice(
    (currentPage - 1) * videosPerPage,
    currentPage * videosPerPage
  );

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedFilter, sortField, sortOrder]);

  // Utility functions - optimized with useCallback
  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }, []);

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

  const copyVideoUrl = useCallback(async (url: string, videoId: number) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopyingVideoId(videoId);
      setTimeout(() => setCopyingVideoId(null), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  }, []);

  const deleteVideo = async (videoId: number) => {
    if (!confirm('Are you sure you want to delete this video?')) return;

    try {
      const response = await fetch(`/api/videos/${videoId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setVideos(videos.filter(v => v.id !== videoId));
      }
    } catch (error) {
      console.error('Error deleting video:', error);
    }
  };

  const startEditingTitle = (video: UserVideo) => {
    setEditingVideoId(video.id);
    setEditingTitle(video.title);
  };

  const saveTitle = async (videoId: number) => {
    try {
      const response = await fetch(`/api/videos/${videoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editingTitle }),
      });

      if (response.ok) {
        setVideos(videos.map(v => 
          v.id === videoId ? { ...v, title: editingTitle } : v
      ));
      setEditingVideoId(null);
      setEditingTitle('');
      }
    } catch (error) {
      console.error('Error updating title:', error);
    }
  };

  const cancelEdit = () => {
    setEditingVideoId(null);
    setEditingTitle('');
  };

  const downloadVideo = async (video: UserVideo) => {
    try {
    const link = document.createElement('a');
    link.href = video.uploadthing_url;
      link.download = `${video.title}.mp4`;
      document.body.appendChild(link);
    link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading video:', error);
    }
  };

  const toggleSharing = async (video: UserVideo) => {
    try {
      const response = await fetch(`/api/videos/${video.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_shared: video.is_shared === 1 ? 0 : 1 }),
      });

      if (response.ok) {
      setVideos(videos.map(v =>
          v.id === video.id ? { ...v, is_shared: video.is_shared === 1 ? 0 : 1 } : v
      ));
      }
    } catch (error) {
      console.error('Error toggling sharing:', error);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-purple-950/50">
        <NavigationHeader />
        <div className="container mx-auto px-4 py-8">
          <ModernCard className="text-center py-12">
            <ModernCardContent>
              <X className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Error Loading Videos</h3>
              <p className="text-gray-400 mb-6">{error}</p>
              <Button onClick={fetchVideos} className="bg-gradient-to-r from-purple-600 to-blue-600">
            Try Again
          </Button>
            </ModernCardContent>
          </ModernCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-purple-950/50">
      <NavigationHeader />
      
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              My Video Library
                    </h1>
            <p className="text-gray-400 mt-1">
              {loading ? 'Loading...' : `${filteredAndSortedVideos.length} video${filteredAndSortedVideos.length !== 1 ? 's' : ''} found`}
                    </p>
              </div>
              
          <div className="flex items-center space-x-3">
            <Link href="/video/new">
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                <Video className="w-4 h-4 mr-2" />
                Create Video
                  </Button>
                </Link>
              </div>
            </div>

        {/* Filters and Controls */}
        <ModernCard gradient="purple">
          <ModernCardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search videos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder-gray-400"
                  />
                </div>
                
              {/* Filter by sharing status */}
                  <Select value={selectedFilter} onValueChange={(value: 'all' | 'shared' | 'private') => setSelectedFilter(value)}>
                <SelectTrigger className="w-full lg:w-40 bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Videos</SelectItem>
                      <SelectItem value="shared">Shared</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>

              {/* Sort */}
              <Select value={sortField} onValueChange={(value: SortField) => setSortField(value)}>
                <SelectTrigger className="w-full lg:w-40 bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                  <SelectItem value="created_at">Date</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="file_size">Size</SelectItem>
                  <SelectItem value="duration">Duration</SelectItem>
                  </SelectContent>
                </Select>

              {/* Sort Order */}
                  <Button
                    variant="outline"
                    size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="border-white/10 text-white hover:bg-white/10"
                  >
                {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                  </Button>
              
              {/* View Mode */}
              <div className="flex border border-white/10 rounded-lg overflow-hidden">
                  <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-none border-0"
                  >
                  <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-none border-0"
                  >
                  <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
          </ModernCardContent>
        </ModernCard>

        {/* Content */}
        {loading ? (
          <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 bg-white/5" />
            ))}
          </div>
        ) : filteredAndSortedVideos.length === 0 ? (
          <ModernCard className="text-center py-12">
            <ModernCardContent>
              <Video className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {searchTerm ? 'No videos found' : 'No videos yet'}
              </h3>
              <p className="text-gray-400 mb-6">
                {searchTerm 
                  ? 'Try adjusting your search or filters'
                  : 'Create your first AI-powered video to get started!'
                }
              </p>
              {!searchTerm && (
                <Link href="/video/new">
                  <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                    <Video className="w-4 h-4 mr-2" />
                    Create First Video
                  </Button>
                </Link>
              )}
            </ModernCardContent>
          </ModernCard>
          ) : (
            <>
            {/* Videos Grid/List */}
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                  {paginatedVideos.map((video) => (
                <ModernCard key={video.id} hover glow className="group">
                  <ModernCardContent className="p-0">
                    {viewMode === 'grid' ? (
                      // Grid View
                      <>
                        {/* Video Thumbnail */}
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
                          {video.is_shared === 1 && (
                            <div className="absolute top-2 left-2">
                              <Badge className="bg-green-500/80 text-white border-0">
                                <Globe className="w-3 h-3 mr-1" />
                                Shared
                              </Badge>
                            </div>
                          )}
                          </div>
                        </Link>
                        
                        {/* Video Info */}
                        <div className="p-4 space-y-3">
                          <div>
                            {editingVideoId === video.id ? (
                              <div className="flex space-x-2">
                                <Input
                                  value={editingTitle}
                                  onChange={(e) => setEditingTitle(e.target.value)}
                                  className="flex-1 text-sm bg-white/5 border-white/10"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveTitle(video.id);
                                    if (e.key === 'Escape') cancelEdit();
                                  }}
                                />
                                <Button size="sm" onClick={() => saveTitle(video.id)} className="px-2">
                                  <Save className="w-3 h-3" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={cancelEdit} className="px-2">
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            ) : (
                              <h3 className="font-semibold text-white line-clamp-2 group-hover:text-purple-300 transition-colors">
                                {video.title}
                              </h3>
                            )}
                          
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center space-x-3 text-xs text-gray-500">
                                <div className="flex items-center space-x-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>{formatDateFull(video.created_at)}</span>
                          </div>
                                <div className="flex items-center space-x-1">
                                  <HardDrive className="w-3 h-3" />
                                  <span>{formatFileSize(video.file_size)}</span>
                        </div>
                        </div>
                      </div>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex items-center justify-between">
                            <div className="flex space-x-2">
                              <Link href={`/watch/${video.id}`}>
                                <Button size="sm" variant="outline" className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10">
                                  <Play className="w-3 h-3 mr-1" />
                                  Watch
                                </Button>
                              </Link>
                    </div>
                    
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white">
                                  <MoreVertical className="w-4 h-4" />
                          </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="bg-gray-900/95 backdrop-blur border-white/10" align="end">
                                <Link href={`/video/${video.id}`}>
                                  <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-white/10">
                                    <Edit3 className="mr-2 h-4 w-4" />
                                    Edit Video
                                  </DropdownMenuItem>
                                </Link>
                                <DropdownMenuSeparator className="bg-white/10" />
                                <DropdownMenuItem onClick={() => startEditingTitle(video)} className="text-gray-300 hover:text-white hover:bg-white/10">
                                  <Edit3 className="mr-2 h-4 w-4" />
                                  Rename
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => copyVideoUrl(video.uploadthing_url, video.id)} className="text-gray-300 hover:text-white hover:bg-white/10">
                                  {copyingVideoId === video.id ? (
                                    <Check className="mr-2 h-4 w-4 text-green-400" />
                                  ) : (
                                    <Copy className="mr-2 h-4 w-4" />
                                  )}
                                  Copy Link
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => downloadVideo(video)} className="text-gray-300 hover:text-white hover:bg-white/10">
                                  <Download className="mr-2 h-4 w-4" />
                            Download
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toggleSharing(video)} className="text-gray-300 hover:text-white hover:bg-white/10">
                                  {video.is_shared === 1 ? (
                                    <>
                                      <EyeOff className="mr-2 h-4 w-4" />
                                      Make Private
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="mr-2 h-4 w-4" />
                                      Make Public
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-white/10" />
                                <DropdownMenuItem onClick={() => deleteVideo(video.id)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                      </div>
                      </>
                    ) : (
                      // List View
                      <div className="p-4 flex items-center space-x-4">
                        <Link href={`/watch/${video.id}`}>
                          <div className="w-20 h-12 bg-gradient-to-br from-purple-900/50 to-blue-900/50 rounded flex items-center justify-center flex-shrink-0 cursor-pointer hover:scale-105 transition-transform">
                            <Play className="w-6 h-6 text-white/70" />
                          </div>
                        </Link>
                      
                          <div className="flex-1 min-w-0">
                            {editingVideoId === video.id ? (
                            <div className="flex space-x-2">
                                <Input
                                  value={editingTitle}
                                  onChange={(e) => setEditingTitle(e.target.value)}
                                className="flex-1 text-sm bg-white/5 border-white/10"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveTitle(video.id);
                                    if (e.key === 'Escape') cancelEdit();
                                  }}
                                />
                              <Button size="sm" onClick={() => saveTitle(video.id)} className="px-2">
                                <Save className="w-3 h-3" />
                                </Button>
                              <Button size="sm" variant="ghost" onClick={cancelEdit} className="px-2">
                                <X className="w-3 h-3" />
                                </Button>
                        </div>
                      ) : (
                            <h3 className="font-semibold text-white truncate">{video.title}</h3>
                          )}
                          
                          <div className="flex items-center space-x-4 mt-1 text-xs text-gray-400">
                                  <span>{formatDateFull(video.created_at)}</span>
                                  <span>{formatFileSize(video.file_size)}</span>
                                  {video.duration && <span>{formatDuration(video.duration)}</span>}
                                  {video.is_shared === 1 && (
                              <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                                <Globe className="w-2 h-2 mr-1" />
                                      Shared
                                    </Badge>
                                  )}
                                </div>
                          </div>

                        <div className="flex items-center space-x-2">
                          <Link href={`/watch/${video.id}`}>
                            <Button size="sm" variant="outline" className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10">
                              <Play className="w-3 h-3 mr-1" />
                              Watch
                            </Button>
                          </Link>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white">
                                <MoreVertical className="w-4 h-4" />
                            </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-gray-900/95 backdrop-blur border-white/10" align="end">
                              <Link href={`/video/${video.id}`}>
                                <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-white/10">
                                  <Edit3 className="mr-2 h-4 w-4" />
                                  Edit Video
                                </DropdownMenuItem>
                              </Link>
                              <DropdownMenuSeparator className="bg-white/10" />
                              <DropdownMenuItem onClick={() => startEditingTitle(video)} className="text-gray-300 hover:text-white hover:bg-white/10">
                                <Edit3 className="mr-2 h-4 w-4" />
                                Rename
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => copyVideoUrl(video.uploadthing_url, video.id)} className="text-gray-300 hover:text-white hover:bg-white/10">
                                {copyingVideoId === video.id ? (
                                  <Check className="mr-2 h-4 w-4 text-green-400" />
                                ) : (
                                  <Copy className="mr-2 h-4 w-4" />
                                )}
                                Copy Link
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => downloadVideo(video)} className="text-gray-300 hover:text-white hover:bg-white/10">
                                <Download className="mr-2 h-4 w-4" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toggleSharing(video)} className="text-gray-300 hover:text-white hover:bg-white/10">
                                {video.is_shared === 1 ? (
                                  <>
                                    <EyeOff className="mr-2 h-4 w-4" />
                                    Make Private
                            </>
                          ) : (
                            <>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Make Public
                            </>
                          )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-white/10" />
                              <DropdownMenuItem onClick={() => deleteVideo(video.id)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                      </div>
                    </div>
                    )}
                  </ModernCardContent>
                </ModernCard>
              ))}
            </div>

              {/* Pagination */}
              {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  className="border-white/10 text-white hover:bg-white/10"
                    >
                  <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>
                    
                <div className="flex space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                        return (
                          <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                        onClick={() => setCurrentPage(page)}
                        className={`border-white/10 ${
                          currentPage === page 
                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' 
                            : 'text-white hover:bg-white/10'
                        }`}
                          >
                        {page}
                          </Button>
                        );
                      })}
      </div>

            <Button
                      variant="outline"
              size="sm"
                      disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="border-white/10 text-white hover:bg-white/10"
            >
                      Next
                  <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
              )}
            </>
      )}
      </main>
    </div>
  );
}

export default function LibraryPage() {
  return (
    <AuthGuard>
      <LibraryContent />
    </AuthGuard>
  );
} 