export type ApiGuard = 'auth' | 'platform' | 'tenant';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type ApiEnvelope<TData> = {
  data: TData;
  meta?: {
    request_id?: string;
    timestamp?: string;
    [key: string]: unknown;
  };
};

export type ApiLinks = {
  first?: string;
  last?: string;
  prev?: string | null;
  next?: string | null;
  [key: string]: unknown;
};

export type PaginatedEnvelope<TData> = {
  data: TData[];
  links?: ApiLinks;
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    [key: string]: unknown;
  };
};

export type NormalizedApiResponse<TData> = {
  data: TData;
  meta?: Record<string, unknown>;
  links?: ApiLinks;
};

export type ApiErrorResponse = {
  message: string;
  error_code?: string;
  errors?: Record<string, string[]>;
  request_id?: string;
};

export type ValidationErrors = Record<string, string | string[]>;

export type QueryPrimitive = string | number | boolean | null | undefined;

export type ListQuery = {
  page?: number;
  per_page?: number;
  search?: string;
  sort?: string;
  direction?: 'asc' | 'desc';
  include?: string;
  fields?: string;
  date_from?: string;
  date_to?: string;
  view?: 'table' | 'grid' | 'kanban' | 'calendar' | 'gantt' | 'agenda';
  filter?: Record<string, QueryPrimitive | QueryPrimitive[]>;
};

export type ApiQuery = ListQuery & Record<string, QueryPrimitive | QueryPrimitive[] | Record<string, QueryPrimitive | QueryPrimitive[]>>;

export type ApiRequestMetadata = {
  idempotencyKey?: string;
  timezone?: string;
  locale?: string;
  impersonationReason?: string;
  office?: string;
};

export type ApiRequestOptions = Omit<RequestInit, 'body' | 'method'> &
  ApiRequestMetadata & {
    query?: ApiQuery;
    body?: unknown;
    retry?: boolean | number;
  };
