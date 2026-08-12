import { authStore } from '@/features/auth/store/authStore';
import type { ApiQuery } from '@/lib/api/apiTypes';
import { createTenantClient } from '@/lib/api/tenantClient';

export type CrmRecord = {
  id?: string | number;
  uuid?: string;
  party_uuid?: string;
  display_name?: string;
  name?: string;
  email?: string;
  status?: string;
  [key: string]: unknown;
};

export type CrmListResult = {
  data: CrmRecord[];
  total: number;
  meta?: Record<string, unknown>;
};

function client() {
  const tenant = authStore.getSnapshot().tenant.tenant;
  if (!tenant) throw new Error('Tenant context is required.');
  return createTenantClient(tenant.slug || tenant.uuid);
}

function paginationTotal(meta?: Record<string, unknown>, fallback = 0) {
  const pagination = meta?.pagination as { total?: number } | undefined;
  return Number(pagination?.total ?? meta?.total ?? fallback);
}

function arrayFrom(data: unknown, keys: string[] = []): CrmRecord[] {
  if (Array.isArray(data)) return data as CrmRecord[];
  if (!data || typeof data !== 'object') return [];
  const payload = data as Record<string, unknown>;
  for (const key of keys) {
    if (Array.isArray(payload[key])) return payload[key] as CrmRecord[];
  }
  for (const value of Object.values(payload)) {
    if (Array.isArray(value)) return value as CrmRecord[];
  }
  return [];
}

function unwrap<T = CrmRecord>(data: unknown, keys: string[]) {
  if (!data || typeof data !== 'object') return data as T;
  const payload = data as Record<string, unknown>;
  for (const key of keys) {
    if (payload[key] && typeof payload[key] === 'object') return payload[key] as T;
  }
  return data as T;
}

async function list(path: string, query?: ApiQuery, keys?: string[]): Promise<CrmListResult> {
  const response = await client().get<CrmRecord[] | Record<string, unknown>>(path, { query });
  const data = arrayFrom(response.data, keys);
  return { data, total: paginationTotal(response.meta, data.length), meta: response.meta };
}

async function detail(path: string, keys: string[]) {
  const response = await client().get<CrmRecord | Record<string, unknown>>(path);
  return unwrap(response.data, keys);
}

function partyApi(resource: 'clients' | 'vendors') {
  const singular = resource.slice(0, -1);
  return {
    list: (query?: ApiQuery) => list(`/${resource}`, query, [resource]),
    detail: (id: string) => detail(`/${resource}/${encodeURIComponent(id)}`, [singular]),
    create: async (body: Record<string, unknown>) =>
      unwrap((await client().post(`/${resource}`, body)).data, [singular]),
    update: async (id: string, body: Record<string, unknown>) =>
      unwrap((await client().patch(`/${resource}/${encodeURIComponent(id)}`, body)).data, [singular]),
    delete: (id: string) => client().delete(`/${resource}/${encodeURIComponent(id)}`),
    import: (body: Record<string, unknown>) => client().post(`/${resource}/import`, body),
    export: (body: Record<string, unknown>) => client().post(`/${resource}/export`, body),
    contacts: {
      list: (id: string) => client().get<Record<string, CrmRecord[]>>(`/${resource}/${encodeURIComponent(id)}/contacts`),
      create: (id: string, body: Record<string, unknown>) =>
        client().post(`/${resource}/${encodeURIComponent(id)}/contacts`, body),
      update: (id: string, contactId: string, body: Record<string, unknown>) =>
        client().patch(`/${resource}/${encodeURIComponent(id)}/contacts/${encodeURIComponent(contactId)}`, body),
      delete: (id: string, contactId: string) =>
        client().delete(`/${resource}/${encodeURIComponent(id)}/contacts/${encodeURIComponent(contactId)}`)
    },
    addresses: {
      list: (id: string) => client().get<Record<string, CrmRecord[]>>(`/${resource}/${encodeURIComponent(id)}/addresses`),
      create: (id: string, body: Record<string, unknown>) =>
        client().post(`/${resource}/${encodeURIComponent(id)}/addresses`, body),
      update: (id: string, addressId: string | number, body: Record<string, unknown>) =>
        client().patch(`/${resource}/${encodeURIComponent(id)}/addresses/${encodeURIComponent(String(addressId))}`, body),
      delete: (id: string, addressId: string | number) =>
        client().delete(`/${resource}/${encodeURIComponent(id)}/addresses/${encodeURIComponent(String(addressId))}`)
    },
    related: (id: string, relation: string) =>
      client().get<Record<string, CrmRecord[]>>(`/${resource}/${encodeURIComponent(id)}/${relation}`),
    activity: (id: string) => client().get<{ activity: CrmRecord[] }>(`/${resource}/${encodeURIComponent(id)}/activity`)
  };
}

