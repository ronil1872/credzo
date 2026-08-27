import React from 'react';

export const WhyCredzoSection: React.FC = () => {
  const benefits = [
    {
      icon: '⚡',
      title: 'Simple Process',
      desc: 'Understand your options without complicated forms or confusing jargon.',
    },
    {
      icon: '🤝',
      title: 'Personal Assistance',
      desc: 'Speak with our team when you need help understanding requirements or steps.',
    },
    {
      icon: '📑',
      title: 'Multiple Loan Options',
      desc: 'Explore suitable financing options based on your needs.',
    },
    {
      icon: '🛡️',
      title: 'Transparent Guidance',
      desc: 'Understand the important costs, processing charges, and eligibility criteria upfront.',
    },
  ];

  return (
    <section className="cz-section cz-why-section" id="why-credzo">
      <div className="cz-section-container">
        <div className="cz-section-header">
          <span className="cz-section-eyebrow">Our Philosophy</span>
          <h2 className="cz-section-title">Why Choose Credzo?</h2>
          <p className="cz-section-subtitle">
            We provide clear, honest loan guidance to help you make informed financial decisions.
          </p>
        </div>

        <div className="cz-why-grid">
          {benefits.map((b, idx) => (
            <div key={idx} className="cz-why-card">
              <div className="cz-why-icon">{b.icon}</div>
              <h3 className="cz-why-title">{b.title}</h3>
              <p className="cz-why-desc">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
