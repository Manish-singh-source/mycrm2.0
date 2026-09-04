import type { ApiQuery, NormalizedApiResponse } from '@/lib/api/apiTypes';
import { platformClient } from '@/lib/api/platformClient';

export type PlatformRecord = {
  uuid?: string;
  id?: string;
  name?: string;
  code?: string;
  display_name?: string;
  description?: string;
  guard_name?: string;
  module?: string;
  is_system?: boolean;
  status?: string;
  permissions_count?: number;
  users_count?: number;
  roles_count?: number;
  members_count?: number;
  assigned_tenants_count?: number;
  assigned_tickets_count?: number;
  assigned_incidents_count?: number;
  assigned_alerts_count?: number;
  visibility?: string;
  created_at?: string;
  updated_at?: string;
  permissions?: GroupedPermissions;
  users?: PlatformRecord[];
  members?: PlatformRecord[];
  assignments?: PlatformRecord[];
  [key: string]: unknown;
};

export type PlatformListKpis = {
  total?: number;
  active?: number;
  inactive?: number;
  system?: number;
  custom?: number;
  assignments?: number;
  [key: string]: unknown;
};

export type PlatformListResult<TRecord extends PlatformRecord> = {
  data: TRecord[];
  total: number;
  kpis?: PlatformListKpis;
};

export type GroupedPermissions = Record<string, PlatformRecord[]>;

export type AccessExportPayload = {
  format: 'csv';
  delivery: 'job' | 'download';
  scope: 'filtered' | 'selected';
  filters?: Record<string, unknown>;
  sort?: string;
  direction?: 'asc' | 'desc';
  columns?: string[];
  selected_ids?: string[];
  timezone?: string;
  email_when_ready?: boolean;
};
export type RolePayload = {
  name: string;
  display_name: string;
  guard_name: string;
  description?: string;
  status: string;
  is_system?: boolean;
  permission_ids?: string[];
  audit_reason?: string;
};

export type PermissionPayload = {
  module: string;
  name: string;
  display_name: string;
  description?: string;
  guard_name: string;
  is_system?: boolean;
  status: string;
};

export type TeamPayload = {
  name: string;
  code?: string;
  parent_team_id?: string | null;
  description?: string;
  lead_platform_user_id?: string | null;
  assistant_lead_platform_user_id?: string | null;
  email?: string;
  phone?: string;
  color?: string;
  icon?: string;
  visibility: string;
  status: string;
  audit_reason?: string;
};

export type TeamRolePayload = {
  name: string;
  code?: string;
  description?: string;
  permissions?: string[] | Record<string, unknown>;
  sort_order?: number;
  is_system?: boolean;
  status: string;
  audit_reason?: string;
};

function paginationTotal(meta?: Record<string, unknown>, fallback = 0) {
  const pagination = meta?.pagination as { total?: number } | undefined;
  return Number(pagination?.total ?? meta?.total ?? fallback);
}

function unwrapRecord<TRecord extends PlatformRecord>(
  response: NormalizedApiResponse<TRecord | { role?: TRecord; permission?: TRecord; team?: TRecord; team_role?: TRecord }>
) {
  const data = response.data;
  if (data && typeof data === 'object') {
    const wrapped = data as { role?: TRecord; permission?: TRecord; team?: TRecord; team_role?: TRecord };
    return wrapped.role ?? wrapped.permission ?? wrapped.team ?? wrapped.team_role ?? (data as TRecord);
  }
  return data as TRecord;
}

type ListPayload<TRecord> =
  | TRecord[]
  | {
      data?: TRecord[];
      items?: TRecord[];
      permissions?: TRecord[];
      kpis?: PlatformListKpis;
    };

function listRows<TRecord extends PlatformRecord>(payload: ListPayload<TRecord> | undefined): TRecord[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.permissions)) return payload.permissions;
  return [];
}

