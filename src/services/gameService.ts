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
  /** Массив частей текста: строка (слово/разделитель) или null (пропуск слова) */
  tokens: (string | null)[];
  /** Индексы пропусков (позиции null в tokens) */
  gapIndices: number[];
  /** Правильные слова для пропусков (в порядке появления) */
  answers: string[];
  /** Варианты для кнопок (easy/medium) */
  options: string[];
}

const WORD_PART_RE = /^[\p{L}\p{N}]+$/u;
const VERSE_PARTS_RE = /[\p{L}\p{N}]+|[^\p{L}\p{N}]+/gu;

function splitVerseParts(text: string): string[] {
  return text.match(VERSE_PARTS_RE) ?? [];
}

function isWordPart(part: string): boolean {
  return WORD_PART_RE.test(part);
}

function tokenizeVerse(text: string): string[] {
  return splitVerseParts(text).filter(isWordPart);
}

export function normalizeWord(word: string): string {
  return word.trim().toLocaleLowerCase('ru');
}

export function getVerseWords(verse: BibleVerse): string[] {
  return tokenizeVerse(verse.text);
}

export function getGapsForVerse(
  verse: BibleVerse,
  difficulty: Difficulty,
  allVerses: BibleVerse[] = defaultVerses,
): GapsResult {
  const parts = splitVerseParts(verse.text);
  const words = parts.filter(isWordPart);
  const gapCount =
    difficulty === Difficulty.EASY ? 2 : difficulty === Difficulty.MEDIUM ? 3 : 4;

  // Выбираем случайные позиции под пропуски (среди слов; не первое и не последнее слово)
  const eligibleWordPositions = words
    .map((_, i) => i)
    .filter((i) => i > 0 && i < words.length - 1);
  const gapWordPositions = shuffleArray(eligibleWordPositions).slice(
    0,
    Math.min(gapCount, eligibleWordPositions.length),
  );
  gapWordPositions.sort((a, b) => a - b);
  const gapWordPositionSet = new Set(gapWordPositions);

  const tokens: (string | null)[] = [];
  const gapIndices: number[] = [];
  const answers: string[] = [];
  let wordPosition = 0;

  for (const part of parts) {
    if (!isWordPart(part)) {
      tokens.push(part);
      continue;
    }

    if (gapWordPositionSet.has(wordPosition)) {
      gapIndices.push(tokens.length);
      answers.push(part);
      tokens.push(null);
    } else {
      tokens.push(part);
    }
    wordPosition += 1;
  }

  // Варианты: правильные + отвлекающие слова из других стихов
  const desiredOptionCount = Math.max(6, answers.length + 4);
  const sourceVerses = allVerses.length > 0 ? allVerses : defaultVerses;
  const distractors = shuffleArray(
    [...new Set(
      sourceVerses
        .filter((v) => v.id !== verse.id)
        .flatMap((v) => tokenizeVerse(v.text))
        .filter((w) => !answers.includes(w)),
    )],
  ).slice(0, desiredOptionCount);

  // Если других стихов мало, добираем слова из текущего, чтобы не остаться без вариантов.
  const fallback = shuffleArray(
    tokenizeVerse(verse.text).filter((w) => !answers.includes(w)),
  );
  const options = shuffleArray(
    [...new Set([...answers, ...distractors, ...fallback])].slice(0, desiredOptionCount),
  );

  return { tokens, gapIndices, answers, options };
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

export function getBookOptions(allVerses: BibleVerse[]): string[] {
  const customBooks = [...new Set(allVerses.map((verse) => verse.book.trim()).filter(Boolean))]
    .filter((book) => !BIBLE_BOOKS_RU.includes(book))
    .sort((a, b) => a.localeCompare(b, 'ru'));

  return [...BIBLE_BOOKS_RU, ...customBooks];
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
