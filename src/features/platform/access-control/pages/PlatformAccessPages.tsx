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
import { platformStaffApi } from '@/features/platform/staff/api/platformStaffApi';
import { platformQueryKeys } from '@/features/platform/api/platformQueryKeys';
import { PLATFORM_ROUTES } from '@/features/platform/routes/platformRoutes';
import { ApiError } from '@/lib/api/apiError';
import { createListQuery } from '@/lib/api/listQuery';
import { DataTable, type DataTableColumn } from '@/shared/components/data-table';
import { AppDrawer } from '@/shared/components/drawer';
import { PageHeader, StatusBadge, Tabs } from '@/shared/components/layout';
import { AppModal } from '@/shared/components/modal';
import { Button, PermissionButton } from '@/shared/components/ui';
import {
  AdvancedFiltersDrawer,
  ColumnManagerModal,
  ConfirmDialog,
  ExportModal,
  SavedViewsModal,
  type SavedView
} from '@/shared/components/workflows';

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
  | 'deleteTeamRole'
  | 'export'
  | 'columns'
  | 'views'
  | 'auditHistory'
  | null;

type DrawerKind = 'assignPermissions' | 'permissionDetail' | 'filters' | null;
type ListSort = { id: string; direction: 'asc' | 'desc' } | null;
type AccessSavedView = SavedView & {
  filters: Record<string, string>;
  hiddenColumnIds: string[];
  sort: ListSort;
  search: string;
};

const guardNameOptions = ['platform', 'tenant'];

const roleSchema = z.object({
  name: z.string().min(2),
  display_name: z.string().min(2),
  guard_name: z.enum(['platform', 'tenant']),
  description: z.string().optional(),
  status: z.string(),
  is_system: z.boolean(),
  permission_ids: z.string().optional(),
  audit_reason: z.string().optional()
});

const permissionSchema = z.object({
  module: z.string().min(2),
  name: z.string().min(3),
  display_name: z.string().min(2),
  description: z.string().optional(),
  guard_name: z.enum(['platform', 'tenant']),
  is_system: z.boolean(),
  status: z.string()
});

const teamSchema = z.object({
  name: z.string().min(2),
  code: z.string().optional(),
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
  description: z.string().optional(),
  permissions: z.array(z.string()).optional(),
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

function idOf(record?: Record<string, unknown> | null) {
  return String(record?.uuid ?? record?.id ?? '');
}

function textOf(
  record: Record<string, unknown> | null | undefined,
  keys: string[],
  fallback = '-'
) {
  for (const key of keys) {
    const value = record?.[key];
    if (value !== undefined && value !== null && value !== '') return String(value);
  }
  return fallback;
}

function toTitleCase(value: unknown) {
  return String(value ?? '-')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

function toSnakeCase(value: string) {
  return value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

function displayText(record: PlatformRecord | null | undefined, keys: string[], fallback = '-') {
  return toTitleCase(textOf(record, keys, fallback));
}

function activityRows(record: PlatformRecord) {
  const rows = (record.activity as PlatformRecord[] | undefined) ?? [];
  return rows.length > 0 ? rows : [record];
}

function roleDisplayDetails(record: Record<string, unknown>, kind: ResourceKind) {
  if (kind === 'teamRoles') {
    const hidden = new Set(['uuid', 'id', 'deleted_at', 'created_at', 'updated_at']);
    return Object.fromEntries(Object.entries(record).filter(([key]) => !hidden.has(key)));
  }
  if (kind === 'teams') {
    const hidden = new Set([
      'uuid',
      'id',
      'deleted_at',
      'lead_platform_user_id',
      'assistant_lead_platform_user_id',
      'lead_uuid',
      'assistant_lead_uuid'
    ]);
    return Object.fromEntries(Object.entries(record).filter(([key]) => !hidden.has(key)));
  }
  if (kind !== 'roles') return record;
  const hidden = new Set([
    'uuid',
    'id',
    'guard_name',
    'is_system',
    'permissions_count',
    'users_count',
    'permissions',
    'users'
  ]);
  return Object.fromEntries(Object.entries(record).filter(([key]) => !hidden.has(key)));
}

function errorMessage(error: unknown) {
  if (error instanceof ApiError) {
    const fieldMessage = firstValidationMessage(error);
    return fieldMessage ? `${error.message}: ${fieldMessage}` : error.message;
  }
  if (error instanceof Error) return error.message;
  return 'Request failed.';
}

function formErrorMessage(error: unknown) {
  if (error instanceof ApiError && Object.keys(error.validationErrors).length > 0) return '';
  return error ? errorMessage(error) : '';
}

function firstValidationMessage(error: ApiError) {
  const [field, messages] = Object.entries(error.validationErrors)[0] ?? [];
  const message = Array.isArray(messages) ? messages[0] : messages;
  return field && message ? `${fieldLabel(field)} ${String(message)}` : '';
}

function fieldLabel(field: string) {
  return field
    .replace(/\.\d+/g, '')
    .replace(/[._]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function applyApiFieldErrors(form: any, error: unknown) {
  if (!(error instanceof ApiError)) return;

  Object.entries(error.validationErrors).forEach(([field, messages]) => {
    const message = Array.isArray(messages) ? messages.join(' ') : String(messages);
    if (message) {
      form.setError(field, { type: 'server', message });
    }
  });
}

function apiFieldError(error: unknown, fields: string[]) {
  if (!(error instanceof ApiError)) return '';

  for (const field of fields) {
    const messages = error.validationErrors[field];
    const message = Array.isArray(messages) ? messages[0] : messages;
    if (message) return String(message);
  }

  return '';
}

function totalFromQuery(data?: { total: number; data: PlatformRecord[] }) {
  return data?.total ?? data?.data.length ?? 0;
}

function groupedPermissionIds(grouped?: GroupedPermissions) {
  return Object.values(grouped ?? {})
    .flat()
    .map((permission) => idOf(permission))
    .filter(Boolean);
}

function groupedPermissionsForDisplay(value: unknown): GroupedPermissions {
  if (!value) return {};
  if (Array.isArray(value)) {
    return {
      assigned: value.map((permission) => {
        if (permission && typeof permission === 'object' && !Array.isArray(permission)) {
          return permission as PlatformRecord;
        }

        const code = String(permission ?? '');

        return {
          uuid: code,
          module: 'assigned',
          name: code,
          display_name: toTitleCase(code)
        };
      })
    };
  }
  if (typeof value !== 'object') return {};

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([module, permissions]) => {
      const rows = Array.isArray(permissions) ? permissions : [];

      return [
        module,
        rows.map((permission) => {
          if (permission && typeof permission === 'object' && !Array.isArray(permission)) {
            return permission as PlatformRecord;
          }

          const code = String(permission ?? '');

          return {
            uuid: `${module}.${code}`,
            module,
            name: `${module}.${code}`,
            display_name: toTitleCase(code)
          };
        })
      ];
    })
  );
}

function guardNameValue(value: unknown): 'platform' | 'tenant' {
  return value === 'tenant' ? 'tenant' : 'platform';
}
function selectedPermissionIds(record?: PlatformRecord | null) {
  if (!record?.permissions) return [];
  return groupedPermissionIds(groupedPermissionsForDisplay(record.permissions));
}

function selectedTeamRolePermissions(record?: PlatformRecord | null) {
  return permissionValues(record?.permissions);
}

function permissionValues(value: unknown): string[] {
  if (!value) return [];
  if (typeof value === 'string') return value ? [value] : [];
  if (Array.isArray(value)) {
    return value.flatMap((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object') {
        return textOf(item as Record<string, unknown>, ['name', 'code', 'uuid', 'id'], '');
      }
      return [];
    }).filter(Boolean);
  }
  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).flatMap(permissionValues);
  }
  return [];
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

export function PlatformTeamRoleViewPage() {
  return <PlatformResourcePage kind="teamRoles" mode="view" />;
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

function DetailLoader({
  id,
  kind,
  children
}: {
  id: string;
  kind: ResourceKind;
  children: (record: PlatformRecord) => ReactNode;
}) {
  const meta = resourceMeta[kind];
  const query = useQuery({
    queryKey: platformQueryKeys.detail(meta.resourceKey, id),
    queryFn: () => {
      if (kind === 'roles') return platformAccessApi.roles.detail(id);
      if (kind === 'permissions') return platformAccessApi.permissions.detail(id);
      if (kind === 'teams') return platformAccessApi.teams.detail(id);
      return platformAccessApi.teamRoles.detail(id);
    }
  });

  if (query.isLoading)
    return <div className="surface-state">Loading {meta.singular.toLowerCase()}...</div>;
  if (query.isError) return <div className="surface-error">{errorMessage(query.error)}</div>;
  if (!query.data) return <div className="empty-state">Record not found.</div>;
  return <>{children(query.data)}</>;
}

function ResourceList({ kind }: { kind: ResourceKind }) {
  const meta = resourceMeta[kind];
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<ListSort>(null);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<PlatformRecord | null>(null);
  const [modal, setModal] = useState<ModalKind>(null);
  const [drawer, setDrawer] = useState<DrawerKind>(null);
  const [hiddenColumnIds, setHiddenColumnIds] = useState<string[]>([]);
  const [activeViewId, setActiveViewId] = useState('all');
  const [customSavedViews, setCustomSavedViews] = useState<AccessSavedView[]>([]);
  const queryParams = createListQuery({
    page,
    per_page: 25,
    search,
    sort: sort?.id,
    direction: sort?.direction,
    filter: {
      status: filters.status || undefined,
      ...(kind === 'roles'
        ? {
            type: filters.type || undefined,
            guard_name: filters.guard_name || undefined
          }
        : kind === 'permissions'
          ? {
              module: filters.module || undefined,
              guard_name: filters.guard_name || undefined
            }
          : {})
    }
  });

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 450);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

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
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: platformQueryKeys.resource(meta.resourceKey) });
  const actionMutation = useMutation({
    mutationFn: async ({
      action,
      record,
      payload
    }: {
      action: string;
      record: PlatformRecord;
      payload?: Record<string, unknown>;
    }) => {
      const id = idOf(record);
      if (action === 'activate')
        return platformAccessApi.roles.activate(
          id,
          String(payload?.audit_reason ?? 'Role activated')
        );
      if (action === 'deactivate')
        return platformAccessApi.roles.deactivate(
          id,
          String(payload?.audit_reason ?? 'Role deactivated')
        );
      if (action === 'deleteRole')
        return platformAccessApi.roles.delete(id, {
          audit_reason: String(payload?.audit_reason ?? 'Role deleted')
        });
      if (action === 'deletePermission') return platformAccessApi.permissions.delete(id);
      if (action === 'archiveTeam')
        return platformAccessApi.teams.delete(id, {
          audit_reason: String(payload?.audit_reason ?? 'Team archived')
        });
      if (action === 'deleteTeamRole')
        return platformAccessApi.teamRoles.delete(id, {
          audit_reason: String(payload?.audit_reason ?? 'Team role deleted')
        });
      throw new Error(`Unsupported action ${action}`);
    },
    onSuccess: () => {
      invalidate();
      setModal(null);
      setDrawer(null);
      setSelectedRecord(null);
    }
  });

  const columns = useMemo(
    () =>
      columnsFor(kind, {
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
        onInlineAction: (action, record) =>
          actionMutation.mutate({ action, record, payload: auditPayload(`${action} from list`) })
      }),
    [actionMutation, kind, meta.route, navigate]
  );
  const savedViews = useMemo<AccessSavedView[]>(
    () => [
      {
        id: 'all',
        name: 'All records',
        visibility: 'shared',
        isDefault: true,
        filters: {},
        hiddenColumnIds: [],
        sort: null,
        search: ''
      },
      {
        id: 'active',
        name: 'Active records',
        visibility: 'shared',
        filters: { status: 'active' },
        hiddenColumnIds: [],
        sort: null,
        search: ''
      },
      {
        id: 'system',
        name: 'System records',
        visibility: 'shared',
        filters: kind === 'roles' ? { type: 'system' } : { status: 'active' },
        hiddenColumnIds: [],
        sort: null,
        search: ''
      },
      ...customSavedViews
    ],
    [customSavedViews, kind]
  );

  function applySavedView(id: string) {
    const view = savedViews.find((item) => item.id === id);
    if (!view) return;

    setFilters(view.filters);
    setHiddenColumnIds(view.hiddenColumnIds);
    setSort(view.sort);
    setSearch(view.search);
    setSearchInput(view.search);
    setSelectedIds([]);
    setActiveViewId(id);
    setPage(1);
    setModal(null);
  }

  function saveCurrentView(name?: string) {
    const view: AccessSavedView = {
      id: `custom-${Date.now()}`,
      name: name?.trim() || `Custom view ${customSavedViews.length + 1}`,
      visibility: 'personal',
      filters,
      hiddenColumnIds,
      sort,
      search
    };

    setCustomSavedViews((current) => [...current, view]);
    setActiveViewId(view.id);
    setModal(null);
  }

  function deleteSavedView(id: string) {
    setCustomSavedViews((current) => current.filter((view) => view.id !== id));
    if (activeViewId === id) setActiveViewId('all');
  }

  const header = (
    <PageHeader
      breadcrumbs={<AdminBreadcrumbs items={['Access Control', meta.label]} />}
      title={meta.label}
      description={descriptionFor(kind)}
      actions={
        <>
          {kind === 'teamRoles' ? null : (
            <PermissionButton
              guard="platform"
              permission={`${meta.permission}.create`}
              type="button"
              onClick={() => navigate(`${meta.route}/create`)}
            >
              <Plus size={16} aria-hidden="true" />
              {kind === 'roles' ? 'Create Role' : 'Create'}
            </PermissionButton>
          )}
          {kind === 'teamRoles' ? (
            <PermissionButton
              guard="platform"
              permission="platform_team.create"
              type="button"
              onClick={() => setModal('teamRoleEditor')}
            >
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
      searchValue={searchInput}
      searchPlaceholder={
        kind === 'roles' ? 'Search roles...' : `Search ${meta.label.toLowerCase()}...`
      }
      onSearchChange={setSearchInput}
      hiddenColumnIds={hiddenColumnIds}
      onHiddenColumnIdsChange={setHiddenColumnIds}
      onOpenFilters={() => setDrawer('filters')}
      onOpenColumns={() => setModal('columns')}
      onOpenSavedViews={() => setModal('views')}
      onOpenExport={kind === 'roles' || kind === 'permissions' ? () => setModal('export') : undefined}
      sortValue={sort}
      onSortChange={(nextSort) => {
        setSort(nextSort);
        setPage(1);
      }}
      selectedRowIds={selectedIds}
      onSelectionChange={setSelectedIds}
      page={page}
      total={totalFromQuery(listQuery.data)}
      onPageChange={setPage}
      bulkActions={
        <div className="table-actions">
          {kind === 'roles' ? (
            <>
              <PermissionButton
                guard="platform"
                permission="platform_role.edit"
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => rows.filter((row) => selectedIds.includes(idOf(row))).forEach((record) => actionMutation.mutate({ action: 'activate', record, payload: auditPayload('Bulk role activation') }))}
              >
                Activate
              </PermissionButton>
              <PermissionButton
                guard="platform"
                permission="platform_role.edit"
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => rows.filter((row) => selectedIds.includes(idOf(row))).forEach((record) => actionMutation.mutate({ action: 'deactivate', record, payload: auditPayload('Bulk role deactivation') }))}
              >
                Deactivate
              </PermissionButton>
            </>
          ) : null}
          {kind === 'roles' || kind === 'permissions' ? (
            <PermissionButton
              guard="platform"
              permission={`${meta.permission}.view`}
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setModal('export')}
            >
              Export Selected
            </PermissionButton>
          ) : null}
        </div>
      }
    />
  );

  if (kind === 'roles') {
    return (
      <section className="enterprise-module-page platform-access-page admin-master-page">
        {header}
        <ResourceStats kind={kind} rows={rows} />
        <div className="admin-master-grid">
          <div className="admin-master-main">{table}</div>
          <AuditRail rows={rows} />
        </div>

        <StandardListControls
          kind={kind}
          modal={modal}
          drawer={drawer}
          selectedRecord={selectedRecord}
          columns={columns}
          filters={filters}
          onFiltersChange={(nextFilters) => {
            setFilters(nextFilters);
            setPage(1);
          }}
          hiddenColumnIds={hiddenColumnIds}
          selectedIds={selectedIds}
        selectedCount={selectedIds.length}
          sort={sort}
          savedViews={savedViews}
          activeViewId={activeViewId}
          onHiddenColumnIdsChange={setHiddenColumnIds}
          onApplySavedView={applySavedView}
          onSaveCurrentView={saveCurrentView}
          onDeleteSavedView={deleteSavedView}
          actionLoading={actionMutation.isPending}
          actionError={actionMutation.error}
          onClose={() => {
            setModal(null);
            setDrawer(null);
          }}
          onAction={(action, payload) =>
            selectedRecord && actionMutation.mutate({ action, record: selectedRecord, payload })
          }
        />
      </section>
    );
  }

  return (
    <section className="enterprise-module-page platform-access-page">
      {header}
      <ResourceStats kind={kind} rows={rows} />
      {table}

      <StandardListControls
        kind={kind}
        modal={modal}
        drawer={drawer}
        selectedRecord={selectedRecord}
        columns={columns}
        filters={filters}
        onFiltersChange={(nextFilters) => {
          setFilters(nextFilters);
          setPage(1);
        }}
        hiddenColumnIds={hiddenColumnIds}
        selectedIds={selectedIds}
        selectedCount={selectedIds.length}
          sort={sort}
        savedViews={savedViews}
        activeViewId={activeViewId}
        onHiddenColumnIdsChange={setHiddenColumnIds}
        onApplySavedView={applySavedView}
        onSaveCurrentView={saveCurrentView}
        onDeleteSavedView={deleteSavedView}
        actionLoading={actionMutation.isPending}
        actionError={actionMutation.error}
        onClose={() => {
          setModal(null);
          setDrawer(null);
        }}
        onAction={(action, payload) =>
          selectedRecord && actionMutation.mutate({ action, record: selectedRecord, payload })
        }
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
    cell: (row: PlatformRecord) => (
      <CompactStatusBadge status={textOf(row, ['status'], 'inactive')} />
    )
  };
  const actionColumn = {
    id: 'actions',
    header: 'Actions',
    enableHiding: false,
    cell: (row: PlatformRecord) =>
      kind === 'roles' ? (
        <RoleActionsMenu row={row} handlers={handlers} />
      ) : (
        <ResourceActionsMenu kind={kind} row={row} handlers={handlers} />
      )
  } satisfies DataTableColumn<PlatformRecord>;

  if (kind === 'roles') {
    return [
      {
        id: 'display_name',
        header: 'Display Name',
        accessor: (row) => row.display_name,
        enableSorting: true,
        cell: (row) => <RoleNameCell row={row} />
      },
      {
        id: 'name',
        header: 'Role Name',
        accessor: (row) => row.name,
        enableSorting: true,
        cell: (row) => <span className="muted-cell">{displayText(row, ['name'])}</span>
      },
      {
        id: 'guard_name',
        header: 'Guard',
        accessor: (row) => row.guard_name,
        cell: (row) => displayText(row, ['guard_name'])
      },
      {
        id: 'permissions_count',
        header: 'Permissions',
        accessor: (row) => row.permissions_count,
        cell: (row) => textOf(row, ['permissions_count'], '0')
      },
      {
        id: 'users_count',
        header: 'Assigned Users',
        accessor: (row) => row.users_count,
        cell: (row) => textOf(row, ['users_count'], '0')
      },
      {
        id: 'is_system',
        header: 'System',
        accessor: (row) => row.is_system,
        cell: (row) => <SystemRoleBadge system={Boolean(row.is_system)} />
      },
      statusColumn,
      {
        id: 'created_at',
        header: 'Created At',
        accessor: (row) => row.created_at,
        enableSorting: true,
        cell: (row) => <DateCell value={row.created_at} />
      },
      {
        id: 'updated_at',
        header: 'Updated At',
        accessor: (row) => row.updated_at,
        enableSorting: true,
        cell: (row) => <DateCell value={row.updated_at} />
      },
      actionColumn
    ];
  }
  if (kind === 'permissions') {
    return [
      {
        id: 'module',
        header: 'Module',
        accessor: (row) => row.module,
        enableSorting: true,
        cell: (row) => textOf(row, ['module'])
      },
      {
        id: 'name',
        header: 'Permission Name',
        accessor: (row) => row.name,
        enableSorting: true,
        cell: (row) => textOf(row, ['name'])
      },
      {
        id: 'display_name',
        header: 'Display Name',
        accessor: (row) => row.display_name,
        cell: (row) => textOf(row, ['display_name'])
      },
      {
        id: 'guard_name',
        header: 'Guard',
        accessor: (row) => row.guard_name,
        cell: (row) => textOf(row, ['guard_name'])
      },
      {
        id: 'roles_count',
        header: 'Roles',
        accessor: (row) => row.roles_count,
        cell: (row) => textOf(row, ['roles_count'], '0')
      },
      {
        id: 'is_system',
        header: 'System',
        accessor: (row) => row.is_system,
        cell: (row) => (row.is_system ? 'Yes' : 'No')
      },
      statusColumn,
      actionColumn
    ];
  }
  if (kind === 'teams') {
    return [
      {
        id: 'name',
        header: 'Team',
        accessor: (row) => row.name,
        enableSorting: true,
        cell: (row) => displayText(row, ['name'])
      },
      {
        id: 'code',
        header: 'Code',
        accessor: (row) => row.code,
        cell: (row) => textOf(row, ['code'])
      },
      {
        id: 'lead',
        header: 'Lead',
        accessor: (row) => row.lead_name as string,
        cell: (row) => textOf(row, ['lead_name', 'lead_platform_user_id'])
      },
      {
        id: 'members_count',
        header: 'Members',
        accessor: (row) => row.members_count,
        cell: (row) => textOf(row, ['members_count'], '0')
      },
      {
        id: 'assignments_count',
        header: 'Assignments',
        accessor: (row) => Number(row.assignments_count ?? 0),
        cell: (row) => textOf(row, ['assignments_count'], '0')
      },
      {
        id: 'visibility',
        header: 'Visibility',
        accessor: (row) => row.visibility,
        cell: (row) => displayText(row, ['visibility'])
      },
      statusColumn,
      actionColumn
    ];
  }
  return [
    {
      id: 'name',
      header: 'Name',
      accessor: (row) => row.name,
      enableSorting: true,
      cell: (row) => textOf(row, ['name'])
    },
    {
      id: 'code',
      header: 'Code',
      accessor: (row) => row.code,
      cell: (row) => textOf(row, ['code'])
    },
    {
      id: 'sort_order',
      header: 'Sort',
      accessor: (row) => row.sort_order as number,
      cell: (row) => textOf(row, ['sort_order'], '0')
    },
    {
      id: 'is_system',
      header: 'System',
      accessor: (row) => row.is_system,
      cell: (row) => (row.is_system ? 'Yes' : 'No')
    },
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
      <span className="role-avatar" aria-hidden="true">
        {initials || 'R'}
      </span>
      <span>
        <strong>{toTitleCase(name)}</strong>
        {row.description ? <small>{toTitleCase(row.description)}</small> : null}
      </span>
    </span>
  );
}

