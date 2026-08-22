import React, { useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import { useAuth } from '../../../hooks';
import { formatIndianCurrency, LOAN_CONFIGURATIONS } from '../../../lib/calculator';
import { LoanInterestRate } from '../../../types';
import '../crm.css';

interface EditableRateItem {
  id?: string;
  loan_type: string;
  label: string;
  rate: number;
  min_amount: number;
  max_amount: number;
  default_amount: number;
  min_tenure_months: number;
  max_tenure_months: number;
  default_tenure_months: number;
  is_active: boolean;
  updated_at?: string;
}

export const SettingsPage: React.FC = () => {
  const { user, profile } = useAuth();
  const isAdminOrOwner = profile?.role === 'ADMIN' || profile?.role === 'OWNER';

  const [rates, setRates] = useState<EditableRateItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load rates from database or populate from baseline defaults
  const fetchRates = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setErrorMsg('Supabase credentials are not configured.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const { data, error } = await supabase
        .from('loan_interest_rates')
        .select('*')
        .order('loan_type', { ascending: true });

      if (error) {
        console.warn('[Credzo Settings] Fetch loan rates notice:', error.message);
        // Fallback to baseline default configurations
        const baseline: EditableRateItem[] = Object.entries(LOAN_CONFIGURATIONS).map(([key, opt]) => ({
          loan_type: key,
          label: opt.label,
          rate: opt.defaultRate,
          min_amount: opt.minAmount,
          max_amount: opt.maxAmount,
          default_amount: opt.defaultAmount,
          min_tenure_months: opt.minTenureMonths,
          max_tenure_months: opt.maxTenureMonths,
          default_tenure_months: opt.defaultTenureMonths,
          is_active: true,
        }));
        setRates(baseline);
      } else if (data && data.length > 0) {
        setRates(data as LoanInterestRate[]);
      } else {
        // Table exists but is empty -> build from baseline
        const baseline: EditableRateItem[] = Object.entries(LOAN_CONFIGURATIONS).map(([key, opt]) => ({
          loan_type: key,
          label: opt.label,
          rate: opt.defaultRate,
          min_amount: opt.minAmount,
          max_amount: opt.maxAmount,
          default_amount: opt.defaultAmount,
          min_tenure_months: opt.minTenureMonths,
          max_tenure_months: opt.maxTenureMonths,
          default_tenure_months: opt.defaultTenureMonths,
          is_active: true,
        }));
        setRates(baseline);
      }
    } catch (err: unknown) {
      console.error('[Credzo Settings] Unexpected error:', err);
      setErrorMsg('Failed to load interest rates configuration.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  const handleFieldChange = (
    loanType: string,
    field: keyof EditableRateItem,
    value: string | number | boolean
  ) => {
    setRates((prev) =>
      prev.map((item) => {
        if (item.loan_type === loanType) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const handleSaveRate = async (item: EditableRateItem) => {
    if (!isAdminOrOwner) {
      setErrorMsg('Only Admin or Owner users can modify interest rates.');
      return;
    }

    if (!profile?.organization_id) {
      setErrorMsg('Active organization not found.');
      return;
    }

    // Validation
    if (isNaN(item.rate) || item.rate < 0 || item.rate > 100) {
      setErrorMsg(`Invalid rate for ${item.label}. Must be between 0% and 100%.`);
      return;
    }
    if (item.min_amount <= 0 || item.max_amount < item.min_amount) {
      setErrorMsg(`Invalid loan amount bounds for ${item.label}.`);
      return;
    }
    if (item.min_tenure_months <= 0 || item.max_tenure_months < item.min_tenure_months) {
      setErrorMsg(`Invalid tenure months for ${item.label}.`);
      return;
    }

    if (!item.id) {
      setErrorMsg(`Cannot update ${item.label}: record ID not found in database. Please refresh the page.`);
      return;
    }

    setSavingKey(item.loan_type);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const updateFields = {
        label: item.label,
        rate: Number(item.rate),
        min_amount: Number(item.min_amount),
        max_amount: Number(item.max_amount),
        default_amount: Number(item.default_amount),
        min_tenure_months: Number(item.min_tenure_months),
        max_tenure_months: Number(item.max_tenure_months),
        default_tenure_months: Number(item.default_tenure_months),
        is_active: item.is_active,
        updated_by: user?.id || null,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('loan_interest_rates')
        .update(updateFields)
        .eq('id', item.id)
        .select()
        .single();

      if (error) {
        console.error('[Credzo Settings] Error updating rate:', error);
        setErrorMsg(`Failed to save ${item.label}: ${error.message}`);
      } else {
        setSuccessMsg(`Successfully updated ${item.label} rate configuration.`);
        if (data) {
          setRates((prev) =>
            prev.map((r) => (r.loan_type === item.loan_type ? (data as LoanInterestRate) : r))
          );
        }
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err: unknown) {
      console.error('[Credzo Settings] Unexpected save error:', err);
      setErrorMsg(`Unexpected error saving ${item.label}.`);
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="crm-page-header">
        <div>
          <h1 className="crm-page-title">CRM & Calculator Settings</h1>
          <p className="crm-page-subtitle">
            Configure baseline illustrative interest rates and boundaries used by the public loan calculator.
          </p>
        </div>
      </div>

      {/* Status Alerts */}
      {errorMsg && (
        <div className="form-alert-error" style={{ marginBottom: 'var(--space-4)' }} role="alert">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div
          style={{
            padding: '12px 16px',
            background: 'rgba(5, 150, 105, 0.1)',
            border: '1px solid rgba(5, 150, 105, 0.3)',
            borderRadius: 'var(--radius-lg)',
            color: 'var(--color-success)',
            fontWeight: 600,
            marginBottom: 'var(--space-4)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
          role="status"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{successMsg}</span>
        </div>
      )}

      {/* User & Organization Profile Context */}
      <div className="crm-card" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="crm-card-header">
          <span className="crm-card-title">Staff Profile & Session</span>
        </div>
        <div style={{ padding: 'var(--space-4) var(--space-5)' }}>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Full Name</span>
              <span className="info-value">{profile?.full_name || 'Staff User'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Email Account</span>
              <span className="info-value">{user?.email || '—'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Assigned Role</span>
              <span className="info-value">
                <span className={`status-badge ${profile?.role === 'OWNER' ? 'NEW' : profile?.role === 'ADMIN' ? 'CONTACTED' : 'DOCUMENTS'}`}>
                  {profile?.role || 'STAFF'}
                </span>
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Permission Level</span>
              <span className="info-value" style={{ fontSize: 'var(--font-size-xs)' }}>
                {isAdminOrOwner ? '✅ Full Rate Management & CRM Control' : '👁️ Read-Only Rate Access'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Loan Products Interest Rate Management */}
      <div className="crm-card">
        <div className="crm-card-header">
          <div>
            <span className="crm-card-title">Illustrative Loan Rates & Limits</span>
            <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: 2 }}>
              Modifications immediately update calculations across the public loan calculator.
            </p>
          </div>
          <button
            type="button"
            className="crm-refresh-btn"
            onClick={fetchRates}
            disabled={loading}
          >
            Refresh Rates
          </button>
        </div>

        <div className="leads-table-wrapper">
          <table className="leads-table">
            <thead>
              <tr>
                <th>Loan Product</th>
                <th>Annual Rate (%)</th>
                <th>Min Amount (₹)</th>
                <th>Max Amount (₹)</th>
                <th>Default Amount (₹)</th>
                <th>Tenure Range (Mos)</th>
                <th>Status</th>
                {isAdminOrOwner && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: isAdminOrOwner ? 8 : 7 }).map((_, j) => (
                      <td key={j}>
                        <div className="skeleton-bar" style={{ width: '80%', height: 14 }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : rates.length === 0 ? (
                <tr>
                  <td colSpan={isAdminOrOwner ? 8 : 7}>
                    <div className="empty-state">
                      <p className="empty-state-title">No rate configurations found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                rates.map((item) => {
                  const isSaving = savingKey === item.loan_type;

                  return (
                    <tr key={item.loan_type}>
                      {/* 1. Product Name */}
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{item.label}</div>
                        <span className="lead-ref-pill">{item.loan_type.toUpperCase()}</span>
                      </td>

                      {/* 2. Rate Input */}
                      <td>
                        {isAdminOrOwner ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              className="value-input"
                              style={{ width: 85, fontWeight: 700 }}
                              value={item.rate}
                              onChange={(e) =>
                                handleFieldChange(item.loan_type, 'rate', parseFloat(e.target.value) || 0)
                              }
                            />
                            <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600 }}>%</span>
                          </div>
                        ) : (
                          <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                            {item.rate}% p.a.
                          </span>
                        )}
                      </td>

                      {/* 3. Min Amount */}
                      <td>
                        {isAdminOrOwner ? (
                          <input
                            type="number"
                            step="5000"
                            min="1000"
                            className="value-input"
                            style={{ width: 110 }}
                            value={item.min_amount}
                            onChange={(e) =>
                              handleFieldChange(item.loan_type, 'min_amount', parseInt(e.target.value, 10) || 0)
                            }
                          />
                        ) : (
                          formatIndianCurrency(item.min_amount)
                        )}
                      </td>

                      {/* 4. Max Amount */}
                      <td>
                        {isAdminOrOwner ? (
                          <input
                            type="number"
                            step="100000"
                            min="10000"
                            className="value-input"
                            style={{ width: 130 }}
                            value={item.max_amount}
                            onChange={(e) =>
                              handleFieldChange(item.loan_type, 'max_amount', parseInt(e.target.value, 10) || 0)
                            }
                          />
                        ) : (
                          formatIndianCurrency(item.max_amount)
                        )}
                      </td>

                      {/* 5. Default Amount */}
                      <td>
                        {isAdminOrOwner ? (
                          <input
                            type="number"
                            step="50000"
                            className="value-input"
                            style={{ width: 110 }}
                            value={item.default_amount}
                            onChange={(e) =>
                              handleFieldChange(item.loan_type, 'default_amount', parseInt(e.target.value, 10) || 0)
                            }
                          />
                        ) : (
                          formatIndianCurrency(item.default_amount)
                        )}
                      </td>

                      {/* 6. Tenure Min-Max */}
                      <td>
                        {isAdminOrOwner ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <input
                              type="number"
                              min="1"
                              max="360"
                              className="value-input"
                              style={{ width: 60 }}
                              value={item.min_tenure_months}
                              onChange={(e) =>
                                handleFieldChange(item.loan_type, 'min_tenure_months', parseInt(e.target.value, 10) || 0)
                              }
                            />
                            <span>–</span>
                            <input
                              type="number"
                              min="1"
                              max="360"
                              className="value-input"
                              style={{ width: 65 }}
                              value={item.max_tenure_months}
                              onChange={(e) =>
                                handleFieldChange(item.loan_type, 'max_tenure_months', parseInt(e.target.value, 10) || 0)
                              }
                            />
                          </div>
                        ) : (
                          `${item.min_tenure_months} – ${item.max_tenure_months} Mos`
                        )}
                      </td>

                      {/* 7. Status */}
                      <td>
                        {isAdminOrOwner ? (
                          <button
                            type="button"
                            className={`status-badge ${item.is_active ? 'APPROVED' : 'LOST'}`}
                            style={{ cursor: 'pointer', border: 'none' }}
                            onClick={() => handleFieldChange(item.loan_type, 'is_active', !item.is_active)}
                            title="Click to toggle Active / Disabled"
                          >
                            {item.is_active ? 'ACTIVE' : 'DISABLED'}
                          </button>
                        ) : (
                          <span className={`status-badge ${item.is_active ? 'APPROVED' : 'LOST'}`}>
                            {item.is_active ? 'ACTIVE' : 'DISABLED'}
                          </span>
                        )}
                      </td>

                      {/* 8. Actions */}
                      {isAdminOrOwner && (
                        <td>
                          <button
                            type="button"
                            className="btn btn-primary btn-xs"
                            onClick={() => handleSaveRate(item)}
                            disabled={isSaving}
                          >
                            {isSaving ? 'Saving...' : 'Save'}
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
