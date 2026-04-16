import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { GameEvent, EventType } from '../lib/types';

export function useGameEvents(gameId?: string) {
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    if (!gameId) { setEvents([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from('game_events')
      .select('*, player:players(name, position), team:teams(name, abbreviation, primary_color)')
      .eq('game_id', gameId)
      .order('created_at', { ascending: false });
    setEvents((data as GameEvent[]) || []);
    setLoading(false);
  }, [gameId]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  async function addEvent(params: {
    gameId: string;
    teamId: string | null;
    playerId: string | null;
    eventType: EventType;
    quarter: number;
    clockSeconds: number;
    pointsValue: number;
    description: string;
  }) {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('game_events').insert({
      game_id: params.gameId,
      team_id: params.teamId,
      player_id: params.playerId,
      user_id: user!.id,
      event_type: params.eventType,
      quarter: params.quarter,
      clock_seconds: params.clockSeconds,
      points_value: params.pointsValue,
      description: params.description,
    });
    if (!error) await fetchEvents();
    return error;
  }

  async function deleteEvent(id: string) {
    const { error } = await supabase.from('game_events').delete().eq('id', id);
    if (!error) await fetchEvents();
    return error;
  }

  return { events, loading, refetch: fetchEvents, addEvent, deleteEvent };
}
