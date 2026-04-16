import { Progress } from './ui/progress';

interface XPBarProps {
  level: number;
  xp: number;
}

export function XPBar({ level, xp }: XPBarProps) {
  const xpNeeded = level * 100;
  const percent = Math.min(Math.round((xp / xpNeeded) * 100), 100);

  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-semibold text-foreground">Уровень {level}</span>
        <span className="text-muted-foreground">
          {xp} / {xpNeeded} XP
        </span>
      </div>
      <Progress value={percent} className="h-3" />
    </div>
  );
}
