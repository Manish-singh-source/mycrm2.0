import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Camera,
  Copy,
  Download,
  Plus,
  RefreshCw,
  ShieldCheck,
  UserPlus,
  Users
} from 'lucide-react';

import { ApiError } from '@/lib/api/apiError';
import type { ApiQuery } from '@/lib/api/apiTypes';
import { createListQuery } from '@/lib/api/listQuery';
import { tenantQueryKeys } from '@/features/tenant/api/tenantQueryKeys';
import { tenantAccessApi, type GroupedPermissions, type TenantAccessRecord } from '@/features/tenant/api/tenantAccessApi';
import { TENANT_ROUTES } from '@/features/tenant/routes/tenantRoutes';
import { DataTable, type DataTableColumn } from '@/shared/components/data-table';
import { AppDrawer } from '@/shared/components/drawer';
import { PageHeader, StatusBadge, Tabs } from '@/shared/components/layout';
import { AppModal } from '@/shared/components/modal';
import { Button, PermissionButton } from '@/shared/components/ui';

const tenantKey = 'current';

type ModalState =
  | null
  | 'create'
  | 'edit'
  | 'cloneRole'
  | 'assignPermissions'
  | 'assignUsers'
  | 'addMember'
  | 'assignRecord'
  | 'settings'
  | 'inviteUser'
  | 'assignRole'
  | 'resetPassword'
  | 'staffImport'
  | 'staffExport'
  | 'bank'
  | 'salary'
  | 'document'
  | 'photo';

