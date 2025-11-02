import { PlayerProgress } from "@/types/quest";
import { Progress } from "@/components/ui/progress";
import { Sparkles } from "lucide-react";

interface ProgressBarProps {
  progress: PlayerProgress;
}

export const ProgressBar = ({ progress }: ProgressBarProps) => {
  const percentage = (progress.currentXP / progress.xpToNextLevel) * 100;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-card/30 backdrop-blur-xl p-8 shadow-[var(--shadow-card)] transition-all duration-500 hover:shadow-[var(--shadow-glow)]">
      {/* Animated background */}
      <div className="absolute inset-0 bg-[var(--gradient-quest)] opacity-10 animate-pulse" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-secondary/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="relative space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-[var(--gradient-level)] rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300 animate-pulse" />
              <div className="relative flex items-center justify-center h-20 w-20 rounded-2xl bg-[var(--gradient-level)] shadow-[var(--shadow-glow)] transition-transform duration-300 group-hover:scale-110">
                <Sparkles className="h-10 w-10 text-primary-foreground animate-spin-slow" />
              </div>
              {/* Level up indicator */}
              {percentage >= 90 && (
                <div className="absolute -top-2 -right-2">
                  <div className="relative">
                    <div className="absolute inset-0 bg-yellow-400 rounded-full blur-lg animate-pulse" />
                    <div className="relative bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                      ⚡ LV UP
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Niveau Actuel</p>
              <p className="text-4xl font-black bg-[var(--gradient-level)] bg-clip-text text-transparent leading-none">
                {progress.currentLevel}
              </p>
              <div className="flex items-center gap-2">
                <div className="h-1 w-8 bg-primary/30 rounded-full overflow-hidden">
                  <div className="h-full w-full bg-gradient-to-r from-primary to-secondary animate-pulse" />
                </div>
                <span className="text-xs text-muted-foreground">Prochain niveau</span>
                <div className="h-1 w-8 bg-primary/30 rounded-full overflow-hidden">
                  <div className="h-full w-full bg-gradient-to-r from-secondary to-primary animate-pulse" />
                </div>
              </div>
            </div>
          </div>

          <div className="text-right space-y-1">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Progression XP</p>
            <div className="text-3xl font-black">
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {progress.currentXP}
              </span>
              <span className="text-xl text-muted-foreground">/{progress.xpToNextLevel}</span>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30">
                {Math.round(percentage)}% complété
              </span>
            </div>
          </div>
        </div>

        {/* Enhanced Progress Bar */}
        <div className="space-y-3">
          <div className="relative h-4 bg-muted/50 rounded-full overflow-hidden shadow-inner">
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 animate-pulse" />

            {/* Progress fill with gradient */}
            <div
              className="h-full relative overflow-hidden transition-all duration-1000 ease-out"
              style={{ width: `${percentage}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-accent animate-shimmer" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20 animate-pulse" />

              {/* Animated particles */}
              <div className="absolute inset-0 flex items-center">
                <div className="w-full h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-slide-right" />
              </div>
            </div>

            {/* XP milestone markers */}
            {[25, 50, 75].map((milestone) => (
              <div
                key={milestone}
                className="absolute top-1/2 transform -translate-y-1/2 w-0.5 h-3 bg-background/80 z-10"
                style={{ left: `${milestone}%` }}
              />
            ))}
          </div>

          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {progress.xpToNextLevel - progress.currentXP} XP restants
            </p>
            <p className="text-sm font-medium text-primary">
              Niveau {progress.currentLevel + 1} 🎯
            </p>
          </div>
        </div>

        {/* Level progress animation */}
        {percentage >= 100 && (
          <div className="text-center py-4">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-success to-emerald-500 text-white rounded-full font-bold animate-bounce shadow-lg">
              <Trophy className="h-5 w-5" />
              NIVEAU SUPÉRIEUR ATTEINT !
              <Zap className="h-5 w-5" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
