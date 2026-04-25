import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { AvatarPreview } from '../components/Avatar';
import { XPBar } from '../components/XPBar';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/ui/button';
import { AvatarSize } from '../types/avatar';

export function HomePage() {
  const navigate = useNavigate();
  const { profile, loading } = useApp();

  if (loading || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <span className="text-4xl animate-pulse">✝️</span>
      </div>
    );
  }

  return (
    <div className="page-enter flex h-dvh flex-col bg-background">
      <main className="flex flex-1 flex-col items-center justify-center gap-8 overflow-y-auto px-6 py-10">
        {/* Profile card */}
        <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-sm flex flex-col items-center gap-4">
          <AvatarPreview avatarId={profile.avatarId} size={AvatarSize.LG} />
          <h1 className="text-xl font-bold text-foreground">{profile.name}</h1>
          <div className="w-full">
            <XPBar level={profile.level} xp={profile.xp} />
          </div>
        </div>

        {/* Play button */}
        <Button
          className="w-full max-w-sm h-14 text-lg font-bold rounded-2xl shadow"
          onClick={() => navigate('/modes')}
        >
          Играть 🎮
        </Button>
      </main>

      <BottomNav />
    </div>
  );
}
