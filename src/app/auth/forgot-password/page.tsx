'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Mail, ArrowLeft, VideoIcon, Key, Send, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setEmailSent(true);
      } else {
        setError(data.error || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
      console.error('Forgot password error:', error);
    } finally {
      setIsLoading(false);
    }
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
              <h2 className="text-3xl font-bold text-white">Reset Password</h2>
              <p className="text-gray-400 text-lg">
                {emailSent ? 'Check your email for reset instructions' : 'Enter your email to receive a reset link'}
              </p>
            </div>
          </div>

          {/* Forgot Password Form */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white text-xl">
                <div className="w-6 h-6 bg-gradient-to-r from-red-500 to-orange-500 rounded flex items-center justify-center">
                  <Key className="h-3 w-3 text-white" />
                </div>
                {emailSent ? 'Email Sent' : 'Forgot Password'}
              </CardTitle>
              <CardDescription className="text-gray-400">
                                 {emailSent 
                   ? 'We&apos;ve sent you a password reset link if your account exists'
                   : 'No worries! Enter your email and we&apos;ll help you reset your password'
                 }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {emailSent ? (
                <div className="space-y-6">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle className="w-8 h-8 text-green-400" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-white">Check Your Email</h3>
                      <p className="text-sm text-gray-400">
                        If an account with <span className="text-purple-400 font-medium">{email}</span> exists, 
                        you&apos;ll receive a password reset link within a few minutes.
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 px-4 py-3 rounded-lg text-sm backdrop-blur-sm">
                    <p className="font-medium mb-1">🔒 Didn&apos;t receive the email?</p>
                    <p className="text-xs text-blue-300">
                      Check your spam folder or wait a few minutes before requesting another reset.
                    </p>
                  </div>

                  <Button 
                    onClick={() => {
                      setEmailSent(false);
                      setEmail('');
                      setMessage('');
                      setError('');
                    }}
                    variant="outline"
                    className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Try Different Email
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm backdrop-blur-sm">
                      {error}
                    </div>
                  )}

                  {message && (
                    <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-lg text-sm backdrop-blur-sm">
                      {message}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2 text-white">
                      <Mail className="h-4 w-4 text-purple-400" />
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      required
                      disabled={isLoading}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-500/50 focus:ring-purple-500/25"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white text-lg font-semibold shadow-lg shadow-red-500/25" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Send className="mr-2 h-5 w-5 animate-spin" />
                        Sending Reset Link...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-5 w-5" />
                        Send Reset Link
                      </>
                    )}
                  </Button>
                </form>
              )}

              <div className="mt-6">
                <Separator className="bg-white/20" />
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-400">
                    Remember your password?{" "}
                    <Link 
                      href="/auth/signin" 
                      className="text-purple-400 hover:text-purple-300 font-medium hover:underline transition-colors inline-flex items-center gap-1"
                    >
                      <ArrowLeft className="h-3 w-3" />
                      Back to Sign In
                    </Link>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Notice */}
          <Card className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border-yellow-500/30 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="text-center space-y-3">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Key className="h-5 w-5 text-yellow-400" />
                  <h3 className="font-semibold text-white">Security Notice</h3>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">
                  Password reset links expire after 1 hour for security. 
                                     If you didn&apos;t request this reset, please ignore any emails you receive.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 