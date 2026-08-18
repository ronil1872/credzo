# LoanCheck (Credzo Finance) — Security & Compliance Rules

Security and user privacy are non-negotiable foundations of LoanCheck. Every line of code, database policy, and frontend interface must adhere strictly to the rules established in this document.

---

## 1. Core Security Architecture: Zero-Trust Client

### The Golden Rule of Frontend Security
**Never trust the client browser.**
- Frontend route guards (e.g., `<ProtectedRoute />`) exist purely for user experience. They provide **zero** security.
- Security and data access boundaries are enforced exclusively at the **database layer** via Supabase Row Level Security (RLS) and constraints.
- Never trust client-supplied `organization_id`, `user_id`, or `role` parameters. All identities must be extracted server-side from validated JWT claims (`auth.uid()`, `auth.jwt()`).

---

## 2. Supabase Row Level Security (RLS) Matrix

Every database table MUST have Row Level Security explicitly enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`).

| Table Name | Public / Anon Role (`anon`) | Authenticated Staff (`authenticated`) | Notes / Security Policy |
| :--- | :--- | :--- | :--- |
| **`leads`** | **INSERT ONLY** (with valid payload) | **SELECT, UPDATE** (matching `organization_id`) | Public cannot view, list, modify, or delete any lead. |
| **`lead_notes`** | **NO ACCESS** | **ALL** (matching `organization_id`) | Private internal notes only. |
| **`follow_ups`** | **NO ACCESS** | **ALL** (matching `organization_id`) | Private sales tasks only. |
| **`profiles`** | **NO ACCESS** | **SELECT, UPDATE (Self)** | Scoped to matching user ID or Org Admin. |
| **`organizations`** | **NO ACCESS** | **SELECT** (matching `organization_id`) | Isolated tenant boundary. |
| **`campaigns`** | **NO ACCESS** | **ALL** (matching `organization_id`) | Marketing attribution records. |
| **`lead_events`** | **INSERT ONLY** (system triggers) | **SELECT** (matching `organization_id`) | Immutable audit log. |

### Public Lead Insertion Constraints
When anonymous visitors submit a lead:
- RLS policy must ensure they can only insert records where essential fields are populated.
- Public users must **never** be granted `SELECT` permissions on the `leads` table. Once inserted, the client cannot query the lead back.

---

## 3. Secrets & Credential Management

### Environment Variable Rules
1. **Frontend Variables:**
   - Only variables prefixed with `VITE_` can be bundled into client code (e.g., `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
   - The Supabase Anonymous (`anon`) key is public by design and safe to expose **only when RLS is properly configured on all tables**.
2. **Strictly Forbidden in Frontend:**
   - **`SUPABASE_SERVICE_ROLE_KEY`** (Bypasses all RLS — NEVER put in client code or `.env.production`).
   - Database connection strings or passwords.
   - Any private API tokens or administrative credentials.
3. **Version Control Protection:**
   - `.env`, `.env.local`, `.env.development`, `.env.production` must be listed in `.gitignore`.
   - Only `.env.example` with blank/placeholder values may be committed to Git.

---

## 4. Customer Privacy & Data Minimization

### Strict Prohibition on Sensitive PII in V1
To eliminate regulatory risk, liability, and data breach vectors, LoanCheck V1 will **NEVER** collect, request, or store:
- ❌ Aadhaar Numbers or Aadhaar Card images
- ❌ PAN Numbers or PAN Card images
- ❌ Bank Account Numbers, Net Banking credentials, or Debit/Credit Card details
- ❌ Bank Statements, Salary Slips, or ITR documents
- ❌ Uploaded identity or income files

### Explicit Consent Requirement
- Consent is mandatory before saving any lead enquiry.
- The consent checkbox must **NEVER** be pre-selected.
- Each lead submission must store:
  - `consent_given`: `true`
  - `consent_timestamp`: ISO 8601 UTC timestamp
  - `consent_version`: Form version string (e.g., `v1.0-2026`)
- Submissions missing valid consent must be rejected both client-side and at the database constraint level.

---

## 5. Input Validation & Defense in Depth

### Validation Standards
All inputs must be validated client-side for UX and database-side via constraints and parameterized queries:

1. **Mobile Numbers:**
   - Must match standard Indian 10-digit mobile pattern: `/^[6-9]\d{9}$/`.
   - Strip whitespace, hyphens, and `+91` prefix before storing clean 10-digit number.
2. **Customer Name:**
   - Sanitized string, length between 2 and 100 characters.
   - Disallow script tags, HTML entities, and control characters.
3. **Financial Amounts:**
   - `requested_amount`: Numeric, minimum ₹10,000, maximum ₹10,00,00,000 (10 Cr).
   - `monthly_income`: Numeric, non-negative.
   - `existing_emi`: Numeric, non-negative.
   - `calculator_tenure`: Positive integer (1 to 360 months).
4. **Enums & Categories:**
   - `loan_type`: Strictly restricted to allowed enum values (`personal`, `business`, `home`, `lap`, `gold`, `other`).
   - `employment_type`: Strictly restricted to allowed enum values (`salaried`, `self_employed`, `business`).
   - `lead_temperature`: Strictly restricted to (`HOT`, `WARM`, `COLD`).
   - `status`: Strictly restricted to (`NEW`, `CONTACTED`, `INTERESTED`, `DOCUMENTS`, `APPLICATION`, `APPROVED`, `DISBURSED`, `LOST`).

---

## 6. Prohibited Practices & Compliance Rules

1. **No Deceptive Marketing Claims:**
   - Never use misleading terms like "100% Guaranteed Approval", "Instant Loan in 5 Minutes", or "Zero Verification".
   - The platform is an illustrative calculator and lead acquisition service, not a financial institution.
2. **No Automated WhatsApp / SMS Scraping:**
   - No headless browser bots, Puppeteer scripts, or unofficial WhatsApp Web hooks.
   - WhatsApp interaction must always be triggered via standard `wa.me` links and sent manually by human staff.
3. **No Fabricated Production Data:**
   - Never insert fake leads, fake approval values, or mock campaign click metrics into the production database.
   - All CRM metrics must derive from authentic database records.
4. **Clear Error Sanitization:**
   - Never expose raw database errors, stack traces, or SQL error messages to public end-users.
   - Return clean, user-friendly error notices on public pages.
