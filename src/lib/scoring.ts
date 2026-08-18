import { LeadScore } from '../types/database';

export interface LeadScoringInput {
  loanType: string;
  requestedAmount: number;
  monthlyIncome?: number;
  existingEmi?: number;
  employmentType?: string;
  city?: string;
  calculatedEmi?: number;
}

export interface LeadScoringResult {
  score: number;
  temperature: LeadScore;
  reason: string;
}

/**
 * Calculates a deterministic internal sales priority score (0-100)
 * for DSA / sales team pipeline triage.
 * 
 * IMPORTANT DISCLAIMER:
 * This is an internal CRM sales-priority ranking algorithm only.
 * It is NEVER presented to the customer as an official loan eligibility,
 * credit sanction, or underwriting decision.
 */
export function calculateLeadScore(input: LeadScoringInput): LeadScoringResult {
  const {
    loanType,
    requestedAmount,
    monthlyIncome,
    existingEmi = 0,
    employmentType,
    city,
    calculatedEmi = 0,
  } = input;

  let score = 20; // Baseline entry score
  const reasons: string[] = ['Baseline lead score'];

  // 1. Profile Completeness Factors
  if (monthlyIncome && monthlyIncome > 0) {
    score += 15;
    reasons.push('Stated monthly income');
  }

  if (existingEmi > 0 || (monthlyIncome && existingEmi === 0)) {
    score += 10;
    reasons.push('Stated existing EMI commitments');
  }

  if (employmentType) {
    score += 10;
    if (employmentType === 'salaried' || employmentType === 'self_employed') {
      score += 5;
      reasons.push(`Stable employment profile (${employmentType})`);
    }
  }

  if (city && city.trim().length > 1) {
    score += 10;
    reasons.push('Location specified');
  }

  // 2. Financial Capacity / Debt-to-Income (FOIR) Assessment
  if (monthlyIncome && monthlyIncome > 0 && calculatedEmi > 0) {
    const totalObligation = existingEmi + calculatedEmi;
    const foir = (totalObligation / monthlyIncome) * 100;

    if (foir <= 40) {
      score += 20;
      reasons.push(`Comfortable repayment capability (FOIR: ${Math.round(foir)}%)`);
    } else if (foir <= 60) {
      score += 10;
      reasons.push(`Moderate repayment capability (FOIR: ${Math.round(foir)}%)`);
    } else if (foir > 80) {
      score -= 15;
      reasons.push(`High debt-to-income load (FOIR: ${Math.round(foir)}%)`);
    }
  }

  // 3. Category & Ticket Size Factors
  if (requestedAmount > 0) {
    if (requestedAmount >= 500000 && requestedAmount <= 5000000) {
      score += 5;
      reasons.push('Standard retail ticket size');
    }
  }

  if (loanType === 'gold') {
    score += 10;
    reasons.push('Secured collateral category (Gold)');
  } else if (loanType === 'home' || loanType === 'lap') {
    score += 10;
    reasons.push('High-value secured asset category');
  }

  // Bound score between 5 and 99
  const finalScore = Math.max(5, Math.min(99, score));

  // Determine Sales Temperature
  let temperature: LeadScore = 'WARM';
  if (finalScore >= 70) {
    temperature = 'HOT';
  } else if (finalScore < 40) {
    temperature = 'COLD';
  }

  return {
    score: finalScore,
    temperature,
    reason: reasons.join('; '),
  };
}
