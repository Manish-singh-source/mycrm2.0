import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Archive,
  Ban,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  CopyCheck,
  Download,
  Eye,
  FileJson2,
  FileText,
  LifeBuoy,
  Link2,
  Plus,
  LockKeyhole,
  MessageSquareReply,
  MoreVertical,
  Paperclip,
  Pencil,
  PlugZap,
  RefreshCw,
  Repeat2,
  RotateCw,
  Save,
  Send,
  Settings2,
  Trash2,
  Split,
  UserCheck,
  UploadCloud,
  Wrench
} from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { platformQueryKeys } from '@/features/platform/api/platformQueryKeys';
import { PLATFORM_ROUTES } from '@/features/platform/routes/platformRoutes';
import { platformOperationsApi, type PlatformRecord } from '@/features/platform/operations/api/platformOperationsApi';
import type { ApiQuery, NormalizedApiResponse } from '@/lib/api/apiTypes';
import { ApiError } from '@/lib/api/apiError';
import { createListQuery } from '@/lib/api/listQuery';
import { DataTable, type DataTableColumn } from '@/shared/components/data-table';
import { AppDrawer } from '@/shared/components/drawer';
import { PageHeader, StatusBadge, Tabs } from '@/shared/components/layout';
import { AppModal } from '@/shared/components/modal';
import { Button, PermissionButton } from '@/shared/components/ui';
import { ConfirmDialog } from '@/shared/components/workflows';

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
  | 'ticketEditor'
  | 'ticketAssign'
  | 'ticketReply'
  | 'ticketAttach'
  | 'ticketClose'
  | 'ticketReopen'
  | 'articleEditor'
  | 'articlePublish'
  | 'articleArchive'
  | 'categoryEditor'
  | 'remoteEnd'
  | 'reportExport'
  | 'alertResolve'
  | 'incidentEditor'
  | 'payload'
  | 'retry'
  | 'providerEditor'
  | 'connectProvider'
  | 'integrationEditor'
  | 'integrationTest'
  | 'integrationDisconnect'
  | 'integrationRateLimits'
  | 'rotateCredentials'
  | 'fieldMapping'
  | 'integrationWebhookEditor'
  | 'integrationWebhookDisable'
  | 'integrationWebhookLogs'
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
  type?: 'text' | 'textarea' | 'select' | 'number' | 'date' | 'datetime-local' | 'checkbox' | 'multiselect' | 'file';
  options?: string[];
  reference?: 'features' | 'categories' | 'tenants' | 'platformUsers' | 'files' | 'providers' | 'tenantIntegrations';
  required?: boolean;
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

export function PlatformModulesPage() { return <PlatformModulesListPage />; }
export function PlatformModuleCreatePage() { return <PlatformModuleFormPage mode="create" />; }
export function PlatformModuleEditPage() { return <PlatformModuleFormPage mode="edit" />; }
export function PlatformModuleViewPage() { return <PlatformModuleDetailPage />; }
export function PlatformSupportTicketsPage() { return <OperationsPage config={configs['support-tickets']} />; }
export function PlatformSupportTicketViewPage() {
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const query = useQuery({
    queryKey: platformQueryKeys.detail('support-tickets', id),
    queryFn: () => platformOperationsApi.support.tickets.detail(id),
    enabled: Boolean(id)
  });
  const ticket: PlatformRecord = query.data ?? {};
  const comments = arrayFromResponse(ticket, 'comments');
  const attachments = arrayFromResponse(ticket, 'attachments');
  const audit = arrayFromResponse(ticket, 'audit');
  const detail = Object.fromEntries(Object.entries(mask(ticket) as Record<string, unknown>).filter(([key]) => !['comments', 'attachments', 'audit'].includes(key)));

  return (
    <section className="enterprise-module-page">
      <PageHeader
        title={printable(ticket.ticket_number ?? ticket.subject ?? 'Support Ticket')}
        description={printable(ticket.subject ?? 'Ticket detail, replies, files, and audit history.')}
        actions={<Button type="button" variant="secondary" onClick={() => navigate('/platform/support/tickets')}>Back</Button>}
      />
      {query.isLoading ? <div className="surface-state">Loading ticket details...</div> : null}
      {query.isError ? <div className="surface-error">{errorMessage(query.error)}</div> : null}
      {!query.isLoading && !query.isError ? (
        <div className="support-ticket-page-grid">
          <section className="dashboard-panel">
            <h3>Details</h3>
            <DetailGrid record={detail} />
          </section>
          <TicketComments rows={comments} />
          <TicketAttachments rows={attachments} />
          <TicketAudit rows={audit} />
        </div>
      ) : null}
    </section>
  );
}
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

type ModuleModal = 'filters' | 'views' | 'columns' | 'features' | 'delete' | 'bulkDelete' | 'toggle' | null;

const moduleRoute = PLATFORM_ROUTES.catalog.modules;
const moduleStatusOptions = ['active', 'inactive'];
const moduleCategoryOptions = ['crm', 'sales', 'support', 'billing', 'commerce', 'operations', 'analytics', 'integrations', 'security', 'platform'];

function PlatformModulesListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<PlatformRecord | null>(null);
  const [modal, setModal] = useState<ModuleModal>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [hiddenColumnIds, setHiddenColumnIds] = useState<string[]>([]);
  const [perPage, setPerPage] = useState(10);
  const queryParams = { ...createListQuery({ page, per_page: perPage, search }), status: statusFilter || undefined };
  const query = useQuery({
    queryKey: platformQueryKeys.list('modules', queryParams),
    queryFn: () => platformOperationsApi.modules.list(queryParams)
  });
  const rows = query.data?.data ?? [];
  const selectedRows = rows.filter((row) => selectedIds.includes(idOf(row)));
  const mutation = useMutation({
    mutationFn: async ({ action, record }: { action: 'delete' | 'bulkDelete' | 'toggle'; record?: PlatformRecord | null }) => {
      if (action === 'bulkDelete') return platformOperationsApi.modules.bulkDelete(selectedIds);
      const target = record ?? selectedRecord;
      if (!target) throw new Error('Select a module first.');
      const id = idOf(target);
      if (action === 'toggle') return target.status === 'active' ? platformOperationsApi.modules.disable(id) : platformOperationsApi.modules.enable(id);
      return platformOperationsApi.modules.delete(id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: platformQueryKeys.resource('modules') });
      setModal(null);
      setSelectedRecord(null);
      setSelectedIds([]);
    }
  });
  const columns = moduleColumns({
    onView: (record) => navigate(`${moduleRoute}/${idOf(record)}`),
    onEdit: (record) => navigate(`${moduleRoute}/${idOf(record)}/edit`),
    onToggle: (record) => { setSelectedRecord(record); setModal('toggle'); },
    onFeatures: (record) => { setSelectedRecord(record); setModal('features'); },
    onDelete: (record) => { setSelectedRecord(record); setModal('delete'); }
  });

  return (
    <section className="enterprise-module-page platform-operations-page">
      <PageHeader
        title="Modules"
        description="Manage platform module registry records and feature assignments."
        actions={<PermissionButton guard="platform" permission="module.edit" type="button" onClick={() => navigate(`${moduleRoute}/create`)}><Plus size={16} aria-hidden />Create Module</PermissionButton>}
      />
      <ModuleStats rows={rows} stats={query.data?.meta?.stats as ModuleStatsData | undefined} totalCount={query.data?.total} />
      <DataTable
        columns={columns}
        data={rows}
        getRowId={idOf}
        loading={query.isLoading}
        error={query.isError ? errorMessage(query.error) : ''}
        searchValue={search}
        searchPlaceholder="Search modules..."
        onSearchChange={(value) => { setSearch(value); setPage(1); }}
        hiddenColumnIds={hiddenColumnIds}
        onHiddenColumnIdsChange={setHiddenColumnIds}
        onOpenSavedViews={() => setModal('views')}
        onOpenFilters={() => setModal('filters')}
        onOpenColumns={() => setModal('columns')}
        onOpenExport={() => platformOperationsApi.modules.export()}
        onOpenImport={() => platformOperationsApi.modules.import()}
        selectedRowIds={selectedIds}
        onSelectionChange={setSelectedIds}
        bulkActions={<PermissionButton guard="platform" permission="module.edit" type="button" variant="danger" size="sm" onClick={() => setModal('bulkDelete')}><Trash2 size={15} aria-hidden />Delete selected</PermissionButton>}
        page={page}
        perPage={perPage}
        total={query.data?.total ?? rows.length}
        onPageChange={setPage}
        onPerPageChange={(value) => { setPerPage(value); setPage(1); setSelectedIds([]); }}
      />
      <ModuleTableModals
        modal={modal}
        columns={columns}
        hiddenColumnIds={hiddenColumnIds}
        statusFilter={statusFilter}
        onClose={() => setModal(null)}
        onStatusFilterChange={(value) => { setStatusFilter(value); setPage(1); }}
        onHiddenColumnIdsChange={setHiddenColumnIds}
      />
      <ModuleFeatureModal module={selectedRecord} open={modal === 'features'} onClose={() => setModal(null)} onComplete={() => { setModal(null); void queryClient.invalidateQueries({ queryKey: platformQueryKeys.resource('modules') }); }} />
      <ConfirmDialog
        open={modal === 'toggle'}
        onClose={() => setModal(null)}
        title={`${selectedRecord?.status === 'active' ? 'Deactivate' : 'Activate'} module?`}
        description={`${selectedRecord?.status === 'active' ? 'Deactivate' : 'Activate'} ${printable(selectedRecord?.name ?? selectedRecord?.code)}.`}
        confirmLabel={selectedRecord?.status === 'active' ? 'Deactivate' : 'Activate'}
        confirmTone="primary"
        guard="platform"
        permission="module.edit"
        loading={mutation.isPending}
        error={mutation.error ? errorMessage(mutation.error) : null}
        onConfirm={() => mutation.mutate({ action: 'toggle' })}
      />
      <ConfirmDialog
        open={modal === 'delete'}
        onClose={() => setModal(null)}
        title="Delete module?"
        description={`This permanently deletes ${printable(selectedRecord?.name ?? selectedRecord?.code)} when it is not core and has no feature or tenant override assignments.`}
        confirmLabel="Delete"
        confirmTone="danger"
        typedConfirmation="delete"
        guard="platform"
        permission="module.edit"
        loading={mutation.isPending}
        error={mutation.error ? errorMessage(mutation.error) : null}
        onConfirm={() => mutation.mutate({ action: 'delete' })}
      />
      <ConfirmDialog
        open={modal === 'bulkDelete'}
        onClose={() => setModal(null)}
        title="Delete selected modules?"
        description={`This permanently deletes ${selectedRows.length} selected module${selectedRows.length === 1 ? '' : 's'} when they are not core and have no assignments.`}
        confirmLabel="Delete"
        confirmTone="danger"
        typedConfirmation="delete"
        guard="platform"
        permission="module.edit"
        loading={mutation.isPending}
        error={mutation.error ? errorMessage(mutation.error) : null}
        onConfirm={() => mutation.mutate({ action: 'bulkDelete' })}
      />
    </section>
  );
}

function PlatformModuleFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const queryClient = useQueryClient();
  const detailQuery = useQuery({
    queryKey: platformQueryKeys.detail('modules', id),
    queryFn: () => platformOperationsApi.modules.detail(id),
    enabled: mode === 'edit' && Boolean(id)
  });
  const [form, setForm] = useState<Record<string, string | boolean | number>>(() => defaultModuleForm());
  const mutation = useMutation({
    mutationFn: () => mode === 'create' ? platformOperationsApi.modules.create(cleanModulePayload(form)) : platformOperationsApi.modules.update(id, cleanModulePayload(form)),
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({ queryKey: platformQueryKeys.resource('modules') });
      const payload = (response as NormalizedApiResponse<Record<string, unknown>>).data;
      const record = recordFromResponse(payload, 'module');
      navigate(`${moduleRoute}/${idOf(record) || id}`);
    }
  });

  useEffect(() => {
    if (detailQuery.data) setForm(defaultModuleForm(detailQuery.data));
  }, [detailQuery.data]);

  if (detailQuery.isLoading) return <div className="surface-state">Loading module...</div>;

  return (
    <section className="enterprise-module-page platform-operations-page">
      <PageHeader
        title={`${mode === 'create' ? 'Create' : 'Edit'} Module`}
        description="Registry fields control platform module availability and ordering."
        actions={<Button type="button" variant="secondary" onClick={() => navigate(moduleRoute)}>Back</Button>}
      />
      {detailQuery.isError ? <div className="surface-error">{errorMessage(detailQuery.error)}</div> : null}
      {mutation.error ? <div className="surface-error">{errorMessage(mutation.error)}</div> : null}
      <form className="enterprise-form" onSubmit={(event) => { event.preventDefault(); mutation.mutate(); }}>
        <div className="enterprise-form__grid">
          {moduleFormFields.map((field) => (
            <label key={field.name} className={field.type === 'checkbox' ? 'check-row' : undefined}>
              {field.type === 'checkbox' ? (
                <><input type="checkbox" checked={Boolean(form[field.name])} onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.checked }))} />{field.label}</>
              ) : (
                <>
                  <FieldLabel required={field.required}>{field.label}</FieldLabel>
                  {field.type === 'select' ? (
                    <select required={field.required} value={String(form[field.name] ?? '')} onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))}>
                      {field.options?.map((option) => <option key={option} value={option}>{label(option)}</option>)}
                    </select>
                  ) : field.type === 'textarea' ? (
                    <textarea value={String(form[field.name] ?? '')} onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))} />
                  ) : (
                    <input required={field.required} type={field.type ?? 'text'} value={String(form[field.name] ?? '')} onChange={(event) => setForm((current) => ({ ...current, [field.name]: field.type === 'number' ? Number(event.target.value) : event.target.value }))} />
                  )}
                </>
              )}
            </label>
          ))}
        </div>
        <footer className="enterprise-form__footer">
          <Button type="button" variant="secondary" onClick={() => navigate(moduleRoute)}>Cancel</Button>
          <PermissionButton guard="platform" permission="module.edit" type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Saving...' : 'Save'}</PermissionButton>
        </footer>
      </form>
    </section>
  );
}

function PlatformModuleDetailPage() {
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<ModuleModal>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'features' | 'activity'>('overview');
  const query = useQuery({
    queryKey: platformQueryKeys.detail('modules', id),
    queryFn: () => platformOperationsApi.modules.detail(id),
    enabled: Boolean(id)
  });
  const module = query.data;
  const features = arrayFromResponse(module?.features, 'features');
  const activity = arrayFromResponse(module?.activity, 'activity');
  const mutation = useMutation({
    mutationFn: async (action: 'toggle' | 'delete') => {
      if (!module) throw new Error('Module not loaded.');
      if (action === 'toggle') return module.status === 'active' ? platformOperationsApi.modules.disable(id) : platformOperationsApi.modules.enable(id);
      return platformOperationsApi.modules.delete(id);
    },
    onSuccess: async (_, action) => {
      await queryClient.invalidateQueries({ queryKey: platformQueryKeys.resource('modules') });
      if (action === 'delete') navigate(moduleRoute);
      setModal(null);
      void query.refetch();
    }
  });

  if (query.isLoading) return <div className="surface-state">Loading module...</div>;
  if (query.isError) return <div className="surface-error">{errorMessage(query.error)}</div>;
  if (!module) return <div className="empty-state">Module not found.</div>;

  return (
    <section className="enterprise-module-page platform-operations-page">
      <PageHeader
        title={printable(module.name ?? module.code)}
        description={printable(module.description ?? 'Module registry detail')}
        actions={
          <>
            <Button type="button" variant="secondary" onClick={() => navigate(moduleRoute)}>Back</Button>
            <Button type="button" variant="secondary" onClick={() => navigate(`${moduleRoute}/${id}/edit`)}><Pencil size={16} aria-hidden />Edit</Button>
            <PermissionButton guard="platform" permission="module.edit" type="button" variant="secondary" onClick={() => setModal('toggle')}><CheckCircle2 size={16} aria-hidden />{module.status === 'active' ? 'Deactivate' : 'Activate'}</PermissionButton>
            <PermissionButton guard="platform" permission="module.edit" type="button" variant="secondary" onClick={() => setModal('features')}><Wrench size={16} aria-hidden />Add Feature</PermissionButton>
            <PermissionButton guard="platform" permission="module.edit" type="button" variant="danger" onClick={() => setModal('delete')}><Trash2 size={16} aria-hidden />Delete</PermissionButton>
          </>
        }
      />
      <ModuleDetailStats module={module} />
      <section className="dashboard-panel">
        <Tabs
          tabs={[{ id: 'overview', label: 'Overview' }, { id: 'features', label: 'Features' }, { id: 'activity', label: 'Activity' }]}
          activeId={activeTab}
          onChange={(tab) => setActiveTab(tab as 'overview' | 'features' | 'activity')}
          ariaLabel="Module detail tabs"
        />
        <div className="surface-body">
          <ModuleDetailTabs module={module} active={activeTab} />
        </div>
      </section>
      <ModuleFeatureModal module={module} open={modal === 'features'} onClose={() => setModal(null)} onComplete={() => { setModal(null); void query.refetch(); }} />
      <ConfirmDialog
        open={modal === 'toggle'}
        onClose={() => setModal(null)}
        title={`${module.status === 'active' ? 'Deactivate' : 'Activate'} module?`}
        description={`${module.status === 'active' ? 'Deactivate' : 'Activate'} ${printable(module.name ?? module.code)}.`}
        confirmLabel={module.status === 'active' ? 'Deactivate' : 'Activate'}
        confirmTone="primary"
        guard="platform"
        permission="module.edit"
        loading={mutation.isPending}
        error={mutation.error ? errorMessage(mutation.error) : null}
        onConfirm={() => mutation.mutate('toggle')}
      />
      <ConfirmDialog
        open={modal === 'delete'}
        onClose={() => setModal(null)}
        title="Delete module?"
        description={`This permanently deletes ${printable(module.name ?? module.code)} when it is not core and has no assignments.`}
        confirmLabel="Delete"
        confirmTone="danger"
        typedConfirmation="delete"
        guard="platform"
        permission="module.edit"
        loading={mutation.isPending}
        error={mutation.error ? errorMessage(mutation.error) : null}
        onConfirm={() => mutation.mutate('delete')}
      />
    </section>
  );
}

function ModuleDetailTabs({ module, active }: { module: PlatformRecord; active: 'overview' | 'features' | 'activity' }) {
  if (active === 'features') return <RelatedRows title="Features" rows={arrayFromResponse(module.features, 'features')} />;
  if (active === 'activity') return <RelatedRows title="Activity" rows={arrayFromResponse(module.activity, 'activity')} />;
  const detail = Object.fromEntries(Object.entries(module).filter(([key]) => !['features', 'tenant_overrides', 'activity'].includes(key)));
  return <DetailGrid record={detail} />;
}

type ModuleStatsData = Record<string, string | number | boolean | null | undefined>;

function ModuleStats({ rows, stats, totalCount }: { rows: PlatformRecord[]; stats?: ModuleStatsData; totalCount?: number }) {
  const totalRecords = Number(stats?.total ?? totalCount ?? rows.length);
  const activeRecords = Number(stats?.active ?? rows.filter((row) => row.status === 'active').length);
  return (
    <section className="platform-access-summary">
      <SummaryTile icon={<Wrench />} label="Total Modules" value={String(totalRecords)} />
      <SummaryTile icon={<CheckCircle2 />} label="Active" value={String(activeRecords)} />
    </section>
  );
}

function ModuleDetailStats({ module }: { module: PlatformRecord }) {
  const features = arrayFromResponse(module.features, 'features');
  return (
    <section className="platform-access-summary">
      <SummaryTile icon={<Wrench />} label="Total Modules" value="1" />
      <SummaryTile icon={<FileJson2 />} label="Total Features" value={String(features.length)} />
      <SummaryTile icon={<CheckCircle2 />} label="Active" value={module.status === 'active' ? '1' : '0'} />
    </section>
  );
}

