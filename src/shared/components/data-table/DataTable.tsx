import { useMemo, useState, type ReactNode } from 'react';

import { Button } from '@/shared/components/ui';

export type DataTableColumn<TRow> = {
  id: string;
  header: ReactNode;
  cell: (row: TRow) => ReactNode;
  accessor?: (row: TRow) => string | number | boolean | null | undefined;
  enableSorting?: boolean;
  enableHiding?: boolean;
};

type DataTableProps<TRow> = {
  columns: DataTableColumn<TRow>[];
  data: TRow[];
  getRowId: (row: TRow) => string;
  loading?: boolean;
  error?: ReactNode;
  emptyState?: ReactNode;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onOpenFilters?: () => void;
  onOpenColumns?: () => void;
  onOpenSavedViews?: () => void;
  onOpenExport?: () => void;
  onOpenImport?: () => void;
  selectedRowIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  bulkActions?: ReactNode;
  page?: number;
  perPage?: number;
  total?: number;
  onPageChange?: (page: number) => void;
};

export function DataTable<TRow>({
  columns,
  data,
  getRowId,
  loading,
  error,
  emptyState,
  searchValue,
  onSearchChange,
  onOpenFilters,
  onOpenColumns,
  onOpenSavedViews,
  onOpenExport,
  onOpenImport,
  selectedRowIds,
  onSelectionChange,
  bulkActions,
  page = 1,
  perPage = 25,
  total = data.length,
  onPageChange
}: DataTableProps<TRow>) {
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
  const [sort, setSort] = useState<{ id: string; direction: 'asc' | 'desc' } | null>(null);
  const selected = selectedRowIds ?? [];

  const visibleColumns = useMemo(
    () => columns.filter((column) => !hiddenColumns.includes(column.id)),
    [columns, hiddenColumns]
  );

  const sortedData = useMemo(() => {
    if (!sort) return data;
    const column = columns.find((item) => item.id === sort.id);
    if (!column?.accessor) return data;

    return [...data].sort((a, b) => {
      const left = column.accessor?.(a);
      const right = column.accessor?.(b);
      const direction = sort.direction === 'asc' ? 1 : -1;
      return String(left ?? '').localeCompare(String(right ?? '')) * direction;
    });
  }, [columns, data, sort]);

  const allVisibleSelected = sortedData.length > 0 && sortedData.every((row) => selected.includes(getRowId(row)));

  function toggleRow(id: string) {
    if (!onSelectionChange) return;
    onSelectionChange(selected.includes(id) ? selected.filter((rowId) => rowId !== id) : [...selected, id]);
  }

  function toggleAll() {
    if (!onSelectionChange) return;
    onSelectionChange(allVisibleSelected ? [] : sortedData.map(getRowId));
  }

  function toggleSort(column: DataTableColumn<TRow>) {
    if (!column.enableSorting) return;
    setSort((current) => {
      if (current?.id !== column.id) return { id: column.id, direction: 'asc' };
      if (current.direction === 'asc') return { id: column.id, direction: 'desc' };
      return null;
    });
  }

  return (
    <section className="data-table-shell" aria-busy={loading}>
      <div className="data-table-toolbar">
        <label className="table-search">
          <span className="sr-only">Search records</span>
          <input
            type="search"
            value={searchValue ?? ''}
            placeholder="Search"
            onChange={(event) => onSearchChange?.(event.target.value)}
            disabled={loading}
          />
        </label>
        <div className="table-actions">
          <Button type="button" variant="secondary" size="sm" onClick={onOpenSavedViews} disabled={!onOpenSavedViews}>
            Views
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={onOpenFilters} disabled={!onOpenFilters}>
            Filters
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={onOpenColumns} disabled={!onOpenColumns}>
            Columns
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={onOpenExport} disabled={!onOpenExport}>
            Export
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={onOpenImport} disabled={!onOpenImport}>
            Import
          </Button>
        </div>
      </div>

      {selected.length > 0 ? (
        <div className="bulk-action-bar">
          <span>{selected.length} selected</span>
          {bulkActions}
        </div>
      ) : null}

      {error ? <div className="surface-error" role="alert">{error}</div> : null}
      {loading ? <div className="surface-state" role="status">Loading records...</div> : null}

      {!loading && sortedData.length === 0 ? <>{emptyState ?? <div className="empty-state">No records found.</div>}</> : null}

      {!loading && sortedData.length > 0 ? (
        <div className="data-table" role="region" tabIndex={0}>
          <table>
            <thead>
              <tr>
                {onSelectionChange ? (
                  <th className="selection-cell">
                    <input
                      type="checkbox"
                      aria-label="Select all rows"
                      checked={allVisibleSelected}
                      onChange={toggleAll}
                    />
                  </th>
                ) : null}
                {visibleColumns.map((column) => (
                  <th key={column.id}>
                    <button
                      type="button"
                      className="table-heading-button"
                      disabled={!column.enableSorting}
                      onClick={() => toggleSort(column)}
                    >
                      <span>{column.header}</span>
                      {sort?.id === column.id ? <span>{sort.direction === 'asc' ? 'Asc' : 'Desc'}</span> : null}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedData.map((row) => {
                const rowId = getRowId(row);
                return (
                  <tr key={rowId}>
                    {onSelectionChange ? (
                      <td className="selection-cell">
                        <input
                          type="checkbox"
                          aria-label={`Select row ${rowId}`}
                          checked={selected.includes(rowId)}
                          onChange={() => toggleRow(rowId)}
                        />
                      </td>
                    ) : null}
                    {visibleColumns.map((column) => (
                      <td key={column.id}>{column.cell(row)}</td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      <footer className="table-pagination">
        <span>
          Page {page} of {Math.max(1, Math.ceil(total / perPage))}
        </span>
        <div>
          <Button type="button" variant="secondary" size="sm" onClick={() => onPageChange?.(page - 1)} disabled={!onPageChange || page <= 1}>
            Previous
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => onPageChange?.(page + 1)} disabled={!onPageChange || page >= Math.ceil(total / perPage)}>
            Next
          </Button>
        </div>
      </footer>

      <div className="column-visibility-inline" hidden>
        {columns.map((column) => (
          <label key={column.id}>
            <input
              type="checkbox"
              checked={!hiddenColumns.includes(column.id)}
              disabled={column.enableHiding === false}
              onChange={() =>
                setHiddenColumns((current) =>
                  current.includes(column.id) ? current.filter((id) => id !== column.id) : [...current, column.id]
                )
              }
            />
            {column.header}
          </label>
        ))}
      </div>
    </section>
  );
}
