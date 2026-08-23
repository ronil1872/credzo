import React, { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks';
import { Profile, UserRole } from '../../../types';
import '../crm.css';

interface AddTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: (newUser: Profile) => void;
}

export const AddTeamMemberModal: React.FC<AddTeamMemberModalProps> = ({
  isOpen,
  onClose,
  onUserCreated,
}) => {
  const { profile } = useAuth();
  const isOwner = profile?.role === 'OWNER';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [role, setRole] = useState<UserRole>('STAFF');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedMobile = mobile.trim();

    if (!trimmedName || trimmedName.length < 2) {
      setErrorMsg('Please enter the team member’s full name (at least 2 characters).');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      // 1. Retrieve current active session token explicitly
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      // 2. Invoke secure Edge Function for server-side user provisioning
      // Pass explicit Authorization header to ensure auth token is always attached
      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        body: {
          full_name: trimmedName,
          email: trimmedEmail,
          mobile: trimmedMobile || null,
          role,
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
        console.error('[Credzo CRM] User creation error:', displayError, error);
        setErrorMsg(displayError || 'Failed to create team member.');
        setLoading(false);
        return;
      }

      if (data?.error) {
        setErrorMsg(data.error);
        setLoading(false);
        return;
      }

      if (data?.user) {
        const createdProfile: Profile = {
          id: data.user.id,
          organization_id: profile?.organization_id || '',
          full_name: data.user.full_name,
          role: data.user.role,
          mobile: data.user.mobile || null,
          is_active: data.user.is_active ?? true,
          created_at: data.user.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        onUserCreated(createdProfile);
        onClose();
      } else {
        setErrorMsg('Unexpected server response. Please refresh the team list.');
      }
    } catch (err: unknown) {
      console.error('[Credzo CRM] Unexpected exception provisioning user:', err);
      setErrorMsg('An unexpected network error occurred. Please try again.');
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
            <h2 className="crm-modal-title">Add Team Member</h2>
            <p className="crm-modal-subtitle">
              Provision a new staff account with authenticated access to Credzo CRM.
            </p>
          </div>
          <button type="button" className="crm-modal-close-btn" onClick={onClose} aria-label="Close dialog">
            ✕
          </button>
        </div>

        {/* Form Alert */}
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

        {/* Modal Body */}
        <form onSubmit={handleSubmit} style={{ padding: 'var(--space-4) var(--space-5)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {/* 1. Full Name */}
            <div>
              <label className="info-label" htmlFor="new-user-fullname" style={{ display: 'block', marginBottom: 4 }}>
                Full Name <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                id="new-user-fullname"
                type="text"
                className="value-input"
                style={{ width: '100%', padding: '10px 12px', fontSize: 'var(--font-size-sm)' }}
                placeholder="e.g. Rahul Sharma"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {/* 2. Email Address */}
            <div>
              <label className="info-label" htmlFor="new-user-email" style={{ display: 'block', marginBottom: 4 }}>
                Email Address <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                id="new-user-email"
                type="email"
                className="value-input"
                style={{ width: '100%', padding: '10px 12px', fontSize: 'var(--font-size-sm)' }}
                placeholder="e.g. rahul@credzofinance.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: 2, display: 'block' }}>
                Used for staff sign-in and secure password setup communications.
              </span>
            </div>

            {/* 3. Mobile Number */}
            <div>
              <label className="info-label" htmlFor="new-user-mobile" style={{ display: 'block', marginBottom: 4 }}>
                Mobile Number
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  +91
                </span>
                <input
                  id="new-user-mobile"
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

            {/* 4. Role Selection */}
            <div>
              <label className="info-label" htmlFor="new-user-role" style={{ display: 'block', marginBottom: 4 }}>
                Assigned Role <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <select
                id="new-user-role"
                className="crm-select"
                style={{ width: '100%', padding: '10px 12px', fontSize: 'var(--font-size-sm)' }}
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                disabled={loading}
              >
                <option value="STAFF">STAFF (Lead Management & Follow-ups)</option>
                {isOwner && <option value="ADMIN">ADMIN (Full CRM & Staff Management)</option>}
              </select>
              {!isOwner && (
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: 2, display: 'block' }}>
                  Administrators can provision Staff members. Contact an Organization Owner to create Admin accounts.
                </span>
              )}
            </div>

            {/* 5. Secure First-Time Login Notice */}
            <div style={{ background: '#f8fafc', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '12px 14px' }}>
              <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                🔐 Secure Password Setup Flow
              </div>
              <p style={{ margin: 0, fontSize: '0.6875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Admins never handle staff passwords. Once provisioned, the staff member can establish their private password securely using the password recovery flow at <strong>/admin/reset-password</strong>.
              </p>
            </div>
          </div>

          {/* Modal Actions */}
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
              {loading ? 'Provisioning User...' : 'Add Team Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
