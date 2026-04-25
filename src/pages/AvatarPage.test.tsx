import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { NotificationToast } from '../components/NotificationToast';
import * as db from '../services/db';
import { AppProvider, useApp } from '../store/AppContext';
import { resetAppDb } from '../test/testDb';
import type { UserProfile } from '../types';
import { AvatarPage } from './AvatarPage';
import { HomePage } from './HomePage';

function renderAvatarPage() {
  return render(
    <AppProvider>
      <MemoryRouter initialEntries={['/avatar']}>
        <Routes>
          <Route path="/avatar" element={<AvatarPage />} />
          <Route path="/" element={<h1>Главная страница</h1>} />
        </Routes>
      </MemoryRouter>
    </AppProvider>,
  );
}

function renderHomePage() {
  return render(
    <AppProvider>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/avatar" element={<AvatarPage />} />
          <Route path="/achievements" element={<h1>Награды</h1>} />
          <Route path="/collection" element={<h1>Стихи</h1>} />
        </Routes>
      </MemoryRouter>
    </AppProvider>,
  );
}

function XpHarness() {
  const { addXP, profile } = useApp();

  if (!profile) return <span>Загрузка</span>;

  return (
    <button type="button" onClick={() => void addXP(20)}>
      Добавить XP
    </button>
  );
}

function renderXpHarness() {
  return render(
    <AppProvider>
      <XpHarness />
      <NotificationToast />
    </AppProvider>,
  );
}

async function saveProfilePatch(patch: Partial<UserProfile>) {
  const profile = await db.initDefaultData();
  await db.saveProfile({
    ...profile,
    ...patch,
  });
}

describe('AvatarPage (integration)', () => {
  beforeEach(async () => {
    await resetAppDb();
    sessionStorage.clear();
  });

  it('renders ready biblical avatars and selects David by default', async () => {
    renderAvatarPage();

    expect(await screen.findByRole('heading', { name: 'Аватар' })).toBeInTheDocument();
    expect(screen.getByTestId('avatar-preview')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Давид.*Выбрано/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(
      screen.getByRole('button', { name: 'Аватар откроется на уровне 2' }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Аватар откроется на уровне 9' }),
    ).toBeDisabled();
    expect(screen.queryByText('Руфь')).not.toBeInTheDocument();
    expect(screen.queryByText('Лидия')).not.toBeInTheDocument();
  });

  it('keeps higher-level avatars disabled and does not save them', async () => {
    const user = userEvent.setup();
    renderAvatarPage();

    expect(await screen.findByRole('heading', { name: 'Аватар' })).toBeInTheDocument();

    const lockedAvatar = screen.getByRole('button', {
      name: 'Аватар откроется на уровне 2',
    });
    expect(lockedAvatar).toBeDisabled();

    await user.click(lockedAvatar);

    const profile = await db.getProfile();
    expect(profile?.avatarId).toBe('david');
  });

  it('saves an unlocked avatar and restores it after rerender', async () => {
    const user = userEvent.setup();
    await saveProfilePatch({ level: 4 });

    const view = renderAvatarPage();
    expect(await screen.findByRole('heading', { name: 'Аватар' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Есфирь/ }));

    await waitFor(async () => {
      const profile = await db.getProfile();
      expect(profile?.avatarId).toBe('esther');
    });

    view.unmount();
    renderAvatarPage();

    expect(await screen.findByRole('heading', { name: 'Аватар' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Есфирь.*Выбрано/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('opens the selected avatar in a full-screen preview', async () => {
    const user = userEvent.setup();
    renderAvatarPage();

    expect(await screen.findByRole('heading', { name: 'Аватар' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Открыть аватар Давид/ }));

    expect(screen.getByRole('dialog', { name: 'Давид' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Закрыть' }));

    expect(screen.queryByRole('dialog', { name: 'Давид' })).not.toBeInTheDocument();
  });

  it('shows the saved ready avatar preview on the home page', async () => {
    await saveProfilePatch({
      level: 7,
      avatarId: 'paul',
    });

    renderHomePage();

    expect(await screen.findByTestId('avatar-preview')).toBeInTheDocument();
    expect(screen.queryByText('🧒')).not.toBeInTheDocument();
  });

  it('notifies only newly unlocked avatars when the player levels up', async () => {
    const user = userEvent.setup();
    await saveProfilePatch({ level: 1, xp: 90 });

    renderXpHarness();

    await user.click(await screen.findByRole('button', { name: 'Добавить XP' }));

    expect(await screen.findByText('Новый аватар: Руфь')).toBeInTheDocument();
    expect(screen.queryByText('Новый аватар: Даниил')).not.toBeInTheDocument();
  });
});
