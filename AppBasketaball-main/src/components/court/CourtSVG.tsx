interface Props {
  width?: number;
  height?: number;
  children?: React.ReactNode;
  onClick?: (x: number, y: number) => void;
}

export default function CourtSVG({ width = 500, height = 470, children, onClick }: Props) {
  const scaleX = width / 500;
  const scaleY = height / 470;

  function handleClick(e: React.MouseEvent<SVGSVGElement>) {
    if (!onClick) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const svgX = (e.clientX - rect.left) / (rect.width / 500);
    const svgY = (e.clientY - rect.top) / (rect.height / 470);
    onClick(svgX, svgY);
  }

  return (
    <svg
      viewBox="0 0 500 470"
      width={width}
      height={height}
      onClick={handleClick}
      className="rounded-xl"
      style={{ cursor: onClick ? 'crosshair' : 'default', background: '#1a2235' }}
    >
      {/* Court floor */}
      <rect x="0" y="0" width="500" height="470" fill="#1e293b" rx="8" />

      {/* Half court outline */}
      <rect x="10" y="10" width="480" height="450" fill="none" stroke="#334155" strokeWidth="2" rx="4" />

      {/* Center circle */}
      <circle cx="250" cy="10" r="60" fill="none" stroke="#334155" strokeWidth="2" />

      {/* Key / Paint */}
      <rect x="169" y="240" width="162" height="195" fill="rgba(59,130,246,0.06)" stroke="#334155" strokeWidth="2" />

      {/* Free throw line */}
      <line x1="169" y1="240" x2="331" y2="240" stroke="#475569" strokeWidth="2" />

      {/* Free throw circle */}
      <circle cx="250" cy="240" r="60" fill="none" stroke="#334155" strokeWidth="2" />
      <path
        d={`M 190 240 A 60 60 0 0 0 310 240`}
        fill="none" stroke="#475569" strokeWidth="2" strokeDasharray="8,6"
      />

      {/* Restricted area */}
      <path
        d={`M 210 435 A 40 40 0 0 1 290 435`}
        fill="none" stroke="#475569" strokeWidth="2"
      />

      {/* Backboard */}
      <rect x="219" y="405" width="62" height="6" fill="#475569" rx="2" />

      {/* Basket */}
      <circle cx="250" cy="415" r="9" fill="none" stroke="#f97316" strokeWidth="2.5" />
      <circle cx="250" cy="415" r="2" fill="#f97316" />

      {/* 3-point line corners (straight parts) */}
      <line x1="52" y1="435" x2="52" y2="285" stroke="#475569" strokeWidth="2" />
      <line x1="448" y1="435" x2="448" y2="285" stroke="#475569" strokeWidth="2" />

      {/* 3-point arc */}
      <path
        d={`M 52 285 A 237 237 0 0 1 448 285`}
        fill="none" stroke="#475569" strokeWidth="2"
      />

      {/* Lane lines */}
      <line x1="212" y1="240" x2="212" y2="435" stroke="#334155" strokeWidth="1" />
      <line x1="288" y1="240" x2="288" y2="435" stroke="#334155" strokeWidth="1" />

      {/* Block marks on lane */}
      {[290, 330, 362, 392].map((y) => (
        <g key={y}>
          <rect x="169" y={y} width="14" height="4" fill="#334155" />
          <rect x="317" y={y} width="14" height="4" fill="#334155" />
        </g>
      ))}

      {/* Baseline */}
      <line x1="10" y1="435" x2="490" y2="435" stroke="#334155" strokeWidth="2" />

      {/* Mid-range zone indicators (subtle) */}
      <text x="250" y="205" textAnchor="middle" fill="#475569" fontSize="9" fontFamily="monospace">MID-RANGE</text>
      <text x="80" y="350" textAnchor="middle" fill="#475569" fontSize="8" fontFamily="monospace">C3</text>
      <text x="420" y="350" textAnchor="middle" fill="#475569" fontSize="8" fontFamily="monospace">C3</text>
      <text x="250" y="390" textAnchor="middle" fill="#475569" fontSize="9" fontFamily="monospace">PAINT</text>
      <text x="250" y="130" textAnchor="middle" fill="#475569" fontSize="9" fontFamily="monospace">TOP 3</text>

      {/* Scale helpers hidden */}
      <g transform={`scale(${scaleX}, ${scaleY})`} style={{ display: 'none' }} />

      {children}
    </svg>
  );
}
