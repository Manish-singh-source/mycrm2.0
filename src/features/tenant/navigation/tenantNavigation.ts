import {
  Banknote,
  BellRing,
  BriefcaseBusiness,
  CalendarDays,
  FileText,
  Gauge,
  HelpCircle,
  LayoutList,
  LifeBuoy,
  Receipt,
  Settings,
  ShieldCheck,
  StickyNote,
  TimerReset,
  UserCircle,
  Users
} from 'lucide-react';

import { TENANT_ROUTES } from '@/features/tenant/routes/tenantRoutes';
import type { NavGroup } from '@/shared/components/navigation/navigationTypes';

type TenantNavigationBadges = {
  overdueTasks?: number;
  openIssues?: number;
  pendingApprovals?: number;
  unreadNotifications?: number;
  renewalsDueSoon?: number;
};

export function buildTenantNavigation(tenantSlug: string, badges: TenantNavigationBadges = {}): NavGroup[] {
  return [
    {
      id: 'dashboard',
      label: 'Dashboard',
      items: [
        {
          label: 'Dashboard',
          to: TENANT_ROUTES.dashboard(tenantSlug),
          icon: Gauge,
          permission: 'dashboard.view',
          badge: badges.unreadNotifications
        }
      ]
    },
    {
      id: 'crm',
      label: 'CRM',
      moduleCode: 'crm',
      items: [
        { label: 'Leads', to: TENANT_ROUTES.crm.leads(tenantSlug), icon: BriefcaseBusiness, permission: 'lead.view' },
        { label: 'Clients', to: TENANT_ROUTES.crm.clients(tenantSlug), icon: Users, permission: 'client.view' },
        { label: 'Vendors', to: TENANT_ROUTES.crm.vendors(tenantSlug), icon: Users, permission: 'vendor.view' },
        { label: 'Client Renewals', to: TENANT_ROUTES.crm.clientRenewals(tenantSlug), icon: TimerReset, permission: 'renewal.view', badge: badges.renewalsDueSoon },
        { label: 'Vendor Renewals', to: TENANT_ROUTES.crm.vendorRenewals(tenantSlug), icon: TimerReset, permission: 'renewal.view', badge: badges.renewalsDueSoon }
      ]
    },
    {
      id: 'projects',
      label: 'Projects',
      items: [
        { label: 'Projects', to: TENANT_ROUTES.projects.projects(tenantSlug), icon: BriefcaseBusiness, permission: 'project.view' },
        { label: 'Tasks', to: TENANT_ROUTES.projects.tasks(tenantSlug), icon: CalendarDays, permission: 'task.view', badge: badges.overdueTasks },
        { label: 'Calendar', to: TENANT_ROUTES.projects.calendar(tenantSlug), icon: CalendarDays, permission: 'calendar.view' },
        { label: 'To-Do', to: TENANT_ROUTES.projects.todo(tenantSlug), icon: StickyNote, permission: 'todo.view' }
      ]
    },
    {
      id: 'support',
      label: 'Support',
      items: [
        { label: 'Client Issues', to: TENANT_ROUTES.support.issues(tenantSlug), icon: LifeBuoy, permission: 'issue.view', badge: badges.openIssues }
      ]
    },
    {
      id: 'hrms',
      label: 'HRMS',
      moduleCode: 'hrms',
      items: [
        { label: 'Staff', to: TENANT_ROUTES.hrms.staff(tenantSlug), icon: Users, permission: 'staff.view', moduleCode: 'hrms' },
        { label: 'Attendance', to: TENANT_ROUTES.hrms.attendance(tenantSlug), icon: LayoutList, permission: 'attendance.view', moduleCode: 'hrms' },
        { label: 'Leave Management', to: TENANT_ROUTES.hrms.leave(tenantSlug), icon: ShieldCheck, permission: 'leave.view', moduleCode: 'hrms', badge: badges.pendingApprovals },
        { label: 'Payroll', to: TENANT_ROUTES.hrms.payroll(tenantSlug), icon: Receipt, permission: 'payroll.view', moduleCode: 'hrms', badge: badges.pendingApprovals },
        { label: 'Holidays', to: TENANT_ROUTES.hrms.holidays(tenantSlug), icon: BellRing, permission: 'holiday.view', moduleCode: 'hrms' }
      ]
    },
    {
      id: 'finance',
      label: 'Finance',
      items: [
        { label: 'Invoices', to: TENANT_ROUTES.finance.invoices(tenantSlug), icon: Receipt, permission: 'finance.invoice.view' },
        { label: 'Payments', to: TENANT_ROUTES.finance.payments(tenantSlug), icon: Banknote, permission: 'finance.payment.view' },
        { label: 'Expenses', to: TENANT_ROUTES.finance.expenses(tenantSlug), icon: Banknote, permission: 'finance.expense.view' },
        { label: 'Bank Accounts', to: TENANT_ROUTES.finance.bankAccounts(tenantSlug), icon: Banknote, permission: 'finance.bank_account.view' }
      ]
    },
    {
      id: 'documents',
      label: 'Documents',
      items: [{ label: 'Documents', to: TENANT_ROUTES.documents(tenantSlug), icon: FileText, permission: 'document.view' }]
    },
    {
      id: 'reports',
      label: 'Reports',
      items: [{ label: 'Reports', to: TENANT_ROUTES.reports(tenantSlug), icon: Gauge, permission: 'report.view' }]
    },
    {
      id: 'settings',
      label: 'Settings',
      items: [{ label: 'Settings', to: TENANT_ROUTES.settings(tenantSlug), icon: Settings, permission: 'setting.view' }]
    },
    {
      id: 'profile',
      label: 'Profile',
      items: [{ label: 'Profile', to: TENANT_ROUTES.profile(tenantSlug), icon: UserCircle, permission: 'profile.view' }]
    },
    {
      id: 'help',
      label: 'Help Center',
      items: [{ label: 'Help Center', to: TENANT_ROUTES.helpCenter(tenantSlug), icon: HelpCircle }]
    },
    {
      id: 'secondary',
      label: 'Workspace Tools',
      items: [
        { label: 'Notifications', to: TENANT_ROUTES.notifications(tenantSlug), icon: BellRing, permission: 'notification.view', badge: badges.unreadNotifications },
        { label: 'Recent Activity', to: TENANT_ROUTES.activity(tenantSlug), icon: LifeBuoy, permission: 'activity_log.view' }
      ]
    }
  ];
}
