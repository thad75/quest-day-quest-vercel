export interface Quest {
  id: string;
  title: string;
  level: 1 | 2 | 3;
  xp: number;
  completed: boolean;
}

export interface PlayerProgress {
  currentLevel: number;
  currentXP: number;
  xpToNextLevel: number;
}

export interface UserProfile {
  username: string;
  bio?: string;
  avatar?: string;
  totalXP: number;
  currentLevel: number;
  currentXP: number;
  xpToNextLevel: number;
  questsCompleted: number;
  totalQuestsCompleted: number;
  currentStreak: number;
  longestStreak: number;
  joinDate: string;
  lastActiveDate: string;
  achievements: Achievement[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  isUnlocked: boolean;
  category: 'level' | 'streak' | 'quest' | 'special';
}
