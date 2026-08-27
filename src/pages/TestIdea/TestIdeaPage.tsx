import React, { useState, useEffect } from 'react';
import './TestIdeaPage.css';
import { ExperimentId, ExperimentMetadata } from './types';
import { TestLabAuthGate } from './components/TestLabAuthGate';
import { TestLabHeader } from './components/TestLabHeader';
import { ExperimentCard } from './components/ExperimentCard';

// Isolated Experiment Components
import { CustomerHomepage } from './homepage/CustomerHomepage';
import { LowestEMIExperiment } from './experiments/LowestEMI/LowestEMIExperiment';
import { EducationLoanExperiment } from './experiments/EducationLoan/EducationLoanExperiment';
import { LocationLandingExperiment } from './experiments/LocationLanding/LocationLandingExperiment';
import { AdLandingExperiment } from './experiments/AdLanding/AdLandingExperiment';

const EXPERIMENTS: ExperimentMetadata[] = [
  {
    id: 'customer-homepage',
    title: 'Customer Homepage Prototype',
    category: 'Flagship Experience',
    icon: '🌟',
    description: 'High-converting, lead-first public customer homepage prototype combining simplified loan advisory, instant 5-step eligibility flow, localized property guide, and secondary savings calculators.',
    status: 'Review Ready',
    estimatedEffort: 'Flagship',
    tags: ['LeadFirst', 'FullHomepage', 'MobileFirst', 'Prototype'],
    isPrimary: true,
  },
  {
    id: 'lowest-emi',
    title: 'Lowest EMI Challenge',
    category: 'Refinance & Savings',
    icon: '💰',
    description: 'Compare existing home loan interest rate and EMI to compute estimated potential monthly & annual refinancing savings.',
    status: 'In Prototyping',
    estimatedEffort: 'Phase 1',
    tags: ['BalanceTransfer', 'Savings', 'Refinancing'],
  },
  {
    id: 'education-loan',
    title: 'Education Loan Calculator',
    category: 'Higher Education',
    icon: '🎓',
    description: 'Calculate net funding requirement across tuition fees, overseas living costs, and scholarships with course moratorium guidance.',
    status: 'In Prototyping',
    estimatedEffort: 'Phase 1',
    tags: ['StudyAbroad', 'StudentLoan', 'University'],
  },
  {
    id: 'location-landing',
    title: 'Location-Based Home Loan',
    category: 'Local SEO Landing',
    icon: '📍',
    description: 'Localized landing page prototype featuring property insights, municipal guidelines, local property EMIs, and borrower FAQs.',
    status: 'In Prototyping',
    estimatedEffort: 'Phase 1',
    tags: ['Location', 'CityLanding', 'HomeLoan'],
  },
  {
    id: 'ad-landing',
    title: 'Home Loan Ad Landing Page',
    category: 'Paid Media Ads',
    icon: '📣',
    description: 'High-conversion, distraction-free 5-step eligibility quiz tailored for Instagram & Google Ads campaigns.',
    status: 'In Prototyping',
    estimatedEffort: 'Phase 1',
    tags: ['PaidAds', 'HighConversion', 'LeadFunnel'],
  },
];

