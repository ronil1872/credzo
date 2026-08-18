# LoanCheck (Credzo Finance)

> **Customer Acquisition & Lead Management Platform for Loan Enquiries**

LoanCheck is a conversion-focused, mobile-first web application featuring a transparent illustrative loan EMI calculator and a private sales CRM. It is designed to capture voluntary customer enquiries and manage the end-to-end sales follow-up pipeline.

---

## 🚀 Key Highlights

- **100% Free Public Lead Magnet:** Client-side reducing-balance loan EMI calculator with clear illustrative estimates.
- **Privacy-First Lead Capture:** Minimal information collected with mandatory, explicit customer consent. Zero collection of Aadhaar, PAN, or financial documents in V1.
- **Private Sales CRM:** Multi-status sales pipeline (`NEW` → `CONTACTED` → `INTERESTED` → `DOCUMENTS` → `APPLICATION` → `APPROVED` → `DISBURSED`), deterministic lead scoring (`HOT`, `WARM`, `COLD`), chronological notes, and daily follow-up tracking.
- **Marketing Attribution:** Deep UTM tracking (`utm_source`, `utm_campaign`, etc.) preserved from ad click through to CRM conversion.
- **Zero Recurring Software Cost Target:** Built entirely with React, Vite, TypeScript, Supabase (PostgreSQL + Auth + RLS), and Netlify free tier.

---

## 🛠️ Technology Stack

- **Frontend:** React 18+, TypeScript, Vite, React Router, System Design System
- **Backend & Database:** Supabase (PostgreSQL with Row Level Security)
- **Authentication:** Supabase Auth
- **Hosting:** Netlify (Free `.netlify.app` subdomain in V1)
- **Security:** Strict database-level RLS, Zero-trust client model, No client-side secret exposure

---

## 📚 Project Documentation

Detailed architecture specifications, roadmaps, and security standards are available in the root repository:

- 📄 [`PROJECT_CONTEXT.md`](./PROJECT_CONTEXT.md) — Comprehensive business context, conversion funnel, routes, and calculation rules.
- 🗺️ [`DEVELOPMENT_PLAN.md`](./DEVELOPMENT_PLAN.md) — 10-stage step-by-step implementation and verification roadmap.
- 🔒 [`SECURITY_RULES.md`](./SECURITY_RULES.md) — Row Level Security policies, PII minimization, validation, and zero-trust guidelines.

---

## 📍 Current Project Status

- **Current Stage:** **Stage 0 — Architecture & Documentation** (Completed)
- **Next Stage:** **Stage 1 — Project Foundation & Routing Setup** (Awaiting approval)
