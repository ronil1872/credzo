import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  formatIndianCurrency,
  formatTenureDisplay,
  LOAN_CONFIGURATIONS,
  calculateLoan,
} from '../../lib/calculator';
import { getStoredUtmParams } from '../../lib/tracking';
import { normalizeIndianMobile, isValidIndianMobile } from '../../lib/mobileUtils';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { LoanCalculationResult } from '../../types';
import './ResultPage.css';

interface CalculationSnapshot {
  result: LoanCalculationResult;
  loanTypeLabel: string;
  loanType: string;
  monthlyIncome?: string;
  existingEmi?: string;
  employmentType?: string;
  city?: string;
}

export const ResultPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // -------------------------------------------------------------
  // 1. Resolve Calculation Snapshot
  // -------------------------------------------------------------
  const [snapshot] = useState<CalculationSnapshot>(() => {
    if (location.state && (location.state as CalculationSnapshot).result) {
      return location.state as CalculationSnapshot;
    }

    try {
      const stored = sessionStorage.getItem('credzo_calculation_snapshot');

      if (stored) {
        return JSON.parse(stored) as CalculationSnapshot;
      }
    } catch {
      // Ignore sessionStorage parsing errors
    }

    // Default fallback calculation (Personal Loan ₹5L, 36 mo)
    const defConfig = LOAN_CONFIGURATIONS.personal;

    const defResult = calculateLoan({
      loanType: 'personal',
      principal: defConfig.defaultAmount,
      annualInterestRate: defConfig.defaultRate,
      tenureMonths: defConfig.defaultTenureMonths,
    });

    return {
      result: defResult,
      loanTypeLabel: defConfig.label,
      loanType: 'personal',
      monthlyIncome: '',
      existingEmi: '',
      employmentType: 'salaried',
      city: '',
    };
  });

  // -------------------------------------------------------------
  // Callback Date Helpers
  // -------------------------------------------------------------
  const getDefaultCallbackDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const getMinCallbackDate = () => new Date().toISOString().split('T')[0];

  const getMaxCallbackDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  };

  // -------------------------------------------------------------
  // 2. Form State
  // -------------------------------------------------------------
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [city, setCity] = useState(snapshot.city || '');
  const [callbackDate, setCallbackDate] = useState(getDefaultCallbackDate());
  const [callbackTime, setCallbackTime] = useState('morning');
  const [consentGiven, setConsentGiven] = useState(false);

  // -------------------------------------------------------------
  // 3. UI State
  // -------------------------------------------------------------
  const [errors, setErrors] = useState<{
    fullName?: string;
    mobile?: string;
    city?: string;
    consent?: string;
    general?: string;
  }>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [isSubmitted]);

  // -------------------------------------------------------------
  // Mobile number input handler
  // -------------------------------------------------------------
  const handleMobileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const normalized = normalizeIndianMobile(e.target.value);
    setMobile(normalized);

    if (errors.mobile) {
      setErrors((prev) => ({
        ...prev,
        mobile: undefined,
      }));
    }
  };

  // -------------------------------------------------------------
  // Validation
  // -------------------------------------------------------------
  const validateForm = (): boolean => {
    const errs: typeof errors = {};

    if (!fullName.trim() || fullName.trim().length < 2) {
      errs.fullName =
        'Please enter your full name (minimum 2 characters).';
    }

    if (!mobile || !isValidIndianMobile(mobile)) {
      errs.mobile =
        'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.';
    }

    if (!consentGiven) {
      errs.consent =
        'You must grant consent to receive a callback from our loan specialist.';
    }

    setErrors(errs);

    return Object.keys(errs).length === 0;
  };

  // -------------------------------------------------------------
  // Form Submission
  // -------------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      if (!isSupabaseConfigured()) {
        const configError = new Error(
          'Supabase backend connection is not configured. Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY/VITE_SUPABASE_ANON_KEY.'
        );

        console.error(
          '[Credzo Finance] Lead submission blocked:',
          configError
        );

        throw configError;
      }

      const utm = getStoredUtmParams();

      /*
       * SECURITY:
       *
       * This is the PUBLIC lead submission payload.
       *
       * The browser is NOT allowed to control:
       * - id
       * - organization_id
       * - status
       * - lead_score
       * - lead_score_reason
       * - approved_amount
       * - disbursed_amount
       * - calculated_emi
       * - estimated_interest
       * - estimated_total_repayment
       * - illustrative_interest_rate
       * - created_at
       * - updated_at
       *
       * Those values are protected by the database/RLS/defaults.
       */

      const leadPayload = {
        name: fullName.trim(),
        mobile: mobile.trim(),
        city: city.trim() || null,

        loan_type: snapshot.loanType,
        requested_amount: snapshot.result.principal,

        monthly_income: snapshot.monthlyIncome
          ? parseInt(snapshot.monthlyIncome, 10)
          : null,

        existing_emi: snapshot.existingEmi
          ? parseInt(snapshot.existingEmi, 10)
          : null,

        employment_type: snapshot.employmentType || null,

        preferred_callback_date: callbackDate || null,
        preferred_callback_time: callbackTime || 'morning',

        lead_source: utm.lead_source || 'website',

        campaign: utm.campaign || null,
        ad: utm.ad || null,

        utm_source: utm.utm_source || null,
        utm_medium: utm.utm_medium || null,
        utm_campaign: utm.utm_campaign || null,
        utm_content: utm.utm_content || null,
        utm_term: utm.utm_term || null,

        consent_given: true,
        consent_timestamp: new Date().toISOString(),

        loan_tenure_months: snapshot.result.tenureMonths,
      };

      console.info(
        '[Credzo Finance] Submitting public lead payload:',
        {
          loan_type: leadPayload.loan_type,
          requested_amount: leadPayload.requested_amount,
          city: leadPayload.city,
          lead_source: leadPayload.lead_source,
        }
      );

      const { error } = await supabase
        .from('leads')
        .insert(leadPayload);

      if (error) {
        console.error(
          '[Credzo Finance] Lead insertion error:',
          {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
          }
        );

        throw error;
      }

      /*
       * IMPORTANT:
       *
       * We intentionally do not request the inserted row back
       * with .select().
       *
       * The public anon role should not have SELECT access to leads.
       */

      // Real Web Push Notification Dispatch to active staff devices
      supabase.functions
        .invoke('send-push-notification', {
          body: {
            event_type: 'PUBLIC_LEAD_SUBMISSION',
            lead: leadPayload,
          },
        })
        .catch((notifErr) => console.warn('[Credzo Push] Realtime notification dispatch notice:', notifErr));

      setIsSubmitted(true);
    } catch (err: unknown) {
      console.error(
        '[Credzo Finance] Submission failed:',
        err
      );

      const isDev = import.meta.env.DEV;

      let errorDetail =
        'Unable to submit your request at this moment. Please verify your connection or try again shortly.';

      if (isDev && err instanceof Error) {
        errorDetail = `Submission error: ${err.message}`;
      }

      setErrors({
        general: errorDetail,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // Time Window Label
  // -------------------------------------------------------------
  const getTimeWindowLabel = (slot: string) => {
    switch (slot) {
      case 'morning':
        return 'Morning (10:00 AM – 01:00 PM)';

      case 'afternoon':
        return 'Afternoon (01:00 PM – 04:00 PM)';

      case 'evening':
        return 'Evening (04:00 PM – 07:00 PM)';

      default:
        return slot;
    }
  };

  // -------------------------------------------------------------
  // SUCCESS CONFIRMATION VIEW
  // -------------------------------------------------------------
  if (isSubmitted) {
    return (
      <div className="result-page-container">
        <div
          className="lead-success-card"
          role="status"
          aria-live="polite"
        >
          <div className="success-icon-wrapper">
            <svg
              className="success-checkmark"
              viewBox="0 0 52 52"
              aria-hidden="true"
            >
              <circle
                className="checkmark-circle"
                cx="26"
                cy="26"
                r="25"
                fill="none"
              />

              <path
                className="checkmark-check"
                fill="none"
                d="M14.1 27.2l7.1 7.2 16.7-16.8"
              />
            </svg>
          </div>

          <span className="success-badge">
            Callback Scheduled
          </span>

          <h1 className="success-title">
            Thank You, {fullName}!
          </h1>

          <p className="success-subtitle">
            Your loan enquiry has been registered successfully. A
            senior loan specialist from Credzo Finance will connect
            with you to review your financing options.
          </p>

          <div className="success-details-box">
            <div className="success-detail-row">
              <span className="detail-label">
                Contact Number
              </span>

              <span className="detail-val">
                +91 {mobile}
              </span>
            </div>

            <div className="success-detail-row">
              <span className="detail-label">
                Preferred Date
              </span>

              <span className="detail-val">
                {callbackDate}
              </span>
            </div>

            <div className="success-detail-row">
              <span className="detail-label">
                Preferred Slot
              </span>

              <span className="detail-val">
                {getTimeWindowLabel(callbackTime)}
              </span>
            </div>

            <div className="success-detail-row">
              <span className="detail-label">
                Requirement
              </span>

              <span className="detail-val">
                {snapshot.loanTypeLabel} of{' '}
                {formatIndianCurrency(
                  snapshot.result.principal
                )}
              </span>
            </div>

            <div className="success-detail-row">
              <span className="detail-label">
                Est. Installment
              </span>

              <span className="detail-val highlight-green">
                {formatIndianCurrency(
                  snapshot.result.monthlyEmi
                )}
                /mo
              </span>
            </div>
          </div>

          <div className="success-disclaimer-note">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>

            <p>
              <strong>100% Free & No Obligation:</strong> Credzo
              Finance never charges upfront fees or charges for
              consultation. All sanction decisions remain subject
              to official lender verification.
            </p>
          </div>

          <div className="success-actions">
            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={() => navigate('/calculator')}
            >
              Calculate Another Loan
            </button>

            <Link
              to="/"
              className="btn btn-outline btn-lg"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // LEAD CAPTURE FORM VIEW
  // -------------------------------------------------------------
  return (
    <div className="result-page-container">
      <div className="result-page-header">
        <span className="result-page-badge">
          Step 2 of 2: Free Consultation
        </span>

        <h1 className="result-page-title">
          Confirm Your Loan Consultation
        </h1>

        <p className="result-page-subtitle">
          Review your estimate and schedule a free callback with a
          dedicated loan specialist.
        </p>
      </div>

      <div className="result-page-grid">
        {/* Left Column: Lead Capture Form */}
        <div className="lead-form-column">
          <form
            className="lead-capture-card"
            onSubmit={handleSubmit}
            noValidate
          >
            <div className="card-header-bordered">
              <h2 className="form-section-title">
                Applicant Contact Details
              </h2>

              <p className="form-section-desc">
                Provide your contact details so our advisor can
                reach you with tailored options.
              </p>
            </div>

            {errors.general && (
              <div
                className="form-alert-error"
                role="alert"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                  />

                  <line
                    x1="12"
                    y1="8"
                    x2="12"
                    y2="12"
                  />

                  <line
                    x1="12"
                    y1="16"
                    x2="12.01"
                    y2="16"
                  />
                </svg>

                <span>{errors.general}</span>
              </div>
            )}

            {/* 1. Full Name */}
            <div className="form-field-group">
              <label
                htmlFor="lead-name"
                className="field-label required-label"
              >
                Full Name (as per ID)
              </label>

              <input
                id="lead-name"
                type="text"
                className={`text-input ${errors.fullName
                    ? 'input-error'
                    : ''
                  }`}
                placeholder="e.g. Rahul Sharma"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);

                  if (errors.fullName) {
                    setErrors((prev) => ({
                      ...prev,
                      fullName: undefined,
                    }));
                  }
                }}
                required
              />

              {errors.fullName && (
                <span className="input-error-msg">
                  {errors.fullName}
                </span>
              )}
            </div>

            {/* 2. Mobile Number */}
            <div className="form-field-group">
              <label
                htmlFor="lead-mobile"
                className="field-label required-label"
              >
                Mobile Number (10 Digits)
              </label>

              <div
                className={`currency-input-group ${errors.mobile
                    ? 'input-error'
                    : ''
                  }`}
              >
                <span
                  className="currency-prefix country-prefix"
                  aria-hidden="true"
                >
                  +91
                </span>

                <input
                  id="lead-mobile"
                  type="tel"
                  inputMode="numeric"
                  className="currency-input-field"
                  placeholder="98765 43210"
                  value={mobile}
                  onChange={handleMobileChange}
                  required
                />
              </div>

              <span className="field-hint">
                We will only contact you for this specific loan
                requirement.
              </span>

              {errors.mobile && (
                <span className="input-error-msg">
                  {errors.mobile}
                </span>
              )}
            </div>

            {/* 3. City */}
            <div className="form-field-group">
              <label
                htmlFor="lead-city"
                className="field-label"
              >
                Current City
              </label>

              <input
                id="lead-city"
                type="text"
                className="text-input"
                placeholder="e.g. Mumbai, Pune, Delhi NCR, Bengaluru"
                value={city}
                onChange={(e) =>
                  setCity(e.target.value)
                }
              />
            </div>

            {/* 4. Preferred Callback Schedule */}
            <div className="schedule-section">
              <h3 className="sub-section-title">
                When should we call you?
              </h3>

              <div className="schedule-grid">
                <div className="form-field-group">
                  <label
                    htmlFor="callback-date"
                    className="field-label"
                  >
                    Preferred Date
                  </label>

                  <input
                    id="callback-date"
                    type="date"
                    className="text-input date-input"
                    min={getMinCallbackDate()}
                    max={getMaxCallbackDate()}
                    value={callbackDate}
                    onChange={(e) =>
                      setCallbackDate(e.target.value)
                    }
                  />
                </div>

                <div className="form-field-group">
                  <label className="field-label">
                    Preferred Time Slot
                  </label>

                  <div
                    className="time-slot-grid"
                    role="radiogroup"
                    aria-label="Preferred time slot"
                  >
                    {[
                      {
                        id: 'morning',
                        label: 'Morning',
                        time: '10 AM – 1 PM',
                      },
                      {
                        id: 'afternoon',
                        label: 'Afternoon',
                        time: '1 PM – 4 PM',
                      },
                      {
                        id: 'evening',
                        label: 'Evening',
                        time: '4 PM – 7 PM',
                      },
                    ].map((slot) => {
                      const isSelected =
                        callbackTime === slot.id;

                      return (
                        <button
                          type="button"
                          key={slot.id}
                          role="radio"
                          aria-checked={isSelected}
                          className={`time-slot-pill ${isSelected
                              ? 'selected'
                              : ''
                            }`}
                          onClick={() =>
                            setCallbackTime(slot.id)
                          }
                        >
                          <span className="slot-title">
                            {slot.label}
                          </span>

                          <span className="slot-time">
                            {slot.time}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Explicit Consent Checkbox */}
            <div className="consent-box-wrapper">
              <label className="consent-checkbox-label">
                <input
                  id="lead-consent"
                  type="checkbox"
                  className="consent-checkbox"
                  checked={consentGiven}
                  onChange={(e) => {
                    setConsentGiven(
                      e.target.checked
                    );

                    if (errors.consent) {
                      setErrors((prev) => ({
                        ...prev,
                        consent: undefined,
                      }));
                    }
                  }}
                />

                <span className="consent-text">
                  I hereby authorize Credzo Finance and its
                  representative loan specialists to contact me
                  via <strong>Phone Call, SMS, or WhatsApp</strong>{' '}
                  regarding this loan enquiry. I understand that
                  this is a free guidance service and does not
                  constitute a guaranteed loan sanction or credit
                  approval.
                </span>
              </label>

              {errors.consent && (
                <span className="input-error-msg">
                  {errors.consent}
                </span>
              )}
            </div>

            {/* Submit Action */}
            <div className="form-submit-wrapper">
              <button
                type="submit"
                className="btn btn-primary btn-lg btn-full-width"
                id="submit-lead-btn"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? 'Registering Your Request...'
                  : 'Request a Call From Our Team →'}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Calculation Summary Snapshot */}
        <div className="lead-summary-column">
          <div className="snapshot-card">
            <div className="snapshot-header">
              <span className="snapshot-badge">
                Your Estimate Summary
              </span>

              <span className="snapshot-loan-type">
                {snapshot.loanTypeLabel}
              </span>
            </div>

            <div className="snapshot-metric-main">
              <span className="snapshot-metric-caption">
                Estimated Monthly EMI
              </span>

              <div className="snapshot-metric-value">
                {formatIndianCurrency(
                  snapshot.result.monthlyEmi
                )}

                <span className="snapshot-unit">
                  /mo
                </span>
              </div>

              <span className="snapshot-rate-pill">
                Illustrative rate:{' '}
                {snapshot.result.annualInterestRate}% p.a.
              </span>
            </div>

            <div className="snapshot-breakdown-list">
              <div className="snapshot-row">
                <span className="row-label">
                  Loan Amount
                </span>

                <span className="row-val">
                  {formatIndianCurrency(
                    snapshot.result.principal
                  )}
                </span>
              </div>

              <div className="snapshot-row">
                <span className="row-label">
                  Tenure
                </span>

                <span className="row-val">
                  {formatTenureDisplay(
                    snapshot.result.tenureMonths
                  )}
                </span>
              </div>

              <div className="snapshot-row">
                <span className="row-label">
                  Est. Total Interest
                </span>

                <span className="row-val">
                  {formatIndianCurrency(
                    snapshot.result.totalInterest
                  )}
                </span>
              </div>

              <div className="snapshot-row highlight-row">
                <span className="row-label">
                  Est. Total Repayment
                </span>

                <span className="row-val">
                  {formatIndianCurrency(
                    snapshot.result.totalRepayment
                  )}
                </span>
              </div>
            </div>

            <div className="snapshot-recalculate-link">
              <Link to="/calculator">
                ← Edit Loan Parameters
              </Link>
            </div>

            <div className="snapshot-trust-guarantee">
              <div className="trust-item">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>

                <span>
                  100% Free Consultation
                </span>
              </div>

              <div className="trust-item">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>

                <span>
                  Zero Spam Guarantee
                </span>
              </div>

              <div className="trust-item">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>

                <span>
                  No Upfront Charges
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};