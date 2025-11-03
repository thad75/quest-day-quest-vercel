import { UserConfig, QuestConfig } from './userManager';

/**
 * Admin API Service for user management operations
 * Integrates with the new admin endpoints in /api/blob/admin/
 */

export class AdminApiService {
  private static readonly API_BASE = '/api/blob/admin';

  /**
   * Create a new user using the new data structure
   */
  static async createUser(userData: Partial<UserConfig>): Promise<{ success: boolean; message: string; userId?: string; userData?: UserConfig }> {
    try {
      const response = await fetch(`${this.API_BASE}/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ User created successfully via admin API');

      return {
        success: data.success,
        message: data.message,
        userId: data.userId,
        userData: data.userData
      };
    } catch (error) {
      console.error('❌ Failed to create user via admin API:', error);
      return {
        success: false,
        message: `Failed to create user: ${(error as Error).message}`
      };
    }
  }

  /**
   * Delete a user and clean up their data
   */
  static async deleteUser(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.API_BASE}/delete-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ User deleted successfully via admin API');

      return {
        success: data.success,
        message: data.message
      };
    } catch (error) {
      console.error('❌ Failed to delete user via admin API:', error);
      return {
        success: false,
        message: `Failed to delete user: ${(error as Error).message}`
      };
    }
  }

  /**
   * Modify/update user information
   */
  static async modifyUser(userId: string, userData: Partial<UserConfig>): Promise<{ success: boolean; message: string; userData?: UserConfig }> {
    try {
      const response = await fetch(`${this.API_BASE}/modify-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, userData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ User modified successfully via admin API');

      return {
        success: data.success,
        message: data.message,
        userData: data.userData
      };
    } catch (error) {
      console.error('❌ Failed to modify user via admin API:', error);
      return {
        success: false,
        message: `Failed to modify user: ${(error as Error).message}`
      };
    }
  }

  /**
   * Assign tasks/quests to a user
   */
  static async assignTasks(userId: string, questIds: string[], action: 'assign' | 'replace' | 'remove' = 'assign'): Promise<{ success: boolean; message: string; dailyQuests?: string[] }> {
    try {
      const response = await fetch(`${this.API_BASE}/assign-tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, questIds, action }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ Tasks ${action}ed successfully via admin API`);

      return {
        success: data.success,
        message: data.message,
        dailyQuests: data.dailyQuests
      };
    } catch (error) {
      console.error('❌ Failed to assign tasks via admin API:', error);
      return {
        success: false,
        message: `Failed to assign tasks: ${(error as Error).message}`
      };
    }
  }

  /**
   * Get users using the new data structure API
   */
  static async getUsersNew(): Promise<{ users: Record<string, UserConfig>; totalUsers: number; isBlobStore: boolean }> {
    try {
      const response = await fetch('/api/blob/users-new');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Users fetched successfully via new API');
      return data;
    } catch (error) {
      console.error('❌ Failed to fetch users via new API:', error);
      throw new Error('Failed to fetch users via new API');
    }
  }

  /**
   * Get quests using the new data structure API
   */
  static async getQuestsNew(): Promise<{ templates: Record<string, QuestConfig>; isBlobStore: boolean; type: string }> {
    try {
      const response = await fetch('/api/blob/quests-new');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Quests fetched successfully via new API');
      return data;
    } catch (error) {
      console.error('❌ Failed to fetch quests via new API:', error);
      throw new Error('Failed to fetch quests via new API');
    }
  }

  /**
   * Validate admin authentication
   */
  static async validateAdminSession(): Promise<boolean> {
    try {
      // This could be enhanced with proper session validation
      // For now, we'll use the existing admin password verification
      const response = await fetch('/api/blob/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: 'session_check' }),
      });

      // If this fails, we assume the session is invalid
      return response.ok;
    } catch (error) {
      console.error('❌ Admin session validation failed:', error);
      return false;
    }
  }

  /**
   * Bulk operations for user management
   */
  static async bulkCreateUsers(usersData: Partial<UserConfig>[]): Promise<{ success: boolean; message: string; results?: any[] }> {
    try {
      const results = [];
      let successCount = 0;
      let failureCount = 0;

      for (const userData of usersData) {
        const result = await this.createUser(userData);
        results.push(result);

        if (result.success) {
          successCount++;
        } else {
          failureCount++;
        }
      }

      return {
        success: successCount > 0,
        message: `Bulk creation completed: ${successCount} successful, ${failureCount} failed`,
        results
      };
    } catch (error) {
      console.error('❌ Failed to bulk create users:', error);
      return {
        success: false,
        message: `Bulk creation failed: ${(error as Error).message}`
      };
    }
  }

  /**
   * Assign quests to multiple users
   */
  static async bulkAssignTasks(userIds: string[], questIds: string[], action: 'assign' | 'replace' | 'remove' = 'assign'): Promise<{ success: boolean; message: string; results?: any[] }> {
    try {
      const results = [];
      let successCount = 0;
      let failureCount = 0;

      for (const userId of userIds) {
        const result = await this.assignTasks(userId, questIds, action);
        results.push({ userId, ...result });

        if (result.success) {
          successCount++;
        } else {
          failureCount++;
        }
      }

      return {
        success: successCount > 0,
        message: `Bulk assignment completed: ${successCount} successful, ${failureCount} failed`,
        results
      };
    } catch (error) {
      console.error('❌ Failed to bulk assign tasks:', error);
      return {
        success: false,
        message: `Bulk assignment failed: ${(error as Error).message}`
      };
    }
  }
}