# Supabase Setup Guide & Migration Instructions

This directory contains the database migration and architecture for **Credzo Finance / LoanCheck**.

---

## 📁 Migration Files
* [`migrations/20260818000000_create_initial_schema.sql`](./migrations/20260818000000_create_initial_schema.sql) — Core database schema, constraints, triggers, indexes, and Row Level Security (RLS) policies.

---

## 🛠️ Step-by-Step Manual Supabase Setup

When you are ready to configure Supabase:

### 1. Create a Supabase Project
1. Log in to [Supabase](https://supabase.com/).
2. Create a new project named `Credzo Finance` (or `LoanCheck`).
3. Select your preferred database region (e.g., `ap-south-1` for Mumbai/India).
4. Save your database password securely.

### 2. Apply the Database Migration
1. In your Supabase project dashboard, navigate to the **SQL Editor** tab on the left sidebar.
2. Click **New Query**.
3. Open [`supabase/migrations/20260818000000_create_initial_schema.sql`](./migrations/20260818000000_create_initial_schema.sql), copy the entire SQL script, and paste it into the SQL Editor.
4. Click **Run** (or `Ctrl+Enter`).
5. Confirm that all 8 tables and their RLS policies are created successfully.

### 3. Connect Environment Variables Locally
1. In Supabase, navigate to **Project Settings** → **API**.
2. Copy your **Project URL** and **anon (public)** key.
3. In your local workspace (`E:\Credzo Finance`), create a `.env` file (which is git-ignored):
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```
4. **NEVER** use or copy the `service_role` key into your `.env` or frontend code.

---

## 🔒 Security Architecture Highlights
* **Zero-Trust Client:** Database-level Row Level Security (RLS) restricts access to authenticated users matching their `organization_id`.
* **Public Anon Access:** Anonymous public users have **zero** read access to `leads`, `lead_notes`, `follow_ups`, `campaigns`, `profiles`, or `organizations`.
* **Non-Recursive RLS Functions:** Uses `SECURITY DEFINER` functions `get_auth_organization_id()` and `get_auth_role()` with fixed `search_path = public` to prevent infinite recursion.
