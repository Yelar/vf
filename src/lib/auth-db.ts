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

// Initialize database on import
initializeDb(); 