import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Archive,
  CheckCircle2,
  Copy,
  Eye,
  KeyRound,
  MoreVertical,
  Pencil,
  Plus,
  RotateCcw,
  ShieldCheck,
  Trash2,
  Users
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';

import {
  platformAccessApi,
  type GroupedPermissions,
  type PermissionPayload,
  type PlatformRecord,
  type RolePayload,
  type TeamPayload,
  type TeamRolePayload
} from '@/features/platform/access-control/api/platformAccessApi';
import { platformQueryKeys } from '@/features/platform/api/platformQueryKeys';
import { PLATFORM_ROUTES } from '@/features/platform/routes/platformRoutes';
import { ApiError } from '@/lib/api/apiError';
import { createListQuery } from '@/lib/api/listQuery';
import { DataTable, type DataTableColumn } from '@/shared/components/data-table';
import { AppDrawer } from '@/shared/components/drawer';
import { PageHeader, StatusBadge, Tabs } from '@/shared/components/layout';
import { AppModal } from '@/shared/components/modal';
import { Button, PermissionButton } from '@/shared/components/ui';
import { AdvancedFiltersDrawer, ColumnManagerModal, ConfirmDialog, ExportModal, SavedViewsModal } from '@/shared/components/workflows';

type ResourceKind = 'roles' | 'permissions' | 'teams' | 'teamRoles';
type Mode = 'list' | 'create' | 'edit' | 'view';
type ModalKind =
  | 'assignUsers'
  | 'cloneRole'
  | 'deleteRole'
  | 'permissionEditor'
  | 'addMember'
  | 'assignRecord'
  | 'releaseAssignment'
  | 'teamRoleEditor'
  | 'archiveTeam'
  | 'deletePermission'
  | 'export'
  | 'columns'
  | 'views'
  | null;

type DrawerKind = 'assignPermissions' | 'permissionDetail' | 'filters' | null;

const roleSchema = z.object({
  name: z.string().min(2),
  display_name: z.string().min(2),
  guard_name: z.string().min(2),
  description: z.string().optional(),
  status: z.string(),
  is_system: z.boolean(),
  permission_ids: z.string().optional(),
  audit_reason: z.string().min(3)
});

const permissionSchema = z.object({
  module: z.string().min(2),
  name: z.string().min(3),
  display_name: z.string().min(2),
  description: z.string().optional(),
  guard_name: z.string().min(2),
  is_system: z.boolean(),
  status: z.string()
});

const teamSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2),
  description: z.string().optional(),
  lead_platform_user_id: z.string().optional(),
  assistant_lead_platform_user_id: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  visibility: z.string(),
  status: z.string(),
  audit_reason: z.string().optional()
});

const teamRoleSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2),
  description: z.string().optional(),
  permissions_json: z.string().optional(),
  sort_order: z.coerce.number().default(0),
  is_system: z.boolean(),
  status: z.string(),
  audit_reason: z.string().optional()
});

type RoleForm = z.infer<typeof roleSchema>;
type PermissionForm = z.infer<typeof permissionSchema>;
type TeamForm = z.infer<typeof teamSchema>;
type TeamRoleForm = z.infer<typeof teamRoleSchema>;

const resourceMeta = {
  roles: {
    label: 'Platform Roles',
    singular: 'Platform Role',
    route: PLATFORM_ROUTES.accessControl.roles,
    permission: 'platform_role',
    resourceKey: 'platform-roles'
  },
  permissions: {
    label: 'Platform Permissions',
    singular: 'Platform Permission',
    route: PLATFORM_ROUTES.accessControl.permissions,
    permission: 'platform_permission',
    resourceKey: 'platform-permissions'
  },
  teams: {
    label: 'Platform Teams',
    singular: 'Platform Team',
    route: PLATFORM_ROUTES.teams,
    permission: 'platform_team',
    resourceKey: 'platform-teams'
  },
  teamRoles: {
    label: 'Platform Team Roles',
    singular: 'Team Role',
    route: PLATFORM_ROUTES.teamRoles,
    permission: 'platform_team',
    resourceKey: 'platform-team-roles'
  }
} as const;

function idOf(record?: PlatformRecord | null) {
  return String(record?.uuid ?? record?.id ?? '');
}

function textOf(record: PlatformRecord | null | undefined, keys: string[], fallback = '-') {
  for (const key of keys) {
    const value = record?.[key];
    if (value !== undefined && value !== null && value !== '') return String(value);
  }
  return fallback;
}

function errorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Request failed.';
}

function totalFromQuery(data?: { total: number; data: PlatformRecord[] }) {
  return data?.total ?? data?.data.length ?? 0;
}

function groupedPermissionIds(grouped?: GroupedPermissions) {
  return Object.values(grouped ?? {}).flat().map((permission) => idOf(permission)).filter(Boolean);
}

function selectedPermissionIds(record?: PlatformRecord | null) {
  if (!record?.permissions) return [];
  return groupedPermissionIds(record.permissions as GroupedPermissions);
}

function auditPayload(value: string) {
  return { audit_reason: value || 'Updated from platform access control UI' };
}

export function PlatformRolesListPage() {
  return <PlatformResourcePage kind="roles" mode="list" />;
}

export function PlatformRoleCreatePage() {
  return <PlatformResourcePage kind="roles" mode="create" />;
}

export function PlatformRoleEditPage() {
  return <PlatformResourcePage kind="roles" mode="edit" />;
}

export function PlatformRoleViewPage() {
  return <PlatformResourcePage kind="roles" mode="view" />;
}

export function PlatformPermissionsListPage() {
  return <PlatformResourcePage kind="permissions" mode="list" />;
}

export function PlatformPermissionCreatePage() {
  return <PlatformResourcePage kind="permissions" mode="create" />;
}

export function PlatformPermissionEditPage() {
  return <PlatformResourcePage kind="permissions" mode="edit" />;
}

export function PlatformPermissionViewPage() {
  return <PlatformResourcePage kind="permissions" mode="view" />;
}

export function PlatformTeamsListPage() {
  return <PlatformResourcePage kind="teams" mode="list" />;
}

export function PlatformTeamCreatePage() {
  return <PlatformResourcePage kind="teams" mode="create" />;
}

export function PlatformTeamEditPage() {
  return <PlatformResourcePage kind="teams" mode="edit" />;
}

export function PlatformTeamViewPage() {
  return <PlatformResourcePage kind="teams" mode="view" />;
}

export function PlatformTeamRolesListPage() {
  return <PlatformResourcePage kind="teamRoles" mode="list" />;
}

export function PlatformTeamRoleCreatePage() {
  return <PlatformResourcePage kind="teamRoles" mode="create" />;
}

export function PlatformTeamRoleEditPage() {
  return <PlatformResourcePage kind="teamRoles" mode="edit" />;
}

function PlatformResourcePage({ kind, mode }: { kind: ResourceKind; mode: Mode }) {
  const { id = '' } = useParams();
  const meta = resourceMeta[kind];

  if (mode === 'list') return <ResourceList kind={kind} />;
  if (mode === 'view') {
    return (
      <DetailLoader id={id} kind={kind}>
        {(record) => <ResourceView kind={kind} record={record} />}
      </DetailLoader>
    );
  }
  if (mode === 'edit') {
    return (
      <DetailLoader id={id} kind={kind}>
        {(record) => <ResourceForm kind={kind} record={record} />}
      </DetailLoader>
    );
  }
  return <ResourceForm kind={kind} title={`Create ${meta.singular}`} />;
}

function DetailLoader({ id, kind, children }: { id: string; kind: ResourceKind; children: (record: PlatformRecord) => ReactNode }) {
  const meta = resourceMeta[kind];
  const query = useQuery({
    queryKey: platformQueryKeys.detail(meta.resourceKey, id),
    queryFn: () => {
      if (kind === 'roles') return platformAccessApi.roles.detail(id);
      if (kind === 'permissions') return platformAccessApi.permissions.detail(id);
      if (kind === 'teams') return platformAccessApi.teams.detail(id);
      throw new Error('Team role detail endpoint is not documented; edit from the list row instead.');
    }
  });

  if (query.isLoading) return <div className="surface-state">Loading {meta.singular.toLowerCase()}...</div>;
  if (query.isError) return <div className="surface-error">{errorMessage(query.error)}</div>;
  if (!query.data) return <div className="empty-state">Record not found.</div>;
  return <>{children(query.data)}</>;
}