export function TenantRolesListPage() {
  const navigate = useNavigate();
  const query = usePagedQuery('roles', tenantAccessApi.roles.list);
  const [selected, setSelected] = useState<TenantAccessRecord | null>(null);
  const [modal, setModal] = useState<ModalState>(null);

  return (
    <section className="enterprise-module-page">
      <PageHeader
        title="Roles"
        description="Tenant roles with permission assignment and user membership."
        actions={<PermissionButton guard="tenant" permission="role.create" type="button" onClick={() => setModal('create')}><Plus size={16} aria-hidden />Role</PermissionButton>}
      />
      <DataTable
        columns={roleColumns((row, action) => { setSelected(row); setModal(action); }, (row) => navigate(`${idOf(row)}`))}
        data={query.rows}
        getRowId={idOf}
        loading={query.isLoading}
        error={query.error}
        searchValue={query.search}
        onSearchChange={query.setSearch}
        page={query.page}
        perPage={25}
        total={query.total}
        onPageChange={query.setPage}
      />
      <RoleModal open={modal === 'create' || modal === 'edit'} role={modal === 'edit' ? selected : null} onClose={() => setModal(null)} />
      <CloneRoleModal open={modal === 'cloneRole'} role={selected} onClose={() => setModal(null)} />
      <PermissionAssignDrawer open={modal === 'assignPermissions'} target="role" record={selected} onClose={() => setModal(null)} />
      <AssignUsersModal open={modal === 'assignUsers'} role={selected} onClose={() => setModal(null)} />
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
  return (
    <section className="enterprise-module-page">
      <PageHeader title={mode === 'create' ? 'Create Role' : 'Edit Role'} />
      <RoleForm
        role={query.data}
        onSaved={() => navigate(TENANT_ROUTES.accessControl.roles(tenantSlug))}
      />
    </section>
  );
}

export function TenantRoleViewPage() {
  const { id = '' } = useParams();
  const query = useQuery({ queryKey: tenantQueryKeys.detail(tenantKey, 'roles', id), queryFn: () => tenantAccessApi.roles.detail(id) });
  const role = query.data;
  const [modal, setModal] = useState<ModalState>(null);
  return (
    <section className="enterprise-module-page">
      <PageHeader
        title={textOf(role, ['display_name', 'name'], 'Role')}
        description={textOf(role, ['description'], 'Tenant role details.')}
        actions={<><Button type="button" variant="secondary" onClick={() => setModal('cloneRole')}><Copy size={16} aria-hidden />Clone</Button><PermissionButton guard="tenant" permission="role.assign_permissions" type="button" onClick={() => setModal('assignPermissions')}><ShieldCheck size={16} aria-hidden />Permissions</PermissionButton><Button type="button" variant="secondary" onClick={() => setModal('assignUsers')}><Users size={16} aria-hidden />Users</Button></>}
      />
      <RecordDetails record={role} loading={query.isLoading} />
      <PermissionGroups groups={(role?.permissions as GroupedPermissions) ?? {}} />
      <RecordList title="Assigned Users" rows={(role?.users as TenantAccessRecord[]) ?? []} />
      <CloneRoleModal open={modal === 'cloneRole'} role={role ?? null} onClose={() => setModal(null)} />
      <PermissionAssignDrawer open={modal === 'assignPermissions'} target="role" record={role ?? null} onClose={() => setModal(null)} />
      <AssignUsersModal open={modal === 'assignUsers'} role={role ?? null} onClose={() => setModal(null)} />
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
        perPage={25}
        total={query.total}
        onPageChange={query.setPage}
      />
    </section>
  );
}

export function TenantTeamsListPage() {
  const navigate = useNavigate();
  const query = usePagedQuery('teams', tenantAccessApi.teams.list);
  const [selected, setSelected] = useState<TenantAccessRecord | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  return (
    <section className="enterprise-module-page">
      <PageHeader
        title="Teams"
        description="Team structure, members, permissions, settings, and assignments."
        actions={<><PermissionButton guard="tenant" permission="team.create" type="button" onClick={() => setModal('create')}><Plus size={16} aria-hidden />Team</PermissionButton><Button type="button" variant="secondary" onClick={() => setModal('staffExport')}><Download size={16} aria-hidden />Export</Button></>}
      />
      <DataTable
        columns={teamColumns((row, action) => { setSelected(row); setModal(action); }, (row) => navigate(`${idOf(row)}`))}
        data={query.rows}
        getRowId={idOf}
        loading={query.isLoading}
        error={query.error}
        searchValue={query.search}
        onSearchChange={query.setSearch}
        page={query.page}
        perPage={25}
        total={query.total}
        onPageChange={query.setPage}
      />
      <TeamModal open={modal === 'create' || modal === 'edit'} team={modal === 'edit' ? selected : null} onClose={() => setModal(null)} />
      <TeamExportModal open={modal === 'staffExport'} onClose={() => setModal(null)} />
      <PermissionAssignDrawer open={modal === 'assignPermissions'} target="team" record={selected} onClose={() => setModal(null)} />
      <TeamMemberModal open={modal === 'addMember'} team={selected} onClose={() => setModal(null)} />
      <AssignRecordModal open={modal === 'assignRecord'} team={selected} onClose={() => setModal(null)} />
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
  return (
    <section className="enterprise-module-page">
      <PageHeader title={mode === 'create' ? 'Create Team' : 'Edit Team'} />
      <TeamForm team={query.data} onSaved={() => navigate(TENANT_ROUTES.accessControl.teams(tenantSlug))} />
    </section>
  );
}

export function TenantTeamViewPage() {
  const { id = '' } = useParams();
  const query = useQuery({ queryKey: tenantQueryKeys.detail(tenantKey, 'teams', id), queryFn: () => tenantAccessApi.teams.detail(id) });
  const membersQuery = useQuery({ queryKey: tenantQueryKeys.related(tenantKey, 'teams', id, 'members'), queryFn: () => tenantAccessApi.teams.members(id), enabled: Boolean(id) });
  const assignmentsQuery = useQuery({ queryKey: tenantQueryKeys.related(tenantKey, 'teams', id, 'assignments'), queryFn: () => tenantAccessApi.teams.assignments(id), enabled: Boolean(id) });
  const permissionsQuery = useQuery({ queryKey: tenantQueryKeys.related(tenantKey, 'teams', id, 'permissions'), queryFn: () => tenantAccessApi.teams.permissions(id), enabled: Boolean(id) });
  const settingsQuery = useQuery({ queryKey: tenantQueryKeys.related(tenantKey, 'teams', id, 'settings'), queryFn: () => tenantAccessApi.teams.settings(id), enabled: Boolean(id) });
  const [modal, setModal] = useState<ModalState>(null);
  return (
    <section className="enterprise-module-page">
      <PageHeader
        title={textOf(query.data, ['name'], 'Team')}
        description={textOf(query.data, ['description'], 'Team detail.')}
        actions={<><Button type="button" variant="secondary" onClick={() => setModal('addMember')}><UserPlus size={16} aria-hidden />Member</Button><PermissionButton guard="tenant" permission="team.edit" type="button" variant="secondary" onClick={() => setModal('assignPermissions')}><ShieldCheck size={16} aria-hidden />Permissions</PermissionButton><Button type="button" onClick={() => setModal('assignRecord')}><Plus size={16} aria-hidden />Assign</Button></>}
      />
      <RecordDetails record={query.data} loading={query.isLoading} />
      <PermissionGroups groups={permissionsQuery.data?.data.permissions ?? {}} />
      <RecordList title="Members" rows={membersQuery.data?.data.members ?? []} />
      <RecordList title="Settings" rows={settingsQuery.data?.data.settings ?? []} />
      <RecordList title="Assignments" rows={assignmentsQuery.data?.data.assignments ?? []} />
      <PermissionAssignDrawer open={modal === 'assignPermissions'} target="team" record={query.data ?? null} onClose={() => setModal(null)} />
      <TeamMemberModal open={modal === 'addMember'} team={query.data ?? null} onClose={() => setModal(null)} />
      <AssignRecordModal open={modal === 'assignRecord'} team={query.data ?? null} onClose={() => setModal(null)} />
    </section>
  );
}

export function TenantUsersPage() {
  const queryClient = useQueryClient();
  const query = usePagedQuery('users', tenantAccessApi.users.list);
  const [selected, setSelected] = useState<TenantAccessRecord | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  const statusMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'activate' | 'suspend' }) =>
      action === 'activate' ? tenantAccessApi.users.activate(id) : tenantAccessApi.users.suspend(id),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: tenantQueryKeys.resource(tenantKey, 'users') })
  });

  return (
    <section className="enterprise-module-page">
      <PageHeader title="Tenant Users" description="Invite, update access, roles, and account status." actions={<PermissionButton guard="tenant" permission="staff.create" type="button" onClick={() => setModal('inviteUser')}><UserPlus size={16} aria-hidden />Invite</PermissionButton>} />
      <DataTable
        columns={userColumns((row, action) => { setSelected(row); setModal(action); }, (row, action) => statusMutation.mutate({ id: idOf(row), action }))}
        data={query.rows}
        getRowId={idOf}
        loading={query.isLoading}
        error={query.error}
        searchValue={query.search}
        onSearchChange={query.setSearch}
        page={query.page}
        perPage={25}
        total={query.total}
        onPageChange={query.setPage}
      />
      <InviteUserModal open={modal === 'inviteUser'} onClose={() => setModal(null)} />
      <AssignUserRoleModal open={modal === 'assignRole'} user={selected} onClose={() => setModal(null)} />
      <ResetPasswordModal open={modal === 'resetPassword'} user={selected} onClose={() => setModal(null)} />
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
  const query = usePagedQuery('staff', tenantAccessApi.staff.list);
  const [selected, setSelected] = useState<TenantAccessRecord | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  return (
    <section className="enterprise-module-page">
      <PageHeader
        title="Staff"
        description="Staff list with import, export, profile, access, and HR tabs."
        actions={<><Link className="button button--secondary button--md" to="dashboard">Staff Dashboard</Link><Link className="button button--secondary button--md" to="grid">Grid</Link><PermissionButton guard="tenant" permission="staff.create" type="button" onClick={() => setModal('create')}><Plus size={16} aria-hidden />Staff</PermissionButton></>}
      />
      <DataTable
        columns={staffColumns((row, action) => { setSelected(row); setModal(action); }, (row) => navigate(`${idOf(row)}`))}
        data={query.rows}
        getRowId={idOf}
        loading={query.isLoading}
        error={query.error}
        searchValue={query.search}
        onSearchChange={query.setSearch}
        onOpenImport={() => setModal('staffImport')}
        onOpenExport={() => setModal('staffExport')}
        page={query.page}
        perPage={25}
        total={query.total}
        onPageChange={query.setPage}
      />
      <StaffModal open={modal === 'create' || modal === 'edit'} staff={modal === 'edit' ? selected : null} onClose={() => setModal(null)} />
      <StaffImportModal open={modal === 'staffImport'} onClose={() => setModal(null)} />
      <StaffExportModal open={modal === 'staffExport'} onClose={() => setModal(null)} />
      <PhotoModal open={modal === 'photo'} staff={selected} onClose={() => setModal(null)} />
    </section>
  );
}

