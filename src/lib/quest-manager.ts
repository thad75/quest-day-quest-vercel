import { Quest, QuestGranularity, DailyQuestState, QuestGenerationConfig } from '@/types/enhanced-quest';
import { UserProfile, PlayerProgress } from '@/types/quest';
import QuestGenerator from './quest-generator';
import { userManager } from './userManager';

const DAILY_QUESTS_KEY = 'enhanced-daily-quests';
const QUEST_HISTORY_KEY = 'quest-history';
const QUEST_STATS_KEY = 'quest-stats';

export class QuestManager {
  private static instance: QuestManager;
  private questGenerator: QuestGenerator;

  private constructor() {
    this.questGenerator = QuestGenerator;
  }

  static getInstance(): QuestManager {
    if (!QuestManager.instance) {
      QuestManager.instance = new QuestManager();
    }
    return QuestManager.instance;
  }

  // Get current daily quest state
  getCurrentDailyQuests(): DailyQuestState | null {
    const stored = localStorage.getItem(DAILY_QUESTS_KEY);
    return stored ? JSON.parse(stored) : null;
  }

  // Save daily quest state
  saveDailyQuests(state: DailyQuestState): void {
    localStorage.setItem(DAILY_QUESTS_KEY, JSON.stringify(state));
  }

  // Get or generate quests for today
  async getTodaysQuests(profile: UserProfile): Promise<DailyQuestState> {
    const today = new Date().toISOString().split('T')[0];
    let currentState = this.getCurrentDailyQuests();

    const config: QuestGenerationConfig = {
      dailyQuestsCount: 6,
      weeklyQuestsCount: 4,
      monthlyQuestsCount: 3,
      maxDifficultyPerLevel: Math.min(3, Math.floor(profile.currentLevel / 2) + 1),
      categoryBalance: {
        health: 2,
        fitness: 2,
        work: 2,
        personal: 2,
        social: 1,
        learning: 1,
        creativity: 1,
        mindfulness: 1,
      },
      ensureVariety: true,
      considerPlayerHistory: true,
      adaptToPlayerLevel: true,
    };

    // Check if we need to regenerate quests
    if (!currentState || currentState.date !== today) {
      // IMPORTANT: Check if user has admin-assigned quests
      const assignedQuests = await this.getAssignedQuestsForUser(profile);

      if (assignedQuests && assignedQuests.length > 0) {
        // Use admin-assigned quests instead of generating random ones
        currentState = this.createStateFromAssignedQuests(today, assignedQuests);
        console.log('📋 Using admin-assigned quests:', assignedQuests.length, 'quests');
      } else {
        // Fall back to generated quests if no admin assignments
        const recentlyCompleted = this.getRecentlyCompletedQuests();
        currentState = this.questGenerator.generateDailyQuests(
          today,
          profile.currentLevel,
          config,
          recentlyCompleted
        );
        console.log('🎲 Generated random quests');
      }
      this.saveDailyQuests(currentState);
    } else {
      // Check if individual granularities need updates
      currentState = this.questGenerator.updateQuestsForGranularity(
        currentState,
        today,
        'daily',
        profile.currentLevel,
        config,
        this.getRecentlyCompletedQuests()
      );
      this.saveDailyQuests(currentState);
    }

    return currentState;
  }

  // Get quests assigned by admin for current user
  private async getAssignedQuestsForUser(profile: UserProfile): Promise<Quest[]> {
    try {
      const currentUser = userManager.getCurrentUser();
      if (!currentUser || !currentUser.dailyQuests || currentUser.dailyQuests.length === 0) {
        return [];
      }

      // Get all available quests
      const allQuests = userManager.getAllQuests();
      const assignedQuests: Quest[] = [];

      // Map assigned quest IDs to full Quest objects
      for (const questId of currentUser.dailyQuests) {
        const questConfig = allQuests.find(q => q.id === questId);
        if (questConfig) {
          assignedQuests.push({
            id: questConfig.id,
            title: questConfig.title,
            description: questConfig.description,
            xp: questConfig.xp,
            category: questConfig.category as any,
            difficulty: questConfig.difficulty === 'facile' ? 1 : questConfig.difficulty === 'moyen' ? 2 : 3,
            granularity: 'daily',
            icon: questConfig.icon,
            completed: false,
            progress: 0,
            createdAt: new Date().toISOString()
          });
        }
      }

      return assignedQuests;
    } catch (error) {
      console.error('Error loading assigned quests:', error);
      return [];
    }
  }

