import { useApp } from '../store/AppContext';
import type {
  BibleVerse,
  UserAchievement,
  UserProfile,
  UserVerseStatus,
} from '../types';

interface UseProfileResult {
  profile: UserProfile | null;
  achievements: UserAchievement[];
  verseStatuses: UserVerseStatus[];
  allVerses: BibleVerse[];
  loading: boolean;
  addXP: (amount: number) => Promise<boolean>;
  unlockAchievement: (id: string) => Promise<void>;
  setVerseStatus: (verseId: string, status: UserVerseStatus['status']) => Promise<void>;
  markVerseCompleted: (verseId: string) => Promise<void>;
  selectAvatar: (avatarId: string) => Promise<void>;
}

export function useProfile(): UseProfileResult {
  const {
    profile,
    achievements,
    verseStatuses,
    allVerses,
    loading,
    addXP,
    unlockAchievement,
    setVerseStatus,
    markVerseCompleted,
    selectAvatar,
  } = useApp();

  return {
    profile,
    achievements,
    verseStatuses,
    allVerses,
    loading,
    addXP,
    unlockAchievement,
    setVerseStatus,
    markVerseCompleted,
    selectAvatar,
  };
}
