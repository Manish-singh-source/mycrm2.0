import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Camera,
  CheckCircle2,
  Eye,
  KeyRound,
  Lock,
  LogOut,
  MoreVertical,
  Pencil,
  Plus,
  ShieldCheck,
  UserPlus,
  Users
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';

import { platformQueryKeys } from '@/features/platform/api/platformQueryKeys';
import {
  platformStaffApi,
  type PlatformStaffPayload,
  type PlatformStaffRecord
} from '@/features/platform/staff/api/platformStaffApi';
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
  SavedViewsModal
} from '@/shared/components/workflows';

type StaffModal =
  | 'invite'
  | 'assignRoles'
  | 'assignTeams'
  | 'suspend'
  | 'resetPassword'
  | 'forceLogout'
  | 'require2fa'
  | 'photo'
  | 'export'
  | 'columns'
  | 'views'
  | null;

type StaffDrawer = 'permissions' | 'filters' | null;

const staffSchema = z.object({
  employee_code: z.string().optional(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  display_name: z.string().min(2),
  email: z.string().email(),
  mobile: z.string().optional(),
  password: z.string().optional(),
  profile_photo_file_id: z.string().optional(),
  designation: z.string().optional(),
  department: z.string().optional(),
  timezone: z.string().min(1),
  locale: z.string().min(1),
  two_factor_enabled: z.boolean(),
  status: z.string(),
  role_ids: z.string().optional(),
  team_ids: z.string().optional()
});

type StaffForm = z.infer<typeof staffSchema>;

function idOf(row?: PlatformStaffRecord | null) {
  return String(row?.uuid ?? row?.id ?? '');
}

function textOf(row: PlatformStaffRecord | null | undefined, keys: string[], fallback = '-') {
  for (const key of keys) {
    const value = row?.[key];
    if (value !== undefined && value !== null && value !== '') return String(value);
  }
  return fallback;
}

function errorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Request failed.';
}

