import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Download,
  Eye,
  FileJson2,
  FileText,
  KeyRound,
  Pencil,
  PlugZap,
  RefreshCw,
  RotateCw,
  Save,
  ShieldCheck,
  UploadCloud,
  Wrench
} from 'lucide-react';
import { useLocation } from 'react-router-dom';

import { platformQueryKeys } from '@/features/platform/api/platformQueryKeys';
import { platformOperationsApi, type PlatformRecord } from '@/features/platform/operations/api/platformOperationsApi';
import type { ApiQuery, NormalizedApiResponse } from '@/lib/api/apiTypes';
import { ApiError } from '@/lib/api/apiError';
import { createListQuery } from '@/lib/api/listQuery';
import { DataTable, type DataTableColumn } from '@/shared/components/data-table';
import { AppDrawer } from '@/shared/components/drawer';
import { PageHeader, StatusBadge, Tabs } from '@/shared/components/layout';
import { AppModal } from '@/shared/components/modal';
import { Button } from '@/shared/components/ui';

type OperationArea =
  | 'modules'
  | 'support-tickets'
  | 'knowledge-base'
  | 'remote-login'
  | 'reports'
  | 'monitoring'
  | 'integrations'
  | 'settings'
  | 'audit'
  | 'onboarding'
  | 'trials'
  | 'legal'
  | 'announcements'
  | 'webhooks';

type ActionKey =
  | 'moduleEditor'
  | 'moduleToggle'
  | 'featureAttach'
  | 'tenantOverride'
  | 'ticketAssign'
  | 'ticketReply'
  | 'ticketClose'
  | 'articleEditor'
  | 'articlePublish'
  | 'remoteEnd'
  | 'reportExport'
  | 'alertResolve'
  | 'incidentEditor'
  | 'payload'
  | 'retry'
  | 'connectProvider'
  | 'rotateCredentials'
  | 'fieldMapping'
  | 'settingsEditor'
  | 'backupRun'
  | 'templateEditor'
  | 'auditCompare'
  | 'auditExport'
  | 'trialExtend'
  | 'trialConvert'
  | 'legalEditor'
  | 'legalPublish'
  | 'announcementEditor'
  | 'announcementPublish'
  | 'webhookEditor'
  | null;

type ActionState = {
  key: ActionKey;
  record?: PlatformRecord;
  tab?: string;
};

type Field = {
  name: string;
  label: string;
  type?: 'text' | 'textarea' | 'select' | 'number' | 'date' | 'datetime-local' | 'checkbox';
  options?: string[];
};

type AreaConfig = {
  id: OperationArea;
  title: string;
  description: string;
  permission: string;
  tabs: Array<{
    id: string;
    label: string;
    resource: string;
    query: (query: ApiQuery) => Promise<{ data: PlatformRecord[]; total: number }>;
    columns: string[];
    primary?: string[];
    actions?: Array<{ key: ActionKey; label: string; icon?: ReactNode }>;
    empty?: string;
  }>;
};

export function PlatformModulesPage() { return <OperationsPage config={configs.modules} />; }
export function PlatformSupportTicketsPage() { return <OperationsPage config={configs['support-tickets']} />; }
export function PlatformKnowledgeBasePage() { return <OperationsPage config={configs['knowledge-base']} />; }
export function PlatformRemoteLoginPage() { return <OperationsPage config={configs['remote-login']} />; }
export function PlatformReportsPage() { return <OperationsPage config={configs.reports} />; }
export function PlatformMonitoringPage() { return <OperationsPage config={configs.monitoring} />; }
export function PlatformIntegrationsPage() { return <OperationsPage config={configs.integrations} />; }
export function PlatformSettingsPage() { return <OperationsPage config={configs.settings} />; }
export function PlatformAuditPage() { return <OperationsPage config={configs.audit} />; }
export function PlatformOnboardingPage() { return <OperationsPage config={configs.onboarding} />; }
export function PlatformTrialsPage() { return <OperationsPage config={configs.trials} />; }
export function PlatformLegalPage() { return <OperationsPage config={configs.legal} />; }
export function PlatformAnnouncementsPage() { return <OperationsPage config={configs.announcements} />; }
export function PlatformWebhooksPage() { return <OperationsPage config={configs.webhooks} />; }

