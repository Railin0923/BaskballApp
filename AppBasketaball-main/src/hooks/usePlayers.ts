import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Player } from '../lib/types';

export function usePlayers() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .order('name');
    if (error) setError(error.message);
    else setPlayers(data as Player[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  async function createPlayer(p: Omit<Player, 'id' | 'user_id' | 'created_at'>) {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('players').insert({ ...p, user_id: user!.id });
    if (!error) await fetch();
    return error;
  }

  async function updatePlayer(id: string, p: Partial<Player>) {
    const { error } = await supabase.from('players').update(p).eq('id', id);
    if (!error) await fetch();
    return error;
  }

  async function deletePlayer(id: string) {
    const { error } = await supabase.from('players').delete().eq('id', id);
    if (!error) await fetch();
    return error;
  }

  return { players, loading, error, refetch: fetch, createPlayer, updatePlayer, deletePlayer };
}
