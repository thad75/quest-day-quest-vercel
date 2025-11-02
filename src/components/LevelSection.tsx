import { Quest } from "@/types/quest";
import { QuestCard } from "./QuestCard";
import { Trophy } from "lucide-react";

interface LevelSectionProps {
  level: number;
  quests: Quest[];
  onToggleQuest: (id: string) => void;
}

export const LevelSection = ({ level, quests, onToggleQuest }: LevelSectionProps) => {
  const completedCount = quests.filter(q => q.completed).length;
  const totalQuests = quests.length;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="absolute inset-0 bg-[var(--gradient-level)] rounded-full blur-md opacity-50" />
          <div className="relative flex items-center justify-center h-14 w-14 rounded-full bg-[var(--gradient-level)] shadow-[var(--shadow-glow)]">
            <Trophy className="h-7 w-7 text-primary-foreground" />
          </div>
        </div>
        
        <div>
          <h2 className="text-2xl font-bold bg-[var(--gradient-level)] bg-clip-text text-transparent">
            Niveau {level}
          </h2>
          <p className="text-sm text-muted-foreground">
            {completedCount}/{totalQuests} quêtes complétées
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {quests.map((quest) => (
          <QuestCard
            key={quest.id}
            quest={quest}
            onToggle={onToggleQuest}
          />
        ))}
      </div>
    </div>
  );
};
