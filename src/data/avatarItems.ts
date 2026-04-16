import { AvatarCategory, type AvatarItem } from '../types';

export const avatarItems: AvatarItem[] = [
  // Фоны (background)
  {
    id: 'bg-sky',
    category: AvatarCategory.BACKGROUND,
    name: 'Небо',
    emoji: '🌤️',
    unlockLevel: 1,
  },
  {
    id: 'bg-garden',
    category: AvatarCategory.BACKGROUND,
    name: 'Сад',
    emoji: '🌿',
    unlockLevel: 2,
  },
  {
    id: 'bg-mountains',
    category: AvatarCategory.BACKGROUND,
    name: 'Горы',
    emoji: '⛰️',
    unlockLevel: 3,
  },
  {
    id: 'bg-sunset',
    category: AvatarCategory.BACKGROUND,
    name: 'Закат',
    emoji: '🌅',
    unlockLevel: 4,
  },
  {
    id: 'bg-stars',
    category: AvatarCategory.BACKGROUND,
    name: 'Звёзды',
    emoji: '✨',
    unlockLevel: 5,
  },
  {
    id: 'bg-temple',
    category: AvatarCategory.BACKGROUND,
    name: 'Храм',
    emoji: '⛪',
    unlockLevel: 7,
  },

  // Тело (body)
  {
    id: 'body-child',
    category: AvatarCategory.BODY,
    name: 'Ребёнок',
    emoji: '🧒',
    unlockLevel: 1,
  },
  {
    id: 'body-boy',
    category: AvatarCategory.BODY,
    name: 'Мальчик',
    emoji: '👦',
    unlockLevel: 1,
  },
  {
    id: 'body-girl',
    category: AvatarCategory.BODY,
    name: 'Девочка',
    emoji: '👧',
    unlockLevel: 1,
  },
  {
    id: 'body-angel',
    category: AvatarCategory.BODY,
    name: 'Ангел',
    emoji: '👼',
    unlockLevel: 4,
  },
  {
    id: 'body-king',
    category: AvatarCategory.BODY,
    name: 'Царь',
    emoji: '🤴',
    unlockLevel: 6,
  },
  {
    id: 'body-princess',
    category: AvatarCategory.BODY,
    name: 'Принцесса',
    emoji: '👸',
    unlockLevel: 6,
  },

  // Аксессуары (accessory)
  {
    id: 'acc-book',
    category: AvatarCategory.ACCESSORY,
    name: 'Библия',
    emoji: '📖',
    unlockLevel: 1,
  },
  {
    id: 'acc-cross',
    category: AvatarCategory.ACCESSORY,
    name: 'Крест',
    emoji: '✝️',
    unlockLevel: 2,
  },
  {
    id: 'acc-crown',
    category: AvatarCategory.ACCESSORY,
    name: 'Корона',
    emoji: '👑',
    unlockLevel: 3,
  },
  {
    id: 'acc-dove',
    category: AvatarCategory.ACCESSORY,
    name: 'Голубь',
    emoji: '🕊️',
    unlockLevel: 3,
  },
  {
    id: 'acc-lamp',
    category: AvatarCategory.ACCESSORY,
    name: 'Светильник',
    emoji: '🪔',
    unlockLevel: 4,
  },
  {
    id: 'acc-harp',
    category: AvatarCategory.ACCESSORY,
    name: 'Арфа',
    emoji: '🎵',
    unlockLevel: 5,
  },
  {
    id: 'acc-scroll',
    category: AvatarCategory.ACCESSORY,
    name: 'Свиток',
    emoji: '📜',
    unlockLevel: 5,
  },
  {
    id: 'acc-star',
    category: AvatarCategory.ACCESSORY,
    name: 'Звезда',
    emoji: '⭐',
    unlockLevel: 7,
  },
];
