import {
  Activity,
  Bell,
  Building2,
  CreditCard,
  Gauge,
  LifeBuoy,
  LockKeyhole,
  MonitorPulse,
  Plug,
  Settings,
  ShieldCheck,
  Users
} from 'lucide-react';

import { PLATFORM_ROUTES } from '@/features/platform/routes/platformRoutes';
import type { NavGroup } from '@/shared/components/navigation/navigationTypes';

export const platformNavigation: NavGroup[] = [
  {
    label: 'Overview',
    items: [{ label: 'Dashboard', to: PLATFORM_ROUTES.dashboard, icon: Gauge, permission: 'dashboard.view' }]
  },
  {
    label: 'Administration',
    items: [
      { label: 'Tenants', to: PLATFORM_ROUTES.tenants, icon: Building2, permission: 'tenant.view' },
      { label: 'Staff', to: PLATFORM_ROUTES.staff, icon: Users, permission: 'platform_user.view' },
      { label: 'Access Control', to: PLATFORM_ROUTES.accessControl.roles, icon: LockKeyhole, permission: 'platform_role.view' },
      { label: 'Teams', to: PLATFORM_ROUTES.teams, icon: ShieldCheck, permission: 'platform_team.view' }
    ]
  },
  {
    label: 'Revenue',
    items: [
      { label: 'Subscriptions', to: PLATFORM_ROUTES.subscriptions, icon: CreditCard, permission: 'subscription.view' },
      { label: 'Billing', to: PLATFORM_ROUTES.billing.invoices, icon: CreditCard, permission: 'billing.invoice.view' }
    ]
  },
  {
    label: 'Operations',
    items: [
      { label: 'Support', to: PLATFORM_ROUTES.support.tickets, icon: LifeBuoy, permission: 'support.ticket.view' },
      { label: 'Monitoring', to: PLATFORM_ROUTES.monitoring, icon: MonitorPulse, permission: 'monitoring.view' },
      { label: 'Integrations', to: PLATFORM_ROUTES.integrations, icon: Plug, permission: 'integration.view' },
      { label: 'Audit Logs', to: PLATFORM_ROUTES.audit, icon: Activity, permission: 'audit_log.view' },
      { label: 'Announcements', to: PLATFORM_ROUTES.announcements, icon: Bell, permission: 'setting.view' },
      { label: 'Settings', to: PLATFORM_ROUTES.settings, icon: Settings, permission: 'setting.view' }
    ]
  }
];
