import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  CalendarPlus2,
  CheckCircle2,
  Download,
  FileText,
  LayoutGrid,
  Plus,
  ReceiptText,
  RefreshCw,
  Settings,
  SlidersHorizontal
} from 'lucide-react';

import { tenantQueryKeys } from '@/features/tenant/api/tenantQueryKeys';
import { tenantWorkspaceApi, type TenantRecord } from '@/features/tenant/api/tenantWorkspaceApi';
import { ApiError } from '@/lib/api/apiError';
import { createListQuery } from '@/lib/api/listQuery';
import { DataTable, type DataTableColumn } from '@/shared/components/data-table';
import { AppDrawer } from '@/shared/components/drawer';
import { PageHeader, StatusBadge, Tabs } from '@/shared/components/layout';
import { AppModal } from '@/shared/components/modal';
import { Button, PermissionButton } from '@/shared/components/ui';

type DashboardModal = 'widgetLibrary' | 'widgetSettings' | 'quickActions' | 'notifications' | 'activity' | 'export' | null;

const chartCodes = ['leads-pipeline', 'projects', 'tasks', 'revenue', 'attendance', 'support'];
const widgetCodes = ['my-tasks', 'upcoming-events', 'recent-leads', 'overdue-invoices'];
const tenantKey = 'current';

export function TenantDashboardPage() {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<DashboardModal>(null);
  const [selectedRecord, setSelectedRecord] = useState<TenantRecord | null>(null);
  const summaryQuery = useQuery({ queryKey: tenantQueryKeys.dashboard(tenantKey, 'summary'), queryFn: tenantWorkspaceApi.dashboard.summary });
  const widgetsQuery = useQuery({ queryKey: tenantQueryKeys.dashboard(tenantKey, 'widgets'), queryFn: tenantWorkspaceApi.dashboard.widgets });
  const exportMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => tenantWorkspaceApi.dashboard.export(payload),
    onSuccess: () => setModal(null)
  });
  const saveWidgets = useMutation({
    mutationFn: (widgets: Record<string, unknown>[]) => tenantWorkspaceApi.dashboard.updateWidgets(widgets),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tenantQueryKeys.dashboard(tenantKey, 'widgets') });
      setModal(null);
    }
  });
  const summaryPayload = summaryQuery.data?.data ?? {};
  const summary = (summaryPayload.summary && typeof summaryPayload.summary === 'object' ? summaryPayload.summary : summaryPayload) as Record<string, unknown>;

  return (
    <section className="enterprise-module-page tenant-dashboard-page">
      <PageHeader
        title="Tenant Dashboard"
        description="Workspace summary, widgets, recent records, notifications, activity, and quick actions."
        actions={
          <>
            <Button type="button" variant="secondary" onClick={() => setModal('quickActions')}><Plus size={16} aria-hidden />Quick Actions</Button>
            <Button type="button" variant="secondary" onClick={() => setModal('notifications')}><Bell size={16} aria-hidden />Notifications</Button>
            <PermissionButton guard="tenant" permission="dashboard.customize" type="button" variant="secondary" onClick={() => setModal('widgetLibrary')}><LayoutGrid size={16} aria-hidden />Widgets</PermissionButton>
            <Button type="button" onClick={() => setModal('export')}><Download size={16} aria-hidden />Export</Button>
          </>
        }
      />
      <SummaryGrid payload={summary} />
      <section className="dashboard-grid">
        {chartCodes.map((chart) => <ChartWidget key={chart} code={chart} />)}
      </section>
      <DashboardTables onOpenActivity={(record) => { setSelectedRecord(record); setModal('activity'); }} />
      <DashboardSurfaces
        modal={modal}
        selectedRecord={selectedRecord}
        widgets={widgetsQuery.data?.data}
        exportLoading={exportMutation.isPending}
        exportError={exportMutation.error}
        onClose={() => setModal(null)}
        onExport={(payload) => exportMutation.mutate(payload)}
        onSaveWidgets={(widgets) => saveWidgets.mutate(widgets)}
      />
    </section>
  );
}