function ResourceList({ kind }: { kind: ResourceKind }) {
  const meta = resourceMeta[kind];
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<PlatformRecord | null>(null);
  const [modal, setModal] = useState<ModalKind>(null);
  const [drawer, setDrawer] = useState<DrawerKind>(null);
  const queryParams = createListQuery({ page, per_page: 25, search });

  const listQuery = useQuery({
    queryKey: platformQueryKeys.list(meta.resourceKey, queryParams),
    queryFn: () => {
      if (kind === 'roles') return platformAccessApi.roles.list(queryParams);
      if (kind === 'permissions') return platformAccessApi.permissions.list(queryParams);
      if (kind === 'teams') return platformAccessApi.teams.list(queryParams);
      return platformAccessApi.teamRoles.list(queryParams);
    }
  });

  const rows = listQuery.data?.data ?? [];
  const invalidate = () => queryClient.invalidateQueries({ queryKey: platformQueryKeys.resource(meta.resourceKey) });
  const actionMutation = useMutation({
    mutationFn: async ({ action, record, payload }: { action: string; record: PlatformRecord; payload?: Record<string, unknown> }) => {
      const id = idOf(record);
      if (action === 'activate') return platformAccessApi.roles.activate(id, String(payload?.audit_reason ?? 'Role activated'));
      if (action === 'deactivate') return platformAccessApi.roles.deactivate(id, String(payload?.audit_reason ?? 'Role deactivated'));
      if (action === 'deleteRole') return platformAccessApi.roles.delete(id, { audit_reason: String(payload?.audit_reason ?? 'Role deleted') });
      if (action === 'deletePermission') return platformAccessApi.permissions.delete(id);
      if (action === 'archiveTeam') return platformAccessApi.teams.delete(id, { audit_reason: String(payload?.audit_reason ?? 'Team archived') });
      if (action === 'deleteTeamRole') return platformAccessApi.teamRoles.delete(id, { audit_reason: String(payload?.audit_reason ?? 'Team role deleted') });
      throw new Error(`Unsupported action ${action}`);
    },
    onSuccess: invalidate
  });

  const columns = useMemo(() => columnsFor(kind, {
    onView: (record) => navigate(`${meta.route}/${idOf(record)}`),
    onEdit: (record) => navigate(`${meta.route}/${idOf(record)}/edit`),
    onAction: (nextModal, record) => {
      setSelectedRecord(record);
      setModal(nextModal);
    },
    onDrawer: (nextDrawer, record) => {
      setSelectedRecord(record);
      setDrawer(nextDrawer);
    },
    onInlineAction: (action, record) => actionMutation.mutate({ action, record, payload: auditPayload(`${action} from list`) })
  }), [actionMutation, kind, meta.route, navigate]);

  const header = (
    <PageHeader
      breadcrumbs={<AdminBreadcrumbs items={['Access Control', meta.label]} />}
      title={meta.label}
      description={descriptionFor(kind)}
      actions={
        <>
          {kind === 'roles' ? (
            <Button type="button" variant="secondary" size="sm">Keyboard Shortcuts</Button>
          ) : null}
          {kind === 'teamRoles' ? null : (
            <PermissionButton guard="platform" permission={`${meta.permission}.create`} type="button" onClick={() => navigate(`${meta.route}/create`)}>
              <Plus size={16} aria-hidden="true" />
              {kind === 'roles' ? 'Create Role' : 'Create'}
            </PermissionButton>
          )}
          {kind === 'teamRoles' ? (
            <PermissionButton guard="platform" permission="platform_team.create" type="button" onClick={() => setModal('teamRoleEditor')}>
              <Plus size={16} aria-hidden="true" />
              Create Team Role
            </PermissionButton>
          ) : null}
        </>
      }
    />
  );

  const table = (
    <DataTable
      columns={columns}
      data={rows}
      getRowId={idOf}
      loading={listQuery.isLoading}
      error={listQuery.isError ? errorMessage(listQuery.error) : ''}
      searchValue={search}
      searchPlaceholder={kind === 'roles' ? 'Search roles...' : `Search ${meta.label.toLowerCase()}...`}
      onSearchChange={setSearch}
      onOpenFilters={() => setDrawer('filters')}
      onOpenColumns={() => setModal('columns')}
      onOpenSavedViews={() => setModal('views')}
      onOpenExport={() => setModal('export')}
      selectedRowIds={selectedIds}
      onSelectionChange={setSelectedIds}
      page={page}
      total={totalFromQuery(listQuery.data)}
      onPageChange={setPage}
      bulkActions={
        <div className="table-actions">
          <PermissionButton guard="platform" permission={`${meta.permission}.edit`} type="button" size="sm" variant="secondary">
            Activate
          </PermissionButton>
          <PermissionButton guard="platform" permission={`${meta.permission}.edit`} type="button" size="sm" variant="secondary">
            Deactivate
          </PermissionButton>
          <PermissionButton guard="platform" permission={`${meta.permission}.view`} type="button" size="sm" variant="secondary" onClick={() => setModal('export')}>
            Export Selected
          </PermissionButton>
        </div>
      }
    />
  );

  if (kind === 'roles') {
    return (
      <section className="enterprise-module-page platform-access-page admin-master-page">
        {header}
        <div className="admin-master-grid">
          <div className="admin-master-main">
            {table}
            <ResourceStats kind={kind} rows={rows} />
          </div>
          <AuditRail rows={rows} />
        </div>

        <StandardListControls
          kind={kind}
          modal={modal}
          drawer={drawer}
          selectedRecord={selectedRecord}
          onClose={() => {
            setModal(null);
            setDrawer(null);
          }}
          onAction={(action, payload) => selectedRecord && actionMutation.mutate({ action, record: selectedRecord, payload })}
        />
      </section>
    );
  }

  return (
    <section className="enterprise-module-page platform-access-page">
      {header}
      {table}
      <ResourceStats kind={kind} rows={rows} />

      <StandardListControls
        kind={kind}
        modal={modal}
        drawer={drawer}
        selectedRecord={selectedRecord}
        onClose={() => {
          setModal(null);
          setDrawer(null);
        }}
        onAction={(action, payload) => selectedRecord && actionMutation.mutate({ action, record: selectedRecord, payload })}
      />
    </section>
  );
}

function columnsFor(
  kind: ResourceKind,
  handlers: {
    onView: (record: PlatformRecord) => void;
    onEdit: (record: PlatformRecord) => void;
    onAction: (modal: ModalKind, record: PlatformRecord) => void;
    onDrawer: (drawer: DrawerKind, record: PlatformRecord) => void;
    onInlineAction: (action: string, record: PlatformRecord) => void;
  }
): DataTableColumn<PlatformRecord>[] {
  const statusColumn = {
    id: 'status',
    header: 'Status',
    accessor: (row: PlatformRecord) => row.status,
    enableSorting: true,
    cell: (row: PlatformRecord) => <CompactStatusBadge status={textOf(row, ['status'], 'inactive')} />
  };
  const actionColumn = {
    id: 'actions',
    header: 'Actions',
    enableHiding: false,
    cell: (row: PlatformRecord) => kind === 'roles'
      ? <RoleActionsMenu row={row} handlers={handlers} />
      : <ResourceActionsMenu kind={kind} row={row} handlers={handlers} />
  } satisfies DataTableColumn<PlatformRecord>;

  if (kind === 'roles') {
    return [
      { id: 'display_name', header: 'Display Name', accessor: (row) => row.display_name, enableSorting: true, cell: (row) => <RoleNameCell row={row} /> },
      { id: 'name', header: 'Role Name', accessor: (row) => row.name, enableSorting: true, cell: (row) => <span className="muted-cell">{textOf(row, ['name'])}</span> },
      { id: 'guard_name', header: 'Guard', accessor: (row) => row.guard_name, cell: (row) => textOf(row, ['guard_name']) },
      { id: 'permissions_count', header: 'Permissions', accessor: (row) => row.permissions_count, cell: (row) => textOf(row, ['permissions_count'], '0') },
      { id: 'users_count', header: 'Assigned Users', accessor: (row) => row.users_count, cell: (row) => textOf(row, ['users_count'], '0') },
      { id: 'is_system', header: 'System', accessor: (row) => row.is_system, cell: (row) => <SystemRoleBadge system={Boolean(row.is_system)} /> },
      statusColumn,
      { id: 'created_at', header: 'Created At', accessor: (row) => row.created_at, enableSorting: true, cell: (row) => <DateCell value={row.created_at} /> },
      { id: 'updated_at', header: 'Updated At', accessor: (row) => row.updated_at, enableSorting: true, cell: (row) => <DateCell value={row.updated_at} /> },
      actionColumn
    ];
  }
  if (kind === 'permissions') {
    return [
      { id: 'module', header: 'Module', accessor: (row) => row.module, enableSorting: true, cell: (row) => textOf(row, ['module']) },
      { id: 'name', header: 'Permission Name', accessor: (row) => row.name, enableSorting: true, cell: (row) => textOf(row, ['name']) },
      { id: 'display_name', header: 'Display Name', accessor: (row) => row.display_name, cell: (row) => textOf(row, ['display_name']) },
      { id: 'guard_name', header: 'Guard', accessor: (row) => row.guard_name, cell: (row) => textOf(row, ['guard_name']) },
      { id: 'roles_count', header: 'Roles', accessor: (row) => row.roles_count, cell: (row) => textOf(row, ['roles_count'], '0') },
      { id: 'is_system', header: 'System', accessor: (row) => row.is_system, cell: (row) => row.is_system ? 'Yes' : 'No' },
      statusColumn,
      actionColumn
    ];
  }
  if (kind === 'teams') {
    return [
      { id: 'name', header: 'Team', accessor: (row) => row.name, enableSorting: true, cell: (row) => textOf(row, ['name']) },
      { id: 'code', header: 'Code', accessor: (row) => row.code, cell: (row) => textOf(row, ['code']) },
      { id: 'lead', header: 'Lead', accessor: (row) => row.lead_name as string, cell: (row) => textOf(row, ['lead_name', 'lead_platform_user_id']) },
      { id: 'members_count', header: 'Members', accessor: (row) => row.members_count, cell: (row) => textOf(row, ['members_count'], '0') },
      { id: 'assigned_tenants_count', header: 'Tenants', accessor: (row) => row.assigned_tenants_count, cell: (row) => textOf(row, ['assigned_tenants_count'], '0') },
      { id: 'visibility', header: 'Visibility', accessor: (row) => row.visibility, cell: (row) => textOf(row, ['visibility']) },
      statusColumn,
      actionColumn
    ];
  }
  return [
    { id: 'name', header: 'Name', accessor: (row) => row.name, enableSorting: true, cell: (row) => textOf(row, ['name']) },
    { id: 'code', header: 'Code', accessor: (row) => row.code, cell: (row) => textOf(row, ['code']) },
    { id: 'sort_order', header: 'Sort', accessor: (row) => row.sort_order as number, cell: (row) => textOf(row, ['sort_order'], '0') },
    { id: 'is_system', header: 'System', accessor: (row) => row.is_system, cell: (row) => row.is_system ? 'Yes' : 'No' },
    statusColumn,
    actionColumn
  ];
}

function AdminBreadcrumbs({ items }: { items: string[] }) {
  return (
    <nav className="admin-breadcrumbs" aria-label="Breadcrumb">
      {items.map((item, index) => (
        <span key={`${item}-${index}`}>{item}</span>
      ))}
    </nav>
  );
}

function RoleNameCell({ row }: { row: PlatformRecord }) {
  const name = textOf(row, ['display_name', 'name']);
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <span className="role-name-cell">
      <span className="role-avatar" aria-hidden="true">{initials || 'R'}</span>
      <span>
        <strong>{name}</strong>
        {row.description ? <small>{String(row.description)}</small> : null}
      </span>
    </span>
  );
}

function CompactStatusBadge({ status }: { status: string }) {
  const active = status.toLowerCase() === 'active';
  return (
    <span className={`status-pill ${active ? 'status-pill--active' : 'status-pill--muted'}`}>
      <i aria-hidden="true" />
      {status}
    </span>
  );
}

