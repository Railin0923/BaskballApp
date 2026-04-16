import { useMemo } from 'react';
import { Trophy, TrendingUp, Target, Users, Calendar, Zap } from 'lucide-react';
import { usePlayers } from '../hooks/usePlayers';
import { useGames } from '../hooks/useGames';
import { useGameStats } from '../hooks/useGameStats';
import StatCard from '../components/ui/StatCard';
import { calcPlayerAverages, formatNum, formatPct } from '../lib/analytics';
import { Player } from '../lib/types';

export default function Dashboard() {
  const { players } = usePlayers();
  const { games } = useGames();
  const { stats } = useGameStats();

  const playerAverages = useMemo(() => {
    return players.map((p: Player) => {
      const playerStats = stats.filter((s) => s.player_id === p.id);
      return calcPlayerAverages(p, playerStats);
    }).filter((a) => a.games_played > 0).sort((a, b) => b.ppg - a.ppg);
  }, [players, stats]);

  const topScorers = playerAverages.slice(0, 5);
  const topRebounders = [...playerAverages].sort((a, b) => b.rpg - a.rpg).slice(0, 5);
  const topAssists = [...playerAverages].sort((a, b) => b.apg - a.apg).slice(0, 5);

  const finalGames = games.filter((g) => g.status === 'final');
  const recentGames = games.slice(0, 5);

  const totalPts = stats.reduce((a, s) => a + s.points, 0);
  const avgPts = stats.length > 0 ? totalPts / stats.length : 0;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 mt-1">Season Overview & Analytics</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Players" value={players.length} icon={<Users size={18} />} color="blue" />
        <StatCard label="Games Played" value={finalGames.length} icon={<Calendar size={18} />} color="orange" />
        <StatCard label="Game Logs" value={stats.length} icon={<Zap size={18} />} color="green" />
        <StatCard label="Avg Points/Log" value={formatNum(avgPts)} icon={<Target size={18} />} color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <RankingList title="Top Scorers" icon={<Trophy size={16} />} players={topScorers} stat="ppg" label="PPG" color="orange" />
        <RankingList title="Top Rebounders" icon={<TrendingUp size={16} />} players={topRebounders} stat="rpg" label="RPG" color="blue" />
        <RankingList title="Top Assists" icon={<Zap size={16} />} players={topAssists} stat="apg" label="APG" color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Calendar size={16} className="text-orange-400" />
            Recent Games
          </h3>
          {recentGames.length === 0 ? (
            <p className="text-slate-500 text-sm">No games yet</p>
          ) : (
            <div className="flex flex-col gap-2">
              {recentGames.map((g) => (
                <div key={g.id} className="flex items-center justify-between py-2.5 border-b border-slate-800 last:border-0">
                  <div>
                    <p className="text-white text-sm font-medium">{g.home_team} vs {g.away_team}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{new Date(g.game_date).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-white font-bold text-sm">{g.home_score} - {g.away_score}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      g.status === 'final' ? 'bg-slate-700 text-slate-300' :
                      g.status === 'in_progress' ? 'bg-green-900/40 text-green-400 border border-green-700/30' :
                      'bg-blue-900/40 text-blue-400 border border-blue-700/30'
                    }`}>{g.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-orange-400" />
            Shooting Leaders
          </h3>
          {playerAverages.length === 0 ? (
            <p className="text-slate-500 text-sm">No stats logged yet</p>
          ) : (
            <div className="flex flex-col gap-2">
              {playerAverages.slice(0, 5).map((a) => (
                <div key={a.player.id} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                  <div>
                    <p className="text-white text-sm font-medium">{a.player.name}</p>
                    <p className="text-slate-500 text-xs">{a.player.team} · {a.player.position}</p>
                  </div>
                  <div className="flex gap-4 text-xs">
                    <span className="text-slate-400">FG% <span className="text-white font-semibold">{formatPct(a.fg_pct)}</span></span>
                    <span className="text-slate-400">TS% <span className="text-orange-400 font-semibold">{formatPct(a.ts_pct)}</span></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RankingList({
  title, icon, players, stat, label, color,
}: {
  title: string;
  icon: React.ReactNode;
  players: ReturnType<typeof calcPlayerAverages>[];
  stat: keyof ReturnType<typeof calcPlayerAverages>;
  label: string;
  color: string;
}) {
  const colorClass = color === 'orange' ? 'text-orange-400' : color === 'blue' ? 'text-blue-400' : 'text-green-400';
  const bgClass = color === 'orange' ? 'bg-orange-500/10' : color === 'blue' ? 'bg-blue-500/10' : 'bg-green-500/10';

  return (
    <div className="bg-slate-900 border border-slate-700/50 rounded-xl p-5">
      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
        <span className={colorClass}>{icon}</span>
        {title}
      </h3>
      {players.length === 0 ? (
        <p className="text-slate-500 text-sm">No data yet</p>
      ) : (
        <div className="flex flex-col gap-2">
          {players.map((p, i) => (
            <div key={p.player.id} className="flex items-center gap-3">
              <span className={`w-6 h-6 rounded-full ${bgClass} ${colorClass} text-xs font-bold flex items-center justify-center flex-shrink-0`}>
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{p.player.name}</p>
                <p className="text-slate-500 text-xs">{p.games_played} GP</p>
              </div>
              <span className={`${colorClass} font-bold text-sm`}>
                {formatNum(p[stat] as number)} {label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
