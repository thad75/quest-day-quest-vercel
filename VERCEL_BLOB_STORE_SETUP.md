# Vercel Blob Store Configuration Setup Guide

## Quick Setup Overview

This guide will help you configure your `quest-day-quest-vercel-blob` Blob Store instance with your deployed application. You're getting "Blob Store token not configured" errors because the `BLOB_READ_WRITE_TOKEN` environment variable is not properly set up in your Vercel deployment.

## Step 1: Get Your BLOB_READ_WRITE_TOKEN

### Option A: From Vercel Dashboard (Recommended)

1. **Navigate to Vercel Dashboard**
   - Go to https://vercel.com/dashboard
   - Select your project

2. **Go to Storage Tab**
   - In your project dashboard, click on the "Storage" tab
   - Find your Blob Store instance named `quest-day-quest-vercel-blob`
   - Click on the Blob Store name

3. **Get the Token**
   - In the Blob Store settings, look for "Connection Details" or "Environment Variables"
   - Copy the `BLOB_READ_WRITE_TOKEN` value
   - The token format will be: `blob_xxxxxxxxxxxxxxxxxxxx`

### Option B: Using Vercel CLI

```bash
# List your blob stores
vercel blobs ls

# Get the specific blob store details
vercel blobs inspect quest-day-quest-vercel-blob
```

## Step 2: Configure Environment Variables on Vercel

### Option A: Using Vercel Dashboard (Recommended)

1. **Go to Project Settings**
   - In your project dashboard, click "Settings" tab
   - Click on "Environment Variables" in the left sidebar

2. **Add Environment Variables**
   - Click "Add" button
   - Add the following environment variables:

   **Required Variable:**
   ```
   Name: BLOB_READ_WRITE_TOKEN
   Value: blob_xxxxxxxxxxxxxxxxxxxx (your actual token)
   Environments: Production, Preview, Development (select all that apply)
   ```

   **Optional Variables (for customization):**
   ```
   Name: BLOB_STORE_PRIMARY_PATH
   Value: quest-app/data/main-config.json
   Environments: Production, Preview, Development

   Name: BLOB_STORE_BACKUP_PATH
   Value: quest-app/backups/
   Environments: Production, Preview, Development

   Name: BLOB_STORE_MAX_BACKUPS
   Value: 10
   Environments: Production, Preview, Development

   Name: BLOB_STORE_RETENTION_DAYS
   Value: 90
   Environments: Production, Preview, Development
   ```

3. **Save Changes**
   - Click "Save" for each environment variable
   - Wait for the variables to be processed

### Option B: Using Vercel CLI

```bash
# Add the main Blob Store token
vercel env add BLOB_READ_WRITE_TOKEN

# When prompted:
# What's the value of BLOB_READ_WRITE_TOKEN?
# > blob_xxxxxxxxxxxxxxxxxxxx (paste your actual token)
# Add to which environments? (comma separated)
# > production,preview,development

# Add optional variables
vercel env add BLOB_STORE_PRIMARY_PATH
# Value: quest-app/data/main-config.json
# Environments: production,preview,development

vercel env add BLOB_STORE_BACKUP_PATH
# Value: quest-app/backups/
# Environments: production,preview,development
```

## Step 3: Redeploy Your Application

### Automatic Redeployment
- After adding environment variables, Vercel will automatically trigger a redeployment
- Monitor the deployment progress in your Vercel dashboard

### Manual Redeployment (if needed)
```bash
# Trigger a new deployment
vercel --prod
```

## Step 4: Verify the Setup

### Check Console Logs
After deployment, check your application logs:

1. **Go to Vercel Dashboard**
   - Click on the "Functions" tab
   - Click on your deployed function logs

2. **Look for Success Messages**
   You should see messages like:
   ```
   ✓ Blob Store initialized successfully
   ✓ Blob Store connection established
   ✓ Blob Store is ready for operations
   ```

3. **No More Error Messages**
   You should NOT see:
   ```
   ✗ Blob Store token not configured
   ✗ BLOB_READ_WRITE_TOKEN not found or invalid
   ```

