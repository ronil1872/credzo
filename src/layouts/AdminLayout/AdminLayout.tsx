import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks';
import './AdminLayout.css';

export const AdminLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/admin' },
    { label: 'Leads', path: '/admin/leads' },
    { label: 'Follow-ups', path: '/admin/follow-ups' },
    { label: 'Campaigns', path: '/admin/campaigns' },
    { label: 'Settings', path: '/admin/settings' },
  ];

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Staff User';
  const roleName = profile?.role || 'STAFF';

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <Link to="/admin" className="admin-brand">
            <span className="brand-primary">Credzo</span>
            <span className="brand-accent">CRM</span>
          </Link>
        </div>

        <nav className="admin-sidebar-nav">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== '/admin' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`admin-nav-item ${isActive ? 'active' : ''}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <Link to="/" className="admin-nav-item back-to-site">
            &larr; Public Website
          </Link>
          <button
            type="button"
            className="admin-logout-btn"
            onClick={handleSignOut}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <div className="admin-content-wrapper">
        <header className="admin-topbar">
          <div className="admin-topbar-title">
            <span>Sales & Lead Management Portal</span>
          </div>
          <div className="admin-topbar-user">
            <div className="user-profile-info">
              <span className="user-name">{displayName}</span>
              <span className={`user-role-badge role-${roleName.toLowerCase()}`}>
                {roleName}
              </span>
            </div>
            <button
              type="button"
              className="topbar-signout-btn"
              onClick={handleSignOut}
              title="Sign Out of CRM"
            >
              Sign Out
            </button>
          </div>
        </header>

        <main className="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
