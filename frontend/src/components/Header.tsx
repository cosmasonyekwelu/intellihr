import React from 'react';
import { Menu, Search, Shield, Sparkles } from 'lucide-react';
import { getCurrentUser } from '../services/auth';
import { Avatar } from './ui/Avatar';

interface HeaderProps {
  title: string;
  onMenuClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, onMenuClick }) => {
  const user = getCurrentUser();

  return (
    <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white/90 px-4 backdrop-blur lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button type="button" onClick={onMenuClick} className="rounded-lg border border-slate-200 p-2 text-slate-600 lg:hidden">
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h2 className="truncate text-lg font-bold tracking-tight text-slate-950">{title}</h2>
          <p className="hidden text-sm text-slate-500 sm:block">IntelliHR operations console</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 xl:flex">
          <Search className="h-4 w-4" />
          <span>Search people, payroll, requests</span>
        </div>
        {/* n8n Status Badge */}
        <div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 md:flex">
          <Sparkles className="h-3.5 w-3.5" />
          <span>n8n online</span>
        </div>

        {/* User Role Pill */}
        <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 sm:flex">
          <Shield className="h-3.5 w-3.5 text-indigo-600" />
          <span>{user?.role === 'hr' ? 'HR Manager' : 'Employee'} Mode</span>
        </div>
        <Avatar name={user?.name} size="sm" />
      </div>
    </header>
  );
};
