import React, { useState } from 'react';
import './CustomerHomepage.css';

import { HomepageHeader } from './components/HomepageHeader';
import { HeroSection } from './components/HeroSection';
import { TrustStrip } from './components/TrustStrip';
import { LoanTypesSection } from './components/LoanTypesSection';
import { MidLeadCta } from './components/MidLeadCta';
import { LowestEmiSection } from './components/LowestEmiSection';
import { EducationLoanSection } from './components/EducationLoanSection';
import { HomeLoanAffordabilitySection } from './components/HomeLoanAffordabilitySection';
import { LocationSection } from './components/LocationSection';
import { WhyCredzoSection } from './components/WhyCredzoSection';
import { HowItWorksSection } from './components/HowItWorksSection';
import { FaqSection } from './components/FaqSection';
import { FinalLeadCtaSection } from './components/FinalLeadCtaSection';
import { HomepageFooter } from './components/HomepageFooter';
import { EligibilityQuizModal } from './components/EligibilityQuizModal';
import { QuickLeadModal } from './components/QuickLeadModal';
import { MobileStickyCta } from './components/MobileStickyCta';

export const CustomerHomepage: React.FC = () => {
  // Modal states
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [quizInitialLoanType, setQuizInitialLoanType] = useState('Home Loan');

  const [isQuickLeadModalOpen, setIsQuickLeadModalOpen] = useState(false);
  const [quickLeadConfig, setQuickLeadConfig] = useState({
    title: 'Talk to a Loan Expert',
    subtitle: 'Share your contact details and our advisory team will connect with you shortly.',
    defaultLoanType: 'Home Loan',
    extraContext: '',
  });

  const handleScrollToSection = (sectionId: string) => {
    if (sectionId === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const elem = document.getElementById(sectionId);
    if (elem) {
      const headerOffset = 70;
      const elementPosition = elem.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  const handleOpenQuiz = (loanType = 'Home Loan') => {
    setQuizInitialLoanType(loanType);
    setIsQuizModalOpen(true);
  };

  const handleOpenQuickLead = (
    title = 'Talk to a Loan Expert',
    subtitle = 'Share your contact details and our advisory team will connect with you shortly.',
    defaultLoanType = 'Home Loan',
    extraContext = ''
  ) => {
    setQuickLeadConfig({
      title,
      subtitle,
      defaultLoanType,
      extraContext,
    });
    setIsQuickLeadModalOpen(true);
  };

  return (
    <div className="cz-homepage-root">
      {/* Header */}
      <HomepageHeader
        onRequestCall={() =>
          handleOpenQuickLead('Request a Call', 'Leave your details below and our team will get in touch.')
        }
        onSelectSection={handleScrollToSection}
      />

      {/* Main Page Flow */}
      <main className="cz-homepage-main">
        {/* 1. Hero Section */}
        <HeroSection
          onCheckEligibility={() => handleOpenQuiz('Home Loan')}
          onTalkToExpert={() =>
            handleOpenQuickLead(
              'Talk to a Loan Expert',
              'Speak directly with a Credzo loan specialist for tailored advice.'
            )
          }
        />

        {/* 2. Trust Strip */}
        <TrustStrip />

        {/* 3. Loan Types */}
        <LoanTypesSection onSelectLoanType={(type) => handleOpenQuiz(type)} />

        {/* 4. Mid-Page Lead Prompt */}
        <MidLeadCta
          onTalkToExpert={() =>
            handleOpenQuickLead(
              'Talk to a Loan Expert',
              'Tell us what you need and we will help you evaluate suitable loan options.'
            )
          }
        />

        {/* 5. Lowest EMI Challenge (Refinance) */}
        <LowestEmiSection
          onTalkToExpert={(ctx) =>
            handleOpenQuickLead(
              'Home Loan Refinancing Consultation',
              'Explore options to lower your monthly home loan EMI with competitive balance transfers.',
              'Home Loan Refinancing',
              ctx
                ? `Discussing balance of ₹${new Intl.NumberFormat('en-IN').format(
                    ctx.balance
                  )} with potential monthly savings of ~₹${new Intl.NumberFormat('en-IN').format(ctx.savings)}/mo`
                : ''
            )
          }
        />

        {/* 6. Education Loan Section */}
        <EducationLoanSection
          onTalkToExpert={(ctx) =>
            handleOpenQuickLead(
              'Education Loan Consultation',
              'Connect with our education financing team to explore collateral & non-collateral study loans.',
              'Education Loan',
              ctx
                ? `Study destination: ${ctx.country}, Estimated loan requirement: ₹${new Intl.NumberFormat(
                    'en-IN'
                  ).format(ctx.requirement)}`
                : ''
            )
          }
        />

        {/* 7. Home Loan Affordability Section */}
        <HomeLoanAffordabilitySection
          onGetPersonalizedOptions={(ctx) =>
            handleOpenQuickLead(
              'Personalized Home Loan Options',
              'Get a customized assessment of suitable home loan options and interest structures.',
              'Home Loan',
              ctx
                ? `Monthly Income: ₹${new Intl.NumberFormat('en-IN').format(
                    ctx.income
                  )}, Est. Eligible Loan: ₹${new Intl.NumberFormat('en-IN').format(ctx.eligibleLoan)}`
                : ''
            )
          }
        />

        {/* 8. Location-Based Property Section */}
        <LocationSection
          onCheckCityOptions={() => handleOpenQuiz('Home Loan')}
        />

        {/* 9. Why Credzo */}
        <WhyCredzoSection />

        {/* 10. How It Works */}
        <HowItWorksSection
          onStartEnquiry={() => handleOpenQuiz('Home Loan')}
        />

        {/* 11. FAQ */}
        <FaqSection />

        {/* 12. Final Lead Section */}
        <FinalLeadCtaSection />
      </main>

      {/* Footer */}
      <HomepageFooter
        onSelectSection={handleScrollToSection}
        onRequestCall={() =>
          handleOpenQuickLead('Request a Call', 'Leave your details below and our team will get in touch.')
        }
      />

      {/* Mobile Sticky Bottom CTA */}
      <MobileStickyCta
        onTalkToExpert={() =>
          handleOpenQuickLead(
            'Talk to a Loan Expert',
            'Connect with our loan specialist in under 60 seconds.'
          )
        }
      />

      {/* 5-Step Qualification + Contact Modal */}
      <EligibilityQuizModal
        isOpen={isQuizModalOpen}
        initialLoanType={quizInitialLoanType}
        onClose={() => setIsQuizModalOpen(false)}
      />

      {/* Quick Lead Modal */}
      <QuickLeadModal
        isOpen={isQuickLeadModalOpen}
        title={quickLeadConfig.title}
        subtitle={quickLeadConfig.subtitle}
        defaultLoanType={quickLeadConfig.defaultLoanType}
        extraContext={quickLeadConfig.extraContext}
        onClose={() => setIsQuickLeadModalOpen(false)}
      />
    </div>
  );
};
