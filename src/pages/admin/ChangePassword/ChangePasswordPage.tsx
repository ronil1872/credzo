import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../hooks';
import { supabase } from '../../../lib/supabase';
import './ChangePasswordPage.css';

export const ChangePasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, loading, refreshProfile } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // 1. If not logged in, redirect to Login
    if (!loading && !user) {
      navigate('/admin/login', { replace: true });
      return;
    }

    // 2. If already completed password change, redirect to CRM Dashboard
    if (!loading && profile && profile.must_change_password === false) {
      navigate('/admin', { replace: true });
    }
  }, [user, profile, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!password) {
      setErrorMsg('Please enter a new password.');
      return;
    }

    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Update permanent password in Supabase Auth GoTrue
      const { error: authError } = await supabase.auth.updateUser({
        password: password,
      });

      if (authError) {
        setErrorMsg(authError.message || 'Failed to update password. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // 2. Explicitly mark must_change_password = false in profiles table
      if (user?.id) {
        const { error: profileUpdateError } = await supabase
          .from('profiles')
          .update({
            must_change_password: false,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        if (profileUpdateError) {
          console.warn('[Credzo Security] Direct profile update notice:', profileUpdateError.message);
        }
      }

      // 3. Sync user metadata for GoTrue session cache
      await supabase.auth.updateUser({
        data: { must_change_password: false },
      }).catch(() => {});

      // 4. Refresh user profile in React Auth Context
      await refreshProfile();

      setSuccess(true);

      // 5. Redirect to CRM Dashboard after brief confirmation
      setTimeout(() => {
        navigate('/admin', { replace: true });
      }, 1200);
    } catch (err: unknown) {
      console.error('[Credzo Security] Password change exception:', err);
      setErrorMsg('An unexpected network error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="change-password-container" role="main" aria-label="First-Time Password Setup">
        <div className="change-password-card" style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-secondary)' }}>
          <div
            style={{
              width: 36,
              height: 36,
              border: '3px solid var(--border-subtle)',
              borderTopColor: 'var(--color-primary)',
              borderRadius: '50%',
              margin: '0 auto 1rem',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>
            Verifying security state...
          </span>
        </div>
      </main>
    );
  }

  return (
    <main className="change-password-container" role="main" aria-label="First-Time Password Setup">
      <div className="change-password-card">
        {/* Brand Header */}
        <div className="change-password-header">
          <Link to="/" className="change-password-brand" aria-label="Credzo Finance Home">
            <img
              src="/images/credzo-finance-logo.png"
              alt="Credzo Finance"
              className="change-password-brand-logo-img"
              width="180"
              height="42"
            />
            <span className="crm-pill">CRM</span>
          </Link>
          <h1 className="change-password-title">First-Time Password Setup</h1>
          <p className="change-password-subtitle">
            Please create your new password before continuing.
          </p>
        </div>

        {/* Security Requirement Notice */}
        <div className="security-notice-box" role="note" aria-label="Security requirement">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <div className="security-notice-content">
            <div className="security-notice-heading">Account Security Requirement</div>
            <p className="security-notice-desc">
              Your account was provisioned with a temporary password. For your privacy and data security, please establish your permanent personal password to access the CRM.
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              backgroundColor: 'var(--color-danger-light)',
              color: 'var(--color-danger)',
              border: '1px solid rgba(220, 38, 38, 0.2)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 500,
            }}
            role="alert"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18, flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success State */}
        {success ? (
          <div className="success-view-card">
            <div className="success-icon-badge" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="success-view-title">Password Created Successfully</h2>
            <p className="success-view-desc">
              Your permanent password has been saved. Redirecting you to the CRM dashboard...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="change-password-form" noValidate>
            {/* New Password */}
            <div className="change-password-group">
              <label className="change-password-label" htmlFor="new-password">
                <span>New Permanent Password <span style={{ color: '#dc2626' }}>*</span></span>
              </label>
              <div className="password-input-wrapper">
                <input
                  id="new-password"
                  name="new-password"
                  type={showPassword ? 'text' : 'password'}
                  className="password-input-field"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter at least 8 characters"
                  required
                  disabled={isSubmitting}
                  minLength={8}
                  autoComplete="new-password"
                  aria-describedby="new-password-hint"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide new password' : 'Show new password'}
                  tabIndex={0}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              <div id="new-password-hint" className="password-requirement-hint">
                <span>• Minimum 8 characters</span>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="change-password-group">
              <label className="change-password-label" htmlFor="confirm-password">
                <span>Confirm Permanent Password <span style={{ color: '#dc2626' }}>*</span></span>
              </label>
              <div className="password-input-wrapper">
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="password-input-field"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  required
                  disabled={isSubmitting}
                  minLength={8}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  tabIndex={0}
                >
                  {showConfirmPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit CTA */}
            <button
              type="submit"
              className="btn btn-primary change-password-submit-btn"
              disabled={isSubmitting || !password || !confirmPassword}
            >
              {isSubmitting ? (
                <>
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      border: '2px solid rgba(255,255,255,0.4)',
                      borderTopColor: '#ffffff',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                    }}
                  />
                  <span>Saving Password...</span>
                </>
              ) : (
                <span>Save &amp; Continue to CRM &rarr;</span>
              )}
            </button>
          </form>
        )}
      </div>
    </main>
  );
};
