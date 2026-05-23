import React from 'react';
import { Navigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { getCurrentUser } from '../services/auth';

interface PrivateRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<'hr' | 'employee'>;
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('intellihr_token');
  const user = getCurrentUser();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-8 text-center">
        <div className="max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-bold text-slate-950">Access denied</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Your account role <span className="font-semibold text-rose-600">{user.role.replace('_', ' ')}</span> does not have privileges to view this workspace.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
