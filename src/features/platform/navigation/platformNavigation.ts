import {
  Activity,
  BadgeDollarSign,
  Bell,
  Building2,
  FileBadge2,
  FileCog,
  FileText,
  CreditCard,
  Gauge,
  Gavel,
  GraduationCap,
  HandCoins,
  KeyRound,
  LifeBuoy,
  LockKeyhole,
  MonitorPause,
  Package2,
  Plug,
  Receipt,
  ScrollText,
  Settings,
  ShieldCheck,
  ShieldEllipsis,
  SquareKanban,
  Tags,
  UserRoundCog,
  Users
} from 'lucide-react';

import { PLATFORM_ROUTES } from '@/features/platform/routes/platformRoutes';
import type { NavGroup } from '@/shared/components/navigation/navigationTypes';

export const platformNavigation: NavGroup[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    items: [{ label: 'Dashboard', to: PLATFORM_ROUTES.dashboard, icon: Gauge, permission: 'dashboard.view' }]
  },
  {
    id: 'access',
    label: 'Access Control',
    items: [
      { label: 'Platform Roles', to: PLATFORM_ROUTES.accessControl.roles, icon: LockKeyhole, permission: 'platform_role.view' },
      { label: 'Platform Permissions', to: PLATFORM_ROUTES.accessControl.permissions, icon: ShieldEllipsis, permission: 'platform_permission.view' }
    ]
  },
  {
    id: 'teams',
    label: 'Platform Teams',
    items: [
      { label: 'Platform Teams', to: PLATFORM_ROUTES.teams, icon: ShieldCheck, permission: 'platform_team.view' },
      { label: 'Team Roles', to: PLATFORM_ROUTES.teamRoles, icon: LockKeyhole, permission: 'platform_team.view' }
    ]
  },
  {
    id: 'staff',
    label: 'Platform Staff',
    items: [
      { label: 'Platform Staff', to: PLATFORM_ROUTES.staff, icon: UserRoundCog, permission: 'platform_user.view' }
    ]
  },
  {
    id: 'tenants',
    label: 'Tenants',
    items: [{ label: 'Tenants', to: PLATFORM_ROUTES.tenants, icon: Building2, permission: 'tenant.view' }]
  },
  {
    id: 'subscriptions',
    label: 'Subscriptions',
    items: [{ label: 'Subscriptions', to: PLATFORM_ROUTES.subscriptions, icon: CreditCard, permission: 'subscription.view' }]
  },
  {
    id: 'catalog',
    label: 'Plans & Catalog',
    items: [
      { label: 'Plans', to: PLATFORM_ROUTES.catalog.plans, icon: Package2, permission: 'plan.view' },
      { label: 'Features', to: PLATFORM_ROUTES.catalog.features, icon: SquareKanban, permission: 'feature.view' },
      { label: 'Add-ons', to: PLATFORM_ROUTES.catalog.addons, icon: BadgeDollarSign, permission: 'plan.view' }
    ]
  },
  {
    id: 'billing',
    label: 'Billing',
    items: [
      { label: 'Invoices', to: PLATFORM_ROUTES.billing.invoices, icon: Receipt, permission: 'billing.invoice.view' },
      { label: 'Payments', to: PLATFORM_ROUTES.billing.payments, icon: HandCoins, permission: 'billing.payment.view' },
      { label: 'Refunds', to: PLATFORM_ROUTES.billing.refunds, icon: HandCoins, permission: 'billing.payment.refund' }
    ]
  },
  {
    id: 'coupons',
    label: 'Coupons',
    items: [{ label: 'Coupons', to: PLATFORM_ROUTES.billing.coupons, icon: Tags, permission: 'coupon.view' }]
  },
  {
    id: 'modules',
    label: 'Modules',
    items: [{ label: 'Modules', to: PLATFORM_ROUTES.catalog.modules, icon: FileCog, permission: 'module.view' }]
  },
  {
    id: 'support',
    label: 'Support',
    items: [
      { label: 'Tickets', to: PLATFORM_ROUTES.support.tickets, icon: LifeBuoy, permission: 'support.ticket.view' },
      { label: 'Knowledge Base', to: PLATFORM_ROUTES.support.knowledgeBase, icon: GraduationCap, permission: 'support.knowledge_base.view' },
      { label: 'Remote Login', to: PLATFORM_ROUTES.support.remoteLogin, icon: KeyRound, permission: 'tenant.impersonate' }
    ]
  },
  {
    id: 'reports',
    label: 'Reports',
    items: [{ label: 'Reports', to: PLATFORM_ROUTES.reports, icon: FileText, permission: 'report.view' }]
  },
  {
    id: 'monitoring',
    label: 'Monitoring',
    items: [{ label: 'Monitoring', to: PLATFORM_ROUTES.monitoring, icon: MonitorPause, permission: 'monitoring.view' }]
  },
  {
    id: 'integrations',
    label: 'Integrations',
    items: [{ label: 'Integrations', to: PLATFORM_ROUTES.integrations, icon: Plug, permission: 'integration.view' }]
  },
  {
    id: 'settings',
    label: 'Settings',
    items: [{ label: 'Settings', to: PLATFORM_ROUTES.settings, icon: Settings, permission: 'setting.view' }]
  },
  {
    id: 'audit',
    label: 'Audit Logs',
    items: [{ label: 'Audit Logs', to: PLATFORM_ROUTES.audit, icon: Activity, permission: 'audit_log.view' }]
  },
  {
    id: 'lifecycle',
    label: 'Lifecycle',
    items: [
      { label: 'Onboarding', to: PLATFORM_ROUTES.onboarding, icon: ScrollText, permission: 'tenant.view' },
      { label: 'Trials', to: PLATFORM_ROUTES.trials, icon: Bell, permission: 'subscription.view' },
      { label: 'Legal', to: PLATFORM_ROUTES.legal, icon: Gavel, permission: 'setting.view' },
      { label: 'Announcements', to: PLATFORM_ROUTES.announcements, icon: Bell, permission: 'setting.view' },
      { label: 'API Tokens', to: PLATFORM_ROUTES.apiTokens, icon: FileBadge2, permission: 'setting.view' },
      { label: 'Webhooks', to: PLATFORM_ROUTES.webhooks, icon: Users, permission: 'integration.view' }
    ]
  }
];
