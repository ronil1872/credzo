import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks';
import { Profile } from '../../../types';
import '../crm.css';

interface DeleteTeamMemberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  targetProfile: Profile | null;
  assignedLeadsCount?: number;
  onUserDeleted: (deletedUserId: string) => void;
}

export const DeleteTeamMemberDialog: React.FC<DeleteTeamMemberDialogProps> = ({
  isOpen,
  onClose,
  targetProfile,
  assignedLeadsCount = 0,
  onUserDeleted,
}) => {
  const { user } = useAuth();
  const [confirmInput, setConfirmInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setConfirmInput('');
    setErrorMsg(null);
    setLoading(false);
  }, [isOpen, targetProfile]);

  if (!isOpen || !targetProfile) return null;

  const isOwner = targetProfile.role === 'OWNER';
  const isSelf = user?.id === targetProfile.id;
  const isDeleteConfirmed = confirmInput.trim() === 'DELETE';

  const handleDelete = async () => {
    if (!isDeleteConfirmed || isOwner) return;

    if (isSelf) {
      setErrorMsg('Security Restriction: You cannot delete your own account.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. Retrieve current active session token explicitly
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      // 2. Invoke secure Edge Function for server-side user deletion
      const { data, error } = await supabase.functions.invoke('admin-delete-user', {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        body: {
          target_user_id: targetProfile.id,
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
        console.error('[Credzo CRM] Delete user error:', displayError, error);
        setErrorMsg(displayError || 'Failed to delete team member.');
        setLoading(false);
        return;
      }

      if (data?.error) {
        setErrorMsg(data.error);
        setLoading(false);
        return;
      }

      if (data?.success) {
        onUserDeleted(targetProfile.id);
        onClose();
      } else {
        setErrorMsg('Unexpected server response. Please refresh the team list.');
      }
    } catch (err: unknown) {
      console.error('[Credzo CRM] Unexpected exception deleting user:', err);
      setErrorMsg('An unexpected network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="crm-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="crm-modal-window" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="crm-modal-header" style={{ borderBottom: '1px solid #fee2e2' }}>
          <div className="crm-modal-header-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span className="status-badge LOST" style={{ background: '#fee2e2', color: '#dc2626' }}>
                PERMANENT DELETION
              </span>
              <span className="lead-ref-pill">#{targetProfile.id.slice(0, 8).toUpperCase()}</span>
            </div>
            <h2 className="crm-modal-title" style={{ color: '#991b1b' }}>
              Delete Team Member
            </h2>
            <p className="crm-modal-subtitle">
              Permanently remove {targetProfile.full_name} ({targetProfile.role})
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

        {/* Body */}
        <div style={{ padding: 'var(--space-4) var(--space-5)' }}>
          {isOwner ? (
            <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', padding: '14px 16px', borderRadius: 'var(--radius-md)', color: '#92400e', fontSize: 'var(--font-size-sm)' }}>
              <strong>Protected Account:</strong> This staff member is an Organization Owner. Organization Owner accounts are protected from deletion to preserve administrative tenancy integrity.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {/* Deletion Warning Box */}
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', padding: '14px 16px' }}>
                <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 800, color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                  ⚠️ Critical Account Action
                </div>
                <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: '#7f1d1d', lineHeight: 1.5 }}>
                  This permanently removes this team member's login account. Their leads and customer records will <strong>not</strong> be deleted.
                </p>
              </div>

              {/* Distinction info box: Disable vs Delete */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                <div style={{ background: '#f8fafc', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '10px 12px' }}>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#047857', marginBottom: 2 }}>
                    ✓ Disable (Reversible)
                  </div>
                  <p style={{ margin: 0, fontSize: '0.6875rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    Blocks login immediately. Can be restored anytime with all permissions intact.
                  </p>
                </div>
                <div style={{ background: '#fff1f2', border: '1px solid #ffe4e6', borderRadius: 'var(--radius-md)', padding: '10px 12px' }}>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#be123c', marginBottom: 2 }}>
                    ✕ Delete (Permanent)
                  </div>
                  <p style={{ margin: 0, fontSize: '0.6875rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    Destroys authentication credentials irreversibly. Cannot be undone.
                  </p>
                </div>
              </div>

              {/* Impact on Assigned Leads */}
              <div style={{ background: '#f8fafc', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Assigned Customer Workload:
                  </span>
                  <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 800, color: 'var(--color-primary)' }}>
                    {assignedLeadsCount} Total Leads
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.6875rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  All {assignedLeadsCount} assigned leads will safely remain in the CRM and become <strong>Unassigned</strong> so you can reassign them to other team members.
                </p>
              </div>

              {/* Confirmation Input Field */}
              <div>
                <label className="info-label" htmlFor="delete-confirm-input" style={{ display: 'block', marginBottom: 4 }}>
                  To confirm deletion, please type <strong style={{ color: '#dc2626' }}>DELETE</strong> below:
                </label>
                <input
                  id="delete-confirm-input"
                  type="text"
                  className="value-input"
                  style={{ width: '100%', padding: '10px 12px', fontSize: 'var(--font-size-sm)', borderColor: isDeleteConfirmed ? '#dc2626' : undefined }}
                  placeholder="Type DELETE to enable deletion"
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  disabled={loading}
                  autoComplete="off"
                />
              </div>
            </div>
          )}

          {/* Footer Actions */}
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
                className="btn btn-danger btn-sm"
                onClick={handleDelete}
                disabled={!isDeleteConfirmed || loading}
              >
                {loading ? 'Deleting Account...' : 'Permanently Delete Member'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
