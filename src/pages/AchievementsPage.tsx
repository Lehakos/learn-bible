import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AchievementCard } from '../components/AchievementCard';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/ui/button';
import { achievements as allAchievements } from '../data/achievements';
import { useApp } from '../store/AppContext';

enum AchievementFilter {
  ALL = 'all',
  COMPLETED = 'completed',
}

export function AchievementsPage() {
  const navigate = useNavigate();
  const { loading, profile, achievements } = useApp();
  const [filter, setFilter] = useState<AchievementFilter>(AchievementFilter.ALL);

  const visibleAchievements = useMemo(() => {
    if (filter === AchievementFilter.COMPLETED) {
      return allAchievements.filter((achievement) =>
        achievements.some(
          (userAchievement) =>
            userAchievement.achievementId === achievement.id && !!userAchievement.unlockedAt,
        ),
      );
    }

    return allAchievements;
  }, [achievements, filter]);

  if (loading || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <span className="text-4xl animate-pulse">🏆</span>
      </div>
    );
  }

  return (
    <div className="page-enter flex h-dvh flex-col bg-background">
      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto w-full max-w-lg space-y-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            ← Назад
          </button>

          <div>
            <h1 className="text-2xl font-bold text-foreground">Достижения</h1>
            <p className="mt-1 text-sm text-muted-foreground">Следи за прогрессом и открывай награды</p>
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-xl bg-card p-1 shadow-sm">
            <Button
              variant={filter === AchievementFilter.ALL ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter(AchievementFilter.ALL)}
            >
              Все
            </Button>
            <Button
              variant={filter === AchievementFilter.COMPLETED ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter(AchievementFilter.COMPLETED)}
            >
              Выполненные
            </Button>
          </div>

          <div className="space-y-3">
            {visibleAchievements.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
                Пока нет выполненных достижений.
              </div>
            ) : (
              visibleAchievements.map((achievement) => (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  userAchievement={achievements.find((a) => a.achievementId === achievement.id)}
                />
              ))
            )}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
