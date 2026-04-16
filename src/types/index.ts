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
}

export enum AvatarCategory {
  BACKGROUND = 'background',
  BODY = 'body',
  ACCESSORY = 'accessory',
}

export interface AvatarItem {
  id: string;
  category: AvatarCategory;
  name: string;
  emoji: string;
  unlockLevel: number;
}

export interface UserVerseStatus {
  verseId: string;
  status: VerseStatus;
  completedAt?: string;
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
