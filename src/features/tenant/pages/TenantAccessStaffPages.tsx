import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Camera,
  Download,
  Plus,
  Edit3,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users
} from 'lucide-react';

import { ApiError } from '@/lib/api/apiError';
import type { ApiQuery } from '@/lib/api/apiTypes';
import { createListQuery } from '@/lib/api/listQuery';
import { tenantQueryKeys } from '@/features/tenant/api/tenantQueryKeys';
import { tenantAccessApi, type GroupedPermissions, type TenantAccessRecord } from '@/features/tenant/api/tenantAccessApi';
import { tenantOperationsApi } from '@/features/tenant/api/tenantOperationsApi';
import { TENANT_ROUTES } from '@/features/tenant/routes/tenantRoutes';
import { DataTable, RowActionMenu, type DataTableColumn } from '@/shared/components/data-table';
import { AppDrawer } from '@/shared/components/drawer';
import { PageHeader, StatusBadge, SummaryCard, Tabs } from '@/shared/components/layout';
import { AppModal } from '@/shared/components/modal';
import { ConfirmDialog } from '@/shared/components/workflows/ConfirmDialog';
import { Button, PermissionButton } from '@/shared/components/ui';

const tenantKey = 'current';

type ModalState =
  | null
  | 'create'
  | 'edit'
  | 'assignPermissions'
  | 'assignUsers'
  | 'deleteRole'
  | 'bulkDeleteRole'
  | 'deleteTeam'
  | 'bulkDeleteTeam'
  | 'roleFilters'
  | 'teamFilters'
  | 'teamColumns'
  | 'teamImport'
  | 'addMember'
  | 'assignRecord'
  | 'assignProject'
  | 'assignTask'
  | 'settings'
  | 'inviteUser'
  | 'inviteStaff'
  | 'assignRole'
  | 'resetPassword'
  | 'userFilters'
  | 'userColumns'
  | 'forceLogout'
  | 'require2fa'
  | 'staffFilters'
  | 'staffColumns'
  | 'deleteStaff'
  | 'bulkDeleteStaff'
  | 'assignTeam'
  | 'staffImport'
  | 'staffExport'
  | 'bank'
  | 'salary'
  | 'document'
  | 'photo';

export function TenantRolesListPage() {
  const { tenantSlug } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const query = usePagedQuery('roles', tenantAccessApi.roles.list, 10, statusFilter ? { status: statusFilter } : undefined);
  const [selected, setSelected] = useState<TenantAccessRecord | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [hiddenColumnIds, setHiddenColumnIds] = useState<string[]>(['guard_name']);
  const [modal, setModal] = useState<ModalState>(null);
  const stats = (query.meta?.stats as Record<string, unknown> | undefined) ?? {};
  const deleteMutation = useMutation({
    mutationFn: ({ ids, reason }: { ids: string[]; reason?: string }) => ids.length === 1
      ? tenantAccessApi.roles.delete(ids[0], { audit_reason: reason })
      : tenantAccessApi.roles.bulkDelete(ids, reason),
    onSuccess: async () => {
      setSelected(null);
      setSelectedIds([]);
      setModal(null);
      await queryClient.invalidateQueries({ queryKey: tenantQueryKeys.resource(tenantKey, 'roles') });
    }
  });

  return (
    <section className="enterprise-module-page">
      <PageHeader
        title="Roles"
        description="Tenant roles with permission assignment and user membership."
        actions={<PermissionButton guard="tenant" permission="role.create" type="button" onClick={() => navigate('create')}><Plus size={16} aria-hidden />Role</PermissionButton>}
      />
      <RoleSummaryCards stats={stats} fallbackTotal={query.total} rows={query.rows} />
      <DataTable
        columns={roleColumns(
          (row, action) => { setSelected(row); setModal(action); },
          (row) => navigate(`${idOf(row)}`),
          (row) => navigate(`${idOf(row)}/edit`)
        )}
        data={query.rows}
        getRowId={idOf}
        loading={query.isLoading}
        error={query.error}
        searchValue={query.search}
        searchPlaceholder="Search roles..."
        onSearchChange={query.setSearch}
        hiddenColumnIds={hiddenColumnIds}
        onHiddenColumnIdsChange={setHiddenColumnIds}
        onOpenFilters={() => setModal('roleFilters')}
        selectedRowIds={selectedIds}
        onSelectionChange={setSelectedIds}
        bulkActions={<PermissionButton guard="tenant" permission="role.delete" type="button" variant="danger" size="sm" disabled={selectedIds.length === 0} onClick={() => setModal('bulkDeleteRole')}><Trash2 size={15} aria-hidden />Delete selected</PermissionButton>}
        page={query.page}
        perPage={query.perPage}
        total={query.total}
        onPageChange={query.setPage}
        onPerPageChange={(value) => { query.setPerPage(value); query.setPage(1); setSelectedIds([]); }}
      />
      <RoleFiltersModal open={modal === 'roleFilters'} status={statusFilter} onStatusChange={(value) => { setStatusFilter(value); query.setPage(1); }} onClose={() => setModal(null)} />
      <PermissionAssignDrawer open={modal === 'assignPermissions'} target="role" record={selected} onClose={() => setModal(null)} />
      <AssignUsersModal open={modal === 'assignUsers'} role={selected} onClose={() => setModal(null)} />
      <ConfirmDialog
        open={modal === 'deleteRole'}
        onClose={() => setModal(null)}
        title="Delete role?"
        description={`This permanently deletes ${textOf(selected, ['display_name', 'name'], 'this role')} when it is not assigned to users.`}
        confirmLabel="Delete"
        confirmTone="danger"
        typedConfirmation="delete"
        guard="tenant"
        permission="role.delete"
        loading={deleteMutation.isPending}
        error={deleteMutation.error ? errorMessage(deleteMutation.error) : null}
        onConfirm={({ reason }) => selected && deleteMutation.mutate({ ids: [idOf(selected)], reason })}
      />
      <ConfirmDialog
        open={modal === 'bulkDeleteRole'}
        onClose={() => setModal(null)}
        title="Delete selected roles?"
        description={`This permanently deletes ${selectedIds.length} selected role${selectedIds.length === 1 ? '' : 's'} when they are not assigned to users.`}
        confirmLabel="Delete selected"
        confirmTone="danger"
        typedConfirmation="delete"
        guard="tenant"
        permission="role.delete"
        loading={deleteMutation.isPending}
        error={deleteMutation.error ? errorMessage(deleteMutation.error) : null}
        onConfirm={({ reason }) => deleteMutation.mutate({ ids: selectedIds, reason })}
      />
    </section>
  );
}

export function TenantRoleCreatePage() {
  return <RoleEditorPage mode="create" />;
}

export function TenantRoleEditPage() {
  return <RoleEditorPage mode="edit" />;
}

function RoleEditorPage({ mode }: { mode: 'create' | 'edit' }) {
  const { tenantSlug, id = '' } = useParams();
  const navigate = useNavigate();
  const query = useQuery({ queryKey: tenantQueryKeys.detail(tenantKey, 'roles', id), queryFn: () => tenantAccessApi.roles.detail(id), enabled: mode === 'edit' && Boolean(id) });
  const backToRoles = () => navigate(TENANT_ROUTES.accessControl.roles(tenantSlug));
  return (
    <section className="enterprise-module-page">
      <PageHeader
        title={mode === 'create' ? 'Create Role' : 'Edit Role'}
        actions={<Button type="button" variant="secondary" onClick={backToRoles}><ArrowLeft size={16} aria-hidden />Back</Button>}
      />
      {mode === 'edit' && query.isLoading ? <div className="surface-state">Loading role...</div> : null}
      <RoleForm
        role={query.data}
        onSaved={backToRoles}
        onCancel={backToRoles}
      />
    </section>
  );
}

export function TenantRoleViewPage() {
  const { tenantSlug, id = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: tenantQueryKeys.detail(tenantKey, 'roles', id), queryFn: () => tenantAccessApi.roles.detail(id) });
  const role = query.data;
  const [modal, setModal] = useState<ModalState>(null);
  const [tab, setTab] = useState('overview');
  const deleteMutation = useMutation({
    mutationFn: (reason?: string) => tenantAccessApi.roles.delete(id, { audit_reason: reason }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tenantQueryKeys.resource(tenantKey, 'roles') });
      navigate(TENANT_ROUTES.accessControl.roles(tenantSlug));
    }
  });
  const users = (role?.users as TenantAccessRecord[]) ?? [];
  const permissions = (role?.permissions as GroupedPermissions) ?? {};

  return (
    <section className="enterprise-module-page">
      <PageHeader
        title={textOf(role, ['display_name', 'name'], 'Role')}
        description={textOf(role, ['description'], 'Tenant role details.')}
        actions={<><Button type="button" variant="secondary" onClick={() => navigate(TENANT_ROUTES.accessControl.roles(tenantSlug))}><ArrowLeft size={16} aria-hidden />Back</Button><Link className="button button--secondary button--md" to="edit"><Edit3 size={16} aria-hidden />Edit</Link><PermissionButton guard="tenant" permission="role.assign_permissions" type="button" onClick={() => setModal('assignPermissions')}><ShieldCheck size={16} aria-hidden />Permissions</PermissionButton><Button type="button" variant="secondary" onClick={() => setModal('assignUsers')}><Users size={16} aria-hidden />Users</Button><PermissionButton guard="tenant" permission="role.delete" type="button" variant="danger" onClick={() => setModal('deleteRole')}><Trash2 size={16} aria-hidden />Delete</PermissionButton></>}
      />
      <div className="summary-grid">
        <SummaryCard icon={<ShieldCheck />} label="Total permissions" value={String(role?.permissions_count ?? countGroupedPermissions(permissions))} />
        <SummaryCard icon={<Users />} label="Total users" value={String(role?.users_count ?? users.length)} />
      </div>
      <Tabs tabs={roleTabs} activeId={tab} onChange={setTab} ariaLabel="Role details tabs" />
      {tab === 'overview' ? <RecordDetails record={role} loading={query.isLoading} /> : null}
      {tab === 'permissions' ? <AssignedPermissionsList groups={permissions} /> : null}
      {tab === 'users' ? <AssignedUsersList users={users} /> : null}
      {tab === 'activity' ? <RecordList title="Activity" rows={(role?.activity as TenantAccessRecord[]) ?? []} /> : null}
      <PermissionAssignDrawer open={modal === 'assignPermissions'} target="role" record={role ?? null} onClose={() => setModal(null)} />
      <AssignUsersModal open={modal === 'assignUsers'} role={role ?? null} onClose={() => setModal(null)} />
      <ConfirmDialog
        open={modal === 'deleteRole'}
        onClose={() => setModal(null)}
        title="Delete role?"
        description={`This permanently deletes ${textOf(role, ['display_name', 'name'], 'this role')} when it is not assigned to users.`}
        confirmLabel="Delete"
        confirmTone="danger"
        typedConfirmation="delete"
        guard="tenant"
        permission="role.delete"
        loading={deleteMutation.isPending}
        error={deleteMutation.error ? errorMessage(deleteMutation.error) : null}
        onConfirm={({ reason }) => deleteMutation.mutate(reason)}
      />
    </section>
  );
}

export function TenantPermissionsPage() {
  const query = usePagedQuery('permissions', tenantAccessApi.permissions.list);
  const groupedQuery = useQuery({ queryKey: tenantQueryKeys.resource(tenantKey, 'permissions-grouped'), queryFn: tenantAccessApi.permissions.grouped });
  return (
    <section className="enterprise-module-page">
      <PageHeader title="Permissions" description="Grouped tenant permission catalog from the permissions table." />
      <PermissionGroups groups={groupedQuery.data?.data.permissions ?? {}} />
      <DataTable
        columns={genericColumns(['module', 'display_name', 'name', 'guard_name', 'roles_count', 'status'])}
        data={query.rows}
        getRowId={idOf}
        loading={query.isLoading}
        error={query.error}
        searchValue={query.search}
        onSearchChange={query.setSearch}
        page={query.page}
        perPage={query.perPage}
        total={query.total}
        onPageChange={query.setPage}
        onPerPageChange={(value) => { query.setPerPage(value); query.setPage(1); }}
      />
    </section>
  );
}

