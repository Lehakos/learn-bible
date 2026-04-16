import { useState, useMemo } from 'react';
import { Button } from '../ui/button';
import { getGapsForVerse, calculateXP } from '../../services/gameService';
import { Difficulty, type BibleVerse } from '../../types';

interface Props {
  verse: BibleVerse;
  difficulty: Difficulty;
  streak: number;
  onAnswer: (isCorrect: boolean, xpEarned: number) => void;
}

enum AnswerState {
  IDLE = 'idle',
  CORRECT = 'correct',
  WRONG = 'wrong',
}

export function FillGapsMode({ verse, difficulty, streak, onAnswer }: Props) {
  const gapsData = useMemo(() => getGapsForVerse(verse, difficulty), [verse, difficulty]);

  // Для easy/medium — кнопки; для hard — ввод
  const isInputMode = difficulty === Difficulty.HARD;

  const [filled, setFilled] = useState<(string | null)[]>(
    gapsData.gapIndices.map(() => null),
  );
  const [inputValues, setInputValues] = useState<string[]>(
    gapsData.gapIndices.map(() => ''),
  );
  const [answerState, setAnswerState] = useState<AnswerState>(AnswerState.IDLE);

  function handleOptionClick(word: string) {
    if (answerState !== AnswerState.IDLE) return;
    // Заполняем первый пустой пропуск
    const nextEmpty = filled.findIndex((f) => f === null);
    if (nextEmpty === -1) return;

    const newFilled = [...filled];
    newFilled[nextEmpty] = word;
    setFilled(newFilled);

    // Если все пропуски заполнены — проверяем
    if (newFilled.every((f) => f !== null)) {
      checkAnswers(newFilled);
    }
  }

  function handleFilledClick(gapIdx: number) {
    if (answerState !== AnswerState.IDLE) return;
    const newFilled = [...filled];
    newFilled[gapIdx] = null;
    setFilled(newFilled);
  }

  function handleInputChange(gapIdx: number, value: string) {
    const newValues = [...inputValues];
    newValues[gapIdx] = value;
    setInputValues(newValues);
  }

  function handleInputSubmit() {
    if (answerState !== AnswerState.IDLE) return;
    checkAnswers(inputValues);
  }

  function checkAnswers(userAnswers: (string | null)[]) {
    const correct = gapsData.answers.every((ans, i) => {
      const user = (userAnswers[i] ?? '').trim().toLowerCase();
      return user === ans.toLowerCase();
    });

    setAnswerState(correct ? AnswerState.CORRECT : AnswerState.WRONG);
    const xp = calculateXP(correct, streak);
    onAnswer(correct, xp);
  }

  // Строим отображение текста
  let gapCounter = 0;
  const textParts = gapsData.tokens.map((token, idx) => {
    if (token !== null) {
      return (
        <span key={idx} className="mr-1">
          {token}
        </span>
      );
    }

    const gapIdx = gapCounter++;
    const filledWord = filled[gapIdx];

    if (isInputMode) {
      return (
        <input
          key={idx}
          type="text"
          value={inputValues[gapIdx]}
          onChange={(e) => handleInputChange(gapIdx, e.target.value)}
          disabled={answerState !== AnswerState.IDLE}
          className={`mr-1 inline-block w-24 rounded border-b-2 border-dashed bg-transparent text-center text-sm outline-none transition-colors ${
            answerState === AnswerState.CORRECT
              ? 'border-green-500 text-green-700'
              : answerState === AnswerState.WRONG
                ? 'border-red-500 text-red-700'
                : 'border-slate-400 focus:border-indigo-500'
          }`}
        />
      );
    }

    return (
      <button
        key={idx}
        onClick={() => filledWord && handleFilledClick(gapIdx)}
        className={`mr-1 inline-block min-w-16 rounded px-2 py-0.5 text-sm font-medium transition-colors ${
          filledWord === null
            ? 'border-2 border-dashed border-slate-300 text-transparent'
            : answerState === AnswerState.CORRECT
              ? 'bg-green-100 text-green-800'
              : answerState === AnswerState.WRONG
                ? 'bg-red-100 text-red-800'
                : 'bg-indigo-100 text-indigo-800'
        }`}
      >
        {filledWord ?? '___'}
      </button>
    );
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
          {verse.book} {verse.chapter}:{verse.verse}
        </p>
        <div className="rounded-xl bg-white p-4 text-base leading-8 text-slate-800 shadow-sm">
          {textParts}
        </div>
      </div>

      {answerState === AnswerState.WRONG && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          Правильно: {gapsData.answers.join(', ')}
        </p>
      )}

      {!isInputMode ? (
        <div className="flex flex-wrap gap-2">
          {gapsData.options.map((word, i) => {
            const isUsed = filled.includes(word);
            return (
              <Button
                key={`${word}-${i}`}
                variant="outline"
                size="sm"
                disabled={isUsed || answerState !== AnswerState.IDLE}
                onClick={() => handleOptionClick(word)}
                className={isUsed ? 'opacity-30' : ''}
              >
                {word}
              </Button>
            );
          })}
        </div>
      ) : (
        <Button
          onClick={handleInputSubmit}
          disabled={
            answerState !== AnswerState.IDLE || inputValues.some((v) => v.trim() === '')
          }
        >
          Проверить
        </Button>
      )}
    </div>
  );
}
