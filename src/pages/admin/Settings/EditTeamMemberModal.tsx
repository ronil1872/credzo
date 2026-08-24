import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks';
import { Profile, UserRole } from '../../../types';
import '../crm.css';

interface EditTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetProfile: Profile | null;
  onUserUpdated: (updatedUser: Profile) => void;
}

export const EditTeamMemberModal: React.FC<EditTeamMemberModalProps> = ({
  isOpen,
  onClose,
  targetProfile,
  onUserUpdated,
}) => {
  const { profile } = useAuth();
  const isOwner = profile?.role === 'OWNER';
  const isTargetOwner = targetProfile?.role === 'OWNER';

  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [role, setRole] = useState<UserRole>('STAFF');
  const [isActive, setIsActive] = useState(true);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (targetProfile) {
      setFullName(targetProfile.full_name || '');
      setMobile(targetProfile.mobile || '');
      setRole(targetProfile.role || 'STAFF');
      setIsActive(targetProfile.is_active ?? true);
      setErrorMsg(null);
    }
  }, [targetProfile]);

  if (!isOpen || !targetProfile) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedName = fullName.trim();
    const trimmedMobile = mobile.trim();

    if (!trimmedName || trimmedName.length < 2) {
      setErrorMsg('Full name is required (minimum 2 characters).');
      return;
    }

    // Role restrictions
    let finalRole = role;
    if (isTargetOwner) {
      finalRole = 'OWNER'; // Target owner role is preserved
    } else if (!isOwner && profile?.role === 'ADMIN') {
      finalRole = targetProfile.role; // Admins cannot change roles
    }

    setLoading(true);

    try {
      // 1. Retrieve current active session token explicitly
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      // 2. Invoke secure Edge Function for server-side role & profile updates
      const { data, error } = await supabase.functions.invoke('admin-update-team-member', {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        body: {
          target_user_id: targetProfile.id,
          full_name: trimmedName,
          mobile: trimmedMobile || null,
          role: isTargetOwner ? 'OWNER' : isOwner ? finalRole : undefined,
          is_active: isTargetOwner ? true : isActive,
        },
      });

      if (error) {
        let displayError = error.message;
        if ('context' in error && (error as any).context) {
          try {
            const res = (error as any).context as Response;
            const cloned = typeof res.clone === 'function' ? res.clone() : res;
            const text = await cloned.text();
            try {
              const json = JSON.parse(text);
              if (json?.error) displayError = json.error;
            } catch {
              if (text && !text.includes('<!DOCTYPE') && !text.includes('<html>')) {
                displayError = text;
              }
            }
          } catch {}
        }
        console.error('[Credzo CRM] Update profile error:', displayError, error);
        setErrorMsg(displayError || 'Failed to update team member.');
        setLoading(false);
        return;
      }

      if (data?.error) {
        setErrorMsg(data.error);
        setLoading(false);
        return;
      }

      if (data?.profile) {
        onUserUpdated(data.profile as Profile);
        onClose();
      } else {
        setErrorMsg('Unexpected server response. Please refresh the team list.');
      }
    } catch (err: unknown) {
      console.error('[Credzo CRM] Unexpected profile update error:', err);
      setErrorMsg('An unexpected network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="crm-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="crm-modal-window" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="crm-modal-header">
          <div className="crm-modal-header-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span className={`status-badge ${targetProfile.role === 'OWNER' ? 'NEW' : targetProfile.role === 'ADMIN' ? 'CONTACTED' : 'DOCUMENTS'}`}>
                {targetProfile.role}
              </span>
              <span className="lead-ref-pill">#{targetProfile.id.slice(0, 8).toUpperCase()}</span>
            </div>
            <h2 className="crm-modal-title">Edit Team Member</h2>
            <p className="crm-modal-subtitle">
              Modify contact profile and permissions for {targetProfile.full_name}.
            </p>
          </div>
          <button type="button" className="crm-modal-close-btn" onClick={onClose} aria-label="Close dialog">
            ✕
          </button>
        </div>

        {/* Error Alert */}
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

        {/* Modal Form */}
        <form onSubmit={handleSubmit} style={{ padding: 'var(--space-4) var(--space-5)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {/* 1. Full Name */}
            <div>
              <label className="info-label" htmlFor="edit-user-fullname" style={{ display: 'block', marginBottom: 4 }}>
                Full Name <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                id="edit-user-fullname"
                type="text"
                className="value-input"
                style={{ width: '100%', padding: '10px 12px', fontSize: 'var(--font-size-sm)' }}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {/* 2. Mobile Number */}
            <div>
              <label className="info-label" htmlFor="edit-user-mobile" style={{ display: 'block', marginBottom: 4 }}>
                Mobile Number
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  +91
                </span>
                <input
                  id="edit-user-mobile"
                  type="tel"
                  className="value-input"
                  style={{ width: '100%', padding: '10px 12px', fontSize: 'var(--font-size-sm)' }}
                  placeholder="10-digit mobile"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  disabled={loading}
                />
              </div>
            </div>

            {/* 3. Role Selection */}
            <div>
              <label className="info-label" htmlFor="edit-user-role" style={{ display: 'block', marginBottom: 4 }}>
                System Role
              </label>
              {isTargetOwner ? (
                <div>
                  <input
                    id="edit-user-role"
                    type="text"
                    className="value-input"
                    value="OWNER (Organization Owner - Protected)"
                    disabled
                    style={{ width: '100%', background: '#f8fafc', fontWeight: 700, color: '#92400e' }}
                  />
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: 2, display: 'block' }}>
                    Organization Owner role is permanent and cannot be modified.
                  </span>
                </div>
              ) : isOwner ? (
                <select
                  id="edit-user-role"
                  className="crm-select"
                  style={{ width: '100%', padding: '10px 12px', fontSize: 'var(--font-size-sm)' }}
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  disabled={loading}
                >
                  <option value="STAFF">STAFF (Lead Management & Follow-ups)</option>
                  <option value="ADMIN">ADMIN (Full CRM & Staff Management)</option>
                </select>
              ) : (
                <div>
                  <input
                    id="edit-user-role"
                    type="text"
                    className="value-input"
                    value={`${role} (Locked)`}
                    disabled
                    style={{ width: '100%', background: '#f8fafc', fontWeight: 600 }}
                  />
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: 2, display: 'block' }}>
                    Only Organization Owners can alter team member roles.
                  </span>
                </div>
              )}
            </div>

            {/* 4. Account Status */}
            <div>
              <label className="info-label" style={{ display: 'block', marginBottom: 4 }}>
                Account Access Status
              </label>
              {isTargetOwner ? (
                <div style={{ fontSize: 'var(--font-size-xs)', color: '#047857', fontWeight: 700 }}>
                  Active (Owner accounts cannot be deactivated)
                </div>
              ) : (
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    disabled={loading}
                    style={{ width: 16, height: 16, accentColor: 'var(--color-primary)' }}
                  />
                  <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: isActive ? '#047857' : '#dc2626' }}>
                    {isActive ? 'Active (Permitted to sign in and manage CRM)' : 'Inactive (Deactivated - Sign in blocked)'}
                  </span>
                </label>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-6)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-subtle)' }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={loading}
            >
              {loading ? 'Saving Changes...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
