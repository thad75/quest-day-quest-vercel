import { UserConfig, QuestConfig, UsersConfig, QuestsLibrary } from './userManager';

export class LiveConfigManager {
  private static readonly STORAGE_KEYS = {
    USERS_CONFIG: 'quest-live-users-config',
    QUESTS_CONFIG: 'quest-live-quests-config',
    LAST_SAVE: 'quest-last-save-timestamp'
  };

  /**
   * Sauvegarde la configuration des utilisateurs en localStorage et retourne le JSON
   */
  static saveUsersConfigLive(users: UserConfig[], commonQuests: string[]): { success: boolean; json: string; message: string } {
    try {
      const usersConfig: UsersConfig = {
        users: users.reduce((acc, user) => {
          acc[user.id] = user;
          return acc;
        }, {} as Record<string, UserConfig>),
        commonQuests,
        adminPassword: 'admin123',
        lastUpdated: new Date().toISOString(),
        version: '1.0'
      };

      // Sauvegarder dans localStorage
      localStorage.setItem(this.STORAGE_KEYS.USERS_CONFIG, JSON.stringify(usersConfig));
      localStorage.setItem(this.STORAGE_KEYS.LAST_SAVE, new Date().toISOString());

      const jsonString = JSON.stringify(usersConfig, null, 2);

      return {
        success: true,
        json: jsonString,
        message: `Configuration sauvegardée à ${new Date().toLocaleTimeString()}`
      };
    } catch (error) {
      return {
        success: false,
        json: '',
        message: `Erreur lors de la sauvegarde: ${(error as Error).message}`
      };
    }
  }

  /**
   * Sauvegarde la configuration des quêtes en localStorage et retourne le JSON
   */
  static saveQuestsConfigLive(quests: QuestConfig[]): { success: boolean; json: string; message: string } {
    try {
      const questsLibrary: QuestsLibrary = {
        quests: quests.reduce((acc, quest) => {
          acc[quest.id] = quest;
          return acc;
        }, {} as Record<string, QuestConfig>),
        lastUpdated: new Date().toISOString(),
        version: '1.0'
      };

      // Sauvegarder dans localStorage
      localStorage.setItem(this.STORAGE_KEYS.QUESTS_CONFIG, JSON.stringify(questsLibrary));
      localStorage.setItem(this.STORAGE_KEYS.LAST_SAVE, new Date().toISOString());

      const jsonString = JSON.stringify(questsLibrary, null, 2);

      return {
        success: true,
        json: jsonString,
        message: `Configuration des quêtes sauvegardée à ${new Date().toLocaleTimeString()}`
      };
    } catch (error) {
      return {
        success: false,
        json: '',
        message: `Erreur lors de la sauvegarde: ${(error as Error).message}`
      };
    }
  }

  /**
   * Sauvegarde la configuration complète et retourne les deux JSON
   */
  static saveFullConfigLive(users: UserConfig[], quests: QuestConfig[], commonQuests: string[]): {
    users: { success: boolean; json: string; message: string };
    quests: { success: boolean; json: string; message: string };
    instructions: string[];
  } {
    const usersResult = this.saveUsersConfigLive(users, commonQuests);
    const questsResult = this.saveQuestsConfigLive(quests);

    const instructions = [
      '1. Copiez le JSON des utilisateurs ci-dessous',
      '2. Remplacez le contenu de `public/users-config.json`',
      '3. Copiez le JSON des quêtes ci-dessous',
      '4. Remplacez le contenu de `public/quests-library.json`',
      '5. Exécutez: git add . && git commit -m "Update configuration" && git push',
      '6. Vercel déploiera automatiquement vos changements'
    ];

    return {
      users: usersResult,
      quests: questsResult,
      instructions
    };
  }

  /**
   * Charge la configuration depuis localStorage si disponible
   */
  static loadFromLocalStorage(): { users: UserConfig[]; quests: QuestConfig[]; hasData: boolean } {
    try {
      const usersConfigStr = localStorage.getItem(this.STORAGE_KEYS.USERS_CONFIG);
      const questsConfigStr = localStorage.getItem(this.STORAGE_KEYS.QUESTS_CONFIG);

      let users: UserConfig[] = [];
      let quests: QuestConfig[] = [];
      let hasData = false;

      if (usersConfigStr) {
        const usersConfig: UsersConfig = JSON.parse(usersConfigStr);
        users = Object.values(usersConfig.users);
        hasData = true;
      }

      if (questsConfigStr) {
        const questsConfig: QuestsLibrary = JSON.parse(questsConfigStr);
        quests = Object.values(questsConfig.quests);
        hasData = true;
      }

      return { users, quests, hasData };
    } catch (error) {
      console.error('Erreur lors du chargement depuis localStorage:', error);
      return { users: [], quests: [], hasData: false };
    }
  }

  /**
   * Récupère le timestamp de la dernière sauvegarde
   */
  static getLastSaveTime(): string | null {
    return localStorage.getItem(this.STORAGE_KEYS.LAST_SAVE);
  }

  /**
   * Efface les données localStorage
   */
  static clearLocalStorage(): void {
    localStorage.removeItem(this.STORAGE_KEYS.USERS_CONFIG);
    localStorage.removeItem(this.STORAGE_KEYS.QUESTS_CONFIG);
    localStorage.removeItem(this.STORAGE_KEYS.LAST_SAVE);
  }

  /**
   * Vérifie s'il y a des modifications non sauvegardées
   */
  static hasUnsavedChanges(currentUsers: UserConfig[], currentQuests: QuestConfig[]): boolean {
    const saved = this.loadFromLocalStorage();

    if (!saved.hasData) {
      return true; // Pas de données sauvegardées
    }

    // Comparaison simple des longueurs (pour l'instant)
    const usersChanged = saved.users.length !== currentUsers.length;
    const questsChanged = saved.quests.length !== currentQuests.length;

    return usersChanged || questsChanged;
  }

  /**
   * Génère un résumé des changements
   */
  static generateChangeSummary(currentUsers: UserConfig[], currentQuests: QuestConfig[]): string[] {
    const saved = this.loadFromLocalStorage();
    const changes: string[] = [];

    if (!saved.hasData) {
      changes.push('Nouvelle configuration à sauvegarder');
      return changes;
    }

    const userCountChange = currentUsers.length - saved.users.length;
    const questCountChange = currentQuests.length - saved.quests.length;

    if (userCountChange > 0) {
      changes.push(`${userCountChange} nouvel utilisateur(s) ajouté(s)`);
    } else if (userCountChange < 0) {
      changes.push(`${Math.abs(userCountChange)} utilisateur(s) supprimé(s)`);
    }

    if (questCountChange > 0) {
      changes.push(`${questCountChange} nouvelle(s) quête(s) ajoutée(s)`);
    } else if (questCountChange < 0) {
      changes.push(`${Math.abs(questCountChange)} quête(s) supprimée(s)`);
    }

    if (changes.length === 0) {
      changes.push('Modifications existantes détectées');
    }

    return changes;
  }
}