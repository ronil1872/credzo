# LoanCheck (Credzo Finance) — Development Plan & Execution Roadmap

This document outlines the sequential, staged implementation plan for LoanCheck.
Each stage must be strictly completed and verified before requesting approval to move to the next stage.

---

## Stage Progression Overview

```text
[STAGE 0] Architecture & Documentation (CURRENT)
    │
    ▼
[STAGE 1] Project Foundation & Routing Setup
    │
    ▼
[STAGE 2] Public Landing Page & Design System
    │
    ▼
[STAGE 3] Client-Side Loan Calculator
    │
    ▼
[STAGE 4] Supabase Database Schema & RLS Policies
    │
    ▼
[STAGE 5] Lead Capture, Consent & Attribution Flow
    │
    ▼
[STAGE 6] Staff Authentication & Route Protection
    │
    ▼
[STAGE 7] Private CRM Dashboard, Leads & Follow-ups
    │
    ▼
[STAGE 8] Campaign Attribution & Source Analytics
    │
    ▼
[STAGE 9] Production Hardening, Security & Responsiveness
    │
    ▼
[STAGE 10] Real-World End-to-End Testing & Pre-Ad Verification
```

---

## Detailed Stage Breakdown

### Stage 0: Architecture & Documentation (Current Stage)
- **Goal:** Establish foundational project documentation, define boundaries, security rules, and architectural guidelines.
- **Deliverables:**
  - `PROJECT_CONTEXT.md`
  - `DEVELOPMENT_PLAN.md`
  - `SECURITY_RULES.md`
  - `README.md`
- **Verification:** Workspace clean, no premature code/packages installed, all constraints documented.

---

### Stage 1: Project Foundation & Routing Setup
- **Goal:** Initialize the modern React + TypeScript + Vite project and configure clean routing and layouts.
- **Key Tasks:**
  - Initialize Vite with React and TypeScript template.
  - Setup React Router with structured route definitions (`public` vs `admin`).
  - Create standard directory hierarchy:
    ```text
    src/
    ├── components/    # Reusable UI elements (Header, Footer, Button, Card, Badge, Modal)
    ├── layouts/       # PublicLayout and AdminLayout
    ├── pages/         # Public (Landing, Calculator, Result, Legal) & Admin pages
    ├── lib/           # Supabase client, calculator formulas, scoring, validation, UTM helpers
    ├── hooks/         # Custom hooks (useAuth, useLeads, useCampaigns)
    ├── types/         # TypeScript definitions for Database, Leads, Auth, Calculator
    └── styles/        # Global CSS, CSS variables, typography, reset
    ```
  - Implement base responsive layout wrappers.
  - Setup `.env.example` with placeholder environment variable names.
- **Verification:** Local development server boots cleanly with 0 errors; basic page transitions function smoothly.

---

### Stage 2: Public Landing Page & Design System
- **Goal:** Build the high-converting, mobile-first public landing page.
- **Key Tasks:**
  - Refine minimalist, Apple-inspired design system with CSS custom properties (colors, typography, spacing, shadows).
  - Implement Header with clean branding and direct CTA.
  - Implement Hero Section:
    - Primary Headline: **"Need a Loan?"**
    - Supporting Headline: **"Check your estimated EMI in 60 seconds — FREE."**
    - Primary CTA Button: **"Calculate Now"**
    - Reassurance Note: **"Free estimate. No obligation."**
  - Loan Types Grid: Personal, Business, Home, LAP, Gold, Other.
  - Transparency & Disclaimers Section (explicitly stating non-lender status and illustrative nature).
  - Minimalist, accessible Footer with links to Privacy, Terms, and Contact.
- **Verification:** Fully responsive across mobile breakpoints (320px, 360px, 375px, 390px, 412px) and desktop; fast loading; no layout shifts.

---

