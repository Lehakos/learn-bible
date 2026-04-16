import { Button } from './ui/button';
import { Theme } from '../hooks/useTheme';

interface ThemeToggleProps {
  theme: Theme;
  onToggle: () => void;
}

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const nextThemeLabel = theme === Theme.DARK ? 'светлую' : 'тёмную';
  const nextThemeIcon = theme === Theme.DARK ? '☀️' : '🌙';

  return (
    <div className="pointer-events-none fixed right-4 top-[calc(env(safe-area-inset-top)+0.75rem)] z-50">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onToggle}
        className="pointer-events-auto h-9 rounded-full bg-card/95 px-3 shadow-sm backdrop-blur-sm"
        aria-label={`Переключить на ${nextThemeLabel} тему`}
        title={`Переключить на ${nextThemeLabel} тему`}
      >
        <span className="text-base leading-none">{nextThemeIcon}</span>
        <span className="text-xs font-medium">Тема</span>
      </Button>
    </div>
  );
}
