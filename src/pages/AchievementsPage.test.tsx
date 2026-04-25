import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { initDefaultData, updateAchievement } from '../services/db';
import { AppProvider } from '../store/AppContext';
import { resetAppDb } from '../test/testDb';
import { HomePage } from './HomePage';
import { AchievementsPage } from './AchievementsPage';

function renderAchievementsPage() {
  return render(
    <AppProvider>
      <MemoryRouter initialEntries={['/achievements']}>
        <Routes>
          <Route path="/achievements" element={<AchievementsPage />} />
          <Route path="/" element={<h1>Главная страница</h1>} />
        </Routes>
      </MemoryRouter>
    </AppProvider>,
  );
}

function renderAppWithBottomNav(initialEntry = '/') {
  return render(
    <AppProvider>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/achievements" element={<AchievementsPage />} />
          <Route path="/avatar" element={<h1>Avatar</h1>} />
          <Route path="/collection" element={<h1>Collection</h1>} />
        </Routes>
      </MemoryRouter>
    </AppProvider>,
  );
}

describe('AchievementsPage (integration)', () => {
  beforeEach(async () => {
    await resetAppDb();
    sessionStorage.clear();
  });

  it('shows achievements list on the page', async () => {
    renderAchievementsPage();

    expect(await screen.findByRole('heading', { name: 'Достижения' })).toBeInTheDocument();
    expect(screen.getByText('Первый стих')).toBeInTheDocument();
    expect(screen.getByText('Начало пути')).toBeInTheDocument();
    expect(screen.getByText('Знаток')).toBeInTheDocument();
  });

  it('shows only completed achievements when completed filter is selected', async () => {
    const user = userEvent.setup();
    await initDefaultData();
    await updateAchievement({
      achievementId: 'first-verse',
      progress: 1,
      unlockedAt: new Date().toISOString(),
    });
    await updateAchievement({
      achievementId: 'sessions-10',
      progress: 4,
    });

    renderAchievementsPage();

    expect(await screen.findByRole('heading', { name: 'Достижения' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Выполненные' }));

    expect(screen.getByText('Первый стих')).toBeInTheDocument();
    expect(screen.queryByText('Начало пути')).not.toBeInTheDocument();
  });

  it('shows empty message when there are no completed achievements', async () => {
    const user = userEvent.setup();
    renderAchievementsPage();

    expect(await screen.findByRole('heading', { name: 'Достижения' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Выполненные' }));

    expect(screen.getByText('Пока нет выполненных достижений.')).toBeInTheDocument();
  });
});

describe('Achievement notifications in navigation (integration)', () => {
  beforeEach(async () => {
    await resetAppDb();
    sessionStorage.clear();
  });

  it('shows badge in bottom navigation for new achievements', async () => {
    await initDefaultData();
    await updateAchievement({
      achievementId: 'first-verse',
      progress: 1,
      unlockedAt: new Date().toISOString(),
    });

    renderAppWithBottomNav('/');

    const rewardsButton = await screen.findByRole('button', { name: /Награды/i });
    expect(within(rewardsButton).getByText('1')).toBeInTheDocument();
  });

  it('removes badge after user opens achievements page and notifications are marked as seen', async () => {
    const user = userEvent.setup();
    await initDefaultData();
    await updateAchievement({
      achievementId: 'first-verse',
      progress: 1,
      unlockedAt: new Date().toISOString(),
    });

    renderAppWithBottomNav('/');

    const rewardsButtonOnHome = await screen.findByRole('button', { name: /Награды/i });
    expect(within(rewardsButtonOnHome).getByText('1')).toBeInTheDocument();

    await user.click(rewardsButtonOnHome);
    expect(await screen.findByRole('heading', { name: 'Достижения' })).toBeInTheDocument();

    await waitFor(() => {
      const rewardsButton = screen.getByRole('button', { name: /Награды/i });
      expect(within(rewardsButton).queryByText('1')).not.toBeInTheDocument();
    });
  });
});
