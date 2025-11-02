import { UserConfig, QuestConfig } from './userManager';

/**
 * LocalStorage fallback for development when Blob Store is not accessible
 * This provides the same interface as the Blob Store operations
 */

export class LocalStorageFallback {
  private static readonly USERS_KEY = 'quest-app-users';
  private static readonly QUESTS_KEY = 'quest-app-quests';
  private static readonly CONFIG_KEY = 'quest-app-config';

  /**
   * Get users from localStorage
   */
  static async getUsers(): Promise<Record<string, UserConfig>> {
    try {
      const stored = localStorage.getItem(this.USERS_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('LocalStorage getUsers error:', error);
      return {};
    }
  }

  /**
   * Get quests from localStorage
   */
  static async getQuests(): Promise<Record<string, QuestConfig>> {
    try {
      const stored = localStorage.getItem(this.QUESTS_KEY);
      return stored ? JSON.parse(stored) : this.getDefaultQuests();
    } catch (error) {
      console.error('LocalStorage getQuests error:', error);
      return this.getDefaultQuests();
    }
  }

  /**
   * Get common quests from localStorage
   */
  static async getCommonQuests(): Promise<string[]> {
    try {
      const stored = localStorage.getItem(this.CONFIG_KEY);
      const config = stored ? JSON.parse(stored) : {};
      return config.commonQuests || ['1'];
    } catch (error) {
      console.error('LocalStorage getCommonQuests error:', error);
      return ['1'];
    }
  }

  /**
   * Get admin password from localStorage
   */
  static async getAdminPassword(): Promise<string> {
    try {
      const stored = localStorage.getItem(this.CONFIG_KEY);
      const config = stored ? JSON.parse(stored) : {};
      return config.adminPassword || 'admin123';
    } catch (error) {
      console.error('LocalStorage getAdminPassword error:', error);
      return 'admin123';
    }
  }

  /**
   * Update users in localStorage
   */
  static async updateUsers(users: Record<string, UserConfig>): Promise<boolean> {
    try {
      localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
      console.log('✅ Users updated in localStorage');
      return true;
    } catch (error) {
      console.error('LocalStorage updateUsers error:', error);
      return false;
    }
  }

  /**
   * Update quests in localStorage
   */
  static async updateQuests(quests: Record<string, QuestConfig>): Promise<boolean> {
    try {
      localStorage.setItem(this.QUESTS_KEY, JSON.stringify(quests));
      console.log('✅ Quests updated in localStorage');
      return true;
    } catch (error) {
      console.error('LocalStorage updateQuests error:', error);
      return false;
    }
  }

  /**
   * Update common quests in localStorage
   */
  static async updateCommonQuests(commonQuests: string[]): Promise<boolean> {
    try {
      const stored = localStorage.getItem(this.CONFIG_KEY);
      const config = stored ? JSON.parse(stored) : {};
      config.commonQuests = commonQuests;
      config.lastUpdated = new Date().toISOString();
      localStorage.setItem(this.CONFIG_KEY, JSON.stringify(config));
      console.log('✅ Common quests updated in localStorage');
      return true;
    } catch (error) {
      console.error('LocalStorage updateCommonQuests error:', error);
      return false;
    }
  }

  /**
   * Initialize localStorage with default data if empty
   */
  static async initializeIfEmpty(): Promise<void> {
    try {
      const users = await this.getUsers();
      const quests = await this.getQuests();
      const hasConfig = localStorage.getItem(this.CONFIG_KEY);

      if (Object.keys(users).length === 0) {
        console.log('🔄 Initializing localStorage with default users...');
        await this.updateUsers(this.getDefaultUsers());
      }

      if (Object.keys(quests).length === 0 || Object.keys(quests).length === 1) {
        console.log('🔄 Initializing localStorage with default quests...');
        await this.updateQuests(this.getDefaultQuests());
      }

      if (!hasConfig) {
        console.log('🔄 Initializing localStorage with default config...');
        const defaultConfig = {
          commonQuests: ['1', '2'],
          adminPassword: 'admin123',
          lastUpdated: new Date().toISOString(),
          version: '1.0'
        };
        localStorage.setItem(this.CONFIG_KEY, JSON.stringify(defaultConfig));
      }

      console.log('✅ LocalStorage initialization complete');
    } catch (error) {
      console.error('LocalStorage initialization error:', error);
    }
  }

  /**
   * Get default quests
   */
  private static getDefaultQuests(): Record<string, QuestConfig> {
    return {
      '1': {
        id: '1',
        title: 'Boire 2L d\'eau',
        description: 'Boire 2 litres d\'eau au cours de la journée',
        category: 'santé',
        xp: 10,
        difficulty: 'facile',
        icon: '💧',
        tags: ['hydratation', 'santé'],
        requirements: []
      },
      '2': {
        id: '2',
        title: 'Méditer 10 minutes',
        description: 'Prends un moment pour te recentrer',
        category: 'santé',
        xp: 15,
        difficulty: 'facile',
        icon: '🧘',
        tags: ['méditation', 'bien-être'],
        requirements: []
      },
      '3': {
        id: '3',
        title: 'Faire 30 minutes de sport',
        description: 'Bouge ton corps pour rester en forme',
        category: 'fitness',
        xp: 25,
        difficulty: 'moyen',
        icon: '🏃',
        tags: ['sport', 'santé'],
        requirements: []
      },
      '4': {
        id: '4',
        title: 'Lire 15 minutes',
        description: 'Apprends quelque chose de nouveau',
        category: 'apprentissage',
        xp: 20,
        difficulty: 'facile',
        icon: '📚',
        tags: ['lecture', 'apprentissage'],
        requirements: []
      }
    };
  }

  /**
   * Get default users
   */
  private static getDefaultUsers(): Record<string, UserConfig> {
    return {
      'demo1': {
        id: 'demo1',
        name: 'Utilisateur Demo',
        avatar: '👤',
        dailyQuests: ['1', '3', '4'],
        preferences: {
          categories: ['santé', 'apprentissage'],
          difficulty: 'facile',
          questCount: 3,
          allowCommonQuests: true
        },
        stats: {
          totalXP: 0,
          currentLevel: 1,
          currentXP: 0,
          xpToNextLevel: 100,
          questsCompleted: 0,
          totalQuestsCompleted: 0,
          currentStreak: 0,
          longestStreak: 0
        }
      }
    };
  }

  /**
   * Clear all data (for testing)
   */
  static clearAll(): void {
    localStorage.removeItem(this.USERS_KEY);
    localStorage.removeItem(this.QUESTS_KEY);
    localStorage.removeItem(this.CONFIG_KEY);
    console.log('🗑️ LocalStorage cleared');
  }

  /**
   * Export all data
   */
  static exportData(): string {
    const data = {
      users: localStorage.getItem(this.USERS_KEY),
      quests: localStorage.getItem(this.QUESTS_KEY),
      config: localStorage.getItem(this.CONFIG_KEY),
      exportDate: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  }

  /**
   * Import data
   */
  static importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      if (data.users) localStorage.setItem(this.USERS_KEY, data.users);
      if (data.quests) localStorage.setItem(this.QUESTS_KEY, data.quests);
      if (data.config) localStorage.setItem(this.CONFIG_KEY, data.config);
      console.log('✅ Data imported to localStorage');
      return true;
    } catch (error) {
      console.error('Import error:', error);
      return false;
    }
  }
}