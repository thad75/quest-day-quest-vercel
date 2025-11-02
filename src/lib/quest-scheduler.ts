import {
  Quest,
  QuestTemplate,
  QuestGranularity,
  QuestSchedule,
  QuestSystemState,
  QuestGenerationConfig,
  QuestGenerationResult,
  QuestCategory,
  PlayerQuestState
} from '@/types/enhanced-quest';
import {
  QUEST_TEMPLATES,
  SPECIAL_QUEST_TEMPLATES,
  getQuestsByLevel,
  getQuestsByCategory,
  getSeasonalQuests,
  CATEGORY_WEIGHTS,
  QUEST_POOLS_BY_LEVEL
} from '@/data/quest-templates';

export class QuestScheduler {
  private static instance: QuestScheduler;
  private state: QuestSystemState;
  private config: QuestGenerationConfig;

  private constructor() {
    this.state = this.initializeState();
    this.config = this.getDefaultConfig();
  }

  public static getInstance(): QuestScheduler {
    if (!QuestScheduler.instance) {
      QuestScheduler.instance = new QuestScheduler();
    }
    return QuestScheduler.instance;
  }

  private initializeState(): QuestSystemState {
    return {
      activeQuests: [],
      questHistory: [],
      playerQuestStates: [],
      lastResetDates: {
        daily: this.getTodayString(),
        weekly: this.getWeekStartString(),
        monthly: this.getMonthStartString()
      },
      currentStreak: {
        daily: 0,
        weekly: 0,
        monthly: 0
      },
      unlockedCategories: ['health', 'personal', 'mindfulness'],
      questPreferences: {
        preferredCategories: [],
        avoidedCategories: [],
        difficultyPreference: 'balanced'
      }
    };
  }

  private getDefaultConfig(): QuestGenerationConfig {
    return {
      dailyQuestsCount: 8,
      weeklyQuestsCount: 6,
      monthlyQuestsCount: 4,
      maxDifficultyPerLevel: 1,
      categoryBalance: CATEGORY_WEIGHTS,
      ensureVariety: true,
      considerPlayerHistory: true,
      adaptToPlayerLevel: true
    };
  }

  // Main scheduling methods
  public async checkAndResetQuests(playerLevel: number): Promise<{
    dailyReset: boolean;
    weeklyReset: boolean;
    monthlyReset: boolean;
    newQuests: Quest[];
  }> {
    const today = this.getTodayString();
    const weekStart = this.getWeekStartString();
    const monthStart = this.getMonthStartString();

    const dailyReset = this.state.lastResetDates.daily !== today;
    const weeklyReset = this.state.lastResetDates.weekly !== weekStart;
    const monthlyReset = this.state.lastResetDates.monthly !== monthStart;

    const newQuests: Quest[] = [];

    if (dailyReset) {
      const dailyQuests = await this.generateDailyQuests(playerLevel);
      newQuests.push(...dailyQuests);
      this.state.lastResetDates.daily = today;
    }

    if (weeklyReset) {
      const weeklyQuests = await this.generateWeeklyQuests(playerLevel);
      newQuests.push(...weeklyQuests);
      this.state.lastResetDates.weekly = weekStart;
    }

    if (monthlyReset) {
      const monthlyQuests = await this.generateMonthlyQuests(playerLevel);
      newQuests.push(...monthlyQuests);
      this.state.lastResetDates.monthly = monthStart;
    }

    // Update active quests (remove expired, add new)
    this.updateActiveQuests(newQuests, { dailyReset, weeklyReset, monthlyReset });

    return {
      dailyReset,
      weeklyReset,
      monthlyReset,
      newQuests
    };
  }

  // Quest generation methods
  public async generateDailyQuests(playerLevel: number): Promise<Quest[]> {
    return this.generateQuests('daily', this.config.dailyQuestsCount, playerLevel);
  }

  public async generateWeeklyQuests(playerLevel: number): Promise<Quest[]> {
    return this.generateQuests('weekly', this.config.weeklyQuestsCount, playerLevel);
  }

  public async generateMonthlyQuests(playerLevel: number): Promise<Quest[]> {
    return this.generateQuests('monthly', this.config.monthlyQuestsCount, playerLevel);
  }

