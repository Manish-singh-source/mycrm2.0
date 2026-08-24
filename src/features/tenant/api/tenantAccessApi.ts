import { authStore } from '@/features/auth/store/authStore';
import type { ApiQuery, NormalizedApiResponse } from '@/lib/api/apiTypes';
import { createTenantClient } from '@/lib/api/tenantClient';

export type TenantAccessRecord = {
  id?: string | number;
  uuid?: string;
  name?: string;
  code?: string;
  display_name?: string;
  email?: string;
  status?: string;
  [key: string]: unknown;
};

export type TenantAccessListResult = {
  data: TenantAccessRecord[];
  total: number;
  meta?: Record<string, unknown>;
};

export type GroupedPermissions = Record<string, TenantAccessRecord[]>;

function client() {
  const tenant = authStore.getSnapshot().tenant.tenant;
  if (!tenant) throw new Error('Tenant context is required.');
  return createTenantClient(tenant.slug || tenant.uuid);
}

function paginationTotal(meta?: Record<string, unknown>, fallback = 0) {
  const pagination = meta?.pagination as { total?: number } | undefined;
  return Number(pagination?.total ?? meta?.total ?? fallback);
}

function arrayFrom(data: unknown, keys: string[] = []): TenantAccessRecord[] {
  if (Array.isArray(data)) return data as TenantAccessRecord[];
  if (!data || typeof data !== 'object') return [];
  const payload = data as Record<string, unknown>;
  for (const key of keys) {
    if (Array.isArray(payload[key])) return payload[key] as TenantAccessRecord[];
  }
  for (const value of Object.values(payload)) {
    if (Array.isArray(value)) return value as TenantAccessRecord[];
  }
  return [];
}

function unwrap(data: unknown, keys: string[]) {
  if (!data || typeof data !== 'object') return data as TenantAccessRecord;
  const payload = data as Record<string, unknown>;
  for (const key of keys) {
    if (payload[key] && typeof payload[key] === 'object') return payload[key] as TenantAccessRecord;
  }
  return data as TenantAccessRecord;
}

async function list(path: string, query?: ApiQuery, keys?: string[]): Promise<TenantAccessListResult> {
  const response = await client().get<TenantAccessRecord[] | Record<string, unknown>>(path, { query });
  const data = arrayFrom(response.data, keys);
  return { data, total: paginationTotal(response.meta, data.length), meta: response.meta };
}

async function detail(path: string, keys: string[]) {
  const response = await client().get<TenantAccessRecord | Record<string, unknown>>(path);
  return unwrap(response.data, keys);
}