function formatDate(value: unknown) {
  if (!value) return '-';
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

function cleanPayload(values: StaffForm, includePassword: boolean): PlatformStaffPayload {
  return {
    employee_code: values.employee_code || undefined,
    first_name: values.first_name,
    last_name: values.last_name,
    display_name: values.display_name,
    email: values.email,
    mobile: values.mobile || undefined,
    password: includePassword && values.password ? values.password : undefined,
    profile_photo_file_id: values.profile_photo_file_id || undefined,
    designation: values.designation || undefined,
    department: values.department || undefined,
    timezone: values.timezone,
    locale: values.locale,
    two_factor_enabled: values.two_factor_enabled,
    status: values.status,
    role_ids: values.role_ids
      ?.split(',')
      .map((item) => item.trim())
      .filter(Boolean),
    team_ids: values.team_ids
      ?.split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  };
}

export function PlatformStaffListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<PlatformStaffRecord | null>(null);
  const [modal, setModal] = useState<StaffModal>(null);
  const [drawer, setDrawer] = useState<StaffDrawer>(null);
  const [hiddenColumnIds, setHiddenColumnIds] = useState<string[]>([]);
  const query = createListQuery({
    page,
    per_page: 25,
    search,
    filter: {
      status: filters.status || undefined,
      two_factor_enabled: filters.two_factor_enabled || undefined
    }
  });
  const listQuery = useQuery({
    queryKey: platformQueryKeys.list('platform-staff', query),
    queryFn: () => platformStaffApi.list(query)
  });
  const rows = listQuery.data?.data ?? [];
  const mutation = useMutation({
    mutationFn: ({
      action,
      staff,
      payload
    }: {
      action: string;
      staff: PlatformStaffRecord;
      payload: Record<string, unknown>;
    }) => {
      if (action === 'suspend') return platformStaffApi.suspend(idOf(staff), payload);
      if (action === 'activate') return platformStaffApi.activate(idOf(staff), payload);
      if (action === 'delete')
        return platformStaffApi.delete(idOf(staff), {
          audit_reason: String(payload.audit_reason ?? 'Staff deleted')
        });
      return Promise.resolve({ data: null });
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: platformQueryKeys.resource('platform-staff') })
  });

  const columns = useMemo<DataTableColumn<PlatformStaffRecord>[]>(
    () => [
      {
        id: 'display_name',
        header: 'Staff',
        accessor: (row) => row.display_name,
        enableSorting: true,
        cell: (row) => <StaffIdentity row={row} />
      },
      {
        id: 'employee_code',
        header: 'Employee Code',
        accessor: (row) => row.employee_code,
        cell: (row) => <span className="muted-cell">{textOf(row, ['employee_code'])}</span>
      },
      {
        id: 'contact',
        header: 'Contact',
        accessor: (row) => row.email,
        cell: (row) => <ContactCell row={row} />
      },
      {
        id: 'employment',
        header: 'Employment',
        accessor: (row) => row.department,
        cell: (row) => <EmploymentCell row={row} />
      },
      {
        id: 'roles',
        header: 'Roles',
        cell: (row) => <ChipSummary value={row.roles} fallback="No roles" />
      },
      {
        id: 'teams',
        header: 'Teams',
        cell: (row) => <ChipSummary value={row.teams} fallback="No teams" />
      },
      {
        id: 'two_factor_enabled',
        header: '2FA',
        accessor: (row) => row.two_factor_enabled,
        cell: (row) =>
          row.two_factor_enabled ? (
            <span className="system-badge system-badge--yes">Enabled</span>
          ) : (
            <span className="system-badge system-badge--no">Off</span>
          )
      },
      {
        id: 'status',
        header: 'Status',
        accessor: (row) => row.status,
        enableSorting: true,
        cell: (row) => <CompactStatus status={textOf(row, ['status'], 'inactive')} />
      },
      {
        id: 'last_login_at',
        header: 'Last Login',
        accessor: (row) => row.last_login_at,
        enableSorting: true,
        cell: (row) => (
          <span className="date-cell">
            <strong>{formatDate(row.last_login_at)}</strong>
            <small>{textOf(row, ['last_login_ip'], '')}</small>
          </span>
        )
      },
      {
        id: 'actions',
        header: 'Actions',
        enableHiding: false,
        cell: (row) => (
          <StaffActionsMenu
            row={row}
            onView={() => navigate(`${PLATFORM_ROUTES.staff}/${idOf(row)}`)}
            onEdit={() => navigate(`${PLATFORM_ROUTES.staff}/${idOf(row)}/edit`)}
            onModal={(next) => {
              setSelectedStaff(row);
              setModal(next);
            }}
            onDrawer={(next) => {
              setSelectedStaff(row);
              setDrawer(next);
            }}
            onActivate={() =>
              mutation.mutate({
                action: 'activate',
                staff: row,
                payload: { audit_reason: 'Staff reactivated from list' }
              })
            }
          />
        )
      }
    ],
    [mutation, navigate]
  );

  return (
    <section className="enterprise-module-page platform-access-page admin-master-page">
      <PageHeader
        breadcrumbs={<AdminBreadcrumbs items={['Access Control', 'Platform Staff']} />}
        title="Platform Staff"
        description="Manage SaaS internal staff, access, security controls, teams, and assignments."
        actions={
          <>
            <PermissionButton
              guard="platform"
              permission="platform_user.create"
              type="button"
              variant="secondary"
              onClick={() => setModal('invite')}
            >
              <UserPlus size={16} aria-hidden />
              Invite Staff
            </PermissionButton>
            <PermissionButton
              guard="platform"
              permission="platform_user.create"
              type="button"
              onClick={() => navigate(`${PLATFORM_ROUTES.staff}/create`)}
            >
              <Plus size={16} aria-hidden />
              Create Staff
            </PermissionButton>
          </>
        }
      />

      <StaffStats rows={rows} />

      <DataTable
        columns={columns}
        data={rows}
        getRowId={idOf}
        loading={listQuery.isLoading}
        error={listQuery.isError ? errorMessage(listQuery.error) : ''}
        searchValue={search}
        searchPlaceholder="Search staff..."
        onSearchChange={setSearch}
        hiddenColumnIds={hiddenColumnIds}
        onHiddenColumnIdsChange={setHiddenColumnIds}
        onOpenFilters={() => setDrawer('filters')}
        onOpenColumns={() => setModal('columns')}
        onOpenSavedViews={() => setModal('views')}
        onOpenExport={() => setModal('export')}
        selectedRowIds={selectedIds}
        onSelectionChange={setSelectedIds}
        page={page}
        total={listQuery.data?.total ?? rows.length}
        onPageChange={setPage}
        bulkActions={
          <div className="table-actions">
            <Button type="button" size="sm" variant="secondary" onClick={() => setModal('export')}>
              Export Selected
            </Button>
          </div>
        }
      />

      <StaffControls
        modal={modal}
        drawer={drawer}
        staff={selectedStaff}
        columns={columns}
        filters={filters}
        onFiltersChange={(nextFilters) => {
          setFilters(nextFilters);
          setPage(1);
        }}
        hiddenColumnIds={hiddenColumnIds}
        selectedCount={selectedIds.length}
        onHiddenColumnIdsChange={setHiddenColumnIds}
        onClose={() => {
          setModal(null);
          setDrawer(null);
        }}
        onAction={(action, payload) =>
          selectedStaff && mutation.mutate({ action, staff: selectedStaff, payload })
        }
      />
    </section>
  );
}

export function PlatformStaffCreatePage() {
  return <PlatformStaffFormPage />;
}

export function PlatformStaffEditPage() {
  const { id = '' } = useParams();
  return <StaffLoader id={id}>{(staff) => <PlatformStaffFormPage staff={staff} />}</StaffLoader>;
}

