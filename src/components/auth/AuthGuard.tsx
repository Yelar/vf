'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { status, data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Add debug logging for production
    if (process.env.NODE_ENV === 'production') {
      console.log('AuthGuard - Status:', status);
      console.log('AuthGuard - Session:', session?.user?.email || 'No session');
    }

    if (status === 'unauthenticated') {
      console.log('AuthGuard - Redirecting to signin');
      router.push('/auth/signin');
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-primary animate-spin" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Loading...</h2>
                <p className="text-muted-foreground">
                  Checking your authentication status
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
} 