import { useState, useMemo } from 'react';
import { Plus, CreditCard as Edit2, Trash2, Search, Download } from 'lucide-react';
import { usePlayers } from '../hooks/usePlayers';
import { useGameStats } from '../hooks/useGameStats';
import Modal from '../components/ui/Modal';
import PlayerForm from '../components/players/PlayerForm';
import { calcPlayerAverages, exportToCSV, formatNum, formatPct } from '../lib/analytics';
import { Player } from '../lib/types';

export default function PlayersPage() {
  const { players, loading, createPlayer, updatePlayer, deletePlayer } = usePlayers();
  const { stats } = useGameStats();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editPlayer, setEditPlayer] = useState<Player | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Player | null>(null);

  const filtered = players.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.team.toLowerCase().includes(search.toLowerCase())
  );

  const playerAverages = useMemo(() =>
    Object.fromEntries(players.map((p) => [p.id, calcPlayerAverages(p, stats.filter((s) => s.player_id === p.id))])),
    [players, stats]
  );

  function handleExport() {
    const rows = players.map((p) => {
      const avg = playerAverages[p.id];
      return {
        name: p.name, position: p.position, team: p.team,
        games: avg.games_played, ppg: formatNum(avg.ppg), apg: formatNum(avg.apg),
        rpg: formatNum(avg.rpg), spg: formatNum(avg.spg), bpg: formatNum(avg.bpg),
        fg_pct: formatPct(avg.fg_pct), three_pct: formatPct(avg.three_pct), ts_pct: formatPct(avg.ts_pct),
      };
    });
    exportToCSV(rows as unknown as Record<string, unknown>[], 'players_stats.csv');
  }

  const posColors: Record<string, string> = {
    PG: 'bg-blue-900/40 text-blue-300', SG: 'bg-green-900/40 text-green-300',
    SF: 'bg-orange-900/40 text-orange-300', PF: 'bg-purple-900/40 text-purple-300',
    C: 'bg-red-900/40 text-red-300',
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Players</h1>
          <p className="text-slate-400 mt-1 text-sm">{players.length} players registered</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-600 text-slate-300 hover:border-slate-500 text-sm transition-colors">
            <Download size={14} /> <span className="hidden sm:inline">Export CSV</span>
          </button>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold transition-colors">
            <Plus size={15} /> <span className="hidden sm:inline">Add Player</span><span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      <div className="relative mb-5 sm:mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search players or teams..."
          className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500 transition-colors"
        />
      </div>

      {loading ? (
        <div className="text-slate-400 text-center py-20">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-slate-400 mb-2">No players found</p>
          <button onClick={() => setShowForm(true)} className="text-orange-400 text-sm hover:text-orange-300">Add your first player</button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-700/50">
          <table className="w-full min-w-max">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-700/50">
                {['Player', 'Team', 'GP', 'PPG', 'APG', 'RPG', 'SPG', 'BPG', 'FG%', 'TS%', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-slate-400 text-xs font-semibold uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => {
                const avg = playerAverages[p.id];
                return (
                  <tr key={p.id} className={`border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors ${i % 2 === 0 ? 'bg-slate-900/50' : 'bg-slate-950/30'}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-sm font-bold text-slate-300">
                          {p.jersey_number ?? p.name[0]}
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{p.name}</p>
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${posColors[p.position] ?? 'bg-slate-700 text-slate-300'}`}>{p.position}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-300 text-sm">{p.team || '—'}</td>
                    <td className="px-4 py-3 text-slate-300 text-sm">{avg.games_played}</td>
                    <td className="px-4 py-3 text-orange-400 font-semibold text-sm">{formatNum(avg.ppg)}</td>
                    <td className="px-4 py-3 text-slate-300 text-sm">{formatNum(avg.apg)}</td>
                    <td className="px-4 py-3 text-slate-300 text-sm">{formatNum(avg.rpg)}</td>
                    <td className="px-4 py-3 text-slate-300 text-sm">{formatNum(avg.spg)}</td>
                    <td className="px-4 py-3 text-slate-300 text-sm">{formatNum(avg.bpg)}</td>
                    <td className="px-4 py-3 text-slate-300 text-sm">{formatPct(avg.fg_pct)}</td>
                    <td className="px-4 py-3 text-green-400 font-semibold text-sm">{formatPct(avg.ts_pct)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => setEditPlayer(p)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"><Edit2 size={14} /></button>
                        <button onClick={() => setDeleteConfirm(p)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-900/20 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Player">
        <PlayerForm
          onSubmit={async (data) => { const err = await createPlayer(data); if (!err) setShowForm(false); return err; }}
          onCancel={() => setShowForm(false)}
        />
      </Modal>

      <Modal open={!!editPlayer} onClose={() => setEditPlayer(null)} title="Edit Player">
        {editPlayer && (
          <PlayerForm
            initial={editPlayer}
            onSubmit={async (data) => { const err = await updatePlayer(editPlayer.id, data); if (!err) setEditPlayer(null); return err; }}
            onCancel={() => setEditPlayer(null)}
          />
        )}
      </Modal>

      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Player" size="sm">
        {deleteConfirm && (
          <div>
            <p className="text-slate-300 mb-6">Are you sure you want to delete <span className="text-white font-semibold">{deleteConfirm.name}</span>? This will also delete all their stats.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:border-slate-500 transition-colors">Cancel</button>
              <button onClick={async () => { await deletePlayer(deleteConfirm.id); setDeleteConfirm(null); }} className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold transition-colors">Delete</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
