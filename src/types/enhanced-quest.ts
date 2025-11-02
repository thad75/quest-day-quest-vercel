// Enhanced Quest System with Multi-Granularity Support

export type QuestGranularity = 'daily' | 'weekly' | 'monthly' | 'special';
export type QuestCategory = 'health' | 'work' | 'personal' | 'social' | 'learning' | 'creativity' | 'fitness' | 'mindfulness';
export type QuestDifficulty = 1 | 2 | 3 | 4 | 5; // Expanded difficulty levels

export interface Quest {
  id: string;
  title: string;
  description?: string;
  category: QuestCategory;
  difficulty: QuestDifficulty;
  xp: number;
  completed: boolean;
  granularity: QuestGranularity;

  // Scheduling and timing
  startDate: string; // ISO date string
  endDate?: string; // For time-limited quests
  resetSchedule?: string; // Cron-like expression for special quests

  // Quest metadata
  icon?: string;
  tags?: string[];
  prerequisites?: string[]; // IDs of required quests
  isHidden?: boolean; // Hidden until prerequisites met
  maxCompletions?: number; // For repeatable quests
  currentCompletions?: number;

  // Progress tracking
  progress?: number; // 0-100 for progress-based quests
  isLocked?: boolean; // Due to prerequisites

  // Rewards and bonuses
  bonusXP?: number; // Special bonus XP
  itemRewards?: string[]; // Future: items, badges, etc.

  // Time tracking
  completedAt?: string;
  timeSpent?: number; // Minutes spent on quest
}

export interface QuestTemplate {
  id: string;
  title: string;
  description?: string;
  category: QuestCategory;
  difficulty: QuestDifficulty;
  baseXP: number;
  icon?: string;
  tags?: string[];
  prerequisites?: string[];
  maxCompletions?: number;
  timeLimit?: number; // In hours

  // Variations for different contexts
  variations?: QuestVariation[];

  // Scheduling rules
  allowedGranularities: QuestGranularity[];
  weight: number; // Probability weight (1-10)
  seasonalAvailability?: string[]; // Months when quest is available
  levelRequirement?: number; // Minimum player level

  // Dynamic content
  isDynamic?: boolean; // Can quest content be personalized
  personalizedFields?: string[]; // Fields that can be customized
}

export interface QuestVariation {
  id: string;
  title: string;
  description?: string;
  xpModifier?: number; // Modifier to base XP (0.5-2.0)
  difficultyModifier?: number; // +/- difficulty levels
  conditions?: string[]; // When this variation appears
}

export interface QuestSchedule {
  id: string;
  questId: string;
  granularity: QuestGranularity;
  scheduledDate: string;
  variationId?: string;
  isActive: boolean;
  generatedAt: string;
}

export interface PlayerQuestState {
  questId: string;
  status: 'available' | 'active' | 'completed' | 'expired' | 'skipped';
  progress: number;
  currentCompletions: number;
  startedAt?: string;
  completedAt?: string;
  expiresAt?: string;
  timeSpent: number;
  notes?: string;
}

export interface QuestHistory {
  questId: string;
  completedAt: string;
  xpEarned: number;
  timeSpent: number;
  rating?: 1 | 2 | 3 | 4 | 5; // Player rating
  feedback?: string;
  variationId?: string;
}

export interface QuestPool {
  [granularity: string]: {
    [category: string]: QuestTemplate[];
  };
}

export interface QuestGenerationConfig {
  dailyQuestsCount: number;
  weeklyQuestsCount: number;
  monthlyQuestsCount: number;
  maxDifficultyPerLevel: number;
  categoryBalance: Record<QuestCategory, number>; // Weight distribution
  ensureVariety: boolean; // Avoid repeating categories
  considerPlayerHistory: boolean; // Avoid recently completed quests
  adaptToPlayerLevel: boolean;
}

export interface QuestSystemState {
  activeQuests: Quest[];
  questHistory: QuestHistory[];
  playerQuestStates: PlayerQuestState[];
  lastResetDates: {
    daily: string;
    weekly: string;
    monthly: string;
  };
  currentStreak: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  unlockedCategories: QuestCategory[];
  questPreferences: {
    preferredCategories: QuestCategory[];
    avoidedCategories: QuestCategory[];
    difficultyPreference: 'easy' | 'balanced' | 'challenging';
  };
}

// Enhanced interfaces for existing system
export interface PlayerProgress {
  currentLevel: number;
  currentXP: number;
  xpToNextLevel: number;
  totalXP: number;

  // Quest statistics
  questsCompleted: {
    daily: number;
    weekly: number;
    monthly: number;
    special: number;
    total: number;
  };

  // Performance metrics
  averageCompletionTime: number; // Minutes
  favoriteCategory: QuestCategory;
  strongestCategory: QuestCategory;

  // Streak information
  streaks: {
    daily: number;
    weekly: number;
    monthly: number;
    longestDaily: number;
    longestWeekly: number;
    longestMonthly: number;
  };
}

export interface UserProfile {
  username: string;
  bio?: string;
  avatar?: string;

  // Progress tracking
  totalXP: number;
  currentLevel: number;
  currentXP: number;
  xpToNextLevel: number;

  // Quest completion stats
  questsCompleted: number;
  totalQuestsCompleted: number;
  currentStreak: number;
  longestStreak: number;
  joinDate: string;
  lastActiveDate: string;

  // Enhanced quest statistics
  questStats: {
    totalDailyCompleted: number;
    totalWeeklyCompleted: number;
    totalMonthlyCompleted: number;
    totalSpecialCompleted: number;
    averageDailyCompletion: number;
    bestDay: string;
    favoriteCategories: QuestCategory[];
    completionRateByCategory: Record<QuestCategory, number>;
  };

  achievements: Achievement[];
  badges?: Badge[];
  titles?: Title[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'level' | 'streak' | 'quest' | 'special' | 'category' | 'time' | 'social';
  unlockedAt?: string;
  isUnlocked: boolean;
  progress?: number; // For progressive achievements
  maxProgress?: number;
  hidden?: boolean; // Hidden until unlocked
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: string;
  category: QuestCategory;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface Title {
  id: string;
  name: string;
  description: string;
  unlockedAt: string;
  requirements: string;
  isActive: boolean;
}

// Special quest types
export interface SpecialQuest extends Quest {
  type: 'event' | 'challenge' | 'collaborative' | 'seasonal';
  eventStartDate?: string;
  eventEndDate?: string;
  participants?: string[]; // For collaborative quests
  leaderboard?: QuestLeaderboardEntry[];
}

export interface QuestLeaderboardEntry {
  playerId: string;
  playerName: string;
  score: number;
  completedAt: string;
}

// Quest generation and scheduling interfaces
export interface QuestGenerationResult {
  quests: Quest[];
  generationTime: string;
  config: QuestGenerationConfig;
  seed: string; // For reproducible generation
}

export interface QuestResetEvent {
  type: QuestGranularity;
  resetDate: string;
  previousQuests: Quest[];
  newQuests: Quest[];
  bonusXP?: number;
  celebration?: string;
}