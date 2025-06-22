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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);
}

// Create a new user
export async function createUser(email: string, password: string, name: string): Promise<User | null> {
  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const stmt = db.prepare(`
      INSERT INTO users (email, password, name)
      VALUES (?, ?, ?)
    `);
    
    const result = stmt.run(email, hashedPassword, name);
    
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
    
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return null;
    
    return user;
  } catch (error) {
    console.error('Error verifying password:', error);
    return null;
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

// Initialize database on import
initializeDb(); 