function SystemRoleBadge({ system }: { system: boolean }) {
  return <span className={`system-badge ${system ? 'system-badge--yes' : 'system-badge--no'}`}>{system ? 'Yes' : 'No'}</span>;
}

function DateCell({ value }: { value: unknown }) {
  if (!value) return <span className="muted-cell">-</span>;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return <span className="muted-cell">{String(value)}</span>;
  return (
    <span className="date-cell">
      <strong>{date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
      <small>{date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</small>
    </span>
  );
}

function RoleActionsMenu({
  row,
  handlers
}: {
  row: PlatformRecord;
  handlers: {
    onView: (record: PlatformRecord) => void;
    onEdit: (record: PlatformRecord) => void;
    onAction: (modal: ModalKind, record: PlatformRecord) => void;
    onDrawer: (drawer: DrawerKind, record: PlatformRecord) => void;
    onInlineAction: (action: string, record: PlatformRecord) => void;
  };
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const isActive = textOf(row, ['status'], '').toLowerCase() === 'active';

  function run(callback: () => void) {
    callback();
    setOpen(false);
  }

  return (
    <div className="action-dropdown">
      <button ref={triggerRef} type="button" className="action-menu-trigger" aria-label={`Open actions for ${textOf(row, ['display_name', 'name'])}`} aria-expanded={open} onClick={() => setOpen((current) => !current)}>
        <MoreVertical size={16} aria-hidden="true" />
      </button>
      <PortalActionMenu open={open} anchorRef={triggerRef} onClose={() => setOpen(false)}>
        <div className="action-menu" role="menu">
          <button type="button" role="menuitem" onMouseDown={(event) => event.preventDefault()} onClick={() => run(() => handlers.onView(row))}><Eye size={15} aria-hidden="true" /> View</button>
          <PermissionButton guard="platform" permission="platform_role.edit" type="button" role="menuitem" variant="ghost" onMouseDown={(event) => event.preventDefault()} onClick={() => run(() => handlers.onEdit(row))}><Pencil size={15} aria-hidden="true" /> Edit</PermissionButton>
          <PermissionButton guard="platform" permission="platform_role.create" type="button" role="menuitem" variant="ghost" onMouseDown={(event) => event.preventDefault()} onClick={() => run(() => handlers.onAction('cloneRole', row))}><Copy size={15} aria-hidden="true" /> Clone</PermissionButton>
          <hr />
          <PermissionButton guard="platform" permission="platform_role.edit" type="button" role="menuitem" variant="ghost" onMouseDown={(event) => event.preventDefault()} onClick={() => run(() => handlers.onInlineAction(isActive ? 'deactivate' : 'activate', row))}><RotateCcw size={15} aria-hidden="true" /> {isActive ? 'Deactivate' : 'Activate'}</PermissionButton>
          <hr />
          <PermissionButton guard="platform" permission="platform_role.view" type="button" role="menuitem" variant="ghost" onMouseDown={(event) => event.preventDefault()} onClick={() => run(() => handlers.onAction('assignUsers', row))}><Users size={15} aria-hidden="true" /> View Assigned Users</PermissionButton>
          <PermissionButton guard="platform" permission="platform_role.view" type="button" role="menuitem" variant="ghost" onMouseDown={(event) => event.preventDefault()} onClick={() => run(() => handlers.onDrawer('assignPermissions', row))}><ShieldCheck size={15} aria-hidden="true" /> View Permissions</PermissionButton>
          <button type="button" role="menuitem" onMouseDown={(event) => event.preventDefault()} onClick={() => setOpen(false)}><KeyRound size={15} aria-hidden="true" /> Audit History</button>
          <hr />
          <PermissionButton guard="platform" permission="platform_role.delete" type="button" role="menuitem" variant="ghost" className="is-danger" onMouseDown={(event) => event.preventDefault()} onClick={() => run(() => handlers.onAction('deleteRole', row))}><Trash2 size={15} aria-hidden="true" /> Delete Role</PermissionButton>
        </div>
      </PortalActionMenu>
    </div>
  );
}

function ResourceActionsMenu({
  kind,
  row,
  handlers
}: {
  kind: Exclude<ResourceKind, 'roles'>;
  row: PlatformRecord;
  handlers: {
    onView: (record: PlatformRecord) => void;
    onEdit: (record: PlatformRecord) => void;
    onAction: (modal: ModalKind, record: PlatformRecord) => void;
    onDrawer: (drawer: DrawerKind, record: PlatformRecord) => void;
    onInlineAction: (action: string, record: PlatformRecord) => void;
  };
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const title = textOf(row, ['display_name', 'name', 'code']);

  function run(callback: () => void) {
    callback();
    setOpen(false);
  }

  return (
    <div className="action-dropdown">
      <button ref={triggerRef} type="button" className="action-menu-trigger" aria-label={`Open actions for ${title}`} aria-expanded={open} onClick={() => setOpen((current) => !current)}>
        <MoreVertical size={16} aria-hidden="true" />
      </button>
      <PortalActionMenu open={open} anchorRef={triggerRef} onClose={() => setOpen(false)}>
        <div className="action-menu" role="menu">
          <button type="button" role="menuitem" onMouseDown={(event) => event.preventDefault()} onClick={() => run(() => handlers.onView(row))}><Eye size={15} aria-hidden="true" /> View</button>
          <PermissionButton guard="platform" permission={permissionFor(kind, 'edit')} type="button" role="menuitem" variant="ghost" onMouseDown={(event) => event.preventDefault()} onClick={() => run(() => handlers.onEdit(row))}><Pencil size={15} aria-hidden="true" /> Edit</PermissionButton>

          {kind === 'permissions' ? (
            <>
              <hr />
              <button type="button" role="menuitem" onMouseDown={(event) => event.preventDefault()} onClick={() => run(() => handlers.onDrawer('permissionDetail', row))}><ShieldCheck size={15} aria-hidden="true" /> Permission Detail</button>
              {!row.is_system ? (
                <>
                  <hr />
                  <PermissionButton guard="platform" permission="platform_permission.delete" type="button" role="menuitem" variant="ghost" className="is-danger" onMouseDown={(event) => event.preventDefault()} onClick={() => run(() => handlers.onAction('deletePermission', row))}><Trash2 size={15} aria-hidden="true" /> Delete Permission</PermissionButton>
                </>
              ) : null}
            </>
          ) : null}

          {kind === 'teams' ? (
            <>
              <hr />
              <PermissionButton guard="platform" permission="platform_team.assign" type="button" role="menuitem" variant="ghost" onMouseDown={(event) => event.preventDefault()} onClick={() => run(() => handlers.onAction('addMember', row))}><Users size={15} aria-hidden="true" /> Add Member</PermissionButton>
              <PermissionButton guard="platform" permission="platform_team.assign" type="button" role="menuitem" variant="ghost" onMouseDown={(event) => event.preventDefault()} onClick={() => run(() => handlers.onAction('assignRecord', row))}><ShieldCheck size={15} aria-hidden="true" /> Assign Records</PermissionButton>
              <hr />
              <PermissionButton guard="platform" permission="platform_team.delete" type="button" role="menuitem" variant="ghost" className="is-danger" onMouseDown={(event) => event.preventDefault()} onClick={() => run(() => handlers.onAction('archiveTeam', row))}><Archive size={15} aria-hidden="true" /> Archive Team</PermissionButton>
            </>
          ) : null}

          {kind === 'teamRoles' ? (
            <>
              <hr />
              <PermissionButton guard="platform" permission="platform_team.edit" type="button" role="menuitem" variant="ghost" onMouseDown={(event) => event.preventDefault()} onClick={() => run(() => handlers.onAction('teamRoleEditor', row))}><KeyRound size={15} aria-hidden="true" /> Team Role Editor</PermissionButton>
              <hr />
              <PermissionButton guard="platform" permission="platform_team.delete" type="button" role="menuitem" variant="ghost" className="is-danger" onMouseDown={(event) => event.preventDefault()} onClick={() => run(() => handlers.onInlineAction('deleteTeamRole', row))}><Trash2 size={15} aria-hidden="true" /> Delete Team Role</PermissionButton>
            </>
          ) : null}
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
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open) return;

    function syncPosition() {
      const rect = anchorRef.current?.getBoundingClientRect();
      if (!rect) return;
      const menuWidth = 216;
      setPosition({
        top: Math.min(rect.bottom + 6, window.innerHeight - 24),
        left: Math.max(8, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8))
      });
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }

    syncPosition();
    window.addEventListener('resize', syncPosition);
    window.addEventListener('scroll', syncPosition, true);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('resize', syncPosition);
      window.removeEventListener('scroll', syncPosition, true);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [anchorRef, onClose, open]);

  if (!open) return null;

  return createPortal(
    <div className="action-menu-portal" style={{ left: position.left, top: position.top }}>
      <button type="button" className="action-menu-backdrop" aria-label="Close actions menu" onClick={onClose} />
      {children}
    </div>,
    document.body
  );
}

function ResourceForm({ kind, record, title }: { kind: ResourceKind; record?: PlatformRecord; title?: string }) {
  if (kind === 'roles') return <RoleFormPage record={record} title={title} />;
  if (kind === 'permissions') return <PermissionFormPage record={record} title={title} />;
  if (kind === 'teams') return <TeamFormPage record={record} title={title} />;
  return <TeamRoleFormPage record={record} title={title} />;
}

function RoleFormPage({ record, title }: { record?: PlatformRecord; title?: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedPermissionIdsState, setSelectedPermissionIdsState] = useState(selectedPermissionIds(record));
  const form = useForm<RoleForm>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: textOf(record, ['name'], ''),
      display_name: textOf(record, ['display_name'], ''),
      guard_name: textOf(record, ['guard_name'], 'platform'),
      description: textOf(record, ['description'], ''),
      status: textOf(record, ['status'], 'active'),
      is_system: Boolean(record?.is_system),
      permission_ids: selectedPermissionIds(record).join(','),
      audit_reason: record ? 'Quarterly access review' : 'Initial role setup'
    }
  });
  const mutation = useMutation({
    mutationFn: (values: RoleForm) => {
      const payload: RolePayload = {
        ...values,
        permission_ids: selectedPermissionIdsState.length > 0 ? selectedPermissionIdsState : values.permission_ids?.split(',').map((item) => item.trim()).filter(Boolean),
        audit_reason: values.audit_reason
      };
      return record ? platformAccessApi.roles.update(idOf(record), payload) : platformAccessApi.roles.create(payload);
    },
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({ queryKey: platformQueryKeys.resource(resourceMeta.roles.resourceKey) });
      navigate(`${resourceMeta.roles.route}/${idOf(saved) || idOf(record)}`);
    }
  });

  return (
    <FormShell
      backTo={resourceMeta.roles.route}
      error={mutation.error}
      isSaving={mutation.isPending}
      onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      title={title ?? `Edit ${textOf(record, ['display_name', 'name'])}`}
      permission={record ? 'platform_role.edit' : 'platform_role.create'}
      side={<RoleSummary record={record} selectedCount={selectedPermissionIdsState.length} />}
      footerExtra={<Button type="button" variant="secondary" onClick={() => setDrawerOpen(true)}>Assign permissions</Button>}
    >
      <FormGrid>
        <InputField form={form} name="name" label="Role name" placeholder="billing_manager" />
        <InputField form={form} name="display_name" label="Display name" placeholder="Billing Manager" />
        <InputField form={form} name="guard_name" label="Guard name" placeholder="platform" />
        <InputField form={form} name="description" label="Description" type="textarea" />
        <SelectField form={form} name="status" label="Status" options={['active', 'inactive']} />
        <CheckboxField form={form} name="is_system" label="System role" />
        <InputField form={form} name="audit_reason" label="Audit reason" />
      </FormGrid>
      <AssignPermissionsDrawer
        open={drawerOpen}
        role={record}
        selectedIds={selectedPermissionIdsState}
        onSelectedIdsChange={setSelectedPermissionIdsState}
        onClose={() => setDrawerOpen(false)}
        onSaved={() => setDrawerOpen(false)}
      />
    </FormShell>
  );
}

