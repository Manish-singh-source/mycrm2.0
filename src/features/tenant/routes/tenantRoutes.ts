const tenantBase = (tenantSlug = ':tenantSlug') => `/t/${tenantSlug}`;

export const TENANT_ROUTES = {
  workspace: (tenantSlug?: string) => tenantBase(tenantSlug),
  dashboard: (tenantSlug?: string) => `${tenantBase(tenantSlug)}/dashboard`,
  myDashboard: (tenantSlug?: string) => `${tenantBase(tenantSlug)}/my-dashboard`,
  notifications: (tenantSlug?: string) => `${tenantBase(tenantSlug)}/notifications`,
  activity: (tenantSlug?: string) => `${tenantBase(tenantSlug)}/activity`,
  accessControl: {
    roles: (tenantSlug?: string) => `${tenantBase(tenantSlug)}/access-control/roles`,
    teams: (tenantSlug?: string) => `${tenantBase(tenantSlug)}/access-control/teams`
  },
  crm: {
    leads: (tenantSlug?: string) => `${tenantBase(tenantSlug)}/crm/leads`,
    clients: (tenantSlug?: string) => `${tenantBase(tenantSlug)}/crm/clients`,
    vendors: (tenantSlug?: string) => `${tenantBase(tenantSlug)}/crm/vendors`,
    clientRenewals: (tenantSlug?: string) => `${tenantBase(tenantSlug)}/crm/client-renewals`,
    vendorRenewals: (tenantSlug?: string) => `${tenantBase(tenantSlug)}/crm/vendor-renewals`
  },
  projects: {
    projects: (tenantSlug?: string) => `${tenantBase(tenantSlug)}/projects`,
    tasks: (tenantSlug?: string) => `${tenantBase(tenantSlug)}/tasks`,
    todo: (tenantSlug?: string) => `${tenantBase(tenantSlug)}/to-do`,
    calendar: (tenantSlug?: string) => `${tenantBase(tenantSlug)}/calendar`
  },
  support: {
    issues: (tenantSlug?: string) => `${tenantBase(tenantSlug)}/support/issues`
  },
  hrms: {
    staff: (tenantSlug?: string) => `${tenantBase(tenantSlug)}/hrms/staff`,
    attendance: (tenantSlug?: string) => `${tenantBase(tenantSlug)}/hrms/attendance`,
    leave: (tenantSlug?: string) => `${tenantBase(tenantSlug)}/hrms/leave`,
    payroll: (tenantSlug?: string) => `${tenantBase(tenantSlug)}/hrms/payroll`,
    holidays: (tenantSlug?: string) => `${tenantBase(tenantSlug)}/hrms/holidays`
  },
  finance: {
    invoices: (tenantSlug?: string) => `${tenantBase(tenantSlug)}/finance/invoices`,
    payments: (tenantSlug?: string) => `${tenantBase(tenantSlug)}/finance/payments`,
    expenses: (tenantSlug?: string) => `${tenantBase(tenantSlug)}/finance/expenses`,
    bankAccounts: (tenantSlug?: string) => `${tenantBase(tenantSlug)}/finance/bank-accounts`
  },
  documents: (tenantSlug?: string) => `${tenantBase(tenantSlug)}/documents`,
  reports: (tenantSlug?: string) => `${tenantBase(tenantSlug)}/reports`,
  settings: (tenantSlug?: string) => `${tenantBase(tenantSlug)}/settings`,
  profile: (tenantSlug?: string) => `${tenantBase(tenantSlug)}/profile`,
  helpCenter: (tenantSlug?: string) => `${tenantBase(tenantSlug)}/help-center`
} as const;
