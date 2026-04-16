import { Badge } from './ui/badge';

interface StreakBadgeProps {
  streak: number;
}

export function StreakBadge({ streak }: StreakBadgeProps) {
  if (streak === 0) return null;

  return (
    <Badge variant="secondary" className="gap-1 text-sm font-semibold">
      🔥 {streak}
    </Badge>
  );
}
