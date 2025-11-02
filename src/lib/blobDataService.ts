import { BlobStorageStrategy } from './blobStorageStrategy';
import { BlobStoreManager } from './blobStore';
import { UserConfig, QuestConfig } from './userManager';

/**
 * Blob Data Service
 * Updated service to use Blob Store as primary storage
 * Replaces VercelDataService with full read/write capabilities
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  fallback?: boolean;
  blobStoreAvailable?: boolean;
}

/**
 * Updated data service using Blob Store as primary storage
 */
export class BlobDataService {
  private static isInitialized = false;

  /**
   * Initialize the Blob Data Service
   */
  static async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    try {
      console.log('🚀 Initializing Blob Data Service...');

      const success = await BlobStorageStrategy.initialize();
      if (!success) {
        throw new Error('Failed to initialize storage strategy');
      }

      // Warm up cache with commonly accessed data
      await BlobStorageStrategy.warmupCache();

      this.isInitialized = true;
      console.log('✅ Blob Data Service initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Blob Data Service:', error);
      return false;
    }
  }

  /**
   * Check if the service is ready
   */
  static isReady(): boolean {
    return this.isInitialized && BlobStoreManager.isReady();
  }

  /**
   * Get all users and configuration
   */
  static async getUsers(): Promise<ApiResponse<{ users: Record<string, UserConfig>; commonQuests: string[] }>> {
    try {
      const [users, commonQuests] = await Promise.all([
        BlobStorageStrategy.read<Record<string, UserConfig>>('users'),
        BlobStorageStrategy.read<string[]>('commonQuests')
      ]);

      return {
        success: true,
        data: {
          users: users || {},
          commonQuests: commonQuests || []
        },
        blobStoreAvailable: true,
        message: 'Users loaded from Blob Store'
      };
    } catch (error) {
      console.error('Error fetching users from Blob Store:', error);
      return {
        success: false,
        error: `Failed to fetch users: ${(error as Error).message}`,
        blobStoreAvailable: false
      };
    }
  }

  /**
   * Create a new user
   */
  static async createUser(userData: Partial<UserConfig>): Promise<ApiResponse<UserConfig>> {
    try {
      // Get current users
      const currentUsers = await BlobStorageStrategy.read<Record<string, UserConfig>>('users') || {};

      const newUser: UserConfig = {
        id: userData.id || `user${Date.now()}`,
        name: userData.name || 'Nouvel Utilisateur',
        avatar: userData.avatar || '👤',
        dailyQuests: userData.dailyQuests || ['1', '2', '3'],
        preferences: userData.preferences || {
          categories: ['santé', 'apprentissage'],
          difficulty: 'facile',
          questCount: 3,
          allowCommonQuests: true
        },
        stats: userData.stats || {
          totalXP: 0,
          currentLevel: 1,
          currentXP: 0,
          xpToNextLevel: 100,
          questsCompleted: 0,
          totalQuestsCompleted: 0,
          currentStreak: 0,
          longestStreak: 0
        }
      };

      // Add new user
      currentUsers[newUser.id] = newUser;

      // Save to Blob Store
      const success = await BlobStorageStrategy.write('users', currentUsers);

      if (success) {
        // Create backup after user creation
        await BlobStorageStrategy.createBackup('user-creation', { userId: newUser.id });

        return {
          success: true,
          data: newUser,
          blobStoreAvailable: true,
          message: 'User created successfully in Blob Store'
        };
      } else {
        throw new Error('Failed to save user to Blob Store');
      }
    } catch (error) {
      console.error('Error creating user in Blob Store:', error);
      return {
        success: false,
        error: `Failed to create user: ${(error as Error).message}`,
        blobStoreAvailable: false
      };
    }
  }

  /**
   * Update an existing user
   */
  static async updateUser(userId: string, updates: Partial<UserConfig>): Promise<ApiResponse<UserConfig>> {
    try {
      // Get current users
      const currentUsers = await BlobStorageStrategy.read<Record<string, UserConfig>>('users') || {};

      if (!currentUsers[userId]) {
        throw new Error(`User ${userId} not found`);
      }

      // Create backup before update
      const oldUserData = { ...currentUsers[userId] };

      // Update user
      const updatedUser: UserConfig = {
        ...currentUsers[userId],
        ...updates,
        id: userId // Ensure ID doesn't change
      };

      currentUsers[userId] = updatedUser;

      // Save to Blob Store
      const success = await BlobStorageStrategy.write('users', currentUsers);

      if (success) {
        // Create backup after user update
        await BlobStorageStrategy.createBackup('user-update', {
          userId,
          oldUserData,
          newUserData: updatedUser
        });

        return {
          success: true,
          data: updatedUser,
          blobStoreAvailable: true,
          message: 'User updated successfully in Blob Store'
        };
      } else {
        throw new Error('Failed to update user in Blob Store');
      }
    } catch (error) {
      console.error('Error updating user in Blob Store:', error);
      return {
        success: false,
        error: `Failed to update user: ${(error as Error).message}`,
        blobStoreAvailable: false
      };
    }
  }

  /**
   * Delete a user
   */
  static async deleteUser(userId: string): Promise<ApiResponse> {
    try {
      // Get current users
      const currentUsers = await BlobStorageStrategy.read<Record<string, UserConfig>>('users') || {};

      if (!currentUsers[userId]) {
        throw new Error(`User ${userId} not found`);
      }

      // Create backup before deletion
      const deletedUserData = { ...currentUsers[userId] };

      // Delete user
      delete currentUsers[userId];

      // Save to Blob Store
      const success = await BlobStorageStrategy.write('users', currentUsers);

      if (success) {
        // Create backup after user deletion
        await BlobStorageStrategy.createBackup('user-deletion', {
          userId,
          deletedUserData
        });

        return {
          success: true,
          blobStoreAvailable: true,
          message: 'User deleted successfully from Blob Store'
        };
      } else {
        throw new Error('Failed to delete user from Blob Store');
      }
    } catch (error) {
      console.error('Error deleting user from Blob Store:', error);
      return {
        success: false,
        error: `Failed to delete user: ${(error as Error).message}`,
        blobStoreAvailable: false
      };
    }
  }

  /**
   * Get all quests
   */
  static async getQuests(): Promise<ApiResponse<Record<string, QuestConfig>>> {
    try {
      const quests = await BlobStorageStrategy.read<Record<string, QuestConfig>>('quests');

      return {
        success: true,
        data: quests || {},
        blobStoreAvailable: true,
        message: 'Quests loaded from Blob Store'
      };
    } catch (error) {
      console.error('Error fetching quests from Blob Store:', error);
      return {
        success: false,
        error: `Failed to fetch quests: ${(error as Error).message}`,
        blobStoreAvailable: false
      };
    }
  }

  /**
   * Create a new quest
   */
  static async createQuest(questData: Partial<QuestConfig>): Promise<ApiResponse<QuestConfig>> {
    try {
      // Get current quests
      const currentQuests = await BlobStorageStrategy.read<Record<string, QuestConfig>>('quests') || {};

      const newQuest: QuestConfig = {
        id: questData.id || `quest${Date.now()}`,
        title: questData.title || 'Nouvelle Quête',
        description: questData.description || '',
        category: questData.category || 'personnel',
        xp: questData.xp || 10,
        difficulty: questData.difficulty || 'moyen',
        icon: questData.icon || '📋',
        tags: questData.tags || [],
        requirements: questData.requirements || []
      };

      // Add new quest
      currentQuests[newQuest.id] = newQuest;

      // Save to Blob Store
      const success = await BlobStorageStrategy.write('quests', currentQuests);

      if (success) {
        // Create backup after quest creation
        await BlobStorageStrategy.createBackup('quest-creation', { questId: newQuest.id });

        return {
          success: true,
          data: newQuest,
          blobStoreAvailable: true,
          message: 'Quest created successfully in Blob Store'
        };
      } else {
        throw new Error('Failed to save quest to Blob Store');
      }
    } catch (error) {
      console.error('Error creating quest in Blob Store:', error);
      return {
        success: false,
        error: `Failed to create quest: ${(error as Error).message}`,
        blobStoreAvailable: false
      };
    }
  }

  /**
   * Update an existing quest
   */
  static async updateQuest(questId: string, updates: Partial<QuestConfig>): Promise<ApiResponse<QuestConfig>> {
    try {
      // Get current quests
      const currentQuests = await BlobStorageStrategy.read<Record<string, QuestConfig>>('quests') || {};

      if (!currentQuests[questId]) {
        throw new Error(`Quest ${questId} not found`);
      }

      // Create backup before update
      const oldQuestData = { ...currentQuests[questId] };

      // Update quest
      const updatedQuest: QuestConfig = {
        ...currentQuests[questId],
        ...updates,
        id: questId // Ensure ID doesn't change
      };

      currentQuests[questId] = updatedQuest;

      // Save to Blob Store
      const success = await BlobStorageStrategy.write('quests', currentQuests);

      if (success) {
        // Create backup after quest update
        await BlobStorageStrategy.createBackup('quest-update', {
          questId,
          oldQuestData,
          newQuestData: updatedQuest
        });

        return {
          success: true,
          data: updatedQuest,
          blobStoreAvailable: true,
          message: 'Quest updated successfully in Blob Store'
        };
      } else {
        throw new Error('Failed to update quest in Blob Store');
      }
    } catch (error) {
      console.error('Error updating quest in Blob Store:', error);
      return {
        success: false,
        error: `Failed to update quest: ${(error as Error).message}`,
        blobStoreAvailable: false
      };
    }
  }

  /**
   * Delete a quest
   */
  static async deleteQuest(questId: string): Promise<ApiResponse> {
    try {
      // Get current quests
      const currentQuests = await BlobStorageStrategy.read<Record<string, QuestConfig>>('quests') || {};

      if (!currentQuests[questId]) {
        throw new Error(`Quest ${questId} not found`);
      }

      // Create backup before deletion
      const deletedQuestData = { ...currentQuests[questId] };

      // Delete quest
      delete currentQuests[questId];

      // Save to Blob Store
      const success = await BlobStorageStrategy.write('quests', currentQuests);

      if (success) {
        // Create backup after quest deletion
        await BlobStorageStrategy.createBackup('quest-deletion', {
          questId,
          deletedQuestData
        });

        return {
          success: true,
          blobStoreAvailable: true,
          message: 'Quest deleted successfully from Blob Store'
        };
      } else {
        throw new Error('Failed to delete quest from Blob Store');
      }
    } catch (error) {
      console.error('Error deleting quest from Blob Store:', error);
      return {
        success: false,
        error: `Failed to delete quest: ${(error as Error).message}`,
        blobStoreAvailable: false
      };
    }
  }

  /**
   * Get full configuration
   */
  static async getConfig(): Promise<ApiResponse<{
    users: Record<string, UserConfig>;
    quests: Record<string, QuestConfig>;
    commonQuests: string[];
    isBlobStoreAvailable: boolean;
  }>> {
    try {
      const [usersData, questsData] = await Promise.all([
        this.getUsers(),
        this.getQuests()
      ]);

      return {
        success: usersData.success && questsData.success,
        data: {
          users: usersData.data?.users || {},
          quests: questsData.data || {},
          commonQuests: usersData.data?.commonQuests || [],
          isBlobStoreAvailable: (usersData.blobStoreAvailable && questsData.blobStoreAvailable) || false
        },
        blobStoreAvailable: (usersData.blobStoreAvailable && questsData.blobStoreAvailable) || false,
        message: 'Configuration loaded from Blob Store'
      };
    } catch (error) {
      console.error('Error fetching configuration from Blob Store:', error);
      return {
        success: false,
        error: `Failed to fetch configuration: ${(error as Error).message}`,
        blobStoreAvailable: false
      };
    }
  }

  /**
   * Update full configuration
   */
  static async updateConfig(
    users: Record<string, UserConfig>,
    quests: Record<string, QuestConfig>,
    commonQuests: string[]
  ): Promise<ApiResponse> {
    try {
      // Use batch write for atomic operation
      const operations = [
        { key: 'users', data: users, createBackup: false },
        { key: 'quests', data: quests, createBackup: false },
        { key: 'commonQuests', data: commonQuests, createBackup: false }
      ];

      const success = await BlobStorageStrategy.batchWrite(operations);

      if (success) {
        // Create backup after batch update
        await BlobStorageStrategy.createBackup('full-config-update', {
          usersCount: Object.keys(users).length,
          questsCount: Object.keys(quests).length,
          commonQuestsCount: commonQuests.length
        });

        return {
          success: true,
          blobStoreAvailable: true,
          message: 'Configuration updated successfully in Blob Store'
        };
      } else {
        throw new Error('Failed to update configuration in Blob Store');
      }
    } catch (error) {
      console.error('Error updating configuration in Blob Store:', error);
      return {
        success: false,
        error: `Failed to update configuration: ${(error as Error).message}`,
        blobStoreAvailable: false
      };
    }
  }

  /**
   * Verify admin password
   */
  static async verifyAdminPassword(password: string): Promise<boolean> {
    try {
      const adminPassword = await BlobStorageStrategy.read<string>('adminPassword');
      return password === (adminPassword || 'admin123');
    } catch (error) {
      console.error('Error verifying admin password:', error);
      return password === 'admin123'; // Fallback to default
    }
  }

  /**
   * Update admin password
   */
  static async updateAdminPassword(newPassword: string): Promise<ApiResponse> {
    try {
      const success = await BlobStorageStrategy.write('adminPassword', newPassword);

      if (success) {
        // Create backup after password update
        await BlobStorageStrategy.createBackup('admin-password-update');

        return {
          success: true,
          blobStoreAvailable: true,
          message: 'Admin password updated successfully in Blob Store'
        };
      } else {
        throw new Error('Failed to update admin password in Blob Store');
      }
    } catch (error) {
      console.error('Error updating admin password in Blob Store:', error);
      return {
        success: false,
        error: `Failed to update admin password: ${(error as Error).message}`,
        blobStoreAvailable: false
      };
    }
  }

  /**
   * Get service health status
   */
  static async getHealthStatus(): Promise<ApiResponse<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: any;
    metrics: any;
  }>> {
    try {
      const healthCheck = await BlobStorageStrategy.healthCheck();
      const metrics = BlobStorageStrategy.getMetrics();
      const stats = await BlobStoreManager.getStats();

      return {
        success: true,
        data: {
          status: healthCheck.status,
          details: healthCheck.details,
          metrics: {
            ...metrics,
            storageStats: stats
          }
        },
        blobStoreAvailable: true,
        message: 'Health status retrieved successfully'
      };
    } catch (error) {
      console.error('Error getting health status:', error);
      return {
        success: false,
        error: `Failed to get health status: ${(error as Error).message}`,
        blobStoreAvailable: false
      };
    }
  }

  /**
   * Export data for download
   */
  static async exportData(type: 'users' | 'quests' | 'full'): Promise<ApiResponse<{ filename: string; data: string }>> {
    try {
      let data: any;
      let filename: string;

      switch (type) {
        case 'users':
          const usersResponse = await this.getUsers();
          data = {
            users: usersResponse.data?.users || {},
            commonQuests: usersResponse.data?.commonQuests || [],
            exportedAt: new Date().toISOString(),
            version: '2.0'
          };
          filename = `users-export-${new Date().toISOString().split('T')[0]}.json`;
          break;

        case 'quests':
          const questsResponse = await this.getQuests();
          data = {
            quests: questsResponse.data || {},
            exportedAt: new Date().toISOString(),
            version: '2.0'
          };
          filename = `quests-export-${new Date().toISOString().split('T')[0]}.json`;
          break;

        case 'full':
          const configResponse = await this.getConfig();
          data = {
            users: configResponse.data?.users || {},
            quests: configResponse.data?.quests || {},
            commonQuests: configResponse.data?.commonQuests || [],
            exportedAt: new Date().toISOString(),
            version: '2.0'
          };
          filename = `full-export-${new Date().toISOString().split('T')[0]}.json`;
          break;

        default:
          throw new Error(`Unknown export type: ${type}`);
      }

      return {
        success: true,
        data: {
          filename,
          data: JSON.stringify(data, null, 2)
        },
        blobStoreAvailable: true,
        message: `${type} data exported successfully`
      };
    } catch (error) {
      console.error('Error exporting data:', error);
      return {
        success: false,
        error: `Failed to export data: ${(error as Error).message}`,
        blobStoreAvailable: false
      };
    }
  }

  /**
   * Import data from file
   */
  static async importData(data: any, type: 'users' | 'quests' | 'full'): Promise<ApiResponse> {
    try {
      let success = false;

      switch (type) {
        case 'users':
          if (data.users && typeof data.users === 'object') {
            success = await BlobStorageStrategy.write('users', data.users);
            if (data.commonQuests && Array.isArray(data.commonQuests)) {
              await BlobStorageStrategy.write('commonQuests', data.commonQuests);
            }
          }
          break;

        case 'quests':
          if (data.quests && typeof data.quests === 'object') {
            success = await BlobStorageStrategy.write('quests', data.quests);
          }
          break;

        case 'full':
          const operations = [];
          if (data.users && typeof data.users === 'object') {
            operations.push({ key: 'users', data: data.users });
          }
          if (data.quests && typeof data.quests === 'object') {
            operations.push({ key: 'quests', data: data.quests });
          }
          if (data.commonQuests && Array.isArray(data.commonQuests)) {
            operations.push({ key: 'commonQuests', data: data.commonQuests });
          }

          if (operations.length > 0) {
            success = await BlobStorageStrategy.batchWrite(operations);
          }
          break;

        default:
          throw new Error(`Unknown import type: ${type}`);
      }

      if (success) {
        // Create backup after import
        await BlobStorageStrategy.createBackup('data-import', { type, timestamp: new Date().toISOString() });

        return {
          success: true,
          blobStoreAvailable: true,
          message: `${type} data imported successfully`
        };
      } else {
        throw new Error(`Failed to import ${type} data`);
      }
    } catch (error) {
      console.error('Error importing data:', error);
      return {
        success: false,
        error: `Failed to import data: ${(error as Error).message}`,
        blobStoreAvailable: false
      };
    }
  }
}