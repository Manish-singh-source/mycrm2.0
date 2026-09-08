import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import type { EnterpriseListState } from '@/shared/module-pages/types';

export function useEnterpriseListState(initial?: Partial<Pick<EnterpriseListState, 'page' | 'perPage' | 'search' | 'sort'>>) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const page = positiveNumber(searchParams.get('page'), initial?.page ?? 1);
  const perPage = positiveNumber(searchParams.get('per_page'), initial?.perPage ?? 10);
  const search = searchParams.get('search') ?? initial?.search ?? '';
  const sort = searchParams.get('sort') ?? initial?.sort;

  const updateParams = useCallback((updates: Record<string, string | number | undefined>) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === '' || value === 0) next.delete(key);
        else next.set(key, String(value));
      });
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const state = useMemo(() => ({
    page,
    perPage,
    search,
    sort,
    selectedIds,
    setPage: (nextPage: number) => updateParams({ page: nextPage > 1 ? nextPage : undefined }),
    setPerPage: (nextPerPage: number) => updateParams({ per_page: nextPerPage, page: undefined }),
    setSearch: (nextSearch: string) => updateParams({ search: nextSearch || undefined, page: undefined }),
    setSort: (nextSort?: string) => updateParams({ sort: nextSort, page: undefined }),
    setSelectedIds,
    clearSelection: () => setSelectedIds([])
  }), [page, perPage, search, selectedIds, sort, updateParams]);

  return state satisfies EnterpriseListState;
}

function positiveNumber(value: string | null, fallback: number) {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
