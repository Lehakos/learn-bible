import { useMemo, useRef, useState } from 'react';
import { getBookOptions, calculateXP } from '../../services/gameService';
import type { BibleVerse } from '../../types';
import { Button } from '../ui/button';

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

enum FieldState {
  IDLE = 'idle',
  CORRECT = 'correct',
  WRONG = 'wrong',
}

export function IdentifyRefMode({
  verse,
  allVerses,
  streak,
  onAnswer,
  onContinueAfterWrong,
}: Props) {
  const bookOptions = useMemo(() => getBookOptions(allVerses), [allVerses]);

  const [bookInput, setBookInput] = useState('');
  const [chapterInput, setChapterInput] = useState('');
  const [verseInput, setVerseInput] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredBooks = bookInput.trim()
    ? bookOptions.filter((b) =>
        b.toLowerCase().includes(bookInput.toLowerCase()),
      )
    : bookOptions;

  function handleBookSelect(book: string) {
    setBookInput(book);
    setShowDropdown(false);
  }

  function handleSubmit() {
    if (submitted) return;

    const bCorrect =
      bookInput.trim().toLowerCase() === verse.book.toLowerCase();
    const cCorrect = parseInt(chapterInput, 10) === verse.chapter;
    const vCorrect = parseInt(verseInput, 10) === verse.verse;

    setBookState(bCorrect ? FieldState.CORRECT : FieldState.WRONG);
    setChapterState(cCorrect ? FieldState.CORRECT : FieldState.WRONG);
    setVerseState(vCorrect ? FieldState.CORRECT : FieldState.WRONG);
    setSubmitted(true);

    const isCorrect = bCorrect && cCorrect && vCorrect;
    onAnswer(isCorrect, calculateXP(isCorrect, streak), {
      manualNextOnWrong: true,
    });
  }

  const [bookState, setBookState] = useState<FieldState>(FieldState.IDLE);
  const [chapterState, setChapterState] = useState<FieldState>(FieldState.IDLE);
  const [verseState, setVerseState] = useState<FieldState>(FieldState.IDLE);

  const canSubmit =
    !submitted &&
    bookInput.trim() !== '' &&
    chapterInput.trim() !== '' &&
    verseInput.trim() !== '';
  const isWrongAnswer =
    submitted &&
    (bookState === FieldState.WRONG ||
      chapterState === FieldState.WRONG ||
      verseState === FieldState.WRONG);

  function fieldBorder(state: FieldState) {
    if (state === FieldState.CORRECT) {
      return 'border-green-500 bg-green-50 text-green-800 dark:border-emerald-500 dark:bg-emerald-950/35 dark:text-emerald-100';
    }
    if (state === FieldState.WRONG) {
      return 'border-red-400 bg-red-50 text-red-800 dark:border-rose-500 dark:bg-rose-950/35 dark:text-rose-100';
    }
    return 'border-input bg-card text-foreground placeholder:text-muted-foreground focus:border-ring';
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Текст стиха */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Определи ссылку
        </p>
        <p className="mt-2 text-base leading-relaxed text-card-foreground">
          {verse.text}
        </p>
      </div>

      {/* Поля ввода */}
      <div className="flex flex-col gap-4">
        {/* Книга — combobox с поиском */}
        <div>
          <label className="mb-1 block text-sm font-medium text-muted-foreground">
            Книга
          </label>
          <div className="relative" ref={dropdownRef}>
            <input
              type="text"
              value={bookInput}
              onChange={(e) => {
                setBookInput(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
              disabled={submitted}
              placeholder="Начни вводить название..."
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${fieldBorder(bookState)}`}
            />
            {showDropdown && filteredBooks.length > 0 && !submitted && (
              <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-border bg-popover shadow-lg">
                {filteredBooks.map((book) => (
                  <li
                    key={book}
                    onMouseDown={() => handleBookSelect(book)}
                    className="cursor-pointer px-3 py-2 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    {book}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {bookState === FieldState.WRONG && submitted && (
            <p className="mt-1 text-xs text-destructive">Правильно: {verse.book}</p>
          )}
        </div>

        {/* Глава и стих — числовые инпуты в ряд */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-muted-foreground">
              Глава
            </label>
            <input
              type="number"
              min={1}
              value={chapterInput}
              onChange={(e) => setChapterInput(e.target.value)}
              disabled={submitted}
              placeholder="№"
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${fieldBorder(chapterState)}`}
            />
            {chapterState === FieldState.WRONG && submitted && (
              <p className="mt-1 text-xs text-destructive">
                Правильно: {verse.chapter}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-muted-foreground">
              Стих
            </label>
            <input
              type="number"
              min={1}
              value={verseInput}
              onChange={(e) => setVerseInput(e.target.value)}
              disabled={submitted}
              placeholder="№"
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${fieldBorder(verseState)}`}
            />
            {verseState === FieldState.WRONG && submitted && (
              <p className="mt-1 text-xs text-destructive">
                Правильно: {verse.verse}
              </p>
            )}
          </div>
        </div>
      </div>

      {!submitted && (
        <Button onClick={handleSubmit} disabled={!canSubmit} className="text-white">
          Ответить
        </Button>
      )}
      {isWrongAnswer && <Button onClick={onContinueAfterWrong}>Дальше</Button>}
    </div>
  );
}
