import { useState } from 'react';
import { Plus, CreditCard as Edit2, Trash2, Users, ChevronRight } from 'lucide-react';
import { useTeams } from '../hooks/useTeams';
import Modal from '../components/ui/Modal';
import TeamForm from '../components/teams/TeamForm';
import { Team } from '../lib/types';

interface Props {
  onViewTeam: (teamId: string) => void;
}

export default function TeamsPage({ onViewTeam }: Props) {
  const { teams, loading, createTeam, updateTeam, deleteTeam } = useTeams();
  const [showForm, setShowForm] = useState(false);
  const [editTeam, setEditTeam] = useState<Team | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Team | null>(null);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Teams</h1>
          <p className="text-slate-400 mt-1 text-sm">{teams.length} teams registered</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold transition-colors">
          <Plus size={15} /> <span className="hidden sm:inline">Add Team</span><span className="sm:hidden">Add</span>
        </button>
      </div>

      {loading ? (
        <div className="text-slate-400 text-center py-20">Loading...</div>
      ) : teams.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
            <Users size={28} className="text-slate-600" />
          </div>
          <p className="text-slate-400 mb-2 font-medium">No teams yet</p>
          <p className="text-slate-600 text-sm mb-4">Create your first team and add players to the roster</p>
          <button onClick={() => setShowForm(true)} className="text-orange-400 text-sm hover:text-orange-300 font-medium">Create your first team</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {teams.map((t) => (
            <div key={t.id} className="bg-slate-900 border border-slate-700/50 rounded-xl hover:border-slate-600 transition-all group overflow-hidden">
              <div className="h-1.5" style={{ backgroundColor: t.primary_color }} />
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-lg"
                      style={{ backgroundColor: t.primary_color + '25', color: t.primary_color, border: `1.5px solid ${t.primary_color}40` }}>
                      {t.abbreviation || t.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-base leading-tight">{t.name}</h3>
                      {t.city && <p className="text-slate-500 text-xs mt-0.5">{t.city}</p>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex gap-1">
                    <button onClick={() => setEditTeam(t)} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"><Edit2 size={14} /></button>
                    <button onClick={() => setDeleteConfirm(t)} className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-900/20 transition-colors"><Trash2 size={14} /></button>
                  </div>
                  <button onClick={() => onViewTeam(t.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors text-slate-300 hover:text-white hover:bg-slate-700">
                    Roster <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Create Team">
        <TeamForm
          onSubmit={async (data) => { const { error } = await createTeam(data); if (!error) setShowForm(false); return error; }}
          onCancel={() => setShowForm(false)}
        />
      </Modal>

      <Modal open={!!editTeam} onClose={() => setEditTeam(null)} title="Edit Team">
        {editTeam && (
          <TeamForm
            initial={editTeam}
            onSubmit={async (data) => { const err = await updateTeam(editTeam.id, data); if (!err) setEditTeam(null); return err; }}
            onCancel={() => setEditTeam(null)}
          />
        )}
      </Modal>

      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Team" size="sm">
        {deleteConfirm && (
          <div>
            <p className="text-slate-300 mb-6">Delete <span className="text-white font-semibold">{deleteConfirm.name}</span>? The roster assignments will be removed.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2 rounded-lg border border-slate-600 text-slate-300 transition-colors">Cancel</button>
              <button onClick={async () => { await deleteTeam(deleteConfirm.id); setDeleteConfirm(null); }} className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold transition-colors">Delete</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
