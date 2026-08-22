import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import { InsuranceLead, LeadStatus } from '../../../types/database';
import { InsuranceLeadDetailModal } from '../components/InsuranceLeadDetailModal';
import '../crm.css';

const PAGE_SIZE = 20;

const ALL_STATUSES: LeadStatus[] = [
  'NEW',
  'CONTACTED',
  'INTERESTED',
  'LOST',
];

const STANDARD_INSURANCE_TYPES = [
  'Health Insurance',
  'Life Insurance',
  'Term Insurance',
  'Motor Insurance',
  'Other Insurance',
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

interface InsuranceStats {
  total: number;
  newCount: number;
  contactedCount: number;
  interestedCount: number;
  lostCount: number;
}

export const InsuranceLeadsPage: React.FC = () => {
  const [leads, setLeads] = useState<InsuranceLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Aggregated Pipeline Stats
  const [stats, setStats] = useState<InsuranceStats>({
    total: 0,
    newCount: 0,
    contactedCount: 0,
    interestedCount: 0,
    lostCount: 0,
  });

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [insuranceTypeFilter, setInsuranceTypeFilter] = useState<string>('');

  // Available insurance types derived from data + standard types
  const [availableTypes, setAvailableTypes] = useState<string[]>(STANDARD_INSURANCE_TYPES);

  // Sorting
  const [sortCol, setSortCol] = useState<'created_at' | 'full_name' | 'insurance_type' | 'status'>('created_at');
  const [sortAsc, setSortAsc] = useState(false);

  // Selected lead for modal view
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  // Fetch summary counts for the statistics cards
  const fetchStats = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('insurance_leads')
        .select('status, insurance_type');

      if (!error && data) {
        const rows = data as { status: string; insurance_type: string }[];
        const counts: InsuranceStats = {
          total: rows.length,
          newCount: rows.filter((r) => r.status === 'NEW').length,
          contactedCount: rows.filter((r) => r.status === 'CONTACTED').length,
          interestedCount: rows.filter((r) => r.status === 'INTERESTED').length,
          lostCount: rows.filter((r) => r.status === 'LOST').length,
        };
        setStats(counts);

        // Dynamically merge any unique types found in existing database records
        const uniqueTypes = Array.from(
          new Set([...STANDARD_INSURANCE_TYPES, ...rows.map((r) => r.insurance_type).filter(Boolean)])
        );
        setAvailableTypes(uniqueTypes);
      }
    } catch (err) {
      console.warn('[Credzo CRM] Failed to fetch insurance stats:', err);
    }
  }, []);

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
        .from('insurance_leads')
        .select('*', { count: 'exact' })
        .order(sortCol, { ascending: sortAsc })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

      if (statusFilter) {
        query = query.eq('status', statusFilter as LeadStatus);
      }
      if (insuranceTypeFilter) {
        query = query.eq('insurance_type', insuranceTypeFilter);
      }
      if (search.trim()) {
        const s = search.trim();
        query = query.or(
          `full_name.ilike.%${s}%,mobile.ilike.%${s}%,city.ilike.%${s}%,insurance_type.ilike.%${s}%`
        );
      }

      const { data, count, error } = await query;
      if (error) {
        console.error('[Credzo CRM] Insurance leads fetch error:', error);
        setErrorMsg(`Failed to load insurance leads: ${error.message}`);
      } else if (data) {
        setLeads(data as InsuranceLead[]);
        setTotal(count ?? 0);
      }
    } catch (err) {
      console.error('[Credzo CRM] Unexpected insurance leads fetch error:', err);
      setErrorMsg('Unexpected network error occurred while querying insurance leads.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, statusFilter, insuranceTypeFilter, sortCol, sortAsc, page]);

  useEffect(() => {
    fetchLeads();
    fetchStats();
  }, [fetchLeads, fetchStats]);

  const handleSort = (col: typeof sortCol) => {
    if (col === sortCol) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(col);
      setSortAsc(false);
    }
    setPage(0);
  };

  const handleLeadUpdated = (updated: InsuranceLead) => {
    setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    fetchStats();
  };

  const SortIcon = ({ col }: { col: typeof sortCol }) =>
    sortCol === col ? (sortAsc ? ' ↑' : ' ↓') : ' ↕';

  return (
    <div>
      {/* 1. Header */}
      <div className="crm-page-header">
        <div>
          <h1 className="crm-page-title">Insurance Leads</h1>
          <p className="crm-page-subtitle">
            Customer insurance enquiries pipeline • View, filter, and update enquiry status
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <button
            type="button"
            className={`crm-refresh-btn ${refreshing ? 'spinning' : ''}`}
            onClick={() => {
              fetchLeads(true);
              fetchStats();
            }}
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

      {/* 2. Pipeline Statistics Bar */}
      <div className="crm-stats-grid" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="stat-card">
          <span className="stat-label">Total Enquiries</span>
          <span className="stat-value">{stats.total}</span>
        </div>
        <div className="stat-card stat-primary">
          <span className="stat-label">New / Uncontacted</span>
          <span className="stat-value" style={{ color: 'var(--color-primary)' }}>
            {stats.newCount}
          </span>
        </div>
        <div className="stat-card stat-warm">
          <span className="stat-label">Contacted</span>
          <span className="stat-value warm">{stats.contactedCount}</span>
        </div>
        <div className="stat-card" style={{ borderColor: 'rgba(22, 163, 74, 0.2)', background: 'linear-gradient(135deg, #f0fdf4 0%, var(--bg-surface) 100%)' }}>
          <span className="stat-label">Interested</span>
          <span className="stat-value" style={{ color: 'var(--color-success)' }}>
            {stats.interestedCount}
          </span>
        </div>
        <div className="stat-card" style={{ borderColor: 'rgba(100, 116, 139, 0.2)', background: 'linear-gradient(135deg, #f8fafc 0%, var(--bg-surface) 100%)' }}>
          <span className="stat-label">Lost / Closed</span>
          <span className="stat-value" style={{ color: 'var(--text-muted)' }}>
            {stats.lostCount}
          </span>
        </div>
      </div>

      {/* 3. Error Alert */}
      {errorMsg && (
        <div className="form-alert-error" style={{ marginBottom: 'var(--space-6)' }} role="alert">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
          </svg>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 4. Leads Management Card */}
      <div className="crm-card">
        {/* Filters Toolbar */}
        <div className="crm-filters-bar">
          <input
            type="search"
            className="crm-search-input"
            placeholder="Search by applicant name, mobile, city, or insurance type..."
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
            value={insuranceTypeFilter}
            onChange={(e) => {
              setInsuranceTypeFilter(e.target.value);
              setPage(0);
            }}
          >
            <option value="">All Insurance Types</option>
            {availableTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Desktop Table View */}
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
                  className={`sortable ${sortCol === 'full_name' ? 'th-active' : ''}`}
                  onClick={() => handleSort('full_name')}
                >
                  Applicant <span className="sort-icon"><SortIcon col="full_name" /></span>
                </th>
                <th>Mobile</th>
                <th>City</th>
                <th
                  className={`sortable ${sortCol === 'insurance_type' ? 'th-active' : ''}`}
                  onClick={() => handleSort('insurance_type')}
                >
                  Insurance Type <span className="sort-icon"><SortIcon col="insurance_type" /></span>
                </th>
                <th>Callback Schedule</th>
                <th
                  className={`sortable ${sortCol === 'status' ? 'th-active' : ''}`}
                  onClick={() => handleSort('status')}
                >
                  Status <span className="sort-icon"><SortIcon col="status" /></span>
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j}>
                        <div className="skeleton-bar" style={{ width: '80%', height: 14 }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="empty-state">
                      <svg
                        className="empty-state-icon"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                      <p className="empty-state-title">No insurance enquiries found</p>
                      <p className="empty-state-desc">
                        {search || statusFilter || insuranceTypeFilter
                          ? 'Try modifying or clearing your search filters.'
                          : 'Customer submissions from the /insurance page will appear here automatically.'}
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
                      <div className="lead-name-cell">{lead.full_name}</div>
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
                      <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                        {lead.insurance_type}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: 'var(--font-size-xs)' }}>
                        {formatDate(lead.preferred_callback_date)}
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                        {lead.preferred_callback_time || '—'}
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${lead.status}`}>{lead.status}</span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <button
                          type="button"
                          className="view-lead-btn"
                          onClick={() => setSelectedLeadId(lead.id)}
                        >
                          View Details →
                        </button>
                        <Link
                          to={`/admin/insurance/${lead.id}`}
                          className="btn btn-outline btn-xs"
                          title="Open full page workspace"
                        >
                          Full Page ↗
                        </Link>
                      </div>
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
              <p className="empty-state-title">No insurance enquiries found</p>
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
                    <div className="lead-mobile-applicant">{lead.full_name}</div>
                    <div className="lead-mobile-city">
                      {lead.city ? `${lead.city} • ` : ''}+91 {lead.mobile}
                    </div>
                  </div>
                  <span className={`status-badge ${lead.status}`}>{lead.status}</span>
                </div>

                <div className="lead-mobile-details">
                  <div>
                    <span className="info-label">Insurance Type</span>
                    <div style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                      {lead.insurance_type}
                    </div>
                  </div>
                  <div>
                    <span className="info-label">Callback Schedule</span>
                    <div style={{ fontWeight: 600 }}>
                      {formatDate(lead.preferred_callback_date)}
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                      {lead.preferred_callback_time || '—'}
                    </div>
                  </div>
                </div>

                <div className="lead-mobile-actions" onClick={(e) => e.stopPropagation()}>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                    {formatDateTime(lead.created_at)}
                  </span>
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <button
                      type="button"
                      className="btn btn-primary btn-xs"
                      onClick={() => setSelectedLeadId(lead.id)}
                    >
                      View Details →
                    </button>
                    <Link
                      to={`/admin/insurance/${lead.id}`}
                      className="btn btn-outline btn-xs"
                    >
                      Full Page ↗
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination Bar */}
        <div className="pagination-bar">
          <span>
            Showing {total === 0 ? 0 : page * PAGE_SIZE + 1}–
            {Math.min((page + 1) * PAGE_SIZE, total)} of {total} insurance enquiries
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
      <InsuranceLeadDetailModal
        leadId={selectedLeadId}
        onClose={() => setSelectedLeadId(null)}
        onLeadUpdated={handleLeadUpdated}
      />
    </div>
  );
};
