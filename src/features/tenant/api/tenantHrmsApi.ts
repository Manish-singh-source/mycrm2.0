import { authStore } from '@/features/auth/store/authStore';
import type { ApiQuery } from '@/lib/api/apiTypes';
import { createTenantClient } from '@/lib/api/tenantClient';

export type HrmsRecord = {
  id?: string | number;
  uuid?: string;
  name?: string;
  display_name?: string;
  staff_name?: string;
  employee_code?: string;
  status?: string;
  [key: string]: unknown;
};

export type HrmsListResult = {
  data: HrmsRecord[];
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

function arrayFrom(data: unknown, keys: string[] = []): HrmsRecord[] {
  if (Array.isArray(data)) return data as HrmsRecord[];
  if (!data || typeof data !== 'object') return [];
  const payload = data as Record<string, unknown>;
  for (const key of keys) {
    if (Array.isArray(payload[key])) return payload[key] as HrmsRecord[];
  }
  for (const value of Object.values(payload)) {
    if (Array.isArray(value)) return value as HrmsRecord[];
  }
  return [];
}

async function list(path: string, query?: ApiQuery, keys: string[] = []): Promise<HrmsListResult> {
  const response = await client().get<HrmsRecord[] | Record<string, unknown>>(path, { query });
  const data = arrayFrom(response.data, keys);
  return { data, total: total(response.meta, data.length), meta: response.meta };
}

async function detail(path: string) {
  const response = await client().get<HrmsRecord | Record<string, unknown>>(path);
  return response.data as HrmsRecord;
}

export const tenantHrmsApi = {
  selectors: {
    staff: (query?: ApiQuery) => list('/staff', query, ['staff']),
    leaveTypes: () => client().get<{ leave_types: HrmsRecord[] }>('/leave/types'),
    holidayCalendars: () => client().get<{ calendars: HrmsRecord[] }>('/holiday-calendars'),
    payrollCycles: () => list('/payroll/cycles', { per_page: 100 }, ['cycles']),
    payrollComponents: () => client().get<{ components: HrmsRecord[] }>('/payroll/components')
  },
  attendance: {
    dashboard: () => client().get<{ dashboard: Record<string, unknown> }>('/attendance/dashboard'),
    daily: (query?: ApiQuery) => list('/attendance/daily', query, ['attendance', 'records']),
    monthly: (query?: ApiQuery) => client().get<Record<string, unknown>>('/attendance/monthly', { query }),
    checkIn: (body?: Record<string, unknown>) => client().post('/attendance/check-in', body),
    checkOut: (body?: Record<string, unknown>) => client().post('/attendance/check-out', body),
    createRecord: (body: Record<string, unknown>) => client().post('/attendance/records', body),
    updateRecord: (id: string | number, body: Record<string, unknown>) => client().patch(`/attendance/records/${encodeURIComponent(String(id))}`, body),
    record: (id: string | number) => detail(`/attendance/records/${encodeURIComponent(String(id))}`),
    requests: (query?: ApiQuery) => list('/attendance/requests', query, ['requests']),
    request: (id: string) => detail(`/attendance/requests/${encodeURIComponent(id)}`),
    createRequest: (body: Record<string, unknown>) => client().post('/attendance/requests', body),
    approveRequest: (id: string, body?: Record<string, unknown>) => client().post(`/attendance/requests/${encodeURIComponent(id)}/approve`, body),
    rejectRequest: (id: string, body?: Record<string, unknown>) => client().post(`/attendance/requests/${encodeURIComponent(id)}/reject`, body),
    import: (body: Record<string, unknown>) => client().post('/attendance/import', body),
    export: (body: Record<string, unknown>) => client().post('/attendance/export', body)
  },
  leave: {
    dashboard: () => client().get<{ dashboard: Record<string, unknown> }>('/leave/dashboard'),
    requests: (query?: ApiQuery) => list('/leave/requests', query, ['requests']),
    request: (id: string | number) => detail(`/leave/requests/${encodeURIComponent(String(id))}`),
    apply: (body: Record<string, unknown>) => client().post('/leave/requests', body),
    approve: (id: string | number, body?: Record<string, unknown>) => client().post(`/leave/requests/${encodeURIComponent(String(id))}/approve`, body),
    reject: (id: string | number, body?: Record<string, unknown>) => client().post(`/leave/requests/${encodeURIComponent(String(id))}/reject`, body),
    cancel: (id: string | number, body?: Record<string, unknown>) => client().post(`/leave/requests/${encodeURIComponent(String(id))}/cancel`, body),
    balances: (query?: ApiQuery) => list('/leave/balances', query, ['balances']),
    adjustBalance: (body: Record<string, unknown>) => client().post('/leave/balances/adjust', body),
    calendar: () => client().get<{ events: HrmsRecord[] }>('/leave/calendar'),
    types: () => client().get<{ leave_types: HrmsRecord[] }>('/leave/types'),
    createType: (body: Record<string, unknown>) => client().post('/leave/types', body)
  },
  payroll: {
    dashboard: () => client().get<{ dashboard: Record<string, unknown> }>('/payroll/dashboard'),
    cycles: (query?: ApiQuery) => list('/payroll/cycles', query, ['cycles']),
    cycle: (id: string) => detail(`/payroll/cycles/${encodeURIComponent(id)}`),
    createCycle: (body: Record<string, unknown>) => client().post('/payroll/cycles', body),
    updateCycle: (id: string, body: Record<string, unknown>) => client().patch(`/payroll/cycles/${encodeURIComponent(id)}`, body),
    preview: (id: string, body: Record<string, unknown>) => client().post(`/payroll/cycles/${encodeURIComponent(id)}/generate-preview`, body),
    generate: (id: string, body: Record<string, unknown>) => client().post(`/payroll/cycles/${encodeURIComponent(id)}/generate`, body),
    cycleAction: (id: string, action: 'submit' | 'approve' | 'lock' | 'reopen', body?: Record<string, unknown>) =>
      client().post(`/payroll/cycles/${encodeURIComponent(id)}/${action}`, body),
    payrolls: (query?: ApiQuery) => list('/payroll/payrolls', query, ['payrolls']),
    payroll: (id: string) => detail(`/payroll/payrolls/${encodeURIComponent(id)}`),
    updatePayroll: (id: string, body: Record<string, unknown>) => client().patch(`/payroll/payrolls/${encodeURIComponent(id)}`, body),
    items: (id: string) => client().get<{ items: HrmsRecord[] }>(`/payroll/payrolls/${encodeURIComponent(id)}/items`),
    payslips: (query?: ApiQuery) => list('/payroll/payslips', query, ['payslips']),
    generatePayslips: (body: Record<string, unknown>) => client().post('/payroll/payslips/generate', body),
    emailPayslips: (body: Record<string, unknown>) => client().post('/payroll/payslips/email', body),
    componentTypes: () => client().get<{ component_types: HrmsRecord[] }>('/payroll/component-types'),
    createComponentType: (body: Record<string, unknown>) => client().post('/payroll/component-types', body),
    components: () => client().get<{ components: HrmsRecord[] }>('/payroll/components'),
    createComponent: (body: Record<string, unknown>) => client().post('/payroll/components', body),
    updateComponent: (id: string | number, body: Record<string, unknown>) => client().patch(`/payroll/components/${encodeURIComponent(String(id))}`, body),
    assignments: () => client().get<{ assignments: HrmsRecord[] }>('/payroll/component-assignments'),
    createAssignment: (body: Record<string, unknown>) => client().post('/payroll/component-assignments', body),
    loans: () => client().get<{ loans: HrmsRecord[] }>('/payroll/loans'),
    createLoan: (body: Record<string, unknown>) => client().post('/payroll/loans', body),
    updateLoan: (id: string | number, body: Record<string, unknown>) => client().patch(`/payroll/loans/${encodeURIComponent(String(id))}`, body),
    reimbursements: () => client().get<{ reimbursements: HrmsRecord[] }>('/payroll/reimbursements'),
    createReimbursement: (body: Record<string, unknown>) => client().post('/payroll/reimbursements', body),
    approveReimbursement: (id: string | number, body?: Record<string, unknown>) => client().post(`/payroll/reimbursements/${encodeURIComponent(String(id))}/approve`, body),
    bankTransfers: () => client().get<{ bank_transfers: HrmsRecord[] }>('/payroll/bank-transfers'),
    createBankTransfer: (body: Record<string, unknown>) => client().post('/payroll/bank-transfers', body),
    markTransferPaid: (id: string | number, body?: Record<string, unknown>) => client().post(`/payroll/bank-transfers/${encodeURIComponent(String(id))}/mark-paid`, body),
    taxSlabs: () => client().get<{ tax_slabs: HrmsRecord[] }>('/payroll/tax-slabs'),
    createTaxSlab: (body: Record<string, unknown>) => client().post('/payroll/tax-slabs', body),
    pfSettings: () => client().get<{ pf_settings: HrmsRecord | null }>('/payroll/pf-settings'),
    updatePfSettings: (body: Record<string, unknown>) => client().put('/payroll/pf-settings', body),
    esiSettings: () => client().get<{ esi_settings: HrmsRecord | null }>('/payroll/esi-settings'),
    updateEsiSettings: (body: Record<string, unknown>) => client().put('/payroll/esi-settings', body),
    export: (body: Record<string, unknown>) => client().post('/payroll/export', body)
  },
  holidays: {
    list: (query?: ApiQuery) => list('/holidays', query, ['holidays']),
    detail: (id: string) => detail(`/holidays/${encodeURIComponent(id)}`),
    create: (body: Record<string, unknown>) => client().post('/holidays', body),
    update: (id: string, body: Record<string, unknown>) => client().patch(`/holidays/${encodeURIComponent(id)}`, body),
    delete: (id: string) => client().delete(`/holidays/${encodeURIComponent(id)}`),
    duplicateNextYear: (id: string) => client().post(`/holidays/${encodeURIComponent(id)}/duplicate-next-year`),
    import: (body: Record<string, unknown>) => client().post('/holidays/import', body),
    export: (body: Record<string, unknown>) => client().post('/holidays/export', body),
    calendars: () => client().get<{ calendars: HrmsRecord[] }>('/holiday-calendars'),
    createCalendar: (body: Record<string, unknown>) => client().post('/holiday-calendars', body),
    calendar: (id: string) => detail(`/holiday-calendars/${encodeURIComponent(id)}`),
    updateCalendar: (id: string, body: Record<string, unknown>) => client().patch(`/holiday-calendars/${encodeURIComponent(id)}`, body),
    groups: () => client().get<{ groups: HrmsRecord[] }>('/holiday-groups'),
    createGroup: (body: Record<string, unknown>) => client().post('/holiday-groups', body),
    updateGroup: (id: string, body: Record<string, unknown>) => client().patch(`/holiday-groups/${encodeURIComponent(id)}`, body),
    members: (id: string) => client().get<{ members: HrmsRecord[] }>(`/holiday-groups/${encodeURIComponent(id)}/members`),
    addMembers: (id: string, body: Record<string, unknown>) => client().post(`/holiday-groups/${encodeURIComponent(id)}/members`, body),
    removeMember: (id: string, staffId: string) => client().delete(`/holiday-groups/${encodeURIComponent(id)}/members/${encodeURIComponent(staffId)}`)
  }
};
