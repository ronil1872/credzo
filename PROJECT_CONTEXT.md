# LoanCheck (Credzo Finance) — Project Context & Architecture Specification

## 1. Project Overview & Identity
- **Working Project Name:** LoanCheck
- **Future Public Brand:** Credzo Finance
- **Root Directory:** `E:\Credzo Finance`
- **Current Stage:** Stage 0 (Architecture & Initialization)

---

## 2. Core Business Mission & Funnel
LoanCheck is a **FREE loan lead-generation and sales-management platform**.

### Core Business Principle
- LoanCheck is **NOT a lender**.
- LoanCheck does **NOT approve loans, guarantee loans, or make official eligibility determinations**.
- The platform provides **transparent, illustrative loan calculations** and collects **voluntary customer enquiries** for human follow-up.
- The website is a **Customer Acquisition + Lead Management System**, not a banking or core fintech engine.

### Conversion Funnel
```text
Instagram Advertisement
       ↓
Landing Page (Mobile-First)
       ↓
Free Loan Calculator
       ↓
Estimated EMI Result (Illustrative)
       ↓
Voluntary Callback Request (Explicit Consent)
       ↓
Secure Lead Storage (Supabase + RLS)
       ↓
Private CRM Dashboard
       ↓
Personal Human Follow-Up (Call / Manual WhatsApp)
       ↓
Application → Approved → Disbursed
```

---

## 3. Technology Stack & Architecture

| Layer | Technology | Key Details |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18+ with Vite & TypeScript | High performance, strict type safety |
| **Routing** | React Router (v6+) | Public routes & Protected Admin routes |
| **Styling & Design** | Clean Modern CSS / Design System | Minimalist, mobile-first, Apple-inspired restraint, system typography |
| **Backend & Database** | Supabase (PostgreSQL) | Managed PostgreSQL, Database Constraints, Triggers |
| **Authentication** | Supabase Auth | Email/password for internal CRM users |
| **Data Security** | Supabase Row Level Security (RLS) | Database-level authorization & zero public read access |
| **Hosting & Deployment** | Netlify | Free `.netlify.app` domain for V1 |
| **Version Control** | Git & GitHub | Structured milestone commits |

### Cost Target
- **₹0 Recurring Software/API Cost** for V1 (excluding domain and advertising).
- No paid third-party APIs (no SMS gateways, no automated WhatsApp APIs, no credit bureaus, no external calculators).
- All EMI calculations execute client-side in the browser.

---

## 4. Route Architecture

### Public Customer Routes
- `/` — High-converting landing page (Hero, CTA, loan types, trust badges, disclaimers)
- `/calculator` — Interactive loan EMI calculator
- `/result` — Calculation outcome breakdown & lead capture form
- `/privacy` — Explicit privacy policy and data collection transparency
- `/terms` — Clear terms of use and illustrative calculation disclaimers
- `/contact` — Direct contact details for human assistance

### Private CRM Routes (Authentication Required)
- `/admin/login` — Secure staff/admin login
- `/admin` — High-level sales dashboard (Today's leads, pipeline counts, potential requested value)
- `/admin/leads` — Paginated, filterable leads table with temperature badges
- `/admin/leads/:id` — Complete lead profile, calculator data, notes, and action panel
- `/admin/follow-ups` — Daily follow-up calendar and overdue task list
- `/admin/campaigns` — UTM and marketing source conversion analytics
- `/admin/settings` — Configuration (illustrative interest rates, user profile)

---

## 5. Loan Calculation Engine & Rules

### Reducing-Balance EMI Formula
$$\text{EMI} = \frac{P \times r \times (1+r)^n}{(1+r)^n - 1}$$

- $P$ = Principal Loan Amount
- $r$ = Monthly Interest Rate ($\frac{\text{Annual Rate}}{12 \times 100}$)
- $n$ = Tenure in Months

### Supported Loan Types & Illustrative Configurations
1. **Personal Loan** (Configurable default rate)
2. **Business Loan** (Configurable default rate)
3. **Home Loan** (Configurable default rate)
4. **Loan Against Property (LAP)** (Configurable default rate)
5. **Gold Loan** (Configurable default rate)
6. **Other Loans** (Configurable default rate)

*Note: All displayed rates and results are explicitly marked as illustrative estimates. No calculation represents an approval or binding offer.*

---

## 6. Lead Capture, Consent & Data Minimization

### Information Collected in V1
- **Customer Details:** Full Name, Valid 10-Digit Mobile Number, City
- **Loan Parameters:** Loan Type, Requested Amount, Monthly Income, Employment Type (Salaried / Self-Employed / Business), Existing EMI
- **Callback Preferences:** Preferred Callback Date & Preferred Callback Time
- **Consent Metadata:** `consent_given` (boolean), `consent_timestamp` (ISO timestamp), `consent_version` (string)
- **Marketing Attribution:** `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `source`

### Strict PII Restrictions for V1
Under no circumstances will V1 collect or store:
- Aadhaar Numbers or Cards
- PAN Numbers or Cards
- Bank Account Numbers / IFSC Codes
- Bank Statements or Salary Slips
- Identity / Financial Document Uploads

---

## 7. Sales Pipeline & CRM Logic

### Lead Status Lifecycle
$$\text{NEW} \longrightarrow \text{CONTACTED} \longrightarrow \text{INTERESTED} \longrightarrow \text{DOCUMENTS} \longrightarrow \text{APPLICATION} \longrightarrow \text{APPROVED} \longrightarrow \text{DISBURSED}$$
$$\text{(or LOST at any stage)}$$

*Status changes to `APPROVED` or `DISBURSED` must always be manually recorded by an authorized CRM user.*

### Lead Temperature & Scoring
- **HOT (Score $\ge 80$):** High income-to-EMI ratio, complete enquiry, urgent callback requested.
- **WARM (Score $50 - 79$):** Moderate financial profile, valid contact details.
- **COLD (Score $< 50$):** Incomplete details or low eligibility potential.
- *Strictly an internal sales-prioritization metric; never portrayed as a credit score or lender approval.*

### Chronological Notes & Follow-ups
- Notes are stored in an independent `lead_notes` table to maintain an immutable chronological audit trail.
- Follow-ups support date, time, assigned user, status, and completion notes.

### Manual WhatsApp Integration
- Standard `https://wa.me/<number>?text=<encoded_message>` links.
- Strictly manual dispatch by human operators. Zero automated messaging or web scraping.

---

## 8. Database Schema Overview (Target)
- `organizations` — Multi-tenant organizational boundary (V1 uses single organization).
- `profiles` — Internal users linked to Supabase Auth (`OWNER`, `ADMIN`, `STAFF`).
- `leads` — Complete lead records, calculation snapshot, UTM attribution, and consent log.
- `lead_notes` — Chronological sales notes per lead.
- `follow_ups` — Scheduled follow-up tasks with date/time.
- `campaigns` — Marketing campaigns tracking metadata.
- `lead_events` — Immutable audit log of status changes and activities.
- `calculator_sessions` — Optional anonymous session analytics to measure drop-offs.

---

## 9. Non-Negotiable Boundaries (What NOT to Build in V1)
- ❌ No automated WhatsApp/SMS bots or scrapers
- ❌ No AI chatbots or automated decision engines
- ❌ No live credit bureau / lender API integrations
- ❌ No document uploads or file storage
- ❌ No customer login / portal (customer interaction is purely frontend calculator & enquiry form)
- ❌ No payment gateways or recurring subscriptions
- ❌ No fake/mock production data or fabricated marketing metrics
- ❌ No custom domain configurations in V1 (Netlify free tier utilized)