function OperationsPage({ config }: { config: AreaConfig }) {
  const location = useLocation();
  const requestedTab = new URLSearchParams(location.search).get('tab');
  const initialTab = requestedTab && config.tabs.some((entry) => entry.id === requestedTab) ? requestedTab : config.tabs[0].id;
  const [activeTab, setActiveTab] = useState(initialTab);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [action, setAction] = useState<ActionState>({ key: null });
  const tab = config.tabs.find((entry) => entry.id === activeTab) ?? config.tabs[0];
  const queryParams = createListQuery({ page, per_page: 25, search });
  const query = useQuery({
    queryKey: platformQueryKeys.list(tab.resource, queryParams),
    queryFn: () => tab.query(queryParams)
  });
  const rows = query.data?.data ?? [];
  const columns = useMemo(() => buildColumns(tab.columns, tab.primary ?? [], tab.actions ?? [], setAction, activeTab), [activeTab, tab]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const nextTab = searchParams.get('tab');
    if (nextTab && config.tabs.some((entry) => entry.id === nextTab)) {
      setActiveTab(nextTab);
      setPage(1);
      setSelectedIds([]);
    }
    const nextAction = searchParams.get('action');
    if (config.id === 'monitoring' && nextAction === 'incidentEditor') {
      setAction({ key: 'incidentEditor', tab: nextTab ?? activeTab });
    }
  }, [activeTab, config.id, config.tabs, location.search]);

  return (
    <section className="enterprise-module-page">
      <PageHeader
        title={config.title}
        description={config.description}
        actions={<HeaderActions config={config} activeTab={activeTab} onAction={(key, record) => setAction({ key, record, tab: activeTab })} />}
      />
      <Tabs
        tabs={config.tabs.map((entry) => ({ id: entry.id, label: entry.label }))}
        activeId={activeTab}
        ariaLabel={`${config.title} sections`}
        onChange={(next) => {
          setActiveTab(next);
          setPage(1);
          setSelectedIds([]);
        }}
      />
      <DataTable
        columns={columns}
        data={rows}
        getRowId={idOf}
        loading={query.isLoading}
        error={query.isError ? errorMessage(query.error) : ''}
        emptyState={<div className="empty-state">{tab.empty ?? 'No records returned. The route and module shell are ready for implementation.'}</div>}
        searchValue={search}
        searchPlaceholder={`Search ${tab.label.toLowerCase()}...`}
        onSearchChange={setSearch}
        selectedRowIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onOpenExport={() => setAction({ key: config.id === 'audit' ? 'auditExport' : 'reportExport', tab: activeTab })}
        page={page}
        total={query.data?.total ?? rows.length}
        onPageChange={setPage}
      />
      <ActionSurface
        area={config.id}
        action={action}
        selectedIds={selectedIds}
        onClose={() => setAction({ key: null })}
        onComplete={() => {
          setAction({ key: null });
          void query.refetch();
        }}
      />
    </section>
  );
}

function HeaderActions({ config, activeTab, onAction }: { config: AreaConfig; activeTab: string; onAction: (key: ActionKey, record?: PlatformRecord) => void }) {
  if (config.id === 'modules') return <Button type="button" onClick={() => onAction('moduleEditor')}><Wrench size={16} aria-hidden />Create Module</Button>;
  if (config.id === 'knowledge-base') return <Button type="button" onClick={() => onAction('articleEditor')}><BookOpen size={16} aria-hidden />Article Editor</Button>;
  if (config.id === 'monitoring') return <Button type="button" onClick={() => onAction('incidentEditor')}><AlertTriangle size={16} aria-hidden />New Incident</Button>;
  if (config.id === 'integrations') return <Button type="button" onClick={() => onAction('connectProvider')}><PlugZap size={16} aria-hidden />Connect Provider</Button>;
  if (config.id === 'settings') return <Button type="button" onClick={() => onAction(activeTab === 'backups' ? 'backupRun' : activeTab === 'templates' ? 'templateEditor' : 'settingsEditor')}><Save size={16} aria-hidden />Update</Button>;
  if (config.id === 'legal') return <Button type="button" onClick={() => onAction('legalEditor')}><FileText size={16} aria-hidden />New Document</Button>;
  if (config.id === 'announcements') return <Button type="button" onClick={() => onAction('announcementEditor')}><FileText size={16} aria-hidden />New Announcement</Button>;
  if (config.id === 'webhooks') return <Button type="button" onClick={() => onAction('webhookEditor')}><UploadCloud size={16} aria-hidden />New Endpoint</Button>;
  return <Button type="button" variant="secondary" onClick={() => onAction(config.id === 'audit' ? 'auditExport' : 'reportExport')}><Download size={16} aria-hidden />Export</Button>;
}

function buildColumns(
  keys: string[],
  primary: string[],
  actions: Array<{ key: ActionKey; label: string; icon?: ReactNode }>,
  onAction: (state: ActionState) => void,
  tab: string
): DataTableColumn<PlatformRecord>[] {
  return [
    ...keys.map((key) => ({
      id: key,
      header: label(key),
      enableSorting: true,
      accessor: (row: PlatformRecord) => printable(row[key]),
      cell: (row: PlatformRecord) => {
        const value = row[key];
        if (key.includes('status') || key === 'severity' || key === 'priority') return <StatusBadge tone={tone(String(value ?? 'neutral'))}>{printable(value)}</StatusBadge>;
        if (primary.includes(key)) return <strong>{printable(value)}</strong>;
        return printable(value);
      }
    })),
    {
      id: 'actions',
      header: 'Actions',
      enableHiding: false,
      cell: (row) => (
        <div className="row-action-menu">
          <Button type="button" size="sm" variant="ghost" onClick={() => onAction({ key: 'payload', record: row, tab })}>
            <Eye size={15} aria-hidden />View
          </Button>
          {actions.map((entry) => (
            <Button key={entry.label} type="button" size="sm" variant="secondary" onClick={() => onAction({ key: entry.key, record: row, tab })}>
              {entry.icon}
              {entry.label}
            </Button>
          ))}
        </div>
      )
    }
  ];
}

