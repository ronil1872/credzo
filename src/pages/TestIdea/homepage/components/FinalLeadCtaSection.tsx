import React, { useState } from 'react';

export const FinalLeadCtaSection: React.FC = () => {
  const [name, setName] = useState(''); // Completely blank initial value
  const [phone, setPhone] = useState(''); // Completely blank initial value
  const [city, setCity] = useState(''); // Completely blank initial value
  const [loanType, setLoanType] = useState('Home Loan');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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
    setLoanType('Home Loan');
    setIsSubmitted(false);
    setErrorMsg('');
  };

  return (
    <section className="cz-section cz-final-cta-section" id="contact">
      <div className="cz-section-container">
        <div className="cz-final-cta-card">
          <div className="cz-final-cta-header">
            <span className="cz-final-badge">Get in Touch</span>
            <h2 className="cz-final-title">Not Sure Where to Start?</h2>
            <p className="cz-final-subtitle">
              Tell us what you need and our team will help you understand your options.
            </p>
          </div>

          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="cz-final-form">
              <div className="cz-final-form-grid">
                {/* Full Name */}
                <div className="cz-final-field">
                  <label htmlFor="final-name" className="cz-final-label">
                    Full Name <span className="cz-req">*</span>
                  </label>
                  <input
                    id="final-name"
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
                    placeholder="Your Name"
                    className="cz-final-input"
                    required
                  />
                </div>

                {/* Mobile Number */}
                <div className="cz-final-field">
                  <label htmlFor="final-phone" className="cz-final-label">
                    Mobile Number <span className="cz-req">*</span>
                  </label>
                  <div className="cz-phone-input-wrap">
                    <span className="cz-country-code">+91</span>
                    <input
                      id="final-phone"
                      type="tel"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setPhone(val);
                        if (errorMsg) setErrorMsg('');
                      }}
                      placeholder="9876543210"
                      className="cz-final-input"
                      required
                    />
                  </div>
                </div>

                {/* City */}
                <div className="cz-final-field">
                  <label htmlFor="final-city" className="cz-final-label">
                    City
                  </label>
                  <input
                    id="final-city"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Your City"
                    className="cz-final-input"
                  />
                </div>

                {/* Loan Type */}
                <div className="cz-final-field">
                  <label htmlFor="final-loan-type" className="cz-final-label">
                    Loan Requirement
                  </label>
                  <select
                    id="final-loan-type"
                    value={loanType}
                    onChange={(e) => setLoanType(e.target.value)}
                    className="cz-final-select"
                  >
                    <option value="Home Loan">🏠 Home Loan</option>
                    <option value="Education Loan">🎓 Education Loan</option>
                    <option value="Personal Loan">💰 Personal Loan</option>
                    <option value="Business Loan">🏢 Business Loan</option>
                    <option value="Loan Against Property">🏦 Loan Against Property</option>
                  </select>
                </div>
              </div>

              {errorMsg && (
                <div className="cz-final-error" role="alert">
                  <span>⚠️</span> {errorMsg}
                </div>
              )}

              <div className="cz-final-submit-row">
                <button type="submit" className="cz-btn cz-btn-primary cz-btn-large cz-final-btn">
                  Request a Call &rarr;
                </button>
                <p className="cz-privacy-note">
                  🔒 We respect your privacy. No spam or unwanted sales calls.
                </p>
              </div>
            </form>
          ) : (
            <div className="cz-final-success-box" role="status">
              <div className="cz-success-check">✓</div>
              <h3 className="cz-success-title">Request Received</h3>
              <p className="cz-success-message">
                Thanks, <strong>{name}</strong>! Our loan team can help you explore suitable options for your <strong>{loanType}</strong> requirement.
              </p>
              <div className="cz-success-meta">
                <span>Contact number: +91 {phone}</span>
                <span>•</span>
                <span>City: {city || 'Your City'}</span>
                <span>•</span>
                <span>Mock Prototype Submission</span>
              </div>
              <button
                type="button"
                className="cz-btn cz-btn-secondary cz-btn-small"
                onClick={handleReset}
              >
                Request a New Enquiry
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