function PermissionFormPage({ record, title }: { record?: PlatformRecord; title?: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const form = useForm<PermissionForm>({
    resolver: zodResolver(permissionSchema),
    defaultValues: {
      module: textOf(record, ['module'], ''),
      name: textOf(record, ['name'], ''),
      display_name: textOf(record, ['display_name'], ''),
      description: textOf(record, ['description'], ''),
      guard_name: textOf(record, ['guard_name'], 'platform'),
      is_system: Boolean(record?.is_system),
      status: textOf(record, ['status'], 'active')
    }
  });
  const mutation = useMutation({
    mutationFn: (values: PermissionForm) =>
      record ? platformAccessApi.permissions.update(idOf(record), values as PermissionPayload) : platformAccessApi.permissions.create(values as PermissionPayload),
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({ queryKey: platformQueryKeys.resource(resourceMeta.permissions.resourceKey) });
      navigate(`${resourceMeta.permissions.route}/${idOf(saved) || idOf(record)}`);
    }
  });

  return (
    <FormShell
      backTo={resourceMeta.permissions.route}
      error={mutation.error}
      isSaving={mutation.isPending}
      onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      title={title ?? `Edit ${textOf(record, ['display_name', 'name'])}`}
      permission={record ? 'platform_permission.edit' : 'platform_permission.create'}
      side={<PermissionTip record={record} />}
    >
      <FormGrid>
        <InputField form={form} name="module" label="Module" placeholder="billing" />
        <InputField form={form} name="name" label="Permission name" placeholder="billing.invoice.view" />
        <InputField form={form} name="display_name" label="Display name" />
        <InputField form={form} name="guard_name" label="Guard name" placeholder="platform" />
        <InputField form={form} name="description" label="Description" type="textarea" />
        <SelectField form={form} name="status" label="Status" options={['active', 'inactive']} />
        <CheckboxField form={form} name="is_system" label="System permission" />
      </FormGrid>
    </FormShell>
  );
}

function TeamFormPage({ record, title }: { record?: PlatformRecord; title?: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const form = useForm<TeamForm>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: textOf(record, ['name'], ''),
      code: textOf(record, ['code'], ''),
      description: textOf(record, ['description'], ''),
      lead_platform_user_id: textOf(record, ['lead_platform_user_id'], ''),
      assistant_lead_platform_user_id: textOf(record, ['assistant_lead_platform_user_id'], ''),
      email: textOf(record, ['email'], ''),
      phone: textOf(record, ['phone'], ''),
      color: textOf(record, ['color'], '#2563eb'),
      icon: textOf(record, ['icon'], 'shield'),
      visibility: textOf(record, ['visibility'], 'internal'),
      status: textOf(record, ['status'], 'active'),
      audit_reason: record ? 'Team profile update' : 'Team created'
    }
  });
  const mutation = useMutation({
    mutationFn: (values: TeamForm) =>
      record ? platformAccessApi.teams.update(idOf(record), values as TeamPayload) : platformAccessApi.teams.create(values as TeamPayload),
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({ queryKey: platformQueryKeys.resource(resourceMeta.teams.resourceKey) });
      navigate(`${resourceMeta.teams.route}/${idOf(saved) || idOf(record)}`);
    }
  });

  return (
    <FormShell
      backTo={resourceMeta.teams.route}
      error={mutation.error}
      isSaving={mutation.isPending}
      onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      title={title ?? `Edit ${textOf(record, ['name'])}`}
      permission={record ? 'platform_team.edit' : 'platform_team.create'}
      side={<TeamSummary record={record} />}
    >
      <FormGrid>
        <InputField form={form} name="name" label="Team name" />
        <InputField form={form} name="code" label="Team code" />
        <InputField form={form} name="lead_platform_user_id" label="Lead platform user ID" />
        <InputField form={form} name="assistant_lead_platform_user_id" label="Assistant lead user ID" />
        <InputField form={form} name="email" label="Team email" />
        <InputField form={form} name="phone" label="Phone" />
        <InputField form={form} name="color" label="Color" type="color" />
        <InputField form={form} name="icon" label="Icon" />
        <SelectField form={form} name="visibility" label="Visibility" options={['internal', 'private']} />
        <SelectField form={form} name="status" label="Status" options={['active', 'inactive', 'archived']} />
        <InputField form={form} name="description" label="Description" type="textarea" />
        <InputField form={form} name="audit_reason" label="Audit reason" />
      </FormGrid>
    </FormShell>
  );
}

function TeamRoleFormPage({ record, title }: { record?: PlatformRecord; title?: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const form = useForm<TeamRoleForm>({
    resolver: zodResolver(teamRoleSchema),
    defaultValues: {
      name: textOf(record, ['name'], ''),
      code: textOf(record, ['code'], ''),
      description: textOf(record, ['description'], ''),
      permissions_json: JSON.stringify(record?.permissions ?? {}, null, 2),
      sort_order: Number(record?.sort_order ?? 0),
      is_system: Boolean(record?.is_system),
      status: textOf(record, ['status'], 'active'),
      audit_reason: record ? 'Team role update' : 'Team role created'
    }
  });
  const mutation = useMutation({
    mutationFn: (values: TeamRoleForm) => {
      const payload: TeamRolePayload = {
        name: values.name,
        code: values.code,
        description: values.description,
        permissions: values.permissions_json ? JSON.parse(values.permissions_json) : {},
        sort_order: values.sort_order,
        is_system: values.is_system,
        status: values.status,
        audit_reason: values.audit_reason
      };
      return record ? platformAccessApi.teamRoles.update(idOf(record), payload) : platformAccessApi.teamRoles.create(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: platformQueryKeys.resource(resourceMeta.teamRoles.resourceKey) });
      navigate(resourceMeta.teamRoles.route);
    }
  });

  return (
    <FormShell
      backTo={resourceMeta.teamRoles.route}
      error={mutation.error}
      isSaving={mutation.isPending}
      onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      title={title ?? `Edit ${textOf(record, ['name'])}`}
      permission={record ? 'platform_team.edit' : 'platform_team.create'}
      side={<PermissionTip record={record} />}
    >
      <FormGrid>
        <InputField form={form} name="name" label="Name" />
        <InputField form={form} name="code" label="Code" />
        <InputField form={form} name="sort_order" label="Sort order" type="number" />
        <SelectField form={form} name="status" label="Status" options={['active', 'inactive']} />
        <CheckboxField form={form} name="is_system" label="System role" />
        <InputField form={form} name="description" label="Description" type="textarea" />
        <InputField form={form} name="permissions_json" label="Permissions JSON" type="textarea" />
        <InputField form={form} name="audit_reason" label="Audit reason" />
      </FormGrid>
    </FormShell>
  );
}

