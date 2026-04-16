import { useState } from 'react';
import { ArrowLeft, Plus, Trash2, Target, Download } from 'lucide-react';
import { useGameStats } from '../hooks/useGameStats';
import { useShots } from '../hooks/useShots';
import { usePlayers } from '../hooks/usePlayers';
import { useGames } from '../hooks/useGames';
import Modal from '../components/ui/Modal';
import StatsForm from '../components/stats/StatsForm';
import ShotChartDisplay from '../components/court/ShotChartDisplay';
import { calcAdvancedStats, exportToCSV, formatNum, formatPct } from '../lib/analytics';
import { GameStats } from '../lib/types';

interface Props {
  gameId: string;
  onBack: () => void;
}

const cols = [
  { key: 'points', label: 'PTS' }, { key: 'assists', label: 'AST' },
  { key: 'rebounds_off', label: 'OREB' }, { key: 'rebounds_def', label: 'DREB' },
  { key: 'steals', label: 'STL' }, { key: 'blocks', label: 'BLK' },
  { key: 'turnovers', label: 'TOV' }, { key: 'minutes', label: 'MIN' },
  { key: 'fgm', label: 'FGM' }, { key: 'fga', label: 'FGA' },
  { key: 'three_pm', label: '3PM' }, { key: 'three_pa', label: '3PA' },
  { key: 'ftm', label: 'FTM' }, { key: 'fta', label: 'FTA' },
];

export default function GameDetailPage({ gameId, onBack }: Props) {
  const { stats, loading, upsertStats, deleteStats } = useGameStats(gameId);
  const { shots } = useShots(gameId);
  const { players } = usePlayers();
  const { games } = useGames();
  const [showForm, setShowForm] = useState(false);
  const [editStat, setEditStat] = useState<GameStats | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [tab, setTab] = useState<'stats' | 'shots'>('stats');

  const game = games.find((g) => g.id === gameId);
  const filteredShots = selectedPlayer ? shots.filter((s) => s.player_id === selectedPlayer) : shots;

  function handleExport() {
    const rows = stats.map((s) => {
      const adv = calcAdvancedStats(s);
      return {
        player: s.player?.name ?? '', ...Object.fromEntries(cols.map((c) => [c.label, (s as unknown as Record<string, unknown>)[c.key]])),
        'FG%': formatPct(adv.fg_pct), '3P%': formatPct(adv.three_pct), 'FT%': formatPct(adv.ft_pct),
        'TS%': formatPct(adv.true_shooting_pct), 'PER': formatNum(adv.per),
      };
    });
    exportToCSV(rows, 'game_stats.csv');
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">
            {game ? `${game.home_team} vs ${game.away_team}` : 'Game Detail'}
          </h1>
          {game && (
            <p className="text-slate-400 text-sm mt-0.5">
              {new Date(game.game_date).toLocaleDateString()} · {game.home_score} - {game.away_score} · <span className="capitalize">{game.status}</span>
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-1 p-1 bg-slate-900 rounded-xl border border-slate-700/50">
          <button onClick={() => setTab('stats')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'stats' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'}`}>
            Box Score
          </button>
          <button onClick={() => setTab('shots')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${tab === 'shots' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'}`}>
            <Target size={14} /> Shot Chart
          </button>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-600 text-slate-300 hover:border-slate-500 text-sm transition-colors">
            <Download size={14} /> CSV
          </button>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold transition-colors">
            <Plus size={15} /> Add Stats
          </button>
        </div>
      </div>

      {tab === 'stats' ? (
        loading ? (
          <div className="text-slate-400 text-center py-20">Loading...</div>
        ) : stats.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-400 mb-2">No stats logged for this game</p>
            <button onClick={() => setShowForm(true)} className="text-orange-400 text-sm hover:text-orange-300">Add player stats</button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-700/50">
            <table className="w-full min-w-max">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-700/50">
                  <th className="px-4 py-3 text-left text-slate-400 text-xs font-semibold uppercase tracking-wider sticky left-0 bg-slate-900">Player</th>
                  {cols.map((c) => <th key={c.key} className="px-3 py-3 text-center text-slate-400 text-xs font-semibold uppercase">{c.label}</th>)}
                  <th className="px-3 py-3 text-center text-slate-400 text-xs font-semibold uppercase">FG%</th>
                  <th className="px-3 py-3 text-center text-slate-400 text-xs font-semibold uppercase">3P%</th>
                  <th className="px-3 py-3 text-center text-slate-400 text-xs font-semibold uppercase">TS%</th>
                  <th className="px-3 py-3 text-center text-slate-400 text-xs font-semibold uppercase">PER</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {stats.map((s, i) => {
                  const adv = calcAdvancedStats(s);
                  return (
                    <tr key={s.id} className={`border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors ${i % 2 === 0 ? '' : 'bg-slate-950/20'}`}>
                      <td className="px-4 py-3 sticky left-0 bg-inherit">
                        <p className="text-white font-medium text-sm whitespace-nowrap">{s.player?.name ?? '—'}</p>
                        <p className="text-slate-500 text-xs">{s.player?.position}</p>
                      </td>
                      {cols.map((c) => (
                        <td key={c.key} className={`px-3 py-3 text-center text-sm ${c.key === 'points' ? 'text-orange-400 font-bold' : 'text-slate-300'}`}>
                          {(s as unknown as Record<string, unknown>)[c.key] as number}
                        </td>
                      ))}
                      <td className="px-3 py-3 text-center text-slate-300 text-sm">{formatPct(adv.fg_pct)}</td>
                      <td className="px-3 py-3 text-center text-slate-300 text-sm">{formatPct(adv.three_pct)}</td>
                      <td className="px-3 py-3 text-center text-green-400 font-semibold text-sm">{formatPct(adv.true_shooting_pct)}</td>
                      <td className="px-3 py-3 text-center text-blue-400 font-semibold text-sm">{formatNum(adv.per)}</td>
                      <td className="px-3 py-3">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => setEditStat(s)} className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors text-xs">Edit</button>
                          <button onClick={() => deleteStats(s.id)} className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-red-900/20 transition-colors"><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <label className="text-slate-400 text-sm">Filter by player:</label>
            <select
              value={selectedPlayer ?? ''}
              onChange={(e) => setSelectedPlayer(e.target.value || null)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-orange-500"
            >
              <option value="">All Players</option>
              {players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <span className="text-slate-500 text-sm">{filteredShots.length} shots</span>
          </div>
          <div className="max-w-lg">
            <ShotChartDisplay shots={filteredShots} />
          </div>
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Log Player Stats" size="xl">
        <StatsForm
          gameId={gameId} players={players}
          onSubmit={async (data) => { const err = await upsertStats(data); if (!err) setShowForm(false); return err; }}
          onCancel={() => setShowForm(false)}
        />
      </Modal>

      <Modal open={!!editStat} onClose={() => setEditStat(null)} title="Edit Stats" size="xl">
        {editStat && (
          <StatsForm
            gameId={gameId} players={players} initial={editStat}
            onSubmit={async (data) => { const err = await upsertStats(data); if (!err) setEditStat(null); return err; }}
            onCancel={() => setEditStat(null)}
          />
        )}
      </Modal>
    </div>
  );
}
