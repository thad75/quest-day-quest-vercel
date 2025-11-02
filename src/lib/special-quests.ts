import {
  SpecialQuest,
  QuestTemplate,
  QuestCategory,
  QuestGranularity,
  Quest,
  UserProfile,
  QuestLeaderboardEntry
} from '@/types/enhanced-quest';

// Special quests and events system
export class SpecialQuestsManager {
  private static instance: SpecialQuestsManager;
  private activeEvents: Map<string, SpecialEvent> = new Map();
  private seasonalEvents: Map<string, SeasonalEvent> = new Map();
  private communityChallenges: Map<string, CommunityChallenge> = new Map();

  private constructor() {
    this.initializeSeasonalEvents();
    this.initializeCommunityChallenges();
  }

  public static getInstance(): SpecialQuestsManager {
    if (!SpecialQuestsManager.instance) {
      SpecialQuestsManager.instance = new SpecialQuestsManager();
    }
    return SpecialQuestsManager.instance;
  }

  // Event types
  private initializeSeasonalEvents(): void {
    this.seasonalEvents.set('spring_renewal', {
      id: 'spring_renewal',
      name: 'Renaissance du Printemps',
      description: 'Célébrez le renouveau avec des quêtes de croissance personnelle',
      startDate: '2024-03-20',
      endDate: '2024-06-20',
      icon: '🌸',
      color: '#ec4899',
      questTemplates: [
        {
          id: 'spring_outdoor_activity',
          title: 'Passer 30 minutes dehors dans la nature',
          category: 'health',
          difficulty: 2,
          baseXP: 40,
          icon: '🌳',
          allowedGranularities: ['daily'],
          weight: 8
        },
        {
          id: 'spring_new_skill',
          title: 'Commencer à apprendre une nouvelle compétence',
          category: 'learning',
          difficulty: 3,
          baseXP: 60,
          icon: '🌱',
          allowedGranularities: ['weekly'],
          weight: 6
        },
        {
          id: 'spring_spring_cleaning',
          title: 'Organiser et nettoyer un espace de vie',
          category: 'personal',
          difficulty: 2,
          baseXP: 45,
          icon: '🧹',
          allowedGranularities: ['monthly'],
          weight: 5
        }
      ],
      rewards: {
        title: 'Héros du Printemps',
        badge: 'spring_champion',
        bonusXP: 200
      }
    });

    this.seasonalEvents.set('summer_adventure', {
      id: 'summer_adventure',
      name: 'Aventure d\'Été',
      description: 'Profitez de l\'été avec des défis en plein air',
      startDate: '2024-06-21',
      endDate: '2024-09-22',
      icon: '☀️',
      color: '#f59e0b',
      questTemplates: [
        {
          id: 'summer_swimming',
          title: 'Faire une session de natation',
          category: 'fitness',
          difficulty: 3,
          baseXP: 50,
          icon: '🏊',
          allowedGranularities: ['weekly'],
          weight: 7
        },
        {
          id: 'summer_social_outdoor',
          title: 'Organiser une activité en plein air avec des amis',
          category: 'social',
          difficulty: 3,
          baseXP: 70,
          icon: '🏖️',
          allowedGranularities: ['weekly'],
          weight: 6
        }
      ],
      rewards: {
        title: 'Explorateur d\'Été',
        badge: 'summer_explorer',
        bonusXP: 250
      }
    });

    this.seasonalEvents.set('autumn_reflection', {
      id: 'autumn_reflection',
      name: 'Réflexion d\'Automne',
      description: 'Un moment pour réfléchir et planifier',
      startDate: '2024-09-23',
      endDate: '2024-12-20',
      icon: '🍂',
      color: '#ea580c',
      questTemplates: [
        {
          id: 'autumn_gratitude_journal',
          title: 'Écrire 10 choses pour lesquelles vous êtes reconnaissant',
          category: 'mindfulness',
          difficulty: 2,
          baseXP: 35,
          icon: '📔',
          allowedGranularities: ['daily'],
          weight: 8
        },
        {
          id: 'autumn_goal_review',
          title: 'Revoir et ajuster vos objectifs annuels',
          category: 'work',
          difficulty: 4,
          baseXP: 80,
          icon: '🎯',
          allowedGranularities: ['monthly'],
          weight: 5
        }
      ],
      rewards: {
        title: 'Sage d\'Automne',
        badge: 'autumn_wise',
        bonusXP: 300
      }
    });

    this.seasonalEvents.set('winter_cozy', {
      id: 'winter_cozy',
      name: 'Confort d\'Hiver',
      description: 'Chaleur et bien-être pendant la saison froide',
      startDate: '2024-12-21',
      endDate: '2025-03-19',
      icon: '❄️',
      color: '#3b82f6',
      questTemplates: [
        {
          id: 'winter_wellness_routine',
          title: 'Créer une routine wellness hivernale',
          category: 'health',
          difficulty: 3,
          baseXP: 55,
          icon: '🧣',
          allowedGranularities: ['weekly'],
          weight: 7
        },
        {
          id: 'winter_indoor_hobby',
          title: 'Développer un passe-temps intérieur',
          category: 'creativity',
          difficulty: 2,
          baseXP: 40,
          icon: '🧶',
          allowedGranularities: ['weekly'],
          weight: 6
        }
      ],
      rewards: {
        title: 'Maître de l\'Hiver',
        badge: 'winter_master',
        bonusXP: 250
      }
    });
  }

