import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import { formatIndianCurrency } from '../../../lib/calculator';
import { Lead, InsuranceLead, LeadStatus } from '../../../types/database';
import { LeadDetailModal } from '../components/LeadDetailModal';
import { InsuranceLeadDetailModal } from '../components/InsuranceLeadDetailModal';
import '../crm.css';

interface CRMUnifiedStats {
  // 1. Unified CRM Totals (Loan + Insurance)
  totalCRMLeads: number;
  todayCRMLeads: number;
  newPendingCRMLeads: number;
  totalCallbacksScheduled: number;

  // 2. Loan Specific Metrics (Loan Only)
  totalLoanLeads: number;
  loanToday: number;
  loanNew: number;
  loanHot: number;
  loanWarm: number;
  loanCallbacks: number;
  loanRequestedAmount: number;
  loanApprovedAmount: number;
  loanDisbursedAmount: number;
  loanApplications: number;
  loanApprovedCount: number;
  loanDisbursedCount: number;

  // 3. Insurance Specific Metrics (Insurance Only - Exact Statuses)
  totalInsuranceLeads: number;
  insuranceToday: number;
  insuranceNew: number;
  insuranceContacted: number;
  insuranceInterested: number;
  insuranceLost: number;
  insuranceCallbacks: number;
  insuranceTypeCounts: Record<string, number>;
}