function PlatformStaffFormPage({ staff }: { staff?: PlatformStaffRecord }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const form = useForm<StaffForm>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      employee_code: textOf(staff, ['employee_code'], ''),
      first_name: textOf(staff, ['first_name'], ''),
      last_name: textOf(staff, ['last_name'], ''),
      display_name: textOf(staff, ['display_name'], ''),
      email: textOf(staff, ['email'], ''),
      mobile: textOf(staff, ['mobile'], ''),
      password: '',
      profile_photo_file_id: textOf(staff, ['profile_photo_file_id'], ''),
      designation: textOf(staff, ['designation'], ''),
      department: textOf(staff, ['department'], ''),
      timezone: textOf(staff, ['timezone'], 'Asia/Kolkata'),
      locale: textOf(staff, ['locale'], 'en'),
      two_factor_enabled: Boolean(staff?.two_factor_enabled),
      status: textOf(staff, ['status'], 'active'),
      role_ids: '',
      team_ids: ''
    }
  });
  const mutation = useMutation({
    mutationFn: (values: StaffForm) =>
      staff
        ? platformStaffApi.update(idOf(staff), cleanPayload(values, false))
        : platformStaffApi.create(cleanPayload(values, true)),
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({
        queryKey: platformQueryKeys.resource('platform-staff')
      });
      navigate(`${PLATFORM_ROUTES.staff}/${idOf(saved) || idOf(staff)}`);
    }
  });

  return (
    <section className="enterprise-module-page platform-access-page">
      <PageHeader
        breadcrumbs={
          <AdminBreadcrumbs
            items={['Access Control', 'Platform Staff', staff ? 'Edit Staff' : 'Create Staff']}
          />
        }
        title={staff ? `Edit ${textOf(staff, ['display_name', 'email'])}` : 'Create Platform Staff'}
        description="Identity, employment, access, security and preference settings. Password values are never shown after creation."
        actions={
          <Button type="button" variant="secondary" onClick={() => navigate(PLATFORM_ROUTES.staff)}>
            Back
          </Button>
        }
      />
      {mutation.error ? <div className="surface-error">{errorMessage(mutation.error)}</div> : null}
      <form
        className="rbac-form-shell"
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      >
        <article className="enterprise-form">
          <FormSection title="Identity">
            <InputField form={form} name="employee_code" label="Employee code" />
            <InputField form={form} name="first_name" label="First name" />
            <InputField form={form} name="last_name" label="Last name" />
            <InputField form={form} name="display_name" label="Display name" />
            <InputField form={form} name="profile_photo_file_id" label="Profile photo file ID" />
          </FormSection>
          <FormSection title="Contact">
            <InputField form={form} name="email" label="Email" type="email" />
            <InputField form={form} name="mobile" label="Mobile" />
          </FormSection>
          <FormSection title="Employment">
            <InputField form={form} name="designation" label="Designation" />
            <InputField form={form} name="department" label="Department" />
          </FormSection>
          <FormSection title="Access">
            <InputField
              form={form}
              name="role_ids"
              label="Role IDs"
              placeholder="role_uuid_1, role_uuid_2"
            />
            <InputField
              form={form}
              name="team_ids"
              label="Team IDs"
              placeholder="team_uuid_1, team_uuid_2"
            />
            <SelectField
              form={form}
              name="status"
              label="Status"
              options={['active', 'inactive', 'suspended']}
            />
          </FormSection>
          <FormSection title="Security">
            {!staff ? (
              <InputField form={form} name="password" label="Temporary password" type="password" />
            ) : null}
            <CheckboxField
              form={form}
              name="two_factor_enabled"
              label="Two-factor authentication enabled"
            />
          </FormSection>
          <FormSection title="Preferences">
            <InputField form={form} name="timezone" label="Timezone" />
            <InputField form={form} name="locale" label="Locale" />
          </FormSection>
        </article>
        <aside className="rbac-side-panel">
          <h2>Security Note</h2>
          <p>
            Password and token values are write-only. Existing staff credentials are not rendered in
            this UI.
          </p>
          <StaffAvatar staff={staff} />
        </aside>
        <footer className="enterprise-form__footer rbac-sticky-footer">
          <Button type="button" variant="secondary" onClick={() => navigate(PLATFORM_ROUTES.staff)}>
            Cancel
          </Button>
          <PermissionButton
            guard="platform"
            permission={staff ? 'platform_user.edit' : 'platform_user.create'}
            type="submit"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Saving...' : 'Save Staff'}
          </PermissionButton>
        </footer>
      </form>
    </section>
  );
}

export function PlatformStaffViewPage() {
  const { id = '' } = useParams();
  return <StaffLoader id={id}>{(staff) => <StaffView staff={staff} />}</StaffLoader>;
}

function StaffLoader({
  id,
  children
}: {
  id: string;
  children: (staff: PlatformStaffRecord) => ReactNode;
}) {
  const query = useQuery({
    queryKey: platformQueryKeys.detail('platform-staff', id),
    queryFn: () => platformStaffApi.detail(id)
  });
  if (query.isLoading) return <div className="surface-state">Loading staff profile...</div>;
  if (query.isError) return <div className="surface-error">{errorMessage(query.error)}</div>;
  if (!query.data) return <div className="empty-state">Staff profile not found.</div>;
  return <>{children(query.data)}</>;
}

