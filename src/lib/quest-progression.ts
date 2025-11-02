import {
  QuestCategory,
  QuestDifficulty,
  QuestGranularity,
  Quest,
  PlayerProgress,
  UserProfile
} from '@/types/enhanced-quest';

// Quest progression system with categories and difficulty scaling
export class QuestProgressionSystem {
  // Category progression paths
  public static readonly CATEGORY_PROGRESSION: Record<QuestCategory, {
    description: string;
    icon: string;
    color: string;
    unlockLevel: number;
    masteryLevel: number;
    skills: string[];
    relatedCategories: QuestCategory[];
    xpMultiplier: number;
  }> = {
    health: {
      description: 'Quêtes liées à la santé physique et mentale',
      icon: '❤️',
      color: '#ef4444',
      unlockLevel: 1,
      masteryLevel: 20,
      skills: ['Endurance', 'Vitalité', 'Récupération'],
      relatedCategories: ['fitness', 'mindfulness'],
      xpMultiplier: 1.1
    },
    fitness: {
      description: 'Quêtes d\'exercice physique et de conditionnement',
      icon: '💪',
      color: '#f97316',
      unlockLevel: 2,
      masteryLevel: 25,
      skills: ['Force', 'Souplesse', 'Endurance'],
      relatedCategories: ['health', 'personal'],
      xpMultiplier: 1.2
    },
    work: {
      description: 'Quêtes de productivité et de développement professionnel',
      icon: '💼',
      color: '#3b82f6',
      unlockLevel: 3,
      masteryLevel: 30,
      skills: ['Focus', 'Organisation', 'Efficacité'],
      relatedCategories: ['learning', 'personal'],
      xpMultiplier: 1.15
    },
    personal: {
      description: 'Quêtes de développement personnel et de bien-être',
      icon: '🌱',
      color: '#10b981',
      unlockLevel: 1,
      masteryLevel: 15,
      skills: ['Discipline', 'Réflexion', 'Croissance'],
      relatedCategories: ['mindfulness', 'learning'],
      xpMultiplier: 1.0
    },
    social: {
      description: 'Quêtes d\'interaction et de connexion sociale',
      icon: '👥',
      color: '#8b5cf6',
      unlockLevel: 4,
      masteryLevel: 20,
      skills: ['Communication', 'Empathie', 'Leadership'],
      relatedCategories: ['personal', 'health'],
      xpMultiplier: 1.1
    },
    learning: {
      description: 'Quêtes d\'acquisition de connaissances et de compétences',
      icon: '📚',
      color: '#06b6d4',
      unlockLevel: 2,
      masteryLevel: 25,
      skills: ['Mémoire', 'Compréhension', 'Application'],
      relatedCategories: ['work', 'personal', 'creativity'],
      xpMultiplier: 1.2
    },
    creativity: {
      description: 'Quêtes d\'expression créative et d\'innovation',
      icon: '🎨',
      color: '#ec4899',
      unlockLevel: 5,
      masteryLevel: 35,
      skills: ['Imagination', 'Originalité', 'Expression'],
      relatedCategories: ['learning', 'personal'],
      xpMultiplier: 1.3
    },
    mindfulness: {
      description: 'Quêtes de pleine conscience et de bien-être mental',
      icon: '🧘',
      color: '#84cc16',
      unlockLevel: 1,
      masteryLevel: 20,
      skills: ['Concentration', 'Calme', 'Présence'],
      relatedCategories: ['health', 'personal'],
      xpMultiplier: 1.1
    }
  };

