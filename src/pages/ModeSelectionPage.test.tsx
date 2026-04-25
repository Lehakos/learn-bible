import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { addCustomVerse, updateVerseStatus } from '../services/db';
import * as gameService from '../services/gameService';
import { AppProvider } from '../store/AppContext';
import { resetAppDb } from '../test/testDb';
import { Difficulty, VerseStatus, type BibleVerse } from '../types';
import { ModeSelectionPage } from './ModeSelectionPage';

const verseOne: BibleVerse = {
  id: 'v-1',
  book: 'Бытие',
  chapter: 1,
  verse: 1,
  text: 'В начале сотворил Бог небо и землю.',
  difficulty: Difficulty.EASY,
};

const verseTwo: BibleVerse = {
  id: 'v-2',
  book: 'Псалтирь',
  chapter: 1,
  verse: 1,
  text: 'Блажен муж, который не ходит на совет нечестивых.',
  difficulty: Difficulty.EASY,
};

function renderModeSelection(initialEntry = '/modes') {
  return render(
    <AppProvider>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/modes" element={<ModeSelectionPage />} />
          <Route path="/game" element={<h1>Экран игры</h1>} />
        </Routes>
      </MemoryRouter>
    </AppProvider>,
  );
}

describe('ModeSelectionPage (integration)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  beforeEach(async () => {
    await resetAppDb();
    sessionStorage.clear();
  });

  it('starts a session and navigates to game screen when player selects a mode', async () => {
    const user = userEvent.setup();
    await addCustomVerse(verseOne);
    await addCustomVerse(verseTwo);

    renderModeSelection();

    expect(await screen.findByRole('heading', { name: 'Выбери режим' })).toBeInTheDocument();
    await user.click(screen.getByText('Найди текст'));

    expect(await screen.findByRole('heading', { name: 'Экран игры' })).toBeInTheDocument();
    expect(sessionStorage.getItem('currentGameSession')).toBeTruthy();
  });

  it('shows a clear message when there are no unmastered verses', async () => {
    const user = userEvent.setup();
    await addCustomVerse(verseOne);
    await updateVerseStatus({
      verseId: verseOne.id,
      status: VerseStatus.MASTERED,
      completedAt: new Date().toISOString(),
    });

    renderModeSelection();

    expect(await screen.findByRole('heading', { name: 'Выбери режим' })).toBeInTheDocument();
    await user.click(screen.getByText('Заполни пропуски'));

    expect(
      await screen.findByText('Нет невыученных стихов. Отметь нужные стихи как «В изучении» в коллекции.'),
    ).toBeInTheDocument();
  });

  it('shows repeated verse banner when verseId is provided in query params', async () => {
    await addCustomVerse(verseOne);
    await addCustomVerse(verseTwo);

    renderModeSelection('/modes?verseId=v-2');

    expect(await screen.findByText('Повторение стиха:')).toBeInTheDocument();
    expect(screen.getByText('Псалтирь 1:1')).toBeInTheDocument();
  });

  it('shows a generic error when starting a session fails unexpectedly', async () => {
    const user = userEvent.setup();
    await addCustomVerse(verseOne);
    vi.spyOn(gameService, 'createSession').mockRejectedValueOnce(new Error('boom'));

    renderModeSelection();

    expect(await screen.findByRole('heading', { name: 'Выбери режим' })).toBeInTheDocument();
    await user.click(screen.getByText('Найди текст'));

    expect(await screen.findByText('Не удалось начать игру. Попробуй ещё раз.')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Экран игры' })).not.toBeInTheDocument();
  });

  it('does not show repeat banner for a mastered verse from query params', async () => {
    await addCustomVerse(verseOne);
    await addCustomVerse(verseTwo);
    await updateVerseStatus({
      verseId: verseTwo.id,
      status: VerseStatus.MASTERED,
      completedAt: new Date().toISOString(),
    });

    renderModeSelection('/modes?verseId=v-2');

    expect(await screen.findByRole('heading', { name: 'Выбери режим' })).toBeInTheDocument();
    expect(screen.queryByText('Повторение стиха:')).not.toBeInTheDocument();
  });
});