function StaffView({ staff }: { staff: PlatformStaffRecord }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [modal, setModal] = useState<StaffModal>(null);
  const [drawer, setDrawer] = useState<StaffDrawer>(null);
  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'access', label: 'Access' },
    { id: 'security', label: 'Security' },
    { id: 'assignments', label: 'Assignments' },
    { id: 'activity', label: 'Activity' }
  ];

  return (
    <section className="enterprise-module-page platform-access-page">
      <PageHeader
        breadcrumbs={
          <AdminBreadcrumbs
            items={['Access Control', 'Platform Staff', textOf(staff, ['display_name', 'email'])]}
          />
        }
        title={textOf(staff, ['display_name', 'email'])}
        description={`${textOf(staff, ['designation'], 'Staff')} / ${textOf(staff, ['department'], 'Platform')}`}
        meta={
          <StatusBadge tone={staff.status === 'active' ? 'success' : 'neutral'}>
            {textOf(staff, ['status'])}
          </StatusBadge>
        }
        tabs={
          <Tabs
            tabs={tabs}
            activeId={activeTab}
            onChange={setActiveTab}
            ariaLabel="Staff profile tabs"
          />
        }
        actions={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(PLATFORM_ROUTES.staff)}
            >
              Back
            </Button>
            <PermissionButton
              guard="platform"
              permission="platform_user.edit"
              type="button"
              onClick={() => navigate(`${PLATFORM_ROUTES.staff}/${idOf(staff)}/edit`)}
            >
              <Pencil size={16} aria-hidden />
              Edit
            </PermissionButton>
            <PermissionButton
              guard="platform"
              permission="platform_user.edit"
              type="button"
              variant="secondary"
              onClick={() => setModal('assignRoles')}
            >
              Assign Roles
            </PermissionButton>
            <PermissionButton
              guard="platform"
              permission="platform_user.edit"
              type="button"
              variant="secondary"
              onClick={() => setDrawer('permissions')}
            >
              Direct Permissions
            </PermissionButton>
          </>
        }
      />
      <div className="platform-access-summary">
        <SummaryTile
          icon={<Users />}
          label="Roles"
          value={String(Array.isArray(staff.roles) ? staff.roles.length : 0)}
        />
        <SummaryTile
          icon={<Users />}
          label="Teams"
          value={String(Array.isArray(staff.teams) ? staff.teams.length : 0)}
        />
        <SummaryTile
          icon={<ShieldCheck />}
          label="2FA"
          value={staff.two_factor_enabled ? 'Enabled' : 'Off'}
        />
        <SummaryTile
          icon={<KeyRound />}
          label="Last Login"
          value={formatDate(staff.last_login_at)}
        />
      </div>
      <article className="enterprise-view-panel">
        {activeTab === 'profile' ? <SafeRecordDetails record={staff} /> : null}
        {activeTab === 'access' ? <AccessTab staff={staff} /> : null}
        {activeTab === 'security' ? (
          <SafeRecordDetails
            record={{
              two_factor_enabled: staff.two_factor_enabled,
              email_verified_at: staff.email_verified_at,
              last_login_at: staff.last_login_at,
              last_login_ip: staff.last_login_ip
            }}
          />
        ) : null}
        {activeTab === 'assignments' ? <RecordList rows={staff.assignments ?? []} /> : null}
        {activeTab === 'activity' ? <RecordList rows={staff.activity ?? []} /> : null}
      </article>
      <StaffControls
        modal={modal}
        drawer={drawer}
        staff={staff}
        onClose={() => {
          setModal(null);
          setDrawer(null);
        }}
      />
    </section>
  );
}

function StaffControls({
  modal,
  drawer,
  staff,
  columns = [],
  filters = {},
  onFiltersChange,
  hiddenColumnIds = [],
  selectedCount = 0,
  onHiddenColumnIdsChange,
  onClose,
  onAction
}: {
  modal: StaffModal;
  drawer: StaffDrawer;
  staff: PlatformStaffRecord | null;
  columns?: DataTableColumn<PlatformStaffRecord>[];
  filters?: Record<string, string>;
  onFiltersChange?: (filters: Record<string, string>) => void;
  hiddenColumnIds?: string[];
  selectedCount?: number;
  onHiddenColumnIdsChange?: (ids: string[]) => void;
  onClose: () => void;
  onAction?: (action: string, payload: Record<string, unknown>) => void;
}) {
  const [draftFilters, setDraftFilters] = useState(filters);

  useEffect(() => {
    if (drawer === 'filters') setDraftFilters(filters);
  }, [drawer, filters]);

  return (
    <>
      <AdvancedFiltersDrawer
        open={drawer === 'filters'}
        onClose={onClose}
        guard="platform"
        permission="platform_user.view"
        fields={[
          {
            name: 'status',
            label: 'Status',
            input: (
              <select
                value={draftFilters.status ?? ''}
                onChange={(event) =>
                  setDraftFilters({ ...draftFilters, status: event.target.value })
                }
              >
                <option value="">Any status</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            )
          },
          {
            name: 'two_factor_enabled',
            label: '2FA',
            input: (
              <select
                value={draftFilters.two_factor_enabled ?? ''}
                onChange={(event) =>
                  setDraftFilters({ ...draftFilters, two_factor_enabled: event.target.value })
                }
              >
                <option value="">Any</option>
                <option value="1">Enabled</option>
                <option value="0">Off</option>
              </select>
            )
          }
        ]}
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
        permission="platform_user.view"
        columns={columns.map((column) => ({
          id: column.id,
          label: column.header,
          visible: !hiddenColumnIds.includes(column.id),
          locked: column.enableHiding === false
        }))}
        onToggle={(id) =>
          onHiddenColumnIdsChange?.(
            hiddenColumnIds.includes(id)
              ? hiddenColumnIds.filter((columnId) => columnId !== id)
              : [...hiddenColumnIds, id]
          )
        }
        onReset={() => onHiddenColumnIdsChange?.([])}
        onSave={onClose}
      />
      <SavedViewsModal
        open={modal === 'views'}
        onClose={onClose}
        guard="platform"
        permission="platform_user.view"
        views={[
          { id: 'active', name: 'Active staff', visibility: 'shared', isDefault: true },
          { id: 'security', name: 'Security review', visibility: 'shared' },
          { id: 'my-team', name: 'My team', visibility: 'personal' }
        ]}
        activeViewId="active"
        onSelect={onClose}
        onSaveCurrent={onClose}
      />
      <ExportModal
        open={modal === 'export'}
        onClose={onClose}
        guard="platform"
        permission="platform_user.view"
        columns={columns
          .filter((column) => !hiddenColumnIds.includes(column.id) && column.id !== 'actions')
          .map((column) => String(column.header))}
        selectedCount={selectedCount}
        onExport={onClose}
      />
      <InviteStaffModal open={modal === 'invite'} onClose={onClose} />
      <AssignRolesModal open={modal === 'assignRoles'} staff={staff} onClose={onClose} />
      <DirectPermissionsDrawer open={drawer === 'permissions'} staff={staff} onClose={onClose} />
      <AssignTeamsModal open={modal === 'assignTeams'} staff={staff} onClose={onClose} />
      <SuspendReactivateModal
        open={modal === 'suspend'}
        staff={staff}
        onClose={onClose}
        onAction={onAction}
      />
      <ResetPasswordModal open={modal === 'resetPassword'} staff={staff} onClose={onClose} />
      <ForceLogoutDialog open={modal === 'forceLogout'} staff={staff} onClose={onClose} />
      <RequireTwoFactorModal open={modal === 'require2fa'} staff={staff} onClose={onClose} />
      <ProfilePhotoModal open={modal === 'photo'} staff={staff} onClose={onClose} />
    </>
  );
}

