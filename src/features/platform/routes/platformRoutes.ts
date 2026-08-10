const platformBase = '/platform';

export const PLATFORM_ROUTES = {
  dashboard: `${platformBase}/dashboard`,
  accessControl: {
    roles: `${platformBase}/access-control/roles`,
    permissions: `${platformBase}/access-control/permissions`
  },
  teams: `${platformBase}/teams`,
  teamRoles: `${platformBase}/team-roles`,
  staff: `${platformBase}/staff`,
  tenants: `${platformBase}/tenants`,
  subscriptions: `${platformBase}/subscriptions`,
  catalog: {
    plans: `${platformBase}/catalog/plans`,
    features: `${platformBase}/catalog/features`,
    addons: `${platformBase}/catalog/add-ons`,
    modules: `${platformBase}/catalog/modules`
  },
  billing: {
    invoices: `${platformBase}/billing/invoices`,
    payments: `${platformBase}/billing/payments`,
    refunds: `${platformBase}/billing/refunds`,
    coupons: `${platformBase}/billing/coupons`
  },
  support: {
    tickets: `${platformBase}/support/tickets`,
    knowledgeBase: `${platformBase}/support/knowledge-base`,
    remoteLogin: `${platformBase}/support/remote-login`
  },
  reports: `${platformBase}/reports`,
  monitoring: `${platformBase}/monitoring`,
  integrations: `${platformBase}/integrations`,
  settings: `${platformBase}/settings`,
  audit: `${platformBase}/audit`,
  onboarding: `${platformBase}/onboarding`,
  trials: `${platformBase}/trials`,
  legal: `${platformBase}/legal`,
  announcements: `${platformBase}/announcements`,
  apiTokens: `${platformBase}/api-tokens`,
  webhooks: `${platformBase}/webhooks`
} as const;