export function TenantTeamsListPage() {
  const { tenantSlug } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const query = usePagedQuery('teams', tenantAccessApi.teams.list, 10, statusFilter ? { status: statusFilter } : undefined);
  const [selected, setSelected] = useState<TenantAccessRecord | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [hiddenColumnIds, setHiddenColumnIds] = useState<string[]>(['department_name', 'lead_name']);
  const [modal, setModal] = useState<ModalState>(null);
  const stats = (query.meta?.stats as Record<string, unknown> | undefined) ?? {};
  const deleteMutation = useMutation({
    mutationFn: ({ ids, reason }: { ids: string[]; reason?: string }) => ids.length === 1
      ? tenantAccessApi.teams.delete(ids[0])
      : tenantAccessApi.teams.bulkDelete(ids, reason),
    onSuccess: async () => {
      setSelected(null);
      setSelectedIds([]);
      setModal(null);
      await queryClient.invalidateQueries({ queryKey: tenantQueryKeys.resource(tenantKey, 'teams') });
    }
  });

  return (
    <section className="enterprise-module-page">
      <PageHeader
        title="Teams"
        description="Team structure, members, assignments, and activity."
        actions={<PermissionButton guard="tenant" permission="team.create" type="button" onClick={() => navigate('create')}><Plus size={16} aria-hidden />Team</PermissionButton>}
      />
      <TeamSummaryCards stats={stats} fallbackTotal={query.total} rows={query.rows} />
      <DataTable
        columns={teamColumns(
          (row, action) => { setSelected(row); setModal(action); },
          (row) => navigate(`${idOf(row)}`),
          (row) => navigate(`${idOf(row)}/edit`)
        )}
        data={query.rows}
        getRowId={idOf}
        loading={query.isLoading}
        error={query.error}
        searchValue={query.search}
        searchPlaceholder="Search teams..."
        onSearchChange={query.setSearch}
        hiddenColumnIds={hiddenColumnIds}
        onHiddenColumnIdsChange={setHiddenColumnIds}
        onOpenFilters={() => setModal('teamFilters')}
        onOpenColumns={() => setModal('teamColumns')}
        onOpenExport={() => setModal('staffExport')}
        onOpenImport={() => setModal('teamImport')}
        selectedRowIds={selectedIds}
        onSelectionChange={setSelectedIds}
        bulkActions={<PermissionButton guard="tenant" permission="team.delete" type="button" variant="danger" size="sm" disabled={selectedIds.length === 0} onClick={() => setModal('bulkDeleteTeam')}><Trash2 size={15} aria-hidden />Delete selected</PermissionButton>}
        page={query.page}
        perPage={query.perPage}
        total={query.total}
        onPageChange={query.setPage}
        onPerPageChange={(value) => { query.setPerPage(value); query.setPage(1); setSelectedIds([]); }}
      />
      <TeamFiltersModal open={modal === 'teamFilters'} status={statusFilter} onStatusChange={(value) => { setStatusFilter(value); query.setPage(1); }} onClose={() => setModal(null)} />
      <TeamColumnsModal open={modal === 'teamColumns'} hiddenColumnIds={hiddenColumnIds} onChange={setHiddenColumnIds} onClose={() => setModal(null)} />
      <TeamExportModal open={modal === 'staffExport'} onClose={() => setModal(null)} />
      <TeamImportModal open={modal === 'teamImport'} onClose={() => setModal(null)} />
      <TeamMemberModal open={modal === 'addMember'} team={selected} onClose={() => setModal(null)} />
      <TeamAssignmentModal open={modal === 'assignProject'} team={selected} type="project" onClose={() => setModal(null)} />
      <TeamAssignmentModal open={modal === 'assignTask'} team={selected} type="task" onClose={() => setModal(null)} />
      <ConfirmDialog
        open={modal === 'deleteTeam'}
        onClose={() => setModal(null)}
        title="Delete team?"
        description={`This archives ${textOf(selected, ['name', 'code'], 'this team')}. Existing assignments and members stay in history.`}
        confirmLabel="Delete"
        confirmTone="danger"
        typedConfirmation="delete"
        guard="tenant"
        permission="team.delete"
        loading={deleteMutation.isPending}
        error={deleteMutation.error ? errorMessage(deleteMutation.error) : null}
        onConfirm={({ reason }) => selected && deleteMutation.mutate({ ids: [idOf(selected)], reason })}
      />
      <ConfirmDialog
        open={modal === 'bulkDeleteTeam'}
        onClose={() => setModal(null)}
        title="Delete selected teams?"
        description={`This archives ${selectedIds.length} selected team${selectedIds.length === 1 ? '' : 's'}.`}
        confirmLabel="Delete selected"
        confirmTone="danger"
        typedConfirmation="delete"
        guard="tenant"
        permission="team.delete"
        loading={deleteMutation.isPending}
        error={deleteMutation.error ? errorMessage(deleteMutation.error) : null}
        onConfirm={({ reason }) => deleteMutation.mutate({ ids: selectedIds, reason })}
      />
    </section>
  );
}

export function TenantTeamCreatePage() {
  return <TeamEditorPage mode="create" />;
}

export function TenantTeamEditPage() {
  return <TeamEditorPage mode="edit" />;
}

function TeamEditorPage({ mode }: { mode: 'create' | 'edit' }) {
  const { tenantSlug, id = '' } = useParams();
  const navigate = useNavigate();
  const query = useQuery({ queryKey: tenantQueryKeys.detail(tenantKey, 'teams', id), queryFn: () => tenantAccessApi.teams.detail(id), enabled: mode === 'edit' && Boolean(id) });
  const backToTeams = () => navigate(TENANT_ROUTES.accessControl.teams(tenantSlug));
  return (
    <section className="enterprise-module-page">
      <PageHeader
        title={mode === 'create' ? 'Create Team' : 'Edit Team'}
        actions={<Button type="button" variant="secondary" onClick={backToTeams}><ArrowLeft size={16} aria-hidden />Back</Button>}
      />
      {mode === 'edit' && query.isLoading ? <div className="surface-state">Loading team...</div> : null}
      <TeamForm team={query.data} onSaved={backToTeams} onCancel={backToTeams} />
    </section>
  );
}

export function TenantTeamViewPage() {
  const { tenantSlug, id = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: tenantQueryKeys.detail(tenantKey, 'teams', id), queryFn: () => tenantAccessApi.teams.detail(id) });
  const membersQuery = useQuery({ queryKey: tenantQueryKeys.related(tenantKey, 'teams', id, 'members'), queryFn: () => tenantAccessApi.teams.members(id), enabled: Boolean(id) });
  const projectsQuery = useQuery({ queryKey: tenantQueryKeys.related(tenantKey, 'teams', id, 'projects'), queryFn: () => tenantAccessApi.teams.projects(id), enabled: Boolean(id) });
  const tasksQuery = useQuery({ queryKey: tenantQueryKeys.related(tenantKey, 'teams', id, 'tasks'), queryFn: () => tenantAccessApi.teams.tasks(id), enabled: Boolean(id) });
  const activityQuery = useQuery({ queryKey: tenantQueryKeys.related(tenantKey, 'teams', id, 'activity'), queryFn: () => tenantAccessApi.teams.activity(id), enabled: Boolean(id) });
  const [modal, setModal] = useState<ModalState>(null);
  const [tab, setTab] = useState('overview');
  const team = query.data;
  const deleteMutation = useMutation({
    mutationFn: (reason?: string) => tenantAccessApi.teams.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tenantQueryKeys.resource(tenantKey, 'teams') });
      navigate(TENANT_ROUTES.accessControl.teams(tenantSlug));
    }
  });

  return (
    <section className="enterprise-module-page">
      <PageHeader
        title={textOf(team, ['name'], 'Team')}
        description={textOf(team, ['description'], 'Team detail.')}
        actions={<><Button type="button" variant="secondary" onClick={() => navigate(TENANT_ROUTES.accessControl.teams(tenantSlug))}><ArrowLeft size={16} aria-hidden />Back</Button><Link className="button button--secondary button--md" to="edit"><Edit3 size={16} aria-hidden />Edit</Link><Button type="button" variant="secondary" onClick={() => setModal('addMember')}><UserPlus size={16} aria-hidden />Members</Button><Button type="button" variant="secondary" onClick={() => setModal('assignProject')}><Plus size={16} aria-hidden />Project</Button><Button type="button" variant="secondary" onClick={() => setModal('assignTask')}><Plus size={16} aria-hidden />Task</Button><PermissionButton guard="tenant" permission="team.delete" type="button" variant="danger" onClick={() => setModal('deleteTeam')}><Trash2 size={16} aria-hidden />Delete</PermissionButton></>}
      />
      <div className="summary-grid">
        <SummaryCard icon={<RefreshCw />} label="Status" value={textOf(team, ['status'], '-')} />
        <SummaryCard icon={<Users />} label="Total Team Members" value={String(team?.members_count ?? membersQuery.data?.data.members.length ?? 0)} />
        <SummaryCard icon={<ShieldCheck />} label="Total Projects" value={String(team?.projects_count ?? projectsQuery.data?.data.projects.length ?? 0)} />
        <SummaryCard icon={<ShieldCheck />} label="Total Tasks" value={String(team?.tasks_count ?? tasksQuery.data?.data.tasks.length ?? 0)} />
      </div>
      <Tabs tabs={teamTabs} activeId={tab} onChange={setTab} ariaLabel="Team details tabs" />
      {tab === 'overview' ? <RecordDetails record={team} loading={query.isLoading} /> : null}
      {tab === 'members' ? <RecordList title="Team Members" rows={membersQuery.data?.data.members ?? []} /> : null}
      {tab === 'projects' ? <RecordList title="Projects" rows={projectsQuery.data?.data.projects ?? []} /> : null}
      {tab === 'tasks' ? <RecordList title="Tasks" rows={tasksQuery.data?.data.tasks ?? []} /> : null}
      {tab === 'activity' ? <RecordList title="Activity" rows={activityQuery.data?.data.activity ?? []} /> : null}
      <TeamMemberModal open={modal === 'addMember'} team={team ?? null} onClose={() => setModal(null)} />
      <TeamAssignmentModal open={modal === 'assignProject'} team={team ?? null} type="project" onClose={() => setModal(null)} />
      <TeamAssignmentModal open={modal === 'assignTask'} team={team ?? null} type="task" onClose={() => setModal(null)} />
      <ConfirmDialog
        open={modal === 'deleteTeam'}
        onClose={() => setModal(null)}
        title="Delete team?"
        description={`This archives ${textOf(team, ['name', 'code'], 'this team')}.`}
        confirmLabel="Delete"
        confirmTone="danger"
        typedConfirmation="delete"
        guard="tenant"
        permission="team.delete"
        loading={deleteMutation.isPending}
        error={deleteMutation.error ? errorMessage(deleteMutation.error) : null}
        onConfirm={({ reason }) => deleteMutation.mutate(reason)}
      />
    </section>
  );
}
export function TenantUsersPage() {
  const { tenantSlug } = useParams();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const query = usePagedQuery('users', tenantAccessApi.users.list, 10, statusFilter ? { status: statusFilter } : undefined);
  const [selected, setSelected] = useState<TenantAccessRecord | null>(null);
  const [hiddenColumnIds, setHiddenColumnIds] = useState<string[]>(['last_login_at']);
  const [modal, setModal] = useState<ModalState>(null);
  const stats = (query.meta?.stats as Record<string, unknown> | undefined) ?? {};
  const statusMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'activate' | 'suspend' }) =>
      action === 'activate' ? tenantAccessApi.users.activate(id) : tenantAccessApi.users.suspend(id),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: tenantQueryKeys.resource(tenantKey, 'users') })
  });
  const actionMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'forceLogout' | 'require2fa' }) => action === 'forceLogout' ? tenantAccessApi.users.forceLogout(id) : tenantAccessApi.users.requireTwoFactor(id, true),
    onSuccess: async () => { setModal(null); await queryClient.invalidateQueries({ queryKey: tenantQueryKeys.resource(tenantKey, 'users') }); }
  });

  return (
    <section className="enterprise-module-page">
      <PageHeader title="Tenant Users" description="Invite, update access, roles, account status, sessions, and 2FA." actions={<><Link className="button button--secondary button--md" to={TENANT_ROUTES.hrms.staff(tenantSlug)}>Staff Lifecycle</Link><PermissionButton guard="tenant" permission="staff.create" type="button" onClick={() => setModal('inviteUser')}><UserPlus size={16} aria-hidden />Invite</PermissionButton></>} />
      <UserSummaryCards stats={stats} fallbackTotal={query.total} rows={query.rows} />
      <DataTable
        columns={userColumns((row, action) => { setSelected(row); setModal(action); }, (row, action) => statusMutation.mutate({ id: idOf(row), action }))}
        data={query.rows}
        getRowId={idOf}
        loading={query.isLoading}
        error={query.error}
        searchValue={query.search}
        searchPlaceholder="Search users..."
        onSearchChange={query.setSearch}
        hiddenColumnIds={hiddenColumnIds}
        onHiddenColumnIdsChange={setHiddenColumnIds}
        onOpenFilters={() => setModal('userFilters')}
        onOpenColumns={() => setModal('userColumns')}
        page={query.page}
        perPage={query.perPage}
        total={query.total}
        onPageChange={query.setPage}
        onPerPageChange={(value) => { query.setPerPage(value); query.setPage(1); }}
      />
      <UserFiltersModal open={modal === 'userFilters'} status={statusFilter} onStatusChange={(value) => { setStatusFilter(value); query.setPage(1); }} onClose={() => setModal(null)} />
      <UserColumnsModal open={modal === 'userColumns'} hiddenColumnIds={hiddenColumnIds} onChange={setHiddenColumnIds} onClose={() => setModal(null)} />

      <AssignUserRoleModal open={modal === 'assignRole'} user={selected} onClose={() => setModal(null)} />
      <ResetPasswordModal open={modal === 'resetPassword'} user={selected} onClose={() => setModal(null)} />
      <ConfirmDialog open={modal === 'forceLogout'} onClose={() => setModal(null)} title="Force logout user?" description={`This revokes active sessions for ${textOf(selected, ['display_name', 'email'], 'this user')}.`} confirmLabel="Force logout" guard="tenant" permission="staff.edit" loading={actionMutation.isPending} error={actionMutation.error ? errorMessage(actionMutation.error) : null} onConfirm={() => selected && actionMutation.mutate({ id: idOf(selected), action: 'forceLogout' })} />
      <ConfirmDialog open={modal === 'require2fa'} onClose={() => setModal(null)} title="Require 2FA?" description={`This marks ${textOf(selected, ['display_name', 'email'], 'this user')} for two-factor setup on their next secure access flow.`} confirmLabel="Require 2FA" guard="tenant" permission="staff.edit" loading={actionMutation.isPending} error={actionMutation.error ? errorMessage(actionMutation.error) : null} onConfirm={() => selected && actionMutation.mutate({ id: idOf(selected), action: 'require2fa' })} />
    </section>
  );
}
export function TenantStaffDashboardPage() {
  const query = useQuery({ queryKey: tenantQueryKeys.resource(tenantKey, 'staff-dashboard'), queryFn: tenantAccessApi.staff.dashboard });
  const payload = (query.data?.data.dashboard ?? {}) as Record<string, unknown>;
  const cards = flattenSummary((payload.cards as Record<string, unknown>) ?? {});
  return (
    <section className="enterprise-module-page">
      <PageHeader title="Staff Dashboard" description="Live HR summary from staff, attendance, leave, and document tables." />
      <div className="summary-grid">{cards.map((card) => <article className="summary-card" key={card.label}><span>{card.label}</span><strong>{String(card.value ?? '-')}</strong></article>)}</div>
      <RecordList title="Department and Status Charts" rows={flattenDashboardGroups((payload.charts as Record<string, unknown>) ?? {})} />
      <RecordList title="Pending Items" rows={flattenDashboardGroups((payload.pending as Record<string, unknown>) ?? {})} />
    </section>
  );
}

