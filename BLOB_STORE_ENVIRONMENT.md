# Vercel Blob Store Environment Configuration

This document outlines the required environment variables and configuration for using Vercel Blob Store as the primary storage solution.

## Required Environment Variables

### Core Blob Store Configuration

```bash
# Required for Blob Store access
BLOB_READ_WRITE_TOKEN="your_blob_store_token_here"

# Optional: Custom configuration (if not using defaults)
BLOB_STORE_PRIMARY_PATH="quest-app/data/main-config.json"
BLOB_STORE_BACKUP_PATH="quest-app/backups/"
BLOB_STORE_MAX_BACKUPS="10"
BLOB_STORE_RETENTION_DAYS="90"
```

### Migration Configuration

```bash
# Edge Config fallback (for migration)
EDGE_CONFIG="your_edge_config_connection_string"
```

### Backup Configuration

```bash
# Backup scheduling and policies
BACKUP_ENABLED="true"
BACKUP_SCHEDULE="daily" # hourly, daily, weekly, monthly
BACKUP_RETENTION_DAYS="90"
BACKUP_COMPRESSION="false"
BACKUP_ENCRYPTION="false"
```

## Vercel Dashboard Setup

### 1. Enable Blob Store

1. Go to your Vercel project dashboard
2. Navigate to the "Storage" tab
3. Click "Create Database"
4. Select "Blob Store"
5. Choose a region (recommended: closest to your users)
6. Click "Create"

### 2. Get Connection Token

After creating the Blob Store:

1. Go to the Blob Store settings
2. Copy the "BLOB_READ_WRITE_TOKEN"
3. Add it to your environment variables

### 3. Configure Environment Variables

Add the following environment variables in your Vercel project settings:

#### Required Variables

```bash
BLOB_READ_WRITE_TOKEN="blob_xxxxxxxxxxxxxxxxxxxx"
```

#### Optional Variables

```bash
# Override default paths if needed
BLOB_STORE_PRIMARY_PATH="quest-app/data/main-config.json"
BLOB_STORE_BACKUP_PATH="quest-app/backups/"
BLOB_STORE_MAX_BACKUPS="10"
BLOB_STORE_RETENTION_DAYS="90"

# Backup configuration
BACKUP_ENABLED="true"
BACKUP_SCHEDULE="daily"
BACKUP_RETENTION_DAYS="90"
```

## File Organization and Naming Conventions

### Primary Storage Structure

```
quest-app/
├── data/
│   └── main-config.json          # Primary configuration file
├── backups/
│   ├── backup-2024-01-01.json    # Daily backups
│   ├── backup-2024-01-02.json
│   ├── backup-weekly-2024-01-01.json  # Weekly backups
│   └── backup-monthly-2024-01-01.json # Monthly backups
└── temp/
    ├── migration-2024-01-01.json      # Migration temporary files
    └── export-2024-01-01.json         # Export temporary files
```

### Backup Naming Convention

Backups follow this naming pattern:

```
backup-{timestamp}.json
backup-{type}-{timestamp}.json
backup-{reason}-{timestamp}.json
```

Examples:
- `backup-2024-01-15T10-30-00-000Z.json` - Standard backup
- `backup-pre-migration-2024-01-15T10-30-00-000Z.json` - Pre-migration backup
- `backup-emergency-2024-01-15T10-30-00-000Z.json` - Emergency backup

### Configuration File Structure

The main configuration file (`main-config.json`) follows this structure:

```json
{
  "users": {
    "user1": { ... },
    "user2": { ... }
  },
  "quests": {
    "quest1": { ... },
    "quest2": { ... }
  },
  "commonQuests": ["quest1", "quest2"],
  "adminPassword": "admin123",
  "lastUpdated": "2024-01-15T10:30:00.000Z",
  "version": "2.0",
  "metadata": {
    "migrationDate": "2024-01-15T10:30:00.000Z",
    "backupCount": 15,
    "lastBackupDate": "2024-01-15T09:00:00.000Z"
  }
}
```

## Migration from Edge Config

### Prerequisites

1. Ensure Edge Config is still accessible during migration
2. Have valid `EDGE_CONFIG` environment variable
3. Backup current data before migration

### Migration Process

The migration automatically:

