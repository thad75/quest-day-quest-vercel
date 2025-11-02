import {
  Quest,
  QuestSystemState,
  PlayerProgress,
  UserProfile,
  QuestHistory,
  Achievement
} from '@/types/enhanced-quest';
import { QuestScheduler } from './quest-scheduler';
import { QuestProgressionSystem } from './quest-progression';
import { SpecialQuestsManager } from './special-quests';

// Integration layer to connect new quest system with existing codebase
export class QuestSystemIntegration {
  private static instance: QuestSystemIntegration;
  private questScheduler: QuestScheduler;
  private progressionSystem: QuestProgressionSystem;
  private specialQuestsManager: SpecialQuestsManager;

  private constructor() {
    this.questScheduler = QuestScheduler.getInstance();
    this.progressionSystem = QuestProgressionSystem;
    this.specialQuestsManager = SpecialQuestsManager.getInstance();
  }

  public static getInstance(): QuestSystemIntegration {
    if (!QuestSystemIntegration.instance) {
      QuestSystemIntegration.instance = new QuestSystemIntegration();
    }
    return QuestSystemIntegration.instance;
  }

  // Migration from old system to new system
  public migrateFromOldSystem(
    oldQuests: Array<{ id: string; title: string; level: number; xp: number; completed: boolean }>,
    oldProgress: { currentLevel: number; currentXP: number; xpToNextLevel: number },
    oldProfile: any
  ): {
    newQuestSystemState: QuestSystemState;
    newPlayerProgress: PlayerProgress;
    newProfile: UserProfile;
  } {
    // Convert old quests to new format
    const convertedQuests: Quest[] = oldQuests.map(oldQuest => ({
      id: oldQuest.id,
      title: oldQuest.title,
      category: this.inferQuestCategory(oldQuest.title),
      difficulty: oldQuest.level as 1 | 2 | 3,
      xp: oldQuest.xp,
      completed: oldQuest.completed,
      granularity: 'daily',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      completedAt: oldQuest.completed ? new Date().toISOString() : undefined
    }));

    // Initialize quest history from completed quests
    const questHistory: QuestHistory[] = oldQuests
      .filter(quest => quest.completed)
      .map(quest => ({
        questId: quest.id,
        completedAt: new Date().toISOString(),
        xpEarned: quest.xp,
        timeSpent: Math.floor(Math.random() * 60) + 10, // Estimate between 10-70 minutes
        rating: this.generateRandomRating()
      }));

    // Calculate enhanced statistics
    const totalXP = (oldProgress.currentLevel - 1) * 100 + oldProgress.currentXP;
    const completedDaily = oldQuests.filter(q => q.completed).length;

    const newPlayerProgress: PlayerProgress = {
      currentLevel: oldProgress.currentLevel,
      currentXP: oldProgress.currentXP,
      xpToNextLevel: oldProgress.xpToNextLevel,
      totalXP,
      questsCompleted: {
        daily: completedDaily,
        weekly: 0,
        monthly: 0,
        special: 0,
        total: completedDaily
      },
      averageCompletionTime: 30, // Default estimate
      favoriteCategory: this.inferQuestCategory(oldQuests[0]?.title || ''),
      strongestCategory: this.inferQuestCategory(oldQuests[0]?.title || ''),
      streaks: {
        daily: oldProfile.currentStreak || 0,
        weekly: 0,
        monthly: 0,
        longestDaily: oldProfile.longestStreak || 0,
        longestWeekly: 0,
        longestMonthly: 0
      }
    };

    const newProfile: UserProfile = {
      username: oldProfile.username || 'Aventurier',
      bio: oldProfile.bio,
      avatar: oldProfile.avatar || 'default',
      totalXP,
      currentLevel: oldProgress.currentLevel,
      currentXP: oldProgress.currentXP,
      xpToNextLevel: oldProgress.xpToNextLevel,
      questsCompleted: completedDaily,
      totalQuestsCompleted: completedDaily,
      currentStreak: oldProfile.currentStreak || 0,
      longestStreak: oldProfile.longestStreak || 0,
      joinDate: oldProfile.joinDate || new Date().toISOString(),
      lastActiveDate: new Date().toISOString(),
      questStats: {
        totalDailyCompleted: completedDaily,
        totalWeeklyCompleted: 0,
        totalMonthlyCompleted: 0,
        totalSpecialCompleted: 0,
        averageDailyCompletion: completedDaily,
        bestDay: new Date().toISOString().split('T')[0],
        favoriteCategories: [this.inferQuestCategory(oldQuests[0]?.title || '')],
        completionRateByCategory: this.calculateCompletionRateByCategory(oldQuests)
      },
      achievements: this.migrateAchievements(oldProfile.achievements || [])
    };

    const newQuestSystemState: QuestSystemState = {
      activeQuests: convertedQuests.filter(quest => !quest.completed),
      questHistory,
      playerQuestStates: convertedQuests.map(quest => ({
        questId: quest.id,
        status: quest.completed ? 'completed' : 'available',
        progress: quest.completed ? 100 : 0,
        currentCompletions: 0,
        completedAt: quest.completedAt,
        timeSpent: 0
      })),
      lastResetDates: {
        daily: new Date().toISOString().split('T')[0],
        weekly: this.getWeekStartString(),
        monthly: this.getMonthStartString()
      },
      currentStreak: {
        daily: oldProfile.currentStreak || 0,
        weekly: 0,
        monthly: 0
      },
      unlockedCategories: this.progressionSystem.getUnlockedCategories(oldProgress.currentLevel),
      questPreferences: {
        preferredCategories: [],
        avoidedCategories: [],
        difficultyPreference: 'balanced'
      }
    };

    return {
      newQuestSystemState,
      newPlayerProgress,
      newProfile: newProfile
    };
  }

