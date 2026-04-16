import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Game } from '../lib/types';

export function useGames() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .order('game_date', { ascending: false });
    if (error) setError(error.message);
    else setGames(data as Game[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  async function createGame(g: Omit<Game, 'id' | 'user_id' | 'created_at'>) {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('games')
      .insert({ ...g, user_id: user!.id })
      .select()
      .single();
    if (!error) await fetch();
    return { data: data as Game | null, error };
  }

  async function updateGame(id: string, g: Partial<Game>) {
    const { error } = await supabase.from('games').update(g).eq('id', id);
    if (!error) await fetch();
    return error;
  }

  async function deleteGame(id: string) {
    const { error } = await supabase.from('games').delete().eq('id', id);
    if (!error) await fetch();
    return error;
  }

  return { games, loading, error, refetch: fetch, createGame, updateGame, deleteGame };
}
