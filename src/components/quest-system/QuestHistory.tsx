'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, Target, CheckCircle, XCircle, Trophy, TrendingUp, Award } from 'lucide-react';
import type {
  QuestCompletion,
  Quest,
  UserQuest,
  QuestStats,
  QuestCategory,
  QuestDifficulty
} from '@/types/quest-system';

interface QuestHistoryProps {
  userId: string;
  completions: QuestCompletion[];
  quests: Quest[];
  userQuests: UserQuest[];
  stats: QuestStats | null;
  onViewQuest: (quest: Quest | UserQuest) => void;
  onFilterChange: (filters: HistoryFilters) => void;
}

interface HistoryFilters {
  dateRange: 'week' | 'month' | 'quarter' | 'year' | 'all';
  category: QuestCategory | 'all';
  difficulty: QuestDifficulty | 'all';
  status: 'completed' | 'failed' | 'all';
  searchTerm: string;
}

interface StatCard {
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  icon: React.ReactNode;
  color: string;
}

const getCompletionIcon = (quest: Quest | UserQuest, completion: QuestCompletion) => {
  if (completion.accuracy === undefined || completion.accuracy >= 80) {
    return <CheckCircle className=\"w-5 h-5 text-green-500\" />;
  } else if (completion.accuracy >= 50) {
    return <Clock className=\"w-5 h-5 text-yellow-500\" />;
  } else {
    return <XCircle className=\"w-5 h-5 text-red-500\" />;
  }
};

const getCategoryIcon = (category: QuestCategory) => {
  const icons: Record<QuestCategory, string> = {
    [QuestCategory.HEALTH]: '❤️',
    [QuestCategory.WORK]: '💼',
    [QuestCategory.PERSONAL]: '👤',
    [QuestCategory.FITNESS]: '💪',
    [QuestCategory.LEARNING]: '📚',
    [QuestCategory.SOCIAL]: '👥',
    [QuestCategory.FINANCE]: '💰',
    [QuestCategory.CREATIVITY]: '🎨',
    [QuestCategory.HOBBY]: '🎯'
  };
  return icons[category];
};

