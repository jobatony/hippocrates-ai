import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { getAccessToken } from '../api';

interface RoleRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requireAdmin?: boolean;
}

/**
 * Wraps routes that require a specific user role (e.g., 'Uploader', 'Validator') or Admin access.
 */
export const RoleRoute: React.FC<RoleRouteProps> = ({ children, allowedRoles = [], requireAdmin = false }) => {
  const location = useLocation();
  const token = getAccessToken();
  const { currentUser } = useStore();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!currentUser) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface text-on-surface">
        <span className="animate-pulse">Loading permissions...</span>
      </div>
    );
  }

  let hasAccess = false;
  if (requireAdmin) {
    hasAccess = currentUser.is_superuser || currentUser.is_staff;
  } else {
    hasAccess = currentUser.groups?.some(group => allowedRoles.includes(group)) || false;
  }

  if (!hasAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
