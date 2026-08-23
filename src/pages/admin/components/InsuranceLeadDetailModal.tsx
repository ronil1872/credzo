import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks';
import { RelatedEnquiriesCard } from './RelatedEnquiriesCard';
import {
  InsuranceLead,
  InsuranceLeadNote,
  InsuranceFollowUp,
  LeadStatus,
  FollowUpStatus,
} from '../../../types/database';
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
  const { profile } = useAuth();

  const [lead, setLead] = useState<InsuranceLead | null>(null);
  const [notes, setNotes] = useState<InsuranceLeadNote[]>([]);
  const [followUps, setFollowUps] = useState<InsuranceFollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Edit fields
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus>('NEW');

  // Notes state
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // Follow-up state
  const [fuDate, setFuDate] = useState('');
  const [fuNote, setFuNote] = useState('');
  const [savingFu, setSavingFu] = useState(false);

  useEffect(() => {
    if (!leadId) {
      setLead(null);
      setNotes([]);
      setFollowUps([]);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setErrorMsg(null);

    const fetchLeadData = async () => {
      try {
        const [leadRes, notesRes, fuRes] = await Promise.all([
          supabase.from('insurance_leads').select('*').eq('id', leadId).maybeSingle(),
          supabase
            .from('insurance_lead_notes')
            .select('*')
            .eq('insurance_lead_id', leadId)
            .order('created_at', { ascending: false }),
          supabase
            .from('insurance_follow_ups')
            .select('*')
            .eq('insurance_lead_id', leadId)
            .order('scheduled_at', { ascending: true }),
        ]);

        if (leadRes.error) {
          console.error('[Credzo CRM] Error loading insurance lead detail:', leadRes.error);
          if (isMounted) setErrorMsg('Failed to load insurance lead details.');
        } else if (isMounted && leadRes.data) {
          const l = leadRes.data as InsuranceLead;
          setLead(l);
          setSelectedStatus(l.status as LeadStatus);
        }

        if (isMounted) {
          setNotes((notesRes.data as InsuranceLeadNote[]) || []);
          setFollowUps((fuRes.data as InsuranceFollowUp[]) || []);
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

  // 3. Status Update Handler
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

  // 5. Add Note Handler
  const handleAddNote = async () => {
    if (!newNote.trim() || !leadId || !lead) return;
    setSavingNote(true);

    try {
      const { data, error } = await supabase
        .from('insurance_lead_notes')
        .insert({
          insurance_lead_id: leadId,
          organization_id: lead.organization_id,
          author_id: profile?.id || null,
          note: newNote.trim(),
        })
        .select()
        .single();

      if (!error && data) {
        setNotes((prev) => [data as InsuranceLeadNote, ...prev]);
        setNewNote('');
      } else if (error) {
        console.error('[Credzo CRM] Note addition error:', error);
      }
    } catch (err) {
      console.error('[Credzo CRM] Note addition exception:', err);
    } finally {
      setSavingNote(false);
    }
  };

  // 6. Schedule Follow-up Handler
  const handleAddFollowUp = async () => {
    if (!fuDate || !leadId || !lead) return;
    setSavingFu(true);

    try {
      const { data, error } = await supabase
        .from('insurance_follow_ups')
        .insert({
          insurance_lead_id: leadId,
          organization_id: lead.organization_id,
          assigned_to: profile?.id || null,
          scheduled_at: new Date(fuDate).toISOString(),
          note: fuNote.trim() || null,
          status: 'PENDING',
        })
        .select()
        .single();

      if (!error && data) {
        setFollowUps((prev) =>
          [...prev, data as InsuranceFollowUp].sort(
            (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
          )
        );
        setFuDate('');
        setFuNote('');
      } else if (error) {
        console.error('[Credzo CRM] Follow-up creation error:', error);
      }
    } catch (err) {
      console.error('[Credzo CRM] Follow-up creation exception:', err);
    } finally {
      setSavingFu(false);
    }
  };

  // 6. Complete / Cancel Follow-up Handler
  const handleUpdateFollowUpStatus = async (fuId: string, newStatus: FollowUpStatus) => {
    try {
      const nowIso = new Date().toISOString();
      const { error } = await supabase
        .from('insurance_follow_ups')
        .update({
          status: newStatus,
          completed_at: newStatus === 'COMPLETED' ? nowIso : null,
          updated_at: nowIso,
        })
        .eq('id', fuId);

      if (!error) {
        setFollowUps((prev) =>
          prev.map((fu) =>
            fu.id === fuId
              ? {
                  ...fu,
                  status: newStatus,
                  completed_at: newStatus === 'COMPLETED' ? nowIso : null,
                  updated_at: nowIso,
                }
              : fu
          )
        );
      }
    } catch (err) {
      console.error('[Credzo CRM] Follow-up status error:', err);
    }
  };

  if (!leadId) return null;

  return (
    <div className="crm-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="crm-modal-window insurance-modal-window" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="crm-modal-header">
          <div className="crm-modal-header-info">
            <div className="crm-modal-badges">
              {lead && (
                <>
                  <span className={`status-badge ${lead.status}`}>{lead.status}</span>
                  <span className="lead-type-badge">{lead.insurance_type}</span>
                  <span className="lead-ref-pill">#{lead.id.slice(0, 8).toUpperCase()}</span>
                </>
              )}
            </div>
            <h2 className="crm-modal-title">
              {loading ? 'Loading enquiry...' : lead?.full_name || 'Insurance Enquiry'}
            </h2>
            {lead && (
              <p className="crm-modal-subtitle">
                Received on {formatDateTime(lead.created_at)} • {lead.insurance_type} from {lead.city || 'India'}
              </p>
            )}
          </div>

          <div className="crm-modal-header-actions">
            {lead && (
              <Link
                to={`/admin/insurance/${lead.id}`}
                className="btn btn-outline btn-xs"
                onClick={onClose}
                title="Open full page workspace"
              >
                Full Page ↗
              </Link>
            )}
            <button
              type="button"
              className="crm-modal-close-btn"
              onClick={onClose}
              aria-label="Close dialog"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="insurance-modal-body">
          {loading ? (
            <div style={{ padding: 'var(--space-8) 0', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="skeleton-row" style={{ height: 36 }} />
              <div className="skeleton-row" style={{ height: 90 }} />
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
                <div className="form-alert-error" role="alert">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                  </svg>
                  <span>{errorMsg}</span>
                </div>
              )}
              {saveMsg && (
                <div className="form-alert-success" role="status">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>{saveMsg}</span>
                </div>
              )}

              {/* 1. Customer Information */}
              <div className="lead-modal-section">
                <h3 className="section-heading">1. Customer Information</h3>
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

              {/* Cross-Service Related Enquiries */}
              <RelatedEnquiriesCard
                mobile={lead.mobile}
                currentLeadId={lead.id}
                currentCategory="insurance"
              />

              {/* 2. Insurance Request */}
              <div className="lead-modal-section">
                <h3 className="section-heading">2. Insurance Request</h3>
                <div className="crm-info-grid">
                  <div className="info-item">
                    <span className="info-label">Coverage Category</span>
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

              {/* 3. Update Enquiry Status */}
              <div className="lead-modal-section">
                <h3 className="section-heading">3. Update Enquiry Status</h3>
                <div className="lead-stage-updater-card">
                  <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Change Status:
                  </span>
                  <div className="updater-actions">
                    <select
                      className="crm-select crm-select-sm"
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value as LeadStatus)}
                      disabled={saving}
                      style={{ minWidth: 160 }}
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
              </div>

              {/* 4. Customer Requirement / Message */}
              <div className="lead-modal-section">
                <h3 className="section-heading">4. Customer Requirement / Message</h3>
                <div className="customer-message-box">
                  {lead.message || 'No additional notes provided by customer.'}
                </div>
              </div>

              {/* 5. Internal Notes */}
              <div className="lead-modal-section">
                <h3 className="section-heading">
                  <span>5. Internal Notes</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    {notes.length} note{notes.length === 1 ? '' : 's'}
                  </span>
                </h3>
                
                <div className="note-add-box">
                  <textarea
                    className="note-textarea"
                    placeholder="Add an internal note about this insurance lead..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={2}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="btn btn-primary btn-xs"
                      onClick={handleAddNote}
                      disabled={savingNote || !newNote.trim()}
                    >
                      {savingNote ? 'Saving...' : 'Add Note'}
                    </button>
                  </div>
                </div>

                {notes.length > 0 ? (
                  <div className="notes-thread-list">
                    {notes.map((n) => (
                      <div key={n.id} className="note-card">
                        <div className="note-card-meta">
                          <span>Staff Note</span>
                          <span>{formatDateTime(n.created_at)}</span>
                        </div>
                        <p className="note-card-body">{n.note}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', textAlign: 'center', margin: 'var(--space-2) 0' }}>
                    No internal notes recorded yet.
                  </p>
                )}
              </div>

              {/* 6. Follow-up Tasks */}
              <div className="lead-modal-section">
                <h3 className="section-heading">
                  <span>6. Follow-up Tasks</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                    {followUps.filter((f) => f.status === 'PENDING').length} Pending
                  </span>
                </h3>

                {followUps.length > 0 && (
                  <div className="followups-list">
                    {followUps.map((fu) => (
                      <div key={fu.id} className="followup-card">
                        <div className="followup-card-left">
                          <div className="followup-datetime">{formatDateTime(fu.scheduled_at)}</div>
                          {fu.note && <div className="followup-note-text">{fu.note}</div>}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end', flexShrink: 0 }}>
                          <span className={`followup-status-badge ${fu.status}`}>{fu.status}</span>
                          {fu.status === 'PENDING' && (
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                type="button"
                                style={{
                                  fontSize: '0.6875rem',
                                  color: 'var(--color-success)',
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  fontWeight: 700,
                                  padding: '2px 4px',
                                }}
                                onClick={() => handleUpdateFollowUpStatus(fu.id, 'COMPLETED')}
                              >
                                Done ✓
                              </button>
                              <button
                                type="button"
                                style={{
                                  fontSize: '0.6875rem',
                                  color: 'var(--color-danger)',
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  fontWeight: 700,
                                  padding: '2px 4px',
                                }}
                                onClick={() => handleUpdateFollowUpStatus(fu.id, 'CANCELLED')}
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Schedule Follow-up Form */}
                <div className="followup-scheduler-box">
                  <input
                    type="datetime-local"
                    className="value-input"
                    value={fuDate}
                    onChange={(e) => setFuDate(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    style={{ width: '100%' }}
                  />
                  <input
                    type="text"
                    className="text-input"
                    placeholder="Follow-up purpose / note (optional)..."
                    value={fuNote}
                    onChange={(e) => setFuNote(e.target.value)}
                    style={{ width: '100%' }}
                  />
                  <button
                    type="button"
                    className="btn btn-outline btn-xs"
                    onClick={handleAddFollowUp}
                    disabled={savingFu || !fuDate}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    {savingFu ? 'Scheduling...' : '+ Schedule'}
                  </button>
                </div>
              </div>

              {/* 7. Consent & Compliance */}
              <div className="lead-modal-section">
                <h3 className="section-heading">7. Consent & Compliance</h3>
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

              {/* 8. Marketing Attribution */}
              <div className="lead-modal-section">
                <h3 className="section-heading">8. Marketing Attribution</h3>
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
                </div>
              </div>

              {/* 9. System Timestamps */}
              <div className="lead-modal-section" style={{ borderBottom: 'none' }}>
                <h3 className="section-heading">9. System Timestamps</h3>
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
        <div className="crm-modal-footer" style={{ padding: 'var(--space-4) var(--space-6)', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-app)' }}>
          {lead ? (
            <Link
              to={`/admin/insurance/${lead.id}`}
              className="btn btn-primary btn-sm"
              onClick={onClose}
            >
              Open Full Lead Workspace →
            </Link>
          ) : <span />}
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
