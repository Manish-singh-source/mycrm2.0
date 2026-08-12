import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DataTable, type DataTableColumn } from './DataTable';

type Row = { id: string; name: string; status: string };

const columns: DataTableColumn<Row>[] = [
  { id: 'name', header: 'Name', accessor: (row) => row.name, cell: (row) => row.name, enableSorting: true },
  { id: 'status', header: 'Status', accessor: (row) => row.status, cell: (row) => row.status }
];

describe('DataTable', () => {
  it('renders rows, search, selection, sorting, and pagination controls', async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();
    const onSelectionChange = vi.fn();
    const onPageChange = vi.fn();

    render(
      <DataTable
        columns={columns}
        data={[
          { id: '2', name: 'Beta', status: 'inactive' },
          { id: '1', name: 'Acme', status: 'active' }
        ]}
        getRowId={(row) => row.id}
        searchValue=""
        onSearchChange={onSearchChange}
        selectedRowIds={[]}
        onSelectionChange={onSelectionChange}
        page={1}
        perPage={1}
        total={2}
        onPageChange={onPageChange}
      />
    );

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'acme' } });
    expect(onSearchChange).toHaveBeenLastCalledWith('acme');

    await user.click(screen.getByRole('checkbox', { name: 'Select row 1' }));
    expect(onSelectionChange).toHaveBeenCalledWith(['1']);

    await user.click(screen.getByRole('button', { name: /name/i }));
    const rows = screen.getAllByRole('row');
    expect(within(rows[1]).getByText('Acme')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next page' }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('announces loading, errors, and empty states', () => {
    const { rerender } = render(<DataTable columns={columns} data={[]} getRowId={(row) => row.id} loading />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading records');

    rerender(<DataTable columns={columns} data={[]} getRowId={(row) => row.id} error="Could not load" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load');
    expect(screen.getByText('No records found.')).toBeInTheDocument();
  });
});