const EMPTY_STATS: CRMUnifiedStats = {
  totalCRMLeads: 0,
  todayCRMLeads: 0,
  newPendingCRMLeads: 0,
  totalCallbacksScheduled: 0,

  totalLoanLeads: 0,
  loanToday: 0,
  loanNew: 0,
  loanHot: 0,
  loanWarm: 0,
  loanCallbacks: 0,
  loanRequestedAmount: 0,
  loanApprovedAmount: 0,
  loanDisbursedAmount: 0,
  loanApplications: 0,
  loanApprovedCount: 0,
  loanDisbursedCount: 0,

  totalInsuranceLeads: 0,
  insuranceToday: 0,
  insuranceNew: 0,
  insuranceContacted: 0,
  insuranceInterested: 0,
  insuranceLost: 0,
  insuranceCallbacks: 0,
  insuranceTypeCounts: {},
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

type UnifiedLeadItem =
  | {
      id: string;
      kind: 'LOAN';
      name: string;
      mobile: string;
      city: string | null;
      productName: string;
      primaryHighlight: string;
      status: string;
      created_at: string;
      callbackDate: string | null;
      callbackTime: string | null;
      rawLoan: Lead;
    }
  | {
      id: string;
      kind: 'INSURANCE';
      name: string;
      mobile: string;
      city: string | null;
      productName: string;
      primaryHighlight: string;
      status: string;
      created_at: string;
      callbackDate: string | null;
      callbackTime: string | null;
      rawInsurance: InsuranceLead;
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

const fmtCurrencyCompact = (num: number) => {
  if (num >= 1_00_00_000) return `₹${(num / 1_00_00_000).toFixed(2)} Cr`;
  if (num >= 1_00_000) return `₹${(num / 1_00_000).toFixed(2)} Lakh`;
  return formatIndianCurrency(num);
};

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<CRMUnifiedStats>(EMPTY_STATS);
  const [loanLeads, setLoanLeads] = useState<Lead[]>([]);
  const [insuranceLeads, setInsuranceLeads] = useState<InsuranceLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Search & Filter state for Unified Recent Leads Table
  const [search, setSearch] = useState('');
  const [kindFilter, setKindFilter] = useState<'ALL' | 'LOAN' | 'INSURANCE'>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Selected Lead for Modal View
  const [selectedLoanLeadId, setSelectedLoanLeadId] = useState<string | null>(null);
  const [selectedInsLeadId, setSelectedInsLeadId] = useState<string | null>(null);

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
      // Parallel execution for maximum performance and minimum latency
      const [loanRes, insRes] = await Promise.all([
        supabase.from('leads').select('*').order('created_at', { ascending: false }),
        supabase.from('insurance_leads').select('*').order('created_at', { ascending: false }),
      ]);

      if (loanRes.error) {
        console.error('[Credzo CRM] Error querying loan leads:', loanRes.error);
        setErrorMsg(`Failed to load loan leads: ${loanRes.error.message}`);
        return;
      }

      if (insRes.error) {
        console.error('[Credzo CRM] Error querying insurance leads:', insRes.error);
        setErrorMsg(`Failed to load insurance leads: ${insRes.error.message}`);
        return;
      }

      const loans = (loanRes.data as Lead[]) || [];
      const insurances = (insRes.data as InsuranceLead[]) || [];

      setLoanLeads(loans);
      setInsuranceLeads(insurances);

      const today = todayStr();

      // 1. Calculate Loan Metrics
      const loanToday = loans.filter((l) => l.created_at && l.created_at.startsWith(today)).length;
      const loanNew = loans.filter((l) => l.status === 'NEW').length;
      const loanHot = loans.filter((l) => l.lead_score === 'HOT').length;
      const loanWarm = loans.filter((l) => l.lead_score === 'WARM').length;
      const loanCallbacks = loans.filter(
        (l) => l.preferred_callback_date && l.preferred_callback_date >= today
      ).length;
      const loanRequestedAmount = loans.reduce((sum, l) => sum + (Number(l.requested_amount) || 0), 0);
      const loanApprovedAmount = loans.reduce((sum, l) => sum + (Number(l.approved_amount) || 0), 0);
      const loanDisbursedAmount = loans.reduce((sum, l) => sum + (Number(l.disbursed_amount) || 0), 0);
      const loanApplications = loans.filter((l) => l.status === 'APPLICATION').length;
      const loanApprovedCount = loans.filter((l) => l.status === 'APPROVED').length;
      const loanDisbursedCount = loans.filter((l) => l.status === 'DISBURSED').length;

      // 2. Calculate Insurance Metrics
      const insuranceToday = insurances.filter((i) => i.created_at && i.created_at.startsWith(today)).length;
      const insuranceNew = insurances.filter((i) => i.status === 'NEW').length;
      const insuranceContacted = insurances.filter((i) => i.status === 'CONTACTED').length;
      const insuranceInterested = insurances.filter((i) => i.status === 'INTERESTED').length;
      const insuranceLost = insurances.filter((i) => i.status === 'LOST').length;
      const insuranceCallbacks = insurances.filter(
        (i) => i.preferred_callback_date && i.preferred_callback_date >= today
      ).length;

      const insuranceTypeCounts: Record<string, number> = {};
      insurances.forEach((i) => {
        const t = i.insurance_type || 'Other Insurance';
        insuranceTypeCounts[t] = (insuranceTypeCounts[t] || 0) + 1;
      });

      // 3. Unified Aggregate Statistics
      const calculatedStats: CRMUnifiedStats = {
        totalCRMLeads: loans.length + insurances.length,
        todayCRMLeads: loanToday + insuranceToday,
        newPendingCRMLeads: loanNew + insuranceNew,
        totalCallbacksScheduled: loanCallbacks + insuranceCallbacks,

        totalLoanLeads: loans.length,
        loanToday,
        loanNew,
        loanHot,
        loanWarm,
        loanCallbacks,
        loanRequestedAmount,
        loanApprovedAmount,
        loanDisbursedAmount,
        loanApplications,
        loanApprovedCount,
        loanDisbursedCount,

        totalInsuranceLeads: insurances.length,
        insuranceToday,
        insuranceNew,
        insuranceContacted,
        insuranceInterested,
        insuranceLost,
        insuranceCallbacks,
        insuranceTypeCounts,
      };

      setStats(calculatedStats);
    } catch (err: unknown) {
      console.error('[Credzo CRM] Unexpected dashboard fetch error:', err);
      setErrorMsg('Unexpected network error occurred while loading dashboard data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Handle Updates & Deletions
  const handleLoanUpdated = (updated: Lead) => {
    setLoanLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
  };

  const handleLoanDeleted = (deletedId: string) => {
    setLoanLeads((prev) => prev.filter((l) => l.id !== deletedId));
    fetchDashboardData();
  };

  const handleInsuranceUpdated = (updated: InsuranceLead) => {
    setInsuranceLeads((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  };

  const handleInsuranceDeleted = (deletedId: string) => {
    setInsuranceLeads((prev) => prev.filter((i) => i.id !== deletedId));
    fetchDashboardData();
  };

  // Build Unified Recent Leads List (Sorted Newest First)
  const unifiedRecentLeads = useMemo<UnifiedLeadItem[]>(() => {
    const loanItems: UnifiedLeadItem[] = loanLeads.map((l) => ({
      id: l.id,
      kind: 'LOAN',
      name: l.name,
      mobile: l.mobile,
      city: l.city,
      productName: LOAN_TYPE_LABELS[l.loan_type] || l.loan_type,
      primaryHighlight: formatIndianCurrency(l.requested_amount),
      status: l.status,
      created_at: l.created_at,
      callbackDate: l.preferred_callback_date,
      callbackTime: l.preferred_callback_time,
      rawLoan: l,
    }));

    const insItems: UnifiedLeadItem[] = insuranceLeads.map((i) => ({
      id: i.id,
      kind: 'INSURANCE',
      name: i.full_name,
      mobile: i.mobile,
      city: i.city,
      productName: i.insurance_type || 'Insurance',
      primaryHighlight: i.insurance_type || 'Enquiry',
      status: i.status,
      created_at: i.created_at,
      callbackDate: i.preferred_callback_date,
      callbackTime: i.preferred_callback_time,
      rawInsurance: i,
    }));

    const merged = [...loanItems, ...insItems];
    merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return merged;
  }, [loanLeads, insuranceLeads]);

  // Filter Recent Leads List
  const filteredRecentLeads = useMemo(() => {
    return unifiedRecentLeads.filter((item) => {
      if (kindFilter !== 'ALL' && item.kind !== kindFilter) return false;
      if (statusFilter && item.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchName = item.name?.toLowerCase().includes(q);
        const matchMobile = item.mobile?.includes(q);
        const matchCity = item.city?.toLowerCase().includes(q);
        const matchProduct = item.productName?.toLowerCase().includes(q);
        if (!matchName && !matchMobile && !matchCity && !matchProduct) return false;
      }
      return true;
    });
  }, [unifiedRecentLeads, kindFilter, statusFilter, search]);

  // Calculate CRM Composition Percentages
  const loanSharePct =
    stats.totalCRMLeads > 0
      ? ((stats.totalLoanLeads / stats.totalCRMLeads) * 100).toFixed(1)
      : '0.0';
  const insSharePct =
    stats.totalCRMLeads > 0
      ? ((stats.totalInsuranceLeads / stats.totalCRMLeads) * 100).toFixed(1)
      : '0.0';

  return (
    <div>
      {/* 1. Page Header with Quick Navigation */}
      <div className="crm-page-header">
        <div>
          <h1 className="crm-page-title">Credzo CRM Executive Dashboard</h1>
          <p className="crm-page-subtitle">
            Unified pipeline analytics for Loan & Insurance operations —{' '}
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
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

          <Link to="/admin/leads" className="btn btn-outline btn-sm">
            Loan Leads ({stats.totalLoanLeads}) →
          </Link>
          <Link to="/admin/insurance" className="btn btn-outline btn-sm">
            Insurance Leads ({stats.totalInsuranceLeads}) →
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

      {/* 2. Unified Primary KPI Metrics (Loan + Insurance) */}
      <div className="crm-stats-grid">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="stat-card skeleton-row" style={{ height: 110 }} />
          ))
        ) : (
          <>
            {/* Total CRM Leads */}
            <div className="stat-card stat-primary">
              <span className="stat-label">Total CRM Inquiries</span>
              <span className="stat-value primary">{stats.totalCRMLeads}</span>
              <span className="stat-sub">
                {stats.totalLoanLeads} Loans • {stats.totalInsuranceLeads} Insurance
              </span>
            </div>

            {/* Leads Today */}
            <div className="stat-card">
              <span className="stat-label">Inquiries Today</span>
              <span className="stat-value" style={{ color: '#047857' }}>
                {stats.todayCRMLeads}
              </span>
              <span className="stat-sub">
                {stats.loanToday} Loans • {stats.insuranceToday} Insurance
              </span>
            </div>

            {/* New / Pending Inquiries */}
            <div className="stat-card stat-warm">
              <span className="stat-label">New / Pending</span>
              <span className="stat-value warm">{stats.newPendingCRMLeads}</span>
              <span className="stat-sub">
                {stats.loanNew} Loans • {stats.insuranceNew} Insurance
              </span>
            </div>

            {/* Total Scheduled Callbacks */}
            <div className="stat-card">
              <span className="stat-label">Callbacks Scheduled</span>
              <span className="stat-value" style={{ color: '#2563eb' }}>
                {stats.totalCallbacksScheduled}
              </span>
              <span className="stat-sub">
                {stats.loanCallbacks} Loans • {stats.insuranceCallbacks} Insurance
              </span>
            </div>
          </>
        )}
      </div>

      {/* 3. CRM Lead Composition Breakdown Bar */}
      {!loading && (
        <div className="crm-composition-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            <div>
              <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 800, color: 'var(--text-primary)' }}>
                CRM Portfolio Composition
              </span>
              <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                Relative distribution of customer enquiries across business verticals
              </p>
            </div>
            <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--text-secondary)' }}>
              {stats.totalCRMLeads} Total Customer Inquiries
            </span>
          </div>

          <div className="crm-composition-bar" role="progressbar" aria-label="CRM composition">
            <div
              className="crm-composition-fill loan"
              style={{ width: `${loanSharePct}%` }}
              title={`Loan Leads: ${stats.totalLoanLeads} (${loanSharePct}%)`}
            />
            <div
              className="crm-composition-fill insurance"
              style={{ width: `${insSharePct}%` }}
              title={`Insurance Leads: ${stats.totalInsuranceLeads} (${insSharePct}%)`}
            />
          </div>

          <div className="crm-composition-legend">
            <div className="crm-legend-item">
              <span className="crm-legend-dot loan" />
              <span>
                <strong>Loan Inquiries:</strong> {stats.totalLoanLeads} ({loanSharePct}%)
              </span>
            </div>
            <div className="crm-legend-item">
              <span className="crm-legend-dot insurance" />
              <span>
                <strong>Insurance Inquiries:</strong> {stats.totalInsuranceLeads} ({insSharePct}%)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 4. Dual Section Overview: Loan Overview vs Insurance Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        {/* Left Column: Loan Portfolio Overview (LOAN-ONLY METRICS) */}
        <div className="crm-card" style={{ height: '100%' }}>
          <div className="crm-card-header" style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span className="crm-type-badge loan">Loan Desk</span>
              <span className="crm-card-title">Financing & Lending Pipeline</span>
            </div>
            <Link to="/admin/leads" className="btn btn-outline btn-xs">
              View All Loans →
            </Link>
          </div>

          <div style={{ padding: 'var(--space-4) var(--space-5)' }}>
            {/* Requested Loan Value Banner */}
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 'var(--radius-lg)', padding: 'var(--space-3) var(--space-4)', marginBottom: 'var(--space-4)' }}>
              <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total Requested Loan Volume
              </span>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1d4ed8', marginTop: 2 }}>
                {fmtCurrencyCompact(stats.loanRequestedAmount)}
              </div>
              <span style={{ fontSize: '0.6875rem', color: '#3b82f6' }}>
                Aggregated borrowing demand across {stats.totalLoanLeads} loan applications
              </span>
            </div>

            {/* Loan Mini Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-3)' }}>
              <div style={{ background: 'var(--bg-app)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)' }}>
                <span className="info-label">🔥 Hot Enquiries</span>
                <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 800, color: '#dc2626' }}>
                  {stats.loanHot}
                </div>
              </div>

              <div style={{ background: 'var(--bg-app)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)' }}>
                <span className="info-label">📄 In Application</span>
                <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 800, color: '#2563eb' }}>
                  {stats.loanApplications}
                </div>
              </div>

              <div style={{ background: 'var(--bg-app)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)' }}>
                <span className="info-label">👍 Approved Loans</span>
                <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 800, color: '#059669' }}>
                  {stats.loanApprovedCount}
                </div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                  {fmtCurrencyCompact(stats.loanApprovedAmount)}
                </div>
              </div>

              <div style={{ background: 'var(--bg-app)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)' }}>
                <span className="info-label">✅ Disbursed Loans</span>
                <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 800, color: '#047857' }}>
                  {stats.loanDisbursedCount}
                </div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                  {fmtCurrencyCompact(stats.loanDisbursedAmount)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Insurance Overview (INSURANCE-ONLY METRICS) */}
        <div className="crm-card" style={{ height: '100%' }}>
          <div className="crm-card-header" style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span className="crm-type-badge insurance">Insurance Desk</span>
              <span className="crm-card-title">Policy & Advisory Pipeline</span>
            </div>
            <Link to="/admin/insurance" className="btn btn-outline btn-xs">
              View All Insurance →
            </Link>
          </div>

          <div style={{ padding: 'var(--space-4) var(--space-5)' }}>
            {/* Total Insurance Inquiries Banner */}
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-lg)', padding: 'var(--space-3) var(--space-4)', marginBottom: 'var(--space-4)' }}>
              <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Active Insurance Enquiries
              </span>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#15803d', marginTop: 2 }}>
                {stats.totalInsuranceLeads} Inquiries
              </div>
              <span style={{ fontSize: '0.6875rem', color: '#16a34a' }}>
                {stats.insuranceNew} Untouched • {stats.insuranceInterested} High-Intent • {stats.insuranceCallbacks} Scheduled
              </span>
            </div>

            {/* Insurance Mini Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
              <div style={{ background: 'var(--bg-app)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)' }}>
                <span className="info-label">🆕 New Untouched</span>
                <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 800, color: '#2563eb' }}>
                  {stats.insuranceNew}
                </div>
              </div>

              <div style={{ background: 'var(--bg-app)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)' }}>
                <span className="info-label">💬 In Conversation</span>
                <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 800, color: '#7c3aed' }}>
                  {stats.insuranceContacted}
                </div>
              </div>

              <div style={{ background: 'var(--bg-app)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)' }}>
                <span className="info-label">🎯 Ready for Proposal</span>
                <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 800, color: '#059669' }}>
                  {stats.insuranceInterested}
                </div>
              </div>

              <div style={{ background: 'var(--bg-app)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)' }}>
                <span className="info-label">📁 Closed / Lost</span>
                <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 800, color: 'var(--text-muted)' }}>
                  {stats.insuranceLost}
                </div>
              </div>
            </div>

            {/* Insurance Policy Categories Breakdown */}
            {Object.keys(stats.insuranceTypeCounts).length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: 'var(--space-2)' }}>
                {Object.entries(stats.insuranceTypeCounts).map(([type, count]) => (
                  <span
                    key={type}
                    style={{
                      fontSize: '0.6875rem',
                      background: 'var(--bg-app)',
                      border: '1px solid var(--border-subtle)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <strong>{type}:</strong> {count}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. Unified Recent Leads Table (Loan + Insurance Combined) */}
      <div className="crm-card">
        <div className="crm-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            <span className="crm-card-title">Recent CRM Activity (Loan + Insurance)</span>
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
              {filteredRecentLeads.length} matching records
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <Link
              to="/admin/leads"
              style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-primary)' }}
            >
              Loans Table →
            </Link>
            <Link
              to="/admin/insurance"
              style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: '#15803d' }}
            >
              Insurance Table →
            </Link>
          </div>
        </div>

        {/* Unified Filter / Search Toolbar */}
        <div className="crm-filters-bar">
          <input
            type="search"
            className="crm-search-input"
            placeholder="Search by applicant name, mobile number, city, or product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {/* Type Filter */}
          <select
            className="crm-select"
            value={kindFilter}
            onChange={(e) => setKindFilter(e.target.value as 'ALL' | 'LOAN' | 'INSURANCE')}
            style={{ fontWeight: 600 }}
          >
            <option value="ALL">All CRM Verticals</option>
            <option value="LOAN">Loans Only</option>
            <option value="INSURANCE">Insurance Only</option>
          </select>

          {/* Status Filter */}
          <select
            className="crm-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Pipeline Statuses</option>
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
        </div>

        {/* Desktop & Tablet Table View */}
        <div className="leads-table-wrapper">
          <table className="leads-table">
            <thead>
              <tr>
                <th>Vertical</th>
                <th>Received</th>
                <th>Applicant</th>
                <th>Mobile</th>
                <th>City</th>
                <th>Product / Category</th>
                <th>Requirement / Highlight</th>
                <th>Callback Schedule</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 10 }).map((_, j) => (
                      <td key={j}>
                        <div className="skeleton-bar" style={{ width: '85%', height: 14 }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredRecentLeads.length === 0 ? (
                <tr>
                  <td colSpan={10}>
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
                      <p className="empty-state-title">No enquiries matching filters</p>
                      <p className="empty-state-desc">
                        {search || statusFilter || kindFilter !== 'ALL'
                          ? 'Try modifying your search query or clearing the status filter.'
                          : 'Customer submissions across Loan and Insurance portals will appear here automatically.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecentLeads.slice(0, 20).map((item) => (
                  <tr
                    key={`${item.kind}-${item.id}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      if (item.kind === 'LOAN') setSelectedLoanLeadId(item.id);
                      else setSelectedInsLeadId(item.id);
                    }}
                  >
                    {/* Vertical Badge */}
                    <td>
                      <span className={`crm-type-badge ${item.kind.toLowerCase()}`}>
                        {item.kind}
                      </span>
                    </td>

                    {/* Received Date */}
                    <td className="lead-date-cell">{formatDateTime(item.created_at)}</td>

                    {/* Applicant */}
                    <td>
                      <div className="lead-name-cell">{item.name}</div>
                      <span className="lead-ref-pill">#{item.id.slice(0, 8).toUpperCase()}</span>
                    </td>

                    {/* Mobile */}
                    <td className="lead-mobile-cell" onClick={(e) => e.stopPropagation()}>
                      <a href={`tel:+91${item.mobile}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                        +91 {item.mobile}
                      </a>
                    </td>

                    {/* City */}
                    <td>{item.city || '—'}</td>

                    {/* Product */}
                    <td>
                      <span style={{ fontWeight: 600 }}>{item.productName}</span>
                    </td>

                    {/* Highlight */}
                    <td>
                      {item.kind === 'LOAN' ? (
                        <span className="lead-amount-cell" style={{ fontSize: 'var(--font-size-sm)' }}>
                          {item.primaryHighlight}
                        </span>
                      ) : (
                        <span style={{ color: '#15803d', fontWeight: 600, fontSize: 'var(--font-size-xs)' }}>
                          {item.primaryHighlight}
                        </span>
                      )}
                    </td>

                    {/* Callback Schedule */}
                    <td>
                      <div style={{ fontSize: 'var(--font-size-xs)' }}>
                        {formatDate(item.callbackDate)}
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                        {item.callbackTime || '—'}
                      </div>
                    </td>

                    {/* Status */}
                    <td>
                      <span className={`status-badge ${item.status}`}>{item.status}</span>
                    </td>

                    {/* Actions */}
                    <td onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="view-lead-btn"
                        onClick={() => {
                          if (item.kind === 'LOAN') setSelectedLoanLeadId(item.id);
                          else setSelectedInsLeadId(item.id);
                        }}
                      >
                        Inspect →
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
              <p className="empty-state-title">No enquiries found</p>
            </div>
          ) : (
            filteredRecentLeads.slice(0, 20).map((item) => (
              <div
                key={`${item.kind}-${item.id}`}
                className="lead-mobile-card"
                onClick={() => {
                  if (item.kind === 'LOAN') setSelectedLoanLeadId(item.id);
                  else setSelectedInsLeadId(item.id);
                }}
              >
                <div className="lead-mobile-header">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 2 }}>
                      <span className={`crm-type-badge ${item.kind.toLowerCase()}`}>
                        {item.kind}
                      </span>
                      <span className="lead-mobile-applicant">{item.name}</span>
                    </div>
                    <div className="lead-mobile-city">
                      {item.city ? `${item.city} • ` : ''}+91 {item.mobile}
                    </div>
                  </div>
                  <span className={`status-badge ${item.status}`}>{item.status}</span>
                </div>

                <div className="lead-mobile-details">
                  <div>
                    <span className="info-label">{item.kind === 'LOAN' ? 'Requested Loan' : 'Insurance Plan'}</span>
                    <div style={{ fontWeight: 700, color: item.kind === 'LOAN' ? 'var(--color-primary)' : '#15803d' }}>
                      {item.primaryHighlight}
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                      {item.productName}
                    </div>
                  </div>
                  <div>
                    <span className="info-label">Callback</span>
                    <div style={{ fontWeight: 600 }}>{formatDate(item.callbackDate)}</div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                      {item.callbackTime || 'Morning'}
                    </div>
                  </div>
                </div>

                <div className="lead-mobile-actions" onClick={(e) => e.stopPropagation()}>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                    {formatDateTime(item.created_at)}
                  </span>
                  <button
                    type="button"
                    className="btn btn-primary btn-xs"
                    onClick={() => {
                      if (item.kind === 'LOAN') setSelectedLoanLeadId(item.id);
                      else setSelectedInsLeadId(item.id);
                    }}
                  >
                    View Details →
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 6. Lead Detail Quick Modals */}
      {/* Loan Lead Modal */}
      <LeadDetailModal
        leadId={selectedLoanLeadId}
        onClose={() => setSelectedLoanLeadId(null)}
        onLeadUpdated={handleLoanUpdated}
        onLeadDeleted={handleLoanDeleted}
      />

      {/* Insurance Lead Modal */}
      <InsuranceLeadDetailModal
        leadId={selectedInsLeadId}
        onClose={() => setSelectedInsLeadId(null)}
        onLeadUpdated={handleInsuranceUpdated}
        onLeadDeleted={handleInsuranceDeleted}
      />
    </div>
  );
};
