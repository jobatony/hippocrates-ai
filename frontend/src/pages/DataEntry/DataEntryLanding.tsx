import React from 'react';
import { Navigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';

export const DataEntryLanding: React.FC = () => {
  const { currentUser } = useStore();

  if (!currentUser) return null;

  if (currentUser.is_superuser || currentUser.is_staff) {
    return <Navigate to="/data-entry/admin" replace />;
  }
  
  if (currentUser.groups?.includes('Uploader')) {
    return <Navigate to="/data-entry/upload" replace />;
  }

  if (currentUser.groups?.includes('Validator')) {
    return <Navigate to="/data-entry/validate" replace />;
  }

  // Fallback if they have no roles
  return <Navigate to="/dashboard" replace />;
};
