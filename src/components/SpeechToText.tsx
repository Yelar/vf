'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, Square, Loader2, AlertCircle } from 'lucide-react';

interface SpeechToTextProps {
  onTranscriptionComplete: (text: string, shouldAppend: boolean) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const SpeechToText: React.FC<SpeechToTextProps> = ({
  onTranscriptionComplete,
  placeholder = "Click microphone to record",
  disabled = false,
  className = "",
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check if browser supports audio recording
  const isSupported = typeof navigator !== 'undefined' && 
                     typeof navigator.mediaDevices !== 'undefined' && 
                     typeof navigator.mediaDevices.getUserMedia !== 'undefined';

  const transcribeAudio = useCallback(async (audioBlob: Blob) => {
    setIsTranscribing(true);
    setError(null);
    
    try {
      console.log('🧠 Starting transcription...');
      
      // Convert to webm format
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch('/api/transcribe-speech', {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to transcribe audio');
      }

      const data = await response.json();
      
      if (data.success && data.text) {
        console.log('✅ Transcription successful:', data.text);
        onTranscriptionComplete(data.text, true); // true means append
      } else {
        throw new Error('No transcription text received');
      }
    } catch (error) {
      console.error('❌ Transcription error:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        setError('Transcription took too long. Please try a shorter recording.');
      } else {
        setError(error instanceof Error ? error.message : 'Failed to transcribe audio');
      }
    } finally {
      setIsTranscribing(false);
    }
  }, [onTranscriptionComplete]);

  const startRecording = useCallback(async () => {
    if (!isSupported) {
      setError('Audio recording is not supported in this browser');
      return;
    }

    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
          channelCount: 1,
        } 
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
          ? 'audio/webm;codecs=opus' 
          : 'audio/webm'
      });

      audioChunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
        
        // Transcribe only after recording is complete
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
          transcribeAudio(audioBlob);
        }
      };

      // Start recording - collect all data at once when stopped
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      // Start duration timer
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      console.log('🎤 Recording started');
    } catch (error) {
      console.error('❌ Failed to start recording:', error);
      setError('Failed to access microphone. Please check permissions.');
    }
  }, [isSupported, transcribeAudio]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
      
      console.log('🛑 Recording stopped');
    }
  }, [isRecording]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isSupported) {
    return (
      <div className={`flex items-center gap-2 text-sm text-gray-400 ${className}`}>
        <AlertCircle className="w-4 h-4" />
        <span>Audio recording not supported</span>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Recording Controls */}
      <div className="flex items-center gap-3">
        {!isRecording ? (
          <Button
            variant="outline"
            size="sm"
            onClick={startRecording}
            disabled={disabled || isTranscribing}
            className="flex items-center gap-2 bg-white/5 border-white/20 text-white hover:bg-white/10"
          >
            <Mic className="w-4 h-4" />
            {isTranscribing ? 'Transcribing...' : 'Record'}
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={stopRecording}
            className="flex items-center gap-2 bg-red-500/20 border-red-500/30 text-red-300 hover:bg-red-500/30"
          >
            <Square className="w-4 h-4" />
            Stop Recording
          </Button>
        )}

        {/* Recording Status */}
        {isRecording && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-red-300 font-mono">
                {formatDuration(recordingDuration)}
              </span>
            </div>
            <Badge variant="outline" className="bg-red-500/20 text-red-300 border-red-500/30">
              Recording
            </Badge>
          </div>
        )}

        {/* Transcribing Status */}
        {isTranscribing && (
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
            <Badge variant="outline" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
              Transcribing...
            </Badge>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span className="text-sm text-red-300">{error}</span>
        </div>
      )}

      {/* Help Text */}
      {!isRecording && !isTranscribing && (
        <p className="text-xs text-gray-400">
          🎤 {placeholder}. Speak clearly for best results.
        </p>
      )}
    </div>
  );
}; 