export enum GameMode {
  FILL_GAPS = 'FILL_GAPS',
  BUILD_VERSE = 'BUILD_VERSE',
  FIND_TEXT = 'FIND_TEXT',
  IDENTIFY_REF = 'IDENTIFY_REF',
}

export enum Difficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

export enum VerseStatus {
  LEARNING = 'learning',
  MASTERED = 'mastered',
}

export interface BibleVerse {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  difficulty: Difficulty;
}

export interface UserProfile {
  id: string;
  name: string;
  level: number;
  xp: number;
  avatarId: string;
  equippedItems: string[];
  unlockedModes: GameMode[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  condition: string;
  maxProgress: number;
  iconEmoji: string;
}

export interface UserAchievement {
  achievementId: string;
  progress: number;
  unlockedAt?: string;
  seenAt?: string;
}

export interface AvatarCharacter {
  id: string;
  name: string;
  description: string;
  unlockLevel: number;
  image: string;
}

export interface UserVerseStatus {
  verseId: string;
  status: VerseStatus;
  completedAt?: string;
}

export interface UserVerseStats {
  verseId: string;
  attempts: number;
  correct: number;
  wrong: number;
  skipped: number;
  currentStreak: number;
  bestStreak: number;
  lastPracticedAt?: string;
  lastCorrectAt?: string;
}

export interface GameSession {
  id: string;
  mode: GameMode;
  verses: BibleVerse[];
  difficulty: Difficulty;
  startedAt: string;
}

export interface GameResult {
  xpEarned: number;
  correct: number;
  wrong: number;
  newAchievements: string[];
  levelUp: boolean;
  newModeUnlocked?: GameMode;
  mode?: GameMode;
  verseIds?: string[];
}
