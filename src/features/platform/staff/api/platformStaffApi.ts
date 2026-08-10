import type { ApiQuery } from '@/lib/api/apiTypes';
import { platformClient } from '@/lib/api/platformClient';

export type PlatformStaffRecord = {
  uuid?: string;
  id?: string;
  employee_code?: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  email?: string;
  mobile?: string;
  profile_photo_url?: string | null;
  profile_photo_file_id?: string | null;
  designation?: string;
  department?: string;
  timezone?: string;
  locale?: string;
  two_factor_enabled?: boolean;
  email_verified_at?: string | null;
  status?: string;
  roles?: Array<{ uuid?: string; name?: string; display_name?: string } | string>;
  teams?: Array<{ uuid?: string; name?: string; code?: string } | string>;
  permissions?: Record<string, PlatformStaffRecord[]> | string[];
  last_login_at?: string | null;
  last_login_ip?: string | null;
  created_at?: string;
  updated_at?: string;
  assignments?: PlatformStaffRecord[];
  activity?: PlatformStaffRecord[];
  [key: string]: unknown;
};

export type PlatformStaffListResult = {
  data: PlatformStaffRecord[];
  total: number;
};

export type PlatformStaffPayload = {
  employee_code?: string;
  first_name: string;
  last_name: string;
  display_name: string;
  email: string;
  mobile?: string;
  password?: string;
  profile_photo_file_id?: string | null;
  designation?: string;
  department?: string;
  timezone: string;
  locale: string;
  two_factor_enabled?: boolean;
  status: string;
  role_ids?: string[];
  team_ids?: string[];
};

function paginationTotal(meta?: Record<string, unknown>, fallback = 0) {
  const pagination = meta?.pagination as { total?: number } | undefined;
  return Number(pagination?.total ?? meta?.total ?? fallback);
}

function unwrapUser(data: unknown): PlatformStaffRecord {
  if (data && typeof data === 'object' && 'user' in data) {
    return (data as { user: PlatformStaffRecord }).user;
  }
  return data as PlatformStaffRecord;
}

export const platformStaffApi = {
  list: async (query?: ApiQuery): Promise<PlatformStaffListResult> => {
    const response = await platformClient.get<PlatformStaffRecord[]>('/platform-users', { query });
    return {
      data: Array.isArray(response.data) ? response.data : [],
      total: paginationTotal(response.meta, Array.isArray(response.data) ? response.data.length : 0)
    };
  },
  detail: async (id: string) => {
    const response = await platformClient.get<PlatformStaffRecord | { user: PlatformStaffRecord }>(`/platform-users/${encodeURIComponent(id)}`);
    return unwrapUser(response.data);
  },
  create: async (body: PlatformStaffPayload) => {
    const response = await platformClient.post<PlatformStaffRecord | { user: PlatformStaffRecord }, PlatformStaffPayload>('/platform-users', body);
    return unwrapUser(response.data);
  },
  update: async (id: string, body: Partial<PlatformStaffPayload>) => {
    const response = await platformClient.patch<PlatformStaffRecord | { user: PlatformStaffRecord }, Partial<PlatformStaffPayload>>(`/platform-users/${encodeURIComponent(id)}`, body);
    return unwrapUser(response.data);
  },
  delete: (id: string, body: { audit_reason: string }) =>
    platformClient.delete(`/platform-users/${encodeURIComponent(id)}`, { body }),
  restore: (id: string, body: { audit_reason: string }) =>
    platformClient.post(`/platform-users/${encodeURIComponent(id)}/restore`, body),
  suspend: (id: string, body: Record<string, unknown>) =>
    platformClient.post(`/platform-users/${encodeURIComponent(id)}/suspend`, body),
  activate: (id: string, body: Record<string, unknown>) =>
    platformClient.post(`/platform-users/${encodeURIComponent(id)}/activate`, body),
  resetPassword: (id: string, body: Record<string, unknown>) =>
    platformClient.post(`/platform-users/${encodeURIComponent(id)}/reset-password`, body),
  forceLogout: (id: string, body: Record<string, unknown>) =>
    platformClient.post(`/platform-users/${encodeURIComponent(id)}/force-logout`, body),
  requireTwoFactor: (id: string, body: Record<string, unknown>) =>
    platformClient.post(`/platform-users/${encodeURIComponent(id)}/require-2fa`, body),
  roles: (id: string) =>
    platformClient.get<{ roles: PlatformStaffRecord[] }>(`/platform-users/${encodeURIComponent(id)}/roles`),
  replaceRoles: (id: string, body: { role_ids: string[]; audit_reason: string }) =>
    platformClient.put(`/platform-users/${encodeURIComponent(id)}/roles`, body),
  permissions: (id: string) =>
    platformClient.get<{ permissions: Record<string, PlatformStaffRecord[]> }>(`/platform-users/${encodeURIComponent(id)}/permissions`),
  replacePermissions: (id: string, body: { permission_ids: string[]; audit_reason: string }) =>
    platformClient.put(`/platform-users/${encodeURIComponent(id)}/permissions`, body),
  activity: (id: string) =>
    platformClient.get<{ activity: PlatformStaffRecord[] }>(`/platform-users/${encodeURIComponent(id)}/activity`),
  invite: (body: Record<string, unknown>) => platformClient.post('/platform-users/invite', body),
  export: (body: Record<string, unknown>) => platformClient.post('/platform-users/export', body)
};
