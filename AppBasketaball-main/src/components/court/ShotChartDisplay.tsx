import { useState } from 'react';
import { Shot } from '../../lib/types';
import CourtSVG from './CourtSVG';
import { calcZoneStats } from '../../lib/analytics';

interface Props {
  shots: Shot[];
  showHeatmap?: boolean;
}

export default function ShotChartDisplay({ shots, showHeatmap = false }: Props) {
  const [hoveredShot, setHoveredShot] = useState<Shot | null>(null);
  const zoneStats = calcZoneStats(shots);

  const madeShots = shots.filter((s) => s.made);
  const missedShots = shots.filter((s) => !s.made);
  const fgPct = shots.length > 0 ? (madeShots.length / shots.length) * 100 : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4 text-sm">
        <span className="flex items-center gap-1.5 text-slate-300">
          <span className="w-3 h-3 rounded-full bg-green-400 inline-block" />
          Made ({madeShots.length})
        </span>
        <span className="flex items-center gap-1.5 text-slate-300">
          <span className="w-3 h-3 rounded-full bg-red-400 inline-block" />
          Missed ({missedShots.length})
        </span>
        <span className="text-slate-400 ml-auto">
          FG%: <span className="text-white font-semibold">{fgPct.toFixed(1)}%</span>
        </span>
      </div>

      <div className="relative w-full">
        <CourtSVG>
          {shots.map((shot) => (
            <g key={shot.id}>
              <circle
                cx={shot.x}
                cy={shot.y}
                r={8}
                fill={shot.made ? 'rgba(34,197,94,0.85)' : 'rgba(239,68,68,0.85)'}
                stroke={shot.made ? '#16a34a' : '#b91c1c'}
                strokeWidth={1.5}
                className="cursor-pointer transition-opacity hover:opacity-100"
                opacity={hoveredShot?.id === shot.id ? 1 : 0.75}
                onMouseEnter={() => setHoveredShot(shot)}
                onMouseLeave={() => setHoveredShot(null)}
              />
              {!shot.made && (
                <>
                  <line
                    x1={shot.x - 4} y1={shot.y - 4}
                    x2={shot.x + 4} y2={shot.y + 4}
                    stroke="#b91c1c" strokeWidth={1.5}
                    pointerEvents="none"
                  />
                  <line
                    x1={shot.x + 4} y1={shot.y - 4}
                    x2={shot.x - 4} y2={shot.y + 4}
                    stroke="#b91c1c" strokeWidth={1.5}
                    pointerEvents="none"
                  />
                </>
              )}
            </g>
          ))}
        </CourtSVG>

        {hoveredShot && (
          <div className="absolute top-2 right-2 bg-slate-900/95 border border-slate-700 rounded-lg p-3 text-xs text-slate-300 pointer-events-none z-10">
            <div className={`font-bold mb-1 ${hoveredShot.made ? 'text-green-400' : 'text-red-400'}`}>
              {hoveredShot.made ? 'MADE' : 'MISSED'}
            </div>
            <div>{hoveredShot.shot_type}</div>
            <div className="capitalize">{hoveredShot.zone.replace('_', ' ')}</div>
            {hoveredShot.quarter && <div>Q{hoveredShot.quarter}</div>}
          </div>
        )}
      </div>

      <div className="grid grid-cols-5 gap-2">
        {zoneStats.map((z) => (
          <div key={z.zone} className="bg-slate-800/50 rounded-lg p-2 text-center">
            <div className="text-slate-400 text-xs capitalize mb-1">{z.zone.replace('_', ' ')}</div>
            <div className="text-white font-bold text-sm">{(z.pct * 100).toFixed(0)}%</div>
            <div className="text-slate-500 text-xs">{z.made}/{z.attempted}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
