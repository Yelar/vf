'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { LimitWarning } from '@/components/ui/limit-warning';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NavigationHeader } from '@/components/ui/navigation-header';
import { 
  User, 
  Key, 
  Mail, 
  Calendar, 
  Zap,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface LimitInfo {
  remaining: number;
  total: number;
  resetDate: Date;
}

interface PasswordChangeForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const [limitInfo, setLimitInfo] = useState<LimitInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showWarning, setShowWarning] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordForm, setPasswordForm] = useState<PasswordChangeForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    const fetchLimitInfo = async () => {
      try {
        const response = await fetch('/api/user/limit-info');
        if (!response.ok) {
          throw new Error('Failed to fetch limit info');
        }
        const data = await response.json();
        setLimitInfo({
          remaining: data.remaining,
          total: data.total,
          resetDate: new Date(data.resetDate)
        });
        
        if (data.remaining === 0) {
          setShowWarning(true);
        }
      } catch (error) {
        console.error('Error fetching limit info:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user) {
      fetchLimitInfo();
    }
  }, [session]);

  const handlePasswordChange = async () => {
    setPasswordError(null);
    setPasswordSuccess(false);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return;
    }

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      setPasswordSuccess(true);
      setTimeout(() => {
        setShowPasswordDialog(false);
        setPasswordSuccess(false);
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }, 2000);
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : 'Failed to change password');
    }
  };

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-purple-950/50">
        <NavigationHeader />
        <div className="container mx-auto px-4 py-20">
          <Card className="max-w-md mx-auto p-8 text-center bg-black/50 backdrop-blur-xl border-white/10">
            <AlertCircle className="w-12 h-12 text-purple-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Authentication Required</h1>
            <p className="text-gray-400 mb-6">Please sign in to view your profile</p>
            <Button asChild className="bg-purple-600 hover:bg-purple-700">
              <a href="/auth/signin">Sign In</a>
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-purple-950/50">
      <NavigationHeader />
      <LimitWarning 
        show={showWarning} 
        onClose={() => setShowWarning(false)}
      />
      
      <main className="container mx-auto px-4 py-12">
        {/* Profile Header */}
        <div className="max-w-3xl mx-auto mb-12 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full mx-auto mb-6 flex items-center justify-center">
            <User className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-purple-300 to-blue-400 bg-clip-text text-transparent mb-2">
            {session.user.name}
          </h1>
          <p className="text-gray-400 flex items-center justify-center gap-2">
            <Mail className="w-4 h-4" />
            {session.user.email}
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Account Info Card */}
            <Card className="p-6 bg-black/50 backdrop-blur-xl border-white/10 h-full">
              <div className="flex items-start gap-4 h-full">
                <div className="p-3 bg-blue-500/10 rounded-xl">
                  <User className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-white mb-1">Account Information</h2>
                  <p className="text-gray-400 text-sm mb-6">Your account details and preferences</p>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-white">Email Address</p>
                          <p className="text-sm text-gray-400">{session.user.email}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
                        Verified
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-white">Member Since</p>
                          <p className="text-sm text-gray-400">January 2024</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Key className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-white">Password</p>
                          <p className="text-sm text-gray-400">Last changed 30 days ago</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        className="bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20"
                        onClick={() => setShowPasswordDialog(true)}
                      >
                        Change Password
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Generation Limit Card */}
            <Card className="p-6 bg-black/50 backdrop-blur-xl border-white/10 h-full">
              <div className="flex items-start gap-4 h-full">
                <div className="p-3 bg-purple-500/10 rounded-xl">
                  <Zap className="w-6 h-6 text-purple-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-white mb-1">Generation Limit</h2>
                  <p className="text-gray-400 text-sm mb-6">Your monthly AI content generation allowance</p>
                  
                  {isLoading ? (
                    <div className="animate-pulse space-y-4">
                      <div className="h-4 bg-gray-800 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-800 rounded w-1/2"></div>
                    </div>
                  ) : limitInfo ? (
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-gray-300">Remaining Generations</span>
                          <motion.span 
                            className={`font-medium ${limitInfo.remaining === 0 ? 'text-red-400' : 'text-purple-400'}`}
                            animate={limitInfo.remaining === 0 ? {
                              scale: [1, 1.1, 1],
                              color: ['#f87171', '#ef4444', '#f87171']
                            } : {}}
                            transition={{ repeat: Infinity, duration: 2 }}
                          >
                            {limitInfo.remaining}/{limitInfo.total}
                          </motion.span>
                        </div>
                        <Progress 
                          value={(limitInfo.remaining / limitInfo.total) * 100} 
                          className={`h-2 ${limitInfo.remaining === 0 ? 'bg-red-950' : 'bg-purple-950'}`}
                        />
                        <p className="text-sm text-gray-500 mt-2">
                          Resets on {limitInfo.resetDate.toLocaleDateString()}
                        </p>
                      </div>

                      <div className="mt-6 p-4 bg-purple-500/5 rounded-lg border border-purple-500/10">
                        <h3 className="font-medium text-purple-400 mb-3">What counts towards the limit?</h3>
                        <ul className="text-sm text-gray-400 grid gap-2">
                          <li className="flex items-center gap-2">
                            <div className="w-1 h-1 bg-purple-400 rounded-full"></div>
                            Post Generation
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-1 h-1 bg-purple-400 rounded-full"></div>
                            Educational Content Creation
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-1 h-1 bg-purple-400 rounded-full"></div>
                            Quiz Generation
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-1 h-1 bg-purple-400 rounded-full"></div>
                            Text-to-Speech Conversion
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-1 h-1 bg-purple-400 rounded-full"></div>
                            Video Rendering
                          </li>
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <p className="text-red-400 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Failed to load limit information
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Password Change Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="bg-gray-900/95 backdrop-blur-xl border-white/10">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Change Password</DialogTitle>
            <DialogDescription className="text-gray-400">
              Enter your current password and choose a new one
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {passwordError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <p className="text-sm">{passwordError}</p>
              </div>
            )}

            {passwordSuccess && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2 text-green-400">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <p className="text-sm">Password changed successfully!</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm text-gray-400">Current Password</label>
              <Input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                className="bg-black/50 border-white/10 focus:border-purple-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-400">New Password</label>
              <Input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                className="bg-black/50 border-white/10 focus:border-purple-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-400">Confirm New Password</label>
              <Input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="bg-black/50 border-white/10 focus:border-purple-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowPasswordDialog(false)}
              className="bg-white/5 hover:bg-white/10 border-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePasswordChange}
              className="bg-purple-600 hover:bg-purple-700"
              disabled={!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
            >
              Change Password
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 