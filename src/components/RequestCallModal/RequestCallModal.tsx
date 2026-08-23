import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { normalizeIndianMobile, isValidIndianMobile } from '../../lib/mobileUtils';
import { getStoredUtmParams } from '../../lib/tracking';
import { formatIndianCurrency, LOAN_CONFIGURATIONS } from '../../lib/calculator';
import { LoanType } from '../../types';
import './RequestCallModal.css';

export interface RequestCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialService?: 'loan' | 'insurance';
  initialLoanType?: string;
  initialRequestedAmount?: number;
  initialTenureMonths?: number;
  initialMonthlyIncome?: string;
  initialExistingEmi?: string;
  initialInsuranceCategory?: string;
  calculatedEmi?: number;
  title?: string;
  subtitle?: string;
}

export const RequestCallModal: React.FC<RequestCallModalProps> = ({
  isOpen,
  onClose,
  initialService = 'loan',
  initialLoanType = 'personal',
  initialRequestedAmount,
  initialTenureMonths,
  initialMonthlyIncome = '',
  initialExistingEmi = '',
  initialInsuranceCategory = 'health',
  calculatedEmi,
  title,
  subtitle,
}) => {
  const [service, setService] = useState<'loan' | 'insurance'>(initialService);
  const [loanType, setLoanType] = useState<string>(initialLoanType);
  const [insuranceType, setInsuranceType] = useState<string>(initialInsuranceCategory);
  const [fullName, setFullName] = useState<string>('');
  const [mobile, setMobile] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [callbackTime, setCallbackTime] = useState<'morning' | 'afternoon' | 'evening'>('morning');
  const [consent, setConsent] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Sync initial values when modal opens
  useEffect(() => {
    if (isOpen) {
      setService(initialService);
      setLoanType(initialLoanType);
      setInsuranceType(initialInsuranceCategory);
      setIsSuccess(false);
      setErrorMsg(null);
      setConsent(false);
    }
  }, [isOpen, initialService, initialLoanType, initialInsuranceCategory]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validation
    const trimmedName = fullName.trim();
    if (trimmedName.length < 2) {
      setErrorMsg('Please enter your full name (minimum 2 characters).');
      return;
    }

    const normalizedMobile = normalizeIndianMobile(mobile);
    if (!isValidIndianMobile(normalizedMobile)) {
      setErrorMsg('Please enter a valid 10-digit Indian mobile number (starts with 6, 7, 8, or 9).');
      return;
    }

    if (!consent) {
      setErrorMsg('Please provide your voluntary consent to receive a callback.');
      return;
    }

    if (!isSupabaseConfigured()) {
      setErrorMsg('Database connection is not configured.');
      return;
    }

    setIsSubmitting(true);
    const utm = getStoredUtmParams();

    try {
      if (service === 'loan') {
        const amount = initialRequestedAmount && initialRequestedAmount > 0 
          ? initialRequestedAmount 
          : (LOAN_CONFIGURATIONS[loanType as LoanType]?.defaultAmount || 500000);

        const leadPayload = {
          name: trimmedName,
          mobile: normalizedMobile,
          city: city.trim() || null,
          loan_type: loanType,
          requested_amount: amount,
          loan_tenure_months: initialTenureMonths || null,
          monthly_income: initialMonthlyIncome ? parseInt(initialMonthlyIncome, 10) : null,
          existing_emi: initialExistingEmi ? parseInt(initialExistingEmi, 10) : null,
          preferred_callback_date: null,
          preferred_callback_time: callbackTime,
          lead_source: utm.lead_source || 'website_modal',
          campaign: utm.campaign || null,
          ad: utm.ad || null,
          utm_source: utm.utm_source || null,
          utm_medium: utm.utm_medium || null,
          utm_campaign: utm.utm_campaign || null,
          utm_content: utm.utm_content || null,
          utm_term: utm.utm_term || null,
          consent_given: true,
          consent_timestamp: new Date().toISOString(),
        };

        const { error } = await supabase.from('leads').insert(leadPayload);
        if (error) throw error;
      } else {
        const insurancePayload = {
          full_name: trimmedName,
          mobile: normalizedMobile,
          email: email.trim() || null,
          city: city.trim() || null,
          insurance_type: insuranceType,
          preferred_callback_date: null,
          preferred_callback_time: callbackTime,
          message: 'Requested callback via quick assistance modal',
          lead_source: utm.lead_source || 'website_modal',
          campaign: utm.campaign || null,
          ad: utm.ad || null,
          utm_source: utm.utm_source || null,
          utm_medium: utm.utm_medium || null,
          utm_campaign: utm.utm_campaign || null,
          utm_content: utm.utm_content || null,
          utm_term: utm.utm_term || null,
          consent: true,
          consent_timestamp: new Date().toISOString(),
        };

        const { error } = await supabase.from('insurance_leads').insert(insurancePayload);
        if (error) throw error;
      }

      setIsSuccess(true);
    } catch (err: unknown) {
      console.error('[Credzo Call Request Error]:', err);
      const isDev = import.meta.env.DEV;
      setErrorMsg(
        isDev && err instanceof Error
          ? err.message
          : 'Unable to submit your request at this moment. Please try again shortly.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="request-call-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="request-call-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="request-call-header">
          <div>
            <div className="request-call-badge">100% Free Advisory</div>
            <h2 className="request-call-title">
              {title || (service === 'loan' ? 'Request a Loan Callback' : 'Request an Insurance Callback')}
            </h2>
            <p className="request-call-subtitle">
              {subtitle || 'Speak directly with our dedicated advisory team. No pressure, no advance charges.'}
            </p>
          </div>
          <button
            type="button"
            className="request-call-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        {/* Success State */}
        {isSuccess ? (
          <div className="request-call-success">
            <div className="success-icon-circle">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3 className="success-title">Callback Request Received!</h3>
            <p className="success-text">
              Thank you, <strong>{fullName}</strong>. Our {service === 'loan' ? 'loan' : 'insurance'} specialist will call you at{' '}
              <strong>+91 {mobile}</strong> during the {callbackTime} window.
            </p>
            <div className="success-tips-box">
              <div className="tip-item">
                <span className="tip-dot">✓</span>
                <span>Zero advance fees or hidden charges</span>
              </div>
              <div className="tip-item">
                <span className="tip-dot">✓</span>
                <span>Transparent options across verified partner institutions</span>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-md btn-full-width"
              onClick={onClose}
            >
              Done &rarr;
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="request-call-form">
            {/* Service Toggle */}
            <div className="service-tab-group" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={service === 'loan'}
                className={`service-tab-btn ${service === 'loan' ? 'active' : ''}`}
                onClick={() => setService('loan')}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="tab-icon">
                  <rect x="2" y="7" width="20" height="14" rx="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
                Loan Assistance
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={service === 'insurance'}
                className={`service-tab-btn ${service === 'insurance' ? 'active' : ''}`}
                onClick={() => setService('insurance')}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="tab-icon">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                Insurance Assistance
              </button>
            </div>

            {/* Context Summary Pill if from Calculator */}
            {service === 'loan' && initialRequestedAmount && calculatedEmi && calculatedEmi > 0 && (
              <div className="calculator-context-pill">
                <span className="pill-badge">Calculator Estimate</span>
                <span className="pill-metric">
                  {formatIndianCurrency(calculatedEmi)}/mo ({formatIndianCurrency(initialRequestedAmount)})
                </span>
              </div>
            )}

            {/* Error Banner */}
            {errorMsg && (
              <div className="request-call-alert-error" role="alert">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="alert-icon">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Category / Loan Type Selector */}
            <div className="form-group-compact">
              <label htmlFor="req-type-select" className="field-label-compact">
                {service === 'loan' ? 'Loan Category' : 'Insurance Category'} <span className="req">*</span>
              </label>
              {service === 'loan' ? (
                <select
                  id="req-type-select"
                  className="form-select-compact"
                  value={loanType}
                  onChange={(e) => setLoanType(e.target.value)}
                >
                  <option value="personal">Personal Loan</option>
                  <option value="business">Business Loan</option>
                  <option value="home">Home Loan</option>
                  <option value="lap">Loan Against Property</option>
                  <option value="gold">Gold Loan</option>
                  <option value="other">Other Loan</option>
                </select>
              ) : (
                <select
                  id="req-type-select"
                  className="form-select-compact"
                  value={insuranceType}
                  onChange={(e) => setInsuranceType(e.target.value)}
                >
                  <option value="health">Health Insurance</option>
                  <option value="life">Life Insurance</option>
                  <option value="term">Term Insurance</option>
                  <option value="motor">Motor Insurance</option>
                  <option value="other">Other Insurance</option>
                </select>
              )}
            </div>

            {/* Customer Contact Fields */}
            <div className="form-grid-compact">
              <div className="form-group-compact">
                <label htmlFor="req-fullname" className="field-label-compact">
                  Your Name <span className="req">*</span>
                </label>
                <input
                  id="req-fullname"
                  type="text"
                  className="form-input-compact"
                  placeholder="e.g. Rahul Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  maxLength={100}
                  autoComplete="name"
                  required
                />
              </div>

              <div className="form-group-compact">
                <label htmlFor="req-mobile" className="field-label-compact">
                  Mobile Number <span className="req">*</span>
                </label>
                <div className="phone-input-wrap">
                  <span className="phone-prefix">+91</span>
                  <input
                    id="req-mobile"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    className="form-input-compact phone-input"
                    placeholder="9876543210"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    maxLength={10}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Optional Email (for Insurance) */}
            {service === 'insurance' && (
              <div className="form-group-compact">
                <label htmlFor="req-email" className="field-label-compact">
                  Email Address (Optional)
                </label>
                <input
                  id="req-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  className="form-input-compact"
                  placeholder="e.g. rahul@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={100}
                />
              </div>
            )}

            {/* Optional City & Preferred Time */}
            <div className="form-grid-compact">
              <div className="form-group-compact">
                <label htmlFor="req-city" className="field-label-compact">
                  City (Optional)
                </label>
                <input
                  id="req-city"
                  type="text"
                  autoComplete="address-level2"
                  className="form-input-compact"
                  placeholder="e.g. Mumbai, Delhi"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  maxLength={50}
                />
              </div>

              <div className="form-group-compact">
                <label htmlFor="req-time" className="field-label-compact">
                  Preferred Call Time
                </label>
                <select
                  id="req-time"
                  className="form-select-compact"
                  value={callbackTime}
                  onChange={(e) => setCallbackTime(e.target.value as 'morning' | 'afternoon' | 'evening')}
                >
                  <option value="morning">Morning (10 AM – 1 PM)</option>
                  <option value="afternoon">Afternoon (1 PM – 4 PM)</option>
                  <option value="evening">Evening (4 PM – 7 PM)</option>
                </select>
              </div>
            </div>

            {/* Consent Checkbox */}
            <div className="consent-checkbox-wrap">
              <label className="checkbox-label-custom">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  required
                />
                <span className="checkbox-text">
                  I voluntarily authorize Credzo Finance and its partners to contact me via phone/SMS regarding my {service} enquiry.
                </span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="modal-actions-wrap">
              <button
                type="submit"
                className="btn btn-primary btn-md btn-full-width"
                id="modal-request-call-submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting Request...' : 'Get a Call From Our Team →'}
              </button>
              <button
                type="button"
                className="btn-text-dismiss"
                onClick={onClose}
              >
                Maybe Later
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