function ResourceView({ kind, record }: { kind: ResourceKind; record: PlatformRecord }) {
  const meta = resourceMeta[kind];
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('details');
  const [modal, setModal] = useState<ModalKind>(null);
  const [drawer, setDrawer] = useState<DrawerKind>(null);
  const tabs = [
    { id: 'details', label: 'Details' },
    { id: 'permissions', label: 'Permissions' },
    { id: 'users', label: kind === 'teams' ? 'Members' : 'Assigned Users' },
    { id: 'assignments', label: 'Assignments' },
    { id: 'activity', label: 'Activity' }
  ];

  return (
    <section className="enterprise-module-page platform-access-page">
      <PageHeader
        title={textOf(record, ['display_name', 'name'])}
        description={textOf(record, ['description'], 'Manage details, assignments, permissions, and activity.')}
        meta={<StatusBadge tone={record.status === 'active' ? 'success' : 'neutral'}>{textOf(record, ['status'])}</StatusBadge>}
        tabs={<Tabs tabs={tabs} activeId={activeTab} onChange={setActiveTab} ariaLabel={`${meta.label} tabs`} />}
        actions={
          <>
            <Button type="button" variant="secondary" onClick={() => navigate(meta.route)}>Back</Button>
            <PermissionButton guard="platform" permission={`${meta.permission}.edit`} type="button" onClick={() => navigate(`${meta.route}/${idOf(record)}/edit`)}>
              <Pencil size={16} aria-hidden="true" />
              Edit
            </PermissionButton>
            {kind === 'roles' ? (
              <>
                <PermissionButton guard="platform" permission="platform_role.edit" type="button" variant="secondary" onClick={() => setDrawer('assignPermissions')}>Assign Permissions</PermissionButton>
                <PermissionButton guard="platform" permission="platform_role.edit" type="button" variant="secondary" onClick={() => setModal('assignUsers')}>Assign Users</PermissionButton>
                <PermissionButton guard="platform" permission="platform_role.create" type="button" variant="secondary" onClick={() => setModal('cloneRole')}>Clone</PermissionButton>
              </>
            ) : null}
            {kind === 'teams' ? (
              <>
                <PermissionButton guard="platform" permission="platform_team.assign" type="button" variant="secondary" onClick={() => setModal('addMember')}>Add Member</PermissionButton>
                <PermissionButton guard="platform" permission="platform_team.assign" type="button" variant="secondary" onClick={() => setModal('assignRecord')}>Assign Records</PermissionButton>
                <PermissionButton guard="platform" permission="platform_team.assign" type="button" variant="secondary" onClick={() => setModal('releaseAssignment')}>Release Assignment</PermissionButton>
              </>
            ) : null}
          </>
        }
      />

      <div className="platform-access-summary">
        <SummaryTile icon={<ShieldCheck />} label="Permissions" value={textOf(record, ['permissions_count'], selectedPermissionIds(record).length ? String(selectedPermissionIds(record).length) : '0')} />
        <SummaryTile icon={<Users />} label={kind === 'teams' ? 'Members' : 'Assigned Users'} value={textOf(record, ['users_count', 'members_count'], '0')} />
        <SummaryTile icon={<KeyRound />} label="Guard" value={textOf(record, ['guard_name'], kind === 'teams' ? 'platform_team' : '-')} />
        <SummaryTile icon={<CheckCircle2 />} label="System" value={record.is_system ? 'Yes' : 'No'} />
      </div>

      <article className="enterprise-view-panel">
        {activeTab === 'details' ? <RecordDetails record={record} /> : null}
        {activeTab === 'permissions' ? <PermissionGroups groups={record.permissions as GroupedPermissions | undefined} /> : null}
        {activeTab === 'users' && kind === 'teams' ? <TeamMembersPanel team={record} /> : null}
        {activeTab === 'users' && kind !== 'teams' ? <RecordList rows={(record.users as PlatformRecord[] | undefined) ?? (record.members as PlatformRecord[] | undefined) ?? []} /> : null}
        {activeTab === 'assignments' && kind === 'teams' ? <TeamAssignmentsPanel team={record} /> : null}
        {activeTab === 'assignments' && kind !== 'teams' ? <RecordList rows={(record.assignments as PlatformRecord[] | undefined) ?? []} /> : null}
        {activeTab === 'activity' ? <AuditRail rows={[record]} compact /> : null}
      </article>

      <StandardListControls
        kind={kind}
        modal={modal}
        drawer={drawer}
        selectedRecord={record}
        onClose={() => {
          setModal(null);
          setDrawer(null);
        }}
      />
    </section>
  );
}

function StandardListControls({
  kind,
  modal,
  drawer,
  selectedRecord,
  onClose,
  onAction
}: {
  kind: ResourceKind;
  modal: ModalKind;
  drawer: DrawerKind;
  selectedRecord: PlatformRecord | null;
  onClose: () => void;
  onAction?: (action: string, payload: Record<string, unknown>) => void;
}) {
  return (
    <>
      <AdvancedFiltersDrawer
        open={drawer === 'filters'}
        onClose={onClose}
        guard="platform"
        permission={`${resourceMeta[kind].permission}.view`}
        fields={[{ name: 'status', label: 'Status', input: <select><option>Any</option><option>Active</option><option>Inactive</option></select> }]}
        onApply={onClose}
        onReset={() => undefined}
      />
      <ColumnManagerModal
        open={modal === 'columns'}
        onClose={onClose}
        guard="platform"
        permission={`${resourceMeta[kind].permission}.view`}
        columns={[{ id: 'name', label: 'Name', visible: true }, { id: 'status', label: 'Status', visible: true }]}
        onToggle={() => undefined}
        onReset={() => undefined}
        onSave={onClose}
      />
      <SavedViewsModal
        open={modal === 'views'}
        onClose={onClose}
        guard="platform"
        permission={`${resourceMeta[kind].permission}.view`}
        views={[{ id: 'active', name: 'Active records', visibility: 'shared', isDefault: true }]}
        activeViewId="active"
        onSelect={onClose}
        onSaveCurrent={onClose}
      />
      <ExportModal
        open={modal === 'export'}
        onClose={onClose}
        guard="platform"
        permission={`${resourceMeta[kind].permission}.view`}
        columns={['Name', 'Status', 'Created At', 'Updated At']}
        selectedCount={selectedRecord ? 1 : 0}
        onExport={onClose}
      />
      <AssignPermissionsDrawer open={drawer === 'assignPermissions'} role={selectedRecord} onClose={onClose} onSaved={onClose} />
      <PermissionDetailDrawer open={drawer === 'permissionDetail'} record={selectedRecord} onClose={onClose} />
      <AssignUsersModal open={modal === 'assignUsers'} role={selectedRecord} onClose={onClose} />
      <CloneRoleModal open={modal === 'cloneRole'} role={selectedRecord} onClose={onClose} />
      <DeleteRoleDialog open={modal === 'deleteRole'} role={selectedRecord} onClose={onClose} onConfirm={(payload) => onAction?.('deleteRole', payload)} />
      <PermissionEditorModal open={modal === 'permissionEditor'} permission={selectedRecord} onClose={onClose} />
      <ConfirmDialog
        open={modal === 'deletePermission'}
        onClose={onClose}
        title="Delete permission"
        description="Delete this custom permission if it is unused."
        confirmLabel="Delete"
        typedConfirmation="DELETE"
        guard="platform"
        permission="platform_permission.delete"
        onConfirm={() => {
          onAction?.('deletePermission', {});
          onClose();
        }}
      />
      <AddMemberModal open={modal === 'addMember'} team={selectedRecord} onClose={onClose} />
      <AssignRecordModal open={modal === 'assignRecord'} team={selectedRecord} onClose={onClose} />
      <ReleaseAssignmentModal open={modal === 'releaseAssignment'} team={selectedRecord} onClose={onClose} />
      <TeamRoleEditorModal open={modal === 'teamRoleEditor'} role={selectedRecord} onClose={onClose} />
      <ConfirmDialog
        open={modal === 'archiveTeam'}
        onClose={onClose}
        title="Archive platform team"
        description="Archive this platform team and stop new assignments."
        confirmLabel="Archive"
        reasonRequired
        guard="platform"
        permission="platform_team.delete"
        onConfirm={(payload) => {
          onAction?.('archiveTeam', auditPayload(payload.reason ?? 'Team archived'));
          onClose();
        }}
      />
    </>
  );
}

function AssignPermissionsDrawer({
  open,
  role,
  selectedIds,
  onSelectedIdsChange,
  onClose,
  onSaved
}: {
  open: boolean;
  role?: PlatformRecord | null;
  selectedIds?: string[];
  onSelectedIdsChange?: (ids: string[]) => void;
  onClose: () => void;
  onSaved: () => void;
}) {
  const queryClient = useQueryClient();
  const [localIds, setLocalIds] = useState<string[]>(selectedIds ?? selectedPermissionIds(role));
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [auditReason, setAuditReason] = useState('Quarterly access review');
  const groupedQuery = useQuery({
    queryKey: platformQueryKeys.resource('platform-permissions-grouped'),
    queryFn: platformAccessApi.permissions.grouped,
    enabled: open
  });
  const mutation = useMutation({
    mutationFn: () => {
      if (!role) return Promise.resolve({ data: null });
      return platformAccessApi.roles.replacePermissions(idOf(role), { permission_ids: localIds, audit_reason: auditReason });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: platformQueryKeys.resource(resourceMeta.roles.resourceKey) });
      onSelectedIdsChange?.(localIds);
      onSaved();
    }
  });
  const groups = groupedQuery.data?.data.permissions ?? {};
  const modules = Object.keys(groups);
  const original = selectedPermissionIds(role);
  const added = localIds.filter((id) => !original.includes(id)).length;
  const removed = original.filter((id) => !localIds.includes(id)).length;

  useEffect(() => {
    if (open) setLocalIds(selectedIds ?? selectedPermissionIds(role));
  }, [open, role, selectedIds]);

  function toggle(id: string) {
    setLocalIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  return (
    <AppDrawer
      open={open}
      onClose={onClose}
      title="Assign permissions"
      guard="platform"
      permission="platform_role.edit"
      size="xl"
      loading={groupedQuery.isLoading || mutation.isPending}
      error={groupedQuery.isError ? errorMessage(groupedQuery.error) : mutation.error ? errorMessage(mutation.error) : null}
      footer={<><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="button" onClick={() => mutation.mutate()}>Save permissions</Button></>}
    >
      <div className="rbac-toolbar">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search permissions" />
        <select value={moduleFilter} onChange={(event) => setModuleFilter(event.target.value)}>
          <option value="">All modules</option>
          {modules.map((module) => <option key={module} value={module}>{module}</option>)}
        </select>
      </div>
      <div className="permission-diff">
        <span>{localIds.length} selected</span>
        <span>{added} added</span>
        <span>{removed} removed</span>
      </div>
      <div className="permission-groups">
        {Object.entries(groups)
          .filter(([module]) => !moduleFilter || module === moduleFilter)
          .map(([module, permissions]) => {
            const filtered = permissions.filter((permission) =>
              [permission.name, permission.display_name].join(' ').toLowerCase().includes(search.toLowerCase())
            );
            if (filtered.length === 0) return null;
            return (
              <section key={module}>
                <header><strong>{module}</strong><span>{filtered.length} permissions</span></header>
                <div>
                  {filtered.map((permission) => (
                    <label key={idOf(permission)}>
                      <input checked={localIds.includes(idOf(permission))} type="checkbox" onChange={() => toggle(idOf(permission))} />
                      <span>{textOf(permission, ['display_name', 'name'])}</span>
                      <small>{textOf(permission, ['name'])}</small>
                    </label>
                  ))}
                </div>
              </section>
            );
          })}
      </div>
      <label className="form-field">
        <span>Audit reason</span>
        <textarea value={auditReason} onChange={(event) => setAuditReason(event.target.value)} />
      </label>
    </AppDrawer>
  );
}

