import { useState } from 'react';
import { Game, GameStatus, Team } from '../../lib/types';

interface Props {
  initial?: Partial<Game>;
  teams: Team[];
  onSubmit: (data: Omit<Game, 'id' | 'user_id' | 'created_at' | 'home_team_data' | 'away_team_data'>) => Promise<unknown>;
  onCancel: () => void;
}

export default function GameForm({ initial, teams, onSubmit, onCancel }: Props) {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    home_team: initial?.home_team ?? '',
    away_team: initial?.away_team ?? '',
    home_team_id: initial?.home_team_id ?? null as string | null,
    away_team_id: initial?.away_team_id ?? null as string | null,
    home_score: initial?.home_score ?? 0,
    away_score: initial?.away_score ?? 0,
    game_date: initial?.game_date ?? today,
    location: initial?.location ?? '',
    status: (initial?.status ?? 'scheduled') as GameStatus,
    current_quarter: initial?.current_quarter ?? 1,
    clock_seconds: initial?.clock_seconds ?? 600,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function set(field: string, value: unknown) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleHomeTeamChange(teamId: string) {
    const team = teams.find((t) => t.id === teamId);
    set('home_team_id', teamId || null);
    if (team) set('home_team', `${team.city ? team.city + ' ' : ''}${team.name}`);
  }

  function handleAwayTeamChange(teamId: string) {
    const team = teams.find((t) => t.id === teamId);
    set('away_team_id', teamId || null);
    if (team) set('away_team', `${team.city ? team.city + ' ' : ''}${team.name}`);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.home_team.trim() || !form.away_team.trim()) return setError('Both teams are required');
    setLoading(true);
    const err = await onSubmit({
      ...form,
      home_score: Number(form.home_score),
      away_score: Number(form.away_score),
    });
    if (err) setError((err as { message: string }).message);
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <p className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">{error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {teams.length > 0 && (
          <>
            <div>
              <label className="text-slate-400 text-sm mb-1 block">Home Team (Registered)</label>
              <select value={form.home_team_id ?? ''} onChange={(e) => handleHomeTeamChange(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-orange-500">
                <option value="">Custom name...</option>
                {teams.map((t) => <option key={t.id} value={t.id}>{t.city ? `${t.city} ` : ''}{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-slate-400 text-sm mb-1 block">Away Team (Registered)</label>
              <select value={form.away_team_id ?? ''} onChange={(e) => handleAwayTeamChange(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-orange-500">
                <option value="">Custom name...</option>
                {teams.map((t) => <option key={t.id} value={t.id}>{t.city ? `${t.city} ` : ''}{t.name}</option>)}
              </select>
            </div>
          </>
        )}
        <div>
          <label className="text-slate-400 text-sm mb-1 block">Home Team Name</label>
          <input value={form.home_team} onChange={(e) => set('home_team', e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-orange-500 transition-colors"
            placeholder="Home team" />
        </div>
        <div>
          <label className="text-slate-400 text-sm mb-1 block">Away Team Name</label>
          <input value={form.away_team} onChange={(e) => set('away_team', e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-orange-500 transition-colors"
            placeholder="Away team" />
        </div>
        <div>
          <label className="text-slate-400 text-sm mb-1 block">Home Score</label>
          <input type="number" value={form.home_score} onChange={(e) => set('home_score', e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-orange-500 transition-colors" />
        </div>
        <div>
          <label className="text-slate-400 text-sm mb-1 block">Away Score</label>
          <input type="number" value={form.away_score} onChange={(e) => set('away_score', e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-orange-500 transition-colors" />
        </div>
        <div>
          <label className="text-slate-400 text-sm mb-1 block">Date</label>
          <input type="date" value={form.game_date} onChange={(e) => set('game_date', e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-orange-500 transition-colors" />
        </div>
        <div>
          <label className="text-slate-400 text-sm mb-1 block">Status</label>
          <select value={form.status} onChange={(e) => set('status', e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-orange-500 transition-colors">
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="final">Final</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="text-slate-400 text-sm mb-1 block">Location</label>
          <input value={form.location} onChange={(e) => set('location', e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-orange-500 transition-colors"
            placeholder="Arena / Location" />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-lg border border-slate-600 text-slate-300 hover:border-slate-500 transition-colors">Cancel</button>
        <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-400 text-white font-semibold transition-colors disabled:opacity-50">
          {loading ? 'Saving...' : 'Save Game'}
        </button>
      </div>
    </form>
  );
}
