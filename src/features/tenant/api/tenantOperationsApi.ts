import { authStore } from '@/features/auth/store/authStore';
import type { ApiQuery } from '@/lib/api/apiTypes';
import { createTenantClient } from '@/lib/api/tenantClient';

export type OperationsRecord = {
  id?: string | number;
  uuid?: string;
  name?: string;
  title?: string;
  display_name?: string;
  status?: string;
  [key: string]: unknown;
};

export type OperationsListResult = {
  data: OperationsRecord[];
  total: number;
  meta?: Record<string, unknown>;
};

function client() {
  const tenant = authStore.getSnapshot().tenant.tenant;
  if (!tenant) throw new Error('Tenant context is required.');
  return createTenantClient(tenant.slug || tenant.uuid);
}

function total(meta?: Record<string, unknown>, fallback = 0) {
  const pagination = meta?.pagination as { total?: number } | undefined;
  return Number(pagination?.total ?? meta?.total ?? fallback);
}

function arrayFrom(data: unknown, keys: string[] = []): OperationsRecord[] {
  if (Array.isArray(data)) return data as OperationsRecord[];
  if (!data || typeof data !== 'object') return [];
  const payload = data as Record<string, unknown>;
  for (const key of keys) {
    if (Array.isArray(payload[key])) return payload[key] as OperationsRecord[];
  }
  for (const value of Object.values(payload)) {
    if (Array.isArray(value)) return value as OperationsRecord[];
  }
  return [];
}

async function list(path: string, query?: ApiQuery, keys?: string[]): Promise<OperationsListResult> {
  const response = await client().get<OperationsRecord[] | Record<string, unknown>>(path, { query });
  const data = arrayFrom(response.data, keys);
  return { data, total: total(response.meta, data.length), meta: response.meta };
}

async function detail(path: string) {
  const response = await client().get<OperationsRecord | Record<string, unknown>>(path);
  return response.data as OperationsRecord;
}

function crud(base: string) {
  return {
    list: (query?: ApiQuery) => list(base, query, [base.replace('/', '').replace('-', '_')]),
    detail: (id: string) => detail(`${base}/${encodeURIComponent(id)}`),
    create: (body: Record<string, unknown>) => client().post(base, body),
    update: (id: string, body: Record<string, unknown>) => client().patch(`${base}/${encodeURIComponent(id)}`, body),
    delete: (id: string, body?: Record<string, unknown>) => client().delete(`${base}/${encodeURIComponent(id)}`, { body })
  };
}

