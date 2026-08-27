import React, { useState } from 'react';

interface QuickLeadModalProps {
  isOpen: boolean;
  title?: string;
  subtitle?: string;
  defaultLoanType?: string;
  extraContext?: string;
  onClose: () => void;
}

export const QuickLeadModal: React.FC<QuickLeadModalProps> = ({
  isOpen,
  title = 'Talk to a Loan Expert',
  subtitle = 'Share your contact details and our team will connect with you shortly.',
  defaultLoanType = 'Home Loan',
  extraContext = '',
  onClose,
}) => {
  const [name, setName] = useState(''); // Completely blank initial value
  const [phone, setPhone] = useState(''); // Completely blank initial value
  const [city, setCity] = useState(''); // Completely blank initial value
  const [loanType, setLoanType] = useState(defaultLoanType);
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Please enter your name');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number');
      return;
    }

    setErrorMsg('');
    setIsSubmitted(true);
  };

  const handleReset = () => {
    setName('');
    setPhone('');
    setCity('');
    setLoanType(defaultLoanType);
    setMessage('');
    setIsSubmitted(false);
    setErrorMsg('');
  };

  return (
    <div className="cz-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="cz-modal-container cz-quick-lead-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="cz-modal-header">
          <div className="cz-modal-title-group">
            <span className="cz-modal-badge">Credzo Loan Advisory</span>
            <h3 className="cz-modal-title">{title}</h3>
          </div>
          <button
            type="button"
            className="cz-modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="cz-modal-body">
          {!isSubmitted ? (
            <>
              <p className="cz-modal-subtitle">{subtitle}</p>

              {extraContext && (
                <div className="cz-modal-context-box">
                  <span className="cz-context-icon">💡</span>
                  <span>{extraContext}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="cz-quick-form">
                <div className="cz-form-group">
                  <label htmlFor="quick-name">Full Name <span className="cz-req">*</span></label>
                  <input
                    id="quick-name"
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
                    placeholder="Your Name"
                    className="cz-input"
                    required
                    autoFocus
                  />
                </div>

                <div className="cz-form-group">
                  <label htmlFor="quick-phone">Mobile Number <span className="cz-req">*</span></label>
                  <div className="cz-phone-input-wrap">
                    <span className="cz-country-code">+91</span>
                    <input
                      id="quick-phone"
                      type="tel"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setPhone(val);
                        if (errorMsg) setErrorMsg('');
                      }}
                      placeholder="9876543210"
                      className="cz-input"
                      required
                    />
                  </div>
                </div>

                <div className="cz-form-group">
                  <label htmlFor="quick-city">City</label>
                  <input
                    id="quick-city"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Your City"
                    className="cz-input"
                  />
                </div>

                <div className="cz-form-group">
                  <label htmlFor="quick-loan-type">Loan Requirement</label>
                  <select
                    id="quick-loan-type"
                    value={loanType}
                    onChange={(e) => setLoanType(e.target.value)}
                    className="cz-select"
                  >
                    <option value="Home Loan">🏠 Home Loan</option>
                    <option value="Education Loan">🎓 Education Loan</option>
                    <option value="Personal Loan">💰 Personal Loan</option>
                    <option value="Business Loan">🏢 Business Loan</option>
                    <option value="Loan Against Property">🏦 Loan Against Property</option>
                    <option value="Home Loan Refinancing">💰 Home Loan Refinancing / Balance Transfer</option>
                  </select>
                </div>

                <div className="cz-form-group">
                  <label htmlFor="quick-msg">Optional Note</label>
                  <input
                    id="quick-msg"
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="e.g. Looking for 3 BHK under 75 Lakhs"
                    className="cz-input"
                  />
                </div>

                {errorMsg && (
                  <div className="cz-quiz-error" role="alert">
                    <span>⚠️</span> {errorMsg}
                  </div>
                )}

                <button type="submit" className="cz-btn cz-btn-primary cz-btn-large cz-btn-block">
                  Request Call Back &rarr;
                </button>

                <p className="cz-privacy-note">
                  🔒 We respect your confidentiality. Zero spam guaranteed.
                </p>
              </form>
            </>
          ) : (
            <div className="cz-quiz-success-pane" role="status">
              <div className="cz-success-check-large">✓</div>
              <h3 className="cz-success-title">Request Received</h3>
              <p className="cz-success-message">
                Thanks, <strong>{name}</strong>! Our loan team can help you explore suitable options.
              </p>
              <div className="cz-success-meta">
                <span>Phone: +91 {phone}</span>
                <span>•</span>
                <span>City: {city || 'Your City'}</span>
                <span>•</span>
                <span>Category: {loanType}</span>
              </div>
              <div className="cz-success-actions">
                <button
                  type="button"
                  className="cz-btn cz-btn-secondary"
                  onClick={handleReset}
                >
                  Request a New Enquiry
                </button>
                <button
                  type="button"
                  className="cz-btn cz-btn-primary"
                  onClick={onClose}
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
