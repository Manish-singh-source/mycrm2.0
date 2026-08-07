import type { ApiQuery, QueryPrimitive } from '@/lib/api/apiTypes';

function appendParam(params: URLSearchParams, key: string, value: QueryPrimitive | QueryPrimitive[]) {
  if (value === undefined || value === null || value === '') return;

  if (Array.isArray(value)) {
    const filtered = value.filter((item) => item !== undefined && item !== null && item !== '');
    if (filtered.length > 0) {
      params.set(key, filtered.join(','));
    }
    return;
  }

  params.set(key, String(value));
}

export function toQueryString(query?: ApiQuery) {
  if (!query) return '';

  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (key === 'filter' && value && typeof value === 'object' && !Array.isArray(value)) {
      Object.entries(value).forEach(([filterKey, filterValue]) => {
        appendParam(params, `filter[${filterKey}]`, filterValue);
      });
      return;
    }

    appendParam(params, key, value as QueryPrimitive | QueryPrimitive[]);
  });

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}
