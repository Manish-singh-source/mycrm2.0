import { useMemo, useState, type ReactNode } from 'react';
import {
  ArrowDown,
  ArrowUpDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Columns3,
  Download,
  Filter,
  FolderOpen,
  Loader2,
  Search,
  Upload
} from 'lucide-react';

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
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  hiddenColumnIds?: string[];
  onHiddenColumnIdsChange?: (ids: string[]) => void;
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
  searchPlaceholder = 'Search',
  onSearchChange,
  hiddenColumnIds,
  onHiddenColumnIdsChange,
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
  const [internalHiddenColumns, setInternalHiddenColumns] = useState<string[]>([]);
  const [sort, setSort] = useState<{ id: string; direction: 'asc' | 'desc' } | null>(null);
  const selected = selectedRowIds ?? [];
  const hiddenColumns = hiddenColumnIds ?? internalHiddenColumns;
  const setHiddenColumns = onHiddenColumnIdsChange ?? setInternalHiddenColumns;
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const startRecord = total === 0 ? 0 : (page - 1) * perPage + 1;
  const endRecord = Math.min(page * perPage, total);

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

  const allVisibleSelected =
    sortedData.length > 0 && sortedData.every((row) => selected.includes(getRowId(row)));

  function toggleRow(id: string) {
    if (!onSelectionChange) return;
    onSelectionChange(
      selected.includes(id) ? selected.filter((rowId) => rowId !== id) : [...selected, id]
    );
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

  function renderSortIcon(column: DataTableColumn<TRow>) {
    if (!column.enableSorting) return null;
    if (sort?.id !== column.id) {
      return (
        <ArrowUpDown
          aria-hidden="true"
          className="table-sort-indicator"
          size={14}
          strokeWidth={2.2}
        />
      );
    }
    return sort.direction === 'asc' ? (
      <ArrowUp aria-hidden="true" size={14} strokeWidth={2.4} />
    ) : (
      <ArrowDown aria-hidden="true" size={14} strokeWidth={2.4} />
    );
  }

  function toggleColumn(column: DataTableColumn<TRow>) {
    if (column.enableHiding === false) return;
    setHiddenColumns(
      hiddenColumns.includes(column.id)
        ? hiddenColumns.filter((id) => id !== column.id)
        : [...hiddenColumns, column.id]
    );
  }

  return (
    <section className="data-table-shell" aria-busy={loading}>
      <div className="data-table-toolbar">
        <div className="table-toolbar-primary">
          <label className="table-search">
            <Search aria-hidden="true" size={17} />
            <span className="sr-only">Search records</span>
            <input
              type="search"
              value={searchValue ?? ''}
              placeholder={searchPlaceholder}
              onChange={(event) => onSearchChange?.(event.target.value)}
              disabled={loading}
            />
          </label>
          <span className="table-result-pill">{total} records</span>
        </div>
        <div className="table-actions">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onOpenSavedViews}
            disabled={!onOpenSavedViews}
          >
            <FolderOpen aria-hidden="true" size={15} />
            Views
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onOpenFilters}
            disabled={!onOpenFilters}
          >
            <Filter aria-hidden="true" size={15} />
            Filters
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onOpenColumns}
            disabled={!onOpenColumns}
          >
            <Columns3 aria-hidden="true" size={15} />
            Columns
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onOpenExport}
            disabled={!onOpenExport}
          >
            <Download aria-hidden="true" size={15} />
            Export
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onOpenImport}
            disabled={!onOpenImport}
          >
            <Upload aria-hidden="true" size={15} />
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

      {error ? (
        <div className="surface-error" role="alert">
          {error}
        </div>
      ) : null}
      {loading ? (
        <div className="surface-state table-loading-state" role="status">
          <Loader2 aria-hidden="true" className="table-spinner" size={18} />
          Loading records...
        </div>
      ) : null}

      {!loading && sortedData.length === 0 ? (
        <>{emptyState ?? <div className="empty-state">No records found.</div>}</>
      ) : null}

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
                      {renderSortIcon(column)}
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
          Showing {startRecord} to {endRecord} of {total} results
        </span>
        <div className="table-pagination-controls">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onPageChange?.(page - 1)}
            disabled={!onPageChange || page <= 1}
            aria-label="Previous page"
          >
            <ChevronLeft aria-hidden="true" size={15} />
          </Button>
          <span className="table-page-current">
            Page {page} of {pageCount}
          </span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onPageChange?.(page + 1)}
            disabled={!onPageChange || page >= pageCount}
            aria-label="Next page"
          >
            <ChevronRight aria-hidden="true" size={15} />
          </Button>
          <select aria-label="Rows per page" value={perPage} disabled>
            <option>{perPage} / page</option>
          </select>
        </div>
      </footer>

      <div className="column-visibility-inline" hidden>
        {columns.map((column) => (
          <label key={column.id}>
            <input
              type="checkbox"
              checked={!hiddenColumns.includes(column.id)}
              disabled={column.enableHiding === false}
              onChange={() => toggleColumn(column)}
            />
            {column.header}
          </label>
        ))}
      </div>
    </section>
  );
}
