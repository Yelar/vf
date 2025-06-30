export function validateS3Config() {
  const required = [
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY', 
    'AWS_S3_REGION',
    'AWS_S3_BUCKET_NAME'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required S3 environment variables: ${missing.join(', ')}`);
  }
  
  console.log('✅ S3 configuration validated successfully');
} 