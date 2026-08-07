import type { ApiQuery, ListQuery } from '@/lib/api/apiTypes';

export function createListQuery(query: ListQuery = {}): ApiQuery {
  return {
    page: query.page,
    per_page: query.per_page,
    search: query.search,
    sort: query.sort,
    include: query.include,
    fields: query.fields,
    date_from: query.date_from,
    date_to: query.date_to,
    view: query.view,
    filter: query.filter
  };
}

export function withFilter(query: ApiQuery, field: string, value: NonNullable<ListQuery['filter']>[string]) {
  return {
    ...query,
    filter: {
      ...(query.filter ?? {}),
      [field]: value
    }
  };
}
