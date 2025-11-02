# Complete Vercel Blob Store Setup Guide

This guide provides step-by-step instructions for configuring Vercel Blob Store for your quest application, including data migration from JSON files and complete environment setup.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Vercel Dashboard Setup](#vercel-dashboard-setup)
4. [Running the Migration Script](#running-the-migration-script)
5. [Verification and Testing](#verification-and-testing)
6. [Backup Configuration](#backup-configuration)
7. [Troubleshooting](#troubleshooting)
8. [Performance Optimization](#performance-optimization)

## 🚀 Quick Start

If you want to get started immediately, run this command after setting up your environment:

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.production.example .env.production
# Edit .env.production with your Blob Store token

# Run the complete setup
npm run setup:blob-store
```

## 📋 Prerequisites

Before you begin, ensure you have:

- ✅ Node.js 18+ installed
- ✅ Vercel account with access to Blob Store
- ✅ Existing quest application with JSON files
- ✅ Project deployed on Vercel

## 🔧 Environment Configuration

### 1. Get Your Blob Store Token

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to your project
3. Go to **Storage** tab
4. Click **Create Database**
5. Select **Blob Store**
6. Choose your preferred region (recommended: closest to users)
7. Click **Create**
8. Copy the **BLOB_READ_WRITE_TOKEN** from the settings

### 2. Configure Environment Variables

Create or update your `.env.production` file:

```bash
# Required: Blob Store Connection Token
BLOB_READ_WRITE_TOKEN=blob_xxxxxxxxxxxxxxxxxxxx

# Optional: Custom file paths
BLOB_STORE_PRIMARY_PATH=quest-app/data/main-config.json
BLOB_STORE_BACKUP_PATH=quest-app/backups/

# Optional: Backup settings
BLOB_STORE_MAX_BACKUPS=10
BLOB_STORE_RETENTION_DAYS=90

# Optional: Monitoring
DEBUG=blob-store:*
LOG_LEVEL=info
```

### 3. Add Environment Variables to Vercel

1. Go to your project settings in Vercel Dashboard
2. Navigate to **Environment Variables**
3. Add the following variables:

#### Required Variables
```
BLOB_READ_WRITE_TOKEN=your_actual_token_here
```

#### Optional Variables
```
BLOB_STORE_PRIMARY_PATH=quest-app/data/main-config.json
BLOB_STORE_BACKUP_PATH=quest-app/backups/
BLOB_STORE_MAX_BACKUPS=10
BLOB_STORE_RETENTION_DAYS=90
BACKUP_ENABLED=true
BACKUP_SCHEDULE=daily
```

## 🎯 Vercel Dashboard Setup

### Create Blob Store

1. **Navigate to Storage**:
   - Go to your Vercel project
   - Click on **Storage** tab
   - Click **Create Database**

2. **Configure Blob Store**:
   - Select **Blob Store**
   - Choose region (e.g., `iad1` for US East)
   - Click **Create**

3. **Get Connection Token**:
   - Once created, click on the Blob Store
   - Go to **Settings** tab
   - Copy the **BLOB_READ_WRITE_TOKEN**

### Configure Environment Variables

1. **Add to Project Settings**:
   - Go to **Settings** → **Environment Variables**
   - Add `BLOB_READ_WRITE_TOKEN` with your token
   - Add any optional variables you want to configure

2. **Select Environments**:
   - Choose **Production**, **Preview**, and **Development**
   - Click **Save**

## 🏃‍♂️ Running the Migration Script

### Method 1: Using npm script (Recommended)

Add to your `package.json`:

```json
{
  "scripts": {
    "setup:blob-store": "node scripts/setup-blob-store.js"
  }
}
```

Then run:

```bash
npm run setup:blob-store
```

### Method 2: Direct execution

```bash
node scripts/setup-blob-store.js
```

### What the Script Does

The setup script performs the following steps:

1. **✅ Environment Verification**
   - Checks all required environment variables
   - Validates Blob Store token configuration

2. **📂 Data Reading**
   - Reads `dist/users-config.json`
   - Reads `dist/quests-library.json`
   - Validates JSON structure

3. **🚀 Blob Store Initialization**
   - Tests Blob Store connectivity
   - Checks existing configuration
   - Prepares storage paths

4. **💾 Backup Creation**
   - Creates initial backup of existing data
   - Sets up backup retention policy

5. **📦 Data Migration**
   - Transforms JSON data to Blob Store format
   - Uploads configuration to Blob Store
   - Creates post-migration backup

6. **🔍 Verification**
   - Validates data integrity
   - Tests all Blob Store operations
   - Confirms successful migration

7. **⚙️ Backup Configuration**
   - Sets up automated backups
   - Configures retention policies
   - Tests backup/restore functionality

## ✅ Verification and Testing

### 1. Run Health Check

```bash
# The setup script includes automated testing
# You can also run manual tests:
node -e "
import('./src/lib/blobDataService.js').then(m => {
  m.BlobDataService.getHealthStatus().then(console.log);
});
"
```

### 2. Test Data Access

```bash
# Test reading data
node -e "
import('./src/lib/blobDataService.js').then(async m => {
  const users = await m.BlobDataService.getUsers();
  const quests = await m.BlobDataService.getQuests();
  console.log('Users:', Object.keys(users.data?.users || {}).length);
  console.log('Quests:', Object.keys(quests.data || {}).length);
});
"
```

### 3. Check Vercel Dashboard

1. Go to **Storage** → **Blob Store**
2. Verify your data appears in the file browser
3. Check that `quest-app/data/main-config.json` exists
4. Verify backup files in `quest-app/backups/`

### 4. Test Application

Start your application:

```bash
npm run dev
```

Check that:
- Users load correctly
- Quests display properly
- No JSON file errors in console
- Admin functionality works

## 💾 Backup Configuration

### Automatic Backups

The system creates automatic backups:

- **Before updates**: To prevent data loss
- **After migrations**: To preserve state
- **Scheduled backups**: Daily/weekly/monthly

### Manual Backups

Create a manual backup:

```bash
node -e "
import('./src/lib/blobStore.js').then(m => {
  m.blobStoreManager.createBackup().then(url => {
    console.log('Backup created:', url);
  });
});
"
```

### Restore from Backup

```bash
node -e "
import('./src/lib/blobStore.js').then(async m => {
  const backups = await m.blobStoreManager.listBackups();
  console.log('Available backups:', backups);
  // Use the first backup URL to restore
  if (backups.length > 0) {
    const restored = await m.blobStoreManager.restoreFromBackup(backups[0]);
    console.log('Restore success:', restored);
  }
});
"
```

## 🐛 Troubleshooting

### Common Issues

#### 1. "Blob Store token not configured"
**Solution**:
- Verify `BLOB_READ_WRITE_TOKEN` is set in environment variables
- Check token is copied correctly from Vercel Dashboard
- Ensure token has read/write permissions

#### 2. "Failed to connect to Blob Store"
**Solution**:
- Check network connectivity
- Verify token is valid and not expired
- Ensure Blob Store region is accessible

#### 3. "Migration failed - data validation error"
**Solution**:
- Check JSON files exist in `/dist` directory
- Validate JSON format using online validator
- Ensure files are not corrupted

#### 4. "Permission denied when accessing Blob Store"
**Solution**:
- Verify token has correct permissions
- Check environment variables are set in correct environment
- Regenerate token if necessary

### Debug Mode

Enable debug logging:

```bash
# Set environment variable
export DEBUG=blob-store:*

# Or add to .env file
echo "DEBUG=blob-store:*" >> .env.local
```

### Log Analysis

Check application logs for detailed error information:

1. Go to Vercel Dashboard
2. Click on **Functions** tab
3. View function logs for error details

## ⚡ Performance Optimization

### Caching Configuration

The application includes intelligent caching:

```javascript
// Cache TTL: 5 minutes
const CACHE_TTL = 5 * 60 * 1000;

// Max cache size: 100 entries
const MAX_CACHE_SIZE = 100;
```

### Monitoring Metrics

Track these metrics:

- **Response times**: Target < 200ms
- **Cache hit rate**: Target > 80%
- **Error rate**: Target < 1%
- **Storage usage**: Monitor growth

### Optimization Tips

1. **Warm up cache**: Preload frequently accessed data
2. **Batch operations**: Use batch writes for multiple updates
3. **Monitor metrics**: Set up alerts for performance degradation
4. **Regular cleanup**: Remove old backups and unused data

## 📊 Monitoring and Maintenance

### Daily Checks

1. **Health status**: Verify Blob Store is accessible
2. **Backup verification**: Ensure recent backups exist
3. **Performance metrics**: Check response times
4. **Error monitoring**: Review error logs

### Weekly Maintenance

1. **Backup cleanup**: Remove old backups beyond retention
2. **Performance analysis**: Review metrics trends
3. **Capacity planning**: Monitor storage usage
4. **Security review**: Check access patterns

### Monthly Tasks

1. **Disaster recovery test**: Restore from backup
2. **Performance optimization**: Update caching strategies
3. **Security audit**: Review access permissions
4. **Documentation update**: Update setup procedures

## 🔄 Migration from Edge Config

If you're migrating from Edge Config:

1. **Keep Edge Config** during migration period
2. **Set both tokens** in environment variables
3. **Run migration script** to transfer data
4. **Test thoroughly** before removing Edge Config
5. **Monitor performance** for 1-2 weeks
6. **Remove Edge Config** only after verification

## 🎉 Success Indicators

Your setup is successful when:

- ✅ Migration script completes without errors
- ✅ All verification tests pass
- ✅ Application works without JSON files
- ✅ Backups are created automatically
- ✅ Performance metrics are within targets
- ✅ No console errors in production

## 📞 Support

If you encounter issues:

1. **Check logs**: Review application and function logs
2. **Verify configuration**: Ensure all environment variables are set
3. **Test connectivity**: Verify Blob Store accessibility
4. **Consult documentation**: Review Vercel Blob Store docs
5. **Contact support**: Create Vercel support ticket if needed

## 📚 Additional Resources

- [Vercel Blob Store Documentation](https://vercel.com/docs/storage/vercel-blob)
- [Vercel Environment Variables Guide](https://vercel.com/docs/concepts/projects/environment-variables)
- [Best Practices for Data Storage](https://vercel.com/docs/storage/vercel-blob/overview)

---

**🎯 Your quest application is now ready for production with Vercel Blob Store!**