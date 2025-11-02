import { PlayerProgress } from "@/types/quest";
import { Progress } from "@/components/ui/progress";
import { Sparkles } from "lucide-react";

interface ProgressBarProps {
  progress: PlayerProgress;
}

export const ProgressBar = ({ progress }: ProgressBarProps) => {
  const percentage = (progress.currentXP / progress.xpToNextLevel) * 100;
  
  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-card/50 backdrop-blur-sm p-6 shadow-[var(--shadow-card)]">
      <div className="absolute inset-0 bg-[var(--gradient-quest)] opacity-20" />
      
      <div className="relative space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-[var(--gradient-level)] rounded-full blur-md" />
              <div className="relative flex items-center justify-center h-16 w-16 rounded-full bg-[var(--gradient-level)] shadow-[var(--shadow-glow)]">
                <Sparkles className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Niveau Actuel</p>
              <p className="text-3xl font-bold bg-[var(--gradient-level)] bg-clip-text text-transparent">
                {progress.currentLevel}
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-sm text-muted-foreground">XP Totale</p>
            <p className="text-2xl font-bold text-accent">
              {progress.currentXP}/{progress.xpToNextLevel}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Progress 
            value={percentage} 
            className="h-3 bg-muted"
          />
          <p className="text-xs text-center text-muted-foreground">
            {Math.round(percentage)}% jusqu'au niveau {progress.currentLevel + 1}
          </p>
        </div>
      </div>
    </div>
  );
};
