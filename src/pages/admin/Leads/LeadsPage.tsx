import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import { formatIndianCurrency } from '../../../lib/calculator';
import { Lead, LeadStatus, LeadScore } from '../../../types/database';
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
};

export const LeadsPage: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [tempFilter, setTempFilter] = useState<string>('');
  const [loanTypeFilter, setLoanTypeFilter] = useState<string>('');

  // Sorting
  const [sortCol, setSortCol] = useState<'created_at' | 'requested_amount' | 'name'>('created_at');
  const [sortAsc, setSortAsc] = useState(false);

  const fetchLeads = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    setLoading(true);
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
        query = query.or(
          `name.ilike.%${s}%,mobile.ilike.%${s}%,city.ilike.%${s}%`
        );
      }

      const { data, count, error } = await query;
      if (!error && data) {
        setLeads(data as Lead[]);
        setTotal(count ?? 0);
      }
    } catch (err) {
      console.error('[Credzo CRM] Leads fetch error:', err);
    } finally {
      setLoading(false);
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

  const SortIcon = ({ col }: { col: typeof sortCol }) =>
    sortCol === col ? (sortAsc ? ' ↑' : ' ↓') : ' ↕';

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: '2-digit',
    });

  return (
    <div>
      <div className="crm-page-header">
        <div>
          <h1 className="crm-page-title">Leads</h1>
          <p className="crm-page-subtitle">
            {total} total enquiries in your pipeline
          </p>
        </div>
      </div>

      <div className="crm-card">
        {/* Filters */}
        <div className="crm-filters-bar">
          <input
            type="search"
            className="crm-search-input"
            placeholder="Search by name, mobile, or city..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
          />
          <select
            className="crm-select"
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(0); }}
          >
            <option value="">All Statuses</option>
            {(['NEW','CONTACTED','INTERESTED','DOCUMENTS','APPLICATION','APPROVED','DISBURSED','LOST'] as LeadStatus[]).map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            className="crm-select"
            value={tempFilter}
            onChange={e => { setTempFilter(e.target.value); setPage(0); }}
          >
            <option value="">All Temperatures</option>
            {(['HOT','WARM','COLD'] as LeadScore[]).map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select
            className="crm-select"
            value={loanTypeFilter}
            onChange={e => { setLoanTypeFilter(e.target.value); setPage(0); }}
          >
            <option value="">All Loan Types</option>
            {Object.entries(LOAN_TYPE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="leads-table-wrapper">
          <table className="leads-table">
            <thead>
              <tr>
                <th
                  className={`sortable ${sortCol === 'name' ? 'th-active' : ''}`}
                  onClick={() => handleSort('name')}
                >
                  Applicant <span className="sort-icon"><SortIcon col="name" /></span>
                </th>
                <th>Mobile</th>
                <th>Loan Type</th>
                <th
                  className={`sortable ${sortCol === 'requested_amount' ? 'th-active' : ''}`}
                  onClick={() => handleSort('requested_amount')}
                >
                  Amount <span className="sort-icon"><SortIcon col="requested_amount" /></span>
                </th>
                <th>Temperature</th>
                <th>Status</th>
                <th
                  className={`sortable ${sortCol === 'created_at' ? 'th-active' : ''}`}
                  onClick={() => handleSort('created_at')}
                >
                  Received <span className="sort-icon"><SortIcon col="created_at" /></span>
                </th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j}>
                        <div className="skeleton-bar" style={{ width: '80%', height: 12 }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="empty-state">
                      <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      <p className="empty-state-title">No leads found</p>
                      <p className="empty-state-desc">Adjust your filters or wait for new enquiries.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                leads.map(lead => (
                  <tr key={lead.id}>
                    <td>
                      <div className="lead-name-cell">{lead.name}</div>
                      {lead.city && (
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                          {lead.city}
                        </div>
                      )}
                    </td>
                    <td className="lead-mobile-cell">+91 {lead.mobile}</td>
                    <td>{LOAN_TYPE_LABELS[lead.loan_type] || lead.loan_type}</td>
                    <td className="lead-amount-cell">{formatIndianCurrency(lead.requested_amount)}</td>
                    <td>
                      <span className={`temp-badge ${lead.lead_score}`}>
                        {lead.lead_score === 'HOT' ? '🔥' : lead.lead_score === 'WARM' ? '🌡️' : '❄️'}
                        {' '}{lead.lead_score}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${lead.status}`}>{lead.status}</span>
                    </td>
                    <td className="lead-date-cell">{formatDate(lead.created_at)}</td>
                    <td>
                      <Link to={`/admin/leads/${lead.id}`} className="view-lead-btn">
                        View →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="pagination-bar">
          <span>
            Showing {Math.min(page * PAGE_SIZE + 1, total)}–
            {Math.min(page * PAGE_SIZE + PAGE_SIZE, total)} of {total}
          </span>
          <div className="pagination-controls">
            <button
              className="pagination-btn"
              onClick={() => setPage(p => p - 1)}
              disabled={page === 0}
            >
              ← Prev
            </button>
            <button
              className="pagination-btn"
              onClick={() => setPage(p => p + 1)}
              disabled={(page + 1) * PAGE_SIZE >= total}
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
