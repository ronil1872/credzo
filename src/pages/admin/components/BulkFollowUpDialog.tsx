import React, { useState, useEffect } from 'react';

interface BulkFollowUpDialogProps {
  isOpen: boolean;
  selectedCount: number;
  isScheduling: boolean;
  onConfirm: (scheduledAt: string, note: string) => void;
  onCancel: () => void;
}

export const BulkFollowUpDialog: React.FC<BulkFollowUpDialogProps> = ({
  isOpen,
  selectedCount,
  isScheduling,
  onConfirm,
  onCancel,
}) => {
  const [scheduledDate, setScheduledDate] = useState('');
  const [note, setNote] = useState('');

  // Default to tomorrow 10:00 AM when opened
  useEffect(() => {
    if (isOpen) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      const iso = tomorrow.toISOString().slice(0, 16);
      setScheduledDate(iso);
      setNote('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (scheduledDate && !isScheduling) {
      onConfirm(new Date(scheduledDate).toISOString(), note.trim());
    }
  };

  return (
    <div
      className="delete-dialog-backdrop"
      onClick={() => {
        if (!isScheduling) onCancel();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-followup-dialog-title"
    >
      <div
        className="delete-dialog-window"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="delete-dialog-header"
          style={{ background: '#f8fafc', borderColor: 'var(--border-subtle)' }}
        >
          <div
            className="delete-dialog-icon"
            style={{ background: '#e0e7ff', color: 'var(--color-primary)' }}
            aria-hidden="true"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <h3
            id="bulk-followup-dialog-title"
            className="delete-dialog-title"
            style={{ color: 'var(--text-primary)' }}
          >
            Schedule Callback for {selectedCount} Leads
          </h3>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
          <div className="delete-dialog-body">
            <p style={{ margin: 0 }}>
              Create a scheduled follow-up reminder for all <strong>{selectedCount}</strong> selected leads:
            </p>

            <div style={{ marginTop: 'var(--space-2)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                <label
                  htmlFor="bulk-fu-date"
                  style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--text-primary)' }}
                >
                  Callback Date & Time:
                </label>
                <input
                  id="bulk-fu-date"
                  type="datetime-local"
                  className="value-input"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  required
                  disabled={isScheduling}
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                <label
                  htmlFor="bulk-fu-note"
                  style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--text-primary)' }}
                >
                  Task Note (Optional):
                </label>
                <textarea
                  id="bulk-fu-note"
                  className="note-textarea"
                  style={{ minHeight: 60 }}
                  placeholder="e.g. Follow up on documents or rate query..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  disabled={isScheduling}
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="delete-dialog-footer">
            <button
              type="button"
              className="btn btn-outline"
              onClick={onCancel}
              disabled={isScheduling}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isScheduling || !scheduledDate}
            >
              {isScheduling ? (
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
                  <span>Scheduling ({selectedCount})...</span>
                </>
              ) : (
                `Schedule ${selectedCount} Callbacks`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
