import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetBibleTextCache } from '../services/bibleText';
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

function renderCollectionPage(initialEntry = '/collection') {
  return render(
    <AppProvider>
      <MemoryRouter initialEntries={[initialEntry]}>
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
    vi.unstubAllGlobals();
    resetBibleTextCache();
  });

  beforeEach(async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 404 })));
    resetBibleTextCache();
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

  it('shows practice statistics summary and per-verse stats', async () => {
    const user = userEvent.setup();
    await db.addCustomVerse(masteredVerse);
    await db.addCustomVerse(learningVerse);
    await db.updateVerseStats({
      verseId: masteredVerse.id,
      attempts: 4,
      correct: 3,
      wrong: 1,
      skipped: 1,
      currentStreak: 2,
      bestStreak: 3,
      lastPracticedAt: '2026-04-26T10:00:00.000Z',
      lastCorrectAt: '2026-04-26T10:00:00.000Z',
    });

    renderCollectionPage();

    expect(await screen.findByRole('heading', { name: 'Коллекция стихов' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Показать статистику' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(screen.queryByText('Статистика практики')).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText(
        `Статистика стиха ${masteredVerse.book} ${masteredVerse.chapter}:${masteredVerse.verse}`,
      ),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Показать статистику' }));

    expect(screen.getByRole('button', { name: 'Скрыть статистику' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByText('Статистика практики')).toBeInTheDocument();
    expect(screen.getByText('Стихов')).toBeInTheDocument();
    expect(screen.getAllByText('4')).not.toHaveLength(0);
    expect(screen.getAllByText('75%')).not.toHaveLength(0);

    const practicedStats = screen.getByLabelText(
      `Статистика стиха ${masteredVerse.book} ${masteredVerse.chapter}:${masteredVerse.verse}`,
    );
    expect(practicedStats).toHaveTextContent('4');
    expect(practicedStats).toHaveTextContent('75%');
    expect(practicedStats).toHaveTextContent('3');
    expect(practicedStats).toHaveTextContent('пропусков: 1');

    const emptyStats = screen.getByLabelText(
      `Статистика стиха ${learningVerse.book} ${learningVerse.chapter}:${learningVerse.verse}`,
    );
    expect(emptyStats).toHaveTextContent('Статистика появится после первой тренировки.');

    await user.click(screen.getByRole('button', { name: 'Скрыть статистику' }));
    expect(screen.queryByText('Статистика практики')).not.toBeInTheDocument();
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

  it('auto-fills verse text from the loaded Bible source', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);

      if (url.endsWith('/data/nwt-ru/manifest.json')) {
        return new Response(
          JSON.stringify({
            translation: 'Тестовый перевод',
            language: 'ru',
            source: 'test.epub',
            books: [
              {
                name: 'Бытие',
                file: 'books/01.json',
                chapters: [2],
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }

      if (url.endsWith('/data/nwt-ru/books/01.json')) {
        return new Response(
          JSON.stringify({
            name: 'Бытие',
            chapters: [['В начале Бог создал небо и землю.', 'Земля была безлика и пуста.']],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }

      return new Response('', { status: 404 });
    });

    vi.stubGlobal('fetch', fetchMock);

    renderCollectionPage();

    expect(await screen.findByRole('heading', { name: 'Коллекция стихов' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Добавить стих' }));
    await user.type(screen.getByRole('textbox', { name: 'Книга' }), 'Бытие');
    await user.selectOptions(await screen.findByRole('combobox', { name: 'Глава' }), '1');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Стих' }), '2');

    expect(await screen.findByDisplayValue('Земля была безлика и пуста.')).toBeInTheDocument();
    expect(screen.getByText('Текст подставлен из перевода «Тестовый перевод».')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/data/nwt-ru/manifest.json'));
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/data/nwt-ru/books/01.json'));
  });

  it('loads only the selected Bible book after opening the form', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);

      if (url.endsWith('/data/nwt-ru/manifest.json')) {
        return new Response(
          JSON.stringify({
            translation: 'Тестовый перевод',
            language: 'ru',
            source: 'test.epub',
            books: [
              {
                name: 'Бытие',
                file: 'books/01.json',
                chapters: [2],
              },
              {
                name: 'Иоанна',
                file: 'books/43.json',
                chapters: [51, 25, 36],
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }

      if (url.endsWith('/data/nwt-ru/books/43.json')) {
        return new Response(
          JSON.stringify({
            name: 'Иоанна',
            chapters: [
              [],
              [],
              Array.from({ length: 16 }, (_, index) =>
                index === 15 ? 'Тестовый текст Иоанна 3:16.' : `Стих ${index + 1}`,
              ),
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }

      return new Response('', { status: 404 });
    });

    vi.stubGlobal('fetch', fetchMock);
    renderCollectionPage();

    expect(await screen.findByRole('heading', { name: 'Коллекция стихов' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Добавить стих' }));
    await user.type(screen.getByRole('textbox', { name: 'Книга' }), 'Иоанна');
    await user.selectOptions(await screen.findByRole('combobox', { name: 'Глава' }), '1');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Глава' }), '3');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Стих' }), '16');

    expect(await screen.findByDisplayValue('Тестовый текст Иоанна 3:16.')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/data/nwt-ru/manifest.json'));
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/data/nwt-ru/books/43.json'));
    expect(fetchMock).not.toHaveBeenCalledWith(expect.stringContaining('/data/nwt-ru/books/01.json'));
  });

  it('uses only manifest books in the Bible book dropdown', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL | Request) => {
        const url = String(input);

        if (url.endsWith('/data/nwt-ru/manifest.json')) {
          return new Response(
            JSON.stringify({
              translation: 'Тестовый перевод',
              language: 'ru',
              source: 'test.epub',
              books: [
                { name: 'Бытие', file: 'books/01.json', chapters: [2] },
                { name: 'Откровение', file: 'books/66.json', chapters: [20] },
              ],
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          );
        }

        return new Response('', { status: 404 });
      }),
    );

    renderCollectionPage();

    expect(await screen.findByRole('heading', { name: 'Коллекция стихов' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Добавить стих' }));
    await user.click(screen.getByRole('textbox', { name: 'Книга' }));

    expect(await screen.findByText('Откровение')).toBeInTheDocument();
    expect(screen.getByText('Бытие')).toBeInTheDocument();
    expect(screen.queryByText('Есфирь')).not.toBeInTheDocument();
    expect(screen.queryByText('Иоанна')).not.toBeInTheDocument();
  });

  it('opens the add verse form and hint from query params', async () => {
    renderCollectionPage('/collection?add=verse&hint=no-verses');

    expect(await screen.findByRole('heading', { name: 'Коллекция стихов' })).toBeInTheDocument();
    expect(screen.getByText('Добавь стих, чтобы выбрать задание и начать игру.')).toBeInTheDocument();
    expect(screen.getByText('Новый стих')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Сохранить стих' })).toBeInTheDocument();
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

  it('deletes a custom verse from the collection with its progress data', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    await db.addCustomVerse(learningVerse);
    await db.updateVerseStatus({
      verseId: learningVerse.id,
      status: VerseStatus.MASTERED,
      completedAt: '2026-04-26T10:00:00.000Z',
    });
    await db.updateVerseStats({
      verseId: learningVerse.id,
      attempts: 2,
      correct: 1,
      wrong: 1,
      skipped: 0,
      currentStreak: 0,
      bestStreak: 1,
      lastPracticedAt: '2026-04-26T10:00:00.000Z',
    });

    renderCollectionPage();

    expect(await screen.findByText(learningVerse.text)).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', {
        name: `Удалить стих ${learningVerse.book} ${learningVerse.chapter}:${learningVerse.verse}`,
      }),
    );

    await waitFor(() => {
      expect(screen.queryByText(learningVerse.text)).not.toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Все (0)' })).toBeInTheDocument();
    expect(await db.getCustomVerses()).toEqual([]);
    expect(await db.getVerseStatuses()).toEqual([]);
    expect(await db.getVerseStats()).toEqual([]);
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
