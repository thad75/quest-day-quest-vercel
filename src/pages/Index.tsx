import { useState, useEffect } from "react";
import { PlayerProgress, UserProfile } from "@/types/quest";
import { ProgressBar } from "@/components/ProgressBar";
import { CelebrationAnimation } from "@/components/CelebrationAnimation";
import { EnhancedQuestView } from "@/components/EnhancedQuestView";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Gamepad2, User, Sparkles, Clock } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="container max-w-6xl mx-auto p-6 space-y-8 relative">
        {/* Header */}
        <header className="relative">
          <div className="backdrop-blur-xl bg-card/30 rounded-3xl border border-border/50 shadow-[var(--shadow-card)] p-8">
            <div className="flex items-center justify-between">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-[var(--gradient-level)] rounded-2xl blur-lg opacity-50 animate-pulse" />
                    <div className="relative p-3 rounded-2xl bg-[var(--gradient-level)] shadow-[var(--shadow-glow)]">
                      <Gamepad2 className="h-12 w-12 text-primary-foreground" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-5xl font-black bg-[var(--gradient-level)] bg-clip-text text-transparent leading-tight">
                      Quêtes Quotidiennes
                    </h1>
                    <p className="text-xl text-muted-foreground mt-2">
                      Bonjour <span className="font-semibold text-primary">{username}</span> !
                    </p>
                    <p className="text-lg text-muted-foreground/80">
                      Complète tes quêtes et deviens un véritable héros ! ⚔️
                    </p>
                  </div>
                </div>

                {/* Stats rapides */}
                <div className="flex gap-4 pt-2">
                  <div className="px-4 py-2 rounded-xl bg-primary/10 border border-primary/20">
                    <p className="text-xs text-primary/80">Niveau</p>
                    <p className="text-lg font-bold text-primary">{progress.currentLevel}</p>
                  </div>
                  <div className="px-4 py-2 rounded-xl bg-accent/10 border border-accent/20">
                    <p className="text-xs text-accent/80">XP Totale</p>
                    <p className="text-lg font-bold text-accent">{profile.totalXP}</p>
                  </div>
                  <div className="px-4 py-2 rounded-xl bg-secondary/10 border border-secondary/20">
                    <p className="text-xs text-secondary/80">Quêtes</p>
                    <p className="text-lg font-bold text-secondary">{profile.totalQuestsCompleted}</p>
                  </div>
                  <div className="px-4 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20">
                    <p className="text-xs text-orange-500/80">🔥 Streak</p>
                    <p className="text-lg font-bold text-orange-500">{profile.currentStreak}</p>
                  </div>
                </div>
              </div>

              {/* Profile Button */}
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate("/profile")}
                className="h-16 w-16 rounded-2xl border-2 border-primary/30 hover:border-primary/60 hover:bg-primary/20 transition-all duration-300 shadow-[var(--shadow-glow)] hover:scale-105"
              >
                <span className="text-3xl">{getAvatarEmoji(avatar)}</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Progress */}
        <ProgressBar progress={progress} />

        {/* Enhanced Quest System */}
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Missions & Quêtes
              </h2>
              <p className="text-muted-foreground">
                Relevez des défis épiques pour progresser dans votre aventure !
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant={useEnhancedSystem ? "default" : "outline"}
                size="lg"
                onClick={() => setUseEnhancedSystem(true)}
                className="rounded-xl px-6 py-3 font-semibold transition-all duration-300 hover:scale-105"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Nouveau système
              </Button>
              <Button
                variant={!useEnhancedSystem ? "default" : "outline"}
                size="lg"
                onClick={() => setUseEnhancedSystem(false)}
                className="rounded-xl px-6 py-3 font-semibold transition-all duration-300 hover:scale-105"
              >
                <Clock className="h-4 w-4 mr-2" />
                Ancien système
              </Button>
            </div>
          </div>

          <div className="backdrop-blur-xl bg-card/20 rounded-3xl border border-border/30 shadow-[var(--shadow-card)] p-8">
            {useEnhancedSystem ? (
              <EnhancedQuestView
                profile={profile}
                onProgressUpdate={handleProgressUpdate}
              />
            ) : (
              <div className="text-center py-16 space-y-4">
                <div className="mx-auto w-24 h-24 rounded-2xl bg-muted/50 flex items-center justify-center">
                  <Clock className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-bold text-muted-foreground">
                  Ancien système désactivé
                </h3>
                <p className="text-lg text-muted-foreground/80 max-w-md mx-auto">
                  Découvrez le nouveau système multi-granularité avec des quêtes quotidiennes,
                  hebdomadaires, mensuelles et spéciales !
                </p>
                <Button
                  onClick={() => setUseEnhancedSystem(true)}
                  size="lg"
                  className="rounded-xl px-8 py-4 font-semibold bg-gradient-to-r from-primary to-secondary hover:scale-105 transition-all duration-300"
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  Essayer le nouveau système
                </Button>
              </div>
            )}
          </div>
        </section>
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
