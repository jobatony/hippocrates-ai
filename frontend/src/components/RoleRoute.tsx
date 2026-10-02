import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { getAccessToken } from '../api';

interface RoleRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

/**
 * Wraps routes that require a specific user role (e.g., 'Uploader', 'Validator').
 */
export const RoleRoute: React.FC<RoleRouteProps> = ({ children, allowedRoles }) => {
  const location = useLocation();
  const token = getAccessToken();
  const { currentUser } = useStore();

  // If completely unauthenticated, redirect to login
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If token exists but currentUser hasn't been fetched yet (handled by ProtectedRoute),
  // we might render nothing or a loading spinner until it's ready.
  if (!currentUser) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface text-on-surface">
        <span className="animate-pulse">Loading permissions...</span>
      </div>
    );
  }

  const hasAccess = currentUser.groups?.some(group => allowedRoles.includes(group));

  if (!hasAccess) {
    // If authenticated but wrong role, redirect to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
