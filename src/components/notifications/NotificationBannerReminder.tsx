import React, { useState } from 'react';
import { useAuth } from '../../hooks';
import {
  NotificationPermissionState,
  subscribeStaffToPush,
  getIOSPushStatus,
} from '../../lib/pushNotifications';
import './NotificationPermissionModal.css';

interface NotificationBannerReminderProps {
  permissionState: NotificationPermissionState;
  isSubscribed: boolean;
  onRefreshStatus?: () => void;
}

export const NotificationBannerReminder: React.FC<NotificationBannerReminderProps> = ({
  permissionState,
  isSubscribed,
  onRefreshStatus,
}) => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If already granted and active, no banner needed
  if (permissionState === 'granted' && isSubscribed) {
    return null;
  }

  const iosStatus = getIOSPushStatus();

  const handleEnableClick = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await subscribeStaffToPush(user?.id, profile?.organization_id);
      if (res.success) {
        onRefreshStatus?.();
      } else {
        setErrorMessage(res.error || 'Failed to subscribe.');
      }
    } catch (err: unknown) {
      console.error('[Push Debug] Banner enable error:', err);
      setErrorMessage((err as Error)?.message || 'An error occurred while enabling notifications.');
    } finally {
      setLoading(false);
    }
  };

  // Case 1: iOS device not in Standalone PWA mode
  if (iosStatus.isIOS && !iosStatus.isStandalone) {
    return (
      <div className="notification-banner-reminder banner-ios" role="region" aria-label="iOS notification setup">
        <div className="notification-banner-content">
          <span className="notification-banner-icon" aria-hidden="true">📱</span>
          <div>
            <span className="notification-banner-title">iOS Web Push Setup:</span>
            <span className="notification-banner-text">
              To receive alerts on iPhone or iPad, tap <strong>Share (⎋)</strong> in Safari and select <strong>&quot;Add to Home Screen&quot;</strong>.
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Case 2: Blocked / Denied in browser settings
  if (permissionState === 'denied') {
    return (
      <div className="notification-banner-reminder banner-blocked" role="region" aria-label="Notifications blocked">
        <div className="notification-banner-content">
          <span className="notification-banner-icon" aria-hidden="true">🔕</span>
          <div>
            <span className="notification-banner-title">Notifications are blocked in your browser.</span>
            <span className="notification-banner-text">
              Click the <strong>site settings / lock icon</strong> in your browser address bar and allow notifications to receive lead alerts.
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Case 3: Default or unsubscribed (can request permission)
  return (
    <div className="notification-banner-reminder banner-warning" role="region" aria-label="Notifications disabled reminder">
      <div className="notification-banner-content">
        <span className="notification-banner-icon" aria-hidden="true">🔕</span>
        <div>
          <span className="notification-banner-title">Notifications are disabled.</span>
          <span className="notification-banner-text">
            Enable notifications to receive new lead and follow-up alerts even when you are logged out.
          </span>
          {errorMessage && (
            <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: 4 }}>
              {errorMessage}
            </div>
          )}
        </div>
      </div>
      <button
        type="button"
        className="notification-banner-btn"
        onClick={handleEnableClick}
        disabled={loading}
      >
        {loading ? 'Enabling...' : errorMessage ? '🔄 Try Again' : 'Enable'}
      </button>
    </div>
  );
};