export const tenantOperationsApi = {
  projects: {
    ...crud('/projects'),
    dashboard: () => client().get<{ dashboard: Record<string, unknown> }>('/projects/dashboard'),
    kanban: () => client().get<{ kanban: Record<string, { total: number; rows: OperationsRecord[] }> }>('/projects/kanban'),
    gantt: () => client().get<{ gantt: Record<string, unknown> }>('/projects/gantt'),
    calendar: () => client().get<{ projects: OperationsRecord[] }>('/projects/calendar'),
    archive: (id: string, body?: Record<string, unknown>) => client().post(`/projects/${encodeURIComponent(id)}/archive`, body),
    export: (body: Record<string, unknown>) => client().post('/projects/export', body),
    children: (id: string, resource: string) => client().get<Record<string, OperationsRecord[]>>(`/projects/${encodeURIComponent(id)}/${resource}`),
    childCreate: (id: string, resource: string, body: Record<string, unknown>) => client().post(`/projects/${encodeURIComponent(id)}/${resource}`, body),
    childUpdate: (id: string, resource: string, childId: string | number, body: Record<string, unknown>) =>
      client().patch(`/projects/${encodeURIComponent(id)}/${resource}/${encodeURIComponent(String(childId))}`, body),
    childDelete: (id: string, resource: string, childId: string | number) =>
      client().delete(`/projects/${encodeURIComponent(id)}/${resource}/${encodeURIComponent(String(childId))}`),
    completeMilestone: (id: string, milestoneId: string | number) =>
      client().post(`/projects/${encodeURIComponent(id)}/milestones/${encodeURIComponent(String(milestoneId))}/complete`),
    tasks: (id: string) => client().get<{ tasks: OperationsRecord[] }>(`/projects/${encodeURIComponent(id)}/tasks`),
    createTask: (id: string, body: Record<string, unknown>) => client().post(`/projects/${encodeURIComponent(id)}/tasks`, body)
  },
  tasks: {
    ...crud('/tasks'),
    dashboard: () => client().get<{ dashboard: Record<string, unknown> }>('/tasks/dashboard'),
    kanban: () => client().get<{ kanban: Record<string, { total: number; rows: OperationsRecord[] }> }>('/tasks/kanban'),
    calendar: () => client().get<{ tasks: OperationsRecord[] }>('/tasks/calendar'),
    my: (query?: ApiQuery) => list('/tasks/my', query, ['tasks']),
    team: (query?: ApiQuery) => list('/tasks/team', query, ['tasks']),
    assign: (id: string, body: Record<string, unknown>) => client().post(`/tasks/${encodeURIComponent(id)}/assign`, body),
    status: (id: string, body: Record<string, unknown>) => client().post(`/tasks/${encodeURIComponent(id)}/status`, body),
    complete: (id: string) => client().post(`/tasks/${encodeURIComponent(id)}/complete`),
    clone: (id: string, body: Record<string, unknown>) => client().post(`/tasks/${encodeURIComponent(id)}/clone`, body),
    bulkUpdate: (body: Record<string, unknown>) => client().post('/tasks/bulk/update', body),
    export: (body: Record<string, unknown>) => client().post('/tasks/export', body),
    children: (id: string, resource: string) => client().get<Record<string, OperationsRecord[]>>(`/tasks/${encodeURIComponent(id)}/${resource}`),
    childCreate: (id: string, resource: string, body: Record<string, unknown>) => client().post(`/tasks/${encodeURIComponent(id)}/${resource}`, body),
    childUpdate: (id: string, resource: string, childId: string | number, body: Record<string, unknown>) =>
      client().patch(`/tasks/${encodeURIComponent(id)}/${resource}/${encodeURIComponent(String(childId))}`, body),
    childDelete: (id: string, resource: string, childId: string | number) =>
      client().delete(`/tasks/${encodeURIComponent(id)}/${resource}/${encodeURIComponent(String(childId))}`),
    addChecklistItem: (id: string, checklistId: string | number, body: Record<string, unknown>) =>
      client().post(`/tasks/${encodeURIComponent(id)}/checklists/${encodeURIComponent(String(checklistId))}/items`, body),
    completeChecklistItem: (id: string, itemId: string | number) =>
      client().post(`/tasks/${encodeURIComponent(id)}/checklist-items/${encodeURIComponent(String(itemId))}/complete`),
    removeWatcher: (id: string, userId: string) => client().delete(`/tasks/${encodeURIComponent(id)}/watchers/${encodeURIComponent(userId)}`)
  },
  todo: {
    ...crud('/todo-lists'),
    dashboard: () => client().get<{ dashboard: Record<string, unknown> }>('/todo-lists/dashboard'),
    kanban: () => client().get<{ kanban: Record<string, { total: number; rows: OperationsRecord[] }> }>('/todo-lists/kanban'),
    calendar: () => client().get<{ tasks: OperationsRecord[] }>('/todo-lists/calendar'),
    tasks: (id: string) => client().get<{ tasks: OperationsRecord[] }>(`/todo-lists/${encodeURIComponent(id)}/tasks`),
    export: (body: Record<string, unknown>) => client().post('/todo-lists/export', body)
  },
  issues: {
    ...crud('/issues'),
    dashboard: () => client().get<{ dashboard: Record<string, unknown> }>('/issues/dashboard'),
    kanban: () => client().get<{ kanban: Record<string, { total: number; rows: OperationsRecord[] }> }>('/issues/kanban'),
    assign: (id: string, body: Record<string, unknown>) => client().post(`/issues/${encodeURIComponent(id)}/assign`, body),
    status: (id: string, body: Record<string, unknown>) => client().post(`/issues/${encodeURIComponent(id)}/status`, body),
    resolve: (id: string) => client().post(`/issues/${encodeURIComponent(id)}/resolve`),
    close: (id: string) => client().post(`/issues/${encodeURIComponent(id)}/close`),
    reopen: (id: string) => client().post(`/issues/${encodeURIComponent(id)}/reopen`),
    timeLogs: (id: string) => client().get<{ time_logs: OperationsRecord[] }>(`/issues/${encodeURIComponent(id)}/time-logs`),
    logTime: (id: string, body: Record<string, unknown>) => client().post(`/issues/${encodeURIComponent(id)}/time-logs`, body),
    createTask: (id: string, body: Record<string, unknown>) => client().post(`/issues/${encodeURIComponent(id)}/create-task`, body),
    activity: (id: string) => client().get<{ activity: OperationsRecord[] }>(`/issues/${encodeURIComponent(id)}/activity`),
    export: (body: Record<string, unknown>) => client().post('/issues/export', body)
  },
  renewals: {
    ...crud('/renewals'),
    dashboard: () => client().get<{ dashboard: Record<string, unknown> }>('/renewals/dashboard'),
    calendar: () => client().get<{ renewals: OperationsRecord[] }>('/renewals/calendar'),
    client: (query?: ApiQuery) => list('/client-renewals', query, ['renewals']),
    vendor: (query?: ApiQuery) => list('/vendor-renewals', query, ['renewals']),
    renew: (id: string, body: Record<string, unknown>) => client().post(`/renewals/${encodeURIComponent(id)}/renew`, body),
    cancel: (id: string, body: Record<string, unknown>) => client().post(`/renewals/${encodeURIComponent(id)}/cancel`, body),
    children: (id: string, resource: string) => client().get<Record<string, OperationsRecord[]>>(`/renewals/${encodeURIComponent(id)}/${resource}`),
    childCreate: (id: string, resource: string, body: Record<string, unknown>) => client().post(`/renewals/${encodeURIComponent(id)}/${resource}`, body),
    childUpdate: (id: string, resource: string, childId: string | number, body: Record<string, unknown>) =>
      client().patch(`/renewals/${encodeURIComponent(id)}/${resource}/${encodeURIComponent(String(childId))}`, body),
    sendReminder: (id: string, body: Record<string, unknown>) => client().post(`/renewals/${encodeURIComponent(id)}/send-reminder`, body),
    export: (body: Record<string, unknown>) => client().post('/renewals/export', body)
  },
  calendar: {
    calendars: {
      ...crud('/calendars')
    },
    events: {
      ...crud('/calendar-events'),
      list: (query?: ApiQuery) => list('/calendar-events', query, ['events', 'calendar_events']),
      reschedule: (id: string, body: Record<string, unknown>) => client().post(`/calendar-events/${encodeURIComponent(id)}/reschedule`, body),
      children: (id: string, resource: string) => client().get<Record<string, OperationsRecord[]>>(`/calendar-events/${encodeURIComponent(id)}/${resource}`),
      childCreate: (id: string, resource: string, body: Record<string, unknown>) => client().post(`/calendar-events/${encodeURIComponent(id)}/${resource}`, body),
      attendeeUpdate: (id: string, attendeeId: string | number, body: Record<string, unknown>) =>
        client().patch(`/calendar-events/${encodeURIComponent(id)}/attendees/${encodeURIComponent(String(attendeeId))}`, body),
      videoMeeting: (id: string, body: Record<string, unknown>) => client().post(`/calendar-events/${encodeURIComponent(id)}/video-meeting`, body),
      roomBooking: (id: string, body: Record<string, unknown>) => client().post(`/calendar-events/${encodeURIComponent(id)}/room-booking`, body)
    },
    rooms: {
      list: () => client().get<{ meeting_rooms: OperationsRecord[] }>('/meeting-rooms'),
      create: (body: Record<string, unknown>) => client().post('/meeting-rooms', body),
      update: (id: string | number, body: Record<string, unknown>) => client().patch(`/meeting-rooms/${encodeURIComponent(String(id))}`, body)
    }
  },
  lookups: (query?: ApiQuery) => list('/lookups', query, ['lookups'])
};
