'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

import { UploadButton } from '@uploadthing/react';
import type { OurFileRouter } from '@/lib/uploadthing';
import { 
  Upload, 
  Trash2, 
  Edit3, 
  Plus, 
  Video, 
  Music, 
  Settings, 
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Database
} from "lucide-react";

interface BackgroundVideo {
  _id: string;
  name: string;
  description?: string;
  uploadthing_url: string;
  uploadthing_key: string;
  file_size: number;
  duration?: number;
  category: string;
  tags: string[];
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface BackgroundMusic {
  _id: string;
  name: string;
  description?: string;
  uploadthing_url: string;
  uploadthing_key: string;
  file_size: number;
  duration?: number;
  category: string;
  tags: string[];
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

type UploadResponse = {
  url: string;
  key: string;
  name: string;
  size: number;
}[];

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [backgroundVideos, setBackgroundVideos] = useState<BackgroundVideo[]>([]);
  const [backgroundMusic, setBackgroundMusic] = useState<BackgroundMusic[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const [isLoadingMusic, setIsLoadingMusic] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [isUploadingMusic, setIsUploadingMusic] = useState(false);
  const [activeTab, setActiveTab] = useState<'videos' | 'music'>('videos');
  const [showAddVideoDialog, setShowAddVideoDialog] = useState(false);
  const [showAddMusicDialog, setShowAddMusicDialog] = useState(false);
  const [editingVideo, setEditingVideo] = useState<BackgroundVideo | null>(null);
  const [editingMusic, setEditingMusic] = useState<BackgroundMusic | null>(null);

  // Form states for adding/editing
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'general',
    tags: '',
    is_active: true
  });

  // Check if user is admin
  const isAdmin = session?.user?.email === 'elarysertaj@gmail.com';

  useEffect(() => {
    if (isAdmin) {
      fetchBackgroundVideos();
      fetchBackgroundMusic();
    }
  }, [isAdmin]);

