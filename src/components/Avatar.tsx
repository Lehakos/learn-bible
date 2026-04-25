import { getAvatarCharacter } from '../data/avatarItems';
import { cn } from '../lib/utils';
import { AvatarSize } from '../types/avatar';

interface AvatarPreviewProps {
  avatarId: string;
  size?: AvatarSize;
  className?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
  [AvatarSize.SM]: 'w-14',
  [AvatarSize.MD]: 'w-24',
  [AvatarSize.LG]: 'w-36',
};

export function AvatarPreview({ avatarId, size = AvatarSize.MD, className }: AvatarPreviewProps) {
  const avatar = getAvatarCharacter(avatarId);

  return (
    <div
      data-testid="avatar-preview"
      className={cn(
        'relative aspect-[3/4] overflow-hidden rounded-md bg-secondary/60 shadow-inner',
        sizeClasses[size],
        className,
      )}
    >
      <img
        src={avatar.image}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="absolute inset-0 h-full w-full object-contain"
      />
    </div>
  );
}