  // Difficulty progression system
  public static readonly DIFFICULTY_PROGRESSION: Record<QuestDifficulty, {
    name: string;
    description: string;
    baseXP: number;
    xpRange: [number, number];
    timeEstimate: string;
    color: string;
    requirements: {
      minLevel: number;
      categoryPrerequisites?: QuestCategory[];
      questPrerequisites?: number;
    };
    rewards: {
      xpMultiplier: number;
      bonusChance: number;
      unlocks?: string[];
    };
  }> = {
    1: {
      name: 'Débutant',
      description: 'Quêtes simples pour commencer',
      baseXP: 15,
      xpRange: [10, 25],
      timeEstimate: '5-15 minutes',
      color: '#10b981',
      requirements: {
        minLevel: 1
      },
      rewards: {
        xpMultiplier: 1.0,
        bonusChance: 0.05
      }
    },
    2: {
      name: 'Intermédiaire',
      description: 'Quêtes modérément difficiles',
      baseXP: 30,
      xpRange: [20, 45],
      timeEstimate: '15-30 minutes',
      color: '#3b82f6',
      requirements: {
        minLevel: 2
      },
      rewards: {
        xpMultiplier: 1.1,
        bonusChance: 0.1
      }
    },
    3: {
      name: 'Avancé',
      description: 'Quêtes exigeantes et enrichissantes',
      baseXP: 50,
      xpRange: [35, 70],
      timeEstimate: '30-60 minutes',
      color: '#f59e0b',
      requirements: {
        minLevel: 5,
        questPrerequisites: 5
      },
      rewards: {
        xpMultiplier: 1.2,
        bonusChance: 0.15,
        unlocks: ['level_4_quests']
      }
    },
    4: {
      name: 'Expert',
      description: 'Quêtes complexes pour joueurs expérimentés',
      baseXP: 80,
      xpRange: [60, 120],
      timeEstimate: '1-2 heures',
      color: '#ef4444',
      requirements: {
        minLevel: 10,
        questPrerequisites: 20,
        categoryPrerequisites: ['health', 'work']
      },
      rewards: {
        xpMultiplier: 1.4,
        bonusChance: 0.25,
        unlocks: ['level_5_quests', 'special_quests']
      }
    },
    5: {
      name: 'Maître',
      description: 'Quêtes légendaires pour les plus dévoués',
      baseXP: 150,
      xpRange: [100, 200],
      timeEstimate: '2-4 heures',
      color: '#7c3aed',
      requirements: {
        minLevel: 15,
        questPrerequisites: 50,
        categoryPrerequisites: ['fitness', 'learning', 'social']
      },
      rewards: {
        xpMultiplier: 1.6,
        bonusChance: 0.4,
        unlocks: ['legendary_quests', 'master_titles']
      }
    }
  };

  // Granularity progression
  public static readonly GRANULARITY_PROGRESSION: Record<QuestGranularity, {
    name: string;
    description: string;
    resetFrequency: string;
    xpMultiplier: number;
    questCount: {
      min: number;
      max: number;
    };
    unlockLevel: number;
  }> = {
    daily: {
      name: 'Quotidiennes',
      description: 'Se renouvellent chaque jour',
      resetFrequency: 'Tous les jours à minuit',
      xpMultiplier: 1.0,
      questCount: { min: 5, max: 12 },
      unlockLevel: 1
    },
    weekly: {
      name: 'Hebdomadaires',
      description: 'Se renouvellent chaque semaine',
      resetFrequency: 'Chaque lundi à minuit',
      xpMultiplier: 1.3,
      questCount: { min: 3, max: 10 },
      unlockLevel: 2
    },
    monthly: {
      name: 'Mensuelles',
      description: 'Se renouvellent chaque mois',
      resetFrequency: 'Le 1er de chaque mois',
      xpMultiplier: 1.8,
      questCount: { min: 2, max: 7 },
      unlockLevel: 5
    },
    special: {
      name: 'Spéciales',
      description: 'Quêtes événementielles uniques',
      resetFrequency: 'Variable',
      xpMultiplier: 2.5,
      questCount: { min: 1, max: 3 },
      unlockLevel: 3
    }
  };

  // Calculate quest difficulty based on player level and performance
  public calculateOptimalDifficulty(
    playerLevel: number,
    categoryStats?: Record<QuestCategory, { completed: number; successRate: number }>
  ): QuestDifficulty {
    const baseDifficulty = Math.min(5, Math.ceil(playerLevel / 4));

    // Adjust based on category performance
    if (categoryStats) {
      const averageSuccessRate = Object.values(categoryStats)
        .reduce((sum, stat) => sum + stat.successRate, 0) / Object.values(categoryStats).length;

      if (averageSuccessRate > 0.9) {
        return Math.min(5, baseDifficulty + 1) as QuestDifficulty;
      } else if (averageSuccessRate < 0.6) {
        return Math.max(1, baseDifficulty - 1) as QuestDifficulty;
      }
    }

    return baseDifficulty as QuestDifficulty;
  }

  // Calculate quest XP with multipliers
  public calculateQuestXP(
    quest: Quest,
    playerLevel: number,
    completionTime?: number,
    streakMultiplier: number = 1.0
  ): number {
    let xp = quest.xp;

    // Apply category multiplier
    const categoryInfo = this.CATEGORY_PROGRESSION[quest.category];
    xp *= categoryInfo.xpMultiplier;

    // Apply granularity multiplier
    const granularityInfo = this.GRANULARITY_PROGRESSION[quest.granularity];
    xp *= granularityInfo.xpMultiplier;

    // Apply level-based scaling
    const levelScaling = 1 + (playerLevel - 1) * 0.02; // 2% per level
    xp *= Math.min(levelScaling, 1.5); // Cap at 50% bonus

    // Apply time bonus
    if (completionTime && quest.timeLimit) {
      const timeRatio = completionTime / quest.timeLimit;
      if (timeRatio < 0.5) {
        xp *= 1.2; // 20% bonus for completing quickly
      } else if (timeRatio > 0.9) {
        xp *= 0.9; // 10% penalty for taking too long
      }
    }

    // Apply streak multiplier
    xp *= streakMultiplier;

    return Math.round(xp);
  }

