import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { PrivateRoute } from './components/PrivateRoute';
import { DashboardLayout } from './layouts/DashboardLayout';
import { ToastProvider } from './components/ui/Toast';

// Page Imports
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { ResetPassword } from './pages/ResetPassword';
import { ForgotPassword } from './pages/ForgotPassword';
import { EmployeeRegister } from './pages/EmployeeRegister';
import { Dashboard } from './pages/Dashboard';
import { Employees } from './pages/Employees';
import { Attendance } from './pages/Attendance';
import { LeaveRequests } from './pages/LeaveRequests';
import { Payroll } from './pages/Payroll';
import { LeaveTypes } from './pages/LeaveTypes';
import { Profile } from './pages/Profile';

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/register/employee" element={<EmployeeRegister />} />

          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/employees"
            element={
              <PrivateRoute allowedRoles={['hr']}>
                <DashboardLayout>
                  <Employees />
                </DashboardLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/attendance"
            element={
              <PrivateRoute>
                <DashboardLayout>
                  <Attendance />
                </DashboardLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/leaves"
            element={
              <PrivateRoute>
                <DashboardLayout>
                  <LeaveRequests />
                </DashboardLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/leave-types"
            element={
              <PrivateRoute allowedRoles={['hr']}>
                <DashboardLayout>
                  <LeaveTypes />
                </DashboardLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/payroll"
            element={
              <PrivateRoute>
                <DashboardLayout>
                  <Payroll />
                </DashboardLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <DashboardLayout>
                  <Profile />
                </DashboardLayout>
              </PrivateRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
};

export default App;
