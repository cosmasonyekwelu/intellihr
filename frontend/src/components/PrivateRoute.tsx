import React from 'react';
import { Navigate } from 'react-router-dom';

interface PrivateRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<'admin' | 'hr_manager' | 'employee'>;
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('intellihr_token');
  const userString = localStorage.getItem('intellihr_user');

  if (!token || !userString) {
    // Session missing
    return <Navigate to="/login" replace />;
  }

  const user = JSON.parse(userString);

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Insufficient roles
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-brand-textMuted max-w-md">
          Your account role (<span className="text-red-400 uppercase font-mono font-bold text-xs">{user.role}</span>) does not have privileges to view this resource. Contact your IT administrator.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};
