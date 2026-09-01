import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, Pencil, Plus, Archive } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { platformOrganizationApi, type DepartmentPayload, type DesignationPayload, type OrganizationRecord } from '@/features/platform/organization/api/platformOrganizationApi';
import { hasPermission } from '@/features/auth/permissions/permissions';
import { useAuthStore } from '@/features/auth/store/authStore';
import { platformStaffApi } from '@/features/platform/staff/api/platformStaffApi';
import { platformQueryKeys } from '@/features/platform/api/platformQueryKeys';
import { ApiError } from '@/lib/api/apiError';
import { createListQuery } from '@/lib/api/listQuery';
import { DataTable, RowActionMenu, type DataTableColumn } from '@/shared/components/data-table';
import { PageHeader, StatusBadge } from '@/shared/components/layout';
import { Button, PermissionButton } from '@/shared/components/ui';
import { AdvancedFiltersDrawer, ConfirmDialog } from '@/shared/components/workflows';

type DirectoryKind = 'departments' | 'designations';
type DirectoryMode = 'list' | 'create' | 'view' | 'edit';

const meta = {
  departments: { label: 'Departments', singular: 'Department', path: '/platform/staff/departments', permission: 'platform_department', description: 'Manage the platform reporting structure and department ownership.' },
  designations: { label: 'Designations', singular: 'Designation', path: '/platform/staff/designations', permission: 'platform_designation', description: 'Manage platform job titles and organizational levels.' }
} as const;

const departmentSchema = z.object({ name: z.string().trim().min(2), code: z.string().trim().min(2), parent_uuid: z.string().optional(), manager_platform_user_uuid: z.string().optional(), status: z.enum(['active', 'inactive']) });
const designationSchema = z.object({ name: z.string().trim().min(2), code: z.string().optional(), description: z.string().optional(), level: z.coerce.number().int().min(0).optional(), status: z.enum(['active', 'inactive']) });
type DepartmentForm = z.infer<typeof departmentSchema>;
type DesignationForm = z.infer<typeof designationSchema>;

function idOf(record?: any) { return String(record?.uuid ?? record?.id ?? ''); }
function textOf(record: any, keys: string[], fallback = '-') { for (const key of keys) { const value = record?.[key]; if (value !== undefined && value !== null && value !== '') return String(value); } return fallback; }
function errorText(error: unknown) { return error instanceof ApiError ? error.message : error instanceof Error ? error.message : 'Request failed.'; }

export function PlatformDepartmentsListPage() { return <PlatformDirectoryPage kind="departments" mode="list" />; }
export function PlatformDepartmentCreatePage() { return <PlatformDirectoryPage kind="departments" mode="create" />; }
export function PlatformDepartmentViewPage() { return <PlatformDirectoryPage kind="departments" mode="view" />; }
export function PlatformDepartmentEditPage() { return <PlatformDirectoryPage kind="departments" mode="edit" />; }
export function PlatformDesignationsListPage() { return <PlatformDirectoryPage kind="designations" mode="list" />; }
export function PlatformDesignationCreatePage() { return <PlatformDirectoryPage kind="designations" mode="create" />; }
export function PlatformDesignationViewPage() { return <PlatformDirectoryPage kind="designations" mode="view" />; }
export function PlatformDesignationEditPage() { return <PlatformDirectoryPage kind="designations" mode="edit" />; }

function PlatformDirectoryPage({ kind, mode }: { kind: DirectoryKind; mode: DirectoryMode }) {
  const { id = '' } = useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const definition = meta[kind];
  const detailQuery = useQuery({ queryKey: platformQueryKeys.detail(`platform-${kind}`, id), queryFn: () => kind === 'departments' ? platformOrganizationApi.departments.detail(id) : platformOrganizationApi.designations.detail(id), enabled: mode === 'view' || mode === 'edit' });
  if (mode === 'list') return <DirectoryList kind={kind} />;
  if (detailQuery.isLoading) return <section className="enterprise-module-page"><div className="surface-state">Loading {definition.singular.toLowerCase()}...</div></section>;
  if (detailQuery.isError) return <section className="enterprise-module-page"><div className="surface-error">{errorText(detailQuery.error)}</div></section>;
  if ((mode === 'view' || mode === 'edit') && !detailQuery.data) return <section className="enterprise-module-page"><div className="empty-state">Record not found.</div></section>;
  if (mode === 'edit') return <DirectoryForm kind={kind} record={detailQuery.data} />;
  if (mode === 'create') return <DirectoryForm kind={kind} />;
  return <DirectoryView kind={kind} record={detailQuery.data!} onBack={() => navigate(definition.path)} onEdit={() => navigate(`${definition.path}/${id}/edit`)} onArchived={async () => { await queryClient.invalidateQueries({ queryKey: platformQueryKeys.resource(`platform-${kind}`) }); navigate(definition.path); }} />;
}