function SummaryTile({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <article className="summary-card"><span>{icon}</span><p>{label}</p><strong>{value}</strong></article>;
}

function moduleColumns({ onView, onEdit, onToggle, onFeatures, onDelete }: {
  onView: (record: PlatformRecord) => void;
  onEdit: (record: PlatformRecord) => void;
  onToggle: (record: PlatformRecord) => void;
  onFeatures: (record: PlatformRecord) => void;
  onDelete: (record: PlatformRecord) => void;
}): DataTableColumn<PlatformRecord>[] {
  const allColumns: DataTableColumn<PlatformRecord>[] = [
    { id: 'name', header: 'Name', accessor: (row) => printable(row.name), enableSorting: true, cell: (row) => <strong>{printable(row.name)}</strong> },
    { id: 'code', header: 'Code', accessor: (row) => printable(row.code), enableSorting: true, cell: (row) => printable(row.code) },
    { id: 'category', header: 'Category', accessor: (row) => printable(row.category), cell: (row) => printable(row.category) },
    { id: 'icon', header: 'Icon', accessor: (row) => printable(row.icon), cell: (row) => printable(row.icon) },
    { id: 'is_core', header: 'Core', accessor: (row) => Boolean(row.is_core), cell: (row) => printable(row.is_core) },
    { id: 'status', header: 'Status', accessor: (row) => printable(row.status), cell: (row) => <StatusBadge tone={tone(String(row.status ?? 'neutral'))}>{printable(row.status)}</StatusBadge> },
    { id: 'sort_order', header: 'Sort Order', accessor: (row) => Number(row.sort_order ?? 0), cell: (row) => printable(row.sort_order ?? 0) },
    { id: 'actions', header: 'Actions', enableHiding: false, cell: (row) => <ModuleRowActions row={row} onView={onView} onEdit={onEdit} onToggle={onToggle} onFeatures={onFeatures} onDelete={onDelete} /> }
  ];
  return allColumns;
}

function ModuleRowActions({ row, onView, onEdit, onToggle, onFeatures, onDelete }: {
  row: PlatformRecord;
  onView: (record: PlatformRecord) => void;
  onEdit: (record: PlatformRecord) => void;
  onToggle: (record: PlatformRecord) => void;
  onFeatures: (record: PlatformRecord) => void;
  onDelete: (record: PlatformRecord) => void;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  function run(callback: () => void) { callback(); setOpen(false); }
  return (
    <div className="action-dropdown">
      <button ref={triggerRef} type="button" className="action-menu-trigger" aria-label={`Open actions for ${printable(row.name ?? row.code)}`} aria-expanded={open} onClick={() => setOpen((current) => !current)}><MoreVertical size={16} aria-hidden /></button>
      <PortalActionMenu open={open} anchorRef={triggerRef} onClose={() => setOpen(false)}>
        <div className="action-menu" role="menu">
          <button type="button" role="menuitem" onMouseDown={(event) => event.preventDefault()} onClick={() => run(() => onView(row))}><Eye size={15} aria-hidden /> View</button>
          <button type="button" role="menuitem" onMouseDown={(event) => event.preventDefault()} onClick={() => run(() => onEdit(row))}><Pencil size={15} aria-hidden /> Edit</button>
          <button type="button" role="menuitem" onMouseDown={(event) => event.preventDefault()} onClick={() => run(() => onToggle(row))}><CheckCircle2 size={15} aria-hidden /> {row.status === 'active' ? 'Deactivate' : 'Activate'}</button>
          <button type="button" role="menuitem" onMouseDown={(event) => event.preventDefault()} onClick={() => run(() => onFeatures(row))}><Wrench size={15} aria-hidden /> Add Feature</button>
          <hr />
          <button type="button" role="menuitem" className="is-danger" onMouseDown={(event) => event.preventDefault()} onClick={() => run(() => onDelete(row))}><Trash2 size={15} aria-hidden /> Delete</button>
        </div>
      </PortalActionMenu>
    </div>
  );
}

function ModuleTableModals({ modal, columns, hiddenColumnIds, statusFilter, onClose, onStatusFilterChange, onHiddenColumnIdsChange }: {
  modal: ModuleModal;
  columns: DataTableColumn<PlatformRecord>[];
  hiddenColumnIds: string[];
  statusFilter: string;
  onClose: () => void;
  onStatusFilterChange: (value: string) => void;
  onHiddenColumnIdsChange: (ids: string[]) => void;
}) {
  return (
    <>
      <AppModal open={modal === 'views'} onClose={onClose} title="Saved views"><div className="form-grid"><label className="check-row"><input type="radio" checked readOnly /> Default table</label></div></AppModal>
      <AppModal open={modal === 'filters'} onClose={onClose} title="Filters"><div className="form-grid"><label><FieldLabel>Status</FieldLabel><select value={statusFilter} onChange={(event) => onStatusFilterChange(event.target.value)}><option value="">All statuses</option>{moduleStatusOptions.map((option) => <option key={option} value={option}>{label(option)}</option>)}</select></label></div></AppModal>
      <AppModal open={modal === 'columns'} onClose={onClose} title="Columns"><div className="form-grid">{columns.filter((column) => column.enableHiding !== false).map((column) => <label key={column.id} className="check-row"><input type="checkbox" checked={!hiddenColumnIds.includes(column.id)} onChange={() => onHiddenColumnIdsChange(hiddenColumnIds.includes(column.id) ? hiddenColumnIds.filter((id) => id !== column.id) : [...hiddenColumnIds, column.id])} />{column.header}</label>)}</div></AppModal>
    </>
  );
}

function ModuleFeatureModal({ module, open, onClose, onComplete }: { module?: PlatformRecord | null; open: boolean; onClose: () => void; onComplete: () => void }) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string[]>([]);
  const moduleId = idOf(module ?? undefined);
  const optionsQuery = useQuery({
    queryKey: platformQueryKeys.list('features', { per_page: 200 }),
    queryFn: () => platformOperationsApi.references.features({ per_page: 200 }),
    enabled: open
  });
  const currentQuery = useQuery({
    queryKey: platformQueryKeys.related('modules', moduleId, 'features'),
    queryFn: () => platformOperationsApi.modules.features(moduleId),
    enabled: open && Boolean(moduleId)
  });
  const mutation = useMutation({
    mutationFn: () => platformOperationsApi.modules.replaceFeatures(moduleId, selected),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: platformQueryKeys.resource('modules') });
      onComplete();
    }
  });
  useEffect(() => {
    if (!open) return;
    setSelected(arrayFromResponse(currentQuery.data?.data, 'features').map(idOf).filter(Boolean));
  }, [currentQuery.data, open]);
  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={`Features for ${printable(module?.name ?? module?.code)}`}
      guard="platform"
      permission="module.edit"
      loading={mutation.isPending}
      error={mutation.error ? errorMessage(mutation.error) : null}
      footer={<><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="button" disabled={!moduleId || optionsQuery.isLoading} onClick={() => mutation.mutate()}>Save</Button></>}
    >
      {optionsQuery.isLoading ? <div className="surface-state">Loading features...</div> : null}
      {optionsQuery.isError ? <div className="surface-error">{errorMessage(optionsQuery.error)}</div> : null}
      <CheckboxSelect options={optionsQuery.data?.data ?? []} selected={selected} onChange={setSelected} />
    </AppModal>
  );
}

const moduleFormFields: Field[] = [
  { name: 'name', label: 'Name', required: true },
  { name: 'code', label: 'Code', required: true },
  { name: 'category', label: 'Category', type: 'select', options: moduleCategoryOptions },
  { name: 'icon', label: 'Icon' },
  { name: 'is_core', label: 'Core module', type: 'checkbox' },
  { name: 'status', label: 'Status', type: 'select', options: moduleStatusOptions },
  { name: 'sort_order', label: 'Sort Order', type: 'number' },
  { name: 'description', label: 'Description', type: 'textarea' }
];

function defaultModuleForm(record?: PlatformRecord): Record<string, string | boolean | number> {
  return {
    name: printable(record?.name === '-' ? '' : record?.name ?? ''),
    code: printable(record?.code === '-' ? '' : record?.code ?? ''),
    category: String(record?.category ?? 'platform'),
    icon: String(record?.icon ?? ''),
    is_core: Boolean(record?.is_core),
    status: String(record?.status ?? 'active'),
    sort_order: Number(record?.sort_order ?? 0),
    description: String(record?.description ?? '')
  };
}

function cleanModulePayload(form: Record<string, string | boolean | number>) {
  return Object.fromEntries(Object.entries(form).filter(([, value]) => value !== ''));
}

function recordFromResponse(payload: unknown, key: string): PlatformRecord {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return {};
  const record = payload as Record<string, unknown>;
  return record[key] && typeof record[key] === 'object' && !Array.isArray(record[key]) ? record[key] as PlatformRecord : record as PlatformRecord;
}
function OperationsPage({ config }: { config: AreaConfig }) {
  const location = useLocation();
  const navigate = useNavigate();
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
  const handleAction = useCallback((state: ActionState) => {
    if (config.id === 'support-tickets' && state.key === 'payload') {
      navigate(`/platform/support/tickets/${encodeURIComponent(idOf(state.record))}`);
      return;
    }
    setAction(state);
  }, [config.id, navigate]);
  const columns = useMemo(() => buildColumns(tab.columns, tab.primary ?? [], tab.actions ?? [], handleAction, activeTab), [activeTab, handleAction, tab]);

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
  if (config.id === 'support-tickets') return <><Button type="button" onClick={() => onAction('ticketEditor')}><LifeBuoy size={16} aria-hidden />Create Ticket</Button><Button type="button" variant="secondary" onClick={() => onAction('reportExport')}><Download size={16} aria-hidden />Export</Button></>;
  if (config.id === 'remote-login') return null;
  if (config.id === 'knowledge-base') return <Button type="button" onClick={() => onAction(activeTab === 'categories' ? 'categoryEditor' : 'articleEditor')}><BookOpen size={16} aria-hidden />{activeTab === 'categories' ? 'Create Category' : 'Create Article'}</Button>;
  if (config.id === 'monitoring') return <Button type="button" onClick={() => onAction('incidentEditor')}><AlertTriangle size={16} aria-hidden />New Incident</Button>;
  if (config.id === 'integrations') {
    if (activeTab === 'providers') return <Button type="button" onClick={() => onAction('providerEditor')}><PlugZap size={16} aria-hidden />Create Provider</Button>;
    if (activeTab === 'webhooks') return <Button type="button" onClick={() => onAction('integrationWebhookEditor')}><UploadCloud size={16} aria-hidden />Create Webhook</Button>;
    if (activeTab === 'tenant') return <Button type="button" onClick={() => onAction('connectProvider')}><PlugZap size={16} aria-hidden />Connect Integration</Button>;
    return null;
  }
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
      cell: (row) => <RowActionMenu actions={actions} onAction={onAction} row={row} tab={tab} />
    }
  ];
}

