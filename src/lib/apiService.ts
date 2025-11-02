import { UserConfig, QuestConfig } from './userManager';
import { VercelDataService } from './vercelDataService';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  fallback?: boolean;
}

export class ApiService {
  private static adminPassword = 'admin123';

  /**
   * Set admin password for API requests
   */
  static setAdminPassword(password: string) {
    this.adminPassword = password;
  }

  /**
   * Get all users and configuration
   */
  static async getUsers(): Promise<ApiResponse<{ users: Record<string, UserConfig>; commonQuests: string[] }>> {
    try {
      const data = await VercelDataService.getUsers();
      return {
        success: true,
        data,
        fallback: true // Indique qu'on utilise les fichiers locaux
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to fetch users: ${(error as Error).message}`
      };
    }
  }

  /**
   * Create a new user
   */
  static async createUser(userData: Partial<UserConfig>): Promise<ApiResponse<UserConfig>> {
    try {
      const data = await VercelDataService.createUser(userData);
      return {
        success: true,
        data,
        message: 'Utilisateur créé avec succès. Le fichier de configuration a été téléchargé.'
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create user: ${(error as Error).message}`
      };
    }
  }

  /**
   * Update an existing user
   */
  static async updateUser(userId: string, updates: Partial<UserConfig>): Promise<ApiResponse<UserConfig>> {
    try {
      // Pour l'instant, on utilise la création car la mise à jour directe n'est pas disponible
      const data = await VercelDataService.createUser({ id: userId, ...updates });
      return {
        success: true,
        data,
        message: 'Utilisateur mis à jour avec succès. Le fichier de configuration a été téléchargé.'
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to update user: ${(error as Error).message}`
      };
    }
  }

  /**
   * Delete a user
   */
  static async deleteUser(userId: string): Promise<ApiResponse> {
    try {
      const result = await VercelDataService.deleteUser(userId);
      return {
        success: result.success,
        message: result.message
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to delete user: ${(error as Error).message}`
      };
    }
  }

  /**
   * Get all quests
   */
  static async getQuests(): Promise<ApiResponse<Record<string, QuestConfig>>> {
    try {
      const data = await VercelDataService.getQuests();
      return {
        success: true,
        data,
        fallback: true // Indique qu'on utilise les fichiers locaux
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to fetch quests: ${(error as Error).message}`
      };
    }
  }

  /**
   * Create a new quest
   */
  static async createQuest(questData: Partial<QuestConfig>): Promise<ApiResponse<QuestConfig>> {
    try {
      const data = await VercelDataService.createQuest(questData);
      return {
        success: true,
        data,
        message: 'Quête créée avec succès. Le fichier de configuration a été téléchargé.'
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create quest: ${(error as Error).message}`
      };
    }
  }

  /**
   * Update an existing quest
   */
  static async updateQuest(questId: string, updates: Partial<QuestConfig>): Promise<ApiResponse<QuestConfig>> {
    try {
      // Pour l'instant, on utilise la création car la mise à jour directe n'est pas disponible
      const data = await VercelDataService.createQuest({ id: questId, ...updates });
      return {
        success: true,
        data,
        message: 'Quête mise à jour avec succès. Le fichier de configuration a été téléchargé.'
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to update quest: ${(error as Error).message}`
      };
    }
  }

  /**
   * Delete a quest
   */
  static async deleteQuest(questId: string): Promise<ApiResponse> {
    try {
      const result = await VercelDataService.deleteQuest(questId);
      return {
        success: result.success,
        message: result.message
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to delete quest: ${(error as Error).message}`
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
    isEdgeConfigAvailable: boolean;
  }>> {
    try {
      const [usersData, questsData] = await Promise.all([
        this.getUsers(),
        this.getQuests()
      ]);

      return {
        success: true,
        data: {
          users: usersData.data?.users || {},
          quests: questsData.data || {},
          commonQuests: usersData.data?.commonQuests || [],
          isEdgeConfigAvailable: false // Pour l'instant, on utilise les fichiers locaux
        },
        fallback: true
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to fetch config: ${(error as Error).message}`
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
      const [usersResult, questsResult] = await Promise.all([
        VercelDataService.updateUsersConfig(users, commonQuests),
        VercelDataService.updateQuestsConfig(quests)
      ]);

      return {
        success: usersResult.success && questsResult.success,
        message: 'Configuration mise à jour avec succès. Les fichiers ont été téléchargés.',
        data: {
          usersConfig: {
            message: usersResult.message,
            success: usersResult.success
          },
          questsConfig: {
            message: questsResult.message,
            success: questsResult.success
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to update config: ${(error as Error).message}`
      };
    }
  }
}