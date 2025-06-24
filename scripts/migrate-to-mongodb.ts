import Database from 'better-sqlite3';
import path from 'path';
import connectToDatabase from '../src/lib/mongodb';
import User from '../src/lib/models/User';
import Video from '../src/lib/models/Video';
import mongoose from 'mongoose';

// SQLite interfaces (keeping same as original)
interface SqliteUser {
  id: number;
  email: string;
  password: string;
  name: string;
  email_verified: number;
  verification_token?: string;
  verification_token_expires?: string;
  created_at: string;
}

interface SqliteVideo {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  uploadthing_url: string;
  uploadthing_key: string;
  file_size: number;
  duration?: number;
  thumbnail_url?: string;
  metadata: string;
  is_shared: number;
  created_at: string;
}

async function migrateData() {
  console.log('🚀 Starting migration from SQLite to MongoDB...');

  try {
    // Connect to MongoDB
    await connectToDatabase();
    console.log('✅ Connected to MongoDB');

    // Connect to SQLite
    const dbPath = path.join(process.cwd(), 'users.db');
    const db = new Database(dbPath);
    console.log('✅ Connected to SQLite database');

    // Clear existing MongoDB data (optional - remove if you want to keep existing data)
    console.log('🧹 Clearing existing MongoDB data...');
    await User.deleteMany({});
    await Video.deleteMany({});
    console.log('✅ Cleared existing data');

    // Map to store old user IDs to new MongoDB ObjectIds
    const userIdMap = new Map<number, string>();

    // Migrate Users
    console.log('👤 Migrating users...');
    const usersStmt = db.prepare('SELECT * FROM users');
    const users = usersStmt.all() as SqliteUser[];
    
    for (const sqliteUser of users) {
      const mongoUser = new User({
        email: sqliteUser.email,
        password: sqliteUser.password, // Already hashed
        name: sqliteUser.name,
        email_verified: sqliteUser.email_verified === 1,
        verification_token: sqliteUser.verification_token || null,
        verification_token_expires: sqliteUser.verification_token_expires 
          ? new Date(sqliteUser.verification_token_expires) 
          : null,
        created_at: new Date(sqliteUser.created_at),
      });

      const savedUser = await mongoUser.save();
      userIdMap.set(sqliteUser.id, savedUser._id.toString());
      
      console.log(`  ✅ Migrated user: ${sqliteUser.email} (${sqliteUser.id} -> ${savedUser._id})`);
    }

    console.log(`✅ Migrated ${users.length} users`);

    // Migrate Videos
    console.log('🎬 Migrating videos...');
    const videosStmt = db.prepare('SELECT * FROM videos');
    const videos = videosStmt.all() as SqliteVideo[];
    
    for (const sqliteVideo of videos) {
      const mongoUserId = userIdMap.get(sqliteVideo.user_id);
      
      if (!mongoUserId) {
        console.warn(`  ⚠️ Skipping video ${sqliteVideo.id} - user ${sqliteVideo.user_id} not found`);
        continue;
      }

      const mongoVideo = new Video({
        user_id: new mongoose.Types.ObjectId(mongoUserId),
        title: sqliteVideo.title,
        description: sqliteVideo.description || null,
        uploadthing_url: sqliteVideo.uploadthing_url,
        uploadthing_key: sqliteVideo.uploadthing_key,
        file_size: sqliteVideo.file_size,
        duration: sqliteVideo.duration || null,
        thumbnail_url: sqliteVideo.thumbnail_url || null,
        metadata: JSON.parse(sqliteVideo.metadata),
        is_shared: sqliteVideo.is_shared === 1,
        created_at: new Date(sqliteVideo.created_at),
      });

      const savedVideo = await mongoVideo.save();
      console.log(`  ✅ Migrated video: ${sqliteVideo.title} (${sqliteVideo.id} -> ${savedVideo._id})`);
    }

    console.log(`✅ Migrated ${videos.length} videos`);

    // Close SQLite connection
    db.close();
    console.log('✅ Closed SQLite connection');

    // Display summary
    console.log('\n🎉 Migration completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   Users: ${users.length}`);
    console.log(`   Videos: ${videos.length}`);
    console.log(`   Database: vf (MongoDB Atlas)`);

    // Verify migration
    const userCount = await User.countDocuments();
    const videoCount = await Video.countDocuments();
    console.log(`\n✅ Verification:`);
    console.log(`   MongoDB Users: ${userCount}`);
    console.log(`   MongoDB Videos: ${videoCount}`);

    if (userCount === users.length && videoCount === videos.length) {
      console.log('🎯 Migration verification passed!');
    } else {
      console.warn('⚠️ Migration verification failed - counts do not match');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('✅ Closed MongoDB connection');
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateData()
    .then(() => {
      console.log('✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

export default migrateData; 