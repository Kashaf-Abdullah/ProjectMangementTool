import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = ({ allowPM = false }) => {
  const { user } = useAuth();
  const allowed = allowPM
    ? ['admin', 'project_manager', 'super_admin']
    : ['admin', 'super_admin'];

  if (!user || !allowed.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;