1. Validates Edge Config data integrity
2. Creates backup of current state
3. Extracts data from Edge Config
4. Transforms data structure (if needed)
5. Uploads to Blob Store
6. Verifies migration success
7. Updates application references

### Post-Migration

After successful migration:

1. Remove `EDGE_CONFIG` environment variable (optional)
2. Update application code to use Blob Store APIs
3. Monitor system performance
4. Keep initial backup for rollback period

## Backup and Recovery Policies

### Automatic Backups

- **Daily**: Created at 2:00 AM UTC, retained for 30 days
- **Weekly**: Created on Sunday at 2:00 AM UTC, retained for 90 days
- **Monthly**: Created on 1st of month at 2:00 AM UTC, retained for 1 year

### Manual Backups

Administrators can create manual backups at any time:
- Standard manual backups
- Pre-migration backups
- Emergency backups

### Retention Policy

- **Daily backups**: 30 days
- **Weekly backups**: 90 days
- **Monthly backups**: 365 days
- **Manual backups**: Follow retention policy based on type

### Disaster Recovery

- **RTO (Recovery Time Objective)**: 1 hour
- **RPO (Recovery Point Objective)**: 4 hours
- **Recovery Process**: Restore from most recent backup
- **Testing**: Monthly disaster recovery tests recommended

## Performance Optimization

### Caching Strategy

- **In-memory cache**: 5-minute TTL for frequently accessed data
- **Cache size**: Maximum 100 entries
- **Cache warming**: Automatic on application startup

### Monitoring Metrics

Track these metrics for optimal performance:

- Response times (target: < 200ms)
- Cache hit rate (target: > 80%)
- Error rate (target: < 1%)
- Storage usage and growth

### Optimization Recommendations

1. **Cache warming**: Warm up cache with frequently accessed data
2. **Batch operations**: Use batch writes for multiple updates
3. **Compression**: Enable compression for large datasets
4. **Monitoring**: Set up alerts for performance degradation

## Security Considerations

### Access Control

1. **Token Management**: Use read/write tokens only when necessary
2. **Least Privilege**: Grant minimum required permissions
3. **Token Rotation**: Rotate tokens regularly (recommended: quarterly)

### Data Protection

1. **Encryption**: Consider encryption for sensitive data
2. **Access Logs**: Monitor access patterns and unusual activity
3. **Backup Security**: Ensure backups are also secured

### Compliance

1. **Data Residency**: Ensure data storage complies with regional requirements
2. **Retention Policies**: Follow data retention regulations
3. **Audit Trails**: Maintain logs of data access and modifications

## Troubleshooting

### Common Issues

1. **Connection Errors**: Verify BLOB_READ_WRITE_TOKEN is correct
2. **Permission Errors**: Check token has read/write permissions
3. **Performance Issues**: Monitor metrics and consider optimization
4. **Migration Failures**: Check Edge Config availability and data integrity

### Debug Mode

Enable debug logging by setting:

```bash
DEBUG=blob-store:*
```

### Support Resources

1. Vercel Documentation: https://vercel.com/docs/storage/vercel-blob
2. Vercel Status: https://www.vercel-status.com/
3. Application Logs: Check Vercel function logs for detailed errors

## Environment Variable Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BLOB_READ_WRITE_TOKEN` | Yes | - | Vercel Blob Store connection token |
| `BLOB_STORE_PRIMARY_PATH` | No | `quest-app/data/main-config.json` | Primary configuration file path |
| `BLOB_STORE_BACKUP_PATH` | No | `quest-app/backups/` | Backup storage directory |
| `BLOB_STORE_MAX_BACKUPS` | No | `10` | Maximum number of backups to retain |
| `BLOB_STORE_RETENTION_DAYS` | No | `90` | Default backup retention period |
| `BACKUP_ENABLED` | No | `true` | Enable automatic backups |
| `BACKUP_SCHEDULE` | No | `daily` | Backup frequency schedule |
| `BACKUP_RETENTION_DAYS` | No | `90` | Backup retention period |
| `BACKUP_COMPRESSION` | No | `false` | Enable backup compression |
| `BACKUP_ENCRYPTION` | No | `false` | Enable backup encryption |
| `EDGE_CONFIG` | No | - | Edge Config connection string (for migration) |