export function TenantStaffListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const query = usePagedQuery('staff', tenantAccessApi.staff.list, 10, statusFilter ? { employment_status: statusFilter } : undefined);
  const [selected, setSelected] = useState<TenantAccessRecord | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [hiddenColumnIds, setHiddenColumnIds] = useState<string[]>(['personal_email', 'mobile']);
  const [modal, setModal] = useState<ModalState>(null);
  const stats = (query.meta?.stats as Record<string, unknown> | undefined) ?? {};
  const deleteMutation = useMutation({
    mutationFn: ({ ids, reason }: { ids: string[]; reason?: string }) => ids.length === 1
      ? tenantAccessApi.staff.delete(ids[0])
      : tenantAccessApi.staff.bulkDelete(ids, reason),
    onSuccess: async () => {
      setSelected(null);
      setSelectedIds([]);
      setModal(null);
      await queryClient.invalidateQueries({ queryKey: tenantQueryKeys.resource(tenantKey, 'staff') });
    }
  });

  return (
    <section className="enterprise-module-page">
      <PageHeader
        title="Staff"
        description="Staff list with import, export, profile, access, and HR tabs."
        actions={<>
          <Link className="button button--secondary button--md" to="dashboard">Dashboard</Link>
          <Link className="button button--secondary button--md" to="grid">Grid</Link>
          <PermissionButton guard="tenant" permission="staff.create" type="button" variant="secondary" onClick={() => setModal('inviteStaff')}><UserPlus size={16} aria-hidden />Invite staff</PermissionButton>
          <PermissionButton guard="tenant" permission="staff.create" type="button" onClick={() => navigate('create')}><Plus size={16} aria-hidden />Create staff</PermissionButton>
        </>}
      />
      <StaffSummaryCards stats={stats} fallbackTotal={query.total} rows={query.rows} />
      <DataTable
        columns={staffColumns(
          (row, action) => { setSelected(row); setModal(action); },
          (row) => navigate(`${idOf(row)}`),
          (row) => navigate(`${idOf(row)}/edit`)
        )}
        data={query.rows}
        getRowId={idOf}
        loading={query.isLoading}
        error={query.error}
        searchValue={query.search}
        searchPlaceholder="Search staff..."
        onSearchChange={query.setSearch}
        hiddenColumnIds={hiddenColumnIds}
        onHiddenColumnIdsChange={setHiddenColumnIds}
        onOpenFilters={() => setModal('staffFilters')}
        onOpenColumns={() => setModal('staffColumns')}
        onOpenImport={() => setModal('staffImport')}
        onOpenExport={() => setModal('staffExport')}
        selectedRowIds={selectedIds}
        onSelectionChange={setSelectedIds}
        bulkActions={<PermissionButton guard="tenant" permission="staff.delete" type="button" variant="danger" size="sm" disabled={selectedIds.length === 0} onClick={() => setModal('bulkDeleteStaff')}><Trash2 size={15} aria-hidden />Delete selected</PermissionButton>}
        page={query.page}
        perPage={query.perPage}
        total={query.total}
        onPageChange={query.setPage}
        onPerPageChange={(value) => { query.setPerPage(value); query.setPage(1); setSelectedIds([]); }}
      />
      <StaffFiltersModal open={modal === 'staffFilters'} status={statusFilter} onStatusChange={(value) => { setStatusFilter(value); query.setPage(1); }} onClose={() => setModal(null)} />
      <InviteStaffModal open={modal === 'inviteStaff'} onClose={() => setModal(null)} />
      <StaffColumnsModal open={modal === 'staffColumns'} hiddenColumnIds={hiddenColumnIds} onChange={setHiddenColumnIds} onClose={() => setModal(null)} />


      <StaffAssignmentModal open={modal === 'assignRole'} staff={selected} type="role" onClose={() => setModal(null)} />
      <StaffAssignmentModal open={modal === 'assignTeam'} staff={selected} type="team" onClose={() => setModal(null)} />
      <StaffAssignmentModal open={modal === 'assignProject'} staff={selected} type="project" onClose={() => setModal(null)} />
      <StaffAssignmentModal open={modal === 'assignTask'} staff={selected} type="task" onClose={() => setModal(null)} />
      <StaffImportModal open={modal === 'staffImport'} onClose={() => setModal(null)} />
      <StaffExportModal open={modal === 'staffExport'} onClose={() => setModal(null)} />
      <ConfirmDialog
        open={modal === 'deleteStaff'}
        onClose={() => setModal(null)}
        title="Delete staff?"
        description={`This archives ${textOf(selected, ['display_name', 'employee_code'], 'this staff member')} and suspends any linked login user.`}
        confirmLabel="Delete"
        confirmTone="danger"
        typedConfirmation="delete"
        guard="tenant"
        permission="staff.delete"
        loading={deleteMutation.isPending}
        error={deleteMutation.error ? errorMessage(deleteMutation.error) : null}
        onConfirm={({ reason }) => selected && deleteMutation.mutate({ ids: [idOf(selected)], reason })}
      />
      <ConfirmDialog
        open={modal === 'bulkDeleteStaff'}
        onClose={() => setModal(null)}
        title="Delete selected staff?"
        description={`This archives ${selectedIds.length} selected staff record${selectedIds.length === 1 ? '' : 's'} and suspends linked login users.`}
        confirmLabel="Delete selected"
        confirmTone="danger"
        typedConfirmation="delete"
        guard="tenant"
        permission="staff.delete"
        loading={deleteMutation.isPending}
        error={deleteMutation.error ? errorMessage(deleteMutation.error) : null}
        onConfirm={({ reason }) => deleteMutation.mutate({ ids: selectedIds, reason })}
      />
    </section>
  );
}
export function TenantStaffGridPage() {
  const query = usePagedQuery('staff-grid', tenantAccessApi.staff.grid);
  return (
    <section className="enterprise-module-page">
            <PageHeader title="Staff Grid" description="Department/team grouped staff view." actions={<Link className="button button--secondary button--md" to="../staff">List</Link>} />
      {query.isLoading ? <div className="surface-state">Loading staff...</div> : null}
      {query.error ? <div className="surface-error" role="alert">{query.error}</div> : null}
      {!query.isLoading && !query.error && query.rows.length === 0 ? <div className="empty-state">No staff records found.</div> : null}
      <div className="settings-grid">
        {query.rows.map((staff) => (
          <article className="settings-panel" key={idOf(staff)}>
            <h2>{textOf(staff, ['display_name'], 'Staff')}</h2>
            <p>{textOf(staff, ['employee_code'], '-')} - {textOf(staff, ['department_name'], 'No department')}</p>
            <StatusBadge tone={statusTone(staff.status ?? staff.employment_status)}>{textOf(staff, ['employment_status', 'status'], 'active')}</StatusBadge>
            <Link className="button button--secondary button--sm" to={`../staff/${idOf(staff)}`}>Open</Link>
          </article>
        ))}
      </div>
    </section>
  );
}

export function TenantStaffCreatePage() {
  return <StaffEditorPage mode="create" />;
}

export function TenantStaffEditPage() {
  return <StaffEditorPage mode="edit" />;
}

function StaffEditorPage({ mode }: { mode: 'create' | 'edit' }) {
  const { tenantSlug, id = '' } = useParams();
  const navigate = useNavigate();
  const query = useQuery({ queryKey: tenantQueryKeys.detail(tenantKey, 'staff', id), queryFn: () => tenantAccessApi.staff.detail(id), enabled: mode === 'edit' && Boolean(id) });
  return (
    <section className="enterprise-module-page">
      <PageHeader title={mode === 'create' ? 'Create Staff' : 'Edit Staff'} actions={<Link className="button button--secondary button--md" to={TENANT_ROUTES.hrms.staff(tenantSlug)}><ArrowLeft size={16} aria-hidden />Back</Link>} />
            {mode === 'edit' && query.isLoading ? <div className="surface-state">Loading staff...</div> : null}
      {query.error ? <div className="surface-error" role="alert">{errorMessage(query.error)}</div> : null}
      {!query.isLoading && !query.error ? <StaffForm staff={query.data} onSaved={() => navigate(TENANT_ROUTES.hrms.staff(tenantSlug))} /> : null}
    </section>
  );
}

export function TenantStaffViewPage() {
  const { tenantSlug, id = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: tenantQueryKeys.detail(tenantKey, 'staff', id), queryFn: () => tenantAccessApi.staff.detail(id) });
  const rolesQuery = useQuery({ queryKey: tenantQueryKeys.related(tenantKey, 'staff', id, 'roles'), queryFn: () => tenantAccessApi.staff.roles(id), enabled: Boolean(id) });
  const teamsQuery = useQuery({ queryKey: tenantQueryKeys.related(tenantKey, 'staff', id, 'teams'), queryFn: () => tenantAccessApi.staff.teams(id), enabled: Boolean(id) });
  const projectsQuery = useQuery({ queryKey: tenantQueryKeys.related(tenantKey, 'staff', id, 'projects'), queryFn: () => tenantAccessApi.staff.projects(id), enabled: Boolean(id) });
  const tasksQuery = useQuery({ queryKey: tenantQueryKeys.related(tenantKey, 'staff', id, 'tasks'), queryFn: () => tenantAccessApi.staff.tasks(id), enabled: Boolean(id) });
  const [tab, setTab] = useState('profile');
  const [modal, setModal] = useState<ModalState>(null);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const staff = query.data;
  const deleteMutation = useMutation({ mutationFn: (reason?: string) => tenantAccessApi.staff.delete(id), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: tenantQueryKeys.resource(tenantKey, 'staff') }); navigate(TENANT_ROUTES.hrms.staff(tenantSlug)); } });
  return (
    <section className="enterprise-module-page">
      <PageHeader
        title={textOf(staff, ['display_name'], 'Staff')}
        description={`${textOf(staff, ['employee_code'], '-')} - ${textOf(staff, ['work_email', 'personal_email'], '-')}`}
        actions={<>
          <Link className="button button--secondary button--md" to=".."><ArrowLeft size={16} aria-hidden />Back</Link>
          <Link className="button button--secondary button--md" to="edit"><Edit3 size={16} aria-hidden />Edit</Link>
          <RowActionMenu
            label="Open staff actions"
            items={[
              { label: 'Assign/remove roles', onClick: () => setModal('assignRole') },
              { label: 'Assign/remove teams', onClick: () => setModal('assignTeam') },
              { label: 'Assign/remove projects', onClick: () => setModal('assignProject') },
              { label: 'Assign/remove tasks', onClick: () => setModal('assignTask') },
              { label: 'Open timeline', onClick: () => setTimelineOpen(true) },
              { label: 'Delete staff', danger: true, separatorBefore: true, onClick: () => setModal('deleteStaff') }
            ]}
          />
        </>}
      />
      <div className="summary-grid">
        <SummaryCard icon={<RefreshCw />} label="Status" value={textOf(staff, ['employment_status'], '-')} />
        <SummaryCard icon={<ShieldCheck />} label="Total Roles" value={String(rolesQuery.data?.data.roles.length ?? 0)} />
        <SummaryCard icon={<Users />} label="Total Teams" value={String(teamsQuery.data?.data.teams.length ?? 0)} />
        <SummaryCard icon={<ShieldCheck />} label="Total Projects" value={String(projectsQuery.data?.data.projects.length ?? 0)} />
        <SummaryCard icon={<ShieldCheck />} label="Total Tasks" value={String(tasksQuery.data?.data.tasks.length ?? 0)} />
      </div>
      <Tabs tabs={staffTabs.map((item) => ({ id: item.id, label: item.label }))} activeId={tab} onChange={setTab} ariaLabel="Staff tabs" />
      {tab === 'profile' ? <RecordDetails record={staff} loading={query.isLoading} /> : <StaffTabPanel staffId={id} tab={tab} onModal={setModal} />}
      <StaffAssignmentModal open={modal === 'assignRole'} staff={staff ?? null} type="role" onClose={() => setModal(null)} />
      <StaffAssignmentModal open={modal === 'assignTeam'} staff={staff ?? null} type="team" onClose={() => setModal(null)} />
      <StaffAssignmentModal open={modal === 'assignProject'} staff={staff ?? null} type="project" onClose={() => setModal(null)} />
      <StaffAssignmentModal open={modal === 'assignTask'} staff={staff ?? null} type="task" onClose={() => setModal(null)} />
      <StaffChildModal open={modal === 'bank'} staffId={id} resource="bank-accounts" title="Bank Account" onClose={() => setModal(null)} />
      <StaffChildModal open={modal === 'salary'} staffId={id} resource="salary-structures" title="Salary Structure" warning="Changing salary structures can affect payroll calculations from the effective date." onClose={() => setModal(null)} />
      <StaffChildModal open={modal === 'document'} staffId={id} resource="documents" title="Document" warning="Enable expiry reminders by entering an expiry date." onClose={() => setModal(null)} />
      <ConfirmDialog open={modal === 'deleteStaff'} onClose={() => setModal(null)} title="Delete staff?" description={`This archives ${textOf(staff, ['display_name', 'employee_code'], 'this staff member')} and suspends any linked login user.`} confirmLabel="Delete" confirmTone="danger" typedConfirmation="delete" guard="tenant" permission="staff.delete" loading={deleteMutation.isPending} error={deleteMutation.error ? errorMessage(deleteMutation.error) : null} onConfirm={({ reason }) => deleteMutation.mutate(reason)} />
      <StaffTimelineDrawer open={timelineOpen} staffId={id} onClose={() => setTimelineOpen(false)} />
    </section>
  );
}
function usePagedQuery(resource: string, queryFn: (query?: ApiQuery) => Promise<{ data: TenantAccessRecord[]; total: number; meta?: Record<string, unknown> }>, defaultPerPage = 25, filters?: Record<string, string>) {
  const [search, setSearchState] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(defaultPerPage);
  const cleanFilters = filters ? Object.fromEntries(Object.entries(filters).filter(([, value]) => value)) : undefined;
  const queryParams = createListQuery({ page, per_page: perPage, search: search || undefined, filter: cleanFilters });
  const query = useQuery({ queryKey: tenantQueryKeys.list(tenantKey, resource, queryParams), queryFn: () => queryFn(queryParams) });
  const setSearch = (value: string) => { setSearchState(value); setPage(1); };
  return { rows: query.data?.data ?? [], total: query.data?.total ?? 0, meta: query.data?.meta, isLoading: query.isLoading, error: query.isError ? errorMessage(query.error) : undefined, page, setPage, perPage, setPerPage, search, setSearch };
}

