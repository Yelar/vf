'use client';

import React, { useState } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { NavigationHeader } from '@/components/ui/navigation-header';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  RefreshCw,
  AlertTriangle,
  Info
} from "lucide-react";

interface TestResult {
  timestamp: string;
  user: string;
  tests: {
    tokenPresent: boolean;
    tokenFormat: string;
    utapiInit: boolean;
    apiConnection: boolean;
    fileCount: number;
  };
  status: 'healthy' | 'issues_detected';
  message: string;
}

export default function TestUploadThing() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runTest = async () => {
    setTesting(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/test-uploadthing');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Test failed');
      }

      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setTesting(false);
    }
  };

  const StatusIcon = ({ test }: { test: boolean }) => {
    return test ? (
      <CheckCircle className="h-5 w-5 text-green-600" />
    ) : (
      <XCircle className="h-5 w-5 text-red-600" />
    );
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <NavigationHeader />
        
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                🧪 UploadThing Connection Test
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Test your UploadThing configuration and connectivity to diagnose any issues with file uploads and downloads.
              </p>
            </div>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  About This Test
                </CardTitle>
                <CardDescription>
                  This diagnostic tool checks your UploadThing configuration and connectivity. 
                  Run this test if you&apos;re experiencing upload timeouts, download issues, or configuration errors.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• Validates your UploadThing V7 token format and presence</p>
                  <p>• Tests API connectivity to UploadThing servers</p>
                  <p>• Checks if the UTApi can be initialized properly</p>
                  <p>• Verifies basic file listing functionality</p>
                </div>
              </CardContent>
            </Card>

            <div className="text-center mb-8">
              <Button 
                onClick={runTest} 
                disabled={testing}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700"
              >
                {testing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Running Tests...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-5 w-5" />
                    Run Connection Test
                  </>
                )}
              </Button>
            </div>

            {error && (
              <Card className="mb-8 border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="text-red-800 flex items-center gap-2">
                    <XCircle className="h-5 w-5" />
                    Test Failed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-red-700">{error}</p>
                  {error.includes('UPLOADTHING_TOKEN') && (
                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-yellow-800 font-medium">Quick Fix:</p>
                      <p className="text-yellow-700 text-sm mt-1">
                        Get your V7 token from{' '}
                        <a 
                          href="https://uploadthing.com/dashboard" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          UploadThing Dashboard
                        </a>
                        {' '}→ API Keys → V7 tab, then add it to your .env.local file.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {results && (
              <Card className={`border-2 ${results.status === 'healthy' ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${results.status === 'healthy' ? 'text-green-800' : 'text-yellow-800'}`}>
                    {results.status === 'healthy' ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : (
                      <AlertTriangle className="h-6 w-6" />
                    )}
                    Test Results
                    <Badge variant={results.status === 'healthy' ? 'default' : 'secondary'}>
                      {results.status === 'healthy' ? 'Healthy' : 'Issues Detected'}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Test completed at {new Date(results.timestamp).toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className={`font-medium ${results.status === 'healthy' ? 'text-green-700' : 'text-yellow-700'}`}>
                      {results.message}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900">Configuration Tests</h4>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Token Present</span>
                          <StatusIcon test={results.tests.tokenPresent} />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Token Format</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {results.tests.tokenFormat}
                            </span>
                            <StatusIcon test={results.tests.tokenFormat === 'v7'} />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900">Connectivity Tests</h4>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm">UTApi Initialization</span>
                          <StatusIcon test={results.tests.utapiInit} />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm">API Connection</span>
                          <StatusIcon test={results.tests.apiConnection} />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Files Accessible</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {results.tests.fileCount} files
                            </span>
                            <StatusIcon test={results.tests.fileCount >= 0} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {results.status !== 'healthy' && (
                      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2">Troubleshooting Steps:</h4>
                        <ul className="text-sm text-blue-800 space-y-1">
                          {!results.tests.tokenPresent && (
                            <li>• Add UPLOADTHING_TOKEN to your .env.local file</li>
                          )}
                          {results.tests.tokenFormat !== 'v7' && (
                            <li>• Update to a V7 token from UploadThing dashboard</li>
                          )}
                          {!results.tests.utapiInit && (
                            <li>• Check that uploadthing package is properly installed</li>
                          )}
                          {!results.tests.apiConnection && (
                            <li>• Verify your internet connection and UploadThing service status</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500">
                If you continue experiencing issues after all tests pass, check the browser console for additional error details.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
} 