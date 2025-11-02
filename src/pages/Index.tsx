import { useState, useEffect } from "react";
import { PlayerProgress, UserProfile } from "@/types/quest";
import { ProgressBar } from "@/components/ProgressBar";
import { CelebrationAnimation } from "@/components/CelebrationAnimation";
import { EnhancedQuestView } from "@/components/EnhancedQuestView";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Gamepad2, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getAvatarEmoji } from "@/components/ProfileEditor";
import QuestManager from "@/lib/quest-manager";

const STORAGE_KEY = "daily-quests"; // Legacy storage key for migration
const CELEBRATION_KEY = "daily-celebration";
const PROFILE_KEY = "user-profile";

const Index = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState<PlayerProgress>({
    currentLevel: 1,
    currentXP: 0,
    xpToNextLevel: 100,
  });
  const [showCelebration, setShowCelebration] = useState(false);
  const [hasCelebratedToday, setHasCelebratedToday] = useState(false);
  const [username, setUsername] = useState("Aventurier");
  const [avatar, setAvatar] = useState("default");
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
    achievements: []
  });
  const [useEnhancedSystem, setUseEnhancedSystem] = useState(true); // Toggle for migration
  const questManager = QuestManager;

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const savedCelebration = localStorage.getItem(CELEBRATION_KEY);

    if (saved) {
      const data = JSON.parse(saved);
      setProgress(data.progress || progress);
    }

    if (savedCelebration) {
      const celebrationData = JSON.parse(savedCelebration);
      const today = new Date().toDateString();
      if (celebrationData.date === today) {
        setHasCelebratedToday(celebrationData.celebrated);
      }
    }

    // Load username and avatar from profile
    const savedProfile = localStorage.getItem(PROFILE_KEY);
    if (savedProfile) {
      const profileData = JSON.parse(savedProfile);
      setUsername(profileData.username || "Aventurier");
      setAvatar(profileData.avatar || "default");
      setProfile(prev => ({
        ...prev,
        ...profileData
      }));
      setProgress(prev => ({
        ...prev,
        currentLevel: profileData.currentLevel || prev.currentLevel,
        currentXP: profileData.currentXP || prev.currentXP,
        xpToNextLevel: profileData.xpToNextLevel || prev.xpToNextLevel
      }));
    }

    // Check if we should migrate existing quests
    if (saved && !localStorage.getItem('enhanced-daily-quests')) {
      try {
        const oldQuests = JSON.parse(saved);
        if (oldQuests.quests && Array.isArray(oldQuests.quests)) {
          questManager.migrateExistingQuests(oldQuests.quests);
        }
      } catch (error) {
        console.error('Error migrating quests:', error);
      }
    }
  }, []);

  const handleProgressUpdate = (xpGained: number, newLevel?: number) => {
    setProgress(prev => {
      const newXP = prev.currentXP + xpGained;
      let newCurrentLevel = prev.currentLevel;
      let remainingXP = newXP;
      let nextLevelXP = prev.xpToNextLevel;

      // Level up logic
      while (remainingXP >= nextLevelXP) {
        remainingXP -= nextLevelXP;
        newCurrentLevel++;
        nextLevelXP = newCurrentLevel * 100;
      }

      // Update profile
      setProfile(prev => ({
        ...prev,
        currentLevel: newCurrentLevel,
        currentXP: remainingXP,
        xpToNextLevel: nextLevelXP,
        totalXP: prev.totalXP + xpGained,
        questsCompleted: prev.questsCompleted + (xpGained > 0 ? 1 : 0),
        lastActiveDate: new Date().toISOString()
      }));

      return {
        currentLevel: newCurrentLevel,
        currentXP: remainingXP,
        xpToNextLevel: nextLevelXP
      };
    });
  };

  // Save profile to localStorage
  useEffect(() => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  }, [profile]);

  // Save celebration state to localStorage
  useEffect(() => {
    localStorage.setItem(
      CELEBRATION_KEY,
      JSON.stringify({
        date: new Date().toDateString(),
        celebrated: hasCelebratedToday,
      })
    );
  }, [hasCelebratedToday]);

  const handleCelebrationComplete = () => {
    setShowCelebration(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between pt-8">
          <div className="text-center flex-1 space-y-2">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Gamepad2 className="h-10 w-10 text-primary" />
              <h1 className="text-4xl font-bold bg-[var(--gradient-level)] bg-clip-text text-transparent">
                Quêtes Quotidiennes
              </h1>
            </div>
            <p className="text-muted-foreground">
              Bonjour {username} ! Complète tes quêtes et gagne de l'XP pour monter de niveau !
            </p>
          </div>

          {/* Profile Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/profile")}
            className="h-12 w-12 rounded-full border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/10 transition-all duration-300"
          >
            <span className="text-2xl">{getAvatarEmoji(avatar)}</span>
          </Button>
        </div>

        {/* Progress */}
        <ProgressBar progress={progress} />

        {/* Enhanced Quest System */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Quêtes Multi-Granularité</h2>
            <div className="flex items-center gap-2">
              <Button
                variant={useEnhancedSystem ? "default" : "outline"}
                size="sm"
                onClick={() => setUseEnhancedSystem(true)}
              >
                Nouveau système
              </Button>
              <Button
                variant={!useEnhancedSystem ? "default" : "outline"}
                size="sm"
                onClick={() => setUseEnhancedSystem(false)}
              >
                Ancien système
              </Button>
            </div>
          </div>

          {useEnhancedSystem ? (
            <EnhancedQuestView
              profile={profile}
              onProgressUpdate={handleProgressUpdate}
            />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Ancien système désactivé</p>
              <p className="text-sm">Utilisez le nouveau système multi-granularité</p>
            </div>
          )}
        </div>
      </div>

      {/* Celebration Animation */}
      <CelebrationAnimation
        isVisible={showCelebration}
        onComplete={handleCelebrationComplete}
      />
    </div>
  );
};

export default Index;
