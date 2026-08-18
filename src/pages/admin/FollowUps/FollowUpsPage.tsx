import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import '../crm.css';

interface FollowUpWithLead {
  id: string;
  lead_id: string;
  scheduled_at: string;
  completed_at: string | null;
  note: string | null;
  status: string;
  lead_name?: string;
  lead_mobile?: string;
  loan_type?: string;
}

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });

export const FollowUpsPage: React.FC = () => {
  const [followUps, setFollowUps] = useState<FollowUpWithLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'PENDING' | 'COMPLETED' | 'ALL'>('PENDING');

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    const fetch = async () => {
      setLoading(true);
      try {
        // Fetch follow_ups with lead data joined
        let query = supabase
          .from('follow_ups')
          .select(`
            id, lead_id, scheduled_at, completed_at, note, status,
            leads(name, mobile, loan_type)
          `)
          .order('scheduled_at', { ascending: true });

        if (filter !== 'ALL') {
          query = query.eq('status', filter);
        }

        const { data, error } = await query;
        if (!error && data) {
          const mapped: FollowUpWithLead[] = data.map((fu: any) => ({
            id: fu.id,
            lead_id: fu.lead_id,
            scheduled_at: fu.scheduled_at,
            completed_at: fu.completed_at,
            note: fu.note,
            status: fu.status,
            lead_name: fu.leads?.name,
            lead_mobile: fu.leads?.mobile,
            loan_type: fu.leads?.loan_type,
          }));
          setFollowUps(mapped);
        }
      } catch (err) {
        console.error('[Credzo CRM] Follow-ups fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [filter]);

  const handleComplete = async (id: string) => {
    await supabase
      .from('follow_ups')
      .update({ status: 'COMPLETED', completed_at: new Date().toISOString() })
      .eq('id', id);
    setFollowUps(prev =>
      prev.map(fu => fu.id === id
        ? { ...fu, status: 'COMPLETED', completed_at: new Date().toISOString() }
        : fu
      ).filter(fu => filter === 'ALL' || fu.status === filter)
    );
  };

  const isOverdue = (scheduled_at: string, status: string) =>
    status === 'PENDING' && new Date(scheduled_at) < new Date();

  return (
    <div>
      <div className="crm-page-header">
        <div>
          <h1 className="crm-page-title">Follow-up Agenda</h1>
          <p className="crm-page-subtitle">Scheduled customer callbacks and pending tasks</p>
        </div>
      </div>

      <div className="crm-card">
        <div className="crm-filters-bar">
          {(['PENDING', 'COMPLETED', 'ALL'] as const).map(f => (
            <button
              key={f}
              className={`pagination-btn ${filter === f ? 'active' : ''}`}
              style={filter === f ? {
                background: 'var(--color-primary-light)',
                borderColor: 'var(--color-primary)',
                color: 'var(--color-primary)',
              } : {}}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton-row" style={{ padding: 'var(--space-4) var(--space-5)' }}>
              <div className="skeleton-bar" style={{ flex: 1 }} />
              <div className="skeleton-bar" style={{ width: 80 }} />
            </div>
          ))
        ) : followUps.length === 0 ? (
          <div className="empty-state">
            <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
              <polyline points="9 16 11 18 15 14" />
            </svg>
            <p className="empty-state-title">
              {filter === 'PENDING' ? 'No pending follow-ups' : filter === 'COMPLETED' ? 'No completed follow-ups' : 'No follow-ups found'}
            </p>
            <p className="empty-state-desc">
              Schedule follow-ups from any Lead Detail page.
            </p>
          </div>
        ) : (
          followUps.map(fu => (
            <div key={fu.id} className="followup-item">
              <div className="followup-info" style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                  {isOverdue(fu.scheduled_at, fu.status) && (
                    <span style={{ fontSize: '0.625rem', fontWeight: 700, color: '#b91c1c', background: '#fee2e2', padding: '1px 6px', borderRadius: 999 }}>
                      OVERDUE
                    </span>
                  )}
                  <span className="followup-date">{formatDateTime(fu.scheduled_at)}</span>
                </div>
                {fu.lead_name && (
                  <Link to={`/admin/leads/${fu.lead_id}`} style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)', textDecoration: 'none' }}>
                    {fu.lead_name}
                  </Link>
                )}
                {fu.lead_mobile && (
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    +91 {fu.lead_mobile}
                    {fu.loan_type && ` · ${fu.loan_type.charAt(0).toUpperCase() + fu.loan_type.slice(1)} Loan`}
                  </div>
                )}
                {fu.note && <div className="followup-note-text" style={{ marginTop: 4 }}>{fu.note}</div>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end', flexShrink: 0 }}>
                <span className={`followup-status-badge ${fu.status}`}>{fu.status}</span>
                {fu.status === 'PENDING' && (
                  <button
                    style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--color-success)', background: 'none', border: 'none', cursor: 'pointer' }}
                    onClick={() => handleComplete(fu.id)}
                  >
                    Mark Done ✓
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