function AssignUsersModal({ open, role, onClose }: { open: boolean; role?: PlatformRecord | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [ids, setIds] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [notifyUsers, setNotifyUsers] = useState(true);
  const [auditReason, setAuditReason] = useState('Role assignment update');
  const mutation = useMutation({
    mutationFn: () => platformAccessApi.roles.assignUsers(idOf(role), {
      platform_user_ids: ids.split(',').map((item) => item.trim()).filter(Boolean),
      effective_date: effectiveDate || undefined,
      notify_users: notifyUsers,
      audit_reason: auditReason
    }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: platformQueryKeys.resource(resourceMeta.roles.resourceKey) });
      onClose();
    }
  });

  return (
    <AppModal open={open} onClose={onClose} title="Assign users" guard="platform" permission="platform_role.edit" loading={mutation.isPending} error={mutation.error ? errorMessage(mutation.error) : null} footer={<><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="button" onClick={() => mutation.mutate()}>Assign users</Button></>}>
      <div className="form-grid">
        <label>Platform user IDs<input value={ids} onChange={(event) => setIds(event.target.value)} placeholder="uuid_1, uuid_2" /></label>
        <label>Effective date<input type="date" value={effectiveDate} onChange={(event) => setEffectiveDate(event.target.value)} /></label>
        <label className="check-row"><input checked={notifyUsers} type="checkbox" onChange={(event) => setNotifyUsers(event.target.checked)} /> Notify users</label>
        <label>Audit reason<textarea value={auditReason} onChange={(event) => setAuditReason(event.target.value)} /></label>
      </div>
    </AppModal>
  );
}

function CloneRoleModal({ open, role, onClose }: { open: boolean; role?: PlatformRecord | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(`${textOf(role, ['name'], 'role')}_copy`);
  const [displayName, setDisplayName] = useState(`${textOf(role, ['display_name', 'name'], 'Role')} Copy`);
  const [copyPermissions, setCopyPermissions] = useState(true);
  const [copyUsers, setCopyUsers] = useState(false);
  const [status, setStatus] = useState('inactive');
  const [auditReason, setAuditReason] = useState('Create restricted clone');

  useEffect(() => {
    if (!open) return;
    setName(`${textOf(role, ['name'], 'role')}_copy`);
    setDisplayName(`${textOf(role, ['display_name', 'name'], 'Role')} Copy`);
    setCopyPermissions(true);
    setCopyUsers(false);
    setStatus('inactive');
    setAuditReason('Create restricted clone');
  }, [open, role]);

  const mutation = useMutation({
    mutationFn: () => platformAccessApi.roles.clone(idOf(role), { name, display_name: displayName, copy_permissions: copyPermissions, copy_users: copyUsers, copy_description: true, status, audit_reason: auditReason }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: platformQueryKeys.resource(resourceMeta.roles.resourceKey) });
      onClose();
    }
  });

  return (
    <AppModal open={open} onClose={onClose} title="Clone role" guard="platform" permission="platform_role.create" loading={mutation.isPending} error={mutation.error ? errorMessage(mutation.error) : null} footer={<><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="button" onClick={() => mutation.mutate()}>Clone role</Button></>}>
      <div className="form-grid">
        <label>New name<input value={name} onChange={(event) => setName(event.target.value)} /></label>
        <label>Display name<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} /></label>
        <label>Status<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="inactive">Inactive</option><option value="active">Active</option></select></label>
        <label className="check-row"><input checked={copyPermissions} type="checkbox" onChange={(event) => setCopyPermissions(event.target.checked)} /> Copy permissions</label>
        <label className="check-row"><input checked={copyUsers} type="checkbox" onChange={(event) => setCopyUsers(event.target.checked)} /> Copy users</label>
        <label>Audit reason<textarea value={auditReason} onChange={(event) => setAuditReason(event.target.value)} /></label>
      </div>
    </AppModal>
  );
}

function DeleteRoleDialog({ open, role, onClose, onConfirm }: { open: boolean; role?: PlatformRecord | null; onClose: () => void; onConfirm: (payload: Record<string, unknown>) => void }) {
  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      title="Delete platform role"
      description={`This role has ${textOf(role, ['users_count'], '0')} assigned users. Reassign those users before deleting if required by backend policy.`}
      confirmLabel="Delete Role"
      typedConfirmation="DELETE"
      reasonRequired
      guard="platform"
      permission="platform_role.delete"
      onConfirm={(payload) => {
        onConfirm(auditPayload(payload.reason ?? 'Role retired'));
        onClose();
      }}
    />
  );
}

function PermissionEditorModal({ open, permission, onClose }: { open: boolean; permission?: PlatformRecord | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const form = useForm<PermissionForm>({
    resolver: zodResolver(permissionSchema),
    defaultValues: {
      module: '',
      name: '',
      display_name: '',
      description: '',
      guard_name: 'platform',
      is_system: false,
      status: 'active'
    }
  });
  const mutation = useMutation({
    mutationFn: (values: PermissionForm) =>
      permission
        ? platformAccessApi.permissions.update(idOf(permission), values as PermissionPayload)
        : platformAccessApi.permissions.create(values as PermissionPayload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: platformQueryKeys.resource(resourceMeta.permissions.resourceKey) });
      onClose();
    }
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      module: textOf(permission, ['module'], ''),
      name: textOf(permission, ['name'], ''),
      display_name: textOf(permission, ['display_name'], ''),
      description: textOf(permission, ['description'], ''),
      guard_name: textOf(permission, ['guard_name'], 'platform'),
      is_system: Boolean(permission?.is_system),
      status: textOf(permission, ['status'], 'active')
    });
  }, [form, open, permission]);

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={permission ? 'Edit permission' : 'Create permission'}
      guard="platform"
      permission={permission ? 'platform_permission.edit' : 'platform_permission.create'}
      loading={mutation.isPending}
      error={mutation.error ? errorMessage(mutation.error) : null}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="button" onClick={form.handleSubmit((values) => mutation.mutate(values))}>Save permission</Button>
        </>
      }
    >
      <div className="form-grid form-grid--two">
        <InputField form={form} name="module" label="Module" placeholder="billing" />
        <InputField form={form} name="name" label="Permission name" placeholder="billing.invoice.view" />
        <InputField form={form} name="display_name" label="Display name" />
        <InputField form={form} name="guard_name" label="Guard name" />
        <SelectField form={form} name="status" label="Status" options={['active', 'inactive']} />
        <CheckboxField form={form} name="is_system" label="System permission" />
        <div className="modal-form-span">
          <InputField form={form} name="description" label="Description" type="textarea" />
        </div>
      </div>
    </AppModal>
  );
}

function AddMemberModal({ open, team, onClose }: { open: boolean; team?: PlatformRecord | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [platformUserId, setPlatformUserId] = useState('');
  const [teamRoleId, setTeamRoleId] = useState('');
  const [allocation, setAllocation] = useState(100);
  const [isPrimary, setIsPrimary] = useState(true);
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const mutation = useMutation({
    mutationFn: () => platformAccessApi.teams.addMembers(idOf(team), {
      members: [{ platform_user_id: platformUserId, platform_team_role_id: teamRoleId, allocation_percent: allocation, is_primary: isPrimary, effective_from: effectiveFrom || undefined, status: 'active' }]
    }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: platformQueryKeys.resource(resourceMeta.teams.resourceKey) });
      onClose();
    }
  });
  const allocationWarning = allocation > 100;

  return (
    <AppModal open={open} onClose={onClose} title="Add team member" guard="platform" permission="platform_team.assign" loading={mutation.isPending} error={mutation.error ? errorMessage(mutation.error) : null} footer={<><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="button" onClick={() => mutation.mutate()}>Add member</Button></>}>
      <div className="form-grid">
        {allocationWarning ? <div className="surface-error">Allocation exceeds 100%. Review workload before saving.</div> : null}
        <label>Platform user ID<input value={platformUserId} onChange={(event) => setPlatformUserId(event.target.value)} /></label>
        <label>Team role ID<input value={teamRoleId} onChange={(event) => setTeamRoleId(event.target.value)} /></label>
        <label>Allocation percent<input type="number" value={allocation} onChange={(event) => setAllocation(Number(event.target.value))} /></label>
        <label>Effective from<input type="date" value={effectiveFrom} onChange={(event) => setEffectiveFrom(event.target.value)} /></label>
        <label className="check-row"><input checked={isPrimary} type="checkbox" onChange={(event) => setIsPrimary(event.target.checked)} /> Primary member</label>
      </div>
    </AppModal>
  );
}

function AssignRecordModal({ open, team, onClose }: { open: boolean; team?: PlatformRecord | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [assignableType, setAssignableType] = useState('tenant');
  const [assignableId, setAssignableId] = useState('');
  const [assignmentRole, setAssignmentRole] = useState('support_owner');
  const [remarks, setRemarks] = useState('');
  const mutation = useMutation({
    mutationFn: () => platformAccessApi.teams.assignRecord(idOf(team), {
      assignable_type: assignableType,
      assignable_id: assignableId,
      assignment_role: assignmentRole,
      assigned_at: new Date().toISOString(),
      status: 'active',
      remarks
    }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: platformQueryKeys.resource(resourceMeta.teams.resourceKey) });
      onClose();
    }
  });

  return (
    <AppModal open={open} onClose={onClose} title="Assign records" guard="platform" permission="platform_team.assign" loading={mutation.isPending} error={mutation.error ? errorMessage(mutation.error) : null} footer={<><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="button" onClick={() => mutation.mutate()}>Assign record</Button></>}>
      <div className="form-grid">
        <label>Record type<select value={assignableType} onChange={(event) => setAssignableType(event.target.value)}><option value="tenant">Tenant</option><option value="platform_ticket">Ticket</option><option value="system_incident">Incident</option><option value="monitoring_alert">Alert</option></select></label>
        <label>Record ID<input value={assignableId} onChange={(event) => setAssignableId(event.target.value)} /></label>
        <label>Assignment role<input value={assignmentRole} onChange={(event) => setAssignmentRole(event.target.value)} /></label>
        <label>Remarks<textarea value={remarks} onChange={(event) => setRemarks(event.target.value)} /></label>
      </div>
    </AppModal>
  );
}

