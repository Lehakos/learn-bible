import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { addCustomVerse } from '../services/db';
import { AppProvider } from '../store/AppContext';
import { resetAppDb } from '../test/testDb';
import { Difficulty, GameMode, type BibleVerse, type GameResult, type GameSession } from '../types';
import { GamePage } from './GamePage';

const fillGapsVerse: BibleVerse = {
  id: 'fill-1',
  book: 'Тест',
  chapter: 1,
  verse: 1,
  text: 'Альфа Бета Гамма Омега',
  difficulty: Difficulty.EASY,
};

const buildVerse: BibleVerse = {
  id: 'build-1',
  book: 'Тест',
  chapter: 1,
  verse: 2,
  text: 'Один Два Три Четыре',
  difficulty: Difficulty.EASY,
};

const secondFillGapsVerse: BibleVerse = {
  id: 'fill-2',
  book: 'Тест',
  chapter: 1,
  verse: 5,
  text: 'Первый Второй Третий Четвертый',
  difficulty: Difficulty.EASY,
};

const identifyVerse: BibleVerse = {
  id: 'identify-1',
  book: 'Иоанна',
  chapter: 3,
  verse: 16,
  text: 'Ибо так возлюбил Бог мир, что отдал Сына Своего Единородного.',
  difficulty: Difficulty.EASY,
};

const findTargetVerse: BibleVerse = {
  id: 'find-1',
  book: 'Тест',
  chapter: 2,
  verse: 1,
  text: 'Это правильный текст для режима поиска.',
  difficulty: Difficulty.EASY,
};

const findDistractorOne: BibleVerse = {
  id: 'find-2',
  book: 'Тест',
  chapter: 2,
  verse: 2,
  text: 'Это отвлекающий вариант номер один.',
  difficulty: Difficulty.EASY,
};

const findDistractorTwo: BibleVerse = {
  id: 'find-3',
  book: 'Тест',
  chapter: 2,
  verse: 3,
  text: 'Это отвлекающий вариант номер два.',
  difficulty: Difficulty.EASY,
};

const findDistractorThree: BibleVerse = {
  id: 'find-4',
  book: 'Тест',
  chapter: 2,
  verse: 4,
  text: 'Это отвлекающий вариант номер три.',
  difficulty: Difficulty.EASY,
};

function saveSession(session: GameSession) {
  sessionStorage.setItem('currentGameSession', JSON.stringify(session));
}

async function seedVerses(verses: BibleVerse[]) {
  for (const verse of verses) {
    await addCustomVerse(verse);
  }
}

async function expectResultScreen() {
  expect(await screen.findByRole('heading', { name: 'Экран результата' })).toBeInTheDocument();
}

function expectResultScreenSync() {
  expect(screen.getByRole('heading', { name: 'Экран результата' })).toBeInTheDocument();
}

async function clickEnabledWordButton(user: ReturnType<typeof userEvent.setup>, word: string) {
  const button = screen
    .getAllByRole('button', { name: word })
    .find((item) => !item.hasAttribute('disabled'));

  if (!button) {
    throw new Error(`Could not find enabled word button: ${word}`);
  }

  await user.click(button);
}

function clickEnabledWordButtonSync(word: string) {
  const button = screen
    .getAllByRole('button', { name: word })
    .find((item) => !item.hasAttribute('disabled'));

  if (!button) {
    throw new Error(`Could not find enabled word button: ${word}`);
  }

  fireEvent.click(button);
}

async function advanceAutoTransition() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1500);
  });
}

function renderGamePage() {
  return render(
    <AppProvider>
      <MemoryRouter initialEntries={['/game']}>
        <Routes>
          <Route path="/game" element={<GamePage />} />
          <Route path="/modes" element={<h1>Экран выбора режима</h1>} />
          <Route path="/result" element={<h1>Экран результата</h1>} />
        </Routes>
      </MemoryRouter>
    </AppProvider>,
  );
}