const getDifficultyColor = (difficulty: QuestDifficulty) => {
  switch (difficulty) {
    case QuestDifficulty.EASY: return 'bg-green-100 text-green-800 border-green-300';
    case QuestDifficulty.MEDIUM: return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case QuestDifficulty.HARD: return 'bg-orange-100 text-orange-800 border-orange-300';
    case QuestDifficulty.EXPERT: return 'bg-red-100 text-red-800 border-red-300';
    default: return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

const getDifficultyLabel = (difficulty: QuestDifficulty) => {
  switch (difficulty) {
    case QuestDifficulty.EASY: return 'Facile';
    case QuestDifficulty.MEDIUM: return 'Moyen';
    case QuestDifficulty.HARD: return 'Difficile';
    case QuestDifficulty.EXPERT: return 'Expert';
    default: return 'Inconnu';
  }
};

const getGranularityLabel = (granularity: string) => {
  switch (granularity) {
    case 'daily': return 'Journalière';
    case 'weekly': return 'Hebdomadaire';
    case 'monthly': return 'Mensuelle';
    default: return 'Inconnue';
  }
};

const getPerformanceLevel = (accuracy?: number) => {
  if (accuracy === undefined) return 'Non évalué';
  if (accuracy >= 90) return 'Excellent';
  if (accuracy >= 75) return 'Bon';
  if (accuracy >= 60) return 'Moyen';
  return 'À améliorer';
};

export const QuestHistory: React.FC<QuestHistoryProps> = ({
  userId,
  completions,
  quests,
  userQuests,
  stats,
  onViewQuest,
  onFilterChange
}) => {
  const [filters, setFilters] = useState<HistoryFilters>({
    dateRange: 'month',
    category: 'all',
    difficulty: 'all',
    status: 'completed',
    searchTerm: ''
  });

  const [selectedCompletion, setSelectedCompletion] = useState<QuestCompletion | null>(null);
  const [isStatsDialogOpen, setIsStatsDialogOpen] = useState(false);

  const allQuests = [...quests, ...userQuests];

  // Filtrer les complétions selon les filtres
  const filteredCompletions = useMemo(() => {
    const filtered = completions.filter(completion => {
      const quest = allQuests.find(q => q.id === completion.questId);
      if (!quest) return false;

      // Filtre de recherche
      if (filters.searchTerm && !(
        quest.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        quest.description.toLowerCase().includes(filters.searchTerm.toLowerCase())
      )) {
        return false;
      }

      // Filtre de catégorie
      if (filters.category !== 'all' && quest.category !== filters.category) {
        return false;
      }

      // Filtre de difficulté
      if (filters.difficulty !== 'all' && quest.difficulty !== filters.difficulty) {
        return false;
      }

      // Filtre de statut
      if (filters.status !== 'all') {
        if (filters.status === 'completed' && completion.xpEarned <= 0) return false;
        if (filters.status === 'failed' && completion.xpEarned > 0) return false;
      }

      // Filtre de date
      const completionDate = new Date(completion.completedAt);
      const now = new Date();
      let cutoffDate = new Date();

      switch (filters.dateRange) {
        case 'week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          cutoffDate.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          cutoffDate.setFullYear(now.getFullYear() - 1);
          break;
        case 'all':
        default:
          cutoffDate = new Date(0);
          break;
      }

      return completionDate >= cutoffDate;
    });

    // Trier par date (plus récentes en premier)
    return filtered.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  }, [completions, allQuests, filters]);

  const handleFilterChange = (newFilters: Partial<HistoryFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const getQuestForCompletion = (completionId: string) => {
    const completion = completions.find(c => c.id === completionId);
    if (!completion) return null;
    return allQuests.find(q => q.id === completion.questId);
  };

  const generateStatsCards = (): StatCard[] => {
    if (!stats) return [];

    return [
      {
        title: 'Quêtes Complétées',
        value: stats.totalQuestsCompleted,
        trend: 'up',
        icon: <Target className=\"w-5 h-5\" />,
        color: 'text-blue-600'
      },
      {
        title: 'XP Totale',
        value: stats.totalXpEarned,
        trend: 'up',
        icon: <Trophy className=\"w-5 h-5\" />,
        color: 'text-yellow-600'
      },
      {
        title: 'Niveau Actuel',
        value: stats.currentLevel,
        trend: 'up',
        icon: <Award className=\"w-5 h-5\" />,
        color: 'text-purple-600'
      },
      {
        title: 'Taux de Succès',
        value: `${stats.successRate}%`,
        trend: 'stable',
        icon: <CheckCircle className=\"w-5 h-5\" />,
        color: 'text-green-600'
      }
    ];
  };

  const getCategoryStats = () => {
    const categoryCount: Record<QuestCategory, number> = {} as Record<QuestCategory, number>;

    Object.values(QuestCategory).forEach(category => {
      categoryCount[category] = filteredCompletions.filter(completion => {
        const quest = allQuests.find(q => q.id === completion.questId);
        return quest?.category === category;
      }).length;
    });

    return Object.entries(categoryCount)
      .filter(([_, count]) => count > 0)
      .sort(([,a], [,b]) => b - a);
  };

  const getDifficultyStats = () => {
    const difficultyCount: Record<QuestDifficulty, number> = {} as Record<QuestDifficulty, number>;

    Object.values(QuestDifficulty).forEach(difficulty => {
      difficultyCount[difficulty] = filteredCompletions.filter(completion => {
        const quest = allQuests.find(q => q.id === completion.questId);
        return quest?.difficulty === difficulty;
      }).length;
    });

    return Object.entries(difficultyCount)
      .filter(([_, count]) => count > 0)
      .sort(([,a], [,b]) => b - a);
  };

  return (
    <div className=\"space-y-6\">
      {/* En-tête avec filtres */}
      <div className=\"flex flex-wrap justify-between items-center gap-4\">
        <h2 className=\"text-2xl font-bold\">Historique des Quêtes</h2>

        <div className=\"flex flex-wrap gap-2\">
          {/* Filtres */}
          <Select value={filters.dateRange} onValueChange={(value) => handleFilterChange({ dateRange: value as any })}>
            <SelectTrigger className=\"w-32\">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value=\"week\">Dernière semaine</SelectItem>
              <SelectItem value=\"month\">Dernier mois</SelectItem>
              <SelectItem value=\"quarter\">Dernier trimestre</SelectItem>
              <SelectItem value=\"year\">Dernière année</SelectItem>
              <SelectItem value=\"all\">Toujours</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.category} onValueChange={(value) => handleFilterChange({ category: value as QuestCategory | 'all' })}>
            <SelectTrigger className=\"w-32\">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value=\"all\">Toutes catégories</SelectItem>
              {Object.values(QuestCategory).map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.difficulty} onValueChange={(value) => handleFilterChange({ difficulty: value as QuestDifficulty | 'all' })}>
            <SelectTrigger className=\"w-32\">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value=\"all\">Toutes difficultés</SelectItem>
              {Object.values(QuestDifficulty).map(difficulty => (
                <SelectItem key={difficulty} value={difficulty}>
                  {getDifficultyLabel(difficulty)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            placeholder=\"Rechercher...\"
            value={filters.searchTerm}
            onChange={(e) => handleFilterChange({ searchTerm: e.target.value })}
            className=\"w-48\"
          />
        </div>
      </div>

      {/* Vue par onglets */}
      <Tabs defaultValue=\"completions\" className=\"w-full\">
        <TabsList>
          <TabsTrigger value=\"completions\">Complétions ({filteredCompletions.length})</TabsTrigger>
          <TabsTrigger value=\"stats\">Statistiques</TabsTrigger>
          <TabsTrigger value=\"analysis\">Analyse</TabsTrigger>
        </TabsList>

        <TabsContent value=\"completions\" className=\"space-y-4\">
          {/* Vue chronologique des complétions */}
          <div className=\"space-y-4\">
            {filteredCompletions.length === 0 ? (
              <Card>
                <CardContent className=\"py-8 text-center\">
                  <p className=\"text-gray-500\">Aucune complétion trouvée pour ces filtres.</p>
                </CardContent>
              </Card>
            ) : (
              filteredCompletions.map(completion => {
                const quest = getQuestForCompletion(completion.id);
                if (!quest) return null;

                return (
                  <Card key={completion.id} className=\"hover:shadow-lg transition-shadow\">
                    <CardHeader className=\"pb-3\">
                      <div className=\"flex justify-between items-start\">
                        <div className=\"flex items-center gap-3\">
                          {getCompletionIcon(quest, completion)}
                          <div>
                            <CardTitle className=\"text-lg\">{quest.title}</CardTitle>
                            <CardDescription>
                              {new Date(completion.completedAt).toLocaleDateString('fr-FR', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </CardDescription>
                          </div>
                        </div>
                        <div className=\"text-right\">
                          <Badge variant=\"outline\" className=\"mb-1\">
                            {getCategoryIcon(quest.category)} {quest.category}
                          </Badge>
                          <div className=\"flex items-center gap-1 text-sm text-gray-500\">
                            <Trophy className=\"w-3 h-3\" />
                            {completion.xpEarned} XP
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className=\"pt-0\">
                      <div className=\"space-y-3\">
                        <p className=\"text-sm text-gray-600\">{quest.description}</p>

                        <div className=\"flex flex-wrap gap-2 text-xs\">
                          <Badge className={getDifficultyColor(quest.difficulty)}>
                            {getDifficultyLabel(quest.difficulty)}
                          </Badge>
                          <Badge variant=\"outline\">
                            {getGranularityLabel(quest.granularity)}
                          </Badge>
                          {completion.tookTime && (
                            <Badge variant=\"outline\">
                              <Clock className=\"w-3 h-3 mr-1\" />
                              {completion.tookTime} min
                            </Badge>
                          )}
                          {completion.accuracy !== undefined && (
                            <Badge variant=\"outline\" className={completion.accuracy >= 80 ? 'bg-green-100 text-green-800' : completion.accuracy >= 50 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}>
                              {getPerformanceLevel(completion.accuracy)}
                            </Badge>
                          )}
                        </div>

                        {completion.notes && (
                          <div className=\"p-2 bg-gray-50 rounded text-sm text-gray-700\">
                            <strong>Notes:</strong> {completion.notes}
                          </div>
                        )}

                        <div className=\"flex gap-2 pt-2\">
                          <Button
                            size=\"sm\"
                            variant=\"outline\"
                            onClick={() => onViewQuest(quest)}
                          >
                            Voir la quête
                          </Button>
                          <Button
                            size=\"sm\"
                            variant=\"outline\"
                            onClick={() => setSelectedCompletion(completion)}
                          >
                            Détails
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value=\"stats\" className=\"space-y-4\">
          {/* Statistiques principales */}
          <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4\">
            {generateStatsCards().map((stat, index) => (
              <Card key={index}>
                <CardContent className=\"pt-6\">
                  <div className=\"flex items-center justify-between\">
                    <div>
                      <p className=\"text-sm font-medium text-gray-600\">{stat.title}</p>
                      <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    </div>
                    <div className={`p-2 rounded-lg ${stat.trend === 'up' ? 'bg-green-100' : stat.trend === 'down' ? 'bg-red-100' : 'bg-gray-100'}`}>
                      {stat.icon}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {stats && (
            <>
              {/* Progression vers le niveau suivant */}
              <Card>
                <CardHeader>
                  <CardTitle className=\"flex items-center gap-2\">
                    <TrendingUp className=\"w-5 h-5\" />
                    Progression de Niveau
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className=\"space-y-3\">
                    <div className=\"flex justify-between text-sm\">
                      <span>Niveau {stats.currentLevel}</span>
                      <span>{stats.totalXpEarned} / {stats.currentLevel * 1000} XP</span>
                      <span>Niveau {stats.currentLevel + 1}</span>
                    </div>
                    <div className=\"w-full bg-gray-200 rounded-full h-2\">
                      <div
                        className=\"bg-blue-600 h-2 rounded-full transition-all duration-300\"
                        style={{ width: `${(stats.totalXpEarned % 1000) / 10}%` }}
                      />
                    </div>
                    <p className=\"text-xs text-gray-600\">
                      {1000 - (stats.totalXpEarned % 1000)} XP restantes pour le niveau {stats.currentLevel + 1}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Meilleure performance */}
              <Card>
                <CardHeader>
                  <CardTitle className=\"flex items-center gap-2\">
                    <Trophy className=\"w-5 h-5\" />
                    Meilleures Performances
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className=\"space-y-3\">
                    {completions
                      .sort((a, b) => (b.accuracy || 0) - (a.accuracy || 0))
                      .slice(0, 3)
                      .map((completion, index) => {
                        const quest = getQuestForCompletion(completion.id);
                        if (!quest) return null;

                        return (
                          <div key={completion.id} className=\"flex items-center justify-between p-2 border rounded\">
                            <div className=\"flex items-center gap-2\">
                              <span className=\"font-medium\">#{index + 1}</span>
                              <span className=\"text-sm\">{quest.title}</span>
                            </div>
                            <Badge variant=\"outline\" className={completion.accuracy >= 90 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100'}>
                              {completion.accuracy}%
                            </Badge>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value=\"analysis\" className=\"space-y-4\">
          {/* Analyse par catégorie */}
          <Card>
            <CardHeader>
              <CardTitle>Quêtes par Catégorie</CardTitle>
            </CardHeader>
            <CardContent>
              <div className=\"space-y-3\">
                {getCategoryStats().map(([category, count]) => (
                  <div key={category} className=\"flex items-center justify-between p-3 border rounded-lg\">
                    <div className=\"flex items-center gap-3\">
                      <span className=\"text-lg\">{getCategoryIcon(category as QuestCategory)}</span>
                      <span className=\"font-medium\">{category}</span>
                    </div>
                    <div className=\"flex items-center gap-2\">
                      <Badge variant=\"outline\">{count} quêtes</Badge>
                      <div className=\"w-20 bg-gray-200 rounded-full h-2\">
                        <div
                          className=\"bg-blue-600 h-2 rounded-full\"
                          style={{ width: `${(count / filteredCompletions.length) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Analyse par difficulté */}
          <Card>
            <CardHeader>
              <CardTitle>Quêtes par Difficulté</CardTitle>
            </CardHeader>
            <CardContent>
              <div className=\"space-y-3\">
                {getDifficultyStats().map(([difficulty, count]) => (
                  <div key={difficulty} className=\"flex items-center justify-between p-3 border rounded-lg\">
                    <div className=\"flex items-center gap-3\">
                      <Badge className={getDifficultyColor(difficulty as QuestDifficulty)}>
                        {getDifficultyLabel(difficulty as QuestDifficulty)}
                      </Badge>
                      <span className=\"font-medium\">{difficulty}</span>
                    </div>
                    <div className=\"flex items-center gap-2\">
                      <Badge variant=\"outline\">{count} quêtes</Badge>
                      <div className=\"w-20 bg-gray-200 rounded-full h-2\">
                        <div
                          className=\"bg-purple-600 h-2 rounded-full\"
                          style={{ width: `${(count / filteredCompletions.length) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Détails de la complétion */}
      {selectedCompletion && (
        <Dialog open={!!selectedCompletion} onOpenChange={() => setSelectedCompletion(null)}>
          <DialogContent className=\"max-w-lg\">
            <DialogHeader>
              <DialogTitle>Détails de la Complétion</DialogTitle>
            </DialogHeader>

            {selectedCompletion && (() => {
              const quest = getQuestForCompletion(selectedCompletion.id);
              if (!quest) return null;

              return (
                <div className=\"space-y-4\">
                  <div className=\"p-4 bg-gray-50 rounded-lg\">
                    <h4 className=\"font-medium mb-2\">{quest.title}</h4>
                    <p className=\"text-sm text-gray-600\">{quest.description}</p>
                  </div>

                  <div className=\"grid grid-cols-2 gap-4 text-sm\">
                    <div>
                      <span className=\"font-medium\">Date:</span>
                      <p>{new Date(selectedCompletion.completedAt).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <div>
                      <span className=\"font-medium\">XP Gagnée:</span>
                      <p className=\"text-green-600 font-medium\">{selectedCompletion.xpEarned} XP</p>
                    </div>
                    {selectedCompletion.tookTime && (
                      <div>
                        <span className=\"font-medium\">Temps Pris:</span>
                        <p>{selectedCompletion.tookTime} minutes</p>
                      </div>
                    )}
                    {selectedCompletion.accuracy !== undefined && (
                      <div>
                        <span className=\"font-medium\">Performance:</span>
                        <p>{getPerformanceLevel(selectedCompletion.accuracy)}</p>
                      </div>
                    )}
                  </div>

                  {selectedCompletion.notes && (
                    <div>
                      <h4 className=\"font-medium mb-2\">Notes:</h4>
                      <p className=\"text-sm bg-gray-50 p-3 rounded\">{selectedCompletion.notes}</p>
                    </div>
                  )}

                  <div className=\"flex justify-end gap-2 pt-4\">
                    <Button variant=\"outline\" onClick={() => setSelectedCompletion(null)}>
                      Fermer
                    </Button>
                    <Button onClick={() => {
                      setSelectedCompletion(null);
                      onViewQuest(quest);
                    }}>
                      Voir la quête
                    </Button>
                  </div>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};