### Stage 3: Client-Side Loan Calculator
- **Goal:** Build the interactive, transparent loan EMI calculator.
- **Key Tasks:**
  - Implement reducing-balance formula in `src/lib/calculator.ts`.
  - Configurable default interest rates per loan type.
  - Interactive inputs with synchronized sliders and number fields:
    - Loan Type selector
    - Loan Amount (₹ range with intuitive steps)
    - Tenure (Months / Years toggle)
    - Approximate Monthly Income
    - Existing Monthly EMI
    - Employment Type (Salaried, Self-Employed, Business)
    - City selector / input
  - Real-time calculation output:
    - Estimated Monthly EMI
    - Estimated Total Interest
    - Estimated Total Repayment
  - Transparent calculation breakdown chart/bar.
  - Mandatory illustrative disclaimer notice on all results.
- **Verification:** Mathematical accuracy verified against standard loan formulas; edge cases handled (0% edge checks, high values); 100% mobile keyboard and touch friendly.

---

### Stage 4: Supabase Database Schema & RLS Policies
- **Goal:** Implement the PostgreSQL schema, constraints, and Row Level Security rules in Supabase.
- **Key Tasks:**
  - Create SQL migration script containing:
    - `organizations` table
    - `profiles` table (tied to `auth.users`)
    - `leads` table with complete fieldset, constraints, and defaults
    - `lead_notes` table (referencing `leads` and `profiles`)
    - `follow_ups` table (referencing `leads` and `profiles`)
    - `campaigns` table
    - `lead_events` table
  - Apply strict Row Level Security (RLS) policies:
    - Anonymous/Public: INSERT-only on `leads` with valid payload; NO SELECT/UPDATE/DELETE.
    - Authenticated: Full scoped access restricted strictly to their `organization_id`.
  - Create performance indexes on `leads(created_at)`, `leads(status)`, `leads(lead_temperature)`, and `leads(organization_id)`.
- **Verification:** Direct SQL tests verifying that anonymous users cannot query or tamper with existing leads, while authenticated staff can only view authorized organization records.

---

### Stage 5: Lead Capture, Consent & Attribution Flow
- **Goal:** Connect Calculator results to the Lead Capture Form, capture explicit consent, and persist to Supabase.
- **Key Tasks:**
  - Build Lead Capture Form at `/result`:
    - Customer Name, 10-digit Indian Mobile Number, City, Preferred Callback Date & Time.
    - Summary of chosen loan parameters.
    - Unchecked-by-default explicit Consent Checkbox with clear disclosure.
  - Build UTM parameter persistence engine (`src/lib/tracking.ts`):
    - Reads URL query parameters (`utm_source`, `utm_medium`, `utm_campaign`, etc.) on first landing.
    - Persists parameters in session storage.
    - Attaches UTM metadata to lead payload.
  - Build Lead Scoring engine (`src/lib/scoring.ts`):
    - Calculates internal priority score ($0 - 100$) and assigns temperature (`HOT`, `WARM`, `COLD`).
  - Client-side validation with comprehensive error messaging before submission.
  - Submission handler to insert record into Supabase `leads` table.
  - Confirmation screen with clear next-steps expectation.
- **Verification:** Submission works smoothly on mobile; lead appears with full UTM and calculation snapshot in database; duplicate or invalid mobile numbers handled gracefully.

---

### Stage 6: Staff Authentication & Route Protection
- **Goal:** Secure the private CRM with Supabase Auth and React Router protection.
- **Key Tasks:**
  - Build `/admin/login` page with minimalist, secure UI.
  - Implement `useAuth` hook managing Supabase session, token refresh, and profile fetching.
  - Implement `ProtectedRoute` component to prevent unauthorized access to `/admin/*`.
  - Add secure Logout handler.
  - Test session expiration and automatic redirection.
- **Verification:** Unauthenticated attempts to access `/admin` redirect immediately to `/admin/login`; valid credentials successfully grant access to dashboard.

---