  private async generateQuests(
    granularity: QuestGranularity,
    count: number,
    playerLevel: number
  ): Promise<Quest[]> {
    const availableTemplates = this.getAvailableTemplates(granularity, playerLevel);
    const selectedTemplates = this.selectQuestTemplates(availableTemplates, count, granularity);

    const quests: Quest[] = [];
    const today = new Date();

    for (const template of selectedTemplates) {
      const quest = await this.createQuestFromTemplate(template, granularity, today);
      quests.push(quest);
    }

    return quests;
  }

  private getAvailableTemplates(granularity: QuestGranularity, playerLevel: number): QuestTemplate[] {
    let templates = QUEST_TEMPLATES.filter(template =>
      template.allowedGranularities.includes(granularity)
    );

    // Apply level constraints
    if (this.config.adaptToPlayerLevel) {
      const maxDifficulty = this.getMaxDifficultyForLevel(playerLevel);
      templates = templates.filter(template => template.difficulty <= maxDifficulty);

      // Level-based template filtering
      const levelTemplates = getQuestsByLevel(playerLevel);
      templates = templates.filter(template =>
        levelTemplates.some(levelTemplate => levelTemplate.id === template.id)
      );
    }

    // Apply seasonal availability
    const currentMonth = new Date().getMonth() + 1;
    const seasonalQuests = getSeasonalQuests(currentMonth);
    templates = templates.filter(template => {
      if (!template.seasonalAvailability) return true;
      return template.seasonalAvailability.includes(currentMonth.toString());
    });

    // Apply player preferences
    templates = this.applyPlayerPreferences(templates);

    // Remove recently completed quests if enabled
    if (this.config.considerPlayerHistory) {
      templates = this.filterRecentlyCompleted(templates, granularity);
    }

    return templates;
  }

  private selectQuestTemplates(
    templates: QuestTemplate[],
    count: number,
    granularity: QuestGranularity
  ): QuestTemplate[] {
    const selected: QuestTemplate[] = [];
    const usedCategories = new Set<QuestCategory>();

    // Ensure category variety if enabled
    if (this.config.ensureVariety && templates.length >= count) {
      // Sort templates by weight
      const weightedTemplates = templates.map(template => ({
        template,
        weight: this.calculateTemplateWeight(template, usedCategories)
      }));

      // Select templates ensuring variety
      for (let i = 0; i < count && weightedTemplates.length > 0; i++) {
        // Calculate cumulative weights
        const totalWeight = weightedTemplates.reduce((sum, item) => sum + item.weight, 0);

        // Random selection based on weights
        let random = Math.random() * totalWeight;
        let selectedIndex = 0;

        for (let j = 0; j < weightedTemplates.length; j++) {
          random -= weightedTemplates[j].weight;
          if (random <= 0) {
            selectedIndex = j;
            break;
          }
        }

        const selectedTemplate = weightedTemplates[selectedIndex];
        selected.push(selectedTemplate.template);
        usedCategories.add(selectedTemplate.template.category);

        // Remove selected template from pool
        weightedTemplates.splice(selectedIndex, 1);
      }
    } else {
      // Simple random selection
      const shuffled = [...templates].sort(() => Math.random() - 0.5);
      selected.push(...shuffled.slice(0, count));
    }

    return selected;
  }

  private calculateTemplateWeight(template: QuestTemplate, usedCategories: Set<QuestCategory>): number {
    let weight = template.weight;

    // Boost weight for unused categories
    if (!usedCategories.has(template.category)) {
      weight *= 2;
    }

    // Apply category balance weights
    const categoryWeight = this.config.categoryBalance[template.category] || 1;
    weight *= categoryWeight;

    // Apply player preferences
    if (this.state.questPreferences.preferredCategories.includes(template.category)) {
      weight *= 1.5;
    }
    if (this.state.questPreferences.avoidedCategories.includes(template.category)) {
      weight *= 0.3;
    }

    return weight;
  }