  // Create quest state from admin-assigned quests
  private createStateFromAssignedQuests(date: string, quests: Quest[]): DailyQuestState {
    return {
      date,
      dailyQuests: quests,
      weeklyQuests: [],
      monthlyQuests: [],
      specialQuests: [],
      totalProgress: 0,
      completedCount: 0
    };
  }

  // Toggle quest completion
  toggleQuestCompletion(questId: string, profile: UserProfile): {
    updatedQuests: DailyQuestState;
    xpGained: number;
    leveledUp: boolean;
    newLevel?: number;
  } {
    const currentState = this.getCurrentDailyQuests();
    if (!currentState) {
      throw new Error('No daily quests found');
    }

    const allQuests = [
      ...currentState.dailyQuests,
      ...currentState.weeklyQuests,
      ...currentState.monthlyQuests,
      ...currentState.specialQuests
    ];

    const quest = allQuests.find(q => q.id === questId);
    if (!quest) {
      throw new Error('Quest not found');
    }

    const wasCompleted = quest.completed;
    quest.completed = !quest.completed;
    quest.completedAt = quest.completed ? new Date().toISOString() : undefined;
    quest.progress = quest.completed ? 100 : 0;

    if (quest.completed && !wasCompleted) {
      this.recordQuestCompletion(quest, profile);
      this.updateQuestStats(quest, true);
    } else if (!quest.completed && wasCompleted) {
      this.updateQuestStats(quest, false);
    }

    this.saveDailyQuests(currentState);

    // Calculate XP and level up
    let totalXP = 0;
    let leveledUp = false;
    let newLevel: number | undefined;

    if (quest.completed && !wasCompleted) {
      totalXP = quest.xp + (quest.bonusXP || 0);
      const xpResult = this.calculateLevelUp(profile.currentXP, totalXP, profile.xpToNextLevel);
      leveledUp = xpResult.leveledUp;
      newLevel = xpResult.newLevel;
    } else if (!quest.completed && wasCompleted) {
      totalXP = -(quest.xp + (quest.bonusXP || 0));
    }

    return {
      updatedQuests: currentState,
      xpGained: totalXP,
      leveledUp,
      newLevel
    };
  }

  // Record quest completion in history
  private recordQuestCompletion(quest: Quest, profile: UserProfile): void {
    const history = this.getQuestHistory();
    history.push({
      questId: quest.id,
      completedAt: quest.completedAt!,
      xpEarned: quest.xp + (quest.bonusXP || 0),
      timeSpent: quest.timeSpent || 0,
      rating: undefined,
      feedback: undefined
    });
    localStorage.setItem(QUEST_HISTORY_KEY, JSON.stringify(history));
  }