### Stage 7: Private CRM Dashboard, Leads & Follow-ups
- **Goal:** Implement the sales-management CRM interface.
- **Key Tasks:**
  - Build Admin Layout with sidebar navigation and mobile drawer.
  - Build `/admin` Dashboard:
    - Today's Leads, New Leads, Hot Leads, Warm Leads, Callbacks Scheduled, Applications, Approved, Disbursed.
    - Potential Requested Loan Value (sum of requested amounts for active leads).
    - Today's Follow-up Agenda.
  - Build `/admin/leads` Table & Filters:
    - Search by name/mobile/city.
    - Filter by Status, Temperature, Loan Type, and Date Range.
    - Sortable columns.
  - Build `/admin/leads/:id` Lead Profile:
    - Full customer profile & financial snapshot.
    - Calculator result snapshot.
    - UTM source and campaign details.
    - Status change dropdown (`NEW` -> `CONTACTED` -> `INTERESTED` -> ...).
    - Internal Requested vs Approved vs Disbursed value inputs.
    - One-click Actions: Click-to-Call (`tel:`) and Manual WhatsApp (`https://wa.me/`).
    - Chronological Notes thread (`lead_notes`).
    - Schedule / Complete Follow-up tasks (`follow_ups`).
- **Verification:** Full lifecycle testing of lead updates, note creation, and follow-up scheduling from desktop and mobile views.

---

### Stage 8: Campaign Attribution & Source Analytics
- **Goal:** Provide real, transparent campaign conversion reporting without fake vanity metrics.
- **Key Tasks:**
  - Build `/admin/campaigns` view.
  - Aggregate real database records by `utm_source`, `utm_campaign`, and `source`.
  - Metrics per campaign: Total Leads, Hot Leads, Applications, Approved Loans, Disbursed Loans, Total Potential Loan Value.
  - Zero fabricated metrics (no fake clicks, no fake impressions).
- **Verification:** Query aggregation accurately matches database totals.

---

### Stage 9: Production Hardening, Security & Responsiveness
- **Goal:** Comprehensive QA, security audit, and edge-case handling.
- **Key Tasks:**
  - Full mobile audit across iOS Safari, Android Chrome, and multiple viewports (320px to 1920px).
  - Cross-browser input compatibility checks.
  - Accessibility audit (ARIA labels, keyboard tab order, color contrast ratios).
  - Empty states, loading spinners, network error boundaries, and 404 handler.
  - Security audit: Confirm zero secrets in client code, RLS enforced on all tables, and sensitive routes protected.
- **Verification:** Zero console errors, zero lint warnings, fast Lighthouse performance scores, robust error boundaries.

---

### Stage 10: Real-World End-to-End Testing & Pre-Ad Verification
- **Goal:** Final end-to-end dry run simulating real Instagram ad traffic before live deployment.
- **Key Tasks:**
  - Execute complete simulated customer journey:
    1. Visit site with test UTM query params: `?utm_source=instagram&utm_campaign=test_campaign_1`
    2. Complete calculator with sample data.
    3. Submit lead with explicit consent.
    4. Verify lead received in Supabase with correct UTM parameters and lead score.
    5. Log into `/admin` as CRM user.
    6. Verify lead appears in Dashboard and Leads list.
    7. Open Lead Detail, test click-to-call and WhatsApp click-to-chat links.
    8. Add internal note, update status to `CONTACTED`, schedule follow-up.
    9. Verify campaign dashboard reflects the new lead accurately.
  - Prepare Netlify deployment configuration (`netlify.toml` with SPA redirects).
- **Verification:** 100% flawless journey execution across the entire conversion and management funnel.

---

## Milestone Git Commit Convention
Commits must be made at clear milestones:
- `chore: stage 0 - documentation and architecture specification`
- `feat: stage 1 - project foundation, layouts, and routing`
- `feat: stage 2 - public landing page and mobile-first design system`
- `feat: stage 3 - interactive loan calculator with emi engine`
- `feat: stage 4 - supabase schema, migrations, and rls policies`
- `feat: stage 5 - lead capture, consent management, and utm tracking`
- `feat: stage 6 - admin authentication and route protection`
- `feat: stage 7 - sales crm dashboard, leads management, and notes`
- `feat: stage 8 - campaign analytics and attribution reporting`
- `fix: stage 9 - production hardening, accessibility, and security validation`
- `chore: stage 10 - end-to-end testing verification and deployment config`
