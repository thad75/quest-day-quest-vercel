import { Quest, QuestTemplate, QuestCategory, QuestGranularity, QuestDifficulty, QuestGenerationConfig, DailyQuestState } from '@/types/enhanced-quest';
import { QUEST_TEMPLATES, getQuestsByLevel, getSeasonalQuests, CATEGORY_WEIGHTS } from '@/data/quest-templates';

export class QuestGenerator {
  private static instance: QuestGenerator;
  private seed: string = '';

  private constructor() {}

  static getInstance(): QuestGenerator {
    if (!QuestGenerator.instance) {
      QuestGenerator.instance = new QuestGenerator();
    }
    return QuestGenerator.instance;
  }

  // Simple seeded random number generator for reproducible quest generation
  private seededRandom(): number {
    const x = Math.sin(this.seed.hashCode()) * 10000;
    return x - Math.floor(x);
  }

  private setSeed(date: string): void {
    this.seed = date;
  }

  // Generate daily quests for a specific date
  generateDailyQuests(
    date: string,
    playerLevel: number,
    config: QuestGenerationConfig,
    recentlyCompleted: string[] = []
  ): DailyQuestState {
    this.setSeed(date);

    const availableQuests = getQuestsByLevel(playerLevel);
    const seasonalQuests = getSeasonalQuests(new Date(date).getMonth() + 1);

    // Filter out recently completed quests
    const filteredQuests = availableQuests.filter(quest =>
      !recentlyCompleted.includes(quest.id)
    );

    const dailyQuests = this.generateQuestsForGranularity(
      'daily',
      filteredQuests,
      config.dailyQuestsCount,
      config
    );

    const weeklyQuests = this.generateQuestsForGranularity(
      'weekly',
      filteredQuests,
      config.weeklyQuestsCount,
      config
    );

    const monthlyQuests = this.generateQuestsForGranularity(
      'monthly',
      [...filteredQuests, ...seasonalQuests],
      config.monthlyQuestsCount,
      config
    );

    return {
      date,
      dailyQuests,
      weeklyQuests,
      monthlyQuests,
      specialQuests: [], // TODO: Implement special quests
      generatedAt: new Date().toISOString(),
      seed: this.seed
    };
  }

  private generateQuestsForGranularity(
    granularity: QuestGranularity,
    availableQuests: QuestTemplate[],
    count: number,
    config: QuestGenerationConfig
  ): Quest[] {
    const granularityQuests = availableQuests.filter(quest =>
      quest.allowedGranularities.includes(granularity)
    );

    if (granularityQuests.length === 0) {
      return [];
    }

    const selectedQuests: Quest[] = [];
    const usedCategories = new Set<QuestCategory>();

    // Ensure category variety if requested
    if (config.ensureVariety) {
      const categories = Object.keys(config.categoryBalance) as QuestCategory[];
      const shuffledCategories = this.shuffleArray([...categories]);

      for (const category of shuffledCategories) {
        if (selectedQuests.length >= count) break;

        const categoryQuests = granularityQuests.filter(quest =>
          quest.category === category &&
          !usedCategories.has(category)
        );

        if (categoryQuests.length > 0) {
          const quest = this.selectQuestWithWeight(categoryQuests);
          if (quest) {
            selectedQuests.push(this.createQuestFromTemplate(quest, granularity));
            usedCategories.add(category);
          }
        }
      }
    }

    // Fill remaining slots
    while (selectedQuests.length < count) {
      const remainingQuests = granularityQuests.filter(quest =>
        !selectedQuests.some(selected => selected.id === quest.id)
      );

      if (remainingQuests.length === 0) break;

      const quest = this.selectQuestWithWeight(remainingQuests);
      if (quest) {
        selectedQuests.push(this.createQuestFromTemplate(quest, granularity));
      }
    }

    return selectedQuests;
  }

  private selectQuestWithWeight(quests: QuestTemplate[]): QuestTemplate | null {
    if (quests.length === 0) return null;

    const totalWeight = quests.reduce((sum, quest) => sum + (quest.weight || 1), 0);
    let random = this.seededRandom() * totalWeight;

    for (const quest of quests) {
      random -= (quest.weight || 1);
      if (random <= 0) {
        return quest;
      }
    }

    return quests[0];
  }

  private createQuestFromTemplate(template: QuestTemplate, granularity: QuestGranularity): Quest {
    const date = new Date();
    const endDate = this.calculateEndDate(granularity, date);

    // Select variation if available
    const variation = template.variations && template.variations.length > 0
      ? this.selectQuestWithWeight(template.variations.map(v => ({ ...v, weight: 1 })))
      : undefined;

    const title = variation?.title || template.title;
    const description = variation?.description || template.description;

    // Personalize quest content if it's dynamic
    const personalizedTitle = template.isDynamic
      ? this.personalizeContent(title)
      : title;

    const personalizedDescription = template.isDynamic
      ? this.personalizeContent(description || '')
      : description;

    // Calculate XP and difficulty with modifiers
    const xp = this.calculateXP(template, variation?.xpModifier);
    const difficulty = this.calculateDifficulty(template, variation?.difficultyModifier);

    return {
      id: this.generateQuestId(template.id, granularity, date),
      title: personalizedTitle,
      description: personalizedDescription,
      category: template.category,
      difficulty,
      xp,
      completed: false,
      granularity,
      startDate: date.toISOString(),
      endDate,
      icon: template.icon,
      tags: template.tags,
      prerequisites: template.prerequisites,
      maxCompletions: template.maxCompletions,
      timeLimit: template.timeLimit,
      bonusXP: template.baseXP > 50 ? Math.round(template.baseXP * 0.2) : undefined,
      isLocked: false, // TODO: Check prerequisites
      progress: 0
    };
  }

