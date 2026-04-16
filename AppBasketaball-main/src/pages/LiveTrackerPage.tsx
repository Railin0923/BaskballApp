import { useState, useCallback } from 'react';
import { Zap, Plus, Minus, Save, RotateCcw } from 'lucide-react';
import { usePlayers } from '../hooks/usePlayers';
import { useGames } from '../hooks/useGames';
import { useGameStats } from '../hooks/useGameStats';
import { useShots } from '../hooks/useShots';
import CourtSVG from '../components/court/CourtSVG';
import { determineShotZone } from '../lib/analytics';
import { GameStats, ShotType } from '../lib/types';

interface LiveStats {
  points: number; assists: number; rebounds_off: number; rebounds_def: number;
  steals: number; blocks: number; turnovers: number; minutes: number;
  fgm: number; fga: number; three_pm: number; three_pa: number; ftm: number; fta: number;
}

const defaultStats: LiveStats = {
  points: 0, assists: 0, rebounds_off: 0, rebounds_def: 0,
  steals: 0, blocks: 0, turnovers: 0, minutes: 0,
  fgm: 0, fga: 0, three_pm: 0, three_pa: 0, ftm: 0, fta: 0,
};

type LiveShot = { x: number; y: number; shot_type: ShotType; made: boolean; zone: string };

