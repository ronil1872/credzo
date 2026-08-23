import React, { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Profile } from '../../../types';
import '../crm.css';

interface DeactivateUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  targetProfile: Profile | null;
  onStatusChanged: (updatedUser: Profile) => void;
}

export const DeactivateUserDialog: React.FC<DeactivateUserDialogProps> = ({
  isOpen,
  onClose,
  targetProfile,
  onStatusChanged,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !targetProfile) return null;

  const isCurrentlyActive = targetProfile.is_active ?? true;
  const isOwner = targetProfile.role === 'OWNER';

  const handleToggleStatus = async () => {
    if (isOwner && isCurrentlyActive) {
      setErrorMsg('Organization Owner accounts cannot be deactivated.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const nextStatus = !isCurrentlyActive;
      const nowIso = new Date().toISOString();

      const { data, error } = await supabase
        .from('profiles')
        .update({
          is_active: nextStatus,
          updated_at: nowIso,
        })
        .eq('id', targetProfile.id)
        .select()
        .single();

      if (error) {
        console.error('[Credzo CRM] Toggle active status error:', error);
        setErrorMsg(error.message || 'Failed to update account status.');
      } else if (data) {
        onStatusChanged(data as Profile);
        onClose();
      }
    } catch (err: unknown) {
      console.error('[Credzo CRM] Unexpected toggle active status exception:', err);
      setErrorMsg('An unexpected network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="crm-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="crm-modal-window" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
        <div className="crm-modal-header">
          <div className="crm-modal-header-info">
            <h2 className="crm-modal-title">
              {isCurrentlyActive ? 'Deactivate Team Member' : 'Reactivate Team Member'}
            </h2>
            <p className="crm-modal-subtitle">
              {targetProfile.full_name} ({targetProfile.role})
            </p>
          </div>
          <button type="button" className="crm-modal-close-btn" onClick={onClose} aria-label="Close dialog">
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="form-alert-error" style={{ margin: 'var(--space-3) var(--space-4) 0' }} role="alert">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{errorMsg}</span>
          </div>
        )}

        <div style={{ padding: 'var(--space-4) var(--space-5)' }}>
          {isCurrentlyActive ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {isOwner ? (
                <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', padding: '12px 14px', borderRadius: 'var(--radius-md)', color: '#92400e', fontSize: 'var(--font-size-sm)' }}>
                  <strong>Protected Account:</strong> This staff member is an Organization Owner. The organization must retain at least one active Owner, so Owner accounts cannot be deactivated.
                </div>
              ) : (
                <>
                  <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                    Are you sure you want to deactivate <strong>{targetProfile.full_name}</strong>?
                  </p>
                  <ul style={{ margin: 0, paddingLeft: 'var(--space-4)', fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    <li>The user will immediately be blocked from logging into the CRM.</li>
                    <li>Their existing assigned leads, notes, and activity history will remain completely preserved.</li>
                    <li>You can reactivate this account at any time.</li>
                  </ul>
                </>
              )}
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)', lineHeight: 1.5 }}>
              Reactivating <strong>{targetProfile.full_name}</strong> will immediately restore their access to Credzo CRM with their assigned <strong>{targetProfile.role}</strong> permissions.
            </p>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-6)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-subtle)' }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            {!isOwner && (
              <button
                type="button"
                className={`btn btn-sm ${isCurrentlyActive ? 'btn-danger' : 'btn-primary'}`}
                onClick={handleToggleStatus}
                disabled={loading}
              >
                {loading
                  ? 'Updating...'
                  : isCurrentlyActive
                  ? 'Confirm Deactivation'
                  : 'Reactivate Account'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
