import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Layouts
import { PublicLayout } from '../layouts/PublicLayout/PublicLayout';
import { AdminLayout } from '../layouts/AdminLayout/AdminLayout';

// Public Pages
import { LandingPage } from '../pages/Landing/LandingPage';
import { CalculatorPage } from '../pages/Calculator/CalculatorPage';
import { ResultPage } from '../pages/Result/ResultPage';
import { PrivacyPage } from '../pages/Privacy/PrivacyPage';
import { TermsPage } from '../pages/Terms/TermsPage';
import { ContactPage } from '../pages/Contact/ContactPage';
import { NotFoundPage } from '../pages/NotFound/NotFoundPage';

// Admin Pages
import { LoginPage } from '../pages/admin/Login/LoginPage';
import { DashboardPage } from '../pages/admin/Dashboard/DashboardPage';
import { LeadsPage } from '../pages/admin/Leads/LeadsPage';
import { LeadDetailPage } from '../pages/admin/LeadDetail/LeadDetailPage';
import { FollowUpsPage } from '../pages/admin/FollowUps/FollowUpsPage';
import { CampaignsPage } from '../pages/admin/Campaigns/CampaignsPage';
import { SettingsPage } from '../pages/admin/Settings/SettingsPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/calculator" element={<CalculatorPage />} />
        <Route path="/result" element={<ResultPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/admin/login" element={<LoginPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Private Admin CRM Routes (Placeholders in Stage 1) */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="leads" element={<LeadsPage />} />
        <Route path="leads/:id" element={<LeadDetailPage />} />
        <Route path="follow-ups" element={<FollowUpsPage />} />
        <Route path="campaigns" element={<CampaignsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
};
