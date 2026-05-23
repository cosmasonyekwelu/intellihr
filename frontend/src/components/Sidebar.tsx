import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Clock, 
  CalendarDays, 
  CircleDollarSign, 
  LogOut 
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const userString = localStorage.getItem('intellihr_user');
  const user = userString ? JSON.parse(userString) : null;
  const isAdminOrHR = user?.role === 'admin' || user?.role === 'hr_manager';

  const handleLogout = () => {
    localStorage.removeItem('intellihr_token');
    localStorage.removeItem('intellihr_user');
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', to: '/', icon: LayoutDashboard, show: true },
    { name: 'Employees', to: '/employees', icon: Users, show: isAdminOrHR },
    { name: 'Attendance', to: '/attendance', icon: Clock, show: true },
    { name: 'Leave Requests', to: '/leaves', icon: CalendarDays, show: true },
    { name: 'Payroll', to: '/payroll', icon: CircleDollarSign, show: true },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen fixed left-0 top-0 z-20">
      {/* Brand Section */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/30">
          iH
        </div>
        <div>
          <h1 className="font-extrabold text-lg leading-none bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
            IntelliHR
          </h1>
          <span className="text-[10px] text-slate-500 font-semibold tracking-widest uppercase">
            AI Automation
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems
          .filter((item) => item.show)
          .map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-sm font-medium ${
                    isActive
                      ? 'bg-indigo-600/10 text-indigo-400 border-l-4 border-indigo-500'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  }`
                }
              >
                <Icon className="w-5 h-5 transition-transform group-hover:scale-105" />
                {item.name}
              </NavLink>
            );
          })}
      </nav>

      {/* Footer User Info */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
            {user?.name?.substring(0, 2).toUpperCase() || 'US'}
          </div>
          <div className="overflow-hidden">
            <h4 className="text-xs font-bold text-slate-200 truncate">{user?.name || 'User'}</h4>
            <span className="text-[9px] font-mono text-indigo-400 uppercase tracking-widest block truncate">
              {user?.role || 'employee'}
            </span>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          id="btn_logout"
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors border border-dashed border-red-500/20"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};
