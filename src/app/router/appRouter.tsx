import { createBrowserRouter, Navigate } from 'react-router-dom';

import { AuthLayout } from '@/layouts/AuthLayout';
import { PlatformLayout } from '@/layouts/PlatformLayout';
import { TenantLayout } from '@/layouts/TenantLayout';
import { PublicAuthRoute } from '@/features/auth/guards/PublicAuthRoute';
import { AccountSettingsPage, ApiTokensPage, AuthLoginPage, ForgotPasswordPage, ResetPasswordPage } from '@/features/auth/pages';
import { RequireAuth } from '@/features/auth/guards/RequireAuth';
import { RequirePermission } from '@/features/auth/guards/RequirePermission';
import { PlatformDashboardPage } from '@/features/platform/dashboard/pages/PlatformDashboardPage';
import { ForbiddenPage } from '@/pages/ForbiddenPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { PlaceholderPage } from '@/pages/PlaceholderPage';
import { SampleEnterpriseModulePage } from '@/pages/SampleEnterpriseModulePage';
import { ShellDashboardPage } from '@/pages/ShellDashboardPage';
import { PLATFORM_ROUTES } from '@/features/platform/routes/platformRoutes';

export const appRouter = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to={PLATFORM_ROUTES.dashboard} replace />
  },
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      {
        path: 'login',
        element: (
          <PublicAuthRoute>
            <AuthLoginPage />
          </PublicAuthRoute>
        )
      },
      {
        path: 'platform/login',
        element: (
          <PublicAuthRoute guard="platform">
            <AuthLoginPage />
          </PublicAuthRoute>
        )
      },
      {
        path: 'tenant/login',
        element: (
          <PublicAuthRoute guard="tenant">
            <AuthLoginPage />
          </PublicAuthRoute>
        )
      },
      {
        path: 'forgot-password',
        element: (
          <PublicAuthRoute>
            <ForgotPasswordPage />
          </PublicAuthRoute>
        )
      },
      {
        path: 'password/reset',
        element: (
          <PublicAuthRoute>
            <ResetPasswordPage />
          </PublicAuthRoute>
        )
      }
    ]
  },
  {
    path: '/forbidden',
    element: <ForbiddenPage />
  },
  {
    path: '/platform',
    element: (
      <RequireAuth guard="platform">
        <PlatformLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      {
        path: 'dashboard',
        element: (
          <RequirePermission guard="platform" anyOf={['dashboard.view']}>
            <PlatformDashboardPage />
          </RequirePermission>
        )
      },
      { path: 'sample-module', element: <SampleEnterpriseModulePage /> },
      { path: 'settings', element: <AccountSettingsPage guard="platform" /> },
      { path: 'api-tokens', element: <ApiTokensPage guard="platform" /> },
      {
        path: '*',
        element: <PlaceholderPage title="Platform workspace" description="Platform routes are registered as constants first." />
      }
    ]
  },
  {
    path: '/t/:tenantSlug',
    element: (
      <RequireAuth guard="tenant">
        <TenantLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <ShellDashboardPage guard="tenant" /> },
      { path: 'profile', element: <AccountSettingsPage guard="tenant" /> },
      { path: 'profile/api-tokens', element: <ApiTokensPage guard="tenant" /> },
      {
        path: '*',
        element: <PlaceholderPage title="Tenant workspace" description="Tenant CRM routes are registered as constants first." />
      }
    ]
  },
  {
    path: '*',
    element: <NotFoundPage />
  }
]);
