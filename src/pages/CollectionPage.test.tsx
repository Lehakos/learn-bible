import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as db from '../services/db';
import { AppProvider } from '../store/AppContext';
import { resetAppDb } from '../test/testDb';
import { Difficulty, VerseStatus, type BibleVerse } from '../types';
import { CollectionPage } from './CollectionPage';

const masteredVerse: BibleVerse = {
  id: 'col-1',
  book: 'Псалтирь',
  chapter: 22,
  verse: 1,
  text: 'Господь - Пастырь мой; я ни в чем не буду нуждаться.',
  difficulty: Difficulty.EASY,
};

const learningVerse: BibleVerse = {
  id: 'col-2',
  book: 'Исаия',
  chapter: 40,
  verse: 31,
  text: 'А надеющиеся на Господа обновятся в силе.',
  difficulty: Difficulty.EASY,
};

const newVerse: BibleVerse = {
  id: 'col-3',
  book: 'Римлянам',
  chapter: 8,
  verse: 28,
  text: 'Любящим Бога, призванным по Его изволению, все содействует ко благу.',
  difficulty: Difficulty.EASY,
};

function ModesPage() {
  const location = useLocation();
  return (
    <div>
      <h1>Экран режимов</h1>
      <p data-testid="modes-search">{location.search}</p>
    </div>
  );
}

function renderCollectionPage() {
  return render(
    <AppProvider>
      <MemoryRouter initialEntries={['/collection']}>
        <Routes>
          <Route path="/collection" element={<CollectionPage />} />
          <Route path="/modes" element={<ModesPage />} />
          <Route path="/" element={<h1>Главная страница</h1>} />
        </Routes>
      </MemoryRouter>
    </AppProvider>,
  );
}

