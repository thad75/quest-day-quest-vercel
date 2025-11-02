import { useState, useEffect } from 'react';
import { Quest, QuestGranularity, DailyQuestState } from '@/types/enhanced-quest';
import { UserProfile } from '@/types/quest';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Calendar,
  Target,
  Trophy,
  Star,
  Clock,
  CheckCircle,
  Circle,
  Flame,
  Award,
  Zap,
  Sparkles
} from 'lucide-react';
import QuestManager from '@/lib/quest-manager';
import { toast } from 'sonner';

interface EnhancedQuestViewProps {
  profile: UserProfile;
  onProgressUpdate: (newXP: number, newLevel?: number) => void;
}

const GRANULARITY_CONFIG = {
  daily: {
    label: 'Quêtes du jour',
    icon: Calendar,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  weekly: {
    label: 'Défis de la semaine',
    icon: Target,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  },
  monthly: {
    label: 'Objectifs du mois',
    icon: Trophy,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  special: {
    label: 'Quêtes spéciales',
    icon: Sparkles,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  }
} as const;

export const EnhancedQuestView = ({ profile, onProgressUpdate }: EnhancedQuestViewProps) => {
  const [questState, setQuestState] = useState<DailyQuestState | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<QuestGranularity>('daily');
  const questManager = QuestManager;

  useEffect(() => {
    loadQuests();
  }, [profile]);

  const loadQuests = async () => {
    try {
      setLoading(true);
      const quests = await questManager.getTodaysQuests(profile);
      setQuestState(quests);
    } catch (error) {
      console.error('Error loading quests:', error);
      toast.error('Erreur lors du chargement des quêtes');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleQuest = async (questId: string) => {
    try {
      const result = questManager.toggleQuestCompletion(questId, profile);
      setQuestState(result.updatedQuests);

      if (result.xpGained > 0) {
        const xpText = result.xpGained >= 100 ? 'Mega XP !' : 'XP !';
        toast.success(`+${result.xpGained} ${xpText}`, {
          description: 'Quête accomplie avec succès !',
        });

        if (result.leveledUp && result.newLevel) {
          toast.success(`🎉 Niveau ${result.newLevel} atteint !`, {
            description: 'Continue comme ça, champion !',
          });
        }

        onProgressUpdate(result.xpGained, result.newLevel);
      } else {
        toast.info('Quête désélectionnée');
        onProgressUpdate(result.xpGained);
      }

      // Check if all daily quests are completed for celebration
      if (result.updatedQuests.dailyQuests.every(q => q.completed)) {
        // Trigger celebration (parent component will handle this)
        setTimeout(() => {
          toast.success('🎉 Toutes les quêtes quotidiennes complétées !', {
            description: 'Bonus de 100 XP pour ta persévérance !',
          });
          onProgressUpdate(100); // Bonus XP
        }, 1000);
      }
    } catch (error) {
      console.error('Error toggling quest:', error);
      toast.error('Erreur lors de la mise à jour de la quête');
    }
  };

  const getCompletionStats = (quests: Quest[]) => {
    const completed = quests.filter(q => q.completed).length;
    const total = quests.length;
    return { completed, total, percentage: total > 0 ? (completed / total) * 100 : 0 };
  };

  const getDifficultyColor = (difficulty: number) => {
    switch (difficulty) {
      case 1: return 'text-green-600 bg-green-100';
      case 2: return 'text-blue-600 bg-blue-100';
      case 3: return 'text-purple-600 bg-purple-100';
      case 4: return 'text-orange-600 bg-orange-100';
      case 5: return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDifficultyLabel = (difficulty: number) => {
    switch (difficulty) {
      case 1: return 'Débutant';
      case 2: return 'Facile';
      case 3: return 'Moyen';
      case 4: return 'Difficile';
      case 5: return 'Expert';
      default: return 'Inconnu';
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      health: '💊',
      fitness: '💪',
      work: '💼',
      personal: '🌱',
      social: '👥',
      learning: '📚',
      creativity: '🎨',
      mindfulness: '🧘'
    };
    return icons[category] || '📋';
  };

  const renderQuestCard = (quest: Quest) => {
    const IconComponent = quest.completed ? CheckCircle : Circle;

    return (
      <Card
        key={quest.id}
        className={`group relative overflow-hidden transition-all duration-500 hover:scale-[1.03] hover:shadow-[var(--shadow-glow)] ${
          quest.completed
            ? 'bg-gradient-to-br from-success/10 to-success/5 border-success/50 backdrop-blur-sm'
            : 'bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-md border-border/50 hover:border-primary/30'
        } shadow-[0_8px_32px_hsl(0_0%_0%_/_0.3)] rounded-2xl`}
      >
        {/* Background decoration */}
        <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
          quest.completed
            ? 'bg-gradient-to-br from-success/20 to-transparent'
            : 'bg-gradient-to-br from-primary/10 to-transparent'
        }`} />

        {/* XP Glow effect */}
        <div className="absolute top-2 right-2">
          <div className={`relative ${quest.completed ? 'opacity-50' : ''}`}>
            <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-lg animate-pulse" />
            <div className="relative px-2 py-1 rounded-full bg-yellow-500/20 backdrop-blur-sm border border-yellow-500/30">
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-bold text-yellow-600">
                  {quest.xp}
                </span>
              </div>
            </div>
          </div>
        </div>

        <CardContent className="p-6 relative">
          <div className="flex items-start gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleToggleQuest(quest.id)}
              className={`h-10 w-10 rounded-xl transition-all duration-300 flex-shrink-0 group-hover:scale-110 ${
                quest.completed
                  ? 'bg-success/20 text-success border-2 border-success/50 hover:bg-success/30 hover:scale-110'
                  : 'border-2 border-primary/40 hover:border-primary hover:bg-primary/20 hover:scale-110'
              } shadow-lg`}
            >
              <IconComponent className="h-5 w-5" />
            </Button>

            <div className="flex-1 min-w-0 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <h3 className={`font-semibold text-base leading-tight transition-all duration-300 ${
                  quest.completed
                    ? 'line-through opacity-60 text-muted-foreground'
                    : 'text-foreground group-hover:text-primary'
                }`}>
                  {quest.title}
                </h3>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge className={`text-xs px-3 py-1 rounded-full font-medium ${getDifficultyColor(quest.difficulty)} shadow-sm`}>
                    {getDifficultyLabel(quest.difficulty)}
                  </Badge>
                  {quest.bonusXP && (
                    <Badge className="text-xs px-2 py-1 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold shadow-lg animate-pulse">
                      +{quest.bonusXP} 🔥
                    </Badge>
                  )}
                </div>
              </div>

              {quest.description && (
                <p className={`text-sm leading-relaxed transition-all duration-300 ${
                  quest.completed
                    ? 'line-through opacity-50 text-muted-foreground'
                    : 'text-muted-foreground/80 group-hover:text-muted-foreground'
                }`}>
                  {quest.description}
                </p>
              )}

              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`text-2xl transition-transform duration-300 group-hover:scale-125 ${
                    quest.completed ? 'grayscale opacity-50' : ''
                  }`}>
                    {getCategoryIcon(quest.category)}
                  </div>
                  <Badge
                    variant="outline"
                    className="text-xs px-3 py-1 rounded-full capitalize border-current/30 font-medium"
                  >
                    {quest.category}
                  </Badge>
                </div>

                {quest.timeLimit && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
                    <Clock className="h-3 w-3" />
                    <span>{quest.timeLimit}h max</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Progress indicator for partial completion */}
          {quest.progress !== undefined && quest.progress > 0 && quest.progress < 100 && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Progression</span>
                <span className="font-medium text-primary">{quest.progress}%</span>
              </div>
              <Progress
                value={quest.progress}
                className="h-2 bg-muted/50"
              />
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderQuestSection = (granularity: QuestGranularity) => {
    const config = GRANULARITY_CONFIG[granularity];
    const quests = questState?.[`${granularity}Quests` as keyof DailyQuestState] as Quest[] || [];
    const stats = getCompletionStats(quests);

    if (quests.length === 0) {
      return (
        <div className="text-center py-8">
          <div className={`inline-flex items-center justify-center h-16 w-16 rounded-full ${config.bgColor} mb-4`}>
            <config.icon className={`h-8 w-8 ${config.color}`} />
          </div>
          <h3 className="text-lg font-semibold mb-2">{config.label}</h3>
          <p className="text-muted-foreground">Aucune quête disponible pour le moment</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-3">
            <div className={`flex items-center justify-center h-10 w-10 rounded-full ${config.bgColor}`}>
              <config.icon className={`h-5 w-5 ${config.color}`} />
            </div>
            <div>
              <h3 className="font-semibold">{config.label}</h3>
              <p className="text-sm text-muted-foreground">
                {stats.completed} / {stats.total} complétées
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm font-medium">
              {Math.round(stats.percentage)}%
            </div>
            <Progress
              value={stats.percentage}
              className="w-20 h-2"
            />
          </div>
        </div>

        {/* Quests Grid */}
        <div className="grid gap-3">
          {quests.map(renderQuestCard)}
        </div>

        {stats.completed === stats.total && stats.total > 0 && (
          <div className="flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <Trophy className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              Toutes les {config.label.toLowerCase()} sont complétées ! 🎉
            </span>
            <Zap className="h-4 w-4 text-yellow-500" />
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des quêtes...</p>
        </div>
      </div>
    );
  }

  if (!questState) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Impossible de charger les quêtes</p>
        <Button onClick={loadQuests} className="mt-4">
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(GRANULARITY_CONFIG).map(([key, config]) => {
          const quests = questState?.[`${key}Quests` as keyof DailyQuestState] as Quest[] || [];
          const stats = getCompletionStats(quests);

          return (
            <Card
              key={key}
              className={`group relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${
                stats.completed === stats.total && stats.total > 0
                  ? 'bg-gradient-to-br from-success/10 to-success/5 border-success/50 shadow-success/20'
                  : `${config.bgColor} ${config.borderColor} hover:border-current/30`
              }`}
            >
              {/* Background decoration */}
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-current/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <CardContent className="p-6 text-center relative">
                <div className="flex items-center justify-center mb-3">
                  <div className={`p-3 rounded-xl ${config.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                    <config.icon className={`h-6 w-6 ${config.color}`} />
                  </div>
                  {stats.completed === stats.total && stats.total > 0 && (
                    <div className="absolute -top-1 -right-1">
                      <Trophy className="h-4 w-4 text-success animate-bounce" />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="text-3xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                    {stats.completed}
                  </div>
                  <div className="text-sm text-muted-foreground">{config.label}</div>
                  <div className="text-xs text-primary font-medium">{Math.round(stats.percentage)}%</div>
                </div>

                <Progress
                  value={stats.percentage}
                  className="mt-3 h-2 bg-muted/50"
                />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quest Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as QuestGranularity)}>
        <div className="backdrop-blur-xl bg-card/30 rounded-2xl border border-border/50 p-2">
          <TabsList className="grid w-full grid-cols-4 bg-transparent h-auto p-0 gap-2">
            {Object.entries(GRANULARITY_CONFIG).map(([key, config]) => (
              <TabsTrigger
                key={key}
                value={key}
                className="flex items-center gap-2 py-3 px-4 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-lg transition-all duration-300 hover:bg-background/50"
              >
                <config.icon className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">{config.label}</span>
                <span className="sm:hidden font-medium">{config.label.split(' ')[0]}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="mt-8">
          {Object.keys(GRANULARITY_CONFIG).map((granularity) => (
            <TabsContent key={granularity} value={granularity} className="mt-0">
              {renderQuestSection(granularity as QuestGranularity)}
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
};