  private initializeCommunityChallenges(): void {
    this.communityChallenges.set('global_fitness_week', {
      id: 'global_fitness_week',
      name: 'Semaine Mondiale de la Fitness',
      description: 'Rejoignez des milliers de participants pour une semaine de défis fitness',
      startDate: '2024-06-01',
      endDate: '2024-06-07',
      type: 'collaborative',
      targetParticipants: 10000,
      currentParticipants: 0,
      collectiveGoal: 'Atteindre 1 million de minutes d\'exercice',
      currentProgress: 0,
      questTemplate: {
        id: 'community_fitness_challenge',
        title: 'Faire {{minutes}} minutes d\'exercice',
        category: 'fitness',
        difficulty: 3,
        baseXP: 45,
        icon: '🌍',
        allowedGranularities: ['daily'],
        weight: 10
      },
      rewards: {
        individualXP: 100,
        communityBadge: 'global_fitness_champion',
        titleReward: 'Champion Fitness Mondial'
      }
    });

    this.communityChallenges.set('learning_marathon', {
      id: 'learning_marathon',
      name: 'Marathon d\'Apprentissage',
      description: 'Défi d\'apprentissage intensif sur un week-end',
      startDate: '2024-09-14',
      endDate: '2024-09-16',
      type: 'challenge',
      questTemplate: {
        id: 'learning_marathon_quest',
        title: 'Apprendre pendant {{hours}} heures',
        category: 'learning',
        difficulty: 4,
        baseXP: 120,
        icon: '📚',
        allowedGranularities: ['special'],
        weight: 8
      },
      rewards: {
        individualXP: 200,
        badge: 'marathon_learner',
        titleReward: 'Marathonien du Savoir'
      }
    });
  }

