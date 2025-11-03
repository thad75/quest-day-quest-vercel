import { UserConfig, QuestConfig } from './userManager';
import { LocalStorageFallback } from './localStorageFallback';
import { AdminApiService } from './adminApiService';

/**
 * Service de données Vercel avec API fallback
 * Utilise API serveur en production, LocalStorage en développement
 * Évite les problèmes CORS en utilisant des routes API
 */

export class VercelDataService {

  /**
   * Initialize storage (API or LocalStorage fallback)
   */
  static async initializeBlobStore(): Promise<boolean> {
    try {
      console.log('🔄 Attempting to initialize storage...');

      if (this.useLocalStorageFallback()) {
        console.log('📱 Using LocalStorage fallback for initialization');
        await LocalStorageFallback.initializeIfEmpty();
        return true;
      }

      // Try to check if API is available by fetching users
      await AdminApiService.getUsersNew();
      console.log('✅ API is available, storage initialized');
      return true;
    } catch (error) {
      console.error('❌ Storage initialization failed, using LocalStorage fallback:', error);
      // Fallback to LocalStorage
      await LocalStorageFallback.initializeIfEmpty();
      return true;
    }
  }

  /**
   * Check if we should use API (production) or LocalStorage (development)
   */
  private static useLocalStorageFallback(): boolean {
    // Use API in production, LocalStorage in development
    return import.meta.env.DEV && (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    );
  }

  
  /**
   * Récupère tous les utilisateurs (API ou LocalStorage fallback)
   */
  static async getUsers(): Promise<{ users: Record<string, UserConfig>; commonQuests: string[]; isBlobStore: boolean }> {
    try {
      if (this.useLocalStorageFallback()) {
        console.log('📱 Using LocalStorage fallback for users');
        const users = await LocalStorageFallback.getUsers();
        const commonQuests = await LocalStorageFallback.getCommonQuests();
        return {
          users,
          commonQuests,
          isBlobStore: false
        };
      }

      // Récupérer via API (new endpoint - server-side)
      const response = await AdminApiService.getUsersNew();
      return {
        users: response.users || {},
        commonQuests: [], // TODO: commonQuests should be stored separately in new structure
        isBlobStore: response.isBlobStore || true
      };
    } catch (error) {
      console.error('❌ API failed for users, using LocalStorage fallback:', error);
      // Fallback to LocalStorage
      const users = await LocalStorageFallback.getUsers();
      const commonQuests = await LocalStorageFallback.getCommonQuests();
      return {
        users,
        commonQuests,
        isBlobStore: false
      };
    }
  }

  /**
   * Récupère toutes les quêtes (API ou LocalStorage fallback)
   */
  static async getQuests(): Promise<Record<string, QuestConfig>> {
    try {
      if (this.useLocalStorageFallback()) {
        console.log('📱 Using LocalStorage fallback for quests');
        return await LocalStorageFallback.getQuests();
      }

      // Récupérer via API (new endpoint - server-side)
      const response = await AdminApiService.getQuestsNew();
      return response.templates || {};
    } catch (error) {
      console.error('❌ API failed for quests, using LocalStorage fallback:', error);
      // Fallback to LocalStorage
      return await LocalStorageFallback.getQuests();
    }
  }

  /**
   * Vérifie le mot de passe admin (API ou LocalStorage fallback)
   */
  static async verifyAdminPassword(password: string): Promise<boolean> {
    try {
      if (this.useLocalStorageFallback()) {
        console.log('📱 Using LocalStorage fallback for admin password');
        const localStoragePassword = await LocalStorageFallback.getAdminPassword();
        return password === localStoragePassword;
      }

      // For now, use hardcoded admin password
      // TODO: Store admin password in Vercel environment variables
      return password === 'admin123';
    } catch (error) {
      console.error('❌ Admin password verification failed:', error);
      // Fallback to LocalStorage
      const localStoragePassword = await LocalStorageFallback.getAdminPassword();
      return password === localStoragePassword;
    }
  }

