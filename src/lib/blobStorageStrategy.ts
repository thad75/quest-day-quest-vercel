import { blobStoreManager, BlobStoreConfig } from './blobStore';

// Interface compatible with existing storage strategy
export interface StorageResult<T> {
  data: T;
  isEdgeConfig: boolean;
  fallback: boolean;
  error?: string;
}

export interface BlobStorageMetrics {
  totalOperations: number;
  cacheHits: number;
  cacheMisses: number;
  averageResponseTime: number;
  lastSyncTime: string;
}

// Cache configuration
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class BlobStorageStrategy {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private metrics: BlobStorageMetrics;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 100;

  constructor() {
    this.metrics = {
      totalOperations: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageResponseTime: 0,
      lastSyncTime: new Date().toISOString()
    };
  }

  /**
   * Get users from Blob Store with caching
   */
  async getUsers(): Promise<StorageResult<Record<string, any>>> {
    return this.withCache('users', () => blobStoreManager.getUsers());
  }

  /**
   * Get quests from Blob Store with caching
   */
  async getQuests(): Promise<StorageResult<Record<string, any>>> {
    return this.withCache('quests', () => blobStoreManager.getQuests());
  }

  /**
   * Get common quests from Blob Store with caching
   */
  async getCommonQuests(): Promise<StorageResult<string[]>> {
    return this.withCache('commonQuests', () => blobStoreManager.getCommonQuests());
  }

  /**
   * Get admin password from Blob Store with caching
   */
  async getAdminPassword(): Promise<StorageResult<string>> {
    return this.withCache('adminPassword', () => blobStoreManager.getAdminPassword());
  }

  /**
   * Get full configuration from Blob Store
   */
  async getFullConfig(): Promise<StorageResult<BlobStoreConfig>> {
    const startTime = Date.now();

    try {
      this.metrics.totalOperations++;

      const config = await blobStoreManager.getFullConfig();

      if (!config) {
        return {
          data: this.getDefaultConfig(),
          isEdgeConfig: false,
          fallback: true,
          error: 'Failed to load configuration from Blob Store'
        };
      }

      // Update cache for all individual components
      this.setCache('users', config.users);
      this.setCache('quests', config.quests);
      this.setCache('commonQuests', config.commonQuests);
      this.setCache('adminPassword', config.adminPassword);

      const responseTime = Date.now() - startTime;
      this.updateAverageResponseTime(responseTime);

      return {
        data: config,
        isEdgeConfig: false,
        fallback: false
      };
    } catch (error) {
      console.error('BlobStorageStrategy.getFullConfig failed:', error);
      return {
        data: this.getDefaultConfig(),
        isEdgeConfig: false,
        fallback: true,
        error: error.message
      };
    }
  }

  /**
   * Update users in Blob Store
   */
  async updateUsers(users: Record<string, any>): Promise<boolean> {
    try {
      this.metrics.totalOperations++;

      const success = await blobStoreManager.updateUsers(users);

      if (success) {
        // Invalidate cache
        this.invalidateCache('users');
        this.metrics.lastSyncTime = new Date().toISOString();
      }

      return success;
    } catch (error) {
      console.error('BlobStorageStrategy.updateUsers failed:', error);
      return false;
    }
  }

  /**
   * Update quests in Blob Store
   */
  async updateQuests(quests: Record<string, any>): Promise<boolean> {
    try {
      this.metrics.totalOperations++;

      const success = await blobStoreManager.updateQuests(quests);

      if (success) {
        // Invalidate cache
        this.invalidateCache('quests');
        this.metrics.lastSyncTime = new Date().toISOString();
      }

      return success;
    } catch (error) {
      console.error('BlobStorageStrategy.updateQuests failed:', error);
      return false;
    }
  }

  /**
   * Update full configuration in Blob Store
   */
  async updateFullConfig(config: BlobStoreConfig): Promise<boolean> {
    try {
      this.metrics.totalOperations++;

      const success = await blobStoreManager.updateFullConfig(config);

      if (success) {
        // Invalidate all cache
        this.clearCache();
        this.metrics.lastSyncTime = new Date().toISOString();
      }

      return success;
    } catch (error) {
      console.error('BlobStorageStrategy.updateFullConfig failed:', error);
      return false;
    }
  }

  /**
   * Create backup
   */
  async createBackup(): Promise<string | null> {
    try {
      return await blobStoreManager.createBackup();
    } catch (error) {
      console.error('BlobStorageStrategy.createBackup failed:', error);
      return null;
    }
  }

  /**
   * List available backups
   */
  async listBackups(): Promise<string[]> {
    try {
      return await blobStoreManager.listBackups();
    } catch (error) {
      console.error('BlobStorageStrategy.listBackups failed:', error);
      return [];
    }
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(backupUrl: string): Promise<boolean> {
    try {
      this.metrics.totalOperations++;

      const success = await blobStoreManager.restoreFromBackup(backupUrl);

      if (success) {
        // Invalidate all cache
        this.clearCache();
        this.metrics.lastSyncTime = new Date().toISOString();
      }

      return success;
    } catch (error) {
      console.error('BlobStorageStrategy.restoreFromBackup failed:', error);
      return false;
    }
  }

  /**
   * Check Blob Store availability
   */
  async isAvailable(): Promise<boolean> {
    try {
      return await blobStoreManager.isAvailable();
    } catch (error) {
      console.error('BlobStorageStrategy.isAvailable failed:', error);
      return false;
    }
  }

  /**
   * Get storage metrics
   */
  getMetrics(): BlobStorageMetrics {
    return { ...this.metrics };
  }

  /**
   * Get Blob Store manager metrics
   */
  getBlobStoreMetrics() {
    return blobStoreManager.getMetrics();
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
      hitRate: this.metrics.totalOperations > 0 ?
        (this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)) * 100 : 0,
      ttl: this.CACHE_TTL
    };
  }

  /**
   * Generic method with caching
   */
  private async withCache<T>(key: string, fetcher: () => Promise<T>): Promise<StorageResult<T>> {
    const startTime = Date.now();
    this.metrics.totalOperations++;

    try {
      // Check cache first
      const cached = this.getCache<T>(key);
      if (cached !== null) {
        this.metrics.cacheHits++;
        return {
          data: cached,
          isEdgeConfig: false,
          fallback: false
        };
      }

      // Cache miss - fetch from Blob Store
      this.metrics.cacheMisses++;
      const data = await fetcher();

      // Update cache
      this.setCache(key, data);

      const responseTime = Date.now() - startTime;
      this.updateAverageResponseTime(responseTime);

      return {
        data,
        isEdgeConfig: false,
        fallback: false
      };
    } catch (error) {
      console.error(`BlobStorageStrategy.withCache failed for ${key}:`, error);
      return {
        data: this.getDefaultValue(key),
        isEdgeConfig: false,
        fallback: true,
        error: error.message
      };
    }
  }

  /**
   * Get cached value if valid
   */
  private getCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set cache value
   */
  private setCache<T>(key: string, data: T): void {
    // Maintain cache size limit
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: this.CACHE_TTL
    });
  }

  /**
   * Invalidate specific cache entry
   */
  private invalidateCache(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Update average response time
   */
  private updateAverageResponseTime(responseTime: number): void {
    if (this.metrics.averageResponseTime === 0) {
      this.metrics.averageResponseTime = responseTime;
    } else {
      this.metrics.averageResponseTime =
        (this.metrics.averageResponseTime + responseTime) / 2;
    }
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): BlobStoreConfig {
    return {
      users: {},
      quests: {},
      commonQuests: [],
      adminPassword: 'admin123',
      lastUpdated: new Date().toISOString(),
      version: '1.0'
    };
  }

  /**
   * Get default value for specific key
   */
  private getDefaultValue<T>(key: string): T {
    const defaults = {
      users: {},
      quests: {},
      commonQuests: [],
      adminPassword: 'admin123'
    };

    return defaults[key] as T;
  }
}

// Export singleton instance
export const blobStorageStrategy = new BlobStorageStrategy();