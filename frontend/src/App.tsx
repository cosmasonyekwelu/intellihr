import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { AIWidget } from './components/AIWidget';
import { PrivateRoute } from './components/PrivateRoute';

// Page Imports
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Employees } from './pages/Employees';
import { Attendance } from './pages/Attendance';
import { LeaveRequests } from './pages/LeaveRequests';
import { Payroll } from './pages/Payroll';

// Layout wrapper component to isolate header title logic dynamically
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  const getPageTitle = (path: string) => {
    switch (path) {
      case '/': return 'Dashboard';
      case '/employees': return 'Employees Registry';
      case '/attendance': return 'Attendance Logs';
      case '/leaves': return 'Leave Applications';
      case '/payroll': return 'Payroll Ledger';
      default: return 'IntelliHR Operations';
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 font-sans pl-64">
      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main console frame */}
      <div className="flex-1 flex flex-col min-h-screen">
        <Header title={getPageTitle(location.pathname)} />
        <main className="flex-1 p-8 overflow-y-auto max-w-[1400px] w-full mx-auto pb-24">
          {children}
        </main>
      </div>

      {/* Floating AI Chat Assistant */}
      <AIWidget />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        
        {/* Public Landing Page */}
        <Route path="/" element={<Landing />} />

        {/* Authentication landing page */}
        <Route path="/login" element={<Login />} />

        {/* Console protected areas */}
        <Route 
          path="/dashboard"
          element={
            <PrivateRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </PrivateRoute>
          } 
        />
        <Route 
          path="/employees" 
          element={
            <PrivateRoute allowedRoles={['admin', 'hr_manager']}>
              <Layout>
                <Employees />
              </Layout>
            </PrivateRoute>
          } 
        />
        <Route 
          path="/attendance" 
          element={
            <PrivateRoute>
              <Layout>
                <Attendance />
              </Layout>
            </PrivateRoute>
          } 
        />
        <Route 
          path="/leaves" 
          element={
            <PrivateRoute>
              <Layout>
                <LeaveRequests />
              </Layout>
            </PrivateRoute>
          } 
        />
        <Route 
          path="/payroll" 
          element={
            <PrivateRoute>
              <Layout>
                <Payroll />
              </Layout>
            </PrivateRoute>
          } 
        />

        {/* Session Fallback Redirection */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </Router>
  );
};

export default App;
