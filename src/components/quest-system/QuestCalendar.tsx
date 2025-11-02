'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, Target, CheckCircle, XCircle, PlayCircle, CalendarDays } from 'lucide-react';
import type {
  Quest,
  UserQuest,
  QuestProgress,
  QuestSchedule,
  QuestStatus
} from '@/types/quest-system';

interface QuestCalendarProps {
  userId: string;
  quests: Quest[];
  userQuests: UserQuest[];
  schedules: QuestSchedule[];
  onSelectDate: (date: Date) => void;
  onScheduleQuest: (questId: string, date: Date) => void;
  onViewQuest: (quest: Quest | UserQuest) => void;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  quests: (Quest | UserQuest)[];
  schedules: QuestSchedule[];
  completions: string[]; // IDs des quêtes complétées
}

const getStatusIcon = (status: QuestStatus) => {
  switch (status) {
    case 'active': return <PlayCircle className=\"w-4 h-4 text-blue-500\" />;
    case 'completed': return <CheckCircle className=\"w-4 h-4 text-green-500\" />;
    case 'failed': return <XCircle className=\"w-4 h-4 text-red-500\" />;
    case 'paused': return <Clock className=\"w-4 h-4 text-yellow-500\" />;
    case 'expired': return <XCircle className=\"w-4 h-4 text-gray-500\" />;
    default: return <Target className=\"w-4 h-4 text-gray-400\" />;
  }
};

const getGranularityColor = (granularity: string) => {
  switch (granularity) {
    case 'daily': return 'bg-blue-100 border-blue-300 text-blue-800';
    case 'weekly': return 'bg-green-100 border-green-300 text-green-800';
    case 'monthly': return 'bg-purple-100 border-purple-300 text-purple-800';
    default: return 'bg-gray-100 border-gray-300 text-gray-800';
  }
};

const getMonthData = (year: number, month: number, quests: (Quest | UserQuest)[], schedules: QuestSchedule[], completions: string[]) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const days: CalendarDay[] = [];

  // Jours vides avant le premier jour du mois
  for (let i = 0; i < firstDayOfMonth; i++) {
    const date = new Date(year, month, -firstDayOfMonth + i + 1);
    days.push({
      date,
      isCurrentMonth: false,
      quests: [],
      schedules: [],
      completions: []
    });
  }

  // Jours du mois actuel
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateStr = date.toISOString().split('T')[0];

    // Trouver les quêtes prévues pour cette date
    const dayQuests = quests.filter(quest => {
      if (!quest.timeLimit) return false;
      const questDate = new Date(date);
      questDate.setHours(0, 0, 0, 0);
      return questDate.toISOString().split('T')[0] === dateStr;
    });

    // Trouver les schedules pour cette date
    const daySchedules = schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.scheduledDate);
      scheduleDate.setHours(0, 0, 0, 0);
      return scheduleDate.toISOString().split('T')[0] === dateStr;
    });

    // Trouver les complétions pour cette date
    const dayCompletions = completions.filter(completionId => {
      return completionId.startsWith(dateStr);
    });

    days.push({
      date,
      isCurrentMonth: true,
      quests: dayQuests,
      schedules: daySchedules,
      completions: dayCompletions
    });
  }

  return days;
};

