import { useState } from 'react';
import { Check, Lock, Maximize2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AvatarPreview } from '../components/Avatar';
import { BottomNav } from '../components/BottomNav';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';
import { avatarCharacters, getAvatarCharacter } from '../data/avatarItems';
import { cn } from '../lib/utils';
import { useApp } from '../store/AppContext';
import type { AvatarCharacter } from '../types';
import { AvatarSize } from '../types/avatar';

export function AvatarPage() {
  const navigate = useNavigate();
  const { loading, profile, selectAvatar } = useApp();
  const [previewOpen, setPreviewOpen] = useState(false);

  if (loading || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <span className="text-4xl animate-pulse">👤</span>
      </div>
    );
  }

  function handleSelect(avatar: AvatarCharacter) {
    if (!profile || avatar.unlockLevel > profile.level) return;
    void selectAvatar(avatar.id);
  }

  const currentAvatar = getAvatarCharacter(profile.avatarId);

  return (
    <div className="page-enter flex h-dvh flex-col bg-background">
      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto w-full max-w-lg space-y-5">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            ← Назад
          </button>

          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Аватар</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Выбирай открытых библейских персонажей
              </p>
            </div>
            <Badge variant="secondary">Уровень {profile.level}</Badge>
          </div>

          <Card>
            <CardContent className="flex flex-col items-center gap-3 p-4">
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                aria-label={`Открыть аватар ${currentAvatar.name}`}
                className="group relative rounded-md outline-none ring-offset-background transition-transform hover:scale-[1.01] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <AvatarPreview
                  avatarId={profile.avatarId}
                  size={AvatarSize.LG}
                  className="w-64 max-w-[72vw] sm:w-72"
                />
                <span className="absolute right-2 top-2 rounded-full bg-background/85 p-2 text-foreground shadow-sm opacity-90 transition-opacity group-hover:opacity-100">
                  <Maximize2 className="h-4 w-4" />
                </span>
              </button>
              <div className="text-center">
                <p className="text-base font-semibold text-foreground">{currentAvatar.name}</p>
                <p className="text-sm text-muted-foreground">{currentAvatar.description}</p>
              </div>
            </CardContent>
          </Card>

          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Все аватары
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {avatarCharacters.map((avatar) => {
              const locked = avatar.unlockLevel > profile.level;
              const selected = avatar.id === profile.avatarId;
              return (
                <AvatarTile
                  key={avatar.id}
                  avatar={avatar}
                  selected={selected}
                  locked={locked}
                  onSelect={() => handleSelect(avatar)}
                />
              );
            })}
          </div>
        </div>
      </main>

      <BottomNav />

      {previewOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={currentAvatar.name}
          className="fixed inset-0 z-50 flex flex-col bg-background/95 p-4 backdrop-blur-sm"
        >
          <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-3">
            <div>
              <p className="text-lg font-semibold text-foreground">{currentAvatar.name}</p>
              <p className="text-sm text-muted-foreground">{currentAvatar.description}</p>
            </div>
            <button
              type="button"
              onClick={() => setPreviewOpen(false)}
              aria-label="Закрыть"
              className="rounded-full bg-card p-3 text-foreground shadow-sm ring-offset-background transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center py-4">
            <img
              src={currentAvatar.image}
              alt={currentAvatar.name}
              className="max-h-full max-w-full object-contain drop-shadow-2xl"
              draggable={false}
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface AvatarTileProps {
  avatar: AvatarCharacter;
  selected: boolean;
  locked: boolean;
  onSelect: () => void;
}

function AvatarTile({ avatar, selected, locked, onSelect }: AvatarTileProps) {
  return (
    <button
      type="button"
      disabled={locked}
      aria-pressed={selected}
      aria-label={locked ? `Аватар откроется на уровне ${avatar.unlockLevel}` : undefined}
      onClick={onSelect}
      className={cn(
        'flex min-h-56 flex-col items-center justify-between gap-2 rounded-md border bg-card p-3 text-center shadow-sm transition-colors',
        selected && 'border-primary ring-2 ring-primary/30',
        locked
          ? 'cursor-not-allowed bg-muted/70 text-muted-foreground opacity-75'
          : 'hover:border-primary hover:bg-accent hover:text-accent-foreground',
      )}
    >
      <span className="relative h-32 w-24 overflow-hidden rounded-md bg-secondary/70">
        {locked ? (
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-foreground/85 opacity-80"
            style={{
              WebkitMaskImage: `url(${avatar.image})`,
              WebkitMaskPosition: 'center',
              WebkitMaskRepeat: 'no-repeat',
              WebkitMaskSize: 'contain',
              maskImage: `url(${avatar.image})`,
              maskPosition: 'center',
              maskRepeat: 'no-repeat',
              maskSize: 'contain',
            }}
          />
        ) : (
          <img
            src={avatar.image}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-contain"
            draggable={false}
          />
        )}
      </span>
      {locked ? (
        <>
          <span className="text-sm font-semibold leading-snug text-muted-foreground">
            ???
          </span>
          <span className="inline-flex min-h-8 items-center gap-1 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5" />
            Ур. {avatar.unlockLevel}
          </span>
        </>
      ) : selected ? (
        <>
          <span className="text-sm font-semibold leading-snug text-foreground">{avatar.name}</span>
          <span className="min-h-8 text-xs leading-tight text-muted-foreground">
            {avatar.description}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-primary">
            <Check className="h-3.5 w-3.5" />
            Выбрано
          </span>
        </>
      ) : (
        <>
          <span className="text-sm font-semibold leading-snug text-foreground">{avatar.name}</span>
          <span className="min-h-8 text-xs leading-tight text-muted-foreground">
            {avatar.description}
          </span>
          <span className="text-xs text-muted-foreground">Доступен</span>
        </>
      )}
    </button>
  );
}