export function TenantMyDashboardPage() {
  return <TenantDashboardPage />;
}

function SummaryGrid({ payload }: { payload: Record<string, unknown> }) {
  const cards = flattenSummary(payload);
  if (cards.length === 0) return <div className="empty-state">Dashboard summary is ready; no KPI records were returned.</div>;
  return (
    <div className="summary-grid">
      {cards.slice(0, 12).map((card) => (
        <article className="summary-card" key={card.label}>
          <span>{card.label}</span>
          <strong>{String(card.value ?? '-')}</strong>
        </article>
      ))}
    </div>
  );
}

function ChartWidget({ code }: { code: string }) {
  const query = useQuery({ queryKey: tenantQueryKeys.dashboard(tenantKey, `chart-${code}`), queryFn: () => tenantWorkspaceApi.dashboard.chart(code) });
  const rows = extractRows(query.data?.data);
  return (
    <article className="chart-card">
      <header>
        <h3>{label(code)}</h3>
        <StatusBadge tone={query.isError ? 'danger' : 'success'}>{query.isError ? 'Unavailable' : 'Live'}</StatusBadge>
      </header>
      {query.isLoading ? <div className="surface-state">Loading chart...</div> : null}
      {!query.isLoading && rows.length === 0 ? <div className="empty-state">No chart data.</div> : null}
      <div className="mini-bars">
        {rows.slice(0, 6).map((row, index) => {
          const value = Number(row.total ?? row.count ?? row.value ?? 0);
          return <div key={index} style={{ height: `${Math.max(0, Math.min(100, value))}%` }} title={JSON.stringify(row)} />;
        })}
      </div>
    </article>
  );
}

function DashboardTables({ onOpenActivity }: { onOpenActivity: (record: TenantRecord) => void }) {
  const [activeTab, setActiveTab] = useState(widgetCodes[0]);
  const [page, setPage] = useState(1);
  const queryParams = createListQuery({ page, per_page: 10 });
  const query = useQuery({
    queryKey: tenantQueryKeys.dashboard(tenantKey, `table-${activeTab}`, queryParams),
    queryFn: () => activeTab === 'recent-activities' ? tenantWorkspaceApi.dashboard.recentActivities(queryParams) : tenantWorkspaceApi.dashboard.table(activeTab, queryParams)
  });
  const columns = useMemo(() => genericColumns(query.data?.data ?? [], onOpenActivity), [onOpenActivity, query.data?.data]);

  return (
    <section className="settings-panel">
      <Tabs
        tabs={[...widgetCodes, 'recent-activities'].map((code) => ({ id: code, label: label(code) }))}
        activeId={activeTab}
        ariaLabel="Dashboard widgets"
        onChange={(next) => {
          setActiveTab(next);
          setPage(1);
        }}
      />
      <DataTable
        columns={columns}
        data={query.data?.data ?? []}
        getRowId={idOf}
        loading={query.isLoading}
        error={query.isError ? errorMessage(query.error) : ''}
        page={page}
        perPage={10}
        total={query.data?.total ?? query.data?.data.length ?? 0}
        onPageChange={setPage}
      />
    </section>
  );
}