function ReleaseAssignmentModal({ open, team, assignment, onClose }: { open: boolean; team?: PlatformRecord | null; assignment?: PlatformRecord | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [assignmentId, setAssignmentId] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [reason, setReason] = useState('Assignment released');
  const [notifyLead, setNotifyLead] = useState(true);
  const mutation = useMutation({
    mutationFn: () => platformAccessApi.teams.releaseAssignment(idOf(team), assignmentId, { released_at: releaseDate || new Date().toISOString(), reason, notify_team_lead: notifyLead }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: platformQueryKeys.resource(resourceMeta.teams.resourceKey) });
      if (team) {
        await queryClient.invalidateQueries({ queryKey: platformQueryKeys.related(resourceMeta.teams.resourceKey, idOf(team), 'assignments') });
      }
      onClose();
    }
  });

  useEffect(() => {
    if (open) setAssignmentId(idOf(assignment));
  }, [assignment, open]);

  return (
    <AppModal open={open} onClose={onClose} title="Release assignment" guard="platform" permission="platform_team.assign" loading={mutation.isPending} error={mutation.error ? errorMessage(mutation.error) : null} footer={<><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="button" variant="danger" onClick={() => mutation.mutate()}>Release</Button></>}>
      <div className="form-grid">
        <label>Assignment ID<input value={assignmentId} onChange={(event) => setAssignmentId(event.target.value)} /></label>
        <label>Release date<input type="datetime-local" value={releaseDate} onChange={(event) => setReleaseDate(event.target.value)} /></label>
        <label>Reason<textarea value={reason} onChange={(event) => setReason(event.target.value)} /></label>
        <label className="check-row"><input checked={notifyLead} type="checkbox" onChange={(event) => setNotifyLead(event.target.checked)} /> Notify team lead</label>
      </div>
    </AppModal>
  );
}

function TeamRoleEditorModal({ open, role, onClose }: { open: boolean; role?: PlatformRecord | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const form = useForm<TeamRoleForm>({
    resolver: zodResolver(teamRoleSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      permissions_json: '{}',
      sort_order: 0,
      is_system: false,
      status: 'active',
      audit_reason: 'Team role update'
    }
  });
  const mutation = useMutation({
    mutationFn: (values: TeamRoleForm) => {
      const payload: TeamRolePayload = {
        name: values.name,
        code: values.code,
        description: values.description,
        permissions: values.permissions_json ? JSON.parse(values.permissions_json) : {},
        sort_order: values.sort_order,
        is_system: values.is_system,
        status: values.status,
        audit_reason: values.audit_reason
      };

      return role ? platformAccessApi.teamRoles.update(idOf(role), payload) : platformAccessApi.teamRoles.create(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: platformQueryKeys.resource(resourceMeta.teamRoles.resourceKey) });
      onClose();
    }
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      name: textOf(role, ['name'], ''),
      code: textOf(role, ['code'], ''),
      description: textOf(role, ['description'], ''),
      permissions_json: JSON.stringify(role?.permissions ?? {}, null, 2),
      sort_order: Number(role?.sort_order ?? 0),
      is_system: Boolean(role?.is_system),
      status: textOf(role, ['status'], 'active'),
      audit_reason: role ? 'Team role update' : 'Team role created'
    });
  }, [form, open, role]);

  function save(values: TeamRoleForm) {
    try {
      JSON.parse(values.permissions_json || '{}');
      mutation.mutate(values);
    } catch {
      form.setError('permissions_json', { message: 'Enter valid JSON.' });
    }
  }

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={role ? 'Edit team role' : 'Create team role'}
      guard="platform"
      permission={role ? 'platform_team.edit' : 'platform_team.create'}
      size="lg"
      loading={mutation.isPending}
      error={mutation.error ? errorMessage(mutation.error) : null}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="button" onClick={form.handleSubmit(save)}>Save team role</Button>
        </>
      }
    >
      <div className="form-grid form-grid--two">
        <InputField form={form} name="name" label="Name" />
        <InputField form={form} name="code" label="Code" />
        <InputField form={form} name="sort_order" label="Sort order" type="number" />
        <SelectField form={form} name="status" label="Status" options={['active', 'inactive']} />
        <CheckboxField form={form} name="is_system" label="System role" />
        <InputField form={form} name="audit_reason" label="Audit reason" />
        <div className="modal-form-span">
          <InputField form={form} name="description" label="Description" type="textarea" />
        </div>
        <div className="modal-form-span">
          <InputField form={form} name="permissions_json" label="Permissions JSON" type="textarea" />
        </div>
      </div>
    </AppModal>
  );
}

function PermissionDetailDrawer({ open, record, onClose }: { open: boolean; record?: PlatformRecord | null; onClose: () => void }) {
  return (
    <AppDrawer open={open} onClose={onClose} title="Permission detail" guard="platform" permission="platform_permission.view">
      <RecordDetails record={record ?? {}} />
    </AppDrawer>
  );
}

function FormShell({
  backTo,
  children,
  error,
  footerExtra,
  isSaving,
  onSubmit,
  permission,
  side,
  title
}: {
  backTo: string;
  children: ReactNode;
  error: unknown;
  footerExtra?: ReactNode;
  isSaving: boolean;
  onSubmit: () => void;
  permission: string;
  side?: ReactNode;
  title: string;
}) {
  const navigate = useNavigate();
  const [confirmCancel, setConfirmCancel] = useState(false);

  return (
    <section className="enterprise-module-page platform-access-page">
      <PageHeader
        title={title}
        description="Permission-aware create/edit flow with audit reason support."
        actions={<Button type="button" variant="secondary" onClick={() => navigate(backTo)}>Back</Button>}
      />
      {error ? <div className="surface-error">{errorMessage(error)}</div> : null}
      <form className="rbac-form-shell" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
        <article className="enterprise-form">{children}</article>
        {side ? <aside className="rbac-side-panel">{side}</aside> : null}
        <footer className="enterprise-form__footer rbac-sticky-footer">
          <Button type="button" variant="secondary" onClick={() => setConfirmCancel(true)}>Cancel</Button>
          {footerExtra}
          <PermissionButton guard="platform" permission={permission} type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save'}
          </PermissionButton>
        </footer>
      </form>
      <ConfirmDialog
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        title="Discard changes?"
        description="Unsaved changes on this access-control page will be lost."
        confirmLabel="Discard"
        typedConfirmation="DISCARD"
        onConfirm={() => navigate(backTo)}
      />
    </section>
  );
}

function FormGrid({ children }: { children: ReactNode }) {
  return <div className="enterprise-form__grid">{children}</div>;
}

function InputField({ form, name, label, placeholder, type = 'text' }: { form: any; name: string; label: string; placeholder?: string; type?: string }) {
  const error = form.formState.errors[name]?.message;
  return (
    <label>
      <span>{label}</span>
      {type === 'textarea' ? <textarea placeholder={placeholder} {...form.register(name)} /> : <input type={type} placeholder={placeholder} {...form.register(name)} />}
      {error ? <strong role="alert">{String(error)}</strong> : null}
    </label>
  );
}