export const tenantAccessApi = {
  roles: {
    list: (query?: ApiQuery) => list('/access-control/roles', query, ['roles']),
    detail: (id: string) => detail(`/access-control/roles/${encodeURIComponent(id)}`, ['role']),
    create: async (body: Record<string, unknown>) => unwrap((await client().post('/access-control/roles', body)).data, ['role']),
    update: async (id: string, body: Record<string, unknown>) =>
      unwrap((await client().patch(`/access-control/roles/${encodeURIComponent(id)}`, body)).data, ['role']),
    delete: (id: string, body: Record<string, unknown>) =>
      client().delete(`/access-control/roles/${encodeURIComponent(id)}`, { body }),
    bulkDelete: (role_uuids: string[], audit_reason?: string) =>
      client().delete('/access-control/roles/bulk', { body: { role_uuids, audit_reason } }),
    clone: (id: string, body: Record<string, unknown>) =>
      client().post(`/access-control/roles/${encodeURIComponent(id)}/clone`, body),
    activate: (id: string, audit_reason: string) =>
      client().post(`/access-control/roles/${encodeURIComponent(id)}/activate`, { audit_reason }),
    deactivate: (id: string, audit_reason: string) =>
      client().post(`/access-control/roles/${encodeURIComponent(id)}/deactivate`, { audit_reason }),
    permissions: (id: string) =>
      client().get<{ permissions: GroupedPermissions }>(`/access-control/roles/${encodeURIComponent(id)}/permissions`),
    replacePermissions: (id: string, body: { permission_ids: string[]; audit_reason?: string }) =>
      client().put(`/access-control/roles/${encodeURIComponent(id)}/permissions`, body),
    users: (id: string) => client().get<{ users: TenantAccessRecord[] }>(`/access-control/roles/${encodeURIComponent(id)}/users`),
    assignUsers: (id: string, body: { user_ids: string[]; audit_reason?: string }) =>
      client().post(`/access-control/roles/${encodeURIComponent(id)}/users`, body),
    replaceUsers: (id: string, body: { user_ids: string[]; audit_reason?: string }) =>
      client().put(`/access-control/roles/${encodeURIComponent(id)}/users`, body),
    removeUser: (id: string, userId: string, audit_reason?: string) =>
      client().delete(`/access-control/roles/${encodeURIComponent(id)}/users/${encodeURIComponent(userId)}`, {
        body: { audit_reason }
      })
  },
  permissions: {
    list: (query?: ApiQuery) => list('/access-control/permissions', query, ['permissions']),
    grouped: () => client().get<{ permissions: GroupedPermissions }>('/access-control/permissions/grouped'),
    detail: (id: string) => detail(`/access-control/permissions/${encodeURIComponent(id)}`, ['permission'])
  },
  teams: {
    list: (query?: ApiQuery) => list('/teams', query, ['teams']),
    detail: (id: string) => detail(`/teams/${encodeURIComponent(id)}`, ['team']),
    create: async (body: Record<string, unknown>) => unwrap((await client().post('/teams', body)).data, ['team']),
    update: async (id: string, body: Record<string, unknown>) =>
      unwrap((await client().patch(`/teams/${encodeURIComponent(id)}`, body)).data, ['team']),
    delete: (id: string) => client().delete(`/teams/${encodeURIComponent(id)}`),
    bulkDelete: (team_uuids: string[], audit_reason?: string) =>
      client().delete('/teams/bulk', { body: { team_uuids, audit_reason } }),
    members: (id: string) => client().get<{ members: TenantAccessRecord[] }>(`/teams/${encodeURIComponent(id)}/members`),
    addMembers: (id: string, body: Record<string, unknown>) => client().post(`/teams/${encodeURIComponent(id)}/members`, body),
    removeMember: (id: string, memberId: string, body?: Record<string, unknown>) =>
      client().delete(`/teams/${encodeURIComponent(id)}/members/${encodeURIComponent(memberId)}`, { body }),
    permissions: (id: string) => client().get<{ permissions: GroupedPermissions }>(`/teams/${encodeURIComponent(id)}/permissions`),
    replacePermissions: (id: string, body: { permission_ids: string[] }) =>
      client().put(`/teams/${encodeURIComponent(id)}/permissions`, body),
    settings: (id: string) => client().get<{ settings: TenantAccessRecord[] }>(`/teams/${encodeURIComponent(id)}/settings`),
    updateSettings: (id: string, body: Record<string, unknown>) => client().put(`/teams/${encodeURIComponent(id)}/settings`, body),
    assignments: (id: string) => client().get<{ assignments: TenantAccessRecord[] }>(`/teams/${encodeURIComponent(id)}/assignments`),
    projects: (id: string) => client().get<{ projects: TenantAccessRecord[] }>(`/teams/${encodeURIComponent(id)}/projects`),
    tasks: (id: string) => client().get<{ tasks: TenantAccessRecord[] }>(`/teams/${encodeURIComponent(id)}/tasks`),
    activity: (id: string) => client().get<{ activity: TenantAccessRecord[] }>(`/teams/${encodeURIComponent(id)}/activity`),
    assignRecord: (id: string, body: Record<string, unknown>) => client().post(`/teams/${encodeURIComponent(id)}/assignments`, body),
    releaseAssignment: (id: string, assignmentId: string | number) =>
      client().delete(`/teams/${encodeURIComponent(id)}/assignments/${encodeURIComponent(String(assignmentId))}`),
    export: (body: Record<string, unknown>) => client().post('/teams/export', body)
  },
  teamRoles: {
    list: (query?: ApiQuery) => list('/team-roles', query, ['team_roles']),
    create: (body: Record<string, unknown>) => client().post('/team-roles', body),
    update: (id: string, body: Record<string, unknown>) => client().patch(`/team-roles/${encodeURIComponent(id)}`, body),
    delete: (id: string) => client().delete(`/team-roles/${encodeURIComponent(id)}`)
  },
  users: {
    list: (query?: ApiQuery) => list('/users', query, ['users']),
    detail: (id: string) => client().get<{ user: TenantAccessRecord; roles: TenantAccessRecord[] }>(`/users/${encodeURIComponent(id)}`),
    invite: (body: Record<string, unknown>) => client().post('/users/invite', body),
    update: (id: string, body: Record<string, unknown>) => client().patch(`/users/${encodeURIComponent(id)}`, body),
    replaceRoles: (id: string, role_ids: string[]) => client().put(`/users/${encodeURIComponent(id)}/roles`, { role_ids }),
    suspend: (id: string) => client().post(`/users/${encodeURIComponent(id)}/suspend`),
    activate: (id: string) => client().post(`/users/${encodeURIComponent(id)}/activate`),
    resetPassword: (id: string) => client().post<{ temporary_password?: string }>(`/users/${encodeURIComponent(id)}/reset-password`),
    forceLogout: (id: string) => client().post(`/users/${encodeURIComponent(id)}/force-logout`),
    requireTwoFactor: (id: string, required = true) => client().post(`/users/${encodeURIComponent(id)}/require-2fa`, { required })
  },
  staff: {
    dashboard: () => client().get<Record<string, unknown>>('/staff/dashboard'),
    list: (query?: ApiQuery) => list('/staff', query, ['staff']),
    grid: (query?: ApiQuery) => list('/staff/grid', query, ['staff']),
    detail: (id: string) => detail(`/staff/${encodeURIComponent(id)}`, ['staff']),
    create: async (body: Record<string, unknown>) => unwrap((await client().post('/staff', body)).data, ['staff']),
    update: async (id: string, body: Record<string, unknown>) =>
      unwrap((await client().patch(`/staff/${encodeURIComponent(id)}`, body)).data, ['staff']),
    delete: (id: string) => client().delete(`/staff/${encodeURIComponent(id)}`),
    bulkDelete: (ids: string[], audit_reason?: string) => client().delete('/staff/bulk', { body: { ids, audit_reason } }),
    restore: (id: string) => client().post(`/staff/${encodeURIComponent(id)}/restore`),
    import: (body: Record<string, unknown>) => client().post('/staff/import', body),
    export: (body: Record<string, unknown>) => client().post('/staff/export', body),
    activity: (id: string) => client().get<{ activities: TenantAccessRecord[] }>(`/staff/${encodeURIComponent(id)}/activity`),
    roles: (id: string) => client().get<{ roles: TenantAccessRecord[] }>(`/staff/${encodeURIComponent(id)}/roles`),
    replaceRoles: (id: string, role_ids: string[]) => client().put(`/staff/${encodeURIComponent(id)}/roles`, { role_ids }),
    teams: (id: string) => client().get<{ teams: TenantAccessRecord[] }>(`/staff/${encodeURIComponent(id)}/teams`),
    replaceTeams: (id: string, team_ids: string[]) => client().put(`/staff/${encodeURIComponent(id)}/teams`, { team_ids }),
    projects: (id: string) => client().get<{ projects: TenantAccessRecord[] }>(`/staff/${encodeURIComponent(id)}/projects`),
    replaceProjects: (id: string, project_ids: string[]) => client().put(`/staff/${encodeURIComponent(id)}/projects`, { project_ids }),
    tasks: (id: string) => client().get<{ tasks: TenantAccessRecord[] }>(`/staff/${encodeURIComponent(id)}/tasks`),
    replaceTasks: (id: string, task_ids: string[]) => client().put(`/staff/${encodeURIComponent(id)}/tasks`, { task_ids }),
    tab: (id: string, tab: string) =>
      client().get<{ tab: string; data: TenantAccessRecord[] | Record<string, unknown> }>(
        `/staff/${encodeURIComponent(id)}/tabs/${encodeURIComponent(tab)}`
      ),
    childList: (id: string, resource: string) =>
      client().get<Record<string, TenantAccessRecord[]>>(`/staff/${encodeURIComponent(id)}/${resource}`),
    childCreate: (id: string, resource: string, body: Record<string, unknown>) =>
      client().post(`/staff/${encodeURIComponent(id)}/${resource}`, body),
    childUpdate: (id: string, resource: string, childId: string | number, body: Record<string, unknown>) =>
      client().patch(`/staff/${encodeURIComponent(id)}/${resource}/${encodeURIComponent(String(childId))}`, body),
    childDelete: (id: string, resource: string, childId: string | number) =>
      client().delete(`/staff/${encodeURIComponent(id)}/${resource}/${encodeURIComponent(String(childId))}`)
  },
  files: {
    list: (query?: ApiQuery) => list('/files', query, ['files'])
  }
};

export type TenantAccessResponse<T> = NormalizedApiResponse<T>;


