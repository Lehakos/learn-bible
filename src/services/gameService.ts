import { achievements as allAchievements } from '../data/achievements';
import { BIBLE_BOOKS_RU } from '../data/bibleBooks';
import { verses as defaultVerses } from '../data/verses';
import { Difficulty, GameMode, type BibleVerse, type GameResult, type GameSession, type UserAchievement, type UserProfile } from '../types';

const SESSION_KEY = 'currentGameSession';

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export async function createSession(
  mode: GameMode,
  difficulty: Difficulty = Difficulty.EASY,
  allVerses: BibleVerse[],
  preferredVerseId?: string,
): Promise<GameSession> {
  const sourceVerses = allVerses.length > 0 ? allVerses : defaultVerses;
  if (sourceVerses.length === 0) {
    throw new Error('NO_VERSES_AVAILABLE');
  }
  const pool = sourceVerses.filter((v) => v.difficulty === difficulty);
  const source = pool.length >= 5 ? pool : sourceVerses;

  const preferredVerse = preferredVerseId
    ? sourceVerses.find((verse) => verse.id === preferredVerseId)
    : undefined;
  const selected = shuffleArray(source).slice(0, 5);

  const finalVerses = preferredVerse
    ? [preferredVerse, ...selected.filter((verse) => verse.id !== preferredVerse.id)].slice(0, 5)
    : selected;

  const session: GameSession = {
    id: crypto.randomUUID(),
    mode,
    verses: finalVerses,
    difficulty,
    startedAt: new Date().toISOString(),
  };

  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function loadSession(): GameSession | null {
  const raw = sessionStorage.getItem(SESSION_KEY);
  return raw ? (JSON.parse(raw) as GameSession) : null;
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

// ── FillGaps helpers ──────────────────────────────────────────────────────────

export interface GapsResult {
  /** Массив токенов: строка (слово/знак) или null (пропуск) */
  tokens: (string | null)[];
  /** Индексы пропущенных слов (позиции null в tokens) */
  gapIndices: number[];
  /** Правильные слова для пропусков (в порядке появления) */
  answers: string[];
  /** Варианты для кнопок (easy/medium) */
  options: string[];
}

function tokenizeVerse(text: string): string[] {
  // Разбивает текст на слова (знаки препинания прилеплены к слову)
  return text.split(/\s+/).filter(Boolean);
}

export function getGapsForVerse(verse: BibleVerse, difficulty: Difficulty): GapsResult {
  const words = tokenizeVerse(verse.text);
  const gapCount =
    difficulty === Difficulty.EASY ? 2 : difficulty === Difficulty.MEDIUM ? 3 : 4;

  // Выбираем случайные позиции под пропуски (не первое и не последнее слово)
  const eligible = words.map((_, i) => i).filter((i) => i > 0 && i < words.length - 1);
  const gapPositions = shuffleArray(eligible).slice(0, Math.min(gapCount, eligible.length));
  gapPositions.sort((a, b) => a - b);

  const tokens: (string | null)[] = words.map((w, i) =>
    gapPositions.includes(i) ? null : w,
  );
  const answers = gapPositions.map((i) => words[i]);

  // Варианты: правильные + случайные слова из других стихов
  const distractors = shuffleArray(
    defaultVerses
      .filter((v) => v.id !== verse.id)
      .flatMap((v) => tokenizeVerse(v.text))
      .filter((w) => !answers.includes(w)),
  ).slice(0, 6);
  const fallback = shuffleArray(
    tokenizeVerse(verse.text).filter((w) => !answers.includes(w)),
  );
  const options = shuffleArray(
    [...new Set([...answers, ...distractors, ...fallback])].slice(
      0,
      Math.max(6, answers.length + 4),
    ),
  );

  return { tokens, gapIndices: gapPositions, answers, options };
}

// ── FindText helpers ──────────────────────────────────────────────────────────

export function getTextOptions(verse: BibleVerse, allVerses: BibleVerse[]): BibleVerse[] {
  const others = allVerses.filter((v) => v.id !== verse.id);
  const distractors = shuffleArray(others).slice(0, 3);
  return shuffleArray([verse, ...distractors]);
}

// ── BuildVerse helpers ────────────────────────────────────────────────────────

export function getShuffledWords(verse: BibleVerse): string[] {
  return shuffleArray(tokenizeVerse(verse.text));
}

// ── IdentifyRef helpers ───────────────────────────────────────────────────────

export function getBookOptions(_allVerses: BibleVerse[]): string[] {
  return BIBLE_BOOKS_RU;
}

// ── Scoring ───────────────────────────────────────────────────────────────────

export function calculateXP(correct: boolean, streak: number): number {
  if (!correct) return 0;
  const base = 10;
  const bonus = Math.min(streak, 5) * 2; // до +10 XP за серию
  return base + bonus;
}

// ── Achievements ──────────────────────────────────────────────────────────────

export interface AchievementUpdate {
  achievementId: string;
  newProgress: number;
  newlyUnlocked: boolean;
}

/**
 * Compute achievement progress updates based on a completed session result.
 * Returns updates only for achievements that changed.
 */
export function checkAchievements(
  profile: UserProfile,
  result: GameResult,
  existingAchievements: UserAchievement[],
  totalMastered: number,
): AchievementUpdate[] {
  const updates: AchievementUpdate[] = [];
  const isPerfect = result.wrong === 0;
  const mode = result.mode;

  function getExisting(id: string): UserAchievement | undefined {
    return existingAchievements.find((a) => a.achievementId === id);
  }

  function tryUpdate(id: string, newProgress: number) {
    const meta = allAchievements.find((a) => a.id === id);
    if (!meta) return;
    const existing = getExisting(id);
    if (existing?.unlockedAt) return; // already unlocked
    const current = existing?.progress ?? 0;
    if (newProgress <= current) return;
    const capped = Math.min(newProgress, meta.maxProgress);
    updates.push({ achievementId: id, newProgress: capped, newlyUnlocked: capped >= meta.maxProgress });
  }

  function increment(id: string) {
    const existing = getExisting(id);
    if (existing?.unlockedAt) return;
    tryUpdate(id, (existing?.progress ?? 0) + 1);
  }

  // Session-based
  increment('first-session');
  increment('sessions-10');
  increment('sessions-50');

  // Perfect session
  if (isPerfect) {
    increment('perfect-session');
    increment('perfect-sessions-5');
  }

  // Mode-based
  if (mode === GameMode.FILL_GAPS) increment('mode-fill-gaps');
  if (mode === GameMode.BUILD_VERSE) increment('mode-build-verse');
  if (mode === GameMode.FIND_TEXT) increment('mode-find-text');
  if (mode === GameMode.IDENTIFY_REF) increment('mode-identify-ref');

  // Verse mastery (total count)
  tryUpdate('first-verse', totalMastered);
  tryUpdate('verses-5', totalMastered);
  tryUpdate('verses-10', totalMastered);
  tryUpdate('verses-25', totalMastered);

  // Level
  tryUpdate('level-5', profile.level);

  return updates;
}
