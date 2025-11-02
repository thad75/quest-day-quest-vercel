# Vercel Environment Variable Setup

## Quick Setup Commands

### 1. Install Vercel CLI (if not already installed)
```bash
npm i -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Link to your project
```bash
cd quest-day-quest
vercel link
```

### 4. Set Environment Variables
```bash
# Set your Blob Store token (replace with your actual token)
vercel env add BLOB_READ_WRITE_TOKEN

# Set the file paths
vercel env add BLOB_STORE_PRIMARY_PATH
# Value: quest-app/data/main-config.json

vercel env add BLOB_STORE_BACKUP_PATH
# Value: quest-app/backups/
```

### 5. Deploy with new environment variables
```bash
vercel --prod
```

## Alternative: Dashboard Method

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Find your project: `quest-day-quest-vercel`
3. Go to **Settings** → **Environment Variables**
4. Click **Add New** and add:
   - `BLOB_READ_WRITE_TOKEN` = `your_token_here`
   - `BLOB_STORE_PRIMARY_PATH` = `quest-app/data/main-config.json`
   - `BLOB_STORE_BACKUP_PATH` = `quest-app/backups/`
5. Click **Save**
6. **Redeploy** your project

## Where to Get Your Token

1. Go to [Vercel Blob Store](https://vercel.com/stores/blob)
2. Find your store: `quest-day-quest-vercel-blob`
3. Click **Connect** or **.env.local**
4. Copy the `BLOB_READ_WRITE_TOKEN` value
5. Add it to your environment variables

## Verification

After setting up the environment variables:

1. **Redeploy** your application
2. **Check the console** - you should see:
   ```
   ✅ Configuration loaded successfully from Blob Store
   ✅ Données utilisateurs chargées via Blob Store
   ```
3. **No more** "Blob Store token not configured" messages

## Troubleshooting

If you still see "token not configured" after deployment:

1. **Check environment variable names** (must be exact)
2. **Verify token format** (should start with `blob_`)
3. **Redeploy manually** (environment changes require redeployment)
4. **Check Vercel Function Logs** for detailed error information