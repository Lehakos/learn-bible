import type { Achievement } from '../types';

export const achievements: Achievement[] = [
  // Первые шаги
  {
    id: 'first-verse',
    title: 'Первый стих',
    description: 'Выучи свой первый стих',
    condition: 'mastered_verses',
    maxProgress: 1,
    iconEmoji: '🌱',
  },
  {
    id: 'first-session',
    title: 'Начало пути',
    description: 'Заверши первую игровую сессию',
    condition: 'sessions_completed',
    maxProgress: 1,
    iconEmoji: '🚀',
  },

  // Коллекционирование стихов
  {
    id: 'verses-5',
    title: 'Ученик',
    description: 'Выучи 5 стихов',
    condition: 'mastered_verses',
    maxProgress: 5,
    iconEmoji: '📖',
  },
  {
    id: 'verses-10',
    title: 'Знаток',
    description: 'Выучи 10 стихов',
    condition: 'mastered_verses',
    maxProgress: 10,
    iconEmoji: '📚',
  },
  {
    id: 'verses-25',
    title: 'Мудрец',
    description: 'Выучи 25 стихов',
    condition: 'mastered_verses',
    maxProgress: 25,
    iconEmoji: '🏆',
  },

  // Сессии
  {
    id: 'sessions-10',
    title: 'Настойчивый',
    description: 'Заверши 10 сессий',
    condition: 'sessions_completed',
    maxProgress: 10,
    iconEmoji: '💪',
  },
  {
    id: 'sessions-50',
    title: 'Преданный',
    description: 'Заверши 50 сессий',
    condition: 'sessions_completed',
    maxProgress: 50,
    iconEmoji: '🔥',
  },

  // Точность
  {
    id: 'perfect-session',
    title: 'Безупречный',
    description: 'Заверши сессию без единой ошибки',
    condition: 'perfect_session',
    maxProgress: 1,
    iconEmoji: '⭐',
  },
  {
    id: 'perfect-sessions-5',
    title: 'Мастер',
    description: 'Заверши 5 сессий без ошибок',
    condition: 'perfect_sessions',
    maxProgress: 5,
    iconEmoji: '🌟',
  },

  // Режимы игры
  {
    id: 'mode-fill-gaps',
    title: 'Заполнятель пробелов',
    description: 'Заверши 5 сессий в режиме «Заполни пропуски»',
    condition: 'mode_fill_gaps_sessions',
    maxProgress: 5,
    iconEmoji: '✏️',
  },
  {
    id: 'mode-build-verse',
    title: 'Строитель',
    description: 'Заверши 5 сессий в режиме «Собери стих»',
    condition: 'mode_build_verse_sessions',
    maxProgress: 5,
    iconEmoji: '🧩',
  },
  {
    id: 'mode-find-text',
    title: 'Исследователь',
    description: 'Заверши 5 сессий в режиме «Найди текст»',
    condition: 'mode_find_text_sessions',
    maxProgress: 5,
    iconEmoji: '🔍',
  },
  {
    id: 'mode-identify-ref',
    title: 'Навигатор',
    description: 'Заверши 5 сессий в режиме «Определи ссылку»',
    condition: 'mode_identify_ref_sessions',
    maxProgress: 5,
    iconEmoji: '🗺️',
  },

  // Уровни
  {
    id: 'level-5',
    title: 'Растущий',
    description: 'Достигни 5-го уровня',
    condition: 'reach_level',
    maxProgress: 5,
    iconEmoji: '⬆️',
  },
  {
    id: 'all-modes',
    title: 'Всесторонний',
    description: 'Разблокируй все игровые режимы',
    condition: 'unlock_all_modes',
    maxProgress: 4,
    iconEmoji: '🎮',
  },
];
