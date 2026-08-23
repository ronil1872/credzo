import React, { useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import { formatIndianCurrency } from '../../../lib/calculator';
import { Lead, LeadStatus, LeadScore } from '../../../types/database';
import { LeadDetailModal } from '../components/LeadDetailModal';
import '../crm.css';

const PAGE_SIZE = 20;

const LOAN_TYPE_LABELS: Record<string, string> = {
  personal: 'Personal',
  home: 'Home',
  car: 'Car',
  business: 'Business',
  education: 'Education',
  gold: 'Gold',
  lap: 'LAP',
  other: 'Other',
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

export const LeadsPage: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [tempFilter, setTempFilter] = useState<string>('');
  const [loanTypeFilter, setLoanTypeFilter] = useState<string>('');

  // Sorting
  const [sortCol, setSortCol] = useState<'created_at' | 'requested_amount' | 'name'>('created_at');
  const [sortAsc, setSortAsc] = useState(false);

  // Selected lead for modal view
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  const fetchLeads = useCallback(async (isManualRefresh = false) => {
    if (!isSupabaseConfigured()) {
      setErrorMsg('Supabase credentials not configured.');
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
      let query = supabase
        .from('leads')
        .select('*', { count: 'exact' })
        .order(sortCol, { ascending: sortAsc })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

      if (statusFilter) query = query.eq('status', statusFilter as LeadStatus);
      if (tempFilter) query = query.eq('lead_score', tempFilter as LeadScore);
      if (loanTypeFilter) query = query.eq('loan_type', loanTypeFilter);
      if (search.trim()) {
        const s = search.trim();
        query = query.or(`name.ilike.%${s}%,mobile.ilike.%${s}%,city.ilike.%${s}%`);
      }

      const { data, count, error } = await query;
      if (error) {
        console.error('[Credzo CRM] Leads fetch error:', error);
        setErrorMsg(`Failed to load leads: ${error.message}`);
      } else if (data) {
        setLeads(data as Lead[]);
        setTotal(count ?? 0);
      }
    } catch (err) {
      console.error('[Credzo CRM] Unexpected leads fetch error:', err);
      setErrorMsg('Unexpected network error occurred while querying leads.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, statusFilter, tempFilter, loanTypeFilter, sortCol, sortAsc, page]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleSort = (col: typeof sortCol) => {
    if (col === sortCol) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(col);
      setSortAsc(false);
    }
    setPage(0);
  };

  const handleLeadUpdated = (updated: Lead) => {
    setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
  };

  const handleLeadDeleted = (deletedId: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== deletedId));
    setTotal((prev) => Math.max(0, prev - 1));
    fetchLeads();
  };

  const SortIcon = ({ col }: { col: typeof sortCol }) =>
    sortCol === col ? (sortAsc ? ' ↑' : ' ↓') : ' ↕';

  return (
    <div>
      {/* Header */}
      <div className="crm-page-header">
        <div>
          <h1 className="crm-page-title">Lead Management</h1>
          <p className="crm-page-subtitle">
            {total} total loan enquiries in pipeline • View, filter, assign, and manage status
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <button
            type="button"
            className={`crm-refresh-btn ${refreshing ? 'spinning' : ''}`}
            onClick={() => fetchLeads(true)}
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

      {/* Leads Management Card */}
      <div className="crm-card">
        {/* Filters Toolbar */}
        <div className="crm-filters-bar">
          <input
            type="search"
            className="crm-search-input"
            placeholder="Search by applicant name, mobile number, or city..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
          />
          <select
            className="crm-select"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
          >
            <option value="">All Statuses</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            className="crm-select"
            value={tempFilter}
            onChange={(e) => {
              setTempFilter(e.target.value);
              setPage(0);
            }}
          >
            <option value="">All Priorities</option>
            {(['HOT', 'WARM', 'COLD'] as LeadScore[]).map((t) => (
              <option key={t} value={t}>
                {t === 'HOT' ? '🔥 Hot' : t === 'WARM' ? '🌡️ Warm' : '❄️ Cold'}
              </option>
            ))}
          </select>
          <select
            className="crm-select"
            value={loanTypeFilter}
            onChange={(e) => {
              setLoanTypeFilter(e.target.value);
              setPage(0);
            }}
          >
            <option value="">All Loan Types</option>
            {Object.entries(LOAN_TYPE_LABELS).map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Desktop & Tablet Table */}
        <div className="leads-table-wrapper">
          <table className="leads-table">
            <thead>
              <tr>
                <th
                  className={`sortable ${sortCol === 'created_at' ? 'th-active' : ''}`}
                  onClick={() => handleSort('created_at')}
                >
                  Received <span className="sort-icon"><SortIcon col="created_at" /></span>
                </th>
                <th
                  className={`sortable ${sortCol === 'name' ? 'th-active' : ''}`}
                  onClick={() => handleSort('name')}
                >
                  Applicant <span className="sort-icon"><SortIcon col="name" /></span>
                </th>
                <th>Mobile</th>
                <th>City</th>
                <th>Loan Type</th>
                <th
                  className={`sortable ${sortCol === 'requested_amount' ? 'th-active' : ''}`}
                  onClick={() => handleSort('requested_amount')}
                >
                  Amount <span className="sort-icon"><SortIcon col="requested_amount" /></span>
                </th>
                <th>Employment</th>
                <th>Callback Schedule</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 11 }).map((_, j) => (
                      <td key={j}>
                        <div className="skeleton-bar" style={{ width: '80%', height: 14 }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : leads.length === 0 ? (
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
                      <p className="empty-state-title">No leads found</p>
                      <p className="empty-state-desc">
                        {search || statusFilter || tempFilter || loanTypeFilter
                          ? 'Try modifying or clearing your filters.'
                          : 'Customer submissions will appear here automatically.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr
                    key={lead.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedLeadId(lead.id)}
                  >
                    <td className="lead-date-cell">{formatDateTime(lead.created_at)}</td>
                    <td>
                      <div className="lead-name-cell">{lead.name}</div>
                      <span className="lead-ref-pill">#{lead.id.slice(0, 8).toUpperCase()}</span>
                    </td>
                    <td className="lead-mobile-cell" onClick={(e) => e.stopPropagation()}>
                      <a
                        href={`tel:+91${lead.mobile}`}
                        style={{ color: 'inherit', textDecoration: 'none' }}
                      >
                        +91 {lead.mobile}
                      </a>
                    </td>
                    <td>{lead.city || '—'}</td>
                    <td>
                      <span style={{ fontWeight: 600 }}>
                        {LOAN_TYPE_LABELS[lead.loan_type] || lead.loan_type}
                      </span>
                    </td>
                    <td className="lead-amount-cell">
                      {formatIndianCurrency(lead.requested_amount)}
                    </td>
                    <td>
                      {lead.employment_type
                        ? lead.employment_type.charAt(0).toUpperCase() +
                          lead.employment_type.slice(1).replace('_', ' ')
                        : '—'}
                    </td>
                    <td>
                      <div style={{ fontSize: 'var(--font-size-xs)' }}>
                        {formatDate(lead.preferred_callback_date)}
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                        {lead.preferred_callback_time || 'Morning'}
                      </div>
                    </td>
                    <td>
                      <span className={`temp-badge ${lead.lead_score}`}>
                        {lead.lead_score === 'HOT'
                          ? '🔥'
                          : lead.lead_score === 'WARM'
                          ? '🌡️'
                          : '❄️'}{' '}
                        {lead.lead_score}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${lead.status}`}>{lead.status}</span>
                    </td>
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
          ) : leads.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state-title">No leads found</p>
            </div>
          ) : (
            leads.map((lead) => (
              <div
                key={lead.id}
                className="lead-mobile-card"
                onClick={() => setSelectedLeadId(lead.id)}
              >
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
                    <div style={{ fontWeight: 600 }}>
                      {formatDate(lead.preferred_callback_date)}
                    </div>
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

        {/* Pagination Bar */}
        <div className="pagination-bar">
          <span>
            Showing {total === 0 ? 0 : page * PAGE_SIZE + 1}–
            {Math.min((page + 1) * PAGE_SIZE, total)} of {total} leads
          </span>
          <div className="pagination-controls">
            <button
              type="button"
              className="pagination-btn"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              ← Prev
            </button>
            <button
              type="button"
              className="pagination-btn"
              onClick={() => setPage((p) => p + 1)}
              disabled={(page + 1) * PAGE_SIZE >= total}
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      {/* Modal View for In-place Inspection & Quick Updates */}
      <LeadDetailModal
        leadId={selectedLeadId}
        onClose={() => setSelectedLeadId(null)}
        onLeadUpdated={handleLeadUpdated}
        onLeadDeleted={handleLeadDeleted}
      />
    </div>
  );
};
