import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Shot } from '../lib/types';

export function useShots(gameId?: string, playerId?: string) {
  const [shots, setShots] = useState<Shot[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('shots')
      .select('*, player:players(*), game:games(*)');
    if (gameId) query = query.eq('game_id', gameId);
    if (playerId) query = query.eq('player_id', playerId);
    const { data } = await query.order('created_at', { ascending: true });
    setShots((data as Shot[]) || []);
    setLoading(false);
  }, [gameId, playerId]);

  useEffect(() => { fetch(); }, [fetch]);

  async function addShot(shot: Omit<Shot, 'id' | 'user_id' | 'created_at'>) {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('shots').insert({ ...shot, user_id: user!.id });
    if (!error) await fetch();
    return error;
  }

  async function deleteShot(id: string) {
    const { error } = await supabase.from('shots').delete().eq('id', id);
    if (!error) await fetch();
    return error;
  }

  return { shots, loading, refetch: fetch, addShot, deleteShot };
}
