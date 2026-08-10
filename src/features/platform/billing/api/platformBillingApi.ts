import type { ApiQuery, NormalizedApiResponse } from '@/lib/api/apiTypes';
import { platformClient } from '@/lib/api/platformClient';

export type BillingRecord = {
  uuid?: string;
  id?: string;
  invoice_number?: string;
  payment_number?: string;
  refund_number?: string;
  code?: string;
  name?: string;
  tenant_id?: string;
  tenant_name?: string;
  organization_name?: string;
  subscription_id?: string;
  platform_invoice_id?: string;
  platform_payment_id?: string;
  gateway?: string;
  gateway_payment_id?: string;
  gateway_refund_id?: string;
  payment_method?: string;
  invoice_date?: string;
  due_date?: string;
  paid_at?: string;
  refunded_at?: string;
  subtotal?: string | number;
  discount_amount?: string | number;
  tax_amount?: string | number;
  total?: string | number;
  total_amount?: string | number;
  paid_amount?: string | number;
  balance?: string | number;
  balance_amount?: string | number;
  amount?: string | number;
  currency?: string;
  status?: string;
  payment_status?: string;
  refund_status?: string;
  failure_reason?: string;
  reason?: string;
  raw_response?: unknown;
  items?: BillingRecord[];
  payments?: BillingRecord[];
  refunds?: BillingRecord[];
  redemptions?: BillingRecord[];
  [key: string]: unknown;
};

export type BillingListResult = {
  data: BillingRecord[];
  total: number;
};

function paginationTotal(meta?: Record<string, unknown>, fallback = 0) {
  const pagination = meta?.pagination as { total?: number } | undefined;
  return Number(pagination?.total ?? meta?.total ?? fallback);
}

function unwrap(response: NormalizedApiResponse<BillingRecord | Record<string, unknown>>, keys: string[]) {
  const data = response.data;
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const wrapped = data as Record<string, BillingRecord | unknown>;
    for (const key of keys) {
      if (wrapped[key] && typeof wrapped[key] === 'object') return wrapped[key] as BillingRecord;
    }
  }
  return data as BillingRecord;
}

async function list(path: string, query?: ApiQuery): Promise<BillingListResult> {
  const response = await platformClient.get<BillingRecord[]>(path, { query });
  return {
    data: Array.isArray(response.data) ? response.data : [],
    total: paginationTotal(response.meta, Array.isArray(response.data) ? response.data.length : 0)
  };
}

function idempotencyKey(action: string, id?: string) {
  return `${action}-${id ?? 'new'}-${Date.now()}`;
}

export const platformBillingApi = {
  invoices: {
    list: (query?: ApiQuery) => list('/billing/invoices', query),
    detail: async (id: string) => unwrap(await platformClient.get(`/billing/invoices/${encodeURIComponent(id)}`), ['invoice']),
    create: async (body: Record<string, unknown>) =>
      unwrap(await platformClient.post('/billing/invoices', body, { idempotencyKey: idempotencyKey('invoice-create') }), ['invoice']),
    update: async (id: string, body: Record<string, unknown>) =>
      unwrap(await platformClient.patch(`/billing/invoices/${encodeURIComponent(id)}`, body, { idempotencyKey: idempotencyKey('invoice-update', id) }), ['invoice']),
    cancel: (id: string, body: Record<string, unknown>) =>
      platformClient.delete(`/billing/invoices/${encodeURIComponent(id)}`, {
        body,
        idempotencyKey: idempotencyKey('invoice-cancel', id)
      }),
    send: (id: string, body: Record<string, unknown>) =>
      platformClient.post(`/billing/invoices/${encodeURIComponent(id)}/send`, body),
    recordPayment: (id: string, body: Record<string, unknown>) =>
      platformClient.post(`/billing/invoices/${encodeURIComponent(id)}/payments`, body, {
        idempotencyKey: idempotencyKey('invoice-payment', id)
      }),
    pdf: (id: string) => platformClient.get(`/billing/invoices/${encodeURIComponent(id)}/pdf`),
    export: () => platformClient.post('/billing/invoices/export')
  },
  payments: {
    list: (query?: ApiQuery) => list('/billing/payments', query),
    detail: async (id: string) => unwrap(await platformClient.get(`/billing/payments/${encodeURIComponent(id)}`), ['payment']),
    create: async (body: Record<string, unknown>) =>
      unwrap(await platformClient.post('/billing/payments', body, { idempotencyKey: idempotencyKey('payment-record') }), ['payment']),
    retry: (id: string, body: Record<string, unknown>) =>
      platformClient.post(`/billing/payments/${encodeURIComponent(id)}/retry`, body, {
        idempotencyKey: idempotencyKey('payment-retry', id)
      }),
    refund: (id: string, body: Record<string, unknown>) =>
      platformClient.post(`/billing/payments/${encodeURIComponent(id)}/refund`, body, {
        idempotencyKey: idempotencyKey('payment-refund', id)
      }),
    export: () => platformClient.post('/billing/payments/export')
  },
  refunds: {
    list: (query?: ApiQuery) => list('/billing/refunds', query),
    detail: async (id: string) => unwrap(await platformClient.get(`/billing/refunds/${encodeURIComponent(id)}`), ['refund']),
    create: async (body: Record<string, unknown>) =>
      unwrap(await platformClient.post('/billing/refunds', body, { idempotencyKey: idempotencyKey('refund-create') }), ['refund']),
    retry: (id: string, body: Record<string, unknown>) =>
      platformClient.post(`/billing/refunds/${encodeURIComponent(id)}/retry`, body, {
        idempotencyKey: idempotencyKey('refund-retry', id)
      }),
    export: () => platformClient.post('/billing/refunds/export')
  },
  coupons: {
    list: (query?: ApiQuery) => list('/coupons', query),
    detail: async (id: string) => unwrap(await platformClient.get(`/coupons/${encodeURIComponent(id)}`), ['coupon']),
    create: async (body: Record<string, unknown>) => unwrap(await platformClient.post('/coupons', body), ['coupon']),
    update: async (id: string, body: Record<string, unknown>) =>
      unwrap(await platformClient.patch(`/coupons/${encodeURIComponent(id)}`, body), ['coupon']),
    delete: (id: string) => platformClient.delete(`/coupons/${encodeURIComponent(id)}`),
    activate: (id: string) => platformClient.post(`/coupons/${encodeURIComponent(id)}/activate`),
    deactivate: (id: string) => platformClient.post(`/coupons/${encodeURIComponent(id)}/deactivate`),
    redemptions: (id: string) => platformClient.get<{ redemptions: BillingRecord[] }>(`/coupons/${encodeURIComponent(id)}/redemptions`),
    restrictPlans: (id: string, plan_uuids: string[]) => platformClient.put(`/coupons/${encodeURIComponent(id)}/plans`, { plan_uuids }),
    restrictTenants: (id: string, tenant_uuids: string[]) => platformClient.put(`/coupons/${encodeURIComponent(id)}/tenants`, { tenant_uuids }),
    export: () => platformClient.post('/coupons/export')
  }
};
