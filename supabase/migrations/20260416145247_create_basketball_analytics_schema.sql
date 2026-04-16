/*
  # Basketball Analytics Schema

  ## Overview
  Full schema for a basketball analytics platform supporting player tracking,
  game management, shot-by-shot data, and advanced stats.

  ## New Tables

  ### players
  - id, user_id, name, position, team, height_inches, weight_lbs, jersey_number, created_at

  ### games
  - id, user_id, home_team, away_team, home_score, away_score, game_date, location, status, created_at

  ### game_stats
  Per-player per-game statistics including all counting stats and shooting splits.

  ### shots
  Every individual shot attempt with court coordinates and metadata.

  ## Security
  - RLS enabled on all tables
  - Users can only access their own data (via user_id = auth.uid())
*/

-- Players table
CREATE TABLE IF NOT EXISTS players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  position text NOT NULL DEFAULT 'G',
  team text NOT NULL DEFAULT '',
  height_inches integer DEFAULT 72,
  weight_lbs integer DEFAULT 180,
  jersey_number integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own players"
  ON players FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own players"
  ON players FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own players"
  ON players FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own players"
  ON players FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Games table
CREATE TABLE IF NOT EXISTS games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  home_team text NOT NULL DEFAULT '',
  away_team text NOT NULL DEFAULT '',
  home_score integer DEFAULT 0,
  away_score integer DEFAULT 0,
  game_date date NOT NULL DEFAULT CURRENT_DATE,
  location text DEFAULT '',
  status text NOT NULL DEFAULT 'scheduled',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own games"
  ON games FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own games"
  ON games FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own games"
  ON games FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own games"
  ON games FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Game stats table
CREATE TABLE IF NOT EXISTS game_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points integer DEFAULT 0,
  assists integer DEFAULT 0,
  rebounds_off integer DEFAULT 0,
  rebounds_def integer DEFAULT 0,
  steals integer DEFAULT 0,
  blocks integer DEFAULT 0,
  turnovers integer DEFAULT 0,
  minutes numeric(4,1) DEFAULT 0,
  fgm integer DEFAULT 0,
  fga integer DEFAULT 0,
  three_pm integer DEFAULT 0,
  three_pa integer DEFAULT 0,
  ftm integer DEFAULT 0,
  fta integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(game_id, player_id)
);

ALTER TABLE game_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own game_stats"
  ON game_stats FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own game_stats"
  ON game_stats FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own game_stats"
  ON game_stats FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own game_stats"
  ON game_stats FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Shots table
CREATE TABLE IF NOT EXISTS shots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  x numeric(6,2) NOT NULL DEFAULT 250,
  y numeric(6,2) NOT NULL DEFAULT 300,
  shot_type text NOT NULL DEFAULT '2PT',
  made boolean NOT NULL DEFAULT false,
  zone text NOT NULL DEFAULT 'mid_range',
  quarter integer DEFAULT 1,
  time_remaining text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE shots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own shots"
  ON shots FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own shots"
  ON shots FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shots"
  ON shots FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own shots"
  ON shots FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_players_user_id ON players(user_id);
CREATE INDEX IF NOT EXISTS idx_games_user_id ON games(user_id);
CREATE INDEX IF NOT EXISTS idx_games_date ON games(game_date DESC);
CREATE INDEX IF NOT EXISTS idx_game_stats_game_id ON game_stats(game_id);
CREATE INDEX IF NOT EXISTS idx_game_stats_player_id ON game_stats(player_id);
CREATE INDEX IF NOT EXISTS idx_shots_game_id ON shots(game_id);
CREATE INDEX IF NOT EXISTS idx_shots_player_id ON shots(player_id);
