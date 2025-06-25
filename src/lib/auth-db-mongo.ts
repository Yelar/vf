import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import connectToDatabase from './mongodb';
import User, { IUser } from './models/User';
import Video, { IVideo } from './models/Video';
import mongoose from 'mongoose';

// Updated interfaces to match MongoDB ObjectId
export interface MongoUser {
  id: string;
  email: string;
  password: string;
  name: string;
  email_verified: boolean;
  verification_token?: string;
  verification_token_expires?: Date;
  password_reset_token?: string;
  password_reset_token_expires?: Date;
  created_at: Date;
}

export interface MongoUserVideo {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  uploadthing_url?: string;
  uploadthing_key?: string;
  file_size: number;
  duration?: number;
  thumbnail_url?: string;
  metadata: object;
  is_shared: boolean;
  created_at: Date;
}

// Lazy connection - only connect when needed
let isConnected = false;

async function ensureConnection() {
  if (!isConnected) {
    await connectToDatabase();
    isConnected = true;
  }
}

// Helper function to convert MongoDB document to interface
function mongoUserToInterface(user: IUser): MongoUser {
  return {
    id: user._id.toString(),
    email: user.email,
    password: user.password,
    name: user.name,
    email_verified: user.email_verified,
    verification_token: user.verification_token || undefined,
    verification_token_expires: user.verification_token_expires || undefined,
    password_reset_token: user.password_reset_token || undefined,
    password_reset_token_expires: user.password_reset_token_expires || undefined,
    created_at: user.created_at,
  };
}

function mongoVideoToInterface(video: IVideo): MongoUserVideo {
  return {
    id: video._id.toString(),
    user_id: video.user_id.toString(),
    title: video.title,
    description: video.description || undefined,
    uploadthing_url: video.uploadthing_url || undefined,
    uploadthing_key: video.uploadthing_key || undefined,
    file_size: video.file_size,
    duration: video.duration || undefined,
    thumbnail_url: video.thumbnail_url || undefined,
    metadata: video.metadata,
    is_shared: video.is_shared,
    created_at: video.created_at,
  };
}

// Initialize database connection
export async function initializeDb() {
  try {
    await connectToDatabase();
    console.log('✅ MongoDB initialized successfully');
  } catch (error) {
    console.error('❌ MongoDB initialization failed:', error);
    throw error;
  }
}

// Create a new user with verification token
export async function createUser(
  email: string,
  password: string,
  name: string,
  verificationToken?: string
): Promise<MongoUser | null> {
  try {
    await ensureConnection();
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Set token expiration to 24 hours from now
    const tokenExpires = verificationToken ? new Date(Date.now() + 24 * 60 * 60 * 1000) : undefined;
    
    const user = new User({
      email,
      password: hashedPassword,
      name,
      verification_token: verificationToken || null,
      verification_token_expires: tokenExpires || null,
    });
    
    const savedUser = await user.save();
    return mongoUserToInterface(savedUser);
  } catch (error) {
    console.error('Error creating user:', error);
    return null;
  }
}

// Get user by email
export async function getUserByEmail(email: string): Promise<MongoUser | null> {
  try {
    await ensureConnection();
    const user = await User.findOne({ email }).exec();
    return user ? mongoUserToInterface(user) : null;
  } catch (error) {
    console.error('Error getting user by email:', error);
    return null;
  }
}

// Get user by ID
export async function getUserById(id: string): Promise<MongoUser | null> {
  try {
    await ensureConnection();
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    const user = await User.findById(id).exec();
    return user ? mongoUserToInterface(user) : null;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return null;
  }
}

// Verify user password
export async function verifyPassword(email: string, password: string): Promise<MongoUser | null> {
  try {
    await ensureConnection();
    const user = await getUserByEmail(email);
    if (!user) return null;
    
    // Check if email is verified
    if (!user.email_verified) {
      throw new Error('EMAIL_NOT_VERIFIED');
    }
    
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return null;
    
    return user;
  } catch (error) {
    console.error('Error verifying password:', error);
    throw error; // Re-throw to preserve error type
  }
}

