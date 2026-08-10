import { useEffect, useMemo, useState } from 'react';
import { Archive, Copy, MoreHorizontal, Plus, RefreshCw, Trash2 } from 'lucide-react';

import { DataTable } from '@/shared/components/data-table';
import { PageHeader } from '@/shared/components/layout';
import { Button, PermissionButton } from '@/shared/components/ui';
import { BulkActionBar } from '@/shared/components/data-table';
import {
  AdvancedFiltersDrawer,
  ColumnManagerModal,
  SavedViewsModal
} from '@/shared/components/workflows';
import { EnterpriseModalActions } from '@/shared/module-pages/components/EnterpriseModalActions';
import { useEnterpriseListState } from '@/shared/module-pages/hooks/useEnterpriseListState';
import type {
  EnterpriseActionKey,
  EnterpriseModuleAdapter,
  EnterpriseRecord
} from '@/shared/module-pages/types';
import type { FieldValues } from 'react-hook-form';

type EnterpriseListPageProps<TRow extends EnterpriseRecord, TForm extends FieldValues> = {
  adapter: EnterpriseModuleAdapter<TRow, TForm>;
  onCreate: () => void;
  onView: (record: TRow) => void;
  onEdit: (record: TRow) => void;
};

export function EnterpriseListPage<TRow extends EnterpriseRecord, TForm extends FieldValues>({
  adapter,
  onCreate,
  onView,
  onEdit
}: EnterpriseListPageProps<TRow, TForm>) {
  const listState = useEnterpriseListState();
  const [records, setRecords] = useState<TRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [drawer, setDrawer] = useState<'filters' | null>(null);
  const [modal, setModal] = useState<'columns' | 'views' | EnterpriseActionKey | null>(null);
  const [hiddenColumnIds, setHiddenColumnIds] = useState<string[]>([]);

  const columns = useMemo(
    () => [
      ...adapter.columns,
      {
        id: 'actions',
        header: 'Actions',
        enableHiding: false,
        cell: (row: TRow) => (
          <div className="row-action-menu">
            <Button type="button" size="sm" variant="ghost" onClick={() => onView(row)}>
              View
            </Button>
            <PermissionButton
              guard={adapter.guard}
              permission={adapter.permissions?.edit ?? ''}
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => onEdit(row)}
            >
              Edit
            </PermissionButton>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setModal('activity')}
              aria-label="Open row action menu"
            >
              <MoreHorizontal size={16} aria-hidden="true" />
            </Button>
          </div>
        )
      }
    ],
    [adapter, onEdit, onView]
  );

  async function loadRecords() {
    setLoading(true);
    setError('');
    try {
      const response = await adapter.list(listState);
      setRecords(response.data);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load records.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRecords();
  }, [listState.page, listState.search, listState.sort]);

  async function handleDelete() {
    if (!adapter.remove || listState.selectedIds.length === 0) return;
    await adapter.remove(listState.selectedIds);
    listState.clearSelection();
    await loadRecords();
  }

  const bulkActions = (
    <BulkActionBar
      selectedCount={listState.selectedIds.length}
      onClear={listState.clearSelection}
      actions={
        <div className="table-actions">
          <Button type="button" size="sm" variant="secondary" onClick={() => setModal('assign')}>
            Assign
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={() => setModal('status')}>
            Status
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={() => setModal('clone')}>
            <Copy size={14} aria-hidden="true" />
            Clone
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={() => setModal('archive')}>
            <Archive size={14} aria-hidden="true" />
            Archive
          </Button>
          <Button type="button" size="sm" variant="danger" onClick={() => setModal('delete')}>
            <Trash2 size={14} aria-hidden="true" />
            Delete
          </Button>
        </div>
      }
    />
  );

  return (
    <section className="enterprise-module-page">
      <PageHeader
        eyebrow={adapter.guard}
        title={adapter.label}
        description="Reusable enterprise list pattern with search, filters, views, exports, bulk actions, sorting, columns, row actions, and activity."
        actions={
          <>
            <Button type="button" variant="secondary" onClick={loadRecords}>
              <RefreshCw size={16} aria-hidden="true" />
              Refresh
            </Button>
            <PermissionButton
              guard={adapter.guard}
              permission={adapter.permissions?.create ?? ''}
              type="button"
              onClick={onCreate}
            >
              <Plus size={16} aria-hidden="true" />
              Create
            </PermissionButton>
          </>
        }
      />

      <DataTable
        columns={columns}
        data={records}
        getRowId={adapter.getRowId}
        loading={loading}
        error={error}
        searchValue={listState.search}
        onSearchChange={listState.setSearch}
        hiddenColumnIds={hiddenColumnIds}
        onHiddenColumnIdsChange={setHiddenColumnIds}
        onOpenFilters={() => setDrawer('filters')}
        onOpenColumns={() => setModal('columns')}
        onOpenSavedViews={() => setModal('views')}
        onOpenExport={() => setModal('export')}
        onOpenImport={() => setModal('import')}
        selectedRowIds={listState.selectedIds}
        onSelectionChange={listState.setSelectedIds}
        bulkActions={bulkActions}
        page={listState.page}
        perPage={listState.perPage}
        total={total}
        onPageChange={listState.setPage}
      />

      <AdvancedFiltersDrawer
        open={drawer === 'filters'}
        onClose={() => setDrawer(null)}
        guard={adapter.guard}
        permission={adapter.permissions?.view}
        fields={[
          {
            name: 'status',
            label: 'Status',
            input: (
              <select>
                <option>Any status</option>
                <option>Active</option>
                <option>Archived</option>
              </select>
            )
          },
          { name: 'updated_at', label: 'Updated after', input: <input type="date" /> }
        ]}
        onApply={() => setDrawer(null)}
        onReset={() => undefined}
      />
      <SavedViewsModal
        open={modal === 'views'}
        onClose={() => setModal(null)}
        guard={adapter.guard}
        permission={adapter.permissions?.view}
        views={[
          { id: 'all', name: 'All records', visibility: 'shared', isDefault: true },
          { id: 'mine', name: 'My open records', visibility: 'personal' }
        ]}
        activeViewId="all"
        onSelect={() => setModal(null)}
        onSaveCurrent={() => setModal(null)}
      />
      <ColumnManagerModal
        open={modal === 'columns'}
        onClose={() => setModal(null)}
        guard={adapter.guard}
        permission={adapter.permissions?.view}
        columns={columns.map((column) => ({
          id: column.id,
          label: column.header,
          visible: !hiddenColumnIds.includes(column.id),
          locked: column.enableHiding === false
        }))}
        onToggle={(id) =>
          setHiddenColumnIds((current) =>
            current.includes(id) ? current.filter((columnId) => columnId !== id) : [...current, id]
          )
        }
        onReset={() => setHiddenColumnIds([])}
        onSave={() => setModal(null)}
      />
      <EnterpriseModalActions
        guard={adapter.guard}
        permission={adapter.permissions?.edit}
        active={modal as EnterpriseActionKey | null}
        selectedCount={listState.selectedIds.length}
        onClose={() => setModal(null)}
        onConfirm={(action) => {
          if (action === 'delete') void handleDelete();
        }}
      />
    </section>
  );
}