function CompactStatusBadge({ status }: { status: string }) {
  const active = status.toLowerCase() === 'active';
  return (
    <span className={`status-pill ${active ? 'status-pill--active' : 'status-pill--muted'}`}>
      <i aria-hidden="true" />
      {toTitleCase(status)}
    </span>
  );
}

function SystemRoleBadge({ system }: { system: boolean }) {
  return (
    <span className={`system-badge ${system ? 'system-badge--yes' : 'system-badge--no'}`}>
      {system ? 'Yes' : 'No'}
    </span>
  );
}

function DateCell({ value }: { value: unknown }) {
  if (!value) return <span className="muted-cell">-</span>;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return <span className="muted-cell">{String(value)}</span>;
  return (
    <span className="date-cell">
      <strong>{formatDate(value)}</strong>
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
      <button
        ref={triggerRef}
        type="button"
        className="action-menu-trigger"
        aria-label={`Open actions for ${textOf(row, ['display_name', 'name'])}`}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <MoreVertical size={16} aria-hidden="true" />
      </button>
      <PortalActionMenu open={open} anchorRef={triggerRef} onClose={() => setOpen(false)}>
        <div className="action-menu" role="menu">
          <button
            type="button"
            role="menuitem"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => run(() => handlers.onView(row))}
          >
            <Eye size={15} aria-hidden="true" /> View
          </button>
          <PermissionButton
            guard="platform"
            permission="platform_role.edit"
            type="button"
            role="menuitem"
            variant="ghost"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => run(() => handlers.onEdit(row))}
          >
            <Pencil size={15} aria-hidden="true" /> Edit
          </PermissionButton>
          <PermissionButton
            guard="platform"
            permission="platform_role.create"
            type="button"
            role="menuitem"
            variant="ghost"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => run(() => handlers.onAction('cloneRole', row))}
          >
            <Copy size={15} aria-hidden="true" /> Clone
          </PermissionButton>
          <hr />
          <PermissionButton
            guard="platform"
            permission="platform_role.edit"
            type="button"
            role="menuitem"
            variant="ghost"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() =>
              run(() => handlers.onInlineAction(isActive ? 'deactivate' : 'activate', row))
            }
          >
            <RotateCcw size={15} aria-hidden="true" /> {isActive ? 'Deactivate' : 'Activate'}
          </PermissionButton>
          <hr />
          <PermissionButton
            guard="platform"
            permission="platform_role.view"
            type="button"
            role="menuitem"
            variant="ghost"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => run(() => handlers.onAction('assignUsers', row))}
          >
            <Users size={15} aria-hidden="true" /> View Assigned Users
          </PermissionButton>
          <PermissionButton
            guard="platform"
            permission="platform_role.view"
            type="button"
            role="menuitem"
            variant="ghost"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => run(() => handlers.onDrawer('assignPermissions', row))}
          >
            <ShieldCheck size={15} aria-hidden="true" /> View Permissions
          </PermissionButton>
          <button
            type="button"
            role="menuitem"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => run(() => handlers.onAction('auditHistory', row))}
          >
            <KeyRound size={15} aria-hidden="true" /> Audit History
          </button>
          <hr />
          <PermissionButton
            guard="platform"
            permission="platform_role.delete"
            type="button"
            role="menuitem"
            variant="ghost"
            className="is-danger"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => run(() => handlers.onAction('deleteRole', row))}
          >
            <Trash2 size={15} aria-hidden="true" /> Delete Role
          </PermissionButton>
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
      <button
        ref={triggerRef}
        type="button"
        className="action-menu-trigger"
        aria-label={`Open actions for ${title}`}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <MoreVertical size={16} aria-hidden="true" />
      </button>
      <PortalActionMenu open={open} anchorRef={triggerRef} onClose={() => setOpen(false)}>
        <div className="action-menu" role="menu">
          <button
            type="button"
            role="menuitem"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => run(() => handlers.onView(row))}
          >
            <Eye size={15} aria-hidden="true" /> View
          </button>
          {kind === 'teamRoles' ? null : (
            <PermissionButton
              guard="platform"
              permission={permissionFor(kind, 'edit')}
              type="button"
              role="menuitem"
              variant="ghost"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => run(() => handlers.onEdit(row))}
            >
              <Pencil size={15} aria-hidden="true" /> Edit
            </PermissionButton>
          )}

          {kind === 'permissions' ? (
            <>
              <hr />
              <button
                type="button"
                role="menuitem"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => run(() => handlers.onDrawer('permissionDetail', row))}
              >
                <ShieldCheck size={15} aria-hidden="true" /> Permission Detail
              </button>
              {!row.is_system ? (
                <>
                  <hr />
                  <PermissionButton
                    guard="platform"
                    permission="platform_permission.delete"
                    type="button"
                    role="menuitem"
                    variant="ghost"
                    className="is-danger"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => run(() => handlers.onAction('deletePermission', row))}
                  >
                    <Trash2 size={15} aria-hidden="true" /> Delete Permission
                  </PermissionButton>
                </>
              ) : null}
            </>
          ) : null}

          {kind === 'teams' ? (
            <>
              <hr />
              <PermissionButton
                guard="platform"
                permission="platform_team.assign"
                type="button"
                role="menuitem"
                variant="ghost"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => run(() => handlers.onAction('addMember', row))}
              >
                <Users size={15} aria-hidden="true" /> Add Member
              </PermissionButton>
              <PermissionButton
                guard="platform"
                permission="platform_team.assign"
                type="button"
                role="menuitem"
                variant="ghost"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => run(() => handlers.onAction('assignRecord', row))}
              >
                <ShieldCheck size={15} aria-hidden="true" /> Assign Records
              </PermissionButton>
              <hr />
              <PermissionButton
                guard="platform"
                permission="platform_team.delete"
                type="button"
                role="menuitem"
                variant="ghost"
                className="is-danger"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => run(() => handlers.onAction('archiveTeam', row))}
              >
                <Archive size={15} aria-hidden="true" /> Archive Team
              </PermissionButton>
            </>
          ) : null}

          {kind === 'teamRoles' ? (
            <>
              <hr />
              <PermissionButton
                guard="platform"
                permission="platform_team.edit"
                type="button"
                role="menuitem"
                variant="ghost"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => run(() => handlers.onAction('teamRoleEditor', row))}
              >
                <KeyRound size={15} aria-hidden="true" /> Team Role Editor
              </PermissionButton>
              <hr />
              <PermissionButton
                guard="platform"
                permission="platform_team.delete"
                type="button"
                role="menuitem"
                variant="ghost"
                className="is-danger"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => run(() => handlers.onAction('deleteTeamRole', row))}
              >
                <Trash2 size={15} aria-hidden="true" /> Delete Team Role
              </PermissionButton>
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
      <button
        type="button"
        className="action-menu-backdrop"
        aria-label="Close actions menu"
        onClick={onClose}
      />
      {children}
    </div>,
    document.body
  );
}

