import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AIWidget } from './AIWidget';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/employees': 'Employees',
  '/attendance': 'Attendance',
  '/leaves': 'Leave Requests',
  '/leave-types': 'Leave Types',
  '/payroll': 'Payroll',
  '/profile': 'Profile'
};

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const title = pageTitles[location.pathname] || 'IntelliHR';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="min-h-screen lg:pl-72">
        <Header title={title} onMenuClick={() => setSidebarOpen(true)} />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 pb-24 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
      <AIWidget />
    </div>
  );
};
