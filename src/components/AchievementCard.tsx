import { Card, CardContent } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import type { Achievement, UserAchievement } from '../types';

interface AchievementCardProps {
  achievement: Achievement;
  userAchievement?: UserAchievement;
}

export function AchievementCard({ achievement, userAchievement }: AchievementCardProps) {
  const progress = userAchievement?.progress ?? 0;
  const unlocked = !!userAchievement?.unlockedAt;
  const percent = Math.min(Math.round((progress / achievement.maxProgress) * 100), 100);
  const cardClassName = unlocked
    ? 'border-amber-300 bg-amber-50 dark:border-amber-500/50 dark:bg-amber-500/10'
    : 'border-border bg-card';
  const iconClassName = unlocked
    ? 'text-3xl leading-none'
    : 'text-3xl leading-none grayscale saturate-0 opacity-55';

  return (
    <Card className={cardClassName}>
      <CardContent className="flex items-start gap-3 p-4">
        <span className={iconClassName}>{achievement.iconEmoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-foreground">{achievement.title}</span>
            {unlocked && (
              <Badge className="bg-amber-500 text-amber-50 text-xs">Выполнено</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{achievement.description}</p>
          {!unlocked && achievement.maxProgress > 1 && (
            <div className="mt-2">
              <Progress value={percent} className="h-2" />
              <span className="mt-1 block text-xs text-muted-foreground">
                {progress} / {achievement.maxProgress}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