function ResourceForm({
  kind,
  record,
  title
}: {
  kind: ResourceKind;
  record?: PlatformRecord;
  title?: string;
}) {
  if (kind === 'roles') return <RoleFormPage record={record} title={title} />;
  if (kind === 'permissions') return <PermissionFormPage record={record} title={title} />;
  if (kind === 'teams') return <TeamFormPage record={record} title={title} />;
  return <TeamRoleFormPage record={record} title={title} />;
}

function RoleFormPage({ record, title }: { record?: PlatformRecord; title?: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedPermissionIdsState, setSelectedPermissionIdsState] = useState(
    selectedPermissionIds(record)
  );
  const form = useForm<RoleForm>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: textOf(record, ['name'], ''),
      display_name: textOf(record, ['display_name'], ''),
      guard_name: guardNameValue(record?.guard_name),
      description: textOf(record, ['description'], ''),
      status: textOf(record, ['status'], 'active'),
      is_system: Boolean(record?.is_system),
      permission_ids: selectedPermissionIds(record).join(','),
      audit_reason: record ? 'Quarterly access review' : 'Initial role setup'
    }
  });
  const watchedRole = form.watch();
  function setSelectedPermissionIds(ids: string[]) {
    setSelectedPermissionIdsState(ids);
    form.setValue('permission_ids', ids.join(','), { shouldDirty: true });
    form.clearErrors('permission_ids');
  }

  const mutation = useMutation({
    mutationFn: (values: RoleForm) => {
      const payload: RolePayload = {
        ...values,
        name: toSnakeCase(values.name),
        display_name: toTitleCase(values.display_name),
        guard_name: 'platform',
        permission_ids: selectedPermissionIdsState,
        audit_reason: values.audit_reason || (record ? 'Role updated from platform access control UI' : 'Role created from platform access control UI')
      };
      return record
        ? platformAccessApi.roles.update(idOf(record), payload)
        : platformAccessApi.roles.create(payload);
    },
    onError: (error) => applyApiFieldErrors(form, error),
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({
        queryKey: platformQueryKeys.resource(resourceMeta.roles.resourceKey)
      });
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
      side={<RoleSummary record={record} values={watchedRole} selectedCount={selectedPermissionIdsState.length} />}
      footerExtra={
        <Button type="button" variant="secondary" onClick={() => setDrawerOpen(true)}>
          Assign permissions
        </Button>
      }
    >
      <FormGrid>
        <InputField form={form} name="name" label={<RequiredLabel>Role name</RequiredLabel>} placeholder="Billing Manager" />
        <InputField
          form={form}
          name="display_name"
          label={<RequiredLabel>Display name</RequiredLabel>}
          placeholder="Billing Manager"
        />
        <SelectField form={form} name="guard_name" label="Guard name" options={['platform']} formatOption={titleCaseOption} />
        <InputField form={form} name="description" label="Description" type="textarea" />
        <SelectField form={form} name="status" label="Status" options={['active', 'inactive']} />
        <CheckboxField form={form} name="is_system" label="System role" />
        {record ? <InputField form={form} name="audit_reason" label="Audit reason" /> : null}
      </FormGrid>
      <RolePermissionSelector
        form={form}
        selectedCount={selectedPermissionIdsState.length}
        onOpen={() => setDrawerOpen(true)}
      />
      <AssignPermissionsDrawer
        open={drawerOpen}
        role={record}
        selectedIds={selectedPermissionIdsState}
        onSelectedIdsChange={setSelectedPermissionIds}
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
      guard_name: guardNameValue(record?.guard_name),
      is_system: Boolean(record?.is_system),
      status: textOf(record, ['status'], 'active')
    }
  });
  const mutation = useMutation({
    mutationFn: (values: PermissionForm) =>
      record
        ? platformAccessApi.permissions.update(idOf(record), values as PermissionPayload)
        : platformAccessApi.permissions.create(values as PermissionPayload),
    onError: (error) => applyApiFieldErrors(form, error),
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({
        queryKey: platformQueryKeys.resource(resourceMeta.permissions.resourceKey)
      });
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
        <InputField
          form={form}
          name="name"
          label="Permission name"
          placeholder="billing.invoice.view"
        />
        <InputField form={form} name="display_name" label="Display name" />
        <SelectField form={form} name="guard_name" label="Guard name" options={guardNameOptions} formatOption={titleCaseOption} />
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
  const watchedTeam = form.watch();
  const selectedLeadUserId = String(watchedTeam.lead_platform_user_id ?? '');
  const platformUsersQuery = useQuery({
    queryKey: platformQueryKeys.list('platform-users-for-team-form', { per_page: 100 }),
    queryFn: () => platformStaffApi.list({ per_page: 100, filter: { status: 'active' } })
  });
  const platformUsers = platformUsersQuery.data?.data ?? [];
  const assistantLeadUsers = useMemo(
    () => platformUsers.filter((user) => userSelectValue(user) !== selectedLeadUserId),
    [platformUsers, selectedLeadUserId]
  );

  useEffect(() => {
    if (
      selectedLeadUserId &&
      watchedTeam.assistant_lead_platform_user_id === selectedLeadUserId
    ) {
      form.setValue('assistant_lead_platform_user_id', '', { shouldDirty: true });
    }
  }, [form, selectedLeadUserId, watchedTeam.assistant_lead_platform_user_id]);

  const mutation = useMutation({
    mutationFn: (values: TeamForm) => {
      const payload: TeamPayload = {
        ...values,
        code: values.code || generateTeamCode(values.name),
        audit_reason: values.audit_reason || (record ? 'Team profile update' : 'Team created')
      };
      return record
        ? platformAccessApi.teams.update(idOf(record), payload)
        : platformAccessApi.teams.create(payload);
    },
    onError: (error) => applyApiFieldErrors(form, error),
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({
        queryKey: platformQueryKeys.resource(resourceMeta.teams.resourceKey)
      });
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
      side={<TeamSummary record={record} values={watchedTeam} users={platformUsers} />}
      >
        <FormGrid>
          <InputField form={form} name="name" label="Team name" />
          <UserSelectField form={form} name="lead_platform_user_id" label="Lead platform user" users={platformUsers} loading={platformUsersQuery.isLoading} />
          <UserSelectField form={form} name="assistant_lead_platform_user_id" label="Assistant lead user" users={assistantLeadUsers} loading={platformUsersQuery.isLoading} />
          <InputField form={form} name="email" label="Team email" />
        <InputField form={form} name="phone" label="Phone" />
        <InputField form={form} name="color" label="Color" type="color" />
        <InputField form={form} name="icon" label="Icon" />
        <SelectField
          form={form}
          name="visibility"
          label="Visibility"
          options={['internal', 'private']}
        />
        <SelectField
          form={form}
          name="status"
          label="Status"
          options={['active', 'inactive', 'archived']}
        />
        <InputField form={form} name="description" label="Description" type="textarea" />
        {record ? <InputField form={form} name="audit_reason" label="Audit reason" /> : null}
      </FormGrid>
    </FormShell>
  );
}

function TeamRoleFormPage({ record, title }: { record?: PlatformRecord; title?: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [permissionsOpen, setPermissionsOpen] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
    selectedTeamRolePermissions(record)
  );
  const form = useForm<TeamRoleForm>({
    resolver: zodResolver(teamRoleSchema),
    defaultValues: {
      name: textOf(record, ['name'], ''),
      description: textOf(record, ['description'], ''),
      permissions: selectedTeamRolePermissions(record),
      is_system: Boolean(record?.is_system),
      status: textOf(record, ['status'], 'active'),
      audit_reason: record ? 'Team role update' : 'Team role created'
    }
  });
  const mutation = useMutation({
    mutationFn: (values: TeamRoleForm) => {
      const payload: Partial<TeamRolePayload> = {
        name: values.name,
        description: values.description,
        permissions: selectedPermissions,
        is_system: values.is_system,
        status: values.status,
        audit_reason: values.audit_reason || (record ? 'Team role update' : 'Team role created')
      };
      return record
        ? platformAccessApi.teamRoles.update(idOf(record), payload)
        : platformAccessApi.teamRoles.create(payload as TeamRolePayload);
    },
    onError: (error) => applyApiFieldErrors(form, error),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: platformQueryKeys.resource(resourceMeta.teamRoles.resourceKey)
      });
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
      footerExtra={
        <Button type="button" variant="secondary" onClick={() => setPermissionsOpen(true)}>
          Assign permissions
        </Button>
      }
    >
      <FormGrid>
        <InputField form={form} name="name" label="Name" />
        <SelectField form={form} name="status" label="Status" options={['active', 'inactive']} />
        <CheckboxField form={form} name="is_system" label="System role" />
        <InputField form={form} name="description" label="Description" type="textarea" />
        {record ? <InputField form={form} name="audit_reason" label="Audit reason" /> : null}
      </FormGrid>
      <TeamRolePermissionSelector
        form={form}
        selectedCount={selectedPermissions.length}
        onOpen={() => setPermissionsOpen(true)}
      />
      <TeamRolePermissionsDrawer
        open={permissionsOpen}
        selectedValues={selectedPermissions}
        onSelectedValuesChange={(values) => {
          setSelectedPermissions(values);
          form.setValue('permissions', values, { shouldDirty: true });
          form.clearErrors('permissions');
        }}
        onClose={() => setPermissionsOpen(false)}
        permission={record ? 'platform_team.edit' : 'platform_team.create'}
      />
    </FormShell>
  );
}

function ResourceView({ kind, record }: { kind: ResourceKind; record: PlatformRecord }) {
  const meta = resourceMeta[kind];
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('details');
  const [modal, setModal] = useState<ModalKind>(null);
  const [drawer, setDrawer] = useState<DrawerKind>(null);
  const permissionGroups = groupedPermissionsForDisplay(record.permissions);
  const tabs = [
    { id: 'details', label: 'Details' },
    ...(kind !== 'teams' ? [{ id: 'permissions', label: 'Permissions' }] : []),
    ...(kind === 'roles' ? [{ id: 'users', label: 'Assigned Users' }] : []),
    ...(kind === 'teams'
      ? [
          { id: 'users', label: 'Members' },
          { id: 'assignments', label: 'Assignments' }
        ]
      : []),
    { id: 'activity', label: 'Activity' }
  ];

  return (
    <section className="enterprise-module-page platform-access-page">
      <PageHeader
        title={textOf(record, ['display_name', 'name'])}
        description={textOf(
          record,
          ['description'],
            kind === 'roles'
              ? 'Manage details, assigned users, permissions, and activity.'
              : kind === 'teams'
                ? 'Manage details, members, assignments, permissions, and activity.'
                : 'Manage details, permissions, and activity.'
        )}
        meta={
          <StatusBadge tone={record.status === 'active' ? 'success' : 'neutral'}>
            {displayText(record, ['status'])}
          </StatusBadge>
        }
        tabs={
          <Tabs
            tabs={tabs}
            activeId={activeTab}
            onChange={setActiveTab}
            ariaLabel={`${meta.label} tabs`}
          />
        }
        actions={
          <>
            <Button type="button" variant="secondary" onClick={() => navigate(meta.route)}>
              Back
            </Button>
            <PermissionButton
              guard="platform"
              permission={`${meta.permission}.edit`}
              type="button"
              onClick={() => navigate(`${meta.route}/${idOf(record)}/edit`)}
            >
              <Pencil size={16} aria-hidden="true" />
              Edit
            </PermissionButton>
            {kind === 'roles' ? (
              <>
                <PermissionButton
                  guard="platform"
                  permission="platform_role.edit"
                  type="button"
                  variant="secondary"
                  onClick={() => setDrawer('assignPermissions')}
                >
                  Assign Permissions
                </PermissionButton>
                <PermissionButton
                  guard="platform"
                  permission="platform_role.edit"
                  type="button"
                  variant="secondary"
                  onClick={() => setModal('assignUsers')}
                >
                  Assign Users
                </PermissionButton>
                <PermissionButton
                  guard="platform"
                  permission="platform_role.create"
                  type="button"
                  variant="secondary"
                  onClick={() => setModal('cloneRole')}
                >
                  Clone
                </PermissionButton>
              </>
            ) : null}
            {kind === 'teams' ? (
              <>
                <PermissionButton
                  guard="platform"
                  permission="platform_team.assign"
                  type="button"
                  variant="secondary"
                  onClick={() => setModal('addMember')}
                >
                  Add Member
                </PermissionButton>
                <PermissionButton
                  guard="platform"
                  permission="platform_team.assign"
                  type="button"
                  variant="secondary"
                  onClick={() => setModal('assignRecord')}
                >
                  Assign Records
                </PermissionButton>
                <PermissionButton
                  guard="platform"
                  permission="platform_team.assign"
                  type="button"
                  variant="secondary"
                  onClick={() => setModal('releaseAssignment')}
                >
                  Release Assignment
                </PermissionButton>
              </>
            ) : null}
          </>
        }
      />

      <div className="platform-access-summary">
        {kind !== 'teams' ? (
          <SummaryTile
            icon={<ShieldCheck />}
            label="Permissions"
            value={textOf(
              record,
              ['permissions_count'],
              selectedPermissionIds(record).length
                ? String(selectedPermissionIds(record).length)
                : '0'
            )}
          />
        ) : null}
        <SummaryTile
          icon={<Users />}
          label={kind === 'teams' ? 'Members' : 'Assigned Users'}
          value={textOf(record, ['users_count', 'members_count'], '0')}
        />
        {kind !== 'roles' ? (
          <>
            <SummaryTile
              icon={<KeyRound />}
              label="Guard"
              value={textOf(record, ['guard_name'], kind === 'teams' ? 'platform_team' : '-')}
            />
            <SummaryTile
              icon={<CheckCircle2 />}
              label="System"
              value={record.is_system ? 'Yes' : 'No'}
            />
          </>
        ) : null}
      </div>

      <article className="enterprise-view-panel">
        {activeTab === 'details' ? (
          <RecordDetails record={roleDisplayDetails(record, kind)} />
        ) : null}
        {activeTab === 'permissions' ? (
          <PermissionGroups groups={permissionGroups} />
        ) : null}
        {activeTab === 'users' && kind === 'teams' ? <TeamMembersPanel team={record} /> : null}
        {activeTab === 'users' && kind !== 'teams' ? (
          <RecordList
            rows={
              (record.users as PlatformRecord[] | undefined) ??
              (record.members as PlatformRecord[] | undefined) ??
              []
            }
            emptyText="No users are assigned to this role."
          />
        ) : null}
        {activeTab === 'assignments' && kind === 'teams' ? (
          <TeamAssignmentsPanel team={record} />
        ) : null}
        {activeTab === 'activity' ? <AuditRail rows={activityRows(record)} compact /> : null}
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
  columns = [],
  filters = {},
  onFiltersChange,
  hiddenColumnIds = [],
  selectedIds = [],
  selectedCount = 0,
  sort,
  savedViews = [],
  activeViewId,
  onHiddenColumnIdsChange,
  onApplySavedView,
  onSaveCurrentView,
  onDeleteSavedView,
  onClose,
  onAction,
  actionLoading = false,
  actionError = null
}: {
  kind: ResourceKind;
  modal: ModalKind;
  drawer: DrawerKind;
  selectedRecord: PlatformRecord | null;
  columns?: DataTableColumn<PlatformRecord>[];
  filters?: Record<string, string>;
  onFiltersChange?: (filters: Record<string, string>) => void;
  hiddenColumnIds?: string[];
  selectedIds?: string[];
  selectedCount?: number;
  sort?: ListSort;
  savedViews?: AccessSavedView[];
  activeViewId?: string;
  onHiddenColumnIdsChange?: (ids: string[]) => void;
  onApplySavedView?: (id: string) => void;
  onSaveCurrentView?: (name?: string) => void;
  onDeleteSavedView?: (id: string) => void;
  onClose: () => void;
  onAction?: (action: string, payload: Record<string, unknown>) => void;
  actionLoading?: boolean;
  actionError?: unknown;
}) {
  const queryClient = useQueryClient();
  const [draftFilters, setDraftFilters] = useState(filters);
  const exportMutation = useMutation({
    mutationFn: (options: Record<string, unknown>) => {
      if (kind === 'roles') return platformAccessApi.roles.export(options as any);
      if (kind === 'permissions') return platformAccessApi.permissions.export(options as any);
      return Promise.resolve({ data: null });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: platformQueryKeys.resource(resourceMeta[kind].resourceKey)
      });
      onClose();
    }
  });
  const filterFields = [
    {
      name: 'status',
      label: 'Status',
      input: (
        <select
          value={draftFilters.status ?? ''}
          onChange={(event) => setDraftFilters({ ...draftFilters, status: event.target.value })}
        >
          <option value="">Any status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      )
    },
    ...(kind === 'roles'
      ? [
          {
            name: 'type',
            label: 'Role type',
            input: (
              <select
                value={draftFilters.type ?? ''}
                onChange={(event) => setDraftFilters({ ...draftFilters, type: event.target.value })}
              >
                <option value="">Any type</option>
                <option value="custom">Custom</option>
                <option value="system">System</option>
              </select>
            )
          }
        ]
      : []),
    ...(kind === 'roles' || kind === 'permissions'
      ? [
          {
            name: 'guard_name',
            label: 'Guard name',
            input: (
              <select
                value={draftFilters.guard_name ?? ''}
                onChange={(event) =>
                  setDraftFilters({ ...draftFilters, guard_name: event.target.value })
                }
              >
                <option value="">Any guard</option>
                <option value="platform">Platform</option>
                <option value="tenant">Tenant</option>
              </select>
            )
          }
        ]
      : []),
    ...(kind === 'permissions'
      ? [
          {
            name: 'module',
            label: 'Module',
            input: (
              <input
                value={draftFilters.module ?? ''}
                onChange={(event) =>
                  setDraftFilters({ ...draftFilters, module: event.target.value })
                }
                placeholder="billing"
              />
            )
          }
        ]
      : [])
  ];

  useEffect(() => {
    if (drawer === 'filters') setDraftFilters(filters);
  }, [drawer, filters]);

  return (
    <>
      <AdvancedFiltersDrawer
        open={drawer === 'filters'}
        onClose={onClose}
        guard="platform"
        permission={`${resourceMeta[kind].permission}.view`}
        fields={filterFields}
        onApply={() => {
          onFiltersChange?.(draftFilters);
          onClose();
        }}
        onReset={() => setDraftFilters({})}
      />
      <ColumnManagerModal
        open={modal === 'columns'}
        onClose={onClose}
        guard="platform"
        permission={`${resourceMeta[kind].permission}.view`}
        columns={columns.map((column) => ({
          id: column.id,
          label: column.header,
          visible: !hiddenColumnIds.includes(column.id),
          locked: column.enableHiding === false
        }))}
        onApply={(visibleIds) =>
          onHiddenColumnIdsChange?.(
            columns
              .filter((column) => column.enableHiding !== false && !visibleIds.includes(column.id))
              .map((column) => column.id)
          )
        }
        onSave={onClose}
      />
      <SavedViewsModal
        open={modal === 'views'}
        onClose={onClose}
        guard="platform"
        permission={`${resourceMeta[kind].permission}.view`}
        views={savedViews}
        activeViewId={activeViewId}
        onSelect={(id) => onApplySavedView?.(id)}
        onSaveCurrent={onSaveCurrentView ?? onClose}
        onDelete={onDeleteSavedView}
      />
      <ExportModal
        open={modal === 'export'}
        onClose={onClose}
        guard="platform"
        permission={`${resourceMeta[kind].permission}.view`}
        columns={columns
          .filter((column) => !hiddenColumnIds.includes(column.id) && column.id !== 'actions')
          .map((column) => String(column.header))}
        selectedCount={selectedCount}
        loading={exportMutation.isPending}
        error={exportMutation.error ? errorMessage(exportMutation.error) : null}
        onExport={(options) =>
          exportMutation.mutate({
            format: 'csv',
            delivery: options.delivery,
            scope: options.scope,
            filters,
            sort: sort?.id,
            direction: sort?.direction,
            columns: columns
              .filter((column) => !hiddenColumnIds.includes(column.id) && column.id !== 'actions')
              .map((column) => column.id),
            selected_ids: selectedIds,
            selected_count: selectedCount,
            timezone: options.timezone,
            email_when_ready: options.emailWhenReady
          })
        }
      />
      <AssignPermissionsDrawer
        open={drawer === 'assignPermissions'}
        role={selectedRecord}
        onClose={onClose}
        onSaved={onClose}
      />
      <PermissionDetailDrawer
        open={drawer === 'permissionDetail'}
        record={selectedRecord}
        onClose={onClose}
      />
      <AssignUsersModal open={modal === 'assignUsers'} role={selectedRecord} onClose={onClose} />
      <AppModal
        open={modal === 'auditHistory'}
        onClose={onClose}
        title="Audit history"
        guard="platform"
        permission={`${resourceMeta[kind].permission}.view`}
      >
        <AuditRail rows={selectedRecord ? activityRows(selectedRecord) : []} compact />
      </AppModal>
      <CloneRoleModal open={modal === 'cloneRole'} role={selectedRecord} onClose={onClose} />
      <DeleteRoleDialog
        open={modal === 'deleteRole'}
        role={selectedRecord}
        onClose={onClose}
        onConfirm={(payload) => {
          onAction?.('deleteRole', auditPayload(String(payload.reason ?? 'Role deleted')));
          onClose();
        }}
      />
      <PermissionEditorModal
        open={modal === 'permissionEditor'}
        permission={selectedRecord}
        onClose={onClose}
      />
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
      <ReleaseAssignmentModal
        open={modal === 'releaseAssignment'}
        team={selectedRecord}
        onClose={onClose}
      />
      <TeamRoleEditorModal
        open={modal === 'teamRoleEditor'}
        role={selectedRecord}
        onClose={onClose}
      />
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
      <ConfirmDialog
        open={modal === 'deleteTeamRole'}
        onClose={onClose}
        title="Delete team role"
        description="Delete this team role if it is not assigned to any team members."
        confirmLabel="Delete"
        typedConfirmation="DELETE"
        reasonRequired
        guard="platform"
        permission="platform_team.delete"
        loading={actionLoading}
        error={actionError ? errorMessage(actionError) : null}
        onConfirm={(payload) => {
          onAction?.('deleteTeamRole', auditPayload(payload.reason ?? 'Team role deleted'));
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
  const rolePermissionsQuery = useQuery({
    queryKey: platformQueryKeys.related(resourceMeta.roles.resourceKey, idOf(role), 'permissions'),
    queryFn: () => platformAccessApi.roles.permissions(idOf(role)),
    enabled: open && Boolean(role)
  });
  const mutation = useMutation({
    mutationFn: () => {
      if (!role) return Promise.resolve({ data: null });
      return platformAccessApi.roles.replacePermissions(idOf(role), {
        permission_ids: localIds,
        audit_reason: auditReason
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: platformQueryKeys.resource(resourceMeta.roles.resourceKey)
      });
      onSelectedIdsChange?.(localIds);
      onSaved();
    }
  });
  const groups = groupedQuery.data?.data.permissions ?? {};
  const modules = Object.keys(groups);
  const rolePermissionGroups = rolePermissionsQuery.data?.data.permissions;
  const original = rolePermissionGroups
    ? groupedPermissionIds(rolePermissionGroups)
    : selectedPermissionIds(role);
  const added = localIds.filter((id) => !original.includes(id)).length;
  const removed = original.filter((id) => !localIds.includes(id)).length;

  useEffect(() => {
    if (open) setLocalIds(selectedIds ?? original);
  }, [open, role, selectedIds, rolePermissionsQuery.data]);

  function toggle(id: string) {
    setLocalIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  function selectModule(ids: string[]) {
    setLocalIds((current) => Array.from(new Set([...current, ...ids])));
  }

  function clearModule(ids: string[]) {
    setLocalIds((current) => current.filter((id) => !ids.includes(id)));
  }

  return (
    <AppDrawer
      open={open}
      onClose={onClose}
      title="Assign permissions"
      guard="platform"
      permission="platform_role.edit"
      size="xl"
      loading={groupedQuery.isLoading || rolePermissionsQuery.isLoading || mutation.isPending}
      error={
        groupedQuery.isError
          ? errorMessage(groupedQuery.error)
          : rolePermissionsQuery.isError
            ? errorMessage(rolePermissionsQuery.error)
            : mutation.error
              ? errorMessage(mutation.error)
              : null
      }
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={() => mutation.mutate()}>
            Save permissions
          </Button>
        </>
      }
    >
      <div className="rbac-toolbar">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search permissions"
        />
        <select value={moduleFilter} onChange={(event) => setModuleFilter(event.target.value)}>
          <option value="">All modules</option>
          {modules.map((module) => (
            <option key={module} value={module}>
              {module}
            </option>
          ))}
        </select>
      </div>
      <div className="permission-diff permission-diff--sticky">
        <span>{localIds.length} selected</span>
        <span>{added} added</span>
        <span>{removed} removed</span>
      </div>
      <div className="permission-groups permission-groups--assign">
        {Object.entries(groups)
          .filter(([module]) => !moduleFilter || module === moduleFilter)
          .map(([module, permissions]) => {
            const filtered = permissions.filter((permission) =>
              [permission.name, permission.display_name]
                .join(' ')
                .toLowerCase()
                .includes(search.toLowerCase())
            );
            if (filtered.length === 0) return null;
            const filteredIds = filtered.map(idOf);
            const selectedInModule = filteredIds.filter((id) => localIds.includes(id)).length;
            return (
              <section key={module}>
                <header>
                  <div>
                    <strong>{titleCaseOption(module)}</strong>
                    <span>{selectedInModule} of {filtered.length} selected</span>
                  </div>
                  <div className="permission-module-actions">
                    <button type="button" onClick={() => selectModule(filteredIds)}>Select all</button>
                    <button type="button" onClick={() => clearModule(filteredIds)}>Clear</button>
                  </div>
                </header>
                <div>
                  {filtered.map((permission) => {
                    const permissionId = idOf(permission);
                    const checked = localIds.includes(permissionId);
                    return (
                      <label key={permissionId} className={checked ? 'is-selected' : undefined}>
                        <input
                          checked={checked}
                          type="checkbox"
                          onChange={() => toggle(permissionId)}
                        />
                        <span>{textOf(permission, ['display_name', 'name'])}</span>
                        <small>{textOf(permission, ['name'])}</small>
                      </label>
                    );
                  })}
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

function TeamRolePermissionsDrawer({
  open,
  selectedValues,
  onSelectedValuesChange,
  onClose,
  permission = 'platform_team.edit'
}: {
  open: boolean;
  selectedValues: string[];
  onSelectedValuesChange: (values: string[]) => void;
  onClose: () => void;
  permission?: string;
}) {
  const [localValues, setLocalValues] = useState<string[]>(selectedValues);
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const groupedQuery = useQuery({
    queryKey: platformQueryKeys.resource('platform-permissions-grouped'),
    queryFn: platformAccessApi.permissions.grouped,
    enabled: open
  });
  const groups = groupedQuery.data?.data.permissions ?? {};
  const modules = Object.keys(groups);

  useEffect(() => {
    if (open) setLocalValues(selectedValues);
  }, [open, selectedValues]);

  function toggle(value: string) {
    setLocalValues((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    );
  }

  function selectModule(values: string[]) {
    setLocalValues((current) => Array.from(new Set([...current, ...values])));
  }

  function clearModule(values: string[]) {
    setLocalValues((current) => current.filter((value) => !values.includes(value)));
  }

  return (
    <AppDrawer
      open={open}
      onClose={onClose}
      title="Assign team role permissions"
      guard="platform"
      permission={permission}
      size="xl"
      loading={groupedQuery.isLoading}
      error={groupedQuery.isError ? errorMessage(groupedQuery.error) : null}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              onSelectedValuesChange(localValues);
              onClose();
            }}
          >
            Apply permissions
          </Button>
        </>
      }
    >
      <div className="rbac-toolbar">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search permissions"
        />
        <select value={moduleFilter} onChange={(event) => setModuleFilter(event.target.value)}>
          <option value="">All modules</option>
          {modules.map((module) => (
            <option key={module} value={module}>
              {titleCaseOption(module)}
            </option>
          ))}
        </select>
      </div>
      <div className="permission-diff permission-diff--sticky">
        <span>{localValues.length} selected</span>
      </div>
      <div className="permission-groups permission-groups--assign">
        {Object.entries(groups)
          .filter(([module]) => !moduleFilter || module === moduleFilter)
          .map(([module, permissions]) => {
            const filtered = permissions.filter((item) =>
              [item.name, item.display_name]
                .join(' ')
                .toLowerCase()
                .includes(search.toLowerCase())
            );
            if (filtered.length === 0) return null;
            const values = filtered.map(permissionChoiceValue).filter(Boolean);
            const selectedInModule = values.filter((value) => localValues.includes(value)).length;

            return (
              <section key={module}>
                <header>
                  <div>
                    <strong>{titleCaseOption(module)}</strong>
                    <span>{selectedInModule} of {filtered.length} selected</span>
                  </div>
                  <div className="permission-module-actions">
                    <button type="button" onClick={() => selectModule(values)}>Select all</button>
                    <button type="button" onClick={() => clearModule(values)}>Clear</button>
                  </div>
                </header>
                <div>
                  {filtered.map((item) => {
                    const value = permissionChoiceValue(item);
                    const checked = localValues.includes(value);
                    return (
                      <label key={idOf(item) || value} className={checked ? 'is-selected' : undefined}>
                        <input
                          checked={checked}
                          type="checkbox"
                          onChange={() => toggle(value)}
                        />
                        <span>{textOf(item, ['display_name', 'name'])}</span>
                        <small>{textOf(item, ['name'])}</small>
                      </label>
                    );
                  })}
                </div>
              </section>
            );
          })}
      </div>
    </AppDrawer>
  );
}

function permissionChoiceValue(permission: PlatformRecord) {
  return textOf(permission, ['name', 'code', 'uuid', 'id'], '');
}

function AssignUsersModal({
  open,
  role,
  onClose
}: {
  open: boolean;
  role?: PlatformRecord | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [effectiveDate, setEffectiveDate] = useState('');
  const [notifyUsers, setNotifyUsers] = useState(true);
  const [auditReason, setAuditReason] = useState('Role assignment update');
  const [removeAuditReason, setRemoveAuditReason] = useState('User moved teams');
  const usersQuery = useQuery({
    queryKey: platformQueryKeys.related(resourceMeta.roles.resourceKey, idOf(role), 'users'),
    queryFn: () => platformAccessApi.roles.users(idOf(role)),
    enabled: open && Boolean(role)
  });
  const platformUsersQuery = useQuery({
    queryKey: platformQueryKeys.list('platform-users-for-role-assignment', { per_page: 100 }),
    queryFn: () => platformStaffApi.list({ per_page: 100, filter: { status: 'active' } }),
    enabled: open
  });
  const mutation = useMutation({
    mutationFn: () =>
      platformAccessApi.roles.assignUsers(idOf(role), {
        platform_user_ids: selectedUserIds,
        effective_date: effectiveDate || undefined,
        notify_users: notifyUsers,
        audit_reason: auditReason
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: platformQueryKeys.resource(resourceMeta.roles.resourceKey)
      });
      await queryClient.invalidateQueries({
        queryKey: platformQueryKeys.related(resourceMeta.roles.resourceKey, idOf(role), 'users')
      });
      setSelectedUserIds([]);
    }
  });
  const removeMutation = useMutation({
    mutationFn: (userId: string) =>
      platformAccessApi.roles.removeUser(idOf(role), userId, removeAuditReason),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: platformQueryKeys.resource(resourceMeta.roles.resourceKey)
      });
      await queryClient.invalidateQueries({
        queryKey: platformQueryKeys.related(resourceMeta.roles.resourceKey, idOf(role), 'users')
      });
    }
  });
  const users = usersQuery.data?.data.users ?? role?.users ?? [];
  const availableUsers = platformUsersQuery.data?.data ?? [];

  function toggleAssignedUser(userId: string) {
    setSelectedUserIds((current) =>
      current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId]
    );
  }

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Assign users"
      guard="platform"
      permission="platform_role.edit"
      loading={
        usersQuery.isLoading ||
        platformUsersQuery.isLoading ||
        mutation.isPending ||
        removeMutation.isPending
      }
      error={
        usersQuery.error
          ? errorMessage(usersQuery.error)
          : platformUsersQuery.error
            ? errorMessage(platformUsersQuery.error)
            : mutation.error
              ? errorMessage(mutation.error)
              : removeMutation.error
                ? errorMessage(removeMutation.error)
                : null
      }
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={() => mutation.mutate()}>
            Assign users
          </Button>
        </>
      }
    >
      <section className="role-users-section">
        <div className="section-heading">
          <strong>Assigned users</strong>
          <span>{users.length} current</span>
        </div>
        <div className="role-user-list">
          {users.length === 0 ? (
            <p>No users are assigned to this role.</p>
          ) : (
            users.map((user) => (
              <div className="role-user-row" key={idOf(user)}>
                <div>
                  <strong>{textOf(user, ['display_name', 'name', 'email'])}</strong>
                  <small>{textOf(user, ['email', 'department', 'status'], '')}</small>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => removeMutation.mutate(idOf(user))}
                  disabled={removeMutation.isPending}
                >
                  Remove
                </Button>
              </div>
            ))
          )}
        </div>
      </section>
      <div className="form-grid">
        <label className="modal-form-span">
          Platform user names
          <select
            multiple
            value={selectedUserIds}
            onChange={(event) =>
              setSelectedUserIds(
                Array.from(event.currentTarget.selectedOptions).map((option) => option.value)
              )
            }
          >
            {availableUsers.map((user) => (
              <option key={idOf(user)} value={idOf(user)}>
                {textOf(user, ['display_name', 'name', 'email'])}
              </option>
            ))}
          </select>
        </label>
        <div className="chip-list modal-form-span" aria-label="Selected platform users">
          {selectedUserIds.length === 0 ? (
            <span>No users selected</span>
          ) : (
            selectedUserIds.map((userId) => {
              const user = availableUsers.find((item) => idOf(item) === userId);
              return (
                <button key={userId} type="button" onClick={() => toggleAssignedUser(userId)}>
                  {textOf(user, ['display_name', 'name', 'email'], userId)}
                </button>
              );
            })
          )}
        </div>
        <label>
          Effective date
          <input
            type="date"
            value={effectiveDate}
            onChange={(event) => setEffectiveDate(event.target.value)}
          />
        </label>
        <label className="check-row">
          <input
            checked={notifyUsers}
            type="checkbox"
            onChange={(event) => setNotifyUsers(event.target.checked)}
          />{' '}
          Notify users
        </label>
        <label>
          Audit reason
          <textarea value={auditReason} onChange={(event) => setAuditReason(event.target.value)} />
        </label>
        <label>
          Remove audit reason
          <textarea
            value={removeAuditReason}
            onChange={(event) => setRemoveAuditReason(event.target.value)}
          />
        </label>
      </div>
    </AppModal>
  );
}

