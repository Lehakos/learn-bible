import { GameMode, type BibleVerse, type UserAchievement, type UserProfile, type UserVerseStatus } from '../types';
import { achievements as defaultAchievements } from '../data/achievements';
import { DEFAULT_AVATAR_ID, resolveAvatarId } from '../data/avatarItems';

const DB_NAME = 'BibleVersesGame';
const DB_VERSION = 2;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('profile')) {
        db.createObjectStore('profile', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('achievements')) {
        db.createObjectStore('achievements', { keyPath: 'achievementId' });
      }
      if (!db.objectStoreNames.contains('verseStatus')) {
        db.createObjectStore('verseStatus', { keyPath: 'verseId' });
      }
      if (!db.objectStoreNames.contains('customVerses')) {
        db.createObjectStore('customVerses', { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function get<T>(db: IDBDatabase, store: string, key: string): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

function getAll<T>(db: IDBDatabase, store: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror = () => reject(req.error);
  });
}

function put(db: IDBDatabase, store: string, value: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    const req = tx.objectStore(store).put(value);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getProfile(): Promise<UserProfile | undefined> {
  const db = await openDB();
  return get<UserProfile>(db, 'profile', 'user');
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  const db = await openDB();
  await put(db, 'profile', profile);
}

export async function getAchievements(): Promise<UserAchievement[]> {
  const db = await openDB();
  return getAll<UserAchievement>(db, 'achievements');
}

export async function updateAchievement(achievement: UserAchievement): Promise<void> {
  const db = await openDB();
  await put(db, 'achievements', achievement);
}

export async function getVerseStatuses(): Promise<UserVerseStatus[]> {
  const db = await openDB();
  return getAll<UserVerseStatus>(db, 'verseStatus');
}

export async function updateVerseStatus(status: UserVerseStatus): Promise<void> {
  const db = await openDB();
  await put(db, 'verseStatus', status);
}

export async function getCustomVerses(): Promise<BibleVerse[]> {
  const db = await openDB();
  return getAll<BibleVerse>(db, 'customVerses');
}

export async function addCustomVerse(verse: BibleVerse): Promise<void> {
  const db = await openDB();
  await put(db, 'customVerses', verse);
}

export async function initDefaultData(): Promise<UserProfile> {
  const existing = await getProfile();
  if (existing) {
    const normalized = normalizeProfile(existing);
    await saveProfile(normalized);
    return normalized;
  }

  const profile: UserProfile = {
    id: 'user',
    name: 'Игрок',
    level: 1,
    xp: 0,
    avatarId: DEFAULT_AVATAR_ID,
    equippedItems: [],
    unlockedModes: [
      GameMode.FILL_GAPS,
      GameMode.BUILD_VERSE,
      GameMode.FIND_TEXT,
      GameMode.IDENTIFY_REF,
    ],
  };
  await saveProfile(profile);

  const db = await openDB();
  for (const achievement of defaultAchievements) {
    const userAch: UserAchievement = {
      achievementId: achievement.id,
      progress: 0,
    };
    await put(db, 'achievements', userAch);
  }

  return profile;
}

function normalizeProfile(profile: UserProfile): UserProfile {
  return {
    ...profile,
    avatarId: resolveAvatarId(profile.avatarId, profile.level),
    equippedItems: profile.equippedItems ?? [],
    unlockedModes: profile.unlockedModes ?? [
      GameMode.FILL_GAPS,
      GameMode.BUILD_VERSE,
      GameMode.FIND_TEXT,
      GameMode.IDENTIFY_REF,
    ],
  };
}
