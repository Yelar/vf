'use client';

import { useEffect } from 'react';
import { signOut } from 'next-auth/react';

interface ApiError {
  status?: number;
  code?: string;
  message?: string;
}

interface ApiErrorHandlerProps {
  error: ApiError;
  onRetry?: () => void;
}

export function handleApiError(error: ApiError, router?: { push: (url: string) => void }) {
  if (error?.status === 401 || error?.code === 'AUTHENTICATION_REQUIRED') {
    // User is not authenticated, redirect to signin
    if (router) {
      router.push('/auth/signin');
    } else {
      window.location.href = '/auth/signin';
    }
    return true; // Handled
  }
  return false; // Not handled
}

export function ApiErrorHandler({ error, onRetry }: ApiErrorHandlerProps) {
  useEffect(() => {
    if (error?.status === 401 || error?.code === 'AUTHENTICATION_REQUIRED') {
      // Auto-redirect to signin on auth errors
      setTimeout(() => {
        signOut({ callbackUrl: '/auth/signin' });
      }, 2000);
    }
  }, [error]);

  if (error?.status === 401 || error?.code === 'AUTHENTICATION_REQUIRED') {
    return (
      <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
        <div className="font-medium">Authentication Required</div>
        <div className="text-xs mt-1">
          Your session has expired. Redirecting to sign in...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
      <div className="font-medium">Error</div>
      <div className="text-xs mt-1">
        {error?.message || 'An unexpected error occurred'}
      </div>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="text-xs underline mt-2 hover:no-underline"
        >
          Try again
        </button>
      )}
    </div>
  );
} 