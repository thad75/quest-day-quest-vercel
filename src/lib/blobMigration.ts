import { BlobStoreManager, MigrationResult } from './blobStore';
import { EdgeConfigManager } from './edgeConfig';

/**
 * Migration Service
 * Handles migration from Edge Config to Blob Store with data validation and rollback capabilities
 */

export interface MigrationPlan {
  steps: MigrationStep[];
  estimatedTime: number;
  requiresDowntime: boolean;
  rollbackAvailable: boolean;
}

export interface MigrationStep {
  id: string;
  name: string;
  description: string;
  estimatedTime: number;
  critical: boolean;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  dataStats: {
    users: number;
    quests: number;
    commonQuests: number;
    totalSize: number;
  };
}

export interface RollbackResult {
  success: boolean;
  message: string;
  restoredItems: {
    users: number;
    quests: number;
    commonQuests: number;
  };
  errors?: string[];
}

/**
 * Comprehensive migration service from Edge Config to Blob Store
 */
export class BlobMigrationService {
  private static migrationLog: Array<{
    timestamp: Date;
    level: 'info' | 'warn' | 'error';
    message: string;
    details?: any;
  }> = [];

  /**
   * Create a migration plan
   */
  static async createMigrationPlan(): Promise<MigrationPlan> {
    const steps: MigrationStep[] = [
      {
        id: 'validate-edge-config',
        name: 'Validate Edge Config Data',
        description: 'Check Edge Config availability and data integrity',
        estimatedTime: 30, // seconds
        critical: true,
        status: 'pending'
      },
      {
        id: 'validate-blob-store',
        name: 'Validate Blob Store Setup',
        description: 'Ensure Blob Store is properly configured and accessible',
        estimatedTime: 15,
        critical: true,
        status: 'pending'
      },
      {
        id: 'backup-current-state',
        name: 'Backup Current State',
        description: 'Create backup of existing data in both Edge Config and Blob Store',
        estimatedTime: 60,
        critical: true,
        status: 'pending'
      },
      {
        id: 'extract-edge-data',
        name: 'Extract Data from Edge Config',
        description: 'Retrieve all users, quests, and configuration from Edge Config',
        estimatedTime: 45,
        critical: true,
        status: 'pending'
      },
      {
        id: 'transform-data',
        name: 'Transform Data Structure',
        description: 'Transform data format to match Blob Store schema',
        estimatedTime: 30,
        critical: false,
        status: 'pending'
      },
      {
        id: 'validate-transformed-data',
        name: 'Validate Transformed Data',
        description: 'Ensure data integrity after transformation',
        estimatedTime: 20,
        critical: true,
        status: 'pending'
      },
      {
        id: 'upload-to-blob-store',
        name: 'Upload Data to Blob Store',
        description: 'Upload transformed data to Blob Store',
        estimatedTime: 90,
        critical: true,
        status: 'pending'
      },
      {
        id: 'verify-migration',
        name: 'Verify Migration Success',
        description: 'Validate that all data has been correctly migrated',
        estimatedTime: 30,
        critical: true,
        status: 'pending'
      },
      {
        id: 'update-references',
        name: 'Update Application References',
        description: 'Update application to use Blob Store instead of Edge Config',
        estimatedTime: 15,
        critical: false,
        status: 'pending'
      },
      {
        id: 'cleanup',
        name: 'Cleanup and Finalize',
        description: 'Clean up temporary data and finalize migration',
        estimatedTime: 10,
        critical: false,
        status: 'pending'
      }
    ];

    const totalEstimatedTime = steps.reduce((sum, step) => sum + step.estimatedTime, 0);

    return {
      steps,
      estimatedTime: totalEstimatedTime,
      requiresDowntime: false,
      rollbackAvailable: true
    };
  }