export default function LiveTrackerPage() {
  const { players } = usePlayers();
  const { games } = useGames();
  const { upsertStats } = useGameStats();
  const { addShot } = useShots();

  const [gameId, setGameId] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [stats, setStats] = useState<LiveStats>({ ...defaultStats });
  const [liveShots, setLiveShots] = useState<LiveShot[]>([]);
  const [shotType, setShotType] = useState<ShotType>('2PT');
  const [quarter, setQuarter] = useState(1);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [courtMode, setCourtMode] = useState(false);

  function inc(field: keyof LiveStats, delta = 1) {
    setStats((s) => ({ ...s, [field]: Math.max(0, s[field] + delta) }));
  }

  function handleAdd2() {
    setStats((s) => ({ ...s, points: s.points + 2, fgm: s.fgm + 1, fga: s.fga + 1 }));
  }
  function handleMiss2() {
    setStats((s) => ({ ...s, fga: s.fga + 1 }));
  }
  function handleAdd3() {
    setStats((s) => ({ ...s, points: s.points + 3, fgm: s.fgm + 1, fga: s.fga + 1, three_pm: s.three_pm + 1, three_pa: s.three_pa + 1 }));
  }
  function handleMiss3() {
    setStats((s) => ({ ...s, fga: s.fga + 1, three_pa: s.three_pa + 1 }));
  }
  function handleFTMade() {
    setStats((s) => ({ ...s, points: s.points + 1, ftm: s.ftm + 1, fta: s.fta + 1 }));
  }
  function handleFTMiss() {
    setStats((s) => ({ ...s, fta: s.fta + 1 }));
  }

  const handleCourtClick = useCallback((x: number, y: number) => {
    if (!courtMode) return;
    const zone = determineShotZone(x, y, shotType);
    const made = window.confirm(`Shot at this spot - Made or Missed? (OK = Made, Cancel = Missed)`);
    const newShot: LiveShot = { x, y, shot_type: shotType, made, zone };
    setLiveShots((prev) => [...prev, newShot]);
    if (shotType === '2PT') made ? handleAdd2() : handleMiss2();
    else if (shotType === '3PT') made ? handleAdd3() : handleMiss3();
    else made ? handleFTMade() : handleFTMiss();
  }, [courtMode, shotType]);

  async function handleSave() {
    if (!gameId || !playerId) return;
    setSaving(true);
    await upsertStats({
      game_id: gameId,
      player_id: playerId,
      ...stats,
    } as Omit<GameStats, 'id' | 'user_id' | 'created_at'>);
    for (const s of liveShots) {
      await addShot({
        game_id: gameId, player_id: playerId,
        x: s.x, y: s.y, shot_type: s.shot_type, made: s.made,
        zone: s.zone as never, quarter, time_remaining: '',
      });
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function handleReset() {
    setStats({ ...defaultStats });
    setLiveShots([]);
  }

  const ready = gameId && playerId;

  const actionButtons = [
    { label: '+2 PTS', sub: 'Made 2', action: handleAdd2, color: 'bg-green-600 hover:bg-green-500', wide: false },
    { label: 'Miss 2', sub: 'Missed 2PT', action: handleMiss2, color: 'bg-slate-700 hover:bg-slate-600', wide: false },
    { label: '+3 PTS', sub: 'Made 3', action: handleAdd3, color: 'bg-blue-600 hover:bg-blue-500', wide: false },
    { label: 'Miss 3', sub: 'Missed 3PT', action: handleMiss3, color: 'bg-slate-700 hover:bg-slate-600', wide: false },
    { label: '+1 FT', sub: 'Free Throw Made', action: handleFTMade, color: 'bg-orange-500 hover:bg-orange-400', wide: false },
    { label: 'Miss FT', sub: 'Free Throw Miss', action: handleFTMiss, color: 'bg-slate-700 hover:bg-slate-600', wide: false },
    { label: 'AST', sub: 'Assist', action: () => inc('assists'), color: 'bg-cyan-700 hover:bg-cyan-600', wide: false },
    { label: 'OREB', sub: 'Off Rebound', action: () => inc('rebounds_off'), color: 'bg-yellow-700 hover:bg-yellow-600', wide: false },
    { label: 'DREB', sub: 'Def Rebound', action: () => inc('rebounds_def'), color: 'bg-yellow-700 hover:bg-yellow-600', wide: false },
    { label: 'STL', sub: 'Steal', action: () => inc('steals'), color: 'bg-teal-700 hover:bg-teal-600', wide: false },
    { label: 'BLK', sub: 'Block', action: () => inc('blocks'), color: 'bg-indigo-700 hover:bg-indigo-600', wide: false },
    { label: 'TOV', sub: 'Turnover', action: () => inc('turnovers'), color: 'bg-red-700 hover:bg-red-600', wide: false },
  ];

  const displayStats = [
    { label: 'PTS', value: stats.points, color: 'text-orange-400' },
    { label: 'AST', value: stats.assists, color: 'text-cyan-400' },
    { label: 'REB', value: stats.rebounds_off + stats.rebounds_def, color: 'text-yellow-400' },
    { label: 'STL', value: stats.steals, color: 'text-teal-400' },
    { label: 'BLK', value: stats.blocks, color: 'text-slate-300' },
    { label: 'TOV', value: stats.turnovers, color: 'text-red-400' },
    { label: 'FGM', value: stats.fgm, color: 'text-slate-300' },
    { label: 'FGA', value: stats.fga, color: 'text-slate-300' },
    { label: '3PM', value: stats.three_pm, color: 'text-blue-400' },
    { label: 'FTM', value: stats.ftm, color: 'text-orange-300' },
  ];

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
          <Zap size={20} className="text-orange-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Live Tracker</h1>
          <p className="text-slate-400 mt-0.5">Track player stats in real-time</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="text-slate-400 text-sm mb-1.5 block">Game</label>
          <select value={gameId} onChange={(e) => setGameId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-orange-500 transition-colors">
            <option value="">Select game...</option>
            {games.map((g) => <option key={g.id} value={g.id}>{g.home_team} vs {g.away_team} ({g.game_date})</option>)}
          </select>
        </div>
        <div>
          <label className="text-slate-400 text-sm mb-1.5 block">Player</label>
          <select value={playerId} onChange={(e) => setPlayerId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-orange-500 transition-colors">
            <option value="">Select player...</option>
            {players.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.team})</option>)}
          </select>
        </div>
        <div>
          <label className="text-slate-400 text-sm mb-1.5 block">Quarter</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((q) => (
              <button key={q} onClick={() => setQuarter(q)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${quarter === q ? 'bg-orange-500 text-white' : 'bg-slate-900 border border-slate-700 text-slate-400 hover:text-white'}`}>
                Q{q}
              </button>
            ))}
            <button onClick={() => setQuarter(5)}
              className={`px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${quarter === 5 ? 'bg-orange-500 text-white' : 'bg-slate-900 border border-slate-700 text-slate-400 hover:text-white'}`}>
              OT
            </button>
          </div>
        </div>
      </div>

      {!ready ? (
        <div className="text-center py-20 text-slate-500">Select a game and player to start tracking</div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div>
            <div className="grid grid-cols-5 gap-2 mb-6">
              {displayStats.map((s) => (
                <div key={s.label} className="bg-slate-900 border border-slate-700/50 rounded-xl p-3 text-center">
                  <p className="text-slate-500 text-xs mb-1">{s.label}</p>
                  <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
            <div className="bg-slate-900 border border-slate-700/50 rounded-xl p-5 mb-4">
              <h3 className="text-white font-semibold mb-3 text-sm">Quick Actions</h3>
              <div className="grid grid-cols-3 gap-2">
                {actionButtons.map((btn) => (
                  <button key={btn.label} onClick={btn.action}
                    className={`${btn.color} text-white rounded-xl py-3 font-bold text-sm transition-all hover:scale-105 active:scale-95`}>
                    <div>{btn.label}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-slate-900 border border-slate-700/50 rounded-xl p-5 mb-4">
              <h3 className="text-white font-semibold mb-3 text-sm">Minutes Played</h3>
              <div className="flex items-center gap-3">
                <button onClick={() => inc('minutes', -1)} className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors"><Minus size={16} /></button>
                <span className="text-3xl font-black text-white flex-1 text-center">{stats.minutes}</span>
                <button onClick={() => inc('minutes', 1)} className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors"><Plus size={16} /></button>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleReset} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:border-slate-500 text-sm transition-colors">
                <RotateCcw size={14} /> Reset
              </button>
              <button onClick={handleSave} disabled={saving}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white font-semibold text-sm transition-all ${saved ? 'bg-green-600' : 'bg-orange-500 hover:bg-orange-400'} disabled:opacity-50`}>
                <Save size={15} />
                {saving ? 'Saving...' : saved ? 'Saved!' : 'Save to Database'}
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold text-sm">Court Shot Tracker</h3>
              <div className="flex items-center gap-2">
                <select value={shotType} onChange={(e) => setShotType(e.target.value as ShotType)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-orange-500">
                  <option value="2PT">2PT</option>
                  <option value="3PT">3PT</option>
                  <option value="FT">Free Throw</option>
                </select>
                <button onClick={() => setCourtMode(!courtMode)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${courtMode ? 'bg-orange-500 text-white' : 'bg-slate-800 border border-slate-600 text-slate-300 hover:text-white'}`}>
                  {courtMode ? 'Click to Place Shot' : 'Enable Court Mode'}
                </button>
              </div>
            </div>
            <CourtSVG onClick={handleCourtClick}>
              {liveShots.map((s, i) => (
                <circle key={i} cx={s.x} cy={s.y} r={8}
                  fill={s.made ? 'rgba(34,197,94,0.85)' : 'rgba(239,68,68,0.85)'}
                  stroke={s.made ? '#16a34a' : '#b91c1c'} strokeWidth={1.5} />
              ))}
            </CourtSVG>
            <p className="text-slate-500 text-xs mt-2 text-center">{liveShots.length} shots logged this session</p>
          </div>
        </div>
      )}
    </div>
  );
}