  // Special quest generation methods
  public generateEventQuests(userProfile: UserProfile, currentDate: Date = new Date()): SpecialQuest[] {
    const specialQuests: SpecialQuest[] = [];

    // Check for active seasonal events
    const activeSeasonalEvents = this.getActiveSeasonalEvents(currentDate);
    activeSeasonalEvents.forEach(event => {
      const eventQuest = this.createSeasonalEventQuest(event, userProfile, currentDate);
      if (eventQuest) {
        specialQuests.push(eventQuest);
      }
    });

    // Check for community challenges
    const activeChallenges = this.getActiveCommunityChallenges(currentDate);
    activeChallenges.forEach(challenge => {
      const challengeQuest = this.createCommunityChallengeQuest(challenge, userProfile, currentDate);
      if (challengeQuest) {
        specialQuests.push(challengeQuest);
      }
    });

    // Generate milestone quests
    const milestoneQuests = this.generateMilestoneQuests(userProfile, currentDate);
    specialQuests.push(...milestoneQuests);

    // Generate birthday quest if applicable
    const birthdayQuest = this.generateBirthdayQuest(userProfile, currentDate);
    if (birthdayQuest) {
      specialQuests.push(birthdayQuest);
    }

    return specialQuests;
  }

  private createSeasonalEventQuest(event: SeasonalEvent, userProfile: UserProfile, currentDate: Date): SpecialQuest | null {
    const template = event.questTemplates[Math.floor(Math.random() * event.questTemplates.length)];

    const quest: SpecialQuest = {
      id: `event_${event.id}_${template.id}_${currentDate.toISOString().split('T')[0]}`,
      title: `[Événement] ${template.title}`,
      description: `${template.description}\n\n🎁 Événement: ${event.name}`,
      category: template.category,
      difficulty: template.difficulty,
      xp: template.baseXP,
      completed: false,
      granularity: 'special',
      startDate: currentDate.toISOString(),
      endDate: new Date(event.endDate).toISOString(),
      icon: template.icon,
      tags: ['event', 'seasonal', event.id],
      type: 'event',
      eventStartDate: event.startDate,
      eventEndDate: event.endDate
    };

    return quest;
  }

  private createCommunityChallengeQuest(challenge: CommunityChallenge, userProfile: UserProfile, currentDate: Date): SpecialQuest | null {
    if (challenge.currentParticipants >= challenge.targetParticipants) {
      return null; // Challenge full
    }

    const quest: SpecialQuest = {
      id: `challenge_${challenge.id}_${currentDate.toISOString().split('T')[0]}`,
      title: `[Défi] ${challenge.questTemplate.title}`,
      description: `${challenge.description}\n\nParticipants: ${challenge.currentParticipants}/${challenge.targetParticipants}`,
      category: challenge.questTemplate.category,
      difficulty: challenge.questTemplate.difficulty,
      xp: challenge.questTemplate.baseXP,
      completed: false,
      granularity: 'special',
      startDate: currentDate.toISOString(),
      endDate: new Date(challenge.endDate).toISOString(),
      icon: challenge.questTemplate.icon,
      tags: ['challenge', 'community', challenge.id],
      type: challenge.type === 'collaborative' ? 'collaborative' : 'challenge',
      eventStartDate: challenge.startDate,
      eventEndDate: challenge.endDate,
      participants: [],
      leaderboard: []
    };

    return quest;
  }

