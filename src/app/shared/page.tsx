'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Search,
  Calendar,
  HardDrive,
  Grid3X3,
  List,
  ChevronLeft,
  ChevronRight,
  Globe,
  Copy,
  Check,
  User,
  SortAsc,
  SortDesc,
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

type ViewMode = 'grid' | 'list';
type SortField = 'created_at' | 'title' | 'file_size' | 'duration' | 'creator_name';
type SortOrder = 'asc' | 'desc';

export default function SharedLibraryPage() {
  const [videos, setVideos] = useState<SharedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [copyingVideoId, setCopyingVideoId] = useState<number | null>(null);
  
  // Modern UX state
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [creatorFilter, setCreatorFilter] = useState('all');
  const [videosPerPage] = useState(12);

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
  const filteredAndSortedVideos = useMemo(() => {
    const filtered = videos.filter(video => {
      const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        video.creator_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (video.description && video.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCreator = creatorFilter === 'all' || video.creator_name === creatorFilter;
      
      return matchesSearch && matchesCreator;
    });

    // Sort videos
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
        case 'creator_name':
          aValue = a.creator_name.toLowerCase();
          bValue = b.creator_name.toLowerCase();
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
  }, [videos, searchTerm, creatorFilter, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedVideos.length / videosPerPage);
  const paginatedVideos = filteredAndSortedVideos.slice(
    (currentPage - 1) * videosPerPage,
    currentPage * videosPerPage
  );

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, creatorFilter, sortField, sortOrder]);

  // Utility functions
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

  const formatDateFull = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const copyVideoUrl = async (url: string, videoId: number) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopyingVideoId(videoId);
      setTimeout(() => setCopyingVideoId(null), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  const downloadVideo = async (video: SharedVideo) => {
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
              <Button onClick={fetchSharedVideos} className="bg-gradient-to-r from-purple-600 to-blue-600">
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
              Shared Videos
            </h1>
            <p className="text-gray-400 mt-1">
              {loading ? 'Loading...' : `${filteredAndSortedVideos.length} video${filteredAndSortedVideos.length !== 1 ? 's' : ''} from the community`}
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
                  placeholder="Search videos or creators..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder-gray-400"
                />
              </div>
              
              {/* Filter by creator */}
              <Select value={creatorFilter} onValueChange={setCreatorFilter}>
                <SelectTrigger className="w-full lg:w-48 bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Creators</SelectItem>
                  {uniqueCreators.map((creator) => (
                    <SelectItem key={creator} value={creator}>
                      {creator}
                    </SelectItem>
                  ))}
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
                  <SelectItem value="creator_name">Creator</SelectItem>
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
              <Globe className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {searchTerm || creatorFilter !== 'all' ? 'No videos found' : 'No shared videos yet'}
              </h3>
              <p className="text-gray-400 mb-6">
                {searchTerm || creatorFilter !== 'all'
                  ? 'Try adjusting your search or filters' 
                  : 'Be the first to share your amazing AI-generated video!'
                }
              </p>
              {!searchTerm && creatorFilter === 'all' && (
                <Link href="/video/new">
                  <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                    <Video className="w-4 h-4 mr-2" />
                    Create & Share Video
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
                        <div className="aspect-video bg-gradient-to-br from-purple-900/50 to-blue-900/50 rounded-t-lg flex items-center justify-center relative overflow-hidden">
                          <Play className="w-12 h-12 text-white/70 group-hover:scale-110 transition-transform" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                          
                          {/* Video Duration */}
                          {video.duration && (
                            <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 rounded text-xs text-white font-medium">
                              {formatDuration(video.duration)}
                            </div>
                          )}
                          
                          {/* Shared Badge */}
                          <div className="absolute top-2 left-2">
                            <Badge className="bg-green-500/80 text-white border-0">
                              <Globe className="w-3 h-3 mr-1" />
                              Shared
                            </Badge>
                          </div>
                        </div>
                        
                        {/* Video Info */}
                        <div className="p-4 space-y-3">
                          <div>
                            <h3 className="font-semibold text-white line-clamp-2 group-hover:text-purple-300 transition-colors">
                              {video.title}
                            </h3>
                            
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center space-x-3 text-xs text-gray-500">
                                <div className="flex items-center space-x-1">
                                  <User className="w-3 h-3" />
                                  <span>{video.creator_name}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>{formatDateFull(video.created_at)}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500">
                              <div className="flex items-center space-x-1">
                                <HardDrive className="w-3 h-3" />
                                <span>{formatFileSize(video.file_size)}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex items-center justify-between">
                            <div className="flex space-x-2">
                              <Button 
                                size="sm" 
                                onClick={() => downloadVideo(video)}
                                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                              >
                                <Download className="w-3 h-3 mr-1" />
                                Download
                              </Button>
                            </div>
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyVideoUrl(video.uploadthing_url, video.id)}
                              className="text-gray-400 hover:text-white"
                            >
                              {copyingVideoId === video.id ? (
                                <Check className="w-3 h-3 text-green-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </>
                    ) : (
                      // List View
                      <div className="p-4 flex items-center space-x-4">
                        <div className="w-20 h-12 bg-gradient-to-br from-purple-900/50 to-blue-900/50 rounded flex items-center justify-center flex-shrink-0">
                          <Play className="w-6 h-6 text-white/70" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white truncate">{video.title}</h3>
                          <div className="flex items-center space-x-4 mt-1 text-xs text-gray-400">
                            <span>{video.creator_name}</span>
                            <span>{formatDateFull(video.created_at)}</span>
                            <span>{formatFileSize(video.file_size)}</span>
                            {video.duration && <span>{formatDuration(video.duration)}</span>}
                            <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                              <Globe className="w-2 h-2 mr-1" />
                              Shared
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button 
                            size="sm" 
                            onClick={() => downloadVideo(video)}
                            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Download
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyVideoUrl(video.uploadthing_url, video.id)}
                            className="text-gray-400 hover:text-white"
                          >
                            {copyingVideoId === video.id ? (
                              <Check className="w-3 h-3 text-green-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </Button>
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