export type ApiGuard = 'platform' | 'tenant';

export type ApiEnvelope<TData> = {
  data: TData;
  meta?: {
    request_id?: string;
    timestamp?: string;
    [key: string]: unknown;
  };
};

export type PaginatedEnvelope<TData> = {
  data: TData[];
  links?: {
    first?: string;
    last?: string;
    prev?: string | null;
    next?: string | null;
  };
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    [key: string]: unknown;
  };
};

export type ApiErrorResponse = {
  message: string;
  error_code?: string;
  errors?: Record<string, string[]>;
  request_id?: string;
};

export type ListQuery = {
  page?: number;
  per_page?: number;
  search?: string;
  sort?: string;
  include?: string;
  fields?: string;
  date_from?: string;
  date_to?: string;
  view?: 'table' | 'grid' | 'kanban' | 'calendar' | 'gantt' | 'agenda';
  filter?: Record<string, string | number | boolean | Array<string | number>>;
};