function RowActionMenu({
  actions,
  onAction,
  row,
  tab
}: {
  actions: Array<{ key: ActionKey; label: string; icon?: ReactNode }>;
  onAction: (state: ActionState) => void;
  row: PlatformRecord;
  tab: string;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const visibleActions = actions.filter((entry) => isActionVisible(entry.key, row));

  function run(state: ActionState) {
    onAction(state);
    setOpen(false);
  }

  return (
    <div className="action-dropdown">
      <button
        ref={triggerRef}
        type="button"
        className="action-menu-trigger"
        aria-label={`Open actions for ${printable(row.name ?? row.title ?? row.code ?? row.uuid ?? row.id)}`}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <MoreVertical size={16} aria-hidden />
      </button>
      <PortalActionMenu open={open} anchorRef={triggerRef} onClose={() => setOpen(false)}>
        <div className="action-menu" role="menu">
          <button type="button" role="menuitem" onClick={() => run({ key: 'payload', record: row, tab })}>
            <Eye size={15} aria-hidden /> View
          </button>
          {visibleActions.map((entry) => (
            <button key={entry.label} type="button" role="menuitem" onClick={() => run({ key: entry.key, record: row, tab })}>
              {entry.icon}
              {actionLabel(entry, row)}
            </button>
          ))}
        </div>
      </PortalActionMenu>
    </div>
  );
}

function PortalActionMenu({
  anchorRef,
  children,
  onClose,
  open
}: {
  anchorRef: React.RefObject<HTMLElement>;
  children: ReactNode;
  onClose: () => void;
  open: boolean;
}) {
  const [position, setPosition] = useState({ left: 0, top: 0 });

  useEffect(() => {
    if (!open) return;
    const rect = anchorRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = 240;
    const height = 320;
    const left = Math.min(Math.max(12, rect.right - width), window.innerWidth - width - 12);
    const opensUp = rect.bottom + height > window.innerHeight && rect.top > height;
    setPosition({
      left,
      top: opensUp ? Math.max(12, rect.top - height - 8) : Math.min(rect.bottom + 8, window.innerHeight - 12)
    });
  }, [anchorRef, open]);

  if (!open) return null;

  return createPortal(
    <div className="action-menu-portal" style={{ left: position.left + window.scrollX, top: position.top + window.scrollY }}>
      <button type="button" className="action-menu-backdrop" aria-label="Close actions menu" onClick={onClose} />
      {children}
    </div>,
    document.body
  );
}

function actionLabel(entry: { key: ActionKey; label: string }, row: PlatformRecord) {
  if (entry.key === 'moduleToggle') return String(row.status) === 'active' ? 'Disable' : 'Enable';
  if (entry.key === 'articlePublish') return String(row.status) === 'published' ? 'Unpublish' : 'Publish';
  return entry.label;
}

function isActionVisible(key: ActionKey, row: PlatformRecord) {
  if (key === 'ticketClose') return String(row.status ?? '').toLowerCase() !== 'closed';
  if (key === 'ticketReopen') return String(row.status ?? '').toLowerCase() === 'closed';
  if (key === 'remoteEnd') return !['ended', 'expired'].includes(String(row.status ?? '').toLowerCase());
  return true;
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
  const webhookLogRetryMutation = useMutation({
    mutationFn: (logId: string | number) => platformOperationsApi.integrations.retryWebhookLog(logId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: platformQueryKeys.all });
    }
  });
  const [payload, setPayload] = useState<Record<string, unknown>>({});
  const fields = fieldsFor(area, action);
  const featureOptionsQuery = useQuery({
    queryKey: platformQueryKeys.list('features', { per_page: 200 }),
    queryFn: () => platformOperationsApi.references.features({ per_page: 200 }),
    enabled: action.key === 'featureAttach'
  });
  const categoryOptionsQuery = useQuery({
    queryKey: platformQueryKeys.list('kb-categories', { per_page: 200 }),
    queryFn: () => platformOperationsApi.support.kbCategories.list({ per_page: 200 }),
    enabled: action.key === 'articleEditor' || action.key === 'categoryEditor'
  });
  const tenantOptionsQuery = useQuery({
    queryKey: platformQueryKeys.list('tenant-options', { per_page: 200 }),
    queryFn: () => safeReferenceList(() => platformOperationsApi.references.tenants({ per_page: 200 })),
    enabled: ['ticketEditor', 'connectProvider', 'integrationEditor'].includes(String(action.key))
  });
  const platformUserOptionsQuery = useQuery({
    queryKey: platformQueryKeys.list('platform-user-options', { per_page: 200 }),
    queryFn: () => safeReferenceList(() => platformOperationsApi.references.platformUsers({ per_page: 200 })),
    enabled: ['ticketEditor', 'ticketAssign'].includes(String(action.key))
  });
  const providerOptionsQuery = useQuery({
    queryKey: platformQueryKeys.list('integration-provider-options', { per_page: 200 }),
    queryFn: () => safeReferenceList(() => platformOperationsApi.integrations.providers({ per_page: 200 })),
    enabled: ['connectProvider', 'integrationEditor'].includes(String(action.key))
  });
  const tenantIntegrationOptionsQuery = useQuery({
    queryKey: platformQueryKeys.list('tenant-integration-options', { per_page: 200 }),
    queryFn: () => safeReferenceList(() => platformOperationsApi.integrations.tenantIntegrations({ per_page: 200 })),
    enabled: action.key === 'integrationWebhookEditor'
  });
  const moduleDetailQuery = useQuery({
    queryKey: platformQueryKeys.detail('modules', idOf(action.record)),
    queryFn: () => platformOperationsApi.modules.detail(idOf(action.record)),
    enabled: area === 'modules' && action.key === 'payload' && Boolean(idOf(action.record))
  });
  const articleDetailQuery = useQuery({
    queryKey: platformQueryKeys.detail('kb-articles', idOf(action.record)),
    queryFn: () => platformOperationsApi.support.articles.detail(idOf(action.record)),
    enabled: area === 'knowledge-base' && (action.key === 'payload' || action.key === 'articleEditor') && Boolean(idOf(action.record))
  });
  const ticketDetailQuery = useQuery({
    queryKey: platformQueryKeys.detail('support-tickets', idOf(action.record)),
    queryFn: () => platformOperationsApi.support.tickets.detail(idOf(action.record)),
    enabled: area === 'support-tickets' && (action.key === 'payload' || action.key === 'ticketEditor') && Boolean(idOf(action.record))
  });
  const remoteSessionDetailQuery = useQuery({
    queryKey: platformQueryKeys.detail('remote-login-sessions', idOf(action.record)),
    queryFn: () => platformOperationsApi.support.remoteSessions.detail(idOf(action.record)),
    enabled: area === 'remote-login' && action.key === 'payload' && Boolean(idOf(action.record))
  });
  const tenantIntegrationDetailQuery = useQuery({
    queryKey: platformQueryKeys.detail('tenant-integrations', idOf(action.record)),
    queryFn: () => platformOperationsApi.integrations.detail(idOf(action.record)),
    enabled: area === 'integrations' && action.tab === 'tenant' && ['payload', 'integrationEditor'].includes(String(action.key)) && Boolean(idOf(action.record))
  });
  const integrationWebhookDetailQuery = useQuery({
    queryKey: platformQueryKeys.detail('integration-webhooks', idOf(action.record)),
    queryFn: () => platformOperationsApi.integrations.webhook(action.record?.id ?? idOf(action.record)),
    enabled: area === 'integrations' && action.tab === 'webhooks' && ['payload', 'integrationWebhookEditor'].includes(String(action.key)) && Boolean(idOf(action.record))
  });
  const integrationRateLimitsQuery = useQuery({
    queryKey: platformQueryKeys.related('tenant-integrations', idOf(action.record), 'rate-limits'),
    queryFn: () => platformOperationsApi.integrations.rateLimits(idOf(action.record)),
    enabled: area === 'integrations' && action.key === 'integrationRateLimits' && Boolean(idOf(action.record))
  });
  const integrationWebhookLogsQuery = useQuery({
    queryKey: platformQueryKeys.related('integration-webhooks', idOf(action.record), 'logs'),
    queryFn: () => platformOperationsApi.integrations.webhookLogs(action.record?.id ?? idOf(action.record)),
    enabled: area === 'integrations' && action.key === 'integrationWebhookLogs' && Boolean(idOf(action.record))
  });
  const currentModuleFeaturesQuery = useQuery({
    queryKey: platformQueryKeys.related('modules', idOf(action.record), 'features'),
    queryFn: () => platformOperationsApi.modules.features(idOf(action.record)),
    enabled: area === 'modules' && (action.key === 'payload' || action.key === 'featureAttach') && Boolean(idOf(action.record))
  });
  const moduleTenantsQuery = useQuery({
    queryKey: platformQueryKeys.related('modules', idOf(action.record), 'tenants'),
    queryFn: () => platformOperationsApi.modules.tenants(idOf(action.record)),
    enabled: area === 'modules' && action.key === 'payload' && Boolean(idOf(action.record))
  });
  const requiredMissing = action.key === 'ticketAttach'
    ? isEmptyField(payload.upload_file)
    : fields.some((field) => field.required && isEmptyField(payload[field.name]));

  useEffect(() => {
    setPayload(defaultPayloadFor(action));
  }, [action.key, action.record]);

  useEffect(() => {
    if (action.key === 'articleEditor' && articleDetailQuery.data) {
      setPayload(defaultPayloadFor({ ...action, record: articleDetailQuery.data }));
    }
  }, [action, articleDetailQuery.data]);

  useEffect(() => {
    if (action.key === 'ticketEditor' && ticketDetailQuery.data) {
      setPayload(defaultPayloadFor({ ...action, record: ticketDetailQuery.data }));
    }
  }, [action, ticketDetailQuery.data]);

  useEffect(() => {
    if (action.key === 'integrationEditor' && tenantIntegrationDetailQuery.data) {
      setPayload(defaultPayloadFor({ ...action, record: tenantIntegrationDetailQuery.data }));
    }
  }, [action, tenantIntegrationDetailQuery.data]);

  useEffect(() => {
    if (action.key === 'integrationWebhookEditor' && integrationWebhookDetailQuery.data) {
      setPayload(defaultPayloadFor({ ...action, record: integrationWebhookDetailQuery.data }));
    }
  }, [action, integrationWebhookDetailQuery.data]);

  useEffect(() => {
    if (action.key !== 'featureAttach') return;
    const rows = arrayFromResponse(currentModuleFeaturesQuery.data?.data, 'features');
    if (rows.length > 0) {
      setPayload((current) => ({ ...current, feature_uuids: rows.map(idOf).filter(Boolean) }));
    }
  }, [action.key, currentModuleFeaturesQuery.data]);

  if (!action.key) return null;
  if (action.key === 'payload' || action.key === 'auditCompare') {
    return (
      <AppDrawer open onClose={onClose} title={detailTitleFor(area, action)} guard="platform" permission={viewPermissionFor(area, action.key)} size="lg">
        <DetailGrid record={mask(detailRecordFor(area, action, {
          article: articleDetailQuery.data,
          module: moduleDetailQuery.data,
          remoteSession: remoteSessionDetailQuery.data,
          ticket: ticketDetailQuery.data,
          tenantIntegration: tenantIntegrationDetailQuery.data,
          integrationWebhook: integrationWebhookDetailQuery.data
        }))} />
        {area === 'modules' ? (
          <>
            <RelatedRows title="Features" rows={arrayFromResponse(currentModuleFeaturesQuery.data?.data, 'features')} />
            <RelatedRows title="Tenants" rows={moduleTenantsQuery.data?.data.tenants ?? []} />
          </>
        ) : null}
        {area === 'support-tickets' ? (
          <>
            <RelatedRows title="Comments" rows={arrayFromResponse(ticketDetailQuery.data, 'comments')} />
            <RelatedRows title="Attachments" rows={arrayFromResponse(ticketDetailQuery.data, 'attachments')} />
            <RelatedRows title="Audit" rows={arrayFromResponse(ticketDetailQuery.data, 'audit')} />
          </>
        ) : null}
      </AppDrawer>
    );
  }
  if (action.key === 'integrationRateLimits' || action.key === 'integrationWebhookLogs') {
    const rows = arrayFromResponse(
      action.key === 'integrationRateLimits' ? integrationRateLimitsQuery.data?.data : integrationWebhookLogsQuery.data?.data,
      action.key === 'integrationRateLimits' ? 'rate_limits' : 'logs'
    );
    return (
      <AppDrawer open onClose={onClose} title={titleFor(action.key)} guard="platform" permission="integration.view" size="lg">
        {action.key === 'integrationRateLimits' ? (
          <RelatedRows title="Rate Limits" rows={rows} />
        ) : (
          <IntegrationWebhookLogs
            rows={rows}
            loading={webhookLogRetryMutation.isPending}
            onRetry={(logId) => webhookLogRetryMutation.mutate(logId)}
          />
        )}
      </AppDrawer>
    );
  }
  if (['fieldMapping', 'incidentEditor', 'articleEditor', 'ticketEditor', 'providerEditor', 'connectProvider', 'integrationEditor', 'integrationWebhookEditor'].includes(action.key)) {
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
        footer={<><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="button" onClick={() => mutation.mutate(normalizePayload(action.key, payload))} disabled={requiredMissing}>Save</Button></>}
      >
          <GenericFields fields={fields} payload={payload} references={referenceOptions({
            categories: categoryOptionsQuery.data?.data,
            features: featureOptionsQuery.data?.data,
            platformUsers: platformUserOptionsQuery.data?.data,
            providers: providerOptionsQuery.data?.data,
            tenantIntegrations: tenantIntegrationOptionsQuery.data?.data,
            tenants: tenantOptionsQuery.data?.data
          })} onChange={setPayload} />
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
      footer={<><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="button" onClick={() => mutation.mutate(normalizePayload(action.key, payload))} disabled={requiredMissing}>Confirm</Button></>}
    >
      <GenericFields fields={fields} payload={payload} references={referenceOptions({
        categories: categoryOptionsQuery.data?.data,
        features: featureOptionsQuery.data?.data,
        platformUsers: platformUserOptionsQuery.data?.data,
        providers: providerOptionsQuery.data?.data,
        tenantIntegrations: tenantIntegrationOptionsQuery.data?.data,
        tenants: tenantOptionsQuery.data?.data
      })} onChange={setPayload} />
    </AppModal>
  );
}

