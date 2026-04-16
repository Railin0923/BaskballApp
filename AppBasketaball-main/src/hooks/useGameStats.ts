import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { GameStats } from '../lib/types';

export function useGameStats(gameId?: string, playerId?: string) {
  const [stats, setStats] = useState<GameStats[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('game_stats')
      .select('*, player:players(*), game:games(*)');
    if (gameId) query = query.eq('game_id', gameId);
    if (playerId) query = query.eq('player_id', playerId);
    const { data } = await query.order('created_at', { ascending: false });
    setStats((data as GameStats[]) || []);
    setLoading(false);
  }, [gameId, playerId]);

  useEffect(() => { fetch(); }, [fetch]);

  async function upsertStats(s: Omit<GameStats, 'id' | 'user_id' | 'created_at'> & { id?: string }) {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('game_stats').upsert(
      { ...s, user_id: user!.id },
      { onConflict: 'game_id,player_id' }
    );
    if (!error) await fetch();
    return error;
  }

  async function deleteStats(id: string) {
    const { error } = await supabase.from('game_stats').delete().eq('id', id);
    if (!error) await fetch();
    return error;
  }

  return { stats, loading, refetch: fetch, upsertStats, deleteStats };
}
