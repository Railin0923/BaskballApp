import { ReactNode } from 'react';

interface Props {
  label: string;
  value: string | number;
  sub?: string;
  icon?: ReactNode;
  color?: 'orange' | 'blue' | 'green' | 'red' | 'slate';
  trend?: number;
}

const colors = {
  orange: 'text-orange-400',
  blue: 'text-blue-400',
  green: 'text-green-400',
  red: 'text-red-400',
  slate: 'text-slate-300',
};

export default function StatCard({ label, value, sub, icon, color = 'orange', trend }: Props) {
  return (
    <div className="bg-slate-900 border border-slate-700/50 rounded-xl p-4 flex flex-col gap-2 hover:border-slate-600 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">{label}</span>
        {icon && <span className={`${colors[color]} opacity-70`}>{icon}</span>}
      </div>
      <div className="flex items-end gap-2">
        <span className={`text-3xl font-bold ${colors[color]}`}>{value}</span>
        {trend !== undefined && (
          <span className={`text-xs mb-1 ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trend >= 0 ? '+' : ''}{trend.toFixed(1)}
          </span>
        )}
      </div>
      {sub && <span className="text-slate-500 text-xs">{sub}</span>}
    </div>
  );
}
