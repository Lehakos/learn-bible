# Bible Verses Game — Implementation Plan

## Context

Проект: мобильная web-игра для заучивания библейских стихов. **4 игровых режима**, все доступны пользователю сразу (без требований по уровню). Стек: React 19 + TypeScript + Vite (уже scaffolded). UI: shadcn/ui + Tailwind CSS. Storage: IndexedDB.

**Режимы (доступны сразу):**
- Заполни пропуски (текст с пропусками, выбор/ввод слов)
- Собери стих (перемешанные слова/фразы, восстановить порядок)
- Найди текст (дана ссылка, выбрать правильный текст)
- Определи ссылку (дан текст, выбрать книгу/главу/стих)

---

## Шаги реализации

### Шаг 1: Настройка окружения (Setup)

**Цель:** Подготовить инструментарий — Tailwind, shadcn/ui, роутинг, структуру папок.

**Действия:**
1. Установить и настроить Tailwind CSS v4 (`@tailwindcss/vite`)
2. Установить и настроить shadcn/ui (`npx shadcn@latest init`)
3. Установить React Router v7 (`react-router-dom`)
4. Удалить файлы шаблона: `App.css`, `src/assets/react.svg`, `src/assets/vite.svg`, `src/assets/hero.png`
5. Переписать `src/index.css` под Tailwind base директивы
6. Создать структуру папок:
   ```
   src/
   ├── components/    # переиспользуемые компоненты
   ├── pages/         # экраны-страницы
   ├── store/         # глобальный стейт (Context)
   ├── services/      # IndexedDB, игровая логика
   ├── types/         # TypeScript интерфейсы
   ├── data/          # начальные данные (стихи, достижения, предметы)
   └── hooks/         # кастомные хуки
   ```
7. Создать `src/App.tsx` с базовым Router + пустыми роутами
8. Проверить `npm run dev` — приложение запускается

**Файлы для изменения:**
- `package.json`, `vite.config.ts`, `src/index.css`, `src/App.tsx`, `src/main.tsx`

---

### Шаг 2: Типы данных и начальные данные

**Цель:** Определить доменную модель и наполнить игру стартовым контентом.

**Действия:**
1. Создать `src/types/index.ts` с интерфейсами:
   - `GameMode` — enum: `FILL_GAPS | BUILD_VERSE | FIND_TEXT | IDENTIFY_REF`
   - `BibleVerse` (id, book, chapter, verse, text, difficulty) — структурированные данные нужны для режимов "Найди текст" и "Определи ссылку"
   - `UserProfile` (id, name, level, xp, equippedItems)
   - `Achievement` (id, title, description, condition, maxProgress, iconEmoji)
   - `UserAchievement` (achievementId, progress, unlockedAt?)
   - `AvatarItem` (id, category, name, emoji, unlockLevel)
   - `UserVerseStatus` (verseId, status: 'learning' | 'mastered', completedAt?)
   - `GameSession` (id, mode, verses, difficulty, startedAt)
   - `GameResult` (xpEarned, correct, wrong, newAchievements, levelUp)
2. Создать `src/data/verses.ts` — 20-30 стихов с полями book/chapter/verse/text
3. Создать `src/data/achievements.ts` — 10-15 достижений (включая достижения за режимы)
4. Создать `src/data/avatarItems.ts` — предметы по категориям

**Файлы для создания:**
- `src/types/index.ts`
- `src/data/verses.ts`
- `src/data/achievements.ts`
- `src/data/avatarItems.ts`

---

### Шаг 3: IndexedDB сервис + глобальный стейт

**Цель:** Слой работы с данными и Context для всего приложения.

**Действия:**
1. Создать `src/services/db.ts`:
   - `openDB()` — objectStores: `profile`, `achievements`, `verseStatus`
   - `getProfile()`, `saveProfile()`
   - `getAchievements()`, `updateAchievement()`
   - `getVerseStatuses()`, `updateVerseStatus()`
   - `initDefaultData()` — первый запуск: профиль пользователя без ограничений по режимам
2. Создать `src/store/AppContext.tsx`:
   - State: `profile`, `achievements`, `verseStatuses`, `loading`
   - Actions: `addXP(amount)`, `unlockAchievement(id)`, `markVerseCompleted(id)`, `equipItem(itemId)`
   - `addXP` считает левелап (`xpNeeded = level * 100`) без логики разблокировки режимов