export function TenantStaffGridPage() {
  const query = usePagedQuery('staff-grid', tenantAccessApi.staff.grid);
  return (
    <section className="enterprise-module-page">
      <PageHeader title="Staff Grid" description="Department/team grouped staff view." actions={<Link className="button button--secondary button--md" to="../staff">List</Link>} />
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
      <PageHeader title={mode === 'create' ? 'Create Staff' : 'Edit Staff'} />
      <StaffForm staff={query.data} onSaved={() => navigate(TENANT_ROUTES.hrms.staff(tenantSlug))} />
    </section>
  );
}

export function TenantStaffViewPage() {
  const { id = '' } = useParams();
  const query = useQuery({ queryKey: tenantQueryKeys.detail(tenantKey, 'staff', id), queryFn: () => tenantAccessApi.staff.detail(id) });
  const [tab, setTab] = useState('profile');
  const [modal, setModal] = useState<ModalState>(null);
  const [timelineOpen, setTimelineOpen] = useState(false);
  return (
    <section className="enterprise-module-page">
      <PageHeader
        title={textOf(query.data, ['display_name'], 'Staff')}
        description={`${textOf(query.data, ['employee_code'], '-')} - ${textOf(query.data, ['work_email', 'personal_email'], '-')}`}
        actions={<><Button type="button" variant="secondary" onClick={() => setModal('photo')}><Camera size={16} aria-hidden />Photo</Button><Button type="button" variant="secondary" onClick={() => setTimelineOpen(true)}><RefreshCw size={16} aria-hidden />Timeline</Button><Link className="button button--secondary button--md" to="edit">Edit</Link></>}
      />
      <Tabs tabs={staffTabs.map((item) => ({ id: item.id, label: item.label }))} activeId={tab} onChange={setTab} ariaLabel="Staff tabs" />
      {tab === 'profile' ? <RecordDetails record={query.data} loading={query.isLoading} /> : <StaffTabPanel staffId={id} tab={tab} onModal={setModal} />}
      <StaffChildModal open={modal === 'bank'} staffId={id} resource="bank-accounts" title="Bank Account" onClose={() => setModal(null)} />
      <StaffChildModal open={modal === 'salary'} staffId={id} resource="salary-structures" title="Salary Structure" warning="Changing salary structures can affect payroll calculations from the effective date." onClose={() => setModal(null)} />
      <StaffChildModal open={modal === 'document'} staffId={id} resource="documents" title="Document" warning="Enable expiry reminders by entering an expiry date." onClose={() => setModal(null)} />
      <PhotoModal open={modal === 'photo'} staff={query.data ?? null} onClose={() => setModal(null)} />
      <StaffTimelineDrawer open={timelineOpen} staffId={id} onClose={() => setTimelineOpen(false)} />
    </section>
  );
}

