import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { createSession } from '../services/gameService';
import { useApp } from '../store/AppContext';
import { Difficulty, GameMode, VerseStatus } from '../types';

interface ModeConfig {
  mode: GameMode;
  icon: string;
  title: string;
  description: string;
}

const MODES: ModeConfig[] = [
  {
    mode: GameMode.FILL_GAPS,
    icon: '✏️',
    title: 'Заполни пропуски',
    description: 'Восстанови стих, выбирая пропущенные слова',
  },
  {
    mode: GameMode.BUILD_VERSE,
    icon: '🧩',
    title: 'Собери стих',
    description: 'Расставь перемешанные слова в правильном порядке',
  },
  {
    mode: GameMode.FIND_TEXT,
    icon: '🔍',
    title: 'Найди текст',
    description: 'По ссылке выбери правильный текст стиха',
  },
  {
    mode: GameMode.IDENTIFY_REF,
    icon: '📖',
    title: 'Определи ссылку',
    description: 'По тексту укажи книгу, главу и стих',
  },
];

export function ModeSelectionPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { allVerses, verseStatuses, loading } = useApp();
  const [error, setError] = useState<string | null>(null);

  const masteredVerseIds = useMemo(
    () =>
      new Set(
        verseStatuses
          .filter((status) => status.status === VerseStatus.MASTERED)
          .map((status) => status.verseId),
      ),
    [verseStatuses],
  );
  const unmasteredVerses = useMemo(
    () => allVerses.filter((verse) => !masteredVerseIds.has(verse.id)),
    [allVerses, masteredVerseIds],
  );

  const repeatVerseId = searchParams.get('verseId');
  const repeatVerse = useMemo(
    () => unmasteredVerses.find((verse) => verse.id === repeatVerseId),
    [unmasteredVerses, repeatVerseId],
  );

  async function handleSelect(mode: GameMode) {
    const difficulty: Difficulty = Difficulty.EASY;
    setError(null);
    try {
      await createSession(mode, difficulty, unmasteredVerses, repeatVerse?.id);
      navigate('/game');
    } catch (err) {
      if (err instanceof Error && err.message === 'NO_VERSES_AVAILABLE') {
        setError('Нет невыученных стихов. Отметь нужные стихи как «В изучении» в коллекции.');
        return;
      }
      setError('Не удалось начать игру. Попробуй ещё раз.');
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <span className="text-4xl animate-pulse">🎮</span>
      </div>
    );
  }

  return (
    <div className="page-enter flex min-h-screen flex-col bg-background">
      <div className="p-4 pb-0">
        <button
          onClick={() => navigate('/')}
          className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          ← Назад
        </button>
        <h1 className="text-2xl font-bold text-foreground">Выбери режим</h1>
        <p className="mt-1 text-sm text-muted-foreground">Все режимы доступны сразу</p>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        {repeatVerse && (
          <div className="mt-3 rounded-xl border border-primary/30 bg-primary/10 p-3 text-sm text-primary">
            Повторение стиха:{' '}
            <span className="font-semibold">
              {repeatVerse.book} {repeatVerse.chapter}:{repeatVerse.verse}
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 p-4">
        <div className="grid gap-3">
          {MODES.map(({ mode, icon, title, description }) => (
            <Card
              key={mode}
              onClick={() => void handleSelect(mode)}
              className="cursor-pointer transition-all hover:shadow-md active:scale-95"
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <span className="text-3xl">{icon}</span>
                  {title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">{description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