function CloneRoleModal({
  open,
  role,
  onClose
}: {
  open: boolean;
  role?: PlatformRecord | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(`${textOf(role, ['name'], 'role')}_copy`);
  const [displayName, setDisplayName] = useState(
    `${textOf(role, ['display_name', 'name'], 'Role')} Copy`
  );
  const [copyPermissions, setCopyPermissions] = useState(true);
  const [status, setStatus] = useState('inactive');
  const [auditReason, setAuditReason] = useState('Create restricted clone');

  useEffect(() => {
    if (!open) return;
    setName(`${textOf(role, ['name'], 'role')}_copy`);
    setDisplayName(`${textOf(role, ['display_name', 'name'], 'Role')} Copy`);
    setCopyPermissions(true);
    setStatus('inactive');
    setAuditReason('Create restricted clone');
  }, [open, role]);

  const mutation = useMutation({
    mutationFn: () =>
      platformAccessApi.roles.clone(idOf(role), {
        name: toSnakeCase(name),
        display_name: toTitleCase(displayName),
        copy_permissions: copyPermissions,
        copy_description: true,
        status,
        audit_reason: auditReason
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: platformQueryKeys.resource(resourceMeta.roles.resourceKey)
      });
      onClose();
    }
  });

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Clone role"
      guard="platform"
      permission="platform_role.create"
      loading={mutation.isPending}
      error={mutation.error ? errorMessage(mutation.error) : null}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={() => mutation.mutate()}>
            Clone role
          </Button>
        </>
      }
    >
      <div className="form-grid">
        <label>
          New name
          <input value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label>
          Display name
          <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
        </label>
        <label>
          Status
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="inactive">Inactive</option>
            <option value="active">Active</option>
          </select>
        </label>
        <label className="check-row">
          <input
            checked={copyPermissions}
            type="checkbox"
            onChange={(event) => setCopyPermissions(event.target.checked)}
          />{' '}
          Copy permissions
        </label>

        <label>
          Audit reason
          <textarea value={auditReason} onChange={(event) => setAuditReason(event.target.value)} />
        </label>
      </div>
    </AppModal>
  );
}