export const tenantCrmApi = {
  clients: {
    ...partyApi('clients'),
    merge: (body: Record<string, unknown>) => client().post('/clients/merge', body)
  },
  vendors: {
    ...partyApi('vendors'),
    bankAccounts: {
      list: (id: string) => client().get<{ bank_accounts: CrmRecord[] }>(`/vendors/${encodeURIComponent(id)}/bank-accounts`),
      create: (id: string, body: Record<string, unknown>) =>
        client().post(`/vendors/${encodeURIComponent(id)}/bank-accounts`, body),
      update: (id: string, accountId: string | number, body: Record<string, unknown>) =>
        client().patch(`/vendors/${encodeURIComponent(id)}/bank-accounts/${encodeURIComponent(String(accountId))}`, body),
      delete: (id: string, accountId: string | number) =>
        client().delete(`/vendors/${encodeURIComponent(id)}/bank-accounts/${encodeURIComponent(String(accountId))}`)
    }
  },
  leads: {
    dashboard: () => client().get<{ dashboard: Record<string, unknown> }>('/leads/dashboard'),
    list: (query?: ApiQuery) => list('/leads', query, ['leads']),
    kanban: () => client().get<{ kanban: Record<string, { total: number; value: number; leads: CrmRecord[] }> }>('/leads/kanban'),
    detail: (id: string) => detail(`/leads/${encodeURIComponent(id)}`, ['lead']),
    create: async (body: Record<string, unknown>) => unwrap((await client().post('/leads', body)).data, ['lead']),
    update: async (id: string, body: Record<string, unknown>) =>
      unwrap((await client().patch(`/leads/${encodeURIComponent(id)}`, body)).data, ['lead']),
    delete: (id: string) => client().delete(`/leads/${encodeURIComponent(id)}`),
    import: (body: Record<string, unknown>) => client().post('/leads/import', body),
    export: (body: Record<string, unknown>) => client().post('/leads/export', body),
    duplicate: (id: string, body: Record<string, unknown>) =>
      client().post(`/leads/${encodeURIComponent(id)}/duplicate`, body),
    convert: (id: string, body: Record<string, unknown>) =>
      client().post(`/leads/${encodeURIComponent(id)}/convert`, body),
    markLost: (id: string, body: Record<string, unknown>) =>
      client().post(`/leads/${encodeURIComponent(id)}/mark-lost`, body),
    merge: (body: Record<string, unknown>) => client().post('/leads/merge', body),
    contacts: {
      list: (id: string) => client().get<{ contacts: CrmRecord[] }>(`/leads/${encodeURIComponent(id)}/contacts`),
      create: (id: string, body: Record<string, unknown>) =>
        client().post(`/leads/${encodeURIComponent(id)}/contacts`, body),
      update: (id: string, contactId: string, body: Record<string, unknown>) =>
        client().patch(`/leads/${encodeURIComponent(id)}/contacts/${encodeURIComponent(contactId)}`, body),
      delete: (id: string, contactId: string) =>
        client().delete(`/leads/${encodeURIComponent(id)}/contacts/${encodeURIComponent(contactId)}`)
    },
    addresses: {
      list: (id: string) => client().get<{ addresses: CrmRecord[] }>(`/leads/${encodeURIComponent(id)}/addresses`),
      create: (id: string, body: Record<string, unknown>) =>
        client().post(`/leads/${encodeURIComponent(id)}/addresses`, body),
      update: (id: string, addressId: string | number, body: Record<string, unknown>) =>
        client().patch(`/leads/${encodeURIComponent(id)}/addresses/${encodeURIComponent(String(addressId))}`, body),
      delete: (id: string, addressId: string | number) =>
        client().delete(`/leads/${encodeURIComponent(id)}/addresses/${encodeURIComponent(String(addressId))}`)
    },
    activities: {
      list: (id: string) => client().get<{ activities: CrmRecord[] }>(`/leads/${encodeURIComponent(id)}/activities`),
      create: (id: string, body: Record<string, unknown>) =>
        client().post(`/leads/${encodeURIComponent(id)}/activities`, body),
      update: (id: string, activityId: string, body: Record<string, unknown>) =>
        client().patch(`/leads/${encodeURIComponent(id)}/activities/${encodeURIComponent(activityId)}`, body)
    },
    activity: (id: string) => client().get<{ activity: CrmRecord[] }>(`/leads/${encodeURIComponent(id)}/activity`)
  },
  lookups: (query?: ApiQuery) => list('/lookups', query, ['lookups']),
  files: (query?: ApiQuery) => list('/files', query, ['files']),
  attachments: {
    list: (query: ApiQuery) => client().get<{ attachments: CrmRecord[] }>('/attachments', { query }),
    create: (body: Record<string, unknown>) => client().post('/attachments', body),
    delete: (id: string | number) => client().delete(`/attachments/${encodeURIComponent(String(id))}`)
  },
  notes: {
    list: (query: ApiQuery) => client().get<{ notes: CrmRecord[] }>('/notes', { query }),
    create: (body: Record<string, unknown>) => client().post('/notes', body),
    update: (id: string, body: Record<string, unknown>) => client().patch(`/notes/${encodeURIComponent(id)}`, body),
    delete: (id: string) => client().delete(`/notes/${encodeURIComponent(id)}`)
  },
  email: (body: Record<string, unknown>) => client().post('/communication/email', body)
};
