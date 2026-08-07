import type { ReactNode } from 'react';

export type DataTableColumn<TRow> = {
  id: string;
  header: ReactNode;
  cell: (row: TRow) => ReactNode;
  enableSorting?: boolean;
  enableHiding?: boolean;
};

type DataTableProps<TRow> = {
  columns: DataTableColumn<TRow>[];
  data: TRow[];
  getRowId: (row: TRow) => string;
  emptyState?: ReactNode;
};

export function DataTable<TRow>({ columns, data, getRowId, emptyState }: DataTableProps<TRow>) {
  if (data.length === 0) {
    return <div className="empty-state">{emptyState ?? 'No records found.'}</div>;
  }

  return (
    <div className="data-table" role="region">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.id}>{column.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={getRowId(row)}>
              {columns.map((column) => (
                <td key={column.id}>{column.cell(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
