import { useState } from 'react';
import { getTextOptions, calculateXP } from '../../services/gameService';
import type { BibleVerse } from '../../types';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

interface Props {
  verse: BibleVerse;
  allVerses: BibleVerse[];
  streak: number;
  onAnswer: (
    isCorrect: boolean,
    xpEarned: number,
    options?: { manualNextOnWrong?: boolean },
  ) => void;
  onContinueAfterWrong: () => void;
}

export function FindTextMode({
  verse,
  allVerses,
  streak,
  onAnswer,
  onContinueAfterWrong,
}: Props) {
  // Фиксируем порядок вариантов на время показа текущего стиха,
  // чтобы после выбора ответа карточки не меняли позиции.
  const [options] = useState(() => getTextOptions(verse, allVerses));
  const [selected, setSelected] = useState<string | null>(null);

  function handleSelect(id: string) {
    if (selected !== null) return;
    setSelected(id);
    const isCorrect = id === verse.id;
    const xp = calculateXP(isCorrect, streak);
    onAnswer(isCorrect, xp, { manualNextOnWrong: true });
  }

  function getCardStyle(option: BibleVerse) {
    if (selected === null) {
      return 'cursor-pointer hover:border-primary/40 hover:shadow-md active:scale-95';
    }
    if (option.id === verse.id) {
      return 'border-green-500 bg-green-50 text-green-900 dark:border-emerald-500 dark:bg-emerald-950/35 dark:text-emerald-100';
    }
    if (option.id === selected) {
      return 'border-red-400 bg-red-50 text-red-900 dark:border-rose-500 dark:bg-rose-950/35 dark:text-rose-100';
    }
    return 'opacity-50';
  }

  const isWrongAnswer = selected !== null && selected !== verse.id;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Найди текст стиха
        </p>
        <p className="mt-1 text-2xl font-bold text-foreground">
          {verse.book} {verse.chapter}:{verse.verse}
        </p>
      </div>

      <div className="grid gap-3">
        {options.map((option) => (
          <Card
            key={option.id}
            onClick={() => handleSelect(option.id)}
            className={`transition-all ${getCardStyle(option)}`}
          >
            <CardContent className="p-4 text-sm leading-relaxed">
              {option.text}
            </CardContent>
          </Card>
        ))}
      </div>

      {isWrongAnswer && <Button onClick={onContinueAfterWrong}>Дальше</Button>}
    </div>
  );
}
