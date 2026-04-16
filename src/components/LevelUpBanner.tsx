import { useEffect, useState } from 'react';
import { Button } from './ui/button';

interface LevelUpBannerProps {
  newLevel: number;
  onDismiss: () => void;
}

export function LevelUpBanner({ newLevel, onDismiss }: LevelUpBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation after mount
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className={`mx-4 w-full max-w-sm rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 p-8 text-center shadow-2xl transition-all duration-500 ${
          visible ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
        }`}
      >
        <div className="mb-3 text-6xl">🎉</div>
        <p className="text-lg font-semibold text-amber-100">Новый уровень!</p>
        <p className="mt-1 text-5xl font-extrabold text-white">{newLevel}</p>
        <p className="mt-2 text-amber-100">Ты стал лучше!</p>
        <Button
          onClick={onDismiss}
          className="mt-6 w-full bg-white font-semibold text-orange-600 hover:bg-amber-50"
        >
          Отлично!
        </Button>
      </div>
    </div>
  );
}