function DirectoryList({ kind }: { kind: DirectoryKind }) {
  const definition = meta[kind]; const navigate = useNavigate(); const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState(''); const [search, setSearch] = useState(''); const [status, setStatus] = useState(''); const [level, setLevel] = useState(''); const [parentUuid, setParentUuid] = useState(''); const [filterOpen, setFilterOpen] = useState(false); const [page, setPage] = useState(1); const [perPage, setPerPage] = useState(10); const [archiveTarget, setArchiveTarget] = useState<OrganizationRecord | null>(null);
  useEffect(() => { const timer = window.setTimeout(() => { setSearch(searchInput); setPage(1); }, 350); return () => window.clearTimeout(timer); }, [searchInput]);
  const query = createListQuery({ search, filter: { status: status || undefined, ...(kind === 'designations' ? { level: level || undefined } : { parent_uuid: parentUuid || undefined }) } });
  const listQuery = useQuery({ queryKey: platformQueryKeys.list(`platform-${kind}`, query), queryFn: () => kind === 'departments' ? platformOrganizationApi.departments.list(query) : platformOrganizationApi.designations.list(query) });
  const rows = listQuery.data?.data ?? [];
  const pageRows = rows.slice((page - 1) * perPage, page * perPage);
  const archiveMutation = useMutation({ mutationFn: (record: OrganizationRecord) => kind === 'departments' ? platformOrganizationApi.departments.archive(idOf(record)) : platformOrganizationApi.designations.archive(idOf(record)), onSuccess: async () => { setArchiveTarget(null); await queryClient.invalidateQueries({ queryKey: platformQueryKeys.resource(`platform-${kind}`) }); } });
  const columns = useMemo<DataTableColumn<OrganizationRecord>[]>(() => {
    const name: DataTableColumn<OrganizationRecord> = { id: 'name', header: 'Name', accessor: row => row.name, enableSorting: true, cell: row => <strong>{textOf(row, ['name'])}</strong> };
    const code: DataTableColumn<OrganizationRecord> = { id: 'code', header: 'Code', accessor: row => row.code, enableSorting: true, cell: row => textOf(row, ['code']) };
    const statusColumn: DataTableColumn<OrganizationRecord> = { id: 'status', header: 'Status', accessor: row => row.status, cell: row => <StatusBadge tone={row.status === 'active' ? 'success' : 'neutral'}>{textOf(row, ['status'])}</StatusBadge> };
    const count: DataTableColumn<OrganizationRecord> = { id: 'users_count', header: 'Assigned Staff', accessor: row => row.users_count, cell: row => textOf(row, ['users_count'], '0') };
    const extra: DataTableColumn<OrganizationRecord> = kind === 'departments' ? { id: 'parent', header: 'Parent', accessor: row => row.parent?.name, cell: row => textOf(row.parent, ['name'], 'Top level') } : { id: 'level', header: 'Level', accessor: row => row.level, cell: row => textOf(row, ['level'], 'Not set') };
    const actions: DataTableColumn<OrganizationRecord> = { id: 'actions', header: 'Actions', enableHiding: false, cell: row => <DirectoryActionsMenu kind={kind} row={row} onView={() => navigate(`${definition.path}/${idOf(row)}`)} onEdit={() => navigate(`${definition.path}/${idOf(row)}/edit`)} onArchive={() => setArchiveTarget(row)} /> };    return [name, code, extra, count, statusColumn, actions];
  }, [definition.path, definition.permission, kind, navigate]);
  const parentOptions = rows.reduce<Array<{ value: string; label: string }>>((options, row) => { const parent = row.parent; if (parent?.uuid && !options.some(option => option.value === parent.uuid)) options.push({ value: parent.uuid, label: textOf(parent, ['name', 'code']) }); return options; }, []); const stats = { total: rows.length, active: rows.filter(row => row.status === 'active').length, inactive: rows.filter(row => row.status === 'inactive').length, assigned: rows.reduce((sum, row) => sum + Number(row.users_count ?? 0), 0) };
  return <section className="enterprise-module-page platform-access-page"><PageHeader title={definition.label} description={definition.description} actions={<PermissionButton guard="platform" permission={`${definition.permission}.create`} type="button" onClick={() => navigate(`${definition.path}/create`)}><Plus size={16} /> Create {definition.singular}</PermissionButton>} /><DirectoryStats stats={stats} /><div className="data-table-shell"><DataTable columns={columns} data={pageRows} getRowId={idOf} loading={listQuery.isLoading} error={listQuery.isError ? errorText(listQuery.error) : ''} searchValue={searchInput} searchPlaceholder={`Search ${definition.label.toLowerCase()}...`} onSearchChange={setSearchInput} onOpenFilters={() => setFilterOpen(true)} page={page} perPage={perPage} total={rows.length} onPageChange={next => setPage(Math.max(1, next))} onPerPageChange={next => { setPerPage(next); setPage(1); }} /></div><AdvancedFiltersDrawer open={filterOpen} onClose={() => setFilterOpen(false)} guard="platform" permission={`${definition.permission}.view`} fields={[{ name: 'status', label: 'Status', input: <select value={status} onChange={event => { setStatus(event.target.value); setPage(1); }}><option value="">Any status</option><option value="active">Active</option><option value="inactive">Inactive</option></select> }, ...(kind === 'designations' ? [{ name: 'level', label: 'Level', input: <select value={level} onChange={event => { setLevel(event.target.value); setPage(1); }}><option value="">Any level</option>{Array.from({ length: 11 }, (_, index) => <option key={index} value={String(index)}>{index}</option>)}</select> }] : [{ name: 'parent_uuid', label: 'Parent department', input: <select value={parentUuid} onChange={event => { setParentUuid(event.target.value); setPage(1); }}><option value="">Any parent</option>{parentOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select> }])]} onApply={() => setFilterOpen(false)} onReset={() => { setStatus(''); setLevel(''); setParentUuid(''); setPage(1); }} /><ConfirmDialog open={Boolean(archiveTarget)} onClose={() => setArchiveTarget(null)} title={`Archive ${definition.singular.toLowerCase()}`} description={`This will mark ${textOf(archiveTarget, ['name'], 'this record')} inactive.`} confirmLabel="Archive" reasonRequired={false} guard="platform" permission={`${definition.permission}.delete`} onConfirm={() => archiveTarget && archiveMutation.mutate(archiveTarget)} /></section>;
}

function DirectoryActionsMenu({ kind, row, onView, onEdit, onArchive }: { kind: DirectoryKind; row: OrganizationRecord; onView: () => void; onEdit: () => void; onArchive: () => void }) {
  const auth = useAuthStore();
  const permission = meta[kind].permission;
  const items = [
    { label: 'View', icon: <Eye size={15} aria-hidden="true" />, onClick: onView },
    ...(hasPermission(auth, 'platform', `${permission}.edit`) ? [{ label: 'Edit', icon: <Pencil size={15} aria-hidden="true" />, onClick: onEdit }] : []),
    ...(hasPermission(auth, 'platform', `${permission}.delete`) ? [{ label: 'Archive', icon: <Archive size={15} aria-hidden="true" />, danger: true, separatorBefore: true, onClick: onArchive }] : [])
  ];
  return <RowActionMenu label={`Open actions for ${textOf(row, ['name', 'code'])}`} items={items} />;
}
function DirectoryStats({ stats }: { stats: { total: number; active: number; inactive: number; assigned: number } }) { return <section className="platform-access-summary"><article className="summary-card"><p>Total</p><strong>{stats.total}</strong></article><article className="summary-card"><p>Active</p><strong>{stats.active}</strong></article><article className="summary-card"><p>Inactive</p><strong>{stats.inactive}</strong></article><article className="summary-card"><p>Assigned Staff</p><strong>{stats.assigned}</strong></article></section>; }

function DirectoryForm({ kind, record }: { kind: DirectoryKind; record?: OrganizationRecord }) {
  return kind === 'departments' ? <DepartmentForm record={record} /> : <DesignationForm record={record} />;
}
function DepartmentForm({ record }: { record?: OrganizationRecord }) {
  const navigate = useNavigate(); const queryClient = useQueryClient(); const definition = meta.departments;
  const form = useForm<DepartmentForm>({ resolver: zodResolver(departmentSchema), defaultValues: { name: textOf(record, ['name'], ''), code: textOf(record, ['code'], ''), parent_uuid: String(record?.parent?.uuid ?? ''), manager_platform_user_uuid: String(record?.manager?.uuid ?? ''), status: textOf(record, ['status'], 'active') as 'active' | 'inactive' } });
  const parents = useQuery({ queryKey: platformQueryKeys.list('platform-department-options'), queryFn: () => platformOrganizationApi.departments.list({ filter: { status: 'active' } }) });
  const managers = useQuery({ queryKey: platformQueryKeys.list('platform-manager-options'), queryFn: () => platformStaffApi.list({ per_page: 100, filter: { status: 'active' } }) });
  const mutation = useMutation({ mutationFn: (values: DepartmentForm) => { const payload: DepartmentPayload = { ...values, parent_uuid: values.parent_uuid || null, manager_platform_user_uuid: values.manager_platform_user_uuid || null }; return record ? platformOrganizationApi.departments.update(idOf(record), payload) : platformOrganizationApi.departments.create(payload); }, onSuccess: async saved => { await queryClient.invalidateQueries({ queryKey: platformQueryKeys.resource('platform-departments') }); navigate(`${definition.path}/${idOf(saved)}`); } });
  return <OrganizationFormShell title={record ? `Edit ${textOf(record, ['name'])}` : 'Create Department'} backTo={definition.path} permission={record ? 'platform_department.edit' : 'platform_department.create'} error={mutation.error} saving={mutation.isPending} onSubmit={form.handleSubmit(values => mutation.mutate(values))}><FormField form={form} name="name" label="Department name" required /><FormField form={form} name="code" label="Code" required /><SelectField form={form} name="parent_uuid" label="Parent department" loading={parents.isLoading} options={(parents.data?.data ?? []).filter(item => idOf(item) !== idOf(record)).map(item => ({ value: idOf(item), label: `${textOf(item, ['name'])} (${textOf(item, ['code'])})` }))} /><SelectField form={form} name="manager_platform_user_uuid" label="Department manager" loading={managers.isLoading} options={(managers.data?.data ?? []).map(item => ({ value: idOf(item), label: textOf(item, ['display_name', 'name', 'email']) }))} /><SelectField form={form} name="status" label="Status" options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} /></OrganizationFormShell>;
}
function DesignationForm({ record }: { record?: OrganizationRecord }) {
  const navigate = useNavigate(); const queryClient = useQueryClient(); const definition = meta.designations;
  const form = useForm<DesignationForm>({ resolver: zodResolver(designationSchema), defaultValues: { name: textOf(record, ['name'], ''), code: textOf(record, ['code'], ''), description: textOf(record, ['description'], ''), level: record?.level ?? undefined, status: textOf(record, ['status'], 'active') as 'active' | 'inactive' } });
  const mutation = useMutation({ mutationFn: (values: DesignationForm) => { const payload: DesignationPayload = { ...values, code: values.code || undefined, level: values.level ?? null }; return record ? platformOrganizationApi.designations.update(idOf(record), payload) : platformOrganizationApi.designations.create(payload); }, onSuccess: async saved => { await queryClient.invalidateQueries({ queryKey: platformQueryKeys.resource('platform-designations') }); navigate(`${definition.path}/${idOf(saved)}`); } });
  return <OrganizationFormShell title={record ? `Edit ${textOf(record, ['name'])}` : 'Create Designation'} backTo={definition.path} permission={record ? 'platform_designation.edit' : 'platform_designation.create'} error={mutation.error} saving={mutation.isPending} onSubmit={form.handleSubmit(values => mutation.mutate(values))}><FormField form={form} name="name" label="Designation name" required /><FormField form={form} name="code" label="Code" /><FormField form={form} name="level" label="Level" type="number" /><FormField form={form} name="description" label="Description" type="textarea" /><SelectField form={form} name="status" label="Status" options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} /></OrganizationFormShell>;
}

