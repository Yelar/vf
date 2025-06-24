import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    console.log('\n🧪 === UPLOADTHING CONNECTION TEST ===');
    
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`👤 User: ${session.user.email}`);

    // Check environment variables
    const token = process.env.UPLOADTHING_TOKEN;
    if (!token) {
      console.error('❌ UPLOADTHING_TOKEN is missing');
      return NextResponse.json({ 
        error: 'UPLOADTHING_TOKEN environment variable is missing',
        help: 'Get your V7 token from https://uploadthing.com/dashboard → API Keys → V7 tab'
      }, { status: 500 });
    }

    console.log(`✅ UPLOADTHING_TOKEN found (length: ${token.length})`);

    // Test if it's a valid V7 token (should be base64 encoded JSON)
    try {
      const decoded = atob(token);
      const tokenData = JSON.parse(decoded);
      
      console.log(`✅ Valid V7 token format detected`);
      console.log(`📦 Token contains: ${Object.keys(tokenData).join(', ')}`);
      
      if (!tokenData.apiKey || !tokenData.appId) {
        throw new Error('Token missing required fields');
      }
    } catch (decodeError) {
      console.error('❌ Invalid token format - not a valid V7 token');
      return NextResponse.json({ 
        error: 'Invalid UPLOADTHING_TOKEN format',
        help: 'Ensure you are using a V7 token (base64 encoded JSON) from the V7 tab in UploadThing dashboard'
      }, { status: 500 });
    }

    // Test UTApi initialization
    let utapiTest = false;
    try {
      const { UTApi } = await import("uploadthing/server");
      const utapi = new UTApi({ logLevel: 'Info' });
      console.log(`✅ UTApi initialized successfully`);
      utapiTest = true;
    } catch (error) {
      console.error('❌ Failed to initialize UTApi:', error);
    }

    // Test a simple API call (list files with limit 1)
    let apiTest = false;
    let fileCount = 0;
    try {
      const { UTApi } = await import("uploadthing/server");
      const utapi = new UTApi({ logLevel: 'Info' });
      
      console.log(`🌐 Testing UploadThing API connection...`);
      const result = await utapi.listFiles({ limit: 1 });
      
      if (result && Array.isArray(result.files)) {
        fileCount = result.files.length;
        console.log(`✅ API connection successful - found ${fileCount} files`);
        apiTest = true;
      } else {
        console.log(`⚠️ API returned unexpected format:`, result);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ API test failed:', errorMessage);
    }

    // Return test results
    const results = {
      timestamp: new Date().toISOString(),
      user: session.user.email,
      tests: {
        tokenPresent: !!token,
        tokenFormat: token ? 'v7' : 'missing',
        utapiInit: utapiTest,
        apiConnection: apiTest,
        fileCount: fileCount
      },
      status: utapiTest && apiTest ? 'healthy' : 'issues_detected',
      message: utapiTest && apiTest 
        ? 'UploadThing is configured correctly and working!'
        : 'UploadThing has configuration or connectivity issues'
    };

    console.log(`📊 Test Results:`, results);
    console.log(`🎯 Overall Status: ${results.status}`);

    return NextResponse.json(results);

  } catch (error) {
    console.error('💥 Test endpoint error:', error);
    return NextResponse.json({ 
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 