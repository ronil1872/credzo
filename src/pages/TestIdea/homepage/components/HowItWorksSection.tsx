import React from 'react';

interface HowItWorksSectionProps {
  onStartEnquiry: () => void;
}

export const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({ onStartEnquiry }) => {
  const steps = [
    {
      num: '01',
      title: 'Tell Us What You Need',
      desc: 'Share your loan requirement and basic details in less than 2 minutes.',
      icon: '📝',
    },
    {
      num: '02',
      title: 'Explore Your Options',
      desc: 'Understand your estimated eligibility and available options.',
      icon: '🔍',
    },
    {
      num: '03',
      title: 'Get Assistance',
      desc: 'Speak with our loan team to clarify questions and proceed with your application.',
      icon: '🤝',
    },
  ];

  return (
    <section className="cz-section cz-works-section" id="how-it-works">
      <div className="cz-section-container">
        <div className="cz-section-header">
          <span className="cz-section-eyebrow">Seamless Journey</span>
          <h2 className="cz-section-title">How It Works</h2>
          <p className="cz-section-subtitle">
            A simple, transparent 3-step journey designed to save you time and effort.
          </p>
        </div>

        <div className="cz-works-grid">
          {steps.map((s, idx) => (
            <div key={idx} className="cz-works-card">
              <div className="cz-works-top">
                <span className="cz-works-badge">{s.num}</span>
                <span className="cz-works-icon">{s.icon}</span>
              </div>
              <h3 className="cz-works-title">{s.title}</h3>
              <p className="cz-works-desc">{s.desc}</p>
            </div>
          ))}
        </div>

        <div className="cz-works-cta">
          <button
            type="button"
            className="cz-btn cz-btn-primary cz-btn-large"
            onClick={onStartEnquiry}
          >
            <span>Start My Loan Enquiry</span>
            <span className="cz-btn-arrow">&rarr;</span>
          </button>
        </div>
      </div>
    </section>
  );
};
