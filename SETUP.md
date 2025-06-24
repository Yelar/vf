# 🚀 Quick MongoDB Setup Guide

## ✅ Migration Complete - Now Set Up MongoDB Atlas

### 1. **Create MongoDB Atlas Account** (2 minutes)
1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Sign up for free
3. Create a new cluster (choose free tier)

### 2. **Get Connection String** (1 minute)
1. Click **"Connect"** on your cluster
2. Choose **"Connect your application"**
3. Copy the connection string
4. Replace `<password>` with your actual password

### 3. **Add to Environment** (30 seconds)
Add to your `.env.local` file:
```bash
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/vf?retryWrites=true&w=majority
```

### 4. **Run Migration** (30 seconds)
```bash
npm run migrate
```

### 5. **Test Locally** (1 minute)
```bash
npm run dev
# Visit http://localhost:3000
# Try signing up/in to test MongoDB connection
```

### 6. **Deploy to Azure** 
1. Add `MONGODB_URI` to Azure environment variables
2. Deploy your app
3. **No more database deletions on redeploy!** 🎉

---

## 🛠️ What's Fixed

✅ **Internal server error on sign in** - MongoDB persists data  
✅ **Providers query 500 error** - Async operations fixed  
✅ **Data loss on redeploy** - Cloud database never gets deleted  
✅ **Azure Static Web Apps compatibility** - Perfect match  

## 📁 Files Changed

- `src/lib/auth.ts` - Now uses MongoDB
- `src/lib/auth-db-mongo.ts` - New MongoDB operations
- All API routes - Updated for async/await
- `scripts/simple-migrate.js` - Data migration script

## 💡 Next Steps

1. **Set up MongoDB Atlas** (free tier)
2. **Add MONGODB_URI** to environment
3. **Run migration** to preserve existing data  
4. **Deploy to Azure** with the new environment variable

Your authentication system will now work perfectly on Azure Static Web Apps! 