function GenericFields({
  fields,
  onChange,
  payload,
  references = emptyReferences()
}: {
  fields: Field[];
  payload: Record<string, unknown>;
  references?: ReferenceOptions;
  onChange: (payload: Record<string, unknown>) => void;
}) {
  return (
    <div className="form-grid form-grid--two">
      {fields.map((field) => (
        <label key={field.name} className={field.type === 'checkbox' ? 'check-row' : undefined}>
          {field.type === 'checkbox' ? (
            <>
              <input type="checkbox" checked={Boolean(payload[field.name])} onChange={(event) => onChange({ ...payload, [field.name]: event.target.checked })} />
              <FieldLabel required={field.required}>{field.label}</FieldLabel>
            </>
          ) : (
            <>
              <FieldLabel required={field.required}>{field.label}</FieldLabel>
              {field.type === 'textarea' ? (
                <textarea required={field.required} value={String(payload[field.name] ?? '')} onChange={(event) => onChange({ ...payload, [field.name]: event.target.value })} />
              ) : field.type === 'multiselect' && field.reference === 'features' ? (
                <CheckboxSelect
                  options={references.features}
                  selected={values(payload[field.name])}
                  onChange={(next) => onChange({ ...payload, [field.name]: next })}
                />
              ) : field.reference === 'categories' ? (
                <select required={field.required} value={String(payload[field.name] ?? '')} onChange={(event) => onChange({ ...payload, [field.name]: event.target.value })}>
                  <option value="">Select category</option>
                  {references.categories.map((category) => <option key={idOf(category)} value={idOf(category)}>{printable(category.name ?? category.slug)}</option>)}
                </select>
              ) : field.reference ? (
                <ReferenceSelect field={field} reference={field.reference} references={references} value={String(payload[field.name] ?? '')} onChange={(value) => onChange({ ...payload, [field.name]: value })} />
              ) : field.type === 'select' ? (
                <select required={field.required} value={String(payload[field.name] ?? field.options?.[0] ?? '')} onChange={(event) => onChange({ ...payload, [field.name]: event.target.value })}>
                  {field.options?.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              ) : field.type === 'file' ? (
                <input required={field.required} type="file" onChange={(event) => onChange({ ...payload, [field.name]: event.target.files?.[0] ?? null })} />
              ) : (
                <input required={field.required} type={field.type ?? 'text'} value={String(payload[field.name] ?? '')} onChange={(event) => onChange({ ...payload, [field.name]: field.type === 'number' ? Number(event.target.value) : event.target.value })} />
              )}
            </>
          )}
        </label>
      ))}
    </div>
  );
}

function ReferenceSelect({
  field,
  onChange,
  reference,
  references,
  value
}: {
  field: Field;
  reference: NonNullable<Field['reference']>;
  references: ReferenceOptions;
  value: string;
  onChange: (value: string) => void;
}) {
  const rows = referenceRows(reference, references);
  const optionValue = (option: PlatformRecord) => reference === 'providers' ? String(option.code ?? idOf(option)) : idOf(option);
  const hasSelectedValue = Boolean(value) && rows.some((option) => optionValue(option) === value);
  return (
    <select required={field.required} value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">{rows.length === 0 ? `No ${field.label.toLowerCase()} loaded` : `Select ${field.label.toLowerCase()}`}</option>
      {value && !hasSelectedValue ? <option value={value}>Selected {field.label}</option> : null}
      {rows.map((option) => (
        <option key={optionValue(option)} value={optionValue(option)}>{referenceLabel(reference, option)}</option>
      ))}
    </select>
  );
}

type ReferenceOptions = {
  categories: PlatformRecord[];
  features: PlatformRecord[];
  files: PlatformRecord[];
  platformUsers: PlatformRecord[];
  providers: PlatformRecord[];
  tenantIntegrations: PlatformRecord[];
  tenants: PlatformRecord[];
};

async function safeReferenceList(loader: () => Promise<{ data: PlatformRecord[]; total: number }>) {
  try {
    return await loader();
  } catch {
    return { data: [], total: 0 };
  }
}

function emptyReferences(): ReferenceOptions {
  return { categories: [], features: [], files: [], platformUsers: [], providers: [], tenantIntegrations: [], tenants: [] };
}

function referenceOptions(input: Partial<ReferenceOptions>): ReferenceOptions {
  return {
    categories: input.categories ?? [],
    features: input.features ?? [],
    files: input.files ?? [],
    platformUsers: input.platformUsers ?? [],
    providers: input.providers ?? [],
    tenantIntegrations: input.tenantIntegrations ?? [],
    tenants: input.tenants ?? []
  };
}

function referenceRows(reference: NonNullable<Field['reference']>, references: ReferenceOptions) {
  if (reference === 'tenants') return references.tenants;
  if (reference === 'platformUsers') return references.platformUsers;
  if (reference === 'files') return references.files;
  if (reference === 'categories') return references.categories;
  if (reference === 'providers') return references.providers;
  if (reference === 'tenantIntegrations') return references.tenantIntegrations;
  return references.features;
}

function referenceLabel(reference: NonNullable<Field['reference']>, record: PlatformRecord) {
  if (reference === 'tenants') return printable(record.organization_name ?? record.name ?? record.slug ?? record.uuid);
  if (reference === 'platformUsers') return printable(record.display_name ?? record.name ?? record.email ?? record.uuid);
  if (reference === 'files') return printable(record.original_name ?? record.name ?? record.filename ?? record.uuid);
  if (reference === 'categories') return printable(record.name ?? record.slug ?? record.uuid);
  if (reference === 'providers') return printable(record.name ?? record.code);
  if (reference === 'tenantIntegrations') return printable(record.name ?? record.provider_code ?? record.uuid);
  return printable(record.name ?? record.code ?? record.uuid);
}

function FieldLabel({ children, required }: { children: ReactNode; required?: boolean }) {
  return (
    <span>
      {children}
      {required ? <span className="required-marker" aria-hidden="true">*</span> : null}
    </span>
  );
}

function CheckboxSelect({ options, selected, onChange }: { options: PlatformRecord[]; selected: string[]; onChange: (values: string[]) => void }) {
  if (options.length === 0) return <div className="empty-state">No feature options returned.</div>;
  function toggle(value: string) {
    onChange(selected.includes(value) ? selected.filter((entry) => entry !== value) : [...selected, value]);
  }
  return (
    <div className="record-list">
      {options.map((option) => {
        const value = idOf(option);
        return (
          <label key={value} className="check-row">
            <input type="checkbox" checked={selected.includes(value)} onChange={() => toggle(value)} />
            <span>{printable(option.name ?? option.code)} / {printable(option.module)}</span>
          </label>
        );
      })}
    </div>
  );
}

async function runAction(area: OperationArea, action: ActionState, payload: Record<string, unknown>, selectedIds: string[]) {
  const id = idOf(action.record);
  if (area === 'modules') {
    if (action.key === 'moduleEditor') return id ? platformOperationsApi.modules.update(id, payload) : platformOperationsApi.modules.create(payload);
    if (action.key === 'moduleToggle') return String(action.record?.status) === 'active' ? platformOperationsApi.modules.disable(id, payload) : platformOperationsApi.modules.enable(id, payload);
    if (action.key === 'featureAttach') return platformOperationsApi.modules.replaceFeatures(id, values(payload.feature_uuids));
  }
  if (area === 'support-tickets') {
    if (action.key === 'ticketEditor') return id ? platformOperationsApi.support.tickets.update(id, payload) : platformOperationsApi.support.tickets.create(payload);
    if (action.key === 'ticketAssign') return platformOperationsApi.support.tickets.assign(id, payload);
    if (action.key === 'ticketReply') return platformOperationsApi.support.tickets.comment(id, payload);
    if (action.key === 'ticketAttach') {
      const upload = payload.upload_file;
      if (upload instanceof File) {
        const body = new FormData();
        body.append('file', upload);
        body.append('visibility', 'private');
        body.append('purpose', 'support_ticket');
        return platformOperationsApi.support.tickets.attach(id, body);
      }
    }
    if (action.key === 'ticketClose') return platformOperationsApi.support.tickets.close(id, payload);
    if (action.key === 'ticketReopen') return platformOperationsApi.support.tickets.reopen(id, payload);
    if (action.key === 'reportExport') return platformOperationsApi.support.tickets.export({ selected_ids: selectedIds });
  }
  if (area === 'knowledge-base') {
    if (action.key === 'articleEditor') return id ? platformOperationsApi.support.articles.update(id, payload) : platformOperationsApi.support.articles.create(payload);
    if (action.key === 'articlePublish') return String(action.record?.status) === 'published' ? platformOperationsApi.support.articles.unpublish(id, payload) : platformOperationsApi.support.articles.publish(id, payload);
    if (action.key === 'articleArchive') return platformOperationsApi.support.articles.archive(id, payload);
    if (action.key === 'categoryEditor') return id ? platformOperationsApi.support.kbCategories.update(id, payload) : platformOperationsApi.support.kbCategories.create(payload);
  }
  if (area === 'remote-login' && action.key === 'remoteEnd') return platformOperationsApi.support.remoteSessions.end(id, payload);
  if (area === 'reports' && action.key === 'reportExport') return platformOperationsApi.reports.export(String(action.tab ?? 'revenue'), payload);
  if (area === 'monitoring') {
    if (action.key === 'alertResolve') return platformOperationsApi.monitoring.resolveAlert(action.record?.id ?? id, payload);
    if (action.key === 'incidentEditor') return id ? platformOperationsApi.monitoring.updateIncident(action.record?.id ?? id, payload) : platformOperationsApi.monitoring.createIncident(payload);
    if (action.key === 'retry' && action.tab === 'queue') return platformOperationsApi.monitoring.retryQueueJob(action.record?.id ?? id, payload);
  }
  if (area === 'integrations') {
    if (action.key === 'providerEditor') return id ? platformOperationsApi.integrations.updateProvider(id, payload) : platformOperationsApi.integrations.createProvider(payload);
    if (action.key === 'connectProvider') return platformOperationsApi.integrations.createTenantIntegration(payload);
    if (action.key === 'integrationEditor') return platformOperationsApi.integrations.updateTenantIntegration(id, payload);
    if (action.key === 'integrationTest') return platformOperationsApi.integrations.test(id);
    if (action.key === 'integrationDisconnect') return platformOperationsApi.integrations.disconnect(id, payload);
    if (action.key === 'rotateCredentials') return platformOperationsApi.integrations.rotateCredentials(id, { credentials: credentialsFromPayload(payload) });
    if (action.key === 'fieldMapping') return platformOperationsApi.integrations.replaceMappings(id, fieldMappingsFromPayload(payload));
    if (action.key === 'integrationWebhookEditor') return id ? platformOperationsApi.integrations.updateWebhook(action.record?.id ?? id, payload) : platformOperationsApi.integrations.createWebhook(payload);
    if (action.key === 'integrationWebhookDisable') return platformOperationsApi.integrations.disableWebhook(action.record?.id ?? id);
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
      { id: 'modules', label: 'Modules', resource: 'modules', query: platformOperationsApi.modules.list, columns: ['name', 'code', 'category', 'is_core', 'status', 'sort_order'], primary: ['name'], actions: [{ key: 'moduleEditor', label: 'Edit', icon: <Pencil size={14} aria-hidden /> }, { key: 'moduleToggle', label: 'Toggle', icon: <CheckCircle2 size={14} aria-hidden /> }, { key: 'featureAttach', label: 'Features', icon: <Wrench size={14} aria-hidden /> }] }
    ]
  },
  'support-tickets': {
    id: 'support-tickets',
    title: 'Support Tickets',
    description: 'Ticket queue, assignment, replies, internal notes, close/reopen flow, export, and linked payload views.',
    permission: 'support.ticket.view',
    tabs: [
      { id: 'tickets', label: 'Tickets', resource: 'support-tickets', query: platformOperationsApi.support.tickets.list, columns: ['ticket_number', 'tenant_name', 'subject', 'priority', 'status', 'source', 'assigned_to_name', 'opened_at'], primary: ['ticket_number', 'subject'], actions: [{ key: 'ticketEditor', label: 'Edit', icon: <Pencil size={14} aria-hidden /> }, { key: 'ticketAssign', label: 'Assign', icon: <UserCheck size={14} aria-hidden /> }, { key: 'ticketReply', label: 'Reply', icon: <MessageSquareReply size={14} aria-hidden /> }, { key: 'ticketAttach', label: 'Attach File', icon: <Paperclip size={14} aria-hidden /> }, { key: 'ticketClose', label: 'Close', icon: <CheckCircle2 size={14} aria-hidden /> }, { key: 'ticketReopen', label: 'Reopen', icon: <RefreshCw size={14} aria-hidden /> }] }
    ]
  },
  'knowledge-base': {
    id: 'knowledge-base',
    title: 'Knowledge Base',
    description: 'Categories and articles with editor drawer plus publish, unpublish, archive ready actions.',
    permission: 'support.knowledge_base.view',
    tabs: [
      { id: 'articles', label: 'Articles', resource: 'kb-articles', query: platformOperationsApi.support.articles.list, columns: ['title', 'slug', 'audience', 'status', 'published_at', 'updated_at'], primary: ['title'], actions: [{ key: 'articleEditor', label: 'Edit', icon: <Pencil size={14} aria-hidden /> }, { key: 'articlePublish', label: 'Publish', icon: <Send size={14} aria-hidden /> }, { key: 'articleArchive', label: 'Archive', icon: <Archive size={14} aria-hidden /> }] },
      { id: 'categories', label: 'Categories', resource: 'kb-categories', query: platformOperationsApi.support.kbCategories.list, columns: ['name', 'slug', 'audience', 'status', 'updated_at'], primary: ['name'], actions: [{ key: 'categoryEditor', label: 'Edit', icon: <Pencil size={14} aria-hidden /> }] }
    ]
  },
  'remote-login': {
    id: 'remote-login',
    title: 'Remote Login Sessions',
    description: 'Review tenant impersonation history and end active support sessions.',
    permission: 'tenant.impersonate',
    tabs: [
      { id: 'sessions', label: 'Sessions', resource: 'remote-login-sessions', query: platformOperationsApi.support.remoteSessions.list, columns: ['uuid', 'tenant_id', 'platform_user_id', 'reason', 'status', 'started_at', 'ended_at'], primary: ['uuid'], actions: [{ key: 'remoteEnd', label: 'End', icon: <Ban size={14} aria-hidden /> }] }
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
      { id: 'alerts', label: 'Alerts', resource: 'monitoring-alerts', query: platformOperationsApi.monitoring.alerts, columns: ['id', 'severity', 'message', 'status', 'triggered_at', 'resolved_at'], primary: ['message'], actions: [{ key: 'alertResolve', label: 'Resolve', icon: <CheckCircle2 size={14} aria-hidden /> }] },
      { id: 'incidents', label: 'Incidents', resource: 'system-incidents', query: platformOperationsApi.monitoring.incidents, columns: ['id', 'title', 'severity', 'status', 'started_at', 'resolved_at'], primary: ['title'], actions: [{ key: 'incidentEditor', label: 'Edit', icon: <Pencil size={14} aria-hidden /> }] },
      { id: 'usage', label: 'Usage Snapshots', resource: 'tenant-usage-snapshots', query: platformOperationsApi.monitoring.usage, columns: ['tenant_id', 'period_start', 'period_end', 'api_requests', 'storage_used_mb', 'created_at'] }
    ]
  },
  integrations: {
    id: 'integrations',
    title: 'Integrations',
    description: 'Provider catalog, tenant integrations, credentials, webhooks, sync jobs, mappings, and rate-limit surfaces.',
    permission: 'integration.view',
    tabs: [
      { id: 'providers', label: 'Providers', resource: 'integration-providers', query: platformOperationsApi.integrations.providers, columns: ['name', 'code', 'category', 'auth_type', 'status'], primary: ['name'], actions: [{ key: 'providerEditor', label: 'Edit', icon: <Pencil size={14} aria-hidden /> }] },
      { id: 'tenant', label: 'Tenant Integrations', resource: 'tenant-integrations', query: platformOperationsApi.integrations.tenantIntegrations, columns: ['uuid', 'tenant_name', 'provider_code', 'name', 'status', 'connected_at'], primary: ['name'], actions: [{ key: 'integrationEditor', label: 'Edit', icon: <Pencil size={14} aria-hidden /> }, { key: 'integrationTest', label: 'Test', icon: <CheckCircle2 size={14} aria-hidden /> }, { key: 'rotateCredentials', label: 'Rotate', icon: <LockKeyhole size={14} aria-hidden /> }, { key: 'fieldMapping', label: 'Mappings', icon: <Split size={14} aria-hidden /> }, { key: 'integrationRateLimits', label: 'Rate Limits', icon: <Clock size={14} aria-hidden /> }, { key: 'integrationDisconnect', label: 'Disconnect', icon: <Ban size={14} aria-hidden /> }] },
      { id: 'webhooks', label: 'Webhooks', resource: 'integration-webhooks', query: platformOperationsApi.integrations.webhooks, columns: ['id', 'tenant_integration_name', 'event', 'status', 'last_delivered_at'], actions: [{ key: 'integrationWebhookEditor', label: 'Edit', icon: <Pencil size={14} aria-hidden /> }, { key: 'integrationWebhookLogs', label: 'Logs', icon: <FileJson2 size={14} aria-hidden /> }, { key: 'integrationWebhookDisable', label: 'Disable', icon: <Ban size={14} aria-hidden /> }] },
      { id: 'sync', label: 'Sync Jobs', resource: 'integration-sync-jobs', query: platformOperationsApi.integrations.syncJobs, columns: ['id', 'tenant_integration_id', 'sync_type', 'entity', 'status', 'started_at', 'finished_at'], actions: [{ key: 'retry', label: 'Retry', icon: <RotateCw size={14} aria-hidden /> }, { key: 'payload', label: 'Payload', icon: <FileJson2 size={14} aria-hidden /> }] }
    ]
  },
  settings: {
    id: 'settings',
    title: 'Platform Settings',
    description: 'Grouped platform settings, notification templates, backups, and backup run history.',
    permission: 'setting.view',
    tabs: [
      { id: 'platform', label: 'Settings', resource: 'platform-settings', query: async () => settingsList(), columns: ['group', 'key', 'value_type', 'updated_at'], primary: ['group', 'key'], actions: [{ key: 'settingsEditor', label: 'Edit', icon: <Settings2 size={14} aria-hidden /> }] },
      { id: 'templates', label: 'Templates', resource: 'notification-templates', query: platformOperationsApi.settings.templates, columns: ['code', 'channel', 'subject', 'status', 'updated_at'], primary: ['code'], actions: [{ key: 'templateEditor', label: 'Edit', icon: <Pencil size={14} aria-hidden /> }] },
      { id: 'backups', label: 'Backups', resource: 'backup-runs', query: platformOperationsApi.settings.backupRuns, columns: ['uuid', 'backup_type', 'status', 'size_bytes', 'started_at', 'finished_at'], actions: [{ key: 'backupRun', label: 'Run', icon: <UploadCloud size={14} aria-hidden /> }] }
    ]
  },
  audit: {
    id: 'audit',
    title: 'Audit Logs',
    description: 'Activity, security, billing/payment/subscription/system and remote-login audit surfaces with compare and export.',
    permission: 'audit_log.view',
    tabs: [
      { id: 'activity', label: 'Activity', resource: 'audit-activity', query: platformOperationsApi.audit.activity, columns: ['id', 'actor_platform_user_id', 'subject_type', 'event', 'ip_address', 'created_at'], primary: ['event'], actions: [{ key: 'auditCompare', label: 'Compare', icon: <CopyCheck size={14} aria-hidden /> }] },
      { id: 'security', label: 'Security', resource: 'audit-security', query: platformOperationsApi.audit.security, columns: ['id', 'event', 'severity', 'ip_address', 'created_at'], primary: ['event'], actions: [{ key: 'ticketReply', label: 'Review', icon: <ClipboardCheck size={14} aria-hidden /> }] }
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
    tabs: [{ id: 'trials', label: 'Trials', resource: 'trials', query: platformOperationsApi.lifecycle.trials, columns: ['uuid', 'organization_name', 'status', 'trial_ends_at', 'created_at'], primary: ['organization_name'], actions: [{ key: 'trialExtend', label: 'Extend', icon: <Clock size={14} aria-hidden /> }, { key: 'trialConvert', label: 'Convert', icon: <Repeat2 size={14} aria-hidden /> }] }]
  },
  legal: {
    id: 'legal',
    title: 'Legal Documents',
    description: 'Terms, privacy, DPA, tenant agreement versions, publishing, and acceptance review shell.',
    permission: 'setting.view',
    tabs: [{ id: 'documents', label: 'Documents', resource: 'legal-documents', query: platformOperationsApi.lifecycle.legal, columns: ['document_type', 'title', 'version', 'status', 'published_at', 'updated_at'], primary: ['title'], actions: [{ key: 'legalEditor', label: 'Edit', icon: <Pencil size={14} aria-hidden /> }, { key: 'legalPublish', label: 'Publish', icon: <Send size={14} aria-hidden /> }] }]
  },
  announcements: {
    id: 'announcements',
    title: 'Announcements',
    description: 'Platform announcements to tenants with draft, publish, and archive controls.',
    permission: 'setting.view',
    tabs: [{ id: 'announcements', label: 'Announcements', resource: 'announcements', query: platformOperationsApi.lifecycle.announcements, columns: ['title', 'audience', 'status', 'published_at', 'created_at'], primary: ['title'], actions: [{ key: 'announcementEditor', label: 'Edit', icon: <Pencil size={14} aria-hidden /> }, { key: 'announcementPublish', label: 'Publish', icon: <Send size={14} aria-hidden /> }] }]
  },
  webhooks: {
    id: 'webhooks',
    title: 'Webhook Delivery',
    description: 'Outbound platform webhook endpoints and delivery retry shell.',
    permission: 'integration.view',
    tabs: [{ id: 'endpoints', label: 'Endpoints', resource: 'webhook-endpoints', query: platformOperationsApi.webhooks.endpoints, columns: ['uuid', 'name', 'url', 'status', 'created_at'], primary: ['name'], actions: [{ key: 'webhookEditor', label: 'Edit', icon: <Link2 size={14} aria-hidden /> }] }]
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
  if (action.key === 'moduleEditor') return [{ name: 'name', label: 'Name', required: true }, { name: 'code', label: 'Code', required: true }, { name: 'category', label: 'Category', type: 'select', options: ['crm', 'sales', 'support', 'billing', 'operations', 'analytics', 'integrations', 'security'] }, { name: 'icon', label: 'Icon' }, { name: 'is_core', label: 'Core module', type: 'checkbox' }, { name: 'status', label: 'Status', type: 'select', options: ['active', 'inactive'] }, { name: 'sort_order', label: 'Sort Order', type: 'number' }, { name: 'description', label: 'Description', type: 'textarea' }];
  if (action.key === 'featureAttach') return [{ name: 'feature_uuids', label: 'Features', type: 'multiselect', reference: 'features', required: true }];
  if (action.key === 'ticketEditor') return [{ name: 'tenant_uuid', label: 'Tenant', reference: 'tenants' }, { name: 'subject', label: 'Subject', required: true }, { name: 'description', label: 'Description', type: 'textarea' }, { name: 'priority', label: 'Priority', type: 'select', options: ['low', 'medium', 'high', 'urgent'] }, { name: 'category', label: 'Category', type: 'select', options: ['general', 'billing', 'technical', 'account', 'feature_request'] }, { name: 'source', label: 'Source', type: 'select', options: ['platform', 'tenant_help_center', 'email', 'phone', 'chat'] }, { name: 'assigned_to_uuid', label: 'Assignee', reference: 'platformUsers' }, { name: 'status', label: 'Status', type: 'select', options: ['open', 'in_progress', 'pending', 'closed'] }];
  if (action.key === 'ticketAssign') return [{ name: 'assigned_to_uuid', label: 'Assignee', reference: 'platformUsers' }, { name: 'audit_reason', label: 'Audit Reason', type: 'textarea' }];
  if (action.key === 'ticketReply') return [{ name: 'comment', label: area === 'audit' ? 'Review Notes' : 'Reply / Internal Note', type: 'textarea', required: true }, { name: 'is_internal', label: 'Internal note', type: 'checkbox' }];
  if (action.key === 'ticketAttach') return [{ name: 'upload_file', label: 'File', type: 'file', required: true }];
  if (action.key === 'ticketClose') return [{ name: 'notes', label: 'Resolution Notes', type: 'textarea' }];
  if (action.key === 'ticketReopen') return [];
  if (action.key === 'articleEditor') return [{ name: 'category_uuid', label: 'Category', reference: 'categories' }, { name: 'title', label: 'Title', required: true }, { name: 'slug', label: 'Slug' }, { name: 'audience', label: 'Audience', type: 'select', options: ['all', 'public', 'tenant', 'internal'] }, { name: 'status', label: 'Status', type: 'select', options: ['draft', 'published', 'archived'] }, { name: 'body', label: 'Body', type: 'textarea', required: true }];
  if (action.key === 'categoryEditor') return [{ name: 'parent_uuid', label: 'Parent Category', reference: 'categories' }, { name: 'name', label: 'Name', required: true }, { name: 'slug', label: 'Slug' }, { name: 'audience', label: 'Audience', type: 'select', options: ['all', 'public', 'tenant', 'internal'] }, { name: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'archived'] }];
  if (action.key === 'reportExport') return [{ name: 'format', label: 'Format', type: 'select', options: ['csv', 'xlsx', 'pdf'] }, { name: 'delivery', label: 'Delivery', type: 'select', options: ['job', 'download'] }, { name: 'email_when_ready', label: 'Email when ready', type: 'checkbox' }];
  if (action.key === 'alertResolve') return [{ name: 'resolution_note', label: 'Resolution Note', type: 'textarea' }, { name: 'status', label: 'Status', type: 'select', options: ['resolved', 'ignored'] }];
  if (action.key === 'incidentEditor') return [{ name: 'title', label: 'Title' }, { name: 'severity', label: 'Severity', type: 'select', options: ['low', 'medium', 'high', 'critical'] }, { name: 'status', label: 'Status', type: 'select', options: ['open', 'investigating', 'resolved'] }, { name: 'summary', label: 'Summary', type: 'textarea' }];
  if (action.key === 'providerEditor') return [{ name: 'name', label: 'Name', required: true }, { name: 'code', label: 'Code', required: true }, { name: 'category', label: 'Category', type: 'select', required: true, options: ['crm', 'billing', 'support', 'communication', 'storage', 'analytics', 'automation'] }, { name: 'auth_type', label: 'Auth Type', type: 'select', required: true, options: ['api_key', 'oauth2', 'basic', 'bearer', 'none'] }, { name: 'status', label: 'Status', type: 'select', options: ['active', 'inactive'] }];
  if (action.key === 'connectProvider' || action.key === 'integrationEditor') return [{ name: 'tenant_uuid', label: 'Tenant', reference: 'tenants', required: true }, { name: 'provider_code', label: 'Provider', reference: 'providers', required: true }, { name: 'name', label: 'Connection Name', required: true }, { name: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'disconnected'] }, { name: 'credential_api_key', label: 'API Key' }, { name: 'credential_secret', label: 'Secret' }, { name: 'credential_token', label: 'Access Token' }];
  if (action.key === 'rotateCredentials') return [{ name: 'credential_api_key', label: 'API Key' }, { name: 'credential_secret', label: 'Secret' }, { name: 'credential_token', label: 'Access Token' }];
  if (action.key === 'fieldMapping') return [{ name: 'entity_type', label: 'Entity Type', type: 'select', required: true, options: ['customer', 'contact', 'invoice', 'payment', 'ticket', 'lead', 'deal'] }, { name: 'local_field', label: 'Local Field', required: true }, { name: 'external_field', label: 'External Field', required: true }, { name: 'transform_rule', label: 'Transform Rule', type: 'select', options: ['none', 'uppercase', 'lowercase', 'trim', 'date_iso'] }];
  if (action.key === 'integrationWebhookEditor') return [{ name: 'integration_uuid', label: 'Tenant Integration', reference: 'tenantIntegrations', required: true }, { name: 'event', label: 'Event', type: 'select', required: true, options: ['customer.created', 'customer.updated', 'invoice.created', 'invoice.paid', 'payment.failed', 'ticket.created', 'ticket.updated', 'sync.completed', 'sync.failed'] }, { name: 'secret', label: 'Secret' }, { name: 'status', label: 'Status', type: 'select', options: ['active', 'inactive'] }];
  if (action.key === 'integrationDisconnect') return [{ name: 'reason', label: 'Reason', type: 'textarea' }];
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
  if (action === 'providerEditor' || action === 'integrationWebhookEditor') return stripEmpty(payload);
  if (action === 'connectProvider') return stripEmpty({ ...withoutCredentialFields(payload), credentials: credentialsFromPayload(payload) });
  if (action === 'integrationEditor') return stripEmpty(withoutCredentialFields(payload));
  if (action === 'templateEditor') return { ...payload, variables: csv(payload.variables) };
  if (action === 'webhookEditor') return { ...payload, events: csv(payload.events) };
  return payload;
}

