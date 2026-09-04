import type { ApiQuery, NormalizedApiResponse } from '@/lib/api/apiTypes';
import { platformClient } from '@/lib/api/platformClient';

export type OrganizationRecord = {
  id?: number; uuid?: string; name?: string; code?: string; description?: string;
  status?: string; level?: number | null; parent?: OrganizationRecord | null; parent_id?: number | null;
  platform_manager_user_id?: number | null; manager?: OrganizationRecord | null; users?: OrganizationRecord[]; teams?: OrganizationRecord[];
  users_count?: number; children_count?: number; teams_count?: number; [key: string]: unknown;
};
export type OrganizationListResult = { data: OrganizationRecord[]; total: number };
export type DepartmentPayload = { name: string; parent_uuid?: string | null; manager_platform_user_uuid?: string | null; status: string };
export type DesignationPayload = { name: string; description?: string; level?: number | null; status: string };

async function list(path: string, query?: ApiQuery): Promise<OrganizationListResult> {
  const response = await platformClient.get<OrganizationRecord[]>(path, { query });
  const data = Array.isArray(response.data) ? response.data : [];
  return { data, total: data.length };
}
function unwrap<T extends OrganizationRecord>(response: NormalizedApiResponse<T | { department?: T; designation?: T }>): T {
  const data = response.data;
  if (data && typeof data === 'object') {
    const wrapped = data as { department?: T; designation?: T };
    return wrapped.department ?? wrapped.designation ?? data as T;
  }
  return data as T;
}
export const platformOrganizationApi = {
  departments: {
    list: (query?: ApiQuery) => list('/platform-departments', query),
    detail: async (id: string) => unwrap(await platformClient.get<OrganizationRecord | { department?: OrganizationRecord }>(`/platform-departments/${encodeURIComponent(id)}`)),
    create: async (body: DepartmentPayload) => unwrap(await platformClient.post('/platform-departments', body)),
    update: async (id: string, body: Partial<DepartmentPayload>) => unwrap(await platformClient.patch(`/platform-departments/${encodeURIComponent(id)}`, body)),
    archive: (id: string) => platformClient.delete(`/platform-departments/${encodeURIComponent(id)}`)
  },
  designations: {
    list: (query?: ApiQuery) => list('/platform-designations', query),
    detail: async (id: string) => unwrap(await platformClient.get<OrganizationRecord | { designation?: OrganizationRecord }>(`/platform-designations/${encodeURIComponent(id)}`)),
    create: async (body: DesignationPayload) => unwrap(await platformClient.post('/platform-designations', body)),
    update: async (id: string, body: Partial<DesignationPayload>) => unwrap(await platformClient.patch(`/platform-designations/${encodeURIComponent(id)}`, body)),
    archive: (id: string) => platformClient.delete(`/platform-designations/${encodeURIComponent(id)}`)
  }
};