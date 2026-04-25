/* eslint-disable react-refresh/only-export-components */

import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import { achievements as allAchievements } from '../data/achievements';
import { getNewAvatarCharacters, isAvatarUnlocked } from '../data/avatarItems';
import { verses as defaultVerses } from '../data/verses';
import {
  notifyAchievementUnlocked,
  notifyItemUnlocked,
  notifyLevelUp,
} from '../services/notifications';
import {
  addCustomVerse as saveCustomVerse,
  getAchievements,
  getCustomVerses,
  getVerseStatuses,
  initDefaultData,
  saveProfile,
  updateAchievement,
  updateVerseStatus as saveVerseStatus,
} from '../services/db';
import {
  VerseStatus,
  type BibleVerse,
  type UserAchievement,
  type UserProfile,
  type UserVerseStatus,
} from '../types';

interface AppState {
  profile: UserProfile | null;
  achievements: UserAchievement[];
  verseStatuses: UserVerseStatus[];
  customVerses: BibleVerse[];
  loading: boolean;
}

type AppAction =
  | {
      type: 'INIT';
      profile: UserProfile;
      achievements: UserAchievement[];
      verseStatuses: UserVerseStatus[];
      customVerses: BibleVerse[];
    }
  | { type: 'SET_PROFILE'; profile: UserProfile }
  | { type: 'SET_ACHIEVEMENT'; achievement: UserAchievement }
  | { type: 'SET_VERSE_STATUS'; status: UserVerseStatus }
  | { type: 'ADD_CUSTOM_VERSE'; verse: BibleVerse };

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'INIT':
      return {
        profile: action.profile,
        achievements: action.achievements,
        verseStatuses: action.verseStatuses,
        customVerses: action.customVerses,
        loading: false,
      };
    case 'SET_PROFILE':
      return { ...state, profile: action.profile };
    case 'SET_ACHIEVEMENT': {
      const exists = state.achievements.find(
        (a) => a.achievementId === action.achievement.achievementId,
      );
      return {
        ...state,
        achievements: exists
          ? state.achievements.map((a) =>
              a.achievementId === action.achievement.achievementId ? action.achievement : a,
            )
          : [...state.achievements, action.achievement],
      };
    }
    case 'SET_VERSE_STATUS': {
      const exists = state.verseStatuses.find((s) => s.verseId === action.status.verseId);
      return {
        ...state,
        verseStatuses: exists
          ? state.verseStatuses.map((s) =>
              s.verseId === action.status.verseId ? action.status : s,
            )
          : [...state.verseStatuses, action.status],
      };
    }
    case 'ADD_CUSTOM_VERSE':
      return { ...state, customVerses: [action.verse, ...state.customVerses] };
  }
}

interface NewVerseInput {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  difficulty: BibleVerse['difficulty'];
}

