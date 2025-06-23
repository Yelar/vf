'use client';

import React, { useState } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { NavigationHeader } from '@/components/ui/navigation-header';
import { ModernCard, ModernCardContent } from '@/components/ui/modern-card';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Brain, 
  Upload, 
  FileText, 
  Trash2, 
  Loader2, 
  CheckCircle, 
  XCircle,
  Clock,
  Play,
  FileIcon,
  UploadCloud
} from "lucide-react";
import { UploadButton } from '@uploadthing/react';
import type { OurFileRouter } from '@/lib/uploadthing';

interface QuizItem {
  type: 'question' | 'text';
  question_text?: string;
  choices?: { A: string; B: string; C: string; D: string };
  wait_time?: number;
  answer?: 'A' | 'B' | 'C' | 'D';
  content?: string;
}

interface QuizResponse {
  success: boolean;
  quiz: QuizItem[];
  topic: string;
  metadata: {
    questionCount: number;
    textSegments: number;
    totalSegments: number;
    difficulty: string;
    processingTimeMs?: number;
  };
}

interface UploadedFile {
  key: string;
  url: string;
  name: string;
  type: string;
  size: number;
}

function QuizTestContent() {
  const [topic, setTopic] = useState('');
  const [questionCount, setQuestionCount] = useState(5);
  const [difficulty, setDifficulty] = useState('intermediate');
  const [additionalContent, setAdditionalContent] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (files: any[]) => {
    const newFiles = files.map(file => ({
      key: file.key,
      url: file.url,
      name: file.name,
      type: file.type || 'unknown',
      size: file.size
    }));
    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (keyToRemove: string) => {
    setUploadedFiles(prev => prev.filter(file => file.key !== keyToRemove));
  };

  const generateQuiz = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setQuizResult(null);

    try {
      console.log('🧪 Starting quiz generation test...');
      console.log('📝 Request data:', {
        topic,
        questionCount,
        difficulty,
        additionalContent,
        uploadedFiles: uploadedFiles.length
      });

      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          questionCount,
          difficulty,
          additionalContent: additionalContent.trim() || null,
          uploadedFiles
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Failed to generate quiz');
      }

      const data: QuizResponse = await response.json();
      console.log('✅ Quiz generated successfully:', data);
      setQuizResult(data);

    } catch (err) {
      console.error('❌ Quiz generation error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <NavigationHeader />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <Brain className="h-8 w-8 text-blue-400" />
              <h1 className="text-3xl font-bold">Quiz Generation Test</h1>
            </div>
            <p className="text-gray-400">Test the quiz generation API with file uploads and various parameters</p>
          </div>

          {/* Configuration Form */}
          <ModernCard>
            <ModernCardContent className="space-y-6">
              <h2 className="text-xl font-semibold flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Quiz Configuration</span>
              </h2>

              {/* Basic Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="topic">Topic *</Label>
                  <Input
                    id="topic"
                    placeholder="e.g., JavaScript Fundamentals, Machine Learning, History..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="questionCount">Number of Questions</Label>
                  <Select value={questionCount.toString()} onValueChange={(value) => setQuestionCount(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 Questions</SelectItem>
                      <SelectItem value="5">5 Questions</SelectItem>
                      <SelectItem value="7">7 Questions</SelectItem>
                      <SelectItem value="10">10 Questions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty Level</Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* File Upload */}
              <div className="space-y-4">
                <Label>Upload Reference Files (Optional)</Label>
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
                  <UploadButton<OurFileRouter, "quizContentUploader">
                    endpoint="quizContentUploader"
                    onClientUploadComplete={(res) => {
                      console.log('📎 Files uploaded:', res);
                      if (res) handleFileUpload(res);
                    }}
                    onUploadError={(error: Error) => {
                      console.error('❌ Upload error:', error);
                      setError(`Upload failed: ${error.message}`);
                    }}
                    appearance={{
                      button: "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md",
                      allowedContent: "text-gray-400 text-sm"
                    }}
                  />
                  <p className="text-gray-400 text-sm mt-2">
                    PDFs, text files, and documents (up to 32MB each)
                  </p>
                </div>

                {/* Uploaded Files List */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    <Label>Uploaded Files ({uploadedFiles.length})</Label>
                    <div className="space-y-2">
                      {uploadedFiles.map((file) => (
                        <div key={file.key} className="flex items-center justify-between bg-gray-800 p-3 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <FileIcon className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium">{file.name}</p>
                              <p className="text-xs text-gray-400">
                                {file.type} • {formatFileSize(file.size)}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeFile(file.key)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Content */}
              <div className="space-y-2">
                <Label htmlFor="additionalContent">Additional Context (Optional)</Label>
                <Textarea
                  id="additionalContent"
                  placeholder="Enter any additional context, instructions, or specific requirements for the quiz..."
                  value={additionalContent}
                  onChange={(e) => setAdditionalContent(e.target.value)}
                  rows={4}
                />
              </div>

              {/* Generate Button */}
              <Button
                onClick={generateQuiz}
                disabled={isGenerating || !topic.trim()}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Quiz...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Generate Quiz
                  </>
                )}
              </Button>
            </ModernCardContent>
          </ModernCard>

          {/* Error Display */}
          {error && (
            <ModernCard>
              <ModernCardContent>
                <div className="flex items-center space-x-2 text-red-400">
                  <XCircle className="h-5 w-5" />
                  <h3 className="font-semibold">Error</h3>
                </div>
                <p className="text-red-300 mt-2">{error}</p>
              </ModernCardContent>
            </ModernCard>
          )}

          {/* Quiz Result Display */}
          {quizResult && (
            <ModernCard>
              <ModernCardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-green-400">
                    <CheckCircle className="h-5 w-5" />
                    <h3 className="font-semibold">Quiz Generated Successfully</h3>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-400">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">
                      {quizResult.metadata.processingTimeMs ? 
                        `${quizResult.metadata.processingTimeMs}ms` : 
                        'Processing time not available'
                      }
                    </span>
                  </div>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="bg-gray-800 p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold text-blue-400">{quizResult.metadata.totalSegments}</p>
                    <p className="text-xs text-gray-400">Total Segments</p>
                  </div>
                  <div className="bg-gray-800 p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-400">{quizResult.metadata.questionCount}</p>
                    <p className="text-xs text-gray-400">Questions</p>
                  </div>
                  <div className="bg-gray-800 p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold text-purple-400">{quizResult.metadata.textSegments}</p>
                    <p className="text-xs text-gray-400">Text Segments</p>
                  </div>
                  <div className="bg-gray-800 p-3 rounded-lg text-center">
                    <p className="text-xl font-bold text-orange-400 capitalize">{quizResult.metadata.difficulty}</p>
                    <p className="text-xs text-gray-400">Difficulty</p>
                  </div>
                  <div className="bg-gray-800 p-3 rounded-lg text-center">
                    <p className="text-lg font-bold text-cyan-400">{quizResult.metadata.estimatedDuration}</p>
                    <p className="text-xs text-gray-400">Est. Duration</p>
                  </div>
                </div>

                {/* Quiz Content */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold">Generated Quiz Content</h4>
                  {quizResult.quiz.map((item, index) => (
                    <div key={index} className="border border-gray-700 rounded-lg p-4">
                      {item.type === 'text' ? (
                        <div className="space-y-2">
                          <Badge variant="secondary">Text Segment {index + 1}</Badge>
                          <p className="text-gray-300">{item.content}</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Badge variant="default">Question {index + 1}</Badge>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline">Answer: {item.answer}</Badge>
                              <Badge variant="outline">{item.wait_time}s wait</Badge>
                            </div>
                          </div>
                          <p className="font-medium text-white">{item.question_text}</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {item.choices && Object.entries(item.choices).map(([key, value]) => (
                              <div 
                                key={key} 
                                className={`p-2 rounded border ${
                                  item.answer === key 
                                    ? 'border-green-500 bg-green-500/10 text-green-300' 
                                    : 'border-gray-600 bg-gray-800'
                                }`}
                              >
                                <span className="font-bold">{key}:</span> {value}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Raw JSON (for debugging) */}
                <details className="space-y-2">
                  <summary className="cursor-pointer text-gray-400 hover:text-white">
                    View Raw JSON (for debugging)
                  </summary>
                  <pre className="bg-gray-900 p-4 rounded-lg text-xs overflow-auto text-gray-300">
                    {JSON.stringify(quizResult, null, 2)}
                  </pre>
                </details>
              </ModernCardContent>
            </ModernCard>
          )}
        </div>
      </div>
    </div>
  );
}

export default function QuizTestPage() {
  return (
    <AuthGuard>
      <QuizTestContent />
    </AuthGuard>
  );
} 