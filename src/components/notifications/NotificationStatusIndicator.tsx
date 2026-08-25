import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { NotificationPermissionState, getFriendlyDeviceName } from '../../lib/pushNotifications';
import './NotificationPermissionModal.css';

interface NotificationStatusIndicatorProps {
  permissionState: NotificationPermissionState;
  isSubscribed: boolean;
  onOpenSettings?: () => void;
}

export const NotificationStatusIndicator: React.FC<NotificationStatusIndicatorProps> = ({
  permissionState,
  isSubscribed,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const deviceName = getFriendlyDeviceName();

  const isEnabled = permissionState === 'granted' && isSubscribed;
  const isBlocked = permissionState === 'denied';

  let statusClass = 'status-disabled';
  let statusText = 'Notifications disabled';
  let badgeTitle = 'Web Push notifications are not active on this device. Click to configure.';

  if (isEnabled) {
    statusClass = 'status-enabled';
    statusText = 'Notifications enabled';
    badgeTitle = `🟢 Active on ${deviceName}. Click to manage settings.`;
  } else if (isBlocked) {
    statusClass = 'status-blocked';
    statusText = 'Notifications blocked';
    badgeTitle = '❌ Notifications are blocked in browser settings. Click for instructions.';
  }

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <Link
        to="/admin/settings"
        className={`notification-status-pill ${statusClass}`}
        title={badgeTitle}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        aria-label={`Push Notifications: ${statusText}`}
      >
        <span className="notification-status-dot" aria-hidden="true" />
        <span>{statusText}</span>
      </Link>

      {showTooltip && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            background: '#0f172a',
            color: '#f8fafc',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '0.75rem',
            whiteSpace: 'nowrap',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
            zIndex: 1000,
            pointerEvents: 'none',
          }}
        >
          {badgeTitle}
        </div>
      )}
    </div>
  );
};

