import { QuestTemplate, QuestVariation, QuestCategory, QuestGranularity } from '@/types/enhanced-quest';

// Quest template database with hundreds of varied quests
export const QUEST_TEMPLATES: QuestTemplate[] = [
  // HEALTH CATEGORY
  {
    id: 'health_water_daily',
    title: 'Boire {{amount}} verres d\'eau',
    description: 'Restez hydraté tout au long de la journée',
    category: 'health',
    difficulty: 1,
    baseXP: 15,
    icon: '💧',
    tags: ['hydration', 'daily', 'simple'],
    allowedGranularities: ['daily', 'weekly'],
    weight: 8,
    isDynamic: true,
    personalizedFields: ['amount'],
    variations: [
      {
        id: 'water_light',
        title: 'Boire 4 verres d\'eau',
        xpModifier: 0.8,
        conditions: ['beginner', 'low_activity']
      },
      {
        id: 'water_moderate',
        title: 'Boire 6 verres d\'eau',
        xpModifier: 1.0,
        conditions: ['intermediate']
      },
      {
        id: 'water_intensive',
        title: 'Boire 8 verres d\'eau',
        xpModifier: 1.3,
        difficultyModifier: 1,
        conditions: ['advanced', 'high_activity']
      }
    ]
  },
  {
    id: 'health_sleep_schedule',
    title: 'Se coucher avant {{time}}',
    description: 'Maintenez un horaire de sommeil régulier',
    category: 'health',
    difficulty: 2,
    baseXP: 25,
    icon: '🌙',
    tags: ['sleep', 'routine', 'discipline'],
    allowedGranularities: ['daily', 'weekly'],
    weight: 6,
    isDynamic: true,
    personalizedFields: ['time'],
    variations: [
      {
        id: 'sleep_early',
        title: 'Se coucher avant 22h',
        xpModifier: 1.2
      },
      {
        id: 'sleep_regular',
        title: 'Se coucher avant 23h',
        xpModifier: 1.0
      }
    ]
  },
  {
    id: 'health_meal_prep',
    title: 'Préparer {{meals}} repas sains',
    description: 'Planifiez et préparez vos repas à l\'avance',
    category: 'health',
    difficulty: 3,
    baseXP: 40,
    icon: '🥗',
    tags: ['nutrition', 'planning', 'cooking'],
    allowedGranularities: ['weekly', 'monthly'],
    weight: 5,
    isDynamic: true,
    personalizedFields: ['meals'],
    maxCompletions: 2,
    timeLimit: 48
  },

  // FITNESS CATEGORY
  {
    id: 'fitness_morning_stretch',
    title: 'Faire {{minutes}} minutes d\'étirements',
    description: 'Commencez la journée avec des étirements doux',
    category: 'fitness',
    difficulty: 1,
    baseXP: 20,
    icon: '🧘',
    tags: ['stretching', 'morning', 'flexibility'],
    allowedGranularities: ['daily'],
    weight: 9,
    isDynamic: true,
    personalizedFields: ['minutes'],
    variations: [
      {
        id: 'stretch_short',
        title: 'Faire 5 minutes d\'étirements',
        xpModifier: 0.7
      },
      {
        id: 'stretch_medium',
        title: 'Faire 10 minutes d\'étirements',
        xpModifier: 1.0
      },
      {
        id: 'stretch_long',
        title: 'Faire 15 minutes d\'étirements',
        xpModifier: 1.4
      }
    ]
  },
  {
    id: 'fitness_cardio_session',
    title: 'Faire {{minutes}} minutes de cardio',
    description: 'Une séance de cardio pour votre santé cardiovasculaire',
    category: 'fitness',
    difficulty: 2,
    baseXP: 35,
    icon: '🏃',
    tags: ['cardio', 'endurance', 'health'],
    allowedGranularities: ['daily', 'weekly'],
    weight: 7,
    isDynamic: true,
    personalizedFields: ['minutes'],
    levelRequirement: 2,
    variations: [
      {
        id: 'cardio_light',
        title: 'Faire 15 minutes de cardio',
        xpModifier: 0.8
      },
      {
        id: 'cardio_moderate',
        title: 'Faire 30 minutes de cardio',
        xpModifier: 1.2
      }
    ]
  },
  {
    id: 'fitness_strength_training',
    title: 'Compléter une séance de musculation',
    description: 'Travaillez vos groupes musculaires principaux',
    category: 'fitness',
    difficulty: 4,
    baseXP: 60,
    icon: '💪',
    tags: ['strength', 'muscles', 'intense'],
    allowedGranularities: ['weekly', 'monthly'],
    weight: 4,
    levelRequirement: 5,
    prerequisites: ['fitness_cardio_session'],
    timeLimit: 72
  },

  // WORK/PRODUCTIVITY CATEGORY
  {
    id: 'work_focus_session',
    title: '{{minutes}} minutes de travail concentré',
    description: 'Travaillez sans distractions sur une tâche importante',
    category: 'work',
    difficulty: 2,
    baseXP: 30,
    icon: '🎯',
    tags: ['focus', 'productivity', 'deep_work'],
    allowedGranularities: ['daily', 'weekly'],
    weight: 8,
    isDynamic: true,
    personalizedFields: ['minutes'],
    variations: [
      {
        id: 'focus_pomodoro',
        title: '25 minutes de travail concentré (Pomodoro)',
        xpModifier: 0.9
      },
      {
        id: 'focus_extended',
        title: '45 minutes de travail concentré',
        xpModifier: 1.3
      },
      {
        id: 'focus_deep',
        title: '90 minutes de travail concentré',
        xpModifier: 1.8,
        difficultyModifier: 1
      }
    ]
  },
  {
    id: 'work_desk_cleanup',
    title: 'Organiser votre espace de travail',
    description: 'Un espace propre pour un esprit clair',
    category: 'work',
    difficulty: 1,
    baseXP: 15,
    icon: '📚',
    tags: ['organization', 'cleanliness', 'environment'],
    allowedGranularities: ['weekly', 'monthly'],
    weight: 7,
    variations: [
      {
        id: 'desk_basic',
        title: 'Nettoyer votre bureau',
        xpModifier: 0.8
      },
      {
        id: 'desk_deep',
        title: 'Organiser et nettoyer votre espace de travail',
        xpModifier: 1.2
      }
    ]
  },
  {
    id: 'work_goal_planning',
    title: 'Définir {{number}} objectifs pour la période',
    description: 'Planifiez vos objectifs à l\'avance',
    category: 'work',
    difficulty: 3,
    baseXP: 45,
    icon: '📋',
    tags: ['planning', 'goals', 'strategy'],
    allowedGranularities: ['weekly', 'monthly'],
    weight: 6,
    isDynamic: true,
    personalizedFields: ['number'],
    variations: [
      {
        id: 'goals_weekly',
        title: 'Définir 3 objectifs pour la semaine',
        xpModifier: 0.9
      },
      {
        id: 'goals_monthly',
        title: 'Définir 5 objectifs pour le mois',
        xpModifier: 1.3,
        difficultyModifier: 1
      }
    ]
  },

  // PERSONAL DEVELOPMENT CATEGORY
  {
    id: 'personal_reading',
    title: 'Lire {{pages}} pages d\'un livre',
    description: 'Développez votre esprit par la lecture',
    category: 'personal',
    difficulty: 1,
    baseXP: 25,
    icon: '📖',
    tags: ['reading', 'learning', 'knowledge'],
    allowedGranularities: ['daily', 'weekly'],
    weight: 8,
    isDynamic: true,
    personalizedFields: ['pages'],
    variations: [
      {
        id: 'reading_light',
        title: 'Lire 10 pages d\'un livre',
        xpModifier: 0.7
      },
      {
        id: 'reading_moderate',
        title: 'Lire 20 pages d\'un livre',
        xpModifier: 1.0
      },
      {
        id: 'reading_heavy',
        title: 'Lire 40 pages d\'un livre',
        xpModifier: 1.5,
        difficultyModifier: 1
      }
    ]
  },
  {
    id: 'personal_journal',
    title: 'Écrire dans votre journal',
    description: 'Prenez un moment pour refléter sur votre journée',
    category: 'personal',
    difficulty: 1,
    baseXP: 20,
    icon: '📝',
    tags: ['reflection', 'writing', 'mindfulness'],
    allowedGranularities: ['daily'],
    weight: 9,
    maxCompletions: 1
  },
  {
    id: 'personal_skill_practice',
    title: 'Pratiquer {{skill}} pendant {{minutes}} minutes',
    description: 'Développez une compétence qui vous tient à cœur',
    category: 'personal',
    difficulty: 2,
    baseXP: 35,
    icon: '🎨',
    tags: ['skills', 'practice', 'growth'],
    allowedGranularities: ['daily', 'weekly'],
    weight: 6,
    isDynamic: true,
    personalizedFields: ['skill', 'minutes'],
    variations: [
      {
        id: 'skill_creative',
        title: 'Pratiquer une compétence créative pendant 30 minutes',
        xpModifier: 1.1
      },
      {
        id: 'skill_technical',
        title: 'Pratiquer une compétence technique pendant 45 minutes',
        xpModifier: 1.3
      }
    ]
  },

  // SOCIAL CATEGORY
  {
    id: 'social_connection',
    title: 'Contacter {{number}} ami(s) ou proche(s)',
    description: 'Maintenez vos relations sociales',
    category: 'social',
    difficulty: 1,
    baseXP: 20,
    icon: '💬',
    tags: ['friends', 'family', 'communication'],
    allowedGranularities: ['daily', 'weekly'],
    weight: 7,
    isDynamic: true,
    personalizedFields: ['number'],
    variations: [
      {
        id: 'social_single',
        title: 'Contacter 1 ami ou proche',
        xpModifier: 0.8
      },
      {
        id: 'social_multiple',
        title: 'Contacter 3 amis ou proches',
        xpModifier: 1.3
      }
    ]
  },
  {
    id: 'social_community_help',
    title: 'Aider quelqu\'un dans votre communauté',
    description: 'Faites une différence dans la vie de quelqu\'un',
    category: 'social',
    difficulty: 3,
    baseXP: 50,
    icon: '🤝',
    tags: ['helping', 'community', 'kindness'],
    allowedGranularities: ['weekly', 'monthly'],
    weight: 4,
    levelRequirement: 3
  },

  // LEARNING CATEGORY
  {
    id: 'learning_new_topic',
    title: 'Apprendre quelque chose sur {{topic}}',
    description: 'Élargissez vos connaissances',
    category: 'learning',
    difficulty: 2,
    baseXP: 30,
    icon: '🧠',
    tags: ['education', 'knowledge', 'curiosity'],
    allowedGranularities: ['daily', 'weekly'],
    weight: 8,
    isDynamic: true,
    personalizedFields: ['topic'],
    variations: [
      {
        id: 'learn_video',
        title: 'Regarder une vidéo éducative de 15 minutes',
        xpModifier: 0.9
      },
      {
        id: 'learn_article',
        title: 'Lire un article informatif',
        xpModifier: 1.0
      },
      {
        id: 'learn_course',
        title: 'Suivre une leçon en ligne',
        xpModifier: 1.4,
        difficultyModifier: 1
      }
    ]
  },
  {
    id: 'learning_language',
    title: 'Pratiquer une langue étrangère',
    description: 'Renforcez vos compétences linguistiques',
    category: 'learning',
    difficulty: 2,
    baseXP: 35,
    icon: '🌍',
    tags: ['language', 'practice', 'communication'],
    allowedGranularities: ['daily', 'weekly'],
    weight: 6,
    maxCompletions: 2
  },

  // CREATIVITY CATEGORY
  {
    id: 'creativity_project',
    title: 'Travailler sur un projet créatif',
    description: 'Exprimez votre créativité',
    category: 'creativity',
    difficulty: 2,
    baseXP: 40,
    icon: '✨',
    tags: ['creative', 'art', 'expression'],
    allowedGranularities: ['daily', 'weekly'],
    weight: 5,
    maxCompletions: 1,
    timeLimit: 120
  },
  {
    id: 'creativity_brainstorm',
    title: 'Brainstorming {{number}} idées nouvelles',
    description: 'Générez des solutions créatives',
    category: 'creativity',
    difficulty: 1,
    baseXP: 25,
    icon: '💡',
    tags: ['ideas', 'brainstorming', 'innovation'],
    allowedGranularities: ['daily', 'weekly'],
    weight: 7,
    isDynamic: true,
    personalizedFields: ['number']
  },

  // MINDFULNESS CATEGORY
  {
    id: 'mindfulness_meditation',
    title: 'Méditer pendant {{minutes}} minutes',
    description: 'Prenez un moment pour vous recentrer',
    category: 'mindfulness',
    difficulty: 1,
    baseXP: 25,
    icon: '🧘‍♀️',
    tags: ['meditation', 'mindfulness', 'peace'],
    allowedGranularities: ['daily', 'weekly'],
    weight: 9,
    isDynamic: true,
    personalizedFields: ['minutes'],
    variations: [
      {
        id: 'meditation_short',
        title: 'Méditer pendant 5 minutes',
        xpModifier: 0.7
      },
      {
        id: 'meditation_medium',
        title: 'Méditer pendant 10 minutes',
        xpModifier: 1.0
      },
      {
        id: 'meditation_long',
        title: 'Méditer pendant 20 minutes',
        xpModifier: 1.5,
        difficultyModifier: 1
      }
    ]
  },
  {
    id: 'mindfulness_gratitude',
    title: 'Noter {{number}} choses pour lesquelles vous êtes reconnaissant',
    description: 'Pratiquez la gratitude quotidienne',
    category: 'mindfulness',
    difficulty: 1,
    baseXP: 20,
    icon: '🙏',
    tags: ['gratitude', 'positivity', 'reflection'],
    allowedGranularities: ['daily'],
    weight: 8,
    isDynamic: true,
    personalizedFields: ['number'],
    maxCompletions: 1
  }
];

