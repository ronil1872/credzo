import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { LOAN_CONFIGURATIONS, mergeDatabaseLoanConfigurations } from '../lib/calculator';
import { LoanType, LoanTypeOption } from '../types';
import { LoanInterestRate } from '../types/database';

export interface UseLoanRatesResult {
  configurations: Record<LoanType, LoanTypeOption>;
  rawRates: LoanInterestRate[];
  loading: boolean;
  error: string | null;
  refreshRates: () => Promise<void>;
}

export function useLoanRates(): UseLoanRatesResult {
  const [configurations, setConfigurations] = useState<Record<LoanType, LoanTypeOption>>(LOAN_CONFIGURATIONS);
  const [rawRates, setRawRates] = useState<LoanInterestRate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRates = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setConfigurations(LOAN_CONFIGURATIONS);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchErr } = await supabase
        .from('loan_interest_rates')
        .select('*')
        .eq('is_active', true);

      if (fetchErr) {
        // Soft fallback to hardcoded default configurations
        console.warn('[Credzo Finance] Failed to fetch database loan rates, using defaults:', fetchErr.message);
        setConfigurations(LOAN_CONFIGURATIONS);
        setError(fetchErr.message);
      } else if (data && data.length > 0) {
        const rates = data as LoanInterestRate[];
        setRawRates(rates);
        setConfigurations(mergeDatabaseLoanConfigurations(rates));
      } else {
        setConfigurations(LOAN_CONFIGURATIONS);
      }
    } catch (err: unknown) {
      console.warn('[Credzo Finance] Unexpected error loading loan rates:', err);
      setConfigurations(LOAN_CONFIGURATIONS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  return {
    configurations,
    rawRates,
    loading,
    error,
    refreshRates: fetchRates,
  };
}