async function list<TRecord extends PlatformRecord>(path: string, query?: ApiQuery): Promise<PlatformListResult<TRecord>> {
  const response = await platformClient.get<ListPayload<TRecord>>(path, { query });
  const rows = listRows(response.data);
  return {
    data: rows,
    total: paginationTotal(response.meta, rows.length),
    kpis: ((response.meta?.kpis ?? response.meta?.kpi) as PlatformListKpis | undefined) ??
      (!Array.isArray(response.data) && response.data ? response.data.kpis : undefined)
  };
}

async function detail<TRecord extends PlatformRecord>(path: string) {
  const response = await platformClient.get<TRecord | { role?: TRecord; permission?: TRecord; team?: TRecord; team_role?: TRecord }>(path);
  return unwrapRecord(response);
}

export const platformAccessApi = {
  roles: {
    list: (query?: ApiQuery) => list<PlatformRecord>('/roles', query),
    detail: (id: string) => detail<PlatformRecord>(`/roles/${encodeURIComponent(id)}`),
    create: async (body: RolePayload) => unwrapRecord(await platformClient.post('/roles', body)),
    update: async (id: string, body: Partial<RolePayload>) =>
      unwrapRecord(await platformClient.patch(`/roles/${encodeURIComponent(id)}`, body)),
    delete: (id: string, body: { audit_reason: string }) =>
      platformClient.delete(`/roles/${encodeURIComponent(id)}`, { body }),
    clone: (id: string, body: Record<string, unknown>) =>
      platformClient.post(`/roles/${encodeURIComponent(id)}/clone`, body),
    activate: (id: string, audit_reason: string) =>
      platformClient.post(`/roles/${encodeURIComponent(id)}/activate`, { audit_reason }),
    deactivate: (id: string, audit_reason: string) =>
      platformClient.post(`/roles/${encodeURIComponent(id)}/deactivate`, { audit_reason }),
    permissions: async (id: string): Promise<NormalizedApiResponse<{ permissions: GroupedPermissions }>> => {
      const response = await platformClient.get<GroupedPermissions | { permissions: GroupedPermissions }>(`/roles/${encodeURIComponent(id)}/permissions`);
      const groups = response.data && !Array.isArray(response.data)
        ? ('permissions' in response.data ? response.data.permissions : response.data) as GroupedPermissions
        : {};
      return { ...response, data: { permissions: groups ?? {} } };
    },
    replacePermissions: (id: string, body: { permission_ids: string[]; audit_reason: string }) =>
      platformClient.put(`/roles/${encodeURIComponent(id)}/permissions`, body),
    users: async (id: string): Promise<NormalizedApiResponse<{ users: PlatformRecord[] }>> => {
      const response = await platformClient.get<PlatformRecord[] | { users: PlatformRecord[] }>(`/roles/${encodeURIComponent(id)}/users`);
      const users = Array.isArray(response.data) ? response.data : response.data?.users ?? [];
      return { ...response, data: { users } };
    },
    assignUsers: (id: string, body: { platform_user_ids: string[]; audit_reason: string; effective_date?: string; notify_users?: boolean }) =>
      platformClient.post(`/roles/${encodeURIComponent(id)}/users`, body),
    removeUser: (id: string, userId: string, audit_reason: string) =>
      platformClient.delete(`/roles/${encodeURIComponent(id)}/users/${encodeURIComponent(userId)}`, {
        body: { audit_reason }
      }),
    export: (body: AccessExportPayload) => platformClient.post('/roles/export', body)
  },
  permissions: {
    list: (query?: ApiQuery) => list<PlatformRecord>('/permissions', query),
    grouped: async (): Promise<NormalizedApiResponse<{ permissions: GroupedPermissions }>> => {
      const response = await platformClient.get<GroupedPermissions | { permissions: GroupedPermissions }>('/permissions/grouped');
      const groups: GroupedPermissions = response.data && !Array.isArray(response.data)
        ? ('permissions' in response.data ? response.data.permissions : response.data) as GroupedPermissions
        : {}; 
      return { ...response, data: { permissions: groups ?? {} } }; 
    },
    detail: (id: string) => detail<PlatformRecord>('/permissions/' + encodeURIComponent(id)),
    create: async (body: PermissionPayload) => unwrapRecord(await platformClient.post('/permissions', body)),
    update: async (id: string, body: Partial<PermissionPayload>) =>
      unwrapRecord(await platformClient.patch('/permissions/' + encodeURIComponent(id), body)),
    delete: (id: string) => platformClient.delete('/permissions/' + encodeURIComponent(id)),
    export: async (body: AccessExportPayload) => {
      const response = body.delivery === 'download'
        ? await platformClient.post<Blob>('/permissions/export', body, { responseType: 'blob' })
        : await platformClient.post('/permissions/export', body);
      if (body.delivery === 'download' && response.data instanceof Blob && typeof document !== 'undefined') {
        const url = URL.createObjectURL(response.data);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'platform-permissions.csv';
        link.click();
        URL.revokeObjectURL(url);
      }
      return response;
    }
  },
  teams: {
    list: (query?: ApiQuery) => list<PlatformRecord>('/platform-teams', query),
    detail: (id: string) => detail<PlatformRecord>(`/platform-teams/${encodeURIComponent(id)}`),
    create: async (body: TeamPayload) => unwrapRecord(await platformClient.post('/platform-teams', body)),
    update: async (id: string, body: Partial<TeamPayload>) =>
      unwrapRecord(await platformClient.patch(`/platform-teams/${encodeURIComponent(id)}`, body)),
    delete: (id: string, body: { audit_reason: string }) =>
      platformClient.delete(`/platform-teams/${encodeURIComponent(id)}`, { body }),
    members: (id: string) => platformClient.get<{ members: PlatformRecord[] }>(`/platform-teams/${encodeURIComponent(id)}/members`),
    addMembers: (id: string, body: Record<string, unknown>) => platformClient.post(`/platform-teams/${encodeURIComponent(id)}/members`, body),
    updateMember: (id: string, memberId: string, body: Record<string, unknown>) =>
      platformClient.patch(`/platform-teams/${encodeURIComponent(id)}/members/${encodeURIComponent(memberId)}`, body),
    removeMember: (id: string, memberId: string, body: Record<string, unknown>) =>
      platformClient.delete(`/platform-teams/${encodeURIComponent(id)}/members/${encodeURIComponent(memberId)}`, { body }),
    assignments: (id: string) =>
      platformClient.get<{ assignments: PlatformRecord[] }>(`/platform-teams/${encodeURIComponent(id)}/assignments`),
    assignRecord: (id: string, body: Record<string, unknown>) =>
      platformClient.post(`/platform-teams/${encodeURIComponent(id)}/assignments`, body),
    releaseAssignment: (id: string, assignmentId: string, body: Record<string, unknown>) =>
      platformClient.delete(`/platform-teams/${encodeURIComponent(id)}/assignments/${encodeURIComponent(assignmentId)}`, { body })
  },
  audit: {
    list: (query?: ApiQuery) => list<PlatformRecord>('/audit/activity-logs', query),
    export: (body: AccessExportPayload) => platformClient.post('/audit/export', body)
  },
  teamRoles: {
    list: (query?: ApiQuery) => list<PlatformRecord>('/platform-team-roles', query),
    detail: (id: string) => detail<PlatformRecord>(`/platform-team-roles/${encodeURIComponent(id)}`),
    create: async (body: TeamRolePayload) => unwrapRecord(await platformClient.post('/platform-team-roles', body)),
    update: async (id: string, body: Partial<TeamRolePayload>) =>
      unwrapRecord(await platformClient.patch(`/platform-team-roles/${encodeURIComponent(id)}`, body)),
    delete: (id: string, body: { audit_reason: string }) =>
      platformClient.delete(`/platform-team-roles/${encodeURIComponent(id)}`, { body })
  }
};
