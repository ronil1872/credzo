import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import { formatIndianCurrency } from '../../../lib/calculator';
import { Lead } from '../../../types/database';
import '../crm.css';
import './CampaignsPage.css';

/* ------------------------------------------------------------------
   Types
   ------------------------------------------------------------------ */
type GroupKey = 'utm_source' | 'utm_campaign' | 'lead_source';

interface CampaignRow {
  key: string;           // The group value (e.g. "instagram")
  totalLeads: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  applications: number;
  approved: number;
  disbursed: number;
  potentialValue: number; // sum requested_amount for non-lost leads
  approvedValue: number;  // sum approved_amount
  disbursedValue: number; // sum disbursed_amount
  loanTypes: Record<string, number>;
}

/* ------------------------------------------------------------------
   Helpers
   ------------------------------------------------------------------ */
const fmtCr = (n: number) => {
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)} Cr`;
  if (n >= 1_00_000)    return `₹${(n / 1_00_000).toFixed(1)} L`;
  return formatIndianCurrency(n);
};

const LOAN_TYPE_LABEL: Record<string, string> = {
  personal: 'Personal', home: 'Home', car: 'Car',
  business: 'Business', education: 'Education', gold: 'Gold', lap: 'LAP',
};

const buildRows = (leads: Lead[], groupKey: GroupKey): CampaignRow[] => {
  const map = new Map<string, CampaignRow>();

  for (const lead of leads) {
    const rawKey = (lead[groupKey] as string | null) || '(direct / untracked)';

    if (!map.has(rawKey)) {
      map.set(rawKey, {
        key: rawKey,
        totalLeads: 0, hotLeads: 0, warmLeads: 0, coldLeads: 0,
        applications: 0, approved: 0, disbursed: 0,
        potentialValue: 0, approvedValue: 0, disbursedValue: 0,
        loanTypes: {},
      });
    }

    const row = map.get(rawKey)!;
    row.totalLeads += 1;
    if (lead.lead_score === 'HOT')  row.hotLeads  += 1;
    if (lead.lead_score === 'WARM') row.warmLeads += 1;
    if (lead.lead_score === 'COLD') row.coldLeads += 1;
    if (lead.status === 'APPLICATION') row.applications += 1;
    if (lead.status === 'APPROVED')    row.approved += 1;
    if (lead.status === 'DISBURSED')   row.disbursed += 1;
    if (lead.status !== 'LOST')        row.potentialValue  += lead.requested_amount || 0;
    row.approvedValue  += lead.approved_amount  || 0;
    row.disbursedValue += lead.disbursed_amount || 0;
    const lt = lead.loan_type || 'other';
    row.loanTypes[lt] = (row.loanTypes[lt] || 0) + 1;
  }

  return Array.from(map.values()).sort((a, b) => b.totalLeads - a.totalLeads);
};

/* ------------------------------------------------------------------
   Summary bar at the top
   ------------------------------------------------------------------ */
interface SummaryStats {
  total: number;
  hot: number;
  approved: number;
  disbursed: number;
  totalPotential: number;
  totalApproved: number;
}

const computeSummary = (leads: Lead[]): SummaryStats => ({
  total:          leads.length,
  hot:            leads.filter(l => l.lead_score === 'HOT').length,
  approved:       leads.filter(l => l.status === 'APPROVED').length,
  disbursed:      leads.filter(l => l.status === 'DISBURSED').length,
  totalPotential: leads.filter(l => l.status !== 'LOST').reduce((s, l) => s + (l.requested_amount || 0), 0),
  totalApproved:  leads.reduce((s, l) => s + (l.approved_amount || 0), 0),
});

/* ------------------------------------------------------------------
   Component
   ------------------------------------------------------------------ */
export const CampaignsPage: React.FC = () => {
  const [leads, setLeads]   = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupKey, setGroupKey] = useState<GroupKey>('utm_source');
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    const fetchLeads = async () => {
      setLoading(true);
      try {
        // Fetch every lead — only the fields we need for attribution
        const { data, error } = await supabase
          .from('leads')
          .select(
            'id, lead_source, utm_source, utm_medium, utm_campaign, utm_content, utm_term, ' +
            'campaign, ad, status, lead_score, loan_type, requested_amount, approved_amount, disbursed_amount'
          )
          .order('created_at', { ascending: false });

        if (!error && data) {
          setLeads(data as unknown as Lead[]);
        }
      } catch (err) {
        console.error('[Credzo CRM] Campaigns attribution fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, []);

  const rows    = useMemo(() => buildRows(leads, groupKey), [leads, groupKey]);
  const summary = useMemo(() => computeSummary(leads), [leads]);

  const convRate = (n: number, total: number) =>
    total > 0 ? `${((n / total) * 100).toFixed(1)}%` : '—';

  return (
    <div>
      {/* Header */}
      <div className="crm-page-header">
        <div>
          <h1 className="crm-page-title">Campaign Attribution</h1>
          <p className="crm-page-subtitle">
            Real conversion data aggregated directly from your lead records.
            Zero fabricated clicks, impressions, or vanity metrics.
          </p>
        </div>
      </div>

      {/* Integrity Notice */}
      <div className="attribution-notice">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <p>
          <strong>Data Integrity:</strong> All metrics are computed from actual customer enquiries in your database.
          No estimates, no projections, no purchased data. Only real leads with genuine consent.
        </p>
      </div>

      {/* Summary Stat Cards */}
      <div className="crm-stats-grid" style={{ marginBottom: 'var(--space-6)' }}>
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="stat-card skeleton-row" style={{ height: 80 }} />
          ))
        ) : (
          <>
            <div className="stat-card stat-primary">
              <span className="stat-label">Total Leads</span>
              <span className="stat-value primary">{summary.total}</span>
            </div>
            <div className="stat-card stat-hot">
              <span className="stat-label">🔥 Hot Leads</span>
              <span className="stat-value hot">{summary.hot}</span>
              <span className="stat-sub">{convRate(summary.hot, summary.total)} of total</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Applications</span>
              <span className="stat-value">{leads.filter(l => l.status === 'APPLICATION').length}</span>
              <span className="stat-sub">{convRate(leads.filter(l => l.status === 'APPLICATION').length, summary.total)} conversion</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Approved</span>
              <span className="stat-value">{summary.approved}</span>
              <span className="stat-sub">{convRate(summary.approved, summary.total)} sanction rate</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Disbursed</span>
              <span className="stat-value">{summary.disbursed}</span>
            </div>
            <div className="stat-card stat-primary">
              <span className="stat-label">Active Pipeline</span>
              <span className="stat-value primary">{fmtCr(summary.totalPotential)}</span>
              <span className="stat-sub">Requested loan value</span>
            </div>
          </>
        )}
      </div>

      {/* Attribution Table */}
      <div className="crm-card">
        {/* Group-by Selector */}
        <div className="crm-card-header" style={{ flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <span className="crm-card-title">Breakdown By</span>
          <div className="group-selector">
            {(
              [
                { key: 'utm_source',   label: 'UTM Source' },
                { key: 'utm_campaign', label: 'UTM Campaign' },
                { key: 'lead_source',  label: 'Lead Source' },
              ] as { key: GroupKey; label: string }[]
            ).map(({ key, label }) => (
              <button
                key={key}
                className={`group-btn ${groupKey === key ? 'active' : ''}`}
                onClick={() => setGroupKey(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="leads-table-wrapper">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton-row" style={{ padding: 'var(--space-4) var(--space-5)' }}>
                <div className="skeleton-bar" style={{ width: '25%' }} />
                <div className="skeleton-bar" style={{ width: '8%' }} />
                <div className="skeleton-bar" style={{ width: '8%' }} />
                <div className="skeleton-bar" style={{ width: '8%' }} />
                <div className="skeleton-bar" style={{ width: '8%' }} />
                <div className="skeleton-bar" style={{ width: '15%' }} />
              </div>
            ))
          ) : rows.length === 0 ? (
            <div className="empty-state">
              <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
              <p className="empty-state-title">No attribution data yet</p>
              <p className="empty-state-desc">
                Attribution metrics will appear once leads are submitted via the public calculator.
                Share your calculator link with a <code>?utm_source=</code> parameter to start tracking.
              </p>
            </div>
          ) : (
            <table className="leads-table">
              <thead>
                <tr>
                  <th>
                    {groupKey === 'utm_source'   ? 'Source' :
                     groupKey === 'utm_campaign' ? 'Campaign' : 'Lead Source'}
                  </th>
                  <th className="col-center">Total Leads</th>
                  <th className="col-center">🔥 Hot</th>
                  <th className="col-center">Applications</th>
                  <th className="col-center">Approved</th>
                  <th className="col-center">Disbursed</th>
                  <th>Pipeline Value</th>
                  <th className="col-center">Conv. Rate</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map(row => {
                  const isExpanded = expandedKey === row.key;
                  const conversionRate = row.totalLeads > 0
                    ? ((row.applications / row.totalLeads) * 100).toFixed(1)
                    : '0.0';

                  return (
                    <React.Fragment key={row.key}>
                      <tr className={`attribution-row ${isExpanded ? 'expanded' : ''}`}>
                        <td>
                          <div className="source-key-cell">
                            <span className={`source-dot ${row.key === '(direct / untracked)' ? 'dot-direct' : 'dot-tracked'}`} />
                            <span className="source-key-name">
                              {row.key}
                            </span>
                          </div>
                        </td>
                        <td className="col-center">
                          <strong>{row.totalLeads}</strong>
                        </td>
                        <td className="col-center">
                          <span style={{ color: row.hotLeads > 0 ? '#b91c1c' : 'var(--text-muted)', fontWeight: 600 }}>
                            {row.hotLeads}
                          </span>
                        </td>
                        <td className="col-center">{row.applications}</td>
                        <td className="col-center">
                          <span style={{ color: row.approved > 0 ? 'var(--color-success)' : 'var(--text-muted)', fontWeight: row.approved > 0 ? 700 : 400 }}>
                            {row.approved}
                          </span>
                        </td>
                        <td className="col-center">{row.disbursed}</td>
                        <td>
                          <span className="lead-amount-cell">{fmtCr(row.potentialValue)}</span>
                        </td>
                        <td className="col-center">
                          <span className={`conv-rate-pill ${Number(conversionRate) >= 10 ? 'good' : Number(conversionRate) > 0 ? 'ok' : 'none'}`}>
                            {conversionRate}%
                          </span>
                        </td>
                        <td>
                          <button
                            className="view-lead-btn"
                            onClick={() => setExpandedKey(isExpanded ? null : row.key)}
                          >
                            {isExpanded ? 'Hide ↑' : 'Detail ↓'}
                          </button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="attribution-detail-row">
                          <td colSpan={9}>
                            <div className="attribution-detail-panel">
                              <div className="detail-metrics-grid">
                                <div className="detail-metric">
                                  <span className="detail-metric-label">Warm Leads</span>
                                  <span className="detail-metric-value">{row.warmLeads}</span>
                                </div>
                                <div className="detail-metric">
                                  <span className="detail-metric-label">Cold Leads</span>
                                  <span className="detail-metric-value">{row.coldLeads}</span>
                                </div>
                                <div className="detail-metric">
                                  <span className="detail-metric-label">Approved Value</span>
                                  <span className="detail-metric-value">{fmtCr(row.approvedValue)}</span>
                                </div>
                                <div className="detail-metric">
                                  <span className="detail-metric-label">Disbursed Value</span>
                                  <span className="detail-metric-value">{fmtCr(row.disbursedValue)}</span>
                                </div>
                              </div>

                              {Object.keys(row.loanTypes).length > 0 && (
                                <div style={{ marginTop: 'var(--space-3)' }}>
                                  <p style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-2)' }}>
                                    Loan Types
                                  </p>
                                  <div className="loan-type-breakdown">
                                    {Object.entries(row.loanTypes)
                                      .sort(([, a], [, b]) => b - a)
                                      .map(([lt, count]) => (
                                        <div key={lt} className="loan-type-bar-item">
                                          <span className="loan-type-bar-label">
                                            {LOAN_TYPE_LABEL[lt] || lt}
                                          </span>
                                          <div className="loan-type-bar-track">
                                            <div
                                              className="loan-type-bar-fill"
                                              style={{ width: `${(count / row.totalLeads) * 100}%` }}
                                            />
                                          </div>
                                          <span className="loan-type-bar-count">{count}</span>
                                        </div>
                                      ))}
                                  </div>
                                </div>
                              )}

                              <div style={{ marginTop: 'var(--space-3)' }}>
                                <Link
                                  to={`/admin/leads?source=${encodeURIComponent(row.key)}`}
                                  className="view-lead-btn"
                                >
                                  View all leads from this source →
                                </Link>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Mobile Cards List for Campaigns */}
        <div className="campaign-mobile-list">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="campaign-mobile-card">
                <div className="skeleton-row" style={{ height: 36 }} />
                <div className="skeleton-row" style={{ height: 64 }} />
              </div>
            ))
          ) : rows.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state-title">No attribution data yet</p>
            </div>
          ) : (
            rows.map((row) => {
              const isExpanded = expandedKey === row.key;
              const conversionRate =
                row.totalLeads > 0
                  ? ((row.applications / row.totalLeads) * 100).toFixed(1)
                  : '0.0';

              return (
                <div key={row.key} className="campaign-mobile-card">
                  <div className="campaign-mobile-header">
                    <div className="source-key-cell">
                      <span
                        className={`source-dot ${
                          row.key === '(direct / untracked)' ? 'dot-direct' : 'dot-tracked'
                        }`}
                      />
                      <span className="source-key-name">{row.key}</span>
                    </div>
                    <span
                      className={`conv-rate-pill ${
                        Number(conversionRate) >= 10
                          ? 'good'
                          : Number(conversionRate) > 0
                          ? 'ok'
                          : 'none'
                      }`}
                    >
                      {conversionRate}%
                    </span>
                  </div>

                  <div className="campaign-mobile-grid">
                    <div className="campaign-mobile-grid-item">
                      <span className="campaign-mobile-grid-label">Total Leads</span>
                      <span className="campaign-mobile-grid-val">{row.totalLeads}</span>
                    </div>
                    <div className="campaign-mobile-grid-item">
                      <span className="campaign-mobile-grid-label">Hot Leads</span>
                      <span
                        className="campaign-mobile-grid-val"
                        style={{ color: row.hotLeads > 0 ? '#b91c1c' : 'inherit' }}
                      >
                        {row.hotLeads}
                      </span>
                    </div>
                    <div className="campaign-mobile-grid-item">
                      <span className="campaign-mobile-grid-label">Applications</span>
                      <span className="campaign-mobile-grid-val">{row.applications}</span>
                    </div>
                    <div className="campaign-mobile-grid-item">
                      <span className="campaign-mobile-grid-label">Pipeline Value</span>
                      <span className="campaign-mobile-grid-val" style={{ color: 'var(--color-primary)' }}>
                        {fmtCr(row.potentialValue)}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 'var(--space-2)', borderTop: '1px solid var(--border-subtle)' }}>
                    <button
                      type="button"
                      className="view-lead-btn"
                      onClick={() => setExpandedKey(isExpanded ? null : row.key)}
                    >
                      {isExpanded ? 'Hide Details ↑' : 'View Breakdown ↓'}
                    </button>
                    <Link
                      to={`/admin/leads?source=${encodeURIComponent(row.key)}`}
                      className="btn btn-outline btn-xs"
                    >
                      Leads ↗
                    </Link>
                  </div>

                  {isExpanded && (
                    <div style={{ marginTop: 'var(--space-2)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--border-subtle)' }}>
                      <div className="campaign-mobile-grid" style={{ marginBottom: 'var(--space-3)' }}>
                        <div className="campaign-mobile-grid-item">
                          <span className="campaign-mobile-grid-label">Approved</span>
                          <span className="campaign-mobile-grid-val">{row.approved}</span>
                        </div>
                        <div className="campaign-mobile-grid-item">
                          <span className="campaign-mobile-grid-label">Disbursed</span>
                          <span className="campaign-mobile-grid-val">{row.disbursed}</span>
                        </div>
                      </div>

                      {Object.keys(row.loanTypes).length > 0 && (
                        <div>
                          <p style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-2)' }}>
                            Loan Types
                          </p>
                          <div className="loan-type-breakdown">
                            {Object.entries(row.loanTypes)
                              .sort(([, a], [, b]) => b - a)
                              .map(([lt, count]) => (
                                <div key={lt} className="loan-type-bar-item">
                                  <span className="loan-type-bar-label">
                                    {LOAN_TYPE_LABEL[lt] || lt}
                                  </span>
                                  <div className="loan-type-bar-track">
                                    <div
                                      className="loan-type-bar-fill"
                                      style={{ width: `${(count / row.totalLeads) * 100}%` }}
                                    />
                                  </div>
                                  <span className="loan-type-bar-count">{count}</span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer note */}
        {!loading && rows.length > 0 && (
          <div className="attribution-footer-note">
            <p>
              <strong>Conversion Rate</strong> = Applications ÷ Total Leads.
              Pipeline Value includes all non-lost enquiries at the requested loan amount.
              All figures are computed live from your Supabase database.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
