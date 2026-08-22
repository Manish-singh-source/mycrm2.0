import { useMemo, useState, type ReactNode } from 'react';
import {
  AlertTriangle,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  Download,
  Plus,
  ShieldAlert,
  Users
} from 'lucide-react';
import type { UseQueryResult } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

import {
  usePlatformDashboardMutations,
  usePlatformDashboardQueries
} from '@/features/platform/dashboard/api/usePlatformDashboardQueries';
import type {
  DashboardChartPoint,
  DashboardDateRange,
  DashboardTableRow
} from '@/features/platform/dashboard/api/platformDashboardApi';
import { DataTable, type DataTableColumn } from '@/shared/components/data-table';
import { AppDrawer } from '@/shared/components/drawer';
import { AppModal } from '@/shared/components/modal';
import { PermissionButton, Button } from '@/shared/components/ui';

type DashboardDialog = 'date' | 'export' | 'incident' | 'security-review' | null;
type DashboardDrawer = 'alert' | 'failed-job' | null;
type DashboardChartDatum = {
  label: string;
  value: number;
  revenue?: number;
  failed?: number;
  success?: number;
  storage?: number;
  api?: number;
};

const palette = ['#2563eb', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#0891b2'];

function rowsFrom(query: UseQueryResult<{ data?: DashboardTableRow[] }>) {
  return Array.isArray(query.data?.data) ? query.data.data : [];
}

function chartFrom(query: UseQueryResult<{ data?: DashboardChartPoint[] }>) {
  const rows = Array.isArray(query.data?.data) ? query.data.data : [];

  return rows.map((row, index) => ({
    label: String(row.month ?? row.period ?? row.date ?? row.label ?? row.name ?? row.status ?? row.plan_name ?? `#${index + 1}`),
    value: Number(row.value ?? row.count ?? row.total ?? row.tenants ?? row.active ?? row.quantity ?? 0),
    revenue: Number(row.revenue ?? row.amount ?? row.total_amount ?? row.collected ?? row.value ?? 0),
    failed: Number(row.failed ?? row.failed_count ?? row.failed_payments ?? row.failures ?? 0),
    success: Number(row.success ?? row.success_count ?? row.successful ?? row.paid ?? row.value ?? 0),
    storage: Number(row.storage ?? row.storage_tb ?? row.storage_gb ?? row.storage_used ?? 0),
    api: Number(row.api ?? row.api_requests ?? row.requests ?? row.request_count ?? row.value ?? 0)
  }));
}

function valueAt(source: unknown, path: string, fallback: string | number = '-') {
  const value = path.split('.').reduce<unknown>((current, part) => {
    if (!current || typeof current !== 'object') return undefined;
    return (current as Record<string, unknown>)[part];
  }, source);

  if (value === undefined || value === null || value === '') return fallback;
  return value as string | number;
}

function money(value: unknown, currency = 'INR') {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return String(value ?? '-');
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency || 'INR',
    maximumFractionDigits: 2
  }).format(amount);
}

function labelOf(row: DashboardTableRow, keys: string[], fallback = '-') {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && value !== '') return String(value);
  }
  return fallback;
}

function rowId(row: DashboardTableRow) {
  return labelOf(row, ['uuid', 'id', 'job_id', 'event_id', 'alert_id', 'incident_uuid'], String(Math.random()));
}

function statusClass(value: string) {
  const normalized = value.toLowerCase();
  if (normalized.includes('active') || normalized.includes('success') || normalized.includes('paid')) {
    return 'dashboard-status dashboard-status--green';
  }
  if (normalized.includes('critical') || normalized.includes('failed') || normalized.includes('overdue') || normalized.includes('high')) {
    return 'dashboard-status dashboard-status--red';
  }
  if (normalized.includes('warning') || normalized.includes('medium') || normalized.includes('trial')) {
    return 'dashboard-status dashboard-status--orange';
  }
  return 'dashboard-status dashboard-status--blue';
}

