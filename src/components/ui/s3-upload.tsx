import React, { useState, useRef } from 'react';
import { Upload, X, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { Button } from './button';

interface S3UploadProps {
  onUploadComplete: (result: { url: string; key: string; name: string; size: number }) => void;
  onUploadError?: (error: string) => void;
  accept?: string;
  maxSize?: number;
  type: 'video' | 'music';
}

export function S3Upload({
  onUploadComplete,
  onUploadError,
  accept = 'video/mp4,video/webm,video/quicktime',
  maxSize = 64 * 1024 * 1024, // 64MB default
  type
}: S3UploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    // Reset states
    setError(null);
    setSelectedFile(null);

    // Validate file type
    const isValidType = file.type.match(type === 'video' ? /^video\// : /^audio\//);
    if (!isValidType) {
      setError(`Invalid file type. Please upload a ${type} file.`);
      return;
    }

    // Validate file size
    if (file.size > maxSize) {
      setError(`File too large. Maximum size is ${maxSize / 1024 / 1024}MB`);
      return;
    }

    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('type', type);

      const response = await fetch('/api/upload-s3', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Upload failed');
      }

      onUploadComplete(data.data);
      setSelectedFile(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed';
      setError(message);
      onUploadError?.(message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-gray-600'}
          ${error ? 'border-red-500 bg-red-500/10' : ''}
          ${selectedFile && !error ? 'border-green-500 bg-green-500/10' : ''}
        `}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
          }}
        />

        <div className="space-y-4">
          {selectedFile ? (
            <>
              <CheckCircle className="w-8 h-8 mx-auto text-green-500" />
              <div>
                <p className="text-white font-medium">{selectedFile.name}</p>
                <p className="text-sm text-gray-400">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)}MB
                </p>
              </div>
            </>
          ) : error ? (
            <>
              <AlertCircle className="w-8 h-8 mx-auto text-red-500" />
              <p className="text-red-400">{error}</p>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 mx-auto text-gray-500" />
              <div>
                <p className="text-gray-400">
                  Drop your {type} file here, or click to browse
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {type === 'video' ? 'MP4, WebM, or MOV files' : 'MP3 or WAV files'} (max {maxSize / 1024 / 1024}MB)
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {selectedFile && !error && (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedFile(null);
            }}
            disabled={isUploading}
          >
            <X className="w-4 h-4 mr-1" />
            Cancel
          </Button>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              handleUpload();
            }}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
} 