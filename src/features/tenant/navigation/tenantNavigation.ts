import {
  Banknote,
  BriefcaseBusiness,
  CalendarDays,
  FileText,
  Gauge,
  HelpCircle,
  LifeBuoy,
  Settings,
  UserCircle,
  Users
} from 'lucide-react';

import { TENANT_ROUTES } from '@/features/tenant/routes/tenantRoutes';
import type { NavGroup } from '@/shared/components/navigation/navigationTypes';

export function buildTenantNavigation(tenantSlug: string): NavGroup[] {
  return [
    {
      label: 'Workspace',
      items: [
        { label: 'Dashboard', to: TENANT_ROUTES.dashboard(tenantSlug), icon: Gauge, permission: 'dashboard.view' }
      ]
    },
    {
      label: 'CRM',
      moduleCode: 'crm',
      items: [
        { label: 'Leads', to: TENANT_ROUTES.crm.leads(tenantSlug), icon: BriefcaseBusiness, permission: 'lead.view' },
        { label: 'Clients', to: TENANT_ROUTES.crm.clients(tenantSlug), icon: Users, permission: 'client.view' },
        { label: 'Vendors', to: TENANT_ROUTES.crm.vendors(tenantSlug), icon: Users, permission: 'vendor.view' }
      ]
    },
    {
      label: 'Work',
      items: [
        { label: 'Projects', to: TENANT_ROUTES.projects.projects(tenantSlug), icon: BriefcaseBusiness, permission: 'project.view' },
        { label: 'Tasks', to: TENANT_ROUTES.projects.tasks(tenantSlug), icon: CalendarDays, permission: 'task.view' },
        { label: 'Support Issues', to: TENANT_ROUTES.support.issues(tenantSlug), icon: LifeBuoy, permission: 'issue.view' }
      ]
    },
    {
      label: 'Business',
      items: [
        { label: 'HRMS', to: TENANT_ROUTES.hrms.staff(tenantSlug), icon: Users, permission: 'staff.view', moduleCode: 'hrms' },
        { label: 'Finance', to: TENANT_ROUTES.finance.invoices(tenantSlug), icon: Banknote, permission: 'finance.invoice.view' },
        { label: 'Documents', to: TENANT_ROUTES.documents(tenantSlug), icon: FileText, permission: 'document.view' },
        { label: 'Reports', to: TENANT_ROUTES.reports(tenantSlug), icon: Gauge, permission: 'report.view' }
      ]
    },
    {
      label: 'Account',
      items: [
        { label: 'Settings', to: TENANT_ROUTES.settings(tenantSlug), icon: Settings, permission: 'setting.view' },
        { label: 'Profile', to: TENANT_ROUTES.profile(tenantSlug), icon: UserCircle, permission: 'profile.view' },
        { label: 'Help Center', to: TENANT_ROUTES.helpCenter(tenantSlug), icon: HelpCircle }
      ]
    }
  ];
}
