import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { GameHeader } from '../components/GameHeader';
import { Button } from '../components/ui/button';
import { BuildVerseMode } from '../components/modes/BuildVerseMode';
import { FillGapsMode } from '../components/modes/FillGapsMode';
import { FindTextMode } from '../components/modes/FindTextMode';
import { IdentifyRefMode } from '../components/modes/IdentifyRefMode';
import { clearSession, loadSession } from '../services/gameService';
import { useApp } from '../store/AppContext';
import { GameMode } from '../types';
import type { GameResult } from '../types';

interface AnswerOptions {
  manualNextOnWrong?: boolean;
}

interface PendingAdvance {
  nextIndex: number;
  sessionXP: number;
  correct: number;
  wrong: number;
}

export function GamePage() {
  const navigate = useNavigate();
  const { allVerses, loading } = useApp();
  const [session] = useState(() => loadSession());

  const [currentIndex, setCurrentIndex] = useState(0);
  const [streak, setStreak] = useState(0);
  const [sessionXP, setSessionXP] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [pendingAdvance, setPendingAdvance] = useState<PendingAdvance | null>(null);
  const [isAutoAdvanceScheduled, setIsAutoAdvanceScheduled] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <span className="text-4xl animate-pulse">🙏</span>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/modes" replace />;
  }

  const activeSession = session;
  const total = activeSession.verses.length;
  const currentVerse = activeSession.verses[currentIndex];

  function proceedAfterAnswer(data: PendingAdvance) {
    setPendingAdvance(null);
    setIsAutoAdvanceScheduled(false);

    if (data.nextIndex >= total) {
      const result: GameResult = {
        xpEarned: data.sessionXP,
        correct: data.correct,
        wrong: data.wrong,
        newAchievements: [],
        levelUp: false,
        mode: activeSession.mode,
        verseIds: activeSession.verses.map((v) => v.id),
      };
      sessionStorage.setItem('lastGameResult', JSON.stringify(result));
      clearSession();
      navigate('/result');
      return;
    }

    setCurrentIndex(data.nextIndex);
  }

  function handleAnswer(isCorrect: boolean, xpEarned: number, options?: AnswerOptions) {
    if (isAutoAdvanceScheduled || pendingAdvance) return;

    if (isCorrect) {
      setStreak((s) => s + 1);
      setCorrect((c) => c + 1);
    } else {
      setStreak(0);
      setWrong((w) => w + 1);
    }
    setSessionXP((xp) => xp + xpEarned);

    const nextData: PendingAdvance = {
      nextIndex: currentIndex + 1,
      sessionXP: sessionXP + xpEarned,
      correct: correct + (isCorrect ? 1 : 0),
      wrong: wrong + (isCorrect ? 0 : 1),
    };

    const requiresManualNext = !isCorrect && options?.manualNextOnWrong;
    if (requiresManualNext) {
      setPendingAdvance(nextData);
      return;
    }

    setIsAutoAdvanceScheduled(true);
    setTimeout(() => proceedAfterAnswer(nextData), 1500);
  }

  function handleContinueAfterWrong() {
    if (!pendingAdvance) return;
    proceedAfterAnswer(pendingAdvance);
    setPendingAdvance(null);
  }

  function handleSkipVerse() {
    if (isAutoAdvanceScheduled || pendingAdvance) return;

    setStreak(0);
    setWrong((w) => w + 1);

    proceedAfterAnswer({
      nextIndex: currentIndex + 1,
      sessionXP,
      correct,
      wrong: wrong + 1,
    });
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
              allVerses={allVerses}
              difficulty={activeSession.difficulty}
              streak={streak}
              onAnswer={handleAnswer}
              onContinueAfterWrong={handleContinueAfterWrong}
            />
          )}
          {activeSession.mode === GameMode.FIND_TEXT && (
            <FindTextMode
              key={currentVerse.id}
              verse={currentVerse}
              allVerses={allVerses}
              streak={streak}
              onAnswer={handleAnswer}
              onContinueAfterWrong={handleContinueAfterWrong}
            />
          )}
          {activeSession.mode === GameMode.BUILD_VERSE && (
            <BuildVerseMode
              key={currentVerse.id}
              verse={currentVerse}
              streak={streak}
              onAnswer={handleAnswer}
              onContinueAfterWrong={handleContinueAfterWrong}
            />
          )}
          {activeSession.mode === GameMode.IDENTIFY_REF && (
            <IdentifyRefMode
              key={currentVerse.id}
              verse={currentVerse}
              allVerses={allVerses}
              streak={streak}
              onAnswer={handleAnswer}
              onContinueAfterWrong={handleContinueAfterWrong}
            />
          )}

          {!pendingAdvance && (
            <div className="mt-6">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleSkipVerse}
                disabled={isAutoAdvanceScheduled}
              >
                Пропустить стих
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
