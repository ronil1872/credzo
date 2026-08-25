import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks';
import { supabase } from '../../lib/supabase';
import { ErrorBoundary } from '../../components/ErrorBoundary/ErrorBoundary';
import {
  checkStaffPushSubscriptionStatus,
  NotificationPermissionState,
} from '../../lib/pushNotifications';
import {
  NotificationPermissionModal,
  NotificationBannerReminder,
  NotificationStatusIndicator,
} from '../../components/notifications';
import './AdminLayout.css';

export const AdminLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Web Push Notification State
  const [permissionState, setPermissionState] = useState<NotificationPermissionState>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission as NotificationPermissionState;
    }
    return 'default';
  });
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState<boolean>(false);

  const refreshNotificationStatus = useCallback(async () => {
    console.log('[Credzo Push Debug] 🔍 Initializing Web Push audit for authenticated CRM user:', {
      userId: user?.id,
      userEmail: user?.email,
      role: profile?.role,
      hasNotificationApi: typeof window !== 'undefined' && 'Notification' in window,
      rawNotificationPermission: typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported',
      hasServiceWorkerApi: typeof window !== 'undefined' && 'serviceWorker' in navigator,
      hasPushManagerApi: typeof window !== 'undefined' && 'PushManager' in window,
    });

    if (!user?.id) {
      console.log('[Credzo Push Debug] Waiting for authenticated user identity...');
      return;
    }

    try {
      // 1. Ensure service worker is registered
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js', { scope: '/' })
          .then((reg) => console.info('[Credzo Push Debug] ✅ /sw.js active registration ready:', reg.scope))
          .catch((swErr) => console.warn('[Credzo Push Debug] ⚠️ Service worker registration warning:', swErr));
      }

      // 2. Query subscription and permission status
      const status = await checkStaffPushSubscriptionStatus(user.id);
      console.log('[Credzo Push Debug] 📊 Device Subscription Status:', status);

      setPermissionState(status.permission);
      setIsSubscribed(status.isSubscribed);

      // 3. Permission Modal Trigger Logic
      const isDismissed = sessionStorage.getItem('credzo_notif_modal_dismissed') === 'true';
      const shouldPrompt = (status.permission === 'default' || status.permission === 'unsupported') && !status.isSubscribed && !isDismissed;

      console.log('[Credzo Push Debug] 🔔 Modal Trigger Evaluation:', {
        permission: status.permission,
        isSubscribed: status.isSubscribed,
        isDismissedInSession: isDismissed,
        willShowModal: shouldPrompt,
      });

      if (shouldPrompt) {
        setIsNotifModalOpen(true);
      }
    } catch (err) {
      console.error('[Credzo Push Debug] ❌ Error refreshing notification status:', err);
    }
  }, [user?.id, user?.email, profile?.role]);

  useEffect(() => {
    refreshNotificationStatus();
  }, [user?.id, refreshNotificationStatus]);

  // Periodic check for due follow-ups and cold leads across the organization
  useEffect(() => {
    if (!profile?.organization_id) return;
    supabase.functions
      .invoke('send-push-notification', {
        body: {
          action: 'check-crm-reminders',
          organization_id: profile.organization_id,
        },
      })
      .catch(() => {});
  }, [profile?.organization_id]);

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
      {/* Push Notification First-Time Permission Request Modal */}
      <NotificationPermissionModal
        isOpen={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
        onSubscribed={() => {
          setIsNotifModalOpen(false);
          refreshNotificationStatus();
        }}
      />

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
          <div className="admin-topbar-primary">
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
              {/* Notification Status Indicator Pill (Desktop / Tablet view) */}
              <div className="admin-topbar-notif-desktop">
                <NotificationStatusIndicator
                  permissionState={permissionState}
                  isSubscribed={isSubscribed}
                />
              </div>

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
          </div>

          {/* Dedicated Mobile Notification Status Indicator (Row 2 on Mobile) */}
          <div className="admin-topbar-mobile-notif-row">
            <NotificationStatusIndicator
              permissionState={permissionState}
              isSubscribed={isSubscribed}
            />
          </div>
        </header>

        <main className="admin-main" id="main-content" role="main">
          {/* Persistent Notification Banner Reminder when notifications are disabled or blocked */}
          <NotificationBannerReminder
            permissionState={permissionState}
            isSubscribed={isSubscribed}
            onRefreshStatus={refreshNotificationStatus}
          />

          <ErrorBoundary context="Admin Page">
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};
