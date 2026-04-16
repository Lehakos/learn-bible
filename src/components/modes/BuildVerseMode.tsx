import { useState, useMemo } from 'react';
import { Button } from '../ui/button';
import { getShuffledWords, calculateXP } from '../../services/gameService';
import type { BibleVerse } from '../../types';

interface Props {
  verse: BibleVerse;
  streak: number;
  onAnswer: (isCorrect: boolean, xpEarned: number) => void;
}

enum AnswerState {
  IDLE = 'idle',
  CORRECT = 'correct',
  WRONG = 'wrong',
}

export function BuildVerseMode({ verse, streak, onAnswer }: Props) {
  const shuffled = useMemo(() => getShuffledWords(verse), [verse]);
  const correctWords = useMemo(
    () => verse.text.split(/\s+/).filter(Boolean),
    [verse],
  );

  // { word, shuffledIdx } чтобы точно отслеживать, какой экземпляр слова использован
  const [built, setBuilt] = useState<{ word: string; shuffledIdx: number }[]>([]);
  const [answerState, setAnswerState] = useState<AnswerState>(AnswerState.IDLE);

  const usedIndices = new Set(built.map((b) => b.shuffledIdx));

  function handleWordClick(word: string, idx: number) {
    if (answerState !== AnswerState.IDLE || usedIndices.has(idx)) return;

    const newBuilt = [...built, { word, shuffledIdx: idx }];
    setBuilt(newBuilt);

    if (newBuilt.length === shuffled.length) {
      const isCorrect = newBuilt.every((b, i) => b.word === correctWords[i]);
      setAnswerState(isCorrect ? AnswerState.CORRECT : AnswerState.WRONG);
      onAnswer(isCorrect, calculateXP(isCorrect, streak));
    }
  }

  function handleBuiltClick(builtIdx: number) {
    if (answerState !== AnswerState.IDLE) return;
    setBuilt((prev) => prev.filter((_, i) => i !== builtIdx));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Собери стих по порядку
        </p>
        <p className="mt-1 text-2xl font-bold text-slate-800">
          {verse.book} {verse.chapter}:{verse.verse}
        </p>
      </div>

      {/* Зона сборки */}
      <div
        className={`min-h-20 rounded-xl border-2 border-dashed p-3 transition-colors ${
          answerState === AnswerState.CORRECT
            ? 'border-green-400 bg-green-50'
            : answerState === AnswerState.WRONG
              ? 'border-red-400 bg-red-50'
              : 'border-slate-300 bg-white'
        }`}
      >
        {built.length === 0 ? (
          <p className="text-sm text-slate-400">Нажимай слова ниже...</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {built.map((b, i) => (
              <button
                key={i}
                onClick={() => handleBuiltClick(i)}
                disabled={answerState !== AnswerState.IDLE}
                className={`rounded px-2 py-0.5 text-sm font-medium transition-colors ${
                  answerState === AnswerState.CORRECT
                    ? 'bg-green-200 text-green-900'
                    : answerState === AnswerState.WRONG
                      ? 'bg-red-200 text-red-900'
                      : 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200 active:scale-95'
                }`}
              >
                {b.word}
              </button>
            ))}
          </div>
        )}
      </div>

      {answerState === AnswerState.WRONG && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          Правильно: {correctWords.join(' ')}
        </p>
      )}

      {/* Перемешанные слова */}
      <div className="flex flex-wrap gap-2">
        {shuffled.map((word, idx) => (
          <Button
            key={idx}
            variant="outline"
            size="sm"
            disabled={usedIndices.has(idx) || answerState !== AnswerState.IDLE}
            onClick={() => handleWordClick(word, idx)}
            className={usedIndices.has(idx) ? 'opacity-30' : ''}
          >
            {word}
          </Button>
        ))}
      </div>
    </div>
  );
}
