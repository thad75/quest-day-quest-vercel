import { UserConfig, QuestConfig } from './userManager';

// Mock API service for local development
// In production, this would be replaced by actual API calls

const mockUsers: Record<string, UserConfig> = {
  thars: {
    id: 'thars',
    name: 'Thars',
    avatar: '🦸',
    dailyQuests: ['1', '3', '4', '6', '11'],
    preferences: {
      categories: ['santé', 'apprentissage'],
      difficulty: 'facile',
      questCount: 3,
      allowCommonQuests: true
    },
    totalXP: 0,
    currentLevel: 1,
    currentXP: 0,
    xpToNextLevel: 100,
    questsCompleted: 0,
    totalQuestsCompleted: 0,
    currentStreak: 0,
    longestStreak: 0,
    joinDate: new Date().toISOString(),
    lastActiveDate: new Date().toISOString(),
    achievements: []
  },
  alice: {
    id: 'alice',
    name: 'Alice',
    avatar: '👩‍💻',
    dailyQuests: ['2', '5', '7', '9', '12'],
    preferences: {
      categories: ['apprentissage', 'personnel'],
      difficulty: 'moyen',
      questCount: 4,
      allowCommonQuests: true
    },
    totalXP: 150,
    currentLevel: 2,
    currentXP: 50,
    xpToNextLevel: 200,
    questsCompleted: 15,
    totalQuestsCompleted: 15,
    currentStreak: 3,
    longestStreak: 5,
    joinDate: new Date().toISOString(),
    lastActiveDate: new Date().toISOString(),
    achievements: []
  }
};

const mockQuests: Record<string, QuestConfig> = {
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
    title: 'Lire 30 minutes',
    description: 'Lire un livre ou des articles pendant 30 minutes',
    category: 'apprentissage',
    xp: 15,
    difficulty: 'facile',
    icon: '📚',
    tags: ['lecture', 'apprentissage'],
    requirements: []
  },
  '3': {
    id: '3',
    title: 'Méditer 10 minutes',
    description: 'Faire une session de méditation de 10 minutes',
    category: 'santé',
    xp: 12,
    difficulty: 'facile',
    icon: '🧘',
    tags: ['méditation', 'santé mentale'],
    requirements: []
  }
};

const mockCommonQuests = ['1', '2', '10'];

export class MockApiService {
  static async getConfig() {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      success: true,
      data: {
        users: mockUsers,
        quests: mockQuests,
        commonQuests: mockCommonQuests,
        isEdgeConfigAvailable: false
      },
      fallback: true
    };
  }

  static async getUsers() {
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      success: true,
      data: {
        users: mockUsers,
        commonQuests: mockCommonQuests
      },
      fallback: true
    };
  }

  static async getQuests() {
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      success: true,
      data: {
        quests: mockQuests
      },
      fallback: true
    };
  }

  static async createUser(userData: Partial<UserConfig>) {
    await new Promise(resolve => setTimeout(resolve, 200));

    const newUser: UserConfig = {
      id: userData.id || `user${Date.now()}`,
      name: userData.name || 'Nouvel Utilisateur',
      avatar: userData.avatar || '👤',
      dailyQuests: userData.dailyQuests || ['1', '2', '3'],
      preferences: userData.preferences || {},
      totalXP: userData.totalXP || 0,
      currentLevel: userData.currentLevel || 1,
      currentXP: userData.currentXP || 0,
      xpToNextLevel: userData.xpToNextLevel || 100,
      questsCompleted: userData.questsCompleted || 0,
      totalQuestsCompleted: userData.totalQuestsCompleted || 0,
      currentStreak: userData.currentStreak || 0,
      longestStreak: userData.longestStreak || 0,
      joinDate: userData.joinDate || new Date().toISOString(),
      lastActiveDate: userData.lastActiveDate || new Date().toISOString(),
      achievements: userData.achievements || []
    };

    // In a real implementation, this would save to a database
    console.log('Mock: Created user', newUser);

    return {
      success: true,
      data: newUser
    };
  }

  static async updateUser(userId: string, updates: Partial<UserConfig>) {
    await new Promise(resolve => setTimeout(resolve, 200));

    const user = mockUsers[userId];
    if (!user) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    const updatedUser = { ...user, ...updates };
    console.log('Mock: Updated user', updatedUser);

    return {
      success: true,
      data: updatedUser
    };
  }

  static async deleteUser(userId: string) {
    await new Promise(resolve => setTimeout(resolve, 200));

    if (!mockUsers[userId]) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    console.log('Mock: Deleted user', userId);
    return {
      success: true
    };
  }

  static async createQuest(questData: Partial<QuestConfig>) {
    await new Promise(resolve => setTimeout(resolve, 200));

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

    console.log('Mock: Created quest', newQuest);

    return {
      success: true,
      data: newQuest
    };
  }

  static async updateQuest(questId: string, updates: Partial<QuestConfig>) {
    await new Promise(resolve => setTimeout(resolve, 200));

    const quest = mockQuests[questId];
    if (!quest) {
      return {
        success: false,
        error: 'Quest not found'
      };
    }

    const updatedQuest = { ...quest, ...updates };
    console.log('Mock: Updated quest', updatedQuest);

    return {
      success: true,
      data: updatedQuest
    };
  }

  static async deleteQuest(questId: string) {
    await new Promise(resolve => setTimeout(resolve, 200));

    if (!mockQuests[questId]) {
      return {
        success: false,
        error: 'Quest not found'
      };
    }

    console.log('Mock: Deleted quest', questId);
    return {
      success: true
    };
  }

  static async updateConfig(
    users: Record<string, UserConfig>,
    quests: Record<string, QuestConfig>,
    commonQuests: string[]
  ) {
    await new Promise(resolve => setTimeout(resolve, 300));

    console.log('Mock: Updated config', { users, quests, commonQuests });

    return {
      success: true,
      data: {
        usersConfig: {
          users,
          commonQuests,
          lastUpdated: new Date().toISOString()
        },
        questsConfig: {
          quests,
          lastUpdated: new Date().toISOString()
        }
      }
    };
  }
}