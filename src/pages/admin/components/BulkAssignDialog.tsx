import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Profile } from '../../../types/database';

interface BulkAssignDialogProps {
  isOpen: boolean;
  selectedCount: number;
  isAssigning: boolean;
  onConfirm: (staffId: string, staffName: string) => void;
  onCancel: () => void;
}

export const BulkAssignDialog: React.FC<BulkAssignDialogProps> = ({
  isOpen,
  selectedCount,
  isAssigning,
  onConfirm,
  onCancel,
}) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoadingProfiles(true);
    setLoadError(null);

    const fetchStaff = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('full_name', { ascending: true });

        if (isMounted) {
          if (error) {
            console.error('[Credzo CRM] Error loading profiles:', error);
            setLoadError('Could not load staff list.');
          } else if (data && data.length > 0) {
            setProfiles(data as Profile[]);
            setSelectedStaffId(data[0].id);
          }
        }
      } catch (err) {
        console.error('[Credzo CRM] Unexpected error loading profiles:', err);
        if (isMounted) setLoadError('Failed to fetch team members.');
      } finally {
        if (isMounted) setLoadingProfiles(false);
      }
    };

    fetchStaff();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const staff = profiles.find((p) => p.id === selectedStaffId);
    if (staff && !isAssigning) {
      onConfirm(staff.id, staff.full_name);
    }
  };

  return (
    <div
      className="delete-dialog-backdrop"
      onClick={() => {
        if (!isAssigning) onCancel();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-assign-dialog-title"
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
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <h3
            id="bulk-assign-dialog-title"
            className="delete-dialog-title"
            style={{ color: 'var(--text-primary)' }}
          >
            Assign {selectedCount} Leads to Staff
          </h3>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
          <div className="delete-dialog-body">
            <p style={{ margin: 0 }}>
              Select a team member to assign <strong>{selectedCount}</strong> selected lead records to:
            </p>

            {loadingProfiles ? (
              <div style={{ padding: 'var(--space-3) 0', color: 'var(--text-muted)' }}>
                Loading team members...
              </div>
            ) : loadError ? (
              <div className="form-alert-error">
                <span>{loadError}</span>
              </div>
            ) : profiles.length === 0 ? (
              <div style={{ padding: 'var(--space-2) 0', color: 'var(--text-muted)' }}>
                No active staff profiles found in your organization.
              </div>
            ) : (
              <div style={{ marginTop: 'var(--space-2)', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                <label
                  htmlFor="bulk-staff-select"
                  style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--text-primary)' }}
                >
                  Assign To Staff Member:
                </label>
                <select
                  id="bulk-staff-select"
                  className="filter-select"
                  style={{ width: '100%', padding: 'var(--space-3)', fontSize: '0.9375rem' }}
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  disabled={isAssigning}
                  autoFocus
                >
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name} ({p.role})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="delete-dialog-footer">
            <button
              type="button"
              className="btn btn-outline"
              onClick={onCancel}
              disabled={isAssigning}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isAssigning || loadingProfiles || !selectedStaffId}
            >
              {isAssigning ? (
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
                  <span>Assigning ({selectedCount})...</span>
                </>
              ) : (
                `Assign ${selectedCount} Leads`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
