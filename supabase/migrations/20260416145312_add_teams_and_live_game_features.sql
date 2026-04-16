/*
  # Teams, Rosters, Live Game Events & Score Tracking

  ## Overview
  Extends the basketball analytics schema to support:
  - Registered teams with full profiles
  - Team rosters (players assigned to teams)
  - Games linked to registered teams (home_team_id / away_team_id)
  - Live game events for play-by-play tracking
  - Per-quarter score tracking

  ## New Tables

  ### teams
  - id, user_id, name, abbreviation, city, primary_color, created_at

  ### team_players
  - id, team_id, player_id, user_id, jersey_number, is_active, joined_at
  - Links players to teams with UNIQUE(team_id, player_id)

  ### game_events
  - id, game_id, team_id, player_id, user_id
  - event_type: 2pt_made, 2pt_miss, 3pt_made, 3pt_miss, ft_made, ft_miss,
                rebound_off, rebound_def, assist, steal, block, turnover, foul, timeout
  - quarter, clock_seconds, points_value, description

  ### quarter_scores
  - id, game_id, team_id, user_id, quarter, points
  - UNIQUE(game_id, team_id, quarter)

  ## Modified Tables

  ### games
  - home_team_id (FK to teams, nullable)
  - away_team_id (FK to teams, nullable)
  - current_quarter (1-5 for OT)
  - clock_seconds (time remaining in current quarter)

  ## Security
  - RLS enabled on all new tables
*/

-- =========================================================
-- TEAMS TABLE
-- =========================================================
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  abbreviation text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  primary_color text NOT NULL DEFAULT '#f97316',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own teams"
  ON teams FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own teams"
  ON teams FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own teams"
  ON teams FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own teams"
  ON teams FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- =========================================================
-- TEAM PLAYERS (ROSTER) TABLE
-- =========================================================
CREATE TABLE IF NOT EXISTS team_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  jersey_number integer,
  is_active boolean NOT NULL DEFAULT true,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(team_id, player_id)
);

ALTER TABLE team_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own team_players"
  ON team_players FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own team_players"
  ON team_players FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own team_players"
  ON team_players FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own team_players"
  ON team_players FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- =========================================================
-- ADD COLUMNS TO GAMES
-- =========================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'games' AND column_name = 'home_team_id'
  ) THEN
    ALTER TABLE games ADD COLUMN home_team_id uuid REFERENCES teams(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'games' AND column_name = 'away_team_id'
  ) THEN
    ALTER TABLE games ADD COLUMN away_team_id uuid REFERENCES teams(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'games' AND column_name = 'current_quarter'
  ) THEN
    ALTER TABLE games ADD COLUMN current_quarter integer NOT NULL DEFAULT 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'games' AND column_name = 'clock_seconds'
  ) THEN
    ALTER TABLE games ADD COLUMN clock_seconds integer NOT NULL DEFAULT 600;
  END IF;
END $$;

-- =========================================================
-- GAME EVENTS (PLAY-BY-PLAY) TABLE
-- =========================================================
CREATE TABLE IF NOT EXISTS game_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE SET NULL,
  player_id uuid REFERENCES players(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  quarter integer NOT NULL DEFAULT 1,
  clock_seconds integer NOT NULL DEFAULT 600,
  points_value integer NOT NULL DEFAULT 0,
  description text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE game_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own game_events"
  ON game_events FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own game_events"
  ON game_events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own game_events"
  ON game_events FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own game_events"
  ON game_events FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- =========================================================
-- QUARTER SCORES TABLE
-- =========================================================
CREATE TABLE IF NOT EXISTS quarter_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quarter integer NOT NULL,
  points integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(game_id, team_id, quarter)
);

ALTER TABLE quarter_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quarter_scores"
  ON quarter_scores FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quarter_scores"
  ON quarter_scores FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quarter_scores"
  ON quarter_scores FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own quarter_scores"
  ON quarter_scores FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- =========================================================
-- INDEXES
-- =========================================================
CREATE INDEX IF NOT EXISTS idx_teams_user_id ON teams(user_id);
CREATE INDEX IF NOT EXISTS idx_team_players_team_id ON team_players(team_id);
CREATE INDEX IF NOT EXISTS idx_team_players_player_id ON team_players(player_id);
CREATE INDEX IF NOT EXISTS idx_game_events_game_id ON game_events(game_id);
CREATE INDEX IF NOT EXISTS idx_game_events_team_id ON game_events(team_id);
CREATE INDEX IF NOT EXISTS idx_game_events_player_id ON game_events(player_id);
CREATE INDEX IF NOT EXISTS idx_quarter_scores_game_id ON quarter_scores(game_id);
CREATE INDEX IF NOT EXISTS idx_games_home_team_id ON games(home_team_id);
CREATE INDEX IF NOT EXISTS idx_games_away_team_id ON games(away_team_id);
