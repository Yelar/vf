import { NextResponse } from 'next/server';
import { uploadToS3, deleteFromS3, fileExistsInS3, listS3Files } from '@/lib/s3';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    console.log('\n🧪 === S3 CONNECTION TEST ===');
    
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`👤 User: ${session.user.email}`);

    // Test 1: Environment variables
    const requiredVars = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_S3_REGION', 'AWS_S3_BUCKET_NAME'];
    const missingVars = requiredVars.filter(key => !process.env[key]);
    
    if (missingVars.length > 0) {
      console.error('❌ Missing environment variables:', missingVars);
      return NextResponse.json({ 
        error: 'Missing environment variables',
        missing: missingVars
      }, { status: 500 });
    }
    
    console.log('✅ All environment variables present');

    // Test 2: Upload test file
    const testBuffer = Buffer.from(`S3 Test File - ${new Date().toISOString()}`, 'utf-8');
    const testKey = `test/${Date.now()}-test.txt`;
    
    console.log('📤 Testing S3 upload...');
    const uploadResult = await uploadToS3(testBuffer, testKey, 'text/plain', {
      testFile: 'true',
      uploadedBy: session.user.email || 'unknown'
    });
    
    console.log('✅ Upload successful:', uploadResult);

    // Test 3: Check file exists
    console.log('🔍 Testing file existence check...');
    const exists = await fileExistsInS3(testKey);
    console.log('✅ File exists:', exists);

    // Test 4: List files
    console.log('📋 Testing file listing...');
    const files = await listS3Files('test/', 5);
    console.log(`✅ Found ${files.length} test files`);

    // Test 5: Delete test file
    console.log('🗑️ Testing file deletion...');
    const deleted = await deleteFromS3(testKey);
    console.log('✅ File deleted:', deleted);

    // Return test results
    const results = {
      timestamp: new Date().toISOString(),
      user: session.user.email,
      bucket: process.env.AWS_S3_BUCKET_NAME,
      region: process.env.AWS_S3_REGION,
      tests: {
        environmentVariables: true,
        upload: !!uploadResult,
        fileExists: exists,
        listFiles: files.length >= 0,
        delete: deleted
      },
      uploadResult,
      fileCount: files.length,
      status: 'healthy',
      message: 'S3 is configured correctly and working!'
    };

    console.log('📊 Test Results:', results);
    return NextResponse.json(results);

  } catch (error) {
    console.error('💥 S3 test failed:', error);
    return NextResponse.json({ 
      error: 'S3 test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      status: 'failed'
    }, { status: 500 });
  }
} 