import { useState, useCallback, useEffect, useRef } from 'react';
import { Zap, Play, Pause, RotateCcw, Save, ChevronRight, Clock, Plus, Minus } from 'lucide-react';
import { usePlayers } from '../hooks/usePlayers';
import { useGames } from '../hooks/useGames';
import { useGameStats } from '../hooks/useGameStats';
import { useShots } from '../hooks/useShots';
import { useTeamRoster } from '../hooks/useTeams';
import { useGameEvents } from '../hooks/useGameEvents';
import { supabase } from '../lib/supabase';
import CourtSVG from '../components/court/CourtSVG';
import { determineShotZone } from '../lib/analytics';
import { GameStats, ShotType, EventType } from '../lib/types';

interface LiveStats {
  points: number; assists: number; rebounds_off: number; rebounds_def: number;
  steals: number; blocks: number; turnovers: number; minutes: number;
  fgm: number; fga: number; three_pm: number; three_pa: number; ftm: number; fta: number;
}

const defaultStats = (): LiveStats => ({
  points: 0, assists: 0, rebounds_off: 0, rebounds_def: 0,
  steals: 0, blocks: 0, turnovers: 0, minutes: 0,
  fgm: 0, fga: 0, three_pm: 0, three_pa: 0, ftm: 0, fta: 0,
});

type LiveShot = { x: number; y: number; shot_type: ShotType; made: boolean; zone: string };

interface PlayByPlayEntry {
  id: string;
  quarter: number;
  clockSeconds: number;
  description: string;
  eventType: EventType;
  teamId: string | null;
  playerId: string | null;
  pointsValue: number;
}

const QUARTER_DURATION = 600;