  /**
   * Met à jour la configuration des utilisateurs (API ou LocalStorage fallback)
   */
  static async updateUsersConfig(
    users: Record<string, UserConfig>,
    commonQuests: string[]
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (this.useLocalStorageFallback()) {
        console.log('📱 Using LocalStorage fallback for updating users');
        const usersSuccess = await LocalStorageFallback.updateUsers(users);
        const questsSuccess = await LocalStorageFallback.updateCommonQuests(commonQuests);

        if (usersSuccess && questsSuccess) {
          return {
            success: true,
            message: 'Configuration des utilisateurs mise à jour avec succès dans LocalStorage.'
          };
        } else {
          throw new Error('LocalStorage update failed');
        }
      }

      // Utiliser API pour mettre à jour (server-side)
      return await ApiService.updateUsersConfig(users, commonQuests);
    } catch (error) {
      console.error('❌ API failed to update users, trying LocalStorage fallback:', error);

      // Fallback to LocalStorage
      try {
        const usersSuccess = await LocalStorageFallback.updateUsers(users);
        const questsSuccess = await LocalStorageFallback.updateCommonQuests(commonQuests);

        if (usersSuccess && questsSuccess) {
          return {
            success: true,
            message: 'Configuration des utilisateurs mise à jour avec succès dans LocalStorage (fallback).'
          };
        }
      } catch (fallbackError) {
        console.error('❌ LocalStorage fallback also failed:', fallbackError);
      }

      return {
        success: false,
        message: 'Erreur lors de la mise à jour de la configuration des utilisateurs.'
      };
    }
  }

  
  /**
   * Met à jour la configuration des quêtes (API ou LocalStorage fallback)
   */
  static async updateQuestsConfig(
    quests: Record<string, QuestConfig>
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (this.useLocalStorageFallback()) {
        console.log('📱 Using LocalStorage fallback for updating quests');
        const success = await LocalStorageFallback.updateQuests(quests);

        if (success) {
          return {
            success: true,
            message: 'Configuration des quêtes mise à jour avec succès dans LocalStorage.'
          };
        } else {
          throw new Error('LocalStorage update failed');
        }
      }

      // Utiliser API pour mettre à jour (server-side)
      return await ApiService.updateQuestsConfig(quests);
    } catch (error) {
      console.error('❌ API failed to update quests, trying LocalStorage fallback:', error);

      // Fallback to LocalStorage
      try {
        const success = await LocalStorageFallback.updateQuests(quests);

        if (success) {
          return {
            success: true,
            message: 'Configuration des quêtes mise à jour avec succès dans LocalStorage (fallback).'
          };
        }
      } catch (fallbackError) {
        console.error('❌ LocalStorage fallback also failed:', fallbackError);
      }

      return {
        success: false,
        message: 'Erreur lors de la mise à jour de la configuration des quêtes.'
      };
    }
  }

  /**
   * Crée un nouvel utilisateur dans Blob Store
   */
  static async createUser(userData: Partial<UserConfig>): Promise<UserConfig> {
    const users = await this.getUsers();
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

    // Ajouter l'utilisateur
    users.users[newUser.id] = newUser;

    // Mettre à jour dans Blob Store
    const result = await this.updateUsersConfig(users.users, users.commonQuests);
    if (!result.success) {
      throw new Error(result.message);
    }

    return newUser;
  }

  /**
   * Supprime un utilisateur de Blob Store
   */
  static async deleteUser(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const users = await this.getUsers();

      if (!users.users[userId]) {
        return {
          success: false,
          message: 'Utilisateur non trouvé'
        };
      }

      delete users.users[userId];

      // Mettre à jour dans Blob Store
      const result = await this.updateUsersConfig(users.users, users.commonQuests);
      if (!result.success) {
        return {
          success: false,
          message: result.message
        };
      }

      return {
        success: true,
        message: 'Utilisateur supprimé avec succès'
      };
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', error);
      return {
        success: false,
        message: 'Erreur lors de la suppression de l\'utilisateur'
      };
    }
  }

  /**
   * Crée une nouvelle quête dans Blob Store
   */
  static async createQuest(questData: Partial<QuestConfig>): Promise<QuestConfig> {
    const quests = await this.getQuests();

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

    // Ajouter la quête
    quests[newQuest.id] = newQuest;

    // Mettre à jour dans Blob Store
    const result = await this.updateQuestsConfig(quests);
    if (!result.success) {
      throw new Error(result.message);
    }

    return newQuest;
  }

  /**
   * Supprime une quête de Blob Store
   */
  static async deleteQuest(questId: string): Promise<{ success: boolean; message: string }> {
    try {
      const quests = await this.getQuests();

      if (!quests[questId]) {
        return {
          success: false,
          message: 'Quête non trouvée'
        };
      }

      delete quests[questId];

      // Mettre à jour dans Blob Store
      const result = await this.updateQuestsConfig(quests);
      if (!result.success) {
        return {
          success: false,
          message: result.message
        };
      }

      return {
        success: true,
        message: 'Quête supprimée avec succès'
      };
    } catch (error) {
      console.error('Erreur lors de la suppression de la quête:', error);
      return {
        success: false,
        message: 'Erreur lors de la suppression de la quête'
      };
    }
  }
}