import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import { formatIndianCurrency } from '../../../lib/calculator';
import { Lead, LeadStatus } from '../../../types/database';
import { LeadDetailModal } from '../components/LeadDetailModal';
import '../crm.css';

interface DashboardStats {
  total: number;
  today: number;
  newPending: number;
  totalRequestedAmount: number;
  hot: number;
  warm: number;
  callbacksScheduled: number;
  applications: number;
  approved: number;
  disbursed: number;
}

const EMPTY_STATS: DashboardStats = {
  total: 0,
  today: 0,
  newPending: 0,
  totalRequestedAmount: 0,
  hot: 0,
  warm: 0,
  callbacksScheduled: 0,
  applications: 0,
  approved: 0,
  disbursed: 0,
};

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

const todayStr = () => new Date().toISOString().slice(0, 10);

const formatDateTime = (iso: string) => {
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

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Search & Filter state for Recent Leads Table
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loanTypeFilter, setLoanTypeFilter] = useState<string>('');

  // Selected lead for Modal detail view
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async (isManualRefresh = false) => {
    if (!isSupabaseConfigured()) {
      setErrorMsg('Supabase credentials are not configured.');
      setLoading(false);
      return;
    }

    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setErrorMsg(null);

    try {
      // Query all leads directly from Supabase public.leads, newest first
      const { data: leads, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Credzo CRM] Error querying leads:', error);
        setErrorMsg(`Failed to load leads: ${error.message}`);
        return;
      }

      if (leads) {
        const leadList = leads as Lead[];
        setAllLeads(leadList);

        const today = todayStr();

        // Calculate aggregate statistics
        const calculatedStats: DashboardStats = {
          total: leadList.length,
          today: leadList.filter((l) => l.created_at && l.created_at.startsWith(today)).length,
          newPending: leadList.filter((l) => l.status === 'NEW').length,
          totalRequestedAmount: leadList.reduce((sum, l) => sum + (Number(l.requested_amount) || 0), 0),
          hot: leadList.filter((l) => l.lead_score === 'HOT').length,
          warm: leadList.filter((l) => l.lead_score === 'WARM').length,
          callbacksScheduled: leadList.filter(
            (l) => l.preferred_callback_date && l.preferred_callback_date >= today
          ).length,
          applications: leadList.filter((l) => l.status === 'APPLICATION').length,
          approved: leadList.filter((l) => l.status === 'APPROVED').length,
          disbursed: leadList.filter((l) => l.status === 'DISBURSED').length,
        };

        setStats(calculatedStats);
      }
    } catch (err: unknown) {
      console.error('[Credzo CRM] Unexpected dashboard fetch error:', err);
      setErrorMsg('Unexpected network error occurred while loading lead data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Handle lead updates from Modal
  const handleLeadUpdated = (updated: Lead) => {
    setAllLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
  };

  // Handle lead deletion from Modal
  const handleLeadDeleted = (deletedId: string) => {
    setAllLeads((prev) => prev.filter((l) => l.id !== deletedId));
    fetchDashboardData();
  };

  // Filter recent leads table
  const filteredRecentLeads = allLeads.filter((lead) => {
    if (statusFilter && lead.status !== statusFilter) return false;
    if (loanTypeFilter && lead.loan_type !== loanTypeFilter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const matchName = lead.name?.toLowerCase().includes(q);
      const matchMobile = lead.mobile?.includes(q);
      const matchCity = lead.city?.toLowerCase().includes(q);
      const matchType = lead.loan_type?.toLowerCase().includes(q);
      if (!matchName && !matchMobile && !matchCity && !matchType) return false;
    }
    return true;
  });

  const fmtCurrencyCompact = (num: number) => {
    if (num >= 1_00_00_000) return `₹${(num / 1_00_00_000).toFixed(2)} Cr`;
    if (num >= 1_00_000) return `₹${(num / 1_00_000).toFixed(2)} Lakh`;
    return formatIndianCurrency(num);
  };

  return (
    <div>
      {/* Top Header */}
      <div className="crm-page-header">
        <div>
          <h1 className="crm-page-title">Executive Lead Dashboard</h1>
          <p className="crm-page-subtitle">
            Real-time loan enquiries & pipeline summary — {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <button
            type="button"
            className={`crm-refresh-btn ${refreshing ? 'spinning' : ''}`}
            onClick={() => fetchDashboardData(true)}
            disabled={loading || refreshing}
            title="Refresh database records"
          >
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.19" />
            </svg>
            <span>{refreshing ? 'Updating...' : 'Refresh'}</span>
          </button>

          <Link to="/admin/leads" className="btn btn-primary btn-sm">
            Manage All Leads →
          </Link>
        </div>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="form-alert-error" style={{ marginBottom: 'var(--space-6)' }} role="alert">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Primary KPI Metrics Grid */}
      <div className="crm-stats-grid">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="stat-card skeleton-row" style={{ height: 100 }} />
          ))
        ) : (
          <>
            {/* 1. Total Leads */}
            <div className="stat-card stat-primary">
              <span className="stat-label">Total Leads</span>
              <span className="stat-value primary">{stats.total}</span>
              <span className="stat-sub">Lifetime registered customer enquiries</span>
            </div>

            {/* 2. Leads Today */}
            <div className="stat-card">
              <span className="stat-label">Leads Today</span>
              <span className="stat-value" style={{ color: '#047857' }}>
                {stats.today}
              </span>
              <span className="stat-sub">New submissions in the last 24 hours</span>
            </div>

            {/* 3. New/Pending Leads */}
            <div className="stat-card stat-warm">
              <span className="stat-label">New / Pending</span>
              <span className="stat-value warm">{stats.newPending}</span>
              <span className="stat-sub">Awaiting initial advisor callback</span>
            </div>

            {/* 4. Total Requested Loan Amount */}
            <div className="stat-card stat-primary">
              <span className="stat-label">Total Requested Value</span>
              <span className="stat-value primary">{fmtCurrencyCompact(stats.totalRequestedAmount)}</span>
              <span className="stat-sub">Combined financing demand in pipeline</span>
            </div>
          </>
        )}
      </div>

      {/* Secondary Highlights Row */}
      {!loading && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 'var(--space-3)',
            marginBottom: 'var(--space-6)',
          }}
        >
          <div className="stat-card" style={{ padding: 'var(--space-3) var(--space-4)' }}>
            <span className="stat-label">🔥 Hot Enquiries</span>
            <span className="stat-value hot" style={{ fontSize: 'var(--font-size-xl)' }}>
              {stats.hot}
            </span>
          </div>
          <div className="stat-card" style={{ padding: 'var(--space-3) var(--space-4)' }}>
            <span className="stat-label">📅 Callbacks Scheduled</span>
            <span className="stat-value" style={{ fontSize: 'var(--font-size-xl)' }}>
              {stats.callbacksScheduled}
            </span>
          </div>
          <div className="stat-card" style={{ padding: 'var(--space-3) var(--space-4)' }}>
            <span className="stat-label">📄 In Application</span>
            <span className="stat-value" style={{ fontSize: 'var(--font-size-xl)' }}>
              {stats.applications}
            </span>
          </div>
          <div className="stat-card" style={{ padding: 'var(--space-3) var(--space-4)' }}>
            <span className="stat-label">✅ Disbursed Loans</span>
            <span className="stat-value" style={{ fontSize: 'var(--font-size-xl)', color: '#047857' }}>
              {stats.disbursed}
            </span>
          </div>
        </div>
      )}

      {/* Recent Leads Table Card */}
      <div className="crm-card">
        <div className="crm-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <span className="crm-card-title">Recent Customer Leads</span>
            <span
              style={{
                fontSize: 'var(--font-size-xs)',
                fontWeight: 700,
                color: 'var(--color-primary)',
                background: 'var(--color-primary-light)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
              }}
            >
              {filteredRecentLeads.length} records
            </span>
          </div>

          <Link
            to="/admin/leads"
            style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-primary)' }}
          >
            View Full Table with Pagination →
          </Link>
        </div>

        {/* Filter / Search Toolbar */}
        <div className="crm-filters-bar">
          <input
            type="search"
            className="crm-search-input"
            placeholder="Search by name, mobile, or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="crm-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            {(
              [
                'NEW',
                'CONTACTED',
                'INTERESTED',
                'DOCUMENTS',
                'APPLICATION',
                'APPROVED',
                'DISBURSED',
                'LOST',
              ] as LeadStatus[]
            ).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            className="crm-select"
            value={loanTypeFilter}
            onChange={(e) => setLoanTypeFilter(e.target.value)}
          >
            <option value="">All Loan Types</option>
            {Object.entries(LOAN_TYPE_LABELS).map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Desktop & Tablet Table View */}
        <div className="leads-table-wrapper">
          <table className="leads-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Name</th>
                <th>Mobile</th>
                <th>City</th>
                <th>Loan Type</th>
                <th>Requested Amount</th>
                <th>Employment</th>
                <th>Callback Date</th>
                <th>Callback Slot</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 11 }).map((_, j) => (
                      <td key={j}>
                        <div className="skeleton-bar" style={{ width: '85%', height: 14 }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredRecentLeads.length === 0 ? (
                <tr>
                  <td colSpan={11}>
                    <div className="empty-state">
                      <svg
                        className="empty-state-icon"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      <p className="empty-state-title">No leads matching criteria</p>
                      <p className="empty-state-desc">
                        {search || statusFilter || loanTypeFilter
                          ? 'Try clearing the search or filters.'
                          : 'New lead submissions from the public loan calculator will appear here immediately.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecentLeads.slice(0, 15).map((lead) => (
                  <tr key={lead.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedLeadId(lead.id)}>
                    {/* 1. Date */}
                    <td className="lead-date-cell">{formatDateTime(lead.created_at)}</td>

                    {/* 2. Name */}
                    <td>
                      <div className="lead-name-cell">{lead.name}</div>
                      <span className="lead-ref-pill">#{lead.id.slice(0, 8).toUpperCase()}</span>
                    </td>

                    {/* 3. Mobile */}
                    <td className="lead-mobile-cell" onClick={(e) => e.stopPropagation()}>
                      <a href={`tel:+91${lead.mobile}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                        +91 {lead.mobile}
                      </a>
                    </td>

                    {/* 4. City */}
                    <td>{lead.city || '—'}</td>

                    {/* 5. Loan Type */}
                    <td>
                      <span style={{ fontWeight: 600 }}>
                        {LOAN_TYPE_LABELS[lead.loan_type] || lead.loan_type}
                      </span>
                    </td>

                    {/* 6. Requested Amount */}
                    <td className="lead-amount-cell">
                      {formatIndianCurrency(lead.requested_amount)}
                    </td>

                    {/* 7. Employment Type */}
                    <td>
                      {lead.employment_type
                        ? lead.employment_type.charAt(0).toUpperCase() +
                          lead.employment_type.slice(1).replace('_', ' ')
                        : '—'}
                    </td>

                    {/* 8. Preferred Callback Date */}
                    <td>{formatDate(lead.preferred_callback_date)}</td>

                    {/* 9. Preferred Callback Time */}
                    <td>
                      {lead.preferred_callback_time
                        ? lead.preferred_callback_time.charAt(0).toUpperCase() +
                          lead.preferred_callback_time.slice(1)
                        : 'Morning'}
                    </td>

                    {/* 10. Status */}
                    <td>
                      <span className={`status-badge ${lead.status}`}>{lead.status}</span>
                    </td>

                    {/* 11. Actions */}
                    <td onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="view-lead-btn"
                        onClick={() => setSelectedLeadId(lead.id)}
                      >
                        View Details →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="leads-mobile-list">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="lead-mobile-card">
                <div className="skeleton-row" style={{ height: 40 }} />
                <div className="skeleton-row" style={{ height: 60 }} />
              </div>
            ))
          ) : filteredRecentLeads.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state-title">No leads found</p>
            </div>
          ) : (
            filteredRecentLeads.slice(0, 15).map((lead) => (
              <div key={lead.id} className="lead-mobile-card" onClick={() => setSelectedLeadId(lead.id)}>
                <div className="lead-mobile-header">
                  <div>
                    <div className="lead-mobile-applicant">{lead.name}</div>
                    <div className="lead-mobile-city">
                      {lead.city ? `${lead.city} • ` : ''}+91 {lead.mobile}
                    </div>
                  </div>
                  <span className={`status-badge ${lead.status}`}>{lead.status}</span>
                </div>

                <div className="lead-mobile-details">
                  <div>
                    <span className="info-label">Requirement</span>
                    <div style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                      {formatIndianCurrency(lead.requested_amount)}
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                      {LOAN_TYPE_LABELS[lead.loan_type] || lead.loan_type}
                    </div>
                  </div>
                  <div>
                    <span className="info-label">Callback</span>
                    <div style={{ fontWeight: 600 }}>{formatDate(lead.preferred_callback_date)}</div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                      {lead.preferred_callback_time || 'Morning'}
                    </div>
                  </div>
                </div>

                <div className="lead-mobile-actions" onClick={(e) => e.stopPropagation()}>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                    {formatDateTime(lead.created_at)}
                  </span>
                  <button
                    type="button"
                    className="btn btn-primary btn-xs"
                    onClick={() => setSelectedLeadId(lead.id)}
                  >
                    View Details →
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Lead Detail Quick Modal */}
      <LeadDetailModal
        leadId={selectedLeadId}
        onClose={() => setSelectedLeadId(null)}
        onLeadUpdated={handleLeadUpdated}
        onLeadDeleted={handleLeadDeleted}
      />
    </div>
  );
};