function RoleSummaryCards({ stats, fallbackTotal, rows }: { stats: Record<string, unknown>; fallbackTotal: number; rows: TenantAccessRecord[] }) {
  const total = Number(stats.total ?? fallbackTotal ?? rows.length);
  const active = Number(stats.active ?? rows.filter((row) => row.status === 'active').length);
  const inactive = Number(stats.inactive ?? rows.filter((row) => row.status === 'inactive').length);
  return (
    <div className="summary-grid">
      <SummaryCard icon={<ShieldCheck />} label="Total Roles" value={String(total)} />
      <SummaryCard icon={<RefreshCw />} label="Active" value={String(active)} />
      <SummaryCard icon={<Users />} label="Inactive" value={String(inactive)} />
    </div>
  );
}

function RoleFiltersModal({ open, status, onStatusChange, onClose }: { open: boolean; status: string; onStatusChange: (value: string) => void; onClose: () => void }) {
  return (
    <AppModal open={open} onClose={onClose} title="Role Filters" footer={<><Button type="button" variant="secondary" onClick={() => onStatusChange('')}>Reset</Button><Button type="button" onClick={onClose}>Apply</Button></>}>
      <label>
        <span>Status</span>
        <select value={status} onChange={(event) => onStatusChange(event.target.value)}>
          <option value="">All statuses</option>
          <option value="active">active</option>
          <option value="inactive">inactive</option>
        </select>
      </label>
    </AppModal>
  );
}

function TeamSummaryCards({ stats, fallbackTotal, rows }: { stats: Record<string, unknown>; fallbackTotal: number; rows: TenantAccessRecord[] }) {
  const total = Number(stats.total ?? fallbackTotal ?? rows.length);
  const active = Number(stats.active ?? rows.filter((row) => row.status === 'active').length);
  const inactive = Number(stats.inactive ?? rows.filter((row) => row.status === 'inactive').length);
  return (
    <div className="summary-grid">
      <SummaryCard icon={<Users />} label="Total Teams" value={String(total)} />
      <SummaryCard icon={<RefreshCw />} label="Active" value={String(active)} />
      <SummaryCard icon={<ShieldCheck />} label="Inactive" value={String(inactive)} />
    </div>
  );
}

function TeamFiltersModal({ open, status, onStatusChange, onClose }: { open: boolean; status: string; onStatusChange: (value: string) => void; onClose: () => void }) {
  return (
    <AppModal open={open} onClose={onClose} title="Team Filters" footer={<><Button type="button" variant="secondary" onClick={() => onStatusChange('')}>Reset</Button><Button type="button" onClick={onClose}>Apply</Button></>}>
      <label>
        <span>Status</span>
        <select value={status} onChange={(event) => onStatusChange(event.target.value)}>
          <option value="">All statuses</option>
          <option value="active">active</option>
          <option value="inactive">inactive</option>
        </select>
      </label>
    </AppModal>
  );
}

function TeamColumnsModal({ open, hiddenColumnIds, onChange, onClose }: { open: boolean; hiddenColumnIds: string[]; onChange: (ids: string[]) => void; onClose: () => void }) {
  const columns = ['name', 'code', 'department_name', 'office_name', 'lead_name', 'members_count', 'visibility', 'status'];
  const toggle = (id: string) => onChange(hiddenColumnIds.includes(id) ? hiddenColumnIds.filter((item) => item !== id) : [...hiddenColumnIds, id]);
  return (
    <AppModal open={open} onClose={onClose} title="Team Columns" footer={<Button type="button" onClick={onClose}>Done</Button>}>
      <div className="settings-list">
        {columns.map((column) => (
          <label key={column} className="check-row">
            <input type="checkbox" checked={!hiddenColumnIds.includes(column)} onChange={() => toggle(column)} />
            <span>{label(column)}</span>
          </label>
        ))}
      </div>
    </AppModal>
  );
}
function UserSummaryCards({ stats, fallbackTotal, rows }: { stats: Record<string, unknown>; fallbackTotal: number; rows: TenantAccessRecord[] }) {
  const total = Number(stats.total ?? fallbackTotal ?? rows.length);
  const active = Number(stats.active ?? rows.filter((row) => row.status === 'active').length);
  const inactive = Number(stats.inactive ?? rows.filter((row) => ['inactive', 'suspended'].includes(String(row.status))).length);
  const invited = Number(stats.invited ?? rows.filter((row) => row.status === 'invited').length);
  return (
    <div className="summary-grid">
      <SummaryCard icon={<Users />} label="Total Users" value={String(total)} />
      <SummaryCard icon={<RefreshCw />} label="Active" value={String(active)} />
      <SummaryCard icon={<ShieldCheck />} label="Inactive" value={String(inactive)} />
      <SummaryCard icon={<UserPlus />} label="Invited" value={String(invited)} />
    </div>
  );
}

function UserFiltersModal({ open, status, onStatusChange, onClose }: { open: boolean; status: string; onStatusChange: (value: string) => void; onClose: () => void }) {
  return (
    <AppModal open={open} onClose={onClose} title="User Filters" footer={<><Button type="button" variant="secondary" onClick={() => onStatusChange('')}>Reset</Button><Button type="button" onClick={onClose}>Apply</Button></>}>
      <label>
        <span>Status</span>
        <select value={status} onChange={(event) => onStatusChange(event.target.value)}>
          <option value="">All statuses</option>
          <option value="invited">invited</option>
          <option value="active">active</option>
          <option value="inactive">inactive</option>
          <option value="suspended">suspended</option>
        </select>
      </label>
    </AppModal>
  );
}

function UserColumnsModal({ open, hiddenColumnIds, onChange, onClose }: { open: boolean; hiddenColumnIds: string[]; onChange: (ids: string[]) => void; onClose: () => void }) {
  const columns = ['display_name', 'email', 'mobile', 'account_type', 'status', 'last_login_at'];
  const toggle = (id: string) => onChange(hiddenColumnIds.includes(id) ? hiddenColumnIds.filter((item) => item !== id) : [...hiddenColumnIds, id]);
  return (
    <AppModal open={open} onClose={onClose} title="User Columns" footer={<Button type="button" onClick={onClose}>Done</Button>}>
      <div className="settings-list">
        {columns.map((column) => (
          <label key={column} className="check-row">
            <input type="checkbox" checked={!hiddenColumnIds.includes(column)} onChange={() => toggle(column)} />
            <span>{label(column)}</span>
          </label>
        ))}
      </div>
    </AppModal>
  );
}
function StaffSummaryCards({ stats, fallbackTotal, rows }: { stats: Record<string, unknown>; fallbackTotal: number; rows: TenantAccessRecord[] }) {
  const total = Number(stats.total ?? fallbackTotal ?? rows.length);
  const active = Number(stats.active ?? rows.filter((row) => row.employment_status === 'active').length);
  const inactive = Number(stats.inactive ?? rows.filter((row) => row.employment_status === 'inactive').length);
  return (
    <div className="summary-grid">
      <SummaryCard icon={<Users />} label="Total Staff" value={String(total)} />
      <SummaryCard icon={<RefreshCw />} label="Active" value={String(active)} />
      <SummaryCard icon={<ShieldCheck />} label="Inactive" value={String(inactive)} />
    </div>
  );
}

function StaffFiltersModal({ open, status, onStatusChange, onClose }: { open: boolean; status: string; onStatusChange: (value: string) => void; onClose: () => void }) {
  return (
    <AppModal open={open} onClose={onClose} title="Staff Filters" footer={<><Button type="button" variant="secondary" onClick={() => onStatusChange('')}>Reset</Button><Button type="button" onClick={onClose}>Apply</Button></>}>
      <label>
        <span>Status</span>
        <select value={status} onChange={(event) => onStatusChange(event.target.value)}>
          <option value="">All statuses</option>
          <option value="active">active</option>
          <option value="inactive">inactive</option>
          <option value="on_leave">on_leave</option>
          <option value="terminated">terminated</option>
        </select>
      </label>
    </AppModal>
  );
}

function StaffColumnsModal({ open, hiddenColumnIds, onChange, onClose }: { open: boolean; hiddenColumnIds: string[]; onChange: (ids: string[]) => void; onClose: () => void }) {
  const columns = ['employee_code', 'display_name', 'work_email', 'personal_email', 'mobile', 'department_name', 'primary_team_name', 'employment_type', 'employment_status'];
  const toggle = (id: string) => onChange(hiddenColumnIds.includes(id) ? hiddenColumnIds.filter((item) => item !== id) : [...hiddenColumnIds, id]);
  return (
    <AppModal open={open} onClose={onClose} title="Staff Columns" footer={<Button type="button" onClick={onClose}>Done</Button>}>
      <div className="settings-list">
        {columns.map((column) => (
          <label key={column} className="check-row">
            <input type="checkbox" checked={!hiddenColumnIds.includes(column)} onChange={() => toggle(column)} />
            <span>{label(column)}</span>
          </label>
        ))}
      </div>
    </AppModal>
  );
}
function permissionIdsFromGroups(groups: GroupedPermissions) {
  return Object.values(groups).flat().map(idOf).filter(Boolean);
}

function countGroupedPermissions(groups: GroupedPermissions) {
  return Object.values(groups).reduce((total, rows) => total + rows.length, 0);
}

const roleTabs = [
  ['overview', 'Overview'],
  ['permissions', 'Permissions'],
  ['users', 'Users'],
  ['activity', 'Activity']
].map(([id, labelText]) => ({ id, label: labelText }));
const teamTabs = [
  ['overview', 'Overview'],
  ['members', 'Team members'],
  ['projects', 'Projects'],
  ['tasks', 'Tasks'],
  ['activity', 'Activity']
].map(([id, labelText]) => ({ id, label: labelText }));
function RoleModal({ open, role, onClose }: { open: boolean; role: TenantAccessRecord | null; onClose: () => void }) {
  return <AppModal open={open} onClose={onClose} title={role ? 'Edit Role' : 'Create Role'} guard="tenant" permission={role ? 'role.edit' : 'role.create'} size="lg"><RoleForm role={role ?? undefined} onSaved={onClose} onCancel={onClose} /></AppModal>;
}

