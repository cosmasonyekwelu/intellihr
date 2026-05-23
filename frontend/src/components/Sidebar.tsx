import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Clock, 
  CalendarDays, 
  CircleDollarSign, 
  LogOut,
  X,
  SlidersHorizontal,
  UserRound
} from 'lucide-react';
import { clearSession, getCurrentUser } from '../services/auth';
import { Avatar } from './ui/Avatar';

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ open = false, onClose }) => {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const isHR = user?.role === 'hr';

  const handleLogout = () => {
    clearSession();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, show: true },
    { name: 'Employees', to: '/employees', icon: Users, show: isHR },
    { name: 'Attendance', to: '/attendance', icon: Clock, show: true },
    { name: 'Leave Requests', to: '/leaves', icon: CalendarDays, show: true },
    { name: 'Leave Types', to: '/leave-types', icon: SlidersHorizontal, show: isHR },
    { name: 'Payroll', to: '/payroll', icon: CircleDollarSign, show: true },
    { name: 'Profile', to: '/profile', icon: UserRound, show: true },
  ];

  return (
    <>
      {open && <button type="button" aria-label="Close navigation overlay" className="fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-sm lg:hidden" onClick={onClose} />}
      <aside className={`fixed left-0 top-0 z-40 flex h-screen w-72 flex-col border-r border-slate-200 bg-white shadow-xl shadow-slate-900/10 transition-transform duration-300 lg:translate-x-0 lg:shadow-none ${open ? 'translate-x-0' : '-translate-x-full'}`}>
      {/* Brand Section */}
      <div className="flex items-center gap-3 border-b border-slate-200 p-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white shadow-sm shadow-indigo-500/30">
          iH
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-extrabold leading-none text-slate-950">
            IntelliHR
          </h1>
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            People operations
          </span>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navItems
          .filter((item) => item.show)
          .map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                  }`
                }
              >
                <Icon className="h-5 w-5 transition-transform group-hover:scale-105" />
                {item.name}
              </NavLink>
            );
          })}
      </nav>

      {/* Footer User Info */}
      <div className="border-t border-slate-200 bg-slate-50 p-4">
        <div className="mb-3 flex items-center gap-3 rounded-lg bg-white p-3 shadow-sm">
          <Avatar name={user?.name} size="sm" />
          <div className="min-w-0">
            <h4 className="truncate text-sm font-semibold text-slate-950">{user?.name || 'User'}</h4>
            <span className="block truncate text-xs font-semibold capitalize text-slate-500">
              {(user?.role || 'employee').replace('_', ' ')}
            </span>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          id="btn_logout"
          className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
    </>
  );
};
