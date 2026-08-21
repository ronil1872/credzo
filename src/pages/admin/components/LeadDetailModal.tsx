import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { formatIndianCurrency, formatTenureDisplay } from '../../../lib/calculator';
import { useAuth } from '../../../hooks';
import { Lead, LeadStatus, LeadNote, FollowUp } from '../../../types/database';
import '../crm.css';

interface LeadDetailModalProps {
  leadId: string | null;
  onClose: () => void;
  onLeadUpdated?: (updatedLead: Lead) => void;
}

const LOAN_TYPE_LABELS: Record<string, string> = {
  personal: 'Personal Loan',
  home: 'Home Loan',
  car: 'Car Loan',
  business: 'Business Loan',
  education: 'Education Loan',
  gold: 'Gold Loan',
  lap: 'Loan Against Property',
  other: 'Other Loan',
};

const ALL_STATUSES: LeadStatus[] = [
  'NEW',
  'CONTACTED',
  'INTERESTED',
  'DOCUMENTS',
  'APPLICATION',
  'APPROVED',
  'DISBURSED',
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

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  leadId,
  onClose,
  onLeadUpdated,
}) => {
  const { profile } = useAuth();

  const [lead, setLead] = useState<Lead | null>(null);
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // Edit fields
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus>('NEW');
  const [requestedAmt, setRequestedAmt] = useState('');
  const [approvedAmt, setApprovedAmt] = useState('');
  const [disbursedAmt, setDisbursedAmt] = useState('');

  // New Note
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // New Follow-up
  const [fuDate, setFuDate] = useState('');
  const [fuNote, setFuNote] = useState('');
  const [savingFu, setSavingFu] = useState(false);

  // Active tab inside modal
  const [activeTab, setActiveTab] = useState<'details' | 'notes' | 'followups'>('details');

  useEffect(() => {
    if (!leadId) {
      setLead(null);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    const fetchLeadData = async () => {
      try {
        const [leadRes, notesRes, fuRes] = await Promise.all([
          supabase.from('leads').select('*').eq('id', leadId).maybeSingle(),
          supabase
            .from('lead_notes')
            .select('*')
            .eq('lead_id', leadId)
            .order('created_at', { ascending: false }),
          supabase
            .from('follow_ups')
            .select('*')
            .eq('lead_id', leadId)
            .order('scheduled_at', { ascending: true }),
        ]);

        if (isMounted && leadRes.data) {
          const l = leadRes.data as Lead;
          setLead(l);
          setSelectedStatus(l.status);
          setRequestedAmt(String(l.requested_amount || ''));
          setApprovedAmt(String(l.approved_amount || '0'));
          setDisbursedAmt(String(l.disbursed_amount || '0'));
          setNotes((notesRes.data as LeadNote[]) || []);
          setFollowUps((fuRes.data as FollowUp[]) || []);
        }
      } catch (err) {
        console.error('[Credzo CRM] Error loading lead modal data:', err);
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

  if (!leadId) return null;

  const handleSaveStatus = async () => {
    if (!lead || !leadId) return;
    setSaving(true);
    setSaveMsg(null);

    const reqAmtNum = Number(requestedAmt) || lead.requested_amount;
    const apvAmtNum = Number(approvedAmt) || 0;
    const dsbAmtNum = Number(disbursedAmt) || 0;

    const { error } = await supabase
      .from('leads')
      .update({
        status: selectedStatus,
        requested_amount: reqAmtNum,
        approved_amount: apvAmtNum,
        disbursed_amount: dsbAmtNum,
      })
      .eq('id', leadId);

    if (!error) {
      const updated: Lead = {
        ...lead,
        status: selectedStatus,
        requested_amount: reqAmtNum,
        approved_amount: apvAmtNum,
        disbursed_amount: dsbAmtNum,
      };
      setLead(updated);
      onLeadUpdated?.(updated);
      setSaveMsg('Status & amounts updated successfully.');
    } else {
      setSaveMsg('Error saving updates. Please try again.');
    }

    setSaving(false);
    setTimeout(() => setSaveMsg(null), 3000);
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !leadId || !lead) return;
    setSavingNote(true);

    const { data, error } = await supabase
      .from('lead_notes')
      .insert({
        lead_id: leadId,
        organization_id: lead.organization_id,
        author_id: profile?.id ?? null,
        note: newNote.trim(),
      })
      .select()
      .single();

    if (!error && data) {
      setNotes((prev) => [data as LeadNote, ...prev]);
      setNewNote('');
    }
    setSavingNote(false);
  };

  const handleAddFollowUp = async () => {
    if (!fuDate || !leadId || !lead) return;
    setSavingFu(true);

    const { data, error } = await supabase
      .from('follow_ups')
      .insert({
        lead_id: leadId,
        organization_id: lead.organization_id,
        assigned_to: profile?.id ?? null,
        scheduled_at: new Date(fuDate).toISOString(),
        note: fuNote.trim() || null,
        status: 'PENDING',
      })
      .select()
      .single();

    if (!error && data) {
      setFollowUps((prev) =>
        [...prev, data as FollowUp].sort(
          (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
        )
      );
      setFuDate('');
      setFuNote('');
    }
    setSavingFu(false);
  };

  const handleCompleteFollowUp = async (fuId: string) => {
    await supabase
      .from('follow_ups')
      .update({ status: 'COMPLETED', completed_at: new Date().toISOString() })
      .eq('id', fuId);

    setFollowUps((prev) =>
      prev.map((fu) =>
        fu.id === fuId
          ? { ...fu, status: 'COMPLETED', completed_at: new Date().toISOString() }
          : fu
      )
    );
  };

  return (
    <div className="crm-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="crm-modal-window" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="crm-modal-header">
          <div className="crm-modal-header-info">
            <div className="crm-modal-badges">
              {lead && (
                <>
                  <span className={`status-badge ${lead.status}`}>{lead.status}</span>
                  <span className={`temp-badge ${lead.lead_score}`}>
                    {lead.lead_score === 'HOT' ? '🔥' : lead.lead_score === 'WARM' ? '🌡️' : '❄️'}{' '}
                    {lead.lead_score}
                  </span>
                  <span className="lead-ref-pill">#{lead.id.slice(0, 8).toUpperCase()}</span>
                </>
              )}
            </div>
            <h2 className="crm-modal-title">{lead ? lead.name : 'Loading Lead Details...'}</h2>
            {lead && (
              <p className="crm-modal-subtitle">
                Received on {formatDateTime(lead.created_at)} •{' '}
                {LOAN_TYPE_LABELS[lead.loan_type] || lead.loan_type} of{' '}
                {formatIndianCurrency(lead.requested_amount)}
              </p>
            )}
          </div>

          <div className="crm-modal-header-actions">
            {lead && (
              <Link to={`/admin/leads/${lead.id}`} className="btn btn-outline btn-xs">
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

        {/* Quick Contact Bar */}
        {lead && (
          <div className="crm-modal-contact-bar">
            <a href={`tel:+91${lead.mobile}`} className="action-btn call">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.49 12 19.79 19.79 0 0 1 1.44 3.41 2 2 0 0 1 3.44 1.24h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.65a16 16 0 0 0 6.29 6.29l.88-.87a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              Call +91 {lead.mobile}
            </a>
            <a
              href={`https://wa.me/91${lead.mobile}?text=${encodeURIComponent(
                `Hi ${lead.name}, this is Credzo Finance regarding your ${
                  LOAN_TYPE_LABELS[lead.loan_type] || 'loan'
                } enquiry.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="action-btn whatsapp"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.03.504 3.95 1.386 5.643L.073 23.927l6.444-1.29A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.027-1.375l-.359-.214-3.727.747.76-3.639-.234-.374A9.774 9.774 0 0 1 2.182 12c0-5.418 4.4-9.818 9.818-9.818 5.418 0 9.818 4.4 9.818 9.818 0 5.418-4.4 9.818-9.818 9.818z" />
              </svg>
              WhatsApp
            </a>
          </div>
        )}

        {/* Modal Navigation Tabs */}
        <div className="crm-modal-tabs">
          <button
            type="button"
            className={`crm-modal-tab ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            Applicant & Loan Data
          </button>
          <button
            type="button"
            className={`crm-modal-tab ${activeTab === 'notes' ? 'active' : ''}`}
            onClick={() => setActiveTab('notes')}
          >
            Internal Notes ({notes.length})
          </button>
          <button
            type="button"
            className={`crm-modal-tab ${activeTab === 'followups' ? 'active' : ''}`}
            onClick={() => setActiveTab('followups')}
          >
            Follow-ups ({followUps.filter((f) => f.status === 'PENDING').length})
          </button>
        </div>

        {/* Body Content */}
        <div className="crm-modal-body">
          {loading ? (
            <div className="crm-modal-loading">
              <div className="skeleton-row" style={{ height: 40 }} />
              <div className="skeleton-row" style={{ height: 100 }} />
              <div className="skeleton-row" style={{ height: 100 }} />
            </div>
          ) : !lead ? (
            <div className="empty-state">
              <p className="empty-state-title">Lead details could not be loaded.</p>
            </div>
          ) : activeTab === 'details' ? (
            <div className="modal-details-grid">
              {/* Section 1: Customer Profile */}
              <div className="crm-card">
                <div className="crm-card-header">
                  <span className="crm-card-title">Applicant Profile</span>
                </div>
                <div style={{ padding: 'var(--space-4) var(--space-5)' }}>
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="info-label">Full Name</span>
                      <span className="info-value">{lead.name}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Mobile Number</span>
                      <span className="info-value">+91 {lead.mobile}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">City</span>
                      <span className="info-value">{lead.city || '—'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Employment Type</span>
                      <span className="info-value">
                        {lead.employment_type
                          ? lead.employment_type.charAt(0).toUpperCase() +
                            lead.employment_type.slice(1).replace('_', ' ')
                          : '—'}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Monthly Income</span>
                      <span className="info-value">
                        {lead.monthly_income ? formatIndianCurrency(lead.monthly_income) : '—'}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Existing Monthly EMI</span>
                      <span className="info-value">
                        {lead.existing_emi ? formatIndianCurrency(lead.existing_emi) : '—'}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Preferred Callback Date</span>
                      <span className="info-value">
                        {lead.preferred_callback_date
                          ? formatDate(lead.preferred_callback_date)
                          : '—'}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Preferred Time Slot</span>
                      <span className="info-value">
                        {lead.preferred_callback_time
                          ? lead.preferred_callback_time.charAt(0).toUpperCase() +
                            lead.preferred_callback_time.slice(1)
                          : 'Morning'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Calculator Estimate Snapshot */}
              <div className="crm-card">
                <div className="crm-card-header">
                  <span className="crm-card-title">Loan Parameters & Estimate</span>
                </div>
                <div style={{ padding: 'var(--space-4) var(--space-5)' }}>
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="info-label">Loan Type</span>
                      <span className="info-value">
                        {LOAN_TYPE_LABELS[lead.loan_type] || lead.loan_type}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Requested Loan Amount</span>
                      <span className="info-value" style={{ color: 'var(--color-primary)' }}>
                        {formatIndianCurrency(lead.requested_amount)}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Tenure</span>
                      <span className="info-value">
                        {lead.loan_tenure_months
                          ? formatTenureDisplay(lead.loan_tenure_months)
                          : '—'}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Illustrative Interest Rate</span>
                      <span className="info-value">
                        {lead.illustrative_interest_rate
                          ? `${lead.illustrative_interest_rate}% p.a.`
                          : '—'}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Calculated Monthly EMI</span>
                      <span className="info-value" style={{ color: '#047857' }}>
                        {lead.calculated_emi
                          ? `${formatIndianCurrency(lead.calculated_emi)}/mo`
                          : '—'}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Estimated Total Interest</span>
                      <span className="info-value">
                        {lead.estimated_interest
                          ? formatIndianCurrency(lead.estimated_interest)
                          : '—'}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Total Repayment Estimate</span>
                      <span className="info-value">
                        {lead.estimated_total_repayment
                          ? formatIndianCurrency(lead.estimated_total_repayment)
                          : '—'}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Consent Recorded</span>
                      <span className="info-value" style={{ fontSize: 'var(--font-size-xs)' }}>
                        {lead.consent_given ? `✓ Granted (${formatDateTime(lead.consent_timestamp)})` : 'No'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Status & Amount Management */}
              <div className="crm-card">
                <div className="crm-card-header">
                  <span className="crm-card-title">Update Pipeline Status</span>
                </div>
                <div style={{ padding: 'var(--space-4) var(--space-5)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)' }}>
                    <div className="form-field-group">
                      <label className="info-label" htmlFor="modal-status-select">
                        Lead Status
                      </label>
                      <select
                        id="modal-status-select"
                        className="status-select"
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value as LeadStatus)}
                      >
                        {ALL_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-field-group">
                      <label className="info-label" htmlFor="modal-req-amt">
                        Requested Amount (₹)
                      </label>
                      <input
                        id="modal-req-amt"
                        type="number"
                        className="value-input"
                        value={requestedAmt}
                        onChange={(e) => setRequestedAmt(e.target.value)}
                      />
                    </div>

                    <div className="form-field-group">
                      <label className="info-label" htmlFor="modal-apv-amt">
                        Approved Amount (₹)
                      </label>
                      <input
                        id="modal-apv-amt"
                        type="number"
                        className="value-input"
                        value={approvedAmt}
                        onChange={(e) => setApprovedAmt(e.target.value)}
                      />
                    </div>

                    <div className="form-field-group">
                      <label className="info-label" htmlFor="modal-dsb-amt">
                        Disbursed Amount (₹)
                      </label>
                      <input
                        id="modal-dsb-amt"
                        type="number"
                        className="value-input"
                        value={disbursedAmt}
                        onChange={(e) => setDisbursedAmt(e.target.value)}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={handleSaveStatus}
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save Lead Updates'}
                    </button>
                    {saveMsg && (
                      <span
                        style={{
                          fontSize: 'var(--font-size-xs)',
                          fontWeight: 600,
                          color: saveMsg.includes('Error')
                            ? 'var(--color-danger)'
                            : 'var(--color-success)',
                        }}
                      >
                        {saveMsg}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 4: Marketing Attribution */}
              {(lead.lead_source || lead.utm_source || lead.utm_campaign || lead.lead_score_reason) && (
                <div className="crm-card">
                  <div className="crm-card-header">
                    <span className="crm-card-title">Marketing Attribution & Scoring</span>
                  </div>
                  <div style={{ padding: 'var(--space-4) var(--space-5)' }}>
                    <div className="utm-grid">
                      {lead.lead_source && (
                        <span className="utm-pill">
                          <strong>Source:</strong> {lead.lead_source}
                        </span>
                      )}
                      {lead.utm_source && (
                        <span className="utm-pill">
                          <strong>UTM Source:</strong> {lead.utm_source}
                        </span>
                      )}
                      {lead.utm_medium && (
                        <span className="utm-pill">
                          <strong>UTM Medium:</strong> {lead.utm_medium}
                        </span>
                      )}
                      {lead.utm_campaign && (
                        <span className="utm-pill">
                          <strong>UTM Campaign:</strong> {lead.utm_campaign}
                        </span>
                      )}
                      {lead.utm_content && (
                        <span className="utm-pill">
                          <strong>UTM Content:</strong> {lead.utm_content}
                        </span>
                      )}
                      {lead.utm_term && (
                        <span className="utm-pill">
                          <strong>UTM Term:</strong> {lead.utm_term}
                        </span>
                      )}
                    </div>
                    {lead.lead_score_reason && (
                      <p style={{ marginTop: 'var(--space-3)', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                        <strong>Score Reason:</strong> {lead.lead_score_reason}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === 'notes' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="note-add-form">
                <textarea
                  className="note-textarea"
                  placeholder="Record call notes, customer requirements, or remarks..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleAddNote}
                    disabled={savingNote || !newNote.trim()}
                  >
                    {savingNote ? 'Saving Note...' : 'Add Note'}
                  </button>
                </div>
              </div>

              {notes.length === 0 ? (
                <div className="empty-state" style={{ padding: 'var(--space-6)' }}>
                  <p className="empty-state-title">No notes recorded yet</p>
                  <p className="empty-state-desc">Use the box above to log internal staff notes.</p>
                </div>
              ) : (
                <div className="notes-thread">
                  {notes.map((note) => (
                    <div key={note.id} className="note-item">
                      <div className="note-meta">
                        <span className="note-author">Staff Member</span>
                        <span className="note-ts">{formatDateTime(note.created_at)}</span>
                      </div>
                      <p className="note-body">{note.note}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {/* Follow-up Scheduler Form */}
              <div className="crm-card">
                <div className="crm-card-header">
                  <span className="crm-card-title">Schedule Follow-up Task</span>
                </div>
                <div style={{ padding: 'var(--space-4) var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>
                    <div className="form-field-group">
                      <label className="info-label" htmlFor="fu-date-input">
                        Date & Time
                      </label>
                      <input
                        id="fu-date-input"
                        type="datetime-local"
                        className="value-input"
                        value={fuDate}
                        onChange={(e) => setFuDate(e.target.value)}
                        min={new Date().toISOString().slice(0, 16)}
                      />
                    </div>
                    <div className="form-field-group">
                      <label className="info-label" htmlFor="fu-note-input">
                        Task Details (Optional)
                      </label>
                      <input
                        id="fu-note-input"
                        type="text"
                        className="value-input"
                        placeholder="e.g. Call back for salary slip collection"
                        value={fuNote}
                        onChange={(e) => setFuNote(e.target.value)}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={handleAddFollowUp}
                      disabled={savingFu || !fuDate}
                    >
                      {savingFu ? 'Scheduling...' : 'Schedule Task'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Follow-ups List */}
              {followUps.length === 0 ? (
                <div className="empty-state" style={{ padding: 'var(--space-6)' }}>
                  <p className="empty-state-title">No follow-ups scheduled</p>
                </div>
              ) : (
                <div className="crm-card">
                  {followUps.map((fu) => (
                    <div key={fu.id} className="followup-item">
                      <div className="followup-info">
                        <div className="followup-date">{formatDateTime(fu.scheduled_at)}</div>
                        {fu.note && <div className="followup-note-text">{fu.note}</div>}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                        <span className={`followup-status-badge ${fu.status}`}>{fu.status}</span>
                        {fu.status === 'PENDING' && (
                          <button
                            type="button"
                            style={{
                              fontSize: '0.6875rem',
                              fontWeight: 700,
                              color: 'var(--color-success)',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: 0,
                            }}
                            onClick={() => handleCompleteFollowUp(fu.id)}
                          >
                            Mark Done ✓
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
