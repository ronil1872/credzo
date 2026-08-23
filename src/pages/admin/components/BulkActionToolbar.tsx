import React from 'react';

interface BulkActionToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onOpenBulkStatus: () => void;
  onOpenBulkAssign: () => void;
  onOpenBulkFollowUp: () => void;
  onOpenBulkDelete: () => void;
  canDelete: boolean;
}

export const BulkActionToolbar: React.FC<BulkActionToolbarProps> = ({
  selectedCount,
  onClearSelection,
  onOpenBulkStatus,
  onOpenBulkAssign,
  onOpenBulkFollowUp,
  onOpenBulkDelete,
  canDelete,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="bulk-toolbar-wrapper" role="region" aria-label="Bulk actions toolbar">
      <div className="bulk-toolbar">
        {/* Left: Count Badge & Clear Selection */}
        <div className="bulk-toolbar-left">
          <span className="bulk-selection-pill">
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {selectedCount} selected
          </span>
          <button
            type="button"
            className="btn btn-outline btn-xs"
            onClick={onClearSelection}
            title="Deselect all records"
          >
            Clear Selection
          </button>
        </div>

        {/* Right: Actions */}
        <div className="bulk-toolbar-actions">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={onOpenBulkStatus}
          >
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Change Status
          </button>

          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={onOpenBulkAssign}
          >
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Assign Staff
          </button>

          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={onOpenBulkFollowUp}
          >
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Schedule Callback
          </button>

          {canDelete && (
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={onOpenBulkDelete}
              title="Permanently delete all selected records (Admin/Owner only)"
            >
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
              Delete ({selectedCount})
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
