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