function DashboardSurfaces({
  modal,
  selectedRecord,
  widgets,
  exportLoading,
  exportError,
  onClose,
  onExport,
  onSaveWidgets
}: {
  modal: DashboardModal;
  selectedRecord: TenantRecord | null;
  widgets: unknown;
  exportLoading: boolean;
  exportError: unknown;
  onClose: () => void;
  onExport: (payload: Record<string, unknown>) => void;
  onSaveWidgets: (widgets: Record<string, unknown>[]) => void;
}) {
  const [exportFormat, setExportFormat] = useState('csv');
  if (!modal) return null;
  if (modal === 'quickActions') {
    return (
      <AppModal open onClose={onClose} title="Quick Actions" guard="tenant" permission="dashboard.view" footer={<Button type="button" variant="secondary" onClick={onClose}>Close</Button>}>
        <div className="quick-action-grid">
          <PermissionButton guard="tenant" permission="lead.create" type="button"><Plus size={16} aria-hidden />Lead</PermissionButton>
          <PermissionButton guard="tenant" permission="client.create" type="button"><Plus size={16} aria-hidden />Client</PermissionButton>
          <PermissionButton guard="tenant" permission="task.create" type="button"><CheckCircle2 size={16} aria-hidden />Task</PermissionButton>
          <PermissionButton guard="tenant" permission="project.create" type="button"><FileText size={16} aria-hidden />Project</PermissionButton>
          <PermissionButton guard="tenant" permission="finance.invoice.create" type="button"><ReceiptText size={16} aria-hidden />Invoice</PermissionButton>
          <PermissionButton guard="tenant" permission="calendar.create" type="button"><CalendarPlus2 size={16} aria-hidden />Event</PermissionButton>
        </div>
      </AppModal>
    );
  }
  if (modal === 'widgetLibrary' || modal === 'widgetSettings') {
    return <WidgetLibrary open onClose={onClose} widgets={widgets} onSave={onSaveWidgets} />;
  }
  if (modal === 'notifications') return <TenantNotificationsDrawer open onClose={onClose} />;
  if (modal === 'activity') {
    return (
      <AppDrawer open onClose={onClose} title="Recent Activity Compare" guard="tenant" permission="activity_log.view" size="lg">
        <pre className="json-preview">{JSON.stringify(selectedRecord ?? {}, null, 2)}</pre>
      </AppDrawer>
    );
  }
  return (
    <AppModal
      open
      onClose={onClose}
      title="Export Dashboard"
      guard="tenant"
      permission="dashboard.view"
      loading={exportLoading}
      error={exportError ? errorMessage(exportError) : null}
      footer={<><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="button" onClick={() => onExport({ format: exportFormat, widgets: ['summary', 'revenue'] })}>Export</Button></>}
    >
      <label>
        <span>Format</span>
        <select value={exportFormat} onChange={(event) => setExportFormat(event.target.value)}>
          <option value="csv">csv</option>
          <option value="xlsx">xlsx</option>
          <option value="pdf">pdf</option>
        </select>
      </label>
    </AppModal>
  );
}

function WidgetLibrary({ open, widgets, onClose, onSave }: { open: boolean; widgets: unknown; onClose: () => void; onSave: (widgets: Record<string, unknown>[]) => void }) {
  const [selected, setSelected] = useState(['my_tasks', 'calendar', 'notifications']);
  const available = ['my_tasks', 'my_leads', 'my_projects', 'my_issues', 'calendar', 'reminders', 'attendance', 'leave_balance', 'notifications', 'recent_files'];
  return (
    <AppModal open={open} onClose={onClose} title="Widget Library" guard="tenant" permission="dashboard.customize" footer={<><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="button" onClick={() => onSave(selected.map((code, index) => ({ code, position: index + 1, visible: true, settings: { limit: 10 } })))}>Save Layout</Button></>}>
      <div className="surface-state">Current layout: {JSON.stringify(widgets ?? {})}</div>
      <div className="settings-list">
        {available.map((code) => (
          <label key={code} className="check-row">
            <input type="checkbox" checked={selected.includes(code)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, code] : current.filter((item) => item !== code))} />
            <span>{label(code)}</span>
            <Button type="button" size="sm" variant="ghost"><SlidersHorizontal size={14} aria-hidden />Settings</Button>
          </label>
        ))}
      </div>
    </AppModal>
  );
}

