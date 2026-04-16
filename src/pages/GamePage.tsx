import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameHeader } from '../components/GameHeader';
import { BuildVerseMode } from '../components/modes/BuildVerseMode';
import { FillGapsMode } from '../components/modes/FillGapsMode';
import { FindTextMode } from '../components/modes/FindTextMode';
import { IdentifyRefMode } from '../components/modes/IdentifyRefMode';
import { clearSession, loadSession } from '../services/gameService';
import { useApp } from '../store/AppContext';
import { GameMode } from '../types';
import type { GameResult } from '../types';

export function GamePage() {
  const navigate = useNavigate();
  const { allVerses, loading } = useApp();
  const session = loadSession();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [streak, setStreak] = useState(0);
  const [sessionXP, setSessionXP] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <span className="text-4xl animate-pulse">🙏</span>
      </div>
    );
  }

  if (!session) {
    navigate('/modes', { replace: true });
    return null;
  }

  const activeSession = session;
  const total = activeSession.verses.length;
  const currentVerse = activeSession.verses[currentIndex];

  function handleAnswer(isCorrect: boolean, xpEarned: number) {
    if (isCorrect) {
      setStreak((s) => s + 1);
      setCorrect((c) => c + 1);
    } else {
      setStreak(0);
      setWrong((w) => w + 1);
    }
    setSessionXP((xp) => xp + xpEarned);

    setTimeout(() => {
      if (currentIndex + 1 >= total) {
        const result: GameResult = {
          xpEarned: sessionXP + xpEarned,
          correct: correct + (isCorrect ? 1 : 0),
          wrong: wrong + (isCorrect ? 0 : 1),
          newAchievements: [],
          levelUp: false,
          mode: activeSession.mode,
          verseIds: activeSession.verses.map((v) => v.id),
        };
        sessionStorage.setItem('lastGameResult', JSON.stringify(result));
        clearSession();
        navigate('/result');
      } else {
        setCurrentIndex((i) => i + 1);
      }
    }, 1500);
  }

  function handleExit() {
    clearSession();
    navigate('/modes');
  }

  return (
    <div className="page-enter flex min-h-screen flex-col bg-background">
      <GameHeader
        current={currentIndex}
        total={total}
        streak={streak}
        sessionXP={sessionXP}
        onExit={handleExit}
      />

      <main className="flex flex-1 flex-col p-4">
        <div className="mx-auto w-full max-w-lg flex-1">
          {activeSession.mode === GameMode.FILL_GAPS && (
            <FillGapsMode
              key={currentVerse.id}
              verse={currentVerse}
              difficulty={activeSession.difficulty}
              streak={streak}
              onAnswer={handleAnswer}
            />
          )}
          {activeSession.mode === GameMode.FIND_TEXT && (
            <FindTextMode
              key={currentVerse.id}
              verse={currentVerse}
              allVerses={allVerses}
              streak={streak}
              onAnswer={handleAnswer}
            />
          )}
          {activeSession.mode === GameMode.BUILD_VERSE && (
            <BuildVerseMode
              key={currentVerse.id}
              verse={currentVerse}
              streak={streak}
              onAnswer={handleAnswer}
            />
          )}
          {activeSession.mode === GameMode.IDENTIFY_REF && (
            <IdentifyRefMode
              key={currentVerse.id}
              verse={currentVerse}
              allVerses={allVerses}
              streak={streak}
              onAnswer={handleAnswer}
            />
          )}
        </div>
      </main>
    </div>
  );
}
