import React, { useState } from 'react';

interface TestLabAuthGateProps {
  onUnlock: () => void;
}

export const TestLabAuthGate: React.FC<TestLabAuthGateProps> = ({ onUnlock }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (password === 'Ronil1872') {
      try {
        sessionStorage.setItem('credzo_test_lab_session', 'active');
      } catch {
        // Fallback for restricted storage environments
      }
      onUnlock();
    } else {
      setErrorMessage('Incorrect test access code. Access is restricted to internal staff.');
    }
  };

  return (
    <div className="test-lab-auth-container">
      <div className="test-lab-auth-card">
        <div className="test-lab-auth-icon">🧪</div>
        <h1 className="test-lab-auth-title">Credzo Test Lab</h1>
        <p className="test-lab-auth-desc">
          Private experimental playground for testing customer-facing features before production rollout.
        </p>

        <form onSubmit={handleSubmit} className="test-lab-auth-form">
          <div className="test-lab-field-group">
            <label htmlFor="test-lab-password-input" className="test-lab-label">
              Internal Prototype Access Key
            </label>
            <div className="test-lab-input-wrapper">
              <input
                id="test-lab-password-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="Enter access key"
                className="test-lab-input"
                autoFocus
                required
              />
              <button
                type="button"
                className="test-lab-toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="test-lab-error-msg" role="alert">
              <span>⚠️</span> {errorMessage}
            </div>
          )}

          <button type="submit" className="test-lab-submit-btn">
            Unlock Test Lab &rarr;
          </button>
        </form>

        <div className="test-lab-security-note">
          <p>
            <strong>Note:</strong> This is an internal prototype testing gate for draft features, not a production-grade authentication system.
          </p>
        </div>
      </div>
    </div>
  );
};
