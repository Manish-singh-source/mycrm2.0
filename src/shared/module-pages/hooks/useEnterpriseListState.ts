import { useState } from 'react';

import type { EnterpriseListState } from '@/shared/module-pages/types';

export function useEnterpriseListState(initial?: Partial<Pick<EnterpriseListState, 'page' | 'perPage' | 'search' | 'sort'>>) {
  const [page, setPage] = useState(initial?.page ?? 1);
  const [perPage, setPerPage] = useState(initial?.perPage ?? 10);
  const [search, setSearchValue] = useState(initial?.search ?? '');
  const [sort, setSort] = useState<string | undefined>(initial?.sort);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  function setSearch(value: string) {
    setSearchValue(value);
    setPage(1);
  }

  return {
    page,
    perPage,
    search,
    sort,
    selectedIds,
    setPage,
    setPerPage,
    setSearch,
    setSort,
    setSelectedIds,
    clearSelection: () => setSelectedIds([])
  } satisfies EnterpriseListState;
}
