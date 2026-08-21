import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { InsuranceLead, LeadStatus } from '../../../types/database';
import '../crm.css';

interface InsuranceLeadDetailModalProps {
  leadId: string | null;
  onClose: () => void;
  onLeadUpdated?: (updatedLead: InsuranceLead) => void;
}

const ALL_STATUSES: LeadStatus[] = [
  'NEW',
  'CONTACTED',
  'INTERESTED',
  'LOST',
];

const formatDateTime = (iso?: string | null) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
};

const formatDate = (iso?: string | null) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
};

export const InsuranceLeadDetailModal: React.FC<InsuranceLeadDetailModalProps> = ({
  leadId,
  onClose,
  onLeadUpdated,
}) => {
  const [lead, setLead] = useState<InsuranceLead | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Edit fields
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus>('NEW');

  useEffect(() => {
    if (!leadId) {
      setLead(null);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setErrorMsg(null);

    const fetchLeadData = async () => {
      try {
        const { data, error } = await supabase
          .from('insurance_leads')
          .select('*')
          .eq('id', leadId)
          .maybeSingle();

        if (error) {
          console.error('[Credzo CRM] Error loading insurance lead detail:', error);
          if (isMounted) setErrorMsg('Failed to load insurance lead details.');
        } else if (isMounted && data) {
          const l = data as InsuranceLead;
          setLead(l);
          setSelectedStatus(l.status as LeadStatus);
        }
      } catch (err) {
        console.error('[Credzo CRM] Unexpected error loading insurance lead modal:', err);
        if (isMounted) setErrorMsg('Network error loading enquiry.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchLeadData();

    return () => {
      isMounted = false;
    };
  }, [leadId]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSaveStatus = async () => {
    if (!lead || !leadId) return;
    setSaving(true);
    setSaveMsg(null);
    setErrorMsg(null);

    try {
      const nowIso = new Date().toISOString();
      const { error } = await supabase
        .from('insurance_leads')
        .update({
          status: selectedStatus,
          updated_at: nowIso,
        })
        .eq('id', leadId);

      if (error) {
        console.error('[Credzo CRM] Error updating insurance lead status:', error);
        setErrorMsg('Failed to update status.');
      } else {
        const updated: InsuranceLead = {
          ...lead,
          status: selectedStatus,
          updated_at: nowIso,
        };
        setLead(updated);
        setSaveMsg('Status updated successfully.');
        if (onLeadUpdated) {
          onLeadUpdated(updated);
        }
      }
    } catch (err) {
      console.error('[Credzo CRM] Unexpected error during status update:', err);
      setErrorMsg('Network error while saving status.');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(null), 3000);
    }
  };

  if (!leadId) return null;

  return (
    <div className="crm-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="crm-modal-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="crm-modal-header">
          <div className="crm-modal-header-left">
            <h2 className="crm-modal-title">
              {loading ? 'Loading enquiry...' : lead?.full_name || 'Insurance Enquiry'}
            </h2>
            {lead && (
              <div className="crm-modal-meta">
                <span className="lead-ref-pill">#{lead.id.slice(0, 8).toUpperCase()}</span>
                <span className={`status-badge ${lead.status}`}>{lead.status}</span>
                <span className="lead-type-badge">{lead.insurance_type}</span>
              </div>
            )}
          </div>
          <button
            type="button"
            className="crm-modal-close-btn"
            onClick={onClose}
            aria-label="Close detail modal"
          >
            &times;
          </button>
        </div>

        {/* Modal Content */}
        <div className="crm-modal-body">
          {loading ? (
            <div style={{ padding: 'var(--space-8) 0', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="skeleton-row" style={{ height: 32 }} />
              <div className="skeleton-row" style={{ height: 80 }} />
              <div className="skeleton-row" style={{ height: 120 }} />
            </div>
          ) : !lead ? (
            <div className="empty-state">
              <p className="empty-state-title">Enquiry Not Found</p>
              <p className="empty-state-desc">The requested insurance enquiry could not be found or access is restricted.</p>
            </div>
          ) : (
            <>
              {/* Alert Messages */}
              {errorMsg && (
                <div className="form-alert-error" role="alert" style={{ marginBottom: 'var(--space-4)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                  </svg>
                  <span>{errorMsg}</span>
                </div>
              )}
              {saveMsg && (
                <div className="form-alert-success" role="status" style={{ marginBottom: 'var(--space-4)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>{saveMsg}</span>
                </div>
              )}

              {/* Status Update Card */}
              <div className="lead-stage-updater" style={{ marginBottom: 'var(--space-5)' }}>
                <span className="updater-label">Update Enquiry Status:</span>
                <div className="updater-actions">
                  <select
                    className="crm-select crm-select-sm"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as LeadStatus)}
                    disabled={saving}
                  >
                    {ALL_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleSaveStatus}
                    disabled={saving || selectedStatus === lead.status}
                  >
                    {saving ? 'Saving...' : 'Update Status'}
                  </button>
                </div>
              </div>

              {/* Applicant & Contact Info */}
              <div className="lead-modal-section">
                <h3 className="section-heading">Applicant & Contact Details</h3>
                <div className="crm-info-grid">
                  <div className="info-item">
                    <span className="info-label">Full Name</span>
                    <span className="info-value font-bold">{lead.full_name}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Mobile Number</span>
                    <a
                      href={`tel:+91${lead.mobile}`}
                      className="info-value info-link font-bold"
                    >
                      +91 {lead.mobile}
                    </a>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Email Address</span>
                    {lead.email ? (
                      <a href={`mailto:${lead.email}`} className="info-value info-link">
                        {lead.email}
                      </a>
                    ) : (
                      <span className="info-value text-muted">—</span>
                    )}
                  </div>
                  <div className="info-item">
                    <span className="info-label">City / Location</span>
                    <span className="info-value">{lead.city || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Insurance Requirement & Callback Schedule */}
              <div className="lead-modal-section">
                <h3 className="section-heading">Insurance & Callback Request</h3>
                <div className="crm-info-grid">
                  <div className="info-item">
                    <span className="info-label">Insurance Type</span>
                    <span className="info-value font-bold" style={{ color: 'var(--color-primary)' }}>
                      {lead.insurance_type}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Current Pipeline Status</span>
                    <span className="info-value">
                      <span className={`status-badge ${lead.status}`}>{lead.status}</span>
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Preferred Callback Date</span>
                    <span className="info-value">{formatDate(lead.preferred_callback_date)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Preferred Time Window</span>
                    <span className="info-value" style={{ textTransform: 'capitalize' }}>
                      {lead.preferred_callback_time || '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Customer Notes / Message */}
              <div className="lead-modal-section">
                <h3 className="section-heading">Customer Specific Requirement / Message</h3>
                <div
                  style={{
                    background: 'var(--bg-app)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-4)',
                    fontSize: 'var(--font-size-sm)',
                    lineHeight: 1.6,
                    color: lead.message ? 'var(--text-primary)' : 'var(--text-muted)',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {lead.message || 'No additional notes provided by customer.'}
                </div>
              </div>

              {/* Consent & Compliance */}
              <div className="lead-modal-section">
                <h3 className="section-heading">Consent & Compliance</h3>
                <div className="crm-info-grid">
                  <div className="info-item">
                    <span className="info-label">Voluntary Consent</span>
                    <span
                      className="info-value"
                      style={{
                        color: lead.consent ? 'var(--color-success)' : 'var(--color-danger)',
                        fontWeight: 700,
                      }}
                    >
                      {lead.consent ? '✓ Affirmative Consent Recorded' : '✗ No Consent'}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Consent Timestamp</span>
                    <span className="info-value">{formatDateTime(lead.consent_timestamp)}</span>
                  </div>
                </div>
              </div>

              {/* Marketing & Acquisition Attribution */}
              <div className="lead-modal-section">
                <h3 className="section-heading">Marketing & Acquisition Attribution</h3>
                <div className="crm-info-grid">
                  <div className="info-item">
                    <span className="info-label">Lead Source</span>
                    <span className="info-value">{lead.lead_source || 'website'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Campaign</span>
                    <span className="info-value">{lead.campaign || '—'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Ad Name</span>
                    <span className="info-value">{lead.ad || '—'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">UTM Source</span>
                    <span className="info-value">{lead.utm_source || '—'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">UTM Medium</span>
                    <span className="info-value">{lead.utm_medium || '—'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">UTM Campaign</span>
                    <span className="info-value">{lead.utm_campaign || '—'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">UTM Content</span>
                    <span className="info-value">{lead.utm_content || '—'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">UTM Term</span>
                    <span className="info-value">{lead.utm_term || '—'}</span>
                  </div>
                </div>
              </div>

              {/* System Timestamps */}
              <div className="lead-modal-section" style={{ borderBottom: 'none' }}>
                <h3 className="section-heading">System Timestamps</h3>
                <div className="crm-info-grid">
                  <div className="info-item">
                    <span className="info-label">Received At</span>
                    <span className="info-value">{formatDateTime(lead.created_at)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Last Updated</span>
                    <span className="info-value">{formatDateTime(lead.updated_at)}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="crm-modal-footer">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
