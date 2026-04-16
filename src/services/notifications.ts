import type { AvatarItem } from '../types';

export enum NotificationKind {
  LEVEL = 'level',
  ACHIEVEMENT = 'achievement',
  ITEM = 'item',
}

export interface NotificationEvent {
  kind: NotificationKind;
  title: string;
  description: string;
  emoji?: string;
  duration?: number;
}

type NotificationListener = (notification: NotificationEvent) => void;

const listeners = new Set<NotificationListener>();

export function subscribeToNotifications(listener: NotificationListener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emitNotification(notification: NotificationEvent) {
  listeners.forEach((listener) => listener(notification));
}

export function notifyLevelUp(level: number) {
  emitNotification({
    kind: NotificationKind.LEVEL,
    title: 'Новый уровень!',
    description: `Поздравляем! Теперь у тебя ${level} уровень.`,
    emoji: '🎉',
    duration: 4500,
  });
}

export function notifyAchievementUnlocked(title: string, iconEmoji: string) {
  emitNotification({
    kind: NotificationKind.ACHIEVEMENT,
    title: 'Достижение открыто',
    description: `${iconEmoji} ${title}`,
    duration: 4500,
  });
}

export function notifyItemUnlocked(item: AvatarItem) {
  emitNotification({
    kind: NotificationKind.ITEM,
    title: 'Новый предмет',
    description: `${item.emoji} ${item.name} теперь доступен в аватаре`,
    duration: 4000,
  });
}
