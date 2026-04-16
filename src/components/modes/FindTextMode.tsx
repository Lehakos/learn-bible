import { useMemo, useState } from 'react';
import { getTextOptions, calculateXP } from '../../services/gameService';
import type { BibleVerse } from '../../types';
import { Card, CardContent } from '../ui/card';

interface Props {
  verse: BibleVerse;
  allVerses: BibleVerse[];
  streak: number;
  onAnswer: (isCorrect: boolean, xpEarned: number) => void;
}

export function FindTextMode({ verse, allVerses, streak, onAnswer }: Props) {
  const options = useMemo(() => getTextOptions(verse, allVerses), [allVerses, verse]);
  const [selected, setSelected] = useState<string | null>(null);

  function handleSelect(id: string) {
    if (selected !== null) return;
    setSelected(id);
    const isCorrect = id === verse.id;
    const xp = calculateXP(isCorrect, streak);
    onAnswer(isCorrect, xp);
  }

  function getCardStyle(option: BibleVerse) {
    if (selected === null) return 'cursor-pointer hover:shadow-md active:scale-95';
    if (option.id === verse.id) return 'border-green-500 bg-green-50';
    if (option.id === selected) return 'border-red-400 bg-red-50';
    return 'opacity-50';
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Найди текст стиха
        </p>
        <p className="mt-1 text-2xl font-bold text-slate-800">
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
            <CardContent className="p-4 text-sm leading-relaxed text-slate-700">
              {option.text}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