function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function LiveTrackerPage() {
  const { players } = usePlayers();
  const { games } = useGames();
  const { upsertStats } = useGameStats();
  const { addShot } = useShots();
  const { addEvent } = useGameEvents();

  const [gameId, setGameId] = useState('');
  const [activeTeamId, setActiveTeamId] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [stats, setStats] = useState<LiveStats>(defaultStats());
  const [liveShots, setLiveShots] = useState<LiveShot[]>([]);
  const [shotType, setShotType] = useState<ShotType>('2PT');
  const [quarter, setQuarter] = useState(1);
  const [clockSeconds, setClockSeconds] = useState(QUARTER_DURATION);
  const [clockRunning, setClockRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [courtMode, setCourtMode] = useState(false);
  const [playByPlay, setPlayByPlay] = useState<PlayByPlayEntry[]>([]);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [tab, setTab] = useState<'actions' | 'court' | 'pbp'>('actions');

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const selectedGame = games.find((g) => g.id === gameId);
  const homeTeamId = selectedGame?.home_team_id ?? null;
  const awayTeamId = selectedGame?.away_team_id ?? null;

  const { roster: homeRoster } = useTeamRoster(homeTeamId ?? undefined);
  const { roster: awayRoster } = useTeamRoster(awayTeamId ?? undefined);

  const activeRoster = activeTeamId === homeTeamId ? homeRoster : activeTeamId === awayTeamId ? awayRoster : [];
  const activePlayers = activeRoster.map((r) => r.player).filter(Boolean);

  useEffect(() => {
    if (clockRunning) {
      timerRef.current = setInterval(() => {
        setClockSeconds((s) => {
          if (s <= 0) {
            clearInterval(timerRef.current!);
            setClockRunning(false);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [clockRunning]);

  function addPbpEntry(entry: Omit<PlayByPlayEntry, 'id'>) {
    setPlayByPlay((prev) => [{ ...entry, id: crypto.randomUUID() }, ...prev]);
  }

  function inc(field: keyof LiveStats, delta = 1) {
    setStats((s) => ({ ...s, [field]: Math.max(0, s[field] + delta) }));
  }

  function logEvent(eventType: EventType, description: string, pointsValue: number, teamId: string | null, pId: string | null) {
    if (teamId === homeTeamId && homeTeamId) setHomeScore((s) => s + pointsValue);
    else if (teamId === awayTeamId && awayTeamId) setAwayScore((s) => s + pointsValue);
    addPbpEntry({ quarter, clockSeconds, description, eventType, teamId, playerId: pId, pointsValue });
  }

  function getPlayerName(): string {
    const p = players.find((pl) => pl.id === playerId);
    return p ? p.name : 'Player';
  }

  const currentClockRef = useRef(clockSeconds);
  const currentQuarterRef = useRef(quarter);
  const activeTeamIdRef = useRef(activeTeamId);
  const playerIdRef = useRef(playerId);
  const homeTeamIdRef = useRef(homeTeamId);
  const awayTeamIdRef = useRef(awayTeamId);

  useEffect(() => { currentClockRef.current = clockSeconds; }, [clockSeconds]);
  useEffect(() => { currentQuarterRef.current = quarter; }, [quarter]);
  useEffect(() => { activeTeamIdRef.current = activeTeamId; }, [activeTeamId]);
  useEffect(() => { playerIdRef.current = playerId; }, [playerId]);
  useEffect(() => { homeTeamIdRef.current = homeTeamId; }, [homeTeamId]);
  useEffect(() => { awayTeamIdRef.current = awayTeamId; }, [awayTeamId]);

  function handleAdd2() {
    setStats((s) => ({ ...s, points: s.points + 2, fgm: s.fgm + 1, fga: s.fga + 1 }));
    const tid = activeTeamIdRef.current || null;
    const pid = playerIdRef.current || null;
    const htid = homeTeamIdRef.current;
    const atid = awayTeamIdRef.current;
    if (tid === htid && htid) setHomeScore((s) => s + 2);
    else if (tid === atid && atid) setAwayScore((s) => s + 2);
    addPbpEntry({ quarter: currentQuarterRef.current, clockSeconds: currentClockRef.current, description: `${getPlayerName()} made 2PT`, eventType: '2pt_made', teamId: tid, playerId: pid, pointsValue: 2 });
  }
  function handleMiss2() {
    setStats((s) => ({ ...s, fga: s.fga + 1 }));
    addPbpEntry({ quarter: currentQuarterRef.current, clockSeconds: currentClockRef.current, description: `${getPlayerName()} missed 2PT`, eventType: '2pt_miss', teamId: activeTeamIdRef.current || null, playerId: playerIdRef.current || null, pointsValue: 0 });
  }
  function handleAdd3() {
    setStats((s) => ({ ...s, points: s.points + 3, fgm: s.fgm + 1, fga: s.fga + 1, three_pm: s.three_pm + 1, three_pa: s.three_pa + 1 }));
    const tid = activeTeamIdRef.current || null;
    const htid = homeTeamIdRef.current;
    const atid = awayTeamIdRef.current;
    if (tid === htid && htid) setHomeScore((s) => s + 3);
    else if (tid === atid && atid) setAwayScore((s) => s + 3);
    addPbpEntry({ quarter: currentQuarterRef.current, clockSeconds: currentClockRef.current, description: `${getPlayerName()} made 3PT`, eventType: '3pt_made', teamId: tid, playerId: playerIdRef.current || null, pointsValue: 3 });
  }
  function handleMiss3() {
    setStats((s) => ({ ...s, fga: s.fga + 1, three_pa: s.three_pa + 1 }));
    addPbpEntry({ quarter: currentQuarterRef.current, clockSeconds: currentClockRef.current, description: `${getPlayerName()} missed 3PT`, eventType: '3pt_miss', teamId: activeTeamIdRef.current || null, playerId: playerIdRef.current || null, pointsValue: 0 });
  }
  function handleFTMade() {
    setStats((s) => ({ ...s, points: s.points + 1, ftm: s.ftm + 1, fta: s.fta + 1 }));
    const tid = activeTeamIdRef.current || null;
    const htid = homeTeamIdRef.current;
    const atid = awayTeamIdRef.current;
    if (tid === htid && htid) setHomeScore((s) => s + 1);
    else if (tid === atid && atid) setAwayScore((s) => s + 1);
    addPbpEntry({ quarter: currentQuarterRef.current, clockSeconds: currentClockRef.current, description: `${getPlayerName()} FT made`, eventType: 'ft_made', teamId: tid, playerId: playerIdRef.current || null, pointsValue: 1 });
  }
  function handleFTMiss() {
    setStats((s) => ({ ...s, fta: s.fta + 1 }));
    addPbpEntry({ quarter: currentQuarterRef.current, clockSeconds: currentClockRef.current, description: `${getPlayerName()} FT missed`, eventType: 'ft_miss', teamId: activeTeamIdRef.current || null, playerId: playerIdRef.current || null, pointsValue: 0 });
  }
  function handleAssist() { inc('assists'); addPbpEntry({ quarter: currentQuarterRef.current, clockSeconds: currentClockRef.current, description: `${getPlayerName()} assist`, eventType: 'assist', teamId: activeTeamIdRef.current || null, playerId: playerIdRef.current || null, pointsValue: 0 }); }
  function handleOReb() { inc('rebounds_off'); addPbpEntry({ quarter: currentQuarterRef.current, clockSeconds: currentClockRef.current, description: `${getPlayerName()} offensive rebound`, eventType: 'rebound_off', teamId: activeTeamIdRef.current || null, playerId: playerIdRef.current || null, pointsValue: 0 }); }
  function handleDReb() { inc('rebounds_def'); addPbpEntry({ quarter: currentQuarterRef.current, clockSeconds: currentClockRef.current, description: `${getPlayerName()} defensive rebound`, eventType: 'rebound_def', teamId: activeTeamIdRef.current || null, playerId: playerIdRef.current || null, pointsValue: 0 }); }
  function handleSteal() { inc('steals'); addPbpEntry({ quarter: currentQuarterRef.current, clockSeconds: currentClockRef.current, description: `${getPlayerName()} steal`, eventType: 'steal', teamId: activeTeamIdRef.current || null, playerId: playerIdRef.current || null, pointsValue: 0 }); }
  function handleBlock() { inc('blocks'); addPbpEntry({ quarter: currentQuarterRef.current, clockSeconds: currentClockRef.current, description: `${getPlayerName()} block`, eventType: 'block', teamId: activeTeamIdRef.current || null, playerId: playerIdRef.current || null, pointsValue: 0 }); }
  function handleTurnover() { inc('turnovers'); addPbpEntry({ quarter: currentQuarterRef.current, clockSeconds: currentClockRef.current, description: `${getPlayerName()} turnover`, eventType: 'turnover', teamId: activeTeamIdRef.current || null, playerId: playerIdRef.current || null, pointsValue: 0 }); }

  const handleCourtClick = useCallback((x: number, y: number) => {
    if (!courtMode) return;
    const zone = determineShotZone(x, y, shotType);
    const made = window.confirm(`Shot — Made? (OK = Made, Cancel = Missed)`);
    setLiveShots((prev) => [...prev, { x, y, shot_type: shotType, made, zone }]);
    if (shotType === '2PT') made ? handleAdd2() : handleMiss2();
    else if (shotType === '3PT') made ? handleAdd3() : handleMiss3();
    else made ? handleFTMade() : handleFTMiss();
  }, [courtMode, shotType]);

  function advanceQuarter() {
    if (quarter < 5) { setQuarter((q) => q + 1); setClockSeconds(QUARTER_DURATION); setClockRunning(false); }
  }

  async function handleSave() {
    if (!gameId) return;
    setSaving(true);
    if (playerId) {
      await upsertStats({ game_id: gameId, player_id: playerId, ...stats } as Omit<GameStats, 'id' | 'user_id' | 'created_at'>);
    }
    for (const s of liveShots) {
      if (!playerId) continue;
      await addShot({ game_id: gameId, player_id: playerId, x: s.x, y: s.y, shot_type: s.shot_type, made: s.made, zone: s.zone as never, quarter, time_remaining: formatClock(clockSeconds) });
    }
    for (const entry of playByPlay) {
      await addEvent({ gameId, teamId: entry.teamId, playerId: entry.playerId, eventType: entry.eventType, quarter: entry.quarter, clockSeconds: entry.clockSeconds, pointsValue: entry.pointsValue, description: entry.description });
    }
    await supabase.from('games').update({ home_score: homeScore, away_score: awayScore, current_quarter: quarter, clock_seconds: clockSeconds, status: 'in_progress' }).eq('id', gameId);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function handleReset() {
    setStats(defaultStats()); setLiveShots([]); setPlayByPlay([]);
    setHomeScore(0); setAwayScore(0); setQuarter(1); setClockSeconds(QUARTER_DURATION); setClockRunning(false);
  }

  const hasTeams = !!(homeTeamId || awayTeamId);
  const actionGroups = [
    { label: 'Scoring', items: [
      { label: '+2 PTS', action: handleAdd2, color: 'bg-green-600 hover:bg-green-500' },
      { label: 'Miss 2', action: handleMiss2, color: 'bg-slate-700 hover:bg-slate-600' },
      { label: '+3 PTS', action: handleAdd3, color: 'bg-blue-600 hover:bg-blue-500' },
      { label: 'Miss 3', action: handleMiss3, color: 'bg-slate-700 hover:bg-slate-600' },
      { label: '+1 FT', action: handleFTMade, color: 'bg-orange-500 hover:bg-orange-400' },
      { label: 'Miss FT', action: handleFTMiss, color: 'bg-slate-700 hover:bg-slate-600' },
    ]},
    { label: 'Other', items: [
      { label: 'AST', action: handleAssist, color: 'bg-cyan-700 hover:bg-cyan-600' },
      { label: 'OREB', action: handleOReb, color: 'bg-yellow-700 hover:bg-yellow-600' },
      { label: 'DREB', action: handleDReb, color: 'bg-yellow-700 hover:bg-yellow-600' },
      { label: 'STL', action: handleSteal, color: 'bg-teal-700 hover:bg-teal-600' },
      { label: 'BLK', action: handleBlock, color: 'bg-slate-600 hover:bg-slate-500' },
      { label: 'TOV', action: handleTurnover, color: 'bg-red-700 hover:bg-red-600' },
    ]},
  ];

  const displayStats = [
    { label: 'PTS', value: stats.points, color: 'text-orange-400' },
    { label: 'REB', value: stats.rebounds_off + stats.rebounds_def, color: 'text-yellow-400' },
    { label: 'AST', value: stats.assists, color: 'text-cyan-400' },
    { label: 'STL', value: stats.steals, color: 'text-teal-400' },
    { label: 'BLK', value: stats.blocks, color: 'text-slate-300' },
    { label: 'TOV', value: stats.turnovers, color: 'text-red-400' },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-orange-500/20 flex items-center justify-center flex-shrink-0">
          <Zap size={18} className="text-orange-400" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Live Tracker</h1>
          <p className="text-slate-400 text-sm">Track games in real-time</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
        <div className={hasTeams ? '' : 'sm:col-span-2'}>
          <label className="text-slate-400 text-xs mb-1 block uppercase tracking-wider">Game</label>
          <select value={gameId} onChange={(e) => { setGameId(e.target.value); setHomeScore(0); setAwayScore(0); setActiveTeamId(''); setPlayerId(''); }}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500 transition-colors">
            <option value="">Select game...</option>
            {games.map((g) => <option key={g.id} value={g.id}>{g.home_team} vs {g.away_team} ({g.game_date})</option>)}
          </select>
        </div>
        {hasTeams && (
          <div>
            <label className="text-slate-400 text-xs mb-1 block uppercase tracking-wider">Team</label>
            <select value={activeTeamId} onChange={(e) => { setActiveTeamId(e.target.value); setPlayerId(''); }}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500 transition-colors">
              <option value="">Any team...</option>
              {selectedGame?.home_team_data && <option value={homeTeamId!}>{selectedGame.home_team_data.name} (Home)</option>}
              {selectedGame?.away_team_data && <option value={awayTeamId!}>{selectedGame.away_team_data.name} (Away)</option>}
            </select>
          </div>
        )}
        <div>
          <label className="text-slate-400 text-xs mb-1 block uppercase tracking-wider">Player</label>
          <select value={playerId} onChange={(e) => setPlayerId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500 transition-colors">
            <option value="">Any player...</option>
            {(hasTeams && activeTeamId ? activePlayers : players).filter(Boolean).map((p) => (
              <option key={p!.id} value={p!.id}>{p!.name}</option>
            ))}
          </select>
        </div>
      </div>

      {!gameId ? (
        <div className="text-center py-20 text-slate-500">Select a game to start tracking</div>
      ) : (
        <>
          {/* Scoreboard */}
          <div className="bg-slate-900 border border-slate-700/50 rounded-xl p-4 mb-4">
            <div className="flex items-center">
              <div className="flex-1 text-center">
                <p className="text-slate-400 text-xs uppercase tracking-wider mb-1 truncate">{selectedGame?.home_team ?? 'Home'}</p>
                <div className="flex items-center justify-center gap-1 sm:gap-2">
                  <button onClick={() => setHomeScore((s) => Math.max(0, s - 1))} className="p-1 rounded text-slate-600 hover:text-white hover:bg-slate-700 transition-colors"><Minus size={12} /></button>
                  <span className="text-3xl sm:text-5xl font-black text-white">{homeScore}</span>
                  <button onClick={() => setHomeScore((s) => s + 1)} className="p-1 rounded text-slate-600 hover:text-white hover:bg-slate-700 transition-colors"><Plus size={12} /></button>
                </div>
              </div>

              <div className="px-2 sm:px-4 text-center flex-shrink-0">
                <div className="flex items-center gap-1 justify-center mb-1.5">
                  <Clock size={11} className="text-slate-500" />
                  <span className={`text-lg sm:text-2xl font-black font-mono ${clockRunning ? 'text-green-400' : 'text-white'}`}>
                    {formatClock(clockSeconds)}
                  </span>
                </div>
                <div className="flex gap-1 justify-center mb-1.5">
                  <button onClick={() => setClockRunning((r) => !r)}
                    className={`p-1.5 rounded-lg transition-colors ${clockRunning ? 'bg-yellow-600 hover:bg-yellow-500 text-white' : 'bg-green-600 hover:bg-green-500 text-white'}`}>
                    {clockRunning ? <Pause size={11} /> : <Play size={11} />}
                  </button>
                  <button onClick={() => { setClockSeconds(QUARTER_DURATION); setClockRunning(false); }} className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors">
                    <RotateCcw size={11} />
                  </button>
                </div>
                <div className="flex gap-0.5 justify-center">
                  {[1, 2, 3, 4].map((q) => (
                    <button key={q} onClick={() => { setQuarter(q); setClockSeconds(QUARTER_DURATION); setClockRunning(false); }}
                      className={`w-6 h-6 rounded text-xs font-bold transition-colors ${quarter === q ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-500 hover:bg-slate-700 hover:text-white'}`}>
                      {q}
                    </button>
                  ))}
                  <button onClick={() => { setQuarter(5); setClockSeconds(QUARTER_DURATION); setClockRunning(false); }}
                    className={`px-1.5 h-6 rounded text-xs font-bold transition-colors ${quarter === 5 ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-500 hover:bg-slate-700 hover:text-white'}`}>OT</button>
                  <button onClick={advanceQuarter} className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-white transition-colors" title="Next quarter">
                    <ChevronRight size={10} />
                  </button>
                </div>
              </div>

              <div className="flex-1 text-center">
                <p className="text-slate-400 text-xs uppercase tracking-wider mb-1 truncate">{selectedGame?.away_team ?? 'Away'}</p>
                <div className="flex items-center justify-center gap-1 sm:gap-2">
                  <button onClick={() => setAwayScore((s) => Math.max(0, s - 1))} className="p-1 rounded text-slate-600 hover:text-white hover:bg-slate-700 transition-colors"><Minus size={12} /></button>
                  <span className="text-3xl sm:text-5xl font-black text-white">{awayScore}</span>
                  <button onClick={() => setAwayScore((s) => s + 1)} className="p-1 rounded text-slate-600 hover:text-white hover:bg-slate-700 transition-colors"><Plus size={12} /></button>
                </div>
              </div>
            </div>
          </div>

          {playerId && (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
              {displayStats.map((s) => (
                <div key={s.label} className="bg-slate-900 border border-slate-700/50 rounded-xl p-2 sm:p-2.5 text-center">
                  <p className="text-slate-500 text-xs mb-0.5">{s.label}</p>
                  <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-1 p-1 bg-slate-900 rounded-xl border border-slate-700/50 mb-4 w-full">
            {[
              { id: 'actions', label: 'Actions' },
              { id: 'court', label: 'Court' },
              { id: 'pbp', label: `PBP (${playByPlay.length})` },
            ].map((t) => (
              <button key={t.id} onClick={() => setTab(t.id as 'actions' | 'court' | 'pbp')}
                className={`flex-1 px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${tab === t.id ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'}`}>
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'actions' && (
            <div className="space-y-3">
              {actionGroups.map((group) => (
                <div key={group.label} className="bg-slate-900 border border-slate-700/50 rounded-xl p-4">
                  <h3 className="text-slate-400 text-xs uppercase tracking-wider mb-3">{group.label}</h3>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {group.items.map((btn) => (
                      <button key={btn.label} onClick={btn.action}
                        className={`${btn.color} text-white rounded-xl py-3 font-bold text-sm transition-all active:scale-95`}>
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <div className="bg-slate-900 border border-slate-700/50 rounded-xl p-4">
                <h3 className="text-slate-400 text-xs uppercase tracking-wider mb-3">Minutes Played</h3>
                <div className="flex items-center gap-3">
                  <button onClick={() => inc('minutes', -1)} className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors"><Minus size={16} /></button>
                  <span className="text-3xl font-black text-white flex-1 text-center">{stats.minutes}</span>
                  <button onClick={() => inc('minutes', 1)} className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors"><Plus size={16} /></button>
                </div>
              </div>
            </div>
          )}

          {tab === 'court' && (
            <div className="bg-slate-900 border border-slate-700/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <select value={shotType} onChange={(e) => setShotType(e.target.value as ShotType)}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-orange-500">
                    <option value="2PT">2PT</option>
                    <option value="3PT">3PT</option>
                    <option value="FT">Free Throw</option>
                  </select>
                  <button onClick={() => setCourtMode(!courtMode)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${courtMode ? 'bg-orange-500 text-white' : 'bg-slate-800 border border-slate-600 text-slate-300 hover:text-white'}`}>
                    {courtMode ? 'Click Court to Place' : 'Enable Court Mode'}
                  </button>
                </div>
                <span className="text-slate-500 text-xs">{liveShots.length} shots</span>
              </div>
              <div className="w-full max-w-lg mx-auto">
                <CourtSVG onClick={handleCourtClick}>
                  {liveShots.map((s, i) => (
                    <circle key={i} cx={s.x} cy={s.y} r={8}
                      fill={s.made ? 'rgba(34,197,94,0.85)' : 'rgba(239,68,68,0.85)'}
                      stroke={s.made ? '#16a34a' : '#b91c1c'} strokeWidth={1.5} />
                  ))}
                </CourtSVG>
              </div>
            </div>
          )}

          {tab === 'pbp' && (
            <div className="bg-slate-900 border border-slate-700/50 rounded-xl p-4">
              <h3 className="text-white font-semibold mb-3 text-sm">Play-by-Play</h3>
              {playByPlay.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-8">No events logged yet</p>
              ) : (
                <div className="space-y-0.5 max-h-96 overflow-y-auto">
                  {playByPlay.map((entry) => (
                    <div key={entry.id} className="flex items-center gap-3 py-2 border-b border-slate-800/50 last:border-0">
                      <span className="text-slate-600 text-xs font-mono w-16 flex-shrink-0">Q{entry.quarter} {formatClock(entry.clockSeconds)}</span>
                      <span className={`flex-1 text-xs ${entry.pointsValue > 0 ? 'text-white font-medium' : 'text-slate-400'}`}>{entry.description}</span>
                      {entry.pointsValue > 0 && <span className="text-orange-400 font-bold text-xs flex-shrink-0">+{entry.pointsValue}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 mt-4">
            <button onClick={handleReset} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:border-slate-500 text-sm transition-colors">
              <RotateCcw size={14} /> Reset
            </button>
            <button onClick={handleSave} disabled={saving}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white font-semibold text-sm transition-all ${saved ? 'bg-green-600' : 'bg-orange-500 hover:bg-orange-400'} disabled:opacity-50`}>
              <Save size={15} />
              {saving ? 'Saving...' : saved ? 'Saved!' : 'Save to Database'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