### Test in Browser
1. Visit your deployed application
2. Open browser Developer Tools (F12)
3. Check the Console tab
4. Look for Blob Store success messages

### Admin Panel Verification
If your application has a Blob Store admin panel:
1. Navigate to the admin section
2. Check Blob Store status
3. Verify that it shows "Connected" or "Ready"

## Complete Environment Variable Configuration

Here's the complete list of environment variables your application needs:

### Required Variables
```bash
BLOB_READ_WRITE_TOKEN=blob_xxxxxxxxxxxxxxxxxxxx
```

### Optional Variables (Recommended)
```bash
# Blob Store file paths
BLOB_STORE_PRIMARY_PATH=quest-app/data/main-config.json
BLOB_STORE_BACKUP_PATH=quest-app/backups/

# Backup settings
BLOB_STORE_MAX_BACKUPS=10
BLOB_STORE_RETENTION_DAYS=90
```

### Legacy Variable (Keep for now)
```bash
# Keep for migration/rollback purposes
EDGE_CONFIG=ecfg_puwsypw5sv3zviw427nirgf4clyg
```

## Troubleshooting Guide

### Common Issues and Solutions

#### 1. "Blob Store token not configured" Error
**Cause**: BLOB_READ_WRITE_TOKEN is missing or incorrect
**Solution**:
- Verify the token is correctly copied from Vercel dashboard
- Ensure the token starts with `blob_`
- Check that the environment variable is added to all relevant environments
- Redeploy after adding the variable

#### 2. "BLOB_READ_WRITE_TOKEN not found or invalid" Error
**Cause**: Token is malformed or from a different Blob Store
**Solution**:
- Double-check the token format
- Ensure you're using the token from `quest-day-quest-vercel-blob` specifically
- Regenerate the token if necessary

#### 3. "Permission denied" Error
**Cause**: Token doesn't have proper permissions
**Solution**:
- Ensure you're using the READ_WRITE token, not read-only
- Check Blob Store permissions in Vercel dashboard
- Recreate the token if needed

#### 4. Application Still Using JSON Files
**Cause**: Blob Store not properly initialized
**Solution**:
- Check console logs for initialization errors
- Verify all required environment variables are set
- Ensure @vercel/blob package is installed (version 2.0.0)
- Restart the application

#### 5. Connection Timeout
**Cause**: Network issues or incorrect region
**Solution**:
- Check Vercel status page for outages
- Verify Blob Store region is accessible
- Try redeploying the application

### Debug Mode

To enable detailed logging, temporarily add this environment variable:
```bash
DEBUG=blob-store:*
```

This will provide detailed logs for troubleshooting.

## Verification Checklist

After setup, verify the following:

- [ ] BLOB_READ_WRITE_TOKEN is added to Vercel environment variables
- [ ] Token starts with `blob_` format
- [ ] Application redeployed successfully
- [ ] Console shows "Blob Store initialized successfully"
- [ ] No "Blob Store token not configured" errors
- [ ] Admin panel shows Blob Store as connected (if available)
- [ ] Data operations (read/write) work correctly
- [ ] Backup system is functioning

## Next Steps

1. **Monitor Performance**: Keep an eye on Blob Store performance metrics
2. **Set Up Alerts**: Configure Vercel alerts for any Blob Store issues
3. **Regular Backups**: Ensure automatic backups are working
4. **Token Rotation**: Consider rotating tokens periodically for security

## Support Resources

- **Vercel Documentation**: https://vercel.com/docs/storage/vercel-blob
- **Vercel Status**: https://www.vercel-status.com/
- **Your Project**: Check Vercel function logs for detailed errors
- **Blob Store Admin**: Use the built-in admin panel in your application

## Important Notes

- **Security**: Never commit your BLOB_READ_WRITE_TOKEN to version control
- **Environment Specific**: Ensure tokens are set for all environments (Production, Preview, Development)
- **Application Restart**: Environment variable changes require a redeployment to take effect
- **Backup Strategy**: The system will automatically create backups when Blob Store is properly configured

---

*Your application is designed to use Blob Store exclusively once properly configured. The JSON file fallback will only be used if Blob Store is unavailable.*