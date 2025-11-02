import { useState, useEffect } from "react";
import { Quest, PlayerProgress } from "@/types/quest";
import { LevelSection } from "@/components/LevelSection";
import { ProgressBar } from "@/components/ProgressBar";
import { toast } from "sonner";
import { Gamepad2 } from "lucide-react";

const INITIAL_QUESTS: Quest[] = [
  // Niveau 1
  { id: "1-1", title: "Manger riz + bouillon + petit pois", level: 1, xp: 10, completed: false },
  { id: "1-2", title: "Ouvrir 2 boosters", level: 1, xp: 15, completed: false },
  { id: "1-3", title: "Nettoyer son bureau", level: 1, xp: 20, completed: false },
  
  // Niveau 2
  { id: "2-1", title: "Lancer bobby", level: 2, xp: 25, completed: false },
  { id: "2-2", title: "Boire 1 bouteille d'eau", level: 2, xp: 30, completed: false },
  { id: "2-3", title: "Laver ses cheveux", level: 2, xp: 25, completed: false },
  { id: "2-4", title: "Rédiger chapitre 2 (30%)", level: 2, xp: 50, completed: false },
  
  // Niveau 3
  { id: "3-1", title: "Aller à Auchan acheter de l'eau", level: 3, xp: 40, completed: false },
  { id: "3-2", title: "Faire 10 squats", level: 3, xp: 35, completed: false },
];

const STORAGE_KEY = "daily-quests";

const Index = () => {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [progress, setProgress] = useState<PlayerProgress>({
    currentLevel: 1,
    currentXP: 0,
    xpToNextLevel: 100,
  });

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      setQuests(data.quests || INITIAL_QUESTS);
      setProgress(data.progress || progress);
    } else {
      setQuests(INITIAL_QUESTS);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ quests, progress }));
  }, [quests, progress]);

  const handleToggleQuest = (id: string) => {
    setQuests((prev) => {
      const updated = prev.map((q) => {
        if (q.id === id) {
          const newCompleted = !q.completed;
          
          // Update XP
          if (newCompleted) {
            setProgress((p) => {
              const newXP = p.currentXP + q.xp;
              let newLevel = p.currentLevel;
              let remainingXP = newXP;
              let nextLevelXP = p.xpToNextLevel;

              // Level up logic
              while (remainingXP >= nextLevelXP) {
                remainingXP -= nextLevelXP;
                newLevel++;
                nextLevelXP = newLevel * 100; // Each level requires more XP
                
                toast.success(`🎉 Niveau ${newLevel} atteint !`, {
                  description: `Continue comme ça, champion !`,
                });
              }

              toast.success(`+${q.xp} XP !`, {
                description: q.title,
              });

              return {
                currentLevel: newLevel,
                currentXP: remainingXP,
                xpToNextLevel: nextLevelXP,
              };
            });
          } else {
            setProgress((p) => ({
              ...p,
              currentXP: Math.max(0, p.currentXP - q.xp),
            }));
          }

          return { ...q, completed: newCompleted };
        }
        return q;
      });
      return updated;
    });
  };

  const level1Quests = quests.filter(q => q.level === 1);
  const level2Quests = quests.filter(q => q.level === 2);
  const level3Quests = quests.filter(q => q.level === 3);

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-2 pt-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Gamepad2 className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-bold bg-[var(--gradient-level)] bg-clip-text text-transparent">
              Quêtes Quotidiennes
            </h1>
          </div>
          <p className="text-muted-foreground">
            Complète tes quêtes et gagne de l'XP pour monter de niveau !
          </p>
        </div>

        {/* Progress */}
        <ProgressBar progress={progress} />

        {/* Quests by Level */}
        <div className="space-y-8">
          <LevelSection
            level={1}
            quests={level1Quests}
            onToggleQuest={handleToggleQuest}
          />
          
          <LevelSection
            level={2}
            quests={level2Quests}
            onToggleQuest={handleToggleQuest}
          />
          
          <LevelSection
            level={3}
            quests={level3Quests}
            onToggleQuest={handleToggleQuest}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
