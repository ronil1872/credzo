import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks';
import { ErrorBoundary } from '../../components/ErrorBoundary/ErrorBoundary';
import './AdminLayout.css';

export const AdminLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  // Close drawer automatically on navigation change
  useEffect(() => {
    setIsDrawerOpen(false);
  }, [location.pathname]);

  // Lock background scrolling when mobile drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isDrawerOpen]);

  const navItems = [
    { label: 'Dashboard', path: '/admin' },
    { label: 'Leads', path: '/admin/leads' },
    { label: 'Insurance Leads', path: '/admin/insurance' },
    { label: 'Follow-ups', path: '/admin/follow-ups' },
    { label: 'Campaigns', path: '/admin/campaigns' },
    { label: 'Settings', path: '/admin/settings' },
  ];

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Staff User';
  const roleName = profile?.role || 'STAFF';

  return (
    <div className="admin-layout">
      {/* Mobile Drawer Backdrop Overlay */}
      {isDrawerOpen && (
        <div
          className="admin-drawer-backdrop"
          onClick={() => setIsDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar / Mobile Navigation Drawer */}
      <aside
        className={`admin-sidebar ${isDrawerOpen ? 'drawer-open' : ''}`}
        aria-label="CRM Navigation"
      >
        <div className="admin-sidebar-header">
          <Link to="/admin" className="admin-brand" aria-label="Credzo CRM Home">
            <span className="brand-primary">Credzo</span>
            <span className="brand-accent">CRM</span>
          </Link>
          <button
            type="button"
            className="admin-drawer-close-btn"
            onClick={() => setIsDrawerOpen(false)}
            aria-label="Close navigation menu"
          >
            ✕
          </button>
        </div>

        <nav className="admin-sidebar-nav" aria-label="Main navigation">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== '/admin' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`admin-nav-item ${isActive ? 'active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => setIsDrawerOpen(false)}
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
            aria-label="Sign out of CRM"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <div className="admin-content-wrapper">
        <header className="admin-topbar" role="banner">
          <div className="admin-topbar-left">
            <button
              type="button"
              className="admin-hamburger-btn"
              onClick={() => setIsDrawerOpen(true)}
              aria-label="Open CRM Navigation Menu"
              aria-expanded={isDrawerOpen}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <Link to="/admin" className="admin-topbar-mobile-brand">
              <span className="brand-primary">Credzo</span>
              <span className="brand-accent">CRM</span>
            </Link>
            <div className="admin-topbar-title">
              <span>Sales & Lead Management Portal</span>
            </div>
          </div>

          <div className="admin-topbar-user">
            <div className="user-profile-info">
              <span className="user-name">{displayName}</span>
              <span className={`user-role-badge role-${roleName.toLowerCase()}`} aria-label={`Role: ${roleName}`}>
                {roleName}
              </span>
            </div>
            <button
              type="button"
              className="topbar-signout-btn"
              onClick={handleSignOut}
              aria-label="Sign out of CRM"
            >
              Sign Out
            </button>
          </div>
        </header>

        <main className="admin-main" id="main-content" role="main">
          <ErrorBoundary context="Admin Page">
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

