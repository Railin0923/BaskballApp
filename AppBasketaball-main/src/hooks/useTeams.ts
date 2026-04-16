import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Team, TeamPlayer } from '../lib/types';

export function useTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeams = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .order('name');
    if (error) setError(error.message);
    else setTeams(data as Team[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchTeams(); }, [fetchTeams]);

  async function createTeam(t: Omit<Team, 'id' | 'user_id' | 'created_at'>) {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('teams')
      .insert({ ...t, user_id: user!.id })
      .select()
      .single();
    if (!error) await fetchTeams();
    return { data: data as Team | null, error };
  }

  async function updateTeam(id: string, t: Partial<Team>) {
    const { error } = await supabase.from('teams').update(t).eq('id', id);
    if (!error) await fetchTeams();
    return error;
  }

  async function deleteTeam(id: string) {
    const { error } = await supabase.from('teams').delete().eq('id', id);
    if (!error) await fetchTeams();
    return error;
  }

  return { teams, loading, error, refetch: fetchTeams, createTeam, updateTeam, deleteTeam };
}

export function useTeamRoster(teamId?: string) {
  const [roster, setRoster] = useState<TeamPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRoster = useCallback(async () => {
    if (!teamId) { setRoster([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from('team_players')
      .select('*, player:players(*)')
      .eq('team_id', teamId)
      .order('joined_at');
    setRoster((data as TeamPlayer[]) || []);
    setLoading(false);
  }, [teamId]);

  useEffect(() => { fetchRoster(); }, [fetchRoster]);

  async function addPlayerToTeam(playerId: string, jerseyNumber?: number) {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('team_players').insert({
      team_id: teamId,
      player_id: playerId,
      user_id: user!.id,
      jersey_number: jerseyNumber ?? null,
      is_active: true,
    });
    if (!error) await fetchRoster();
    return error;
  }

  async function removePlayerFromTeam(teamPlayerId: string) {
    const { error } = await supabase.from('team_players').delete().eq('id', teamPlayerId);
    if (!error) await fetchRoster();
    return error;
  }

  async function updateRosterEntry(teamPlayerId: string, updates: Partial<TeamPlayer>) {
    const { error } = await supabase.from('team_players').update(updates).eq('id', teamPlayerId);
    if (!error) await fetchRoster();
    return error;
  }

  return { roster, loading, refetch: fetchRoster, addPlayerToTeam, removePlayerFromTeam, updateRosterEntry };
}
