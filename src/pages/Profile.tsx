import { useState, useEffect } from "react";
import { UserProfile, Achievement } from "@/types/quest";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  User,
  Trophy,
  Flame,
  Target,
  Calendar,
  Star,
  Award,
  Zap,
  TrendingUp,
  ChevronRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_quest",
    title: "Première Quête",
    description: "Complétez votre première quête",
    icon: "🎯",
    category: "quest",
    isUnlocked: false
  },
  {
    id: "level_5",
    title: "Apprenti",
    description: "Atteignez le niveau 5",
    icon: "⭐",
    category: "level",
    isUnlocked: false
  },
  {
    id: "level_10",
    title: "Expérimenté",
    description: "Atteignez le niveau 10",
    icon: "🌟",
    category: "level",
    isUnlocked: false
  },
  {
    id: "streak_3",
    title: "Persévérance",
    description: "Maintenez une série de 3 jours",
    icon: "🔥",
    category: "streak",
    isUnlocked: false
  },
  {
    id: "streak_7",
    title: "Déterminé",
    description: "Maintenez une série de 7 jours",
    icon: "💪",
    category: "streak",
    isUnlocked: false
  },
  {
    id: "all_quests",
    title: "Parfait",
    description: "Complétez toutes les quêtes en un jour",
    icon: "🏆",
    category: "special",
    isUnlocked: false
  }
];

const STORAGE_KEY = "user-profile";

const Profile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile>({
    username: "Aventurier",
    totalXP: 0,
    currentLevel: 1,
    currentXP: 0,
    xpToNextLevel: 100,
    questsCompleted: 0,
    totalQuestsCompleted: 0,
    currentStreak: 0,
    longestStreak: 0,
    joinDate: new Date().toISOString(),
    lastActiveDate: new Date().toISOString(),
    achievements: INITIAL_ACHIEVEMENTS
  });

  // Load profile from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      setProfile(prev => ({
        ...prev,
        ...data,
        achievements: data.achievements || INITIAL_ACHIEVEMENTS
      }));
    }
  }, []);

  // Save profile to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  }, [profile]);

  // Sync with quest progress from main page
  useEffect(() => {
    const questData = localStorage.getItem("daily-quests");
    if (questData) {
      const data = JSON.parse(questData);
      const completedToday = data.quests?.filter((q: any) => q.completed).length || 0;

      setProfile(prev => ({
        ...prev,
        currentLevel: data.progress?.currentLevel || prev.currentLevel,
        currentXP: data.progress?.currentXP || prev.currentXP,
        xpToNextLevel: data.progress?.xpToNextLevel || prev.xpToNextLevel,
        totalXP: (data.progress?.currentLevel || 1) * 100 + (data.progress?.currentXP || 0),
        questsCompleted: completedToday
      }));
    }
  }, []);

  const getCategoryColor = (category: Achievement['category']) => {
    switch (category) {
      case 'level': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'streak': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'quest': return 'bg-green-100 text-green-800 border-green-200';
      case 'special': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getLevelTitle = (level: number) => {
    if (level >= 20) return "Légende";
    if (level >= 15) return "Maître";
    if (level >= 10) return "Expert";
    if (level >= 5) return "Apprenti";
    return "Débutant";
  };

  const progressPercentage = (profile.currentXP / profile.xpToNextLevel) * 100;
  const unlockedAchievements = profile.achievements.filter(a => a.isUnlocked).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="flex items-center gap-2"
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
            Retour aux quêtes
          </Button>

          <div className="text-center">
            <h1 className="text-3xl font-bold">Profil</h1>
            <p className="text-muted-foreground">Vos statistiques et accomplissements</p>
          </div>

          <div className="w-20" /> {/* Spacer for centering */}
        </div>

        {/* Profile Overview Card */}
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-600 opacity-10" />
          <CardHeader className="relative">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
                <User className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl">{profile.username}</CardTitle>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Badge variant="outline" className="bg-gradient-to-r from-purple-100 to-pink-100">
                    Niveau {profile.currentLevel} - {getLevelTitle(profile.currentLevel)}
                  </Badge>
                  <span className="text-sm">
                    Membre depuis {new Date(profile.joinDate).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="relative space-y-6">
            {/* Level Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Progression du niveau</span>
                <span className="text-muted-foreground">
                  {profile.currentXP} / {profile.xpToNextLevel} XP
                </span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Niveau {profile.currentLevel}</span>
                <span>Niveau {profile.currentLevel + 1}</span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex flex-col items-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                <Star className="h-6 w-6 text-blue-600 mb-2" />
                <span className="text-2xl font-bold text-blue-800">{profile.totalXP}</span>
                <span className="text-sm text-blue-600">XP Total</span>
              </div>

              <div className="flex flex-col items-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                <Target className="h-6 w-6 text-green-600 mb-2" />
                <span className="text-2xl font-bold text-green-800">{profile.totalQuestsCompleted}</span>
                <span className="text-sm text-green-600">Quêtes Totales</span>
              </div>

              <div className="flex flex-col items-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                <Flame className="h-6 w-6 text-orange-600 mb-2" />
                <span className="text-2xl font-bold text-orange-800">{profile.currentStreak}</span>
                <span className="text-sm text-orange-600">Série Actuelle</span>
              </div>

              <div className="flex flex-col items-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                <Trophy className="h-6 w-6 text-purple-600 mb-2" />
                <span className="text-2xl font-bold text-purple-800">{profile.longestStreak}</span>
                <span className="text-sm text-purple-600">Meilleure Série</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Today's Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Aujourd'hui
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  <span className="font-medium">Quêtes complétées aujourd'hui</span>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                  {profile.questsCompleted} / 9
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                Dernière activité: {new Date(profile.lastActiveDate).toLocaleString('fr-FR')}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Succès
              </div>
              <Badge variant="outline">
                {unlockedAchievements} / {profile.achievements.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profile.achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                    achievement.isUnlocked
                      ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200'
                      : 'bg-gray-50 border-gray-200 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{achievement.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-medium ${
                          achievement.isUnlocked ? 'text-gray-900' : 'text-gray-500'
                        }`}>
                          {achievement.title}
                        </h3>
                        <Badge
                          variant="outline"
                          className={`text-xs ${getCategoryColor(achievement.category)}`}
                        >
                          {achievement.category}
                        </Badge>
                      </div>
                      <p className={`text-sm ${
                        achievement.isUnlocked ? 'text-gray-700' : 'text-gray-400'
                      }`}>
                        {achievement.description}
                      </p>
                      {achievement.isUnlocked && achievement.unlockedAt && (
                        <p className="text-xs text-gray-500 mt-1">
                          Débloqué le {new Date(achievement.unlockedAt).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </div>
                    {achievement.isUnlocked && (
                      <TrendingUp className="h-4 w-4 text-green-600 flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;