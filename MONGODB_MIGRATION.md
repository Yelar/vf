# 🗃️ MongoDB Migration Guide

This guide helps you migrate from SQLite to MongoDB Atlas to fix deployment issues.

## 🚀 Quick Setup (Azure Static Web Apps Compatible)

### 1. Set up MongoDB Atlas
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account and cluster
3. Create a database named **`vf`**
4. Get your connection string

### 2. Add Environment Variable
Add to your `.env.local`:
```bash
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/vf?retryWrites=true&w=majority
```

### 3. Run Migration (if you have existing data)
```bash
npm run migrate
```

### 4. The system is now ready!
- All new signups/logins will use MongoDB
- Data persists across deployments
- Compatible with Azure Static Web Apps

## 🔧 What Changed

### Database Structure
- **SQLite** (local file) → **MongoDB Atlas** (cloud)
- Database name: `vf`
- Collections: `users`, `videos`
- All existing functionality preserved

### Files Updated
- ✅ `src/lib/mongodb.ts` - Database connection
- ✅ `src/lib/models/User.ts` - User schema  
- ✅ `src/lib/models/Video.ts` - Video schema
- ✅ `src/lib/auth-db-mongo.ts` - Database operations
- ✅ `src/lib/auth.ts` - Authentication config
- ⚠️ API routes - **Need manual async/await fixes**

### Key Changes
- User IDs are now MongoDB ObjectIds (strings)
- All database operations are async
- Boolean fields (`email_verified`, `is_shared`) use true/false instead of 0/1

## 🐛 Known Issues to Fix

Some API routes still need updates for async operations:

1. **Add `await` keywords** where missing
2. **Update user ID parsing** (remove `parseInt()`)
3. **Fix boolean comparisons** (`is_shared === true` not `=== 1`)

### Example Fix Pattern:
```typescript
// ❌ Before (SQLite)
const videos = getVideosByUserId(parseInt(session.user.id));

// ✅ After (MongoDB)  
const videos = await getVideosByUserId(session.user.id);
```

## 🎯 Benefits

✅ **No data loss on redeploy** - Data stored in Atlas cloud  
✅ **Azure Static Web Apps compatible**  
✅ **Better performance** - Indexed queries  
✅ **Scalable** - Handles growth automatically  
✅ **Free tier available** - 512MB storage  

## 📝 Migration Script Details

The migration script (`scripts/migrate-to-mongodb.ts`):
- Reads your existing SQLite `users.db`
- Creates MongoDB collections under database `vf`
- Preserves all user accounts and videos
- Maps old numeric IDs to new ObjectIds
- Verifies data integrity

Run with: `npm run migrate` 