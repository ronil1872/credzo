import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import { useAuth } from '../../../hooks';
import {
  InsuranceLead,
  InsuranceLeadNote,
  InsuranceFollowUp,
  LeadStatus,
  FollowUpStatus,
} from '../../../types/database';
import '../crm.css';

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

export const InsuranceLeadDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();

  const [lead, setLead] = useState<InsuranceLead | null>(null);
  const [notes, setNotes] = useState<InsuranceLeadNote[]>([]);
  const [followUps, setFollowUps] = useState<InsuranceFollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Edit status
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus>('NEW');

  // Notes state
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // Follow-up state
  const [fuDate, setFuDate] = useState('');
  const [fuNote, setFuNote] = useState('');
  const [savingFu, setSavingFu] = useState(false);

  const fetchLeadFullData = useCallback(async () => {
    if (!id || !isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const [leadRes, notesRes, fuRes] = await Promise.all([
        supabase.from('insurance_leads').select('*').eq('id', id).maybeSingle(),
        supabase
          .from('insurance_lead_notes')
          .select('*')
          .eq('insurance_lead_id', id)
          .order('created_at', { ascending: false }),
        supabase
          .from('insurance_follow_ups')
          .select('*')
          .eq('insurance_lead_id', id)
          .order('scheduled_at', { ascending: true }),
      ]);

      if (leadRes.error) {
        console.error('[Credzo CRM] Error loading insurance lead:', leadRes.error);
        setErrorMsg('Failed to load insurance enquiry details.');
      } else if (leadRes.data) {
        const l = leadRes.data as InsuranceLead;
        setLead(l);
        setSelectedStatus(l.status as LeadStatus);
      } else {
        setLead(null);
      }

      setNotes((notesRes.data as InsuranceLeadNote[]) || []);
      setFollowUps((fuRes.data as InsuranceFollowUp[]) || []);
    } catch (err: unknown) {
      console.error('[Credzo CRM] Unexpected error loading lead detail:', err);
      setErrorMsg('Network error loading insurance lead.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchLeadFullData();
  }, [fetchLeadFullData]);

  // 1. Status Update Handler
  const handleSaveStatus = async () => {
    if (!lead || !id) return;
    setSavingStatus(true);
    setStatusMsg(null);

    try {
      const nowIso = new Date().toISOString();
      const { error } = await supabase
        .from('insurance_leads')
        .update({
          status: selectedStatus,
          updated_at: nowIso,
        })
        .eq('id', id);

      if (error) {
        console.error('[Credzo CRM] Status update error:', error);
        setStatusMsg('Error updating status.');
      } else {
        setLead((prev) => (prev ? { ...prev, status: selectedStatus, updated_at: nowIso } : prev));
        setStatusMsg('Status updated successfully.');
      }
    } catch (err) {
      console.error('[Credzo CRM] Unexpected error updating status:', err);
      setStatusMsg('Network error updating status.');
    } finally {
      setSavingStatus(false);
      setTimeout(() => setStatusMsg(null), 3500);
    }
  };

  // 2. Add Note Handler
  const handleAddNote = async () => {
    if (!newNote.trim() || !id || !lead) return;
    setSavingNote(true);

    try {
      const { data, error } = await supabase
        .from('insurance_lead_notes')
        .insert({
          insurance_lead_id: id,
          organization_id: lead.organization_id,
          author_id: profile?.id || null,
          note: newNote.trim(),
        })
        .select()
        .single();

      if (error) {
        console.error('[Credzo CRM] Error adding insurance note:', error);
      } else if (data) {
        setNotes((prev) => [data as InsuranceLeadNote, ...prev]);
        setNewNote('');
      }
    } catch (err) {
      console.error('[Credzo CRM] Unexpected note creation error:', err);
    } finally {
      setSavingNote(false);
    }
  };

  // 3. Schedule Follow-up Handler
  const handleAddFollowUp = async () => {
    if (!fuDate || !id || !lead) return;
    setSavingFu(true);

    try {
      const { data, error } = await supabase
        .from('insurance_follow_ups')
        .insert({
          insurance_lead_id: id,
          organization_id: lead.organization_id,
          assigned_to: profile?.id || null,
          scheduled_at: new Date(fuDate).toISOString(),
          note: fuNote.trim() || null,
          status: 'PENDING',
        })
        .select()
        .single();

      if (error) {
        console.error('[Credzo CRM] Error creating insurance follow-up:', error);
      } else if (data) {
        setFollowUps((prev) =>
          [...prev, data as InsuranceFollowUp].sort(
            (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
          )
        );
        setFuDate('');
        setFuNote('');
      }
    } catch (err) {
      console.error('[Credzo CRM] Unexpected follow-up error:', err);
    } finally {
      setSavingFu(false);
    }
  };

  // 4. Complete / Cancel Follow-up Handler
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
      console.error('[Credzo CRM] Error updating follow-up status:', err);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="crm-page-header">
          <div className="skeleton-bar" style={{ width: 250, height: 28, borderRadius: 8 }} />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton-row" style={{ height: 100, marginBottom: 12 }} />
        ))}
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="empty-state" style={{ marginTop: 'var(--space-12)' }}>
        <p className="empty-state-title">Insurance Enquiry Not Found</p>
        <p className="empty-state-desc">The requested lead does not exist or you do not have permission to view it.</p>
        <Link to="/admin/insurance" className="btn btn-primary btn-sm" style={{ marginTop: 'var(--space-3)' }}>
          ← Back to Insurance Leads
        </Link>
      </div>
    );
  }

  const hasUtm = Boolean(
    lead.utm_source || lead.utm_medium || lead.utm_campaign || lead.utm_content || lead.utm_term
  );

  return (
    <div>
      {/* Top Header & Actions */}
      <div className="crm-page-header">
        <div>
          <Link
            to="/admin/insurance"
            style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', fontWeight: 600 }}
          >
            ← All Insurance Leads
          </Link>
          <h1 className="crm-page-title" style={{ marginTop: 'var(--space-1)' }}>
            {lead.full_name}
          </h1>
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-1)', flexWrap: 'wrap' }}>
            <span className="lead-ref-pill">#{lead.id.slice(0, 8).toUpperCase()}</span>
            <span className={`status-badge ${lead.status}`}>{lead.status}</span>
            <span className="lead-type-badge">{lead.insurance_type}</span>
          </div>
        </div>

        {/* Quick Click-to-Call & WhatsApp Actions */}
        <div className="action-btn-row">
          <a href={`tel:+91${lead.mobile}`} className="action-btn call">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.49 12 19.79 19.79 0 0 1 1.44 3.41 2 2 0 0 1 3.44 1.24h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.65a16 16 0 0 0 6.29 6.29l.88-.87a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            Call +91 {lead.mobile}
          </a>
          <a
            href={`https://wa.me/91${lead.mobile}?text=${encodeURIComponent(
              `Hi ${lead.full_name}, this is Credzo Finance. We are following up regarding your ${lead.insurance_type} enquiry.`
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
      </div>

      {errorMsg && (
        <div className="form-alert-error" role="alert" style={{ marginBottom: 'var(--space-4)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
          </svg>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main 2-Column Layout */}
      <div className="lead-detail-container">
        {/* Left Column: Customer & Insurance Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {/* 1. Customer Information */}
          <div className="crm-card">
            <div className="crm-card-header">
              <span className="crm-card-title">1. Customer Information</span>
            </div>
            <div style={{ padding: 'var(--space-4) var(--space-5)' }}>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Full Name</span>
                  <span className="info-value font-bold">{lead.full_name}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Mobile Number</span>
                  <span className="info-value">
                    <a href={`tel:+91${lead.mobile}`} style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
                      +91 {lead.mobile}
                    </a>
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Email Address</span>
                  <span className="info-value">{lead.email || '—'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">City / Location</span>
                  <span className="info-value">{lead.city || '—'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Insurance Request & Callback Preference */}
          <div className="crm-card">
            <div className="crm-card-header">
              <span className="crm-card-title">2. Insurance Request & Callback</span>
            </div>
            <div style={{ padding: 'var(--space-4) var(--space-5)' }}>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Coverage Category</span>
                  <span className="info-value" style={{ color: 'var(--color-primary)', fontWeight: 700 }}>
                    {lead.insurance_type}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Preferred Callback Date</span>
                  <span className="info-value">{formatDate(lead.preferred_callback_date)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Preferred Time Slot</span>
                  <span className="info-value" style={{ textTransform: 'capitalize' }}>
                    {lead.preferred_callback_time || 'Morning'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Enquiry Received</span>
                  <span className="info-value">{formatDateTime(lead.created_at)}</span>
                </div>
              </div>

              {/* Customer Notes / Requirement Message */}
              <div style={{ marginTop: 'var(--space-4)', borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-3)' }}>
                <span className="info-label">Customer Specific Note / Requirement</span>
                <div
                  style={{
                    marginTop: 'var(--space-1)',
                    padding: 'var(--space-3) var(--space-4)',
                    background: 'var(--bg-muted)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--font-size-sm)',
                    lineHeight: 1.5,
                  }}
                >
                  {lead.message || 'No additional notes provided by customer.'}
                </div>
              </div>
            </div>
          </div>

          {/* 4. Internal Notes */}
          <div className="crm-card">
            <div className="crm-card-header">
              <span className="crm-card-title">4. Internal Notes</span>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                {notes.length} note{notes.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div
              style={{
                padding: 'var(--space-4) var(--space-5)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-4)',
              }}
            >
              {/* Add Note Form */}
              <div className="note-add-form">
                <textarea
                  className="note-textarea"
                  placeholder="Add an internal note about this insurance lead..."
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
                    {savingNote ? 'Saving...' : 'Add Note'}
                  </button>
                </div>
              </div>

              {/* Notes List */}
              {notes.length === 0 ? (
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', textAlign: 'center' }}>
                  No notes yet. Add the first note above.
                </p>
              ) : (
                <div className="notes-thread">
                  {notes.map((note) => (
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

          {/* 6. Consent & Compliance */}
          <div className="crm-card">
            <div className="crm-card-header">
              <span className="crm-card-title">6. Consent & Compliance</span>
            </div>
            <div style={{ padding: 'var(--space-4) var(--space-5)' }}>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Voluntary Consent</span>
                  <span className="info-value" style={{ color: 'var(--color-success)', fontWeight: 600 }}>
                    {lead.consent ? '✓ Affirmative Consent Recorded' : '✗ No Consent Recorded'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Consent Timestamp</span>
                  <span className="info-value">{formatDateTime(lead.consent_timestamp)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 7. Marketing Attribution */}
          {hasUtm && (
            <div className="crm-card">
              <div className="crm-card-header">
                <span className="crm-card-title">7. Marketing Attribution</span>
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
                  {lead.campaign && (
                    <span className="utm-pill">
                      <strong>Campaign:</strong> {lead.campaign}
                    </span>
                  )}
                  {lead.ad && (
                    <span className="utm-pill">
                      <strong>Ad Name:</strong> {lead.ad}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Status Updater, Follow-ups, and System Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {/* 3. Pipeline Status */}
          <div className="crm-card">
            <div className="crm-card-header">
              <span className="crm-card-title">3. Pipeline Status</span>
            </div>
            <div style={{ padding: 'var(--space-4) var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                <label className="info-label" htmlFor="ins-status-select">Current Status</label>
                <select
                  id="ins-status-select"
                  className="status-select"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as LeadStatus)}
                >
                  {ALL_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                className="btn btn-primary btn-sm btn-full-width"
                onClick={handleSaveStatus}
                disabled={savingStatus || selectedStatus === lead.status}
              >
                {savingStatus ? 'Saving...' : 'Update Status'}
              </button>

              {statusMsg && (
                <p
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    color: statusMsg.includes('Error') ? 'var(--color-danger)' : 'var(--color-success)',
                    textAlign: 'center',
                    fontWeight: 600,
                  }}
                >
                  {statusMsg}
                </p>
              )}
            </div>
          </div>

          {/* 5. Follow-ups */}
          <div className="crm-card">
            <div className="crm-card-header">
              <span className="crm-card-title">5. Follow-up Tasks</span>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                {followUps.filter((f) => f.status === 'PENDING').length} pending
              </span>
            </div>

            {/* List of existing follow-ups */}
            {followUps.length === 0 ? (
              <div style={{ padding: 'var(--space-4) var(--space-5)', fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                No follow-ups scheduled yet.
              </div>
            ) : (
              <div>
                {followUps.map((fu) => (
                  <div key={fu.id} className="followup-item">
                    <div className="followup-info">
                      <div className="followup-date">{formatDateTime(fu.scheduled_at)}</div>
                      {fu.note && <div className="followup-note-text">{fu.note}</div>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                      <span className={`followup-status-badge ${fu.status}`}>{fu.status}</span>
                      {fu.status === 'PENDING' && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            type="button"
                            style={{
                              fontSize: '0.625rem',
                              fontWeight: 700,
                              color: 'var(--color-success)',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                            }}
                            onClick={() => handleUpdateFollowUpStatus(fu.id, 'COMPLETED')}
                          >
                            Done ✓
                          </button>
                          <button
                            type="button"
                            style={{
                              fontSize: '0.625rem',
                              fontWeight: 700,
                              color: 'var(--color-danger)',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
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

            {/* Schedule New Follow-up */}
            <div
              style={{
                padding: 'var(--space-4) var(--space-5)',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-3)',
              }}
            >
              <p className="crm-section-title">Schedule Follow-up</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                <label className="info-label" htmlFor="ins-fu-date">Date & Time</label>
                <input
                  id="ins-fu-date"
                  type="datetime-local"
                  className="value-input"
                  value={fuDate}
                  onChange={(e) => setFuDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                <label className="info-label" htmlFor="ins-fu-note">Note / Purpose</label>
                <textarea
                  id="ins-fu-note"
                  className="note-textarea"
                  style={{ minHeight: 60 }}
                  placeholder="e.g. Call to discuss health insurance sum insured options..."
                  value={fuNote}
                  onChange={(e) => setFuNote(e.target.value)}
                />
              </div>
              <button
                type="button"
                className="btn btn-outline btn-sm btn-full-width"
                onClick={handleAddFollowUp}
                disabled={savingFu || !fuDate}
              >
                {savingFu ? 'Scheduling...' : 'Schedule Follow-up'}
              </button>
            </div>
          </div>

          {/* 8. System Information */}
          <div className="crm-card">
            <div className="crm-card-header">
              <span className="crm-card-title">8. System Information</span>
            </div>
            <div style={{ padding: 'var(--space-4) var(--space-5)' }}>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Record ID</span>
                  <span className="info-value font-mono" style={{ fontSize: '0.6875rem' }}>
                    {lead.id}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Created At</span>
                  <span className="info-value">{formatDateTime(lead.created_at)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Last Updated</span>
                  <span className="info-value">{formatDateTime(lead.updated_at)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
