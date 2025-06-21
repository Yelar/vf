'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { LogIn, Mail, Lock, VideoIcon, ArrowRight, Bot } from "lucide-react";

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        // Get session to ensure user is authenticated
        const session = await getSession();
        if (session) {
          router.push('/dashboard');
        }
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
      console.error('Sign in error:', error);
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
              <h2 className="text-3xl font-bold text-white">Welcome Back</h2>
              <p className="text-gray-400 text-lg">
                Sign in to continue creating viral AI videos
              </p>
            </div>
          </div>

          {/* Sign In Form */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white text-xl">
                <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded flex items-center justify-center">
                  <LogIn className="h-3 w-3 text-white" />
                </div>
                Sign In
              </CardTitle>
              <CardDescription className="text-gray-400">
                Enter your credentials to access VFS Studio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm backdrop-blur-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2 text-white">
                    <Mail className="h-4 w-4 text-purple-400" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    disabled={isLoading}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-500/50 focus:ring-purple-500/25"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-2 text-white">
                    <Lock className="h-4 w-4 text-purple-400" />
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    disabled={isLoading}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-500/50 focus:ring-purple-500/25"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-lg font-semibold shadow-lg shadow-purple-500/25" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <LogIn className="mr-2 h-5 w-5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-5 w-5" />
                      Sign In to VFS
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6">
                <Separator className="bg-white/20" />
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-400">
                    Don&apos;t have an account?{" "}
                    <Link 
                      href="/auth/signup" 
                      className="text-purple-400 hover:text-purple-300 font-medium hover:underline transition-colors"
                    >
                      Create Account
                    </Link>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Features Preview */}
          <Card className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-purple-500/30 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="text-center space-y-3">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Bot className="h-5 w-5 text-purple-400" />
                  <h3 className="font-semibold text-white">AI-Powered Video Creation</h3>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">
                  Generate viral YouTube Shorts with AI content, premium voice synthesis, 
                  and perfect timing - all in seconds
                </p>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-75"></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse delay-150"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 