function withoutCredentialFields(payload: Record<string, unknown>) {
  const { credential_api_key: _apiKey, credential_secret: _secret, credential_token: _token, ...rest } = payload;
  return rest;
}

function credentialsFromPayload(payload: Record<string, unknown>) {
  return stripEmpty({
    api_key: payload.credential_api_key,
    secret: payload.credential_secret,
    token: payload.credential_token
  });
}

function fieldMappingsFromPayload(payload: Record<string, unknown>) {
  return [
    stripEmpty({
      entity_type: payload.entity_type,
      local_field: payload.local_field,
      external_field: payload.external_field,
      transform_rule: payload.transform_rule && payload.transform_rule !== 'none' ? { rule: payload.transform_rule } : undefined
    })
  ];
}

function stripEmpty(payload: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined && value !== null && value !== '')
  );
}

function defaultPayloadFor(action: ActionState): Record<string, unknown> {
  if (action.key === 'moduleEditor') {
    return {
      name: action.record?.name ?? '',
      code: action.record?.code ?? '',
      category: action.record?.category ?? 'crm',
      icon: action.record?.icon ?? '',
      is_core: Boolean(action.record?.is_core),
      status: action.record?.status ?? 'active',
      sort_order: Number(action.record?.sort_order ?? 0),
      description: action.record?.description ?? ''
    };
  }
  if (action.key === 'featureAttach') return { feature_uuids: [] };
  if (action.key === 'ticketEditor') {
    return {
      tenant_uuid: action.record?.tenant_uuid ?? '',
      subject: action.record?.subject ?? '',
      description: action.record?.description ?? '',
      priority: action.record?.priority ?? 'medium',
      category: action.record?.category ?? 'general',
      source: action.record?.source ?? 'platform',
      assigned_to_uuid: action.record?.assigned_to_uuid ?? '',
      status: action.record?.status ?? 'open'
    };
  }
  if (action.key === 'ticketAssign') return { assigned_to_uuid: action.record?.assigned_to_uuid ?? '', audit_reason: '' };
  if (action.key === 'ticketReply') return { comment: '', is_internal: false };
  if (action.key === 'ticketAttach') return { upload_file: null };
  if (action.key === 'ticketClose') return { notes: '' };
  if (action.key === 'articleEditor') {
    return {
      category_uuid: action.record?.category_uuid ?? '',
      title: action.record?.title ?? '',
      slug: action.record?.slug ?? '',
      audience: action.record?.audience ?? 'all',
      status: action.record?.status ?? 'draft',
      body: action.record?.body ?? ''
    };
  }
  if (action.key === 'categoryEditor') {
    return {
      parent_uuid: action.record?.parent_uuid ?? '',
      name: action.record?.name ?? '',
      slug: action.record?.slug ?? '',
      audience: action.record?.audience ?? 'all',
      status: action.record?.status ?? 'active'
    };
  }
  if (action.key === 'providerEditor') {
    return {
      name: action.record?.name ?? '',
      code: action.record?.code ?? '',
      category: action.record?.category ?? 'crm',
      auth_type: action.record?.auth_type ?? 'api_key',
      status: action.record?.status ?? 'active'
    };
  }
  if (action.key === 'connectProvider' || action.key === 'integrationEditor') {
    return {
      tenant_uuid: action.record?.tenant_uuid ?? action.record?.tenant_id ?? '',
      provider_code: action.record?.provider_code ?? action.record?.provider_id ?? '',
      name: action.record?.name ?? '',
      status: action.record?.status ?? 'active',
      credential_api_key: '',
      credential_secret: '',
      credential_token: ''
    };
  }
  if (action.key === 'rotateCredentials') return { credential_api_key: '', credential_secret: '', credential_token: '' };
  if (action.key === 'fieldMapping') return { entity_type: 'customer', local_field: '', external_field: '', transform_rule: 'none' };
  if (action.key === 'integrationWebhookEditor') {
    return {
      integration_uuid: action.record?.integration_uuid ?? action.record?.tenant_integration_uuid ?? action.record?.tenant_integration_id ?? '',
      event: action.record?.event ?? 'customer.created',
      secret: '',
      status: action.record?.status ?? 'active'
    };
  }
  if (action.key === 'integrationDisconnect') return { reason: '' };
  return {};
}

