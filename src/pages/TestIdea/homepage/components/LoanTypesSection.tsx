import React from 'react';

interface LoanTypesSectionProps {
  onSelectLoanType: (loanType: string) => void;
}

interface LoanCategory {
  id: string;
  icon: string;
  name: string;
  desc: string;
  features: string[];
}

const LOAN_CATEGORIES: LoanCategory[] = [
  {
    id: 'home-loan',
    icon: '🏠',
    name: 'Home Loan',
    desc: 'Buy or build your home',
    features: ['New home purchase', 'Plot + construction', 'Balance transfer & top-up'],
  },
  {
    id: 'education-loan',
    icon: '🎓',
    name: 'Education Loan',
    desc: 'Fund your studies',
    features: ['Study in India or Abroad', 'Tuition & living expenses', 'Flexible moratorium'],
  },
  {
    id: 'personal-loan',
    icon: '💰',
    name: 'Personal Loan',
    desc: 'For your personal needs',
    features: ['Unsecured financing', 'Minimal documentation', 'Fast approvals'],
  },
  {
    id: 'business-loan',
    icon: '🏢',
    name: 'Business Loan',
    desc: 'Grow your business',
    features: ['Working capital & expansion', 'Collateral-free options', 'Custom repayment'],
  },
  {
    id: 'loan-against-property',
    icon: '🏦',
    name: 'Loan Against Property',
    desc: 'Unlock the value of your property',
    features: ['Higher loan amounts', 'Longer repayment tenures', 'Competitive rates'],
  },
];

export const LoanTypesSection: React.FC<LoanTypesSectionProps> = ({ onSelectLoanType }) => {
  return (
    <section className="cz-section cz-loans-section" id="loans">
      <div className="cz-section-container">
        <div className="cz-section-header">
          <span className="cz-section-eyebrow">Our Offerings</span>
          <h2 className="cz-section-title">What type of loan are you looking for?</h2>
          <p className="cz-section-subtitle">
            Select a loan category below to explore estimated eligibility and connect with our loan specialists.
          </p>
        </div>

        <div className="cz-loan-grid">
          {LOAN_CATEGORIES.map((loan) => (
            <div key={loan.id} className="cz-loan-card">
              <div className="cz-loan-card-top">
                <div className="cz-loan-icon">{loan.icon}</div>
                <h3 className="cz-loan-title">{loan.name}</h3>
                <p className="cz-loan-desc">{loan.desc}</p>
              </div>

              <ul className="cz-loan-features">
                {loan.features.map((feat, idx) => (
                  <li key={idx}>
                    <span className="cz-feature-dot">•</span> {feat}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                className="cz-loan-card-btn"
                onClick={() => onSelectLoanType(loan.name)}
              >
                <span>Check Options</span>
                <span className="cz-arrow">&rarr;</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
