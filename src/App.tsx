import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AchievementsPage } from './pages/AchievementsPage';
import { CollectionPage } from './pages/CollectionPage';
import { GamePage } from './pages/GamePage';
import { HomePage } from './pages/HomePage';
import { ModeSelectionPage } from './pages/ModeSelectionPage';
import { SessionResultPage } from './pages/SessionResultPage';
import { ThemeToggle } from './components/ThemeToggle';
import { useTheme } from './hooks/useTheme';
import { AppProvider } from './store/AppContext';

// Pages will be added in subsequent steps
const Placeholder = ({ title }: { title: string }) => (
  <div className="page-enter flex min-h-screen items-center justify-center bg-background">
    <h1 className="text-2xl font-bold text-foreground">{title}</h1>
  </div>
);

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
          <Route path="/avatar" element={<Placeholder title="Avatar" />} />
          <Route path="/collection" element={<CollectionPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AppProvider>
  );
}
