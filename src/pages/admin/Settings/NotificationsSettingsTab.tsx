import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../hooks';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import {
  NotificationPermissionState,
  getFriendlyDeviceName,
  checkStaffPushSubscriptionStatus,
  subscribeStaffToPush,
  unsubscribeStaffFromPush,
  dispatchPushNotification,
  NotificationTemplates,
  NotificationEventType,
  getIOSPushStatus,
} from '../../../lib/pushNotifications';
import '../crm.css';

interface TeamMemberNotificationStatus {
  id: string;
  full_name: string;
  email?: string;
  role: string;
  is_active: boolean;
  active_devices_count: number;
  last_subscription_update?: string | null;
  device_names: string[];
}

export const NotificationsSettingsTab: React.FC = () => {
  const { user, profile } = useAuth();
  const isAdminOrOwner = profile?.role === 'ADMIN' || profile?.role === 'OWNER';

  // Current Device State
  const [devicePermission, setDevicePermission] = useState<NotificationPermissionState>('default');
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [loadingDevice, setLoadingDevice] = useState<boolean>(false);
  const [deviceEndpoint, setDeviceEndpoint] = useState<string | undefined>();
  const deviceName = getFriendlyDeviceName();
  const iosStatus = getIOSPushStatus();

  // Team Status State
  const [teamMembers, setTeamMembers] = useState<TeamMemberNotificationStatus[]>([]);
  const [loadingTeam, setLoadingTeam] = useState<boolean>(false);

  // Test Notification State
  const [testType, setTestType] = useState<NotificationEventType>('NEW_LEAD');
  const [testCustomerName, setTestCustomerName] = useState('Rahul Sharma');
  const [testAmount, setTestAmount] = useState(1500000);
  const [testLoanType, setTestLoanType] = useState('home');
  const [sendingTest, setSendingTest] = useState(false);
  const [testTargetUserId, setTestTargetUserId] = useState<string>('ME');

  // Messages
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const clearMessages = () => {
    setSuccessMsg(null);
    setErrorMsg(null);
  };

  // 1. Refresh current device status
  const refreshDeviceStatus = useCallback(async () => {
    if (!user?.id) return;
    const status = await checkStaffPushSubscriptionStatus(user.id);
    setDevicePermission(status.permission);
    setIsSubscribed(status.isSubscribed);
    setDeviceEndpoint(status.endpoint);
  }, [user?.id]);

  // 2. Fetch Team Notification Status
  const fetchTeamStatus = useCallback(async () => {
    if (!isSupabaseConfigured() || !profile?.organization_id || !isAdminOrOwner) return;
    setLoadingTeam(true);

    try {
      // Fetch all staff profiles in the organization
      const { data: profiles, error: profError } = await supabase
        .from('profiles')
        .select('id, full_name, role, is_active, created_at')
        .eq('organization_id', profile.organization_id)
        .order('full_name', { ascending: true });

      if (profError) throw profError;

      // Fetch active push subscriptions for the organization
      const { data: subscriptions, error: subError } = await supabase
        .from('push_subscriptions')
        .select('id, user_id, device_name, is_active, updated_at, last_used_at')
        .eq('organization_id', profile.organization_id)
        .eq('is_active', true);

      if (subError) throw subError;

      // Combine profiles with subscriptions
      const teamList: TeamMemberNotificationStatus[] = (profiles || []).map((p) => {
        const userSubs = (subscriptions || []).filter((s) => s.user_id === p.id);
        const deviceNames = userSubs.map((s) => s.device_name || 'Web Browser').filter(Boolean);
        const lastUpdated = userSubs.length > 0
          ? userSubs.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0].updated_at
          : null;

        return {
          id: p.id,
          full_name: p.full_name,
          role: p.role,
          is_active: p.is_active,
          active_devices_count: userSubs.length,
          last_subscription_update: lastUpdated,
          device_names: deviceNames,
        };
      });

      setTeamMembers(teamList);
    } catch (err: unknown) {
      console.warn('[Credzo Push] Error fetching team push status:', err);
    } finally {
      setLoadingTeam(false);
    }
  }, [profile?.organization_id, isAdminOrOwner]);

  useEffect(() => {
    refreshDeviceStatus();
    if (isAdminOrOwner) {
      fetchTeamStatus();
    }
  }, [refreshDeviceStatus, fetchTeamStatus, isAdminOrOwner]);

  // Toggle current device push subscription
  const handleToggleDeviceSubscription = async () => {
    clearMessages();
    setLoadingDevice(true);

    try {
      if (isSubscribed) {
        const res = await unsubscribeStaffFromPush(user?.id || '');
        if (res.success) {
          setSuccessMsg('Push notifications have been disabled for this device.');
          await refreshDeviceStatus();
          if (isAdminOrOwner) fetchTeamStatus();
        } else {
          setErrorMsg(res.error || 'Failed to disable notifications.');
        }
      } else {
        const res = await subscribeStaffToPush(user?.id, profile?.organization_id);
        if (res.success) {
          setSuccessMsg('🎉 Push notifications successfully enabled on this device!');
          await refreshDeviceStatus();
          if (isAdminOrOwner) fetchTeamStatus();
        } else {
          setErrorMsg(res.error || 'Failed to enable notifications.');
        }
      }
    } catch (err: unknown) {
      console.error('[Push Debug] Settings toggle subscription error:', err);
      setErrorMsg((err as Error)?.message || 'An error occurred while changing notification settings.');
    } finally {
      setLoadingDevice(false);
    }
  };

  // Build test notification payload based on selected type
  const getTestPayload = () => {
    switch (testType) {
      case 'NEW_LEAD':
        return NotificationTemplates.newLead(testCustomerName, testAmount, testLoanType);
      case 'FOLLOW_UP_DUE':
        return NotificationTemplates.followUpDue(testCustomerName);
      case 'FOLLOW_UP_OVERDUE':
        return NotificationTemplates.followUpOverdue(testCustomerName);
      case 'LEAD_GOING_COLD':
        return NotificationTemplates.leadGoingCold(testCustomerName, 3);
      case 'DOCUMENT_PENDING':
        return NotificationTemplates.documentPending(testCustomerName);
      case 'APPLICATION_STATUS':
        return NotificationTemplates.applicationStatus(testCustomerName, 'DOCUMENTS_VERIFIED');
      case 'HIGH_VALUE_LEAD':
        return NotificationTemplates.highValueLead(testCustomerName, 5000000, 'home');
      default:
        return NotificationTemplates.newLead(testCustomerName, testAmount, testLoanType);
    }
  };

  // Dispatch test notification
  const handleSendTestNotification = async (targetId?: string) => {
    clearMessages();
    setSendingTest(true);

    const payload = getTestPayload();
    const recipientUserId = targetId || (testTargetUserId === 'ME' ? user?.id : testTargetUserId);

    try {
      const result = await dispatchPushNotification({
        targetUserId: recipientUserId,
        organizationId: profile?.organization_id,
        notification: payload,
      });

      if (result.success) {
        if (result.sent && result.sent > 0) {
          setSuccessMsg(
            `🚀 Push notification sent successfully! (${result.sent} device${result.sent > 1 ? 's' : ''} reached)`
          );
        } else {
          setSuccessMsg(
            'Notification processed, but no active device subscriptions were registered for the recipient.'
          );
        }
      } else {
        setErrorMsg(result.error || 'Failed to dispatch test notification.');
      }
    } catch (err: unknown) {
      setErrorMsg((err as Error)?.message || 'Dispatch failure.');
    } finally {
      setSendingTest(false);
      if (isAdminOrOwner) fetchTeamStatus();
    }
  };

  const isCurrentDeviceEnabled = devicePermission === 'granted' && isSubscribed;

  return (
    <div className="notifications-settings-tab">
      {/* Alert Messages */}
      {successMsg && (
        <div
          style={{
            padding: '12px 16px',
            background: 'rgba(5, 150, 105, 0.1)',
            border: '1px solid rgba(5, 150, 105, 0.3)',
            borderRadius: 'var(--radius-lg)',
            color: 'var(--color-success)',
            fontWeight: 600,
            marginBottom: 'var(--space-4)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
          role="status"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="form-alert-error" style={{ marginBottom: 'var(--space-4)' }} role="alert">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Section 1: My Device Status */}
      <div className="crm-card" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="crm-card-header">
          <div>
            <span className="crm-card-title">📱 My Device Web Push Status</span>
            <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: 2 }}>
              Receive alerts on this browser even when you are logged out or have closed the website.
            </p>
          </div>
          <button
            type="button"
            className="crm-refresh-btn"
            onClick={refreshDeviceStatus}
            disabled={loadingDevice}
          >
            Refresh
          </button>
        </div>

        <div style={{ padding: 'var(--space-4) var(--space-5)' }}>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Current Device</span>
              <span className="info-value" style={{ fontWeight: 600 }}>{deviceName}</span>
            </div>

            <div className="info-item">
              <span className="info-label">Browser Permission</span>
              <span className="info-value">
                <span
                  className={`status-badge ${
                    devicePermission === 'granted'
                      ? 'NEW'
                      : devicePermission === 'denied'
                      ? 'LOST'
                      : 'DOCUMENTS'
                  }`}
                >
                  {devicePermission.toUpperCase()}
                </span>
              </span>
            </div>

            <div className="info-item">
              <span className="info-label">Web Push Subscription</span>
              <span className="info-value">
                {isCurrentDeviceEnabled ? (
                  <span style={{ color: '#047857', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#059669', display: 'inline-block' }} />
                    Active & Registered
                  </span>
                ) : (
                  <span style={{ color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#94a3b8', display: 'inline-block' }} />
                    Not Active
                  </span>
                )}
              </span>
            </div>

            <div className="info-item">
              <span className="info-label">Subscription Endpoint</span>
              <span
                className="info-value"
                style={{
                  fontSize: 'var(--font-size-xs)',
                  fontFamily: 'monospace',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '100%',
                }}
              >
                {deviceEndpoint ? `${deviceEndpoint.substring(0, 45)}...` : '—'}
              </span>
            </div>
          </div>

          {/* iOS Safari Guidance if applicable */}
          {iosStatus.isIOS && !iosStatus.isStandalone && (
            <div
              style={{
                marginTop: 'var(--space-4)',
                padding: '12px 16px',
                background: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--font-size-xs)',
                color: 'var(--text-primary)',
              }}
            >
              <strong>📱 iOS / iPadOS Setup:</strong> Apple Web Push requires adding Credzo CRM to your Home Screen.
              Tap <strong>Share (⎋)</strong> ➔ <strong>&quot;Add to Home Screen&quot;</strong> in Safari, then launch the app from your Home Screen.
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ marginTop: 'var(--space-5)', display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`btn ${isCurrentDeviceEnabled ? 'btn-secondary' : 'btn-primary'}`}
              onClick={handleToggleDeviceSubscription}
              disabled={loadingDevice}
              style={{ minHeight: 40 }}
            >
              {loadingDevice
                ? 'Processing...'
                : isCurrentDeviceEnabled
                ? 'Disable on This Device'
                : 'Enable Notifications on This Device'}
            </button>

            {isCurrentDeviceEnabled && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => handleSendTestNotification(user?.id)}
                disabled={sendingTest}
                style={{ minHeight: 40 }}
              >
                {sendingTest ? 'Sending Test...' : '⚡ Send Quick Test Alert to This Device'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Section 2: Team Notification Status Table (Admins & Owners) */}
      {isAdminOrOwner && (
        <div className="crm-card" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="crm-card-header">
            <div>
              <span className="crm-card-title">👥 Team Web Push Status</span>
              <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: 2 }}>
                Monitor device registrations and notification reach across your sales team.
              </p>
            </div>
            <button
              type="button"
              className="crm-refresh-btn"
              onClick={fetchTeamStatus}
              disabled={loadingTeam}
            >
              Refresh Team
            </button>
          </div>

          <div className="leads-table-wrapper">
            <table className="leads-table">
              <thead>
                <tr>
                  <th>Staff Member</th>
                  <th>Role</th>
                  <th>Notification Status</th>
                  <th>Active Devices</th>
                  <th>Registered Devices</th>
                  <th>Last Subscribed</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loadingTeam ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j}>
                          <div className="skeleton-bar" style={{ width: '80%', height: 14 }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : teamMembers.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state">
                        <p className="empty-state-title">No staff members found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  teamMembers.map((member) => {
                    const hasActiveDevices = member.active_devices_count > 0;
                    return (
                      <tr key={member.id}>
                        {/* 1. Name & Email */}
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                            {member.full_name}
                            {member.id === user?.id && (
                              <span style={{ fontSize: '0.7rem', marginLeft: 6, color: 'var(--color-primary)' }}>
                                (You)
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 2. Role */}
                        <td>
                          <span className={`status-badge ${member.role === 'OWNER' ? 'NEW' : member.role === 'ADMIN' ? 'CONTACTED' : 'DOCUMENTS'}`}>
                            {member.role}
                          </span>
                        </td>

                        {/* 3. Status */}
                        <td>
                          {hasActiveDevices ? (
                            <span style={{ color: '#047857', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#059669' }} />
                              Enabled
                            </span>
                          ) : (
                            <span style={{ color: '#64748b', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#94a3b8' }} />
                              Disabled
                            </span>
                          )}
                        </td>

                        {/* 4. Active Devices Count */}
                        <td>
                          <span style={{ fontWeight: 700 }}>
                            {member.active_devices_count} {member.active_devices_count === 1 ? 'device' : 'devices'}
                          </span>
                        </td>

                        {/* 5. Device Info */}
                        <td>
                          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                            {member.device_names.length > 0 ? member.device_names.join(', ') : 'None'}
                          </div>
                        </td>

                        {/* 6. Last Subscribed */}
                        <td>
                          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                            {member.last_subscription_update
                              ? new Date(member.last_subscription_update).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'Never'}
                          </span>
                        </td>

                        {/* 7. Action */}
                        <td>
                          <button
                            type="button"
                            className="crm-action-btn"
                            onClick={() => handleSendTestNotification(member.id)}
                            disabled={sendingTest || !hasActiveDevices}
                            title={hasActiveDevices ? 'Send a test notification to this staff member' : 'No active devices registered'}
                            style={{ opacity: hasActiveDevices ? 1 : 0.4 }}
                          >
                            Send Test Alert
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Section 3: Interactive Notification Testing Suite (7 Event Types) */}
      <div className="crm-card" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="crm-card-header">
          <div>
            <span className="crm-card-title">🧪 Notification Testing Suite</span>
            <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: 2 }}>
              Simulate and test any of the 7 CRM notification scenarios across active staff devices.
            </p>
          </div>
        </div>

        <div style={{ padding: 'var(--space-4) var(--space-5)' }}>
          <div className="crm-form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
            {/* Notification Event Type */}
            <div className="form-group">
              <label className="form-label" htmlFor="test-notif-type">Notification Type</label>
              <select
                id="test-notif-type"
                className="form-input"
                value={testType}
                onChange={(e) => setTestType(e.target.value as NotificationEventType)}
              >
                <option value="NEW_LEAD">1. 🔔 New Lead Received</option>
                <option value="FOLLOW_UP_DUE">2. ⏰ Follow-up Due</option>
                <option value="FOLLOW_UP_OVERDUE">3. ⚠️ Follow-up Overdue</option>
                <option value="LEAD_GOING_COLD">4. 🥶 Lead Going Cold</option>
                <option value="DOCUMENT_PENDING">5. 📄 Documents Pending</option>
                <option value="APPLICATION_STATUS">6. ✅ Application Updated</option>
                <option value="HIGH_VALUE_LEAD">7. 🔥 High-Value Lead</option>
              </select>
            </div>

            {/* Target Recipient */}
            <div className="form-group">
              <label className="form-label" htmlFor="test-target-user">Target Staff Member</label>
              <select
                id="test-target-user"
                className="form-input"
                value={testTargetUserId}
                onChange={(e) => setTestTargetUserId(e.target.value)}
              >
                <option value="ME">Current User (Me)</option>
                {isAdminOrOwner &&
                  teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name} ({m.active_devices_count} active devices)
                    </option>
                  ))}
              </select>
            </div>

            {/* Customer Name */}
            <div className="form-group">
              <label className="form-label" htmlFor="test-customer-name">Sample Customer Name</label>
              <input
                id="test-customer-name"
                type="text"
                className="form-input"
                value={testCustomerName}
                onChange={(e) => setTestCustomerName(e.target.value)}
              />
            </div>

            {/* Amount (for Lead & High Value) */}
            {(testType === 'NEW_LEAD' || testType === 'HIGH_VALUE_LEAD') && (
              <div className="form-group">
                <label className="form-label" htmlFor="test-amount">Loan Amount (₹)</label>
                <input
                  id="test-amount"
                  type="number"
                  step="50000"
                  className="form-input"
                  value={testAmount}
                  onChange={(e) => setTestAmount(parseInt(e.target.value, 10) || 0)}
                />
              </div>
            )}

            {/* Loan Type */}
            {testType === 'NEW_LEAD' && (
              <div className="form-group">
                <label className="form-label" htmlFor="test-loan-type">Loan Product</label>
                <select
                  id="test-loan-type"
                  className="form-input"
                  value={testLoanType}
                  onChange={(e) => setTestLoanType(e.target.value)}
                >
                  <option value="home">Home Loan</option>
                  <option value="personal">Personal Loan</option>
                  <option value="business">Business Loan</option>
                  <option value="lap">Loan Against Property (LAP)</option>
                  <option value="gold">Gold Loan</option>
                </select>
              </div>
            )}
          </div>

          {/* Live Preview Box */}
          <div
            style={{
              marginTop: 'var(--space-4)',
              padding: '14px 18px',
              background: 'var(--bg-surface-secondary, #f8fafc)',
              border: '1px solid var(--border-subtle, #e2e8f0)',
              borderRadius: 'var(--radius-lg, 12px)',
            }}
          >
            <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
              LIVE NOTIFICATION PAYLOAD PREVIEW:
            </div>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
              {getTestPayload().title}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: 2 }}>
              {getTestPayload().body}
            </div>
          </div>

          {/* Send Test Button */}
          <div style={{ marginTop: 'var(--space-5)' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleSendTestNotification()}
              disabled={sendingTest}
              style={{ minHeight: 44, padding: '0 24px' }}
            >
              {sendingTest ? 'Dispatching Push Notification...' : '🚀 Dispatch Test Push Notification'}
            </button>
          </div>
        </div>
      </div>

      {/* Section 4: System Architecture & Diagnostics */}
      <div className="crm-card">
        <div className="crm-card-header">
          <span className="crm-card-title">⚙️ Web Push System Diagnostics</span>
        </div>
        <div style={{ padding: 'var(--space-4) var(--space-5)' }}>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Service Worker API</span>
              <span className="info-value" style={{ color: 'var(--color-success)', fontWeight: 600 }}>
                {'serviceWorker' in navigator ? '● Supported' : '○ Not Supported'}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">PushManager API</span>
              <span className="info-value" style={{ color: 'var(--color-success)', fontWeight: 600 }}>
                {'PushManager' in window ? '● Supported' : '○ Not Supported'}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Notification API</span>
              <span className="info-value" style={{ color: 'var(--color-success)', fontWeight: 600 }}>
                {'Notification' in window ? '● Supported' : '○ Not Supported'}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">VAPID Protocol</span>
              <span className="info-value" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                RFC 8291 (aes128gcm) + RFC 8292
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