  // Enhanced quest completion handler
  public async handleQuestCompletion(
    questId: string,
    userProfile: UserProfile,
    currentProgress: PlayerProgress,
    completionTime?: number
  ): Promise<{
    updatedProgress: PlayerProgress;
    updatedProfile: UserProfile;
    newXPGained: number;
    levelUp: boolean;
    rewards: {
      baseXP: number;
      bonusXP: number;
      totalXP: number;
      achievements: string[];
      titles: string[];
      badges: string[];
      bonuses: string[];
    };
  }> {
    const quest = this.questScheduler.getActiveQuests().find(q => q.id === questId);
    if (!quest) {
      throw new Error('Quest not found');
    }

    // Calculate XP with all multipliers
    const baseXP = quest.xp;
    const streakMultiplier = this.calculateStreakMultiplier(userProfile, quest);
    const totalXP = this.progressionSystem.calculateQuestXP(
      quest,
      userProfile.currentLevel,
      completionTime,
      streakMultiplier
    );

    // Generate rewards
    const rewards = this.progressionSystem.generateQuestRewards(quest, completionTime);

    // Check for special achievements
    const specialRewards = this.specialQuestsManager.checkAndAwardSpecialAchievements(userProfile, quest);

    // Combine all rewards
    const finalRewards = {
      baseXP,
      bonusXP: rewards.bonusXP + specialRewards.bonusXP,
      totalXP: totalXP + rewards.bonusXP + specialRewards.bonusXP,
      achievements: [...rewards.achievements, ...specialRewards.achievements],
      titles: specialRewards.titles,
      badges: specialRewards.badges,
      bonuses: rewards.bonuses
    };

    // Update progress
    const updatedProgress = this.updatePlayerProgress(currentProgress, finalRewards.totalXP);

    // Update profile
    const updatedProfile = this.updateUserProfile(userProfile, quest, finalRewards, completionTime);

    return {
      updatedProgress,
      updatedProfile,
      newXPGained: finalRewards.totalXP,
      levelUp: updatedProgress.currentLevel > currentProgress.currentLevel,
      rewards: finalRewards
    };
  }

  // Daily quest reset and generation
  public async handleDailyReset(userProfile: UserProfile): Promise<{
    newQuests: Quest[];
    bonusXP: number;
    celebrationMessage?: string;
  }> {
    const resetResult = await this.questScheduler.checkAndResetQuests(userProfile.currentLevel);

    let bonusXP = 0;
    let celebrationMessage;

    if (resetResult.dailyReset) {
      bonusXP = this.calculateDailyResetBonus(userProfile);
      celebrationMessage = this.generateDailyResetMessage(userProfile);
    }

    return {
      newQuests: resetResult.newQuests,
      bonusXP,
      celebrationMessage
    };
  }