function RoleForm({ role, onSaved, onCancel }: { role?: TenantAccessRecord; onSaved: () => void; onCancel?: () => void }) {
  const queryClient = useQueryClient();
  const permissions = useQuery({ queryKey: tenantQueryKeys.resource(tenantKey, 'permissions-grouped'), queryFn: tenantAccessApi.permissions.grouped });
  const [form, setForm] = useState(() => ({
    name: textOf(role, ['name']),
    display_name: textOf(role, ['display_name']),
    description: textOf(role, ['description']),
    status: textOf(role, ['status'], 'active'),
    audit_reason: ''
  }));
  const [permissionIds, setPermissionIds] = useState<string[]>(() => permissionIdsFromGroups((role?.permissions as GroupedPermissions) ?? {}));

  useEffect(() => {
    setForm({
      name: textOf(role, ['name']),
      display_name: textOf(role, ['display_name']),
      description: textOf(role, ['description']),
      status: textOf(role, ['status'], 'active'),
      audit_reason: ''
    });
    setPermissionIds(permissionIdsFromGroups((role?.permissions as GroupedPermissions) ?? {}));
  }, [role?.uuid]);

  const mutation = useMutation({
    mutationFn: () => {
      const payload = { ...form, guard_name: 'tenant', permission_ids: permissionIds };
      return role?.uuid ? tenantAccessApi.roles.update(role.uuid, payload) : tenantAccessApi.roles.create(payload);
    },
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: tenantQueryKeys.resource(tenantKey, 'roles') }); onSaved(); }
  });

  return (
    <form className="form-grid form-grid--two" onSubmit={(event) => { event.preventDefault(); mutation.mutate(); }}>
      <SimpleInput label="Name" value={form.name} onChange={(name) => setForm({ ...form, name })} />
      <SimpleInput label="Display Name" value={form.display_name} onChange={(display_name) => setForm({ ...form, display_name })} />
      <label>
        <span>Status</span>
        <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
          <option value="active">active</option>
          <option value="inactive">inactive</option>
        </select>
      </label>
      <label>
        <span>Guard Name</span>
        <select value="tenant" disabled>
          <option value="tenant">tenant</option>
        </select>
      </label>
      <label className="form-span-2">
        <span>Description</span>
        <textarea rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
      </label>
      <label className="form-span-2">
        <span>Audit Reason</span>
        <textarea rows={3} value={form.audit_reason} onChange={(event) => setForm({ ...form, audit_reason: event.target.value })} />
      </label>
      <div className="form-span-2">
        <h2>Permissions</h2>
        {permissions.isLoading ? <div className="surface-state">Loading permissions...</div> : null}
        <PermissionChecklist groups={permissions.data?.data.permissions ?? {}} selectedIds={permissionIds} onChange={setPermissionIds} />
      </div>
      {mutation.error ? <div className="surface-error form-span-2">{errorMessage(mutation.error)}</div> : null}
      <div className="surface-footer form-span-2"><Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button><Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Saving...' : 'Save'}</Button></div>
    </form>
  );
}

function CloneRoleModal({ open, role, onClose }: { open: boolean; role: TenantAccessRecord | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: '', display_name: '', copy_permissions: true, copy_description: true, status: 'inactive', audit_reason: '' });
  const mutation = useMutation({ mutationFn: () => tenantAccessApi.roles.clone(idOf(role), form), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: tenantQueryKeys.resource(tenantKey, 'roles') }); onClose(); } });
  return <AppModal open={open} onClose={onClose} title="Clone Role" guard="tenant" permission="role.create" footer={<ModalFooter onCancel={onClose} onSave={() => mutation.mutate()} loading={mutation.isPending} />}>{role ? <SimpleForm form={form} fields={['name', 'display_name', 'status', 'audit_reason']} onChange={setForm} error={mutation.error} /> : <div className="empty-state">Select a role first.</div>}</AppModal>;
}

function PermissionAssignDrawer({ open, target, record, onClose }: { open: boolean; target: 'role' | 'team'; record: TenantAccessRecord | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const recordId = idOf(record);
  const permissions = useQuery({ queryKey: tenantQueryKeys.resource(tenantKey, 'permissions-grouped'), queryFn: tenantAccessApi.permissions.grouped, enabled: open });
  const assignedPermissions = useQuery({
    queryKey: tenantQueryKeys.related(tenantKey, target === 'role' ? 'roles' : 'teams', recordId, 'assigned-permissions'),
    queryFn: () => target === 'role' ? tenantAccessApi.roles.permissions(recordId) : tenantAccessApi.teams.permissions(recordId),
    enabled: open && Boolean(recordId)
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!open) {
      setSelectedIds([]);
      return;
    }

    const assigned = assignedPermissions.data?.data.permissions ?? (record?.permissions as GroupedPermissions | undefined) ?? {};
    setSelectedIds(permissionIdsFromGroups(assigned));
  }, [open, recordId, assignedPermissions.data, record?.permissions]);

  const mutation = useMutation({
    mutationFn: () => target === 'role' ? tenantAccessApi.roles.replacePermissions(recordId, { permission_ids: selectedIds, audit_reason: 'Assigned from UI' }) : tenantAccessApi.teams.replacePermissions(recordId, { permission_ids: selectedIds }),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: tenantQueryKeys.all(tenantKey) }); onClose(); }
  });
  return (
    <AppDrawer open={open} onClose={onClose} title="Assign Permissions" guard="tenant" permission={target === 'role' ? 'role.assign_permissions' : 'team.edit'} size="lg" footer={<ModalFooter onCancel={onClose} onSave={() => mutation.mutate()} loading={mutation.isPending} />}>
      <p className="surface-state">Current assigned permissions are checked. Update the selection and save to apply changes.</p>
      {assignedPermissions.isLoading ? <div className="surface-state">Loading assigned permissions...</div> : null}
      <PermissionChecklist groups={permissions.data?.data.permissions ?? {}} selectedIds={selectedIds} onChange={setSelectedIds} />
      {mutation.error ? <div className="surface-error">{errorMessage(mutation.error)}</div> : null}
    </AppDrawer>
  );
}

function AssignUsersModal({ open, role, onClose }: { open: boolean; role: TenantAccessRecord | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const roleId = idOf(role);
  const users = useQuery({ queryKey: tenantQueryKeys.list(tenantKey, 'users-selector'), queryFn: () => tenantAccessApi.users.list({ per_page: 100 }), enabled: open });
  const assignedUsers = useQuery({ queryKey: tenantQueryKeys.related(tenantKey, 'roles', roleId, 'assigned-users'), queryFn: () => tenantAccessApi.roles.users(roleId), enabled: open && Boolean(roleId) });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!open) {
      setSelectedIds([]);
      return;
    }

    const assigned = assignedUsers.data?.data.users ?? (role?.users as TenantAccessRecord[] | undefined) ?? [];
    setSelectedIds(assigned.map(idOf).filter(Boolean));
  }, [open, roleId, assignedUsers.data, role?.users]);

  const mutation = useMutation({ mutationFn: () => tenantAccessApi.roles.replaceUsers(roleId, { user_ids: selectedIds, audit_reason: 'Assigned from UI' }), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: tenantQueryKeys.all(tenantKey) }); onClose(); } });
  return <AppModal open={open} onClose={onClose} title="Assign Users" guard="tenant" permission="role.edit" footer={<ModalFooter onCancel={onClose} onSave={() => mutation.mutate()} loading={mutation.isPending} />}><p className="surface-state">Current assigned users are checked. Update the selection and save to apply changes.</p>{assignedUsers.isLoading ? <div className="surface-state">Loading assigned users...</div> : null}<MultiRecordPicker label="Users" rows={users.data?.data ?? []} selectedIds={selectedIds} onChange={setSelectedIds} labelKeys={['display_name', 'email']} />{mutation.error ? <div className="surface-error">{errorMessage(mutation.error)}</div> : null}</AppModal>;
}

function TeamForm({ team, onSaved, onCancel }: { team?: TenantAccessRecord; onSaved: () => void; onCancel?: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(() => ({ name: textOf(team, ['name']), code: textOf(team, ['code']), description: textOf(team, ['description']), email: textOf(team, ['email']), phone: textOf(team, ['phone']), visibility: textOf(team, ['visibility'], 'tenant'), status: textOf(team, ['status'], 'active') }));
  const mutation = useMutation({ mutationFn: () => team?.uuid ? tenantAccessApi.teams.update(team.uuid, form) : tenantAccessApi.teams.create(form), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: tenantQueryKeys.resource(tenantKey, 'teams') }); onSaved(); } });
  return <SimpleForm form={form} fields={['name', 'code', 'description', 'email', 'phone', 'visibility', 'status']} onChange={setForm} onSubmit={() => mutation.mutate()} onCancel={onCancel} loading={mutation.isPending} error={mutation.error} />;
}

function TeamMemberModal({ open, team, onClose }: { open: boolean; team: TenantAccessRecord | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const teamId = idOf(team);
  const users = useQuery({ queryKey: tenantQueryKeys.list(tenantKey, 'users-selector'), queryFn: () => tenantAccessApi.users.list({ per_page: 100 }), enabled: open });
  const staff = useQuery({ queryKey: tenantQueryKeys.list(tenantKey, 'staff-selector'), queryFn: () => tenantAccessApi.staff.list({ per_page: 100 }), enabled: open });
  const teamRoles = useQuery({ queryKey: tenantQueryKeys.list(tenantKey, 'team-roles-selector'), queryFn: () => tenantAccessApi.teamRoles.list({ per_page: 100 }), enabled: open });
  const members = useQuery({ queryKey: tenantQueryKeys.related(tenantKey, 'teams', teamId, 'members'), queryFn: () => tenantAccessApi.teams.members(teamId), enabled: open && Boolean(teamId) });
  const [form, setForm] = useState({ user_id: '', staff_id: '', team_role_id: '', member_type: 'member', allocation_percent: '100', status: 'active' });
  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: tenantQueryKeys.related(tenantKey, 'teams', teamId, 'members') });
    await queryClient.invalidateQueries({ queryKey: tenantQueryKeys.resource(tenantKey, 'teams') });
  };
  const mutation = useMutation({ mutationFn: () => tenantAccessApi.teams.addMembers(teamId, { members: [{ ...form, allocation_percent: Number(form.allocation_percent) }] }), onSuccess: async () => { setForm({ user_id: '', staff_id: '', team_role_id: '', member_type: 'member', allocation_percent: '100', status: 'active' }); await refresh(); } });
  const removeMutation = useMutation({ mutationFn: (memberId: string) => tenantAccessApi.teams.removeMember(teamId, memberId, { audit_reason: 'Removed from team UI' }), onSuccess: refresh });
  return (
    <AppModal open={open} onClose={onClose} title="Assign/Remove Team Members" guard="tenant" permission="team.assign" size="lg" footer={<><Button type="button" variant="secondary" onClick={onClose}>Done</Button><Button type="button" onClick={() => mutation.mutate()} disabled={mutation.isPending || (!form.user_id && !form.staff_id)}>{mutation.isPending ? 'Assigning...' : 'Assign member'}</Button></>}>
      <div className="form-grid form-grid--two">
        <SelectInput label="Login user" value={form.user_id} onChange={(user_id) => setForm({ ...form, user_id })} options={users.data?.data ?? []} labelKeys={['display_name', 'email']} />
        <SelectInput label="Staff profile" value={form.staff_id} onChange={(staff_id) => setForm({ ...form, staff_id })} options={staff.data?.data ?? []} labelKeys={['display_name', 'employee_code']} />
        <SelectInput label="Team role" value={form.team_role_id} onChange={(team_role_id) => setForm({ ...form, team_role_id })} options={teamRoles.data?.data ?? []} labelKeys={['name', 'code']} />
        <SimpleInput label="Member Type" value={form.member_type} onChange={(member_type) => setForm({ ...form, member_type })} />
        <SimpleInput label="Allocation Percent" value={form.allocation_percent} onChange={(allocation_percent) => setForm({ ...form, allocation_percent })} />
        <SimpleInput label="Status" value={form.status} onChange={(status) => setForm({ ...form, status })} />
      </div>
      {mutation.error ? <div className="surface-error">{errorMessage(mutation.error)}</div> : null}
      {removeMutation.error ? <div className="surface-error">{errorMessage(removeMutation.error)}</div> : null}
      <RecordActionList
        title="Current Members"
        rows={members.data?.data.members ?? []}
        columns={['staff_name', 'user_name', 'team_role_name', 'member_type', 'status']}
        actionLabel="Remove"
        actionTone="danger"
        onAction={(row) => removeMutation.mutate(idOf(row))}
        loading={removeMutation.isPending}
      />
    </AppModal>
  );
}

