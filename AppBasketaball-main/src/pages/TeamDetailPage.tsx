import { useState, useMemo } from 'react';
import { ArrowLeft, Plus, Trash2, UserCheck, UserX } from 'lucide-react';
import { useTeams, useTeamRoster } from '../hooks/useTeams';
import { usePlayers } from '../hooks/usePlayers';
import { useGameStats } from '../hooks/useGameStats';
import { calcPlayerAverages, formatNum, formatPct } from '../lib/analytics';
import Modal from '../components/ui/Modal';

interface Props {
  teamId: string;
  onBack: () => void;
}

export default function TeamDetailPage({ teamId, onBack }: Props) {
  const { teams } = useTeams();
  const { roster, loading, addPlayerToTeam, removePlayerFromTeam, updateRosterEntry } = useTeamRoster(teamId);
  const { players } = usePlayers();
  const { stats } = useGameStats();
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [jerseyNum, setJerseyNum] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');

  const team = teams.find((t) => t.id === teamId);

  const rosterPlayerIds = new Set(roster.map((r) => r.player_id));
  const availablePlayers = players.filter((p) => !rosterPlayerIds.has(p.id));

  const playerAverages = useMemo(() =>
    Object.fromEntries(
      roster.map((r) => {
        if (!r.player) return [r.player_id, null];
        const playerStats = stats.filter((s) => s.player_id === r.player_id);
        return [r.player_id, calcPlayerAverages(r.player, playerStats)];
      })
    ),
    [roster, stats]
  );

  async function handleAddPlayer() {
    if (!selectedPlayerId) return setAddError('Select a player');
    setAdding(true);
    const err = await addPlayerToTeam(selectedPlayerId, jerseyNum ? Number(jerseyNum) : undefined);
    if (err) setAddError(err.message);
    else { setShowAddPlayer(false); setSelectedPlayerId(''); setJerseyNum(''); }
    setAdding(false);
  }

  const posColors: Record<string, string> = {
    PG: 'bg-blue-900/40 text-blue-300', SG: 'bg-green-900/40 text-green-300',
    SF: 'bg-orange-900/40 text-orange-300', PF: 'bg-yellow-900/40 text-yellow-300',
    C: 'bg-red-900/40 text-red-300',
  };

  if (!team) return null;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
        <button onClick={onBack} className="p-2 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-colors flex-shrink-0">
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-white font-black flex-shrink-0"
            style={{ backgroundColor: team.primary_color + '25', color: team.primary_color, border: `1.5px solid ${team.primary_color}40` }}>
            {team.abbreviation || team.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-white truncate">{team.city ? `${team.city} ` : ''}{team.name}</h1>
            <p className="text-slate-400 text-sm">{roster.length} players on roster</p>
          </div>
        </div>
        <button onClick={() => setShowAddPlayer(true)} className="ml-auto flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold transition-colors flex-shrink-0">
          <Plus size={15} /> <span className="hidden sm:inline">Add Player</span><span className="sm:hidden">Add</span>
        </button>
      </div>

      {loading ? (
        <div className="text-slate-400 text-center py-20">Loading roster...</div>
      ) : roster.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
            <UserX size={28} className="text-slate-600" />
          </div>
          <p className="text-slate-400 mb-2 font-medium">No players on roster</p>
          <p className="text-slate-600 text-sm mb-4">Add players to build your team</p>
          <button onClick={() => setShowAddPlayer(true)} className="text-orange-400 text-sm hover:text-orange-300 font-medium">Add first player</button>
        </div>
      ) : (
        <div className="space-y-3">
          {roster.map((entry) => {
            const avg = entry.player ? playerAverages[entry.player_id] : null;
            return (
              <div key={entry.id} className="bg-slate-900 border border-slate-700/50 rounded-xl p-4 hover:border-slate-600 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-bold text-slate-200 flex-shrink-0">
                    {entry.jersey_number ?? entry.player?.jersey_number ?? entry.player?.name?.[0] ?? '#'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white font-semibold text-sm">{entry.player?.name ?? '—'}</p>
                      {entry.player?.position && (
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${posColors[entry.player.position] ?? 'bg-slate-700 text-slate-300'}`}>
                          {entry.player.position}
                        </span>
                      )}
                      <button
                        onClick={() => updateRosterEntry(entry.id, { is_active: !entry.is_active })}
                        className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full transition-colors ${entry.is_active ? 'bg-green-900/30 text-green-400 hover:bg-green-900/50' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}>
                        {entry.is_active ? <><UserCheck size={10} /> Active</> : <><UserX size={10} /> Inactive</>}
                      </button>
                    </div>
                    {avg && avg.games_played > 0 && (
                      <div className="flex gap-3 mt-1 flex-wrap">
                        <span className="text-orange-400 text-xs font-semibold">{formatNum(avg.ppg)} PPG</span>
                        <span className="text-slate-400 text-xs">{formatNum(avg.rpg)} RPG</span>
                        <span className="text-slate-400 text-xs">{formatNum(avg.apg)} APG</span>
                        <span className="text-slate-500 text-xs">FG {formatPct(avg.fg_pct)}</span>
                        <span className="text-slate-600 text-xs">{avg.games_played} GP</span>
                      </div>
                    )}
                    {(!avg || avg.games_played === 0) && (
                      <p className="text-slate-600 text-xs mt-0.5">No stats yet</p>
                    )}
                  </div>
                  <button onClick={() => removePlayerFromTeam(entry.id)} className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-900/20 transition-colors flex-shrink-0">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={showAddPlayer} onClose={() => { setShowAddPlayer(false); setAddError(''); }} title="Add Player to Roster">
        <div className="flex flex-col gap-4">
          {addError && <p className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">{addError}</p>}
          <div>
            <label className="text-slate-400 text-sm mb-1.5 block">Player</label>
            {availablePlayers.length === 0 ? (
              <p className="text-slate-500 text-sm">All players are already on this roster. Create new players first.</p>
            ) : (
              <select value={selectedPlayerId} onChange={(e) => setSelectedPlayerId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-orange-500">
                <option value="">Select player...</option>
                {availablePlayers.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} — {p.position}</option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="text-slate-400 text-sm mb-1.5 block">Jersey Number (optional)</label>
            <input type="number" value={jerseyNum} onChange={(e) => setJerseyNum(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-orange-500"
              placeholder="00" min={0} max={99} />
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={() => { setShowAddPlayer(false); setAddError(''); }} className="flex-1 px-4 py-2.5 rounded-lg border border-slate-600 text-slate-300 hover:border-slate-500 transition-colors">Cancel</button>
            <button onClick={handleAddPlayer} disabled={adding || !selectedPlayerId} className="flex-1 px-4 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-400 text-white font-semibold transition-colors disabled:opacity-50">
              {adding ? 'Adding...' : 'Add to Roster'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
