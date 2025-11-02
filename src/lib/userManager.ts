import { UserProfile, PlayerProgress } from '@/types/quest';

export interface UserConfig {
  id: string;
  name: string;
  avatar: string;
  dailyQuests: string[];
  preferences: {
    categories: string[];
    difficulty: 'facile' | 'moyen' | 'difficile';
    questCount: number;
    allowCommonQuests: boolean;
  };
  stats: {
    totalXP: number;
    currentLevel: number;
    currentStreak: number;
    totalQuestsCompleted: number;
  };
}

export interface QuestConfig {
  id: string;
  title: string;
  description: string;
  category: string;
  xp: number;
  difficulty: 'facile' | 'moyen' | 'difficile';
  timeLimit: number;
  icon: string;
}

export interface UsersConfig {
  users: Record<string, UserConfig>;
  commonQuests: string[];
  adminPassword: string;
  lastUpdated: string;
  version: string;
}

export interface QuestsLibrary {
  quests: Record<string, QuestConfig>;
  lastUpdated: string;
  version: string;
}

class UserManager {
  private usersConfig: UsersConfig | null = null;
  private questsLibrary: QuestsLibrary | null = null;
  private currentUser: UserConfig | null = null;

  async loadConfigs(): Promise<void> {
    try {
      // Charger les configurations depuis les fichiers publics
      const usersResponse = await fetch('/users-config.json');
      const questsResponse = await fetch('/quests-library.json');

      this.usersConfig = await usersResponse.json();
      this.questsLibrary = await questsResponse.json();
    } catch (error) {
      console.error('Erreur lors du chargement des configurations:', error);
      throw new Error('Impossible de charger les configurations');
    }
  }

  getAvailableUsers(): UserConfig[] {
    if (!this.usersConfig) {
      throw new Error('Configuration non chargée');
    }
    return Object.values(this.usersConfig.users);
  }

  getUserById(userId: string): UserConfig | null {
    if (!this.usersConfig) {
      return null;
    }
    return this.usersConfig.users[userId] || null;
  }

  getCurrentUser(): UserConfig | null {
    return this.currentUser;
  }

  setCurrentUser(userId: string): boolean {
    const user = this.getUserById(userId);
    if (user) {
      this.currentUser = user;
      localStorage.setItem('currentUserId', userId);
      return true;
    }
    return false;
  }

  logout(): void {
    this.currentUser = null;
    localStorage.removeItem('currentUserId');
  }

  async loadCurrentUserFromStorage(): Promise<boolean> {
    const savedUserId = localStorage.getItem('currentUserId');
    if (savedUserId) {
      return this.setCurrentUser(savedUserId);
    }
    return false;
  }

  getUserQuests(userId: string): QuestConfig[] {
    if (!this.questsLibrary || !this.usersConfig) {
      return [];
    }

    const user = this.getUserById(userId);
    if (!user) {
      return [];
    }

    const quests: QuestConfig[] = [];

    // Ajouter les quêtes spécifiques à l'utilisateur
    user.dailyQuests.forEach(questId => {
      const quest = this.questsLibrary!.quests[questId];
      if (quest) {
        quests.push(quest);
      }
    });

    // Ajouter les quêtes communes si autorisé
    if (user.preferences.allowCommonQuests) {
      this.usersConfig.commonQuests.forEach(questId => {
        const quest = this.questsLibrary!.quests[questId];
        if (quest && !quests.some(q => q.id === questId)) {
          quests.push(quest);
        }
      });
    }

    return quests;
  }

  getAllQuests(): QuestConfig[] {
    if (!this.questsLibrary) {
      return [];
    }
    return Object.values(this.questsLibrary.quests);
  }

  verifyAdminPassword(password: string): boolean {
    if (!this.usersConfig) {
      return false;
    }
    return password === this.usersConfig.adminPassword;
  }

  // Pour l'admin - méthodes de modification (à implémenter côté admin)
  getUsersConfig(): UsersConfig | null {
    return this.usersConfig;
  }

  getQuestsLibrary(): QuestsLibrary | null {
    return this.questsLibrary;
  }

  // Conversion vers UserProfile pour compatibilité avec le système existant
  convertToUserProfile(user: UserConfig): UserProfile {
    return {
      username: user.name,
      totalXP: user.stats.totalXP,
      currentLevel: user.stats.currentLevel,
      currentXP: 0, // Serait calculé différemment
      xpToNextLevel: user.stats.currentLevel * 100,
      questsCompleted: 0, // Serait calculé différemment
      totalQuestsCompleted: user.stats.totalQuestsCompleted,
      currentStreak: user.stats.currentStreak,
      longestStreak: user.stats.currentStreak, // Simplifié
      joinDate: new Date().toISOString(),
      lastActiveDate: new Date().toISOString(),
      achievements: []
    };
  }

  convertToPlayerProgress(user: UserConfig): PlayerProgress {
    return {
      currentLevel: user.stats.currentLevel,
      currentXP: 0, // Serait calculé différemment
      xpToNextLevel: user.stats.currentLevel * 100
    };
  }
}

export const userManager = new UserManager();