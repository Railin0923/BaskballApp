import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import PlayersPage from './pages/PlayersPage';
import TeamsPage from './pages/TeamsPage';
import TeamDetailPage from './pages/TeamDetailPage';
import GamesPage from './pages/GamesPage';
import GameDetailPage from './pages/GameDetailPage';
import ShotChartPage from './pages/ShotChartPage';
import LiveTrackerPage from './pages/LiveTrackerPage';

type Page = 'dashboard' | 'players' | 'teams' | 'games' | 'shot-chart' | 'live-tracker';

export default function App() {
  const { user, loading, signOut } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [viewGameId, setViewGameId] = useState<string | null>(null);
  const [viewTeamId, setViewTeamId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/20 flex items-center justify-center animate-pulse">
            <div className="w-6 h-6 rounded-full bg-orange-500" />
          </div>
          <p className="text-slate-400 text-sm">Loading CourtVision...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  function renderPage() {
    if (viewGameId) {
      return (
        <GameDetailPage
          gameId={viewGameId}
          onBack={() => { setViewGameId(null); setCurrentPage('games'); }}
        />
      );
    }
    if (viewTeamId) {
      return (
        <TeamDetailPage
          teamId={viewTeamId}
          onBack={() => { setViewTeamId(null); setCurrentPage('teams'); }}
        />
      );
    }
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'teams': return <TeamsPage onViewTeam={(id) => setViewTeamId(id)} />;
      case 'players': return <PlayersPage />;
      case 'games': return <GamesPage onViewGame={(id) => setViewGameId(id)} />;
      case 'shot-chart': return <ShotChartPage />;
      case 'live-tracker': return <LiveTrackerPage />;
      default: return <Dashboard />;
    }
  }

  return (
    <Layout
      currentPage={currentPage}
      onNavigate={(page) => { setCurrentPage(page); setViewGameId(null); setViewTeamId(null); }}
      onSignOut={signOut}
      userEmail={user.email}
    >
      {renderPage()}
    </Layout>
  );
}
