import { createBrowserRouter, Navigate } from 'react-router-dom';

import { AuthLayout } from '@/layouts/AuthLayout';
import { PlatformLayout } from '@/layouts/PlatformLayout';
import { TenantLayout } from '@/layouts/TenantLayout';
import { PublicAuthRoute } from '@/features/auth/guards/PublicAuthRoute';
import {
  AccountSettingsPage,
  ApiTokensPage,
  AuthLoginPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  TenantRegistrationPage
} from '@/features/auth/pages';
import { RequireAuth } from '@/features/auth/guards/RequireAuth';
import { RequirePermission } from '@/features/auth/guards/RequirePermission';
import {
  PlatformPermissionCreatePage,
  PlatformPermissionEditPage,
  PlatformPermissionsListPage,
  PlatformPermissionViewPage,
  PlatformRoleCreatePage,
  PlatformRoleEditPage,
  PlatformRolesListPage,
  PlatformRoleViewPage,
  PlatformTeamCreatePage,
  PlatformTeamEditPage,
  PlatformTeamRoleCreatePage,
  PlatformTeamRoleEditPage,
  PlatformTeamRolesListPage,
  PlatformTeamsListPage,
  PlatformTeamViewPage
} from '@/features/platform/access-control/pages/PlatformAccessPages';
import { PlatformDashboardPage } from '@/features/platform/dashboard/pages/PlatformDashboardPage';
import {
  PlatformStaffCreatePage,
  PlatformStaffEditPage,
  PlatformStaffListPage,
  PlatformStaffViewPage
} from '@/features/platform/staff/pages/PlatformStaffPages';
import {
  PlatformTenantCreatePage,
  PlatformTenantEditPage,
  PlatformTenantsListPage,
  PlatformTenantViewPage
} from '@/features/platform/tenants/pages/PlatformTenantPages';
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
        path: 'register',
        element: (
          <PublicAuthRoute guard="tenant">
            <TenantRegistrationPage />
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
      {
        path: 'staff',
        element: (
          <RequirePermission guard="platform" anyOf={['platform_user.view']}>
            <PlatformStaffListPage />
          </RequirePermission>
        )
      },
      {
        path: 'staff/create',
        element: (
          <RequirePermission guard="platform" anyOf={['platform_user.create']}>
            <PlatformStaffCreatePage />
          </RequirePermission>
        )
      },
      {
        path: 'staff/:id',
        element: (
          <RequirePermission guard="platform" anyOf={['platform_user.view']}>
            <PlatformStaffViewPage />
          </RequirePermission>
        )
      },
      {
        path: 'staff/:id/edit',
        element: (
          <RequirePermission guard="platform" anyOf={['platform_user.edit']}>
            <PlatformStaffEditPage />
          </RequirePermission>
        )
      },
      {
        path: 'access-control/roles',
        element: (
          <RequirePermission guard="platform" anyOf={['platform_role.view']}>
            <PlatformRolesListPage />
          </RequirePermission>
        )
      },
      {
        path: 'access-control/roles/create',
        element: (
          <RequirePermission guard="platform" anyOf={['platform_role.create']}>
            <PlatformRoleCreatePage />
          </RequirePermission>
        )
      },
      {
        path: 'access-control/roles/:id',
        element: (
          <RequirePermission guard="platform" anyOf={['platform_role.view']}>
            <PlatformRoleViewPage />
          </RequirePermission>
        )
      },
      {
        path: 'access-control/roles/:id/edit',
        element: (
          <RequirePermission guard="platform" anyOf={['platform_role.edit']}>
            <PlatformRoleEditPage />
          </RequirePermission>
        )
      },
      {
        path: 'access-control/permissions',
        element: (
          <RequirePermission guard="platform" anyOf={['platform_permission.view']}>
            <PlatformPermissionsListPage />
          </RequirePermission>
        )
      },
      {
        path: 'access-control/permissions/create',
        element: (
          <RequirePermission guard="platform" anyOf={['platform_permission.create']}>
            <PlatformPermissionCreatePage />
          </RequirePermission>
        )
      },
      {
        path: 'access-control/permissions/:id',
        element: (
          <RequirePermission guard="platform" anyOf={['platform_permission.view']}>
            <PlatformPermissionViewPage />
          </RequirePermission>
        )
      },
      {
        path: 'access-control/permissions/:id/edit',
        element: (
          <RequirePermission guard="platform" anyOf={['platform_permission.edit']}>
            <PlatformPermissionEditPage />
          </RequirePermission>
        )
      },
      {
        path: 'teams',
        element: (
          <RequirePermission guard="platform" anyOf={['platform_team.view']}>
            <PlatformTeamsListPage />
          </RequirePermission>
        )
      },
      {
        path: 'teams/create',
        element: (
          <RequirePermission guard="platform" anyOf={['platform_team.create']}>
            <PlatformTeamCreatePage />
          </RequirePermission>
        )
      },
      {
        path: 'teams/:id',
        element: (
          <RequirePermission guard="platform" anyOf={['platform_team.view']}>
            <PlatformTeamViewPage />
          </RequirePermission>
        )
      },
      {
        path: 'teams/:id/edit',
        element: (
          <RequirePermission guard="platform" anyOf={['platform_team.edit']}>
            <PlatformTeamEditPage />
          </RequirePermission>
        )
      },
      {
        path: 'team-roles',
        element: (
          <RequirePermission guard="platform" anyOf={['platform_team.view']}>
            <PlatformTeamRolesListPage />
          </RequirePermission>
        )
      },
      {
        path: 'team-roles/create',
        element: (
          <RequirePermission guard="platform" anyOf={['platform_team.create']}>
            <PlatformTeamRoleCreatePage />
          </RequirePermission>
        )
      },
      {
        path: 'team-roles/:id/edit',
        element: (
          <RequirePermission guard="platform" anyOf={['platform_team.edit']}>
            <PlatformTeamRoleEditPage />
          </RequirePermission>
        )
      },
      {
        path: 'tenants',
        element: (
          <RequirePermission guard="platform" anyOf={['tenant.view']}>
            <PlatformTenantsListPage />
          </RequirePermission>
        )
      },
      {
        path: 'tenants/create',
        element: (
          <RequirePermission guard="platform" anyOf={['tenant.create']}>
            <PlatformTenantCreatePage />
          </RequirePermission>
        )
      },
      {
        path: 'tenants/:id',
        element: (
          <RequirePermission guard="platform" anyOf={['tenant.view']}>
            <PlatformTenantViewPage />
          </RequirePermission>
        )
      },
      {
        path: 'tenants/:id/edit',
        element: (
          <RequirePermission guard="platform" anyOf={['tenant.edit']}>
            <PlatformTenantEditPage />
          </RequirePermission>
        )
      },
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