function DeleteRoleDialog({
  open,
  role,
  onClose,
  onConfirm
}: {
  open: boolean;
  role?: PlatformRecord | null;
  onClose: () => void;
  onConfirm: (payload: Record<string, unknown>) => void;
}) {
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

function PermissionEditorModal({
  open,
  permission,
  onClose
}: {
  open: boolean;
  permission?: PlatformRecord | null;
  onClose: () => void;
}) {
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
    onError: (error) => applyApiFieldErrors(form, error),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: platformQueryKeys.resource(resourceMeta.permissions.resourceKey)
      });
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
      guard_name: guardNameValue(permission?.guard_name),
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
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={form.handleSubmit((values) => mutation.mutate(values))}>
            Save permission
          </Button>
        </>
      }
    >
      <div className="form-grid form-grid--two">
        <InputField form={form} name="module" label="Module" placeholder="billing" />
        <InputField
          form={form}
          name="name"
          label="Permission name"
          placeholder="billing.invoice.view"
        />
        <InputField form={form} name="display_name" label="Display name" />
        <SelectField form={form} name="guard_name" label="Guard name" options={guardNameOptions} formatOption={titleCaseOption} />
        <SelectField form={form} name="status" label="Status" options={['active', 'inactive']} />
        <CheckboxField form={form} name="is_system" label="System permission" />
        <div className="modal-form-span">
          <InputField form={form} name="description" label="Description" type="textarea" />
        </div>
      </div>
    </AppModal>
  );
}

