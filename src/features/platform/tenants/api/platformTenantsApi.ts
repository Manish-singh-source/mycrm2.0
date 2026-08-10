import type { ApiQuery } from '@/lib/api/apiTypes';
import { platformClient } from '@/lib/api/platformClient';

export type PlatformTenantRecord = {
  uuid?: string;
  id?: string | number;
  organization_name?: string;
  legal_name?: string;
  display_name?: string;
  organization_code?: string;
  slug?: string;
  business_type?: string;
  business_type_id?: string | number;
  industry?: string;
  industry_id?: string | number;
  company_size?: string;
  website?: string;
  description?: string;
  gst_number?: string;
  pan_number?: string;
  registration_number?: string;
  logo_url?: string | null;
  logo_file_id?: string | number | null;
  favicon_file_id?: string | number | null;
  default_currency?: string;
  default_timezone?: string;
  status?: string;
  tenant_status?: string;
  subscription_status?: string;
  current_plan?: string;
  plan_name?: string;
  plan_uuid?: string;
  trial_ends_at?: string | null;
  storage_used?: string | number;
  users_count?: string | number;
  owner?: PlatformTenantRecord;
  owner_name?: string;
  owner_email?: string;
  country?: string;
  country_id?: string | number;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
};

export type PlatformTenantListResult = {
  data: PlatformTenantRecord[];
  total: number;
};

export type TenantCreatePayload = {
  organization_name: string;
  legal_name?: string;
  display_name?: string;
  organization_code: string;
  slug: string;
  business_type_id?: string | number;
  industry_id?: string | number;
  company_size?: string;
  gst_number?: string;
  pan_number?: string;
  registration_number?: string;
  website?: string;
  description?: string;
  logo_file_id?: string | number | null;
  favicon_file_id?: string | number | null;
  default_currency?: string;
  default_timezone?: string;
  status?: string;
  plan_uuid?: string;
  trial_days?: number;
  owner?: Record<string, unknown>;
  office?: Record<string, unknown>;
  subscription?: Record<string, unknown>;
};

function paginationTotal(meta?: Record<string, unknown>, fallback = 0) {
  const pagination = meta?.pagination as { total?: number } | undefined;
  return Number(pagination?.total ?? meta?.total ?? fallback);
}

function unwrapTenant(data: unknown): PlatformTenantRecord {
  if (data && typeof data === 'object' && 'tenant' in data) {
    return (data as { tenant: PlatformTenantRecord }).tenant;
  }
  return data as PlatformTenantRecord;
}

function unwrapRows(data: unknown, key: string) {
  if (Array.isArray(data)) return data as PlatformTenantRecord[];
  if (data && typeof data === 'object' && key in data) {
    const rows = (data as Record<string, unknown>)[key];
    return Array.isArray(rows) ? (rows as PlatformTenantRecord[]) : [];
  }
  return [];
}

export const platformTenantsApi = {
  list: async (query?: ApiQuery): Promise<PlatformTenantListResult> => {
    const response = await platformClient.get<PlatformTenantRecord[]>('/tenants', { query });
    const rows = Array.isArray(response.data) ? response.data : [];
    return { data: rows, total: paginationTotal(response.meta, rows.length) };
  },
  detail: async (id: string) => {
    const response = await platformClient.get<PlatformTenantRecord | { tenant: PlatformTenantRecord }>(`/tenants/${encodeURIComponent(id)}`);
    return unwrapTenant(response.data);
  },
  create: async (body: TenantCreatePayload) => {
    const response = await platformClient.post<PlatformTenantRecord | { tenant: PlatformTenantRecord }, TenantCreatePayload>('/tenants', body);
    return unwrapTenant(response.data);
  },
  update: async (id: string, body: Partial<TenantCreatePayload>) => {
    const response = await platformClient.patch<PlatformTenantRecord | { tenant: PlatformTenantRecord }, Partial<TenantCreatePayload>>(`/tenants/${encodeURIComponent(id)}`, body);
    return unwrapTenant(response.data);
  },
  delete: (id: string, body: Record<string, unknown>) =>
    platformClient.delete(`/tenants/${encodeURIComponent(id)}`, { body }),
  restore: (id: string, body: Record<string, unknown>) =>
    platformClient.post(`/tenants/${encodeURIComponent(id)}/restore`, body),
  activate: (id: string, body: Record<string, unknown>) =>
    platformClient.post(`/tenants/${encodeURIComponent(id)}/activate`, body),
  suspend: (id: string, body: Record<string, unknown>) =>
    platformClient.post(`/tenants/${encodeURIComponent(id)}/suspend`, body),
  reactivate: (id: string, body: Record<string, unknown>) =>
    platformClient.post(`/tenants/${encodeURIComponent(id)}/reactivate`, body),
  archive: (id: string, body: Record<string, unknown>) =>
    platformClient.post(`/tenants/${encodeURIComponent(id)}/archive`, body),
  extendTrial: (id: string, body: { trial_ends_at: string; reason: string }) =>
    platformClient.post(`/tenants/${encodeURIComponent(id)}/extend-trial`, body),
  impersonate: (id: string, body: { reason: string; duration_minutes: number; target_user_uuid?: string }) =>
    platformClient.post(`/tenants/${encodeURIComponent(id)}/impersonate`, body, { impersonationReason: body.reason }),
  endImpersonation: (id: string, sessionId: string) =>
    platformClient.delete(`/tenants/${encodeURIComponent(id)}/impersonate/${encodeURIComponent(sessionId)}`),
  relation: async (id: string, relation: string, query?: ApiQuery) => {
    const response = await platformClient.get<unknown>(`/tenants/${encodeURIComponent(id)}/${relation}`, { query });
    return { data: unwrapRows(response.data, relation), raw: response.data };
  },
  updateModules: (id: string, body: { modules: Array<{ module_code: string; enabled: boolean; limits?: Record<string, unknown>; metadata?: Record<string, unknown> }> }) =>
    platformClient.put(`/tenants/${encodeURIComponent(id)}/modules`, body),
  export: (body: Record<string, unknown>) => platformClient.post('/tenants/export', body)
};
