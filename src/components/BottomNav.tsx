import { useNavigate, useLocation } from 'react-router-dom';
import { achievements as allAchievements } from '../data/achievements';
import { useApp } from '../store/AppContext';

interface NavItem {
  path: string;
  label: string;
  emoji: string;
  badgeCount?: number;
}

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { achievements } = useApp();
  const activeAchievementIds = new Set(allAchievements.map((a) => a.id));

  const newAchievements = achievements.filter(
    (a) => activeAchievementIds.has(a.achievementId) && !!a.unlockedAt && !a.seenAt,
  ).length;

  const items: NavItem[] = [
    { path: '/', label: 'Главная', emoji: '🏠' },
    { path: '/achievements', label: 'Награды', emoji: '🏆', badgeCount: newAchievements },
    { path: '/avatar', label: 'Аватар', emoji: '👤' },
    { path: '/collection', label: 'Стихи', emoji: '📖' },
  ];

  return (
    <nav className="z-40 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm">
      <div className="mx-auto flex max-w-lg">
        {items.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              className={`relative flex flex-1 flex-col items-center gap-0.5 py-2 text-xs transition-colors ${
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => navigate(item.path)}
            >
              <span className="text-xl leading-none">{item.emoji}</span>
              <span>{item.label}</span>
              {!!item.badgeCount && (
                <span className="absolute right-3 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {item.badgeCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
