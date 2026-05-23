import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card } from '../ui/Card';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  color?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky';
}

const colorMap = {
  indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-100',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  amber: 'bg-amber-50 text-amber-700 ring-amber-100',
  rose: 'bg-rose-50 text-rose-700 ring-rose-100',
  sky: 'bg-sky-50 text-sky-700 ring-sky-100'
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  description,
  color = 'indigo'
}) => (
  <Card className="transition hover:-translate-y-0.5 hover:shadow-md">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{value}</p>
        {description && <p className="mt-2 text-sm text-slate-500">{description}</p>}
      </div>
      <div className={`flex h-11 w-11 items-center justify-center rounded-lg ring-1 ${colorMap[color]}`}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  </Card>
);
