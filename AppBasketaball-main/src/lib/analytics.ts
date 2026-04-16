import { GameStats, AdvancedStats, PlayerAverages, Player, Shot, ShotZone, ZoneStats } from './types';

export function calcAdvancedStats(stats: GameStats): AdvancedStats {
  const fg_pct = stats.fga > 0 ? stats.fgm / stats.fga : 0;
  const three_pct = stats.three_pa > 0 ? stats.three_pm / stats.three_pa : 0;
  const ft_pct = stats.fta > 0 ? stats.ftm / stats.fta : 0;
  const efg_pct = stats.fga > 0 ? (stats.fgm + 0.5 * stats.three_pm) / stats.fga : 0;
  const true_shooting_pct =
    stats.fga + 0.44 * stats.fta > 0
      ? stats.points / (2 * (stats.fga + 0.44 * stats.fta))
      : 0;

  const rebounds_total = stats.rebounds_off + stats.rebounds_def;
  const per =
    stats.minutes > 0
      ? ((stats.points + rebounds_total + stats.assists + stats.steals + stats.blocks -
          stats.turnovers - (stats.fga - stats.fgm) - (stats.fta - stats.ftm) * 0.44) /
          stats.minutes) *
        36
      : 0;

  const usage_rate =
    stats.minutes > 0
      ? ((stats.fga + 0.44 * stats.fta + stats.turnovers) / stats.minutes) * 36
      : 0;

  return {
    fg_pct,
    three_pct,
    ft_pct,
    true_shooting_pct,
    per,
    usage_rate,
    rebounds_total,
    efg_pct,
  };
}

export function calcPlayerAverages(player: Player, statsList: GameStats[]): PlayerAverages {
  const n = statsList.length;
  if (n === 0) {
    return {
      player,
      games_played: 0,
      ppg: 0, apg: 0, rpg: 0, spg: 0, bpg: 0, topg: 0, mpg: 0,
      fg_pct: 0, three_pct: 0, ft_pct: 0, ts_pct: 0,
    };
  }

  const sum = statsList.reduce(
    (acc, s) => ({
      points: acc.points + s.points,
      assists: acc.assists + s.assists,
      reb: acc.reb + s.rebounds_off + s.rebounds_def,
      steals: acc.steals + s.steals,
      blocks: acc.blocks + s.blocks,
      turnovers: acc.turnovers + s.turnovers,
      minutes: acc.minutes + s.minutes,
      fgm: acc.fgm + s.fgm,
      fga: acc.fga + s.fga,
      three_pm: acc.three_pm + s.three_pm,
      three_pa: acc.three_pa + s.three_pa,
      ftm: acc.ftm + s.ftm,
      fta: acc.fta + s.fta,
    }),
    { points: 0, assists: 0, reb: 0, steals: 0, blocks: 0, turnovers: 0, minutes: 0, fgm: 0, fga: 0, three_pm: 0, three_pa: 0, ftm: 0, fta: 0 }
  );

  const ts_pct =
    sum.fga + 0.44 * sum.fta > 0
      ? sum.points / (2 * (sum.fga + 0.44 * sum.fta))
      : 0;

  return {
    player,
    games_played: n,
    ppg: sum.points / n,
    apg: sum.assists / n,
    rpg: sum.reb / n,
    spg: sum.steals / n,
    bpg: sum.blocks / n,
    topg: sum.turnovers / n,
    mpg: sum.minutes / n,
    fg_pct: sum.fga > 0 ? sum.fgm / sum.fga : 0,
    three_pct: sum.three_pa > 0 ? sum.three_pm / sum.three_pa : 0,
    ft_pct: sum.fta > 0 ? sum.ftm / sum.fta : 0,
    ts_pct,
  };
}

export function calcZoneStats(shots: Shot[]): ZoneStats[] {
  const zones: ShotZone[] = ['paint', 'mid_range', 'corner_3', 'top_3', 'free_throw'];
  return zones.map((zone) => {
    const zoneShots = shots.filter((s) => s.zone === zone);
    const made = zoneShots.filter((s) => s.made).length;
    const attempted = zoneShots.length;
    return { zone, made, attempted, pct: attempted > 0 ? made / attempted : 0 };
  });
}

export function determineShotZone(x: number, y: number, shotType: string): ShotZone {
  if (shotType === 'FT') return 'free_throw';
  const basketX = 250;
  const basketY = 390;
  const dx = x - basketX;
  const dy = y - basketY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const inPaint = x >= 169 && x <= 331 && y >= 220;
  if (inPaint && dist < 160) return 'paint';
  if (shotType === '3PT') {
    if (x < 80 || x > 420) return 'corner_3';
    return 'top_3';
  }
  return 'mid_range';
}

export function formatPct(val: number): string {
  return (val * 100).toFixed(1) + '%';
}

export function formatNum(val: number, decimals = 1): string {
  return val.toFixed(decimals);
}

export function exportToCSV(rows: Record<string, unknown>[], filename: string): void {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      headers.map((h) => JSON.stringify(row[h] ?? '')).join(',')
    ),
  ].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
