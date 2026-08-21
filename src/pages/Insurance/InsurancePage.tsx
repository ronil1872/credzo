import React, { useState } from 'react';
import { Button } from '../../components/ui';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { getStoredUtmParams } from '../../lib/tracking';
import { InsuranceLeadInsert } from '../../types/database';
import './InsurancePage.css';

interface InsuranceFormData {
  fullName: string;
  mobile: string;
  email: string;
  city: string;
  insuranceCategory: string;
  callbackDate: string;
  callbackTime: 'morning' | 'afternoon' | 'evening';
  message: string;
  consent: boolean;
}

interface FormErrors {
  fullName?: string;
  mobile?: string;
  email?: string;
  city?: string;
  insuranceCategory?: string;
  consent?: string;
  general?: string;
}

interface InsuranceCategoryOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

export const InsurancePage: React.FC = () => {
  const categories: InsuranceCategoryOption[] = [
    {
      id: 'health',
      title: 'Health Insurance',
      description: 'Hospitalization and medical protection for individuals and families.',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      ),
    },
    {
      id: 'life',
      title: 'Life Insurance',
      description: 'Comprehensive financial protection and wealth planning for your family.',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      ),
    },
    {
      id: 'term',
      title: 'Term Insurance',
      description: 'High sum assured pure risk life cover with affordable periodic premiums.',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
    },
    {
      id: 'motor',
      title: 'Motor Insurance',
      description: 'Protection for four-wheeler and two-wheeler vehicles against damages and liability.',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="6" width="20" height="12" rx="2" />
          <circle cx="7" cy="18" r="2" />
          <circle cx="17" cy="18" r="2" />
          <path d="M2 12h20" />
        </svg>
      ),
    },
    {
      id: 'other',
      title: 'Other Insurance',
      description: 'Travel, personal accident, home, and specialized commercial risk covers.',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      ),
    },
  ];

  const [formData, setFormData] = useState<InsuranceFormData>({
    fullName: '',
    mobile: '',
    email: '',
    city: '',
    insuranceCategory: 'health',
    callbackDate: '',
    callbackTime: 'morning',
    message: '',
    consent: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [submittedData, setSubmittedData] = useState<InsuranceFormData | null>(null);

  const getCategoryTitle = (id: string) => {
    return categories.find((c) => c.id === id)?.title || 'Insurance';
  };

  const handleCategorySelect = (categoryId: string) => {
    setFormData((prev) => ({ ...prev, insuranceCategory: categoryId }));
    if (errors.insuranceCategory) {
      setErrors((prev) => ({ ...prev, insuranceCategory: undefined }));
    }
  };

  const validateField = (name: keyof InsuranceFormData, value: unknown): string | undefined => {
    switch (name) {
      case 'fullName':
        if (typeof value !== 'string' || !value.trim()) {
          return 'Full name is required.';
        }
        if (value.trim().length < 2) {
          return 'Name must be at least 2 characters.';
        }
        return undefined;

      case 'mobile': {
        const cleanMobile = typeof value === 'string' ? value.replace(/\D/g, '') : '';
        if (!cleanMobile) {
          return 'Mobile number is required.';
        }
        if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
          return 'Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).';
        }
        return undefined;
      }

      case 'email': {
        const trimmedEmail = typeof value === 'string' ? value.trim() : '';
        if (trimmedEmail) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(trimmedEmail)) {
            return 'Please enter a valid email address.';
          }
        }
        return undefined;
      }

      case 'city':
        if (typeof value !== 'string' || !value.trim()) {
          return 'City is required.';
        }
        if (value.trim().length < 2) {
          return 'Please enter a valid city name.';
        }
        return undefined;

      case 'insuranceCategory':
        if (!value) {
          return 'Please select an insurance category.';
        }
        return undefined;

      case 'consent':
        if (!value) {
          return 'Please confirm your consent to submit this enquiry.';
        }
        return undefined;

      default:
        return undefined;
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (name === 'mobile') {
      const numbersOnly = value.replace(/\D/g, '').slice(0, 10);
      setFormData((prev) => ({ ...prev, [name]: numbersOnly }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    const error = validateField(name as keyof InsuranceFormData, val);
    if (error) {
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: FormErrors = {};
    (Object.keys(formData) as (keyof InsuranceFormData)[]).forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) {
        newErrors[key as keyof FormErrors] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      if (!isSupabaseConfigured()) {
        const configError = new Error(
          'Supabase backend connection is not configured. Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY/VITE_SUPABASE_ANON_KEY.'
        );
        console.error('[Credzo Finance] Insurance enquiry submission blocked:', configError);
        throw configError;
      }

      const utm = getStoredUtmParams();

      /*
       * SECURITY:
       * Public anonymous insurance enquiry submission payload.
       * The frontend NEVER supplies organization_id.
       * The database trigger forcefully binds it to the Credzo Finance organization.
       */
      const insertPayload: InsuranceLeadInsert = {
        full_name: formData.fullName.trim(),
        mobile: formData.mobile.trim(),
        email: formData.email.trim() || null,
        city: formData.city.trim() || null,
        insurance_type: getCategoryTitle(formData.insuranceCategory),
        preferred_callback_date: formData.callbackDate || null,
        preferred_callback_time: formData.callbackTime || null,
        message: formData.message.trim() || null,
        status: 'NEW',
        lead_source: utm.lead_source || 'website',
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

      const { error } = await supabase
        .from('insurance_leads')
        .insert(insertPayload);

      if (error) {
        console.error('[Credzo Finance] Insurance lead insertion error:', error);
        throw error;
      }

      setSubmittedData({ ...formData });
      setIsSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      console.error('[Credzo Finance] Insurance submission failed:', err);
      const isDev = import.meta.env.DEV;
      let errorDetail =
        'Unable to submit your enquiry at this moment. Please verify your connection or try again shortly.';
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

  const handleReset = () => {
    setFormData({
      fullName: '',
      mobile: '',
      email: '',
      city: '',
      insuranceCategory: 'health',
      callbackDate: '',
      callbackTime: 'morning',
      message: '',
      consent: false,
    });
    setErrors({});
    setIsSuccess(false);
    setSubmittedData(null);
  };

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <div className="insurance-page-container">
      {/* 1. Header */}
      <header className="insurance-header">
        <span className="insurance-badge">Protection & Security</span>
        <h1 className="insurance-title">Insurance Made Simpler</h1>
        <p className="insurance-subtitle">
          Explore insurance options and request a callback from our advisory team. Fast, voluntary, and 100% free.
        </p>
      </header>

      {/* 2. Insurance Category Selectors */}
      <section className="insurance-categories-section">
        <div className="categories-section-header">
          <h2 className="categories-section-title">Select Insurance Category</h2>
          <p className="categories-section-desc">
            Choose the type of coverage you are exploring to tailor your enquiry.
          </p>
        </div>

        <div className="insurance-categories-grid">
          {categories.map((category) => {
            const isSelected = formData.insuranceCategory === category.id;
            return (
              <div
                key={category.id}
                role="button"
                tabIndex={0}
                className={`insurance-category-card ${isSelected ? 'selected' : ''}`}
                onClick={() => handleCategorySelect(category.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCategorySelect(category.id);
                  }
                }}
              >
                <div className="category-icon-box">{category.icon}</div>
                <h3 className="category-card-title">{category.title}</h3>
                <p className="category-card-desc">{category.description}</p>
                {isSelected && (
                  <span className="category-selected-indicator">
                    ✓ Selected
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Main Enquiry Form & Info Side Column */}
      <div className="insurance-main-grid">
        {/* Left Column: Form / Confirmation Screen */}
        <div className="insurance-form-card">
          {isSuccess && submittedData ? (
            <div className="insurance-success-card" role="status" aria-live="polite">
              <div className="success-icon-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 className="insurance-success-title">Enquiry Received!</h2>
              <p className="insurance-success-desc">
                Thank you, <strong>{submittedData.fullName}</strong>. Your insurance enquiry for <strong>{getCategoryTitle(submittedData.insuranceCategory)}</strong> has been received. An insurance specialist will contact you to discuss options suited to your requirement.
              </p>

              <div className="insurance-summary-box">
                <div className="summary-row">
                  <span className="summary-label">Name:</span>
                  <span className="summary-val">{submittedData.fullName}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Mobile:</span>
                  <span className="summary-val">+91 {submittedData.mobile}</span>
                </div>
                {submittedData.email && (
                  <div className="summary-row">
                    <span className="summary-label">Email:</span>
                    <span className="summary-val">{submittedData.email}</span>
                  </div>
                )}
                <div className="summary-row">
                  <span className="summary-label">City:</span>
                  <span className="summary-val">{submittedData.city}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Category:</span>
                  <span className="summary-val">{getCategoryTitle(submittedData.insuranceCategory)}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Preferred Time:</span>
                  <span className="summary-val" style={{ textTransform: 'capitalize' }}>
                    {submittedData.callbackTime}
                  </span>
                </div>
              </div>

              <div className="insurance-success-actions">
                <Button variant="primary" onClick={handleReset}>
                  Submit Another Enquiry
                </Button>
                <Button to="/calculator" variant="outline">
                  Explore Loan Calculator
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="form-header-bordered">
                <h2 className="insurance-form-title">
                  Request an Insurance Callback
                </h2>
                <p className="insurance-form-desc">
                  Selected Category: <strong>{getCategoryTitle(formData.insuranceCategory)}</strong>. Fill out your details below to speak with an advisory specialist.
                </p>
              </div>

              <form className="insurance-form" onSubmit={handleSubmit} noValidate>
                {/* Full Name */}
                <div className="form-field-group">
                  <label htmlFor="fullName" className="field-label required-label">
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    className={`text-input ${errors.fullName ? 'input-error' : ''}`}
                    placeholder="e.g. Rahul Sharma"
                    value={formData.fullName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    aria-invalid={!!errors.fullName}
                    aria-describedby={errors.fullName ? 'fullName-error' : undefined}
                    disabled={isSubmitting}
                  />
                  {errors.fullName && (
                    <span id="fullName-error" className="input-error-msg">
                      {errors.fullName}
                    </span>
                  )}
                </div>

                {/* Mobile Number */}
                <div className="form-field-group">
                  <label htmlFor="mobile" className="field-label required-label">
                    Mobile Number
                  </label>
                  <div className={`mobile-input-group ${errors.mobile ? 'input-error' : ''}`}>
                    <span className="country-prefix">+91</span>
                    <input
                      id="mobile"
                      name="mobile"
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      className="mobile-input-field"
                      placeholder="9876543210"
                      value={formData.mobile}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      aria-invalid={!!errors.mobile}
                      aria-describedby={errors.mobile ? 'mobile-error' : undefined}
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.mobile ? (
                    <span id="mobile-error" className="input-error-msg">
                      {errors.mobile}
                    </span>
                  ) : (
                    <span className="field-hint">10-digit Indian mobile number</span>
                  )}
                </div>

                {/* Email & City Grid */}
                <div className="form-grid-2">
                  <div className="form-field-group">
                    <label htmlFor="email" className="field-label optional-label">
                      Email Address
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      className={`text-input ${errors.email ? 'input-error' : ''}`}
                      placeholder="e.g. rahul@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? 'email-error' : undefined}
                      disabled={isSubmitting}
                    />
                    {errors.email && (
                      <span id="email-error" className="input-error-msg">
                        {errors.email}
                      </span>
                    )}
                  </div>

                  <div className="form-field-group">
                    <label htmlFor="city" className="field-label required-label">
                      City / Location
                    </label>
                    <input
                      id="city"
                      name="city"
                      type="text"
                      className={`text-input ${errors.city ? 'input-error' : ''}`}
                      placeholder="e.g. Mumbai, Delhi, Pune"
                      value={formData.city}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      aria-invalid={!!errors.city}
                      aria-describedby={errors.city ? 'city-error' : undefined}
                      disabled={isSubmitting}
                    />
                    {errors.city && (
                      <span id="city-error" className="input-error-msg">
                        {errors.city}
                      </span>
                    )}
                  </div>
                </div>

                {/* Category Dropdown (Synced) */}
                <div className="form-field-group">
                  <label htmlFor="insuranceCategory" className="field-label required-label">
                    Insurance Category
                  </label>
                  <select
                    id="insuranceCategory"
                    name="insuranceCategory"
                    className="select-input"
                    value={formData.insuranceCategory}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Preferred Callback Timing */}
                <div className="form-grid-2">
                  <div className="form-field-group">
                    <label htmlFor="callbackDate" className="field-label optional-label">
                      Preferred Callback Date
                    </label>
                    <input
                      id="callbackDate"
                      name="callbackDate"
                      type="date"
                      min={minDate}
                      className="text-input"
                      value={formData.callbackDate}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="form-field-group">
                    <label className="field-label">Preferred Time Window</label>
                    <div className="time-slot-row">
                      <button
                        type="button"
                        className={`time-slot-btn ${formData.callbackTime === 'morning' ? 'selected' : ''}`}
                        onClick={() => setFormData((prev) => ({ ...prev, callbackTime: 'morning' }))}
                      >
                        <span className="slot-name">Morning</span>
                        <span className="slot-hours">9am - 12pm</span>
                      </button>
                      <button
                        type="button"
                        className={`time-slot-btn ${formData.callbackTime === 'afternoon' ? 'selected' : ''}`}
                        onClick={() => setFormData((prev) => ({ ...prev, callbackTime: 'afternoon' }))}
                      >
                        <span className="slot-name">Afternoon</span>
                        <span className="slot-hours">12pm - 4pm</span>
                      </button>
                      <button
                        type="button"
                        className={`time-slot-btn ${formData.callbackTime === 'evening' ? 'selected' : ''}`}
                        onClick={() => setFormData((prev) => ({ ...prev, callbackTime: 'evening' }))}
                      >
                        <span className="slot-name">Evening</span>
                        <span className="slot-hours">4pm - 7pm</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Message / Requirement */}
                <div className="form-field-group">
                  <label htmlFor="message" className="field-label optional-label">
                    Specific Requirement or Notes
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={3}
                    className="textarea-input"
                    placeholder="e.g. Looking for family floater cover of ₹10 Lakh, or term plan till age 65..."
                    value={formData.message}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Mandatory Consent Checkbox */}
                <div className="consent-box-wrapper">
                  <label className="consent-checkbox-label">
                    <input
                      type="checkbox"
                      name="consent"
                      className="consent-checkbox"
                      checked={formData.consent}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    />
                    <span className="consent-text">
                      I authorize Credzo Finance and its representative insurance specialists to contact me regarding my voluntary insurance enquiry via telephone calls, SMS, WhatsApp, or email.
                    </span>
                  </label>
                </div>
                {errors.consent && (
                  <span className="input-error-msg" style={{ marginTop: '-8px' }}>
                    {errors.consent}
                  </span>
                )}

                {/* General Submission Error */}
                {errors.general && (
                  <div
                    className="input-error-msg"
                    role="alert"
                    style={{
                      padding: '10px 14px',
                      background: 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '8px',
                      marginBottom: '4px',
                    }}
                  >
                    {errors.general}
                  </div>
                )}

                {/* Submit CTA */}
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting Enquiry...' : 'Submit Insurance Enquiry →'}
                </Button>
              </form>
            </>
          )}
        </div>

        {/* Right Column: Support & Trust Highlights */}
        <div className="insurance-info-column">
          <div className="insurance-info-card">
            <h3 className="info-card-title">Why Enquire With Credzo?</h3>
            <p className="info-card-desc">
              We help simplify insurance discovery through transparent advisory and zero sales pressure.
            </p>

            <div className="insurance-benefit-list">
              <div className="insurance-benefit-item">
                <svg className="benefit-bullet-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <div className="benefit-item-content">
                  <h4>100% Free Consultation</h4>
                  <p>Zero consultation charges, service fees, or hidden brokerage costs.</p>
                </div>
              </div>

              <div className="insurance-benefit-item">
                <svg className="benefit-bullet-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <div className="benefit-item-content">
                  <h4>Tailored Guidance</h4>
                  <p>Discuss sum insured and riders suited to your specific family profile.</p>
                </div>
              </div>

              <div className="insurance-benefit-item">
                <svg className="benefit-bullet-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <div className="benefit-item-content">
                  <h4>Strict Data Privacy</h4>
                  <p>Your details are never sold to external bulk marketing lists.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Cross-Link Card to Loan Calculator */}
          <div className="loan-cross-card">
            <h3 className="loan-cross-title">Also exploring loan options?</h3>
            <p className="loan-cross-desc">
              Calculate EMIs, compare tenures, and review amortization breakdowns instantly with our free loan tools.
            </p>
            <Button to="/calculator" variant="primary" size="sm">
              Open Loan Calculator &rarr;
            </Button>
          </div>
        </div>
      </div>

      {/* 4. Compliance & Transparency Notice */}
      <section className="insurance-disclaimer-section">
        <div className="disclaimer-title-row">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h4>Important Insurance Advisory Notice</h4>
        </div>
        <p>
          Credzo Finance is an independent lead-generation and customer facilitation platform. <strong>We are NOT an insurance company, insurance broker, or risk underwriter.</strong> Submitting an enquiry on this platform does not constitute an insurance policy issuance, quote commitment, or guarantee of coverage.
        </p>
        <p>
          Final insurance underwriting, policy terms, premium rates, exclusions, and claim settlement are determined exclusively by the respective IRDAI-registered insurance companies in accordance with their regulatory filings and underwriting standards.
        </p>
      </section>
    </div>
  );
};