// Special quest templates for events and challenges
export const SPECIAL_QUEST_TEMPLATES: QuestTemplate[] = [
  {
    id: 'special_monthly_challenge',
    title: 'Défi du mois: {{challenge_name}}',
    description: 'Un défi spécial pour ce mois',
    category: 'personal',
    difficulty: 4,
    baseXP: 100,
    icon: '🏆',
    tags: ['challenge', 'monthly', 'special'],
    allowedGranularities: ['special'],
    weight: 10,
    levelRequirement: 3,
    seasonalAvailability: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
    variations: [
      {
        id: 'challenge_fitness',
        title: 'Défi Fitness: 30 jours d\'exercice',
        xpModifier: 1.2
      },
      {
        id: 'challenge_reading',
        title: 'Défi Lecture: Un livre par semaine',
        xpModifier: 1.1
      },
      {
        id: 'challenge_mindfulness',
        title: 'Défi Mindfulness: Méditation quotidienne',
        xpModifier: 1.0
      }
    ]
  },
  {
    id: 'special_collaborative',
    title: 'Projet collaboratif: {{project_name}}',
    description: 'Travaillez avec d\'autres sur un projet commun',
    category: 'social',
    difficulty: 5,
    baseXP: 150,
    icon: '👥',
    tags: ['collaborative', 'team', 'social'],
    allowedGranularities: ['special'],
    weight: 8,
    levelRequirement: 5,
    maxCompletions: 1,
    timeLimit: 168 // 1 week
  }
];

