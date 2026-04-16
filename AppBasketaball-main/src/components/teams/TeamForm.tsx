import { useState } from 'react';
import { Team } from '../../lib/types';

interface Props {
  initial?: Partial<Team>;
  onSubmit: (data: Omit<Team, 'id' | 'user_id' | 'created_at'>) => Promise<unknown>;
  onCancel: () => void;
}

const COLORS = ['#f97316', '#3b82f6', '#22c55e', '#ef4444', '#eab308', '#06b6d4', '#ec4899', '#8b5cf6'];

export default function TeamForm({ initial, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    abbreviation: initial?.abbreviation ?? '',
    city: initial?.city ?? '',
    primary_color: initial?.primary_color ?? '#f97316',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return setError('Team name is required');
    setLoading(true);
    const err = await onSubmit(form);
    if (err) setError((err as { message: string }).message);
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <p className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">{error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="text-slate-400 text-sm mb-1 block">Team Name</label>
          <input value={form.name} onChange={(e) => set('name', e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-orange-500 transition-colors"
            placeholder="e.g. Lakers" />
        </div>
        <div>
          <label className="text-slate-400 text-sm mb-1 block">Abbreviation</label>
          <input value={form.abbreviation} onChange={(e) => set('abbreviation', e.target.value.toUpperCase().slice(0, 4))}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-orange-500 transition-colors uppercase"
            placeholder="LAL" maxLength={4} />
        </div>
        <div>
          <label className="text-slate-400 text-sm mb-1 block">City</label>
          <input value={form.city} onChange={(e) => set('city', e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-orange-500 transition-colors"
            placeholder="Los Angeles" />
        </div>
        <div className="sm:col-span-2">
          <label className="text-slate-400 text-sm mb-1.5 block">Team Color</label>
          <div className="flex gap-2 flex-wrap">
            {COLORS.map((c) => (
              <button key={c} type="button" onClick={() => set('primary_color', c)}
                className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${form.primary_color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800 scale-110' : ''}`}
                style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-lg border border-slate-600 text-slate-300 hover:border-slate-500 transition-colors">Cancel</button>
        <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-400 text-white font-semibold transition-colors disabled:opacity-50">
          {loading ? 'Saving...' : 'Save Team'}
        </button>
      </div>
    </form>
  );
}
