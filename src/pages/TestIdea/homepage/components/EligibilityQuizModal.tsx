import React, { useState } from 'react';

interface EligibilityQuizModalProps {
  isOpen: boolean;
  initialLoanType?: string;
  onClose: () => void;
}

export const EligibilityQuizModal: React.FC<EligibilityQuizModalProps> = ({
  isOpen,
  initialLoanType = 'Home Loan',
  onClose,
}) => {
  // Step 1 to 5: Qualification questions. Step 6: Final Contact Step.
  const [step, setStep] = useState<number>(1);
  const [loanType, setLoanType] = useState<string>(initialLoanType);
  const [loanAmount, setLoanAmount] = useState<string>('5000000');
  const [monthlyIncome, setMonthlyIncome] = useState<string>('100000');
  const [employmentType, setEmploymentType] = useState<string>(''); // No preselected employment type
  const [city, setCity] = useState<string>(''); // Completely blank initial value
  const [name, setName] = useState<string>(''); // Completely blank initial value
  const [phone, setPhone] = useState<string>(''); // Completely blank initial value
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const totalQuestions = 5;
  const progressPercent = isSubmitted
    ? 100
    : step === 6
    ? 90
    : Math.round(((step - 1) / totalQuestions) * 80 + 10);

  const formatCurrency = (val: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleNextStep = () => {
    setErrorMsg('');
    if (step < 6) {
      setStep(step + 1);
    }
  };

  const handlePrevStep = () => {
    setErrorMsg('');
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
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
    setStep(1);
    setLoanType('Home Loan');
    setLoanAmount('5000000');
    setMonthlyIncome('100000');
    setEmploymentType('');
    setCity('');
    setName('');
    setPhone('');
    setIsSubmitted(false);
    setErrorMsg('');
  };

  return (
    <div className="cz-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="cz-modal-container cz-quiz-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="cz-modal-header">
          <div className="cz-quiz-header-left">
            <span className="cz-quiz-badge">Eligibility Evaluation</span>
            {!isSubmitted && (
              <span className="cz-quiz-step-indicator">
                {step <= 5 ? `Question ${step} of 5` : 'Final Step: Contact Details'}
              </span>
            )}
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

        {/* Progress Bar */}
        <div className="cz-quiz-progress-track">
          <div
            className="cz-quiz-progress-bar"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Modal Body */}
        <div className="cz-modal-body">
          {!isSubmitted ? (
            <div className="cz-quiz-content">
              {/* Question 1: Loan Type */}
              {step === 1 && (
                <div className="cz-quiz-step-pane">
                  <h3 className="cz-quiz-question">1. What type of loan do you need?</h3>
                  <p className="cz-quiz-subtext">Choose the category that matches your requirement.</p>

                  <div className="cz-quiz-options-list">
                    {[
                      { id: 'Home Loan', icon: '🏠', desc: 'Buy or construct residential property' },
                      { id: 'Education Loan', icon: '🎓', desc: 'Studies in India or abroad' },
                      { id: 'Personal Loan', icon: '💰', desc: 'Personal or emergency requirements' },
                      { id: 'Business Loan', icon: '🏢', desc: 'Working capital & business expansion' },
                      { id: 'Loan Against Property', icon: '🏦', desc: 'Mortgage against commercial/residential property' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        className={`cz-quiz-option-card ${loanType === opt.id ? 'selected' : ''}`}
                        onClick={() => {
                          setLoanType(opt.id);
                          setStep(2);
                        }}
                      >
                        <span className="cz-option-icon">{opt.icon}</span>
                        <div className="cz-option-text">
                          <span className="cz-option-title">{opt.id}</span>
                          <span className="cz-option-desc">{opt.desc}</span>
                        </div>
                        <span className="cz-option-check">{loanType === opt.id ? '✓' : '→'}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Question 2: Loan Amount */}
              {step === 2 && (
                <div className="cz-quiz-step-pane">
                  <h3 className="cz-quiz-question">2. How much loan do you need?</h3>
                  <p className="cz-quiz-subtext">Select an approximate amount or type your requirement.</p>

                  <div className="cz-quiz-amount-display">
                    <span className="cz-curr-symbol">₹</span>
                    <input
                      type="number"
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(e.target.value)}
                      className="cz-quiz-amount-input"
                      placeholder="5000000"
                    />
                  </div>
                  <div className="cz-quiz-formatted-amount">
                    {Number(loanAmount) > 0 ? formatCurrency(Number(loanAmount)) : 'Enter amount'}
                  </div>

                  <div className="cz-quiz-quick-pills">
                    {[
                      { label: '₹15 Lakh', val: '1500000' },
                      { label: '₹30 Lakh', val: '3000000' },
                      { label: '₹50 Lakh', val: '5000000' },
                      { label: '₹75 Lakh', val: '7500000' },
                      { label: '₹1 Crore+', val: '10000000' },
                    ].map((pill) => (
                      <button
                        key={pill.val}
                        type="button"
                        className={`cz-quick-pill ${loanAmount === pill.val ? 'active' : ''}`}
                        onClick={() => setLoanAmount(pill.val)}
                      >
                        {pill.label}
                      </button>
                    ))}
                  </div>

                  <div className="cz-quiz-nav-row">
                    <button
                      type="button"
                      className="cz-btn cz-btn-secondary"
                      onClick={handlePrevStep}
                    >
                      &larr; Back
                    </button>
                    <button
                      type="button"
                      className="cz-btn cz-btn-primary"
                      onClick={handleNextStep}
                      disabled={!loanAmount || Number(loanAmount) <= 0}
                    >
                      Next &rarr;
                    </button>
                  </div>
                </div>
              )}

              {/* Question 3: Monthly Income */}
              {step === 3 && (
                <div className="cz-quiz-step-pane">
                  <h3 className="cz-quiz-question">3. What is your monthly in-hand income?</h3>
                  <p className="cz-quiz-subtext">This helps calculate your comfortable borrowing capacity.</p>

                  <div className="cz-quiz-amount-display">
                    <span className="cz-curr-symbol">₹</span>
                    <input
                      type="number"
                      value={monthlyIncome}
                      onChange={(e) => setMonthlyIncome(e.target.value)}
                      className="cz-quiz-amount-input"
                      placeholder="100000"
                    />
                  </div>
                  <div className="cz-quiz-formatted-amount">
                    {Number(monthlyIncome) > 0 ? `${formatCurrency(Number(monthlyIncome))} / month` : 'Enter income'}
                  </div>

                  <div className="cz-quiz-quick-pills">
                    {[
                      { label: '₹35,000', val: '35000' },
                      { label: '₹60,000', val: '60000' },
                      { label: '₹1 Lakh', val: '100000' },
                      { label: '₹2 Lakh', val: '200000' },
                      { label: '₹3 Lakh+', val: '300000' },
                    ].map((pill) => (
                      <button
                        key={pill.val}
                        type="button"
                        className={`cz-quick-pill ${monthlyIncome === pill.val ? 'active' : ''}`}
                        onClick={() => setMonthlyIncome(pill.val)}
                      >
                        {pill.label}
                      </button>
                    ))}
                  </div>

                  <div className="cz-quiz-nav-row">
                    <button
                      type="button"
                      className="cz-btn cz-btn-secondary"
                      onClick={handlePrevStep}
                    >
                      &larr; Back
                    </button>
                    <button
                      type="button"
                      className="cz-btn cz-btn-primary"
                      onClick={handleNextStep}
                      disabled={!monthlyIncome || Number(monthlyIncome) <= 0}
                    >
                      Next &rarr;
                    </button>
                  </div>
                </div>
              )}

              {/* Question 4: Employment Type */}
              {step === 4 && (
                <div className="cz-quiz-step-pane">
                  <h3 className="cz-quiz-question">4. What is your employment type?</h3>
                  <p className="cz-quiz-subtext">Different lenders have dedicated programs for salaried and business profiles.</p>

                  <div className="cz-quiz-employment-list">
                    <button
                      type="button"
                      className={`cz-emp-card ${employmentType === 'Salaried' ? 'selected' : ''}`}
                      onClick={() => setEmploymentType('Salaried')}
                    >
                      <span className="cz-emp-icon">👔</span>
                      <div className="cz-emp-text">
                        <span className="cz-emp-title">Salaried</span>
                        <span className="cz-emp-desc">Private / Govt employee with monthly salary credit</span>
                      </div>
                      <span className="cz-emp-check">{employmentType === 'Salaried' ? '✓' : '○'}</span>
                    </button>

                    <button
                      type="button"
                      className={`cz-emp-card ${employmentType === 'Self-Employed' ? 'selected' : ''}`}
                      onClick={() => setEmploymentType('Self-Employed')}
                    >
                      <span className="cz-emp-icon">💼</span>
                      <div className="cz-emp-text">
                        <span className="cz-emp-title">Self-Employed</span>
                        <span className="cz-emp-desc">Business owner, professional, or trader with ITR</span>
                      </div>
                      <span className="cz-emp-check">{employmentType === 'Self-Employed' ? '✓' : '○'}</span>
                    </button>

                    <button
                      type="button"
                      className={`cz-emp-card ${employmentType === 'Other' ? 'selected' : ''}`}
                      onClick={() => setEmploymentType('Other')}
                    >
                      <span className="cz-emp-icon">🔹</span>
                      <div className="cz-emp-text">
                        <span className="cz-emp-title">Other</span>
                        <span className="cz-emp-desc">Other employment / income profile</span>
                      </div>
                      <span className="cz-emp-check">{employmentType === 'Other' ? '✓' : '○'}</span>
                    </button>
                  </div>

                  <div className="cz-quiz-nav-row">
                    <button
                      type="button"
                      className="cz-btn cz-btn-secondary"
                      onClick={handlePrevStep}
                    >
                      &larr; Back
                    </button>
                    <button
                      type="button"
                      className="cz-btn cz-btn-primary"
                      onClick={handleNextStep}
                      disabled={!employmentType}
                    >
                      Continue &rarr;
                    </button>
                  </div>
                </div>
              )}

              {/* Question 5: City */}
              {step === 5 && (
                <div className="cz-quiz-step-pane">
                  <h3 className="cz-quiz-question">5. Which city do you reside in?</h3>
                  <p className="cz-quiz-subtext">Helps us assign local advisory specialists in your area.</p>

                  <div className="cz-form-group" style={{ marginTop: '8px' }}>
                    <input
                      id="quiz-city-input"
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Your City"
                      className="cz-input"
                      autoFocus
                    />
                  </div>

                  <div className="cz-quiz-nav-row">
                    <button
                      type="button"
                      className="cz-btn cz-btn-secondary"
                      onClick={handlePrevStep}
                    >
                      &larr; Back
                    </button>
                    <button
                      type="button"
                      className="cz-btn cz-btn-primary"
                      onClick={() => setStep(6)}
                      disabled={!city.trim()}
                    >
                      Continue to Options &rarr;
                    </button>
                  </div>
                </div>
              )}

              {/* Step 6: Final Contact Step */}
              {step === 6 && (
                <div className="cz-quiz-step-pane">
                  <div className="cz-summary-pill-row">
                    <span className="cz-summary-badge">🏠 {loanType}</span>
                    <span className="cz-summary-badge">₹ {formatCurrency(Number(loanAmount))}</span>
                    <span className="cz-summary-badge">📍 {city || 'Your City'}</span>
                  </div>

                  <h3 className="cz-quiz-question">Where should we send your loan options?</h3>
                  <p className="cz-quiz-subtext">
                    Enter your contact details. Our team will review your requirements and reach out with suitable options.
                  </p>

                  <form onSubmit={handleFinalSubmit} className="cz-quiz-contact-form">
                    <div className="cz-form-group">
                      <label htmlFor="quiz-name">Full Name <span className="cz-req">*</span></label>
                      <input
                        id="quiz-name"
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
                      <label htmlFor="quiz-phone">Mobile Number <span className="cz-req">*</span></label>
                      <div className="cz-phone-input-wrap">
                        <span className="cz-country-code">+91</span>
                        <input
                          id="quiz-phone"
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

                    {errorMsg && (
                      <div className="cz-quiz-error" role="alert">
                        <span>⚠️</span> {errorMsg}
                      </div>
                    )}

                    <div className="cz-quiz-submit-row">
                      <button
                        type="button"
                        className="cz-btn cz-btn-secondary"
                        onClick={handlePrevStep}
                      >
                        &larr; Back
                      </button>
                      <button
                        type="submit"
                        className="cz-btn cz-btn-primary cz-btn-large"
                      >
                        Get My Loan Options &rarr;
                      </button>
                    </div>

                    <p className="cz-privacy-note">
                      🔒 Safe & Secure. Your contact information is never shared with third-party telemarketers.
                    </p>
                  </form>
                </div>
              )}
            </div>
          ) : (
            /* Mock Success State */
            <div className="cz-quiz-success-pane" role="status">
              <div className="cz-success-check-large">✓</div>
              <h3 className="cz-success-title">Request Received</h3>
              <p className="cz-success-message">
                Thanks, <strong>{name}</strong>! Our loan team can help you explore suitable options.
              </p>

              <div className="cz-success-summary-card">
                <div className="cz-summary-item">
                  <span className="cz-sum-label">Loan Requirement:</span>
                  <span className="cz-sum-val">{loanType} ({formatCurrency(Number(loanAmount))})</span>
                </div>
                <div className="cz-summary-item">
                  <span className="cz-sum-label">Monthly Income:</span>
                  <span className="cz-sum-val">
                    {formatCurrency(Number(monthlyIncome))}/mo {employmentType ? `(${employmentType})` : ''}
                  </span>
                </div>
                <div className="cz-summary-item">
                  <span className="cz-sum-label">Location:</span>
                  <span className="cz-sum-val">{city || 'Your City'}</span>
                </div>
                <div className="cz-summary-item">
                  <span className="cz-sum-label">Contact:</span>
                  <span className="cz-sum-val">+91 {phone}</span>
                </div>
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