  // Check if player can unlock new categories
  public getUnlockedCategories(playerLevel: number): QuestCategory[] {
    return Object.entries(this.CATEGORY_PROGRESSION)
      .filter(([_, info]) => playerLevel >= info.unlockLevel)
      .map(([category]) => category as QuestCategory);
  }

  // Get category mastery progress
  public getCategoryMasteryProgress(
    category: QuestCategory,
    completedQuests: number,
    playerLevel: number
  ): {
    currentLevel: number;
    progress: number;
    masteryLevel: number;
    nextMilestone: number;
    title: string;
  } {
    const categoryInfo = this.CATEGORY_PROGRESSION[category];
    const masteryLevel = categoryInfo.masteryLevel;

    // Calculate mastery progress based on completed quests and player level
    const questProgress = Math.min(completedQuests / masteryLevel, 1) * 0.7;
    const levelProgress = Math.min(playerLevel / masteryLevel, 1) * 0.3;
    const totalProgress = questProgress + levelProgress;

    const currentMasteryLevel = Math.floor(totalProgress * 10) + 1;
    const progress = (totalProgress * 10) % 1;

    const titles = [
      'Novice', 'Apprenti', 'Initié', 'Compétent', 'Expérimenté',
      'Avancé', 'Expert', 'Maître', 'Grand Maître', 'Légende'
    ];

    return {
      currentLevel: currentMasteryLevel,
      progress,
      masteryLevel,
      nextMilestone: Math.ceil((currentMasteryLevel / 10) * masteryLevel),
      title: titles[Math.min(currentMasteryLevel - 1, titles.length - 1)]
    };
  }

  // Get recommended quests based on player profile
  public getRecommendedQuests(
    playerLevel: number,
    completedCategories: Record<QuestCategory, number>,
    currentQuests: Quest[]
  ): QuestCategory[] {
    const unlockedCategories = this.getUnlockedCategories(playerLevel);
    const leastUsedCategories = unlockedCategories
      .filter(category => !currentQuests.some(quest => quest.category === category))
      .sort((a, b) => (completedCategories[a] || 0) - (completedCategories[b] || 0));

    // Return top 3 least used categories
    return leastUsedCategories.slice(0, 3);
  }

  // Calculate difficulty progression curve
  public getDifficultyProgression(
    playerLevel: number,
    questHistory: Array<{ difficulty: QuestDifficulty; completedAt: string }>
  ): {
    recommendedDifficulty: QuestDifficulty;
    difficultyTrend: 'increasing' | 'stable' | 'decreasing';
    confidence: number;
    suggestion: string;
  } {
    const recentQuests = questHistory
      .filter(quest => {
        const daysSince = (Date.now() - new Date(quest.completedAt).getTime()) / (1000 * 60 * 60 * 24);
        return daysSince <= 7; // Last 7 days
      })
      .slice(-10); // Last 10 quests

    if (recentQuests.length < 3) {
      return {
        recommendedDifficulty: Math.min(3, Math.ceil(playerLevel / 3)) as QuestDifficulty,
        difficultyTrend: 'stable',
        confidence: 0.3,
        suggestion: 'Continuez à explorer différentes difficultés'
      };
    }

    const avgDifficulty = recentQuests.reduce((sum, quest) => sum + quest.difficulty, 0) / recentQuests.length;
    const recentAvgDifficulty = recentQuests.slice(-3).reduce((sum, quest) => sum + quest.difficulty, 0) / 3;

    let trend: 'increasing' | 'stable' | 'decreasing';
    if (recentAvgDifficulty > avgDifficulty + 0.5) {
      trend = 'increasing';
    } else if (recentAvgDifficulty < avgDifficulty - 0.5) {
      trend = 'decreasing';
    } else {
      trend = 'stable';
    }

    let recommendedDifficulty = Math.round(avgDifficulty) as QuestDifficulty;
    let confidence = Math.min(recentQuests.length / 10, 1);

    // Adjust based on trend
    if (trend === 'increasing' && confidence > 0.6) {
      recommendedDifficulty = Math.min(5, recommendedDifficulty + 1) as QuestDifficulty;
    } else if (trend === 'decreasing' && confidence > 0.6) {
      recommendedDifficulty = Math.max(1, recommendedDifficulty - 1) as QuestDifficulty;
    }

    const suggestions = {
      increasing: 'Vous progressez bien ! Essayez des quêtes plus difficiles.',
      decreasing: 'Peut-être prendre des quêtes plus simples pour retrouver confiance.',
      stable: 'Votre rythme est bon. Continuez avec cette difficulté.'
    };

    return {
      recommendedDifficulty,
      difficultyTrend: trend,
      confidence,
      suggestion: suggestions[trend]
    };
  }