  // Get quest completion history
  getQuestHistory(): any[] {
    const stored = localStorage.getItem(QUEST_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  // Get recently completed quests to avoid repetition
  private getRecentlyCompletedQuests(): string[] {
    const history = this.getQuestHistory();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return history
      .filter(entry => new Date(entry.completedAt) > sevenDaysAgo)
      .map(entry => entry.questId.split('_')[0]); // Get base quest ID
  }

  // Update quest statistics
  private updateQuestStats(quest: Quest, completed: boolean): void {
    const stats = this.getQuestStats();
    const key = `${quest.category}_${quest.difficulty}`;

    if (!stats[key]) {
      stats[key] = { completed: 0, total: 0 };
    }

    if (completed && !stats[quest.id]) {
      stats[key].completed++;
      stats[quest.id] = true; // Mark as completed today
    } else if (!completed && stats[quest.id]) {
      stats[key].completed--;
      delete stats[quest.id];
    }

    localStorage.setItem(QUEST_STATS_KEY, JSON.stringify(stats));
  }

  // Get quest statistics
  private getQuestStats(): Record<string, any> {
    const stored = localStorage.getItem(QUEST_STATS_KEY);
    return stored ? JSON.parse(stored) : {};
  }

  // Calculate level up from XP gain
  private calculateLevelUp(currentXP: number, xpGained: number, xpToNextLevel: number): {
    leveledUp: boolean;
    newLevel?: number;
  } {
    const newTotalXP = currentXP + xpGained;

    if (newTotalXP >= xpToNextLevel) {
      const newLevel = Math.floor(newTotalXP / 100) + 1;
      return {
        leveledUp: true,
        newLevel
      };
    }

    return {
      leveledUp: false
    };
  }

  // Get quest completion rate for different periods
  getCompletionStats(period: 'today' | 'week' | 'month'): {
    completed: number;
    total: number;
    rate: number;
  } {
    const history = this.getQuestHistory();
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    const periodHistory = history.filter(entry => new Date(entry.completedAt) >= startDate);
    const currentState = this.getCurrentDailyQuests();

    let total = 0;
    let completed = 0;

    if (currentState) {
      const allQuests = [
        ...currentState.dailyQuests,
        ...currentState.weeklyQuests,
        ...currentState.monthlyQuests,
        ...currentState.specialQuests
      ];

      total = allQuests.length;
      completed = allQuests.filter(q => q.completed).length;
    }

    return {
      completed,
      total,
      rate: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  }

  // Check if all quests of a specific granularity are completed
  areAllQuestsCompleted(granularity: QuestGranularity): boolean {
    const currentState = this.getCurrentDailyQuests();
    if (!currentState) return false;

    const quests = currentState[`${granularity}Quests` as keyof DailyQuestState] as Quest[];
    return quests.length > 0 && quests.every(q => q.completed);
  }

  // Reset quests for a specific granularity
  resetQuests(granularity: QuestGranularity): void {
    const currentState = this.getCurrentDailyQuests();
    if (!currentState) return;

    const quests = currentState[`${granularity}Quests` as keyof DailyQuestState] as Quest[];
    quests.forEach(quest => {
      quest.completed = false;
      quest.completedAt = undefined;
      quest.progress = 0;
    });

    this.saveDailyQuests(currentState);
  }

  // Get active quests for display
  getActiveQuests(): {
    daily: Quest[];
    weekly: Quest[];
    monthly: Quest[];
    special: Quest[];
  } {
    const currentState = this.getCurrentDailyQuests();
    if (!currentState) {
      return { daily: [], weekly: [], monthly: [], special: [] };
    }

    return {
      daily: currentState.dailyQuests || [],
      weekly: currentState.weeklyQuests || [],
      monthly: currentState.monthlyQuests || [],
      special: currentState.specialQuests || []
    };
  }

  // Migrate existing simple quests to enhanced system
  migrateExistingQuests(oldQuests: any[]): void {
    const currentState = this.getCurrentDailyQuests();
    if (currentState) return; // Already migrated

    const today = new Date().toISOString().split('T')[0];
    const config: QuestGenerationConfig = {
      dailyQuestsCount: oldQuests.length,
      weeklyQuestsCount: 4,
      monthlyQuestsCount: 3,
      maxDifficultyPerLevel: 3,
      categoryBalance: {
        health: 1,
        fitness: 1,
        work: 1,
        personal: 1,
        social: 1,
        learning: 1,
        creativity: 1,
        mindfulness: 1,
      },
      ensureVariety: false,
      considerPlayerHistory: false,
      adaptToPlayerLevel: false,
    };

    const newState = this.questGenerator.generateDailyQuests(
      today,
      1, // Start at level 1
      config
    );

    // Map old quests to new ones
    oldQuests.forEach((oldQuest, index) => {
      if (index < newState.dailyQuests.length) {
        newState.dailyQuests[index].completed = oldQuest.completed;
        if (oldQuest.completed) {
          newState.dailyQuests[index].completedAt = new Date().toISOString();
          newState.dailyQuests[index].progress = 100;
        }
      }
    });

    this.saveDailyQuests(newState);
  }
}

export default QuestManager.getInstance();