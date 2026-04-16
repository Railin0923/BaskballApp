export type Position = 'PG' | 'SG' | 'SF' | 'PF' | 'C';
export type ShotType = '2PT' | '3PT' | 'FT';
export type ShotZone = 'paint' | 'mid_range' | 'corner_3' | 'top_3' | 'free_throw';
export type GameStatus = 'scheduled' | 'in_progress' | 'final';
export type EventType =
  | '2pt_made' | '2pt_miss'
  | '3pt_made' | '3pt_miss'
  | 'ft_made' | 'ft_miss'
  | 'rebound_off' | 'rebound_def'
  | 'assist' | 'steal' | 'block' | 'turnover'
  | 'foul' | 'timeout' | 'sub_in' | 'sub_out';

export interface Team {
  id: string;
  user_id: string;
  name: string;
  abbreviation: string;
  city: string;
  primary_color: string;
  created_at: string;
  player_count?: number;
}

export interface TeamPlayer {
  id: string;
  team_id: string;
  player_id: string;
  user_id: string;
  jersey_number: number | null;
  is_active: boolean;
  joined_at: string;
  player?: Player;
  team?: Team;
}

export interface Player {
  id: string;
  user_id: string;
  name: string;
  position: Position;
  team: string;
  height_inches: number;
  weight_lbs: number;
  jersey_number: number | null;
  created_at: string;
}

export interface Game {
  id: string;
  user_id: string;
  home_team: string;
  away_team: string;
  home_team_id: string | null;
  away_team_id: string | null;
  home_score: number;
  away_score: number;
  game_date: string;
  location: string;
  status: GameStatus;
  current_quarter: number;
  clock_seconds: number;
  created_at: string;
  home_team_data?: Team;
  away_team_data?: Team;
}

export interface GameStats {
  id: string;
  game_id: string;
  player_id: string;
  user_id: string;
  points: number;
  assists: number;
  rebounds_off: number;
  rebounds_def: number;
  steals: number;
  blocks: number;
  turnovers: number;
  minutes: number;
  fgm: number;
  fga: number;
  three_pm: number;
  three_pa: number;
  ftm: number;
  fta: number;
  created_at: string;
  player?: Player;
  game?: Game;
}

export interface Shot {
  id: string;
  game_id: string;
  player_id: string;
  user_id: string;
  x: number;
  y: number;
  shot_type: ShotType;
  made: boolean;
  zone: ShotZone;
  quarter: number;
  time_remaining: string;
  created_at: string;
  player?: Player;
  game?: Game;
}

export interface GameEvent {
  id: string;
  game_id: string;
  team_id: string | null;
  player_id: string | null;
  user_id: string;
  event_type: EventType;
  quarter: number;
  clock_seconds: number;
  points_value: number;
  description: string;
  created_at: string;
  player?: Player;
  team?: Team;
}

export interface QuarterScore {
  id: string;
  game_id: string;
  team_id: string;
  user_id: string;
  quarter: number;
  points: number;
  created_at: string;
  team?: Team;
}

export interface AdvancedStats {
  fg_pct: number;
  three_pct: number;
  ft_pct: number;
  true_shooting_pct: number;
  per: number;
  usage_rate: number;
  rebounds_total: number;
  efg_pct: number;
}

export interface PlayerAverages {
  player: Player;
  games_played: number;
  ppg: number;
  apg: number;
  rpg: number;
  spg: number;
  bpg: number;
  topg: number;
  mpg: number;
  fg_pct: number;
  three_pct: number;
  ft_pct: number;
  ts_pct: number;
}

export interface TeamStats {
  team: Team;
  games_played: number;
  wins: number;
  losses: number;
  ppg: number;
  apg: number;
  rpg: number;
  spg: number;
  bpg: number;
  topg: number;
  fg_pct: number;
  three_pct: number;
}

export interface ZoneStats {
  zone: ShotZone;
  made: number;
  attempted: number;
  pct: number;
}
