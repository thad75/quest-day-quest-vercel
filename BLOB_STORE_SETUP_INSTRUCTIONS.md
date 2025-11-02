# Vercel Blob Store Setup Instructions

## 🎉 Great! You've Created Your Blob Store Instance

I can see you've successfully created a Vercel Blob Store instance for your project. Now you need to get the read/write token and add it to your environment variables.

## 📋 Quick Setup Steps

### 1. Get Your Blob Store Token

1. Go to your Vercel project dashboard
2. Navigate to the **Storage** tab
3. Click on your Blob Store instance (`quest-day-quest-vercel-blob`)
4. Find the **Read/Write Token** in the connection details
5. Copy the token (it should look like: `blob_xxxxxxxxxxxxxxxxxxxx`)

### 2. Update Your Environment Variables

**For Local Development:**
Update the `.env` file in your project root:

```bash
# Replace the empty value with your actual token
BLOB_READ_WRITE_TOKEN=blob_xxxxxxxxxxxxxxxxxxxx

# Other settings (optional)
BLOB_STORE_PRIMARY_PATH=quest-app/data/main-config.json
BLOB_STORE_BACKUP_PATH=quest-app/backups/
BLOB_STORE_MAX_BACKUPS=10
BLOB_STORE_RETENTION_DAYS=90
```

**For Vercel Production:**
1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:
   - `BLOB_READ_WRITE_TOKEN`: Your actual token
   - `BLOB_STORE_PRIMARY_PATH`: `quest-app/data/main-config.json`
   - `BLOB_STORE_BACKUP_PATH`: `quest-app/backups/`

### 3. Test the Setup

1. Stop your development server if it's running
2. Restart it: `npm run dev`
3. Check the browser console for messages like:
   - ✅ `Données utilisateurs chargées via Blob Store`
   - ✅ `Données quêtes chargées via Blob Store`

## 🔧 What's Fixed

The previous 404 errors were caused by the app trying to fetch from Blob Store without a token. I've fixed this by:

- ✅ Adding token validation before attempting to fetch
- ✅ Gracefully falling back to JSON files when no token is configured
- ✅ Providing clear console messages about the current storage mode

## 🚀 Next Steps

Once you add your Blob Store token:

1. **Automatic Migration**: The system will automatically detect existing JSON data and migrate it to Blob Store
2. **Real-time Updates**: You'll get immediate read/write capabilities
3. **Automatic Backups**: Every change will be backed up automatically
4. **Better Performance**: Caching and optimization will be enabled

## 📁 File Structure in Blob Store

Your data will be organized as:
```
quest-app/
├── data/
│   └── main-config.json     # Main configuration (users, quests, etc.)
└── backups/
    ├── backup-2024-01-01T12-00-00-000Z.json
    ├── backup-2024-01-01T13-00-00-000Z.json
    └── ...                   # Automatic backups
```

## 🧪 Testing Your Setup

After adding the token, you can test by:

1. **Starting the app**: `npm run dev`
2. **Navigate to the admin panel**
3. **Try creating/updating a user or quest**
4. **Check that changes persist across page refreshes**

## 📞 Need Help?

If you encounter any issues:

1. **Check console logs** for detailed error messages
2. **Verify token format** (should start with `blob_`)
3. **Ensure Blob Store is created** in your Vercel project
4. **Check environment variables** are properly set

---

**Current Status**: ✅ Ready for Blob Store token configuration
**Next Step**: Add your `BLOB_READ_WRITE_TOKEN` to unlock full functionality!