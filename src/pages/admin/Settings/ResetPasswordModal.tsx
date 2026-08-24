import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Profile } from '../../../types';
import '../crm.css';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetProfile: Profile | null;
  targetEmail?: string | null;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  isOpen,
  onClose,
  targetProfile,
  targetEmail,
}) => {
  const [emailInput, setEmailInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    if (targetEmail) {
      setEmailInput(targetEmail);
    } else {
      setEmailInput('');
    }
    setSentSuccess(false);
    setErrorMsg(null);
    setIsRateLimited(false);
    setLoading(false);
  }, [targetEmail, targetProfile, isOpen]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldownSeconds <= 0) {
      if (isRateLimited) setIsRateLimited(false);
      return;
    }

    const timer = setTimeout(() => {
      setCooldownSeconds((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [cooldownSeconds, isRateLimited]);

  if (!isOpen || !targetProfile) return null;

  const handleSendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || cooldownSeconds > 0) return;

    setErrorMsg(null);
    setIsRateLimited(false);

    const emailToSend = (emailInput || targetEmail || '').trim().toLowerCase();
    if (!emailToSend || !emailToSend.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/admin/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(emailToSend, {
        redirectTo: redirectUrl,
      });

      if (error) {
        console.warn('[Credzo CRM] Reset password response:', error.message, error.status);

        // Detect Supabase Email Rate Limit (Status 429 or over_email_send_rate_limit)
        const isRateLimitError =
          error.status === 429 ||
          (error as any).code === 'over_email_send_rate_limit' ||
          error.message?.toLowerCase().includes('rate limit') ||
          error.message?.toLowerCase().includes('too many requests') ||
          error.message?.toLowerCase().includes('over_email_send_rate_limit');

        if (isRateLimitError) {
          setIsRateLimited(true);
          setErrorMsg('Password reset email limit reached. Please wait before sending another reset email.');
          setCooldownSeconds(60); // 60-second cooldown
        } else {
          setErrorMsg(error.message || 'Failed to dispatch password reset request.');
        }
      } else {
        setSentSuccess(true);
      }
    } catch (err: unknown) {
      console.error('[Credzo CRM] Reset password exception:', err);
      setErrorMsg('An unexpected network error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="crm-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="crm-modal-window" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
        <div className="crm-modal-header">
          <div className="crm-modal-header-info">
            <h2 className="crm-modal-title">Reset Password</h2>
            <p className="crm-modal-subtitle">
              Send a secure password reset link to {targetProfile.full_name}.
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
            <div>
              <span>{errorMsg}</span>
              {isRateLimited && (
                <div style={{ fontSize: '0.6875rem', marginTop: 4, opacity: 0.9 }}>
                  Supabase security enforces a rate limit between email dispatches to prevent spam. Please wait {cooldownSeconds > 0 ? `${cooldownSeconds}s` : 'a moment'} before retrying.
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ padding: 'var(--space-4) var(--space-5)' }}>
          {sentSuccess ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '14px 16px', borderRadius: 'var(--radius-lg)', color: '#166534' }}>
                <div style={{ fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>✓</span> Password Reset Link Sent
                </div>
                <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', lineHeight: 1.5 }}>
                  A secure one-time password recovery link has been dispatched to <strong>{emailInput || targetEmail}</strong>. The recipient can set their private password at <strong>/admin/reset-password</strong>.
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-4)' }}>
                <button type="button" className="btn btn-primary btn-sm" onClick={onClose}>
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSendReset}>
              <p style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Enter the verified email address for <strong>{targetProfile.full_name}</strong> to dispatch an official password reset authorization email.
              </p>

              <div>
                <label className="info-label" htmlFor="reset-email-input" style={{ display: 'block', marginBottom: 4 }}>
                  Destination Email Address
                </label>
                <input
                  id="reset-email-input"
                  type="email"
                  className="value-input"
                  style={{ width: '100%', padding: '10px 12px', fontSize: 'var(--font-size-sm)' }}
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="name@credzofinance.com"
                  required
                  disabled={loading || cooldownSeconds > 0}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-6)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-subtle)' }}>
                <button type="button" className="btn btn-outline btn-sm" onClick={onClose} disabled={loading}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={loading || cooldownSeconds > 0 || !emailInput.trim()}
                >
                  {loading
                    ? 'Sending Link...'
                    : cooldownSeconds > 0
                    ? `Please wait (${cooldownSeconds}s)`
                    : 'Send Reset Link'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
