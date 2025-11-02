# Blob Store File Organization and Naming Conventions

This document defines the file organization structure and naming conventions for Vercel Blob Store implementation.

## Directory Structure

```
quest-app/
├── data/                           # Primary data storage
│   ├── main-config.json            # Main application configuration
│   ├── users-config.json           # Legacy user configuration (migration backup)
│   ├── quests-library.json         # Legacy quest library (migration backup)
│   └── temp/                       # Temporary files during operations
│       ├── migration-*.json        # Migration temporary files
│       ├── export-*.json           # Export temporary files
│       └── import-*.json           # Import temporary files
├── backups/                        # Backup storage
│   ├── daily/                      # Daily backups
│   │   ├── backup-2024-01-15.json
│   │   └── backup-2024-01-16.json
│   ├── weekly/                     # Weekly backups
│   │   ├── backup-week-2024-W02.json
│   │   └── backup-week-2024-W03.json
│   ├── monthly/                    # Monthly backups
│   │   ├── backup-month-2024-01.json
│   │   └── backup-month-2024-02.json
│   ├── manual/                     # Manual backups
│   │   ├── backup-manual-2024-01-15T10-30-00.json
│   │   └── backup-manual-2024-01-16T14-45-00.json
│   └── emergency/                  # Emergency backups
│       ├── backup-emergency-2024-01-15T22-15-00.json
│       └── backup-emergency-2024-01-20T18-30-00.json
├── archives/                       # Long-term archives
│   ├── 2024/                       # Year-based organization
│   │   ├── 01/                     # Month-based organization
│   │   │   ├── weekly-archives/
│   │   │   └── monthly-archives/
│   │   └── 02/
│   └── 2025/
└── logs/                           # Operation logs
    ├── backup-logs-2024-01.json
    ├── migration-logs-2024-01.json
    └── operation-logs-2024-01.json
```

## File Naming Conventions

### Primary Configuration Files

| File Name | Purpose | Format |
|-----------|---------|--------|
| `main-config.json` | Primary application configuration | Static name |
| `users-config.json` | Legacy users configuration (migration backup) | Static name |
| `quests-library.json` | Legacy quest library (migration backup) | Static name |

### Backup Files

#### Standard Backup Format
```
backup-{timestamp}.json
```

Examples:
- `backup-2024-01-15T10-30-00-000Z.json`
- `backup-2024-01-16T14-45-30-123Z.json`

#### Categorized Backup Format
```
backup-{category}-{timestamp}.json
```

Categories:
- `daily` - Scheduled daily backups
- `weekly` - Scheduled weekly backups
- `monthly` - Scheduled monthly backups
- `manual` - Manual backups
- `emergency` - Emergency backups
- `pre-migration` - Pre-migration backups
- `post-migration` - Post-migration backups
- `pre-update` - Pre-update backups
- `pre-restore` - Pre-restore backups

Examples:
- `backup-daily-2024-01-15T02-00-00-000Z.json`
- `backup-weekly-2024-01-14T02-00-00-000Z.json`
- `backup-monthly-2024-01-01T02-00-00-000Z.json`
- `backup-manual-2024-01-15T10-30-00-000Z.json`
- `backup-emergency-2024-01-15T22-15-00-000Z.json`
- `backup-pre-migration-2024-01-15T10-00-00-000Z.json`

#### Operation-Specific Backup Format
```
backup-{operation}-{entity}-{timestamp}.json
```

Examples:
- `backup-users-update-2024-01-15T10-30-00-000Z.json`
- `backup-quests-update-2024-01-15T11-45-00-000Z.json`
- `backup-common-quests-update-2024-01-15T12-00-00-000Z.json`
- `backup-full-config-update-2024-01-15T13-15-00-000Z.json`

### Temporary Files

#### Migration Files
```
migration-{stage}-{timestamp}.json
```

Stages:
- `extraction` - Data extraction from Edge Config
- `transformation` - Data transformation process
- `validation` - Data validation process
- `upload` - Upload to Blob Store

Examples:
- `migration-extraction-2024-01-15T10-00-00-000Z.json`
- `migration-transformation-2024-01-15T10-15-00-000Z.json`
- `migration-validation-2024-01-15T10-30-00-000Z.json`

#### Export Files
```
export-{type}-{timestamp}.json
```

Types:
- `users` - User data export
- `quests` - Quest data export
- `full-config` - Complete configuration export
- `backup` - Backup export

Examples:
- `export-users-2024-01-15T10-30-00-000Z.json`
- `export-quests-2024-01-15T10-35-00-000Z.json`
- `export-full-config-2024-01-15T10-40-00-000Z.json`

#### Import Files
```
import-{type}-{timestamp}.json
```

Examples:
- `import-users-2024-01-15T14-30-00-000Z.json`
- `import-quests-2024-01-15T14-35-00-000Z.json`

### Log Files

#### Log File Format
```
{log-type}-logs-{year}-{month}.json
```

Log Types:
- `backup` - Backup operation logs
- `migration` - Migration operation logs
- `restore` - Restore operation logs
- `operation` - General operation logs
- `error` - Error logs
- `performance` - Performance metrics logs

Examples:
- `backup-logs-2024-01.json`
- `migration-logs-2024-01.json`
- `operation-logs-2024-01.json`

## File Content Structure

### Main Configuration File Structure

