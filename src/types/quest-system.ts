// Types de granularité des quêtes
export type QuestGranularity = 'daily' | 'weekly' | 'monthly';

// Difficulté des quêtes
export enum QuestDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  EXPERT = 'expert'
}

// Catégories de quêtes
export enum QuestCategory {
  HEALTH = 'santé',
  WORK = 'travail',
  PERSONAL = 'personnel',
  FITNESS = 'fitness',
  LEARNING = 'apprentissage',
  SOCIAL = 'social',
  FINANCE = 'finance',
  CREATIVITY = 'créativité',
  HOBBY = 'loisirs'
}

// État d'une quête
export enum QuestStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed',
  PAUSED = 'paused',
  EXPIRED = 'expired'
}

// Schéma de base pour les quêtes
export interface Quest {
  id: string;
  title: string;
  description: string;
  granularity: QuestGranularity;
  category: QuestCategory;
  difficulty: QuestDifficulty;
  xpReward: number;
  maxCompletions?: number; // Pour les quêtes avec nombre limite de complétions
  timeLimit?: number; // Durée en minutes pour compléter la quête
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

// Quête personnalisée par utilisateur
export interface UserQuest extends Quest {
  userId: string;
  customTitle?: string;
  customDescription?: string;
  customXpReward?: number;
  customDifficulty?: QuestDifficulty;
  customTags?: string[];
  dueDate?: Date; // Date limite spécifique
  repeatPattern?: 'once' | 'daily' | 'weekly' | 'monthly'; // Pattern de répétition
}

// Historique des complétions de quête
export interface QuestCompletion {
  id: string;
  questId: string;
  userId: string;
  completedAt: Date;
  xpEarned: number;
  notes?: string;
  tookTime?: number; // Temps pris en minutes
  accuracy?: number; // Score de précision pour les quêtes basées sur la qualité
}

// Planification des quêtes
export interface QuestSchedule {
  id: string;
  questId: string;
  userId: string;
  scheduledDate: Date;
  status: 'scheduled' | 'in_progress' | 'completed' | 'skipped' | 'failed';
  estimatedTime: number; // Temps estimé en minutes
  actualStartTime?: Date;
  actualEndTime?: Date;
  repetitions: number;
  maxRepetitions?: number;
}

// Progression d'une quête spécifique pour un utilisateur
export interface QuestProgress {
  questId: string;
  userId: string;
  status: QuestStatus;
  progress: number; // Pourcentage de progression (0-100)
  completionsCount: number;
  lastCompletionDate?: Date;
  nextResetDate: Date; // Date prochaine réinitialisation
  streak: number; // Nombre de jours consécutifs de complétion
  bestStreak: number; // Meilleur streak jamais atteint
}

// Statistiques des quêtes par utilisateur
export interface QuestStats {
  userId: string;
  totalQuestsCompleted: number;
  totalXpEarned: number;
  currentLevel: number;
  xpToNextLevel: number;
  averageCompletionTime: number;
  successRate: number; // Pourcentage de succès
  questsByCategory: Record<QuestCategory, number>;
  questsByDifficulty: Record<QuestDifficulty, number>;
  longestStreak: number;
  favoriteCategory: QuestCategory;
  lastActivityDate: Date;
}

// Template de quête (pour quêtes par défaut)
export interface QuestTemplate {
  id: string;
  title: string;
  description: string;
  granularity: QuestGranularity;
  category: QuestCategory;
  difficulty: QuestDifficulty;
  baseXpReward: number;
  tags: string[];
  isSystemDefault: boolean; // Indique si c'est une quête par défaut
  conditions?: QuestCondition[]; // Conditions spécifiques pour activer cette quête
}

// Conditions pour activer une quête template
export interface QuestCondition {
  type: 'user_level' | 'previous_quest' | 'time_based' | 'milestone';
  operator: 'greater_than' | 'less_than' | 'equals' | 'contains';
  value: string | number | boolean;
}

// Récompense personnalisée
export interface QuestReward {
  type: 'xp' | 'badge' | 'item' | 'unlock' | 'custom';
  value: number | string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

// Notification de quête
export interface QuestNotification {
  id: string;
  userId: string;
  questId: string;
  type: 'reminder' | 'expired' | 'completed' | 'upcoming' | 'milestone';
  message: string;
  scheduledAt: Date;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

// Système de défis et objectifs globaux
export interface QuestMilestone {
  id: string;
  title: string;
  description: string;
  type: 'streak' | 'completion_count' | 'xp_total' | 'category_master';
  targetValue: number;
  reward: QuestReward;
  isUnlocked: boolean;
  unlockedAt?: Date;
  progress: number;
}

// Configuration globale du système de quêtes
export interface QuestSystemConfig {
  enableAutoReset: boolean;
  resetTimes: {
    daily: string; // Format HH:mm
    weekly: string;
    monthly: string;
  };
  xpMultipliers: Record<QuestDifficulty, number>;
  maxQuestsPerUser: number;
  enableNotifications: boolean;
  enableStreaks: boolean;
  enableQuestTemplates: boolean;
  categories: QuestCategory[];
}