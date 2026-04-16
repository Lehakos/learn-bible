import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { LevelUpBanner } from '../components/LevelUpBanner';
import { useApp } from '../store/AppContext';
import { checkAchievements } from '../services/gameService';
import { achievements as allAchievements } from '../data/achievements';
import { VerseStatus, type GameResult } from '../types';

export function SessionResultPage() {
  const navigate = useNavigate();
  const { profile, achievements, verseStatuses, addXP, unlockAchievement, updateAchievementProgress, markVerseCompleted } = useApp();

  const [result] = useState<GameResult | null>(() => {
    const raw = sessionStorage.getItem('lastGameResult');
    return raw ? (JSON.parse(raw) as GameResult) : null;
  });

  const [newlyUnlockedIds, setNewlyUnlockedIds] = useState<string[]>([]);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevel, setNewLevel] = useState(0);
  const applied = useRef(false);

  useEffect(() => {
    if (!result || !profile || applied.current) return;
    applied.current = true;

    async function applyResult() {
      if (!result || !profile) return;

      // 1. Mark verses as completed
      if (result.verseIds) {
        for (const id of result.verseIds) {
          await markVerseCompleted(id);
        }
      }

      // 2. Compute total mastered verses (optimistic: current + new from this session)
      const currentMastered = verseStatuses.filter((s) => s.status === VerseStatus.MASTERED).length;
      const newMastered = result.verseIds
        ? result.verseIds.filter((id) => !verseStatuses.find((s) => s.verseId === id && s.status === VerseStatus.MASTERED)).length
        : 0;
      const totalMastered = currentMastered + newMastered;

      // 3. Check achievements
      const updates = checkAchievements(profile, result, achievements, totalMastered);
      const newIds: string[] = [];
      for (const upd of updates) {
        if (upd.newlyUnlocked) {
          await unlockAchievement(upd.achievementId);
          newIds.push(upd.achievementId);
        } else {
          await updateAchievementProgress(upd.achievementId, upd.newProgress);
        }
      }
      setNewlyUnlockedIds(newIds);

      // 4. Add XP and detect level-up
      const didLevelUp = await addXP(result.xpEarned);
      if (didLevelUp) {
        setNewLevel(profile.level + 1);
        setShowLevelUp(true);
      }

      // 5. Clean up stored result
      sessionStorage.removeItem('lastGameResult');
    }

    applyResult();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  if (!result) {
    navigate('/', { replace: true });
    return null;
  }

  const total = (result.correct ?? 0) + (result.wrong ?? 0);
  const accuracy = total > 0 ? Math.round((result.correct / total) * 100) : 0;
  const isPerfect = result.wrong === 0;

  return (
    <div className="page-enter flex min-h-screen flex-col bg-background">
      {showLevelUp && (
        <LevelUpBanner newLevel={newLevel} onDismiss={() => setShowLevelUp(false)} />
      )}

      <main className="flex flex-1 flex-col items-center p-4 pt-8">
        <div className="w-full max-w-lg space-y-4">
          {/* Header */}
          <div className="text-center">
            <div className="text-5xl">{isPerfect ? '🌟' : accuracy >= 60 ? '👍' : '💪'}</div>
            <h1 className="mt-2 text-2xl font-bold text-foreground">
              {isPerfect ? 'Безупречно!' : accuracy >= 60 ? 'Хорошая работа!' : 'Продолжай стараться!'}
            </h1>
          </div>

          {/* Score card */}
          <Card>
            <CardContent className="grid grid-cols-3 gap-4 p-6 text-center">
              <div>
                <p className="text-3xl font-extrabold text-green-500">{result.correct}</p>
                <p className="text-sm text-muted-foreground">Верно</p>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-foreground">{accuracy}%</p>
                <p className="text-sm text-muted-foreground">Точность</p>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-red-400">{result.wrong}</p>
                <p className="text-sm text-muted-foreground">Ошибки</p>
              </div>
            </CardContent>
          </Card>

          {/* XP earned */}
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="flex items-center justify-between p-4">
              <span className="font-semibold text-amber-700">Получено XP</span>
              <Badge className="bg-amber-400 text-base text-white">+{result.xpEarned} XP</Badge>
            </CardContent>
          </Card>

          {/* New achievements */}
          {newlyUnlockedIds.length > 0 && (
            <div className="space-y-2">
              <h2 className="font-semibold text-foreground">Новые достижения</h2>
              {newlyUnlockedIds.map((id) => {
                const meta = allAchievements.find((a) => a.id === id);
                if (!meta) return null;
                return (
                  <Card key={id} className="border-amber-300 bg-amber-50">
                    <CardContent className="flex items-center gap-3 p-4">
                      <span className="text-3xl">{meta.iconEmoji}</span>
                      <div>
                        <p className="font-semibold text-foreground">{meta.title}</p>
                        <p className="text-sm text-muted-foreground">{meta.description}</p>
                      </div>
                      <Badge className="ml-auto bg-amber-400 text-white">Новое!</Badge>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-2">
            <Button
              size="lg"
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={() => navigate('/modes')}
            >
              Играть снова
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full"
              onClick={() => navigate('/')}
            >
              На главный экран
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
