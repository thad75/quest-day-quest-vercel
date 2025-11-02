import { UsersConfig, QuestsLibrary, UserConfig, QuestConfig } from './userManager';

export class ConfigManager {
  /**
   * Exporte la configuration des utilisateurs au format JSON
   */
  static exportUsersConfig(users: UserConfig[], commonQuests: string[]): void {
    const usersConfig: UsersConfig = {
      users: users.reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {} as Record<string, UserConfig>),
      commonQuests,
      adminPassword: 'admin123', // Toujours le même pour la cohérence
      lastUpdated: new Date().toISOString(),
      version: '1.0'
    };

    this.downloadJSON(usersConfig, 'users-config.json');
  }

  /**
   * Exporte la configuration des quêtes au format JSON
   */
  static exportQuestsConfig(quests: QuestConfig[]): void {
    const questsLibrary: QuestsLibrary = {
      quests: quests.reduce((acc, quest) => {
        acc[quest.id] = quest;
        return acc;
      }, {} as Record<string, QuestConfig>),
      lastUpdated: new Date().toISOString(),
      version: '1.0'
    };

    this.downloadJSON(questsLibrary, 'quests-library.json');
  }

  /**
   * Exporte la configuration complète (utilisateurs + quêtes)
   */
  static exportFullConfig(users: UserConfig[], quests: QuestConfig[], commonQuests: string[]): void {
    const fullConfig = {
      users: users.reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {} as Record<string, UserConfig>),
      quests: quests.reduce((acc, quest) => {
        acc[quest.id] = quest;
        return acc;
      }, {} as Record<string, QuestConfig>),
      commonQuests,
      adminPassword: 'admin123',
      lastUpdated: new Date().toISOString(),
      version: '1.0',
      exportedBy: 'quest-admin-dashboard',
      exportDate: new Date().toISOString()
    };

    this.downloadJSON(fullConfig, 'quest-full-config.json');
  }

  /**
   * Importe une configuration d'utilisateurs depuis un fichier JSON
   */
  static async importUsersConfig(file: File): Promise<UsersConfig> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const config: UsersConfig = JSON.parse(content);

          // Validation basique
          if (!config.users || typeof config.users !== 'object') {
            throw new Error('Format de configuration invalide');
          }

          resolve(config);
        } catch (error) {
          reject(new Error('Erreur lors de la lecture du fichier: ' + (error as Error).message));
        }
      };

      reader.onerror = () => {
        reject(new Error('Erreur lors de la lecture du fichier'));
      };

      reader.readAsText(file);
    });
  }

  /**
   * Importe une configuration de quêtes depuis un fichier JSON
   */
  static async importQuestsConfig(file: File): Promise<QuestsLibrary> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const config: QuestsLibrary = JSON.parse(content);

          // Validation basique
          if (!config.quests || typeof config.quests !== 'object') {
            throw new Error('Format de configuration invalide');
          }

          resolve(config);
        } catch (error) {
          reject(new Error('Erreur lors de la lecture du fichier: ' + (error as Error).message));
        }
      };

      reader.onerror = () => {
        reject(new Error('Erreur lors de la lecture du fichier'));
      };

      reader.readAsText(file);
    });
  }

  /**
   * Génère un backup de la configuration actuelle
   */
  static generateBackup(users: UserConfig[], quests: QuestConfig[], commonQuests: string[]): void {
    const backup = {
      timestamp: new Date().toISOString(),
      users: users,
      quests: quests,
      commonQuests: commonQuests,
      version: '1.0',
      backupType: 'manual'
    };

    const filename = `quest-backup-${new Date().toISOString().split('T')[0]}.json`;
    this.downloadJSON(backup, filename);
  }

  /**
   * Télécharge un objet JSON en tant que fichier
   */
  private static downloadJSON(data: any, filename: string): void {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;

    // Nettoyer après le téléchargement
    link.addEventListener('click', () => {
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 100);
    });

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Valide la configuration avant l'import
   */
  static validateUsersConfig(config: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.users || typeof config.users !== 'object') {
      errors.push('La section "users" est manquante ou invalide');
    }

    if (!Array.isArray(config.commonQuests)) {
      errors.push('La section "commonQuests" doit être un tableau');
    }

    if (!config.adminPassword || typeof config.adminPassword !== 'string') {
      errors.push('Le mot de passe admin est manquant ou invalide');
    }

    // Validation des utilisateurs
    if (config.users) {
      Object.values(config.users).forEach((user: any) => {
        if (!user.id || !user.name) {
          errors.push(`Utilisateur invalide: ID ou nom manquant`);
        }
        if (!user.preferences || !user.dailyQuests) {
          errors.push(`Utilisateur ${user.name}: préférences ou quêtes manquantes`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Valide la configuration des quêtes avant l'import
   */
  static validateQuestsConfig(config: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.quests || typeof config.quests !== 'object') {
      errors.push('La section "quests" est manquante ou invalide');
    }

    // Validation des quêtes
    if (config.quests) {
      Object.values(config.quests).forEach((quest: any) => {
        if (!quest.id || !quest.title) {
          errors.push(`Quête invalide: ID ou titre manquant`);
        }
        if (!quest.category || !quest.xp) {
          errors.push(`Quête ${quest.title}: catégorie ou XP manquant`);
        }
        if (typeof quest.xp !== 'number' || quest.xp < 0) {
          errors.push(`Quête ${quest.title}: XP doit être un nombre positif`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}