export function TenantNotificationsDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<TenantRecord | null>(null);
  const query = useQuery({ queryKey: tenantQueryKeys.resource(tenantKey, 'notifications'), queryFn: () => tenantWorkspaceApi.notifications.list({ per_page: 25 }) });
  const mutation = useMutation({
    mutationFn: ({ action, id }: { action: 'read' | 'unread' | 'delete' | 'bulk'; id?: string | number }) => {
      if (action === 'read' && id) return tenantWorkspaceApi.notifications.read(id);
      if (action === 'unread' && id) return tenantWorkspaceApi.notifications.unread(id);
      if (action === 'delete' && id) return tenantWorkspaceApi.notifications.delete(id);
      return tenantWorkspaceApi.notifications.bulkRead([]);
    },
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: tenantQueryKeys.resource(tenantKey, 'notifications') })
  });
  return (
    <AppDrawer open={open} onClose={onClose} title="Notifications Center" guard="tenant" permission="notification.view" size="lg">
      <div className="table-actions">
        <Button type="button" variant="secondary" onClick={() => mutation.mutate({ action: 'bulk' })}>Mark all read</Button>
        <Button type="button" variant="secondary" onClick={() => void query.refetch()}><RefreshCw size={16} aria-hidden />Refresh</Button>
      </div>
      <div className="record-list">
        {(query.data?.data ?? []).map((notification) => (
          <article key={idOf(notification)}>
            <strong>{String(notification.title ?? notification.type ?? 'Notification')}</strong>
            <p>{String(notification.message ?? notification.body ?? notification.created_at ?? '-')}</p>
            <div className="inline-actions">
              <Button type="button" size="sm" variant="secondary" onClick={() => setSelected(notification)}>Open</Button>
              <Button type="button" size="sm" variant="secondary" onClick={() => mutation.mutate({ action: notification.read_at ? 'unread' : 'read', id: notification.id })}>{notification.read_at ? 'Unread' : 'Read'}</Button>
              <Button type="button" size="sm" variant="danger" onClick={() => mutation.mutate({ action: 'delete', id: notification.id })}>Delete</Button>
            </div>
          </article>
        ))}
      </div>
      {selected ? (
        <AppDrawer open onClose={() => setSelected(null)} title="Notification Detail" guard="tenant" permission="notification.view" size="md">
          <pre className="json-preview">{JSON.stringify(selected, null, 2)}</pre>
        </AppDrawer>
      ) : null}
    </AppDrawer>
  );
}

function genericColumns(rows: TenantRecord[], onOpenActivity: (record: TenantRecord) => void): DataTableColumn<TenantRecord>[] {
  const keys = Object.keys(rows[0] ?? {}).filter((key) => !['metadata', 'payload', 'old_values', 'new_values'].includes(key)).slice(0, 6);
  const safeKeys = keys.length > 0 ? keys : ['title', 'status', 'created_at'];
  return [
    ...safeKeys.map((key) => ({
      id: key,
      header: label(key),
      cell: (row: TenantRecord) => key.includes('status') ? <StatusBadge>{printable(row[key])}</StatusBadge> : printable(row[key])
    })),
    { id: 'actions', header: 'Actions', enableHiding: false, cell: (row) => <Button type="button" size="sm" variant="secondary" onClick={() => onOpenActivity(row)}>Open</Button> }
  ];
}

function flattenSummary(payload: Record<string, unknown>) {
  const rows: Array<{ label: string; value: unknown }> = [];
  for (const [group, value] of Object.entries(payload)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      for (const [key, nested] of Object.entries(value as Record<string, unknown>)) rows.push({ label: `${label(group)} ${label(key)}`, value: nested });
    } else {
      rows.push({ label: label(group), value });
    }
  }
  return rows;
}

function extractRows(payload: unknown): TenantRecord[] {
  if (Array.isArray(payload)) return payload as TenantRecord[];
  if (!payload || typeof payload !== 'object') return [];
  const record = payload as Record<string, unknown>;
  if (record.chart && typeof record.chart === 'object' && Array.isArray((record.chart as Record<string, unknown>).series)) {
    return (record.chart as { series: TenantRecord[] }).series;
  }
  if (Array.isArray(record.series)) return record.series as TenantRecord[];
  for (const value of Object.values(payload as Record<string, unknown>)) {
    if (Array.isArray(value)) return value as TenantRecord[];
  }
  return [];
}

function idOf(record: TenantRecord) {
  return String(record.uuid ?? record.id ?? record.code ?? JSON.stringify(record).slice(0, 40));
}

function printable(value: unknown) {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'object') return JSON.stringify(value).slice(0, 80);
  return String(value);
}

function label(value: string) {
  return value.replace(/[-_]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function errorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Request failed.';
}