export function PlatformDashboardPage() {
  const [range, setRange] = useState<DashboardDateRange>({
    date_from: '2026-08-01',
    date_to: '2026-08-08'
  });
  const [draftRange, setDraftRange] = useState(range);
  const [dialog, setDialog] = useState<DashboardDialog>(null);
  const [drawer, setDrawer] = useState<DashboardDrawer>(null);
  const [selectedRow, setSelectedRow] = useState<DashboardTableRow | null>(null);
  const [exportFormat, setExportFormat] = useState('xlsx');
  const [incidentTitle, setIncidentTitle] = useState('');
  const [incidentSeverity, setIncidentSeverity] = useState('major');
  const [reviewStatus, setReviewStatus] = useState('reviewed');
  const [reviewNotes, setReviewNotes] = useState('');

  const queries = usePlatformDashboardQueries(range);
  const mutations = usePlatformDashboardMutations(range);
  const summary = queries.summary.data?.data;
  const currency = String(valueAt(summary, 'revenue.currency', 'INR'));
  const tenantGrowth = chartFrom(queries.tenantGrowth);
  const revenue = chartFrom(queries.revenue);
  const subscriptionStatus = chartFrom(queries.subscriptionStatus);
  const planDistribution = chartFrom(queries.planDistribution);
  const usage = chartFrom(queries.usage);
  const paymentTrend = chartFrom(queries.paymentTrend);
  const activeAlerts = rowsFrom(queries.activeAlerts);
  const failedJobs = rowsFrom(queries.failedJobs);
  const securityEvents = rowsFrom(queries.securityEvents);

  const kpis = useMemo(
    () => [
      ['Total Tenants', valueAt(summary, 'tenants.total', 0), '+ 8.6%', Users, 'blue'],
      ['Active Tenants', valueAt(summary, 'tenants.active', 0), '+ 6.2%', Users, 'blue'],
      ['Trial Tenants', valueAt(summary, 'tenants.trial', 0), '+ 3.6%', BriefcaseBusiness, 'green'],
      ['Suspended Tenants', valueAt(summary, 'tenants.suspended', 0), '- 2.6%', ShieldAlert, 'red'],
      ['Expired Tenants', valueAt(summary, 'tenants.expired', 0), '+ 4.7%', CalendarDays, 'slate'],
      ['New Today', valueAt(summary, 'tenants.new_today', 0), '+ 20.8%', Plus, 'blue'],
      ['MRR', money(valueAt(summary, 'revenue.mrr', 0), currency), '+ 7.3%', Bell, 'green'],
      ['ARR', money(valueAt(summary, 'revenue.arr', 0), currency), '+ 7.9%', Bell, 'blue'],
      ['Overdue Invoices', valueAt(summary, 'billing.overdue_invoice_count', 0), '- 5.4%', AlertTriangle, 'orange'],
      ['Overdue Balance', money(valueAt(summary, 'billing.overdue_balance', 0), currency), '- 3.1%', AlertTriangle, 'red'],
      ['Active Incidents', valueAt(summary, 'operations.open_incidents', rowsFrom(queries.incidents).length), '- 12.5%', AlertTriangle, 'orange'],
      ['Failed Jobs', valueAt(summary, 'operations.failed_queue_jobs', failedJobs.length), '- 21.4%', ShieldAlert, 'red']
    ] as const,
    [currency, failedJobs.length, queries.incidents.data, summary]
  );

  function openRowDrawer(nextDrawer: DashboardDrawer, row: DashboardTableRow) {
    setSelectedRow(row);
    setDrawer(nextDrawer);
  }

  function openSecurityReview(row: DashboardTableRow) {
    setSelectedRow(row);
    setDialog('security-review');
  }

  return (
    <section className="dashboard-page">
      <header className="dashboard-head">
        <div>
          <h1>Platform Dashboard</h1>
          <p>Home / Dashboard / {range.date_from} to {range.date_to}</p>
        </div>
        <div className="dashboard-head__tools">
          {/* <label className="dashboard-search">
            <Search size={16} aria-hidden="true" />
            <input placeholder="Search tenants, users, invoices..." />
          </label> */}
          <Button type="button" variant="secondary" size="sm" onClick={() => setDialog('date')}>
            <CalendarDays size={16} aria-hidden="true" />
            Date range
          </Button>
          <PermissionButton guard="platform" permission="dashboard.view" type="button" variant="secondary" size="sm" onClick={() => setDialog('export')}>
            <Download size={16} aria-hidden="true" />
            Export Snapshot
          </PermissionButton>
        </div>
      </header>


      <QueryPanel query={queries.summary}>
        <section className="dashboard-kpis" aria-label="Key performance indicators">
          {kpis.map(([label, value, trend, Icon, tone]) => (
            <article className="dashboard-kpi" key={label}>
              <span className={`dashboard-kpi__icon dashboard-kpi__icon--${tone}`}>
                <Icon size={22} aria-hidden="true" />
              </span>
              <div>
                <p>{label}</p>
                <strong>{value}</strong>
              </div>
              <em className={trend.startsWith('-') ? 'is-down' : ''}>{trend}</em>
            </article>
          ))}
        </section>
      </QueryPanel>

      <section className="dashboard-grid dashboard-grid--charts">
        <DashboardChartPanel title="Tenant Growth by Month" query={queries.tenantGrowth}>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={tenantGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8edf5" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </DashboardChartPanel>

        <DashboardChartPanel title="Revenue by Month" query={queries.revenue}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8edf5" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip />
              <Bar dataKey="revenue" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </DashboardChartPanel>

        <DashboardDonutPanel title="Subscription Status Distribution" query={queries.subscriptionStatus} data={subscriptionStatus} />
        <DashboardDonutPanel title="Plan Distribution" query={queries.planDistribution} data={planDistribution} />
      </section>

      <section className="dashboard-grid dashboard-grid--wide">
        <DashboardChartPanel title="API Usage Trend" query={queries.usage}>
          <ResponsiveContainer width="100%" height={190}>
            <LineChart data={usage}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8edf5" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip />
              <Line type="monotone" dataKey="api" stroke="#2563eb" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </DashboardChartPanel>
        <DashboardChartPanel title="Storage Usage Trend" query={queries.usage}>
          <ResponsiveContainer width="100%" height={190}>
            <LineChart data={usage}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8edf5" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip />
              <Line type="monotone" dataKey="storage" stroke="#22c55e" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </DashboardChartPanel>
        <DashboardChartPanel title="Payment Success/Failure Trend" query={queries.paymentTrend}>
          <ResponsiveContainer width="100%" height={190}>
            <LineChart data={paymentTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8edf5" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip />
              <Line type="monotone" dataKey="success" stroke="#22c55e" strokeWidth={3} />
              <Line type="monotone" dataKey="failed" stroke="#ef4444" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </DashboardChartPanel>
      </section>

      <section className="dashboard-grid dashboard-grid--tables">
        <DashboardTable
          title="Recent Tenants"
          query={queries.recentTenants}
          columns={['Organization', 'Slug', 'Owner', 'Plan', 'Status', 'Created']}
          renderRow={(row) => [
            labelOf(row, ['organization_name', 'name', 'tenant']),
            labelOf(row, ['slug']),
            labelOf(row, ['owner', 'owner_name', 'owner_email']),
            labelOf(row, ['current_plan', 'plan', 'plan_name']),
            labelOf(row, ['subscription_status', 'status', 'tenant_status']),
            labelOf(row, ['created_at'])
          ]}
        />
        <DashboardTable
          title="Recent Payments"
          query={queries.recentPayments}
          columns={['Payment #', 'Tenant', 'Amount', 'Gateway', 'Status', 'Paid At']}
          renderRow={(row) => [
            labelOf(row, ['payment_number', 'number', 'uuid']),
            labelOf(row, ['organization_name', 'tenant', 'tenant_name']),
            money(row.amount, String(row.currency ?? currency)),
            labelOf(row, ['gateway']),
            labelOf(row, ['payment_status', 'status']),
            labelOf(row, ['paid_at'])
          ]}
        />
        <DashboardTable
          title="Overdue Invoices"
          query={queries.overdueInvoices}
          columns={['Invoice #', 'Tenant', 'Due Date', 'Balance', 'Status']}
          renderRow={(row) => [
            labelOf(row, ['invoice_number', 'number']),
            labelOf(row, ['organization_name', 'tenant', 'tenant_name']),
            labelOf(row, ['due_date']),
            money(row.balance_amount ?? row.balance, String(row.currency ?? currency)),
            labelOf(row, ['status'])
          ]}
        />
        <DashboardTable
          title="Active Alerts"
          query={queries.activeAlerts}
          columns={['Severity', 'Message', 'Status', 'Triggered At']}
          onRowClick={(row) => openRowDrawer('alert', row)}
          renderRow={(row) => [
            labelOf(row, ['severity']),
            labelOf(row, ['message', 'title']),
            labelOf(row, ['status']),
            labelOf(row, ['triggered_at', 'created_at'])
          ]}
        />
        <DashboardTable
          title="Failed Queue Jobs"
          query={queries.failedJobs}
          columns={['Job', 'Queue', 'Attempts', 'Failed At', 'Status']}
          onRowClick={(row) => openRowDrawer('failed-job', row)}
          renderRow={(row) => [
            labelOf(row, ['job', 'job_name', 'name']),
            labelOf(row, ['queue']),
            labelOf(row, ['attempts']),
            labelOf(row, ['failed_at', 'created_at']),
            labelOf(row, ['status'], 'failed')
          ]}
        />
        <DashboardTable
          title="Security Events"
          query={queries.securityEvents}
          columns={['Severity', 'Event', 'Tenant', 'User/IP', 'Created']}
          onRowClick={openSecurityReview}
          renderRow={(row) => [
            labelOf(row, ['severity']),
            labelOf(row, ['event', 'message', 'type']),
            labelOf(row, ['organization_name', 'tenant', 'tenant_name']),
            labelOf(row, ['user_ip', 'ip_address', 'actor']),
            labelOf(row, ['created_at'])
          ]}
        />
      </section>

      <DateRangeModal
        open={dialog === 'date'}
        range={draftRange}
        onChange={setDraftRange}
        onClose={() => setDialog(null)}
        onApply={() => {
          setRange(draftRange);
          setDialog(null);
        }}
      />
      <ExportDashboardModal
        open={dialog === 'export'}
        format={exportFormat}
        onFormatChange={setExportFormat}
        loading={mutations.exportSnapshot.isPending}
        error={mutations.exportSnapshot.error}
        onClose={() => setDialog(null)}
        onExport={() => mutations.exportSnapshot.mutate(exportFormat)}
        result={mutations.exportSnapshot.data?.data}
      />
      <IncidentCreateDrawer
        open={dialog === 'incident'}
        title={incidentTitle}
        severity={incidentSeverity}
        onTitleChange={setIncidentTitle}
        onSeverityChange={setIncidentSeverity}
        loading={mutations.createIncident.isPending}
        error={mutations.createIncident.error}
        onClose={() => setDialog(null)}
        onCreate={() =>
          mutations.createIncident.mutate(
            {
              title: incidentTitle || 'Dashboard incident',
              severity: incidentSeverity,
              status: 'investigating',
              summary: 'Created from Platform Dashboard quick action.'
            },
            { onSuccess: () => setDialog(null) }
          )
        }
      />
      <AlertDetailDrawer open={drawer === 'alert'} row={selectedRow} onClose={() => setDrawer(null)} />
      <FailedJobDrawer
        open={drawer === 'failed-job'}
        row={selectedRow}
        onClose={() => setDrawer(null)}
        retrying={mutations.retryFailedJob.isPending}
        deleting={mutations.deleteFailedJob.isPending}
        onRetry={(id) => mutations.retryFailedJob.mutate(id)}
        onDelete={(id) => mutations.deleteFailedJob.mutate(id, { onSuccess: () => setDrawer(null) })}
      />
      <SecurityReviewModal
        open={dialog === 'security-review'}
        row={selectedRow}
        status={reviewStatus}
        notes={reviewNotes}
        onStatusChange={setReviewStatus}
        onNotesChange={setReviewNotes}
        loading={mutations.reviewSecurityEvent.isPending}
        error={mutations.reviewSecurityEvent.error}
        onClose={() => setDialog(null)}
        onSave={() => {
          if (!selectedRow) return;
          mutations.reviewSecurityEvent.mutate(
            { eventId: rowId(selectedRow), body: { status: reviewStatus, notes: reviewNotes } },
            { onSuccess: () => setDialog(null) }
          );
        }}
      />
    </section>
  );
}

function DashboardChartPanel({ title, query, children }: { title: string; query: UseQueryResult<unknown>; children: ReactNode }) {
  const isEmpty = Array.isArray((query.data as { data?: unknown[] } | undefined)?.data) && (query.data as { data?: unknown[] }).data?.length === 0;

  return (
    <article className="dashboard-panel">
      <header><h2>{title}</h2></header>
      <QueryPanel query={query} empty={`No ${title.toLowerCase()} data found.`}>
        {isEmpty ? <div className="empty-state">No {title.toLowerCase()} data found.</div> : children}
      </QueryPanel>
    </article>
  );
}

function DashboardDonutPanel({ title, query, data }: { title: string; query: UseQueryResult<unknown>; data: Array<{ label: string; value: number }> }) {
  const isEmpty = data.length === 0;

  return (
    <article className="dashboard-panel dashboard-panel--donut">
      <header><h2>{title}</h2></header>
      <QueryPanel query={query} empty={`No ${title.toLowerCase()} data found.`}>
        {isEmpty ? (
          <div className="empty-state">No {title.toLowerCase()} data found.</div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={data} dataKey="value" innerRadius={58} outerRadius={86} paddingAngle={2}>
                  {data.map((item, index) => <Cell key={item.label} fill={palette[index % palette.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="dashboard-legend">
              {data.map((item, index) => (
                <span key={item.label}><i style={{ background: palette[index % palette.length] }} />{item.label}</span>
              ))}
            </div>
          </>
        )}
      </QueryPanel>
    </article>
  );
}

function DashboardTable({
  title,
  query,
  columns,
  renderRow,
  onRowClick
}: {
  title: string;
  query: UseQueryResult<{ data?: DashboardTableRow[] }>;
  columns: string[];
  renderRow: (row: DashboardTableRow) => string[];
  onRowClick?: (row: DashboardTableRow) => void;
}) {
  const rows = rowsFrom(query);
  const dataColumns = useMemo<DataTableColumn<DashboardTableRow>[]>(
    () => {
      const baseColumns = columns.map((column, index) => ({
        id: `${column}-${index}`,
        header: column,
        cell: (row: DashboardTableRow) => {
          const cells = renderRow(row);
          const cell = cells[index] ?? '-';
          if (index === cells.length - 1) return <span className={statusClass(cell)}>{cell}</span>;
          if (index === 0) return <strong>{cell}</strong>;
          return cell;
        }
      }));

      if (!onRowClick) return baseColumns;
      return [
        ...baseColumns,
        {
          id: 'actions',
          header: 'Actions',
          enableHiding: false,
          cell: (row: DashboardTableRow) => <Button type="button" size="sm" variant="ghost" onClick={() => onRowClick(row)}>View</Button>
        }
      ];
    },
    [columns, onRowClick, renderRow]
  );

  return (
    <article className="dashboard-panel dashboard-table-panel">
      <header><h2>{title}</h2><button type="button">View all</button></header>
      <QueryPanel query={query} empty={`No ${title.toLowerCase()} found.`}>
        <DataTable
          columns={dataColumns}
          data={rows}
          getRowId={rowId}
          total={rows.length}
          perPage={Math.max(25, rows.length || 25)}
          emptyState={<div className="empty-state">No {title.toLowerCase()} found.</div>}
          showToolbar={false}
          showPagination={false}
        />
      </QueryPanel>
    </article>
  );
}

function QueryPanel({ query, children, empty = 'No dashboard data returned.' }: { query: UseQueryResult<unknown>; children: ReactNode; empty?: string }) {
  if (query.isLoading) return <div className="surface-state">Loading dashboard widget...</div>;
  if (query.isError) return <div className="surface-error">{query.error instanceof Error ? query.error.message : 'Unable to load widget.'}</div>;
  if (!query.data) return <div className="empty-state">{empty}</div>;
  return <>{children}</>;
}

function DateRangeModal({
  open,
  range,
  onChange,
  onApply,
  onClose
}: {
  open: boolean;
  range: DashboardDateRange;
  onChange: (range: DashboardDateRange) => void;
  onApply: () => void;
  onClose: () => void;
}) {
  return (
    <AppModal open={open} onClose={onClose} title="Date range" footer={<><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="button" onClick={onApply}>Apply range</Button></>}>
      <div className="form-grid">
        <label>From<input type="date" value={range.date_from ?? ''} onChange={(event) => onChange({ ...range, date_from: event.target.value })} /></label>
        <label>To<input type="date" value={range.date_to ?? ''} onChange={(event) => onChange({ ...range, date_to: event.target.value })} /></label>
      </div>
    </AppModal>
  );
}

function ExportDashboardModal({
  open,
  format,
  onFormatChange,
  loading,
  error,
  result,
  onExport,
  onClose
}: {
  open: boolean;
  format: string;
  onFormatChange: (format: string) => void;
  loading: boolean;
  error: unknown;
  result?: { export_id?: string; file_url?: string; queued?: boolean };
  onExport: () => void;
  onClose: () => void;
}) {
  return (
    <AppModal open={open} onClose={onClose} title="Export dashboard snapshot" loading={loading} error={error instanceof Error ? error.message : null} footer={<><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="button" onClick={onExport}>Export</Button></>}>
      <div className="form-grid">
        <label>Format<select value={format} onChange={(event) => onFormatChange(event.target.value)}><option value="xlsx">XLSX</option><option value="csv">CSV</option><option value="pdf">PDF</option></select></label>
        <label><input type="checkbox" /> Email snapshot when ready</label>
        {result ? (
          <div className="surface-state">
            {result.file_url ? <a href={result.file_url}>Download ready file</a> : `Export ${result.export_id ?? 'snapshot'} queued.`}
          </div>
        ) : null}
      </div>
    </AppModal>
  );
}

function IncidentCreateDrawer(props: {
  open: boolean;
  title: string;
  severity: string;
  loading: boolean;
  error: unknown;
  onTitleChange: (title: string) => void;
  onSeverityChange: (severity: string) => void;
  onCreate: () => void;
  onClose: () => void;
}) {
  return (
    <AppDrawer open={props.open} onClose={props.onClose} title="Create incident" guard="platform" permission="monitoring.manage" loading={props.loading} error={props.error instanceof Error ? props.error.message : null} footer={<><Button type="button" variant="secondary" onClick={props.onClose}>Cancel</Button><Button type="button" onClick={props.onCreate}>Create incident</Button></>}>
      <div className="form-grid">
        <label>Title<input value={props.title} onChange={(event) => props.onTitleChange(event.target.value)} placeholder="Incident title" /></label>
        <label>Severity<select value={props.severity} onChange={(event) => props.onSeverityChange(event.target.value)}><option value="minor">Minor</option><option value="major">Major</option><option value="critical">Critical</option></select></label>
        <label>Summary<textarea defaultValue="Created from dashboard quick action." /></label>
      </div>
    </AppDrawer>
  );
}

function AlertDetailDrawer({ open, row, onClose }: { open: boolean; row: DashboardTableRow | null; onClose: () => void }) {
  return (
    <AppDrawer open={open} onClose={onClose} title="Alert detail" guard="platform" permission="monitoring.view">
      <RecordDetails row={row} />
    </AppDrawer>
  );
}

function FailedJobDrawer(props: {
  open: boolean;
  row: DashboardTableRow | null;
  retrying: boolean;
  deleting: boolean;
  onRetry: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const id = props.row ? rowId(props.row) : '';
  return (
    <AppDrawer open={props.open} onClose={props.onClose} title="Failed job detail" guard="platform" permission="monitoring.view" footer={<><PermissionButton guard="platform" permission="monitoring.manage" type="button" variant="secondary" disabled={props.retrying || !id} onClick={() => props.onRetry(id)}>Retry</PermissionButton><PermissionButton guard="platform" permission="monitoring.manage" type="button" variant="danger" disabled={props.deleting || !id} onClick={() => props.onDelete(id)}>Delete</PermissionButton></>}>
      <RecordDetails row={props.row} />
    </AppDrawer>
  );
}

function SecurityReviewModal(props: {
  open: boolean;
  row: DashboardTableRow | null;
  status: string;
  notes: string;
  loading: boolean;
  error: unknown;
  onStatusChange: (status: string) => void;
  onNotesChange: (notes: string) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  return (
    <AppModal open={props.open} onClose={props.onClose} title="Review security event" guard="platform" permission="audit_log.view" loading={props.loading} error={props.error instanceof Error ? props.error.message : null} footer={<><Button type="button" variant="secondary" onClick={props.onClose}>Cancel</Button><Button type="button" onClick={props.onSave}>Save review</Button></>}>
      <div className="form-grid">
        <RecordDetails row={props.row} />
        <label>Status<select value={props.status} onChange={(event) => props.onStatusChange(event.target.value)}><option value="reviewed">Reviewed</option><option value="ignored">Ignored</option><option value="escalated">Escalated</option></select></label>
        <label>Notes<textarea value={props.notes} onChange={(event) => props.onNotesChange(event.target.value)} /></label>
      </div>
    </AppModal>
  );
}

function RecordDetails({ row }: { row: DashboardTableRow | null }) {
  if (!row) return <div className="empty-state">No record selected.</div>;
  return (
    <dl className="enterprise-summary-list">
      {Object.entries(row).map(([key, value]) => (
        <div key={key}><dt>{key}</dt><dd>{String(value ?? '-')}</dd></div>
      ))}
    </dl>
  );
}

