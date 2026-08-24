import { createBrowserRouter, Navigate } from 'react-router-dom';

import { AuthLayout } from '@/layouts/AuthLayout';
import { PlatformLayout } from '@/layouts/PlatformLayout';
import { TenantLayout } from '@/layouts/TenantLayout';
import { PublicAuthRoute } from '@/features/auth/guards/PublicAuthRoute';
import {
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
  PlatformTeamRoleViewPage,
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
import {
  PlatformAddonCreatePage,
  PlatformAddonEditPage,
  PlatformAddonsListPage,
  PlatformAddonViewPage,
  PlatformFeatureCreatePage,
  PlatformFeatureEditPage,
  PlatformFeaturesListPage,
  PlatformFeatureViewPage,
  PlatformPlanCreatePage,
  PlatformPlanEditPage,
  PlatformPlansListPage,
  PlatformPlanViewPage,
  PlatformSubscriptionsListPage,
  PlatformSubscriptionViewPage
} from '@/features/platform/subscriptions/pages/PlatformSubscriptionCatalogPages';
import {
  PlatformCouponViewPage,
  PlatformCouponCreatePage,
  PlatformCouponEditPage,
  PlatformCouponsListPage,
  PlatformInvoiceViewPage,
  PlatformInvoicesListPage,
  PlatformPaymentViewPage,
  PlatformPaymentsListPage,
  PlatformRefundViewPage,
  PlatformRefundsListPage
} from '@/features/platform/billing/pages/PlatformBillingPages';
import {
  PlatformAnnouncementsPage,
  PlatformAuditPage,
  PlatformIntegrationsPage,
  PlatformKnowledgeBasePage,
  PlatformLegalPage,
  PlatformModuleCreatePage,
  PlatformModuleEditPage,
  PlatformModulesPage,
  PlatformModuleViewPage,
  PlatformMonitoringPage,
  PlatformOnboardingPage,
  PlatformRemoteLoginPage,
  PlatformReportsPage,
  PlatformSettingsPage,
  PlatformSupportTicketViewPage,
  PlatformSupportTicketsPage,
  PlatformTrialsPage,
  PlatformWebhooksPage
} from '@/features/platform/operations/pages/PlatformOperationsPages';
import { ForbiddenPage } from '@/pages/ForbiddenPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { PlaceholderPage } from '@/pages/PlaceholderPage';
import { PLATFORM_ROUTES } from '@/features/platform/routes/platformRoutes';
import { TenantDashboardPage, TenantMyDashboardPage } from '@/features/tenant/pages/TenantDashboardPages';
import { TenantProfilePage } from '@/features/tenant/pages/TenantProfilePages';
import {
  TenantActivityPage,
  TenantHelpArticlePage,
  TenantHelpCenterPage
} from '@/features/tenant/pages/TenantWorkspacePages';
import {
  TenantPermissionsPage,
  TenantRoleCreatePage,
  TenantRoleEditPage,
  TenantRolesListPage,
  TenantRoleViewPage,
  TenantStaffCreatePage,
  TenantStaffDashboardPage,
  TenantStaffEditPage,
  TenantStaffGridPage,
  TenantStaffListPage,
  TenantStaffViewPage,
  TenantTeamCreatePage,
  TenantTeamEditPage,
  TenantTeamsListPage,
  TenantTeamViewPage,
  TenantUsersPage
} from '@/features/tenant/pages/TenantAccessStaffPages';
import {
  TenantClientCreatePage,
  TenantClientEditPage,
  TenantClientsGridPage,
  TenantClientsListPage,
  TenantClientViewPage,
  TenantLeadCreatePage,
  TenantLeadEditPage,
  TenantLeadsDashboardPage,
  TenantLeadsGridPage,
  TenantLeadsKanbanPage,
  TenantLeadsListPage,
  TenantLeadViewPage,
  TenantVendorCreatePage,
  TenantVendorEditPage,
  TenantVendorsGridPage,
  TenantVendorsListPage,
  TenantVendorViewPage
} from '@/features/tenant/pages/TenantCrmPages';
import {
  TenantCalendarAgendaPage,
  TenantCalendarDailyPage,
  TenantCalendarMonthlyPage,
  TenantCalendarWeeklyPage,
  TenantClientRenewalsPage,
  TenantIssueCreatePage,
  TenantIssueEditPage,
  TenantIssuesDashboardPage,
  TenantIssuesKanbanPage,
  TenantIssuesListPage,
  TenantIssueViewPage,
  TenantMySchedulePage,
  TenantMyTasksPage,
  TenantProjectCreatePage,
  TenantProjectEditPage,
  TenantProjectsCalendarPage,
  TenantProjectsDashboardPage,
  TenantProjectsGanttPage,
  TenantProjectsGridPage,
  TenantProjectsKanbanPage,
  TenantProjectsListPage,
  TenantProjectViewPage,
  TenantRenewalCreatePage,
  TenantRenewalEditPage,
  TenantRenewalsCalendarPage,
  TenantRenewalsDashboardPage,
  TenantRenewalsListPage,
  TenantRenewalViewPage,
  TenantTaskCreatePage,
  TenantTaskEditPage,
  TenantTasksCalendarPage,
  TenantTasksDashboardPage,
  TenantTasksKanbanPage,
  TenantTasksListPage,
  TenantTaskViewPage,
  TenantTeamCalendarPage,
  TenantTeamTasksPage,
  TenantTodoCalendarPage,
  TenantTodoCreatePage,
  TenantTodoDashboardPage,
  TenantTodoEditPage,
  TenantTodoKanbanPage,
  TenantTodoListPage,
  TenantTodoViewPage,
  TenantVendorRenewalsPage
} from '@/features/tenant/pages/TenantOperationsPages';
import {
  TenantAttendancePage,
  TenantHolidaysPage,
  TenantLeavePage,
  TenantPayrollPage
} from '@/features/tenant/pages/TenantHrmsPages';
import {
  TenantAuditPage,
  TenantDocumentsPage,
  TenantFinanceBankAccountsPage,
  TenantFinanceExpensesPage,
  TenantFinanceInvoicesPage,
  TenantFinancePaymentsPage,
  TenantIntegrationsPage,
  TenantNotificationsCommunicationPage,
  TenantReportsPage,
  TenantSettingsPage
} from '@/features/tenant/pages/TenantBusinessPages';

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
        path: 'team-roles/:id',
        element: (
          <RequirePermission guard="platform" anyOf={['platform_team.view']}>
            <PlatformTeamRoleViewPage />
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
      {
        path: 'subscriptions',
        element: (
          <RequirePermission guard="platform" anyOf={['subscription.view']}>
            <PlatformSubscriptionsListPage />
          </RequirePermission>
        )
      },
      {
        path: 'subscriptions/:id',
        element: (
          <RequirePermission guard="platform" anyOf={['subscription.view']}>
            <PlatformSubscriptionViewPage />
          </RequirePermission>
        )
      },
      {
        path: 'catalog/plans',
        element: (
          <RequirePermission guard="platform" anyOf={['plan.view']}>
            <PlatformPlansListPage />
          </RequirePermission>
        )
      },
      {
        path: 'catalog/plans/create',
        element: (
          <RequirePermission guard="platform" anyOf={['plan.create']}>
            <PlatformPlanCreatePage />
          </RequirePermission>
        )
      },
      {
        path: 'catalog/plans/:id',
        element: (
          <RequirePermission guard="platform" anyOf={['plan.view']}>
            <PlatformPlanViewPage />
          </RequirePermission>
        )
      },
      {
        path: 'catalog/plans/:id/edit',
        element: (
          <RequirePermission guard="platform" anyOf={['plan.edit']}>
            <PlatformPlanEditPage />
          </RequirePermission>
        )
      },
      {
        path: 'catalog/features',
        element: (
          <RequirePermission guard="platform" anyOf={['feature.view']}>
            <PlatformFeaturesListPage />
          </RequirePermission>
        )
      },
      {
        path: 'catalog/features/create',
        element: (
          <RequirePermission guard="platform" anyOf={['feature.create']}>
            <PlatformFeatureCreatePage />
          </RequirePermission>
        )
      },
      {
        path: 'catalog/features/:id',
        element: (
          <RequirePermission guard="platform" anyOf={['feature.view']}>
            <PlatformFeatureViewPage />
          </RequirePermission>
        )
      },
      {
        path: 'catalog/features/:id/edit',
        element: (
          <RequirePermission guard="platform" anyOf={['feature.edit']}>
            <PlatformFeatureEditPage />
          </RequirePermission>
        )
      },
      {
        path: 'catalog/add-ons',
        element: (
          <RequirePermission guard="platform" anyOf={['plan.view']}>
            <PlatformAddonsListPage />
          </RequirePermission>
        )
      },
      {
        path: 'catalog/add-ons/create',
        element: (
          <RequirePermission guard="platform" anyOf={['plan.create']}>
            <PlatformAddonCreatePage />
          </RequirePermission>
        )
      },
      {
        path: 'catalog/add-ons/:id',
        element: (
          <RequirePermission guard="platform" anyOf={['plan.view']}>
            <PlatformAddonViewPage />
          </RequirePermission>
        )
      },
      {
        path: 'catalog/add-ons/:id/edit',
        element: (
          <RequirePermission guard="platform" anyOf={['plan.edit']}>
            <PlatformAddonEditPage />
          </RequirePermission>
        )
      },
      {
        path: 'billing/invoices',
        element: (
          <RequirePermission guard="platform" anyOf={['billing.invoice.view']}>
            <PlatformInvoicesListPage />
          </RequirePermission>
        )
      },
      {
        path: 'billing/invoices/:id',
        element: (
          <RequirePermission guard="platform" anyOf={['billing.invoice.view']}>
            <PlatformInvoiceViewPage />
          </RequirePermission>
        )
      },
      {
        path: 'billing/payments',
        element: (
          <RequirePermission guard="platform" anyOf={['billing.payment.view']}>
            <PlatformPaymentsListPage />
          </RequirePermission>
        )
      },
      {
        path: 'billing/payments/:id',
        element: (
          <RequirePermission guard="platform" anyOf={['billing.payment.view']}>
            <PlatformPaymentViewPage />
          </RequirePermission>
        )
      },
      {
        path: 'billing/refunds',
        element: (
          <RequirePermission guard="platform" anyOf={['billing.payment.view', 'billing.payment.refund']}>
            <PlatformRefundsListPage />
          </RequirePermission>
        )
      },
      {
        path: 'billing/refunds/:id',
        element: (
          <RequirePermission guard="platform" anyOf={['billing.payment.view', 'billing.payment.refund']}>
            <PlatformRefundViewPage />
          </RequirePermission>
        )
      },
      {
        path: 'billing/coupons',
        element: (
          <RequirePermission guard="platform" anyOf={['coupon.view']}>
            <PlatformCouponsListPage />
          </RequirePermission>
        )
      },
      {
        path: 'billing/coupons/create',
        element: (
          <RequirePermission guard="platform" anyOf={['coupon.create']}>
            <PlatformCouponCreatePage />
          </RequirePermission>
        )
      },
      {
        path: 'billing/coupons/:id',
        element: (
          <RequirePermission guard="platform" anyOf={['coupon.view']}>
            <PlatformCouponViewPage />
          </RequirePermission>
        )
      },
      {
        path: 'billing/coupons/:id/edit',
        element: (
          <RequirePermission guard="platform" anyOf={['coupon.edit']}>
            <PlatformCouponEditPage />
          </RequirePermission>
        )
      },
      {
        path: 'catalog/modules',
        element: (
          <RequirePermission guard="platform" anyOf={['module.view']}>
            <PlatformModulesPage />
          </RequirePermission>
        )
      },
      {
        path: 'catalog/modules/create',
        element: (
          <RequirePermission guard="platform" anyOf={['module.edit']}>
            <PlatformModuleCreatePage />
          </RequirePermission>
        )
      },
      {
        path: 'catalog/modules/:id',
        element: (
          <RequirePermission guard="platform" anyOf={['module.view']}>
            <PlatformModuleViewPage />
          </RequirePermission>
        )
      },
      {
        path: 'catalog/modules/:id/edit',
        element: (
          <RequirePermission guard="platform" anyOf={['module.edit']}>
            <PlatformModuleEditPage />
          </RequirePermission>
        )
      },
      {
        path: 'support/tickets/:id',
        element: (
          <RequirePermission guard="platform" anyOf={['support.ticket.view']}>
            <PlatformSupportTicketViewPage />
          </RequirePermission>
        )
      },
      {
        path: 'support/tickets',
        element: (
          <RequirePermission guard="platform" anyOf={['support.ticket.view']}>
            <PlatformSupportTicketsPage />
          </RequirePermission>
        )
      },
      {
        path: 'support/knowledge-base',
        element: (
          <RequirePermission guard="platform" anyOf={['support.knowledge_base.view']}>
            <PlatformKnowledgeBasePage />
          </RequirePermission>
        )
      },
      {
        path: 'support/remote-login',
        element: (
          <RequirePermission guard="platform" anyOf={['tenant.impersonate']}>
            <PlatformRemoteLoginPage />
          </RequirePermission>
        )
      },
      {
        path: 'reports',
        element: (
          <RequirePermission guard="platform" anyOf={['report.view']}>
            <PlatformReportsPage />
          </RequirePermission>
        )
      },
      {
        path: 'monitoring',
        element: (
          <RequirePermission guard="platform" anyOf={['monitoring.view']}>
            <PlatformMonitoringPage />
          </RequirePermission>
        )
      },
      {
        path: 'integrations',
        element: (
          <RequirePermission guard="platform" anyOf={['integration.view']}>
            <PlatformIntegrationsPage />
          </RequirePermission>
        )
      },
      {
        path: 'settings',
        element: (
          <RequirePermission guard="platform" anyOf={['setting.view']}>
            <PlatformSettingsPage />
          </RequirePermission>
        )
      },
      {
        path: 'audit',
        element: (
          <RequirePermission guard="platform" anyOf={['audit_log.view']}>
            <PlatformAuditPage />
          </RequirePermission>
        )
      },
      {
        path: 'onboarding',
        element: (
          <RequirePermission guard="platform" anyOf={['tenant.view']}>
            <PlatformOnboardingPage />
          </RequirePermission>
        )
      },
      {
        path: 'trials',
        element: (
          <RequirePermission guard="platform" anyOf={['subscription.view']}>
            <PlatformTrialsPage />
          </RequirePermission>
        )
      },
      {
        path: 'legal',
        element: (
          <RequirePermission guard="platform" anyOf={['setting.view']}>
            <PlatformLegalPage />
          </RequirePermission>
        )
      },
      {
        path: 'announcements',
        element: (
          <RequirePermission guard="platform" anyOf={['setting.view']}>
            <PlatformAnnouncementsPage />
          </RequirePermission>
        )
      },
      {
        path: 'webhooks',
        element: (
          <RequirePermission guard="platform" anyOf={['integration.view']}>
            <PlatformWebhooksPage />
          </RequirePermission>
        )
      },
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
      {
        path: 'dashboard',
        element: (
          <RequirePermission guard="tenant" anyOf={['dashboard.view']}>
            <TenantDashboardPage />
          </RequirePermission>
        )
      },
      {
        path: 'my-dashboard',
        element: (
          <RequirePermission guard="tenant" anyOf={['dashboard.view']}>
            <TenantMyDashboardPage />
          </RequirePermission>
        )
      },
      {
        path: 'notifications',
        element: (
          <RequirePermission guard="tenant" anyOf={['notification.view']}>
            <TenantNotificationsCommunicationPage />
          </RequirePermission>
        )
      },
      {
        path: 'activity',
        element: (
          <RequirePermission guard="tenant" anyOf={['activity_log.view', 'audit_log.view']}>
            <TenantActivityPage />
          </RequirePermission>
        )
      },
      {
        path: 'profile',
        element: (
          <RequirePermission guard="tenant" anyOf={['profile.view']}>
            <TenantProfilePage />
          </RequirePermission>
        )
      },
      { path: 'profile/api-tokens', element: <ApiTokensPage guard="tenant" /> },
      { path: 'help-center', element: <TenantHelpCenterPage /> },
      { path: 'help-center/articles/:slug', element: <TenantHelpArticlePage /> },
      {
        path: 'crm/leads/dashboard',
        element: (
          <RequirePermission guard="tenant" anyOf={['lead.view']}>
            <TenantLeadsDashboardPage />
          </RequirePermission>
        )
      },
      {
        path: 'crm/leads/grid',
        element: (
          <RequirePermission guard="tenant" anyOf={['lead.view']}>
            <TenantLeadsGridPage />
          </RequirePermission>
        )
      },
      {
        path: 'crm/leads/kanban',
        element: (
          <RequirePermission guard="tenant" anyOf={['lead.view']}>
            <TenantLeadsKanbanPage />
          </RequirePermission>
        )
      },
      {
        path: 'crm/leads',
        element: (
          <RequirePermission guard="tenant" anyOf={['lead.view']}>
            <TenantLeadsListPage />
          </RequirePermission>
        )
      },
      {
        path: 'crm/leads/create',
        element: (
          <RequirePermission guard="tenant" anyOf={['lead.create']}>
            <TenantLeadCreatePage />
          </RequirePermission>
        )
      },
      {
        path: 'crm/leads/:id',
        element: (
          <RequirePermission guard="tenant" anyOf={['lead.view']}>
            <TenantLeadViewPage />
          </RequirePermission>
        )
      },
      {
        path: 'crm/leads/:id/edit',
        element: (
          <RequirePermission guard="tenant" anyOf={['lead.edit']}>
            <TenantLeadEditPage />
          </RequirePermission>
        )
      },
      {
        path: 'crm/clients/grid',
        element: (
          <RequirePermission guard="tenant" anyOf={['client.view']}>
            <TenantClientsGridPage />
          </RequirePermission>
        )
      },
      {
        path: 'crm/clients',
        element: (
          <RequirePermission guard="tenant" anyOf={['client.view']}>
            <TenantClientsListPage />
          </RequirePermission>
        )
      },
      {
        path: 'crm/clients/create',
        element: (
          <RequirePermission guard="tenant" anyOf={['client.create']}>
            <TenantClientCreatePage />
          </RequirePermission>
        )
      },
      {
        path: 'crm/clients/:id',
        element: (
          <RequirePermission guard="tenant" anyOf={['client.view']}>
            <TenantClientViewPage />
          </RequirePermission>
        )
      },
      {
        path: 'crm/clients/:id/edit',
        element: (
          <RequirePermission guard="tenant" anyOf={['client.edit']}>
            <TenantClientEditPage />
          </RequirePermission>
        )
      },
      {
        path: 'crm/vendors/grid',
        element: (
          <RequirePermission guard="tenant" anyOf={['vendor.view']}>
            <TenantVendorsGridPage />
          </RequirePermission>
        )
      },
      {
        path: 'crm/vendors',
        element: (
          <RequirePermission guard="tenant" anyOf={['vendor.view']}>
            <TenantVendorsListPage />
          </RequirePermission>
        )
      },
      {
        path: 'crm/vendors/create',
        element: (
          <RequirePermission guard="tenant" anyOf={['vendor.create']}>
            <TenantVendorCreatePage />
          </RequirePermission>
        )
      },
      {
        path: 'crm/vendors/:id',
        element: (
          <RequirePermission guard="tenant" anyOf={['vendor.view']}>
            <TenantVendorViewPage />
          </RequirePermission>
        )
      },
      {
        path: 'crm/vendors/:id/edit',
        element: (
          <RequirePermission guard="tenant" anyOf={['vendor.edit']}>
            <TenantVendorEditPage />
          </RequirePermission>
        )
      },
      { path: 'crm/renewals/dashboard', element: <RequirePermission guard="tenant" anyOf={['renewal.view']}><TenantRenewalsDashboardPage /></RequirePermission> },
      { path: 'crm/renewals/calendar', element: <RequirePermission guard="tenant" anyOf={['renewal.view']}><TenantRenewalsCalendarPage /></RequirePermission> },
      { path: 'crm/renewals/create', element: <RequirePermission guard="tenant" anyOf={['renewal.create']}><TenantRenewalCreatePage /></RequirePermission> },
      { path: 'crm/renewals/:id/edit', element: <RequirePermission guard="tenant" anyOf={['renewal.edit']}><TenantRenewalEditPage /></RequirePermission> },
      { path: 'crm/renewals/:id', element: <RequirePermission guard="tenant" anyOf={['renewal.view']}><TenantRenewalViewPage /></RequirePermission> },
      { path: 'crm/renewals', element: <RequirePermission guard="tenant" anyOf={['renewal.view']}><TenantRenewalsListPage /></RequirePermission> },
      { path: 'crm/client-renewals', element: <RequirePermission guard="tenant" anyOf={['renewal.view']}><TenantClientRenewalsPage /></RequirePermission> },
      { path: 'crm/vendor-renewals', element: <RequirePermission guard="tenant" anyOf={['renewal.view']}><TenantVendorRenewalsPage /></RequirePermission> },
      { path: 'projects/dashboard', element: <RequirePermission guard="tenant" anyOf={['project.view']}><TenantProjectsDashboardPage /></RequirePermission> },
      { path: 'projects/grid', element: <RequirePermission guard="tenant" anyOf={['project.view']}><TenantProjectsGridPage /></RequirePermission> },
      { path: 'projects/kanban', element: <RequirePermission guard="tenant" anyOf={['project.view']}><TenantProjectsKanbanPage /></RequirePermission> },
      { path: 'projects/gantt', element: <RequirePermission guard="tenant" anyOf={['project.view']}><TenantProjectsGanttPage /></RequirePermission> },
      { path: 'projects/calendar', element: <RequirePermission guard="tenant" anyOf={['project.view']}><TenantProjectsCalendarPage /></RequirePermission> },
      { path: 'projects/create', element: <RequirePermission guard="tenant" anyOf={['project.create']}><TenantProjectCreatePage /></RequirePermission> },
      { path: 'projects/:id/edit', element: <RequirePermission guard="tenant" anyOf={['project.edit']}><TenantProjectEditPage /></RequirePermission> },
      { path: 'projects/:id', element: <RequirePermission guard="tenant" anyOf={['project.view']}><TenantProjectViewPage /></RequirePermission> },
      { path: 'projects', element: <RequirePermission guard="tenant" anyOf={['project.view']}><TenantProjectsListPage /></RequirePermission> },
      { path: 'tasks/dashboard', element: <RequirePermission guard="tenant" anyOf={['task.view']}><TenantTasksDashboardPage /></RequirePermission> },
      { path: 'tasks/kanban', element: <RequirePermission guard="tenant" anyOf={['task.view']}><TenantTasksKanbanPage /></RequirePermission> },
      { path: 'tasks/calendar', element: <RequirePermission guard="tenant" anyOf={['task.view']}><TenantTasksCalendarPage /></RequirePermission> },
      { path: 'tasks/my', element: <RequirePermission guard="tenant" anyOf={['task.view']}><TenantMyTasksPage /></RequirePermission> },
      { path: 'tasks/team', element: <RequirePermission guard="tenant" anyOf={['task.view']}><TenantTeamTasksPage /></RequirePermission> },
      { path: 'tasks/create', element: <RequirePermission guard="tenant" anyOf={['task.create']}><TenantTaskCreatePage /></RequirePermission> },
      { path: 'tasks/:id/edit', element: <RequirePermission guard="tenant" anyOf={['task.edit']}><TenantTaskEditPage /></RequirePermission> },
      { path: 'tasks/:id', element: <RequirePermission guard="tenant" anyOf={['task.view']}><TenantTaskViewPage /></RequirePermission> },
      { path: 'tasks', element: <RequirePermission guard="tenant" anyOf={['task.view']}><TenantTasksListPage /></RequirePermission> },
      { path: 'calendar', element: <Navigate to="monthly" replace /> },
      { path: 'calendar/daily', element: <RequirePermission guard="tenant" anyOf={['calendar.view']}><TenantCalendarDailyPage /></RequirePermission> },
      { path: 'calendar/weekly', element: <RequirePermission guard="tenant" anyOf={['calendar.view']}><TenantCalendarWeeklyPage /></RequirePermission> },
      { path: 'calendar/monthly', element: <RequirePermission guard="tenant" anyOf={['calendar.view']}><TenantCalendarMonthlyPage /></RequirePermission> },
      { path: 'calendar/agenda', element: <RequirePermission guard="tenant" anyOf={['calendar.view']}><TenantCalendarAgendaPage /></RequirePermission> },
      { path: 'calendar/my-schedule', element: <RequirePermission guard="tenant" anyOf={['calendar.view']}><TenantMySchedulePage /></RequirePermission> },
      { path: 'calendar/team', element: <RequirePermission guard="tenant" anyOf={['calendar.view']}><TenantTeamCalendarPage /></RequirePermission> },
      { path: 'to-do/dashboard', element: <RequirePermission guard="tenant" anyOf={['todo.view']}><TenantTodoDashboardPage /></RequirePermission> },
      { path: 'to-do/kanban', element: <RequirePermission guard="tenant" anyOf={['todo.view']}><TenantTodoKanbanPage /></RequirePermission> },
      { path: 'to-do/calendar', element: <RequirePermission guard="tenant" anyOf={['todo.view']}><TenantTodoCalendarPage /></RequirePermission> },
      { path: 'to-do/create', element: <RequirePermission guard="tenant" anyOf={['todo.create']}><TenantTodoCreatePage /></RequirePermission> },
      { path: 'to-do/:id/edit', element: <RequirePermission guard="tenant" anyOf={['todo.edit']}><TenantTodoEditPage /></RequirePermission> },
      { path: 'to-do/:id', element: <RequirePermission guard="tenant" anyOf={['todo.view']}><TenantTodoViewPage /></RequirePermission> },
      { path: 'to-do', element: <RequirePermission guard="tenant" anyOf={['todo.view']}><TenantTodoListPage /></RequirePermission> },
      { path: 'support/issues/dashboard', element: <RequirePermission guard="tenant" anyOf={['issue.view']}><TenantIssuesDashboardPage /></RequirePermission> },
      { path: 'support/issues/kanban', element: <RequirePermission guard="tenant" anyOf={['issue.view']}><TenantIssuesKanbanPage /></RequirePermission> },
      { path: 'support/issues/create', element: <RequirePermission guard="tenant" anyOf={['issue.create']}><TenantIssueCreatePage /></RequirePermission> },
      { path: 'support/issues/:id/edit', element: <RequirePermission guard="tenant" anyOf={['issue.edit']}><TenantIssueEditPage /></RequirePermission> },
      { path: 'support/issues/:id', element: <RequirePermission guard="tenant" anyOf={['issue.view']}><TenantIssueViewPage /></RequirePermission> },
      { path: 'support/issues', element: <RequirePermission guard="tenant" anyOf={['issue.view']}><TenantIssuesListPage /></RequirePermission> },
      {
        path: 'access-control/roles',
        element: (
          <RequirePermission guard="tenant" anyOf={['role.view']}>
            <TenantRolesListPage />
          </RequirePermission>
        )
      },
      {
        path: 'access-control/roles/create',
        element: (
          <RequirePermission guard="tenant" anyOf={['role.create']}>
            <TenantRoleCreatePage />
          </RequirePermission>
        )
      },
      {
        path: 'access-control/roles/:id',
        element: (
          <RequirePermission guard="tenant" anyOf={['role.view']}>
            <TenantRoleViewPage />
          </RequirePermission>
        )
      },
      {
        path: 'access-control/roles/:id/edit',
        element: (
          <RequirePermission guard="tenant" anyOf={['role.edit']}>
            <TenantRoleEditPage />
          </RequirePermission>
        )
      },
      {
        path: 'access-control/permissions',
        element: (
          <RequirePermission guard="tenant" anyOf={['permission.view']}>
            <TenantPermissionsPage />
          </RequirePermission>
        )
      },
      {
        path: 'access-control/teams',
        element: (
          <RequirePermission guard="tenant" anyOf={['team.view']}>
            <TenantTeamsListPage />
          </RequirePermission>
        )
      },
      {
        path: 'access-control/teams/create',
        element: (
          <RequirePermission guard="tenant" anyOf={['team.create']}>
            <TenantTeamCreatePage />
          </RequirePermission>
        )
      },
      {
        path: 'access-control/teams/:id',
        element: (
          <RequirePermission guard="tenant" anyOf={['team.view']}>
            <TenantTeamViewPage />
          </RequirePermission>
        )
      },
      {
        path: 'access-control/teams/:id/edit',
        element: (
          <RequirePermission guard="tenant" anyOf={['team.edit']}>
            <TenantTeamEditPage />
          </RequirePermission>
        )
      },
      {
        path: 'access-control/users',
        element: (
          <RequirePermission guard="tenant" anyOf={['staff.view']}>
            <TenantStaffListPage />
          </RequirePermission>
        )
      },
      {
        path: 'hrms/staff/dashboard',
        element: (
          <RequirePermission guard="tenant" anyOf={['staff.view']}>
            <TenantStaffDashboardPage />
          </RequirePermission>
        )
      },
      {
        path: 'hrms/staff/grid',
        element: (
          <RequirePermission guard="tenant" anyOf={['staff.view']}>
            <TenantStaffGridPage />
          </RequirePermission>
        )
      },
      {
        path: 'hrms/staff',
        element: (
          <RequirePermission guard="tenant" anyOf={['staff.view']}>
            <TenantStaffListPage />
          </RequirePermission>
        )
      },
      {
        path: 'hrms/staff/create',
        element: (
          <RequirePermission guard="tenant" anyOf={['staff.create']}>
            <TenantStaffCreatePage />
          </RequirePermission>
        )
      },
      {
        path: 'hrms/staff/:id',
        element: (
          <RequirePermission guard="tenant" anyOf={['staff.view']}>
            <TenantStaffViewPage />
          </RequirePermission>
        )
      },
      {
        path: 'hrms/staff/:id/edit',
        element: (
          <RequirePermission guard="tenant" anyOf={['staff.edit']}>
            <TenantStaffEditPage />
          </RequirePermission>
        )
      },
      {
        path: 'hrms/attendance',
        element: (
          <RequirePermission guard="tenant" anyOf={['attendance.view']}>
            <TenantAttendancePage />
          </RequirePermission>
        )
      },
      {
        path: 'hrms/leave',
        element: (
          <RequirePermission guard="tenant" anyOf={['leave.view']}>
            <TenantLeavePage />
          </RequirePermission>
        )
      },
      {
        path: 'hrms/payroll',
        element: (
          <RequirePermission guard="tenant" anyOf={['payroll.view']}>
            <TenantPayrollPage />
          </RequirePermission>
        )
      },
      {
        path: 'hrms/holidays',
        element: (
          <RequirePermission guard="tenant" anyOf={['holiday.view']}>
            <TenantHolidaysPage />
          </RequirePermission>
        )
      },
      { path: 'finance/invoices', element: <RequirePermission guard="tenant" anyOf={['finance.invoice.view']}><TenantFinanceInvoicesPage /></RequirePermission> },
      { path: 'finance/payments', element: <RequirePermission guard="tenant" anyOf={['finance.payment.view']}><TenantFinancePaymentsPage /></RequirePermission> },
      { path: 'finance/expenses', element: <RequirePermission guard="tenant" anyOf={['finance.expense.view']}><TenantFinanceExpensesPage /></RequirePermission> },
      { path: 'finance/bank-accounts', element: <RequirePermission guard="tenant" anyOf={['finance.bank_account.view']}><TenantFinanceBankAccountsPage /></RequirePermission> },
      { path: 'documents', element: <RequirePermission guard="tenant" anyOf={['document.view']}><TenantDocumentsPage /></RequirePermission> },
      { path: 'reports', element: <RequirePermission guard="tenant" anyOf={['report.view']}><TenantReportsPage /></RequirePermission> },
      { path: 'settings', element: <RequirePermission guard="tenant" anyOf={['setting.view']}><TenantSettingsPage /></RequirePermission> },
      { path: 'integrations', element: <RequirePermission guard="tenant" anyOf={['setting.view']}><TenantIntegrationsPage /></RequirePermission> },
      { path: 'audit', element: <RequirePermission guard="tenant" anyOf={['audit_log.view', 'activity_log.view']}><TenantAuditPage /></RequirePermission> },
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
