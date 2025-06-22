import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ isLoggedIn, children }: { isLoggedIn: boolean, children: React.ReactNode }) {
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}
