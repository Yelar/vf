import { 
  S3Client, 
  PutObjectCommand, 
  DeleteObjectCommand, 
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Validate environment variables
const validateEnv = () => {
  const required = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_S3_REGION', 'AWS_S3_BUCKET_NAME'];
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required S3 environment variables: ${missing.join(', ')}`);
  }
};

// Validate on module load
validateEnv();

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  }
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;

export interface UploadResult {
  url: string;
  key: string;
  size: number;
}

/**
 * Upload a file buffer to S3
 */
export async function uploadToS3(
  buffer: Buffer,
  key: string,
  contentType: string = 'application/octet-stream',
  metadata?: Record<string, string>
): Promise<UploadResult> {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      Metadata: metadata,
      ACL: 'public-read',
    });

    await s3Client.send(command);
    
    // Construct the URL using the bucket's virtual-hosted-style URL
    const region = process.env.AWS_S3_REGION;
    const url = `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${key}`;
    
    return {
      url,
      key,
      size: buffer.length,
    };
  } catch (error) {
    console.error('S3 upload error:', error);
    throw new Error(`Failed to upload to S3: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete a file from S3
 */
export async function deleteFromS3(key: string): Promise<boolean> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
    console.log(`✅ Successfully deleted ${key} from S3`);
    return true;
  } catch (error) {
    console.error('❌ S3 delete error:', error);
    return false;
  }
}

/**
 * Check if a file exists in S3
 */
export async function fileExistsInS3(key: string): Promise<boolean> {
  try {
    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate a presigned URL for temporary access
 */
export async function generatePresignedUrl(
  key: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    console.error('Presigned URL generation error:', error);
    throw new Error(`Failed to generate presigned URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Upload video with retry logic (replacement for UploadThing function)
 */
export async function uploadVideoToS3(
  videoBuffer: Buffer,
  filename: string,
  folder: string = 'videos'
): Promise<{ url: string; key: string } | null> {
  const maxRetries = 3;
  const key = `${folder}/${Date.now()}-${filename.replace(/[^a-z0-9.-]/gi, '-').toLowerCase()}`;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📤 S3 upload attempt ${attempt}/${maxRetries}`);
      console.log(`📁 File: ${filename}`);
      console.log(`📏 Size: ${(videoBuffer.length / 1024 / 1024).toFixed(2)}MB`);
      
      const uploadStartTime = Date.now();
      
      const result = await uploadToS3(
        videoBuffer,
        key,
        'video/mp4',
        {
          originalName: filename,
          uploadedAt: new Date().toISOString(),
          fileType: 'video',
        }
      );
      
      const uploadDuration = Date.now() - uploadStartTime;
      console.log(`⏱️ Upload completed in ${uploadDuration}ms`);
      console.log(`✅ S3 upload successful:`);
      console.log(`🔗 URL: ${result.url}`);
      console.log(`🔑 Key: ${result.key}`);
      
      return {
        url: result.url,
        key: result.key,
      };
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ S3 upload attempt ${attempt} failed:`, errorMessage);
      
      if (attempt === maxRetries) {
        console.error(`💥 All ${maxRetries} upload attempts failed`);
        return null;
      }
      
      // Wait before retry (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      console.log(`⏳ Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return null;
}

/**
 * Upload audio file to S3
 */
export async function uploadAudioToS3(
  audioBuffer: Buffer,
  filename: string
): Promise<{ url: string; key: string } | null> {
  const key = `audio/${Date.now()}-${filename.replace(/[^a-z0-9.-]/gi, '-').toLowerCase()}`;
  
  try {
    const result = await uploadToS3(
      audioBuffer,
      key,
      'audio/mpeg',
      {
        originalName: filename,
        uploadedAt: new Date().toISOString(),
        fileType: 'audio',
      }
    );
    
    return {
      url: result.url,
      key: result.key,
    };
  } catch (error) {
    console.error('Audio upload to S3 failed:', error);
    return null;
  }
}

/**
 * Upload background video/music for admin panel
 */
export async function uploadBackgroundAssetToS3(
  buffer: Buffer,
  filename: string,
  type: 'video' | 'music'
): Promise<{ url: string; key: string } | null> {
  const folder = type === 'video' ? 'background-videos' : 'background-music';
  const contentType = type === 'video' ? 'video/mp4' : 'audio/mpeg';
  const key = `${folder}/${Date.now()}-${filename.replace(/[^a-z0-9.-]/gi, '-').toLowerCase()}`;
  
  try {
    const result = await uploadToS3(
      buffer,
      key,
      contentType,
      {
        originalName: filename,
        uploadedAt: new Date().toISOString(),
        fileType: type,
        assetType: 'background',
      }
    );
    
    return {
      url: result.url,
      key: result.key,
    };
  } catch (error) {
    console.error(`${type} upload to S3 failed:`, error);
    return null;
  }
}

/**
 * List files in S3 bucket (for admin management)
 */
export async function listS3Files(prefix?: string, maxKeys: number = 1000) {
  try {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: prefix,
      MaxKeys: maxKeys,
    });

    const response = await s3Client.send(command);
    return response.Contents || [];
  } catch (error) {
    console.error('Error listing S3 files:', error);
    return [];
  }
}

/**
 * Generate unique S3 key for uploads
 */
export function generateS3Key(originalName: string, folder: string = 'uploads'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const cleanName = originalName.replace(/[^a-z0-9.-]/gi, '-').toLowerCase();
  return `${folder}/${timestamp}-${random}-${cleanName}`;
}

/**
 * Get file info from S3
 */
export async function getS3FileInfo(key: string) {
  try {
    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const response = await s3Client.send(command);
    return {
      size: response.ContentLength || 0,
      lastModified: response.LastModified,
      contentType: response.ContentType,
      metadata: response.Metadata,
    };
  } catch (error) {
    console.error('Error getting S3 file info:', error);
    return null;
  }
}

/**
 * Delete multiple files from S3
 */
export async function deleteS3Objects(keys: string[]): Promise<boolean> {
  try {
    // Delete files in parallel
    const deletePromises = keys.map(key => deleteFromS3(key));
    const results = await Promise.all(deletePromises);
    
    // Check if all deletions were successful
    const allSuccessful = results.every(result => result === true);
    
    if (allSuccessful) {
      console.log(`✅ Successfully deleted ${keys.length} files from S3`);
    } else {
      console.warn(`⚠️ Some files could not be deleted from S3`);
    }
    
    return allSuccessful;
  } catch (error) {
    console.error('❌ S3 bulk delete error:', error);
    return false;
  }
} 