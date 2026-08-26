import React from 'react';

interface TestLabHeaderProps {
  activeExperimentTitle?: string;
  onBackToLab: () => void;
  onLogout: () => void;
}

export const TestLabHeader: React.FC<TestLabHeaderProps> = ({
  activeExperimentTitle,
  onBackToLab,
  onLogout,
}) => {
  return (
    <>
      {/* Top Warning Banner */}
      <div className="test-lab-top-banner" role="banner">
        <div className="test-lab-banner-badge">
          <span>🧪</span> TEST LAB — NOT PUBLIC
        </div>
        <div className="test-lab-banner-text">
          Draft Prototyping Environment • Isolated Mock Data Only
        </div>
      </div>

      {/* Main Lab Header Bar */}
      <header className="test-lab-header">
        <div className="test-lab-header-brand" onClick={onBackToLab}>
          <div className="test-lab-header-icon">🧪</div>
          <div>
            <div className="test-lab-brand-title">
              Credzo Test Lab
              <span className="test-lab-tag">v0.1 Prototype</span>
            </div>
            <div className="test-lab-brand-subtitle">
              {activeExperimentTitle ? `Experiment: ${activeExperimentTitle}` : 'Experimental Features Playground'}
            </div>
          </div>
        </div>

        <div className="test-lab-header-actions">
          {activeExperimentTitle && (
            <button
              type="button"
              className="test-lab-btn test-lab-btn-outline"
              onClick={onBackToLab}
            >
              &larr; Back to Test Lab
            </button>
          )}

          <button
            type="button"
            className="test-lab-btn test-lab-btn-danger"
            onClick={onLogout}
          >
            Logout
          </button>
        </div>
      </header>
    </>
  );
};
