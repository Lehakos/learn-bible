import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { VerseStatus, type BibleVerse, type UserVerseStatus } from '../types';

interface VerseCardProps {
  verse: BibleVerse;
  status?: UserVerseStatus;
  onRepeat?: (verseId: string) => void;
  onToggleMastered?: (verseId: string, nextMastered: boolean) => void;
}

export function VerseCard({ verse, status, onRepeat, onToggleMastered }: VerseCardProps) {
  const ref = `${verse.book} ${verse.chapter}:${verse.verse}`;
  const mastered = status?.status === VerseStatus.MASTERED;

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
        <div className="mt-3 space-y-2">
          {onRepeat && (
            <Button variant="outline" size="sm" className="w-full" onClick={() => onRepeat(verse.id)}>
              Повторить
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
