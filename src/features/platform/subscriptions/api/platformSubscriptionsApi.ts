import type { ApiQuery, NormalizedApiResponse } from '@/lib/api/apiTypes';
import { platformClient } from '@/lib/api/platformClient';

export type CatalogRecord = {
  uuid?: string;
  id?: string;
  name?: string;
  code?: string;
  description?: string;
  status?: string;
  currency?: string;
  billing_cycle?: string;
  base_price?: string | number;
  price?: string | number;
  trial_days?: number;
  is_custom?: boolean;
  is_public?: boolean;
  active_subscription_count?: number;
  subscription_count?: number;
  pricing_type?: string;
  module?: string;
  data_type?: string;
  unit?: string;
  created_at?: string;
  updated_at?: string;
  features?: CatalogRecord[];
  subscriptions?: CatalogRecord[];
  [key: string]: unknown;
};

export type SubscriptionRecord = CatalogRecord & {
  subscription_number?: string;
  tenant_id?: string;
  tenant_uuid?: string;
  tenant_name?: string;
  organization_name?: string;
  plan_id?: string;
  plan_uuid?: string;
  plan_name?: string;
  type?: string;
  renewal_type?: string;
  starts_at?: string;
  expires_at?: string;
  next_billing_at?: string;
  payable_amount?: string | number;
  subtotal?: string | number;
  discount_amount?: string | number;
  tax_amount?: string | number;
  total_amount?: string | number;
  amount?: string | number;
  auto_renew?: boolean;
  last_renewed_at?: string;
  addons?: CatalogRecord[];
  usage?: CatalogRecord[];
  invoices?: CatalogRecord[];
  payments?: CatalogRecord[];
  coupons?: CatalogRecord[];
  redemptions?: CatalogRecord[];
  versions?: CatalogRecord[];
  renewals?: CatalogRecord[];
};

export type ListResult<TRecord extends CatalogRecord> = {
  data: TRecord[];
  total: number;
};

export type PlanPayload = {
  name: string;
  code: string;
  description?: string;
  billing_cycle: string;
  base_price: string;
  currency: string;
  trial_days: number;
  is_custom: boolean;
  is_public: boolean;
  status: string;
};

export type FeaturePayload = {
  module: string;
  name: string;
  code: string;
  data_type: string;
  unit?: string;
  description?: string;
  status: string;
};

export type AddonPayload = {
  name: string;
  code: string;
  pricing_type: string;
  price: string;
  currency: string;
  status: string;
};

function paginationTotal(meta?: Record<string, unknown>, fallback = 0) {
  const pagination = meta?.pagination as { total?: number } | undefined;
  return Number(pagination?.total ?? meta?.total ?? fallback);
}

function unwrap<TRecord extends CatalogRecord>(
  response: NormalizedApiResponse<TRecord | Record<string, TRecord | TRecord[] | number | unknown>>,
  keys: string[]
) {
  const data = response.data;
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const record = data as Record<string, TRecord | TRecord[] | number | unknown>;
    for (const key of keys) {
      if (record[key] && !Array.isArray(record[key])) return record[key] as TRecord;
    }
  }
  return data as TRecord;
}

function unwrapSubscription(
  response: NormalizedApiResponse<SubscriptionRecord | Record<string, SubscriptionRecord | CatalogRecord[] | unknown>>
) {
  const data = response.data;
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const record = data as Record<string, SubscriptionRecord | CatalogRecord[] | unknown>;
    const subscription = (record.subscription && !Array.isArray(record.subscription)
      ? record.subscription
      : record) as SubscriptionRecord;
    return {
      ...subscription,
      addons: (record.addons as CatalogRecord[] | undefined) ?? subscription.addons,
      invoices: (record.invoices as CatalogRecord[] | undefined) ?? subscription.invoices,
      payments: (record.payments as CatalogRecord[] | undefined) ?? subscription.payments,
      coupons: (record.coupons as CatalogRecord[] | undefined) ?? subscription.coupons,
      redemptions: (record.redemptions as CatalogRecord[] | undefined) ?? subscription.redemptions,
      usage: (record.usage as CatalogRecord[] | undefined) ?? subscription.usage,
      versions: (record.versions as CatalogRecord[] | undefined) ?? subscription.versions,
      renewals: (record.renewals as CatalogRecord[] | undefined) ?? subscription.renewals
    };
  }
  return data as SubscriptionRecord;
}