function ActionSurface({ area, action, selectedIds, onClose, onComplete }: { area: OperationArea; action: ActionState; selectedIds: string[]; onClose: () => void; onComplete: () => void }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => runAction(area, action, payload, selectedIds),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: platformQueryKeys.all });
      onComplete();
    }
  });
  const [payload, setPayload] = useState<Record<string, unknown>>({});
  const fields = fieldsFor(area, action);

  if (!action.key) return null;
  if (action.key === 'payload' || action.key === 'auditCompare') {
    return (
      <AppDrawer open onClose={onClose} title={action.key === 'auditCompare' ? 'Audit Compare' : 'Raw Payload / Exception'} guard="platform" permission="audit_log.view" size="lg">
        <DetailGrid record={mask(action.record ?? {})} />
      </AppDrawer>
    );
  }
  if (['fieldMapping', 'incidentEditor', 'articleEditor'].includes(action.key)) {
    return (
      <AppDrawer
        open
        onClose={onClose}
        title={titleFor(action.key)}
        guard="platform"
        permission={permissionFor(area, action.key)}
        size="lg"
        loading={mutation.isPending}
        error={mutation.error ? errorMessage(mutation.error) : null}
        footer={<><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="button" onClick={() => mutation.mutate(normalizePayload(action.key, payload))}>Save</Button></>}
      >
        <GenericFields fields={fields} payload={payload} onChange={setPayload} />
      </AppDrawer>
    );
  }
  return (
    <AppModal
      open
      onClose={onClose}
      title={titleFor(action.key)}
      guard="platform"
      permission={permissionFor(area, action.key)}
      size="lg"
      loading={mutation.isPending}
      error={mutation.error ? errorMessage(mutation.error) : null}
      footer={<><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="button" onClick={() => mutation.mutate(normalizePayload(action.key, payload))}>Confirm</Button></>}
    >
      <GenericFields fields={fields} payload={payload} onChange={setPayload} />
    </AppModal>
  );
}