  // Get current quest dashboard data
  public getQuestDashboardData(userProfile: UserProfile): {
    activeQuests: Quest[];
    questProgress: {
      daily: { completed: number; total: number; percentage: number };
      weekly: { completed: number; total: number; percentage: number };
      monthly: { completed: number; total: number; percentage: number };
      special: { completed: number; total: number; percentage: number };
    };
    categoryProgress: Record<string, { completed: number; total: number; mastery: number }>;
    upcomingEvents: any[];
    recommendations: string[];
  } {
    const activeQuests = this.questScheduler.getActiveQuests();
    const questState = this.questScheduler.getState();

    // Calculate progress by granularity
    const dailyQuests = activeQuests.filter(q => q.granularity === 'daily');
    const weeklyQuests = activeQuests.filter(q => q.granularity === 'weekly');
    const monthlyQuests = activeQuests.filter(q => q.granularity === 'monthly');
    const specialQuests = activeQuests.filter(q => q.granularity === 'special');

    const questProgress = {
      daily: {
        completed: dailyQuests.filter(q => q.completed).length,
        total: dailyQuests.length,
        percentage: this.calculateCompletionPercentage(dailyQuests)
      },
      weekly: {
        completed: weeklyQuests.filter(q => q.completed).length,
        total: weeklyQuests.length,
        percentage: this.calculateCompletionPercentage(weeklyQuests)
      },
      monthly: {
        completed: monthlyQuests.filter(q => q.completed).length,
        total: monthlyQuests.length,
        percentage: this.calculateCompletionPercentage(monthlyQuests)
      },
      special: {
        completed: specialQuests.filter(q => q.completed).length,
        total: specialQuests.length,
        percentage: this.calculateCompletionPercentage(specialQuests)
      }
    };

    // Calculate category progress
    const categoryProgress: Record<string, { completed: number; total: number; mastery: number }> = {};
    Object.values(QuestProgressionSystem.CATEGORY_PROGRESSION).forEach(categoryInfo => {
      const categoryQuests = activeQuests.filter(q => q.category === categoryInfo);
      const completed = categoryQuests.filter(q => q.completed).length;
      const mastery = this.progressionSystem.getCategoryMasteryProgress(
        categoryInfo,
        userProfile.questStats.totalDailyCompleted,
        userProfile.currentLevel
      );

      categoryProgress[categoryInfo] = {
        completed,
        total: categoryQuests.length,
        mastery: mastery.currentLevel
      };
    });

    // Get upcoming events
    const upcomingEvents = this.specialQuestsManager.getUpcomingEvents();

    // Generate recommendations
    const recommendations = this.generateQuestRecommendations(userProfile, activeQuests);

    return {
      activeQuests,
      questProgress,
      categoryProgress,
      upcomingEvents: [...upcomingEvents.seasonalEvents, ...upcomingEvents.communityChallenges],
      recommendations
    };
  }

  // Storage helpers for localStorage migration
  public saveToLocalStorage(
    questSystemState: QuestSystemState,
    playerProgress: PlayerProgress,
    userProfile: UserProfile
  ): void {
    const saveData = {
      questSystemState,
      playerProgress,
      userProfile,
      version: '2.0',
      lastSaved: new Date().toISOString()
    };

    localStorage.setItem('enhanced-quest-system', JSON.stringify(saveData));
  }

  public loadFromLocalStorage(): {
    questSystemState: QuestSystemState | null;
    playerProgress: PlayerProgress | null;
    userProfile: UserProfile | null;
  } {
    try {
      const savedData = localStorage.getItem('enhanced-quest-system');
      if (!savedData) {
        return { questSystemState: null, playerProgress: null, userProfile: null };
      }

      const parsed = JSON.parse(savedData);

      // Check version compatibility
      if (parsed.version !== '2.0') {
        console.warn('Quest system version mismatch, migration may be required');
      }

      return {
        questSystemState: parsed.questSystemState,
        playerProgress: parsed.playerProgress,
        userProfile: parsed.userProfile
      };
    } catch (error) {
      console.error('Error loading quest system from localStorage:', error);
      return { questSystemState: null, playerProgress: null, userProfile: null };
    }
  }

  // Helper methods
  private inferQuestCategory(title: string): QuestCategory {
    const titleLower = title.toLowerCase();

    if (titleLower.includes('eau') || titleLower.includes('boire') || titleLower.includes('manger')) {
      return 'health';
    }
    if (titleLower.includes('sport') || titleLower.includes('exercise') || titleLower.includes('squats')) {
      return 'fitness';
    }
    if (titleLower.includes('travail') || titleLower.includes('bureau') || titleLower.includes('rédiger')) {
      return 'work';
    }
    if (titleLower.includes('livre') || titleLower.includes('lire') || titleLower.includes('apprendre')) {
      return 'learning';
    }

    return 'personal';
  }

  private generateRandomRating(): 1 | 2 | 3 | 4 | 5 {
    const ratings: (1 | 2 | 3 | 4 | 5)[] = [1, 2, 3, 4, 5];
    const weights = [0.1, 0.15, 0.4, 0.25, 0.1]; // Higher probability for 3-4 stars

    const random = Math.random();
    let cumulative = 0;

    for (let i = 0; i < weights.length; i++) {
      cumulative += weights[i];
      if (random <= cumulative) {
        return ratings[i];
      }
    }

    return 3;
  }