async function list<TRecord extends CatalogRecord>(path: string, query?: ApiQuery): Promise<ListResult<TRecord>> {
  const response = await platformClient.get<TRecord[]>(path, { query });
  return {
    data: Array.isArray(response.data) ? response.data : [],
    total: paginationTotal(response.meta, Array.isArray(response.data) ? response.data.length : 0)
  };
}

function idempotencyKey(action: string, id?: string) {
  return `${action}-${id ?? 'new'}-${Date.now()}`;
}

export const platformSubscriptionsApi = {
  subscriptions: {
    list: (query?: ApiQuery) => list<SubscriptionRecord>('/subscriptions', query),
    detail: async (id: string) =>
      unwrapSubscription(await platformClient.get(`/subscriptions/${encodeURIComponent(id)}`)),
    create: async (body: Record<string, unknown>) =>
      unwrap<SubscriptionRecord>(
        await platformClient.post('/subscriptions', body, { idempotencyKey: idempotencyKey('sub-create') }),
        ['subscription']
      ),
    update: async (id: string, body: Record<string, unknown>) =>
      unwrap<SubscriptionRecord>(
        await platformClient.patch(`/subscriptions/${encodeURIComponent(id)}`, body, {
          idempotencyKey: idempotencyKey('sub-update', id)
        }),
        ['subscription']
      ),
    upgrade: (id: string, body: Record<string, unknown>) =>
      platformClient.post(`/subscriptions/${encodeURIComponent(id)}/upgrade`, body, {
        idempotencyKey: idempotencyKey('sub-upgrade', id)
      }),
    downgrade: (id: string, body: Record<string, unknown>) =>
      platformClient.post(`/subscriptions/${encodeURIComponent(id)}/downgrade`, body, {
        idempotencyKey: idempotencyKey('sub-downgrade', id)
      }),
    renew: (id: string, body: Record<string, unknown>) =>
      platformClient.post(`/subscriptions/${encodeURIComponent(id)}/renew`, body, {
        idempotencyKey: idempotencyKey('sub-renew', id)
      }),
    pause: (id: string, body: Record<string, unknown>) =>
      platformClient.post(`/subscriptions/${encodeURIComponent(id)}/pause`, body, {
        idempotencyKey: idempotencyKey('sub-pause', id)
      }),
    resume: (id: string, body: Record<string, unknown>) =>
      platformClient.post(`/subscriptions/${encodeURIComponent(id)}/resume`, body, {
        idempotencyKey: idempotencyKey('sub-resume', id)
      }),
    cancel: (id: string, body: Record<string, unknown>) =>
      platformClient.post(`/subscriptions/${encodeURIComponent(id)}/cancel`, body, {
        idempotencyKey: idempotencyKey('sub-cancel', id)
      }),
    addAddon: (id: string, body: Record<string, unknown>) =>
      platformClient.post(`/subscriptions/${encodeURIComponent(id)}/addons`, body, {
        idempotencyKey: idempotencyKey('sub-addon', id)
      }),
    updateAddon: (id: string, addonId: string, body: Record<string, unknown>) =>
      platformClient.patch(`/subscriptions/${encodeURIComponent(id)}/addons/${encodeURIComponent(addonId)}`, body, {
        idempotencyKey: idempotencyKey('sub-addon-update', id)
      }),
    removeAddon: (id: string, addonId: string) =>
      platformClient.delete(`/subscriptions/${encodeURIComponent(id)}/addons/${encodeURIComponent(addonId)}`, {
        idempotencyKey: idempotencyKey('sub-addon-remove', id)
      }),
    applyCoupon: (id: string, body: Record<string, unknown>) =>
      platformClient.post(`/subscriptions/${encodeURIComponent(id)}/apply-coupon`, body, {
        idempotencyKey: idempotencyKey('sub-coupon', id)
      }),
    removeCoupon: (id: string, couponId: string) =>
      platformClient.delete(`/subscriptions/${encodeURIComponent(id)}/coupons/${encodeURIComponent(couponId)}`, {
        idempotencyKey: idempotencyKey('sub-coupon-remove', id)
      }),
    invoice: (id: string) =>
      platformClient.post(`/subscriptions/${encodeURIComponent(id)}/invoice`, undefined, {
        idempotencyKey: idempotencyKey('sub-invoice', id)
      }),
    usage: (id: string) => platformClient.get<{ usage: CatalogRecord[] }>(`/subscriptions/${encodeURIComponent(id)}/usage`),
    history: (id: string) =>
      platformClient.get<{ versions: CatalogRecord[]; renewals: CatalogRecord[] }>(
        `/subscriptions/${encodeURIComponent(id)}/history`
      ),
    export: () => platformClient.post('/subscriptions/export')
  },
  plans: {
    list: (query?: ApiQuery) => list<CatalogRecord>('/plans', query),
    detail: async (id: string) => unwrap<CatalogRecord>(await platformClient.get(`/plans/${encodeURIComponent(id)}`), ['plan']),
    create: async (body: PlanPayload) => unwrap<CatalogRecord>(await platformClient.post('/plans', body), ['plan']),
    update: async (id: string, body: Partial<PlanPayload>) =>
      unwrap<CatalogRecord>(await platformClient.patch(`/plans/${encodeURIComponent(id)}`, body), ['plan']),
    delete: (id: string) => platformClient.delete(`/plans/${encodeURIComponent(id)}`),
    clone: (id: string, body: Record<string, unknown>) =>
      platformClient.post(`/plans/${encodeURIComponent(id)}/clone`, body),
    features: (id: string) => platformClient.get<{ features: CatalogRecord[] }>(`/plans/${encodeURIComponent(id)}/features`),
    replaceFeatures: (id: string, features: Record<string, unknown>[]) =>
      platformClient.put(`/plans/${encodeURIComponent(id)}/features`, { features }),
    subscriptions: (id: string) =>
      platformClient.get<CatalogRecord[]>(`/plans/${encodeURIComponent(id)}/subscriptions`),
    export: () => platformClient.post('/plans/export')
  },
  features: {
    list: (query?: ApiQuery) => list<CatalogRecord>('/features', query),
    detail: async (id: string) =>
      unwrap<CatalogRecord>(await platformClient.get(`/features/${encodeURIComponent(id)}`), ['feature']),
    create: async (body: FeaturePayload) => unwrap<CatalogRecord>(await platformClient.post('/features', body), ['feature']),
    update: async (id: string, body: Partial<FeaturePayload>) =>
      unwrap<CatalogRecord>(await platformClient.patch(`/features/${encodeURIComponent(id)}`, body), ['feature']),
    delete: (id: string) => platformClient.delete(`/features/${encodeURIComponent(id)}`),
    export: () => platformClient.post('/features/export')
  },
  addons: {
    list: (query?: ApiQuery) => list<CatalogRecord>('/addons', query),
    detail: async (id: string) => unwrap<CatalogRecord>(await platformClient.get(`/addons/${encodeURIComponent(id)}`), ['addon']),
    create: async (body: AddonPayload) => unwrap<CatalogRecord>(await platformClient.post('/addons', body), ['addon']),
    update: async (id: string, body: Partial<AddonPayload>) =>
      unwrap<CatalogRecord>(await platformClient.patch(`/addons/${encodeURIComponent(id)}`, body), ['addon']),
    delete: (id: string) => platformClient.delete(`/addons/${encodeURIComponent(id)}`)
  },
  references: {
    tenants: (query?: ApiQuery) => list<CatalogRecord>('/tenants', query),
    coupons: (query?: ApiQuery) => list<CatalogRecord>('/coupons', query)
  }
};