export const TestIdeaPage: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('credzo_test_lab_session') === 'active';
    } catch {
      return false;
    }
  });

  const [activeExperimentId, setActiveExperimentId] = useState<ExperimentId | null>(null);
  const [showNewExperimentModal, setShowNewExperimentModal] = useState<boolean>(false);

  // Dynamic meta tags enforcement: noindex, nofollow, noarchive
  useEffect(() => {
    let metaRobots = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    let created = false;
    const originalContent = metaRobots ? metaRobots.content : 'index, follow';

    if (metaRobots) {
      metaRobots.content = 'noindex, nofollow, noarchive';
    } else {
      metaRobots = document.createElement('meta');
      metaRobots.name = 'robots';
      metaRobots.content = 'noindex, nofollow, noarchive';
      document.head.appendChild(metaRobots);
      created = true;
    }

    return () => {
      if (created && metaRobots && metaRobots.parentNode) {
        metaRobots.parentNode.removeChild(metaRobots);
      } else if (metaRobots) {
        metaRobots.content = originalContent;
      }
    };
  }, []);

  const handleUnlock = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    try {
      sessionStorage.removeItem('credzo_test_lab_session');
    } catch {
      // Ignore storage errors
    }
    setIsAuthenticated(false);
    setActiveExperimentId(null);
  };

  const handleBackToLab = () => {
    setActiveExperimentId(null);
  };

  if (!isAuthenticated) {
    return (
      <div className="test-lab-root">
        <TestLabAuthGate onUnlock={handleUnlock} />
      </div>
    );
  }

  const activeExperiment = EXPERIMENTS.find((e) => e.id === activeExperimentId);
  const primaryExperiment = EXPERIMENTS.find((e) => e.isPrimary);
  const subExperiments = EXPERIMENTS.filter((e) => !e.isPrimary);

  return (
    <div className="test-lab-root">
      <TestLabHeader
        activeExperimentTitle={activeExperiment?.title}
        onBackToLab={handleBackToLab}
        onLogout={handleLogout}
      />

      <main className="test-lab-main">
        {/* Lab Rules Notice */}
        <div className="test-lab-rules-box" role="region" aria-label="Experimental Environment Notice">
          <div className="test-lab-rules-icon">💡</div>
          <div>
            <strong>Internal Prototype Environment:</strong> All experiments inside this lab use local React state and mock calculation engines. No data is sent to production Supabase or CRM.
          </div>
        </div>

        {activeExperimentId ? (
          /* Active Experiment View */
          <div className="experiment-view-container">
            <div className="experiment-view-header">
              <div className="experiment-view-title-group">
                <span className="experiment-view-icon">{activeExperiment?.icon}</span>
                <div>
                  <h2 className="experiment-view-title">{activeExperiment?.title}</h2>
                  <p className="experiment-view-subtitle">
                    {activeExperiment?.category} • Status: {activeExperiment?.status}
                  </p>
                </div>
              </div>

              <div className="experiment-view-actions">
                {activeExperimentId !== 'customer-homepage' && (
                  <button
                    type="button"
                    className="test-lab-btn test-lab-btn-primary"
                    onClick={() => setActiveExperimentId('customer-homepage')}
                  >
                    View Full Homepage Prototype &rarr;
                  </button>
                )}
                <button
                  type="button"
                  className="test-lab-btn test-lab-btn-outline"
                  onClick={handleBackToLab}
                >
                  &larr; Back to Test Lab Hub
                </button>
              </div>
            </div>

            {/* Render Isolated Experiment Component */}
            {activeExperimentId === 'customer-homepage' && <CustomerHomepage />}
            {activeExperimentId === 'lowest-emi' && <LowestEMIExperiment />}
            {activeExperimentId === 'education-loan' && <EducationLoanExperiment />}
            {activeExperimentId === 'location-landing' && <LocationLandingExperiment />}
            {activeExperimentId === 'ad-landing' && <AdLandingExperiment />}
          </div>
        ) : (
          /* Dashboard Hub View */
          <>
            <div className="test-lab-hero">
              <div className="test-lab-hero-text">
                <h1>
                  <span>🧪</span> Credzo Test Lab
                </h1>
                <p>
                  Isolated prototyping workspace for testing novel financial tools, calculation flows, and UX concepts prior to production deployment.
                </p>
              </div>

              <button
                type="button"
                className="test-lab-btn test-lab-btn-primary"
                onClick={() => setShowNewExperimentModal(true)}
              >
                + New Experiment
              </button>
            </div>

            {/* Featured Flagship Prototype Banner */}
            {primaryExperiment && (
              <div className="test-lab-flagship-card">
                <div className="flagship-card-left">
                  <div className="flagship-badge-row">
                    <span className="flagship-badge">★ MAIN PROTOTYPE</span>
                    <span className="flagship-status-badge">{primaryExperiment.status}</span>
                  </div>
                  <h2 className="flagship-title">{primaryExperiment.title}</h2>
                  <p className="flagship-desc">{primaryExperiment.description}</p>
                  <div className="flagship-tags">
                    {primaryExperiment.tags.map((tag) => (
                      <span key={tag} className="experiment-tag">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flagship-card-right">
                  <button
                    type="button"
                    className="test-lab-btn test-lab-btn-primary flagship-cta-btn"
                    onClick={() => setActiveExperimentId(primaryExperiment.id)}
                  >
                    Open Full Homepage &rarr;
                  </button>
                </div>
              </div>
            )}

            <div className="test-lab-grid-header">
              <h2 className="test-lab-grid-title">Focused Sub-Experiments</h2>
              <span className="test-lab-grid-count">{subExperiments.length} Available Tools</span>
            </div>

            <div className="test-lab-grid">
              {subExperiments.map((experiment) => (
                <ExperimentCard
                  key={experiment.id}
                  experiment={experiment}
                  onLaunch={(id) => setActiveExperimentId(id)}
                />
              ))}
            </div>
          </>
        )}
      </main>

      {/* New Experiment Guidance Modal */}
      {showNewExperimentModal && (
        <div className="test-lab-modal-overlay" onClick={() => setShowNewExperimentModal(false)}>
          <div className="test-lab-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="test-lab-modal-header">
              <h3 className="test-lab-modal-title">Create a New Experiment</h3>
              <button
                type="button"
                className="test-lab-modal-close"
                onClick={() => setShowNewExperimentModal(false)}
              >
                &times;
              </button>
            </div>

            <div className="test-lab-modal-body">
              <p>
                To add a new experiment to the Test Lab without affecting the production website:
              </p>
              <div className="test-lab-code-block">
                src/pages/TestIdea/experiments/YourExperimentName/
              </div>
              <p>
                Create your experiment component with isolated local state and register it in <code>src/pages/TestIdea/types.ts</code> and <code>src/pages/TestIdea/TestIdeaPage.tsx</code>.
              </p>
            </div>

            <button
              type="button"
              className="test-lab-btn test-lab-btn-primary"
              style={{ width: '100%' }}
              onClick={() => setShowNewExperimentModal(false)}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestIdeaPage;
