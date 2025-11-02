'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Target, CheckCircle, XCircle, PauseCircle, PlayCircle } from 'lucide-react';
import type {
  Quest,
  UserQuest,
  QuestProgress,
  QuestGranularity,
  QuestStatus,
  QuestSchedule
} from '@/types/quest-system';
import { QuestDetails } from './QuestDetails';
import { QuestProgressDisplay } from './QuestProgressDisplay';

interface QuestSchedulerProps {
  userId: string;
  quests: Quest[];
  userQuests: UserQuest[];
  schedules: QuestSchedule[];
  onQuestAction: (questId: string, action: 'start' | 'pause' | 'complete' | 'skip') => void;
  onScheduleQuest: (questId: string, scheduleDate: Date) => void;
  onUpdateQuest: (questId: string, updates: Partial<UserQuest>) => void;
}

interface GroupedQuests {
  daily: (Quest | UserQuest)[];
  weekly: (Quest | UserQuest)[];
  monthly: (Quest | UserQuest)[];
}

const granularities = ['daily', 'weekly', 'monthly'] as const;

const getGranularityColor = (granularity: QuestGranularity) => {
  switch (granularity) {
    case 'daily': return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'weekly': return 'bg-green-100 text-green-800 border-green-300';
    case 'monthly': return 'bg-purple-100 text-purple-800 border-purple-300';
    default: return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

const getStatusIcon = (status: QuestStatus) => {
  switch (status) {
    case 'active': return <PlayCircle className="w-4 h-4 text-green-500" />;
    case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
    case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
    case 'paused': return <PauseCircle className="w-4 h-4 text-yellow-500" />;
    case 'expired': return <XCircle className="w-4 h-4 text-gray-500" />;
    default: return <Target className="w-4 h-4 text-gray-400" />;
  }
};

const getStatusColor = (status: QuestStatus) => {
  switch (status) {
    case 'active': return 'text-green-600';
    case 'completed': return 'text-green-700 bg-green-50 border-green-200';
    case 'failed': return 'text-red-600 bg-red-50 border-red-200';
    case 'paused': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'expired': return 'text-gray-600 bg-gray-50 border-gray-200';
    default: return 'text-gray-600';
  }
};

const getGranularityLabel = (granularity: QuestGranularity) => {
  switch (granularity) {
    case 'daily': return 'Quête Journalière';
    case 'weekly': return 'Quête Hebdomadaire';
    case 'monthly': return 'Quête Mensuelle';
    default: return 'Quête';
  }
};

export const QuestScheduler: React.FC<QuestSchedulerProps> = ({
  userId,
  quests,
  userQuests,
  schedules,
  onQuestAction,
  onScheduleQuest,
  onUpdateQuest
}) => {
  const [selectedGranularity, setSelectedGranularity] = useState<QuestGranularity>('daily');
  const [selectedQuest, setSelectedQuest] = useState<Quest | UserQuest | null>(null);
  const [showProgress, setShowProgress] = useState<QuestProgress | null>(null);

  // Fusionner les quêtes par défaut et personnalisées
  const allQuests = [...quests, ...userQuests];

  // Regrouper par granularité
  const groupedQuests: GroupedQuests = {
    daily: allQuests.filter(q => q.granularity === 'daily'),
    weekly: allQuests.filter(q => q.granularity === 'weekly'),
    monthly: allQuests.filter(q => q.granularity === 'monthly'),
  };

  const getProgressForQuest = useCallback((quest: Quest | UserQuest): QuestProgress | null => {
    // Implémentation de la récupération de la progression
    // Ceci serait normalement connecté à votre système de données
    return null;
  }, []);

  const handleQuestClick = (quest: Quest | UserQuest) => {
    setSelectedQuest(quest);
  };

  const handleScheduleClick = (quest: Quest | UserQuest) => {
    // Implémenter la logique de planification
    const scheduleDate = new Date();
    scheduleDate.setDate(scheduleDate.getDate() + 1); // Exemple: demain
    onScheduleQuest(quest.id, scheduleDate);
  };

  const getScheduleForQuest = (questId: string) => {
    return schedules.find(schedule => schedule.questId === questId);
  };

  return (
    <div className=\"space-y-6\">
      {/* Sélecteur de granularité */}
      <div className=\"flex flex-wrap gap-2 mb-6\">
        {granularities.map(granularity => (
          <Button
            key={granularity}
            variant={selectedGranularity === granularity ? 'default' : 'outline'}
            onClick={() => setSelectedGranularity(granularity)}
            className=\"flex items-center gap-2\"
          >
            <Target className=\"w-4 h-4\" />
            {getGranularityLabel(granularity)}
            <Badge variant=\"secondary\" className=\"ml-2\">
              {groupedQuests[granularity].length}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Grille des quêtes */}
      <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4\">
        {groupedQuests[selectedGranularity].map(quest => {
          const progress = getProgressForQuest(quest);
          const schedule = getScheduleForQuest(quest.id);
          const isScheduled = !!schedule;

          return (
            <Card
              key={quest.id}
              className={`cursor-pointer transition-all hover:shadow-lg border-l-4 ${
                getStatusColor(progress?.status || 'active')
              }`}
              onClick={() => handleQuestClick(quest)}
            >
              <CardHeader className=\"pb-3\">
                <div className=\"flex justify-between items-start\">
                  <CardTitle className=\"text-lg font-semibold\">
                    {quest.customTitle || quest.title}
                  </CardTitle>
                  <Badge
                    className={`${getGranularityColor(quest.granularity)} text-xs`}
                  >
                    {quest.granularity}
                  </Badge>
                </div>
                <CardDescription className=\"text-sm text-gray-600\">
                  {quest.customDescription || quest.description}
                </CardDescription>
              </CardHeader>

              <CardContent className=\"pt-0\">
                <div className=\"space-y-3\">
                  {/* Métadonnées de la quête */}
                  <div className=\"flex justify-between items-center text-xs text-gray-500\">
                    <div className=\"flex items-center gap-1\">
                      <Clock className=\"w-3 h-3\" />
                      {quest.timeLimit ? `${quest.timeLimit} min` : 'Sans limite'}
                    </div>
                    <div className=\"flex items-center gap-1\">
                      <Target className=\"w-3 h-3\" />
                      {quest.xpReward} XP
                    </div>
                  </div>

                  {/* État et progression */}
                  {progress && (
                    <div className=\"flex justify-between items-center text-xs\">
                      <span className=\"flex items-center gap-1\">
                        {getStatusIcon(progress.status)}
                        <span className=\"capitalize\">{progress.status}</span>
                      </span>
                      <span>{progress.progress}%</span>
                    </div>
                  )}

                  {/* Tags */}
                  <div className=\"flex flex-wrap gap-1\">
                    {quest.tags.map((tag, index) => (
                      <Badge key={index} variant=\"outline\" className=\"text-xs\">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* Planification */}
                  {isScheduled && (
                    <div className=\"flex items-center gap-2 text-xs text-blue-600\">
                      <Calendar className=\"w-3 h-3\" />
                      <span>Planifié le {new Date(schedule!.scheduledDate).toLocaleDateString()}</span>
                    </div>
                  )}

                  {/* Actions rapides */}
                  <div className=\"flex gap-2 pt-2\">
                    <Button
                      size=\"sm\"
                      variant=\"outline\"
                      className=\"text-xs\"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleScheduleClick(quest);
                      }}
                    >
                      <Calendar className=\"w-3 h-3 mr-1\" />
                      Planifier
                    </Button>

                    {!isScheduled && (
                      <Button
                        size=\"sm\"
                        variant=\"outline\"
                        className=\"text-xs\"
                        onClick={(e) => {
                          e.stopPropagation();
                          onQuestAction(quest.id, 'start');
                        }}
                      >
                        <PlayCircle className=\"w-3 h-3 mr-1\" />
                        Démarrer
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Détails de la quête sélectionnée */}
      {selectedQuest && (
        <QuestDetails
          quest={selectedQuest}
          progress={getProgressForQuest(selectedQuest)}
          onClose={() => setSelectedQuest(null)}
          onAction={onQuestAction}
          onUpdate={onUpdateQuest}
        />
      )}

      {/* Détails de la progression */}
      {showProgress && (
        <QuestProgressDisplay
          progress={showProgress}
          onClose={() => setShowProgress(null)}
        />
      )}
    </div>
  );
};