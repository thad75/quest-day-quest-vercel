import { UserConfig, QuestConfig } from './userManager';
import { blobStorageStrategy } from './blobStorageStrategy';

/**
 * Service de données Vercel fonctionnel
 * Utilise Vercel Blob Store exclusivement (plus de fallback JSON)
 */

export class VercelDataService {

  /**
   * Initialise Blob Store avec des données par défaut si vide
   */
  static async initializeBlobStore(): Promise<boolean> {
    try {
      // Vérifier si Blob Store est déjà initialisé
      const existingConfig = await blobStorageStrategy.getFullConfig();

      if (existingConfig.data && (Object.keys(existingConfig.data.users).length > 0 || Object.keys(existingConfig.data.quests).length > 0)) {
        console.log('Blob Store déjà initialisé');
        return true;
      }

      console.log('Initialisation de Blob Store avec des données par défaut...');

      // Créer la configuration initiale par défaut
      const initialConfig = {
        users: {},
        quests: {
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
          }
        },
        commonQuests: ['1'],
        adminPassword: 'admin123',
        lastUpdated: new Date().toISOString(),
        version: '1.0'
      };

      const success = await blobStorageStrategy.updateFullConfig(initialConfig);

      if (success) {
        console.log('Données initialisées dans Blob Store:', {
          usersCount: Object.keys(initialConfig.users).length,
          questsCount: Object.keys(initialConfig.quests).length
        });
        return true;
      } else {
        throw new Error('Failed to initialize Blob Store');
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de Blob Store:', error);
      return false;
    }
  }

  
  /**
   * Récupère tous les utilisateurs depuis Blob Store
   */
  static async getUsers(): Promise<{ users: Record<string, UserConfig>; commonQuests: string[]; isBlobStore: boolean }> {
    try {
      // Récupérer depuis Blob Store uniquement
      const blobUsers = await blobStorageStrategy.getUsers();
      const blobCommonQuests = await blobStorageStrategy.getCommonQuests();

      console.log('Utilisation de Blob Store pour les utilisateurs');
      return {
        users: blobUsers.data,
        commonQuests: blobCommonQuests.data,
        isBlobStore: true
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs depuis Blob Store:', error);
      throw new Error('Impossible de récupérer les utilisateurs depuis Blob Store');
    }
  }

  /**
   * Récupère toutes les quêtes depuis Blob Store
   */
  static async getQuests(): Promise<Record<string, QuestConfig>> {
    try {
      // Récupérer depuis Blob Store uniquement
      const blobQuests = await blobStorageStrategy.getQuests();

      console.log('Utilisation de Blob Store pour les quêtes');
      return blobQuests.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des quêtes depuis Blob Store:', error);
      throw new Error('Impossible de récupérer les quêtes depuis Blob Store');
    }
  }

  /**
   * Vérifie le mot de passe admin depuis Blob Store
   */
  static async verifyAdminPassword(password: string): Promise<boolean> {
    try {
      // Récupérer depuis Blob Store uniquement
      const blobPassword = await blobStorageStrategy.getAdminPassword();

      console.log('Vérification du mot de passe admin via Blob Store');
      return password === blobPassword.data;
    } catch (error) {
      console.error('Erreur lors de la vérification du mot de passe admin depuis Blob Store:', error);
      // En cas d'erreur, utiliser le mot de passe par défaut pour sécurité
      return password === 'admin123';
    }
  }

  /**
   * Met à jour la configuration des utilisateurs dans Blob Store
   */
  static async updateUsersConfig(
    users: Record<string, UserConfig>,
    commonQuests: string[]
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Utiliser Blob Store pour mettre à jour directement
      const success = await blobStorageStrategy.updateUsers(users);

      if (success) {
        // Mettre à jour les quêtes communes également
        const fullConfig = await blobStorageStrategy.getFullConfig();
        if (fullConfig.data) {
          fullConfig.data.commonQuests = commonQuests;
          await blobStorageStrategy.updateFullConfig(fullConfig.data);
        }

        return {
          success: true,
          message: 'Configuration des utilisateurs mise à jour avec succès dans Blob Store.'
        };
      } else {
        throw new Error('Blob Store update failed');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour via Blob Store:', error);
      return {
        success: false,
        message: 'Erreur lors de la mise à jour de la configuration des utilisateurs dans Blob Store.'
      };
    }
  }

  
  /**
   * Met à jour la configuration des quêtes dans Blob Store
   */
  static async updateQuestsConfig(
    quests: Record<string, QuestConfig>
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Utiliser Blob Store pour mettre à jour directement
      const success = await blobStorageStrategy.updateQuests(quests);

      if (success) {
        return {
          success: true,
          message: 'Configuration des quêtes mise à jour avec succès dans Blob Store.'
        };
      } else {
        throw new Error('Blob Store update failed');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour via Blob Store:', error);
      return {
        success: false,
        message: 'Erreur lors de la mise à jour de la configuration des quêtes dans Blob Store.'
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