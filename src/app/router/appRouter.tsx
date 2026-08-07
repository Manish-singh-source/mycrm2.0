import { createBrowserRouter, Navigate } from 'react-router-dom';

import { AuthLayout } from '@/layouts/AuthLayout';
import { PlatformLayout } from '@/layouts/PlatformLayout';
import { TenantLayout } from '@/layouts/TenantLayout';
import { PublicAuthRoute } from '@/features/auth/guards/PublicAuthRoute';
import { RequireAuth } from '@/features/auth/guards/RequireAuth';
import { ForbiddenPage } from '@/pages/ForbiddenPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { PlaceholderPage } from '@/pages/PlaceholderPage';
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
            <PlaceholderPage title="Sign in" description="Platform and tenant auth forms will be wired here." />
          </PublicAuthRoute>
        )
      },
      {
        path: 'platform/login',
        element: (
          <PublicAuthRoute guard="platform">
            <PlaceholderPage title="Platform sign in" description="Platform admin login will call /auth/login." />
          </PublicAuthRoute>
        )
      },
      {
        path: 'tenant/login',
        element: (
          <PublicAuthRoute guard="tenant">
            <PlaceholderPage title="Tenant sign in" description="Tenant login will call /auth/login with tenant context." />
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
