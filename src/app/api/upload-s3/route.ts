import { NextRequest, NextResponse } from 'next/server';
// import { uploadBackgroundAssetToS3 } from '@/lib/s3';
import { auth } from '@/lib/auth';

// Allowed file types by category
const ALLOWED_TYPES = {
  video: ['video/mp4', 'video/webm', 'video/quicktime'],
  music: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
};

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Admin check (same as UploadThing had)
    if (session.user.email !== 'elarysertaj@gmail.com') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    // Parse form data
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];
    const type = formData.get('type') as string || 'document'; // Default to document type if not specified
    
    if (!files || files.length === 0) {
      return NextResponse.json({ success: false, error: 'No files provided' }, { status: 400 });
    }

    // Validate file sizes (512MB limit to match UploadThing settings)
    const maxSize = 512 * 1024 * 1024; // 512MB
    for (const file of files) {
      if (file.size > maxSize) {
        return NextResponse.json({ 
          success: false, 
          error: `File ${file.name} is too large. Maximum size is ${maxSize / 1024 / 1024}MB` 
        }, { status: 400 });
      }
    }

    const uploadedFiles = [];

    for (const file of files) {
      // Determine asset type and validate file type
      let assetType = type;
      let isValidType = false;

      if (type === 'document') {
        isValidType = ALLOWED_TYPES.document.includes(file.type);
      } else if (type === 'video') {
        isValidType = ALLOWED_TYPES.video.includes(file.type);
      } else if (type === 'music') {
        isValidType = ALLOWED_TYPES.music.includes(file.type);
      } else {
        // Auto-detect type
        if (ALLOWED_TYPES.video.includes(file.type)) {
          assetType = 'video';
          isValidType = true;
        } else if (ALLOWED_TYPES.music.includes(file.type)) {
          assetType = 'music';
          isValidType = true;
        } else if (ALLOWED_TYPES.document.includes(file.type)) {
          assetType = 'document';
          isValidType = true;
        }
      }

      if (!isValidType) {
        return NextResponse.json({ 
          success: false, 
          error: `Invalid file type for ${assetType} upload: ${file.name}. Allowed types: ${ALLOWED_TYPES[assetType as keyof typeof ALLOWED_TYPES].join(', ')}` 
        }, { status: 400 });
      }

      // Convert file to buffer
      const buffer = Buffer.from(await file.arrayBuffer());
      
      console.log(`📤 Uploading ${assetType} to S3: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
      
      // Upload to S3 with proper folder structure
      const folder = assetType === 'document' ? 'quiz-references' : assetType === 'video' ? 'background-videos' : 'background-music';
      const key = `${folder}/${Date.now()}-${file.name.replace(/[^a-z0-9.-]/gi, '-').toLowerCase()}`;
      
      const { uploadToS3 } = await import('@/lib/s3');
      const result = await uploadToS3(
        buffer,
        key,
        file.type,
        {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
          fileType: assetType,
          assetType: assetType === 'document' ? 'quiz-reference' : 'background',
        }
      );
      
      if (!result) {
        return NextResponse.json({ 
          success: false, 
          error: `Upload failed for ${file.name} - please try again` 
        }, { status: 500 });
      }

      console.log(`✅ Successfully uploaded ${assetType} to S3:`, result);

      uploadedFiles.push({
        url: result.url,
        key: result.key,
        name: file.name,
        size: file.size,
        type: assetType
      });
    }

    // Return success response with all uploaded files
    return NextResponse.json({ 
      success: true, 
      files: uploadedFiles
    });

  } catch (error) {
    console.error('S3 upload API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 