// Video CRUD operations
export async function createVideo(
  userId: string,
  title: string,
  uploadthingUrl?: string,
  uploadthingKey?: string,
  fileSize?: number,
  metadata?: object,
  description?: string,
  duration?: number,
  thumbnailUrl?: string
): Promise<MongoUserVideo | null> {
  try {
    await ensureConnection();
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }
    
    const video = new Video({
      user_id: new mongoose.Types.ObjectId(userId),
      title,
      description: description || null,
      uploadthing_url: uploadthingUrl || null,
      uploadthing_key: uploadthingKey || null,
      file_size: fileSize || 0,
      duration: duration || null,
      thumbnail_url: thumbnailUrl || null,
      metadata: metadata || {},
    });
    
    const savedVideo = await video.save();
    return mongoVideoToInterface(savedVideo);
  } catch (error) {
    console.error('Error creating video:', error);
    return null;
  }
}

export async function getVideoById(id: string): Promise<MongoUserVideo | null> {
  try {
    await ensureConnection();
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    const video = await Video.findById(id).exec();
    return video ? mongoVideoToInterface(video) : null;
  } catch (error) {
    console.error('Error getting video by ID:', error);
    return null;
  }
}

export async function getVideosByUserId(userId: string): Promise<MongoUserVideo[]> {
  try {
    await ensureConnection();
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return [];
    }
    const videos = await Video.find({ user_id: new mongoose.Types.ObjectId(userId) })
      .sort({ created_at: -1 })
      .exec();
    return videos.map(mongoVideoToInterface);
  } catch (error) {
    console.error('Error getting videos by user ID:', error);
    return [];
  }
}

export async function deleteVideo(id: string, userId: string): Promise<boolean> {
  try {
    await ensureConnection();
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(userId)) {
      return false;
    }
    const result = await Video.deleteOne({ 
      _id: new mongoose.Types.ObjectId(id), 
      user_id: new mongoose.Types.ObjectId(userId) 
    }).exec();
    return result.deletedCount > 0;
  } catch (error) {
    console.error('Error deleting video:', error);
    return false;
  }
}

export async function updateVideoTitle(id: string, userId: string, title: string): Promise<boolean> {
  try {
    await ensureConnection();
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(userId)) {
      return false;
    }
    const result = await Video.updateOne(
      { _id: new mongoose.Types.ObjectId(id), user_id: new mongoose.Types.ObjectId(userId) },
      { title }
    ).exec();
    return result.modifiedCount > 0;
  } catch (error) {
    console.error('Error updating video title:', error);
    return false;
  }
}

// Update complete video record after processing
export async function updateVideo(
  id: string,
  uploadthingUrl: string,
  uploadthingKey: string,
  fileSize: number,
  duration?: number,
  thumbnailUrl?: string
): Promise<boolean> {
  try {
    await ensureConnection();
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return false;
    }
    const result = await Video.updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      {
        uploadthing_url: uploadthingUrl,
        uploadthing_key: uploadthingKey,
        file_size: fileSize,
        duration: duration || null,
        thumbnail_url: thumbnailUrl || null,
      }
    ).exec();
    return result.modifiedCount > 0;
  } catch (error) {
    console.error('Error updating video:', error);
    return false;
  }
}

// Toggle video sharing status
export async function toggleVideoSharing(id: string, userId: string): Promise<boolean> {
  try {
    await ensureConnection();
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(userId)) {
      return false;
    }
    
    // Get current sharing status and toggle it
    const video = await Video.findOne({
      _id: new mongoose.Types.ObjectId(id),
      user_id: new mongoose.Types.ObjectId(userId)
    }).exec();
    
    if (!video) return false;
    
    const result = await Video.updateOne(
      { _id: new mongoose.Types.ObjectId(id), user_id: new mongoose.Types.ObjectId(userId) },
      { is_shared: !video.is_shared }
    ).exec();
    return result.modifiedCount > 0;
  } catch (error) {
    console.error('Error toggling video sharing:', error);
    return false;
  }
}

// Get all shared videos (public)
export async function getSharedVideos(): Promise<(MongoUserVideo & { creator_name: string })[]> {
  try {
    await ensureConnection();
    const videos = await Video.find({ is_shared: true })
      .populate('user_id', 'name')
      .sort({ created_at: -1 })
      .exec();
    
    return videos.map(video => ({
      ...mongoVideoToInterface(video),
      creator_name: (video.user_id as unknown as IUser).name
    }));
  } catch (error) {
    console.error('Error getting shared videos:', error);
    return [];
  }
}

