import type { ApiQuery } from '@/lib/api/apiTypes';

export const tenantQueryKeys = {
  all: (tenant: string) => ['tenant', tenant] as const,
  resource: (tenant: string, resource: string) => [...tenantQueryKeys.all(tenant), resource] as const,
  list: (tenant: string, resource: string, query?: ApiQuery) =>
    [...tenantQueryKeys.resource(tenant, resource), 'list', query ?? {}] as const,
  detail: (tenant: string, resource: string, id: string) =>
    [...tenantQueryKeys.resource(tenant, resource), 'detail', id] as const,
  related: (tenant: string, resource: string, id: string, relation: string, query?: ApiQuery) =>
    [...tenantQueryKeys.detail(tenant, resource, id), relation, query ?? {}] as const,
  dashboard: (tenant: string, widget: string, query?: ApiQuery) =>
    [...tenantQueryKeys.resource(tenant, 'dashboard'), widget, query ?? {}] as const,
  report: (tenant: string, reportCode: string, query?: ApiQuery) =>
    [...tenantQueryKeys.resource(tenant, 'reports'), reportCode, query ?? {}] as const
};
