import { BlobStoreManager, BackupResult } from './blobStore';

/**
 * Comprehensive Backup and Recovery Service
 * Provides automated backup scheduling, retention policies, and disaster recovery
 */

export interface BackupSchedule {
  id: string;
  name: string;
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  enabled: boolean;
  retentionDays: number;
  lastRun?: Date;
  nextRun?: Date;
}

export interface BackupPolicy {
  maxBackups: number;
  retentionDays: number;
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
  autoCleanup: boolean;
  schedules: BackupSchedule[];
}

export interface DisasterRecoveryPlan {
  id: string;
  name: string;
  rto: number; // Recovery Time Objective in minutes
  rpo: number; // Recovery Point Objective in minutes
  backupLocations: string[];
  contactInfo: {
    primary: string;
    secondary: string;
  };
  lastTested?: Date;
  testResults?: {
    success: boolean;
    duration: number;
    issues: string[];
  };
}

export interface BackupMetrics {
  totalBackups: number;
  successfulBackups: number;
  failedBackups: number;
  averageBackupSize: number;
  averageBackupTime: number;
  lastBackupSuccess: boolean;
  lastBackupTime?: Date;
  storageUsed: number;
}

/**
 * Backup and Recovery Service
 */
export class BlobBackupService {
  private static backupPolicy: BackupPolicy = {
    maxBackups: 30,
    retentionDays: 90,
    compressionEnabled: false,
    encryptionEnabled: false,
    autoCleanup: true,
    schedules: [
      {
        id: 'daily-backup',
        name: 'Daily Backup',
        frequency: 'daily',
        enabled: true,
        retentionDays: 30
      },
      {
        id: 'weekly-backup',
        name: 'Weekly Backup',
        frequency: 'weekly',
        enabled: true,
        retentionDays: 90
      }
    ]
  };

  private static disasterRecoveryPlan: DisasterRecoveryPlan = {
    id: 'quest-app-drp',
    name: 'Quest App Disaster Recovery Plan',
    rto: 60, // 1 hour recovery time
    rpo: 240, // 4 hours recovery point
    backupLocations: ['primary-blob-store', 'secondary-location'],
    contactInfo: {
      primary: 'admin@questapp.com',
      secondary: 'backup-admin@questapp.com'
    }
  };

  private static backupMetrics: BackupMetrics = {
    totalBackups: 0,
    successfulBackups: 0,
    failedBackups: 0,
    averageBackupSize: 0,
    averageBackupTime: 0,
    lastBackupSuccess: false,
    storageUsed: 0
  };

  private static backupHistory: Array<{
    timestamp: Date;
    type: 'scheduled' | 'manual' | 'emergency';
    result: BackupResult | null;
    error?: string;
    duration: number;
  }> = [];

  private static isBackupRunning = false;
  private static backupTimer?: NodeJS.Timeout;

  /**
   * Initialize the backup service
   */
  static async initialize(): Promise<boolean> {
    try {
      console.log('🔧 Initializing Backup Service...');

      // Load backup configuration from environment or storage
      await this.loadBackupConfiguration();

      // Start scheduled backups
      this.startScheduledBackups();

      // Clean up old backups based on retention policy
      await this.cleanupOldBackups();

      // Calculate current metrics
      await this.updateMetrics();

      console.log('✅ Backup Service initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Backup Service:', error);
      return false;
    }
  }

