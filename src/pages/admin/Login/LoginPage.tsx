import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../../hooks';
import { isSupabaseConfigured } from '../../../lib/supabase';
import './LoginPage.css';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, signInWithEmail } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Intended destination after login
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/admin';

  // If already authenticated, redirect immediately
  useEffect(() => {
    if (!loading && user) {
      navigate(from, { replace: true });
    }
  }, [user, loading, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

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
      const { error } = await signInWithEmail(email, password);

      if (error) {
        // Human-friendly error translation
        if (error.message.toLowerCase().includes('invalid login credentials')) {
          setErrorMsg('Invalid email or password. Please check your credentials.');
        } else if (error.message.toLowerCase().includes('email not confirmed')) {
          setErrorMsg('Email address has not been confirmed yet. Please verify your inbox.');
        } else {
          setErrorMsg(error.message);
        }
        setIsSubmitting(false);
        return;
      }

      // Successful login -> Redirect to destination
      navigate(from, { replace: true });
    } catch (err: unknown) {
      setErrorMsg('An unexpected error occurred. Please try again.');
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
          <h1 className="login-title">Staff Portal Login</h1>
          <p className="login-subtitle">
            Sign in to access loan applications, lead assignments, and customer follow-ups.
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
              <strong>Setup Notice:</strong> Supabase credentials are not yet configured in <code>.env</code>.
              Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to enable live staff authentication.
            </p>
          </div>
        )}

        {/* Error Alert */}
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

        {/* Login Form */}
        <form className="login-form" onSubmit={handleSubmit} noValidate>
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
            />
          </div>

          <div className="form-field-group">
            <div className="label-with-action">
              <label htmlFor="staff-password" className="field-label">
                Password
              </label>
            </div>
            <div className="password-input-wrapper">
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

          <button
            type="submit"
            className="btn btn-primary btn-lg btn-full-width"
            id="login-submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Verifying Credentials...' : 'Sign In to CRM →'}
          </button>
        </form>

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
