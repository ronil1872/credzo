import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks';
import { Profile, UserRole } from '../../../types';
import '../crm.css';

interface AddTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: (newUser: Profile) => void;
}

interface CreatedCredentials {
  fullName: string;
  email: string;
  role: string;
  temporaryPassword: string;
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

  // Credentials Display State
  const [createdCredentials, setCreatedCredentials] = useState<CreatedCredentials | null>(null);
  const [showPassword, setShowPassword] = useState(true);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      // Clear sensitive state when modal is closed
      setCreatedCredentials(null);
      setFullName('');
      setEmail('');
      setMobile('');
      setRole('STAFF');
      setErrorMsg(null);
      setLoading(false);
      setCopiedPassword(false);
      setCopiedAll(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    // Strictly zero out state
    setCreatedCredentials(null);
    setFullName('');
    setEmail('');
    setMobile('');
    setErrorMsg(null);
    onClose();
  };

  const handleCopyPassword = async () => {
    if (!createdCredentials) return;
    try {
      await navigator.clipboard.writeText(createdCredentials.temporaryPassword);
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 3000);
    } catch {
      // Fallback
    }
  };

  const handleCopyAllCredentials = async () => {
    if (!createdCredentials) return;
    try {
      const loginUrl = `${window.location.origin}/admin/login`;
      const textToCopy = `Credzo CRM Login Credentials:
Name: ${createdCredentials.fullName}
Role: ${createdCredentials.role}
Login URL: ${loginUrl}
Email: ${createdCredentials.email}
Temporary Password: ${createdCredentials.temporaryPassword}

Important: You will be required to create your private permanent password when you first log in.`;

      await navigator.clipboard.writeText(textToCopy);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 3000);
    } catch {
      // Fallback
    }
  };

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
        if (!data.user.temporary_password || typeof data.user.temporary_password !== 'string') {
          setErrorMsg('Temporary password was not returned by the server. Please verify backend deployment.');
          setLoading(false);
          return;
        }

        const createdProfile: Profile = {
          id: data.user.id,
          organization_id: profile?.organization_id || '',
          full_name: data.user.full_name,
          role: data.user.role,
          mobile: data.user.mobile || null,
          is_active: data.user.is_active ?? true,
          must_change_password: true,
          created_at: data.user.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // Notify parent to refresh list immediately
        onUserCreated(createdProfile);

        // Display credentials once to the creator
        setCreatedCredentials({
          fullName: data.user.full_name,
          email: data.user.email,
          role: data.user.role,
          temporaryPassword: data.user.temporary_password,
        });
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
    <div className="crm-modal-backdrop" onClick={handleClose} role="dialog" aria-modal="true">
      <div className="crm-modal-window" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="crm-modal-header">
          <div className="crm-modal-header-info">
            <h2 className="crm-modal-title">
              {createdCredentials ? 'TEAM MEMBER CREATED' : 'Add Team Member'}
            </h2>
            <p className="crm-modal-subtitle">
              {createdCredentials
                ? `Account provisioned for ${createdCredentials.fullName}`
                : 'Provision a new staff account with authenticated access to Credzo CRM.'}
            </p>
          </div>
          <button type="button" className="crm-modal-close-btn" onClick={handleClose} aria-label="Close dialog">
            ✕
          </button>
        </div>

        {/* Form Alert */}
        {errorMsg && !createdCredentials && (
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
        {createdCredentials ? (
          <div style={{ padding: 'var(--space-4) var(--space-5)' }}>
            {/* Credentials Card */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-4)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-3)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-2)' }}>
                <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Account Details
                </span>
                <span
                  className={`status-badge ${createdCredentials.role === 'ADMIN' ? 'CONTACTED' : 'DOCUMENTS'}`}
                  style={{
                    background: createdCredentials.role === 'ADMIN' ? '#f3e8ff' : '#eff6ff',
                    color: createdCredentials.role === 'ADMIN' ? '#7e22ce' : '#1d4ed8',
                  }}
                >
                  {createdCredentials.role}
                </span>
              </div>

              <div>
                <span className="info-label" style={{ display: 'block', marginBottom: 2 }}>Full Name</span>
                <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {createdCredentials.fullName}
                </div>
              </div>

              <div>
                <span className="info-label" style={{ display: 'block', marginBottom: 2 }}>Email Address</span>
                <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {createdCredentials.email}
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span className="info-label">Temporary Password</span>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '0.6875rem',
                      color: 'var(--color-primary)',
                      cursor: 'pointer',
                      padding: 0,
                      fontWeight: 600,
                    }}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '8px 12px',
                    fontFamily: 'monospace',
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: '#0f172a',
                    letterSpacing: '0.08em',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>{showPassword ? createdCredentials.temporaryPassword : '••••••••••••••••••'}</span>
                </div>
              </div>
            </div>

            {/* Quick Action Copy Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleCopyPassword}
              >
                {copiedPassword ? '✓ Copied Password' : '📋 Copy Password'}
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleCopyAllCredentials}
              >
                {copiedAll ? '✓ Copied Full Info' : '📋 Copy Credentials'}
              </button>
            </div>

            {/* Security Warning Notice */}
            <div style={{ marginTop: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <div
                style={{
                  background: '#fffbeb',
                  border: '1px solid #fef3c7',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 12px',
                  color: '#92400e',
                  fontSize: 'var(--font-size-xs)',
                  lineHeight: 1.4,
                }}
              >
                <strong>⚠️ Secure Delivery Required:</strong> Give these credentials to the team member securely. <strong>No email has been sent.</strong>
              </div>

              <div
                style={{
                  background: '#eff6ff',
                  border: '1px solid #dbeafe',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 12px',
                  color: '#1e40af',
                  fontSize: 'var(--font-size-xs)',
                  lineHeight: 1.4,
                }}
              >
                <strong>🔐 First-Login Password Change:</strong> The team member will be required to change this temporary password when they first log in.
              </div>
            </div>

            {/* Modal Done Action */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-5)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-subtle)' }}>
              <button type="button" className="btn btn-primary btn-sm" onClick={handleClose}>
                Done & Close
              </button>
            </div>
          </div>
        ) : (
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
                  Used as the staff member's permanent login username.
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

              {/* 5. Secure Onboarding Notice */}
              <div style={{ background: '#f8fafc', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '12px 14px' }}>
                <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                  🔐 Secure Manual Onboarding Flow
                </div>
                <p style={{ margin: 0, fontSize: '0.6875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  A one-time temporary password will be generated for you to hand off to the employee. No email will be sent. They will be required to set their private password upon first login.
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-6)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-subtle)' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleClose}
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
        )}
      </div>
    </div>
  );
};