function GenericFields({ fields, payload, onChange }: { fields: Field[]; payload: Record<string, unknown>; onChange: (payload: Record<string, unknown>) => void }) {
  return (
    <div className="form-grid form-grid--two">
      {fields.map((field) => (
        <label key={field.name} className={field.type === 'checkbox' ? 'check-row' : undefined}>
          {field.type === 'checkbox' ? (
            <>
              <input type="checkbox" checked={Boolean(payload[field.name])} onChange={(event) => onChange({ ...payload, [field.name]: event.target.checked })} />
              <span>{field.label}</span>
            </>
          ) : (
            <>
              <span>{field.label}</span>
              {field.type === 'textarea' ? (
                <textarea value={String(payload[field.name] ?? '')} onChange={(event) => onChange({ ...payload, [field.name]: event.target.value })} />
              ) : field.type === 'select' ? (
                <select value={String(payload[field.name] ?? field.options?.[0] ?? '')} onChange={(event) => onChange({ ...payload, [field.name]: event.target.value })}>
                  {field.options?.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              ) : (
                <input type={field.type ?? 'text'} value={String(payload[field.name] ?? '')} onChange={(event) => onChange({ ...payload, [field.name]: field.type === 'number' ? Number(event.target.value) : event.target.value })} />
              )}
            </>
          )}
        </label>
      ))}
    </div>
  );
}

async function runAction(area: OperationArea, action: ActionState, payload: Record<string, unknown>, selectedIds: string[]) {
  const id = idOf(action.record);
  if (area === 'modules') {
    if (action.key === 'moduleEditor') return id ? platformOperationsApi.modules.update(id, payload) : platformOperationsApi.modules.create(payload);
    if (action.key === 'moduleToggle') return String(action.record?.status) === 'active' ? platformOperationsApi.modules.disable(id, payload) : platformOperationsApi.modules.enable(id, payload);
    if (action.key === 'featureAttach') return platformOperationsApi.modules.replaceFeatures(id, csv(payload.feature_uuids));
  }
  if (area === 'support-tickets') {
    if (action.key === 'ticketAssign') return platformOperationsApi.support.tickets.assign(id, payload);
    if (action.key === 'ticketReply') return platformOperationsApi.support.tickets.comment(id, payload);
    if (action.key === 'ticketClose') return platformOperationsApi.support.tickets.close(id, payload);
    if (action.key === 'reportExport') return platformOperationsApi.support.tickets.export({ selected_ids: selectedIds });
  }
  if (area === 'knowledge-base') {
    if (action.key === 'articleEditor') return id ? platformOperationsApi.support.articles.update(id, payload) : platformOperationsApi.support.articles.create(payload);
    if (action.key === 'articlePublish') return String(action.record?.status) === 'published' ? platformOperationsApi.support.articles.unpublish(id, payload) : platformOperationsApi.support.articles.publish(id, payload);
  }
  if (area === 'remote-login' && action.key === 'remoteEnd') return platformOperationsApi.support.remoteSessions.end(id, payload);
  if (area === 'reports' && action.key === 'reportExport') return platformOperationsApi.reports.export(String(action.tab ?? 'revenue'), payload);
  if (area === 'monitoring') {
    if (action.key === 'alertResolve') return platformOperationsApi.monitoring.resolveAlert(action.record?.id ?? id, payload);
    if (action.key === 'incidentEditor') return id ? platformOperationsApi.monitoring.updateIncident(action.record?.id ?? id, payload) : platformOperationsApi.monitoring.createIncident(payload);
    if (action.key === 'retry' && action.tab === 'queue') return platformOperationsApi.monitoring.retryQueueJob(action.record?.id ?? id, payload);
  }
  if (area === 'integrations') {
    if (action.key === 'connectProvider') return platformOperationsApi.integrations.createTenantIntegration(payload);
    if (action.key === 'rotateCredentials') return platformOperationsApi.integrations.rotateCredentials(id, { credentials: json(payload.credentials) });
    if (action.key === 'fieldMapping') return platformOperationsApi.integrations.replaceMappings(id, jsonArray(payload.mappings));
    if (action.key === 'retry' && action.tab === 'sync') return platformOperationsApi.integrations.retrySyncJob(action.record?.id ?? id, payload);
    if (action.key === 'retry') return platformOperationsApi.integrations.retryWebhookLog(action.record?.id ?? id, payload);
  }
  if (area === 'settings') {
    if (action.key === 'settingsEditor') return platformOperationsApi.settings.updatePlatform({ settings: json(payload.settings) });
    if (action.key === 'backupRun') return platformOperationsApi.settings.runBackup(payload);
    if (action.key === 'templateEditor') return platformOperationsApi.settings.createTemplate(normalizePayload(action.key, payload));
  }
  if (area === 'audit') {
    if (action.key === 'auditExport') return platformOperationsApi.audit.export({ ...payload, selected_ids: selectedIds });
  }
  if (area === 'trials') {
    if (action.key === 'trialExtend') return platformOperationsApi.lifecycle.extendTrial(id, payload);
    if (action.key === 'trialConvert') return platformOperationsApi.lifecycle.convertTrial(id, payload);
  }
  if (area === 'legal') {
    if (action.key === 'legalEditor') return id ? platformOperationsApi.lifecycle.updateLegal(id, payload) : platformOperationsApi.lifecycle.createLegal(payload);
    if (action.key === 'legalPublish') return platformOperationsApi.lifecycle.publishLegal(id);
  }
  if (area === 'announcements') {
    if (action.key === 'announcementEditor') return id ? platformOperationsApi.lifecycle.updateAnnouncement(id, payload) : platformOperationsApi.lifecycle.createAnnouncement(payload);
    if (action.key === 'announcementPublish') return platformOperationsApi.lifecycle.publishAnnouncement(id);
  }
  if (area === 'webhooks') {
    if (action.key === 'webhookEditor') return id ? platformOperationsApi.webhooks.updateEndpoint(id, normalizePayload(action.key, payload)) : platformOperationsApi.webhooks.createEndpoint(normalizePayload(action.key, payload));
    if (action.key === 'retry') return platformOperationsApi.webhooks.retryDelivery(id, payload);
  }
  return Promise.resolve({ data: null, meta: {} } as NormalizedApiResponse<unknown>);
}

const configs: Record<OperationArea, AreaConfig> = {
  modules: {
    id: 'modules',
    title: 'Modules and Feature Controls',
    description: 'Global modules, feature attachments, tenant overrides, and implementation placeholders for missing persistence.',
    permission: 'module.view',
    tabs: [
      { id: 'modules', label: 'Modules', resource: 'modules', query: platformOperationsApi.modules.list, columns: ['name', 'code', 'category', 'is_core', 'status', 'sort_order'], primary: ['name'], actions: [{ key: 'moduleToggle', label: 'Toggle', icon: <CheckCircle2 size={14} aria-hidden /> }, { key: 'featureAttach', label: 'Features', icon: <Wrench size={14} aria-hidden /> }, { key: 'tenantOverride', label: 'Override', icon: <ShieldCheck size={14} aria-hidden /> }] }
    ]
  },
  'support-tickets': {
    id: 'support-tickets',
    title: 'Support Tickets',
    description: 'Ticket queue, assignment, replies, internal notes, close/reopen flow, export, and linked payload views.',
    permission: 'support.ticket.view',
    tabs: [
      { id: 'tickets', label: 'Tickets', resource: 'support-tickets', query: platformOperationsApi.support.tickets.list, columns: ['ticket_number', 'tenant_id', 'subject', 'priority', 'status', 'source', 'opened_at'], primary: ['ticket_number', 'subject'], actions: [{ key: 'ticketAssign', label: 'Assign' }, { key: 'ticketReply', label: 'Reply' }, { key: 'ticketClose', label: 'Close' }] }
    ]
  },
  'knowledge-base': {
    id: 'knowledge-base',
    title: 'Knowledge Base',
    description: 'Categories and articles with editor drawer plus publish, unpublish, archive ready actions.',
    permission: 'support.knowledge_base.view',
    tabs: [
      { id: 'articles', label: 'Articles', resource: 'kb-articles', query: platformOperationsApi.support.articles.list, columns: ['title', 'slug', 'visibility', 'status', 'published_at', 'updated_at'], primary: ['title'], actions: [{ key: 'articleEditor', label: 'Edit', icon: <Pencil size={14} aria-hidden /> }, { key: 'articlePublish', label: 'Publish' }] },
      { id: 'categories', label: 'Categories', resource: 'kb-categories', query: platformOperationsApi.support.kbCategories, columns: ['name', 'slug', 'status', 'sort_order'], primary: ['name'] }
    ]
  },
  'remote-login': {
    id: 'remote-login',
    title: 'Remote Login Sessions',
    description: 'Review tenant impersonation history and end active support sessions.',
    permission: 'tenant.impersonate',
    tabs: [
      { id: 'sessions', label: 'Sessions', resource: 'remote-login-sessions', query: platformOperationsApi.support.remoteSessions.list, columns: ['uuid', 'tenant_id', 'platform_user_id', 'reason', 'status', 'started_at', 'ended_at'], primary: ['uuid'], actions: [{ key: 'remoteEnd', label: 'End' }] }
    ]
  },
  reports: {
    id: 'reports',
    title: 'Reports',
    description: 'Operational report pages with filters, drill-down rows, export queue integration, and export job tracking.',
    permission: 'report.view',
    tabs: reportTabs()
  },
  monitoring: {
    id: 'monitoring',
    title: 'Monitoring',
    description: 'Service health, jobs, scheduler logs, API logs, alerts, incidents, and raw exception drawers.',
    permission: 'monitoring.view',
    tabs: [
      { id: 'services', label: 'Services', resource: 'monitoring-services', query: platformOperationsApi.monitoring.services, columns: ['name', 'code', 'type', 'status', 'response_time_ms', 'last_checked_at'], primary: ['name'] },
      { id: 'queue', label: 'Queue Jobs', resource: 'queue-jobs', query: platformOperationsApi.monitoring.queueJobs, columns: ['id', 'queue', 'job_name', 'status', 'attempts', 'started_at', 'finished_at'], actions: [{ key: 'retry', label: 'Retry', icon: <RotateCw size={14} aria-hidden /> }, { key: 'payload', label: 'Exception', icon: <FileJson2 size={14} aria-hidden /> }] },
      { id: 'scheduler', label: 'Scheduler Logs', resource: 'scheduler-logs', query: platformOperationsApi.monitoring.schedulerLogs, columns: ['command', 'status', 'duration_ms', 'started_at', 'finished_at'] },
      { id: 'api', label: 'API Logs', resource: 'api-request-logs', query: platformOperationsApi.monitoring.apiLogs, columns: ['tenant_id', 'method', 'path', 'status_code', 'duration_ms', 'ip_address', 'created_at'], actions: [{ key: 'payload', label: 'Payload', icon: <FileJson2 size={14} aria-hidden /> }] },
      { id: 'alerts', label: 'Alerts', resource: 'monitoring-alerts', query: platformOperationsApi.monitoring.alerts, columns: ['id', 'severity', 'message', 'status', 'triggered_at', 'resolved_at'], primary: ['message'], actions: [{ key: 'alertResolve', label: 'Resolve' }] },
      { id: 'incidents', label: 'Incidents', resource: 'system-incidents', query: platformOperationsApi.monitoring.incidents, columns: ['id', 'title', 'severity', 'status', 'started_at', 'resolved_at'], primary: ['title'], actions: [{ key: 'incidentEditor', label: 'Edit' }] },
      { id: 'usage', label: 'Usage Snapshots', resource: 'tenant-usage-snapshots', query: platformOperationsApi.monitoring.usage, columns: ['tenant_id', 'period_start', 'period_end', 'api_requests', 'storage_used_mb', 'created_at'] }
    ]
  },
  integrations: {
    id: 'integrations',
    title: 'Integrations',
    description: 'Provider catalog, tenant integrations, credentials, webhooks, sync jobs, mappings, and rate-limit surfaces.',
    permission: 'integration.view',
    tabs: [
      { id: 'providers', label: 'Providers', resource: 'integration-providers', query: platformOperationsApi.integrations.providers, columns: ['name', 'code', 'category', 'auth_type', 'status'], primary: ['name'] },
      { id: 'tenant', label: 'Tenant Integrations', resource: 'tenant-integrations', query: platformOperationsApi.integrations.tenantIntegrations, columns: ['uuid', 'tenant_id', 'provider_id', 'name', 'status', 'connected_at'], primary: ['name'], actions: [{ key: 'rotateCredentials', label: 'Rotate' }, { key: 'fieldMapping', label: 'Mappings' }] },
      { id: 'webhooks', label: 'Webhooks', resource: 'integration-webhooks', query: platformOperationsApi.integrations.webhooks, columns: ['id', 'tenant_integration_id', 'event', 'status', 'last_delivered_at'], actions: [{ key: 'retry', label: 'Retry' }, { key: 'payload', label: 'Payload' }] },
      { id: 'sync', label: 'Sync Jobs', resource: 'integration-sync-jobs', query: platformOperationsApi.integrations.syncJobs, columns: ['id', 'tenant_integration_id', 'sync_type', 'entity', 'status', 'started_at', 'finished_at'], actions: [{ key: 'retry', label: 'Retry' }, { key: 'payload', label: 'Payload' }] }
    ]
  },
  settings: {
    id: 'settings',
    title: 'Platform Settings',
    description: 'Grouped platform settings, notification templates, backups, and backup run history.',
    permission: 'setting.view',
    tabs: [
      { id: 'platform', label: 'Settings', resource: 'platform-settings', query: async () => settingsList(), columns: ['group', 'key', 'value_type', 'updated_at'], primary: ['group', 'key'], actions: [{ key: 'settingsEditor', label: 'Edit' }] },
      { id: 'templates', label: 'Templates', resource: 'notification-templates', query: platformOperationsApi.settings.templates, columns: ['code', 'channel', 'subject', 'status', 'updated_at'], primary: ['code'], actions: [{ key: 'templateEditor', label: 'Edit' }] },
      { id: 'backups', label: 'Backups', resource: 'backup-runs', query: platformOperationsApi.settings.backupRuns, columns: ['uuid', 'backup_type', 'status', 'size_bytes', 'started_at', 'finished_at'], actions: [{ key: 'backupRun', label: 'Run' }] }
    ]
  },
  audit: {
    id: 'audit',
    title: 'Audit Logs',
    description: 'Activity, security, billing/payment/subscription/system and remote-login audit surfaces with compare and export.',
    permission: 'audit_log.view',
    tabs: [
      { id: 'activity', label: 'Activity', resource: 'audit-activity', query: platformOperationsApi.audit.activity, columns: ['id', 'actor_platform_user_id', 'subject_type', 'event', 'ip_address', 'created_at'], primary: ['event'], actions: [{ key: 'auditCompare', label: 'Compare' }] },
      { id: 'security', label: 'Security', resource: 'audit-security', query: platformOperationsApi.audit.security, columns: ['id', 'event', 'severity', 'ip_address', 'created_at'], primary: ['event'], actions: [{ key: 'ticketReply', label: 'Review' }] }
    ]
  },
  onboarding: {
    id: 'onboarding',
    title: 'Onboarding',
    description: 'Tenant onboarding queue with progress rows and implementation-ready step update flow.',
    permission: 'tenant.view',
    tabs: [{ id: 'tenants', label: 'Tenant Queue', resource: 'onboarding-tenants', query: platformOperationsApi.lifecycle.onboarding, columns: ['uuid', 'organization_name', 'status', 'steps'], primary: ['organization_name'] }]
  },
  trials: {
    id: 'trials',
    title: 'Trial Management',
    description: 'Trial tenant list with extension and conversion actions.',
    permission: 'subscription.view',
    tabs: [{ id: 'trials', label: 'Trials', resource: 'trials', query: platformOperationsApi.lifecycle.trials, columns: ['uuid', 'organization_name', 'status', 'trial_ends_at', 'created_at'], primary: ['organization_name'], actions: [{ key: 'trialExtend', label: 'Extend' }, { key: 'trialConvert', label: 'Convert' }] }]
  },
  legal: {
    id: 'legal',
    title: 'Legal Documents',
    description: 'Terms, privacy, DPA, tenant agreement versions, publishing, and acceptance review shell.',
    permission: 'setting.view',
    tabs: [{ id: 'documents', label: 'Documents', resource: 'legal-documents', query: platformOperationsApi.lifecycle.legal, columns: ['document_type', 'title', 'version', 'status', 'published_at', 'updated_at'], primary: ['title'], actions: [{ key: 'legalEditor', label: 'Edit' }, { key: 'legalPublish', label: 'Publish' }] }]
  },
  announcements: {
    id: 'announcements',
    title: 'Announcements',
    description: 'Platform announcements to tenants with draft, publish, and archive controls.',
    permission: 'setting.view',
    tabs: [{ id: 'announcements', label: 'Announcements', resource: 'announcements', query: platformOperationsApi.lifecycle.announcements, columns: ['title', 'audience', 'status', 'published_at', 'created_at'], primary: ['title'], actions: [{ key: 'announcementEditor', label: 'Edit' }, { key: 'announcementPublish', label: 'Publish' }] }]
  },
  webhooks: {
    id: 'webhooks',
    title: 'Webhook Delivery',
    description: 'Outbound platform webhook endpoints and delivery retry shell.',
    permission: 'integration.view',
    tabs: [{ id: 'endpoints', label: 'Endpoints', resource: 'webhook-endpoints', query: platformOperationsApi.webhooks.endpoints, columns: ['uuid', 'name', 'url', 'status', 'created_at'], primary: ['name'], actions: [{ key: 'webhookEditor', label: 'Edit' }] }]
  }
};

function reportTabs(): AreaConfig['tabs'] {
  const reports = ['tenant-status', 'plan-performance', 'revenue', 'invoice-aging', 'payment-failures', 'coupon-usage', 'tenant-usage', 'support-sla', 'security-events'];
  return [
    ...reports.map((code) => ({
      id: code,
      label: label(code),
      resource: `report-${code}`,
      query: (query: ApiQuery) => platformOperationsApi.reports.report(code, query),
      columns: ['status', 'name', 'code', 'currency', 'gateway', 'severity', 'event', 'total', 'revenue', 'balance', 'subscriptions', 'redemptions', 'discount_amount'].filter(Boolean),
      primary: ['status', 'name', 'code', 'event'],
      actions: [{ key: 'reportExport' as ActionKey, label: 'Export', icon: <Download size={14} aria-hidden /> }]
    })),
    { id: 'export-jobs', label: 'Export Jobs', resource: 'report-export-jobs', query: platformOperationsApi.reports.jobs, columns: ['uuid', 'report_code', 'format', 'status', 'created_at', 'finished_at'], primary: ['report_code'] }
  ];
}

async function settingsList() {
  const response = await platformOperationsApi.settings.platform();
  const settings = response.data?.settings;
  const rows = Array.isArray(settings) ? settings as PlatformRecord[] : [];
  return { data: rows, total: rows.length };
}

function fieldsFor(area: OperationArea, action: ActionState): Field[] {
  if (action.key === 'moduleEditor') return [{ name: 'name', label: 'Name' }, { name: 'code', label: 'Code' }, { name: 'category', label: 'Category' }, { name: 'icon', label: 'Icon' }, { name: 'is_core', label: 'Core module', type: 'checkbox' }, { name: 'status', label: 'Status', type: 'select', options: ['active', 'inactive'] }, { name: 'sort_order', label: 'Sort Order', type: 'number' }, { name: 'description', label: 'Description', type: 'textarea' }];
  if (action.key === 'featureAttach') return [{ name: 'feature_uuids', label: 'Feature UUIDs', type: 'textarea' }];
  if (action.key === 'ticketAssign') return [{ name: 'assigned_to_uuid', label: 'Platform User UUID' }, { name: 'audit_reason', label: 'Audit Reason', type: 'textarea' }];
  if (action.key === 'ticketReply') return [{ name: 'comment', label: area === 'audit' ? 'Review Notes' : 'Reply / Internal Note', type: 'textarea' }, { name: 'is_internal', label: 'Internal note', type: 'checkbox' }];
  if (action.key === 'ticketClose') return [{ name: 'notes', label: 'Resolution Notes', type: 'textarea' }];
  if (action.key === 'articleEditor') return [{ name: 'category_id', label: 'Category ID' }, { name: 'title', label: 'Title' }, { name: 'slug', label: 'Slug' }, { name: 'visibility', label: 'Visibility', type: 'select', options: ['public', 'tenant', 'internal'] }, { name: 'status', label: 'Status', type: 'select', options: ['draft', 'published', 'archived'] }, { name: 'content', label: 'Content', type: 'textarea' }];
  if (action.key === 'reportExport') return [{ name: 'format', label: 'Format', type: 'select', options: ['csv', 'xlsx', 'pdf'] }, { name: 'delivery', label: 'Delivery', type: 'select', options: ['job', 'download'] }, { name: 'email_when_ready', label: 'Email when ready', type: 'checkbox' }];
  if (action.key === 'alertResolve') return [{ name: 'resolution_note', label: 'Resolution Note', type: 'textarea' }, { name: 'status', label: 'Status', type: 'select', options: ['resolved', 'ignored'] }];
  if (action.key === 'incidentEditor') return [{ name: 'title', label: 'Title' }, { name: 'severity', label: 'Severity', type: 'select', options: ['low', 'medium', 'high', 'critical'] }, { name: 'status', label: 'Status', type: 'select', options: ['open', 'investigating', 'resolved'] }, { name: 'summary', label: 'Summary', type: 'textarea' }];
  if (action.key === 'connectProvider') return [{ name: 'tenant_uuid', label: 'Tenant UUID' }, { name: 'provider_code', label: 'Provider Code' }, { name: 'name', label: 'Connection Name' }, { name: 'status', label: 'Status', type: 'select', options: ['active', 'inactive'] }, { name: 'credentials', label: 'Credentials JSON', type: 'textarea' }];
  if (action.key === 'rotateCredentials') return [{ name: 'credentials', label: 'Credentials JSON', type: 'textarea' }];
  if (action.key === 'fieldMapping') return [{ name: 'mappings', label: 'Mappings JSON Array', type: 'textarea' }];
  if (action.key === 'settingsEditor') return [{ name: 'settings', label: 'Settings JSON by Group', type: 'textarea' }];
  if (action.key === 'backupRun') return [{ name: 'backup_type', label: 'Backup Type', type: 'select', options: ['manual', 'full', 'database', 'files'] }];
  if (action.key === 'templateEditor') return [{ name: 'code', label: 'Code' }, { name: 'channel', label: 'Channel', type: 'select', options: ['email', 'sms', 'whatsapp', 'push'] }, { name: 'subject', label: 'Subject' }, { name: 'body', label: 'Body', type: 'textarea' }, { name: 'variables', label: 'Variables CSV' }, { name: 'status', label: 'Status', type: 'select', options: ['active', 'inactive'] }];
  if (action.key === 'auditExport') return [{ name: 'format', label: 'Format', type: 'select', options: ['csv'] }, { name: 'delivery', label: 'Delivery', type: 'select', options: ['job', 'download'] }, { name: 'scope', label: 'Scope', type: 'select', options: ['filtered', 'selected'] }, { name: 'email_when_ready', label: 'Email when ready', type: 'checkbox' }];
  if (action.key === 'trialExtend') return [{ name: 'trial_ends_at', label: 'New Trial End', type: 'date' }, { name: 'reason', label: 'Reason', type: 'textarea' }];
  if (action.key === 'trialConvert') return [{ name: 'plan_uuid', label: 'Plan UUID' }, { name: 'billing_cycle', label: 'Billing Cycle', type: 'select', options: ['monthly', 'yearly'] }, { name: 'starts_at', label: 'Start Date', type: 'date' }, { name: 'coupon_code', label: 'Coupon Code' }];
  if (action.key === 'legalEditor') return [{ name: 'document_type', label: 'Type' }, { name: 'title', label: 'Title' }, { name: 'version', label: 'Version' }, { name: 'status', label: 'Status', type: 'select', options: ['draft', 'published'] }, { name: 'content', label: 'Content', type: 'textarea' }];
  if (action.key === 'announcementEditor') return [{ name: 'title', label: 'Title' }, { name: 'audience', label: 'Audience' }, { name: 'status', label: 'Status', type: 'select', options: ['draft', 'published', 'archived'] }, { name: 'body', label: 'Body', type: 'textarea' }];
  if (action.key === 'webhookEditor') return [{ name: 'tenant_uuid', label: 'Tenant UUID' }, { name: 'name', label: 'Name' }, { name: 'url', label: 'URL' }, { name: 'events', label: 'Events CSV' }, { name: 'secret', label: 'Secret' }, { name: 'status', label: 'Status', type: 'select', options: ['active', 'inactive'] }];
  return [{ name: 'reason', label: 'Reason / Notes', type: 'textarea' }];
}

function normalizePayload(action: ActionKey, payload: Record<string, unknown>) {
  if (action === 'connectProvider') return { ...payload, credentials: json(payload.credentials) };
  if (action === 'templateEditor') return { ...payload, variables: csv(payload.variables) };
  if (action === 'webhookEditor') return { ...payload, events: csv(payload.events) };
  return payload;
}

function titleFor(action: ActionKey) {
  return label(String(action ?? 'Action'));
}

function permissionFor(area: OperationArea, action: ActionKey) {
  if (['moduleEditor', 'moduleToggle', 'featureAttach', 'tenantOverride'].includes(String(action))) return 'module.edit';
  if (area.startsWith('support') || area === 'knowledge-base') return 'support.ticket.reply';
  if (area === 'monitoring') return 'monitoring.manage';
  if (area === 'integrations' || area === 'webhooks') return 'integration.edit';
  if (area === 'settings' || area === 'legal' || area === 'announcements') return 'setting.edit';
  if (area === 'audit') return 'audit_log.export';
  if (area === 'trials') return 'subscription.edit';
  return 'dashboard.view';
}

function idOf(record?: PlatformRecord) {
  return String(record?.uuid ?? record?.id ?? record?.code ?? '');
}

function label(value: string) {
  return value.replace(/[-_]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function printable(value: unknown) {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return displayValue(mask(value));
  return String(value);
}

function DetailGrid({ record }: { record: unknown }) {
  if (!record || typeof record !== 'object') return <div className="empty-state">No details returned.</div>;
  const entries = Object.entries(record as Record<string, unknown>).filter(([key, value]) => value !== null && value !== undefined && value !== '' && !['id'].includes(key));
  if (entries.length === 0) return <div className="empty-state">No displayable details returned.</div>;
  return (
    <dl className="detail-grid">
      {entries.map(([key, value]) => (
        <div key={key}>
          <dt>{label(key)}</dt>
          <dd>{displayValue(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '-';
  if (Array.isArray(value)) return `${value.length} item${value.length === 1 ? '' : 's'}`;
  if (typeof value === 'object') {
    const record = value as PlatformRecord;
    return String(record.name ?? record.display_name ?? record.title ?? record.email ?? record.status ?? record.uuid ?? 'Details available');
  }
  return String(value);
}

function tone(value: string): 'neutral' | 'success' | 'warning' | 'danger' | 'info' {
  const lower = value.toLowerCase();
  if (['active', 'published', 'resolved', 'success', 'completed', 'healthy'].includes(lower)) return 'success';
  if (['pending', 'draft', 'queued', 'investigating', 'warning', 'medium'].includes(lower)) return 'warning';
  if (['failed', 'critical', 'high', 'inactive', 'closed', 'archived'].includes(lower)) return 'danger';
  return 'neutral';
}

function errorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Request failed.';
}

function csv(value: unknown) {
  return String(value ?? '').split(',').map((entry) => entry.trim()).filter(Boolean);
}

function json(value: unknown) {
  try {
    return JSON.parse(String(value || '{}')) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function jsonArray(value: unknown) {
  try {
    const parsed = JSON.parse(String(value || '[]')) as unknown;
    return Array.isArray(parsed) ? parsed as Record<string, unknown>[] : [];
  } catch {
    return [];
  }
}

function mask(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(mask);
  if (!value || typeof value !== 'object') return value;
  const sensitive = ['token', 'secret', 'password', 'authorization', 'encrypted', 'signature', 'key'];
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
    key,
    sensitive.some((item) => key.toLowerCase().includes(item)) ? '[masked]' : mask(entry)
  ]));
}
