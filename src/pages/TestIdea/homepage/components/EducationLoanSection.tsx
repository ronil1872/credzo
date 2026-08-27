import React, { useState, useMemo } from 'react';

interface EducationLoanSectionProps {
  onTalkToExpert: (context?: { country: string; requirement: number }) => void;
}

export const EducationLoanSection: React.FC<EducationLoanSectionProps> = ({ onTalkToExpert }) => {
  const [country, setCountry] = useState<string>('USA');
  const [course, setCourse] = useState<string>('STEM / Masters');
  const [tuitionFees, setTuitionFees] = useState<number>(3000000);
  const [livingCosts, setLivingCosts] = useState<number>(1500000);
  const [existingFunding, setExistingFunding] = useState<number>(500000);
  const [calculated, setCalculated] = useState<boolean>(true);

  const totalCost = tuitionFees + livingCosts;
  const netLoanRequirement = Math.max(0, totalCost - existingFunding);

  // Indicative monthly interest during moratorium
  const estimatedMoratoriumInterest = useMemo(() => {
    const indicativeRate = country === 'India' ? 0.095 : 0.105;
    return Math.round((netLoanRequirement * indicativeRate) / 12);
  }, [netLoanRequirement, country]);

  const formatCurrency = (val: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    setCalculated(true);
  };

  return (
    <section className="cz-section cz-edu-section" id="education-loan">
      <div className="cz-section-container">
        <div className="cz-section-header">
          <span className="cz-section-eyebrow">Higher Studies Financing</span>
          <h2 className="cz-section-title">Planning to Study in India or Abroad?</h2>
          <p className="cz-section-subtitle">
            Understand your estimated education funding requirement and explore loan options with flexible repayment terms.
          </p>
        </div>

        <div className="cz-edu-grid">
          {/* Inputs Column */}
          <div className="cz-edu-card cz-edu-input-card">
            <h3 className="cz-card-title">Study & Budget Details</h3>

            <form onSubmit={handleCalculate} className="cz-form">
              {/* Destination Country */}
              <div className="cz-form-group">
                <label htmlFor="edu-country">Study Destination</label>
                <select
                  id="edu-country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="cz-select"
                >
                  <option value="USA">🇺🇸 United States</option>
                  <option value="UK">🇬🇧 United Kingdom</option>
                  <option value="Canada">🇨🇦 Canada</option>
                  <option value="Germany">🇩🇪 Germany / Europe</option>
                  <option value="Australia">🇦🇺 Australia</option>
                  <option value="India">🇮🇳 India</option>
                  <option value="Other">🌍 Other Destination</option>
                </select>
              </div>

              {/* Course Type */}
              <div className="cz-form-group">
                <label htmlFor="edu-course">Course / Degree</label>
                <select
                  id="edu-course"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  className="cz-select"
                >
                  <option value="STEM / Masters">MS / STEM Master's</option>
                  <option value="MBA / Management">MBA / Business Management</option>
                  <option value="Undergraduate">Undergraduate / Bachelor's</option>
                  <option value="Medicine / Healthcare">Medical / Healthcare</option>
                  <option value="Other Course">Other Specialized Degree</option>
                </select>
              </div>

              {/* Tuition Fees */}
              <div className="cz-form-group">
                <div className="cz-label-row">
                  <label htmlFor="edu-tuition">Estimated Tuition Fees</label>
                  <span className="cz-label-value">{formatCurrency(tuitionFees)}</span>
                </div>
                <input
                  id="edu-tuition"
                  type="range"
                  min="500000"
                  max="8000000"
                  step="100000"
                  value={tuitionFees}
                  onChange={(e) => setTuitionFees(Number(e.target.value))}
                  className="cz-range-slider"
                />
              </div>

              {/* Living Costs */}
              <div className="cz-form-group">
                <div className="cz-label-row">
                  <label htmlFor="edu-living">Living & Accommodation Costs</label>
                  <span className="cz-label-value">{formatCurrency(livingCosts)}</span>
                </div>
                <input
                  id="edu-living"
                  type="range"
                  min="200000"
                  max="4000000"
                  step="50000"
                  value={livingCosts}
                  onChange={(e) => setLivingCosts(Number(e.target.value))}
                  className="cz-range-slider"
                />
              </div>

              {/* Existing Funding */}
              <div className="cz-form-group">
                <div className="cz-label-row">
                  <label htmlFor="edu-existing">Savings / Scholarships</label>
                  <span className="cz-label-value">{formatCurrency(existingFunding)}</span>
                </div>
                <input
                  id="edu-existing"
                  type="range"
                  min="0"
                  max="3000000"
                  step="50000"
                  value={existingFunding}
                  onChange={(e) => setExistingFunding(Number(e.target.value))}
                  className="cz-range-slider"
                />
              </div>

              <button type="submit" className="cz-btn cz-btn-secondary cz-btn-block">
                Check Education Loan Options
              </button>
            </form>
          </div>

          {/* Results Column */}
          <div className="cz-edu-card cz-edu-result-card">
            <div className="cz-result-header">
              <span className="cz-result-badge">Funding Breakdown</span>
              <h3 className="cz-result-title">Estimated Funding Requirement</h3>
            </div>

            {calculated && (
              <div className="cz-result-content">
                <div className="cz-savings-box cz-edu-funding-box">
                  <span className="cz-savings-label">Estimated Loan Requirement</span>
                  <span className="cz-savings-value">{formatCurrency(netLoanRequirement)}</span>
                  <span className="cz-savings-note">
                    Total Estimated Cost ({formatCurrency(totalCost)}) minus Self Funding ({formatCurrency(existingFunding)})
                  </span>
                </div>

                <div className="cz-edu-guidance-list">
                  <div className="cz-guidance-item">
                    <span className="cz-guidance-icon">🎓</span>
                    <div>
                      <strong>Collateral & Non-Collateral Paths:</strong>
                      <p>Options available with property security or co-applicant income backing.</p>
                    </div>
                  </div>
                  <div className="cz-guidance-item">
                    <span className="cz-guidance-icon">⏳</span>
                    <div>
                      <strong>Study Moratorium Period:</strong>
                      <p>Repayment generally starts 6 to 12 months after course completion or upon getting a job.</p>
                    </div>
                  </div>
                  <div className="cz-guidance-item">
                    <span className="cz-guidance-icon">💵</span>
                    <div>
                      <strong>Estimated Moratorium Simple Interest:</strong>
                      <p>~{formatCurrency(estimatedMoratoriumInterest)}/mo (indicative during studies).</p>
                    </div>
                  </div>
                </div>

                {/* Lead Action */}
                <div className="cz-result-lead-action">
                  <p className="cz-lead-action-text">Need help funding your education?</p>
                  <button
                    type="button"
                    className="cz-btn cz-btn-primary cz-btn-large cz-btn-block"
                    onClick={() =>
                      onTalkToExpert({
                        country,
                        requirement: netLoanRequirement,
                      })
                    }
                  >
                    <span>Talk to an Education Loan Expert</span>
                    <span className="cz-btn-arrow">&rarr;</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