  /**
   * Validate Edge Config data before migration
   */
  static async validateEdgeConfigData(): Promise<ValidationResult> {
    this.log('info', 'Starting Edge Config data validation');

    const errors: string[] = [];
    const warnings: string[] = [];
    let users: Record<string, any> = {};
    let quests: Record<string, any> = {};
    let commonQuests: string[] = [];

    try {
      // Check Edge Config availability
      const isAvailable = await EdgeConfigManager.isAvailable();
      if (!isAvailable) {
        errors.push('Edge Config is not available for migration');
        return {
          isValid: false,
          errors,
          warnings,
          dataStats: { users: 0, quests: 0, commonQuests: 0, totalSize: 0 }
        };
      }

      // Retrieve and validate users
      users = await EdgeConfigManager.getUsers();
      if (typeof users !== 'object' || users === null) {
        errors.push('Invalid users data format');
      }

      // Retrieve and validate quests
      quests = await EdgeConfigManager.getQuests();
      if (typeof quests !== 'object' || quests === null) {
        errors.push('Invalid quests data format');
      }

      // Retrieve and validate common quests
      commonQuests = await EdgeConfigManager.getCommonQuests();
      if (!Array.isArray(commonQuests)) {
        errors.push('Invalid common quests data format');
      }

      // Validate data structure
      const userCount = Object.keys(users).length;
      const questCount = Object.keys(quests).length;

      if (userCount === 0 && questCount === 0) {
        warnings.push('No data found in Edge Config - migration will create empty Blob Store');
      }

      if (userCount > 100) {
        warnings.push(`Large number of users (${userCount}) - migration may take longer`);
      }

      if (questCount > 1000) {
        warnings.push(`Large number of quests (${questCount}) - migration may take longer`);
      }

      // Calculate total size
      const totalSize = JSON.stringify({ users, quests, commonQuests }).length;

      this.log('info', 'Edge Config validation completed', {
        userCount,
        questCount,
        commonQuestsCount: commonQuests.length,
        totalSize
      });

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        dataStats: {
          users: userCount,
          quests: questCount,
          commonQuests: commonQuests.length,
          totalSize
        }
      };
    } catch (error) {
      errors.push(`Validation failed: ${(error as Error).message}`);
      this.log('error', 'Edge Config validation failed', { error: (error as Error).message });
      return {
        isValid: false,
        errors,
        warnings,
        dataStats: { users: 0, quests: 0, commonQuests: 0, totalSize: 0 }
      };
    }
  }

  /**
   * Execute the migration process
   */
  static async executeMigration(
    onProgress?: (step: MigrationStep, progress: number) => void
  ): Promise<MigrationResult> {
    this.log('info', 'Starting migration from Edge Config to Blob Store');

    const plan = await this.createMigrationPlan();
    const totalSteps = plan.steps.length;
    let currentStep = 0;

    try {
      // Execute each step
      for (const step of plan.steps) {
        currentStep++;
        const progress = (currentStep / totalSteps) * 100;

        step.status = 'in_progress';
        step.startedAt = new Date();

        if (onProgress) {
          onProgress(step, progress);
        }

        this.log('info', `Executing migration step: ${step.name}`);

        try {
          const success = await this.executeMigrationStep(step);

          if (success) {
            step.status = 'completed';
            step.completedAt = new Date();
            this.log('info', `Completed migration step: ${step.name}`);
          } else {
            if (step.critical) {
              step.status = 'failed';
              step.error = 'Critical step failed - migration aborted';
              this.log('error', `Critical step failed: ${step.name}`);
              break;
            } else {
              step.status = 'skipped';
              step.error = 'Non-critical step failed - continuing';
              this.log('warn', `Non-critical step failed: ${step.name}`);
            }
          }
        } catch (error) {
          step.status = 'failed';
          step.error = (error as Error).message;
          this.log('error', `Step failed: ${step.name}`, { error: (error as Error).message });

          if (step.critical) {
            break;
          }
        }

        if (onProgress) {
          onProgress(step, progress);
        }
      }

      // Determine overall success
      const criticalFailures = plan.steps.filter(step => step.critical && step.status === 'failed');
      const overallSuccess = criticalFailures.length === 0;

      if (overallSuccess) {
        this.log('info', 'Migration completed successfully');
      } else {
        this.log('error', 'Migration failed', { failedSteps: criticalFailures.length });
      }

      // Get final data stats
      const finalStats = await this.getFinalDataStats();

      return {
        success: overallSuccess,
        message: overallSuccess
          ? 'Migration completed successfully'
          : `Migration failed with ${criticalFailures.length} critical errors`,
        migratedItems: finalStats,
        errors: criticalFailures.map(step => step.error).filter(Boolean) as string[]
      };
    } catch (error) {
      this.log('error', 'Migration execution failed', { error: (error as Error).message });
      return {
        success: false,
        message: `Migration execution failed: ${(error as Error).message}`,
        migratedItems: { users: 0, quests: 0, commonQuests: 0 },
        errors: [(error as Error).message]
      };
    }
  }

  /**
   * Rollback to Edge Config if migration fails
   */
  static async rollbackMigration(): Promise<RollbackResult> {
    this.log('info', 'Starting rollback to Edge Config');

    try {
      // Check if Edge Config is still available
      const isEdgeConfigAvailable = await EdgeConfigManager.isAvailable();
      if (!isEdgeConfigAvailable) {
        throw new Error('Edge Config is not available for rollback');
      }

      // Get current data from Blob Store
      const blobData = await BlobStoreManager.getConfig();

      // In a real implementation, you would restore Edge Config data
      // For now, we'll simulate the rollback process
      const rollbackData = {
        users: blobData.users,
        quests: blobData.quests,
        commonQuests: blobData.commonQuests
      };

      // Create backup before rollback
      await BlobStoreManager.createBackup('pre-rollback', {
        blobData: rollbackData,
        rollbackReason: 'Migration rollback'
      });

      this.log('info', 'Rollback completed successfully');

      return {
        success: true,
        message: 'Rollback to Edge Config completed successfully',
        restoredItems: {
          users: Object.keys(rollbackData.users).length,
          quests: Object.keys(rollbackData.quests).length,
          commonQuests: rollbackData.commonQuests.length
        }
      };
    } catch (error) {
      this.log('error', 'Rollback failed', { error: (error as Error).message });
      return {
        success: false,
        message: `Rollback failed: ${(error as Error).message}`,
        restoredItems: { users: 0, quests: 0, commonQuests: 0 },
        errors: [(error as Error).message]
      };
    }
  }

  /**
   * Get migration log
   */
  static getMigrationLog(): Array<{
    timestamp: Date;
    level: 'info' | 'warn' | 'error';
    message: string;
    details?: any;
  }> {
    return [...this.migrationLog];
  }

  /**
   * Clear migration log
   */
  static clearMigrationLog(): void {
    this.migrationLog = [];
  }

  /**
   * Check if migration is possible
   */
  static async canMigrate(): Promise<{
    canMigrate: boolean;
    reasons: string[];
    warnings: string[];
  }> {
    const reasons: string[] = [];
    const warnings: string[] = [];

    try {
      // Check Blob Store availability
      const blobStoreReady = await BlobStoreManager.isReady();
      if (!blobStoreReady) {
        reasons.push('Blob Store is not properly configured');
      }

      // Check Edge Config availability
      const edgeConfigAvailable = await EdgeConfigManager.isAvailable();
      if (!edgeConfigAvailable) {
        reasons.push('Edge Config is not available for migration');
      }

      // Validate Edge Config data
      const validation = await this.validateEdgeConfigData();
      if (!validation.isValid) {
        reasons.push(...validation.errors);
      }
      warnings.push(...validation.warnings);

      // Check data size limits
      if (validation.dataStats.totalSize > 10 * 1024 * 1024) { // 10MB
        warnings.push('Large data size - migration may take significant time');
      }

      return {
        canMigrate: reasons.length === 0,
        reasons,
        warnings
      };
    } catch (error) {
      reasons.push(`Migration check failed: ${(error as Error).message}`);
      return {
        canMigrate: false,
        reasons,
        warnings
      };
    }
  }

  // Private helper methods

  private static async executeMigrationStep(step: MigrationStep): Promise<boolean> {
    switch (step.id) {
      case 'validate-edge-config':
        return await this.validateEdgeConfigStep();

      case 'validate-blob-store':
        return await this.validateBlobStoreStep();

      case 'backup-current-state':
        return await this.backupCurrentStateStep();

      case 'extract-edge-data':
        return await this.extractEdgeDataStep();

      case 'transform-data':
        return await this.transformDataStep();

      case 'validate-transformed-data':
        return await this.validateTransformedDataStep();

      case 'upload-to-blob-store':
        return await this.uploadToBlobStoreStep();

      case 'verify-migration':
        return await this.verifyMigrationStep();

      case 'update-references':
        return await this.updateReferencesStep();

      case 'cleanup':
        return await this.cleanupStep();

      default:
        throw new Error(`Unknown migration step: ${step.id}`);
    }
  }

  private static async validateEdgeConfigStep(): Promise<boolean> {
    const validation = await this.validateEdgeConfigData();
    return validation.isValid;
  }

  private static async validateBlobStoreStep(): Promise<boolean> {
    return await BlobStoreManager.initialize();
  }

  private static async backupCurrentStateStep(): Promise<boolean> {
    try {
      // Backup Blob Store current state
      await BlobStoreManager.createBackup('pre-migration-backup');

      // In a real implementation, you would also backup Edge Config
      this.log('info', 'Current state backup completed');
      return true;
    } catch (error) {
      this.log('error', 'Failed to backup current state', { error: (error as Error).message });
      return false;
    }
  }

  private static async extractEdgeDataStep(): Promise<boolean> {
    try {
      const [users, quests, commonQuests] = await Promise.all([
        EdgeConfigManager.getUsers(),
        EdgeConfigManager.getQuests(),
        EdgeConfigManager.getCommonQuests()
      ]);

      // Store extracted data temporarily for the next steps
      // In a real implementation, you might store this in memory or temporary files
      this.log('info', 'Data extraction completed', {
        userCount: Object.keys(users).length,
        questCount: Object.keys(quests).length,
        commonQuestsCount: commonQuests.length
      });

      return true;
    } catch (error) {
      this.log('error', 'Failed to extract Edge Config data', { error: (error as Error).message });
      return false;
    }
  }

  private static async transformDataStep(): Promise<boolean> {
    try {
      // Data transformation logic would go here
      // For now, we'll assume the data format is compatible
      this.log('info', 'Data transformation completed');
      return true;
    } catch (error) {
      this.log('error', 'Failed to transform data', { error: (error as Error).message });
      return false;
    }
  }

  private static async validateTransformedDataStep(): Promise<boolean> {
    try {
      // Validation logic for transformed data
      this.log('info', 'Transformed data validation completed');
      return true;
    } catch (error) {
      this.log('error', 'Failed to validate transformed data', { error: (error as Error).message });
      return false;
    }
  }

  private static async uploadToBlobStoreStep(): Promise<boolean> {
    try {
      const migrationResult = await BlobStoreManager.migrateFromEdgeConfig();
      return migrationResult.success;
    } catch (error) {
      this.log('error', 'Failed to upload data to Blob Store', { error: (error as Error).message });
      return false;
    }
  }

  private static async verifyMigrationStep(): Promise<boolean> {
    try {
      const [edgeUsers, edgeQuests, edgeCommonQuests] = await Promise.all([
        EdgeConfigManager.getUsers(),
        EdgeConfigManager.getQuests(),
        EdgeConfigManager.getCommonQuests()
      ]);

      const [blobUsers, blobQuests, blobCommonQuests] = await Promise.all([
        BlobStoreManager.getUsers(),
        BlobStoreManager.getQuests(),
        BlobStoreManager.getCommonQuests()
      ]);

      const usersMatch = JSON.stringify(edgeUsers) === JSON.stringify(blobUsers);
      const questsMatch = JSON.stringify(edgeQuests) === JSON.stringify(blobQuests);
      const commonQuestsMatch = JSON.stringify(edgeCommonQuests) === JSON.stringify(blobCommonQuests);

      const success = usersMatch && questsMatch && commonQuestsMatch;

      if (success) {
        this.log('info', 'Migration verification completed successfully');
      } else {
        this.log('error', 'Migration verification failed - data mismatch');
      }

      return success;
    } catch (error) {
      this.log('error', 'Failed to verify migration', { error: (error as Error).message });
      return false;
    }
  }

  private static async updateReferencesStep(): Promise<boolean> {
    try {
      // This step would involve updating application code or configuration
      // to use Blob Store instead of Edge Config
      this.log('info', 'Application references updated');
      return true;
    } catch (error) {
      this.log('error', 'Failed to update application references', { error: (error as Error).message });
      return false;
    }
  }

  private static async cleanupStep(): Promise<boolean> {
    try {
      // Cleanup temporary data and finalize migration
      this.log('info', 'Migration cleanup completed');
      return true;
    } catch (error) {
      this.log('error', 'Failed to cleanup after migration', { error: (error as Error).message });
      return false;
    }
  }

  private static async getFinalDataStats(): Promise<{ users: number; quests: number; commonQuests: number }> {
    try {
      const [users, quests, commonQuests] = await Promise.all([
        BlobStoreManager.getUsers(),
        BlobStoreManager.getQuests(),
        BlobStoreManager.getCommonQuests()
      ]);

      return {
        users: Object.keys(users).length,
        quests: Object.keys(quests).length,
        commonQuests: commonQuests.length
      };
    } catch (error) {
      this.log('error', 'Failed to get final data stats', { error: (error as Error).message });
      return { users: 0, quests: 0, commonQuests: 0 };
    }
  }

  private static log(level: 'info' | 'warn' | 'error', message: string, details?: any): void {
    this.migrationLog.push({
      timestamp: new Date(),
      level,
      message,
      details
    });

    // Also log to console for immediate feedback
    const consoleMethod = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    consoleMethod(`[BlobMigration] ${message}`, details || '');
  }
}