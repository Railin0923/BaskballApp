export type Position = 'PG' | 'SG' | 'SF' | 'PF' | 'C';
export type ShotType = '2PT' | '3PT' | 'FT';
export type ShotZone = 'paint' | 'mid_range' | 'corner_3' | 'top_3' | 'free_throw';
export type GameStatus = 'scheduled' | 'in_progress' | 'final';

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
  home_score: number;
  away_score: number;
  game_date: string;
  location: string;
  status: GameStatus;
  created_at: string;
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

export interface LiveGameState {
  gameId: string | null;
  playerId: string | null;
  stats: Partial<GameStats>;
  shots: Partial<Shot>[];
}

export interface ZoneStats {
  zone: ShotZone;
  made: number;
  attempted: number;
  pct: number;
}
