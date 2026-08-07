import type { ApiQuery } from '@/lib/api/apiTypes';

export const platformQueryKeys = {
  all: ['platform'] as const,
  resource: (resource: string) => [...platformQueryKeys.all, resource] as const,
  list: (resource: string, query?: ApiQuery) =>
    [...platformQueryKeys.resource(resource), 'list', query ?? {}] as const,
  detail: (resource: string, id: string) => [...platformQueryKeys.resource(resource), 'detail', id] as const,
  related: (resource: string, id: string, relation: string, query?: ApiQuery) =>
    [...platformQueryKeys.detail(resource, id), relation, query ?? {}] as const,
  dashboard: (widget: string, query?: ApiQuery) =>
    [...platformQueryKeys.resource('dashboard'), widget, query ?? {}] as const,
  report: (reportCode: string, query?: ApiQuery) =>
    [...platformQueryKeys.resource('reports'), reportCode, query ?? {}] as const
};