  const fetchBackgroundVideos = async () => {
    try {
      setIsLoadingVideos(true);
      const response = await fetch('/api/background-videos');
      if (!response.ok) throw new Error('Failed to fetch videos');
      const data = await response.json();
      setBackgroundVideos(data.videos || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setIsLoadingVideos(false);
    }
  };

  const fetchBackgroundMusic = async () => {
    try {
      setIsLoadingMusic(true);
      const response = await fetch('/api/background-music');
      if (!response.ok) throw new Error('Failed to fetch music');
      const data = await response.json();
      setBackgroundMusic(data.music || []);
    } catch (error) {
      console.error('Error fetching music:', error);
    } finally {
      setIsLoadingMusic(false);
    }
  };

  const handleBackgroundVideoUploadComplete = (res: UploadResponse) => {
    if (!res?.[0]?.url) {
      console.error('No valid upload response received');
      return;
    }

    console.log('🎬 Background video upload response:', res[0]);

    saveBackgroundVideoToDatabase({
      url: res[0].url,
      key: res[0].key,
      name: formData.name || res[0].name,
      size: res[0].size
    });
  };

  const handleBackgroundMusicUploadComplete = (res: UploadResponse) => {
    if (!res?.[0]?.url) {
      console.error('No valid upload response received');
      return;
    }

    console.log('🎵 Background music upload response:', res[0]);

    saveBackgroundMusicToDatabase({
      url: res[0].url,
      key: res[0].key,
      name: formData.name || res[0].name,
      size: res[0].size
    });
  };

  const saveBackgroundVideoToDatabase = async (file: { url: string; key: string; name: string; size: number }) => {
    try {
      setIsUploadingVideo(true);
      const response = await fetch('/api/background-videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: file.name,
          description: formData.description || `Uploaded background video: ${file.name}`,
          uploadthingUrl: file.url,
          uploadthingKey: file.key,
          fileSize: file.size,
          category: formData.category || 'general',
          tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : ['uploaded']
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to save background video');
      }

      const data = await response.json();
      console.log('✅ Background video saved:', data.video);
      await fetchBackgroundVideos();
      resetForm();
      setShowAddVideoDialog(false);
    } catch (error) {
      console.error('Error saving background video:', error);
      alert('Failed to save background video. Please try again.');
    } finally {
      setIsUploadingVideo(false);
    }
  };

  const saveBackgroundMusicToDatabase = async (file: { url: string; key: string; name: string; size: number }) => {
    try {
      setIsUploadingMusic(true);
      const response = await fetch('/api/background-music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: file.name,
          description: formData.description || `Uploaded background music: ${file.name}`,
          uploadthingUrl: file.url,
          uploadthingKey: file.key,
          fileSize: file.size,
          category: formData.category || 'general',
          tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : ['uploaded']
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to save background music');
      }

      const data = await response.json();
      console.log('✅ Background music saved:', data.music);
      await fetchBackgroundMusic();
      resetForm();
      setShowAddMusicDialog(false);
    } catch (error) {
      console.error('Error saving background music:', error);
      alert('Failed to save background music. Please try again.');
    } finally {
      setIsUploadingMusic(false);
    }
  };

  const deleteBackgroundVideo = async (videoId: string) => {
    if (!confirm('Are you sure you want to delete this background video?')) return;

    try {
      const response = await fetch(`/api/background-videos/${videoId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete background video');

      console.log('✅ Background video deleted');
      await fetchBackgroundVideos();
    } catch (error) {
      console.error('Error deleting background video:', error);
      alert('Failed to delete background video. Please try again.');
    }
  };

  const deleteBackgroundMusic = async (musicId: string) => {
    if (!confirm('Are you sure you want to delete this background music?')) return;

    try {
      const response = await fetch(`/api/background-music/${musicId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete background music');

      console.log('✅ Background music deleted');
      await fetchBackgroundMusic();
    } catch (error) {
      console.error('Error deleting background music:', error);
      alert('Failed to delete background music. Please try again.');
    }
  };

  const updateBackgroundVideo = async (videoId: string) => {
    try {
      const response = await fetch(`/api/background-videos/${videoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          category: formData.category,
          tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
          is_active: formData.is_active
        }),
      });

      if (!response.ok) throw new Error('Failed to update background video');

      console.log('✅ Background video updated');
      await fetchBackgroundVideos();
      resetForm();
      setEditingVideo(null);
    } catch (error) {
      console.error('Error updating background video:', error);
      alert('Failed to update background video. Please try again.');
    }
  };

  const updateBackgroundMusic = async (musicId: string) => {
    try {
      const response = await fetch(`/api/background-music/${musicId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          category: formData.category,
          tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
          is_active: formData.is_active
        }),
      });

      if (!response.ok) throw new Error('Failed to update background music');

      console.log('✅ Background music updated');
      await fetchBackgroundMusic();
      resetForm();
      setEditingMusic(null);
    } catch (error) {
      console.error('Error updating background music:', error);
      alert('Failed to update background music. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'general',
      tags: '',
      is_active: true
    });
  };

  const startEditingVideo = (video: BackgroundVideo) => {
    setEditingVideo(video);
    setFormData({
      name: video.name,
      description: video.description || '',
      category: video.category,
      tags: video.tags.join(', '),
      is_active: video.is_active
    });
  };

  const startEditingMusic = (music: BackgroundMusic) => {
    setEditingMusic(music);
    setFormData({
      name: music.name,
      description: music.description || '',
      category: music.category,
      tags: music.tags.join(', '),
      is_active: music.is_active
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Show access denied if not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-400 mb-6">
            You don&apos;t have permission to access the admin panel. 
            Only authorized administrators can view this page.
          </p>
          <Button onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-xl bg-black/30">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Admin Panel</h1>
                <p className="text-sm text-gray-400">
                  Manage background videos and music
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-green-400 border-green-500/30">
                <CheckCircle className="w-3 h-3 mr-1" />
                Admin Access
              </Badge>
              <Button variant="ghost" onClick={() => window.history.back()}>
                Back to App
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-lg flex items-center justify-center">
                  <Video className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{backgroundVideos.length}</p>
                  <p className="text-xs text-gray-400">Background Videos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-pink-500/20 to-rose-500/20 rounded-lg flex items-center justify-center">
                  <Music className="w-5 h-5 text-pink-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{backgroundMusic.length}</p>
                  <p className="text-xs text-gray-400">Background Music</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {backgroundVideos.filter(v => v.is_active).length + backgroundMusic.filter(m => m.is_active).length}
                  </p>
                  <p className="text-xs text-gray-400">Active Items</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg flex items-center justify-center">
                  <Database className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {formatFileSize(
                      backgroundVideos.reduce((acc, v) => acc + v.file_size, 0) +
                      backgroundMusic.reduce((acc, m) => acc + m.file_size, 0)
                    )}
                  </p>
                  <p className="text-xs text-gray-400">Total Storage</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-white/5 rounded-lg p-1 mb-8">
          <Button
            variant={activeTab === 'videos' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('videos')}
            className="flex-1"
          >
            <Video className="w-4 h-4 mr-2" />
            Background Videos ({backgroundVideos.length})
          </Button>
          <Button
            variant={activeTab === 'music' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('music')}
            className="flex-1"
          >
            <Music className="w-4 h-4 mr-2" />
            Background Music ({backgroundMusic.length})
          </Button>
        </div>

        {/* Content */}
        {activeTab === 'videos' ? (
          <div className="space-y-6">
            {/* Add Video Button */}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Background Videos</h2>
              <Button onClick={() => setShowAddVideoDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Video
              </Button>
            </div>

            {/* Videos List */}
            {isLoadingVideos ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-gray-400">Loading videos...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {backgroundVideos.map((video) => (
                  <Card key={video._id} className="bg-white/5 border-white/10">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-white">{video.name}</h3>
                            <p className="text-sm text-gray-400">{video.description}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEditingVideo(video)}
                            >
                              <Edit3 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteBackgroundVideo(video._id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={video.is_active ? 'default' : 'secondary'}>
                              {video.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                            <Badge variant="outline">{video.category}</Badge>
                          </div>

                          <div className="text-xs text-gray-400 space-y-1">
                            <p>Size: {formatFileSize(video.file_size)}</p>
                            {video.duration && <p>Duration: {video.duration.toFixed(1)}s</p>}
                            <p>Created: {formatDate(video.created_at)}</p>
                          </div>

                          {video.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {video.tags.map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Add Music Button */}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Background Music</h2>
              <Button onClick={() => setShowAddMusicDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Music
              </Button>
            </div>

            {/* Music List */}
            {isLoadingMusic ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-gray-400">Loading music...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {backgroundMusic.map((music) => (
                  <Card key={music._id} className="bg-white/5 border-white/10">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-white">{music.name}</h3>
                            <p className="text-sm text-gray-400">{music.description}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEditingMusic(music)}
                            >
                              <Edit3 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteBackgroundMusic(music._id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={music.is_active ? 'default' : 'secondary'}>
                              {music.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                            <Badge variant="outline">{music.category}</Badge>
                          </div>

                          <div className="text-xs text-gray-400 space-y-1">
                            <p>Size: {formatFileSize(music.file_size)}</p>
                            {music.duration && <p>Duration: {music.duration.toFixed(1)}s</p>}
                            <p>Created: {formatDate(music.created_at)}</p>
                          </div>

                          {music.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {music.tags.map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Add Video Dialog */}
        {showAddVideoDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <Card className="w-full max-w-md mx-4 bg-white/10 border-white/20 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Plus className="w-5 h-5" />
                  Add Background Video
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Upload a new background video
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-white">Video File</Label>
                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center">
                    <UploadButton<OurFileRouter, "backgroundVideoUploader">
                      endpoint="backgroundVideoUploader"
                      onClientUploadComplete={handleBackgroundVideoUploadComplete}
                      onUploadError={(error: Error) => {
                        console.error('❌ Upload error:', error);
                        alert(`Upload failed: ${error.message}`);
                      }}
                      appearance={{
                        button: "bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md",
                        allowedContent: "text-gray-400 text-sm"
                      }}
                    />
                    <p className="text-gray-400 text-sm mt-2">
                      MP4, WebM, or MOV files (max 64MB)
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="Enter video name"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white resize-none"
                    rows={2}
                    placeholder="Enter description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white">Category</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="nature">Nature</SelectItem>
                        <SelectItem value="abstract">Abstract</SelectItem>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="lifestyle">Lifestyle</SelectItem>
                        <SelectItem value="gaming">Gaming</SelectItem>
                        <SelectItem value="sports">Sports</SelectItem>
                        <SelectItem value="music">Music</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Status</Label>
                    <Select value={formData.is_active.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, is_active: value === 'true' }))}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Active</SelectItem>
                        <SelectItem value="false">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Tags (comma-separated)</Label>
                  <Input
                    value={formData.tags}
                    onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="tag1, tag2, tag3"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowAddVideoDialog(false);
                      resetForm();
                    }}
                    className="flex-1 text-gray-400 hover:text-white"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => setShowAddVideoDialog(false)}
                    disabled={isUploadingVideo}
                    className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                  >
                    {isUploadingVideo ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Video
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Add Music Dialog */}
        {showAddMusicDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <Card className="w-full max-w-md mx-4 bg-white/10 border-white/20 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Plus className="w-5 h-5" />
                  Add Background Music
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Upload a new background music
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-white">Music File</Label>
                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center">
                    <UploadButton<OurFileRouter, "backgroundMusicUploader">
                      endpoint="backgroundMusicUploader"
                      onClientUploadComplete={handleBackgroundMusicUploadComplete}
                      onUploadError={(error: Error) => {
                        console.error('❌ Upload error:', error);
                        alert(`Upload failed: ${error.message}`);
                      }}
                      appearance={{
                        button: "bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-md",
                        allowedContent: "text-gray-400 text-sm"
                      }}
                    />
                    <p className="text-gray-400 text-sm mt-2">
                      MP3, WAV, or audio files (max 32MB)
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="Enter music name"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white resize-none"
                    rows={2}
                    placeholder="Enter description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white">Category</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="ambient">Ambient</SelectItem>
                        <SelectItem value="electronic">Electronic</SelectItem>
                        <SelectItem value="classical">Classical</SelectItem>
                        <SelectItem value="jazz">Jazz</SelectItem>
                        <SelectItem value="rock">Rock</SelectItem>
                        <SelectItem value="pop">Pop</SelectItem>
                        <SelectItem value="hip-hop">Hip-Hop</SelectItem>
                        <SelectItem value="folk">Folk</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Status</Label>
                    <Select value={formData.is_active.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, is_active: value === 'true' }))}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Active</SelectItem>
                        <SelectItem value="false">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Tags (comma-separated)</Label>
                  <Input
                    value={formData.tags}
                    onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="tag1, tag2, tag3"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowAddMusicDialog(false);
                      resetForm();
                    }}
                    className="flex-1 text-gray-400 hover:text-white"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => setShowAddMusicDialog(false)}
                    disabled={isUploadingMusic}
                    className="flex-1 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700"
                  >
                    {isUploadingMusic ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Music
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Edit Video Dialog */}
        {editingVideo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <Card className="w-full max-w-md mx-4 bg-white/10 border-white/20 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Edit3 className="w-5 h-5" />
                  Edit Background Video
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Update video information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-white">Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="Enter video name"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white resize-none"
                    rows={2}
                    placeholder="Enter description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white">Category</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="nature">Nature</SelectItem>
                        <SelectItem value="abstract">Abstract</SelectItem>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="lifestyle">Lifestyle</SelectItem>
                        <SelectItem value="gaming">Gaming</SelectItem>
                        <SelectItem value="sports">Sports</SelectItem>
                        <SelectItem value="music">Music</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Status</Label>
                    <Select value={formData.is_active.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, is_active: value === 'true' }))}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Active</SelectItem>
                        <SelectItem value="false">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Tags (comma-separated)</Label>
                  <Input
                    value={formData.tags}
                    onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="tag1, tag2, tag3"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setEditingVideo(null);
                      resetForm();
                    }}
                    className="flex-1 text-gray-400 hover:text-white"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => updateBackgroundVideo(editingVideo._id)}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                  >
                    <Edit3 className="mr-2 h-4 w-4" />
                    Update Video
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Edit Music Dialog */}
        {editingMusic && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <Card className="w-full max-w-md mx-4 bg-white/10 border-white/20 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Edit3 className="w-5 h-5" />
                  Edit Background Music
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Update music information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-white">Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="Enter music name"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white resize-none"
                    rows={2}
                    placeholder="Enter description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white">Category</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="ambient">Ambient</SelectItem>
                        <SelectItem value="electronic">Electronic</SelectItem>
                        <SelectItem value="classical">Classical</SelectItem>
                        <SelectItem value="jazz">Jazz</SelectItem>
                        <SelectItem value="rock">Rock</SelectItem>
                        <SelectItem value="pop">Pop</SelectItem>
                        <SelectItem value="hip-hop">Hip-Hop</SelectItem>
                        <SelectItem value="folk">Folk</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Status</Label>
                    <Select value={formData.is_active.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, is_active: value === 'true' }))}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Active</SelectItem>
                        <SelectItem value="false">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Tags (comma-separated)</Label>
                  <Input
                    value={formData.tags}
                    onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="tag1, tag2, tag3"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setEditingMusic(null);
                      resetForm();
                    }}
                    className="flex-1 text-gray-400 hover:text-white"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => updateBackgroundMusic(editingMusic._id)}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                  >
                    <Edit3 className="mr-2 h-4 w-4" />
                    Update Music
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
} 