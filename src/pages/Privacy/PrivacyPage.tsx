import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui';
import './PrivacyPage.css';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="legal-page-container">
      {/* Header */}
      <header className="legal-header">
        <span className="legal-badge">Transparency & Trust</span>
        <h1 className="legal-title">Privacy Policy</h1>
        <p className="legal-subtitle">
          How Credzo Finance collects, uses, and safeguards your voluntary loan enquiry and calculation information.
        </p>
        <p className="legal-meta">Last Updated: August 2026</p>
      </header>

      {/* Primary Trust Notice */}
      <div className="legal-notice-card">
        <svg className="legal-notice-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <div className="legal-notice-content">
          <h3>Commitment to Privacy & Non-Lender Notice</h3>
          <p>
            Credzo Finance operates strictly as a financial technology facilitator, loan calculator, and customer enquiry platform. We are not a bank, Non-Banking Financial Company (NBFC), or direct lender. We respect your personal privacy and handle your enquiry details with confidentiality and care.
          </p>
        </div>
      </div>

      {/* Main Policy Content Card */}
      <div className="legal-body-card">
        {/* Section 1 */}
        <section className="legal-section">
          <h2>1. Introduction</h2>
          <p>
            Welcome to Credzo Finance ("we," "our," or "us"). This Privacy Policy outlines our practices regarding the collection, use, processing, and protection of personal and financial information provided by users ("you" or "user") when visiting our website, utilizing our free loan EMI calculators, or voluntarily submitting loan callback and support enquiries.
          </p>
          <p>
            By accessing our website, using our estimation tools, or submitting an enquiry, you acknowledge and agree to the practices outlined in this Privacy Policy.
          </p>
        </section>

        {/* Section 2 */}
        <section className="legal-section">
          <h2>2. Information We Collect</h2>
          <p>
            We collect only the information necessary to provide accurate illustrative calculations, assist with your loan enquiries, and facilitate scheduled callbacks. This information is collected directly when you enter details into our calculators, lead forms, or contact forms:
          </p>
          <ul className="legal-list">
            <li>
              <strong>Contact Identification:</strong> Full name, 10-digit mobile number, email address (when submitting contact requests), and city or residential location.
            </li>
            <li>
              <strong>Loan Requirements:</strong> Selected loan category (such as Personal, Business, Home, Loan Against Property, Gold, or Other Loans), requested principal amount, and desired loan tenure.
            </li>
            <li>
              <strong>Applicant Profile (Self-Reported):</strong> Monthly net income, existing monthly EMI commitments, and employment type (Salaried, Self-Employed Professional, or Business Owner).
            </li>
            <li>
              <strong>Communication & Callback Preferences:</strong> Preferred callback date and time window (Morning, Afternoon, or Evening).
            </li>
            <li>
              <strong>Consent Records:</strong> Affirmative consent checkbox confirmation and timestamp recorded at the time of voluntary enquiry submission.
            </li>
            <li>
              <strong>Technical & Attribution Data:</strong> Referral source, campaign identifiers, and standard UTM parameters (e.g. utm_source, utm_medium, utm_campaign) stored temporarily in browser session storage to understand how visitors find our platform.
            </li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="legal-section">
          <h2>3. How We Use Your Information</h2>
          <p>
            Credzo Finance uses the collected information strictly for legitimate business purposes related to customer service and loan facilitation, including:
          </p>
          <ul className="legal-list">
            <li>
              <strong>Generating Estimations:</strong> Providing real-time illustrative EMI calculations, amortization breakdowns, and indicative repayment schedules.
            </li>
            <li>
              <strong>Facilitating Requested Callbacks:</strong> Connecting you with authorized loan specialists and arranging phone discussions at your preferred time.
            </li>
            <li>
              <strong>Customer Support:</strong> Responding to questions, feedback, or general support requests submitted through our Contact Us page.
            </li>
            <li>
              <strong>Platform Optimization:</strong> Analyzing aggregate website performance, improving calculator usability, and measuring campaign effectiveness without profiling individuals for unrelated advertising.
            </li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="legal-section">
          <h2>4. Sharing of Information</h2>
          <p>
            We respect the confidentiality of your financial enquiries. Information is shared only under specific, legitimate operational circumstances:
          </p>
          <ul className="legal-list">
            <li>
              <strong>Loan Specialists & Financial Partners:</strong> When you voluntarily request a callback, your contact details and loan requirement may be shared with authorized loan specialists or participating lending partners to review your inquiry and discuss potential loan options.
            </li>
            <li>
              <strong>No Sale of Data:</strong> Credzo Finance does <strong>NOT</strong> sell, rent, trade, or lease your personal contact information to third-party telemarketing agencies or unrelated advertising networks.
            </li>
            <li>
              <strong>Legal Compliance:</strong> We may disclose information if required by applicable Indian laws, judicial proceedings, or lawful governmental requests.
            </li>
          </ul>
        </section>

        {/* Section 5 */}
        <section className="legal-section">
          <h2>5. Data Security & Storage</h2>
          <p>
            We implement industry-standard technical and organizational security measures to protect your personal data from unauthorized access, loss, misuse, or alteration:
          </p>
          <ul className="legal-list">
            <li>
              <strong>Encryption in Transit:</strong> All communications between your browser and our servers are encrypted using standard Secure Sockets Layer / Transport Layer Security (SSL/TLS).
            </li>
            <li>
              <strong>Database Access Controls:</strong> Backend databases are governed by Row Level Security (RLS) policies, restricting access strictly to authenticated administrative and authorized staff workflows.
            </li>
            <li>
              <strong>Session Storage:</strong> Marketing attribution parameters and temporary calculator snapshots are stored locally within your browser's session storage and expire automatically when your browsing session ends.
            </li>
          </ul>
        </section>

        {/* Section 6 */}
        <section className="legal-section">
          <h2>6. Communication & Consent</h2>
          <p>
            By checking the consent box and submitting a loan estimate enquiry or callback request, you expressly grant permission to Credzo Finance and its authorized representatives to contact you via telephone, SMS, WhatsApp, or email regarding your specific inquiry.
          </p>
          <p>
            This voluntary consent authorizes communication regarding your requested loan enquiry notwithstanding any registration on the National Do Not Call (NDNC) or Telecom Commercial Communications Customer Preference Regulations (TCCCPR) registries.
          </p>
        </section>

        {/* Section 7 */}
        <section className="legal-section">
          <h2>7. User Rights & Choices</h2>
          <p>
            You have control over your personal communication preferences:
          </p>
          <ul className="legal-list">
            <li>
              <strong>Opt-Out of Communications:</strong> If you no longer wish to receive callback calls or follow-ups, you may notify us anytime via our Contact page.
            </li>
            <li>
              <strong>Correction of Information:</strong> You may request updates or corrections to any contact details you previously submitted.
            </li>
          </ul>
        </section>

        {/* Section 8 */}
        <section className="legal-section">
          <h2>8. Third-Party Lending Websites & Services</h2>
          <p>
            Our website facilitates loan estimation and initial enquiries. If you subsequently choose to apply for a loan with an independent lending institution, any documentation, credit checks, or personal records you provide directly to that lender will be governed by that respective institution's privacy policy and terms.
          </p>
        </section>

        {/* Section 9 */}
        <section className="legal-section">
          <h2>9. Updates to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time to reflect operational, legal, or regulatory changes. Any modifications will be posted on this page with an updated "Last Updated" date. Continued use of our website constitutes acceptance of the revised policy.
          </p>
        </section>

        {/* Section 10 */}
        <section className="legal-section">
          <h2>10. Contact Us Regarding Privacy</h2>
          <p>
            If you have questions, concerns, or requests regarding this Privacy Policy or how your information is handled, please submit an inquiry through our dedicated support page:
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
        <h3>Explore Credzo Finance</h3>
        <p>
          Calculate loan installments, review our website terms, or get in touch with our team.
        </p>
        <div className="legal-footer-links">
          <Button to="/calculator" variant="primary" size="sm">
            Loan Calculator
          </Button>
          <Button to="/terms" variant="secondary" size="sm">
            Terms & Disclaimer
          </Button>
          <Button to="/contact" variant="outline" size="sm">
            Contact Support
          </Button>
        </div>
      </div>
    </div>
  );
};
