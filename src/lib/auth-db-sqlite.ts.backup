import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';

// Database path
const dbPath = path.join(process.cwd(), 'users.db');
const db = new Database(dbPath);

// User interface
export interface User {
  id: number;
  email: string;
  password: string;
  name: string;
  email_verified: number; // 0 = not verified, 1 = verified
  verification_token?: string;
  verification_token_expires?: string;
  created_at: string;
}

// Video interface
export interface UserVideo {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  uploadthing_url: string;
  uploadthing_key: string;
  file_size: number;
  duration?: number;
  thumbnail_url?: string;
  metadata: string; // JSON string containing video generation parameters
  is_shared: number; // 0 = private, 1 = shared
  created_at: string;
}

// Initialize database
export function initializeDb() {
  // Create users table if it doesn't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      email_verified INTEGER DEFAULT 0,
      verification_token TEXT,
      verification_token_expires DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create videos table if it doesn't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS videos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      uploadthing_url TEXT NOT NULL,
      uploadthing_key TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      duration REAL,
      thumbnail_url TEXT,
      metadata TEXT NOT NULL,
      is_shared INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // Add is_shared column if it doesn't exist (for existing databases)
  try {
    db.exec(`ALTER TABLE videos ADD COLUMN is_shared INTEGER DEFAULT 0`);
  } catch {
    // Column already exists, ignore
  }

  // Add email verification columns if they don't exist (for existing databases)
  try {
    db.exec(`ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 0`);
  } catch {
    // Column already exists, ignore
  }
  
  try {
    db.exec(`ALTER TABLE users ADD COLUMN verification_token TEXT`);
  } catch {
    // Column already exists, ignore
  }
  
  try {
    db.exec(`ALTER TABLE users ADD COLUMN verification_token_expires DATETIME`);
  } catch {
    // Column already exists, ignore
  }
}

// Create a new user with verification token
export async function createUser(email: string, password: string, name: string, verificationToken?: string): Promise<User | null> {
  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Set token expiration to 24 hours from now
    const tokenExpires = verificationToken ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null;
    
    const stmt = db.prepare(`
      INSERT INTO users (email, password, name, verification_token, verification_token_expires)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(email, hashedPassword, name, verificationToken || null, tokenExpires);
    
    // Get the created user
    const user = getUserById(result.lastInsertRowid as number);
    return user;
  } catch (error) {
    console.error('Error creating user:', error);
    return null;
  }
}

// Get user by email
export function getUserByEmail(email: string): User | null {
  try {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    const user = stmt.get(email) as User | undefined;
    return user || null;
  } catch (error) {
    console.error('Error getting user by email:', error);
    return null;
  }
}

// Get user by ID
export function getUserById(id: number): User | null {
  try {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    const user = stmt.get(id) as User | undefined;
    return user || null;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return null;
  }
}

// Verify user password
export async function verifyPassword(email: string, password: string): Promise<User | null> {
  try {
    const user = getUserByEmail(email);
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
  userId: number,
  title: string,
  uploadthingUrl: string,
  uploadthingKey: string,
  fileSize: number,
  metadata: object,
  description?: string,
  duration?: number,
  thumbnailUrl?: string
): Promise<UserVideo | null> {
  try {
    const stmt = db.prepare(`
      INSERT INTO videos (user_id, title, description, uploadthing_url, uploadthing_key, file_size, duration, thumbnail_url, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      userId,
      title,
      description || null,
      uploadthingUrl,
      uploadthingKey,
      fileSize,
      duration || null,
      thumbnailUrl || null,
      JSON.stringify(metadata)
    );
    
    return getVideoById(result.lastInsertRowid as number);
  } catch (error) {
    console.error('Error creating video:', error);
    return null;
  }
}

export function getVideoById(id: number): UserVideo | null {
  try {
    const stmt = db.prepare('SELECT * FROM videos WHERE id = ?');
    const video = stmt.get(id) as UserVideo | undefined;
    return video || null;
  } catch (error) {
    console.error('Error getting video by ID:', error);
    return null;
  }
}

export function getVideosByUserId(userId: number): UserVideo[] {
  try {
    const stmt = db.prepare('SELECT * FROM videos WHERE user_id = ? ORDER BY created_at DESC');
    const videos = stmt.all(userId) as UserVideo[];
    return videos;
  } catch (error) {
    console.error('Error getting videos by user ID:', error);
    return [];
  }
}