function usePagedQuery(resource: string, queryFn: (query?: ApiQuery) => Promise<{ data: TenantAccessRecord[]; total: number }>) {
  const [search, setSearchState] = useState('');
  const [page, setPage] = useState(1);
  const queryParams = createListQuery({ page, per_page: 25, search: search || undefined });
  const query = useQuery({ queryKey: tenantQueryKeys.list(tenantKey, resource, queryParams), queryFn: () => queryFn(queryParams) });
  const setSearch = (value: string) => { setSearchState(value); setPage(1); };
  return { rows: query.data?.data ?? [], total: query.data?.total ?? 0, isLoading: query.isLoading, error: query.isError ? errorMessage(query.error) : undefined, page, setPage, search, setSearch };
}

function RoleModal({ open, role, onClose }: { open: boolean; role: TenantAccessRecord | null; onClose: () => void }) {
  return <AppModal open={open} onClose={onClose} title={role ? 'Edit Role' : 'Create Role'} guard="tenant" permission={role ? 'role.edit' : 'role.create'} size="lg"><RoleForm role={role ?? undefined} onSaved={onClose} /></AppModal>;
}

function RoleForm({ role, onSaved }: { role?: TenantAccessRecord; onSaved: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(() => ({ name: textOf(role, ['name']), display_name: textOf(role, ['display_name']), description: textOf(role, ['description']), status: textOf(role, ['status'], 'active'), guard_name: textOf(role, ['guard_name'], 'tenant'), audit_reason: '' }));
  const mutation = useMutation({
    mutationFn: () => role?.uuid ? tenantAccessApi.roles.update(role.uuid, form) : tenantAccessApi.roles.create(form),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: tenantQueryKeys.resource(tenantKey, 'roles') }); onSaved(); }
  });
  return <SimpleForm form={form} fields={['name', 'display_name', 'description', 'status', 'guard_name', 'audit_reason']} onChange={setForm} onSubmit={() => mutation.mutate()} loading={mutation.isPending} error={mutation.error} />;
}

