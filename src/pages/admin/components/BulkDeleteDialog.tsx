import React, { useState, useEffect } from 'react';

interface BulkDeleteDialogProps {
  isOpen: boolean;
  selectedCount: number;
  leadCategory?: string; // 'loan' | 'insurance'
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const BulkDeleteDialog: React.FC<BulkDeleteDialogProps> = ({
  isOpen,
  selectedCount,
  leadCategory = 'loan',
  isDeleting,
  onConfirm,
  onCancel,
}) => {
  const [confirmText, setConfirmText] = useState('');

  // Reset confirmation text whenever dialog opens
  useEffect(() => {
    if (isOpen) {
      setConfirmText('');
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDeleting, onCancel]);

  if (!isOpen) return null;

  const isConfirmed = confirmText === 'DELETE';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isConfirmed && !isDeleting) {
      onConfirm();
    }
  };

  return (
    <div
      className="delete-dialog-backdrop"
      onClick={() => {
        if (!isDeleting) onCancel();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-delete-dialog-title"
    >
      <div
        className="delete-dialog-window"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="delete-dialog-header">
          <div className="delete-dialog-icon" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </div>
          <h3 id="bulk-delete-dialog-title" className="delete-dialog-title">
            Delete {selectedCount} {leadCategory === 'insurance' ? 'Insurance' : 'Loan'} Leads Permanently?
          </h3>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
          <div className="delete-dialog-body">
            <p style={{ margin: 0 }}>
              Are you sure you want to permanently delete <strong>{selectedCount}</strong> selected {leadCategory} enquiries?
            </p>

            <div className="delete-dialog-warning-note">
              ⚠️ <strong>Warning:</strong> This will permanently delete {selectedCount} selected leads and their associated internal notes and scheduled follow-ups. This action cannot be undone.
            </div>

            {/* Type DELETE confirmation prompt */}
            <div style={{ marginTop: 'var(--space-2)', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              <label
                htmlFor="bulk-delete-confirmation-input"
                style={{
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                }}
              >
                To confirm permanent deletion, please type <strong style={{ color: '#dc2626', letterSpacing: '0.05em' }}>DELETE</strong> below:
              </label>
              <input
                id="bulk-delete-confirmation-input"
                type="text"
                className="value-input"
                style={{
                  border: isConfirmed ? '1px solid #dc2626' : '1px solid var(--border-subtle)',
                  background: isConfirmed ? '#fef2f2' : 'var(--bg-app)',
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                  fontSize: '1rem',
                  padding: 'var(--space-3)',
                }}
                placeholder="Type DELETE"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                disabled={isDeleting}
                autoFocus
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="delete-dialog-footer">
            <button
              type="button"
              className="btn btn-outline"
              onClick={onCancel}
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-danger"
              disabled={!isConfirmed || isDeleting}
            >
              {isDeleting ? (
                <>
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    style={{ animation: 'spin 0.8s linear infinite' }}
                  >
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.19" />
                  </svg>
                  <span>Deleting ({selectedCount})...</span>
                </>
              ) : (
                `Delete Permanently (${selectedCount})`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