// Quest pool configuration for different player levels
export const QUEST_POOLS_BY_LEVEL = {
  beginner: {
    maxDifficulty: 2,
    preferredCategories: ['health', 'personal', 'mindfulness'],
    avoidCategories: ['fitness', 'work'],
    dailyQuestCount: 5,
    weeklyQuestCount: 3,
    monthlyQuestCount: 2
  },
  intermediate: {
    maxDifficulty: 3,
    preferredCategories: ['health', 'work', 'learning', 'personal'],
    avoidCategories: [],
    dailyQuestCount: 7,
    weeklyQuestCount: 5,
    monthlyQuestCount: 3
  },
  advanced: {
    maxDifficulty: 4,
    preferredCategories: [],
    avoidCategories: [],
    dailyQuestCount: 10,
    weeklyQuestCount: 7,
    monthlyQuestCount: 5
  },
  expert: {
    maxDifficulty: 5,
    preferredCategories: [],
    avoidCategories: [],
    dailyQuestCount: 12,
    weeklyQuestCount: 10,
    monthlyQuestCount: 7
  }
};

// Category weights for balanced quest generation
export const CATEGORY_WEIGHTS: Record<QuestCategory, number> = {
  health: 9,
  fitness: 7,
  work: 8,
  personal: 9,
  social: 6,
  learning: 8,
  creativity: 5,
  mindfulness: 8
};