  private async createQuestFromTemplate(
    template: QuestTemplate,
    granularity: QuestGranularity,
    startDate: Date
  ): Promise<Quest> {
    const variation = this.selectVariation(template);
    const personalizedContent = this.personalizeQuest(template, variation);

    const quest: Quest = {
      id: this.generateQuestId(template, granularity, startDate),
      title: personalizedContent.title,
      description: personalizedContent.description,
      category: template.category,
      difficulty: template.difficulty + (variation?.difficultyModifier || 0),
      xp: Math.round(template.baseXP * (variation?.xpModifier || 1)),
      completed: false,
      granularity,
      startDate: startDate.toISOString(),
      endDate: this.calculateEndDate(granularity, startDate),
      icon: template.icon,
      tags: template.tags,
      prerequisites: template.prerequisites,
      isHidden: template.prerequisites && template.prerequisites.length > 0,
      maxCompletions: template.maxCompletions,
      currentCompletions: 0,
      timeLimit: template.timeLimit
    };

    return quest;
  }

  private selectVariation(template: QuestTemplate): QuestVariation | undefined {
    if (!template.variations || template.variations.length === 0) {
      return undefined;
    }

    // Simple variation selection - could be enhanced based on player profile
    const weights = template.variations.map(v => 1);
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < template.variations.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return template.variations[i];
      }
    }

    return template.variations[0];
  }

  private personalizeQuest(template: QuestTemplate, variation?: QuestVariation): {
    title: string;
    description?: string;
  } {
    let title = variation?.title || template.title;
    let description = variation?.description || template.description;

    // Personalize dynamic fields
    if (template.isDynamic && template.personalizedFields) {
      const personalizations: Record<string, string> = {};

      if (template.personalizedFields.includes('amount')) {
        personalizations.amount = this.getRandomAmount();
      }
      if (template.personalizedFields.includes('minutes')) {
        personalizations.minutes = this.getRandomMinutes(template.difficulty);
      }
      if (template.personalizedFields.includes('pages')) {
        personalizations.pages = this.getRandomPages(template.difficulty);
      }
      if (template.personalizedFields.includes('number')) {
        personalizations.number = this.getRandomNumber(template.difficulty);
      }
      if (template.personalizedFields.includes('time')) {
        personalizations.time = this.getRandomTime();
      }
      if (template.personalizedFields.includes('skill')) {
        personalizations.skill = this.getRandomSkill();
      }
      if (template.personalizedFields.includes('topic')) {
        personalizations.topic = this.getRandomTopic();
      }
      if (template.personalizedFields.includes('meals')) {
        personalizations.meals = this.getRandomMeals();
      }

      // Replace placeholders
      Object.entries(personalizations).forEach(([key, value]) => {
        title = title.replace(new RegExp(`{{${key}}}`, 'g'), value);
        if (description) {
          description = description.replace(new RegExp(`{{${key}}}`, 'g'), value);
        }
      });
    }

    return { title, description };
  }

  private updateActiveQuests(newQuests: Quest[], resets: {
    dailyReset: boolean;
    weeklyReset: boolean;
    monthlyReset: boolean;
  }): void {
    // Remove expired quests
    this.state.activeQuests = this.state.activeQuests.filter(quest => {
      const now = new Date();
      const endDate = new Date(quest.endDate || quest.startDate);

      if (quest.granularity === 'daily' && resets.dailyReset) {
        return false;
      }
      if (quest.granularity === 'weekly' && resets.weeklyReset) {
        return false;
      }
      if (quest.granularity === 'monthly' && resets.monthlyReset) {
        return false;
      }

      return endDate > now;
    });

    // Add new quests
    this.state.activeQuests.push(...newQuests);

    // Update quest states
    newQuests.forEach(quest => {
      this.state.playerQuestStates.push({
        questId: quest.id,
        status: 'available',
        progress: 0,
        currentCompletions: 0,
        timeSpent: 0
      });
    });
  }

  // Helper methods
  private getTodayString(): string {
    return new Date().toISOString().split('T')[0];
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

  private calculateEndDate(granularity: QuestGranularity, startDate: Date): string {
    const endDate = new Date(startDate);

    switch (granularity) {
      case 'daily':
        endDate.setDate(endDate.getDate() + 1);
        break;
      case 'weekly':
        endDate.setDate(endDate.getDate() + 7);
        break;
      case 'monthly':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case 'special':
        endDate.setDate(endDate.getDate() + 30); // Default 30 days for special quests
        break;
    }

    return endDate.toISOString();
  }

  private generateQuestId(template: QuestTemplate, granularity: QuestGranularity, date: Date): string {
    const dateStr = date.toISOString().split('T')[0];
    const random = Math.random().toString(36).substr(2, 9);
    return `${granularity}_${template.id}_${dateStr}_${random}`;
  }

  private getMaxDifficultyForLevel(playerLevel: number): number {
    return Math.min(5, Math.ceil(playerLevel / 3));
  }

  private applyPlayerPreferences(templates: QuestTemplate[]): QuestTemplate[] {
    // Filter based on avoided categories
    if (this.state.questPreferences.avoidedCategories.length > 0) {
      templates = templates.filter(template =>
        !this.state.questPreferences.avoidedCategories.includes(template.category)
      );
    }

    return templates;
  }

  private filterRecentlyCompleted(templates: QuestTemplate[], granularity: QuestGranularity): QuestTemplate[] {
    const recentDays = granularity === 'daily' ? 3 : granularity === 'weekly' ? 2 : 1;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - recentDays * (granularity === 'daily' ? 1 : granularity === 'weekly' ? 7 : 30));

    const recentlyCompleted = this.state.questHistory
      .filter(history => new Date(history.completedAt) > cutoffDate)
      .map(history => history.questId.split('_')[1]); // Extract template ID

    return templates.filter(template => !recentlyCompleted.includes(template.id));
  }

  // Personalization helpers
  private getRandomAmount(): string {
    const amounts = ['4', '6', '8'];
    return amounts[Math.floor(Math.random() * amounts.length)];
  }

  private getRandomMinutes(difficulty: number): string {
    const ranges = {
      1: ['5', '10', '15'],
      2: ['10', '15', '20'],
      3: ['20', '30', '45'],
      4: ['30', '45', '60'],
      5: ['45', '60', '90']
    };
    const range = ranges[difficulty as keyof typeof ranges] || ranges[2];
    return range[Math.floor(Math.random() * range.length)];
  }

  private getRandomPages(difficulty: number): string {
    const ranges = {
      1: ['5', '10', '15'],
      2: ['10', '20', '30'],
      3: ['20', '40', '60'],
      4: ['40', '60', '80'],
      5: ['60', '80', '100']
    };
    const range = ranges[difficulty as keyof typeof ranges] || ranges[2];
    return range[Math.floor(Math.random() * range.length)];
  }

  private getRandomNumber(difficulty: number): string {
    const ranges = {
      1: ['1', '2', '3'],
      2: ['3', '5', '7'],
      3: ['5', '7', '10'],
      4: ['7', '10', '15'],
      5: ['10', '15', '20']
    };
    const range = ranges[difficulty as keyof typeof ranges] || ranges[2];
    return range[Math.floor(Math.random() * range.length)];
  }

  private getRandomTime(): string {
    const times = ['21h', '22h', '22h30', '23h'];
    return times[Math.floor(Math.random() * times.length)];
  }

  private getRandomSkill(): string {
    const skills = ['la guitare', 'le dessin', 'une nouvelle langue', 'la programmation', 'la photographie'];
    return skills[Math.floor(Math.random() * skills.length)];
  }

  private getRandomTopic(): string {
    const topics = ['l\'histoire', 'la science', \'l\'art\', 'la technologie', 'la philosophie'];
    return topics[Math.floor(Math.random() * topics.length)];
  }

  private getRandomMeals(): string {
    const meals = ['3', '5', '7'];
    return meals[Math.floor(Math.random() * meals.length)];
  }

  // Public getters
  public getState(): QuestSystemState {
    return { ...this.state };
  }

  public getActiveQuests(): Quest[] {
    return [...this.state.activeQuests];
  }

  public updateConfig(newConfig: Partial<QuestGenerationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public updateQuestPreferences(preferences: Partial<QuestSystemState['questPreferences']>): void {
    this.state.questPreferences = { ...this.state.questPreferences, ...preferences };
  }
}