export function deleteVideo(id: number, userId: number): boolean {
  try {
    const stmt = db.prepare('DELETE FROM videos WHERE id = ? AND user_id = ?');
    const result = stmt.run(id, userId);
    return result.changes > 0;
  } catch (error) {
    console.error('Error deleting video:', error);
    return false;
  }
}

export function updateVideoTitle(id: number, userId: number, title: string): boolean {
  try {
    const stmt = db.prepare('UPDATE videos SET title = ? WHERE id = ? AND user_id = ?');
    const result = stmt.run(title, id, userId);
    return result.changes > 0;
  } catch (error) {
    console.error('Error updating video title:', error);
    return false;
  }
}

// Update complete video record after processing
export function updateVideo(
  id: number,
  uploadthingUrl: string,
  uploadthingKey: string,
  fileSize: number,
  duration?: number,
  thumbnailUrl?: string
): boolean {
  try {
    const stmt = db.prepare(`
      UPDATE videos 
      SET uploadthing_url = ?, uploadthing_key = ?, file_size = ?, duration = ?, thumbnail_url = ? 
      WHERE id = ?
    `);
    const result = stmt.run(uploadthingUrl, uploadthingKey, fileSize, duration || null, thumbnailUrl || null, id);
    return result.changes > 0;
  } catch (error) {
    console.error('Error updating video:', error);
    return false;
  }
}

// Toggle video sharing status
export function toggleVideoSharing(id: number, userId: number): boolean {
  try {
    const stmt = db.prepare('UPDATE videos SET is_shared = NOT is_shared WHERE id = ? AND user_id = ?');
    const result = stmt.run(id, userId);
    return result.changes > 0;
  } catch (error) {
    console.error('Error toggling video sharing:', error);
    return false;
  }
}

// Get all shared videos (public)
export function getSharedVideos(): UserVideo[] {
  try {
    const stmt = db.prepare(`
      SELECT v.*, u.name as creator_name 
      FROM videos v 
      JOIN users u ON v.user_id = u.id 
      WHERE v.is_shared = 1 
      ORDER BY v.created_at DESC
    `);
    const videos = stmt.all() as (UserVideo & { creator_name: string })[];
    return videos;
  } catch (error) {
    console.error('Error getting shared videos:', error);
    return [];
  }
}

// Get shared video by ID (public access)
export function getSharedVideoById(id: number): (UserVideo & { creator_name: string }) | null {
  try {
    const stmt = db.prepare(`
      SELECT v.*, u.name as creator_name 
      FROM videos v 
      JOIN users u ON v.user_id = u.id 
      WHERE v.id = ? AND v.is_shared = 1
    `);
    const video = stmt.get(id) as (UserVideo & { creator_name: string }) | undefined;
    return video || null;
  } catch (error) {
    console.error('Error getting shared video by ID:', error);
    return null;
  }
}

// Email verification functions
export function getUserByVerificationToken(token: string): User | null {
  try {
    const stmt = db.prepare('SELECT * FROM users WHERE verification_token = ? AND verification_token_expires > datetime(\'now\')');
    const user = stmt.get(token) as User | undefined;
    return user || null;
  } catch (error) {
    console.error('Error getting user by verification token:', error);
    return null;
  }
}

export function verifyUserEmail(userId: number): boolean {
  try {
    const stmt = db.prepare(`
      UPDATE users 
      SET email_verified = 1, 
          verification_token = NULL, 
          verification_token_expires = NULL 
      WHERE id = ?
    `);
    const result = stmt.run(userId);
    return result.changes > 0;
  } catch (error) {
    console.error('Error verifying user email:', error);
    return false;
  }
}

export function updateVerificationToken(userId: number, token: string): boolean {
  try {
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const stmt = db.prepare(`
      UPDATE users 
      SET verification_token = ?, 
          verification_token_expires = ? 
      WHERE id = ?
    `);
    const result = stmt.run(token, tokenExpires, userId);
    return result.changes > 0;
  } catch (error) {
    console.error('Error updating verification token:', error);
    return false;
  }
}

//
// Initialize database on import
initializeDb(); 