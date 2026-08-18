import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import './AdminLayout.css';

export const AdminLayout: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', path: '/admin' },
    { label: 'Leads', path: '/admin/leads' },
    { label: 'Follow-ups', path: '/admin/follow-ups' },
    { label: 'Campaigns', path: '/admin/campaigns' },
    { label: 'Settings', path: '/admin/settings' },
  ];

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <Link to="/admin" className="admin-brand">
            <span className="brand-primary">Loan</span>
            <span className="brand-accent">Check</span>
            <span className="admin-badge">CRM</span>
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
        </div>
      </aside>

      <div className="admin-content-wrapper">
        <header className="admin-topbar">
          <div className="admin-topbar-title">
            <span>LoanCheck Sales Management</span>
          </div>
          <div className="admin-topbar-user">
            <span className="user-role-badge">Stage 1 Routing Mode</span>
          </div>
        </header>

        <main className="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