3. Создать `src/hooks/useProfile.ts`

**Файлы для создания:**
- `src/services/db.ts`
- `src/store/AppContext.tsx`
- `src/hooks/useProfile.ts`

---

### Шаг 4: Переиспользуемые компоненты

**Цель:** Общие UI-блоки, используемые на нескольких экранах.

**Действия:**
1. `src/components/Avatar.tsx` — emoji-стек экипировки
2. `src/components/XPBar.tsx` — прогресс-бар с уровнем
3. `src/components/StreakBadge.tsx` — бейдж серии
4. `src/components/AchievementCard.tsx` — карточка достижения (прогресс, locked/unlocked)
5. `src/components/VerseCard.tsx` — карточка стиха (текст, ссылка, статус)
6. `src/components/BottomNav.tsx` — нижняя навигация с badge для наград
7. `src/components/GameHeader.tsx` — общий хедер игрового экрана: прогресс X/N, streak, XP сессии, кнопка выхода

Все компоненты используют shadcn/ui (Card, Badge, Progress, Button) + Tailwind.

**Файлы для создания:**
- `src/components/Avatar.tsx`, `XPBar.tsx`, `StreakBadge.tsx`
- `src/components/AchievementCard.tsx`, `VerseCard.tsx`
- `src/components/BottomNav.tsx`, `GameHeader.tsx`

---

### Шаг 5: Главный экран (Home)

**Цель:** Точка входа с профилем и кнопкой "Играть".

**Действия:**
1. Создать `src/pages/HomePage.tsx`:
   - Загрузка профиля из Context
   - `<Avatar>`, имя, `<XPBar>`, кнопка "Играть" → `/modes`
   - Кнопки навигации: Достижения, Аватар, Коллекция
   - Badge на "Достижения" при наличии новых

**Файлы:** `src/pages/HomePage.tsx`, `src/App.tsx`

---

### Шаг 6: Экран выбора режима (Mode Selection)

**Цель:** Выбор любого игрового режима без ограничений по уровню.

**Действия:**
1. Создать `src/pages/ModeSelectionPage.tsx`:
   - 4 карточки режимов с иконкой, названием, кратким описанием
   - Все карточки сразу кликабельные
   - При клике на режим → создать сессию, перейти `/game`
2. Создать `src/services/gameService.ts`:
   - `createSession(mode, difficulty?)` → `GameSession` (выбирает 5 стихов)
   - Сохранить сессию в `sessionStorage`

**Файлы:** `src/pages/ModeSelectionPage.tsx`, `src/services/gameService.ts`, `src/App.tsx`

---

### Шаг 7: Игровой экран — режимы "Заполни пропуски" и "Найди текст"

**Цель:** Два режима на основе выбора из вариантов.

**Действия:**
1. Создать `src/pages/GamePage.tsx`:
   - Загрузка сессии из `sessionStorage`
   - `<GameHeader>` (прогресс, streak, xp, выход)
   - Рендерит нужный режим-компонент по `session.mode`
2. Создать `src/components/modes/FillGapsMode.tsx`:
   - Текст с пропусками (визуально выделены `___`)
   - Кнопки-варианты слов (easy/medium) или `<input>` (hard)
   - Проверка ответа: зелёная/красная подсветка, автопереход через 1.5с
3. Создать `src/components/modes/FindTextMode.tsx`:
   - Показывается ссылка: "Псалом 23:1"
   - 4 карточки с вариантами текста (1 правильный + 3 случайных стиха из коллекции)
   - Проверка: подсветка выбранного варианта
4. Дополнить `gameService.ts`:
   - `getGapsForVerse(verse, difficulty)` → текст с пропусками + варианты
   - `getTextOptions(verse, allVerses)` → 4 варианта: правильный + 3 случайных других стиха из коллекции
   - `checkAnswer(mode, guess, correct)` → boolean
   - `calculateXP(correct, streak)` → number

**Файлы:**
- `src/pages/GamePage.tsx`
- `src/components/modes/FillGapsMode.tsx`
- `src/components/modes/FindTextMode.tsx`
- `src/services/gameService.ts`

---

### Шаг 8: Игровой экран — режимы "Собери стих" и "Определи ссылку"

**Цель:** Два оставшихся режима с более сложным UI.