```json
{
  "users": {
    "user1": {
      "id": "user1",
      "name": "User One",
      "avatar": "👤",
      "dailyQuests": ["1", "2", "3"],
      "preferences": { ... },
      "stats": { ... }
    }
  },
  "quests": {
    "quest1": {
      "id": "quest1",
      "title": "Quest One",
      "description": "Description of quest one",
      "category": "health",
      "xp": 10,
      "difficulty": "easy",
      "icon": "💧",
      "tags": ["hydration", "health"],
      "requirements": []
    }
  },
  "commonQuests": ["quest1", "quest2"],
  "adminPassword": "admin123",
  "lastUpdated": "2024-01-15T10:30:00.000Z",
  "version": "2.0",
  "metadata": {
    "migrationDate": "2024-01-15T10:00:00.000Z",
    "backupCount": 15,
    "lastBackupDate": "2024-01-15T09:00:00.000Z",
    "lastModifiedBy": "admin",
    "environment": "production"
  }
}
```

### Backup File Structure

```json
{
  "users": { ... },
  "quests": { ... },
  "commonQuests": [...],
  "adminPassword": "...",
  "lastUpdated": "...",
  "version": "...",
  "metadata": { ... },
  "backupMetadata": {
    "reason": "daily",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "originalPath": "quest-app/data/main-config.json",
    "createdBy": "automated-backup",
    "size": 1024000,
    "checksum": "sha256:abc123...",
    "compressionEnabled": false,
    "encryptionEnabled": false
  }
}
```

### Migration File Structure

```json
{
  "migrationData": {
    "users": { ... },
    "quests": { ... },
    "commonQuests": [...]
  },
  "migrationMetadata": {
    "stage": "extraction",
    "timestamp": "2024-01-15T10:00:00.000Z",
    "source": "edge-config",
    "target": "blob-store",
    "version": "1.0",
    "checksum": "sha256:def456...",
    "dataStats": {
      "users": 10,
      "quests": 50,
      "commonQuests": 5,
      "totalSize": 2048000
    }
  }
}
```

## File Size Guidelines

### Recommended File Sizes

| File Type | Recommended Max Size | Hard Limit |
|-----------|---------------------|------------|
| Main Configuration | 1 MB | 5 MB |
| Daily Backups | 2 MB | 10 MB |
| Weekly Backups | 5 MB | 25 MB |
| Monthly Backups | 10 MB | 50 MB |
| Manual Backups | 5 MB | 25 MB |
| Migration Files | 10 MB | 50 MB |
| Log Files | 5 MB | 25 MB |

### Compression Strategy

- **Configuration Files**: No compression (fast access)
- **Backup Files**: Optional compression for larger files
- **Archive Files**: Always compress
- **Log Files**: Compress after 7 days

## Access Patterns and Permissions

### File Access Patterns

#### Read-Heavy Files
- `main-config.json` - Primary configuration (high read frequency)
- Recent daily backups - For quick restore operations
- Log files - For monitoring and debugging

#### Write-Heavy Files
- Backup files - Created during backup operations
- Log files - Updated during operations
- Temporary files - Created during migrations/exports

#### Archive Files
- Monthly backups older than 3 months
- Year-end archives
- Historical log files

### Permission Structure

```
quest-app/
├── data/                    # Read/Write access
│   ├── main-config.json     # Read/Write (admin only)
│   └── temp/                # Read/Write (system only)
├── backups/                 # Write/Read (system), Read (admin)
│   ├── daily/               # Write/Read (system)
│   ├── weekly/              # Write/Read (system)
│   ├── monthly/             # Write/Read (system)
│   ├── manual/              # Write/Read (admin)
│   └── emergency/           # Write/Read (admin)
├── archives/                # Read-only (admin)
└── logs/                    # Write/Read (system), Read (admin)
```

## Version Control and Change Management

### File Versioning Strategy

#### Configuration Files
- Use semantic versioning in file content
- Maintain version history in backups
- Track changes in metadata

#### Backup Files
- Include version information in filename
- Use timestamps for uniqueness
- Maintain change logs

### Change Management Process

1. **Pre-change Backup**: Create backup before any modification
2. **Change Implementation**: Apply changes with validation
3. **Post-change Backup**: Create backup after successful change
4. **Verification**: Verify data integrity
5. **Documentation**: Update change logs

## Cleanup and Maintenance

### Automatic Cleanup Rules

#### Daily Backups
- Keep last 30 days
- Move to weekly archive after 30 days

#### Weekly Backups
- Keep last 12 weeks
- Move to monthly archive after 12 weeks

#### Monthly Backups
- Keep last 12 months
- Move to long-term archive after 12 months

#### Temporary Files
- Delete after 24 hours
- Exception: Migration files keep 7 days

#### Log Files
- Keep current month
- Compress and archive previous months
- Delete after 1 year

### Manual Cleanup Guidelines

#### Review Before Deletion
- Verify backup integrity
- Check retention policies
- Confirm no active dependencies

#### Cleanup Operations
- Perform during maintenance windows
- Create backup before cleanup
- Log all deletion operations

## Performance Optimization

### File Organization Best Practices

1. **Keep Related Files Together**: Group files by purpose and access patterns
2. **Use Consistent Naming**: Follow naming conventions for easy searching
3. **Limit Directory Depth**: Avoid deep directory structures
4. **Regular Cleanup**: Remove unnecessary files regularly

### Access Optimization

1. **Cache Frequently Accessed Files**: Keep main config in cache
2. **Use CDN for Static Files**: Serve archived files via CDN
3. **Compress Large Files**: Reduce transfer times
4. **Implement Lazy Loading**: Load files only when needed

## Monitoring and Alerting

### File Metrics to Monitor

- File count and growth rate
- Storage usage by category
- Access frequency and patterns
- Backup creation success rate
- File integrity checksums

### Alert Thresholds

- Storage usage > 80% of allocated space
- Backup failure rate > 5%
- File access errors > 1%
- Missing critical files (main config)
- Unusual file size changes (> 50% increase/decrease)

### Recommended Monitoring Tools

- Vercel Analytics
- Custom monitoring scripts
- File integrity checks
- Storage usage reports