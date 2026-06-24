import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute: React.FC<{ children: React.ReactNode; managerOnly?: boolean }> = ({ children, managerOnly }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (managerOnly && user.role !== 'manager') return <Navigate to="/" replace />;
  return <>{children}</>;
};

export default ProtectedRoute;