function AddMemberModal({
  open,
  team,
  onClose
}: {
  open: boolean;
  team?: PlatformRecord | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [platformUserId, setPlatformUserId] = useState('');
  const [teamRoleId, setTeamRoleId] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const platformUsersQuery = useQuery({
    queryKey: platformQueryKeys.list('platform-users-for-team-member-modal', { per_page: 100 }),
    queryFn: () => platformStaffApi.list({ per_page: 100, filter: { status: 'active' } }),
    enabled: open
  });
  const teamRolesQuery = useQuery({
    queryKey: platformQueryKeys.list(resourceMeta.teamRoles.resourceKey, { per_page: 100 }),
    queryFn: () => platformAccessApi.teamRoles.list({ per_page: 100, filter: { status: 'active' } }),
    enabled: open
  });
  const platformUsers = platformUsersQuery.data?.data ?? [];
  const teamRoles = teamRolesQuery.data?.data ?? [];
  const mutation = useMutation({
    mutationFn: () =>
      platformAccessApi.teams.addMembers(idOf(team), {
        members: [
          {
            platform_user_id: platformUserId,
            team_role_uuid: teamRoleId || undefined,
            effective_from: effectiveFrom || undefined,
            status: 'active'
          }
        ]
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: platformQueryKeys.resource(resourceMeta.teams.resourceKey)
      });
      onClose();
    }
  });
  const userError = apiFieldError(mutation.error, ['platform_user_id', 'platform_user_uuid', 'members.0.platform_user_id', 'members.0.platform_user_uuid']);
  const teamRoleError = apiFieldError(mutation.error, ['platform_team_role_id', 'team_role_uuid', 'members.0.platform_team_role_id', 'members.0.team_role_uuid']);

  useEffect(() => {
    if (!open) return;
    setPlatformUserId('');
    setTeamRoleId('');
    setEffectiveFrom('');
  }, [open]);

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Add team member"
      guard="platform"
      permission="platform_team.assign"
      loading={mutation.isPending}
      error={formErrorMessage(mutation.error)}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={() => mutation.mutate()}>
            Add member
          </Button>
        </>
      }
    >
      <div className="form-grid">
        <label className={userError ? 'form-field-invalid' : undefined}>
          <span>Platform user</span>
          <select
            value={platformUserId}
            onChange={(event) => setPlatformUserId(event.target.value)}
            disabled={platformUsersQuery.isLoading}
            aria-invalid={Boolean(userError)}
          >
            <option value="">{platformUsersQuery.isLoading ? 'Loading users...' : 'Select user'}</option>
            {platformUsers.map((user) => (
              <option key={idOf(user)} value={userSelectValue(user)}>
                {userLabel(user)}
              </option>
            ))}
          </select>
          {userError ? <strong role="alert">{userError}</strong> : null}
        </label>
        <label className={teamRoleError ? 'form-field-invalid' : undefined}>
          <span>Team role</span>
          <select
            value={teamRoleId}
            onChange={(event) => setTeamRoleId(event.target.value)}
            disabled={teamRolesQuery.isLoading}
            aria-invalid={Boolean(teamRoleError)}
          >
            <option value="">{teamRolesQuery.isLoading ? 'Loading roles...' : 'Select team role'}</option>
            {teamRoles.map((role) => (
              <option key={idOf(role)} value={idOf(role)}>
                {displayText(role, ['name', 'code'])}
              </option>
            ))}
          </select>
          {teamRoleError ? <strong role="alert">{teamRoleError}</strong> : null}
        </label>
        <label>
          Effective from
          <input
            type="date"
            value={effectiveFrom}
            onChange={(event) => setEffectiveFrom(event.target.value)}
          />
        </label>
      </div>
    </AppModal>
  );
}

function AssignRecordModal({
  open,
  team,
  onClose
}: {
  open: boolean;
  team?: PlatformRecord | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [assignableType, setAssignableType] = useState('tenant');
  const [assignableId, setAssignableId] = useState('');
  const [assignmentRole, setAssignmentRole] = useState('support_owner');
  const mutation = useMutation({
    mutationFn: () =>
      platformAccessApi.teams.assignRecord(idOf(team), {
        assignable_type: assignableType,
        assignable_id: assignableId,
        assignment_role: assignmentRole
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: platformQueryKeys.resource(resourceMeta.teams.resourceKey)
      });
      onClose();
    }
  });
  const assignableTypeError = apiFieldError(mutation.error, ['assignable_type']);
  const assignableIdError = apiFieldError(mutation.error, ['assignable_id']);
  const assignmentRoleError = apiFieldError(mutation.error, ['assignment_role']);

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Assign records"
      guard="platform"
      permission="platform_team.assign"
      loading={mutation.isPending}
      error={formErrorMessage(mutation.error)}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={() => mutation.mutate()}>
            Assign record
          </Button>
        </>
      }
    >
      <div className="form-grid">
        <label className={assignableTypeError ? 'form-field-invalid' : undefined}>
          <span>Record type</span>
          <select
            value={assignableType}
            onChange={(event) => setAssignableType(event.target.value)}
            aria-invalid={Boolean(assignableTypeError)}
          >
            <option value="tenant">Tenant</option>
            <option value="platform_ticket">Ticket</option>
            <option value="system_incident">Incident</option>
            <option value="monitoring_alert">Alert</option>
          </select>
          {assignableTypeError ? <strong role="alert">{assignableTypeError}</strong> : null}
        </label>
        <label className={assignableIdError ? 'form-field-invalid' : undefined}>
          <span>Record ID</span>
          <input
            value={assignableId}
            onChange={(event) => setAssignableId(event.target.value)}
            aria-invalid={Boolean(assignableIdError)}
          />
          {assignableIdError ? <strong role="alert">{assignableIdError}</strong> : null}
        </label>
        <label className={assignmentRoleError ? 'form-field-invalid' : undefined}>
          <span>Assignment role</span>
          <select
            value={assignmentRole}
            onChange={(event) => setAssignmentRole(event.target.value)}
            aria-invalid={Boolean(assignmentRoleError)}
          >
            <option value="support_owner">Support Owner</option>
            <option value="billing_owner">Billing Owner</option>
            <option value="onboarding_owner">Onboarding Owner</option>
            <option value="technical_owner">Technical Owner</option>
            <option value="reviewer">Reviewer</option>
          </select>
          {assignmentRoleError ? <strong role="alert">{assignmentRoleError}</strong> : null}
        </label>
      </div>
    </AppModal>
  );
}

function ReleaseAssignmentModal({
  open,
  team,
  assignment,
  onClose
}: {
  open: boolean;
  team?: PlatformRecord | null;
  assignment?: PlatformRecord | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [assignmentId, setAssignmentId] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [reason, setReason] = useState('Assignment released');
  const [notifyLead, setNotifyLead] = useState(true);
  const mutation = useMutation({
    mutationFn: () =>
      platformAccessApi.teams.releaseAssignment(idOf(team), assignmentId, {
        released_at: releaseDate || new Date().toISOString(),
        reason,
        notify_team_lead: notifyLead
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: platformQueryKeys.resource(resourceMeta.teams.resourceKey)
      });
      if (team) {
        await queryClient.invalidateQueries({
          queryKey: platformQueryKeys.related(
            resourceMeta.teams.resourceKey,
            idOf(team),
            'assignments'
          )
        });
      }
      onClose();
    }
  });

  useEffect(() => {
    if (open) setAssignmentId(idOf(assignment));
  }, [assignment, open]);

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Release assignment"
      guard="platform"
      permission="platform_team.assign"
      loading={mutation.isPending}
      error={mutation.error ? errorMessage(mutation.error) : null}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="danger" onClick={() => mutation.mutate()}>
            Release
          </Button>
        </>
      }
    >
      <div className="form-grid">
        <label>
          Assignment ID
          <input value={assignmentId} onChange={(event) => setAssignmentId(event.target.value)} />
        </label>
        <label>
          Release date
          <input
            type="datetime-local"
            value={releaseDate}
            onChange={(event) => setReleaseDate(event.target.value)}
          />
        </label>
        <label>
          Reason
          <textarea value={reason} onChange={(event) => setReason(event.target.value)} />
        </label>
        <label className="check-row">
          <input
            checked={notifyLead}
            type="checkbox"
            onChange={(event) => setNotifyLead(event.target.checked)}
          />{' '}
          Notify team lead
        </label>
      </div>
    </AppModal>
  );
}