function StaffActionsMenu({
  row,
  onView,
  onEdit,
  onModal,
  onDrawer,
  onActivate
}: {
  row: PlatformStaffRecord;
  onView: () => void;
  onEdit: () => void;
  onModal: (modal: StaffModal) => void;
  onDrawer: (drawer: StaffDrawer) => void;
  onActivate: () => void;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const suspended = textOf(row, ['status'], '').toLowerCase() === 'suspended';
  function run(action: () => void) {
    action();
    setOpen(false);
  }
  return (
    <div className="action-dropdown">
      <button
        ref={triggerRef}
        type="button"
        className="action-menu-trigger"
        aria-label="Open staff actions"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <MoreVertical size={16} aria-hidden />
      </button>
      <PortalActionMenu open={open} anchorRef={triggerRef} onClose={() => setOpen(false)}>
        <div className="action-menu" role="menu">
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => run(onView)}
          >
            <Eye size={15} aria-hidden /> View
          </button>
          <PermissionButton
            guard="platform"
            permission="platform_user.edit"
            type="button"
            variant="ghost"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => run(onEdit)}
          >
            <Pencil size={15} aria-hidden /> Edit
          </PermissionButton>
          <hr />
          <PermissionButton
            guard="platform"
            permission="platform_user.edit"
            type="button"
            variant="ghost"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => run(() => onModal('assignRoles'))}
          >
            <Users size={15} aria-hidden /> Assign Roles
          </PermissionButton>
          <PermissionButton
            guard="platform"
            permission="platform_user.edit"
            type="button"
            variant="ghost"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => run(() => onDrawer('permissions'))}
          >
            <ShieldCheck size={15} aria-hidden /> Direct Permissions
          </PermissionButton>
          <PermissionButton
            guard="platform"
            permission="platform_user.edit"
            type="button"
            variant="ghost"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => run(() => onModal('assignTeams'))}
          >
            <Users size={15} aria-hidden /> Assign Teams
          </PermissionButton>
          <hr />
          {suspended ? (
            <PermissionButton
              guard="platform"
              permission="platform_user.edit"
              type="button"
              variant="ghost"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => run(onActivate)}
            >
              <CheckCircle2 size={15} aria-hidden /> Reactivate
            </PermissionButton>
          ) : (
            <PermissionButton
              guard="platform"
              permission="platform_user.suspend"
              type="button"
              variant="ghost"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => run(() => onModal('suspend'))}
            >
              <Lock size={15} aria-hidden /> Suspend
            </PermissionButton>
          )}
          <PermissionButton
            guard="platform"
            permission="platform_user.edit"
            type="button"
            variant="ghost"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => run(() => onModal('resetPassword'))}
          >
            <KeyRound size={15} aria-hidden /> Reset Password
          </PermissionButton>
          <PermissionButton
            guard="platform"
            permission="platform_user.edit"
            type="button"
            variant="ghost"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => run(() => onModal('forceLogout'))}
          >
            <LogOut size={15} aria-hidden /> Force Logout
          </PermissionButton>
          <PermissionButton
            guard="platform"
            permission="platform_user.edit"
            type="button"
            variant="ghost"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => run(() => onModal('require2fa'))}
          >
            <ShieldCheck size={15} aria-hidden /> Require 2FA
          </PermissionButton>
          <PermissionButton
            guard="platform"
            permission="platform_user.edit"
            type="button"
            variant="ghost"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => run(() => onModal('photo'))}
          >
            <Camera size={15} aria-hidden /> Profile Photo
          </PermissionButton>
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

function InviteStaffModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [payload, setPayload] = useState({
    email: '',
    first_name: '',
    last_name: '',
    designation: '',
    department: '',
    role_ids: '',
    team_ids: '',
    send_invite: true
  });
  const mutation = useMutation({
    mutationFn: () =>
      platformStaffApi.invite({
        ...payload,
        role_ids: payload.role_ids
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        team_ids: payload.team_ids
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: platformQueryKeys.resource('platform-staff')
      });
      onClose();
    }
  });
  return (
    <StaffModalShell
      open={open}
      onClose={onClose}
      title="Invite staff"
      permission="platform_user.create"
      loading={mutation.isPending}
      error={mutation.error}
      onSubmit={() => mutation.mutate()}
      submitLabel="Send invite"
    >
      <SimpleInput
        label="Email"
        value={payload.email}
        onChange={(email) => setPayload({ ...payload, email })}
      />
      <SimpleInput
        label="First name"
        value={payload.first_name}
        onChange={(first_name) => setPayload({ ...payload, first_name })}
      />
      <SimpleInput
        label="Last name"
        value={payload.last_name}
        onChange={(last_name) => setPayload({ ...payload, last_name })}
      />
      <SimpleInput
        label="Designation"
        value={payload.designation}
        onChange={(designation) => setPayload({ ...payload, designation })}
      />
      <SimpleInput
        label="Department"
        value={payload.department}
        onChange={(department) => setPayload({ ...payload, department })}
      />
      <SimpleInput
        label="Role IDs"
        value={payload.role_ids}
        onChange={(role_ids) => setPayload({ ...payload, role_ids })}
      />
      <SimpleInput
        label="Team IDs"
        value={payload.team_ids}
        onChange={(team_ids) => setPayload({ ...payload, team_ids })}
      />
      <label className="check-row">
        <input
          checked={payload.send_invite}
          type="checkbox"
          onChange={(event) => setPayload({ ...payload, send_invite: event.target.checked })}
        />{' '}
        Send invite email
      </label>
    </StaffModalShell>
  );
}

function AssignRolesModal({
  open,
  staff,
  onClose
}: {
  open: boolean;
  staff: PlatformStaffRecord | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [roleIds, setRoleIds] = useState('');
  const [reason, setReason] = useState('Access review update');
  const mutation = useMutation({
    mutationFn: () =>
      platformStaffApi.replaceRoles(idOf(staff), {
        role_ids: roleIds
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        audit_reason: reason
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: platformQueryKeys.resource('platform-staff')
      });
      onClose();
    }
  });
  return (
    <StaffModalShell
      open={open}
      onClose={onClose}
      title="Assign roles"
      permission="platform_user.edit"
      loading={mutation.isPending}
      error={mutation.error}
      onSubmit={() => mutation.mutate()}
      submitLabel="Assign roles"
    >
      <SimpleInput
        label="Role IDs"
        value={roleIds}
        onChange={setRoleIds}
        placeholder="role_uuid_1, role_uuid_2"
      />
      <SimpleTextarea label="Audit reason" value={reason} onChange={setReason} />
    </StaffModalShell>
  );
}

function DirectPermissionsDrawer({
  open,
  staff,
  onClose
}: {
  open: boolean;
  staff: PlatformStaffRecord | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [permissionIds, setPermissionIds] = useState('');
  const [reason, setReason] = useState('Direct permission review');
  const mutation = useMutation({
    mutationFn: () =>
      platformStaffApi.replacePermissions(idOf(staff), {
        permission_ids: permissionIds
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        audit_reason: reason
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: platformQueryKeys.resource('platform-staff')
      });
      onClose();
    }
  });
  return (
    <AppDrawer
      open={open}
      onClose={onClose}
      title="Direct permissions"
      guard="platform"
      permission="platform_user.edit"
      loading={mutation.isPending}
      error={mutation.error ? errorMessage(mutation.error) : null}
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
      <div className="form-grid">
        <SimpleInput
          label="Permission IDs"
          value={permissionIds}
          onChange={setPermissionIds}
          placeholder="permission_uuid_1, permission_uuid_2"
        />
        <SimpleTextarea label="Audit reason" value={reason} onChange={setReason} />
      </div>
    </AppDrawer>
  );
}

function AssignTeamsModal({
  open,
  staff,
  onClose
}: {
  open: boolean;
  staff: PlatformStaffRecord | null;
  onClose: () => void;
}) {
  const [teamIds, setTeamIds] = useState('');
  const [role, setRole] = useState('');
  const [allocation, setAllocation] = useState('100');
  const [effectiveFrom, setEffectiveFrom] = useState('');
  return (
    <StaffModalShell
      open={open}
      onClose={onClose}
      title="Assign teams"
      permission="platform_user.edit"
      onSubmit={onClose}
      submitLabel="Assign teams"
    >
      <SimpleInput
        label="Team IDs"
        value={teamIds}
        onChange={setTeamIds}
        placeholder="team_uuid_1, team_uuid_2"
      />
      <SimpleInput label="Team role" value={role} onChange={setRole} />
      <SimpleInput
        label="Allocation percent"
        value={allocation}
        onChange={setAllocation}
        type="number"
      />
      <SimpleInput
        label="Effective from"
        value={effectiveFrom}
        onChange={setEffectiveFrom}
        type="date"
      />
      <label className="check-row">
        <input type="checkbox" defaultChecked /> Primary team
      </label>
      <div className="surface-state">
        Team assignment endpoint is documented under Platform Teams; this popup preserves the staff
        workflow surface.
      </div>
    </StaffModalShell>
  );
}

function SuspendReactivateModal({
  open,
  staff,
  onClose,
  onAction
}: {
  open: boolean;
  staff: PlatformStaffRecord | null;
  onClose: () => void;
  onAction?: (action: string, payload: Record<string, unknown>) => void;
}) {
  const [reason, setReason] = useState('Policy review');
  const [effectiveUntil, setEffectiveUntil] = useState('');
  const [revokeSessions, setRevokeSessions] = useState(true);
  const [notifyUser, setNotifyUser] = useState(true);
  return (
    <StaffModalShell
      open={open}
      onClose={onClose}
      title="Suspend staff"
      permission="platform_user.suspend"
      onSubmit={() => {
        onAction?.('suspend', {
          reason,
          effective_until: effectiveUntil || undefined,
          revoke_sessions: revokeSessions,
          notify_user: notifyUser
        });
        onClose();
      }}
      submitLabel="Suspend"
    >
      <SimpleTextarea label="Reason" value={reason} onChange={setReason} />
      <SimpleInput
        label="Effective until"
        value={effectiveUntil}
        onChange={setEffectiveUntil}
        type="date"
      />
      <label className="check-row">
        <input
          checked={revokeSessions}
          type="checkbox"
          onChange={(event) => setRevokeSessions(event.target.checked)}
        />{' '}
        Revoke sessions
      </label>
      <label className="check-row">
        <input
          checked={notifyUser}
          type="checkbox"
          onChange={(event) => setNotifyUser(event.target.checked)}
        />{' '}
        Notify user
      </label>
    </StaffModalShell>
  );
}