function CloneRoleModal({ open, role, onClose }: { open: boolean; role: TenantAccessRecord | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: '', display_name: '', copy_permissions: true, copy_description: true, status: 'inactive', audit_reason: '' });
  const mutation = useMutation({ mutationFn: () => tenantAccessApi.roles.clone(idOf(role), form), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: tenantQueryKeys.resource(tenantKey, 'roles') }); onClose(); } });
  return <AppModal open={open} onClose={onClose} title="Clone Role" guard="tenant" permission="role.create" footer={<ModalFooter onCancel={onClose} onSave={() => mutation.mutate()} loading={mutation.isPending} />}>{role ? <SimpleForm form={form} fields={['name', 'display_name', 'status', 'audit_reason']} onChange={setForm} error={mutation.error} /> : <div className="empty-state">Select a role first.</div>}</AppModal>;
}

function PermissionAssignDrawer({ open, target, record, onClose }: { open: boolean; target: 'role' | 'team'; record: TenantAccessRecord | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const permissions = useQuery({ queryKey: tenantQueryKeys.resource(tenantKey, 'permissions-grouped'), queryFn: tenantAccessApi.permissions.grouped, enabled: open });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const mutation = useMutation({
    mutationFn: () => target === 'role' ? tenantAccessApi.roles.replacePermissions(idOf(record), { permission_ids: selectedIds, audit_reason: 'Assigned from UI' }) : tenantAccessApi.teams.replacePermissions(idOf(record), { permission_ids: selectedIds }),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: tenantQueryKeys.all(tenantKey) }); onClose(); }
  });
  return (
    <AppDrawer open={open} onClose={onClose} title="Assign Permissions" guard="tenant" permission={target === 'role' ? 'role.assign_permissions' : 'team.edit'} size="lg" footer={<ModalFooter onCancel={onClose} onSave={() => mutation.mutate()} loading={mutation.isPending} />}>
      <p className="surface-state">Select permissions by name. The request still sends permission UUIDs to the API.</p>
      <PermissionChecklist groups={permissions.data?.data.permissions ?? {}} selectedIds={selectedIds} onChange={setSelectedIds} />
      {mutation.error ? <div className="surface-error">{errorMessage(mutation.error)}</div> : null}
    </AppDrawer>
  );
}