function TeamAssignmentModal({ open, team, type, onClose }: { open: boolean; team: TenantAccessRecord | null; type: 'project' | 'task'; onClose: () => void }) {
  const queryClient = useQueryClient();
  const teamId = idOf(team);
  const options = useQuery({ queryKey: tenantQueryKeys.list(tenantKey, `${type}-selector`), queryFn: () => type === 'project' ? tenantOperationsApi.projects.list({ per_page: 100 }) : tenantOperationsApi.tasks.list({ per_page: 100 }), enabled: open });
  const projectsAssigned = useQuery({ queryKey: tenantQueryKeys.related(tenantKey, 'teams', teamId, 'projects'), queryFn: () => tenantAccessApi.teams.projects(teamId), enabled: open && Boolean(teamId) && type === 'project' });
  const tasksAssigned = useQuery({ queryKey: tenantQueryKeys.related(tenantKey, 'teams', teamId, 'tasks'), queryFn: () => tenantAccessApi.teams.tasks(teamId), enabled: open && Boolean(teamId) && type === 'task' });
  const [assignableId, setAssignableId] = useState('');
  const [assignmentRole, setAssignmentRole] = useState(type === 'project' ? 'owner' : 'assignee');
  const rows = type === 'project' ? projectsAssigned.data?.data.projects ?? [] : tasksAssigned.data?.data.tasks ?? [];
  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: tenantQueryKeys.related(tenantKey, 'teams', teamId, `${type}s`) });
    await queryClient.invalidateQueries({ queryKey: tenantQueryKeys.detail(tenantKey, 'teams', teamId) });
  };
  const mutation = useMutation({ mutationFn: () => tenantAccessApi.teams.assignRecord(teamId, { assignable_type: type, assignable_id: assignableId, assignment_role: assignmentRole, status: 'active' }), onSuccess: async () => { setAssignableId(''); await refresh(); } });
  const releaseMutation = useMutation({ mutationFn: (assignmentId: string | number) => tenantAccessApi.teams.releaseAssignment(teamId, assignmentId), onSuccess: refresh });
  return (
    <AppModal open={open} onClose={onClose} title={`Assign/Remove ${type === 'project' ? 'Projects' : 'Tasks'}`} guard="tenant" permission="team.assign" size="lg" footer={<><Button type="button" variant="secondary" onClick={onClose}>Done</Button><Button type="button" onClick={() => mutation.mutate()} disabled={mutation.isPending || !assignableId}>{mutation.isPending ? 'Assigning...' : `Assign ${type}`}</Button></>}>
      <div className="form-grid form-grid--two">
        <SelectInput label={type === 'project' ? 'Project' : 'Task'} value={assignableId} onChange={setAssignableId} options={options.data?.data ?? []} labelKeys={type === 'project' ? ['name', 'project_number'] : ['title', 'task_number']} />
        <SimpleInput label="Assignment Role" value={assignmentRole} onChange={setAssignmentRole} />
      </div>
      {mutation.error ? <div className="surface-error">{errorMessage(mutation.error)}</div> : null}
      {releaseMutation.error ? <div className="surface-error">{errorMessage(releaseMutation.error)}</div> : null}
      <RecordActionList
        title={type === 'project' ? 'Assigned Projects' : 'Assigned Tasks'}
        rows={rows}
        columns={type === 'project' ? ['project_number', 'name', 'assignment_role', 'assignment_status'] : ['task_number', 'title', 'due_at', 'assignment_status']}
        actionLabel="Remove"
        actionTone="danger"
        onAction={(row) => releaseMutation.mutate(row.assignment_id as string | number)}
        loading={releaseMutation.isPending}
      />
    </AppModal>
  );
}
function TeamExportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [format, setFormat] = useState('csv');
  const mutation = useMutation({ mutationFn: () => tenantAccessApi.teams.export({ format, scope: 'filtered' }) });
  return <AppModal open={open} onClose={onClose} title="Export Teams" guard="tenant" permission="team.view" footer={<ModalFooter onCancel={onClose} onSave={() => mutation.mutate()} loading={mutation.isPending} label="Queue Export" />}><SimpleInput label="Format" value={format} onChange={setFormat} />{mutation.data ? <JobResult data={mutation.data.data} /> : null}</AppModal>;
}

function InviteStaffModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const roles = useQuery({
    queryKey: tenantQueryKeys.list(tenantKey, 'roles-selector'),
    queryFn: () => tenantAccessApi.roles.list({ per_page: 100 }),
    enabled: open
  });
  const [form, setForm] = useState({
    employee_code: '',
    first_name: '',
    last_name: '',
    display_name: '',
    work_email: '',
    mobile: ''
  });
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const mutation = useMutation({
    mutationFn: () => tenantAccessApi.staff.create({ ...form, create_user: true, role_ids: roleIds }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tenantQueryKeys.resource(tenantKey, 'staff') });
      setForm({ employee_code: '', first_name: '', last_name: '', display_name: '', work_email: '', mobile: '' });
      setRoleIds([]);
      onClose();
    }
  });

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Invite Staff"
      guard="tenant"
      permission="staff.create"
      size="lg"
      footer={<ModalFooter onCancel={onClose} onSave={() => mutation.mutate()} loading={mutation.isPending} label="Send invitation" />}
    >
      <p className="surface-state">This creates the staff record and its linked tenant login together.</p>
      <SimpleForm
        form={form}
        fields={['employee_code', 'first_name', 'last_name', 'display_name', 'work_email', 'mobile']}
        onChange={setForm}
        error={mutation.error}
      />
      <MultiRecordPicker label="Initial roles" rows={roles.data?.data ?? []} selectedIds={roleIds} onChange={setRoleIds} labelKeys={['display_name', 'name']} />
    </AppModal>
  );
}
function InviteUserModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const roles = useQuery({ queryKey: tenantQueryKeys.list(tenantKey, 'roles-selector'), queryFn: () => tenantAccessApi.roles.list({ per_page: 100 }), enabled: open });
  const [form, setForm] = useState({ first_name: '', last_name: '', display_name: '', email: '', mobile: '', account_type: 'staff', status: 'invited' });
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const mutation = useMutation({ mutationFn: () => tenantAccessApi.users.invite({ ...form, role_ids: roleIds }), onSuccess: async () => queryClient.invalidateQueries({ queryKey: tenantQueryKeys.resource(tenantKey, 'users') }) });
  return <AppModal open={open} onClose={onClose} title="Invite User" guard="tenant" permission="staff.create" footer={<ModalFooter onCancel={onClose} onSave={() => mutation.mutate()} loading={mutation.isPending} />}><SimpleForm form={form} fields={['first_name', 'last_name', 'display_name', 'email', 'mobile', 'account_type', 'status']} onChange={setForm} error={mutation.error} /><MultiRecordPicker label="Roles" rows={roles.data?.data ?? []} selectedIds={roleIds} onChange={setRoleIds} labelKeys={['display_name', 'name']} />{mutation.data ? <TokenPreview label="Temporary password" value={String((mutation.data.data as Record<string, unknown>).temporary_password ?? 'Only returned in local environment.')} /> : null}</AppModal>;
}

function AssignUserRoleModal({ open, user, onClose }: { open: boolean; user: TenantAccessRecord | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const roles = useQuery({ queryKey: tenantQueryKeys.list(tenantKey, 'roles-selector'), queryFn: () => tenantAccessApi.roles.list({ per_page: 100 }), enabled: open });
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const mutation = useMutation({ mutationFn: () => tenantAccessApi.users.replaceRoles(idOf(user), roleIds), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: tenantQueryKeys.resource(tenantKey, 'users') }); onClose(); } });
  return <AppModal open={open} onClose={onClose} title="Assign Roles" guard="tenant" permission="role.edit" footer={<ModalFooter onCancel={onClose} onSave={() => mutation.mutate()} loading={mutation.isPending} />}><MultiRecordPicker label="Roles" rows={roles.data?.data ?? []} selectedIds={roleIds} onChange={setRoleIds} labelKeys={['display_name', 'name']} />{mutation.error ? <div className="surface-error">{errorMessage(mutation.error)}</div> : null}</AppModal>;
}

function StaffAssignmentModal({ open, staff, type, onClose }: { open: boolean; staff: TenantAccessRecord | null; type: 'role' | 'team' | 'project' | 'task'; onClose: () => void }) {
  const queryClient = useQueryClient();
  const staffId = idOf(staff);
  const options = useQuery({
    queryKey: tenantQueryKeys.list(tenantKey, `staff-${type}-selector`),
    queryFn: () => type === 'role'
      ? tenantAccessApi.roles.list({ per_page: 100 })
      : type === 'team'
        ? tenantAccessApi.teams.list({ per_page: 100 })
        : type === 'project'
          ? tenantOperationsApi.projects.list({ per_page: 100 })
          : tenantOperationsApi.tasks.list({ per_page: 100 }),
    enabled: open
  });
  const assigned = useQuery({
    queryKey: tenantQueryKeys.related(tenantKey, 'staff', staffId, `${type}s`),
    queryFn: async () => {
      const response = type === 'role'
        ? await tenantAccessApi.staff.roles(staffId)
        : type === 'team'
          ? await tenantAccessApi.staff.teams(staffId)
          : type === 'project'
            ? await tenantAccessApi.staff.projects(staffId)
            : await tenantAccessApi.staff.tasks(staffId);
      return response.data as Record<string, TenantAccessRecord[]>;
    },
    enabled: open && Boolean(staffId)
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!open) {
      setSelectedIds([]);
      return;
    }

    const rows = assigned.data?.[`${type}s`] ?? [];
    const ids = rows.map((row) => type === 'team' ? String(row.team_uuid ?? idOf(row)) : type === 'project' ? String(row.project_uuid ?? idOf(row)) : idOf(row)).filter(Boolean);
    setSelectedIds(ids);
  }, [open, type, assigned.data]);

  const mutation = useMutation({
    mutationFn: () => type === 'role'
      ? tenantAccessApi.staff.replaceRoles(staffId, selectedIds)
      : type === 'team'
        ? tenantAccessApi.staff.replaceTeams(staffId, selectedIds)
        : type === 'project'
          ? tenantAccessApi.staff.replaceProjects(staffId, selectedIds)
          : tenantAccessApi.staff.replaceTasks(staffId, selectedIds),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tenantQueryKeys.resource(tenantKey, 'staff') });
      await queryClient.invalidateQueries({ queryKey: tenantQueryKeys.detail(tenantKey, 'staff', staffId) });
      await queryClient.invalidateQueries({ queryKey: tenantQueryKeys.related(tenantKey, 'staff', staffId, `${type}s`) });
      onClose();
    }
  });
  const title = type === 'role' ? 'Assign/Remove Roles' : type === 'team' ? 'Assign/Remove Teams' : type === 'project' ? 'Assign/Remove Projects' : 'Assign/Remove Tasks';
  const permission = type === 'role' ? 'role.edit' : type === 'team' ? 'team.assign' : type === 'project' ? 'project.edit' : 'task.assign';
  const labelKeys = type === 'role' ? ['display_name', 'name'] : type === 'team' ? ['name', 'code'] : type === 'project' ? ['name', 'project_number'] : ['title', 'task_number'];
  return (
    <AppModal open={open} onClose={onClose} title={title} guard="tenant" permission={permission} size="lg" footer={<ModalFooter onCancel={onClose} onSave={() => mutation.mutate()} loading={mutation.isPending} />}>
      <p className="surface-state">Current assignments are checked. Update the selection and save to apply changes.</p>
      {assigned.isLoading ? <div className="surface-state">Loading current assignments...</div> : null}
      <MultiRecordPicker label={type === 'role' ? 'Roles' : type === 'team' ? 'Teams' : type === 'project' ? 'Projects' : 'Tasks'} rows={options.data?.data ?? []} selectedIds={selectedIds} onChange={setSelectedIds} labelKeys={labelKeys} />
      {mutation.error ? <div className="surface-error">{errorMessage(mutation.error)}</div> : null}
    </AppModal>
  );
}
function ResetPasswordModal({ open, user, onClose }: { open: boolean; user: TenantAccessRecord | null; onClose: () => void }) {
  const mutation = useMutation({ mutationFn: () => tenantAccessApi.users.resetPassword(idOf(user)) });
  return <AppModal open={open} onClose={onClose} title="Reset Password" guard="tenant" permission="staff.edit" footer={<ModalFooter onCancel={onClose} onSave={() => mutation.mutate()} loading={mutation.isPending} label="Reset" />}><p>Reset password for {textOf(user, ['display_name', 'email'], 'selected user')}.</p>{mutation.data ? <TokenPreview label="Temporary password" value={String(mutation.data.data.temporary_password ?? 'Only returned in local environment.')} /> : null}</AppModal>;
}

function StaffModal({ open, staff, onClose }: { open: boolean; staff: TenantAccessRecord | null; onClose: () => void }) {
  return <AppModal open={open} onClose={onClose} title={staff ? 'Edit Staff' : 'Create Staff'} guard="tenant" permission={staff ? 'staff.edit' : 'staff.create'} size="lg"><StaffForm staff={staff ?? undefined} onSaved={onClose} /></AppModal>;
}

