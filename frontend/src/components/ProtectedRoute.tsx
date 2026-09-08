import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getAccessToken } from '../api';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Wraps any route that requires authentication.
 * Redirects unauthenticated users to /login, preserving the intended URL.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();
  const token = getAccessToken();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
