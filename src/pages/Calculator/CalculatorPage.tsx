import React from 'react';
import { LoanCalculator } from '../../components/LoanCalculator/LoanCalculator';
import { SectionHeader } from '../../components/ui';
import './CalculatorPage.css';

export const CalculatorPage: React.FC = () => {
  return (
    <div className="calculator-page">
      <div className="container">
        <SectionHeader
          badge="100% Free & Transparent"
          title="Loan EMI Calculator"
          subtitle="Calculate your estimated monthly installment, total interest, and complete repayment breakdown in real time."
          centered={true}
          className="calculator-page-header"
        />

        <LoanCalculator />
      </div>
    </div>
  );
};