function ResetPasswordModal({
  open,
  staff,
  onClose
}: {
  open: boolean;
  staff: PlatformStaffRecord | null;
  onClose: () => void;
}) {
  const [mode, setMode] = useState('send_link');
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [forceChange, setForceChange] = useState(true);
  const mutation = useMutation({
    mutationFn: () =>
      platformStaffApi.resetPassword(idOf(staff), {
        mode,
        temporary_password: temporaryPassword || undefined,
        force_change: forceChange
      }),
    onSuccess: onClose
  });
  return (
    <StaffModalShell
      open={open}
      onClose={onClose}
      title="Reset password"
      permission="platform_user.edit"
      loading={mutation.isPending}
      error={mutation.error}
      onSubmit={() => mutation.mutate()}
      submitLabel="Reset password"
    >
      <label>
        Mode
        <select value={mode} onChange={(event) => setMode(event.target.value)}>
          <option value="send_link">Send reset link</option>
          <option value="temporary_password">Set temporary password</option>
        </select>
      </label>
      {mode === 'temporary_password' ? (
        <SimpleInput
          label="Temporary password"
          value={temporaryPassword}
          onChange={setTemporaryPassword}
          type="password"
        />
      ) : null}
      <label className="check-row">
        <input
          checked={forceChange}
          type="checkbox"
          onChange={(event) => setForceChange(event.target.checked)}
        />{' '}
        Force change on login
      </label>
    </StaffModalShell>
  );
}

function ForceLogoutDialog({
  open,
  staff,
  onClose
}: {
  open: boolean;
  staff: PlatformStaffRecord | null;
  onClose: () => void;
}) {
  const [reason, setReason] = useState('Security session reset');
  const mutation = useMutation({
    mutationFn: () => platformStaffApi.forceLogout(idOf(staff), { reason }),
    onSuccess: onClose
  });
  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Force logout"
      guard="platform"
      permission="platform_user.edit"
      loading={mutation.isPending}
      error={mutation.error ? errorMessage(mutation.error) : null}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="danger" onClick={() => mutation.mutate()}>
            Revoke sessions
          </Button>
        </>
      }
    >
      <div className="form-grid">
        <div className="surface-error">
          This will revoke active sessions and tokens for{' '}
          {textOf(staff, ['display_name', 'email'], 'this staff user')}.
        </div>
        <SimpleTextarea label="Reason" value={reason} onChange={setReason} />
      </div>
    </AppModal>
  );
}

function RequireTwoFactorModal({
  open,
  staff,
  onClose
}: {
  open: boolean;
  staff: PlatformStaffRecord | null;
  onClose: () => void;
}) {
  const [enforcementDate, setEnforcementDate] = useState('');
  const [notifyUser, setNotifyUser] = useState(true);
  const mutation = useMutation({
    mutationFn: () =>
      platformStaffApi.requireTwoFactor(idOf(staff), {
        enforcement_date: enforcementDate || undefined,
        notify_user: notifyUser
      }),
    onSuccess: onClose
  });
  return (
    <StaffModalShell
      open={open}
      onClose={onClose}
      title="Require 2FA"
      permission="platform_user.edit"
      loading={mutation.isPending}
      error={mutation.error}
      onSubmit={() => mutation.mutate()}
      submitLabel="Require 2FA"
    >
      <SimpleInput
        label="Enforcement date"
        value={enforcementDate}
        onChange={setEnforcementDate}
        type="date"
      />
      <label className="check-row">
        <input
          checked={notifyUser}
          type="checkbox"
          onChange={(event) => setNotifyUser(event.target.checked)}
        />{' '}
        Notify user
      </label>
    </StaffModalShell>
  );
}

function ProfilePhotoModal({
  open,
  staff,
  onClose
}: {
  open: boolean;
  staff: PlatformStaffRecord | null;
  onClose: () => void;
}) {
  return (
    <StaffModalShell
      open={open}
      onClose={onClose}
      title="Profile photo"
      permission="platform_user.edit"
      onSubmit={onClose}
      submitLabel="Save photo"
    >
      <StaffAvatar staff={staff} />
      <label>
        Upload image
        <input type="file" accept="image/*" />
      </label>
      <div className="surface-state">
        Crop controls can bind to the project file service once upload APIs are available.
      </div>
    </StaffModalShell>
  );
}

function StaffModalShell({
  open,
  title,
  permission,
  loading,
  error,
  children,
  submitLabel,
  onSubmit,
  onClose
}: {
  open: boolean;
  title: string;
  permission: string;
  loading?: boolean;
  error?: unknown;
  children: ReactNode;
  submitLabel: string;
  onSubmit: () => void;
  onClose: () => void;
}) {
  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={title}
      guard="platform"
      permission={permission}
      loading={loading}
      error={error ? errorMessage(error) : null}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={onSubmit}>
            {submitLabel}
          </Button>
        </>
      }
    >
      <div className="form-grid">{children}</div>
    </AppModal>
  );
}

