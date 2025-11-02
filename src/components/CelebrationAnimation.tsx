import { useEffect, useState } from "react";
import { confetti } from "tsparticles-confetti";
import { Trophy, Sparkles, Star } from "lucide-react";

interface CelebrationAnimationProps {
  isVisible: boolean;
  onComplete: () => void;
}

export const CelebrationAnimation = ({ isVisible, onComplete }: CelebrationAnimationProps) => {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Trigger confetti animation
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      const interval: NodeJS.Timeout = setInterval(function () {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);

        // Left side confetti
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        });

        // Right side confetti
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        });
      }, 250);

      // Show content after a short delay
      setTimeout(() => setShowContent(true), 300);

      // Hide after animation completes
      setTimeout(() => {
        setShowContent(false);
        setTimeout(() => onComplete(), 300);
      }, duration);

      return () => clearInterval(interval);
    }
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          showContent ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Celebration Content */}
      <div
        className={`relative z-10 text-center transition-all duration-500 transform ${
          showContent
            ? 'scale-100 opacity-100 translate-y-0'
            : 'scale-50 opacity-0 translate-y-8'
        }`}
      >
        <div className="bg-gradient-to-br from-yellow-400 via-orange-500 to-purple-600 p-1 rounded-2xl shadow-2xl">
          <div className="bg-background rounded-2xl p-8 space-y-6">
            {/* Animated Trophy */}
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full blur-xl opacity-50 animate-pulse" />
              <Trophy className="relative h-24 w-24 text-yellow-500 animate-bounce" />
            </div>

            {/* Success Text */}
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-purple-600 bg-clip-text text-transparent">
                Mission Accomplie !
              </h1>
              <p className="text-xl text-muted-foreground">
                Toutes les quêtes quotidiennes sont terminées
              </p>
            </div>

            {/* Animated Icons */}
            <div className="flex justify-center gap-4">
              <Sparkles className="h-8 w-8 text-yellow-400 animate-spin" />
              <Star className="h-8 w-8 text-orange-500 animate-pulse" />
              <Sparkles className="h-8 w-8 text-purple-600 animate-spin" />
            </div>

            {/* Bonus XP Indicator */}
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full shadow-lg">
              <span className="text-lg font-bold">+100 XP BONUS</span>
              <Star className="h-5 w-5 fill-current" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};