function AssignUsersModal({ open, role, onClose }: { open: boolean; role: TenantAccessRecord | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const users = useQuery({ queryKey: tenantQueryKeys.list(tenantKey, 'users-selector'), queryFn: () => tenantAccessApi.users.list({ per_page: 100 }), enabled: open });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const mutation = useMutation({ mutationFn: () => tenantAccessApi.roles.assignUsers(idOf(role), { user_ids: selectedIds, audit_reason: 'Assigned from UI' }), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: tenantQueryKeys.all(tenantKey) }); onClose(); } });
  return <AppModal open={open} onClose={onClose} title="Assign Users" guard="tenant" permission="role.edit" footer={<ModalFooter onCancel={onClose} onSave={() => mutation.mutate()} loading={mutation.isPending} />}><MultiRecordPicker label="Users" rows={users.data?.data ?? []} selectedIds={selectedIds} onChange={setSelectedIds} labelKeys={['display_name', 'email']} />{mutation.error ? <div className="surface-error">{errorMessage(mutation.error)}</div> : null}</AppModal>;
}

function TeamModal({ open, team, onClose }: { open: boolean; team: TenantAccessRecord | null; onClose: () => void }) {
  return <AppModal open={open} onClose={onClose} title={team ? 'Edit Team' : 'Create Team'} guard="tenant" permission={team ? 'team.edit' : 'team.create'} size="lg"><TeamForm team={team ?? undefined} onSaved={onClose} /></AppModal>;
}

function TeamForm({ team, onSaved }: { team?: TenantAccessRecord; onSaved: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(() => ({ name: textOf(team, ['name']), code: textOf(team, ['code']), description: textOf(team, ['description']), email: textOf(team, ['email']), phone: textOf(team, ['phone']), visibility: textOf(team, ['visibility'], 'tenant'), status: textOf(team, ['status'], 'active') }));
  const mutation = useMutation({ mutationFn: () => team?.uuid ? tenantAccessApi.teams.update(team.uuid, form) : tenantAccessApi.teams.create(form), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: tenantQueryKeys.resource(tenantKey, 'teams') }); onSaved(); } });
  return <SimpleForm form={form} fields={['name', 'code', 'description', 'email', 'phone', 'visibility', 'status']} onChange={setForm} onSubmit={() => mutation.mutate()} loading={mutation.isPending} error={mutation.error} />;
}

function TeamMemberModal({ open, team, onClose }: { open: boolean; team: TenantAccessRecord | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const users = useQuery({ queryKey: tenantQueryKeys.list(tenantKey, 'users-selector'), queryFn: () => tenantAccessApi.users.list({ per_page: 100 }), enabled: open });
  const staff = useQuery({ queryKey: tenantQueryKeys.list(tenantKey, 'staff-selector'), queryFn: () => tenantAccessApi.staff.list({ per_page: 100 }), enabled: open });
  const teamRoles = useQuery({ queryKey: tenantQueryKeys.list(tenantKey, 'team-roles-selector'), queryFn: () => tenantAccessApi.teamRoles.list({ per_page: 100 }), enabled: open });
  const [form, setForm] = useState({ user_id: '', staff_id: '', team_role_id: '', member_type: 'member', allocation_percent: '100', status: 'active' });
  const mutation = useMutation({ mutationFn: () => tenantAccessApi.teams.addMembers(idOf(team), { members: [{ ...form, allocation_percent: Number(form.allocation_percent) }] }), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: tenantQueryKeys.all(tenantKey) }); onClose(); } });
  return (
    <AppModal open={open} onClose={onClose} title="Add Team Member" guard="tenant" permission="team.assign" footer={<ModalFooter onCancel={onClose} onSave={() => mutation.mutate()} loading={mutation.isPending} />}>
      <div className="form-grid form-grid--two">
        <SelectInput label="Login user" value={form.user_id} onChange={(user_id) => setForm({ ...form, user_id })} options={users.data?.data ?? []} labelKeys={['display_name', 'email']} />
        <SelectInput label="Staff profile" value={form.staff_id} onChange={(staff_id) => setForm({ ...form, staff_id })} options={staff.data?.data ?? []} labelKeys={['display_name', 'employee_code']} />
        <SelectInput label="Team role" value={form.team_role_id} onChange={(team_role_id) => setForm({ ...form, team_role_id })} options={teamRoles.data?.data ?? []} labelKeys={['name', 'code']} />
        <SimpleInput label="Member Type" value={form.member_type} onChange={(member_type) => setForm({ ...form, member_type })} />
        <SimpleInput label="Allocation Percent" value={form.allocation_percent} onChange={(allocation_percent) => setForm({ ...form, allocation_percent })} />
        <SimpleInput label="Status" value={form.status} onChange={(status) => setForm({ ...form, status })} />
      </div>
      {mutation.error ? <div className="surface-error">{errorMessage(mutation.error)}</div> : null}
    </AppModal>
  );
}