describe('CollectionPage (integration)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  beforeEach(async () => {
    await resetAppDb();
    sessionStorage.clear();
  });

  it('shows mastered and learning filters with correct verse lists', async () => {
    const user = userEvent.setup();
    await db.addCustomVerse(masteredVerse);
    await db.addCustomVerse(learningVerse);
    await db.updateVerseStatus({
      verseId: masteredVerse.id,
      status: VerseStatus.MASTERED,
      completedAt: new Date().toISOString(),
    });

    renderCollectionPage();

    expect(await screen.findByRole('heading', { name: 'Коллекция стихов' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Все (2)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Выученные (1)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Невыученные (1)' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Выученные (1)' }));
    expect(screen.getByText(masteredVerse.text)).toBeInTheDocument();
    expect(screen.queryByText(learningVerse.text)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Невыученные (1)' }));
    expect(screen.getByText(learningVerse.text)).toBeInTheDocument();
    expect(screen.queryByText(masteredVerse.text)).not.toBeInTheDocument();
  });

  it('shows validation error and saves a custom verse through the form', async () => {
    const user = userEvent.setup();
    renderCollectionPage();

    expect(await screen.findByRole('heading', { name: 'Коллекция стихов' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Добавить стих' }));
    await user.click(screen.getByRole('button', { name: 'Сохранить стих' }));
    expect(screen.getByText('Заполни книгу, главу, стих и текст.')).toBeInTheDocument();

    await user.type(screen.getByRole('textbox', { name: 'Книга' }), newVerse.book);
    await user.type(screen.getByRole('spinbutton', { name: 'Глава' }), String(newVerse.chapter));
    await user.type(screen.getByRole('spinbutton', { name: 'Стих' }), String(newVerse.verse));
    await user.type(screen.getByRole('textbox', { name: 'Текст стиха' }), newVerse.text);
    await user.click(screen.getByRole('button', { name: 'Сохранить стих' }));

    expect(await screen.findByText(newVerse.text)).toBeInTheDocument();
    expect(screen.getByText(`${newVerse.book} ${newVerse.chapter}:${newVerse.verse}`)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Добавить стих' })).toBeInTheDocument();
  });

  it('opens mode selection with verseId when player clicks repeat', async () => {
    const user = userEvent.setup();
    await db.addCustomVerse(masteredVerse);

    renderCollectionPage();

    expect(await screen.findByText(masteredVerse.text)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Повторить' }));

    expect(await screen.findByRole('heading', { name: 'Экран режимов' })).toBeInTheDocument();
    expect(screen.getByTestId('modes-search')).toHaveTextContent(`?verseId=${masteredVerse.id}`);
  });

  it('toggles verse status between learning and mastered', async () => {
    const user = userEvent.setup();
    await db.addCustomVerse(learningVerse);

    renderCollectionPage();

    expect(await screen.findByText(learningVerse.text)).toBeInTheDocument();

    await user.click(screen.getByRole('switch', { name: 'Отметить выученным' }));

    await waitFor(() => {
      expect(screen.getByRole('switch', { name: 'Сделать невыученным' })).toHaveAttribute('aria-checked', 'true');
    });
    expect(screen.getByRole('button', { name: 'Выученные (1)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Невыученные (0)' })).toBeInTheDocument();

    let statuses = await db.getVerseStatuses();
    expect(statuses).toEqual([
      expect.objectContaining({
        verseId: learningVerse.id,
        status: VerseStatus.MASTERED,
        completedAt: expect.any(String),
      }),
    ]);

    await user.click(screen.getByRole('switch', { name: 'Сделать невыученным' }));

    await waitFor(() => {
      expect(screen.getByRole('switch', { name: 'Отметить выученным' })).toHaveAttribute('aria-checked', 'false');
    });
    expect(screen.getByRole('button', { name: 'Выученные (0)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Невыученные (1)' })).toBeInTheDocument();

    statuses = await db.getVerseStatuses();
    expect(statuses).toEqual([
      expect.objectContaining({
        verseId: learningVerse.id,
        status: VerseStatus.LEARNING,
      }),
    ]);
    expect(statuses[0]?.completedAt).toBeUndefined();
  });

  it('validates that chapter and verse are greater than zero', async () => {
    const user = userEvent.setup();
    renderCollectionPage();

    expect(await screen.findByRole('heading', { name: 'Коллекция стихов' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Добавить стих' }));
    await user.type(screen.getByRole('textbox', { name: 'Книга' }), newVerse.book);
    await user.type(screen.getByRole('spinbutton', { name: 'Глава' }), '0');
    await user.type(screen.getByRole('spinbutton', { name: 'Стих' }), '0');
    await user.type(screen.getByRole('textbox', { name: 'Текст стиха' }), newVerse.text);
    await user.click(screen.getByRole('button', { name: 'Сохранить стих' }));

    expect(screen.getByText('Глава и стих должны быть больше нуля.')).toBeInTheDocument();
    expect(screen.queryByText(`${newVerse.book} ${newVerse.chapter}:${newVerse.verse}`)).not.toBeInTheDocument();
  });

  it('shows a clear error when saving a verse fails', async () => {
    const user = userEvent.setup();
    vi.spyOn(db, 'addCustomVerse').mockRejectedValueOnce(new Error('save failed'));

    renderCollectionPage();

    expect(await screen.findByRole('heading', { name: 'Коллекция стихов' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Добавить стих' }));
    await user.type(screen.getByRole('textbox', { name: 'Книга' }), newVerse.book);
    await user.type(screen.getByRole('spinbutton', { name: 'Глава' }), String(newVerse.chapter));
    await user.type(screen.getByRole('spinbutton', { name: 'Стих' }), String(newVerse.verse));
    await user.type(screen.getByRole('textbox', { name: 'Текст стиха' }), newVerse.text);
    await user.click(screen.getByRole('button', { name: 'Сохранить стих' }));

    expect(await screen.findByText('Не удалось сохранить стих. Попробуй снова.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Сохранить стих' })).toBeInTheDocument();
  });
});
