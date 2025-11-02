import { put, head, list, del } from '@vercel/blob';

// Enhanced TypeScript interfaces for Blob Store
export interface BlobStoreConfig {
  users: Record<string, any>;
  quests: Record<string, any>;
  commonQuests: string[];
  adminPassword: string;
  lastUpdated: string;
  version: string;
}

export interface BlobStoreMetrics {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  lastOperation: string;
  storageSize: number;
  lastUpdated: string;
}

export interface BlobStoreError {
  code: string;
  message: string;
  timestamp: string;
  operation: string;
}

export class BlobStoreManager {
  private blobToken: string;
  private primaryPath: string;
  private backupPath: string;
  private metrics: BlobStoreMetrics;
  private errorHistory: BlobStoreError[] = [];

  constructor() {
    this.blobToken = process.env.BLOB_READ_WRITE_TOKEN || '';
    this.primaryPath = process.env.BLOB_STORE_PRIMARY_PATH || 'quest-app/data/main-config.json';
    this.backupPath = process.env.BLOB_STORE_BACKUP_PATH || 'quest-app/backups/';

    this.metrics = {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      lastOperation: '',
      storageSize: 0,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Check if Blob Store is properly configured and accessible
   */
  async isAvailable(): Promise<boolean> {
    try {
      if (!this.blobToken) {
        console.warn('Blob Store token not configured');
        return false;
      }

      // Try to access the primary configuration file
      const blobExists = await this.blobExists(this.primaryPath);
      return blobExists;
    } catch (error) {
      console.error('Blob Store availability check failed:', error);
      this.logError('AVAILABILITY_CHECK', error);
      return false;
    }
  }

  /**
   * Get the full configuration from Blob Store
   */
  async getFullConfig(): Promise<BlobStoreConfig | null> {
    try {
      this.metrics.totalOperations++;
      this.metrics.lastOperation = 'GET_FULL_CONFIG';

      const response = await fetch(this.primaryPath);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const config = await response.json();
      this.metrics.successfulOperations++;
      this.metrics.lastUpdated = new Date().toISOString();

      // Update storage size
      this.metrics.storageSize = JSON.stringify(config).length;

      return config;
    } catch (error) {
      this.metrics.failedOperations++;
      this.logError('GET_FULL_CONFIG', error);
      console.error('Failed to get full config from Blob Store:', error);
      return null;
    }
  }

  /**
   * Get all users from Blob Store (replaces EdgeConfigManager.getUsers)
   */
  async getUsers(): Promise<Record<string, any>> {
    try {
      const config = await this.getFullConfig();
      const users = config?.users || {};
      console.log(' Données utilisateurs chargées via Blob Store');
      return JSON.parse(JSON.stringify(users)); // Deep clone like Edge Config's clone()
    } catch (error) {
      this.logError('GET_USERS', error);
      console.error('Failed to get users from Blob Store:', error);
      return {};
    }
  }

  /**
   * Get all quests from Blob Store (replaces EdgeConfigManager.getQuests)
   */
  async getQuests(): Promise<Record<string, any>> {
    try {
      const config = await this.getFullConfig();
      const quests = config?.quests || {};
      console.log(' Données quêtes chargées via Blob Store');
      return JSON.parse(JSON.stringify(quests)); // Deep clone like Edge Config's clone()
    } catch (error) {
      this.logError('GET_QUESTS', error);
      console.error('Failed to get quests from Blob Store:', error);
      return {};
    }
  }

  /**
   * Get common quests from Blob Store (replaces EdgeConfigManager.getCommonQuests)
   */
  async getCommonQuests(): Promise<string[]> {
    try {
      const config = await this.getFullConfig();
      const commonQuests = config?.commonQuests || [];
      console.log(' Quêtes communes chargées via Blob Store');
      return JSON.parse(JSON.stringify(commonQuests)); // Deep clone like Edge Config's clone()
    } catch (error) {
      this.logError('GET_COMMON_QUESTS', error);
      console.error('Failed to get common quests from Blob Store:', error);
      return [];
    }
  }

  /**
   * Get admin password from Blob Store (replaces EdgeConfigManager.getAdminPassword)
   */
  async getAdminPassword(): Promise<string> {
    try {
      const config = await this.getFullConfig();
      const password = config?.adminPassword || 'admin123';
      console.log(' Mot de passe admin chargé via Blob Store');
      return password;
    } catch (error) {
      this.logError('GET_ADMIN_PASSWORD', error);
      console.error('Failed to get admin password from Blob Store:', error);
      return 'admin123';
    }
  }

  /**
   * Update users in Blob Store (replaces EdgeConfigManager.updateUsers)
   * This now actually works unlike Edge Config's read-only limitation
   */
  async updateUsers(users: Record<string, any>): Promise<boolean> {
    try {
      this.metrics.totalOperations++;
      this.metrics.lastOperation = 'UPDATE_USERS';

      const config = await this.getFullConfig();
      if (!config) {
        throw new Error('Unable to retrieve current configuration');
      }

      // Create backup before updating
      await this.createBackup(config);

      // Update users data
      config.users = users;
      config.lastUpdated = new Date().toISOString();
      config.version = this.generateVersion();

      // Upload updated configuration
      const blob = await put(this.primaryPath, JSON.stringify(config, null, 2), {
        access: 'public',
        token: this.blobToken,
        contentType: 'application/json'
      });

      this.metrics.successfulOperations++;
      this.metrics.lastUpdated = new Date().toISOString();
      this.metrics.storageSize = JSON.stringify(config).length;

      console.log(' Utilisateurs mis à jour avec succès dans Blob Store:', blob.url);
      return true;
    } catch (error) {
      this.metrics.failedOperations++;
      this.logError('UPDATE_USERS', error);
      console.error('Failed to update users in Blob Store:', error);
      return false;
    }
  }

  /**
   * Update quests in Blob Store (replaces EdgeConfigManager.updateQuests)
   * This now actually works unlike Edge Config's read-only limitation
   */
  async updateQuests(quests: Record<string, any>): Promise<boolean> {
    try {
      this.metrics.totalOperations++;
      this.metrics.lastOperation = 'UPDATE_QUESTS';

      const config = await this.getFullConfig();
      if (!config) {
        throw new Error('Unable to retrieve current configuration');
      }

      // Create backup before updating
      await this.createBackup(config);

      // Update quests data
      config.quests = quests;
      config.lastUpdated = new Date().toISOString();
      config.version = this.generateVersion();

      // Upload updated configuration
      const blob = await put(this.primaryPath, JSON.stringify(config, null, 2), {
        access: 'public',
        token: this.blobToken,
        contentType: 'application/json'
      });

      this.metrics.successfulOperations++;
      this.metrics.lastUpdated = new Date().toISOString();
      this.metrics.storageSize = JSON.stringify(config).length;

      console.log(' Quêtes mises à jour avec succès dans Blob Store:', blob.url);
      return true;
    } catch (error) {
      this.metrics.failedOperations++;
      this.logError('UPDATE_QUESTS', error);
      console.error('Failed to update quests in Blob Store:', error);
      return false;
    }
  }

  /**
   * Create a backup of the current configuration
   */
  async createBackup(config?: BlobStoreConfig): Promise<string | null> {
    try {
      const configToBackup = config || await this.getFullConfig();
      if (!configToBackup) {
        throw new Error('No configuration available for backup');
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = `${this.backupPath}backup-${timestamp}.json`;

      const blob = await put(backupPath, JSON.stringify(configToBackup, null, 2), {
        access: 'public',
        token: this.blobToken,
        contentType: 'application/json'
      });

      console.log(' Backup créé avec succès:', blob.url);
      return blob.url;
    } catch (error) {
      this.logError('CREATE_BACKUP', error);
      console.error('Failed to create backup in Blob Store:', error);
      return null;
    }
  }

  /**
   * List all available backups
   */
  async listBackups(): Promise<string[]> {
    try {
      const { blobs } = await list({
        token: this.blobToken,
        prefix: this.backupPath
      });

      return blobs
        .filter(blob => blob.pathname.includes('backup-'))
        .map(blob => blob.url)
        .sort()
        .reverse(); // Most recent first
    } catch (error) {
      this.logError('LIST_BACKUPS', error);
      console.error('Failed to list backups from Blob Store:', error);
      return [];
    }
  }

  /**
   * Restore configuration from a backup
   */
  async restoreFromBackup(backupUrl: string): Promise<boolean> {
    try {
      const response = await fetch(backupUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const backupConfig = await response.json();
      return await this.updateFullConfig(backupConfig);
    } catch (error) {
      this.logError('RESTORE_BACKUP', error);
      console.error('Failed to restore from backup:', error);
      return false;
    }
  }

  /**
   * Update the full configuration in Blob Store
   */
  async updateFullConfig(config: BlobStoreConfig): Promise<boolean> {
    try {
      this.metrics.totalOperations++;
      this.metrics.lastOperation = 'UPDATE_FULL_CONFIG';

      // Create backup before updating
      await this.createBackup(config);

      // Upload the updated configuration
      const blob = await put(this.primaryPath, JSON.stringify(config, null, 2), {
        access: 'public',
        token: this.blobToken,
        contentType: 'application/json'
      });

      this.metrics.successfulOperations++;
      this.metrics.lastUpdated = new Date().toISOString();
      this.metrics.storageSize = JSON.stringify(config).length;

      console.log(' Configuration mise à jour avec succès dans Blob Store:', blob.url);
      return true;
    } catch (error) {
      this.metrics.failedOperations++;
      this.logError('UPDATE_FULL_CONFIG', error);
      console.error('Failed to update config in Blob Store:', error);
      return false;
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): BlobStoreMetrics {
    return { ...this.metrics };
  }

  /**
   * Get error history
   */
  getErrorHistory(): BlobStoreError[] {
    return [...this.errorHistory];
  }

  /**
   * Clear error history
   */
  clearErrorHistory(): void {
    this.errorHistory = [];
  }

  /**
   * Check if a blob exists
   */
  private async blobExists(path: string): Promise<boolean> {
    try {
      await head({ url: path, token: this.blobToken });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Log error with context
   */
  private logError(operation: string, error: any): void {
    const errorEntry: BlobStoreError = {
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || 'Unknown error occurred',
      timestamp: new Date().toISOString(),
      operation
    };

    this.errorHistory.push(errorEntry);

    // Keep only last 50 errors
    if (this.errorHistory.length > 50) {
      this.errorHistory = this.errorHistory.slice(-50);
    }
  }

  /**
   * Generate version string
   */
  private generateVersion(): string {
    const now = new Date();
    return `${now.getFullYear()}.${now.getMonth() + 1}.${now.getDate()}-${now.getHours()}.${now.getMinutes()}`;
  }

  /**
   * Clean up old backups (keep only the most recent N backups)
   */
  async cleanupOldBackups(keepCount: number = 10): Promise<boolean> {
    try {
      const { blobs } = await list({
        token: this.blobToken,
        prefix: this.backupPath
      });

      const backupBlobs = blobs
        .filter(blob => blob.pathname.includes('backup-'))
        .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

      // Delete old backups beyond the keep count
      const blobsToDelete = backupBlobs.slice(keepCount);

      for (const blob of blobsToDelete) {
        await del(blob.url, { token: this.blobToken });
      }

      console.log(` Nettoyé ${blobsToDelete.length} anciens backups`);
      return true;
    } catch (error) {
      this.logError('CLEANUP_BACKUPS', error);
      console.error('Failed to cleanup old backups:', error);
      return false;
    }
  }
}

// Export singleton instance (same pattern as EdgeConfigManager)
export const blobStoreManager = new BlobStoreManager();