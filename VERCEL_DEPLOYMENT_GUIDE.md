# Vercel Deployment Guide with Blob Store Setup

This guide provides complete instructions for deploying your quest application to Vercel with Blob Store configuration.

## 🎯 Quick Start

1. **Set up Blob Store token** (see Environment Setup below)
2. **Run the migration script**: `npm run setup:blob-store`
3. **Deploy to Vercel**: `npm run build && vercel --prod`

## 🔧 Environment Setup

### 1. Get Your Blob Store Token

**Steps:**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Storage** tab
4. Click **Create Database**
5. Select **Blob Store**
6. Choose your region (recommended: closest to your users)
7. Click **Create**
8. Copy the **BLOB_READ_WRITE_TOKEN** from the Blob Store settings

### 2. Configure Environment Variables

#### For Local Development

Update your `.env` file:

```bash
# Required: Replace with your actual token
BLOB_READ_WRITE_TOKEN=blob_xxxxxxxxxxxxxxxxxxxx

# Optional: Custom paths
BLOB_STORE_PRIMARY_PATH=quest-app/data/main-config.json
BLOB_STORE_BACKUP_PATH=quest-app/backups/

# Optional: Backup settings
BLOB_STORE_MAX_BACKUPS=10
BLOB_STORE_RETENTION_DAYS=90
```

#### For Vercel Production

1. Go to your project in Vercel Dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add these variables:

**Required:**
```
BLOB_READ_WRITE_TOKEN=your_actual_token_here
```

**Optional:**
```
BLOB_STORE_PRIMARY_PATH=quest-app/data/main-config.json
BLOB_STORE_BACKUP_PATH=quest-app/backups/
BLOB_STORE_MAX_BACKUPS=10
BLOB_STORE_RETENTION_DAYS=90
```

4. Select environments (Production, Preview, Development)
5. Click **Save**

## 🚀 Deployment Steps

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Run Blob Store Setup

```bash
npm run setup:blob-store
```

This script will:
- ✅ Verify your environment configuration
- 📂 Read existing JSON data files
- 📦 Migrate data to Blob Store
- 💾 Create backups
- 🔍 Verify successful migration

### Step 3: Test Your Application

```bash
# Start development server
npm run dev

# Test Blob Store health
npm run blob:health

# Run comprehensive tests
npm run test:blob-store
```

### Step 4: Build and Deploy

```bash
# Build the application
npm run build

# Deploy to production
vercel --prod
```

## 📋 Pre-Deployment Checklist

- [ ] **Blob Store token configured** in both local and Vercel environments
- [ ] **Migration script completed** successfully
- [ ] **Application tested** locally with Blob Store
- [ ] **Backups created** and verified
- [ ] **Environment variables** set in Vercel Dashboard
- [ ] **Build process** completes without errors
- [ ] **Health checks** pass in development

## 🔍 Testing Your Deployment

### Local Testing

```bash
# Test Blob Store connectivity
npm run blob:health

# Run comprehensive test suite
npm run test:blob-store

# Test data access
node -e "
import('./src/lib/blobDataService.js').then(async m => {
  const config = await m.BlobDataService.getConfig();
  console.log('Config loaded:', config.success);
  console.log('Users:', Object.keys(config.data?.users || {}).length);
  console.log('Quests:', Object.keys(config.data?.quests || {}).length);
});
"
```

### Production Testing

1. **Visit your deployed application**
2. **Check browser console** for any errors
3. **Verify user data loads** correctly
4. **Test quest functionality**
5. **Check admin features** if applicable

## 🚨 Troubleshooting

### Common Issues

#### 1. "BLOB_READ_WRITE_TOKEN not found"
**Solution:**
- Ensure token is set in Vercel environment variables
- Check token is copied correctly (no extra spaces)
- Verify environment variables are deployed (may need redeployment)

#### 2. "Migration failed during deployment"
**Solution:**
- Run migration locally first: `npm run setup:blob-store`
- Check that JSON files exist in `/dist` directory
- Verify Blob Store permissions

#### 3. "Application shows no data after deployment"
**Solution:**
- Run health check: `npm run blob:health`
- Check Vercel function logs for errors
- Verify environment variables are set correctly
- Check Blob Store file browser in Vercel Dashboard

#### 4. "Build errors related to Blob Store"
**Solution:**
- Ensure all dependencies are installed
- Check TypeScript configuration
- Verify import paths are correct

### Debug Mode

Enable debug logging:

```bash
# Set debug environment variable
export DEBUG=blob-store:*

# Or add to environment
echo "DEBUG=blob-store:*" >> .env.local
```

## 📊 Monitoring Your Deployment

### Health Monitoring

Regular health checks:

```bash
# Check Blob Store health
npm run blob:health

# List available backups
npm run backup:list

# Create manual backup
npm run backup:create
```

### Vercel Dashboard Monitoring

1. **Functions Tab**: Check function logs
2. **Storage Tab**: Monitor Blob Store usage
3. **Analytics**: Track performance metrics
4. **Settings**: Review environment variables

### Performance Monitoring

Monitor these metrics:
- **Response times**: Target < 200ms
- **Error rates**: Target < 1%
- **Storage usage**: Monitor growth
- **Backup frequency**: Ensure regular backups

## 🔄 Continuous Deployment

### Automatic Deployments

Set up automatic deployments with GitHub:

1. **Connect your repository** to Vercel
2. **Configure build settings** in `vercel.json`
3. **Set environment variables** in Vercel Dashboard
4. **Enable automatic deployments** on main branch

### Example `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "functions": {
    "src/api/*.js": {
      "runtime": "nodejs18.x"
    }
  },
  "env": {
    "BLOB_STORE_PRIMARY_PATH": "quest-app/data/main-config.json",
    "BLOB_STORE_BACKUP_PATH": "quest-app/backups/"
  }
}
```

## 💡 Best Practices

### Development Workflow

1. **Local development**: Use local Blob Store configuration
2. **Testing**: Run health checks before deployment
3. **Staging**: Deploy to preview environment first
4. **Production**: Deploy to production after successful staging tests

### Backup Strategy

1. **Automatic backups**: Enabled by default
2. **Manual backups**: Before major changes
3. **Regular cleanup**: Remove old backups
4. **Disaster recovery**: Test restore procedures

### Security

1. **Token management**: Rotate tokens regularly
2. **Access control**: Limit Blob Store access
3. **Environment variables**: Never commit tokens to Git
4. **Monitoring**: Track unusual access patterns

## 📚 Additional Resources

- [Vercel Deployment Documentation](https://vercel.com/docs/platform/deployments)
- [Vercel Blob Store Guide](https://vercel.com/docs/storage/vercel-blob)
- [Environment Variables Guide](https://vercel.com/docs/concepts/projects/environment-variables)
- [Monitoring and Debugging](https://vercel.com/docs/concepts/observability)

## 🎉 Success Indicators

Your deployment is successful when:

- ✅ **Build completes** without errors
- ✅ **Application loads** in production
- ✅ **Data displays** correctly
- ✅ **Health checks** pass
- ✅ **No console errors**
- ✅ **Performance is good**
- ✅ **Backups are working**

---

**🚀 Your quest application is now ready for production with Vercel Blob Store!**