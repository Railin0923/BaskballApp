import { ReactNode, useState } from 'react';
import { LayoutDashboard, Users, Calendar, Target, Zap, LogOut, Activity, Shield, Menu, X } from 'lucide-react';

type Page = 'dashboard' | 'players' | 'teams' | 'games' | 'shot-chart' | 'live-tracker';

interface Props {
  children: ReactNode;
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onSignOut: () => void;
  userEmail?: string;
}

const navItems: { id: Page; label: string; icon: ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { id: 'teams', label: 'Teams', icon: <Shield size={18} /> },
  { id: 'players', label: 'Players', icon: <Users size={18} /> },
  { id: 'games', label: 'Games', icon: <Calendar size={18} /> },
  { id: 'shot-chart', label: 'Shot Chart', icon: <Target size={18} /> },
  { id: 'live-tracker', label: 'Live', icon: <Zap size={18} /> },
];

export default function Layout({ children, currentPage, onNavigate, onSignOut, userEmail }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  function navigate(page: Page) {
    onNavigate(page);
    setMobileOpen(false);
  }

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Desktop Sidebar */}
      <aside className="w-60 bg-slate-900 border-r border-slate-800 flex-col fixed h-full z-20 hidden lg:flex">
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center flex-shrink-0">
              <Activity size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-base leading-none">CourtVision</h1>
              <p className="text-slate-500 text-xs mt-0.5">Analytics Platform</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 flex flex-col gap-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                currentPage === item.id
                  ? 'bg-orange-500/15 text-orange-400 border border-orange-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {item.icon}
              {item.label === 'Live' ? 'Live Tracker' : item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-2.5 px-2 mb-3">
            <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
              <Users size={12} className="text-slate-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-slate-300 text-xs font-medium truncate">{userEmail ?? 'User'}</p>
              <p className="text-slate-500 text-xs">Analyst</p>
            </div>
          </div>
          <button
            onClick={onSignOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-900/10 text-sm transition-colors"
          >
            <LogOut size={15} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile top header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
            <Activity size={16} className="text-white" />
          </div>
          <span className="text-white font-bold text-base">CourtVision</span>
        </div>
        <button onClick={() => setMobileOpen(true)} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full z-50 shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
                  <Activity size={16} className="text-white" />
                </div>
                <span className="text-white font-bold text-base">CourtVision</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
                <X size={18} />
              </button>
            </div>
            <nav className="flex-1 p-3 flex flex-col gap-0.5 overflow-y-auto">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => navigate(item.id)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                    currentPage === item.id
                      ? 'bg-orange-500/15 text-orange-400 border border-orange-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {item.icon}
                  {item.label === 'Live' ? 'Live Tracker' : item.label}
                </button>
              ))}
            </nav>
            <div className="p-4 border-t border-slate-800">
              <div className="flex items-center gap-2.5 px-2 mb-3">
                <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                  <Users size={12} className="text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-300 text-xs font-medium truncate">{userEmail ?? 'User'}</p>
                  <p className="text-slate-500 text-xs">Analyst</p>
                </div>
              </div>
              <button onClick={onSignOut} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-900/10 text-sm transition-colors">
                <LogOut size={15} />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 lg:ml-60 min-h-screen pt-14 lg:pt-0 pb-16 lg:pb-0">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-slate-900/95 backdrop-blur-sm border-t border-slate-800 flex safe-bottom">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => navigate(item.id)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 transition-colors ${
              currentPage === item.id ? 'text-orange-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {item.icon}
            <span className="text-xs leading-tight">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
