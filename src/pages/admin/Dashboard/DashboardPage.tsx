import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import { formatIndianCurrency } from '../../../lib/calculator';
import { Lead, LeadStatus } from '../../../types/database';
import '../crm.css';

interface DashboardStats {
  total: number;
  today: number;
  new: number;
  hot: number;
  warm: number;
  cold: number;
  callbacksScheduled: number;
  applications: number;
  approved: number;
  disbursed: number;
  potentialValue: number;
}

const EMPTY_STATS: DashboardStats = {
  total: 0, today: 0, new: 0, hot: 0, warm: 0, cold: 0,
  callbacksScheduled: 0, applications: 0, approved: 0, disbursed: 0, potentialValue: 0,
};

const todayStr = () => new Date().toISOString().slice(0, 10);

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [agenda, setAgenda] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    const fetchDashboard = async () => {
      setLoading(true);
      try {
        // Fetch all leads
        const { data: leads } = await supabase
          .from('leads')
          .select('*')
          .order('created_at', { ascending: false });

        if (leads) {
          const today = todayStr();
          const active = (status: LeadStatus) =>
            !(['LOST', 'DISBURSED'] as LeadStatus[]).includes(status);

          const s: DashboardStats = {
            total: leads.length,
            today: leads.filter(l => l.created_at.startsWith(today)).length,
            new: leads.filter(l => l.status === 'NEW').length,
            hot: leads.filter(l => l.lead_score === 'HOT').length,
            warm: leads.filter(l => l.lead_score === 'WARM').length,
            cold: leads.filter(l => l.lead_score === 'COLD').length,
            callbacksScheduled: leads.filter(l =>
              l.preferred_callback_date && l.preferred_callback_date >= today
            ).length,
            applications: leads.filter(l => l.status === 'APPLICATION').length,
            approved: leads.filter(l => l.status === 'APPROVED').length,
            disbursed: leads.filter(l => l.status === 'DISBURSED').length,
            potentialValue: leads
              .filter(l => active(l.status))
              .reduce((sum, l) => sum + (l.requested_amount || 0), 0),
          };
          setStats(s);

          // Today's callback agenda
          const todayAgenda = leads.filter(
            l => l.preferred_callback_date === today &&
                 l.status !== 'LOST' && l.status !== 'DISBURSED'
          );
          setAgenda(todayAgenda);
        }
      } catch (err) {
        console.error('[Credzo CRM] Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const fmtCr = (n: number) => {
    if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(1)}Cr`;
    if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(1)}L`;
    return formatIndianCurrency(n);
  };

  const SkeletonCards = () => (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="stat-card skeleton-row" style={{ height: 90 }} />
      ))}
    </>
  );

  return (
    <div>
      <div className="crm-page-header">
        <div>
          <h1 className="crm-page-title">CRM Dashboard</h1>
          <p className="crm-page-subtitle">
            Sales pipeline overview — {new Date().toLocaleDateString('en-IN', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            })}
          </p>
        </div>
        <Link to="/admin/leads" className="btn btn-primary btn-sm">
          View All Leads →
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="crm-stats-grid">
        {loading ? (
          <SkeletonCards />
        ) : (
          <>
            <div className="stat-card stat-primary">
              <span className="stat-label">Total Leads</span>
              <span className="stat-value primary">{stats.total}</span>
              <span className="stat-sub">{stats.today} received today</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">New Enquiries</span>
              <span className="stat-value">{stats.new}</span>
              <span className="stat-sub">Awaiting first contact</span>
            </div>
            <div className="stat-card stat-hot">
              <span className="stat-label">🔥 Hot Leads</span>
              <span className="stat-value hot">{stats.hot}</span>
              <span className="stat-sub">High priority follow-up</span>
            </div>
            <div className="stat-card stat-warm">
              <span className="stat-label">🌡️ Warm Leads</span>
              <span className="stat-value warm">{stats.warm}</span>
              <span className="stat-sub">Moderate engagement</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Callbacks Scheduled</span>
              <span className="stat-value">{stats.callbacksScheduled}</span>
              <span className="stat-sub">Active callback requests</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Applications</span>
              <span className="stat-value">{stats.applications}</span>
              <span className="stat-sub">Docs & processing</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Approved</span>
              <span className="stat-value">{stats.approved}</span>
              <span className="stat-sub">Pending disbursement</span>
            </div>
            <div className="stat-card stat-primary">
              <span className="stat-label">Pipeline Value</span>
              <span className="stat-value primary">{fmtCr(stats.potentialValue)}</span>
              <span className="stat-sub">Active enquiry potential</span>
            </div>
          </>
        )}
      </div>

      {/* Today's Callback Agenda */}
      <div className="crm-card">
        <div className="crm-card-header">
          <span className="crm-card-title">📅 Today's Callback Agenda</span>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
            {agenda.length} scheduled
          </span>
        </div>
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton-row">
              <div className="skeleton-bar" style={{ flex: 1 }} />
              <div className="skeleton-bar" style={{ width: 80 }} />
            </div>
          ))
        ) : agenda.length === 0 ? (
          <div className="empty-state">
            <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <p className="empty-state-title">No callbacks scheduled for today</p>
            <p className="empty-state-desc">Leads with a callback request for today will appear here.</p>
          </div>
        ) : (
          <div className="agenda-list">
            {agenda.map((lead) => (
              <Link key={lead.id} to={`/admin/leads/${lead.id}`} className="agenda-item">
                <div>
                  <div className="agenda-name">{lead.name}</div>
                  <div className="agenda-loan">
                    {lead.loan_type.charAt(0).toUpperCase() + lead.loan_type.slice(1)} Loan —{' '}
                    {formatIndianCurrency(lead.requested_amount)}
                  </div>
                </div>
                <div className="agenda-time">
                  {lead.preferred_callback_time
                    ? lead.preferred_callback_time.charAt(0).toUpperCase() +
                      lead.preferred_callback_time.slice(1)
                    : 'Anytime'}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