function StaffForm({ staff, onSaved }: { staff?: TenantAccessRecord; onSaved: () => void }) {
  const queryClient = useQueryClient();
  const roles = useQuery({ queryKey: tenantQueryKeys.list(tenantKey, 'roles-selector'), queryFn: () => tenantAccessApi.roles.list({ per_page: 100 }), enabled: !staff });
  const initialForm = (record?: TenantAccessRecord) => ({
    employee_code: textOf(record, ['employee_code']),
    first_name: textOf(record, ['first_name']),
    last_name: textOf(record, ['last_name']),
    display_name: textOf(record, ['display_name']),
    date_of_birth: textOf(record, ['date_of_birth']),
    gender: textOf(record, ['gender']),
    personal_email: textOf(record, ['personal_email']),
    mobile: textOf(record, ['mobile']),
    work_email: textOf(record, ['work_email']),
    employment_type: textOf(record, ['employment_type'], 'full_time'),
    joining_date: textOf(record, ['joining_date']),
    exit_date: textOf(record, ['exit_date']),
    employment_status: textOf(record, ['employment_status'], 'active')
  });
  const [form, setForm] = useState(() => initialForm(staff));
  const [step, setStep] = useState(0);
  const [createLogin, setCreateLogin] = useState(false);
  const [roleIds, setRoleIds] = useState<string[]>([]);
  useEffect(() => { setForm(initialForm(staff)); setStep(0); }, [staff?.uuid]);
  const mutation = useMutation({
    mutationFn: () => staff?.uuid ? tenantAccessApi.staff.update(staff.uuid, form) : tenantAccessApi.staff.create({ ...form, create_user: createLogin, role_ids: roleIds }),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: tenantQueryKeys.resource(tenantKey, 'staff') }); onSaved(); }
  });
  const steps = ['Basic details', 'Employment', 'Access'];
  const update = (field: keyof ReturnType<typeof initialForm>, value: string) => setForm((current) => ({ ...current, [field]: value }));

  return (
    <form className="settings-stack" onSubmit={(event) => { event.preventDefault(); if (step < steps.length - 1) { setStep((current) => current + 1); return; } mutation.mutate(); }}>
      <nav className="tabs" aria-label="Staff form steps">
        {steps.map((name, index) => <button key={name} type="button" className="tabs__item" aria-selected={index === step} aria-current={index === step ? 'step' : undefined} onClick={() => setStep(index)}>{index + 1}. {name}</button>)}
      </nav>
      {step === 0 ? <section className="settings-panel">
        <h2>Basic / Personal Details</h2>
        <div className="form-grid form-grid--two">
          {(['employee_code', 'first_name', 'last_name', 'display_name', 'date_of_birth', 'gender', 'personal_email', 'mobile'] as const).map((field) => <SimpleInput key={field} label={label(field)} value={form[field]} onChange={(value) => update(field, value)} />)}
        </div>
      </section> : null}
      {step === 1 ? <section className="settings-panel">
        <h2>Employment Details</h2>
        <div className="form-grid form-grid--two">
          {(['work_email', 'employment_type', 'joining_date', 'exit_date', 'employment_status'] as const).map((field) => <SimpleInput key={field} label={label(field)} value={form[field]} onChange={(value) => update(field, value)} />)}
        </div>
        <p className="permission-state permission-state--compact">Department, designation, office, team, and reporting manager fields will use tenant selectors when those lookup APIs are enabled.</p>
      </section> : null}
      {step === 2 ? <section className="settings-panel">
        <h2>Access</h2>
        <label className="check-row"><input type="checkbox" checked={createLogin} onChange={(event) => setCreateLogin(event.target.checked)} /><span>Create linked login user and send invitation</span></label>
        {createLogin ? <MultiRecordPicker label="Initial roles" rows={roles.data?.data ?? []} selectedIds={roleIds} onChange={setRoleIds} labelKeys={['display_name', 'name']} /> : <p className="permission-state permission-state--compact">You can invite or manage login access later from the staff detail page.</p>}
      </section> : null}
      {mutation.error ? <div className="surface-error" role="alert">{errorMessage(mutation.error)}</div> : null}
      <div className="surface-footer">
        <Button type="button" variant="secondary" onClick={onSaved}>Cancel</Button>
        {step > 0 ? <Button type="button" variant="secondary" onClick={() => setStep((current) => current - 1)}>Previous</Button> : null}
        {step < steps.length - 1 ? <Button type="submit">Next</Button> : <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Saving...' : 'Save staff'}</Button>}
      </div>
    </form>
  );
}
function StaffImportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const files = useQuery({ queryKey: tenantQueryKeys.list(tenantKey, 'files-selector'), queryFn: () => tenantAccessApi.files.list({ per_page: 100 }), enabled: open });
  const [form, setForm] = useState({ file_id: '', mapping: '', duplicate_strategy: 'skip' });
  const mutation = useMutation({ mutationFn: () => tenantAccessApi.staff.import({ file_id: form.file_id || undefined, mapping: parseJson(form.mapping), options: { duplicate_strategy: form.duplicate_strategy } }) });
  return (
    <AppModal open={open} onClose={onClose} title="Staff Import Wizard" guard="tenant" permission="staff.import" footer={<ModalFooter onCancel={onClose} onSave={() => mutation.mutate()} loading={mutation.isPending} label="Queue Import" />}>
      <div className="form-grid form-grid--two">
        <SelectInput label="Import file" value={form.file_id} onChange={(file_id) => setForm({ ...form, file_id })} options={files.data?.data ?? []} labelKeys={['original_name', 'name', 'path']} />
        <SimpleInput label="Duplicate Strategy" value={form.duplicate_strategy} onChange={(duplicate_strategy) => setForm({ ...form, duplicate_strategy })} />
        <SimpleInput label="Mapping JSON" value={form.mapping} onChange={(mapping) => setForm({ ...form, mapping })} />
      </div>
      {mutation.error ? <div className="surface-error">{errorMessage(mutation.error)}</div> : null}
      {mutation.data ? <JobResult data={mutation.data.data} /> : null}
    </AppModal>
  );
}

function StaffExportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [format, setFormat] = useState('csv');
  const mutation = useMutation({ mutationFn: () => tenantAccessApi.staff.export({ format, scope: 'filtered' }) });
  return <AppModal open={open} onClose={onClose} title="Staff Export" guard="tenant" permission="staff.export" footer={<ModalFooter onCancel={onClose} onSave={() => mutation.mutate()} loading={mutation.isPending} label="Queue Export" />}><SimpleInput label="Format" value={format} onChange={setFormat} />{mutation.data ? <JobResult data={mutation.data.data} /> : null}</AppModal>;
}

function StaffTabPanel({ staffId, tab, onModal }: { staffId: string; tab: string; onModal: (modal: ModalState) => void }) {
  const query = useQuery({ queryKey: tenantQueryKeys.related(tenantKey, 'staff', staffId, tab), queryFn: async (): Promise<any> => tab === 'activity' ? tenantAccessApi.staff.activity(staffId) : tenantAccessApi.staff.tab(staffId, tab), enabled: Boolean(staffId) });
  const data = tab === 'activity' ? query.data?.data.activities : query.data?.data.data;
  const rows = Array.isArray(data) ? data : [];
  const objectData = data && !Array.isArray(data) && typeof data === 'object' ? data as Record<string, unknown> : null;
  return (
    <section className="settings-panel">
      <div className="surface-actions">
        {tab === 'bank-details' ? <PermissionButton guard="tenant" permission="staff.manage_bank" type="button" onClick={() => onModal('bank')}><Plus size={16} aria-hidden />Bank Account</PermissionButton> : null}
        {tab === 'salary-structure' ? <PermissionButton guard="tenant" permission="staff.manage_salary" type="button" onClick={() => onModal('salary')}><Plus size={16} aria-hidden />Salary</PermissionButton> : null}
        {tab === 'documents' ? <PermissionButton guard="tenant" permission="staff.edit" type="button" onClick={() => onModal('document')}><Plus size={16} aria-hidden />Document</PermissionButton> : null}
      </div>
      {query.isLoading ? <div className="surface-state">Loading tab data...</div> : null}
      {query.error ? <div className="surface-error" role="alert">{errorMessage(query.error)}</div> : null}
      {objectData ? Object.entries(objectData).map(([key, value]) => <RecordList key={key} title={label(key)} rows={Array.isArray(value) ? value as TenantAccessRecord[] : [value as TenantAccessRecord]} />) : <RecordList title={label(tab)} rows={rows} />}
    </section>
  );
}

function StaffChildModal({ open, staffId, resource, title, warning, onClose }: { open: boolean; staffId: string; resource: string; title: string; warning?: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const files = useQuery({ queryKey: tenantQueryKeys.list(tenantKey, 'files-selector'), queryFn: () => tenantAccessApi.files.list({ per_page: 100 }), enabled: open && resource === 'documents' });
  const fields = resource === 'bank-accounts' ? ['account_holder_name', 'bank_name', 'account_number', 'ifsc_code', 'is_primary'] : resource === 'salary-structures' ? ['effective_from', 'effective_to', 'annual_ctc', 'monthly_gross', 'currency'] : ['file_id', 'document_number', 'expiry_date'];
  const [form, setForm] = useState<Record<string, string>>({});
  const mutation = useMutation({ mutationFn: () => tenantAccessApi.staff.childCreate(staffId, resource, normalizeForm(form)), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: tenantQueryKeys.detail(tenantKey, 'staff', staffId) }); await queryClient.invalidateQueries({ queryKey: tenantQueryKeys.related(tenantKey, 'staff', staffId, resource === 'bank-accounts' ? 'bank-details' : resource === 'salary-structures' ? 'salary-structure' : 'documents') }); onClose(); } });
  return (
    <AppModal open={open} onClose={onClose} title={title} guard="tenant" permission={resource === 'bank-accounts' ? 'staff.manage_bank' : resource === 'salary-structures' ? 'staff.manage_salary' : 'staff.edit'} footer={<ModalFooter onCancel={onClose} onSave={() => mutation.mutate()} loading={mutation.isPending} />}>
      <div className="form-grid form-grid--two">
        {fields.map((field) => field === 'file_id'
          ? <SelectInput key={field} label="File" value={form.file_id ?? ''} onChange={(file_id) => setForm({ ...form, file_id })} options={files.data?.data ?? []} labelKeys={['original_name', 'name', 'path']} />
          : <SimpleInput key={field} label={label(field)} value={String(form[field] ?? '')} onChange={(value) => setForm({ ...form, [field]: value })} />)}
      </div>
      {mutation.error ? <div className="surface-error">{errorMessage(mutation.error)}</div> : null}
      {resource === 'bank-accounts' && form.account_number ? <p className="surface-state">Masked preview: {mask(form.account_number)}</p> : null}
      {warning ? <p className="permission-state permission-state--compact">{warning}</p> : null}
    </AppModal>
  );
}

function PhotoModal({ open, staff, onClose }: { open: boolean; staff: TenantAccessRecord | null; onClose: () => void }) {
  return <AppModal open={open} onClose={onClose} title="Profile Photo Upload/Crop" guard="tenant" permission="staff.edit" footer={<Button type="button" variant="secondary" onClick={onClose}>Close</Button>}><div className="empty-state"><h2>Upload API placeholder</h2><p>Staff has no profile photo column. Use files/attachments once upload storage endpoints are enabled for staff photos.</p><p>Selected staff: {textOf(staff, ['display_name'], 'Staff')}</p></div></AppModal>;
}

function StaffTimelineDrawer({ open, staffId, onClose }: { open: boolean; staffId: string; onClose: () => void }) {
  const query = useQuery({ queryKey: tenantQueryKeys.related(tenantKey, 'staff', staffId, 'activity'), queryFn: () => tenantAccessApi.staff.activity(staffId), enabled: open });
  return <AppDrawer open={open} onClose={onClose} title="Staff Timeline" guard="tenant" permission="activity_log.view" size="lg"><RecordList title="Activity" rows={query.data?.data.activities ?? []} /></AppDrawer>;
}

function SimpleForm<T extends Record<string, unknown>>({ form, fields, onChange, onSubmit, onCancel, loading, error }: { form: T; fields: string[]; onChange: (form: T) => void; onSubmit?: () => void; onCancel?: () => void; loading?: boolean; error?: unknown }) {
  const submit = (event: FormEvent) => { event.preventDefault(); onSubmit?.(); };
  return (
    <form className="form-grid form-grid--two" onSubmit={submit}>
      {fields.map((field) => <SimpleInput key={field} label={label(field)} value={String(form[field] ?? '')} onChange={(value) => onChange({ ...form, [field]: value })} />)}
      {error ? <div className="surface-error">{errorMessage(error)}</div> : null}
      {onSubmit ? <div className="surface-footer">{onCancel ? <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button> : null}<Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button></div> : null}
    </form>
  );
}

