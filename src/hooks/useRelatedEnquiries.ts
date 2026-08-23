import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { normalizeIndianMobile } from '../lib/mobileUtils';

export interface RelatedEnquiryItem {
  id: string;
  category: 'loan' | 'insurance';
  productName: string;
  customerName: string;
  status: string;
  amount?: number;
  createdAt: string;
  linkUrl: string;
}

export interface UseRelatedEnquiriesResult {
  relatedEnquiries: RelatedEnquiryItem[];
  totalSubmissionsCount: number;
  isRepeatCustomer: boolean;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const LOAN_TYPE_LABELS: Record<string, string> = {
  personal: 'Personal Loan',
  business: 'Business Loan',
  home: 'Home Loan',
  lap: 'Loan Against Property',
  gold: 'Gold Loan',
  other: 'Other Loans',
};

const INSURANCE_TYPE_LABELS: Record<string, string> = {
  health: 'Health Insurance',
  life: 'Life Insurance / Term Plan',
  motor: 'Motor / Vehicle Insurance',
  home: 'Home Insurance',
  business: 'Business & Commercial Insurance',
  travel: 'Travel Insurance',
};

export function useRelatedEnquiries(
  mobile: string | null | undefined,
  currentLeadId: string,
  currentCategory: 'loan' | 'insurance'
): UseRelatedEnquiriesResult {
  const [relatedEnquiries, setRelatedEnquiries] = useState<RelatedEnquiryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const normalized = normalizeIndianMobile(mobile);

  const fetchRelated = useCallback(async () => {
    if (!normalized || normalized.length < 10 || !isSupabaseConfigured()) {
      setRelatedEnquiries([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Search variants to catch any legacy entries (10-digit, +91, 91, 0)
    const mobileVariants = Array.from(
      new Set([
        normalized,
        `+91${normalized}`,
        `+91 ${normalized}`,
        `91${normalized}`,
        `0${normalized}`,
      ])
    );

    try {
      // 1. Fetch related loan leads (RLS guarantees org isolation)
      const loanPromise = supabase
        .from('leads')
        .select('id, name, loan_type, requested_amount, status, created_at')
        .in('mobile', mobileVariants)
        .order('created_at', { ascending: false });

      // 2. Fetch related insurance leads (RLS guarantees org isolation)
      const insurancePromise = supabase
        .from('insurance_leads')
        .select('id, full_name, insurance_type, status, created_at')
        .in('mobile', mobileVariants)
        .order('created_at', { ascending: false });

      const [loanRes, insRes] = await Promise.all([loanPromise, insurancePromise]);

      const items: RelatedEnquiryItem[] = [];

      if (loanRes.data) {
        for (const l of loanRes.data) {
          // Exclude current lead if viewing this loan lead
          if (currentCategory === 'loan' && l.id === currentLeadId) {
            continue;
          }
          items.push({
            id: l.id,
            category: 'loan',
            productName: LOAN_TYPE_LABELS[l.loan_type] || l.loan_type || 'Loan Enquiry',
            customerName: l.name,
            status: l.status,
            amount: l.requested_amount ? Number(l.requested_amount) : undefined,
            createdAt: l.created_at,
            linkUrl: `/admin/leads/${l.id}`,
          });
        }
      }

      if (insRes.data) {
        for (const ins of insRes.data) {
          // Exclude current lead if viewing this insurance lead
          if (currentCategory === 'insurance' && ins.id === currentLeadId) {
            continue;
          }
          items.push({
            id: ins.id,
            category: 'insurance',
            productName:
              INSURANCE_TYPE_LABELS[ins.insurance_type] || ins.insurance_type || 'Insurance Enquiry',
            customerName: ins.full_name,
            status: ins.status,
            createdAt: ins.created_at,
            linkUrl: `/admin/insurance/${ins.id}`,
          });
        }
      }

      // Sort newest first
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setRelatedEnquiries(items);
    } catch (err: unknown) {
      console.warn('[Credzo CRM] Error loading related enquiries:', err);
      setError('Could not load related enquiries');
    } finally {
      setLoading(false);
    }
  }, [normalized, currentLeadId, currentCategory]);

  useEffect(() => {
    fetchRelated();
  }, [fetchRelated]);

  const totalSubmissionsCount = relatedEnquiries.length + 1;
  const isRepeatCustomer = relatedEnquiries.length > 0;

  return {
    relatedEnquiries,
    totalSubmissionsCount,
    isRepeatCustomer,
    loading,
    error,
    refresh: fetchRelated,
  };
}