function TeamRoleEditorModal({
  open,
  role,
  onClose
}: {
  open: boolean;
  role?: PlatformRecord | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [permissionsOpen, setPermissionsOpen] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const form = useForm<TeamRoleForm>({
    resolver: zodResolver(teamRoleSchema),
    defaultValues: {
      name: '',
      description: '',
      permissions: [],
      is_system: false,
      status: 'active',
      audit_reason: 'Team role update'
    }
  });
  const mutation = useMutation({
    mutationFn: (values: TeamRoleForm) => {
      const payload: Partial<TeamRolePayload> = {
        name: values.name,
        description: values.description,
        permissions: selectedPermissions,
        is_system: values.is_system,
        status: values.status,
        audit_reason: values.audit_reason || (role ? 'Team role update' : 'Team role created')
      };

      return role
        ? platformAccessApi.teamRoles.update(idOf(role), payload)
        : platformAccessApi.teamRoles.create(payload as TeamRolePayload);
    },
    onError: (error) => applyApiFieldErrors(form, error),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: platformQueryKeys.resource(resourceMeta.teamRoles.resourceKey)
      });
      onClose();
    }
  });

  useEffect(() => {
    if (!open) return;
    const permissions = selectedTeamRolePermissions(role);
    setSelectedPermissions(permissions);
    form.reset({
      name: textOf(role, ['name'], ''),
      description: textOf(role, ['description'], ''),
      permissions,
      is_system: Boolean(role?.is_system),
      status: textOf(role, ['status'], 'active'),
      audit_reason: role ? 'Team role update' : 'Team role created'
    });
  }, [form, open, role]);

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
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={form.handleSubmit((values) => mutation.mutate(values))}>
            Save team role
          </Button>
        </>
      }
    >
      <div className="form-grid form-grid--two">
        <InputField form={form} name="name" label="Name" />
        <SelectField form={form} name="status" label="Status" options={['active', 'inactive']} />
        <CheckboxField form={form} name="is_system" label="System role" />
        {role ? <InputField form={form} name="audit_reason" label="Audit reason" /> : null}
        <div className="modal-form-span">
          <InputField form={form} name="description" label="Description" type="textarea" />
        </div>
        <TeamRolePermissionSelector
          form={form}
          selectedCount={selectedPermissions.length}
          onOpen={() => setPermissionsOpen(true)}
        />
      </div>
      <TeamRolePermissionsDrawer
        open={permissionsOpen}
        selectedValues={selectedPermissions}
        onSelectedValuesChange={(values) => {
          setSelectedPermissions(values);
          form.setValue('permissions', values, { shouldDirty: true });
          form.clearErrors('permissions');
        }}
        onClose={() => setPermissionsOpen(false)}
        permission={role ? 'platform_team.edit' : 'platform_team.create'}
      />
    </AppModal>
  );
}

function PermissionDetailDrawer({
  open,
  record,
  onClose
}: {
  open: boolean;
  record?: PlatformRecord | null;
  onClose: () => void;
}) {
  return (
    <AppDrawer
      open={open}
      onClose={onClose}
      title="Permission detail"
      guard="platform"
      permission="platform_permission.view"
    >
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
  const visibleError = formErrorMessage(error);

  return (
    <section className="enterprise-module-page platform-access-page">
      <PageHeader
        title={title}
        description="Permission-aware create/edit flow with audit reason support."
        actions={
          <Button type="button" variant="secondary" onClick={() => navigate(backTo)}>
            Back
          </Button>
        }
      />
      {visibleError ? <div className="surface-error">{visibleError}</div> : null}
      <form
        className="rbac-form-shell"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <article className="enterprise-form">{children}</article>
        {side ? <aside className="rbac-side-panel">{side}</aside> : null}
        <footer className="enterprise-form__footer rbac-sticky-footer">
          <Button type="button" variant="secondary" onClick={() => setConfirmCancel(true)}>
            Cancel
          </Button>
          {footerExtra}
          <PermissionButton
            guard="platform"
            permission={permission}
            type="submit"
            disabled={isSaving}
          >
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

function RolePermissionSelector({
  form,
  selectedCount,
  onOpen
}: {
  form: any;
  selectedCount: number;
  onOpen: () => void;
}) {
  const error = form.formState.errors.permission_ids?.message;
  const errorId = 'permission_ids-error';

  return (
    <section
      className={`role-permission-selector${error ? ' form-field-invalid' : ''}`}
      aria-invalid={Boolean(error)}
      aria-describedby={error ? errorId : undefined}
    >
      <div>
        <span>Permissions</span>
        <strong>{selectedCount} selected</strong>
        <p>Use the selector to attach permissions. Empty is allowed for a draft or limited role.</p>
      </div>
      <Button type="button" variant="secondary" onClick={onOpen}>
        Manage permissions
      </Button>
      {error ? <strong id={errorId} role="alert">{String(error)}</strong> : null}
    </section>
  );
}

function TeamRolePermissionSelector({
  form,
  selectedCount,
  onOpen
}: {
  form: any;
  selectedCount: number;
  onOpen: () => void;
}) {
  const error = form.formState.errors.permissions?.message;
  const errorId = 'team-role-permissions-error';

  return (
    <section
      className={`role-permission-selector modal-form-span${error ? ' form-field-invalid' : ''}`}
      aria-invalid={Boolean(error)}
      aria-describedby={error ? errorId : undefined}
    >
      <div>
        <span>Permissions</span>
        <strong>{selectedCount} selected</strong>
        <p>Use the selector to attach platform permissions to this team role.</p>
      </div>
      <Button type="button" variant="secondary" onClick={onOpen}>
        Assign permissions
      </Button>
      {error ? <strong id={errorId} role="alert">{String(error)}</strong> : null}
    </section>
  );
}

function InputField({
  form,
  name,
  label,
  placeholder,
  type = 'text'
}: {
  form: any;
  name: string;
  label: ReactNode;
  placeholder?: string;
  type?: string;
}) {
  const error = form.formState.errors[name]?.message;
  const errorId = `${name}-error`;
  const fieldProps = {
    'aria-invalid': Boolean(error),
    'aria-describedby': error ? errorId : undefined,
    ...form.register(name)
  };
  return (
    <label className={error ? 'form-field-invalid' : undefined}>
      <span>{label}</span>
      {type === 'textarea' ? (
        <textarea placeholder={placeholder} {...fieldProps} />
      ) : (
        <input type={type} placeholder={placeholder} {...fieldProps} />
      )}
      {error ? <strong id={errorId} role="alert">{String(error)}</strong> : null}
    </label>
  );
}

function SelectField({
  form,
  name,
  label,
  options,
  formatOption = (option: string) => option
}: {
  form: any;
  name: string;
  label: ReactNode;
  options: string[];
  formatOption?: (option: string) => string;
}) {
  const error = form.formState.errors[name]?.message;
  const errorId = `${name}-error`;
  return (
    <label className={error ? 'form-field-invalid' : undefined}>
      <span>{label}</span>
      <select aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined} {...form.register(name)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {formatOption(option)}
          </option>
        ))}
      </select>
      {error ? <strong id={errorId} role="alert">{String(error)}</strong> : null}
    </label>
  );
}