function AssignRecordModal({ open, team, onClose }: { open: boolean; team: TenantAccessRecord | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ assignable_type: 'project', assignable_id: '', assignment_role: 'owner', status: 'active' });
  const mutation = useMutation({ mutationFn: () => tenantAccessApi.teams.assignRecord(idOf(team), form), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: tenantQueryKeys.all(tenantKey) }); onClose(); } });
  return <AppModal open={open} onClose={onClose} title="Assign Record" guard="tenant" permission="team.assign" footer={<ModalFooter onCancel={onClose} onSave={() => mutation.mutate()} loading={mutation.isPending} />}><SimpleForm form={form} fields={['assignable_type', 'assignable_id', 'assignment_role', 'status']} onChange={setForm} error={mutation.error} /></AppModal>;
}

function TeamExportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [format, setFormat] = useState('csv');
  const mutation = useMutation({ mutationFn: () => tenantAccessApi.teams.export({ format, scope: 'filtered' }) });
  return <AppModal open={open} onClose={onClose} title="Export Teams" guard="tenant" permission="team.view" footer={<ModalFooter onCancel={onClose} onSave={() => mutation.mutate()} loading={mutation.isPending} label="Queue Export" />}><SimpleInput label="Format" value={format} onChange={setFormat} />{mutation.data ? <JobResult data={mutation.data.data} /> : null}</AppModal>;
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

function ResetPasswordModal({ open, user, onClose }: { open: boolean; user: TenantAccessRecord | null; onClose: () => void }) {
  const mutation = useMutation({ mutationFn: () => tenantAccessApi.users.resetPassword(idOf(user)) });
  return <AppModal open={open} onClose={onClose} title="Reset Password" guard="tenant" permission="staff.edit" footer={<ModalFooter onCancel={onClose} onSave={() => mutation.mutate()} loading={mutation.isPending} label="Reset" />}><p>Reset password for {textOf(user, ['display_name', 'email'], 'selected user')}.</p>{mutation.data ? <TokenPreview label="Temporary password" value={String(mutation.data.data.temporary_password ?? 'Only returned in local environment.')} /> : null}</AppModal>;
}

function StaffModal({ open, staff, onClose }: { open: boolean; staff: TenantAccessRecord | null; onClose: () => void }) {
  return <AppModal open={open} onClose={onClose} title={staff ? 'Edit Staff' : 'Create Staff'} guard="tenant" permission={staff ? 'staff.edit' : 'staff.create'} size="lg"><StaffForm staff={staff ?? undefined} onSaved={onClose} /></AppModal>;
}

function StaffForm({ staff, onSaved }: { staff?: TenantAccessRecord; onSaved: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(() => ({ employee_code: textOf(staff, ['employee_code']), first_name: textOf(staff, ['first_name']), last_name: textOf(staff, ['last_name']), display_name: textOf(staff, ['display_name']), personal_email: textOf(staff, ['personal_email']), work_email: textOf(staff, ['work_email']), mobile: textOf(staff, ['mobile']), employment_type: textOf(staff, ['employment_type'], 'full_time'), employment_status: textOf(staff, ['employment_status'], 'active') }));
  const mutation = useMutation({ mutationFn: () => staff?.uuid ? tenantAccessApi.staff.update(staff.uuid, form) : tenantAccessApi.staff.create(form), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: tenantQueryKeys.resource(tenantKey, 'staff') }); onSaved(); } });
  return <SimpleForm form={form} fields={['employee_code', 'first_name', 'last_name', 'display_name', 'personal_email', 'work_email', 'mobile', 'employment_type', 'employment_status']} onChange={setForm} onSubmit={() => mutation.mutate()} loading={mutation.isPending} error={mutation.error} />;
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
  const query = useQuery({ queryKey: tenantQueryKeys.related(tenantKey, 'staff', staffId, tab), queryFn: () => tenantAccessApi.staff.tab(staffId, tab), enabled: Boolean(staffId) });
  const data = query.data?.data.data;
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

