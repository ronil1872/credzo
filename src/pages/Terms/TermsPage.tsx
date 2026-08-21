import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui';
import './TermsPage.css';

export const TermsPage: React.FC = () => {
  return (
    <div className="legal-page-container">
      {/* Header */}
      <header className="legal-header">
        <span className="legal-badge">Legal & Compliance</span>
        <h1 className="legal-title">Terms & Disclaimer</h1>
        <p className="legal-subtitle">
          Important disclosures, platform terms of use, and non-lender status clarification for Credzo Finance.
        </p>
        <p className="legal-meta">Last Updated: August 2026</p>
      </header>

      {/* Primary Important Legal Disclaimer Notice */}
      <div className="legal-notice-card">
        <svg className="legal-notice-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <div className="legal-notice-content">
          <h3>Essential Non-Lender & Calculation Disclaimer</h3>
          <p>
            Credzo Finance is a customer acquisition, loan calculation, and lead-generation platform. <strong>We are NOT a bank, Non-Banking Financial Company (NBFC), or official lending institution.</strong> We do not issue loans, make credit sanction decisions, or disburse funds. All calculator outputs are strictly illustrative estimates.
          </p>
        </div>
      </div>

      {/* Main Terms Content Card */}
      <div className="legal-body-card">
        {/* Section 1 */}
        <section className="legal-section">
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using the Credzo Finance website ("the Platform"), utilizing our loan EMI calculators, or voluntarily submitting an estimate enquiry or callback request, you agree to be bound by these Terms & Disclaimer ("Terms").
          </p>
          <p>
            If you do not agree to these Terms in their entirety, please refrain from using our calculation tools and enquiry services.
          </p>
        </section>

        {/* Section 2 */}
        <section className="legal-section">
          <h2>2. Nature of Platform & Non-Lender Status</h2>
          <p>
            Credzo Finance provides financial planning tools and loan enquiry facilitation. It is vital to understand the exact scope of our services:
          </p>
          <ul className="legal-list">
            <li>
              <strong>Non-Lender Clarification:</strong> Credzo Finance is not an authorized bank, NBFC, lender, or financial depository under the Reserve Bank of India (RBI) regulations. We do not accept deposits, grant loans, or underwrite credit risks.
            </li>
            <li>
              <strong>Facilitation Role:</strong> Our role is limited to offering illustrative computation tools and connecting prospective borrowers with representative loan specialists and independent lending partners.
            </li>
            <li>
              <strong>Independent Decisions:</strong> Final loan sanction, interest rate fixation, processing fee determination, and credit disbursement are the sole prerogative of the independent lending institutions with which you may choose to transact.
            </li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="legal-section">
          <h2>3. Illustrative EMI Calculations Only</h2>
          <p>
            All financial calculations provided on this website—including monthly EMIs, total interest amounts, repayment ratios, and amortization schedules—are strictly indicative and based upon standard mathematical reducing-balance formulas:
          </p>
          <ul className="legal-list">
            <li>
              Calculations use user-entered parameters (such as principal amount and tenure) and sample illustrative interest rates.
            </li>
            <li>
              Actual interest rates and EMIs offered by lenders may vary based on your credit score, income verification, debt-to-income ratio, collateral valuation, and internal lender policies.
            </li>
            <li>
              Calculator estimates do not account for individual processing fees, statutory stamp duties, insurance premiums, or applicable taxes (such as GST).
            </li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="legal-section">
          <h2>4. No Guarantee of Loan Sanction or Approval</h2>
          <p>
            Using our calculators or submitting a callback request does <strong>NOT</strong> constitute:
          </p>
          <ul className="legal-list">
            <li>A loan application submission to any bank or NBFC.</li>
            <li>A loan approval, pre-approval, sanction letter, or commitment to lend.</li>
            <li>A guarantee that you will receive loan offers matching the illustrative calculations.</li>
          </ul>
          <p>
            Approval and disbursement are subject entirely to formal documentation, KYC verification, credit bureau evaluation, and lender sanction policies.
          </p>
        </section>

        {/* Section 5 */}
        <section className="legal-section">
          <h2>5. User Eligibility & Information Accuracy</h2>
          <p>
            By using this website and submitting callback requests, you confirm that:
          </p>
          <ul className="legal-list">
            <li>You are at least 18 years of age and legally competent to enter into contracts under applicable Indian laws.</li>
            <li>You are a resident of India.</li>
            <li>All information you provide (including name, contact number, income, and existing obligations) is accurate, truthful, and complete.</li>
            <li>You are submitting enquiries on your own behalf and not impersonating any other individual.</li>
          </ul>
        </section>

        {/* Section 6 */}
        <section className="legal-section">
          <h2>6. Free Estimation & No Upfront Fees</h2>
          <p>
            Credzo Finance provides its loan calculation tools and initial enquiry routing 100% free of charge to consumers.
          </p>
          <p>
            <strong>Fraud Advisory:</strong> Credzo Finance will never ask you to pay advance fees, security deposits, or upfront processing charges to view calculation results or request a callback. Please exercise caution if anyone claiming to represent Credzo Finance solicits advance payments.
          </p>
        </section>

        {/* Section 7 */}
        <section className="legal-section">
          <h2>7. Communication Authorization</h2>
          <p>
            When you submit your mobile number and check the consent box on our enquiry forms, you provide express authorization for Credzo Finance and its authorized partner loan specialists to contact you via telephone calls, SMS, WhatsApp messages, or email regarding your loan enquiry.
          </p>
          <p>
            You agree that this consent takes precedence over any registration on the National Do Not Call (NDNC) registry or Telecom Commercial Communications Customer Preference Regulations (TCCCPR).
          </p>
        </section>

        {/* Section 8 */}
        <section className="legal-section">
          <h2>8. Intellectual Property</h2>
          <p>
            All content, visual interfaces, website architecture, calculation logic, graphics, design tokens, and trademarks displayed on Credzo Finance are the intellectual property of Credzo Finance. No content may be copied, reproduced, or distributed without prior written permission.
          </p>
        </section>

        {/* Section 9 */}
        <section className="legal-section">
          <h2>9. Limitation of Liability</h2>
          <p>
            The website, calculator engines, and information are provided on an "as is" and "as available" basis without warranties of any kind, whether express or implied.
          </p>
          <p>
            To the fullest extent permitted by law, Credzo Finance, its founders, and operators shall not be liable for any direct, indirect, incidental, consequential, or punitive damages arising from:
          </p>
          <ul className="legal-list">
            <li>Your use of, or inability to use, our website or calculation tools.</li>
            <li>Any financial decisions made based on illustrative calculator estimates.</li>
            <li>Any rejection, delay, or dispute regarding a loan application processed by an independent lender.</li>
            <li>Any technical inaccuracies, typographical errors, or website downtime.</li>
          </ul>
        </section>

        {/* Section 10 */}
        <section className="legal-section">
          <h2>10. Governing Law & Jurisdiction</h2>
          <p>
            These Terms & Disclaimer shall be governed by and construed in accordance with the laws of the Republic of India. Any disputes arising out of or in connection with the use of this website shall be subject to the exclusive jurisdiction of the competent courts in India.
          </p>
        </section>

        {/* Section 11 */}
        <section className="legal-section">
          <h2>11. Modifications to Terms</h2>
          <p>
            Credzo Finance reserves the right to amend, update, or modify these Terms & Disclaimer at any time without prior notice. Any modifications become effective immediately upon being published on this page. Your continued use of the website following changes signifies your acceptance.
          </p>
        </section>

        {/* Section 12 */}
        <section className="legal-section">
          <h2>12. Contact Information</h2>
          <p>
            If you have questions, feedback, or concerns regarding these Terms & Disclaimer, please reach out to our team:
          </p>
          <p>
            <Link to="/contact" style={{ fontWeight: 700 }}>
              Visit the Credzo Finance Contact Page &rarr;
            </Link>
          </p>
        </section>
      </div>

      {/* Footer Navigation Box */}
      <div className="legal-footer-card">
        <h3>Need to Calculate or Connect?</h3>
        <p>
          Check illustrative installments on our free loan calculator or send an enquiry to our team.
        </p>
        <div className="legal-footer-links">
          <Button to="/calculator" variant="primary" size="sm">
            Loan Calculator
          </Button>
          <Button to="/privacy" variant="secondary" size="sm">
            Privacy Policy
          </Button>
          <Button to="/contact" variant="outline" size="sm">
            Contact Support
          </Button>
        </div>
      </div>
    </div>
  );
};
