import { ReactNode } from 'react';
import { LayoutDashboard, Users, Calendar, Target, Zap, LogOut, Activity } from 'lucide-react';

type Page = 'dashboard' | 'players' | 'games' | 'shot-chart' | 'live-tracker';

interface Props {
  children: ReactNode;
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onSignOut: () => void;
  userEmail?: string;
}

const navItems: { id: Page; label: string; icon: ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { id: 'players', label: 'Players', icon: <Users size={18} /> },
  { id: 'games', label: 'Games', icon: <Calendar size={18} /> },
  { id: 'shot-chart', label: 'Shot Chart', icon: <Target size={18} /> },
  { id: 'live-tracker', label: 'Live Tracker', icon: <Zap size={18} /> },
];

export default function Layout({ children, currentPage, onNavigate, onSignOut, userEmail }: Props) {
  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col fixed h-full z-20">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center">
              <Activity size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-base leading-none">CourtVision</h1>
              <p className="text-slate-500 text-xs mt-0.5">Analytics Platform</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                currentPage === item.id
                  ? 'bg-orange-500/15 text-orange-400 border border-orange-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
              <Users size={14} className="text-slate-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-slate-300 text-xs font-medium truncate">{userEmail ?? 'User'}</p>
              <p className="text-slate-500 text-xs">Analyst</p>
            </div>
          </div>
          <button
            onClick={onSignOut}
            className="w-full flex items-center gap-2 px-4 py-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-900/10 text-sm transition-colors"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64 min-h-screen">
        {children}
      </main>
    </div>
  );
}
