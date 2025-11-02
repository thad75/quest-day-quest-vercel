import React, { useState, useEffect } from 'react';
import { QuestSystemIntegration } from '@/lib/quest-integration';
import { QuestScheduler } from '@/lib/quest-scheduler';
import { QuestProgressionSystem } from '@/lib/quest-progression';
import { SpecialQuestsManager } from '@/lib/special-quests';
import { questStorage } from '@/lib/storage-strategy';
import {
  Quest,
  QuestSystemState,
  PlayerProgress,
  UserProfile,
  QuestGranularity
} from '@/types/enhanced-quest';

// Comprehensive usage example for the enhanced quest system
export function QuestSystemExample() {
  const [questSystemIntegration] = useState(() => QuestSystemIntegration.getInstance());
  const [questScheduler] = useState(() => QuestScheduler.getInstance());
  const [specialQuestsManager] = useState(() => SpecialQuestsManager.getInstance());

  const [questSystemState, setQuestSystemState] = useState<QuestSystemState | null>(null);
  const [playerProgress, setPlayerProgress] = useState<PlayerProgress | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize the quest system
  useEffect(() => {
    const initializeQuestSystem = async () => {
      try {
        setIsLoading(true);

        // Load existing data or migrate from old system
        const savedData = await questStorage.loadQuestData();

        if (savedData.success && savedData.questSystemState) {
          // Load existing enhanced quest system data
          setQuestSystemState(savedData.questSystemState);
          setPlayerProgress(savedData.playerProgress);
          setUserProfile(savedData.userProfile);
        } else {
          // Migrate from old system or create new profile
          await migrateOrCreateNewProfile();
        }

        // Check for daily reset and generate new quests if needed
        if (userProfile) {
          const resetResult = await questSystemIntegration.handleDailyReset(userProfile);
          if (resetResult.newQuests.length > 0) {
            console.log('New quests generated:', resetResult.newQuests.length);
          }
        }

      } catch (error) {
        console.error('Error initializing quest system:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeQuestSystem();
  }, []);

  const migrateOrCreateNewProfile = async () => {
    // Try to migrate from old system
    const oldQuests = localStorage.getItem('daily-quests');
    const oldProfile = localStorage.getItem('user-profile');

    if (oldQuests && oldProfile) {
      try {
        const questData = JSON.parse(oldQuests);
        const profileData = JSON.parse(oldProfile);

        const migrationResult = questSystemIntegration.migrateFromOldSystem(
          questData.quests || [],
          questData.progress || { currentLevel: 1, currentXP: 0, xpToNextLevel: 100 },
          profileData
        );

        setQuestSystemState(migrationResult.newQuestSystemState);
        setPlayerProgress(migrationResult.newPlayerProgress);
        setUserProfile(migrationResult.newProfile);

        // Save migrated data
        await questStorage.saveQuestData({
          questSystemState: migrationResult.newQuestSystemState,
          playerProgress: migrationResult.newPlayerProgress,
          userProfile: migrationResult.newProfile
        });

        console.log('Successfully migrated from old quest system');
      } catch (error) {
        console.error('Migration failed, creating new profile:', error);
        createNewProfile();
      }
    } else {
      createNewProfile();
    }
  };

  const createNewProfile = () => {
    // Create a new profile with default values
    const newProfile: UserProfile = {
      username: 'Aventurier',
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
      questStats: {
        totalDailyCompleted: 0,
        totalWeeklyCompleted: 0,
        totalMonthlyCompleted: 0,
        totalSpecialCompleted: 0,
        averageDailyCompletion: 0,
        bestDay: new Date().toISOString().split('T')[0],
        favoriteCategories: ['health', 'personal', 'mindfulness'],
        completionRateByCategory: {
          health: 0,
          fitness: 0,
          work: 0,
          personal: 0,
          social: 0,
          learning: 0,
          creativity: 0,
          mindfulness: 0
        }
      },
      achievements: []
    };

    const newProgress: PlayerProgress = {
      currentLevel: 1,
      currentXP: 0,
      xpToNextLevel: 100,
      totalXP: 0,
      questsCompleted: {
        daily: 0,
        weekly: 0,
        monthly: 0,
        special: 0,
        total: 0
      },
      averageCompletionTime: 0,
      favoriteCategory: 'personal',
      strongestCategory: 'personal',
      streaks: {
        daily: 0,
        weekly: 0,
        monthly: 0,
        longestDaily: 0,
        longestWeekly: 0,
        longestMonthly: 0
      }
    };

    setUserProfile(newProfile);
    setPlayerProgress(newProgress);
    setQuestSystemState(questScheduler.getState());
  };

  // Handle quest completion
  const handleQuestCompletion = async (questId: string) => {
    if (!userProfile || !playerProgress) return;

    try {
      const completionResult = await questSystemIntegration.handleQuestCompletion(
        questId,
        userProfile,
        playerProgress
      );

      // Update state
      setPlayerProgress(completionResult.updatedProgress);
      setUserProfile(completionResult.updatedProfile);

      // Update quest state
      if (questSystemState) {
        const updatedQuests = questSystemState.activeQuests.map(quest =>
          quest.id === questId ? { ...quest, completed: true, completedAt: new Date().toISOString() } : quest
        );

        setQuestSystemState({
          ...questSystemState,
          activeQuests: updatedQuests
        });
      }

      // Save to storage
      await questStorage.saveQuestData({
        questSystemState: questSystemState!,
        playerProgress: completionResult.updatedProgress,
        userProfile: completionResult.updatedProfile
      });

      // Show notifications for rewards
      if (completionResult.levelUp) {
        console.log(`🎉 Level up! You're now level ${completionResult.updatedProgress.currentLevel}`);
      }

      if (completionResult.rewards.achievements.length > 0) {
        console.log(`🏆 New achievements: ${completionResult.rewards.achievements.join(', ')}`);
      }

      if (completionResult.rewards.bonusXP > 0) {
        console.log(`⭐ Bonus XP: +${completionResult.rewards.bonusXP}`);
      }

    } catch (error) {
      console.error('Error completing quest:', error);
    }
  };

  // Get dashboard data
  const getDashboardData = () => {
    if (!userProfile) return null;

    return questSystemIntegration.getQuestDashboardData(userProfile);
  };

  // Manual quest reset (for testing)
  const handleManualReset = async () => {
    if (!userProfile) return;

    try {
      const resetResult = await questSystemIntegration.handleDailyReset(userProfile);

      if (resetResult.newQuests.length > 0) {
        console.log('Manual reset completed. New quests:', resetResult.newQuests.length);
        if (resetResult.celebrationMessage) {
          console.log('🎊', resetResult.celebrationMessage);
        }

        // Update state
        if (questSystemState) {
          setQuestSystemState({
            ...questSystemState,
            activeQuests: [...questSystemState.activeQuests, ...resetResult.newQuests]
          });
        }
      }
    } catch (error) {
      console.error('Error during manual reset:', error);
    }
  };

  // Create backup
  const handleCreateBackup = async () => {
    try {
      const backupResult = await questStorage.createBackup();

      if (backupResult.success) {
        console.log(`✅ Backup created: ${backupResult.backupId}`);
      } else {
        console.error('❌ Backup failed:', backupResult.error);
      }
    } catch (error) {
      console.error('Error creating backup:', error);
    }
  };

  // Get storage info
  const getStorageInfo = () => {
    return questStorage.getStorageInfo();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Chargement du système de quêtes...</p>
        </div>
      </div>
    );
  }

  const dashboardData = getDashboardData();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Système de Quêtes Avancé</h1>
        <p className="text-gray-600">
          Exemple d'implémentation du nouveau système de quêtes multi-granularité
        </p>
      </div>

      {/* User Info */}
      {userProfile && playerProgress && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Profil du Joueur</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Niveau</p>
              <p className="text-2xl font-bold text-blue-600">{playerProgress.currentLevel}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">XP Total</p>
              <p className="text-2xl font-bold text-green-600">{playerProgress.totalXP}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Série Actuelle</p>
              <p className="text-2xl font-bold text-orange-600">{userProfile.currentStreak} jours</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Quêtes Totales</p>
              <p className="text-2xl font-bold text-purple-600">{userProfile.totalQuestsCompleted}</p>
            </div>
          </div>
        </div>
      )}

      {/* Quest Progress */}
      {dashboardData && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Progression des Quêtes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(dashboardData.questProgress).map(([granularity, progress]) => (
              <div key={granularity} className="text-center">
                <h3 className="font-medium capitalize mb-2">
                  {granularity === 'daily' ? 'Quotidiennes' :
                   granularity === 'weekly' ? 'Hebdomadaires' :
                   granularity === 'monthly' ? 'Mensuelles' : 'Spéciales'}
                </h3>
                <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold inline-block text-blue-600">
                        {progress.completed}/{progress.total}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold inline-block text-blue-600">
                        {progress.percentage}%
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                    <div
                      style={{ width: `${progress.percentage}%` }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Quests */}
      {dashboardData && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Quêtes Actives</h2>
          <div className="space-y-3">
            {dashboardData.activeQuests.slice(0, 6).map((quest) => (
              <div
                key={quest.id}
                className={`border rounded-lg p-4 ${
                  quest.completed
                    ? 'bg-green-50 border-green-200'
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{quest.icon}</span>
                      <h3 className={`font-medium ${quest.completed ? 'line-through text-gray-500' : ''}`}>
                        {quest.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="capitalize">
                        {quest.granularity === 'daily' ? 'Quotidien' :
                         quest.granularity === 'weekly' ? 'Hebdomadaire' :
                         quest.granularity === 'monthly' ? 'Mensuel' : 'Spécial'}
                      </span>
                      <span>Difficulté: {quest.difficulty}/5</span>
                      <span>XP: {quest.xp}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleQuestCompletion(quest.id)}
                    disabled={quest.completed}
                    className={`px-4 py-2 rounded font-medium transition-colors ${
                      quest.completed
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    {quest.completed ? 'Complété' : 'Compléter'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {dashboardData && dashboardData.recommendations.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Recommandations</h2>
          <ul className="space-y-2">
            {dashboardData.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-center gap-2">
                <span className="text-blue-500">💡</span>
                <span>{recommendation}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Control Panel */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Panneau de Contrôle</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleManualReset}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          >
            Réinitialiser Manuellement
          </button>
          <button
            onClick={handleCreateBackup}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
          >
            Créer une Sauvegarde
          </button>
          <button
            onClick={() => console.log(getStorageInfo())}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            Infos Stockage (Console)
          </button>
        </div>
      </div>

      {/* Storage Info */}
      <div className="bg-gray-100 rounded-lg p-4 text-sm">
        <h3 className="font-semibold mb-2">Informations de Stockage</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <span className="text-gray-600">Mode:</span>
            <span className="ml-2 font-medium">{getStorageInfo().mode}</span>
          </div>
          <div>
            <span className="text-gray-600">User ID:</span>
            <span className="ml-2 font-medium">{getStorageInfo().userId?.slice(0, 12)}...</span>
          </div>
          <div>
            <span className="text-gray-600">LocalStorage:</span>
            <span className="ml-2 font-medium">{Math.round(getStorageInfo().localStorageSize / 1024)}KB</span>
          </div>
          <div>
            <span className="text-gray-600">Backup:</span>
            <span className="ml-2 font-medium">{getStorageInfo().hasBackup ? '✅' : '❌'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Usage instructions and best practices
export const QUEST_SYSTEM_USAGE_GUIDE = {
  installation: `
1. Installation des dépendances:
   npm install @vercel/kv  # Pour Vercel KV en production
   # ou
   npm install firebase    # Pour Firebase en alternative

2. Configuration des variables d'environnement:
   VERCEL_KV_REST_API_URL=votre_kv_url
   VERCEL_KV_REST_API_TOKEN=votre_kv_token
   # ou
   FIREBASE_CONFIG=votre_config_firebase
`,

  initialization: `
// Initialisation du système de quêtes
import { QuestSystemIntegration } from '@/lib/quest-integration';

const questSystem = QuestSystemIntegration.getInstance();

// Migration depuis l'ancien système
const oldQuests = JSON.parse(localStorage.getItem('daily-quests') || '[]');
const oldProfile = JSON.parse(localStorage.getItem('user-profile') || '{}');

const migrationResult = questSystem.migrateFromOldSystem(
  oldQuests.quests || [],
  oldQuests.progress || { currentLevel: 1, currentXP: 0, xpToNextLevel: 100 },
  oldProfile
);
`,

  questCompletion: `
// Gestion de la complétion de quête
const handleQuestCompletion = async (questId: string) => {
  const result = await questSystem.handleQuestCompletion(
    questId,
    userProfile,
    playerProgress
  );

  // Gérer les récompenses
  if (result.levelUp) {
    showNotification(`🎉 Niveau ${result.updatedProgress.currentLevel} atteint!`);
  }

  if (result.rewards.achievements.length > 0) {
    showNotification(`🏆 Nouveaux succès: ${result.rewards.achievements.join(', ')}`);
  }

  // Sauvegarder les données
  await questStorage.saveQuestData({
    questSystemState,
    playerProgress: result.updatedProgress,
    userProfile: result.updatedProfile
  });
};
`,

  dailyReset: `
// Gestion de la réinitialisation quotidienne
const handleDailyReset = async () => {
  const resetResult = await questSystem.handleDailyReset(userProfile);

  if (resetResult.newQuests.length > 0) {
    showNotification('Nouvelles quêtes disponibles!');

    if (resetResult.celebrationMessage) {
      showCelebration(resetResult.celebrationMessage);
    }

    // Mettre à jour l'interface
    updateQuestList(resetResult.newQuests);
  }
};
`,

  bestPractices: `
1. Sauvegarde régulière:
   - Créez des sauvegardes automatiques chaque jour
   - Utilisez le mode hybride pour la redondance

2. Gestion des erreurs:
   - Toujours vérifier le succès des opérations de stockage
   - Fournir des solutions de repli (fallback)

3. Performance:
   - Chargez les données de manière asynchrone
   - Utilisez le cache pour les données fréquemment accédées

4. Expérience utilisateur:
   - Affichez des notifications pour les récompenses
   - Montrez la progression en temps réel
   - Proposez des recommandations personnalisées

5. Sécurité:
   - Validez toujours les données côté serveur
   - Utilisez des clés de stockage uniques par utilisateur
   - Implémentez des limites de taux pour les appels API
`
};