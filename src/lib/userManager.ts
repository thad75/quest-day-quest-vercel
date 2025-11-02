import { UserProfile, PlayerProgress } from '@/types/quest';
import { VercelDataService } from './vercelDataService';

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
    currentXP: number;
    xpToNextLevel: number;
    questsCompleted: number;
    totalQuestsCompleted: number;
    currentStreak: number;
    longestStreak: number;
  };
}

export interface QuestConfig {
  id: string;
  title: string;
  description: string;
  category: string;
  xp: number;
  difficulty: 'facile' | 'moyen' | 'difficile';
  icon: string;
  tags: string[];
  requirements: string[];
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
      // Initialiser Blob Store si nécessaire
      await VercelDataService.initializeBlobStore();

      // Charger les configurations depuis Blob Store
      const usersData = await VercelDataService.getUsers();
      const questsData = await VercelDataService.getQuests();

      this.usersConfig = {
        users: usersData.users,
        commonQuests: usersData.commonQuests,
        adminPassword: 'admin123', // Will be updated from Blob Store in a real implementation
        lastUpdated: new Date().toISOString(),
        version: '1.0'
      };

      this.questsLibrary = {
        quests: questsData,
        lastUpdated: new Date().toISOString(),
        version: '1.0'
      };

      console.log('Configuration chargée depuis Blob Store avec succès');
    } catch (error) {
      console.error('Erreur lors du chargement des configurations depuis Blob Store:', error);
      // Configuration par défaut en cas d'erreur
      this.usersConfig = {
        users: {},
        commonQuests: ['1'], // Default common quest
        adminPassword: 'admin123',
        lastUpdated: new Date().toISOString(),
        version: '1.0'
      };
      this.questsLibrary = {
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

  async verifyAdminPassword(password: string): Promise<boolean> {
    try {
      // Utiliser Blob Store pour vérifier le mot de passe
      return await VercelDataService.verifyAdminPassword(password);
    } catch (error) {
      console.error('Erreur lors de la vérification du mot de passe admin:', error);
      // Fallback: utiliser le mot de passe par défaut
      return password === 'admin123';
    }
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