describe('GamePage (integration)', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  beforeEach(async () => {
    await resetAppDb();
    sessionStorage.clear();
  });

  it('redirects to mode selection when there is no active session', async () => {
    renderGamePage();

    expect(await screen.findByRole('heading', { name: 'Экран выбора режима' })).toBeInTheDocument();
  });

  describe('Fill Gaps Mode', () => {
    it('completes session after correct answer', async () => {
      await seedVerses([fillGapsVerse]);

      saveSession({
        id: 'session-fill-correct',
        mode: GameMode.FILL_GAPS,
        verses: [fillGapsVerse],
        difficulty: Difficulty.EASY,
        startedAt: new Date().toISOString(),
      });

      renderGamePage();
      expect(await screen.findByRole('button', { name: 'Бета' })).toBeInTheDocument();
      vi.useFakeTimers();

      fireEvent.click(screen.getByRole('button', { name: 'Бета' }));
      fireEvent.click(screen.getByRole('button', { name: 'Гамма' }));
      await advanceAutoTransition();

      expectResultScreenSync();
    });

    it('shows correction and lets player continue after wrong answer', async () => {
      const user = userEvent.setup();
      await seedVerses([fillGapsVerse]);

      saveSession({
        id: 'session-fill-wrong',
        mode: GameMode.FILL_GAPS,
        verses: [fillGapsVerse],
        difficulty: Difficulty.EASY,
        startedAt: new Date().toISOString(),
      });

      renderGamePage();
      expect(await screen.findByRole('button', { name: 'Альфа' })).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Альфа' }));
      await user.click(screen.getByRole('button', { name: 'Омега' }));

      expect(screen.getByText('Правильно: Бета, Гамма')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Дальше' }));

      await expectResultScreen();
    });

    it('stores session result for multiple verses and supports skipping', async () => {
      await seedVerses([fillGapsVerse, secondFillGapsVerse]);

      saveSession({
        id: 'session-fill-multi',
        mode: GameMode.FILL_GAPS,
        verses: [fillGapsVerse, secondFillGapsVerse],
        difficulty: Difficulty.EASY,
        startedAt: new Date().toISOString(),
      });

      renderGamePage();
      expect(await screen.findByRole('button', { name: 'Бета' })).toBeInTheDocument();
      vi.useFakeTimers();

      fireEvent.click(screen.getByRole('button', { name: 'Бета' }));
      fireEvent.click(screen.getByRole('button', { name: 'Гамма' }));
      await advanceAutoTransition();

      expect(screen.getByText('Тест 1:5')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Пропустить стих' }));

      expectResultScreenSync();
      expect(sessionStorage.getItem('currentGameSession')).toBeNull();

      const result = JSON.parse(sessionStorage.getItem('lastGameResult') ?? 'null') as GameResult | null;
      expect(result).toMatchObject({
        xpEarned: 10,
        correct: 1,
        wrong: 1,
        mode: GameMode.FILL_GAPS,
        verseIds: [fillGapsVerse.id, secondFillGapsVerse.id],
      });
    });
  });

  describe('Build Verse Mode', () => {
    it('completes session after assembling correct order', async () => {
      await seedVerses([buildVerse]);

      saveSession({
        id: 'session-build-correct',
        mode: GameMode.BUILD_VERSE,
        verses: [buildVerse],
        difficulty: Difficulty.EASY,
        startedAt: new Date().toISOString(),
      });

      renderGamePage();
      expect(await screen.findByText('Собери стих по порядку')).toBeInTheDocument();
      vi.useFakeTimers();

      clickEnabledWordButtonSync('Один');
      clickEnabledWordButtonSync('Два');
      clickEnabledWordButtonSync('Три');
      clickEnabledWordButtonSync('Четыре');
      await advanceAutoTransition();

      expectResultScreenSync();
    });

    it('shows correct verse and lets player continue after wrong order', async () => {
      const user = userEvent.setup();
      await seedVerses([buildVerse]);

      saveSession({
        id: 'session-build-wrong',
        mode: GameMode.BUILD_VERSE,
        verses: [buildVerse],
        difficulty: Difficulty.EASY,
        startedAt: new Date().toISOString(),
      });

      renderGamePage();
      expect(await screen.findByText('Собери стих по порядку')).toBeInTheDocument();

      await clickEnabledWordButton(user, 'Четыре');
      await clickEnabledWordButton(user, 'Три');
      await clickEnabledWordButton(user, 'Два');
      await clickEnabledWordButton(user, 'Один');

      expect(screen.getByText(`Правильно: ${buildVerse.text}`)).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Дальше' }));

      await expectResultScreen();
    });
  });

  describe('Find Text Mode', () => {
    it('completes session after selecting correct text', async () => {
      await seedVerses([
        findTargetVerse,
        findDistractorOne,
        findDistractorTwo,
        findDistractorThree,
      ]);

      saveSession({
        id: 'session-find-correct',
        mode: GameMode.FIND_TEXT,
        verses: [findTargetVerse],
        difficulty: Difficulty.EASY,
        startedAt: new Date().toISOString(),
      });

      renderGamePage();
      expect(await screen.findByText('Найди текст стиха')).toBeInTheDocument();
      vi.useFakeTimers();

      fireEvent.click(screen.getByText(findTargetVerse.text));
      await advanceAutoTransition();

      expectResultScreenSync();
    });

    it('lets player continue after selecting wrong text', async () => {
      const user = userEvent.setup();
      await seedVerses([
        findTargetVerse,
        findDistractorOne,
        findDistractorTwo,
        findDistractorThree,
      ]);

      saveSession({
        id: 'session-find-wrong',
        mode: GameMode.FIND_TEXT,
        verses: [findTargetVerse],
        difficulty: Difficulty.EASY,
        startedAt: new Date().toISOString(),
      });

      renderGamePage();
      expect(await screen.findByText('Найди текст стиха')).toBeInTheDocument();

      await user.click(screen.getByText(findDistractorOne.text));
      expect(screen.getByRole('button', { name: 'Дальше' })).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Дальше' }));

      await expectResultScreen();
    });
  });

  describe('Identify Reference Mode', () => {
    it('completes session after correct answer', async () => {
      await seedVerses([identifyVerse]);

      saveSession({
        id: 'session-identify-correct',
        mode: GameMode.IDENTIFY_REF,
        verses: [identifyVerse],
        difficulty: Difficulty.EASY,
        startedAt: new Date().toISOString(),
      });

      renderGamePage();

      expect(await screen.findByText('Определи ссылку')).toBeInTheDocument();
      vi.useFakeTimers();

      fireEvent.change(screen.getByRole('textbox', { name: 'Книга' }), {
        target: { value: identifyVerse.book },
      });
      const chapterInput = screen.getByRole('spinbutton', { name: 'Глава' });
      const verseInput = screen.getByRole('spinbutton', { name: 'Стих' });
      fireEvent.change(chapterInput, { target: { value: String(identifyVerse.chapter) } });
      fireEvent.change(verseInput, { target: { value: String(identifyVerse.verse) } });
      fireEvent.click(screen.getByRole('button', { name: 'Ответить' }));
      await advanceAutoTransition();

      expectResultScreenSync();
    });

    it('lets player continue after wrong answer', async () => {
      const user = userEvent.setup();
      await seedVerses([identifyVerse]);

      saveSession({
        id: 'session-identify-wrong',
        mode: GameMode.IDENTIFY_REF,
        verses: [identifyVerse],
        difficulty: Difficulty.EASY,
        startedAt: new Date().toISOString(),
      });

      renderGamePage();

      expect(await screen.findByText('Определи ссылку')).toBeInTheDocument();

      await user.type(screen.getByRole('textbox', { name: 'Книга' }), 'Матфея');
      const chapterInput = screen.getByRole('spinbutton', { name: 'Глава' });
      const verseInput = screen.getByRole('spinbutton', { name: 'Стих' });
      await user.type(chapterInput, '1');
      await user.type(verseInput, '1');
      await user.click(screen.getByRole('button', { name: 'Ответить' }));

      expect(screen.getByText(`Правильно: ${identifyVerse.book}`)).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Дальше' }));

      await expectResultScreen();
    });

    it('clears the session and returns to mode selection when player exits', async () => {
      const user = userEvent.setup();
      await seedVerses([identifyVerse]);

      saveSession({
        id: 'session-exit',
        mode: GameMode.IDENTIFY_REF,
        verses: [identifyVerse],
        difficulty: Difficulty.EASY,
        startedAt: new Date().toISOString(),
      });

      renderGamePage();
      expect(await screen.findByText('Определи ссылку')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Выйти из игры' }));

      expect(await screen.findByRole('heading', { name: 'Экран выбора режима' })).toBeInTheDocument();
      expect(sessionStorage.getItem('currentGameSession')).toBeNull();
      expect(sessionStorage.getItem('lastGameResult')).toBeNull();
    });
  });
});
