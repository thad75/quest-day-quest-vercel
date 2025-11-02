'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, Clock, Target, CheckCircle, XCircle, PlayCircle, PauseCircle, Award, Star } from 'lucide-react';
import type {
  Quest,
  UserQuest,
  QuestProgress,
  QuestStatus,
  QuestCompletion,
  QuestSchedule
} from '@/types/quest-system';
import { QuestCompletionForm } from './QuestCompletionForm';

interface QuestDetailsProps {
  quest: Quest | UserQuest;
  progress?: QuestProgress | null;
  onClose: () => void;
  onAction: (questId: string, action: 'start' | 'pause' | 'complete' | 'skip') => void;
  onUpdate: (questId: string, updates: Partial<UserQuest>) => void;
}

const getGranularityColor = (granularity: string) => {
  switch (granularity) {
    case 'daily': return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'weekly': return 'bg-green-100 text-green-800 border-green-300';
    case 'monthly': return 'bg-purple-100 text-purple-800 border-purple-300';
    default: return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'easy': return 'bg-green-100 text-green-800 border-green-300';
    case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'hard': return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'expert': return 'bg-red-100 text-red-800 border-red-300';
    default: return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

const getStatusIcon = (status: QuestStatus) => {
  switch (status) {
    case 'active': return <PlayCircle className=\"w-4 h-4 text-blue-500\" />;
    case 'completed': return <CheckCircle className=\"w-4 h-4 text-green-500\" />;
    case 'failed': return <XCircle className=\"w-4 h-4 text-red-500\" />;
    case 'paused': return <PauseCircle className=\"w-4 h-4 text-yellow-500\" />;
    case 'expired': return <XCircle className=\"w-4 h-4 text-gray-500\" />;
    default: return <Target className=\"w-4 h-4 text-gray-400\" />;
  }
};

const getCategoryIcon = (category: string) => {
  const icons: Record<string, string> = {
    'santé': '❤️',
    'travail': '💼',
    'personnel': '👤',
    'fitness': '💪',
    'apprentissage': '📚',
    'social': '👥',
    'finance': '💰',
    'créativité': '🎨',
    'loisirs': '🎯'
  };
  return icons[category] || '📋';
};

export const QuestDetails: React.FC<QuestDetailsProps> = ({
  quest,
  progress,
  onClose,
  onAction,
  onUpdate
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isCompletionDialogOpen, setIsCompletionDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleAction = (action: 'start' | 'pause' | 'complete' | 'skip') => {
    onAction(quest.id, action);
  };

  const handleComplete = (completionData: Partial<QuestCompletion>) => {
    // Implémenter la logique de complétion
    setIsCompletionDialogOpen(false);
  };

  const getEstimatedTimeToComplete = () => {
    if (!quest.timeLimit) return 'Illimitée';

    const now = new Date();
    const nextReset = getNextResetDate(quest.granularity);

    if (nextReset <= now) return 'Dès que possible';

    const timeDiff = nextReset.getTime() - now.getTime();
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `D'ici ${days} jour${days > 1 ? 's' : ''}`;
    if (hours > 0) return `D'ici ${hours} heure${hours > 1 ? 's' : ''}`;
    return 'Prochainement';
  };

  const getNextResetDate = (granularity: string): Date => {
    const now = new Date();

    switch (granularity) {
      case 'daily':
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        return tomorrow;

      case 'weekly':
        const nextWeek = new Date(now);
        const daysUntilNextSunday = (7 - now.getDay()) % 7;
        nextWeek.setDate(nextWeek.getDate() + daysUntilNextSunday);
        nextWeek.setHours(0, 0, 0, 0);
        return nextWeek;

      case 'monthly':
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        nextMonth.setHours(0, 0, 0, 0);
        return nextMonth;

      default:
        return now;
    }
  };

  const getCompletionRate = () => {
    if (!progress) return 0;
    const totalPossible = progress.completionsCount + 1; // +1 pour la tentative actuelle
    return Math.min(100, (progress.completionsCount / totalPossible) * 100);
  };

  const renderActionButton = () => {
    if (!progress) return null;

    switch (progress.status) {
      case 'active':
        return (
          <Button
            size=\"lg\"
            className=\"w-full\"
            onClick={() => handleAction('complete')}
          >
            <CheckCircle className=\"w-4 h-4 mr-2\" />
            Compléter
          </Button>
        );

      case 'paused':
        return (
          <>
            <Button
              size=\"lg\"
              className=\"w-full\"
              onClick={() => handleAction('start')}
            >
              <PlayCircle className=\"w-4 h-4 mr-2\" />
              Reprendre
            </Button>
            <Button
              variant=\"outline\"
              size=\"lg\"
              className=\"w-full mt-2\"
              onClick={() => handleAction('skip')}
            >
              Passer
            </Button>
          </>
        );

      case 'completed':
        return (
          <Button
            variant=\"outline\"
            size=\"lg\"
            className=\"w-full\"
            onClick={() => handleAction('start')}
          >
            Nouvelle Tentative
          </Button>
        );

      case 'failed':
        return (
          <>
            <Button
              size=\"lg\"
              className=\"w-full\"
              onClick={() => handleAction('start')}
            >
              <PlayCircle className=\"w-4 h-4 mr-2\" />
              Réessayer
            </Button>
            <Button
              variant=\"outline\"
              size=\"lg\"
              className=\"w-full mt-2\"
              onClick={() => handleAction('skip')}
            >
              Passer
            </Button>
          </>
        );

      case 'expired':
        return (
          <Button
            variant=\"outline\"
            size=\"lg\"
            className=\"w-full text-red-600\"
          >
            Expirée
          </Button>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose} className=\"max-w-4xl\">
      <DialogContent className=\"max-w-4xl max-h-[90vh] overflow-y-auto\">
        <DialogHeader>
          <div className=\"flex justify-between items-start\">
            <div>
              <DialogTitle className=\"text-xl\">{quest.customTitle || quest.title}</DialogTitle>
              <DialogDescription className=\"mt-2\">
                {quest.customDescription || quest.description}
              </DialogDescription>
            </div>
            <Button variant=\"ghost\" size=\"sm\" onClick={onClose}>
              ✕
            </Button>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className=\"w-full\">
          <TabsList className=\"grid w-full grid-cols-4\">
            <TabsTrigger value=\"overview\">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value=\"progress\">Progression</TabsTrigger>
            <TabsTrigger value=\"history\">Historique</TabsTrigger>
            <TabsTrigger value=\"schedule\">Planification</TabsTrigger>
          </TabsList>

          <TabsContent value=\"overview\" className=\"space-y-6\">
            {/* Informations principales */}
            <div className=\"grid grid-cols-1 md:grid-cols-2 gap-4\">
              <Card>
                <CardHeader className=\"pb-3\">
                  <CardTitle className=\"text-base flex items-center gap-2\">
                    <Award className=\"w-4 h-4\" />
                    Informations
                  </CardTitle>
                </CardHeader>
                <CardContent className=\"pt-0 space-y-3\">
                  <div className=\"flex items-center justify-between\">
                    <span className=\"text-sm text-gray-600\">Catégorie:</span>
                    <span className=\"flex items-center gap-1\">
                      <span>{getCategoryIcon(quest.category)}</span>
                      <span className=\"font-medium\">{quest.category}</span>
                    </span>
                  </div>
                  <div className=\"flex items-center justify-between\">
                    <span className=\"text-sm text-gray-600\">Difficulté:</span>
                    <Badge className={getDifficultyColor(quest.difficulty)}>
                      {quest.difficulty}
                    </Badge>
                  </div>
                  <div className=\"flex items-center justify-between\">
                    <span className=\"text-sm text-gray-600\">Granularité:</span>
                    <Badge className={getGranularityColor(quest.granularity)}>
                      {quest.granularity}
                    </Badge>
                  </div>
                  <div className=\"flex items-center justify-between\">
                    <span className=\"text-sm text-gray-600\">Récompense:</span>
                    <span className=\"font-medium text-yellow-600\">{quest.xpReward} XP</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className=\"pb-3\">
                  <CardTitle className=\"text-base flex items-center gap-2\">
                    <Clock className=\"w-4 h-4\" />
                    Timing
                  </CardTitle>
                </CardHeader>
                <CardContent className=\"pt-0 space-y-3\">
                  <div className=\"flex items-center justify-between\">
                    <span className=\"text-sm text-gray-600\">Limite:</span>
                    <span>{quest.timeLimit ? `${quest.timeLimit} min` : 'Illimitée'}</span>
                  </div>
                  <div className=\"flex items-center justify-between\">
                    <span className=\"text-sm text-gray-600\">Prochain reset:</span>
                    <span className=\"text-sm font-medium\">
                      {getNextResetDate(quest.granularity).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <div className=\"flex items-center justify-between\">
                    <span className=\"text-sm text-gray-600\">Temps restant:</span>
                    <span className=\"text-sm font-medium text-blue-600\">
                      {getEstimatedTimeToComplete()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tags et métadonnées */}
            <Card>
              <CardHeader className=\"pb-3\">
                <CardTitle className=\"text-base flex items-center gap-2\">
                  <Target className=\"w-4 h-4\" />
                  Tags et Métadonnées
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className=\"space-y-3\">
                  <div className=\"flex flex-wrap gap-2\">
                    {quest.tags.map((tag, index) => (
                      <Badge key={index} variant=\"outline\">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {quest.maxCompletions && (
                    <div className=\"text-sm text-gray-600\">
                      Maximum {quest.maxCompletions} complétions par cycle
                    </div>
                  )}

                  {quest.repeatPattern && (
                    <div className=\"text-sm text-gray-600\">
                      Répétition: {quest.repeatPattern}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Action principale */}
            <Card>
              <CardHeader className=\"pb-3\">
                <CardTitle className=\"text-base flex items-center gap-2\">
                  <PlayCircle className=\"w-4 h-4\" />
                  Action
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderActionButton()}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value=\"progress\" className=\"space-y-6\">
            {progress && (
              <>
                <Card>
                  <CardHeader className=\"pb-3\">
                    <CardTitle className=\"text-base flex items-center gap-2\">
                      <Target className=\"w-4 h-4\" />
                      Progression Actuelle
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className=\"space-y-4\">
                      <div>
                        <div className=\"flex justify-between text-sm mb-2\">
                          <span>Complétion</span>
                          <span>{progress.progress}%</span>
                        </div>
                        <Progress value={progress.progress} className=\"h-2\" />
                      </div>

                      <div className=\"grid grid-cols-2 md:grid-cols-4 gap-4 text-sm\">
                        <div className=\"text-center p-3 bg-gray-50 rounded\">
                          <div className=\"font-bold text-lg\">{progress.completionsCount}</div>
                          <div className=\"text-gray-600\">Complétions</div>
                        </div>
                        <div className=\"text-center p-3 bg-gray-50 rounded\">
                          <div className=\"font-bold text-lg\">{progress.streak}</div>
                          <div className=\"text-gray-600\">Streak</div>
                        </div>
                        <div className=\"text-center p-3 bg-gray-50 rounded\">
                          <div className=\"font-bold text-lg\">{progress.bestStreak}</div>
                          <div className=\"text-gray-600\">Meilleur Streak</div>
                        </div>
                        <div className=\"text-center p-3 bg-gray-50 rounded\">
                          <div className=\"font-bold text-lg\">{getCompletionRate()}%</div>
                          <div className=\"text-gray-600\">Taux de Succès</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {progress.lastCompletionDate && (
                  <Card>
                    <CardHeader className=\"pb-3\">
                      <CardTitle className=\"text-base flex items-center gap-2\">
                        <CheckCircle className=\"w-4 h-4\" />
                        Dernière Complétion
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className=\"text-sm text-gray-600\">
                        Le {new Date(progress.lastCompletionDate).toLocaleDateString('fr-FR')}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value=\"history\" className=\"space-y-6\">
            <Card>
              <CardHeader className=\"pb-3\">
                <CardTitle className=\"text-base flex items-center gap-2\">
                  <Calendar className=\"w-4 h-4\" />
                  Historique des Complétions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className=\"text-center text-gray-500 py-8\">
                  <Calendar className=\"w-8 h-8 mx-auto mb-2 opacity-50\" />
                  <p>Aucune complétion pour cette quête</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value=\"schedule\" className=\"space-y-6\">
            <Card>
              <CardHeader className=\"pb-3\">
                <CardTitle className=\"text-base flex items-center gap-2\">
                  <Star className=\"w-4 h-4\" />
                  Planification
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className=\"space-y-4\">
                  <Button
                    className=\"w-full\"
                    onClick={() => setIsCompletionDialogOpen(true)}
                  >
                    Planifier une Complétion
                  </Button>

                  <div className=\"text-sm text-gray-600\">
                    Cette fonctionnalité vous permet de planifier des sessions complétions pour cette quête.
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Actions supplémentaires */}
        <DialogFooter className=\"flex justify-between\">
          <Button variant=\"outline\" onClick={() => setIsEditDialogOpen(true)}>
            Modifier
          </Button>
          <div className=\"flex gap-2\">
            <Button variant=\"outline\" onClick={onClose}>
              Fermer
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>

      {/* Dialog de complétion */}
      <QuestCompletionForm
        quest={quest}
        isOpen={isCompletionDialogOpen}
        onClose={() => setIsCompletionDialogOpen(false)}
        onComplete={handleComplete}
      />

      {/* Dialog d'édition */}
      <QuestCompletionForm
        quest={quest}
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onComplete={() => setIsEditDialogOpen(false)}
        isEditMode={true}
      />
    </Dialog>
  );
};