function OrganizationFormShell({ title, backTo, permission, error, saving, onSubmit, children }: { title: string; backTo: string; permission: string; error: unknown; saving: boolean; onSubmit: () => void; children: ReactNode }) {
  const navigate = useNavigate();
  const [confirmCancel, setConfirmCancel] = useState(false);
  return (
    <section className="enterprise-module-page platform-access-page">
      <PageHeader
        title={title}
        description="Maintain controlled platform organizational data with permission-aware changes."
        actions={<Button type="button" variant="secondary" onClick={() => navigate(backTo)}>Back</Button>}
      />
      {error ? <div className="surface-error">{errorText(error)}</div> : null}
      <form className="rbac-form-shell organization-form-shell" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
        <article className="enterprise-form"><div className="enterprise-form__grid">{children}</div></article>
        <footer className="enterprise-form__footer rbac-sticky-footer organization-form-actions">
          <Button type="button" variant="secondary" onClick={() => setConfirmCancel(true)}>Cancel</Button>
          <PermissionButton guard="platform" permission={permission} type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</PermissionButton>
        </footer>
      </form>
      <ConfirmDialog
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        title="Discard changes?"
        description="Unsaved changes on this page will be lost."
        confirmLabel="Discard"
        typedConfirmation="DISCARD"
        onConfirm={() => navigate(backTo)}
      />
    </section>
  );
}
function FormField({ form, name, label, required = false, type = 'text' }: { form: any; name: string; label: string; required?: boolean; type?: string }) { const error = form.formState.errors[name]?.message; return <label className={error ? 'form-field-invalid' : undefined}><span>{label}{required ? ' *' : ''}</span>{type === 'textarea' ? <textarea {...form.register(name)} /> : <input type={type} {...form.register(name)} />}{error ? <strong role="alert">{String(error)}</strong> : null}</label>; }
function SelectField({ form, name, label, options = [], loading = false }: { form: any; name: string; label: string; options?: Array<{ value: string; label: string }>; loading?: boolean }) { return <label><span>{label}</span><select {...form.register(name)} disabled={loading}><option value="">{loading ? 'Loading...' : 'Select'}</option>{options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>; }

function DirectoryView({ kind, record, onBack, onEdit, onArchived }: { kind: DirectoryKind; record: OrganizationRecord; onBack: () => void; onEdit: () => void; onArchived: () => void }) { const definition = meta[kind]; const [confirmOpen, setConfirmOpen] = useState(false); const queryClient = useQueryClient(); const archive = useMutation({ mutationFn: () => kind === 'departments' ? platformOrganizationApi.departments.archive(idOf(record)) : platformOrganizationApi.designations.archive(idOf(record)), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: platformQueryKeys.resource(`platform-${kind}`) }); setConfirmOpen(false); onArchived(); } }); const hidden = new Set(['id', 'uuid', 'parent_id', 'platform_manager_user_id', 'created_at', 'updated_at', 'parent', 'manager', 'users', 'teams']); const details = Object.fromEntries(Object.entries(record).filter(([key]) => !hidden.has(key))); return <section className="enterprise-module-page platform-access-page"><PageHeader title={textOf(record, ['name'])} description={textOf(record, ['description'], definition.description)} meta={<StatusBadge tone={record.status === 'active' ? 'success' : 'neutral'}>{textOf(record, ['status'])}</StatusBadge>} actions={<><Button type="button" variant="secondary" onClick={onBack}>Back</Button><PermissionButton guard="platform" permission={`${definition.permission}.edit`} type="button" onClick={onEdit}><Pencil size={16} /> Edit</PermissionButton><PermissionButton guard="platform" permission={`${definition.permission}.delete`} type="button" variant="secondary" onClick={() => setConfirmOpen(true)}><Archive size={16} /> Archive</PermissionButton></>} /><article className="enterprise-view-panel"><div className="platform-access-summary organization-detail-summary"><article className="summary-card"><p>Assigned Staff</p><strong>{textOf(record, ['users_count'], '0')}</strong></article>{kind === 'departments' ? <article className="summary-card"><p>Child Departments</p><strong>{textOf(record, ['children_count'], '0')}</strong></article> : null}{kind === 'departments' ? <article className="summary-card"><p>Teams</p><strong>{textOf(record, ['teams_count'], '0')}</strong></article> : null}</div><dl className="enterprise-summary-list">{Object.entries(details).map(([key, value]) => <div key={key}><dt>{key.replace(/_/g, ' ')}</dt><dd>{value === null || value === undefined || value === '' ? '-' : String(value)}</dd></div>)}</dl></article><ConfirmDialog open={confirmOpen} onClose={() => setConfirmOpen(false)} title={`Archive ${definition.singular.toLowerCase()}`} description={`Archive ${textOf(record, ['name'])}?`} confirmLabel="Archive" guard="platform" permission={`${definition.permission}.delete`} onConfirm={() => archive.mutate()} /></section>; }