function SelectField({ form, name, label, options }: { form: any; name: string; label: string; options: string[] }) {
  return (
    <label>
      <span>{label}</span>
      <select {...form.register(name)}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function CheckboxField({ form, name, label }: { form: any; name: string; label: string }) {
  return (
    <label className="check-row">
      <input type="checkbox" {...form.register(name)} />
      <span>{label}</span>
    </label>
  );
}

function RecordDetails({ record }: { record: Record<string, unknown> }) {
  return (
    <dl className="enterprise-summary-list">
      {Object.entries(record).map(([key, value]) => (
        <div key={key}>
          <dt>{key}</dt>
          <dd>{typeof value === 'object' ? JSON.stringify(value) : String(value ?? '-')}</dd>
        </div>
      ))}
    </dl>
  );
}

function PermissionGroups({ groups }: { groups?: GroupedPermissions }) {
  if (!groups || Object.keys(groups).length === 0) return <div className="empty-state">No grouped permissions returned.</div>;
  return (
    <div className="permission-groups permission-groups--compact">
      {Object.entries(groups).map(([module, permissions]) => (
        <section key={module}>
          <header><strong>{module}</strong><span>{permissions.length}</span></header>
          <div>{permissions.map((permission) => <span className="permission-pill" key={idOf(permission)}>{textOf(permission, ['display_name', 'name'])}</span>)}</div>
        </section>
      ))}
    </div>
  );
}

function RecordList({ rows }: { rows: PlatformRecord[] }) {
  if (rows.length === 0) return <div className="empty-state">No related records returned.</div>;
  return <div className="record-list">{rows.map((row) => <article key={idOf(row)}><strong>{textOf(row, ['display_name', 'name', 'email', 'assignable_type'])}</strong><p>{textOf(row, ['email', 'status', 'assignment_role'])}</p></article>)}</div>;
}

function TeamMembersPanel({ team }: { team: PlatformRecord }) {
  const queryClient = useQueryClient();
  const [editingMember, setEditingMember] = useState<PlatformRecord | null>(null);
  const [removingMember, setRemovingMember] = useState<PlatformRecord | null>(null);
  const teamId = idOf(team);
  const membersQuery = useQuery({
    queryKey: platformQueryKeys.related(resourceMeta.teams.resourceKey, teamId, 'members'),
    queryFn: () => platformAccessApi.teams.members(teamId)
  });
  const removeMutation = useMutation({
    mutationFn: ({ memberId, reason }: { memberId: string; reason: string }) =>
      platformAccessApi.teams.removeMember(teamId, memberId, { audit_reason: reason }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: platformQueryKeys.related(resourceMeta.teams.resourceKey, teamId, 'members') })
  });
  const rows = membersQuery.data?.data.members ?? [];

  if (membersQuery.isLoading) return <div className="surface-state">Loading team members...</div>;
  if (membersQuery.isError) return <div className="surface-error">{errorMessage(membersQuery.error)}</div>;

  return (
    <>
      <div className="record-list">
        {rows.map((member) => (
          <article key={idOf(member)}>
            <header>
              <strong>{textOf(member, ['display_name', 'name', 'platform_user_name', 'email'])}</strong>
              <span className="table-actions">
                <PermissionButton guard="platform" permission="platform_team.assign" type="button" size="sm" variant="secondary" onClick={() => setEditingMember(member)}>Update</PermissionButton>
                <PermissionButton guard="platform" permission="platform_team.assign" type="button" size="sm" variant="danger" onClick={() => setRemovingMember(member)}>Remove</PermissionButton>
              </span>
            </header>
            <p>{textOf(member, ['role_name', 'platform_team_role_id', 'status'])} / {textOf(member, ['allocation_percent'], '100')}%</p>
          </article>
        ))}
        {rows.length === 0 ? <div className="empty-state">No team members returned.</div> : null}
      </div>
      <TeamMemberEditorModal team={team} member={editingMember} open={Boolean(editingMember)} onClose={() => setEditingMember(null)} />
      <ConfirmDialog
        open={Boolean(removingMember)}
        onClose={() => setRemovingMember(null)}
        title="Remove team member"
        description={`Remove ${textOf(removingMember, ['display_name', 'name', 'email'], 'this member')} from this platform team?`}
        confirmLabel="Remove"
        confirmTone="danger"
        reasonRequired
        guard="platform"
        permission="platform_team.assign"
        loading={removeMutation.isPending}
        onConfirm={(payload) => {
          if (!removingMember) return;
          removeMutation.mutate({ memberId: idOf(removingMember), reason: payload.reason ?? 'Member removed from team' });
          setRemovingMember(null);
        }}
      />
    </>
  );
}

function TeamAssignmentsPanel({ team }: { team: PlatformRecord }) {
  const [releasingAssignment, setReleasingAssignment] = useState<PlatformRecord | null>(null);
  const teamId = idOf(team);
  const assignmentsQuery = useQuery({
    queryKey: platformQueryKeys.related(resourceMeta.teams.resourceKey, teamId, 'assignments'),
    queryFn: () => platformAccessApi.teams.assignments(teamId)
  });
  const rows = assignmentsQuery.data?.data.assignments ?? [];

  if (assignmentsQuery.isLoading) return <div className="surface-state">Loading team assignments...</div>;
  if (assignmentsQuery.isError) return <div className="surface-error">{errorMessage(assignmentsQuery.error)}</div>;

  return (
    <>
      <div className="record-list">
        {rows.map((assignment) => (
          <article key={idOf(assignment)}>
            <header>
              <strong>{textOf(assignment, ['assignable_type', 'type'])}: {textOf(assignment, ['assignable_id', 'record_id'])}</strong>
              <PermissionButton guard="platform" permission="platform_team.assign" type="button" size="sm" variant="secondary" onClick={() => setReleasingAssignment(assignment)}>Release</PermissionButton>
            </header>
            <p>{textOf(assignment, ['assignment_role'])} / {textOf(assignment, ['status'])}</p>
          </article>
        ))}
        {rows.length === 0 ? <div className="empty-state">No team assignments returned.</div> : null}
      </div>
      <ReleaseAssignmentModal open={Boolean(releasingAssignment)} team={team} assignment={releasingAssignment} onClose={() => setReleasingAssignment(null)} />
    </>
  );
}

function TeamMemberEditorModal({ open, team, member, onClose }: { open: boolean; team: PlatformRecord; member: PlatformRecord | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [teamRoleId, setTeamRoleId] = useState('');
  const [allocation, setAllocation] = useState(100);
  const [isPrimary, setIsPrimary] = useState(false);
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [effectiveTo, setEffectiveTo] = useState('');
  const [status, setStatus] = useState('active');

  useEffect(() => {
    if (!open || !member) return;
    setTeamRoleId(textOf(member, ['platform_team_role_id'], ''));
    setAllocation(Number(member.allocation_percent ?? 100));
    setIsPrimary(Boolean(member.is_primary));
    setEffectiveFrom(textOf(member, ['effective_from'], ''));
    setEffectiveTo(textOf(member, ['effective_to'], ''));
    setStatus(textOf(member, ['status'], 'active'));
  }, [member, open]);

  const mutation = useMutation({
    mutationFn: () => {
      if (!member) return Promise.resolve({ data: null });
      return platformAccessApi.teams.updateMember(idOf(team), idOf(member), {
        platform_team_role_id: teamRoleId || undefined,
        allocation_percent: allocation,
        is_primary: isPrimary,
        effective_from: effectiveFrom || undefined,
        effective_to: effectiveTo || null,
        status
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformQueryKeys.related(resourceMeta.teams.resourceKey, idOf(team), 'members') });
      onClose();
    }
  });

  return (
    <AppModal open={open} onClose={onClose} title="Update team member" guard="platform" permission="platform_team.assign" loading={mutation.isPending} error={mutation.error ? errorMessage(mutation.error) : null} footer={<><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="button" onClick={() => mutation.mutate()}>Update member</Button></>}>
      <div className="form-grid">
        <label>Team role ID<input value={teamRoleId} onChange={(event) => setTeamRoleId(event.target.value)} /></label>
        <label>Allocation percent<input type="number" value={allocation} onChange={(event) => setAllocation(Number(event.target.value))} /></label>
        <label>Effective from<input type="date" value={effectiveFrom} onChange={(event) => setEffectiveFrom(event.target.value)} /></label>
        <label>Effective to<input type="date" value={effectiveTo} onChange={(event) => setEffectiveTo(event.target.value)} /></label>
        <label>Status<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="active">Active</option><option value="inactive">Inactive</option><option value="left">Left</option></select></label>
        <label className="check-row"><input checked={isPrimary} type="checkbox" onChange={(event) => setIsPrimary(event.target.checked)} /> Primary member</label>
      </div>
    </AppModal>
  );
}

function SummaryTile({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <article className="summary-card"><span>{icon}</span><p>{label}</p><strong>{value}</strong></article>;
}

function ResourceStats({ kind, rows }: { kind: ResourceKind; rows: PlatformRecord[] }) {
  const permissions = rows.reduce((sum, row) => sum + Number(row.permissions_count ?? 0), 0);
  const assigned = rows.reduce((sum, row) => sum + Number(row.users_count ?? row.members_count ?? 0), 0);

  return (
    <section className="platform-access-summary">
      <SummaryTile icon={<ShieldCheck />} label={`Total ${resourceMeta[kind].label}`} value={String(rows.length)} />
      <SummaryTile icon={<CheckCircle2 />} label="Active" value={String(rows.filter((row) => row.status === 'active').length)} />
      <SummaryTile icon={<KeyRound />} label="System" value={String(rows.filter((row) => row.is_system).length)} />
      <SummaryTile icon={<Users />} label={kind === 'roles' ? 'Assigned Users' : 'Assignments'} value={String(assigned)} />
      {kind === 'roles' ? <SummaryTile icon={<ShieldCheck />} label="Total Permissions" value={String(permissions)} /> : null}
    </section>
  );
}

function AuditRail({ rows, compact = false }: { rows: PlatformRecord[]; compact?: boolean }) {
  return (
    <aside className={compact ? 'audit-rail audit-rail--compact' : 'audit-rail'}>
      <header>
        <h2>Audit Log</h2>
        <button type="button" aria-label="Close audit log">x</button>
      </header>
      <div className="audit-tabs" role="tablist" aria-label="Audit views">
        <button type="button" role="tab" aria-selected="true">Activity</button>
        <button type="button" role="tab" aria-selected="false">Details</button>
      </div>
      {rows.slice(0, 6).map((row) => (
        <article key={idOf(row) || textOf(row, ['name'])}>
          <span className="audit-avatar" aria-hidden="true">{textOf(row, ['updated_by', 'created_by'], 'System').slice(0, 1).toUpperCase()}</span>
          <div>
            <strong>{textOf(row, ['updated_by', 'created_by'], 'System')}</strong>
            <small>{textOf(row, ['guard_name', 'module', 'visibility'], 'Platform')}</small>
            <p>{textOf(row, ['display_name', 'name'])} changed</p>
            <time>{formatDateTime(row.updated_at ?? row.created_at)}</time>
          </div>
        </article>
      ))}
      {rows.length === 0 ? <div className="empty-state">No audit activity loaded.</div> : null}
      <Button type="button" variant="secondary" size="sm">View Full Audit Logs</Button>
    </aside>
  );
}

function formatDateTime(value: unknown) {
  if (!value) return 'Recent activity';
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function RoleSummary({ record, selectedCount }: { record?: PlatformRecord; selectedCount: number }) {
  return (
    <>
      <h2>Role Summary</h2>
      <RecordDetails record={{ status: textOf(record, ['status'], 'active'), guard_name: textOf(record, ['guard_name'], 'platform'), selected_permissions: selectedCount, system_role: Boolean(record?.is_system) }} />
      <div className="surface-state">Select at least one permission for a production role.</div>
    </>
  );
}

function PermissionTip({ record }: { record?: PlatformRecord }) {
  return (
    <>
      <h2>Permission Tip</h2>
      <p>Custom permission actions are enabled only for non-system permissions.</p>
      <RecordDetails record={{ system: Boolean(record?.is_system), roles_count: textOf(record, ['roles_count'], '0') }} />
    </>
  );
}

function TeamSummary({ record }: { record?: PlatformRecord }) {
  return (
    <>
      <h2>Team Summary</h2>
      <RecordDetails record={{ members: textOf(record, ['members_count'], '0'), tenants: textOf(record, ['assigned_tenants_count'], '0'), visibility: textOf(record, ['visibility'], 'internal') }} />
    </>
  );
}

function permissionFor(kind: ResourceKind, action: 'view' | 'create' | 'edit' | 'delete') {
  const meta = resourceMeta[kind];
  if (kind === 'teamRoles') return `platform_team.${action === 'view' ? 'view' : action}`;
  return `${meta.permission}.${action}`;
}

function descriptionFor(kind: ResourceKind) {
  if (kind === 'roles') return 'Manage platform-wide roles, permissions, assigned users, audit-safe clone and delete workflows.';
  if (kind === 'permissions') return 'Review platform permissions and create or edit custom permissions where supported.';
  if (kind === 'teams') return 'Manage internal platform teams, members, record assignments, and releases.';
  return 'Create and maintain reusable roles for platform team members.';
}
