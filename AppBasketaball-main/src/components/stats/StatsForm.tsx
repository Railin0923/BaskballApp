import { useState } from 'react';
import { GameStats, Player } from '../../lib/types';

interface Props {
  gameId: string;
  players: Player[];
  initial?: Partial<GameStats>;
  onSubmit: (data: Omit<GameStats, 'id' | 'user_id' | 'created_at'>) => Promise<unknown>;
  onCancel: () => void;
}

const fields = [
  { key: 'points', label: 'PTS' },
  { key: 'assists', label: 'AST' },
  { key: 'rebounds_off', label: 'OREB' },
  { key: 'rebounds_def', label: 'DREB' },
  { key: 'steals', label: 'STL' },
  { key: 'blocks', label: 'BLK' },
  { key: 'turnovers', label: 'TOV' },
  { key: 'minutes', label: 'MIN' },
  { key: 'fgm', label: 'FGM' },
  { key: 'fga', label: 'FGA' },
  { key: 'three_pm', label: '3PM' },
  { key: 'three_pa', label: '3PA' },
  { key: 'ftm', label: 'FTM' },
  { key: 'fta', label: 'FTA' },
];

export default function StatsForm({ gameId, players, initial, onSubmit, onCancel }: Props) {
  const [playerId, setPlayerId] = useState(initial?.player_id ?? '');
  const [form, setForm] = useState<Record<string, number>>(
    Object.fromEntries(fields.map((f) => [f.key, (initial as Record<string, number>)?.[f.key] ?? 0]))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!playerId) return setError('Select a player');
    setLoading(true);
    const err = await onSubmit({
      game_id: gameId,
      player_id: playerId,
      ...Object.fromEntries(fields.map((f) => [f.key, Number(form[f.key])])),
    } as Omit<GameStats, 'id' | 'user_id' | 'created_at'>);
    if (err) setError((err as { message: string }).message);
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <p className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">{error}</p>}
      <div>
        <label className="text-slate-400 text-sm mb-1 block">Player</label>
        <select value={playerId} onChange={(e) => setPlayerId(e.target.value)}
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500">
          <option value="">Select player...</option>
          {players.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.team})</option>)}
        </select>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="text-slate-500 text-xs mb-1 block text-center">{f.label}</label>
            <input
              type="number" min="0" step={f.key === 'minutes' ? '0.1' : '1'}
              value={form[f.key]}
              onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: parseFloat(e.target.value) || 0 }))}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-2 py-2 text-white text-center text-sm focus:outline-none focus:border-orange-500"
            />
          </div>
        ))}
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:border-slate-500 transition-colors">Cancel</button>
        <button type="submit" disabled={loading} className="flex-1 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-400 text-white font-semibold transition-colors disabled:opacity-50">
          {loading ? 'Saving...' : 'Save Stats'}
        </button>
      </div>
    </form>
  );
}
