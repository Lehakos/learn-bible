import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AchievementsPage } from './pages/AchievementsPage';
import { AvatarPage } from './pages/AvatarPage';
import { CollectionPage } from './pages/CollectionPage';
import { GamePage } from './pages/GamePage';
import { HomePage } from './pages/HomePage';
import { ModeSelectionPage } from './pages/ModeSelectionPage';
import { SessionResultPage } from './pages/SessionResultPage';
import { ThemeToggle } from './components/ThemeToggle';
import { useTheme } from './hooks/useTheme';
import { AppProvider } from './store/AppContext';

export default function App() {
  const { theme, toggleTheme } = useTheme();

  return (
    <AppProvider>
      <HashRouter>
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/modes" element={<ModeSelectionPage />} />
          <Route path="/game" element={<GamePage />} />
          <Route path="/result" element={<SessionResultPage />} />
          <Route path="/achievements" element={<AchievementsPage />} />
          <Route path="/avatar" element={<AvatarPage />} />
          <Route path="/collection" element={<CollectionPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AppProvider>
  );
}