  private generateMilestoneQuests(userProfile: UserProfile, currentDate: Date): SpecialQuest[] {
    const milestoneQuests: SpecialQuest[] = [];

    // Level milestone quests
    const nextMilestone = Math.ceil(userProfile.currentLevel / 5) * 5;
    if (userProfile.currentLevel === nextMilestone - 1) {
      milestoneQuests.push({
        id: `milestone_level_${nextMilestone}`,
        title: `[Milestone] Atteindre le niveau ${nextMilestone}`,
        description: `Vous êtes sur le point d'atteindre un palier important! Continuez comme ça!`,
        category: 'personal',
        difficulty: 3,
        xp: 150,
        completed: false,
        granularity: 'special',
        startDate: currentDate.toISOString(),
        endDate: new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        icon: '🏆',
        tags: ['milestone', 'level'],
        type: 'special'
      });
    }

    // Quest count milestone quests
    const nextQuestMilestone = Math.ceil(userProfile.totalQuestsCompleted / 50) * 50;
    if (userProfile.totalQuestsCompleted === nextQuestMilestone - 1) {
      milestoneQuests.push({
        id: `milestone_quests_${nextQuestMilestone}`,
        title: `[Milestone] Compléter ${nextQuestMilestone} quêtes`,
        description: `Une quête de plus pour atteindre ${nextQuestMilestone} quêtes complétées!`,
        category: 'personal',
        difficulty: 2,
        xp: 100,
        completed: false,
        granularity: 'special',
        startDate: currentDate.toISOString(),
        endDate: new Date(currentDate.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
        icon: '🎯',
        tags: ['milestone', 'quests'],
        type: 'special'
      });
    }

    return milestoneQuests;
  }

  private generateBirthdayQuest(userProfile: UserProfile, currentDate: Date): SpecialQuest | null {
    // Check if it's user's birthday (this would require storing user's birthdate)
    // For now, we'll create a celebration quest for the user's anniversary
    const joinDate = new Date(userProfile.joinDate);
    const currentYear = currentDate.getFullYear();
    const joinMonth = joinDate.getMonth();
    const joinDay = joinDate.getDate();

    if (currentDate.getMonth() === joinMonth && currentDate.getDate() === joinDay) {
      const yearsSinceJoin = currentYear - joinDate.getFullYear();

      return {
        id: `anniversary_${yearsSinceJoin}`,
        title: `[Anniversaire] ${yearsSinceJoin} an(s) avec nous!`,
        description: `Célébrez votre ${yearsSinceJoin}${yearsSinceJoin === 1 ? 'er' : 'ème'} anniversaire avec nous!`,
        category: 'social',
        difficulty: 1,
        xp: 365, // 1 XP per day
        completed: false,
        granularity: 'special',
        startDate: currentDate.toISOString(),
        endDate: new Date(currentDate.getTime() + 24 * 60 * 60 * 1000).toISOString(), // 1 day
        icon: '🎂',
        tags: ['anniversary', 'celebration'],
        type: 'special',
        bonusXP: 500
      };
    }

    return null;
  }

  // Event management methods
  public getActiveSeasonalEvents(currentDate: Date = new Date()): SeasonalEvent[] {
    return Array.from(this.seasonalEvents.values()).filter(event => {
      const start = new Date(event.startDate);
      const end = new Date(event.endDate);
      return currentDate >= start && currentDate <= end;
    });
  }

  public getActiveCommunityChallenges(currentDate: Date = new Date()): CommunityChallenge[] {
    return Array.from(this.communityChallenges.values()).filter(challenge => {
      const start = new Date(challenge.startDate);
      const end = new Date(challenge.endDate);
      return currentDate >= start && currentDate <= end && challenge.currentParticipants < challenge.targetParticipants;
    });
  }

  public joinCommunityChallenge(challengeId: string, userId: string, userName: string): boolean {
    const challenge = this.communityChallenges.get(challengeId);
    if (!challenge || challenge.currentParticipants >= challenge.targetParticipants) {
      return false;
    }

    challenge.currentParticipants++;
    if (!challenge.participants) {
      challenge.participants = [];
    }
    challenge.participants.push(userId);

    return true;
  }

  public updateChallengeProgress(challengeId: string, userId: string, progress: number): void {
    const challenge = this.communityChallenges.get(challengeId);
    if (!challenge) return;

    challenge.currentProgress += progress;

    // Update leaderboard
    if (!challenge.leaderboard) {
      challenge.leaderboard = [];
    }

    const existingEntry = challenge.leaderboard.find(entry => entry.playerId === userId);
    if (existingEntry) {
      existingEntry.score += progress;
      existingEntry.completedAt = new Date().toISOString();
    } else {
      challenge.leaderboard.push({
        playerId: userId,
        playerName: `Player_${userId.slice(0, 8)}`,
        score: progress,
        completedAt: new Date().toISOString()
      });
    }

    // Sort leaderboard
    challenge.leaderboard.sort((a, b) => b.score - a.score);
  }

  // Special rewards and achievements
  public checkAndAwardSpecialAchievements(userProfile: UserProfile, completedQuest: Quest): {
    achievements: string[];
    titles: string[];
    badges: string[];
    bonusXP: number;
  } {
    const achievements: string[] = [];
    const titles: string[] = [];
    const badges: string[] = [];
    let bonusXP = 0;

    // Check for special quest completion achievements
    if (completedQuest.tags?.includes('event')) {
      achievements.push('event_participant');
      bonusXP += 50;
    }

    if (completedQuest.tags?.includes('challenge')) {
      achievements.push('challenge_acceptor');
      bonusXP += 75;
    }

    if (completedQuest.tags?.includes('milestone')) {
      achievements.push('milestone_achiever');
      bonusXP += 100;
    }

    // Check for event-specific achievements
    const activeEvents = this.getActiveSeasonalEvents();
    activeEvents.forEach(event => {
      const eventQuests = userProfile.questStats.totalDailyCompleted +
                         userProfile.questStats.totalWeeklyCompleted +
                         userProfile.questStats.totalMonthlyCompleted;

      if (eventQuests >= 5) {
        achievements.push(`${event.id}_master`);
        titles.push(event.rewards.title);
        badges.push(event.rewards.badge);
        bonusXP += event.rewards.bonusXP;
      }
    });

    return {
      achievements,
      titles,
      badges,
      bonusXP
    };
  }

  // Public API methods
  public getUpcomingEvents(currentDate: Date = new Date(), daysAhead: number = 30): {
    seasonalEvents: SeasonalEvent[];
    communityChallenges: CommunityChallenge[];
  } {
    const futureDate = new Date(currentDate.getTime() + daysAhead * 24 * 60 * 60 * 1000);

    const upcomingSeasonal = Array.from(this.seasonalEvents.values()).filter(event => {
      const start = new Date(event.startDate);
      return start > currentDate && start <= futureDate;
    });

    const upcomingChallenges = Array.from(this.communityChallenges.values()).filter(challenge => {
      const start = new Date(challenge.startDate);
      return start > currentDate && start <= futureDate;
    });

    return {
      seasonalEvents: upcomingSeasonal,
      communityChallenges: upcomingChallenges
    };
  }

  public getEventLeaderboard(challengeId: string): QuestLeaderboardEntry[] {
    const challenge = this.communityChallenges.get(challengeId);
    return challenge?.leaderboard || [];
  }

  public getCommunityProgress(challengeId: string): {
    currentProgress: number;
    targetProgress: number;
    percentageComplete: number;
    participants: number;
    maxParticipants: number;
  } | null {
    const challenge = this.communityChallenges.get(challengeId);
    if (!challenge) return null;

    return {
      currentProgress: challenge.currentProgress,
      targetProgress: parseInt(challenge.collectiveGoal?.match(/\d+/)?.[0] || '0'),
      percentageComplete: challenge.currentProgress / 1000000 * 100, // Assuming 1M minutes as target
      participants: challenge.currentParticipants,
      maxParticipants: challenge.targetParticipants
    };
  }
}

// Supporting interfaces
interface SpecialEvent {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  icon: string;
  color: string;
  questTemplates: QuestTemplate[];
  rewards: {
    title: string;
    badge: string;
    bonusXP: number;
  };
}

interface SeasonalEvent extends SpecialEvent {
  season: 'spring' | 'summer' | 'autumn' | 'winter';
}

interface CommunityChallenge {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  type: 'collaborative' | 'competitive' | 'challenge';
  targetParticipants: number;
  currentParticipants: number;
  participants?: string[];
  collectiveGoal: string;
  currentProgress: number;
  questTemplate: QuestTemplate;
  leaderboard?: QuestLeaderboardEntry[];
  rewards: {
    individualXP: number;
    communityBadge: string;
    titleReward: string;
  };
}

export { SpecialEvent, SeasonalEvent, CommunityChallenge };