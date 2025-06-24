# 🔐 GitHub Secrets Setup for MongoDB

## ✅ Workflow Updated - Now Add GitHub Secret

Your GitHub Actions workflow has been updated to use `MONGODB_URI`. Now you need to add it as a repository secret.

## 🚀 Add MongoDB URI to GitHub Secrets

### Step 1: Go to Your Repository Settings
1. Open your GitHub repository
2. Click **"Settings"** tab
3. In the left sidebar, click **"Secrets and variables"**
4. Click **"Actions"**

### Step 2: Add New Repository Secret
1. Click **"New repository secret"**
2. **Name:** `MONGODB_URI`
3. **Value:** Your MongoDB connection string
   ```
   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/vf?retryWrites=true&w=majority
   ```
4. Click **"Add secret"**

### Step 3: Verify the Secret
- You should see `MONGODB_URI` in your secrets list
- The value will be hidden (••••••••)

## 🎯 What Happens Next

When you push to `main` branch:
1. ✅ GitHub Actions will create `.env` file with `MONGODB_URI`
2. ✅ App will build with MongoDB connection
3. ✅ Deploy to Azure Static Web Apps
4. ✅ **Authentication will work!** No more 500 errors

## 📋 Quick Checklist

- [ ] MongoDB URI added to GitHub Secrets as `MONGODB_URI`
- [ ] Workflow file updated (✅ already done)
- [ ] Ready to push/deploy

## 🚨 Important Notes

- **Keep your MongoDB URI secure** - never commit it to code
- **Use GitHub Secrets only** - they're encrypted and secure
- **Test locally first** if you want to be sure

Your next deployment will have full database functionality! 🎉 