**Действия:**
1. Создать `src/components/modes/BuildVerseMode.tsx`:
   - Перемешанные слова/фразы в виде кнопок
   - Зона "собранного" стиха — кликнуть слово добавляет его в порядок
   - Кнопка "Проверить" (или автопроверка при заполнении всех слов)
   - Подсветка правильного порядка при ошибке
2. Создать `src/components/modes/IdentifyRefMode.tsx`:
   - Показывается текст стиха
   - 3 отдельных селектора: книга, глава, стих (shadcn/ui Select или кнопки)
   - Кнопка "Ответить"
   - Проверка: подсветка каждого поля отдельно
3. Дополнить `gameService.ts`:
   - `getShuffledWords(verse)` → массив слов в случайном порядке
   - `getRefOptions(verse, allVerses)` → варианты книг/глав/стихов

**Файлы:**
- `src/components/modes/BuildVerseMode.tsx`
- `src/components/modes/IdentifyRefMode.tsx`
- `src/services/gameService.ts`

---

### Шаг 9: Экран результата сессии (Session Result)

**Цель:** Итоги, выдача наград, анимации.

**Действия:**
1. Создать `src/pages/SessionResultPage.tsx`:
   - Правильные/ошибки, XP, уровень (анимация при левелапе)
   - Список разблокированных достижений
   - Кнопки: "Играть снова" / "На главный экран"
2. Создать `src/components/LevelUpBanner.tsx` — overlay нового уровня
3. Применить результат через Context: `addXP`, `unlockAchievements`, `markVersesCompleted`
4. Дополнить `gameService.ts`: `checkAchievements(profile, result)` → новые достижения

**Файлы:**
- `src/pages/SessionResultPage.tsx`
- `src/components/LevelUpBanner.tsx`
- `src/services/gameService.ts`

---

### Шаг 10: Экран достижений + Экран коллекции стихов

**Цель:** Два информационных экрана.

**Действия:**
1. Создать `src/pages/AchievementsPage.tsx`:
   - Список `<AchievementCard>` с прогресс-баром
   - Фильтр: Все / Выполненные
2. Создать `src/pages/CollectionPage.tsx`:
   - Список `<VerseCard>` (текст, ссылка, статус)
   - Кнопка "Повторить" → ModeSelection с этим стихом

**Файлы:**
- `src/pages/AchievementsPage.tsx`
- `src/pages/CollectionPage.tsx`
- `src/App.tsx`

---

### Шаг 11: Экран аватара (Avatar)

**Цель:** Кастомизация персонажа.

**Действия:**
1. Создать `src/pages/AvatarPage.tsx`:
   - Превью `<Avatar>` обновляется в реальном времени
   - Вкладки: Фон / Тело / Аксессуары (shadcn/ui Tabs)
   - Сетка предметов: разблокированные (кликабельные), заблокированные (замок + уровень)
2. `equipItem(itemId)` в Context: обновляет `profile.equippedItems`, сохраняет в IndexedDB

**Файлы:** `src/pages/AvatarPage.tsx`, `src/App.tsx`

---

### Шаг 12: Уведомления + финальная полировка

**Цель:** Toast-система, адаптивность, отладка.

**Действия:**
1. Создать `src/components/NotificationToast.tsx` — shadcn/ui Toast для:
   - Новый уровень, достижение, предмет
2. Интегрировать `<Toaster>` в корень приложения, вызывать из Context
3. Полировка:
   - Адаптивность под мобильный экран (375px)
   - Переходы между экранами
   - Тёмная/светлая тема (Tailwind dark mode)
4. (Опционально) `manifest.json` + `vite-plugin-pwa`

**Файлы:** `src/components/NotificationToast.tsx`, `src/main.tsx`, `index.html`

---

## Критические файлы проекта

| Файл | Роль |
|------|------|
| `src/types/index.ts` | Единая доменная модель (включая `GameMode` enum) |
| `src/services/db.ts` | Весь I/O с IndexedDB |
| `src/services/gameService.ts` | Логика всех 4 режимов, XP, достижения |
| `src/store/AppContext.tsx` | Глобальный стейт, левелап, достижения, прогресс |
| `src/data/verses.ts` | База стихов с book/chapter/verse/text |

---

## Верификация каждого шага

После каждого шага:
- `npm run build` — нет TypeScript ошибок
- `npm run lint` — нет ESLint ошибок
- Проверить в браузере на viewport 375px