  private calculateCompletionRateByCategory(oldQuests: any[]): Record<QuestCategory, number> {
    const categories: Record<QuestCategory, { completed: number; total: number }> = {
      health: { completed: 0, total: 0 },
      fitness: { completed: 0, total: 0 },
      work: { completed: 0, total: 0 },
      personal: { completed: 0, total: 0 },
      social: { completed: 0, total: 0 },
      learning: { completed: 0, total: 0 },
      creativity: { completed: 0, total: 0 },
      mindfulness: { completed: 0, total: 0 }
    };

    oldQuests.forEach(quest => {
      const category = this.inferQuestCategory(quest.title);
      categories[category].total++;
      if (quest.completed) {
        categories[category].completed++;
      }
    });

    const completionRate: Record<QuestCategory, number> = {} as any;
    Object.entries(categories).forEach(([category, stats]) => {
      completionRate[category as QuestCategory] = stats.total > 0 ? stats.completed / stats.total : 0;
    });

    return completionRate;
  }

  private migrateAchievements(oldAchievements: any[]): Achievement[] {
    // Map old achievements to new format
    return oldAchievements.map(oldAchievement => ({
      id: oldAchievement.id,
      title: oldAchievement.title,
      description: oldAchievement.description,
      icon: oldAchievement.icon,
      unlockedAt: oldAchievement.unlockedAt,
      isUnlocked: oldAchievement.isUnlocked,
      category: this.mapAchievementCategory(oldAchievement.category),
      rarity: this.calculateAchievementRarity(oldAchievement),
      hidden: false,
      progress: 100,
      maxProgress: 100
    }));
  }

  private mapAchievementCategory(oldCategory: string): Achievement['category'] {
    const categoryMap: Record<string, Achievement['category']> = {
      'quest': 'quest',
      'level': 'level',
      'streak': 'streak',
      'special': 'special',
      'default': 'quest'
    };

    return categoryMap[oldCategory] || 'quest';
  }

  private calculateAchievementRarity(achievement: any): Achievement['rarity'] {
    // Simple rarity calculation based on achievement type
    if (achievement.title.includes('Légende') || achievement.title.includes('Maître')) {
      return 'legendary';
    }
    if (achievement.title.includes('Expert') || achievement.title.includes('Avancé')) {
      return 'epic';
    }
    if (achievement.title.includes('Apprenti') || achievement.title.includes('Persévérance')) {
      return 'rare';
    }

    return 'common';
  }

  private calculateStreakMultiplier(userProfile: UserProfile, quest: Quest): number {
    let multiplier = 1.0;

    // Daily streak bonus
    if (quest.granularity === 'daily') {
      multiplier += userProfile.currentStreak * 0.05; // 5% per day, max 50%
    }

    // Weekly streak bonus
    if (quest.granularity === 'weekly' && userProfile.questStats.totalWeeklyCompleted > 0) {
      multiplier += 0.2; // 20% bonus for weekly consistency
    }

    // Monthly streak bonus
    if (quest.granularity === 'monthly' && userProfile.questStats.totalMonthlyCompleted > 0) {
      multiplier += 0.3; // 30% bonus for monthly consistency
    }

    return Math.min(multiplier, 2.0); // Cap at 100% bonus
  }

  private updatePlayerProgress(progress: PlayerProgress, xpGained: number): PlayerProgress {
    let newXP = progress.currentXP + xpGained;
    let newLevel = progress.currentLevel;
    let nextLevelXP = progress.xpToNextLevel;

    // Level up logic
    while (newXP >= nextLevelXP) {
      newXP -= nextLevelXP;
      newLevel++;
      nextLevelXP = newLevel * 100; // Each level requires 100 * level XP
    }

    return {
      ...progress,
      currentLevel: newLevel,
      currentXP: newXP,
      xpToNextLevel: nextLevelXP,
      totalXP: progress.totalXP + xpGained
    };
  }

