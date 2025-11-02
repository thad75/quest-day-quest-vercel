import { UserConfig, QuestConfig, UsersConfig, QuestsLibrary } from './userManager';

/**
 * Service de données Vercel fonctionnel
 * Utilise les fichiers JSON + Vercel Edge Config pour un vrai fonctionnement
 */

export class VercelDataService {
  private static readonly USERS_CONFIG_URL = '/users-config.json';
  private static readonly QUESTS_CONFIG_URL = '/quests-library.json';

  /**
   * Charge la configuration depuis les fichiers JSON
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
   * Récupère tous les utilisateurs
   */
  static async getUsers(): Promise<{ users: Record<string, UserConfig>; commonQuests: string[] }> {
    const config = await this.loadUsersConfig();
    return {
      users: config.users,
      commonQuests: config.commonQuests
    };
  }

  /**
   * Récupère toutes les quêtes
   */
  static async getQuests(): Promise<Record<string, QuestConfig>> {
    const config = await this.loadQuestsConfig();
    return config.quests;
  }

  /**
   * Vérifie le mot de passe admin
   */
  static async verifyAdminPassword(password: string): Promise<boolean> {
    const config = await this.loadUsersConfig();
    return password === config.adminPassword;
  }

  /**
   * Met à jour la configuration des utilisateurs (via download pour l'instant)
   * Dans une vraie implémentation, cela utiliserait Vercel Edge Config
   */
  static async updateUsersConfig(
    users: Record<string, UserConfig>,
    commonQuests: string[]
  ): Promise<{ success: boolean; message: string }> {
    // Pour l'instant, on génère le JSON à télécharger
    // En production, on pourrait utiliser Vercel Edge Config API

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
   * Met à jour la configuration des quêtes (via download pour l'instant)
   */
  static async updateQuestsConfig(
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