  /**
   * Create an immediate backup
   */
  static async createBackup(
    type: 'manual' | 'emergency' = 'manual',
    metadata?: any
  ): Promise<BackupResult | null> {
    if (this.isBackupRunning && type !== 'emergency') {
      throw new Error('Backup is already running');
    }

    this.isBackupRunning = true;
    const startTime = Date.now();

    try {
      console.log(`🔄 Starting ${type} backup...`);

      const backupMetadata = {
        type,
        timestamp: new Date().toISOString(),
        triggeredBy: type === 'emergency' ? 'emergency' : 'manual',
        ...metadata
      };

      const result = await BlobStoreManager.createBackup(type, backupMetadata);

      const duration = Date.now() - startTime;

      // Update metrics and history
      this.updateBackupHistory(type, result, duration);
      await this.updateMetrics();

      if (result) {
        console.log(`✅ ${type} backup completed successfully`, {
          backupPath: result.backupPath,
          size: result.size,
          duration
        });
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.updateBackupHistory(type, null, duration, (error as Error).message);
      this.backupMetrics.failedBackups++;

      console.error(`❌ ${type} backup failed:`, error);
      throw error;
    } finally {
      this.isBackupRunning = false;
    }
  }

  /**
   * Restore from a backup
   */
  static async restoreFromBackup(
    backupPath: string,
    verifyAfterRestore = true
  ): Promise<{ success: boolean; message: string; verificationResult?: any }> {
    try {
      console.log(`🔄 Starting restore from backup: ${backupPath}`);

      // Create backup before restore
      await this.createBackup('manual', { reason: 'pre-restore', sourceBackup: backupPath });

      // Perform restore
      const restoreSuccess = await BlobStoreManager.restoreFromBackup(backupPath);

      if (!restoreSuccess) {
        throw new Error('Restore operation failed');
      }

      // Verify restore if requested
      let verificationResult = null;
      if (verifyAfterRestore) {
        verificationResult = await this.verifyRestore();
      }

      console.log(`✅ Restore completed successfully from: ${backupPath}`);

      return {
        success: true,
        message: 'Restore completed successfully',
        verificationResult
      };
    } catch (error) {
      console.error(`❌ Restore failed from ${backupPath}:`, error);
      return {
        success: false,
        message: `Restore failed: ${(error as Error).message}`
      };
    }
  }

  /**
   * Verify a restore operation
   */
  static async verifyRestore(): Promise<{
    isValid: boolean;
    issues: string[];
    dataStats: {
      users: number;
      quests: number;
      commonQuests: number;
    };
  }> {
    try {
      console.log('🔍 Verifying restore integrity...');

      const [users, quests, commonQuests] = await Promise.all([
        BlobStoreManager.getUsers(),
        BlobStoreManager.getQuests(),
        BlobStoreManager.getCommonQuests()
      ]);

      const issues: string[] = [];

      // Basic data validation
      if (!users || typeof users !== 'object') {
        issues.push('Invalid users data structure');
      }

      if (!quests || typeof quests !== 'object') {
        issues.push('Invalid quests data structure');
      }

      if (!Array.isArray(commonQuests)) {
        issues.push('Invalid common quests data structure');
      }

      // Check for required fields in user data
      if (users) {
        Object.values(users).forEach((user: any) => {
          if (!user.id || !user.name) {
            issues.push(`User missing required fields: ${user.id || 'unknown'}`);
          }
        });
      }

      const dataStats = {
        users: Object.keys(users || {}).length,
        quests: Object.keys(quests || {}).length,
        commonQuests: commonQuests?.length || 0
      };

      console.log('✅ Restore verification completed', {
        isValid: issues.length === 0,
        issuesFound: issues.length,
        dataStats
      });

      return {
        isValid: issues.length === 0,
        issues,
        dataStats
      };
    } catch (error) {
      console.error('❌ Restore verification failed:', error);
      return {
        isValid: false,
        issues: [`Verification failed: ${(error as Error).message}`],
        dataStats: { users: 0, quests: 0, commonQuests: 0 }
      };
    }
  }

  /**
   * Test disaster recovery plan
   */
  static async testDisasterRecovery(): Promise<{
    success: boolean;
    duration: number;
    issues: string[];
    testResults: any;
  }> {
    const startTime = Date.now();

    try {
      console.log('🧪 Starting disaster recovery test...');

      const issues: string[] = [];

      // Test backup creation
      const backupResult = await this.createBackup('manual', { reason: 'dr-test' });
      if (!backupResult) {
        issues.push('Failed to create test backup');
      }

      // Test backup listing
      const backups = await BlobStoreManager.listBackups();
      if (backups.length === 0) {
        issues.push('No backups found during test');
      }

      // Test restore (using the most recent backup)
      if (backups.length > 0 && backupResult) {
        const restoreResult = await this.restoreFromBackup(backupResult.backupPath, true);
        if (!restoreResult.success) {
          issues.push('Failed to restore from backup');
        }

        if (restoreResult.verificationResult && !restoreResult.verificationResult.isValid) {
          issues.push(...restoreResult.verificationResult.issues);
        }
      }

      const duration = Date.now() - startTime;
      const success = issues.length === 0;

      // Update disaster recovery plan
      this.disasterRecoveryPlan.lastTested = new Date();
      this.disasterRecoveryPlan.testResults = {
        success,
        duration,
        issues
      };

      console.log(`✅ Disaster recovery test completed`, {
        success,
        duration,
        issuesFound: issues.length
      });

      return {
        success,
        duration,
        issues,
        testResults: this.disasterRecoveryPlan.testResults
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error('❌ Disaster recovery test failed:', error);

      return {
        success: false,
        duration,
        issues: [`Test failed: ${(error as Error).message}`],
        testResults: null
      };
    }
  }

  /**
   * Get backup metrics
   */
  static getMetrics(): BackupMetrics {
    return { ...this.backupMetrics };
  }

  /**
   * Get backup history
   */
  static getBackupHistory(limit = 50): Array<{
    timestamp: Date;
    type: 'scheduled' | 'manual' | 'emergency';
    result: BackupResult | null;
    error?: string;
    duration: number;
  }> {
    return this.backupHistory
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Update backup policy
   */
  static updateBackupPolicy(policy: Partial<BackupPolicy>): void {
    this.backupPolicy = { ...this.backupPolicy, ...policy };
    this.saveBackupConfiguration();
  }

  /**
   * Get current backup policy
   */
  static getBackupPolicy(): BackupPolicy {
    return { ...this.backupPolicy };
  }

  /**
   * Update disaster recovery plan
   */
  static updateDisasterRecoveryPlan(plan: Partial<DisasterRecoveryPlan>): void {
    this.disasterRecoveryPlan = { ...this.disasterRecoveryPlan, ...plan };
  }

  /**
   * Get disaster recovery plan
   */
  static getDisasterRecoveryPlan(): DisasterRecoveryPlan {
    return { ...this.disasterRecoveryPlan };
  }

  /**
   * Export backup configuration
   */
  static exportConfiguration(): {
    backupPolicy: BackupPolicy;
    disasterRecoveryPlan: DisasterRecoveryPlan;
    metrics: BackupMetrics;
  } {
    return {
      backupPolicy: this.backupPolicy,
      disasterRecoveryPlan: this.disasterRecoveryPlan,
      metrics: this.backupMetrics
    };
  }

  // Private helper methods

  private static async loadBackupConfiguration(): Promise<void> {
    try {
      // In a real implementation, this would load from storage or environment variables
      // For now, we'll use the default configuration
      console.log('Backup configuration loaded');
    } catch (error) {
      console.warn('Failed to load backup configuration, using defaults:', error);
    }
  }

  private static async saveBackupConfiguration(): Promise<void> {
    try {
      // In a real implementation, this would save to storage
      console.log('Backup configuration saved');
    } catch (error) {
      console.error('Failed to save backup configuration:', error);
    }
  }

  private static startScheduledBackups(): void {
    // Schedule the next backup based on policy
    const nextSchedule = this.getNextScheduledBackup();
    if (nextSchedule) {
      const delay = nextSchedule.getTime() - Date.now();
      if (delay > 0) {
        console.log(`Next scheduled backup in ${Math.round(delay / 1000 / 60)} minutes`);
        this.backupTimer = setTimeout(() => {
          this.runScheduledBackup(nextSchedule);
        }, delay);
      }
    }
  }

  private static getNextScheduledBackup(): Date | null {
    const now = new Date();
    let nextBackup: Date | null = null;

    for (const schedule of this.backupPolicy.schedules) {
      if (!schedule.enabled) continue;

      let scheduledTime = new Date(now);

      switch (schedule.frequency) {
        case 'hourly':
          scheduledTime.setHours(scheduledTime.getHours() + 1, 0, 0, 0);
          break;
        case 'daily':
          scheduledTime.setDate(scheduledTime.getDate() + 1);
          scheduledTime.setHours(2, 0, 0, 0); // 2 AM daily
          break;
        case 'weekly':
          scheduledTime.setDate(scheduledTime.getDate() + (7 - scheduledTime.getDay()));
          scheduledTime.setHours(2, 0, 0, 0); // 2 AM Sunday
          break;
        case 'monthly':
          scheduledTime.setMonth(scheduledTime.getMonth() + 1, 1);
          scheduledTime.setHours(2, 0, 0, 0); // 2 AM 1st of month
          break;
      }

      if (!nextBackup || scheduledTime < nextBackup) {
        nextBackup = scheduledTime;
      }
    }

    return nextBackup;
  }

  private static async runScheduledBackup(scheduledTime: Date): Promise<void> {
    try {
      console.log('Running scheduled backup...');
      await this.createBackup('scheduled', {
        scheduledTime: scheduledTime.toISOString(),
        scheduleType: 'automated'
      });

      // Schedule the next backup
      this.startScheduledBackups();
    } catch (error) {
      console.error('Scheduled backup failed:', error);
      // Still schedule the next backup even if this one failed
      this.startScheduledBackups();
    }
  }

  private static async cleanupOldBackups(): Promise<void> {
    if (!this.backupPolicy.autoCleanup) return;

    try {
      console.log('Cleaning up old backups...');
      const backups = await BlobStoreManager.listBackups();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.backupPolicy.retentionDays);

      let deletedCount = 0;
      for (const backup of backups) {
        const backupDate = new Date(backup.uploadedAt);
        if (backupDate < cutoffDate) {
          await BlobStoreManager.deleteBackup(backup.path);
          deletedCount++;
        }
      }

      // Also enforce maximum backup limit
      const remainingBackups = await BlobStoreManager.listBackups();
      if (remainingBackups.length > this.backupPolicy.maxBackups) {
        const excessBackups = remainingBackups
          .sort((a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime())
          .slice(0, remainingBackups.length - this.backupPolicy.maxBackups);

        for (const backup of excessBackups) {
          await BlobStoreManager.deleteBackup(backup.path);
          deletedCount++;
        }
      }

      console.log(`Cleanup completed: ${deletedCount} old backups deleted`);
    } catch (error) {
      console.error('Backup cleanup failed:', error);
    }
  }

  private static updateBackupHistory(
    type: 'scheduled' | 'manual' | 'emergency',
    result: BackupResult | null,
    duration: number,
    error?: string
  ): void {
    this.backupHistory.push({
      timestamp: new Date(),
      type,
      result,
      error,
      duration
    });

    // Keep only recent history
    if (this.backupHistory.length > 100) {
      this.backupHistory = this.backupHistory.slice(-100);
    }

    // Update metrics
    this.backupMetrics.totalBackups++;
    if (result) {
      this.backupMetrics.successfulBackups++;
      this.backupMetrics.lastBackupSuccess = true;
      this.backupMetrics.lastBackupTime = new Date();
      this.backupMetrics.averageBackupSize =
        (this.backupMetrics.averageBackupSize * (this.backupMetrics.successfulBackups - 1) + result.size) /
        this.backupMetrics.successfulBackups;
    } else {
      this.backupMetrics.failedBackups++;
      this.backupMetrics.lastBackupSuccess = false;
    }

    this.backupMetrics.averageBackupTime =
      (this.backupMetrics.averageBackupTime * (this.backupMetrics.totalBackups - 1) + duration) /
      this.backupMetrics.totalBackups;
  }

  private static async updateMetrics(): Promise<void> {
    try {
      const stats = await BlobStoreManager.getStats();
      this.backupMetrics.storageUsed = stats.totalSize;
    } catch (error) {
      console.error('Failed to update metrics:', error);
    }
  }
}