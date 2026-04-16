import { useState } from 'react';
import { Player, Position } from '../../lib/types';

const positions: Position[] = ['PG', 'SG', 'SF', 'PF', 'C'];

interface Props {
  initial?: Partial<Player>;
  onSubmit: (data: Omit<Player, 'id' | 'user_id' | 'created_at'>) => Promise<unknown>;
  onCancel: () => void;
}

export default function PlayerForm({ initial, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    position: initial?.position ?? 'PG',
    team: initial?.team ?? '',
    height_inches: initial?.height_inches ?? 72,
    weight_lbs: initial?.weight_lbs ?? 180,
    jersey_number: initial?.jersey_number ?? '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function set(field: string, value: unknown) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return setError('Name is required');
    setLoading(true);
    const err = await onSubmit({
      ...form,
      position: form.position as Position,
      jersey_number: form.jersey_number ? Number(form.jersey_number) : null,
      height_inches: Number(form.height_inches),
      weight_lbs: Number(form.weight_lbs),
    });
    if (err) setError((err as { message: string }).message);
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <p className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">{error}</p>}
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-slate-400 text-sm mb-1 block">Name</label>
          <input
            value={form.name} onChange={(e) => set('name', e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500 transition-colors"
            placeholder="Player name"
          />
        </div>
        <div>
          <label className="text-slate-400 text-sm mb-1 block">Position</label>
          <select
            value={form.position} onChange={(e) => set('position', e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500"
          >
            {positions.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="text-slate-400 text-sm mb-1 block">Jersey #</label>
          <input
            type="number" value={form.jersey_number} onChange={(e) => set('jersey_number', e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500"
            placeholder="00"
          />
        </div>
        <div className="col-span-2">
          <label className="text-slate-400 text-sm mb-1 block">Team</label>
          <input
            value={form.team} onChange={(e) => set('team', e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500"
            placeholder="Team name"
          />
        </div>
        <div>
          <label className="text-slate-400 text-sm mb-1 block">Height (inches)</label>
          <input
            type="number" value={form.height_inches} onChange={(e) => set('height_inches', e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500"
          />
        </div>
        <div>
          <label className="text-slate-400 text-sm mb-1 block">Weight (lbs)</label>
          <input
            type="number" value={form.weight_lbs} onChange={(e) => set('weight_lbs', e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500"
          />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:border-slate-500 transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="flex-1 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-400 text-white font-semibold transition-colors disabled:opacity-50">
          {loading ? 'Saving...' : 'Save Player'}
        </button>
      </div>
    </form>
  );
}
