import { UserConfig, QuestConfig, UsersConfig, QuestsLibrary } from './userManager';
import { blobStorageStrategy } from './blobStorageStrategy';

/**
 * Service de données Vercel fonctionnel
 * Utilise Vercel Blob Store + fallback vers fichiers JSON
 */

export class VercelDataService {
  private static readonly USERS_CONFIG_URL = '/users-config.json';
  private static readonly QUESTS_CONFIG_URL = '/quests-library.json';

  /**
   * Initialise Blob Store avec les données actuelles (une seule fois)
   */
  static async initializeBlobStore(): Promise<boolean> {
    try {
      // Vérifier si Blob Store est déjà initialisé
      const existingConfig = await blobStorageStrategy.getFullConfig();

      if (existingConfig.data && (Object.keys(existingConfig.data.users).length > 0 || Object.keys(existingConfig.data.quests).length > 0)) {
        console.log('Blob Store déjà initialisé');
        return true;
      }

      // Charger les données depuis les fichiers JSON
      const [usersConfig, questsConfig] = await Promise.all([
        this.loadUsersConfig(),
        this.loadQuestsConfig()
      ]);

      console.log('Initialisation de Blob Store avec les données existantes...');

      // Créer la configuration initiale dans Blob Store
      const initialConfig = {
        users: usersConfig.users,
        quests: questsConfig.quests,
        commonQuests: usersConfig.commonQuests,
        adminPassword: usersConfig.adminPassword,
        lastUpdated: new Date().toISOString(),
        version: '1.0'
      };

      const success = await blobStorageStrategy.updateFullConfig(initialConfig);

      if (success) {
        console.log('Données initialisées dans Blob Store:', {
          usersCount: Object.keys(usersConfig.users).length,
          questsCount: Object.keys(questsConfig.quests).length
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
   * Charge la configuration depuis Edge Config ou fallback vers fichiers JSON
   */
  static async loadUsersConfig(): Promise<UsersConfig> {
    try {
      const response = await fetch(this.USERS_CONFIG_URL);
      if (!response.ok) {
        throw new Error('Failed to load users config');
      }
      return await response.json();
    } catch (error) {
      console.error('Error loading users config:', error);
      // Configuration par défaut
      return {
        users: {},
        commonQuests: ['1', '2', '10'],
        adminPassword: 'admin123',
        lastUpdated: new Date().toISOString(),
        version: '1.0'
      };
    }
  }

  static async loadQuestsConfig(): Promise<QuestsLibrary> {
    try {
      const response = await fetch(this.QUESTS_CONFIG_URL);
      if (!response.ok) {
        throw new Error('Failed to load quests config');
      }
      return await response.json();
    } catch (error) {
      console.error('Error loading quests config:', error);
      // Configuration par défaut
      return {
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
        lastUpdated: new Date().toISOString(),
        version: '1.0'
      };
    }
  }

  /**
   * Récupère tous les utilisateurs (Blob Store优先)
   */
  static async getUsers(): Promise<{ users: Record<string, UserConfig>; commonQuests: string[]; isEdgeConfig: boolean }> {
    try {
      // Essayer Blob Store d'abord
      const blobUsers = await blobStorageStrategy.getUsers();
      const blobCommonQuests = await blobStorageStrategy.getCommonQuests();

      if (Object.keys(blobUsers.data).length > 0 && !blobUsers.fallback) {
        console.log('Utilisation de Blob Store pour les utilisateurs');
        return {
          users: blobUsers.data,
          commonQuests: blobCommonQuests.data,
          isEdgeConfig: false // Blob Store instead of Edge Config
        };
      }
    } catch (error) {
      console.log('Blob Store non disponible, utilisation des fichiers JSON');
    }

    // Fallback vers les fichiers JSON
    const config = await this.loadUsersConfig();
    return {
      users: config.users,
      commonQuests: config.commonQuests,
      isEdgeConfig: false
    };
  }

  /**
   * Récupère toutes les quêtes (Blob Store优先)
   */
  static async getQuests(): Promise<Record<string, QuestConfig>> {
    try {
      // Essayer Blob Store d'abord
      const blobQuests = await blobStorageStrategy.getQuests();

      if (Object.keys(blobQuests.data).length > 0 && !blobQuests.fallback) {
        console.log('Utilisation de Blob Store pour les quêtes');
        return blobQuests.data;
      }
    } catch (error) {
      console.log('Blob Store non disponible pour les quêtes, utilisation des fichiers JSON');
    }

    // Fallback vers les fichiers JSON
    const config = await this.loadQuestsConfig();
    return config.quests;
  }

  /**
   * Vérifie le mot de passe admin
   */
  static async verifyAdminPassword(password: string): Promise<boolean> {
    try {
      // Essayer Blob Store d'abord
      const blobPassword = await blobStorageStrategy.getAdminPassword();
      if (!blobPassword.fallback) {
        return password === blobPassword.data;
      }
    } catch (error) {
      console.log('Blob Store non disponible pour le mot de passe admin, utilisation des fichiers JSON');
    }

    // Fallback vers les fichiers JSON
    const config = await this.loadUsersConfig();
    return password === config.adminPassword;
  }

  /**
   * Met à jour la configuration des utilisateurs (avec Blob Store)
   */
  static async updateUsersConfig(
    users: Record<string, UserConfig>,
    commonQuests: string[]
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Utiliser Blob Store pour mettre à jour directement
      const success = await blobStorageStrategy.updateUsers(users);

      if (success) {
        // Also update common quests if needed
        const fullConfig = await blobStorageStrategy.getFullConfig();
        if (fullConfig.data && !fullConfig.fallback) {
          fullConfig.data.commonQuests = commonQuests;
          await blobStorageStrategy.updateFullConfig(fullConfig.data);
        }

        return {
          success: true,
          message: 'Configuration des utilisateurs mise à jour avec succès dans Blob Store.'
        };
      } else {
        // Fallback: télécharger le JSON si Blob Store échoue
        return this.downloadUsersConfigFallback(users, commonQuests);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour via Blob Store:', error);
      // Fallback: télécharger le JSON
      return this.downloadUsersConfigFallback(users, commonQuests);
    }
  }

  /**
   * Fallback: télécharger la configuration des utilisateurs
   */
  private static async downloadUsersConfigFallback(
    users: Record<string, UserConfig>,
    commonQuests: string[]
  ): Promise<{ success: boolean; message: string }> {
    const config: UsersConfig = {
      users,
      commonQuests,
      adminPassword: 'admin123',
      lastUpdated: new Date().toISOString(),
      version: '1.0'
    };

    // Créer un fichier JSON à télécharger
    const blob = new Blob([JSON.stringify(config, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'users-config.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return {
      success: true,
      message: 'Configuration des utilisateurs téléchargée. Remplacez le fichier users-config.json dans votre projet et déployez.'
    };
  }

  /**
   * Met à jour la configuration des quêtes (avec Blob Store)
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
        // Fallback: télécharger le JSON si Blob Store échoue
        return this.downloadQuestsConfigFallback(quests);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour via Blob Store:', error);
      // Fallback: télécharger le JSON
      return this.downloadQuestsConfigFallback(quests);
    }
  }

  /**
   * Fallback: télécharger la configuration des quêtes
   */
  private static async downloadQuestsConfigFallback(
    quests: Record<string, QuestConfig>
  ): Promise<{ success: boolean; message: string }> {
    const config: QuestsLibrary = {
      quests,
      lastUpdated: new Date().toISOString(),
      version: '1.0'
    };

    // Créer un fichier JSON à télécharger
    const blob = new Blob([JSON.stringify(config, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'quests-library.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return {
      success: true,
      message: 'Configuration des quêtes téléchargée. Remplacez le fichier quests-library.json dans votre projet et déployez.'
    };
  }

  /**
   * Crée un nouvel utilisateur
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

    // Ajouter l'utilisateur à la configuration locale (temporaire)
    users.users[newUser.id] = newUser;

    // Télécharger la configuration mise à jour
    await this.updateUsersConfig(users.users, users.commonQuests);

    return newUser;
  }

  /**
   * Supprime un utilisateur
   */
  static async deleteUser(userId: string): Promise<{ success: boolean; message: string }> {
    const users = await this.getUsers();

    if (!users.users[userId]) {
      return {
        success: false,
        message: 'Utilisateur non trouvé'
      };
    }

    delete users.users[userId];

    // Télécharger la configuration mise à jour
    await this.updateUsersConfig(users.users, users.commonQuests);

    return {
      success: true,
      message: 'Utilisateur supprimé avec succès'
    };
  }

  /**
   * Crée une nouvelle quête
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

    // Ajouter la quête à la configuration locale (temporaire)
    quests[newQuest.id] = newQuest;

    // Télécharger la configuration mise à jour
    await this.updateQuestsConfig(quests);

    return newQuest;
  }

  /**
   * Supprime une quête
   */
  static async deleteQuest(questId: string): Promise<{ success: boolean; message: string }> {
    const quests = await this.getQuests();

    if (!quests[questId]) {
      return {
        success: false,
        message: 'Quête non trouvée'
      };
    }

    delete quests[questId];

    // Télécharger la configuration mise à jour
    await this.updateQuestsConfig(quests);

    return {
      success: true,
      message: 'Quête supprimée avec succès'
    };
  }
}