function SimpleForm<T extends Record<string, unknown>>({ form, fields, onChange, onSubmit, loading, error }: { form: T; fields: string[]; onChange: (form: T) => void; onSubmit?: () => void; loading?: boolean; error?: unknown }) {
  const submit = (event: FormEvent) => { event.preventDefault(); onSubmit?.(); };
  return (
    <form className="form-grid form-grid--two" onSubmit={submit}>
      {fields.map((field) => <SimpleInput key={field} label={label(field)} value={String(form[field] ?? '')} onChange={(value) => onChange({ ...form, [field]: value })} />)}
      {error ? <div className="surface-error">{errorMessage(error)}</div> : null}
      {onSubmit ? <div className="surface-footer"><Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button></div> : null}
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

function roleColumns(onAction: (row: TenantAccessRecord, action: ModalState) => void, onOpen: (row: TenantAccessRecord) => void): DataTableColumn<TenantAccessRecord>[] {
  return [...genericColumns(['display_name', 'name', 'guard_name', 'permissions_count', 'users_count', 'status']), actionColumn((row) => <><Button type="button" size="sm" variant="secondary" onClick={() => onOpen(row)}>View</Button><Button type="button" size="sm" variant="secondary" onClick={() => onAction(row, 'edit')}>Edit</Button><Button type="button" size="sm" variant="secondary" onClick={() => onAction(row, 'cloneRole')}>Clone</Button><Button type="button" size="sm" variant="secondary" onClick={() => onAction(row, 'assignPermissions')}>Permissions</Button><Button type="button" size="sm" variant="secondary" onClick={() => onAction(row, 'assignUsers')}>Users</Button></>)];
}

function teamColumns(onAction: (row: TenantAccessRecord, action: ModalState) => void, onOpen: (row: TenantAccessRecord) => void): DataTableColumn<TenantAccessRecord>[] {
  return [...genericColumns(['name', 'code', 'department_name', 'lead_name', 'members_count', 'status']), actionColumn((row) => <><Button type="button" size="sm" variant="secondary" onClick={() => onOpen(row)}>View</Button><Button type="button" size="sm" variant="secondary" onClick={() => onAction(row, 'edit')}>Edit</Button><Button type="button" size="sm" variant="secondary" onClick={() => onAction(row, 'addMember')}>Member</Button><Button type="button" size="sm" variant="secondary" onClick={() => onAction(row, 'assignRecord')}>Assign</Button></>)];
}

function userColumns(onModal: (row: TenantAccessRecord, action: ModalState) => void, onStatus: (row: TenantAccessRecord, action: 'activate' | 'suspend') => void): DataTableColumn<TenantAccessRecord>[] {
  return [...genericColumns(['display_name', 'email', 'account_type', 'status', 'last_login_at']), actionColumn((row) => <><Button type="button" size="sm" variant="secondary" onClick={() => onModal(row, 'assignRole')}>Roles</Button><Button type="button" size="sm" variant="secondary" onClick={() => onModal(row, 'resetPassword')}>Reset</Button><Button type="button" size="sm" variant="secondary" onClick={() => onStatus(row, 'activate')}>Activate</Button><Button type="button" size="sm" variant="danger" onClick={() => onStatus(row, 'suspend')}>Suspend</Button></>)];
}

function staffColumns(onAction: (row: TenantAccessRecord, action: ModalState) => void, onOpen: (row: TenantAccessRecord) => void): DataTableColumn<TenantAccessRecord>[] {
  return [...genericColumns(['employee_code', 'display_name', 'work_email', 'department_name', 'primary_team_name', 'employment_status']), actionColumn((row) => <><Button type="button" size="sm" variant="secondary" onClick={() => onOpen(row)}>View</Button><Button type="button" size="sm" variant="secondary" onClick={() => onAction(row, 'edit')}>Edit</Button><Button type="button" size="sm" variant="secondary" onClick={() => onAction(row, 'photo')}>Photo</Button></>)];
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
