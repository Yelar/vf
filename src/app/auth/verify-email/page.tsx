'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, XCircle, VideoIcon, ArrowRight, Mail, RefreshCw, AlertCircle, Loader2 } from "lucide-react";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setVerificationStatus('error');
      setMessage('Invalid verification link. No token provided.');
      return;
    }

    verifyEmail(token);
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    try {
      const response = await fetch(`/api/auth/verify-email?token=${verificationToken}`);
      const data = await response.json();

      if (response.ok) {
        setVerificationStatus('success');
        setMessage(data.message);
        setUserEmail(data.user?.email || '');
        
        // Redirect to sign in after success
        setTimeout(() => {
          router.push('/auth/signin?verified=true');
        }, 3000);
      } else {
        setVerificationStatus('error');
        setMessage(data.message || data.error || 'Email verification failed');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationStatus('error');
      setMessage('An unexpected error occurred during verification');
    }
  };

  const handleResendVerification = async () => {
    if (!userEmail) {
      setResendMessage('No email address available for resending');
      return;
    }

    setResendLoading(true);
    setResendMessage('');

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: userEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        setResendMessage('Verification email sent successfully! Please check your inbox.');
      } else {
        setResendMessage(data.message || data.error || 'Failed to resend verification email');
      }
    } catch (error) {
      console.error('Resend error:', error);
      setResendMessage('An error occurred while resending the verification email');
    } finally {
      setResendLoading(false);
    }
  };

  const renderContent = () => {
    if (verificationStatus === 'loading') {
      return (
        <Card className="w-full max-w-md bg-white/5 border-white/10 backdrop-blur-xl">
          <CardContent className="pt-8">
            <div className="text-center space-y-6">
              <div className="mx-auto w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <Loader2 className="h-10 w-10 text-white animate-spin" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white">Verifying Email...</h2>
                <p className="text-gray-300 mt-3 text-lg">
                  Please wait while we verify your email address
                </p>
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-75"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-150"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (verificationStatus === 'success') {
      return (
        <Card className="w-full max-w-md bg-white/5 border-white/10 backdrop-blur-xl">
          <CardContent className="pt-8">
            <div className="text-center space-y-6">
              <div className="mx-auto w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white">Email Verified!</h2>
                <p className="text-gray-300 mt-3 text-lg">
                  {message}
                </p>
                <p className="text-gray-400 mt-2 text-sm">
                  Redirecting to sign in in 3 seconds...
                </p>
              </div>
              <div className="space-y-4">
                <Button 
                  onClick={() => router.push('/auth/signin')}
                  className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-lg font-semibold"
                >
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Continue to Sign In
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Error state
    return (
      <Card className="w-full max-w-md bg-white/5 border-white/10 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white text-xl">
            <div className="w-6 h-6 bg-gradient-to-r from-red-500 to-pink-500 rounded flex items-center justify-center">
              <XCircle className="h-3 w-3 text-white" />
            </div>
            Verification Failed
          </CardTitle>
          <CardDescription className="text-gray-400">
            There was an issue verifying your email address
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Verification Error</span>
              </div>
              <p className="text-xs">{message}</p>
            </div>

            {userEmail && (
              <div className="space-y-3">
                <p className="text-sm text-gray-300">
                  Need a new verification email?
                </p>
                
                {resendMessage && (
                  <div className={`px-4 py-3 rounded-lg text-sm backdrop-blur-sm ${
                    resendMessage.includes('successfully') 
                      ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                      : 'bg-red-500/10 border border-red-500/20 text-red-400'
                  }`}>
                    {resendMessage}
                  </div>
                )}

                <Button 
                  onClick={handleResendVerification}
                  disabled={resendLoading}
                  variant="outline"
                  className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  {resendLoading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Resend Verification Email
                    </>
                  )}
                </Button>
              </div>
            )}

            <Separator className="bg-white/20" />

            <div className="space-y-3">
              <Button 
                onClick={() => router.push('/auth/signup')}
                variant="outline"
                className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                Try Creating Account Again
              </Button>
              
              <Button 
                onClick={() => router.push('/')}
                variant="ghost"
                className="w-full text-gray-400 hover:text-white hover:bg-white/10"
              >
                Back to Home
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(120,119,198,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(120,119,198,0.1),transparent_50%)]"></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                <VideoIcon className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                VFS
              </h1>
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-white">Email Verification</h2>
              <p className="text-gray-400 text-lg">
                Confirming your email address
              </p>
            </div>
          </div>

          {/* Content */}
          {renderContent()}

          {/* Footer */}
          <div className="text-center">
            <p className="text-sm text-gray-400">
              Need help?{" "}
              <Link 
                href="/" 
                className="text-purple-400 hover:text-purple-300 font-medium hover:underline transition-colors"
              >
                Contact Support
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 