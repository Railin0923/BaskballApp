import { useState } from 'react';
import { Plus, CreditCard as Edit2, Trash2, ChevronRight, MapPin } from 'lucide-react';
import { useGames } from '../hooks/useGames';
import Modal from '../components/ui/Modal';
import GameForm from '../components/games/GameForm';
import { Game } from '../lib/types';

interface Props {
  onViewGame: (gameId: string) => void;
}

const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-900/40 text-blue-300 border-blue-700/30',
  in_progress: 'bg-green-900/40 text-green-400 border-green-700/30',
  final: 'bg-slate-700/60 text-slate-300 border-slate-600/30',
};

export default function GamesPage({ onViewGame }: Props) {
  const { games, loading, createGame, updateGame, deleteGame } = useGames();
  const [showForm, setShowForm] = useState(false);
  const [editGame, setEditGame] = useState<Game | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Game | null>(null);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Games</h1>
          <p className="text-slate-400 mt-1">{games.length} games tracked</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold transition-colors">
          <Plus size={15} /> Add Game
        </button>
      </div>

      {loading ? (
        <div className="text-slate-400 text-center py-20">Loading...</div>
      ) : games.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-slate-400 mb-2">No games yet</p>
          <button onClick={() => setShowForm(true)} className="text-orange-400 text-sm hover:text-orange-300">Add your first game</button>
        </div>
      ) : (
        <div className="grid gap-3">
          {games.map((g) => (
            <div key={g.id} className="bg-slate-900 border border-slate-700/50 rounded-xl hover:border-slate-600 transition-all group">
              <div className="flex items-center p-5">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${statusColors[g.status] ?? statusColors.scheduled}`}>
                      {g.status === 'in_progress' ? 'LIVE' : g.status.toUpperCase()}
                    </span>
                    <span className="text-slate-500 text-sm">{new Date(g.game_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    {g.location && (
                      <span className="text-slate-500 text-sm flex items-center gap-1">
                        <MapPin size={12} />{g.location}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-white font-bold text-lg leading-none">{g.home_team}</p>
                      <p className="text-slate-500 text-xs mt-1">HOME</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-3xl font-black ${g.home_score > g.away_score && g.status === 'final' ? 'text-white' : 'text-slate-400'}`}>{g.home_score}</span>
                      <span className="text-slate-600 font-light">—</span>
                      <span className={`text-3xl font-black ${g.away_score > g.home_score && g.status === 'final' ? 'text-white' : 'text-slate-400'}`}>{g.away_score}</span>
                    </div>
                    <div className="text-center">
                      <p className="text-white font-bold text-lg leading-none">{g.away_team}</p>
                      <p className="text-slate-500 text-xs mt-1">AWAY</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button onClick={() => setEditGame(g)} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"><Edit2 size={15} /></button>
                  <button onClick={() => setDeleteConfirm(g)} className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-900/20 transition-colors"><Trash2 size={15} /></button>
                  <button onClick={() => onViewGame(g.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 text-sm transition-colors">
                    Stats <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Game" size="lg">
        <GameForm
          onSubmit={async (data) => { const { error } = await createGame(data); if (!error) setShowForm(false); return error; }}
          onCancel={() => setShowForm(false)}
        />
      </Modal>

      <Modal open={!!editGame} onClose={() => setEditGame(null)} title="Edit Game" size="lg">
        {editGame && (
          <GameForm
            initial={editGame}
            onSubmit={async (data) => { const err = await updateGame(editGame.id, data); if (!err) setEditGame(null); return err; }}
            onCancel={() => setEditGame(null)}
          />
        )}
      </Modal>

      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Game" size="sm">
        {deleteConfirm && (
          <div>
            <p className="text-slate-300 mb-6">Delete <span className="text-white font-semibold">{deleteConfirm.home_team} vs {deleteConfirm.away_team}</span>? All stats and shots for this game will be deleted.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2 rounded-lg border border-slate-600 text-slate-300 transition-colors">Cancel</button>
              <button onClick={async () => { await deleteGame(deleteConfirm.id); setDeleteConfirm(null); }} className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold transition-colors">Delete</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
