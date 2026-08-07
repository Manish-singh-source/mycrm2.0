import { createBrowserRouter, Navigate } from 'react-router-dom';

import { AuthLayout } from '@/layouts/AuthLayout';
import { PlatformLayout } from '@/layouts/PlatformLayout';
import { TenantLayout } from '@/layouts/TenantLayout';
import { RequireAuth } from '@/features/auth/guards/RequireAuth';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { PlaceholderPage } from '@/pages/PlaceholderPage';
import { PLATFORM_ROUTES } from '@/features/platform/routes/platformRoutes';
import { TENANT_ROUTES } from '@/features/tenant/routes/tenantRoutes';

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
        element: <PlaceholderPage title="Sign in" description="Auth forms will be wired here." />
      }
    ]
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
