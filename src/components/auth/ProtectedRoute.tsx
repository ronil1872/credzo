import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks';

export const ProtectedRoute: React.FC = () => {
  const { user, profile, loading, signOut } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="auth-loading-container" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: 'var(--bg-app)',
        color: 'var(--text-secondary)',
        gap: 'var(--space-4)',
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          border: '3px solid var(--border-subtle)',
          borderTopColor: 'var(--color-primary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
        <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>
          Authenticating CRM session...
        </span>
      </div>
    );
  }

  if (!user) {
    // Redirect unauthenticated requests to login, preserving intended path
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (profile && profile.is_active === false) {
    signOut();
    return <Navigate to="/admin/login" state={{ deact: true }} replace />;
  }

  return <Outlet />;
};