interface AppContextValue extends AppState {
  allVerses: BibleVerse[];
  addXP: (amount: number) => Promise<boolean>; // returns true if leveled up
  unlockAchievement: (id: string) => Promise<void>;
  updateAchievementProgress: (id: string, progress: number) => Promise<void>;
  markAchievementsAsSeen: () => Promise<void>;
  setVerseStatus: (verseId: string, status: UserVerseStatus['status']) => Promise<void>;
  markVerseCompleted: (verseId: string) => Promise<void>;
  selectAvatar: (avatarId: string) => Promise<void>;
  addCustomVerse: (input: NewVerseInput) => Promise<BibleVerse>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    profile: null,
    achievements: [],
    verseStatuses: [],
    customVerses: [],
    loading: true,
  });

  useEffect(() => {
    async function init() {
      const profile = await initDefaultData();
      const achievements = await getAchievements();
      const verseStatuses = await getVerseStatuses();
      const customVerses = await getCustomVerses();
      dispatch({ type: 'INIT', profile, achievements, verseStatuses, customVerses });
    }
    init();
  }, []);

  const allVerses = useMemo(() => {
    return [...defaultVerses, ...state.customVerses];
  }, [state.customVerses]);

  async function addXP(amount: number): Promise<boolean> {
    if (!state.profile) return false;

    const previousLevel = state.profile.level;
    let { xp, level } = state.profile;
    xp += amount;

    let leveledUp = false;
    while (xp >= level * 100) {
      xp -= level * 100;
      level += 1;
      leveledUp = true;
    }

    const updated: UserProfile = { ...state.profile, xp, level };
    dispatch({ type: 'SET_PROFILE', profile: updated });
    await saveProfile(updated);

    if (leveledUp) {
      notifyLevelUp(level);
      getNewAvatarCharacters(previousLevel, level).forEach((item) => {
        notifyItemUnlocked(item);
      });
    }

    return leveledUp;
  }

  async function updateAchievementProgress(id: string, progress: number) {
    const existing = state.achievements.find((a) => a.achievementId === id);
    if (existing?.unlockedAt) return;

    const updated: UserAchievement = {
      ...(existing ?? { achievementId: id }),
      achievementId: id,
      progress,
      unlockedAt: undefined,
    };
    dispatch({ type: 'SET_ACHIEVEMENT', achievement: updated });
    await updateAchievement(updated);
  }

  async function unlockAchievement(id: string) {
    const achievement = state.achievements.find((a) => a.achievementId === id);
    const meta = allAchievements.find((a) => a.id === id);
    if (!meta) return;

    const current = achievement ?? { achievementId: id, progress: 0 };
    if (current.unlockedAt) return;

    const updated: UserAchievement = {
      ...current,
      progress: meta.maxProgress,
      unlockedAt: new Date().toISOString(),
      seenAt: undefined,
    };
    dispatch({ type: 'SET_ACHIEVEMENT', achievement: updated });
    await updateAchievement(updated);
    notifyAchievementUnlocked(meta.title, meta.iconEmoji);
  }

  async function markAchievementsAsSeen() {
    const unseen = state.achievements.filter((a) => a.unlockedAt && !a.seenAt);
    if (unseen.length === 0) return;

    const seenAt = new Date().toISOString();
    for (const achievement of unseen) {
      const updated: UserAchievement = {
        ...achievement,
        seenAt,
      };
      dispatch({ type: 'SET_ACHIEVEMENT', achievement: updated });
      await updateAchievement(updated);
    }
  }

  async function setVerseStatus(verseId: string, status: UserVerseStatus['status']) {
    const existing = state.verseStatuses.find((s) => s.verseId === verseId);
    if (status === VerseStatus.MASTERED && existing?.status === VerseStatus.MASTERED) return;
    if (status === VerseStatus.LEARNING && existing?.status === VerseStatus.LEARNING && !existing.completedAt) return;

    const updated: UserVerseStatus =
      status === VerseStatus.MASTERED
        ? {
            verseId,
            status: VerseStatus.MASTERED,
            completedAt: existing?.completedAt ?? new Date().toISOString(),
          }
        : {
            verseId,
            status: VerseStatus.LEARNING,
          };

    dispatch({ type: 'SET_VERSE_STATUS', status: updated });
    await saveVerseStatus(updated);
  }

  async function markVerseCompleted(verseId: string) {
    await setVerseStatus(verseId, VerseStatus.MASTERED);
  }

  async function selectAvatar(avatarId: string) {
    if (!state.profile) return;
    if (!isAvatarUnlocked(avatarId, state.profile.level)) return;

    const updated: UserProfile = { ...state.profile, avatarId };
    dispatch({ type: 'SET_PROFILE', profile: updated });
    await saveProfile(updated);
  }

  async function addCustomVerse(input: NewVerseInput): Promise<BibleVerse> {
    const verse: BibleVerse = {
      id: `custom-${crypto.randomUUID()}`,
      book: input.book.trim(),
      chapter: input.chapter,
      verse: input.verse,
      text: input.text.trim(),
      difficulty: input.difficulty,
    };

    await saveCustomVerse(verse);
    dispatch({ type: 'ADD_CUSTOM_VERSE', verse });
    return verse;
  }

  return (
    <AppContext.Provider
      value={{
        ...state,
        allVerses,
        addXP,
        unlockAchievement,
        updateAchievementProgress,
        markAchievementsAsSeen,
        setVerseStatus,
        markVerseCompleted,
        selectAvatar,
        addCustomVerse,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
