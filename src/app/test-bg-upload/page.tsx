'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadButton } from '@uploadthing/react';
import type { OurFileRouter } from '@/lib/uploadthing';

export default function TestBgUploadPage() {
  const [backgroundVideos, setBackgroundVideos] = useState<any[]>([]);
  const [backgroundMusic, setBackgroundMusic] = useState<any[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const [isLoadingMusic, setIsLoadingMusic] = useState(false);

  useEffect(() => {
    fetchBackgroundVideos();
    fetchBackgroundMusic();
  }, []);

  const fetchBackgroundVideos = async () => {
    try {
      setIsLoadingVideos(true);
      const response = await fetch('/api/background-videos?active=true');
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
      const response = await fetch('/api/background-music?active=true');
      if (!response.ok) throw new Error('Failed to fetch music');
      const data = await response.json();
      setBackgroundMusic(data.music || []);
    } catch (error) {
      console.error('Error fetching music:', error);
    } finally {
      setIsLoadingMusic(false);
    }
  };

  const handleBackgroundVideoUploadComplete = (files: any) => {
    if (files.length > 0) {
      const file = files[0];
      console.log('🎬 Background video uploaded:', file);
      saveBackgroundVideoToDatabase(file);
    }
  };

  const handleBackgroundMusicUploadComplete = (files: any) => {
    if (files.length > 0) {
      const file = files[0];
      console.log('🎵 Background music uploaded:', file);
      saveBackgroundMusicToDatabase(file);
    }
  };

  const saveBackgroundVideoToDatabase = async (file: any) => {
    try {
      const response = await fetch('/api/background-videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: file.name.replace(/\.[^/.]+$/, ''),
          description: `Uploaded background video: ${file.name}`,
          uploadthingUrl: file.url,
          uploadthingKey: file.key,
          fileSize: file.size,
          category: 'general',
          tags: ['uploaded']
        }),
      });

      if (!response.ok) throw new Error('Failed to save background video');

      const data = await response.json();
      console.log('✅ Background video saved:', data.video);
      await fetchBackgroundVideos();
    } catch (error) {
      console.error('Error saving background video:', error);
      alert('Failed to save background video. Please try again.');
    }
  };

  const saveBackgroundMusicToDatabase = async (file: any) => {
    try {
      const response = await fetch('/api/background-music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: file.name.replace(/\.[^/.]+$/, ''),
          description: `Uploaded background music: ${file.name}`,
          uploadthingUrl: file.url,
          uploadthingKey: file.key,
          fileSize: file.size,
          category: 'general',
          tags: ['uploaded']
        }),
      });

      if (!response.ok) throw new Error('Failed to save background music');

      const data = await response.json();
      console.log('✅ Background music saved:', data.music);
      await fetchBackgroundMusic();
    } catch (error) {
      console.error('Error saving background music:', error);
      alert('Failed to save background music. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center">Background Upload Test</h1>
        
        {/* Background Videos */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle>🎬 Background Videos</CardTitle>
            <CardDescription>Test background video upload and management</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
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

            <div className="space-y-2">
              <h3 className="font-medium">Uploaded Videos ({backgroundVideos.length})</h3>
              {isLoadingVideos ? (
                <p className="text-gray-400">Loading...</p>
              ) : (
                <div className="space-y-2">
                  {backgroundVideos.map((video) => (
                    <div key={video._id} className="p-3 bg-white/5 rounded border border-white/10">
                      <p className="font-medium">{video.name}</p>
                      <p className="text-sm text-gray-400">{video.description}</p>
                      <p className="text-xs text-gray-500">Size: {(video.file_size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Background Music */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle>🎵 Background Music</CardTitle>
            <CardDescription>Test background music upload and management</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
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

            <div className="space-y-2">
              <h3 className="font-medium">Uploaded Music ({backgroundMusic.length})</h3>
              {isLoadingMusic ? (
                <p className="text-gray-400">Loading...</p>
              ) : (
                <div className="space-y-2">
                  {backgroundMusic.map((music) => (
                    <div key={music._id} className="p-3 bg-white/5 rounded border border-white/10">
                      <p className="font-medium">{music.name}</p>
                      <p className="text-sm text-gray-400">{music.description}</p>
                      <p className="text-xs text-gray-500">Size: {(music.file_size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button onClick={() => window.history.back()}>
            Back to Video Creator
          </Button>
        </div>
      </div>
    </div>
  );
} 