function StaffIdentity({ row }: { row: PlatformStaffRecord }) {
  return (
    <span className="role-name-cell">
      <StaffAvatar staff={row} compact />
      <span>
        <strong>{textOf(row, ['display_name', 'email'])}</strong>
        <small>{textOf(row, ['email'])}</small>
      </span>
    </span>
  );
}

function StaffAvatar({
  staff,
  compact = false
}: {
  staff?: PlatformStaffRecord | null;
  compact?: boolean;
}) {
  const name = textOf(staff, ['display_name', 'email'], 'Staff');
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
  if (staff?.profile_photo_url)
    return (
      <img
        className={compact ? 'staff-avatar staff-avatar--compact' : 'staff-avatar'}
        src={staff.profile_photo_url}
        alt=""
      />
    );
  return (
    <span className={compact ? 'role-avatar staff-avatar--compact' : 'role-avatar'}>
      {initials || 'S'}
    </span>
  );
}

function ContactCell({ row }: { row: PlatformStaffRecord }) {
  return (
    <span className="date-cell">
      <strong>{textOf(row, ['email'])}</strong>
      <small>{textOf(row, ['mobile'], '')}</small>
    </span>
  );
}

function EmploymentCell({ row }: { row: PlatformStaffRecord }) {
  return (
    <span className="date-cell">
      <strong>{textOf(row, ['designation'])}</strong>
      <small>{textOf(row, ['department'], '')}</small>
    </span>
  );
}

function ChipSummary({ value, fallback }: { value: unknown; fallback: string }) {
  if (!Array.isArray(value) || value.length === 0)
    return <span className="muted-cell">{fallback}</span>;
  return <span className="permission-pill">{value.length}</span>;
}

function CompactStatus({ status }: { status: string }) {
  const active = status.toLowerCase() === 'active';
  return (
    <span className={`status-pill ${active ? 'status-pill--active' : 'status-pill--muted'}`}>
      <i aria-hidden />
      {status}
    </span>
  );
}

function StaffStats({ rows }: { rows: PlatformStaffRecord[] }) {
  return (
    <section className="platform-access-summary">
      <SummaryTile icon={<Users />} label="Total Staff" value={String(rows.length)} />
      <SummaryTile
        icon={<CheckCircle2 />}
        label="Active Staff"
        value={String(rows.filter((row) => row.status === 'active').length)}
      />
      <SummaryTile
        icon={<ShieldCheck />}
        label="2FA Enabled"
        value={String(rows.filter((row) => row.two_factor_enabled).length)}
      />
      <SummaryTile
        icon={<KeyRound />}
        label="Suspended"
        value={String(rows.filter((row) => row.status === 'suspended').length)}
      />
    </section>
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

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="staff-form-section">
      <h2>{title}</h2>
      <div className="enterprise-form__grid">{children}</div>
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
  label: string;
  placeholder?: string;
  type?: string;
}) {
  const error = form.formState.errors[name]?.message;
  return (
    <label>
      <span>{label}</span>
      <input type={type} placeholder={placeholder} {...form.register(name)} />
      {error ? <strong role="alert">{String(error)}</strong> : null}
    </label>
  );
}

function SelectField({
  form,
  name,
  label,
  options
}: {
  form: any;
  name: string;
  label: string;
  options: string[];
}) {
  return (
    <label>
      <span>{label}</span>
      <select {...form.register(name)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
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

function SimpleInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text'
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label>
      {label}
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function SimpleTextarea({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      {label}
      <textarea value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
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

function SafeRecordDetails({ record }: { record: PlatformStaffRecord | Record<string, unknown> }) {
  const hidden = new Set(['password', 'token', 'access_token', 'refresh_token', 'remember_token']);
  return (
    <dl className="enterprise-summary-list">
      {Object.entries(record)
        .filter(
          ([key]) =>
            !hidden.has(key.toLowerCase()) &&
            !key.toLowerCase().includes('token') &&
            !key.toLowerCase().includes('password')
        )
        .map(([key, value]) => (
          <div key={key}>
            <dt>{key}</dt>
            <dd>{humanValue(value)}</dd>
          </div>
        ))}
    </dl>
  );
}

function humanValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '-';
  if (Array.isArray(value)) return `${value.length} item${value.length === 1 ? '' : 's'}`;
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') {
    const payload = value as PlatformStaffRecord;
    return textOf(payload, ['display_name', 'name', 'title', 'email', 'uuid'], 'Details available');
  }
  return String(value);
}

function AccessTab({ staff }: { staff: PlatformStaffRecord }) {
  return (
    <div className="settings-grid">
      <RecordList rows={(staff.roles as PlatformStaffRecord[]) ?? []} />
      <RecordList rows={(staff.teams as PlatformStaffRecord[]) ?? []} />
    </div>
  );
}

function RecordList({ rows }: { rows: PlatformStaffRecord[] }) {
  if (!Array.isArray(rows) || rows.length === 0)
    return <div className="empty-state">No records returned.</div>;
  return (
    <div className="record-list">
      {rows.map((row) => (
        <article key={idOf(row) || textOf(row, ['name', 'display_name'])}>
          <strong>{textOf(row, ['display_name', 'name', 'email'])}</strong>
          <p>{textOf(row, ['status', 'code', 'created_at'])}</p>
        </article>
      ))}
    </div>
  );
}
