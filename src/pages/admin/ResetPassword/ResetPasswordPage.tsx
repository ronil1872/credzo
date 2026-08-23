import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../hooks';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import '../Login/LoginPage.css';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { updateUserPassword } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionChecking, setSessionChecking] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setSessionChecking(false);
      return;
    }

    // Check if recovery session is established via Supabase URL hash / session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setHasValidSession(true);
        } else {
          // Listen for recovery event
          const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY' || session) {
              setHasValidSession(true);
            }
          });
          return () => subscription.unsubscribe();
        }
      } catch (err) {
        console.warn('[Credzo Finance] Recovery session check error:', err);
      } finally {
        setSessionChecking(false);
      }
    };

    checkSession();
  }, []);

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
      const { error } = await updateUserPassword(password);

      if (error) {
        setErrorMsg(error.message || 'Failed to update password. Please try again.');
        setIsSubmitting(false);
        return;
      }

      setSuccess(true);
    } catch {
      setErrorMsg('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-card">
        {/* Brand Header */}
        <div className="login-card-header">
          <div className="login-brand-logo">
            <span className="brand-logo-main">Credzo</span>
            <span className="brand-logo-sub">Finance</span>
            <span className="login-crm-tag">CRM</span>
          </div>
          <h1 className="login-title">Set New Password</h1>
          <p className="login-subtitle">
            Create a secure password for your Credzo Finance staff account.
          </p>
        </div>

        {sessionChecking ? (
          <div style={{ textAlign: 'center', padding: '2rem 0', color: '#6b7280' }}>
            Verifying recovery session...
          </div>
        ) : success ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div
              style={{
                width: '3.5rem',
                height: '3.5rem',
                borderRadius: '50%',
                backgroundColor: '#d1fae5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '2rem', height: '2rem' }}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', marginBottom: '0.5rem' }}>
              Password Updated Successfully
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#4b5563', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Your password has been reset securely. You can now log in to the staff portal with your new credentials.
            </p>
            <button
              type="button"
              className="btn btn-primary btn-lg btn-full-width"
              onClick={() => navigate('/admin/login')}
            >
              Sign In to CRM →
            </button>
          </div>
        ) : !hasValidSession ? (
          <div style={{ padding: '1rem 0' }}>
            <div className="login-alert-error" role="alert" style={{ marginBottom: '1.25rem' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>This password recovery link is expired or invalid. Please request a new link.</span>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-lg btn-full-width"
              onClick={() => navigate('/admin/login')}
            >
              Back to Staff Login
            </button>
          </div>
        ) : (
          <form className="login-form" onSubmit={handleSubmit} noValidate>
            {errorMsg && (
              <div className="login-alert-error" role="alert">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="form-field-group">
              <label htmlFor="new-password" className="field-label">
                New Password (minimum 8 characters)
              </label>
              <div className="password-input-wrapper">
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  className="text-input password-input"
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  autoComplete="new-password"
                  required
                  autoFocus
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
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
            </div>

            <div className="form-field-group">
              <label htmlFor="confirm-password" className="field-label">
                Confirm New Password
              </label>
              <input
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                className="text-input"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                autoComplete="new-password"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg btn-full-width"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating Password...' : 'Save New Password & Log In →'}
            </button>
          </form>
        )}

        {/* Footer */}
        <div className="login-card-footer">
          <div className="back-link-wrapper">
            <Link to="/admin/login" className="back-to-site-link">
              &larr; Back to Staff Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
