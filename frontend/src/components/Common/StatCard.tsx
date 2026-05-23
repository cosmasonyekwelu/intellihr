import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  color?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky';
}

export const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  description, 
  color = 'indigo' 
}) => {
  const colorMap = {
    indigo: {
      bg: 'bg-indigo-500/10',
      text: 'text-indigo-400',
      border: 'border-indigo-500/20',
      glow: 'shadow-indigo-500/5'
    },
    emerald: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/20',
      glow: 'shadow-emerald-500/5'
    },
    amber: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/20',
      glow: 'shadow-amber-500/5'
    },
    rose: {
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      border: 'border-rose-500/20',
      glow: 'shadow-rose-500/5'
    },
    sky: {
      bg: 'bg-sky-500/10',
      text: 'text-sky-400',
      border: 'border-sky-500/20',
      glow: 'shadow-sky-500/5'
    }
  };

  const selectedColor = colorMap[color];

  return (
    <div className={`p-6 rounded-2xl bg-slate-900 border ${selectedColor.border} shadow-lg ${selectedColor.glow} flex items-center justify-between transition-all duration-300 hover:-translate-y-1 hover:border-slate-700`}>
      <div className="space-y-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
          {title}
        </span>
        <h3 className="text-3xl font-extrabold text-white tracking-tight">{value}</h3>
        {description && (
          <p className="text-xs text-slate-400 font-medium">{description}</p>
        )}
      </div>

      <div className={`w-12 h-12 rounded-xl ${selectedColor.bg} ${selectedColor.text} flex items-center justify-center`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
};
