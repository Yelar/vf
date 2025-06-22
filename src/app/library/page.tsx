'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Clock,
  Search,
  ArrowLeft,
  Film,
  Globe,
  Grid3X3,
  List,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  CheckCircle2,
  Plus,
  User,
  LogOut
} from "lucide-react";
import Link from 'next/link';

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
  const [downloadingVideoId, setDownloadingVideoId] = useState<number | null>(null);
  const [playingVideoId, setPlayingVideoId] = useState<number | null>(null);
  
  // New UX state
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedVideos, setSelectedVideos] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [videosPerPage] = useState(12);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'shared' | 'private'>('all');

  // Fetch user videos
  const fetchVideos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/videos');
      
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
  };

  useEffect(() => {
    if (session?.user) {
      fetchVideos();
    }
  }, [session]);

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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

  // Selection functions
  const toggleVideoSelection = (videoId: number) => {
    const newSelected = new Set(selectedVideos);
    if (newSelected.has(videoId)) {
      newSelected.delete(videoId);
    } else {
      newSelected.add(videoId);
    }
    setSelectedVideos(newSelected);
  };

  const clearSelection = () => {
    setSelectedVideos(new Set());
  };

  // Bulk actions
  const bulkDelete = async () => {
    if (selectedVideos.size === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedVideos.size} video(s)? This action cannot be undone.`)) {
      return;
    }

    try {
      await Promise.all(
        Array.from(selectedVideos).map(videoId =>
          fetch(`/api/videos/${videoId}`, { method: 'DELETE' })
        )
      );
      
      setVideos(videos.filter(video => !selectedVideos.has(video.id)));
      setSelectedVideos(new Set());
    } catch (err) {
      console.error('Error deleting videos:', err);
      alert('Failed to delete some videos. Please try again.');
    }
  };

  // Individual video actions
  const deleteVideo = async (videoId: number) => {
    if (!confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/videos/${videoId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete video');
      }

      setVideos(videos.filter(video => video.id !== videoId));
    } catch (err) {
      console.error('Error deleting video:', err);
      alert('Failed to delete video. Please try again.');
    }
  };

  const startEditingTitle = (video: UserVideo) => {
    setEditingVideoId(video.id);
    setEditingTitle(video.title);
  };

  const saveTitle = async (videoId: number) => {
    if (!editingTitle.trim()) {
      alert('Title cannot be empty');
      return;
    }

    try {
      const response = await fetch(`/api/videos/${videoId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: editingTitle }),
      });

      if (!response.ok) {
        throw new Error('Failed to update title');
      }

      setVideos(videos.map(video =>
        video.id === videoId ? { ...video, title: editingTitle } : video
      ));

      setEditingVideoId(null);
      setEditingTitle('');
    } catch (err) {
      console.error('Error updating title:', err);
      alert('Failed to update title. Please try again.');
    }
  };

  const cancelEdit = () => {
    setEditingVideoId(null);
    setEditingTitle('');
  };

  const downloadVideo = async (video: UserVideo) => {
    setDownloadingVideoId(video.id);
    
    const safeTitle = video.title.replace(/[^a-zA-Z0-9\s-_]/g, '').replace(/\s+/g, '-');
    
    const link = document.createElement('a');
    link.href = video.uploadthing_url;
    link.download = `${safeTitle}.mp4`;
    
    const url = new URL(video.uploadthing_url);
    url.searchParams.set('response-content-disposition', `attachment; filename="${safeTitle}.mp4"`);
    link.href = url.toString();
    
    link.click();
    
    setTimeout(() => setDownloadingVideoId(null), 1000);
  };

  const playVideo = (video: UserVideo) => {
    setPlayingVideoId(video.id);
  };

  const closeVideoModal = () => {
    setPlayingVideoId(null);
  };

  const toggleSharing = async (video: UserVideo) => {
    try {
      const response = await fetch(`/api/videos/${video.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_shared: video.is_shared === 1 ? 0 : 1 }),
      });

      if (!response.ok) {
        throw new Error('Failed to update sharing status');
      }

      setVideos(videos.map(v =>
        v.id === video.id ? { ...v, is_shared: v.is_shared === 1 ? 0 : 1 } : v
      ));
    } catch (err) {
      console.error('Error updating sharing status:', err);
      alert('Failed to update sharing status. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-6 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-700 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-gray-700 rounded-lg h-64"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <Video className="h-16 w-16 text-red-500 mx-auto" />
          <h2 className="text-2xl font-bold">Error Loading Library</h2>
          <p className="text-gray-400">{error}</p>
          <Button onClick={fetchVideos} className="bg-purple-600 hover:bg-purple-700">
            Try Again
          </Button>
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
                  <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                    <Film className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                      My Library
                    </h1>
                    <p className="text-sm text-gray-400">
                      {filteredAndSortedVideos.length} video{filteredAndSortedVideos.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Link href="/shared">
                  <Button variant="ghost" className="text-green-300 hover:text-green-200">
                    <Globe className="h-4 w-4 mr-2" />
                    Shared Library
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-6 py-8 space-y-6">
          {/* Controls Bar */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 backdrop-blur-sm">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              {/* Left Side - Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search videos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder-gray-400"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant={showFilters ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="whitespace-nowrap"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                  
                  <Select value={selectedFilter} onValueChange={(value: 'all' | 'shared' | 'private') => setSelectedFilter(value)}>
                    <SelectTrigger className="w-32 bg-white/10 border-white/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Videos</SelectItem>
                      <SelectItem value="shared">Shared</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Right Side - View Controls */}
              <div className="flex gap-2 items-center">
                <div className="flex gap-1 bg-white/10 rounded-lg p-1">
                  <Button
                    variant={viewMode === 'grid' ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="h-8 w-8 p-0"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="h-8 w-8 p-0"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
                
                <Select value={`${sortField}-${sortOrder}`} onValueChange={(value) => {
                  const [field, order] = value.split('-') as [SortField, SortOrder];
                  setSortField(field);
                  setSortOrder(order);
                }}>
                  <SelectTrigger className="w-40 bg-white/10 border-white/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at-desc">Newest First</SelectItem>
                    <SelectItem value="created_at-asc">Oldest First</SelectItem>
                    <SelectItem value="title-asc">Title A-Z</SelectItem>
                    <SelectItem value="title-desc">Title Z-A</SelectItem>
                    <SelectItem value="file_size-desc">Largest First</SelectItem>
                    <SelectItem value="file_size-asc">Smallest First</SelectItem>
                    <SelectItem value="duration-desc">Longest First</SelectItem>
                    <SelectItem value="duration-asc">Shortest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Extended Filters (Collapsible) */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="text-sm text-gray-300">Quick filters:</div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSearchTerm('')}
                    disabled={!searchTerm}
                  >
                    Clear Search
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedFilter('all')}
                    disabled={selectedFilter === 'all'}
                  >
                    Show All
                  </Button>
                  <Badge variant="secondary" className="text-xs">
                    {filteredAndSortedVideos.length} of {videos.length} videos shown
                  </Badge>
                </div>
              </div>
            )}
          </div>

          {/* Bulk Actions Bar */}
          {selectedVideos.size > 0 && (
            <div className="bg-purple-600/20 border border-purple-500/30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-purple-400" />
                  <span className="text-purple-200">
                    {selectedVideos.size} video{selectedVideos.size !== 1 ? 's' : ''} selected
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearSelection}
                    className="border-purple-500/30 text-purple-200 hover:bg-purple-500/20"
                  >
                    Clear Selection
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={bulkDelete}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Videos Display */}
          {filteredAndSortedVideos.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <Video className="h-16 w-16 text-gray-500 mx-auto" />
              <h3 className="text-xl font-semibold text-gray-300">
                {searchTerm || selectedFilter !== 'all' ? 'No videos found' : 'No videos yet'}
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                {searchTerm || selectedFilter !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Create your first AI-powered video in the dashboard!'
                }
              </p>
              {(!searchTerm && selectedFilter === 'all') && (
                <Link href="/dashboard">
                  <Button className="bg-purple-600 hover:bg-purple-700 mt-4">
                    <Video className="h-4 w-4 mr-2" />
                    Create Video
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* Grid View */}
              {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {paginatedVideos.map((video) => (
                    <Card 
                      key={video.id} 
                      className={`bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-200 group ${
                        selectedVideos.has(video.id) ? 'ring-2 ring-purple-500 bg-purple-500/10' : ''
                      }`}
                    >
                      <CardHeader className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <input
                              type="checkbox"
                              checked={selectedVideos.has(video.id)}
                              onChange={() => toggleVideoSelection(video.id)}
                              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            {editingVideoId === video.id ? (
                              <div className="flex-1 flex gap-1">
                                <Input
                                  value={editingTitle}
                                  onChange={(e) => setEditingTitle(e.target.value)}
                                  className="text-sm bg-white/10 border-white/20"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveTitle(video.id);
                                    if (e.key === 'Escape') cancelEdit();
                                  }}
                                  autoFocus
                                />
                                <Button size="sm" onClick={() => saveTitle(video.id)} className="h-8 w-8 p-0">
                                  <Save className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={cancelEdit} className="h-8 w-8 p-0">
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <CardTitle className="text-sm font-medium text-white truncate flex-1">
                                {video.title}
                              </CardTitle>
                            )}
                          </div>
                          
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => playVideo(video)}
                              className="h-7 w-7 p-0 hover:bg-white/20"
                            >
                              <Play className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEditingTitle(video)}
                              className="h-7 w-7 p-0 hover:bg-white/20"
                            >
                              <Edit3 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="p-4 pt-0 space-y-3">
                        {/* Video Thumbnail/Preview */}
                        <div 
                          className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-700 transition-colors"
                          onClick={() => playVideo(video)}
                        >
                          <Play className="h-8 w-8 text-gray-400" />
                        </div>
                        
                        {/* Video Stats */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-xs text-gray-400">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(video.created_at)}
                            </div>
                            {video.is_shared === 1 && (
                              <Badge variant="secondary" className="text-xs">
                                <Globe className="h-3 w-3 mr-1" />
                                Shared
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex justify-between text-xs text-gray-400">
                            <div className="flex items-center gap-1">
                              <HardDrive className="h-3 w-3" />
                              {formatFileSize(video.file_size)}
                            </div>
                            {video.duration && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDuration(video.duration)}
                              </div>
                            )}
                      </div>
                    </div>
                    
                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            onClick={() => downloadVideo(video)}
                            disabled={downloadingVideoId === video.id}
                            className="flex-1 bg-purple-600 hover:bg-purple-700"
                          >
                            {downloadingVideoId === video.id ? (
                              <div className="animate-spin h-3 w-3 border border-white border-t-transparent rounded-full" />
                            ) : (
                              <Download className="h-3 w-3 mr-1" />
                            )}
                            Download
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleSharing(video)}
                            className="border-white/20 hover:bg-white/10"
                          >
                            {video.is_shared === 1 ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </Button>
                          
                        <Button
                          size="sm"
                            variant="outline"
                            onClick={() => deleteVideo(video.id)}
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                        >
                            <Trash2 className="h-3 w-3" />
                        </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                          </div>
                        )}

              {/* List View */}
              {viewMode === 'list' && (
                <div className="space-y-2">
                  {paginatedVideos.map((video) => (
                    <Card 
                      key={video.id} 
                      className={`bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-200 ${
                        selectedVideos.has(video.id) ? 'ring-2 ring-purple-500 bg-purple-500/10' : ''
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <input
                            type="checkbox"
                            checked={selectedVideos.has(video.id)}
                            onChange={() => toggleVideoSelection(video.id)}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          
                          <div 
                            className="w-16 h-10 bg-gray-800 rounded flex items-center justify-center cursor-pointer hover:bg-gray-700 transition-colors flex-shrink-0"
                            onClick={() => playVideo(video)}
                          >
                            <Play className="h-4 w-4 text-gray-400" />
                      </div>

                          <div className="flex-1 min-w-0">
                            {editingVideoId === video.id ? (
                              <div className="flex gap-2 items-center">
                                <Input
                                  value={editingTitle}
                                  onChange={(e) => setEditingTitle(e.target.value)}
                                  className="bg-white/10 border-white/20"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveTitle(video.id);
                                    if (e.key === 'Escape') cancelEdit();
                                  }}
                                  autoFocus
                                />
                                <Button size="sm" onClick={() => saveTitle(video.id)}>
                                  <Save className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={cancelEdit}>
                                  <X className="h-4 w-4" />
                                </Button>
                        </div>
                      ) : (
                              <div>
                                <h3 className="font-medium text-white truncate">{video.title}</h3>
                                <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                                  <span>{formatDateFull(video.created_at)}</span>
                                  <span>{formatFileSize(video.file_size)}</span>
                                  {video.duration && <span>{formatDuration(video.duration)}</span>}
                                  {video.is_shared === 1 && (
                                    <Badge variant="secondary" className="text-xs">
                                      <Globe className="h-3 w-3 mr-1" />
                                      Shared
                                    </Badge>
                                  )}
                                </div>
                        </div>
                      )}
                          </div>

                          <div className="flex gap-2 flex-shrink-0">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => playVideo(video)}
                              className="hover:bg-white/10"
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEditingTitle(video)}
                              className="hover:bg-white/10"
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                        <Button
                          size="sm"
                          onClick={() => downloadVideo(video)}
                          disabled={downloadingVideoId === video.id}
                              className="bg-purple-600 hover:bg-purple-700"
                        >
                          {downloadingVideoId === video.id ? (
                                <div className="animate-spin h-4 w-4 border border-white border-t-transparent rounded-full" />
                          ) : (
                                <Download className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleSharing(video)}
                              className="border-white/20 hover:bg-white/10"
                        >
                              {video.is_shared === 1 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          size="sm"
                              variant="outline"
                          onClick={() => deleteVideo(video.id)}
                              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                        >
                              <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-4">
                  <div className="text-sm text-gray-400">
                    Showing {(currentPage - 1) * videosPerPage + 1} to {Math.min(currentPage * videosPerPage, filteredAndSortedVideos.length)} of {filteredAndSortedVideos.length} videos
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="border-white/20 hover:bg-white/10"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className={currentPage === pageNum ? "bg-purple-600" : "border-white/20 hover:bg-white/10"}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="border-white/20 hover:bg-white/10"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Video Modal */}
      {playingVideoId && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl mx-auto">
            <Button
              className="absolute -top-12 right-0 bg-white/10 hover:bg-white/20"
              onClick={closeVideoModal}
            >
              <X className="h-4 w-4" />
            </Button>
            
            {(() => {
              const video = videos.find(v => v.id === playingVideoId);
              if (!video) return null;
              
              return (
                <div className="bg-black rounded-lg overflow-hidden">
                  <video
                    src={video.uploadthing_url}
                    controls
                    autoPlay
                    className="w-full max-h-[80vh]"
                    onError={(e) => {
                      console.error('Video playback error:', e);
                      alert('Error playing video. The file might be corrupted or in an unsupported format.');
                    }}
                  />
                  <div className="p-4 border-t border-gray-700">
                    <h3 className="font-semibold text-white mb-2">{video.title}</h3>
                    <div className="flex gap-4 text-sm text-gray-400">
                      <span>{formatDateFull(video.created_at)}</span>
                      <span>{formatFileSize(video.file_size)}</span>
                      {video.duration && <span>{formatDuration(video.duration)}</span>}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
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