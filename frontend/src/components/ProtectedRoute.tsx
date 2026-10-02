import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getAccessToken, fetchMe } from '../api';
import { useStore } from '../store/useStore';

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
  const { currentUser, setCurrentUser, logout } = useStore();

  useEffect(() => {
    if (token && !currentUser) {
      fetchMe()
        .then(user => setCurrentUser(user))
        .catch(() => logout());
    }
  }, [token, currentUser, setCurrentUser, logout]);

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