export const QuestCalendar: React.FC<QuestCalendarProps> = ({
  userId,
  quests,
  userQuests,
  schedules,
  onSelectDate,
  onScheduleQuest,
  onViewQuest
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');

  const allQuests = [...quests, ...userQuests];

  // Récupérer les complétions (simulé, normalement viendrait de votre système)
  const completions: string[] = [];

  const monthData = useMemo(() => {
    return getMonthData(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      allQuests,
      schedules,
      completions
    );
  }, [currentDate, allQuests, schedules, completions]);

  const weekData = useMemo(() => {
    if (viewMode !== 'week') return [];

    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    const weekDays: CalendarDay[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      weekDays.push({
        date,
        isCurrentMonth: true,
        quests: allQuests.filter(quest => {
          if (!quest.timeLimit) return false;
          const questDate = new Date(date);
          questDate.setHours(0, 0, 0, 0);
          return questDate.toISOString().split('T')[0] === dateStr;
        }),
        schedules: schedules.filter(schedule => {
          const scheduleDate = new Date(schedule.scheduledDate);
          scheduleDate.setHours(0, 0, 0, 0);
          return scheduleDate.toISOString().split('T')[0] === dateStr;
        }),
        completions: completions.filter(completionId => {
          return completionId.startsWith(dateStr);
        })
      });
    }

    return weekDays;
  }, [currentDate, viewMode, allQuests, schedules, completions]);

  const dayData = useMemo(() => {
    if (viewMode !== 'day' || !selectedDate) return null;

    const dateStr = selectedDate.toISOString().split('T')[0];
    const dayQuests = allQuests.filter(quest => {
      if (!quest.timeLimit) return false;
      const questDate = new Date(selectedDate);
      questDate.setHours(0, 0, 0, 0);
      return questDate.toISOString().split('T')[0] === dateStr;
    });

    const daySchedules = schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.scheduledDate);
      scheduleDate.setHours(0, 0, 0, 0);
      return scheduleDate.toISOString().split('T')[0] === dateStr;
    });

    const dayCompletions = completions.filter(completionId => {
      return completionId.startsWith(dateStr);
    });

    return {
      date: selectedDate,
      quests: dayQuests,
      schedules: daySchedules,
      completions: dayCompletions
    };
  }, [selectedDate, viewMode, allQuests, schedules, completions]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + (direction === 'prev' ? -1 : 1));
    setCurrentDate(newDate);
  };

  const navigateToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    onSelectDate(date);
  };

  const handleScheduleClick = (quest: Quest | UserQuest, date: Date) => {
    onScheduleQuest(quest.id, date);
  };

  const renderCalendarDay = (day: CalendarDay) => {
    const dayHasQuests = day.quests.length > 0 || day.schedules.length > 0;
    const isToday = new Date().toDateString() === day.date.toDateString();
    const isSelected = selectedDate && selectedDate.toDateString() === day.date.toDateString();

    return (
      <div
        key={day.date.toISOString()}
        onClick={() => handleDateClick(day.date)}
        className={`min-h-[80px] p-2 border cursor-pointer transition-all hover:bg-gray-50 ${
          day.isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'
        } ${isToday ? 'border-blue-500 border-2' : 'border-gray-200'} ${
          isSelected ? 'ring-2 ring-blue-500' : ''
        }`}
      >
        <div className=\"flex justify-between items-start mb-1\">
          <span className={`text-sm font-medium ${isToday ? 'text-blue-600' : ''}`}>
            {day.date.getDate()}
          </span>
          {dayHasQuests && (
            <Badge variant=\"secondary\" className=\"text-xs\">
              {day.quests.length + day.schedules.length}
            </Badge>
          )}
        </div>

        {/* Quêtes prévues */}
        <div className=\"space-y-1\">
          {day.schedules.slice(0, 2).map(schedule => {
            const quest = allQuests.find(q => q.id === schedule.questId);
            if (!quest) return null;

            return (
              <div
                key={schedule.id}
                className=\"flex items-center gap-1 text-xs p-1 rounded bg-blue-50 border border-blue-200\"
                onClick={(e) => {
                  e.stopPropagation();
                  handleScheduleClick(quest, day.date);
                }}
              >
                <Calendar className=\"w-3 h-3\" />
                <span className=\"truncate\">{quest.title}</span>
              </div>
            );
          })}

          {/* Quêtes quotidiennes */}
          {day.quests.slice(0, 1).map(quest => (
            <div
              key={quest.id}
              className=\"flex items-center gap-1 text-xs p-1 rounded bg-green-50 border border-green-200\"
              onClick={(e) => {
                e.stopPropagation();
                onViewQuest(quest);
              }}
            >
              <Target className=\"w-3 h-3\" />
              <span className=\"truncate\">{quest.title}</span>
            </div>
          ))}

          {day.quests.length > 1 && (
            <div className=\"text-xs text-gray-500 ml-1\">
              +{day.quests.length - 1} de plus
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className=\"space-y-6\">
      {/* En-tête avec navigation */}
      <div className=\"flex justify-between items-center\">
        <div className=\"flex items-center gap-4\">
          <div className=\"flex items-center gap-2\">
            <Button variant=\"outline\" size=\"sm\" onClick={() => navigateMonth('prev')}>
              &lt;
            </Button>
            <h3 className=\"text-lg font-semibold\">
              {currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </h3>
            <Button variant=\"outline\" size=\"sm\" onClick={() => navigateMonth('next')}>
              &gt;
            </Button>
          </div>

          <Button variant=\"outline\" size=\"sm\" onClick={navigateToday}>
            Aujourd'hui
          </Button>
        </div>

        <div className=\"flex items-center gap-2\">
          <Select value={viewMode} onValueChange={(value) => setViewMode(value as 'month' | 'week' | 'day')}>
            <SelectTrigger className=\"w-32\">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value=\"month\">Mois</SelectItem>
              <SelectItem value=\"week\">Semaine</SelectItem>
              <SelectItem value=\"day\">Jour</SelectItem>
            </SelectContent>
          </Select>

          <Select>
            <SelectTrigger>
              <SelectValue placeholder=\"Filtre\" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value=\"all\">Toutes les quêtes</SelectItem>
              <SelectItem value=\"daily\">Quêtes journalières</SelectItem>
              <SelectItem value=\"weekly\">Quêtes hebdomadaires</SelectItem>
              <SelectItem value=\"monthly\">Quêtes mensuelles</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Vue mensuelle */}
      {viewMode === 'month' && (
        <>
          {/* En-tête de la semaine */}
          <div className=\"grid grid-cols-7 gap-1 mb-2\">
            {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(day => (
              <div key={day} className=\"text-center text-sm font-medium text-gray-600 py-2\">
                {day}
              </div>
            ))}
          </div>

          {/* Calendrier */}
          <div className=\"grid grid-cols-7 gap-1\">
            {monthData.map(renderCalendarDay)}
          </div>
        </>
      )}

      {/* Vue hebdomadaire */}
      {viewMode === 'week' && (
        <div className=\"grid grid-cols-7 gap-1\">
          {weekData.map(renderCalendarDay)}
        </div>
      )}

      {/* Vue quotidienne */}
      {viewMode === 'day' && dayData && (
        <div className=\"space-y-4\">
          <div className=\"flex justify-between items-center\">
            <h3 className=\"text-lg font-semibold\">
              {dayData.date.toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </h3>
            <Badge variant=\"secondary\">
              {dayData.quests.length + dayData.schedules.length} quêtes
            </Badge>
          </div>

          <div className=\"space-y-4\">
            {/* Quêtes prévues */}
            {dayData.schedules.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className=\"text-lg flex items-center gap-2\">
                    <Calendar className=\"w-5 h-5\" />
                    Quêtes prévues
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className=\"space-y-3\">
                    {dayData.schedules.map(schedule => {
                      const quest = allQuests.find(q => q.id === schedule.questId);
                      if (!quest) return null;

                      return (
                        <div key={schedule.id} className=\"flex items-center justify-between p-3 border rounded-lg\">
                          <div className=\"flex items-center gap-3\">
                            <div className=\"p-2 bg-blue-100 rounded-lg\">
                              <Calendar className=\"w-4 h-4 text-blue-600\" />
                            </div>
                            <div>
                              <h4 className=\"font-medium\">{quest.title}</h4>
                              <p className=\"text-sm text-gray-600\">{quest.description}</p>
                              <div className=\"flex gap-2 mt-1\">
                                <Badge className={getGranularityColor(quest.granularity)}>
                                  {quest.granularity}
                                </Badge>
                                <Badge variant=\"outline\">{quest.xpReward} XP</Badge>
                              </div>
                            </div>
                          </div>
                          <Button
                            size=\"sm\"
                            onClick={() => onViewQuest(quest)}
                          >
                            Voir
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quêtes quotidiennes */}
            {dayData.quests.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className=\"text-lg flex items-center gap-2\">
                    <Target className=\"w-5 h-5\" />
                    Quêtes quotidiennes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className=\"space-y-3\">
                    {dayData.quests.map(quest => (
                      <div key={quest.id} className=\"flex items-center justify-between p-3 border rounded-lg\">
                        <div className=\"flex items-center gap-3\">
                          <div className=\"p-2 bg-green-100 rounded-lg\">
                            <Target className=\"w-4 h-4 text-green-600\" />
                          </div>
                          <div>
                            <h4 className=\"font-medium\">{quest.title}</h4>
                            <p className=\"text-sm text-gray-600\">{quest.description}</p>
                            <div className=\"flex gap-2 mt-1\">
                              <Badge className={getGranularityColor(quest.granularity)}>
                                {quest.granularity}
                              </Badge>
                              <Badge variant=\"outline\">{quest.xpReward} XP</Badge>
                            </div>
                          </div>
                        </div>
                        <Button
                          size=\"sm\"
                          onClick={() => onViewQuest(quest)}
                        >
                          Commencer
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Complétions */}
            {dayData.completions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className=\"text-lg flex items-center gap-2\">
                    <CheckCircle className=\"w-5 h-5 text-green-600\" />
                    Complétions du jour
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className=\"space-y-2\">
                    {dayData.completions.map(completionId => {
                      const quest = allQuests.find(q => q.id === completionId);
                      if (!quest) return null;

                      return (
                        <div key={completionId} className=\"flex items-center gap-2 p-2 bg-green-50 rounded\">
                          <CheckCircle className=\"w-4 h-4 text-green-600\" />
                          <span className=\"text-sm\">{quest.title}</span>
                          <Badge variant=\"outline\" className=\"ml-auto\">{quest.xpReward} XP</Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
};