function titleCaseOption(option: string) {
  return option.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function RequiredLabel({ children }: { children: ReactNode }) {
  return (
    <>
      {children} <span className="required-mark" aria-label="required">*</span>
    </>
  );
}

function userLabel(user: Record<string, unknown>) {
  return textOf(user, ['display_name'], [textOf(user, ['first_name'], ''), textOf(user, ['last_name'], '')].join(' ').trim() || textOf(user, ['email'], 'Unnamed user'));
}

function userSelectValue(user: Record<string, unknown>) {
  return String(user.id ?? user.uuid ?? '');
}

function UserSelectField({
  form,
  name,
  label,
  users,
  loading
}: {
  form: any;
  name: string;
  label: string;
  users: Array<Record<string, unknown>>;
  loading?: boolean;
}) {
  const error = form.formState.errors[name]?.message;
  const errorId = `${name}-error`;
  return (
    <label className={error ? 'form-field-invalid' : undefined}>
      <span>{label}</span>
      <select
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        {...form.register(name)}
        disabled={loading}
      >
        <option value="">{loading ? 'Loading users...' : 'Select user'}</option>
        {users.map((user) => (
          <option key={idOf(user)} value={userSelectValue(user)}>
            {userLabel(user)}
          </option>
        ))}
      </select>
      {error ? <strong id={errorId} role="alert">{String(error)}</strong> : null}
    </label>
  );
}

function generateTeamCode(name: string) {
  const code = toSnakeCase(name).toUpperCase();
  return code || 'TEAM';
}

function CheckboxField({ form, name, label }: { form: any; name: string; label: ReactNode }) {
  const error = form.formState.errors[name]?.message;
  const errorId = `${name}-error`;
  return (
    <label className={`check-row${error ? ' form-field-invalid' : ''}`}>
      <input
        type="checkbox"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        {...form.register(name)}
      />
      <span>{label}</span>
      {error ? <strong id={errorId} role="alert">{String(error)}</strong> : null}
    </label>
  );
}

function RecordDetails({ record }: { record: Record<string, unknown> }) {
  return (
    <dl className="enterprise-summary-list">
      {Object.entries(record).map(([key, value]) => (
        <div key={key}>
          <dt>{toTitleCase(key)}</dt>
          <dd>{formatDetailValue(key, value)}</dd>
        </div>
      ))}
    </dl>
  );
}

function formatDetailValue(key: string, value: unknown) {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.length ? String(value.length) : '-';
  if (typeof value === 'object') return '-';
  if (isDateField(key)) return formatDateTime(value);
  if (key.endsWith('_count') || key === 'count') return String(value);
  return toTitleCase(value);
}

function PermissionGroups({ groups }: { groups?: GroupedPermissions }) {
  if (!groups || Object.keys(groups).length === 0)
    return <div className="empty-state">No grouped permissions returned.</div>;
  return (
    <div className="permission-groups permission-groups--compact">
      {Object.entries(groups).map(([module, permissions]) => (
        <section key={module}>
          <header>
            <strong>{module}</strong>
            <span>{permissions.length}</span>
          </header>
          <div>
            {permissions.map((permission) => (
              <span className="permission-pill" key={idOf(permission)}>
                {textOf(permission, ['display_name', 'name'])}
              </span>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function RecordList({ rows, emptyText = 'No related records returned.' }: { rows: PlatformRecord[]; emptyText?: string }) {
  if (rows.length === 0) return <div className="empty-state">{emptyText}</div>;
  return (
    <div className="record-list">
      {rows.map((row) => (
        <article key={idOf(row)}>
          <strong>{displayText(row, ['display_name', 'name', 'email', 'assignable_type'])}</strong>
          <p>{recordListMeta(row)}</p>
        </article>
      ))}
    </div>
  );
}

function recordListMeta(row: PlatformRecord) {
  const email = textOf(row, ['email'], '');
  const status = displayText(row, ['status', 'assignment_role'], '');
  return [email, status].filter(Boolean).join(' / ') || '-';
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
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: platformQueryKeys.related(resourceMeta.teams.resourceKey, teamId, 'members')
      })
  });
  const rows = membersQuery.data?.data.members ?? [];

  if (membersQuery.isLoading) return <div className="surface-state">Loading team members...</div>;
  if (membersQuery.isError)
    return <div className="surface-error">{errorMessage(membersQuery.error)}</div>;

  return (
    <>
      <div className="record-list">
        {rows.map((member) => (
          <article key={idOf(member)}>
            <header>
              <strong>
                {textOf(member, ['display_name', 'name', 'platform_user_name', 'email'])}
              </strong>
              <span className="table-actions">
                <PermissionButton
                  guard="platform"
                  permission="platform_team.assign"
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setEditingMember(member)}
                >
                  Update
                </PermissionButton>
                <PermissionButton
                  guard="platform"
                  permission="platform_team.assign"
                  type="button"
                  size="sm"
                  variant="danger"
                  onClick={() => setRemovingMember(member)}
                >
                  Remove
                </PermissionButton>
              </span>
            </header>
            <p>
              {displayText(member, ['team_role_name', 'role_name', 'status'])} /{' '}
              Joined {formatDate(member.joined_at ?? member.effective_from)}
            </p>
          </article>
        ))}
        {rows.length === 0 ? <div className="empty-state">No team members returned.</div> : null}
      </div>
      <TeamMemberEditorModal
        team={team}
        member={editingMember}
        open={Boolean(editingMember)}
        onClose={() => setEditingMember(null)}
      />
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
          removeMutation.mutate({
            memberId: idOf(removingMember),
            reason: payload.reason ?? 'Member removed from team'
          });
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

  if (assignmentsQuery.isLoading)
    return <div className="surface-state">Loading team assignments...</div>;
  if (assignmentsQuery.isError)
    return <div className="surface-error">{errorMessage(assignmentsQuery.error)}</div>;

  return (
    <>
      <div className="record-list">
        {rows.map((assignment) => (
          <article key={idOf(assignment)}>
            <header>
              <strong>
                {displayText(assignment, ['assignable_type', 'type'])}:{' '}
                {textOf(assignment, ['assignable_id', 'record_id'])}
              </strong>
              <PermissionButton
                guard="platform"
                permission="platform_team.assign"
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setReleasingAssignment(assignment)}
              >
                Release
              </PermissionButton>
            </header>
            <p>
              {displayText(assignment, ['assignment_role'])} / {displayText(assignment, ['status'])}
            </p>
          </article>
        ))}
        {rows.length === 0 ? (
          <div className="empty-state">No team assignments returned.</div>
        ) : null}
      </div>
      <ReleaseAssignmentModal
        open={Boolean(releasingAssignment)}
        team={team}
        assignment={releasingAssignment}
        onClose={() => setReleasingAssignment(null)}
      />
    </>
  );
}

function TeamMemberEditorModal({
  open,
  team,
  member,
  onClose
}: {
  open: boolean;
  team: PlatformRecord;
  member: PlatformRecord | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [teamRoleId, setTeamRoleId] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [effectiveTo, setEffectiveTo] = useState('');
  const [status, setStatus] = useState('active');
  const teamRolesQuery = useQuery({
    queryKey: platformQueryKeys.list(resourceMeta.teamRoles.resourceKey, { per_page: 100 }),
    queryFn: () => platformAccessApi.teamRoles.list({ per_page: 100, filter: { status: 'active' } }),
    enabled: open
  });
  const teamRoles = teamRolesQuery.data?.data ?? [];

  useEffect(() => {
    if (!open || !member) return;
    setTeamRoleId(textOf(member, ['team_role_uuid'], ''));
    setEffectiveFrom(textOf(member, ['effective_from', 'joined_at'], ''));
    setEffectiveTo(textOf(member, ['effective_to', 'left_at'], ''));
    setStatus(textOf(member, ['status'], 'active'));
  }, [member, open]);

  const mutation = useMutation({
    mutationFn: () => {
      if (!member) return Promise.resolve({ data: null });
      return platformAccessApi.teams.updateMember(idOf(team), idOf(member), {
        team_role_uuid: teamRoleId || null,
        effective_from: effectiveFrom || undefined,
        effective_to: effectiveTo || null,
        status
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: platformQueryKeys.related(resourceMeta.teams.resourceKey, idOf(team), 'members')
      });
      onClose();
    }
  });
  const teamRoleError = apiFieldError(mutation.error, ['team_role_uuid', 'platform_team_role_id']);

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Update team member"
      guard="platform"
      permission="platform_team.assign"
      loading={mutation.isPending}
      error={formErrorMessage(mutation.error)}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={() => mutation.mutate()}>
            Update member
          </Button>
        </>
      }
    >
      <div className="form-grid">
        <label className={teamRoleError ? 'form-field-invalid' : undefined}>
          <span>Team role</span>
          <select
            value={teamRoleId}
            onChange={(event) => setTeamRoleId(event.target.value)}
            disabled={teamRolesQuery.isLoading}
          >
            <option value="">{teamRolesQuery.isLoading ? 'Loading roles...' : 'No team role'}</option>
            {teamRoles.map((role) => (
              <option key={idOf(role)} value={idOf(role)}>
                {displayText(role, ['name', 'code'])}
              </option>
            ))}
          </select>
          {teamRoleError ? <strong role="alert">{teamRoleError}</strong> : null}
        </label>
        <label>
          Effective from
          <input
            type="date"
            value={effectiveFrom}
            onChange={(event) => setEffectiveFrom(event.target.value)}
          />
        </label>
        <label>
          Effective to
          <input
            type="date"
            value={effectiveTo}
            onChange={(event) => setEffectiveTo(event.target.value)}
          />
        </label>
        <label>
          Status
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="left">Left</option>
          </select>
        </label>
      </div>
    </AppModal>
  );
}

function SummaryTile({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <article className="summary-card">
      <span>{icon}</span>
      <p>{label}</p>
      <strong>{value}</strong>
    </article>
  );
}

function ResourceStats({ kind, rows }: { kind: ResourceKind; rows: PlatformRecord[] }) {
  const permissions = rows.reduce((sum, row) => sum + Number(row.permissions_count ?? 0), 0);
  const assigned = rows.reduce(
    (sum, row) => sum + Number(row.users_count ?? row.members_count ?? 0),
    0
  );

  return (
    <section className="platform-access-summary">
      <SummaryTile
        icon={<ShieldCheck />}
        label={`Total ${resourceMeta[kind].label}`}
        value={String(rows.length)}
      />
      <SummaryTile
        icon={<CheckCircle2 />}
        label="Active"
        value={String(rows.filter((row) => row.status === 'active').length)}
      />
      <SummaryTile
        icon={<KeyRound />}
        label="System"
        value={String(rows.filter((row) => row.is_system).length)}
      />
      <SummaryTile
        icon={<Users />}
        label={kind === 'roles' ? 'Assigned Users' : 'Assignments'}
        value={String(assigned)}
      />
      {kind === 'roles' ? (
        <SummaryTile icon={<ShieldCheck />} label="Total Permissions" value={String(permissions)} />
      ) : null}
    </section>
  );
}

function AuditRail({ rows, compact = false }: { rows: PlatformRecord[]; compact?: boolean }) {
  const [visible, setVisible] = useState(true);
  const [activeTab, setActiveTab] = useState<'activity' | 'details'>('activity');
  const [showFull, setShowFull] = useState(false);
  const auditQuery = useQuery({
    queryKey: platformQueryKeys.list('platform-audit-logs-access-control', { per_page: showFull ? 25 : 6 }),
    queryFn: () => platformAccessApi.audit.list({ per_page: showFull ? 25 : 6, sort: 'created_at', direction: 'desc' })
  });
  const exportMutation = useMutation({
    mutationFn: (delivery: 'job' | 'download') =>
      platformAccessApi.audit.export({
        format: 'csv',
        delivery,
        scope: 'filtered',
        columns: ['id', 'actor_platform_user_id', 'subject_type', 'subject_id', 'event', 'description', 'created_at']
      })
  });
  const activity = auditQuery.data?.data ?? rows.slice(0, showFull ? 25 : 6);

  if (!visible) return null;

  return (
    <aside className={compact ? 'audit-rail audit-rail--compact' : 'audit-rail'}>
      <header>
        <h2>Audit Log</h2>
        <button type="button" aria-label="Close audit log" onClick={() => setVisible(false)}>
          x
        </button>
      </header>
      <div className="audit-tabs" role="tablist" aria-label="Audit views">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'activity'}
          onClick={() => setActiveTab('activity')}
        >
          Activity
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'details'}
          onClick={() => setActiveTab('details')}
        >
          Details
        </button>
      </div>
      {auditQuery.isLoading ? <div className="surface-state">Loading audit logs...</div> : null}
      {auditQuery.isError ? <div className="surface-error">{errorMessage(auditQuery.error)}</div> : null}
      {activeTab === 'activity' ? (
        <>
          {activity.map((row) => (
            <article key={idOf(row) || String(row.id ?? row.event ?? row.created_at)}>
              <span className="audit-avatar" aria-hidden="true">
                {textOf(row, ['actor_platform_user_id', 'updated_by', 'created_by'], 'S').slice(0, 1).toUpperCase()}
              </span>
              <div>
                <strong>{toTitleCase(textOf(row, ['event', 'display_name', 'name'], 'Activity'))}</strong>
                <small>{displayText(row, ['subject_type', 'guard_name', 'module'], 'Platform')}</small>
                <p>{textOf(row, ['description', 'event', 'display_name', 'name'])}</p>
                <time>{formatDateTime(row.created_at ?? row.updated_at)}</time>
              </div>
            </article>
          ))}
          {activity.length === 0 && !auditQuery.isLoading ? (
            <div className="empty-state">No audit activity loaded.</div>
          ) : null}
        </>
      ) : (
        <RecordDetails record={activity[0] ? roleDisplayDetails(activity[0], 'roles') : {}} />
      )}
      <Button type="button" variant="secondary" size="sm" onClick={() => setShowFull((value) => !value)}>
        {showFull ? 'Show Recent Audit Logs' : 'View Full Audit Logs'}
      </Button>
      <Button type="button" variant="secondary" size="sm" onClick={() => exportMutation.mutate('job')} disabled={exportMutation.isPending}>
        Export Audit Logs
      </Button>
      <Button type="button" variant="secondary" size="sm" onClick={() => exportMutation.mutate('download')} disabled={exportMutation.isPending}>
        Download Audit CSV
      </Button>
      {exportMutation.error ? <div className="surface-error">{errorMessage(exportMutation.error)}</div> : null}
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

function formatDate(value: unknown) {
  if (!value) return '-';
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function isDateField(key: string) {
  return key.endsWith('_at') || key.endsWith('_date') || key === 'date';
}

function RoleSummary({
  record,
  values,
  selectedCount
}: {
  record?: PlatformRecord;
  values?: Partial<RoleForm>;
  selectedCount: number;
}) {
  const displayName = String(values?.display_name || values?.name || textOf(record, ['display_name', 'name'], 'New role'));
  const status = String(values?.status || textOf(record, ['status'], 'active'));

  return (
    <>
      <h2>Role Summary</h2>
      <RecordDetails
        record={{
          role: displayName,
          status,
          selected_permissions: selectedCount
        }}
      />
      <div className="surface-state">Permissions can stay empty for a draft or limited platform role.</div>
    </>
  );
}

function PermissionTip({ record }: { record?: PlatformRecord }) {
  return (
    <>
      <h2>Permission Tip</h2>
      <p>Custom permission actions are enabled only for non-system permissions.</p>
      <RecordDetails
        record={{
          system: Boolean(record?.is_system),
          roles_count: textOf(record, ['roles_count'], '0')
        }}
      />
    </>
  );
}

function TeamSummary({
  record,
  values,
  users
}: {
  record?: PlatformRecord;
  values?: Partial<TeamForm>;
  users?: Array<Record<string, unknown>>;
}) {
  const name = String(values?.name || textOf(record, ['name'], 'New team'));
  const code = String(values?.code || textOf(record, ['code'], generateTeamCode(name)));
  const lead = users?.find((user) => userSelectValue(user) === values?.lead_platform_user_id);
  const assistantLead = users?.find((user) => userSelectValue(user) === values?.assistant_lead_platform_user_id);

  return (
    <>
      <h2>Team Summary</h2>
      <RecordDetails
        record={{
          team: name,
          team_code: code,
          lead: lead ? userLabel(lead) : textOf(record, ['lead_name', 'lead_platform_user_id'], '-'),
          assistant_lead: assistantLead ? userLabel(assistantLead) : textOf(record, ['assistant_lead_name', 'assistant_lead_platform_user_id'], '-'),
          members: textOf(record, ['members_count'], '0'),
          assignments: textOf(record, ['assignments_count'], '0'),
          visibility: values?.visibility || textOf(record, ['visibility'], 'internal'),
          status: values?.status || textOf(record, ['status'], 'active')
        }}
      />
    </>
  );
}

function permissionFor(kind: ResourceKind, action: 'view' | 'create' | 'edit' | 'delete') {
  const meta = resourceMeta[kind];
  if (kind === 'teamRoles') return `platform_team.${action === 'view' ? 'view' : action}`;
  return `${meta.permission}.${action}`;
}

function descriptionFor(kind: ResourceKind) {
  if (kind === 'roles')
    return 'Manage platform-wide roles, permissions, assigned users, audit-safe clone and delete workflows.';
  if (kind === 'permissions')
    return 'Review platform permissions and create or edit custom permissions where supported.';
  if (kind === 'teams')
    return 'Manage internal platform teams, members, record assignments, and releases.';
  return 'Create and maintain reusable roles for platform team members.';
}

