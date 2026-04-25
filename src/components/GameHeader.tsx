import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { StreakBadge } from './StreakBadge';

interface GameHeaderProps {
  current: number;
  total: number;
  streak: number;
  sessionXP: number;
  onExit?: () => void;
}

export function GameHeader({ current, total, streak, sessionXP, onExit }: GameHeaderProps) {
  const navigate = useNavigate();
  const percent = total > 0 ? Math.round((current / total) * 100) : 0;

  function handleExit() {
    if (onExit) {
      onExit();
    } else {
      navigate('/modes');
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/95 px-4 py-2 backdrop-blur-sm">
      <div className="mx-auto max-w-lg">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0 px-2"
            onClick={handleExit}
            aria-label="Выйти из игры"
          >
            ✕
          </Button>
          <div className="flex-1">
            <Progress value={percent} className="h-2" />
          </div>
          <span className="shrink-0 text-sm font-medium text-muted-foreground">
            {current}/{total}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <StreakBadge streak={streak} />
          {sessionXP > 0 && (
            <span className="text-xs font-semibold text-amber-600">+{sessionXP} XP</span>
          )}
        </div>
      </div>
    </header>
  );
}
