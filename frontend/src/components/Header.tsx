import React from 'react';
import { Shield, Sparkles } from 'lucide-react';

interface HeaderProps {
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  const userString = localStorage.getItem('intellihr_user');
  const user = userString ? JSON.parse(userString) : null;

  return (
    <header className="h-20 bg-slate-900/60 backdrop-blur-md border-b border-slate-800/80 px-8 flex items-center justify-between sticky top-0 z-10">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white">{title}</h2>
        <p className="text-xs text-slate-500">IntelliHR Operations Console</p>
      </div>

      <div className="flex items-center gap-4">
        {/* n8n Status Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>n8n Core Online</span>
        </div>

        {/* User Role Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold">
          <Shield className="w-3.5 h-3.5 text-indigo-400" />
          <span className="capitalize">{user?.role?.replace('_', ' ') || 'Employee'} Mode</span>
        </div>
      </div>
    </header>
  );
};
