import { useState, useMemo } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useShots } from '../hooks/useShots';
import { usePlayers } from '../hooks/usePlayers';
import { useGames } from '../hooks/useGames';
import CourtSVG from '../components/court/CourtSVG';
import ShotChartDisplay from '../components/court/ShotChartDisplay';
import { determineShotZone } from '../lib/analytics';
import { ShotType, Shot } from '../lib/types';

export default function ShotChartPage() {
  const { shots, loading, addShot, deleteShot } = useShots();
  const { players } = usePlayers();
  const { games } = useGames();

  const [filterPlayer, setFilterPlayer] = useState('');
  const [filterGame, setFilterGame] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'made' | 'missed'>('all');
  const [addMode, setAddMode] = useState(false);
  const [pendingShot, setPendingShot] = useState<{ x: number; y: number } | null>(null);
  const [shotForm, setShotForm] = useState({ player_id: '', game_id: '', shot_type: '2PT' as ShotType, made: true, quarter: 1 });
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    return shots.filter((s) => {
      if (filterPlayer && s.player_id !== filterPlayer) return false;
      if (filterGame && s.game_id !== filterGame) return false;
      if (filterType === 'made' && !s.made) return false;
      if (filterType === 'missed' && s.made) return false;
      return true;
    });
  }, [shots, filterPlayer, filterGame, filterType]);

  function handleCourtClick(x: number, y: number) {
    if (!addMode) return;
    setPendingShot({ x, y });
  }

  async function handleSaveShot() {
    if (!pendingShot || !shotForm.player_id || !shotForm.game_id) return;
    setSaving(true);
    const zone = determineShotZone(pendingShot.x, pendingShot.y, shotForm.shot_type);
    await addShot({
      ...shotForm,
      x: pendingShot.x,
      y: pendingShot.y,
      zone,
      time_remaining: '',
    } as Omit<Shot, 'id' | 'user_id' | 'created_at'>);
    setPendingShot(null);
    setSaving(false);
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Shot Chart</h1>
          <p className="text-slate-400 mt-1">Visualize shooting tendencies and efficiency by zone</p>
        </div>
        <button
          onClick={() => { setAddMode(!addMode); setPendingShot(null); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${addMode ? 'bg-orange-600 text-white' : 'bg-orange-500 hover:bg-orange-400 text-white'}`}
        >
          <Plus size={15} /> {addMode ? 'Cancel Adding' : 'Add Shot'}
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <select value={filterPlayer} onChange={(e) => setFilterPlayer(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500 transition-colors">
          <option value="">All Players</option>
          {players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={filterGame} onChange={(e) => setFilterGame(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500 transition-colors">
          <option value="">All Games</option>
          {games.map((g) => <option key={g.id} value={g.id}>{g.home_team} vs {g.away_team} ({g.game_date})</option>)}
        </select>
        <div className="flex gap-1 p-1 bg-slate-900 rounded-xl border border-slate-700/50">
          {(['all', 'made', 'missed'] as const).map((t) => (
            <button key={t} onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${filterType === t ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'}`}>
              {t}
            </button>
          ))}
        </div>
        <span className="text-slate-500 text-sm self-center">{filtered.length} shots</span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          {addMode ? (
            <div>
              <div className="mb-3 p-3 bg-orange-900/20 border border-orange-700/30 rounded-xl text-orange-300 text-sm">
                Click anywhere on the court to place a shot
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                <select value={shotForm.player_id} onChange={(e) => setShotForm((f) => ({ ...f, player_id: e.target.value }))}
                  className="bg-slate-900 border border-slate-600 rounded-lg px-2 py-2 text-white text-sm focus:outline-none focus:border-orange-500">
                  <option value="">Player...</option>
                  {players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <select value={shotForm.game_id} onChange={(e) => setShotForm((f) => ({ ...f, game_id: e.target.value }))}
                  className="bg-slate-900 border border-slate-600 rounded-lg px-2 py-2 text-white text-sm focus:outline-none focus:border-orange-500">
                  <option value="">Game...</option>
                  {games.map((g) => <option key={g.id} value={g.id}>{g.home_team} vs {g.away_team}</option>)}
                </select>
                <select value={shotForm.shot_type} onChange={(e) => setShotForm((f) => ({ ...f, shot_type: e.target.value as ShotType }))}
                  className="bg-slate-900 border border-slate-600 rounded-lg px-2 py-2 text-white text-sm focus:outline-none focus:border-orange-500">
                  <option value="2PT">2PT</option>
                  <option value="3PT">3PT</option>
                  <option value="FT">Free Throw</option>
                </select>
                <select value={shotForm.made ? 'made' : 'missed'} onChange={(e) => setShotForm((f) => ({ ...f, made: e.target.value === 'made' }))}
                  className="bg-slate-900 border border-slate-600 rounded-lg px-2 py-2 text-white text-sm focus:outline-none focus:border-orange-500">
                  <option value="made">Made</option>
                  <option value="missed">Missed</option>
                </select>
              </div>
              <CourtSVG onClick={handleCourtClick}>
                {filtered.map((shot) => (
                  <circle key={shot.id} cx={shot.x} cy={shot.y} r={7}
                    fill={shot.made ? 'rgba(34,197,94,0.7)' : 'rgba(239,68,68,0.7)'}
                    stroke={shot.made ? '#16a34a' : '#b91c1c'} strokeWidth={1.5} />
                ))}
                {pendingShot && (
                  <circle cx={pendingShot.x} cy={pendingShot.y} r={10}
                    fill={shotForm.made ? 'rgba(34,197,94,0.9)' : 'rgba(239,68,68,0.9)'}
                    stroke="white" strokeWidth={2} strokeDasharray="4,2" />
                )}
              </CourtSVG>
              {pendingShot && (
                <div className="flex gap-2 mt-3">
                  <button onClick={() => setPendingShot(null)} className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 text-sm hover:border-slate-500 transition-colors">Clear</button>
                  <button onClick={handleSaveShot} disabled={saving || !shotForm.player_id || !shotForm.game_id}
                    className="flex-1 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold transition-colors disabled:opacity-50">
                    {saving ? 'Saving...' : `Save ${shotForm.made ? 'Made' : 'Missed'} ${shotForm.shot_type}`}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <ShotChartDisplay shots={filtered} />
          )}
        </div>

        <div className="bg-slate-900 border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4 text-sm">Recent Shots</h3>
          {loading ? <p className="text-slate-500 text-sm">Loading...</p> : filtered.length === 0 ? (
            <p className="text-slate-500 text-sm">No shots to display</p>
          ) : (
            <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
              {[...filtered].reverse().slice(0, 30).map((s) => (
                <div key={s.id} className="flex items-center gap-2 py-2 border-b border-slate-800/50 last:border-0">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.made ? 'bg-green-400' : 'bg-red-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-200 text-xs font-medium truncate">{s.player?.name ?? '—'}</p>
                    <p className="text-slate-500 text-xs capitalize">{s.shot_type} · {s.zone.replace('_', ' ')}</p>
                  </div>
                  <button onClick={() => deleteShot(s.id)} className="p-1 text-slate-600 hover:text-red-400 transition-colors flex-shrink-0">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