  // Generate quest completion rewards and bonuses
  public generateQuestRewards(
    quest: Quest,
    completionTime?: number,
    comboCount: number = 1
  ): {
    baseXP: number;
    bonusXP: number;
    totalXP: number;
    bonuses: string[];
    achievements?: string[];
  } {
    const difficultyInfo = this.DIFFICULTY_PROGRESSION[quest.difficulty];
    const categoryInfo = this.CATEGORY_PROGRESSION[quest.category];

    let baseXP = quest.xp;
    let bonusXP = 0;
    const bonuses: string[] = [];

    // Speed bonus
    if (completionTime && quest.timeLimit) {
      const timeRatio = completionTime / quest.timeLimit;
      if (timeRatio < 0.3) {
        const speedBonus = Math.round(baseXP * 0.3);
        bonusXP += speedBonus;
        bonuses.push(`Bonus vitesse: +${speedBonus} XP`);
      } else if (timeRatio < 0.5) {
        const speedBonus = Math.round(baseXP * 0.15);
        bonusXP += speedBonus;
        bonuses.push(`Bonus rapidité: +${speedBonus} XP`);
      }
    }

    // Combo bonus
    if (comboCount > 1) {
      const comboBonus = Math.round(baseXP * (comboCount - 1) * 0.1);
      bonusXP += comboBonus;
      bonuses.push(`Combo x${comboCount}: +${comboBonus} XP`);
    }

    // Category mastery bonus
    if (Math.random() < difficultyInfo.rewards.bonusChance) {
      const masteryBonus = Math.round(baseXP * 0.5);
      bonusXP += masteryBonus;
      bonuses.push(`Maîtrise ${categoryInfo.description}: +${masteryBonus} XP`);
    }

    // Perfect completion (all daily quests completed)
    if (quest.granularity === 'daily' && Math.random() < 0.1) {
      const perfectBonus = Math.round(baseXP * 0.25);
      bonusXP += perfectBonus;
      bonuses.push(`Complétion parfaite: +${perfectBonus} XP`);
    }

    return {
      baseXP,
      bonusXP,
      totalXP: baseXP + bonusXP,
      bonuses
    };
  }

  // Get progression metrics for analytics
  public getProgressionMetrics(
    questHistory: Array<{
      category: QuestCategory;
      difficulty: QuestDifficulty;
      granularity: QuestGranularity;
      completedAt: string;
      xp: number;
    }>
  ): {
    categoryDistribution: Record<QuestCategory, number>;
    difficultyProgression: Array<{ date: string; avgDifficulty: number }>;
    completionStreaks: {
      daily: number;
      weekly: number;
      monthly: number;
    };
    totalXP: number;
    averageXPPerQuest: number;
    favoriteCategory: QuestCategory;
  } {
    const categoryDistribution: Record<QuestCategory, number> = {} as any;
    const difficultyByDate: Record<string, number[]> = {};

    let totalXP = 0;
    let longestDailyStreak = 0;
    let longestWeeklyStreak = 0;
    let longestMonthlyStreak = 0;

    // Calculate distributions and totals
    questHistory.forEach(quest => {
      // Category distribution
      categoryDistribution[quest.category] = (categoryDistribution[quest.category] || 0) + 1;

      // Difficulty by date
      const date = quest.completedAt.split('T')[0];
      if (!difficultyByDate[date]) {
        difficultyByDate[date] = [];
      }
      difficultyByDate[date].push(quest.difficulty);

      // Total XP
      totalXP += quest.xp;
    });

    // Calculate difficulty progression
    const difficultyProgression = Object.entries(difficultyByDate)
      .map(([date, difficulties]) => ({
        date,
        avgDifficulty: difficulties.reduce((sum, d) => sum + d, 0) / difficulties.length
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Find favorite category
    const favoriteCategory = Object.entries(categoryDistribution)
      .sort(([, a], [, b]) => b - a)[0]?.[0] as QuestCategory || 'personal';

    return {
      categoryDistribution,
      difficultyProgression,
      completionStreaks: {
        daily: longestDailyStreak,
        weekly: longestWeeklyStreak,
        monthly: longestMonthlyStreak
      },
      totalXP,
      averageXPPerQuest: questHistory.length > 0 ? Math.round(totalXP / questHistory.length) : 0,
      favoriteCategory
    };
  }
}