  private calculateEndDate(granularity: QuestGranularity, startDate: Date): string {
    const endDate = new Date(startDate);

    switch (granularity) {
      case 'daily':
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'weekly':
        endDate.setDate(startDate.getDate() + 7);
        break;
      case 'monthly':
        endDate.setMonth(startDate.getMonth() + 1);
        break;
      case 'special':
        endDate.setDate(startDate.getDate() + 30); // Default 30 days for special quests
        break;
    }

    return endDate.toISOString();
  }

  private calculateXP(template: QuestTemplate, modifier?: number): number {
    let baseXP = template.baseXP;

    if (modifier) {
      baseXP = Math.round(baseXP * modifier);
    }

    // Ensure minimum XP
    return Math.max(10, baseXP);
  }

  private calculateDifficulty(template: QuestTemplate, modifier?: number): QuestDifficulty {
    let difficulty = template.difficulty;

    if (modifier) {
      difficulty = Math.max(1, Math.min(5, difficulty + modifier)) as QuestDifficulty;
    }

    return difficulty;
  }

  private personalizeContent(content: string): string {
    // Simple personalization - in a real app, this would use user preferences
    const replacements: Record<string, string> = {
      '{{amount}}': Math.floor(Math.random() * 6) + 4 + '', // 4-9
      '{{minutes}}': [5, 10, 15, 20, 30, 45, 60][Math.floor(Math.random() * 7)] + '',
      '{{pages}}': [10, 15, 20, 25, 30, 40][Math.floor(Math.random() * 6)] + '',
      '{{time}}': ['22h', '22h30', '23h'][Math.floor(Math.random() * 3)],
      '{{number}}': [1, 2, 3, 5, 10][Math.floor(Math.random() * 5)] + '',
      '{{skill}}': ['la guitare', 'le dessin', 'un langage', 'la cuisine', 'la photo'][Math.floor(Math.random() * 5)],
      '{{topic}}': ['l\'histoire', 'la science', 'l\'art', 'la technologie', 'la nature'][Math.floor(Math.random() * 5)],
      '{{meals}}': [3, 5, 7][Math.floor(Math.random() * 3)] + '',
      '{{hours}}': [1, 2, 4, 8][Math.floor(Math.random() * 4)] + '',
      '{{steps}}': [5000, 8000, 10000, 12000][Math.floor(Math.random() * 4)] + ''
    };

    let personalized = content;
    Object.entries(replacements).forEach(([placeholder, value]) => {
      personalized = personalized.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
    });

    return personalized;
  }

  private generateQuestId(templateId: string, granularity: QuestGranularity, date: Date): string {
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    return `${templateId}_${granularity}_${dateStr}`;
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(this.seededRandom() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Check if quests need to be regenerated for a specific granularity
  needsRegeneration(currentState: DailyQuestState, date: string, granularity: QuestGranularity): boolean {
    if (!currentState) return true;

    const now = new Date(date);
    const generatedDate = new Date(currentState.generatedAt);

    switch (granularity) {
      case 'daily':
        return now.toDateString() !== generatedDate.toDateString();
      case 'weekly':
        const weekDiff = Math.floor((now.getTime() - generatedDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
        return weekDiff >= 1;
      case 'monthly':
        return now.getMonth() !== generatedDate.getMonth() || now.getFullYear() !== generatedDate.getFullYear();
      default:
        return false;
    }
  }

  // Update existing daily state with new quests for specific granularity
  updateQuestsForGranularity(
    currentState: DailyQuestState,
    date: string,
    granularity: QuestGranularity,
    playerLevel: number,
    config: QuestGenerationConfig,
    recentlyCompleted: string[] = []
  ): DailyQuestState {
    if (!this.needsRegeneration(currentState, date, granularity)) {
      return currentState;
    }

    this.setSeed(date);
    const availableQuests = getQuestsByLevel(playerLevel);
    const filteredQuests = availableQuests.filter(quest =>
      !recentlyCompleted.includes(quest.id)
    );

    const newQuests = this.generateQuestsForGranularity(
      granularity,
      filteredQuests,
      granularity === 'daily' ? config.dailyQuestsCount :
      granularity === 'weekly' ? config.weeklyQuestsCount :
      config.monthlyQuestsCount,
      config
    );

    return {
      ...currentState,
      [`${granularity}Quests`]: newQuests,
      generatedAt: new Date().toISOString(),
      seed: this.seed
    };
  }
}

// Extension to add hashCode method to String prototype
declare global {
  interface String {
    hashCode(): number;
  }
}

String.prototype.hashCode = function(): number {
  let hash = 0;
  if (this.length === 0) return hash;
  for (let i = 0; i < this.length; i++) {
    const char = this.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash;
};

export default QuestGenerator.getInstance();