import { useEffect, useMemo, useState } from 'react';
import { BarChart3, EyeOff } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { VerseCard } from '../components/VerseCard';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { getBookOptions } from '../services/gameService';
import { useApp } from '../store/AppContext';
import { Difficulty, VerseStatus } from '../types';

enum VerseFilter {
  ALL = 'all',
  MASTERED = 'mastered',
  LEARNING = 'learning',
}

interface FormState {
  book: string;
  chapter: string;
  verse: string;
  text: string;
  difficulty: Difficulty;
}

const initialForm: FormState = {
  book: '',
  chapter: '',
  verse: '',
  text: '',
  difficulty: Difficulty.EASY,
};

const noVersesHint = 'Добавь стих, чтобы выбрать задание и начать игру.';

export function CollectionPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    loading,
    profile,
    verseStatuses,
    verseStats,
    allVerses,
    addCustomVerse,
    setVerseStatus,
  } = useApp();

  const [showForm, setShowForm] = useState(false);
  const [showBookDropdown, setShowBookDropdown] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);
  const [verseFilter, setVerseFilter] = useState<VerseFilter>(VerseFilter.ALL);
  const [showStats, setShowStats] = useState(false);
  const addVerseRequested = searchParams.get('add') === 'verse';
  const addVerseHint = searchParams.get('hint') === 'no-verses' ? noVersesHint : null;

  useEffect(() => {
    if (addVerseRequested) {
      setShowForm(true);
    }
  }, [addVerseRequested]);

  const statusesByVerseId = useMemo(() => {
    return new Map(verseStatuses.map((status) => [status.verseId, status]));
  }, [verseStatuses]);

  const statsByVerseId = useMemo(() => {
    return new Map(verseStats.map((stats) => [stats.verseId, stats]));
  }, [verseStats]);

  const sortedVerses = useMemo(() => {
    return [...allVerses].sort((a, b) => {
      if (a.book !== b.book) return a.book.localeCompare(b.book, 'ru');
      if (a.chapter !== b.chapter) return a.chapter - b.chapter;
      return a.verse - b.verse;
    });
  }, [allVerses]);

  const masteredCount = useMemo(() => {
    return sortedVerses.reduce((count, verse) => {
      const status = statusesByVerseId.get(verse.id);
      return status?.status === VerseStatus.MASTERED ? count + 1 : count;
    }, 0);
  }, [sortedVerses, statusesByVerseId]);

  const filteredVerses = useMemo(() => {
    return sortedVerses.filter((verse) => {
      const status = statusesByVerseId.get(verse.id);
      const isMastered = status?.status === VerseStatus.MASTERED;

      if (verseFilter === VerseFilter.MASTERED) return isMastered;
      if (verseFilter === VerseFilter.LEARNING) return !isMastered;
      return true;
    });
  }, [sortedVerses, statusesByVerseId, verseFilter]);

  const statsSummary = useMemo(() => {
    const verseIds = new Set(allVerses.map((verse) => verse.id));
    const activeStats = verseStats.filter(
      (stats) => verseIds.has(stats.verseId) && stats.attempts > 0,
    );
    const attempts = activeStats.reduce((sum, stats) => sum + stats.attempts, 0);
    const correct = activeStats.reduce((sum, stats) => sum + stats.correct, 0);
    const bestStreak = activeStats.reduce(
      (best, stats) => Math.max(best, stats.bestStreak),
      0,
    );

    return {
      practicedVerses: activeStats.length,
      attempts,
      accuracy: attempts > 0 ? Math.round((correct / attempts) * 100) : 0,
      bestStreak,
    };
  }, [allVerses, verseStats]);

  const bookOptions = useMemo(() => getBookOptions(allVerses), [allVerses]);
  const filteredBookOptions = useMemo(() => {
    const query = form.book.trim().toLowerCase();
    if (!query) return bookOptions;
    return bookOptions.filter((book) => book.toLowerCase().includes(query));
  }, [bookOptions, form.book]);

  function handleRepeat(verseId: string) {
    navigate(`/modes?verseId=${verseId}`);
  }

  function handleToggleMastered(verseId: string, nextMastered: boolean) {
    void setVerseStatus(
      verseId,
      nextMastered ? VerseStatus.MASTERED : VerseStatus.LEARNING,
    );
  }

  function handleToggleForm() {
    setError(null);
    if (showForm && (addVerseRequested || addVerseHint)) {
      navigate('/collection', { replace: true });
    }
    setShowForm((prev) => !prev);
  }

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleBookSelect(book: string) {
    updateField('book', book);
    setShowBookDropdown(false);
  }

  async function handleSaveVerse() {
    setError(null);

    const book = form.book.trim();
    const text = form.text.trim();
    const chapter = Number.parseInt(form.chapter, 10);
    const verse = Number.parseInt(form.verse, 10);

    if (!book || !text || !Number.isFinite(chapter) || !Number.isFinite(verse)) {
      setError('Заполни книгу, главу, стих и текст.');
      return;
    }

    if (chapter <= 0 || verse <= 0) {
      setError('Глава и стих должны быть больше нуля.');
      return;
    }

    setSaving(true);
    try {
      await addCustomVerse({
        book,
        chapter,
        verse,
        text,
        difficulty: form.difficulty,
      });
      setForm(initialForm);
      setShowForm(false);
      if (addVerseRequested || addVerseHint) {
        navigate('/collection', { replace: true });
      }
    } catch {
      setError('Не удалось сохранить стих. Попробуй снова.');
    } finally {
      setSaving(false);
    }
  }

  if (loading || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <span className="text-4xl animate-pulse">📖</span>
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

          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Коллекция стихов</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Добавляй свои стихи и повторяй их в игровых режимах
              </p>
            </div>
            <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto">
              <Button
                size="sm"
                variant={showStats ? 'secondary' : 'outline'}
                aria-pressed={showStats}
                onClick={() => setShowStats((prev) => !prev)}
                className="w-full sm:w-auto"
              >
                {showStats ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <BarChart3 className="h-4 w-4" />
                )}
                {showStats ? 'Скрыть статистику' : 'Показать статистику'}
              </Button>
              <Button size="sm" onClick={handleToggleForm} className="w-full sm:w-auto">
                {showForm ? 'Отмена' : 'Добавить стих'}
              </Button>
            </div>
          </div>

          {addVerseHint && (
            <div className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
              {addVerseHint}
            </div>
          )}

          {showStats && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Статистика практики</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2 p-3 pt-0 sm:grid-cols-4">
                <div className="rounded-md bg-muted/50 p-3 text-center">
                  <p className="text-xl font-bold text-foreground">{statsSummary.practicedVerses}</p>
                  <p className="text-xs text-muted-foreground">Стихов</p>
                </div>
                <div className="rounded-md bg-muted/50 p-3 text-center">
                  <p className="text-xl font-bold text-foreground">{statsSummary.attempts}</p>
                  <p className="text-xs text-muted-foreground">Попыток</p>
                </div>
                <div className="rounded-md bg-muted/50 p-3 text-center">
                  <p className="text-xl font-bold text-foreground">{statsSummary.accuracy}%</p>
                  <p className="text-xs text-muted-foreground">Точность</p>
                </div>
                <div className="rounded-md bg-muted/50 p-3 text-center">
                  <p className="text-xl font-bold text-foreground">{statsSummary.bestStreak}</p>
                  <p className="text-xs text-muted-foreground">Лучшая серия</p>
                </div>
              </CardContent>
            </Card>
          )}

          {showForm && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Новый стих</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <input
                      type="text"
                      aria-label="Книга"
                      value={form.book}
                      onChange={(e) => {
                        updateField('book', e.target.value);
                        setShowBookDropdown(true);
                      }}
                      onFocus={() => setShowBookDropdown(true)}
                      onBlur={() => setTimeout(() => setShowBookDropdown(false), 150)}
                      placeholder="Книга (поиск)"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
                    />
                    {showBookDropdown && filteredBookOptions.length > 0 && (
                      <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-border bg-card shadow-lg">
                        {filteredBookOptions.map((book) => (
                          <li
                            key={book}
                            onMouseDown={() => handleBookSelect(book)}
                            className="cursor-pointer px-3 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground"
                          >
                            {book}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <select
                    aria-label="Сложность"
                    value={form.difficulty}
                    onChange={(e) => updateField('difficulty', e.target.value as Difficulty)}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value={Difficulty.EASY}>Легко</option>
                    <option value={Difficulty.MEDIUM}>Средне</option>
                    <option value={Difficulty.HARD}>Сложно</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    min={1}
                    aria-label="Глава"
                    value={form.chapter}
                    onChange={(e) => updateField('chapter', e.target.value)}
                    placeholder="Глава"
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    min={1}
                    aria-label="Стих"
                    value={form.verse}
                    onChange={(e) => updateField('verse', e.target.value)}
                    placeholder="Стих"
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <textarea
                  aria-label="Текст стиха"
                  value={form.text}
                  onChange={(e) => updateField('text', e.target.value)}
                  rows={4}
                  placeholder="Текст стиха"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button onClick={() => void handleSaveVerse()} disabled={saving} className="w-full">
                  {saving ? 'Сохраняем...' : 'Сохранить стих'}
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="flex flex-wrap items-center gap-2 p-3">
              <Button
                size="sm"
                variant={verseFilter === VerseFilter.ALL ? 'default' : 'outline'}
                onClick={() => setVerseFilter(VerseFilter.ALL)}
              >
                Все ({sortedVerses.length})
              </Button>
              <Button
                size="sm"
                variant={verseFilter === VerseFilter.MASTERED ? 'default' : 'outline'}
                onClick={() => setVerseFilter(VerseFilter.MASTERED)}
              >
                Выученные ({masteredCount})
              </Button>
              <Button
                size="sm"
                variant={verseFilter === VerseFilter.LEARNING ? 'default' : 'outline'}
                onClick={() => setVerseFilter(VerseFilter.LEARNING)}
              >
                Невыученные ({sortedVerses.length - masteredCount})
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {filteredVerses.map((verse) => (
              <VerseCard
                key={verse.id}
                verse={verse}
                status={statusesByVerseId.get(verse.id)}
                stats={statsByVerseId.get(verse.id)}
                showStats={showStats}
                onRepeat={handleRepeat}
                onToggleMastered={handleToggleMastered}
              />
            ))}
            {filteredVerses.length === 0 && (
              <Card>
                <CardContent className="p-4 text-sm text-muted-foreground">
                  По выбранному фильтру пока нет стихов.
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