// Get shared video by ID (public access)
export async function getSharedVideoById(id: string): Promise<(MongoUserVideo & { creator_name: string }) | null> {
  try {
    await ensureConnection();
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    const video = await Video.findOne({ _id: new mongoose.Types.ObjectId(id), is_shared: true })
      .populate('user_id', 'name')
      .exec();
    
    if (!video) return null;
    
    return {
      ...mongoVideoToInterface(video),
      creator_name: (video.user_id as unknown as IUser).name
    };
  } catch (error) {
    console.error('Error getting shared video by ID:', error);
    return null;
  }
}

// Email verification functions
export async function getUserByVerificationToken(token: string): Promise<MongoUser | null> {
  try {
    await ensureConnection();
    const user = await User.findOne({
      verification_token: token,
      verification_token_expires: { $gt: new Date() }
    }).exec();
    return user ? mongoUserToInterface(user) : null;
  } catch (error) {
    console.error('Error getting user by verification token:', error);
    return null;
  }
}

export async function verifyUserEmail(userId: string): Promise<boolean> {
  try {
    await ensureConnection();
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return false;
    }
    const result = await User.updateOne(
      { _id: new mongoose.Types.ObjectId(userId) },
      {
        email_verified: true,
        verification_token: null,
        verification_token_expires: null,
      }
    ).exec();
    return result.modifiedCount > 0;
  } catch (error) {
    console.error('Error verifying user email:', error);
    return false;
  }
}

export async function updateVerificationToken(userId: string, token: string): Promise<boolean> {
  try {
    await ensureConnection();
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return false;
    }
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const result = await User.updateOne(
      { _id: new mongoose.Types.ObjectId(userId) },
      {
        verification_token: token,
        verification_token_expires: tokenExpires,
      }
    ).exec();
    return result.modifiedCount > 0;
  } catch (error) {
    console.error('Error updating verification token:', error);
    return false;
  }
}

// Password reset functions
export async function createPasswordResetToken(email: string): Promise<string | null> {
  try {
    await ensureConnection();
    
    const user = await User.findOne({ email }).exec();
    if (!user) {
      return null; // User not found
    }
    
    // Generate password reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Set token expiration to 1 hour from now
    const tokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    
    // Update user with reset token
    await User.findByIdAndUpdate(user._id, {
      password_reset_token: resetToken,
      password_reset_token_expires: tokenExpires,
    }).exec();
    
    return resetToken;
  } catch (error) {
    console.error('Error creating password reset token:', error);
    return null;
  }
}

export async function getUserByPasswordResetToken(token: string): Promise<MongoUser | null> {
  try {
    await ensureConnection();
    
    const user = await User.findOne({
      password_reset_token: token,
      password_reset_token_expires: { $gt: new Date() }, // Token not expired
    }).exec();
    
    return user ? mongoUserToInterface(user) : null;
  } catch (error) {
    console.error('Error getting user by password reset token:', error);
    return null;
  }
}

export async function resetPassword(token: string, newPassword: string): Promise<boolean> {
  try {
    await ensureConnection();
    
    const user = await User.findOne({
      password_reset_token: token,
      password_reset_token_expires: { $gt: new Date() }, // Token not expired
    }).exec();
    
    if (!user) {
      return false; // Token invalid or expired
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Update password and clear reset token
    await User.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      password_reset_token: null,
      password_reset_token_expires: null,
    }).exec();
    
    return true;
  } catch (error) {
    console.error('Error resetting password:', error);
    return false;
  }
}

export async function updatePassword(userId: string, newPassword: string): Promise<boolean> {
  try {
    await ensureConnection();
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return false;
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Update password
    const result = await User.findByIdAndUpdate(userId, {
      password: hashedPassword,
    }).exec();
    
    return !!result;
  } catch (error) {
    console.error('Error updating password:', error);
    return false;
  }
}

export async function verifyCurrentPassword(userId: string, currentPassword: string): Promise<boolean> {
  try {
    await ensureConnection();
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return false;
    }
    
    const user = await User.findById(userId).exec();
    if (!user) {
      return false;
    }
    
    const isValid = await bcrypt.compare(currentPassword, user.password);
    return isValid;
  } catch (error) {
    console.error('Error verifying current password:', error);
    return false;
  }
} 