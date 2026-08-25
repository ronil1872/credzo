import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import { formatIndianCurrency, formatTenureDisplay } from '../../../lib/calculator';
import { RelatedEnquiriesCard } from '../components/RelatedEnquiriesCard';
import { DeleteLeadDialog } from '../components/DeleteLeadDialog';
import { useAuth } from '../../../hooks';
import { Lead, LeadStatus, LeadNote, FollowUp } from '../../../types/database';
import { dispatchPushNotification, NotificationTemplates } from '../../../lib/pushNotifications';
import '../crm.css';

const LOAN_TYPE_LABELS: Record<string, string> = {
  personal: 'Personal Loan', home: 'Home Loan', car: 'Car Loan',
  business: 'Business Loan', education: 'Education Loan', gold: 'Gold Loan', lap: 'Loan Against Property',
};

const ALL_STATUSES: LeadStatus[] = [
  'NEW', 'CONTACTED', 'INTERESTED', 'DOCUMENTS', 'APPLICATION', 'APPROVED', 'DISBURSED', 'LOST',
];

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

export const LeadDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const isAdminOrOwner = profile?.role === 'OWNER' || profile?.role === 'ADMIN';

  const [lead, setLead] = useState<Lead | null>(null);
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);


  // Edit state
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus>('NEW');
  const [requestedAmt, setRequestedAmt] = useState('');
  const [approvedAmt, setApprovedAmt] = useState('');
  const [disbursedAmt, setDisbursedAmt] = useState('');

  // Notes
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // Follow-up form
  const [fuDate, setFuDate] = useState('');
  const [fuNote, setFuNote] = useState('');
  const [savingFu, setSavingFu] = useState(false);

  useEffect(() => {
    if (!id || !isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    const fetchAll = async () => {
      setLoading(true);
      const [leadRes, notesRes, fuRes] = await Promise.all([
        supabase.from('leads').select('*').eq('id', id).maybeSingle(),
        supabase.from('lead_notes').select('*').eq('lead_id', id).order('created_at', { ascending: false }),
        supabase.from('follow_ups').select('*').eq('lead_id', id).order('scheduled_at', { ascending: true }),
      ]);

      if (leadRes.data) {
        const l = leadRes.data as Lead;
        setLead(l);
        setSelectedStatus(l.status);
        setRequestedAmt(String(l.requested_amount || ''));
        setApprovedAmt(String(l.approved_amount || ''));
        setDisbursedAmt(String(l.disbursed_amount || ''));
      } else {
        navigate('/admin/leads');
      }

      setNotes((notesRes.data as LeadNote[]) || []);
      setFollowUps((fuRes.data as FollowUp[]) || []);
      setLoading(false);
    };

    fetchAll();
  }, [id, navigate]);

  const handleSaveStatus = async () => {
    if (!lead || !id) return;
    setSaving(true);
    setSaveMsg(null);
    const { error } = await supabase
      .from('leads')
      .update({
        status: selectedStatus,
        requested_amount: Number(requestedAmt) || lead.requested_amount,
        approved_amount: Number(approvedAmt) || 0,
        disbursed_amount: Number(disbursedAmt) || 0,
      })
      .eq('id', id);

    if (!error) {
      const oldStatus = lead.status;
      setLead(prev => prev ? {
        ...prev, status: selectedStatus,
        requested_amount: Number(requestedAmt) || prev.requested_amount,
        approved_amount: Number(approvedAmt) || 0,
        disbursed_amount: Number(disbursedAmt) || 0,
      } : prev);
      setSaveMsg('Changes saved.');

      // Real Push Notification Dispatch if status changed
      if (oldStatus !== selectedStatus) {
        const notifPayload =
          selectedStatus === 'DOCUMENTS'
            ? NotificationTemplates.documentPending(lead.name, id)
            : NotificationTemplates.applicationStatus(lead.name, selectedStatus, id);

        dispatchPushNotification({
          targetUserId: lead.assigned_to || undefined,
          allOrganizationStaff: !lead.assigned_to,
          organizationId: lead.organization_id,
          notification: notifPayload,
        }).catch((err) => console.warn('[Credzo Push] Status change notification notice:', err));
      }
    } else {
      setSaveMsg('Error saving changes.');
    }
    setSaving(false);
    setTimeout(() => setSaveMsg(null), 3000);
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !id || !lead) return;
    setSavingNote(true);
    const { data, error } = await supabase
      .from('lead_notes')
      .insert({
        lead_id: id,
        organization_id: lead.organization_id,
        author_id: profile?.id ?? null,
        note: newNote.trim(),
      })
      .select()
      .single();

    if (!error && data) {
      setNotes(prev => [data as LeadNote, ...prev]);
      setNewNote('');
    }
    setSavingNote(false);
  };

  const handleAddFollowUp = async () => {
    if (!fuDate || !id || !lead) return;
    setSavingFu(true);
    const { data, error } = await supabase
      .from('follow_ups')
      .insert({
        lead_id: id,
        organization_id: lead.organization_id,
        assigned_to: profile?.id ?? null,
        scheduled_at: new Date(fuDate).toISOString(),
        note: fuNote.trim() || null,
        status: 'PENDING',
      })
      .select()
      .single();

    if (!error && data) {
      setFollowUps(prev => [...prev, data as FollowUp].sort(
        (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
      ));
      setFuDate('');
      setFuNote('');

      // Real Push Notification Dispatch for scheduled follow-up
      dispatchPushNotification({
        targetUserId: profile?.id,
        organizationId: lead.organization_id,
        notification: NotificationTemplates.followUpDue(lead.name, id, (data as FollowUp).id),
      }).catch((err) => console.warn('[Credzo Push] Follow-up notification notice:', err));
    }
    setSavingFu(false);
  };

  const handleCompleteFollowUp = async (fuId: string) => {
    await supabase
      .from('follow_ups')
      .update({ status: 'COMPLETED', completed_at: new Date().toISOString() })
      .eq('id', fuId);
    setFollowUps(prev =>
      prev.map(fu => fu.id === fuId ? { ...fu, status: 'COMPLETED', completed_at: new Date().toISOString() } : fu)
    );
  };

  const handleDeleteLead = async () => {
    if (!id || !isAdminOrOwner) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (error) {
        console.error('[Credzo CRM] Lead delete error:', error);
        setDeleteError(`Failed to delete lead: ${error.message}`);
        setIsDeleting(false);
        setShowDeleteDialog(false);
        return;
      }

      setIsDeleting(false);
      setShowDeleteDialog(false);
      navigate('/admin/leads');
    } catch (err: unknown) {
      console.error('[Credzo CRM] Unexpected lead delete error:', err);
      setDeleteError('An unexpected error occurred while deleting lead.');
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="crm-page-header">
          <div className="skeleton-bar" style={{ width: 200, height: 28, borderRadius: 8 }} />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton-row" style={{ marginBottom: 8 }} />
        ))}
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="empty-state" style={{ marginTop: 'var(--space-12)' }}>
        <p className="empty-state-title">Lead not found</p>
        <Link to="/admin/leads" className="btn btn-primary btn-sm" style={{ marginTop: 'var(--space-3)' }}>
          ← Back to Leads
        </Link>
      </div>
    );
  }

  const hasUtm = lead.utm_source || lead.utm_medium || lead.utm_campaign || lead.utm_content;

  return (
    <div>
      <div className="crm-page-header">
        <div>
          <Link
            to="/admin/leads"
            style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', fontWeight: 600 }}
          >
            ← All Leads
          </Link>
          <h1 className="crm-page-title" style={{ marginTop: 'var(--space-1)' }}>
            {lead.name}
          </h1>
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-1)', flexWrap: 'wrap' }}>
            <span className="lead-ref-pill">#{lead.id.slice(0, 8).toUpperCase()}</span>
            <span className={`status-badge ${lead.status}`}>{lead.status}</span>
            <span className={`temp-badge ${lead.lead_score}`}>
              {lead.lead_score === 'HOT' ? '🔥' : lead.lead_score === 'WARM' ? '🌡️' : '❄️'} {lead.lead_score}
            </span>
          </div>
        </div>
        {/* Quick Actions */}
        <div className="action-btn-row">
          <a
            href={`tel:+91${lead.mobile}`}
            className="action-btn call"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.49 12 19.79 19.79 0 0 1 1.44 3.41 2 2 0 0 1 3.44 1.24h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.65a16 16 0 0 0 6.29 6.29l.88-.87a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            Call +91 {lead.mobile}
          </a>
          <a
            href={`https://wa.me/91${lead.mobile}?text=${encodeURIComponent(`Hi ${lead.name}, this is Credzo Finance. We are following up on your loan enquiry.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="action-btn whatsapp"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.03.504 3.95 1.386 5.643L.073 23.927l6.444-1.29A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.027-1.375l-.359-.214-3.727.747.76-3.639-.234-.374A9.774 9.774 0 0 1 2.182 12c0-5.418 4.4-9.818 9.818-9.818 5.418 0 9.818 4.4 9.818 9.818 0 5.418-4.4 9.818-9.818 9.818z"/>
            </svg>
            WhatsApp
          </a>
          {isAdminOrOwner && (
            <button
              type="button"
              className="action-btn btn-outline-danger"
              onClick={() => setShowDeleteDialog(true)}
              title="Permanently delete this lead (Admin/Owner only)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
              Delete Lead
            </button>
          )}
        </div>
      </div>

      {deleteError && (
        <div className="form-alert-error" role="alert" style={{ marginBottom: 'var(--space-4)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{deleteError}</span>
        </div>
      )}


      <div className="lead-detail-container">
        {/* Left: Main Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>

          {/* Customer Profile */}
          <div className="crm-card">
            <div className="crm-card-header">
              <span className="crm-card-title">Customer Profile</span>
            </div>
            <div style={{ padding: 'var(--space-4) var(--space-5)' }}>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Full Name</span>
                  <span className="info-value">{lead.name}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Mobile</span>
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
                      ? lead.employment_type.charAt(0).toUpperCase() + lead.employment_type.slice(1).replace('_', ' ')
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
                  <span className="info-label">Existing EMI</span>
                  <span className="info-value">
                    {lead.existing_emi ? formatIndianCurrency(lead.existing_emi) : '—'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Preferred Callback</span>
                  <span className="info-value">
                    {lead.preferred_callback_date
                      ? `${formatDate(lead.preferred_callback_date)} • ${lead.preferred_callback_time || 'Anytime'}`
                      : '—'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Received On</span>
                  <span className="info-value">{formatDateTime(lead.created_at)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cross-Service Related Enquiries */}
          <RelatedEnquiriesCard
            mobile={lead.mobile}
            currentLeadId={lead.id}
            currentCategory="loan"
          />

          {/* Calculator Estimate Snapshot */}
          <div className="crm-card">
            <div className="crm-card-header">
              <span className="crm-card-title">Loan Estimate Snapshot</span>
            </div>
            <div style={{ padding: 'var(--space-4) var(--space-5)' }}>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Loan Type</span>
                  <span className="info-value">{LOAN_TYPE_LABELS[lead.loan_type] || lead.loan_type}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Requested Amount</span>
                  <span className="info-value">{formatIndianCurrency(lead.requested_amount)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Tenure</span>
                  <span className="info-value">
                    {lead.loan_tenure_months ? formatTenureDisplay(lead.loan_tenure_months) : '—'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Illustrative Rate</span>
                  <span className="info-value">
                    {lead.illustrative_interest_rate ? `${lead.illustrative_interest_rate}% p.a.` : '—'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Est. Monthly EMI</span>
                  <span className="info-value" style={{ color: 'var(--color-primary)' }}>
                    {lead.calculated_emi ? formatIndianCurrency(lead.calculated_emi) + '/mo' : '—'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Est. Total Interest</span>
                  <span className="info-value">
                    {lead.estimated_interest ? formatIndianCurrency(lead.estimated_interest) : '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* UTM Attribution */}
          {hasUtm && (
            <div className="crm-card">
              <div className="crm-card-header">
                <span className="crm-card-title">Marketing Attribution</span>
              </div>
              <div style={{ padding: 'var(--space-4) var(--space-5)' }}>
                <div className="utm-grid">
                  {lead.lead_source && (
                    <span className="utm-pill"><strong>Source:</strong> {lead.lead_source}</span>
                  )}
                  {lead.utm_medium && (
                    <span className="utm-pill"><strong>Medium:</strong> {lead.utm_medium}</span>
                  )}
                  {lead.utm_campaign && (
                    <span className="utm-pill"><strong>Campaign:</strong> {lead.utm_campaign}</span>
                  )}
                  {lead.utm_content && (
                    <span className="utm-pill"><strong>Content:</strong> {lead.utm_content}</span>
                  )}
                  {lead.utm_term && (
                    <span className="utm-pill"><strong>Term:</strong> {lead.utm_term}</span>
                  )}
                  {lead.campaign && (
                    <span className="utm-pill"><strong>Campaign Name:</strong> {lead.campaign}</span>
                  )}
                  {lead.ad && (
                    <span className="utm-pill"><strong>Ad:</strong> {lead.ad}</span>
                  )}
                </div>
                {lead.lead_score_reason && (
                  <p style={{ marginTop: 'var(--space-3)', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                    <strong>Internal Score Reason:</strong> {lead.lead_score_reason}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Notes Thread */}
          <div className="crm-card">
            <div className="crm-card-header">
              <span className="crm-card-title">Internal Notes</span>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                {notes.length} note{notes.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div style={{ padding: 'var(--space-4) var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {/* Add note */}
              <div className="note-add-form">
                <textarea
                  className="note-textarea"
                  placeholder="Add an internal note about this lead..."
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleAddNote}
                    disabled={savingNote || !newNote.trim()}
                  >
                    {savingNote ? 'Saving...' : 'Add Note'}
                  </button>
                </div>
              </div>

              {/* Notes list */}
              {notes.length === 0 ? (
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', textAlign: 'center' }}>
                  No notes yet. Add the first note above.
                </p>
              ) : (
                <div className="notes-thread">
                  {notes.map(note => (
                    <div key={note.id} className="note-item">
                      <div className="note-meta">
                        <span className="note-author">Staff</span>
                        <span className="note-ts">{formatDateTime(note.created_at)}</span>
                      </div>
                      <p className="note-body">{note.note}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Status & Follow-ups */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>

          {/* Status Management */}
          <div className="crm-card">
            <div className="crm-card-header">
              <span className="crm-card-title">Pipeline Status</span>
            </div>
            <div style={{ padding: 'var(--space-4) var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                <label className="info-label" htmlFor="lead-status-select">Status</label>
                <select
                  id="lead-status-select"
                  className="status-select"
                  value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value as LeadStatus)}
                >
                  {ALL_STATUSES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Loan Value Inputs */}
              <div>
                <p className="crm-section-title">Loan Values (₹)</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {[
                    { label: 'Requested', val: requestedAmt, set: setRequestedAmt, id: 'req-amt' },
                    { label: 'Approved', val: approvedAmt, set: setApprovedAmt, id: 'apv-amt' },
                    { label: 'Disbursed', val: disbursedAmt, set: setDisbursedAmt, id: 'dsb-amt' },
                  ].map(({ label, val, set, id }) => (
                    <div key={id} className="value-input-group">
                      <label className="value-label" htmlFor={id}>{label}</label>
                      <input
                        id={id}
                        type="number"
                        className="value-input"
                        value={val}
                        onChange={e => set(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <button
                className="btn btn-primary btn-sm btn-full-width"
                onClick={handleSaveStatus}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              {saveMsg && (
                <p style={{
                  fontSize: 'var(--font-size-xs)',
                  color: saveMsg.includes('Error') ? 'var(--color-danger)' : 'var(--color-success)',
                  textAlign: 'center',
                  fontWeight: 600,
                }}>
                  {saveMsg}
                </p>
              )}
            </div>
          </div>

          {/* Follow-ups */}
          <div className="crm-card">
            <div className="crm-card-header">
              <span className="crm-card-title">Follow-up Tasks</span>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                {followUps.filter(f => f.status === 'PENDING').length} pending
              </span>
            </div>

            {/* Existing follow-ups */}
            {followUps.length === 0 ? (
              <div style={{ padding: 'var(--space-4) var(--space-5)', fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                No follow-ups scheduled yet.
              </div>
            ) : (
              <div>
                {followUps.map(fu => (
                  <div key={fu.id} className="followup-item">
                    <div className="followup-info">
                      <div className="followup-date">{formatDateTime(fu.scheduled_at)}</div>
                      {fu.note && <div className="followup-note-text">{fu.note}</div>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                      <span className={`followup-status-badge ${fu.status}`}>{fu.status}</span>
                      {fu.status === 'PENDING' && (
                        <button
                          style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--color-success)', background: 'none', border: 'none', cursor: 'pointer' }}
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

            {/* Schedule new follow-up */}
            <div style={{ padding: 'var(--space-4) var(--space-5)', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <p className="crm-section-title">Schedule Follow-up</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                <label className="info-label">Date & Time</label>
                <input
                  type="datetime-local"
                  className="value-input"
                  value={fuDate}
                  onChange={e => setFuDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                <label className="info-label">Note (Optional)</label>
                <textarea
                  className="note-textarea"
                  style={{ minHeight: 60 }}
                  placeholder="What is this follow-up about?"
                  value={fuNote}
                  onChange={e => setFuNote(e.target.value)}
                />
              </div>
              <button
                className="btn btn-outline btn-sm btn-full-width"
                onClick={handleAddFollowUp}
                disabled={savingFu || !fuDate}
              >
                {savingFu ? 'Scheduling...' : 'Schedule Follow-up'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {lead && (
        <DeleteLeadDialog
          isOpen={showDeleteDialog}
          leadName={lead.name}
          leadRef={lead.id.slice(0, 8)}
          leadType={LOAN_TYPE_LABELS[lead.loan_type] || lead.loan_type}
          isDeleting={isDeleting}
          onConfirm={handleDeleteLead}
          onCancel={() => {
            if (!isDeleting) setShowDeleteDialog(false);
          }}
        />
      )}
    </div>
  );
};
