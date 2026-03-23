import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { Spin } from 'antd';
import styled from 'styled-components';
import { PrivateRoute } from './PrivateRoute';
import { AppLayout } from '@/components/layout/AppLayout';

const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const LandingPage = lazy(() => import('@/pages/landing/LandingPage'));

/* Dashboard pages - lazy loaded */
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'));
const DevicesPage = lazy(() => import('@/pages/devices/DevicesPage'));
const DeviceDetailPage = lazy(() => import('@/pages/devices/DeviceDetailPage'));
const ContactsPage = lazy(() => import('@/pages/contacts/ContactsPage'));
const ContactGroupDetailPage = lazy(() => import('@/pages/contacts/ContactGroupDetailPage'));
const CampaignsPage = lazy(() => import('@/pages/campaigns/CampaignsPage'));
const CampaignCreatePage = lazy(() => import('@/pages/campaigns/CampaignCreatePage'));
const CampaignDetailPage = lazy(() => import('@/pages/campaigns/CampaignDetailPage'));
const VoiceMessagesPage = lazy(() => import('@/pages/voice-messages/VoiceMessagesPage'));
const BlacklistPage = lazy(() => import('@/pages/blacklist/BlacklistPage'));
const InboxPage = lazy(() => import('@/pages/inbox/InboxPage'));
const ConversationPage = lazy(() => import('@/pages/inbox/ConversationPage'));
const ReportsPage = lazy(() => import('@/pages/reports/ReportsPage'));
const UsersPage = lazy(() => import('@/pages/users/UsersPage'));
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage'));
const SubscriptionPage = lazy(() => import('@/pages/subscription/SubscriptionPage'));

const LoadingWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
`;

function PageLoader() {
  return (
    <LoadingWrapper>
      <Spin size="large" />
    </LoadingWrapper>
  );
}

export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public routes */}
        <Route path="/welcome" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Private routes */}
        <Route
          element={
            <PrivateRoute>
              <AppLayout />
            </PrivateRoute>
          }
        >
          <Route path="/" element={<DashboardPage />} />
          <Route path="/devices" element={<DevicesPage />} />
          <Route path="/devices/:id" element={<DeviceDetailPage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/contacts/:id" element={<ContactGroupDetailPage />} />
          <Route path="/campaigns" element={<CampaignsPage />} />
          <Route path="/campaigns/create" element={<CampaignCreatePage />} />
          <Route path="/campaigns/:id" element={<CampaignDetailPage />} />
          <Route path="/voice-messages" element={<VoiceMessagesPage />} />
          <Route path="/blacklist" element={<BlacklistPage />} />
          <Route path="/inbox" element={<InboxPage />} />
          <Route path="/inbox/conversation/:phone" element={<ConversationPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/subscription" element={<SubscriptionPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
