import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { getAchievements, getProfile } from '../services/db';
import { AppProvider } from '../store/AppContext';
import { resetAppDb } from '../test/testDb';
import { GameMode, type GameResult } from '../types';
import { SessionResultPage } from './SessionResultPage';

function renderResultPage() {
  return render(
    <AppProvider>
      <MemoryRouter initialEntries={['/result']}>
        <Routes>
          <Route path="/result" element={<SessionResultPage />} />
          <Route path="/modes" element={<h1>Экран выбора режима</h1>} />
          <Route path="/" element={<h1>Главная страница</h1>} />
        </Routes>
      </MemoryRouter>
    </AppProvider>,
  );
}

function setLastGameResult(result: GameResult) {
  sessionStorage.setItem('lastGameResult', JSON.stringify(result));
}

async function getAchievement(achievementId: string) {
  const achievements = await getAchievements();
  const achievement = achievements.find((item) => item.achievementId === achievementId);

  if (!achievement) {
    throw new Error(`Achievement not found: ${achievementId}`);
  }

  return achievement;
}

describe('SessionResultPage (integration)', () => {
  beforeEach(async () => {
    await resetAppDb();
    sessionStorage.clear();
  });

  it('redirects to home when no game result is stored', async () => {
    renderResultPage();

    expect(await screen.findByRole('heading', { name: 'Главная страница' })).toBeInTheDocument();
  });

  it('shows score stats and clears persisted result after applying', async () => {
    setLastGameResult({
      xpEarned: 24,
      correct: 4,
      wrong: 1,
      newAchievements: [],
      levelUp: false,
      mode: GameMode.FILL_GAPS,
    });

    renderResultPage();

    expect(await screen.findByRole('heading', { name: 'Хорошая работа!' })).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
    expect(screen.getByText('+24 XP')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Играть снова' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'На главный экран' })).toBeInTheDocument();

    await waitFor(() => {
      expect(sessionStorage.getItem('lastGameResult')).toBeNull();
    });

    const profile = await getProfile();
    expect(profile).toMatchObject({
      level: 1,
      xp: 24,
    });

    const firstSession = await getAchievement('first-session');
    expect(firstSession.progress).toBe(1);
    expect(firstSession.unlockedAt).toBeTruthy();

    const fillGapsProgress = await getAchievement('mode-fill-gaps');
    expect(fillGapsProgress.progress).toBe(1);
    expect(fillGapsProgress.unlockedAt).toBeUndefined();
  });

  it('shows newly unlocked achievements for a perfect session', async () => {
    setLastGameResult({
      xpEarned: 30,
      correct: 5,
      wrong: 0,
      newAchievements: [],
      levelUp: false,
      mode: GameMode.FILL_GAPS,
    });

    renderResultPage();

    expect(await screen.findByRole('heading', { name: 'Безупречно!' })).toBeInTheDocument();
    expect(await screen.findByText('Новые достижения')).toBeInTheDocument();
    expect(screen.getByText('Начало пути')).toBeInTheDocument();
    expect(screen.getByText('Безупречный')).toBeInTheDocument();

    const perfectSession = await getAchievement('perfect-session');
    expect(perfectSession.progress).toBe(1);
    expect(perfectSession.unlockedAt).toBeTruthy();

    const perfectSessionStreak = await getAchievement('perfect-sessions-5');
    expect(perfectSessionStreak.progress).toBe(1);
    expect(perfectSessionStreak.unlockedAt).toBeUndefined();
  });

  it('shows and dismisses level-up banner when earned XP crosses level threshold', async () => {
    const user = userEvent.setup();
    setLastGameResult({
      xpEarned: 100,
      correct: 5,
      wrong: 0,
      newAchievements: [],
      levelUp: false,
      mode: GameMode.BUILD_VERSE,
    });

    renderResultPage();

    expect(await screen.findByText('Новый уровень!')).toBeInTheDocument();
    expect(screen.getByText('Ты стал лучше!')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Отлично!' }));
    await waitFor(() => {
      expect(screen.queryByText('Ты стал лучше!')).not.toBeInTheDocument();
    });

    const profile = await getProfile();
    expect(profile).toMatchObject({
      level: 2,
      xp: 0,
    });
  });

  it('navigates to mode selection when user clicks "Играть снова"', async () => {
    const user = userEvent.setup();
    setLastGameResult({
      xpEarned: 10,
      correct: 3,
      wrong: 2,
      newAchievements: [],
      levelUp: false,
      mode: GameMode.FIND_TEXT,
    });

    renderResultPage();

    expect(await screen.findByRole('heading', { name: 'Хорошая работа!' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Играть снова' }));

    expect(await screen.findByRole('heading', { name: 'Экран выбора режима' })).toBeInTheDocument();
  });

  it('navigates to home when user clicks "На главный экран"', async () => {
    const user = userEvent.setup();
    setLastGameResult({
      xpEarned: 10,
      correct: 3,
      wrong: 2,
      newAchievements: [],
      levelUp: false,
      mode: GameMode.IDENTIFY_REF,
    });

    renderResultPage();

    expect(await screen.findByRole('heading', { name: 'Хорошая работа!' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'На главный экран' }));

    expect(await screen.findByRole('heading', { name: 'Главная страница' })).toBeInTheDocument();
  });
});
