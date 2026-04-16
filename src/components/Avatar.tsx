import { avatarItems } from '../data/avatarItems';
import { AvatarCategory } from '../types';

export enum AvatarSize {
  SM = 'sm',
  MD = 'md',
  LG = 'lg',
}

interface AvatarProps {
  equippedItems: string[];
  size?: AvatarSize;
}

const sizeClasses: Record<AvatarSize, string> = {
  [AvatarSize.SM]: 'text-3xl w-14 h-14',
  [AvatarSize.MD]: 'text-5xl w-20 h-20',
  [AvatarSize.LG]: 'text-7xl w-28 h-28',
};

export function Avatar({ equippedItems, size = AvatarSize.MD }: AvatarProps) {
  const equipped = avatarItems.filter((item) => equippedItems.includes(item.id));

  const bg = equipped.find((i) => i.category === AvatarCategory.BACKGROUND);
  const body = equipped.find((i) => i.category === AvatarCategory.BODY);
  const acc = equipped.find((i) => i.category === AvatarCategory.ACCESSORY);

  return (
    <div
      className={`relative flex items-center justify-center rounded-full bg-slate-100 ${sizeClasses[size]}`}
    >
      {bg && (
        <span className="absolute inset-0 flex items-center justify-center opacity-40 text-[0.6em]">
          {bg.emoji}
        </span>
      )}
      <span className="relative z-10 leading-none">{body?.emoji ?? '🧒'}</span>
      {acc && (
        <span className="absolute -bottom-1 -right-1 text-[0.4em] leading-none">{acc.emoji}</span>
      )}
    </div>
  );
}
