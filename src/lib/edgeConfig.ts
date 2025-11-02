import { createClient } from '@vercel/edge-config';

// Edge Config client for Vercel Storage
const edgeConfig = createClient(process.env.EDGE_CONFIG || '');

export interface EdgeConfigData {
  users: Record<string, any>;
  quests: Record<string, any>;
  commonQuests: string[];
  adminPassword: string;
  lastUpdated: string;
  version: string;
}

export class EdgeConfigManager {
  /**
   * Get all users from Edge Config
   */
  static async getUsers(): Promise<Record<string, any>> {
    try {
      const users = await edgeConfig.get('users');
      return users || {};
    } catch (error) {
      console.error('Error getting users from Edge Config:', error);
      return {};
    }
  }

  /**
   * Get all quests from Edge Config
   */
  static async getQuests(): Promise<Record<string, any>> {
    try {
      const quests = await edgeConfig.get('quests');
      return quests || {};
    } catch (error) {
      console.error('Error getting quests from Edge Config:', error);
      return {};
    }
  }

  /**
   * Get common quests from Edge Config
   */
  static async getCommonQuests(): Promise<string[]> {
    try {
      const commonQuests = await edgeConfig.get('commonQuests');
      return commonQuests || [];
    } catch (error) {
      console.error('Error getting common quests from Edge Config:', error);
      return [];
    }
  }

  /**
   * Get admin password from Edge Config
   */
  static async getAdminPassword(): Promise<string> {
    try {
      const password = await edgeConfig.get('adminPassword');
      return password || 'admin123';
    } catch (error) {
      console.error('Error getting admin password from Edge Config:', error);
      return 'admin123';
    }
  }

  /**
   * Update users in Edge Config
   */
  static async updateUsers(users: Record<string, any>): Promise<boolean> {
    try {
      // Note: Edge Config doesn't support direct updates from client-side
      // This would need to be done through Vercel API or webhooks
      // For now, we'll use the JSON fallback system
      return false;
    } catch (error) {
      console.error('Error updating users in Edge Config:', error);
      return false;
    }
  }

  /**
   * Update quests in Edge Config
   */
  static async updateQuests(quests: Record<string, any>): Promise<boolean> {
    try {
      // Note: Edge Config doesn't support direct updates from client-side
      // This would need to be done through Vercel API or webhooks
      // For now, we'll use the JSON fallback system
      return false;
    } catch (error) {
      console.error('Error updating quests in Edge Config:', error);
      return false;
    }
  }

  /**
   * Get full configuration from Edge Config
   */
  static async getFullConfig(): Promise<EdgeConfigData> {
    try {
      const [users, quests, commonQuests, adminPassword] = await Promise.all([
        this.getUsers(),
        this.getQuests(),
        this.getCommonQuests(),
        this.getAdminPassword()
      ]);

      return {
        users,
        quests,
        commonQuests,
        adminPassword,
        lastUpdated: new Date().toISOString(),
        version: '1.0'
      };
    } catch (error) {
      console.error('Error getting full config from Edge Config:', error);
      return {
        users: {},
        quests: {},
        commonQuests: [],
        adminPassword: 'admin123',
        lastUpdated: new Date().toISOString(),
        version: '1.0'
      };
    }
  }

  /**
   * Check if Edge Config is available
   */
  static async isAvailable(): Promise<boolean> {
    try {
      const test = await edgeConfig.get('test');
      return true;
    } catch (error) {
      console.error('Edge Config not available:', error);
      return false;
    }
  }
}