// Seasonal quest availability
export const SEASONAL_QUESTS = {
  spring: ['health_outdoor_activity', 'fitness_running', 'personal_spring_cleaning'],
  summer: ['fitness_swimming', 'social_outdoor_meeting', 'health_sun_protection'],
  autumn: ['personal_fall_reflection', 'work_planning', 'learning_new_skill'],
  winter: ['health_wellness', 'creativity_indoor_project', 'mindfulness_hyggge']
};

// Helper functions for quest template management
export const getQuestsByCategory = (category: QuestCategory): QuestTemplate[] => {
  return QUEST_TEMPLATES.filter(quest => quest.category === category);
};

export const getQuestsByDifficulty = (difficulty: number): QuestTemplate[] => {
  return QUEST_TEMPLATES.filter(quest => quest.difficulty === difficulty);
};

export const getQuestsByGranularity = (granularity: QuestGranularity): QuestTemplate[] => {
  return QUEST_TEMPLATES.filter(quest => quest.allowedGranularities.includes(granularity));
};

export const getQuestsByLevel = (playerLevel: number): QuestTemplate[] => {
  const level = playerLevel <= 3 ? 'beginner' :
                playerLevel <= 7 ? 'intermediate' :
                playerLevel <= 12 ? 'advanced' : 'expert';

  const config = QUEST_POOLS_BY_LEVEL[level];

  return QUEST_TEMPLATES.filter(quest =>
    quest.difficulty <= config.maxDifficulty &&
    !config.avoidCategories.includes(quest.category)
  );
};

export const getSeasonalQuests = (month: number): QuestTemplate[] => {
  const season = month >= 3 && month <= 5 ? 'spring' :
                 month >= 6 && month <= 8 ? 'summer' :
                 month >= 9 && month <= 11 ? 'autumn' : 'winter';

  const seasonalQuestIds = SEASONAL_QUESTS[season as keyof typeof SEASONAL_QUESTS];

  return QUEST_TEMPLATES.filter(quest =>
    seasonalQuestIds.includes(quest.id)
  );
};