function SimpleInput({ label: inputLabel, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label><span>{inputLabel}</span><input value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

function SelectInput({
  label: inputLabel,
  value,
  onChange,
  options,
  labelKeys
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: TenantAccessRecord[];
  labelKeys: string[];
}) {
  return (
    <label>
      <span>{inputLabel}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Select {inputLabel.toLowerCase()}</option>
        {options.map((option) => (
          <option key={idOf(option)} value={idOf(option)}>
            {recordLabel(option, labelKeys)}
          </option>
        ))}
      </select>
    </label>
  );
}

function ModalFooter({ onCancel, onSave, loading, label: saveLabel = 'Save' }: { onCancel: () => void; onSave: () => void; loading?: boolean; label?: string }) {
  return <><Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button><Button type="button" onClick={onSave} disabled={loading}>{loading ? 'Working...' : saveLabel}</Button></>;
}

function AssignedPermissionsList({ groups }: { groups: GroupedPermissions }) {
  const rows = Object.entries(groups).flatMap(([module, permissions]) => permissions.map((permission) => ({ ...permission, module })));
  return (
    <section className="settings-panel">
      <h2>Assigned Permissions</h2>
      {rows.length === 0 ? <div className="empty-state">No permissions assigned to this role.</div> : (
        <DataTable
          columns={genericColumns(['module', 'display_name', 'name', 'status'])}
          data={rows}
          getRowId={idOf}
          total={rows.length}
          showToolbar={false}
          showPagination={false}
        />
      )}
    </section>
  );
}

function AssignedUsersList({ users }: { users: TenantAccessRecord[] }) {
  return (
    <section className="settings-panel">
      <h2>Assigned Users</h2>
      {users.length === 0 ? <div className="empty-state">No users assigned to this role.</div> : (
        <DataTable
          columns={genericColumns(['display_name', 'email', 'account_type', 'status'])}
          data={users}
          getRowId={idOf}
          total={users.length}
          showToolbar={false}
          showPagination={false}
        />
      )}
    </section>
  );
}
function PermissionGroups({ groups }: { groups: GroupedPermissions }) {
  const entries = Object.entries(groups);
  if (entries.length === 0) return <div className="empty-state">No permissions returned.</div>;
  return <section className="settings-grid">{entries.map(([module, rows]) => <article className="settings-panel" key={module}><h2>{label(module)}</h2><div className="chip-list">{rows.map((permission) => <span key={idOf(permission)}>{textOf(permission, ['display_name', 'name'], 'Permission')}</span>)}</div></article>)}</section>;
}

function PermissionChecklist({ groups, selectedIds, onChange }: { groups: GroupedPermissions; selectedIds: string[]; onChange: (ids: string[]) => void }) {
  const entries = Object.entries(groups);
  if (entries.length === 0) return <div className="empty-state">No permissions returned.</div>;
  const toggle = (id: string) => onChange(selectedIds.includes(id) ? selectedIds.filter((item) => item !== id) : [...selectedIds, id]);
  return (
    <section className="settings-grid">
      {entries.map(([module, permissions]) => (
        <article className="settings-panel" key={module}>
          <h2>{label(module)}</h2>
          <div className="settings-list">
            {permissions.map((permission) => (
              <label key={idOf(permission)} className="check-row">
                <input type="checkbox" checked={selectedIds.includes(idOf(permission))} onChange={() => toggle(idOf(permission))} />
                <span>{recordLabel(permission, ['display_name', 'name'])}</span>
              </label>
            ))}
          </div>
        </article>
      ))}
    </section>
  );
}

function MultiRecordPicker({
  label: pickerLabel,
  rows,
  selectedIds,
  onChange,
  labelKeys
}: {
  label: string;
  rows: TenantAccessRecord[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  labelKeys: string[];
}) {
  const toggle = (id: string) => onChange(selectedIds.includes(id) ? selectedIds.filter((item) => item !== id) : [...selectedIds, id]);
  return (
    <section className="settings-panel">
      <h2>{pickerLabel}</h2>
      {rows.length === 0 ? <div className="empty-state">No {pickerLabel.toLowerCase()} returned.</div> : null}
      <div className="settings-list">
        {rows.map((row) => (
          <label key={idOf(row)} className="check-row">
            <input type="checkbox" checked={selectedIds.includes(idOf(row))} onChange={() => toggle(idOf(row))} />
            <span>{recordLabel(row, labelKeys)}</span>
          </label>
        ))}
      </div>
    </section>
  );
}

function RecordDetails({ record, loading }: { record?: TenantAccessRecord; loading?: boolean }) {
  if (loading) return <div className="surface-state">Loading...</div>;
  if (!record) return <div className="empty-state">No record returned.</div>;
  return <DetailGrid record={scrub(record)} />;
}

function RecordList({ title, rows }: { title: string; rows: TenantAccessRecord[] }) {
  return <section className="settings-panel"><h2>{title}</h2>{rows.length === 0 ? <div className="empty-state">No records returned.</div> : <DataTable columns={genericColumns(Object.keys(rows[0] ?? {}).slice(0, 6))} data={rows} getRowId={idOf} total={rows.length} />}</section>;
}

function DetailGrid({ record }: { record: Record<string, unknown> }) {
  const entries = Object.entries(record).filter(([key, value]) => value !== null && value !== undefined && value !== '' && !['id', 'tenant_id', 'deleted_at'].includes(key));
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

function TokenPreview({ label: tokenLabel, value }: { label: string; value: string }) {
  return <label><span>{tokenLabel}</span><code className="token-preview">{value}</code><small>Copy once. This value is not shown again after closing.</small></label>;
}

function TeamImportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return <AppModal open={open} onClose={onClose} title="Import Teams" guard="tenant" permission="team.create" footer={<Button type="button" onClick={onClose}>Close</Button>}><div className="empty-state">Team import queues are not enabled for this API yet.</div></AppModal>;
}

function RecordActionList({ title, rows, columns, actionLabel, actionTone = 'secondary', onAction, loading }: { title: string; rows: TenantAccessRecord[]; columns: string[]; actionLabel: string; actionTone?: 'secondary' | 'danger'; onAction: (row: TenantAccessRecord) => void; loading?: boolean }) {
  return (
    <section className="settings-panel">
      <h2>{title}</h2>
      {rows.length === 0 ? <div className="empty-state">No records returned.</div> : (
        <DataTable
          columns={[...genericColumns(columns), actionColumn((row) => <Button type="button" size="sm" variant={actionTone} onClick={() => onAction(row)} disabled={loading}>{actionLabel}</Button>)]}
          data={rows}
          getRowId={idOf}
          total={rows.length}
          showToolbar={false}
          showPagination={false}
        />
      )}
    </section>
  );
}
function JobResult({ data }: { data: unknown }) {
  const job = data && typeof data === 'object' && 'job' in data ? (data as { job?: Record<string, unknown> }).job : data;
  return (
    <div className="surface-state">
      Job queued{job && typeof job === 'object' ? `: ${textOf(job, ['uuid', 'id', 'queue', 'status'], 'pending')}` : '.'}
      <br />
      Run <code>php artisan queue:work --queue=exports,imports,default</code>
    </div>
  );
}

function roleColumns(onAction: (row: TenantAccessRecord, action: ModalState) => void, onOpen: (row: TenantAccessRecord) => void, onEdit: (row: TenantAccessRecord) => void): DataTableColumn<TenantAccessRecord>[] {
  return [...genericColumns(['display_name', 'name', 'permissions_count', 'users_count', 'status']), actionColumn((row) => (
    <RowActionMenu
      label={`Open actions for ${textOf(row, ['display_name', 'name'], 'role')}`}
      items={[
        { label: 'View', onClick: () => onOpen(row) },
        { label: 'Edit', onClick: () => onEdit(row) },
        { label: 'Assign/remove permissions', onClick: () => onAction(row, 'assignPermissions') },
        { label: 'Assign/remove users', onClick: () => onAction(row, 'assignUsers') },
        { label: 'Delete role', danger: true, separatorBefore: true, onClick: () => onAction(row, 'deleteRole') }
      ]}
    />
  ))];
}

function teamColumns(onAction: (row: TenantAccessRecord, action: ModalState) => void, onOpen: (row: TenantAccessRecord) => void, onEdit: (row: TenantAccessRecord) => void): DataTableColumn<TenantAccessRecord>[] {
  return [...genericColumns(['name', 'code', 'department_name', 'office_name', 'lead_name', 'members_count', 'status']), actionColumn((row) => (
    <RowActionMenu
      label={`Open actions for ${textOf(row, ['name', 'code'], 'team')}`}
      items={[
        { label: 'View', onClick: () => onOpen(row) },
        { label: 'Edit', onClick: () => onEdit(row) },
        { label: 'Assign/remove team members', onClick: () => onAction(row, 'addMember') },
        { label: 'Assign/remove projects', onClick: () => onAction(row, 'assignProject') },
        { label: 'Assign/remove tasks', onClick: () => onAction(row, 'assignTask') },
        { label: 'Delete team', danger: true, separatorBefore: true, onClick: () => onAction(row, 'deleteTeam') }
      ]}
    />
  ))];
}

function userColumns(onModal: (row: TenantAccessRecord, action: ModalState) => void, onStatus: (row: TenantAccessRecord, action: 'activate' | 'suspend') => void): DataTableColumn<TenantAccessRecord>[] {
  return [...genericColumns(['display_name', 'email', 'mobile', 'account_type', 'status', 'last_login_at']), actionColumn((row) => (
    <RowActionMenu
      label={`Open actions for ${textOf(row, ['display_name', 'email'], 'user')}`}
      items={[
        { label: 'Roles', onClick: () => onModal(row, 'assignRole') },
        { label: 'Reset password', onClick: () => onModal(row, 'resetPassword') },
        { label: 'Force logout', onClick: () => onModal(row, 'forceLogout') },
        { label: 'Require 2FA', onClick: () => onModal(row, 'require2fa') },
        { label: 'Activate', separatorBefore: true, onClick: () => onStatus(row, 'activate') },
        { label: 'Suspend', danger: true, onClick: () => onStatus(row, 'suspend') }
      ]}
    />
  ))];
}
function staffColumns(onAction: (row: TenantAccessRecord, action: ModalState) => void, onOpen: (row: TenantAccessRecord) => void, onEdit?: (row: TenantAccessRecord) => void): DataTableColumn<TenantAccessRecord>[] {
  return [...genericColumns(['employee_code', 'display_name', 'work_email', 'personal_email', 'mobile', 'department_name', 'primary_team_name', 'employment_type', 'employment_status']), actionColumn((row) => (
    <RowActionMenu
      label={`Open actions for ${textOf(row, ['display_name', 'employee_code'], 'staff')}`}
      items={[
        { label: 'View', onClick: () => onOpen(row) },
        { label: 'Edit', onClick: () => onEdit ? onEdit(row) : onAction(row, 'edit') },
        { label: 'Assign/remove role', onClick: () => onAction(row, 'assignRole') },
        { label: 'Assign/remove team', onClick: () => onAction(row, 'assignTeam') },
        { label: 'Assign/remove projects', onClick: () => onAction(row, 'assignProject') },
        { label: 'Assign/remove tasks', onClick: () => onAction(row, 'assignTask') },
        { label: 'Delete staff', danger: true, separatorBefore: true, onClick: () => onAction(row, 'deleteStaff') }
      ]}
    />
  ))];
}
function genericColumns(keys: string[]): DataTableColumn<TenantAccessRecord>[] {
  return keys.map((key) => ({ id: key, header: label(key), accessor: (row) => printable(row[key]), cell: (row) => key.includes('status') ? <StatusBadge tone={statusTone(row[key])}>{printable(row[key])}</StatusBadge> : printable(row[key]) }));
}

function actionColumn(cell: (row: TenantAccessRecord) => ReactNode): DataTableColumn<TenantAccessRecord> {
  return { id: 'actions', header: 'Actions', enableHiding: false, cell: (row) => <div className="inline-actions">{cell(row)}</div> };
}

const staffTabs = [
  ['profile', 'Profile'], ['user-access', 'User Access'], ['teams', 'Teams'], ['documents', 'Documents'], ['bank-details', 'Bank Details'], ['salary-structure', 'Salary Structure'], ['leave-history', 'Leave History'], ['attendance', 'Attendance'], ['payroll', 'Payroll'], ['projects-tasks', 'Projects/Tasks'], ['assets', 'Assets'], ['certifications', 'Certifications'], ['appraisals', 'Appraisals'], ['training', 'Training'], ['notes', 'Notes'], ['files', 'Files'], ['activity', 'Activity']
].map(([id, labelText]) => ({ id, label: labelText }));

function flattenSummary(payload: Record<string, unknown>) {
  return Object.entries(payload).map(([key, value]) => ({ label: label(key), value }));
}

function flattenDashboardGroups(payload: Record<string, unknown>): TenantAccessRecord[] {
  return Object.entries(payload).flatMap(([group, value]) => Array.isArray(value) ? value.map((row) => ({ group: label(group), ...(row as TenantAccessRecord) })) : []);
}

function idOf(record?: TenantAccessRecord | null) {
  return String(record?.uuid ?? record?.id ?? '');
}

function textOf(record: unknown, keys: string[], fallback = '') {
  if (!record || typeof record !== 'object') return fallback;
  const payload = record as Record<string, unknown>;
  for (const key of keys) {
    const value = payload[key];
    if (value !== null && value !== undefined && value !== '') return String(value);
  }
  return fallback;
}

function printable(value: unknown) {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'object') return displayValue(value);
  return String(value);
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '-';
  if (Array.isArray(value)) return `${value.length} item${value.length === 1 ? '' : 's'}`;
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return textOf(record, ['display_name', 'name', 'title', 'email', 'status', 'uuid', 'id'], 'Details available');
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

function recordLabel(record: TenantAccessRecord, keys: string[]) {
  const primary = textOf(record, keys, textOf(record, ['uuid', 'id'], 'Record'));
  const secondary = textOf(record, ['email', 'code', 'employee_code', 'status']);
  return secondary && secondary !== primary ? `${primary} (${secondary})` : primary;
}

function label(value: string) {
  return value.replace(/[-_]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function statusTone(value: unknown): 'neutral' | 'success' | 'warning' | 'danger' | 'info' {
  const status = String(value ?? '').toLowerCase();
  if (['active', 'approved', 'completed', 'present'].includes(status)) return 'success';
  if (['pending', 'invited', 'planned'].includes(status)) return 'warning';
  if (['inactive', 'suspended', 'rejected', 'failed'].includes(status)) return 'danger';
  return 'neutral';
}

function split(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function parseJson(value: string) {
  if (!value.trim()) return {};
  try { return JSON.parse(value) as Record<string, unknown>; } catch { return {}; }
}

function normalizeForm(form: Record<string, string>) {
  return Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value === '' ? null : ['is_primary'].includes(key) ? value === 'true' : value]));
}

function mask(value: string) {
  return value.length <= 4 ? '****' : `${'*'.repeat(Math.max(0, value.length - 4))}${value.slice(-4)}`;
}

function scrub(record: TenantAccessRecord) {
  const hidden = new Set(['password', 'temporary_password', 'account_number_encrypted', 'remember_token']);
  return Object.fromEntries(Object.entries(record).filter(([key]) => !hidden.has(key)));
}

function errorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Request failed.';
}