function detailRecordFor(
  area: OperationArea,
  action: ActionState,
  records: {
    article?: PlatformRecord;
    integrationWebhook?: PlatformRecord;
    module?: PlatformRecord;
    remoteSession?: PlatformRecord;
    tenantIntegration?: PlatformRecord;
    ticket?: PlatformRecord;
  }
) {
  if (area === 'modules') return records.module ?? action.record ?? {};
  if (area === 'knowledge-base' && action.tab === 'articles') return records.article ?? action.record ?? {};
  if (area === 'support-tickets') return records.ticket ?? action.record ?? {};
  if (area === 'remote-login') return records.remoteSession ?? action.record ?? {};
  if (area === 'integrations' && action.tab === 'tenant') return records.tenantIntegration ?? action.record ?? {};
  if (area === 'integrations' && action.tab === 'webhooks') return records.integrationWebhook ?? action.record ?? {};
  return action.record ?? {};
}

function detailTitleFor(area: OperationArea, action: ActionState) {
  if (area === 'modules') return 'Module Details';
  if (area === 'support-tickets') return 'Ticket Details';
  if (area === 'remote-login') return 'Remote Login Session';
  if (action.key === 'auditCompare') return 'Audit Compare';
  return 'Raw Payload / Exception';
}

function viewPermissionFor(area: OperationArea, action: ActionKey) {
  if (area === 'modules') return 'module.view';
  if (area === 'support-tickets') return 'support.ticket.view';
  if (area === 'remote-login') return 'tenant.impersonate';
  if (area === 'knowledge-base') return 'support.knowledge_base.view';
  if (area === 'integrations' || area === 'webhooks') return 'integration.view';
  if (action === 'auditCompare') return 'audit_log.view';
  return 'audit_log.view';
}

