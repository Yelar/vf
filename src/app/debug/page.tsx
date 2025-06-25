'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

export default function DebugPage() {
  const { data: session, status } = useSession();
  const [testResult, setTestResult] = useState<any>(null);

  const testSession = async () => {
    try {
      const response = await fetch('/api/auth/test-session');
      const data = await response.json();
      setTestResult(data);
    } catch (error) {
      setTestResult({ error: 'Failed to test session' });
    }
  };

  useEffect(() => {
    testSession();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Debug Session</h1>
      
      <div className="space-y-6">
        <div className="bg-gray-900 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Client Session</h2>
          <p><strong>Status:</strong> {status}</p>
          <p><strong>User:</strong> {session?.user?.email || 'None'}</p>
          <p><strong>Name:</strong> {session?.user?.name || 'None'}</p>
          <p><strong>ID:</strong> {session?.user?.id || 'None'}</p>
        </div>

        <div className="bg-gray-900 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Server Session Test</h2>
          <pre className="bg-gray-800 p-4 rounded overflow-auto">
            {JSON.stringify(testResult, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-900 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Environment</h2>
          <p><strong>NODE_ENV:</strong> {process.env.NODE_ENV}</p>
          <p><strong>NEXTAUTH_URL:</strong> {process.env.NEXTAUTH_URL}</p>
        </div>

        <button 
          onClick={testSession}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
        >
          Test Session Again
        </button>
      </div>
    </div>
  );
} 