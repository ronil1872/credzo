import React, { useState } from 'react';
import { LeadStatus } from '../../../types/database';

interface BulkStatusDialogProps {
  isOpen: boolean;
  selectedCount: number;
  availableStatuses: LeadStatus[];
  isUpdating: boolean;
  onConfirm: (newStatus: LeadStatus) => void;
  onCancel: () => void;
}

export const BulkStatusDialog: React.FC<BulkStatusDialogProps> = ({
  isOpen,
  selectedCount,
  availableStatuses,
  isUpdating,
  onConfirm,
  onCancel,
}) => {
  const [targetStatus, setTargetStatus] = useState<LeadStatus>(
    availableStatuses[0] || 'CONTACTED'
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isUpdating) {
      onConfirm(targetStatus);
    }
  };

  return (
    <div
      className="delete-dialog-backdrop"
      onClick={() => {
        if (!isUpdating) onCancel();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-status-dialog-title"
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
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </div>
          <h3
            id="bulk-status-dialog-title"
            className="delete-dialog-title"
            style={{ color: 'var(--text-primary)' }}
          >
            Change Status for {selectedCount} Leads
          </h3>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
          <div className="delete-dialog-body">
            <p style={{ margin: 0 }}>
              Select a new pipeline status to apply to all <strong>{selectedCount}</strong> selected records:
            </p>

            <div style={{ marginTop: 'var(--space-2)', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              <label
                htmlFor="bulk-status-select"
                style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--text-primary)' }}
              >
                New Lead Status:
              </label>
              <select
                id="bulk-status-select"
                className="filter-select"
                style={{ width: '100%', padding: 'var(--space-3)', fontSize: '0.9375rem' }}
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value as LeadStatus)}
                disabled={isUpdating}
                autoFocus
              >
                {availableStatuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="delete-dialog-footer">
            <button
              type="button"
              className="btn btn-outline"
              onClick={onCancel}
              disabled={isUpdating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isUpdating}
            >
              {isUpdating ? (
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
                  <span>Updating ({selectedCount})...</span>
                </>
              ) : (
                `Update ${selectedCount} Leads`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
