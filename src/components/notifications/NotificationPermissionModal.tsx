import React, { useState } from 'react';
import { useAuth } from '../../hooks';
import { subscribeStaffToPush, isPushNotificationSupported, getIOSPushStatus } from '../../lib/pushNotifications';
import './NotificationPermissionModal.css';

interface NotificationPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscribed?: () => void;
}

export const NotificationPermissionModal: React.FC<NotificationPermissionModalProps> = ({
  isOpen,
  onClose,
  onSubscribed,
}) => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleEnable = async () => {
    if (!user?.id || !profile?.organization_id) {
      setErrorMessage('User session not found. Please log in again.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    const iosStatus = getIOSPushStatus();
    if (iosStatus.isIOS && !iosStatus.isStandalone) {
      setErrorMessage(
        'On iPhone/iPad, please add Credzo CRM to your Home Screen first (Tap Share ⎋ -> Add to Home Screen).'
      );
      setLoading(false);
      return;
    }

    if (!isPushNotificationSupported()) {
      setErrorMessage('Push notifications are not supported in this browser.');
      setLoading(false);
      return;
    }

    const result = await subscribeStaffToPush(user.id, profile.organization_id);

    if (result.success) {
      setLoading(false);
      onSubscribed?.();
      onClose();
    } else {
      setLoading(false);
      setErrorMessage(result.error || 'Failed to enable notifications.');
    }
  };

  const handleDismiss = () => {
    // Record session dismissal so we don't show the modal again in this session
    sessionStorage.setItem('credzo_notif_modal_dismissed', 'true');
    onClose();
  };

  return (
    <div className="notification-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="notif-modal-title">
      <div className="notification-modal-card">
        <div className="notification-modal-header">
          <div className="notification-icon-badge" aria-hidden="true">
            🔔
          </div>
          <div>
            <h2 id="notif-modal-title" className="notification-modal-title">
              Turn on notifications
            </h2>
            <p className="notification-modal-subtitle">
              Get instant alerts for new leads, follow-ups and pending documents.
            </p>
          </div>
        </div>

        <div className="notification-feature-list">
          <div className="notification-feature-item">
            <span className="notification-feature-bullet">⚡</span>
            <span>Instant Alerts — Receive new loan enquiries in real time</span>
          </div>
          <div className="notification-feature-item">
            <span className="notification-feature-bullet">⏰</span>
            <span>Follow-up Reminders — Never miss a scheduled callback</span>
          </div>
          <div className="notification-feature-item">
            <span className="notification-feature-bullet">📄</span>
            <span>Document Tracking — Status updates even when browser is closed</span>
          </div>
        </div>

        {errorMessage && (
          <div className="notification-modal-error" role="alert">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="notification-modal-actions">
          <button
            type="button"
            className="notification-btn-enable"
            onClick={handleEnable}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border" style={{ width: 14, height: 14, borderWidth: 2 }} />
                <span>Enabling...</span>
              </>
            ) : (
              'Enable Notifications'
            )}
          </button>
          <button
            type="button"
            className="notification-btn-dismiss"
            onClick={handleDismiss}
            disabled={loading}
          >
            Not Now
          </button>
        </div>
      </div>
    </div>
  );
};
