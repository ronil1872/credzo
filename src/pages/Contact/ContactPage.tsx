import React, { useState } from 'react';
import { Button } from '../../components/ui';
import './ContactPage.css';

interface ContactFormData {
  fullName: string;
  mobile: string;
  email: string;
  subject: string;
  message: string;
}

interface FormErrors {
  fullName?: string;
  mobile?: string;
  email?: string;
  subject?: string;
  message?: string;
}

export const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState<ContactFormData>({
    fullName: '',
    mobile: '',
    email: '',
    subject: 'Loan Inquiry & Information',
    message: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [submittedData, setSubmittedData] = useState<ContactFormData | null>(null);

  const subjectOptions = [
    'Loan Inquiry & Information',
    'Loan Calculator Assistance',
    'Application / Callback Status',
    'Partnership & Business Queries',
    'Feedback & General Support',
  ];

  const validateField = (name: keyof ContactFormData, value: string): string | undefined => {
    switch (name) {
      case 'fullName':
        if (!value.trim()) {
          return 'Full name is required.';
        }
        if (value.trim().length < 2) {
          return 'Name must be at least 2 characters.';
        }
        return undefined;

      case 'mobile': {
        const cleanMobile = value.replace(/\D/g, '');
        if (!cleanMobile) {
          return 'Mobile number is required.';
        }
        if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
          return 'Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).';
        }
        return undefined;
      }

      case 'email': {
        const trimmedEmail = value.trim();
        if (!trimmedEmail) {
          return 'Email address is required.';
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
          return 'Please enter a valid email address.';
        }
        return undefined;
      }

      case 'subject':
        if (!value.trim()) {
          return 'Please select a subject.';
        }
        return undefined;

      case 'message':
        if (!value.trim()) {
          return 'Message is required.';
        }
        if (value.trim().length < 10) {
          return 'Please provide a brief message of at least 10 characters.';
        }
        return undefined;

      default:
        return undefined;
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    // For mobile, only allow numbers and limit to 10 digits
    if (name === 'mobile') {
      const numbersOnly = value.replace(/\D/g, '').slice(0, 10);
      setFormData((prev) => ({ ...prev, [name]: numbersOnly }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    // Clear error on edit
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const error = validateField(name as keyof ContactFormData, value);
    if (error) {
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: FormErrors = {};
    (Object.keys(formData) as (keyof ContactFormData)[]).forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) {
        newErrors[key] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    // Simulate local submission handling
    setTimeout(() => {
      setSubmittedData({ ...formData });
      setIsSubmitting(false);
      setIsSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 600);
  };

  const handleReset = () => {
    setFormData({
      fullName: '',
      mobile: '',
      email: '',
      subject: 'Loan Inquiry & Information',
      message: '',
    });
    setErrors({});
    setIsSuccess(false);
    setSubmittedData(null);
  };

  return (
    <div className="contact-page-container">
      {/* Header */}
      <header className="contact-header">
        <span className="contact-badge">Support & Inquiries</span>
        <h1 className="contact-title">Contact Credzo Finance</h1>
        <p className="contact-subtitle">
          Have questions about our loan calculators, need support with your loan estimate enquiry, 
          or want to connect with our team? Send us a message and we'll be happy to assist you.
        </p>
      </header>

      {/* Main Content Grid */}
      <div className="contact-grid">
        {/* Left Column: Information & Assistance */}
        <div className="contact-info-column">
          <div className="contact-info-card">
            <h2 className="contact-card-title">Support & Assistance</h2>
            <p className="contact-card-desc">
              We provide fast digital support for all users exploring loan options and estimates.
            </p>

            <div className="contact-channels-list">
              <div className="contact-channel-item">
                <div className="channel-icon-box" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <div className="channel-text-content">
                  <div className="channel-label">Inquiry Channel</div>
                  <div className="channel-value">Online Contact & Support Form</div>
                  <div className="channel-placeholder-note">Direct submission to our support queue</div>
                </div>
              </div>

              <div className="contact-channel-item">
                <div className="channel-icon-box" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div className="channel-text-content">
                  <div className="channel-label">Response Time</div>
                  <div className="channel-value">Within 24 Business Hours</div>
                  <div className="channel-placeholder-note">Mon – Sat, 9:30 AM – 6:30 PM IST</div>
                </div>
              </div>

              <div className="contact-channel-item">
                <div className="channel-icon-box" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div className="channel-text-content">
                  <div className="channel-label">Assistance Policy</div>
                  <div className="channel-value">100% Free & No Obligation</div>
                  <div className="channel-placeholder-note">Strictly confidential and privacy protected</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Calculator Helper Card */}
          <div className="contact-calculator-helper">
            <h3 className="calc-helper-title">Looking for an instant EMI estimate?</h3>
            <p className="calc-helper-desc">
              Calculate EMIs, compare loan options, and view detailed amortization schedules instantly with no waiting.
            </p>
            <Button to="/calculator" variant="primary" size="sm">
              Open Loan Calculator &rarr;
            </Button>
          </div>

          {/* Trust Guarantees */}
          <div className="contact-trust-list">
            <div className="contact-trust-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Zero consultation fee or hidden charges</span>
            </div>
            <div className="contact-trust-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Your personal details are never shared or sold</span>
            </div>
            <div className="contact-trust-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Transparent illustrative calculation guidance</span>
            </div>
          </div>
        </div>

        {/* Right Column: Contact Form or Success Confirmation */}
        <div className="contact-form-column">
          {isSuccess && submittedData ? (
            <div className="contact-success-card" role="status" aria-live="polite">
              <div className="success-icon-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 className="contact-success-title">Message Received!</h2>
              <p className="contact-success-desc">
                Thank you for reaching out, <strong>{submittedData.fullName}</strong>. We have received your message regarding <strong>{submittedData.subject}</strong>. Our team will review your inquiry and get back to you shortly.
              </p>

              <div className="contact-summary-box">
                <div className="summary-row">
                  <span className="summary-label">Name:</span>
                  <span className="summary-val">{submittedData.fullName}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Mobile:</span>
                  <span className="summary-val">+91 {submittedData.mobile}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Email:</span>
                  <span className="summary-val">{submittedData.email}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Subject:</span>
                  <span className="summary-val">{submittedData.subject}</span>
                </div>
              </div>

              <div className="contact-success-actions">
                <Button variant="primary" onClick={handleReset}>
                  Send Another Message
                </Button>
                <Button to="/calculator" variant="outline">
                  Go to Calculator
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="form-header-bordered">
                <h2 className="contact-form-title">Send Us a Message</h2>
                <p className="contact-form-desc">
                  Fill out the details below and we will get back to you as soon as possible.
                </p>
              </div>

              <form className="contact-form" onSubmit={handleSubmit} noValidate>
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

                {/* Email Address */}
                <div className="form-field-group">
                  <label htmlFor="email" className="field-label required-label">
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className={`text-input ${errors.email ? 'input-error' : ''}`}
                    placeholder="e.g. rahul.sharma@example.com"
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

                {/* Subject */}
                <div className="form-field-group">
                  <label htmlFor="subject" className="field-label required-label">
                    Subject
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    className={`select-input ${errors.subject ? 'input-error' : ''}`}
                    value={formData.subject}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    aria-invalid={!!errors.subject}
                    aria-describedby={errors.subject ? 'subject-error' : undefined}
                    disabled={isSubmitting}
                  >
                    {subjectOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  {errors.subject && (
                    <span id="subject-error" className="input-error-msg">
                      {errors.subject}
                    </span>
                  )}
                </div>

                {/* Message */}
                <div className="form-field-group">
                  <label htmlFor="message" className="field-label required-label">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    className={`textarea-input ${errors.message ? 'input-error' : ''}`}
                    placeholder="How can we assist you? Please describe your query or requirement..."
                    value={formData.message}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    aria-invalid={!!errors.message}
                    aria-describedby={errors.message ? 'message-error' : undefined}
                    disabled={isSubmitting}
                  />
                  {errors.message && (
                    <span id="message-error" className="input-error-msg">
                      {errors.message}
                    </span>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Sending Message...' : 'Submit Inquiry'}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
