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
        className={`relative overflow-hidden transition-all duration-300 hover:scale-[1.02] ${
          quest.completed
            ? 'bg-success/20 border-success'
            : 'bg-card/50 backdrop-blur-sm border-primary/20'
        } shadow-[0_8px_32px_hsl(0_0%_0%_/_0.4)]`}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleToggleQuest(quest.id)}
              className={`h-8 w-8 rounded-full transition-all duration-300 flex-shrink-0 ${
                quest.completed
                  ? 'bg-success text-success-foreground hover:bg-success/80'
                  : 'border-2 border-primary hover:bg-primary/20'
              }`}
            >
              <IconComponent className="h-4 w-4" />
            </Button>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className={`font-medium text-sm leading-tight ${
                  quest.completed ? 'line-through opacity-60' : ''
                }`}>
                  {quest.title}
                </h3>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Badge className={`text-xs px-2 py-0.5 ${getDifficultyColor(quest.difficulty)}`}>
                    {getDifficultyLabel(quest.difficulty)}
                  </Badge>
                </div>
              </div>

              {quest.description && (
                <p className={`text-xs text-muted-foreground mb-2 ${
                  quest.completed ? 'line-through opacity-60' : ''
                }`}>
                  {quest.description}
                </p>
              )}

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getCategoryIcon(quest.category)}</span>
                  <Badge variant="outline" className="text-xs capitalize">
                    {quest.category}
                  </Badge>
                </div>

                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-bold text-yellow-600">
                    {quest.xp} XP
                  </span>
                  {quest.bonusXP && (
                    <Badge className="text-xs bg-yellow-100 text-yellow-800">
                      +{quest.bonusXP}
                    </Badge>
                  )}
                </div>
              </div>

              {quest.timeLimit && (
                <div className="flex items-center gap-1 mt-2">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {quest.timeLimit}h max
                  </span>
                </div>
              )}
            </div>
          </div>
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
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(GRANULARITY_CONFIG).map(([key, config]) => {
          const quests = questState?.[`${key}Quests` as keyof DailyQuestState] as Quest[] || [];
          const stats = getCompletionStats(quests);

          return (
            <Card key={key} className={`${config.bgColor} ${config.borderColor} border`}>
              <CardContent className="p-4 text-center">
                <config.icon className={`h-6 w-6 ${config.color} mx-auto mb-2`} />
                <div className="text-2xl font-bold">{stats.completed}</div>
                <div className="text-xs text-muted-foreground">{stats.label}</div>
                <Progress value={stats.percentage} className="mt-2 h-1" />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quest Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as QuestGranularity)}>
        <TabsList className="grid w-full grid-cols-4">
          {Object.entries(GRANULARITY_CONFIG).map(([key, config]) => (
            <TabsTrigger key={key} value={key} className="flex items-center gap-2">
              <config.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{config.label}</span>
              <span className="sm:hidden">{config.label.split(' ')[0]}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.keys(GRANULARITY_CONFIG).map((granularity) => (
          <TabsContent key={granularity} value={granularity} className="mt-6">
            {renderQuestSection(granularity as QuestGranularity)}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};