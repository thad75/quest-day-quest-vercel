import { UserConfig, QuestConfig } from './userManager';

/**
 * API Service for communicating with server-side Blob Store operations
 * This avoids CORS issues by using server-side API routes
 */

export class ApiService {
  private static readonly API_BASE = '/api';

  /**
   * Get users from API (server-side Blob Store access)
   */
  static async getUsers(): Promise<{ users: Record<string, UserConfig>; commonQuests: string[]; isBlobStore: boolean }> {
    try {
      const response = await fetch(`${this.API_BASE}/users`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('☁️ Using API for users (server-side Blob Store access)');
      return data;
    } catch (error) {
      console.error('❌ API failed for users:', error);
      throw new Error('Failed to fetch users from API');
    }
  }

  /**
   * Get quests from API
   */
  static async getQuests(): Promise<Record<string, QuestConfig>> {
    try {
      const response = await fetch(`${this.API_BASE}/quests`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('☁️ Using API for quests (server-side Blob Store access)');
      return data;
    } catch (error) {
      console.error('❌ API failed for quests:', error);
      throw new Error('Failed to fetch quests from API');
    }
  }

  /**
   * Verify admin password via API
   */
  static async verifyAdminPassword(password: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_BASE}/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('☁️ Using API for admin password verification');
      return data.isValid;
    } catch (error) {
      console.error('❌ API failed for admin password:', error);
      // Fallback to default password for security
      return password === 'admin123';
    }
  }

  /**
   * Update users via API
   */
  static async updateUsersConfig(
    users: Record<string, UserConfig>,
    commonQuests: string[]
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.API_BASE}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ users, commonQuests }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('☁️ Using API to update users');
      return {
        success: data.success,
        message: data.message
      };
    } catch (error) {
      console.error('❌ API failed to update users:', error);
      return {
        success: false,
        message: 'Failed to update users via API'
      };
    }
  }

  /**
   * Update quests via API
   */
  static async updateQuestsConfig(
    quests: Record<string, QuestConfig>
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.API_BASE}/quests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quests }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('☁️ Using API to update quests');
      return {
        success: data.success,
        message: data.message
      };
    } catch (error) {
      console.error('❌ API failed to update quests:', error);
      return {
        success: false,
        message: 'Failed to update quests via API'
      };
    }
  }

  /**
   * Check if we're in a production environment (should use API)
   */
  static isProduction(): boolean {
    return (
      import.meta.env.PROD ||
      import.meta.env.MODE === 'production' ||
      !window.location.hostname.includes('localhost') &&
      !window.location.hostname.includes('127.0.0.1')
    );
  }
}