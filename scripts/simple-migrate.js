// Load environment variables from .env and .env.local
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const Database = require('better-sqlite3');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');

console.log('🔍 Checking for MongoDB URI...');

// Check for MongoDB URI
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is required!');
  console.log('\n📝 Please add to your .env file:');
  console.log('MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/vf?retryWrites=true&w=majority');
  console.log('\n📝 Or add to .env.local if you prefer:');
  console.log('MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/vf?retryWrites=true&w=majority');
  console.log('\n🔗 Get your connection string from MongoDB Atlas');
  process.exit(1);
}

// User Schema
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  email_verified: { type: Boolean, default: false },
  verification_token: { type: String, default: null },
  verification_token_expires: { type: Date, default: null },
  created_at: { type: Date, default: Date.now },
});

// Video Schema  
const VideoSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: null },
  uploadthing_url: { type: String, required: true },
  uploadthing_key: { type: String, required: true },
  file_size: { type: Number, required: true },
  duration: { type: Number, default: null },
  thumbnail_url: { type: String, default: null },
  metadata: { type: mongoose.Schema.Types.Mixed, required: true },
  is_shared: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
});

async function migrate() {
  console.log('🚀 Starting migration from SQLite to MongoDB...');
  
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, { dbName: 'vf' });
    console.log('✅ Connected to MongoDB Atlas - Database: vf');

    // Define models
    const User = mongoose.model('User', UserSchema);
    const Video = mongoose.model('Video', VideoSchema);

    // Check if SQLite database exists
    const dbPath = path.join(process.cwd(), 'users.db');
    const fs = require('fs');
    
    if (!fs.existsSync(dbPath)) {
      console.log('⚠️  No SQLite database found at:', dbPath);
      console.log('✅ MongoDB is ready for new data!');
      await mongoose.connection.close();
      return;
    }

    // Connect to SQLite
    const db = new Database(dbPath);
    console.log('✅ Connected to SQLite database');

    // Clear existing MongoDB data (optional)
    console.log('🧹 Clearing existing MongoDB data...');
    await User.deleteMany({});
    await Video.deleteMany({});

    // Map old user IDs to new MongoDB ObjectIds
    const userIdMap = new Map();

    // Migrate Users
    console.log('👤 Migrating users...');
    const users = db.prepare('SELECT * FROM users').all();
    
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
      
      console.log(`  ✅ Migrated user: ${sqliteUser.email}`);
    }

    // Migrate Videos
    console.log('🎬 Migrating videos...');
    const videos = db.prepare('SELECT * FROM videos').all();
    
    for (const sqliteVideo of videos) {
      const mongoUserId = userIdMap.get(sqliteVideo.user_id);
      
      if (!mongoUserId) {
        console.warn(`  ⚠️ Skipping video ${sqliteVideo.id} - user not found`);
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

      await mongoVideo.save();
      console.log(`  ✅ Migrated video: ${sqliteVideo.title}`);
    }

    // Close SQLite
    db.close();

    // Verify migration
    const userCount = await User.countDocuments();
    const videoCount = await Video.countDocuments();
    
    console.log('\n🎉 Migration completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   Users: ${users.length} → ${userCount}`);
    console.log(`   Videos: ${videos.length} → ${videoCount}`);
    
    if (userCount === users.length && videoCount === videos.length) {
      console.log('🎯 Migration verification passed!');
    } else {
      console.warn('⚠️ Migration verification failed - counts do not match');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Closed MongoDB connection');
  }
}

migrate(); 