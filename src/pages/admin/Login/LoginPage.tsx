import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../../hooks';
import { isSupabaseConfigured } from '../../../lib/supabase';
import './LoginPage.css';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, signInWithEmail, resetPasswordForEmail } = useAuth();

  // Mode: 'login' or 'forgot-password'
  const [mode, setMode] = useState<'login' | 'forgot-password'>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState<number | null>(null);

  // Intended destination after login
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/admin';

  // If already authenticated, redirect immediately
  useEffect(() => {
    if (!loading && user) {
      navigate(from, { replace: true });
    }
  }, [user, loading, navigate, from]);

  // Live countdown timer for lockout
  useEffect(() => {
    if (lockoutSeconds === null || lockoutSeconds <= 0) return;

    const timer = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };


  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds !== null && lockoutSeconds > 0) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim()) {
      setErrorMsg('Please enter your staff email address.');
      return;
    }

    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await signInWithEmail(email, password);

      if (res.isLocked) {
        const secs = res.remainingSeconds || 900;
        setLockoutSeconds(secs);
        setErrorMsg(`Too many failed login attempts. Please try again in ${formatCountdown(secs)}.`);
        setIsSubmitting(false);
        return;
      }

      if (res.error) {
        setLockoutSeconds(null);
        const remaining =
          res.remainingAttempts !== undefined
            ? res.remainingAttempts
            : res.failedAttempts
            ? Math.max(0, 5 - res.failedAttempts)
            : undefined;

        if (remaining !== undefined && remaining > 0 && remaining < 5) {
          setErrorMsg(
            `Invalid email or password. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
          );
        } else if (
          res.error.message.toLowerCase().includes('invalid login credentials') ||
          res.error.message.toLowerCase().includes('invalid grant') ||
          res.error.message.toLowerCase().includes('invalid_grant')
        ) {
          setErrorMsg('Invalid email or password. Please check your credentials.');
        } else if (
          res.error.message.toLowerCase().includes('rate limit') ||
          res.error.message.toLowerCase().includes('too many')
        ) {
          setErrorMsg('Too many failed attempts. Please wait a few minutes before trying again.');
        } else {
          setErrorMsg(res.error.message);
        }
        setIsSubmitting(false);
        return;
      }

      // Successful login -> Redirect to destination
      navigate(from, { replace: true });
    } catch {
      setErrorMsg('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim()) {
      setErrorMsg('Please enter your registered staff email address.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await resetPasswordForEmail(email);

      if (error) {
        if (error.message.toLowerCase().includes('rate limit') || error.message.toLowerCase().includes('too many')) {
          setErrorMsg('Too many reset requests. Please wait a few minutes before trying again.');
        } else {
          // Always show generic success even on error to prevent account discovery
          setSuccessMsg(
            'If an account exists for this email, password reset instructions have been sent. Please check your inbox and spam folder.'
          );
        }
      } else {
        setSuccessMsg(
          'Password reset instructions have been sent to your email. Please check your inbox and spam folder.'
        );
      }
    } catch {
      setSuccessMsg(
        'If an account exists for this email, password reset instructions have been sent. Please check your inbox.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLocked = lockoutSeconds !== null && lockoutSeconds > 0;

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
          <h1 className="login-title">
            {mode === 'login' ? 'Staff Portal Login' : 'Reset Staff Password'}
          </h1>
          <p className="login-subtitle">
            {mode === 'login'
              ? 'Sign in to access loan applications, lead assignments, and customer follow-ups.'
              : 'Enter your registered email address to receive a secure password recovery link.'}
          </p>
        </div>

        {/* Unconfigured Notice */}
        {!isSupabaseConfigured() && (
          <div className="login-notice-banner" role="status">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <p>
              <strong>Setup Notice:</strong> Supabase credentials are not yet configured in environment variables.
              Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> to enable live staff authentication.
            </p>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="login-alert-success" role="alert" style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            padding: '1rem',
            borderRadius: '8px',
            backgroundColor: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#065f46',
            fontSize: '0.875rem',
            lineHeight: 1.5,
            marginBottom: '1.25rem'
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '1.25rem', height: '1.25rem', flexShrink: 0, marginTop: '2px' }}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Lockout / Error Alert */}
        {isLocked ? (
          <div className="login-alert-error" role="alert" style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            padding: '1rem',
            borderRadius: '8px',
            backgroundColor: '#fff1f2',
            border: '1px solid #fecdd3',
            color: '#9f1239',
            fontSize: '0.875rem',
            lineHeight: 1.5,
            marginBottom: '1.25rem'
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '1.25rem', height: '1.25rem', flexShrink: 0, marginTop: '2px' }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div>
              <div style={{ fontWeight: 600 }}>Too many failed login attempts.</div>
              <div style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                Please try again in <strong>{formatCountdown(lockoutSeconds)}</strong>.
              </div>
            </div>
          </div>
        ) : errorMsg ? (
          <div className="login-alert-error" role="alert">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{errorMsg}</span>
          </div>
        ) : null}

        {/* 1. Login Mode */}
        {mode === 'login' ? (
          <form className="login-form" onSubmit={handleLoginSubmit} noValidate>
            <div className="form-field-group">
              <label htmlFor="staff-email" className="field-label">
                Staff Email Address
              </label>
              <input
                id="staff-email"
                type="email"
                className="text-input"
                placeholder="advisor@credzofinance.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                autoComplete="username"
                autoFocus
                required
                disabled={isLocked}
              />
            </div>

            <div className="form-field-group">
              <div className="label-with-action" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="staff-password" className="field-label" style={{ marginBottom: 0 }}>
                  Password
                </label>
                <button
                  type="button"
                  className="forgot-password-link"
                  onClick={() => {
                    setMode('forgot-password');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#2563eb',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    padding: 0,
                    textDecoration: 'underline'
                  }}
                >
                  Forgot Password?
                </button>
              </div>
              <div className="password-input-wrapper" style={{ marginTop: '0.375rem' }}>
                <input
                  id="staff-password"
                  type={showPassword ? 'text' : 'password'}
                  className="text-input password-input"
                  placeholder="Enter your secure password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  autoComplete="current-password"
                  required
                  disabled={isLocked}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  disabled={isLocked}
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

            <button
              type="submit"
              className="btn btn-primary btn-lg btn-full-width"
              id="login-submit-btn"
              disabled={isSubmitting || isLocked}
            >
              {isSubmitting
                ? 'Verifying Credentials...'
                : isLocked
                ? `Temporarily Locked (${formatCountdown(lockoutSeconds)})`
                : 'Sign In to CRM →'}
            </button>
          </form>
        ) : (
          /* 2. Forgot Password Mode */
          <form className="login-form" onSubmit={handleForgotSubmit} noValidate>
            <div className="form-field-group">
              <label htmlFor="reset-email" className="field-label">
                Staff Email Address
              </label>
              <input
                id="reset-email"
                type="email"
                className="text-input"
                placeholder="advisor@credzofinance.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                autoComplete="email"
                autoFocus
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg btn-full-width"
              id="reset-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending Recovery Link...' : 'Send Password Reset Link →'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <button
                type="button"
                className="back-to-login-btn"
                onClick={() => {
                  setMode('login');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#4b5563',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  padding: '0.5rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.375rem'
                }}
              >
                &larr; Back to Login
              </button>
            </div>
          </form>
        )}

        {/* Security Disclaimers */}
        <div className="login-card-footer">
          <div className="security-notice">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>Authorized staff access only. All system sessions are monitored and logged.</span>
          </div>

          <div className="back-link-wrapper">
            <Link to="/" className="back-to-site-link">
              &larr; Back to Public Website
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

