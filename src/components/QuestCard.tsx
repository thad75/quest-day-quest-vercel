import { Quest } from "@/types/quest";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuestCardProps {
  quest: Quest;
  onToggle: (id: string) => void;
}

export const QuestCard = ({ quest, onToggle }: QuestCardProps) => {
  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-300 hover:scale-[1.02]",
        quest.completed
          ? "bg-success/20 border-success"
          : "bg-card/50 backdrop-blur-sm border-primary/20",
        "shadow-[0_8px_32px_hsl(0_0%_0%_/_0.4)]"
      )}
    >
      <div className="absolute inset-0 bg-[var(--gradient-quest)] opacity-30" />
      
      <div className="relative p-4 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onToggle(quest.id)}
          className={cn(
            "h-10 w-10 rounded-full transition-all duration-300",
            quest.completed
              ? "bg-success text-success-foreground hover:bg-success/80"
              : "border-2 border-primary hover:bg-primary/20"
          )}
        >
          {quest.completed && <Check className="h-5 w-5" />}
        </Button>

        <div className="flex-1">
          <p
            className={cn(
              "text-base font-medium transition-all duration-300",
              quest.completed && "line-through opacity-60"
            )}
          >
            {quest.title}
          </p>
        </div>

        <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-accent/20 border border-accent/30">
          <Star className="h-4 w-4 fill-accent text-accent" />
          <span className="text-sm font-bold text-accent">{quest.xp}</span>
        </div>
      </div>
    </Card>
  );
};
