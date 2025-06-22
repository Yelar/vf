'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  X,
  Grid3X3,
  List,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Users,
  Globe,
  ArrowUp,
  ArrowDown,
  Eye,
  Copy
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

type ViewMode = 'grid' | 'list';
type SortField = 'created_at' | 'title' | 'file_size' | 'duration' | 'creator_name';
type SortOrder = 'asc' | 'desc';

const VIDEOS_PER_PAGE = 12;

export default function SharedLibraryPage() {
  const [videos, setVideos] = useState<SharedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [downloadingVideoId, setDownloadingVideoId] = useState<number | null>(null);
  const [playingVideoId, setPlayingVideoId] = useState<number | null>(null);
  
  // New UX states
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [creatorFilter, setCreatorFilter] = useState('all');

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

  // Get unique creators for filter
  const uniqueCreators = useMemo(() => {
    const creators = [...new Set(videos.map(video => video.creator_name))];
    return creators.sort();
  }, [videos]);

  // Filter and sort videos
  const { filteredVideos, paginatedVideos, totalPages } = useMemo(() => {
    const filtered = videos.filter(video => {
      const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        video.creator_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (video.description && video.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCreator = creatorFilter === 'all' || video.creator_name === creatorFilter;
      
      return matchesSearch && matchesCreator;
    });

    // Sort videos
    filtered.sort((a, b) => {
      let valueA: string | number | Date, valueB: string | number | Date;
      
      switch (sortField) {
        case 'created_at':
          valueA = new Date(a.created_at);
          valueB = new Date(b.created_at);
          break;
        case 'title':
          valueA = a.title.toLowerCase();
          valueB = b.title.toLowerCase();
          break;
        case 'file_size':
          valueA = a.file_size;
          valueB = b.file_size;
          break;
        case 'duration':
          valueA = a.duration || 0;
          valueB = b.duration || 0;
          break;
        case 'creator_name':
          valueA = a.creator_name.toLowerCase();
          valueB = b.creator_name.toLowerCase();
          break;
        default:
          return 0;
      }
      
      if (valueA < valueB) return sortOrder === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    // Paginate
    const totalPages = Math.ceil(filtered.length / VIDEOS_PER_PAGE);
    const startIndex = (currentPage - 1) * VIDEOS_PER_PAGE;
    const paginatedVideos = filtered.slice(startIndex, startIndex + VIDEOS_PER_PAGE);

    return { filteredVideos: filtered, paginatedVideos, totalPages };
  }, [videos, searchTerm, creatorFilter, sortField, sortOrder, currentPage]);

  // Reset to first page when search/filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, creatorFilter, sortField, sortOrder]);

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

  // Pagination handlers
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Loading skeleton component
  const VideoSkeleton = () => (
    <Card className="bg-white/5 border-white/10 backdrop-blur-sm animate-pulse">
      <CardHeader className="pb-3">
        <div className="aspect-video bg-gray-700 rounded-lg mb-3"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-700 rounded w-3/4"></div>
          <div className="h-3 bg-gray-700 rounded w-1/2"></div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="h-3 bg-gray-700 rounded w-full"></div>
          <div className="h-3 bg-gray-700 rounded w-2/3"></div>
          <div className="h-8 bg-gray-700 rounded"></div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
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
              <div className="flex items-center gap-4">
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Studio
                  </Button>
                </Link>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center animate-pulse">
                    <Film className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="h-6 bg-gray-700 rounded w-32 mb-1"></div>
                    <div className="h-4 bg-gray-700 rounded w-24"></div>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Loading Content */}
          <main className="container mx-auto px-6 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <VideoSkeleton key={index} />
              ))}
            </div>
          </main>
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
                      {filteredVideos.length} of {videos.length} community video{videos.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {/* View Mode Toggle */}
                <div className="flex border border-white/20 rounded-lg">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className={`rounded-r-none ${viewMode === 'grid' ? 'bg-white/20' : 'hover:bg-white/10'}`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className={`rounded-l-none ${viewMode === 'list' ? 'bg-white/20' : 'hover:bg-white/10'}`}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search videos or creators..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-green-500/50 focus:ring-green-500/25 w-64"
                  />
                </div>

                {/* Filter Toggle */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`border-white/20 ${showFilters ? 'bg-white/20' : 'hover:bg-white/10'}`}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                  <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </Button>
              </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Creator Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Creator</label>
                    <Select value={creatorFilter} onValueChange={setCreatorFilter}>
                      <SelectTrigger className="bg-white/10 border-white/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Creators ({videos.length})</SelectItem>
                        {uniqueCreators.map(creator => {
                          const count = videos.filter(v => v.creator_name === creator).length;
                          return (
                            <SelectItem key={creator} value={creator}>
                              {creator} ({count})
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sort Field */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Sort by</label>
                    <Select value={sortField} onValueChange={(value: SortField) => setSortField(value)}>
                      <SelectTrigger className="bg-white/10 border-white/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="created_at">Date Created</SelectItem>
                        <SelectItem value="title">Title</SelectItem>
                        <SelectItem value="creator_name">Creator</SelectItem>
                        <SelectItem value="file_size">File Size</SelectItem>
                        <SelectItem value="duration">Duration</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sort Order */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Order</label>
                    <Select value={sortOrder} onValueChange={(value: SortOrder) => setSortOrder(value)}>
                      <SelectTrigger className="bg-white/10 border-white/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desc">
                          <div className="flex items-center">
                            <ArrowDown className="w-4 h-4 mr-2" />
                            Descending
                          </div>
                        </SelectItem>
                        <SelectItem value="asc">
                          <div className="flex items-center">
                            <ArrowUp className="w-4 h-4 mr-2" />
                            Ascending
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Stats */}
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex items-center gap-6 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      {videos.length} Total Videos
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      {uniqueCreators.length} Creators
                    </div>
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      {filteredVideos.length} Showing
                    </div>
                  </div>
                </div>
              </div>
            )}
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
                {searchTerm || creatorFilter !== 'all' ? 'No videos match your filters' : 'No shared videos yet'}
              </h2>
              <p className="text-gray-400 mb-8">
                {searchTerm || creatorFilter !== 'all'
                  ? 'Try adjusting your search terms or filters' 
                  : 'Be the first to share a video with the community!'
                }
              </p>
              {!searchTerm && creatorFilter === 'all' && (
                <Link href="/dashboard">
                  <Button className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
                    <Video className="w-4 h-4 mr-2" />
                    Create & Share Your First Video
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* Videos Grid/List */}
              <div className={viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "space-y-4"
              }>
                {paginatedVideos.map((video) => (
                  viewMode === 'grid' ? (
                    <Card key={video.id} className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-200 hover:shadow-lg hover:shadow-green-500/10 group">
                      <CardHeader className="pb-3">
                        <div className="aspect-video bg-black rounded-lg overflow-hidden mb-3 relative group-hover:scale-[1.02] transition-transform duration-200 cursor-pointer" onClick={() => playVideo(video)}>
                          <video
                            src={video.uploadthing_url}
                            className="w-full h-full object-cover"
                            muted
                            preload="metadata"
                            onMouseEnter={(e) => {
                              const videoEl = e.target as HTMLVideoElement;
                              videoEl.currentTime = 1;
                            }}
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                              <Play className="w-8 h-8 text-white" fill="currentColor" />
                            </div>
                          </div>
                          <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                            {video.duration ? formatDuration(video.duration) : 'Unknown'}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <CardTitle className="text-white text-sm font-medium leading-tight line-clamp-2">
                            {video.title}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <User className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-400 truncate">
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
                            <div className="flex items-center gap-1">
                              <HardDrive className="w-3 h-3" />
                              {formatFileSize(video.file_size)}
                            </div>
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
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    // List view
                    <Card key={video.id} className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-200">
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          <div className="w-32 h-18 bg-black rounded-lg overflow-hidden flex-shrink-0 cursor-pointer group" onClick={() => playVideo(video)}>
                            <video
                              src={video.uploadthing_url}
                              className="w-full h-full object-cover"
                              muted
                              preload="metadata"
                              onMouseEnter={(e) => {
                                const videoEl = e.target as HTMLVideoElement;
                                videoEl.currentTime = 1;
                              }}
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Play className="w-4 h-4 text-white" fill="currentColor" />
                            </div>
                          </div>
                          
                          <div className="flex-1 space-y-2">
                            <div>
                              <h3 className="text-white font-medium text-sm line-clamp-1">{video.title}</h3>
                              <div className="flex items-center gap-2 text-xs text-gray-400">
                                <User className="w-3 h-3" />
                                <span>by {video.creator_name}</span>
                                <span>•</span>
                                <Calendar className="w-3 h-3" />
                                <span>{formatDate(video.created_at)}</span>
                              </div>
                            </div>
                            
                            {video.description && (
                              <p className="text-xs text-gray-400 line-clamp-2">{video.description}</p>
                            )}
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 text-xs text-gray-400">
                                {video.duration && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatDuration(video.duration)}
                                  </div>
                                )}
                                <div className="flex items-center gap-1">
                                  <HardDrive className="w-3 h-3" />
                                  {formatFileSize(video.file_size)}
                                </div>
                              </div>
                              
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => downloadVideo(video)}
                                  disabled={downloadingVideoId === video.id}
                                  className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 text-xs px-3"
                                >
                                  {downloadingVideoId === video.id ? (
                                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <Download className="w-3 h-3" />
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => copyDownloadLink(video)}
                                  className="px-2 bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/10">
                  <div className="text-sm text-gray-400">
                    Showing {(currentPage - 1) * VIDEOS_PER_PAGE + 1} to {Math.min(currentPage * VIDEOS_PER_PAGE, filteredVideos.length)} of {filteredVideos.length} videos
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="border-white/20 hover:bg-white/10"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let page;
                      if (totalPages <= 5) {
                        page = i + 1;
                      } else if (currentPage <= 3) {
                        page = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        page = totalPages - 4 + i;
                      } else {
                        page = currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => goToPage(page)}
                          className={currentPage === page 
                            ? "bg-green-600 hover:bg-green-700 border-green-600" 
                            : "border-white/20 hover:bg-white/10"
                          }
                        >
                          {page}
                        </Button>
                      );
                    })}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="border-white/20 hover:bg-white/10"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
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