function isEmptyField(value: unknown) {
  if (Array.isArray(value)) return value.length === 0;
  return value === undefined || value === null || value === '';
}

function arrayFromResponse(data: unknown, key: string): PlatformRecord[] {
  if (Array.isArray(data)) return data as PlatformRecord[];
  if (data && typeof data === 'object') {
    const rows = (data as Record<string, unknown>)[key];
    if (Array.isArray(rows)) return rows as PlatformRecord[];
  }
  return [];
}

function RelatedRows({ rows, title }: { rows: PlatformRecord[]; title: string }) {
  return (
    <section className="dashboard-panel">
      <h3>{title}</h3>
      {rows.length === 0 ? (
        <div className="empty-state">No {title.toLowerCase()} returned.</div>
      ) : (
        <div className="record-list">
          {rows.map((row, index) => (
            <article key={idOf(row) || index}>
              <strong>{printable(row.name ?? row.organization_name ?? row.code ?? row.uuid)}</strong>
              <p>{printable(row.status ?? row.module ?? row.slug ?? row.enabled)}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function IntegrationWebhookLogs({
  loading,
  onRetry,
  rows
}: {
  loading: boolean;
  onRetry: (logId: string | number) => void;
  rows: PlatformRecord[];
}) {
  return (
    <section className="dashboard-panel">
      <h3>Webhook Logs</h3>
      {rows.length === 0 ? (
        <div className="empty-state">No webhook logs returned.</div>
      ) : (
        <div className="record-list">
          {rows.map((row, index) => {
            const logId = row.id ?? row.log_id ?? idOf(row);
            return (
              <article key={String(logId || index)}>
                <header>
                  <strong>{printable(row.event ?? row.status ?? `Log ${index + 1}`)}</strong>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={!logId || loading}
                    onClick={() => onRetry(logId as string | number)}
                  >
                    <RotateCw size={14} aria-hidden /> Retry
                  </Button>
                </header>
                <p>{printable(row.response_status ?? row.status_code ?? row.message ?? row.error_message)}</p>
                <small>{printable(row.created_at ?? row.delivered_at)}</small>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function TicketComments({ rows }: { rows: PlatformRecord[] }) {
  return (
    <section className="dashboard-panel">
      <h3>Comments</h3>
      {rows.length === 0 ? <div className="empty-state">No comments added.</div> : (
        <div className="record-list">
          {rows.map((row, index) => (
            <article key={idOf(row) || index}>
              <header>
                <strong>{printable(row.platform_user_name ?? row.user_name ?? 'Support')}</strong>
                <StatusBadge tone={row.is_internal ? 'warning' : 'info'}>{row.is_internal ? 'Internal note' : 'Reply'}</StatusBadge>
              </header>
              <p>{printable(row.comment)}</p>
              <small>{printable(row.created_at)}</small>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function TicketAttachments({ rows }: { rows: PlatformRecord[] }) {
  return (
    <section className="dashboard-panel">
      <h3>Attachments</h3>
      {rows.length === 0 ? <div className="empty-state">No attachments added.</div> : (
        <div className="support-ticket-attachments">
          {rows.map((row, index) => {
            const url = String(row.preview_url ?? '');
            const mime = String(row.mime_type ?? '');
            return (
              <article key={idOf(row) || String(row.file_uuid ?? index)}>
                <header>
                  <div>
                    <strong>{printable(row.original_name ?? row.file_uuid)}</strong>
                    <p>{printable(mime)} / {formatBytes(row.size_bytes)}</p>
                  </div>
                  {url ? <a className="link-button" href={url} target="_blank" rel="noreferrer">Open</a> : null}
                </header>
                <div className="attachment-preview">
                  {url && mime.startsWith('image/') ? <img src={url} alt={String(row.original_name ?? 'Attachment preview')} /> : null}
                  {url && mime === 'application/pdf' ? <iframe src={url} title={String(row.original_name ?? 'PDF attachment')} /> : null}
                  {!url || (!mime.startsWith('image/') && mime !== 'application/pdf') ? <div className="surface-state">Preview is available for images and PDFs.</div> : null}
                </div>
                <small>Uploaded by {printable(row.created_by_name ?? 'platform')} on {printable(row.created_at)}</small>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function TicketAudit({ rows }: { rows: PlatformRecord[] }) {
  return (
    <section className="dashboard-panel">
      <h3>Audit</h3>
      {rows.length === 0 ? <div className="empty-state">No audit entries returned.</div> : (
        <div className="record-list">
          {rows.map((row, index) => (
            <article key={idOf(row) || index}>
              <header>
                <strong>{printable(row.event)}</strong>
                <span>{printable(row.created_at)}</span>
              </header>
              <p>{printable(row.description ?? row.ip_address ?? row.request_id)}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function titleFor(action: ActionKey) {
  return label(String(action ?? 'Action'));
}

function permissionFor(area: OperationArea, action: ActionKey) {
  if (['moduleEditor', 'moduleToggle', 'featureAttach', 'tenantOverride'].includes(String(action))) return 'module.edit';
  if (action === 'articlePublish') return 'support.knowledge_base.publish';
  if (['articleEditor', 'articleArchive', 'categoryEditor'].includes(String(action))) return 'support.knowledge_base.edit';
  if (area === 'knowledge-base') return 'support.knowledge_base.view';
  if (action === 'ticketAssign') return 'support.ticket.assign';
  if (['ticketClose', 'ticketReopen'].includes(String(action))) return 'support.ticket.close';
  if (['ticketEditor', 'ticketReply', 'ticketAttach'].includes(String(action))) return 'support.ticket.reply';
  if (area === 'support-tickets') return 'support.ticket.view';
  if (area === 'remote-login') return 'tenant.impersonate';
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

function formatBytes(value: unknown) {
  const bytes = Number(value ?? 0);
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
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

function values(value: unknown) {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : csv(value);
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
