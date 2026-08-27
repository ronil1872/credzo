import React, { useState } from 'react';

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'What documents are required for a loan enquiry?',
      a: 'To start, you only need basic information about your income and loan requirement. When proceeding to lender evaluation, standard documents include identity proof (PAN & Aadhaar), income proofs (salary slips / ITR), and bank account statements for the last 6 months.',
    },
    {
      q: 'How does the eligibility check work?',
      a: 'Our eligibility estimation tool evaluates your net monthly income, existing financial obligations (EMIs), and loan requirements to calculate a comfortable borrowing limit based on standard banking guidelines (~50% FOIR).',
    },
    {
      q: 'Does checking eligibility affect my CIBIL score?',
      a: 'No. Checking your eligibility on Credzo is a soft initial estimation that does not trigger a hard bureau inquiry and has zero impact on your CIBIL credit score.',
    },
    {
      q: 'How long does the loan process take?',
      a: 'Initial eligibility and guidance can be completed in minutes. Depending on the loan type and document readiness, in-principle sanction typically takes 2–5 business days.',
    },
    {
      q: 'Can I apply if I am self-employed or have a business?',
      a: 'Yes, absolutely. Self-employed professionals, traders, and business owners can apply by providing 2–3 years of filed Income Tax Returns (ITR) with computation and business banking statements.',
    },
    {
      q: 'Can I get personal help choosing the right loan?',
      a: 'Yes. Our dedicated loan specialists can walk you through different options, explain interest structures (fixed vs floating), and help you select financing suited to your specific profile.',
    },
  ];

  return (
    <section className="cz-section cz-faq-section" id="faq">
      <div className="cz-section-container">
        <div className="cz-section-header">
          <span className="cz-section-eyebrow">Got Questions?</span>
          <h2 className="cz-section-title">Frequently Asked Questions</h2>
          <p className="cz-section-subtitle">
            Find quick answers to common questions about our loan advisory process and eligibility.
          </p>
        </div>

        <div className="cz-faq-wrapper">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className={`cz-faq-card ${openIndex === idx ? 'expanded' : ''}`}
            >
              <button
                type="button"
                className="cz-faq-question-btn"
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                aria-expanded={openIndex === idx}
              >
                <span className="cz-faq-q-text">{faq.q}</span>
                <span className="cz-faq-toggle-icon">
                  {openIndex === idx ? '−' : '+'}
                </span>
              </button>

              {openIndex === idx && (
                <div className="cz-faq-answer-body">
                  <p>{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
