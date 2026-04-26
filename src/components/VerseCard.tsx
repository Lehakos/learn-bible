import { Trash2 } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { VerseStatus, type BibleVerse, type UserVerseStats, type UserVerseStatus } from '../types';

interface VerseCardProps {
  verse: BibleVerse;
  status?: UserVerseStatus;
  stats?: UserVerseStats;
  showStats?: boolean;
  onRepeat?: (verseId: string) => void;
  onToggleMastered?: (verseId: string, nextMastered: boolean) => void;
  onDelete?: (verseId: string) => void;
  deleting?: boolean;
}

function getAccuracy(stats: UserVerseStats): number {
  return stats.attempts > 0 ? Math.round((stats.correct / stats.attempts) * 100) : 0;
}

function formatPracticeDate(iso: string | undefined): string {
  if (!iso) return 'нет';

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'нет';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}.${month}.${date.getFullYear()}`;
}

export function VerseCard({
  verse,
  status,
  stats,
  showStats = false,
  onRepeat,
  onToggleMastered,
  onDelete,
  deleting = false,
}: VerseCardProps) {
  const ref = `${verse.book} ${verse.chapter}:${verse.verse}`;
  const mastered = status?.status === VerseStatus.MASTERED;
  const hasStats = !!stats && stats.attempts > 0;

  return (
    <Card className={mastered ? 'border-green-500/40 bg-green-500/10' : ''}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="leading-relaxed text-foreground">{verse.text}</p>
            <p className="mt-1 text-sm font-medium text-muted-foreground">{ref}</p>
          </div>
          <div className="shrink-0 flex flex-col items-center gap-1">
            <span className="text-xs font-semibold text-muted-foreground">
              {mastered ? 'Выучен' : 'Учится'}
            </span>
            {onToggleMastered && (
              <button
                type="button"
                role="switch"
                aria-checked={mastered}
                aria-label={mastered ? 'Сделать невыученным' : 'Отметить выученным'}
                onClick={() => onToggleMastered(verse.id, !mastered)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  mastered ? 'bg-green-500' : 'bg-muted'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                    mastered ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            )}
          </div>
        </div>
        {showStats && (
          <div
            aria-label={`Статистика стиха ${ref}`}
            className="mt-3 rounded-md bg-muted/50 p-3"
          >
            {hasStats ? (
              <>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-base font-bold text-foreground">{stats.attempts}</p>
                    <p className="text-[11px] uppercase text-muted-foreground">Попытки</p>
                  </div>
                  <div>
                    <p className="text-base font-bold text-foreground">{getAccuracy(stats)}%</p>
                    <p className="text-[11px] uppercase text-muted-foreground">Точность</p>
                  </div>
                  <div>
                    <p className="text-base font-bold text-foreground">{stats.bestStreak}</p>
                    <p className="text-[11px] uppercase text-muted-foreground">Серия</p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Последняя тренировка: {formatPracticeDate(stats.lastPracticedAt)}
                  {stats.skipped > 0 ? ` · пропусков: ${stats.skipped}` : ''}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Статистика появится после первой тренировки.
              </p>
            )}
          </div>
        )}
        <div className={onRepeat && onDelete ? 'mt-3 grid grid-cols-2 gap-2' : 'mt-3 space-y-2'}>
          {onRepeat && (
            <Button variant="outline" size="sm" className="w-full" onClick={() => onRepeat(verse.id)}>
              Повторить
            </Button>
          )}
          {onDelete && (
            <Button
              variant="outline"
              size="sm"
              className="w-full border-rose-200 bg-rose-50/60 text-rose-700 hover:bg-rose-100/70 hover:text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/20 dark:text-rose-300 dark:hover:bg-rose-950/35"
              aria-label={`Удалить стих ${ref}`}
              disabled={deleting}
              onClick={() => onDelete(verse.id)}
            >
              <Trash2 className="h-4 w-4" />
              {deleting ? 'Удаляем...' : 'Удалить'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