  private updateUserProfile(
    profile: UserProfile,
    quest: Quest,
    rewards: any,
    completionTime?: number
  ): UserProfile {
    // Update quest completion stats
    const updatedQuestStats = { ...profile.questStats };

    switch (quest.granularity) {
      case 'daily':
        updatedQuestStats.totalDailyCompleted++;
        break;
      case 'weekly':
        updatedQuestStats.totalWeeklyCompleted++;
        break;
      case 'monthly':
        updatedQuestStats.totalMonthlyCompleted++;
        break;
      case 'special':
        updatedQuestStats.totalSpecialCompleted++;
        break;
    }

    updatedQuestStats.totalDailyCompleted = profile.questsCompleted + 1;
    updatedQuestStats.averageDailyCompletion = updatedQuestStats.totalDailyCompleted / Math.max(1, this.getDaysSinceJoin(profile));

    // Add new achievements, titles, and badges
    const newAchievements = [...profile.achievements];
    rewards.achievements.forEach((achievementId: string) => {
      if (!newAchievements.find(a => a.id === achievementId)) {
        newAchievements.push({
          id: achievementId,
          title: this.getAchievementTitle(achievementId),
          description: this.getAchievementDescription(achievementId),
          icon: this.getAchievementIcon(achievementId),
          isUnlocked: true,
          unlockedAt: new Date().toISOString(),
          category: 'special',
          rarity: 'common'
        });
      }
    });

    return {
      ...profile,
      totalXP: profile.totalXP + rewards.totalXP,
      currentLevel: profile.currentLevel, // Will be updated by progress system
      currentXP: profile.currentXP, // Will be updated by progress system
      questsCompleted: profile.questsCompleted + 1,
      totalQuestsCompleted: profile.totalQuestsCompleted + 1,
      lastActiveDate: new Date().toISOString(),
      questStats: updatedQuestStats,
      achievements: newAchievements
    };
  }

  private calculateDailyResetBonus(profile: UserProfile): number {
    const baseBonus = 25;
    const streakBonus = profile.currentStreak * 5;
    const levelBonus = profile.currentLevel * 2;

    return baseBonus + streakBonus + levelBonus;
  }

  private generateDailyResetMessage(profile: UserProfile): string {
    const messages = [
      `Nouvelles quêtes disponibles ! Continuez votre série de ${profile.currentStreak} jours.`,
      `Le jour se lève avec de nouveaux défis. Vous êtes niveau ${profile.currentLevel} !`,
      `Fresh quests await! Votre progression: ${profile.totalXP} XP au total.`
    ];

    return messages[Math.floor(Math.random() * messages.length)];
  }

  private calculateCompletionPercentage(quests: Quest[]): number {
    if (quests.length === 0) return 0;
    const completed = quests.filter(q => q.completed).length;
    return Math.round((completed / quests.length) * 100);
  }

  private getWeekStartString(): string {
    const date = new Date();
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const weekStart = new Date(date.setDate(diff));
    return weekStart.toISOString().split('T')[0];
  }

  private getMonthStartString(): string {
    const date = new Date();
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    return monthStart.toISOString().split('T')[0];
  }

  private getDaysSinceJoin(profile: UserProfile): number {
    const joinDate = new Date(profile.joinDate);
    const now = new Date();
    return Math.floor((now.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  private generateQuestRecommendations(profile: UserProfile, activeQuests: Quest[]): string[] {
    const recommendations: string[] = [];

    // Check for category balance
    const categories = activeQuests.map(q => q.category);
    const categoryCounts = categories.reduce((acc, cat) => {
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Recommend underrepresented categories
    Object.entries(QuestProgressionSystem.CATEGORY_PROGRESSION).forEach(([category, info]) => {
      if (!categoryCounts[category] && profile.currentLevel >= info.unlockLevel) {
        recommendations.push(`Essayez une quête ${info.description.toLowerCase()}`);
      }
    });

    // Recommend based on progress
    if (profile.currentXP / profile.xpToNextLevel > 0.8) {
      recommendations.push('Vous êtes proche du niveau suivant ! Terminez quelques quêtes rapides.');
    }

    return recommendations.slice(0, 3);
  }

  private getAchievementTitle(achievementId: string): string {
    const titles: Record<string, string> = {
      'event_participant': 'Participant aux Événements',
      'challenge_acceptor': 'Accepteur de Défis',
      'milestone_achiever': 'Atteinte de Paliers'
    };

    return titles[achievementId] || 'Succès Débloqué';
  }

  private getAchievementDescription(achievementId: string): string {
    const descriptions: Record<string, string> = {
      'event_participant': 'A participé à un événement spécial',
      'challenge_acceptor': 'A accepté un défi communautaire',
      'milestone_achiever': 'A atteint un palier important'
    };

    return descriptions[achievementId] || 'Un nouveau succès a été débloqué';
  }

  private getAchievementIcon(achievementId: string): string {
    const icons: Record<string, string> = {
      'event_participant': '🎉',
      'challenge_acceptor': '🏆',
      'milestone_achiever': '⭐'
    };

    return icons[achievementId] || '✨';
  }
}