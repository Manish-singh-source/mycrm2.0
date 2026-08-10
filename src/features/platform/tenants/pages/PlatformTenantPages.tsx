import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Archive,
  Building2,
  CalendarPlus,
  CheckCircle2,
  Eye,
  KeyRound,
  Layers3,
  LogIn,
  MoreVertical,
  Pencil,
  Plus,
  RotateCcw,
  Settings,
  ShieldAlert,
  Trash2,
  Users
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';

import { platformQueryKeys } from '@/features/platform/api/platformQueryKeys';
import { PLATFORM_ROUTES } from '@/features/platform/routes/platformRoutes';
import { platformTenantsApi, type PlatformTenantRecord, type TenantCreatePayload } from '@/features/platform/tenants/api/platformTenantsApi';
import { ApiError } from '@/lib/api/apiError';
import { createListQuery } from '@/lib/api/listQuery';
import { DataTable, type DataTableColumn } from '@/shared/components/data-table';
import { AppDrawer } from '@/shared/components/drawer';
import { PageHeader, StatusBadge, Tabs } from '@/shared/components/layout';
import { AppModal } from '@/shared/components/modal';
import { Button, PermissionButton } from '@/shared/components/ui';
import { AdvancedFiltersDrawer, ColumnManagerModal, ConfirmDialog, ExportModal, SavedViewsModal } from '@/shared/components/workflows';

type TenantModal =
  | 'changePlan'
  | 'extendTrial'
  | 'suspend'
  | 'reactivate'
  | 'remoteLogin'
  | 'resetOwnerPassword'
  | 'archive'
  | 'delete'
  | 'export'
  | 'columns'
  | 'views'
  | null;

type TenantDrawer = 'filters' | 'moduleOverride' | 'usageDetail' | 'settingsPreview' | null;

const tenantSchema = z.object({
  organization_name: z.string().min(2),
  legal_name: z.string().optional(),
  display_name: z.string().optional(),
  organization_code: z.string().min(2),
  slug: z.string().min(2),
  business_type_id: z.string().optional(),
  industry_id: z.string().optional(),
  company_size: z.string().optional(),
  gst_number: z.string().optional(),
  pan_number: z.string().optional(),
  registration_number: z.string().optional(),
  website: z.string().optional(),
  description: z.string().optional(),
  logo_file_id: z.string().optional(),
  favicon_file_id: z.string().optional(),
  default_currency: z.string().min(1),
  default_timezone: z.string().min(1),
  status: z.string(),
  owner_first_name: z.string().optional(),
  owner_last_name: z.string().optional(),
  owner_display_name: z.string().optional(),
  owner_email: z.string().email().optional().or(z.literal('')),
  owner_mobile: z.string().optional(),
  owner_password: z.string().optional(),
  owner_send_invite: z.boolean(),
  owner_status: z.string(),
  office_name: z.string().optional(),
  office_code: z.string().optional(),
  office_type: z.string(),
  address_line_1: z.string().optional(),
  address_line_2: z.string().optional(),
  landmark: z.string().optional(),
  country_id: z.string().optional(),
  state_id: z.string().optional(),
  city_id: z.string().optional(),
  postal_code: z.string().optional(),
  contact_person: z.string().optional(),
  contact_email: z.string().email().optional().or(z.literal('')),
  contact_phone: z.string().optional(),
  working_hours_json: z.string().optional(),
  office_gst_number: z.string().optional(),
  office_status: z.string(),
  plan_uuid: z.string().optional(),
  trial_days: z.coerce.number().optional(),
  subscription_type: z.string(),
  billing_cycle: z.string(),
  starts_at: z.string().optional(),
  expires_at: z.string().optional(),
  trial_starts_at: z.string().optional(),
  trial_ends_at: z.string().optional(),
  renewal_type: z.string(),
  auto_renew: z.boolean()
});

type TenantForm = z.infer<typeof tenantSchema>;

function idOf(row?: PlatformTenantRecord | null) {
  return String(row?.uuid ?? row?.id ?? '');
}

function textOf(row: PlatformTenantRecord | null | undefined, keys: string[], fallback = '-') {
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
  return date.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function statusTone(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes('active') || normalized.includes('trial')) return 'success';
  if (normalized.includes('suspend') || normalized.includes('expired')) return 'danger';
  if (normalized.includes('archive') || normalized.includes('delete')) return 'neutral';
  return 'warning';
}

function tenantDefaults(tenant?: PlatformTenantRecord): TenantForm {
  const owner = (tenant?.owner ?? {}) as PlatformTenantRecord;
  return {
    organization_name: textOf(tenant, ['organization_name'], ''),
    legal_name: textOf(tenant, ['legal_name'], ''),
    display_name: textOf(tenant, ['display_name'], ''),
    organization_code: textOf(tenant, ['organization_code'], ''),
    slug: textOf(tenant, ['slug'], ''),
    business_type_id: textOf(tenant, ['business_type_id'], ''),
    industry_id: textOf(tenant, ['industry_id'], ''),
    company_size: textOf(tenant, ['company_size'], 'small'),
    gst_number: textOf(tenant, ['gst_number'], ''),
    pan_number: textOf(tenant, ['pan_number'], ''),
    registration_number: textOf(tenant, ['registration_number'], ''),
    website: textOf(tenant, ['website'], ''),
    description: textOf(tenant, ['description'], ''),
    logo_file_id: textOf(tenant, ['logo_file_id'], ''),
    favicon_file_id: textOf(tenant, ['favicon_file_id'], ''),
    default_currency: textOf(tenant, ['default_currency'], 'INR'),
    default_timezone: textOf(tenant, ['default_timezone'], 'Asia/Kolkata'),
    status: textOf(tenant, ['status', 'tenant_status'], 'trial'),
    owner_first_name: textOf(owner, ['first_name'], ''),
    owner_last_name: textOf(owner, ['last_name'], ''),
    owner_display_name: textOf(owner, ['display_name'], textOf(tenant, ['owner_name'], '')),
    owner_email: textOf(owner, ['email'], textOf(tenant, ['owner_email'], '')),
    owner_mobile: textOf(owner, ['mobile'], ''),
    owner_password: '',
    owner_send_invite: false,
    owner_status: textOf(owner, ['status'], 'active'),
    office_name: 'Head Office',
    office_code: 'HO',
    office_type: 'head_office',
    address_line_1: '',
    address_line_2: '',
    landmark: '',
    country_id: textOf(tenant, ['country_id'], ''),
    state_id: '',
    city_id: '',
    postal_code: '',
    contact_person: textOf(owner, ['display_name'], textOf(tenant, ['owner_name'], '')),
    contact_email: textOf(owner, ['email'], textOf(tenant, ['owner_email'], '')),
    contact_phone: textOf(owner, ['mobile'], ''),
    working_hours_json: '{"mon_fri":"09:00-18:00"}',
    office_gst_number: textOf(tenant, ['gst_number'], ''),
    office_status: 'active',
    plan_uuid: textOf(tenant, ['plan_uuid'], ''),
    trial_days: 14,
    subscription_type: 'trial',
    billing_cycle: 'monthly',
    starts_at: '',
    expires_at: '',
    trial_starts_at: '',
    trial_ends_at: textOf(tenant, ['trial_ends_at'], ''),
    renewal_type: 'manual',
    auto_renew: false
  };
}

function parseJsonObject(value: string | undefined) {
  if (!value?.trim()) return undefined;
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

function cleanTenantPayload(values: TenantForm, includeNested: boolean): TenantCreatePayload {
  const payload: TenantCreatePayload = {
    organization_name: values.organization_name,
    legal_name: values.legal_name || undefined,
    display_name: values.display_name || undefined,
    organization_code: values.organization_code,
    slug: values.slug,
    business_type_id: values.business_type_id || undefined,
    industry_id: values.industry_id || undefined,
    company_size: values.company_size || undefined,
    gst_number: values.gst_number || undefined,
    pan_number: values.pan_number || undefined,
    registration_number: values.registration_number || undefined,
    website: values.website || undefined,
    description: values.description || undefined,
    logo_file_id: values.logo_file_id || undefined,
    favicon_file_id: values.favicon_file_id || undefined,
    default_currency: values.default_currency,
    default_timezone: values.default_timezone,
    status: values.status,
    plan_uuid: values.plan_uuid || undefined,
    trial_days: values.trial_days
  };

  if (!includeNested) return payload;

  payload.owner = {
    first_name: values.owner_first_name,
    last_name: values.owner_last_name,
    display_name: values.owner_display_name || `${values.owner_first_name ?? ''} ${values.owner_last_name ?? ''}`.trim(),
    email: values.owner_email,
    mobile: values.owner_mobile || undefined,
    password: values.owner_password || undefined,
    send_invite: values.owner_send_invite,
    status: values.owner_status
  };
  payload.office = {
    office_name: values.office_name,
    office_code: values.office_code || 'HO',
    office_type: values.office_type,
    is_head_office: true,
    is_default: true,
    address_line_1: values.address_line_1,
    address_line_2: values.address_line_2 || undefined,
    landmark: values.landmark || undefined,
    country_id: values.country_id || undefined,
    state_id: values.state_id || undefined,
    city_id: values.city_id || undefined,
    postal_code: values.postal_code || undefined,
    contact_person: values.contact_person || values.owner_display_name,
    contact_email: values.contact_email || values.owner_email,
    contact_phone: values.contact_phone || values.owner_mobile,
    timezone: values.default_timezone,
    working_hours: parseJsonObject(values.working_hours_json),
    gst_number: values.office_gst_number || values.gst_number || undefined,
    status: values.office_status
  };
  payload.subscription = {
    plan_id: values.plan_uuid || undefined,
    type: values.subscription_type,
    billing_cycle: values.billing_cycle,
    starts_at: values.starts_at || undefined,
    expires_at: values.expires_at || undefined,
    trial_starts_at: values.trial_starts_at || undefined,
    trial_ends_at: values.trial_ends_at || undefined,
    renewal_type: values.renewal_type,
    auto_renew: values.auto_renew
  };

  return payload;
}

export function PlatformTenantsListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<PlatformTenantRecord | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [modal, setModal] = useState<TenantModal>(null);
  const [drawer, setDrawer] = useState<TenantDrawer>(null);
  const query = createListQuery({
    page,
    per_page: 25,
    search,
    filter: {
      status: filters.status || undefined,
      plan_id: filters.plan_id || undefined,
      subscription_status: filters.subscription_status || undefined,
      trial_ending_before: filters.trial_ending_before || undefined,
      industry_id: filters.industry_id || undefined,
      business_type_id: filters.business_type_id || undefined,
      country_id: filters.country_id || undefined,
      created_from: filters.created_from || undefined,
      created_to: filters.created_to || undefined
    }
  });
  const listQuery = useQuery({
    queryKey: platformQueryKeys.list('platform-tenants', query),
    queryFn: () => platformTenantsApi.list(query)
  });
  const rows = listQuery.data?.data ?? [];
  const actionMutation = useMutation({
    mutationFn: ({ action, tenant, payload }: { action: string; tenant: PlatformTenantRecord; payload: Record<string, unknown> }) => {
      const id = idOf(tenant);
      if (action === 'activate') return platformTenantsApi.activate(id, payload);
      if (action === 'archive') return platformTenantsApi.archive(id, payload);
      if (action === 'delete') return platformTenantsApi.delete(id, payload);
      throw new Error(`Unsupported tenant action ${action}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: platformQueryKeys.resource('platform-tenants') })
  });

  const columns = useMemo<DataTableColumn<PlatformTenantRecord>[]>(() => [
    { id: 'organization_name', header: 'Tenant', accessor: (row) => row.organization_name, enableSorting: true, enableHiding: false, cell: (row) => <TenantIdentity row={row} /> },
    { id: 'organization_code', header: 'Code', accessor: (row) => row.organization_code, cell: (row) => <span className="muted-cell">{textOf(row, ['organization_code'])}</span> },
    { id: 'owner', header: 'Owner', accessor: (row) => textOf(row, ['owner_email']), cell: (row) => <OwnerCell row={row} /> },
    { id: 'business', header: 'Business', accessor: (row) => row.industry, cell: (row) => <span className="date-cell"><strong>{textOf(row, ['industry'])}</strong><small>{textOf(row, ['business_type'])}</small></span> },
    { id: 'plan', header: 'Plan', accessor: (row) => row.current_plan ?? row.plan_name, cell: (row) => textOf(row, ['current_plan', 'plan_name']) },
    { id: 'subscription_status', header: 'Subscription', accessor: (row) => row.subscription_status, cell: (row) => <CompactStatus status={textOf(row, ['subscription_status'], 'unknown')} /> },
    { id: 'status', header: 'Tenant Status', accessor: (row) => row.status ?? row.tenant_status, enableSorting: true, cell: (row) => <StatusBadge tone={statusTone(textOf(row, ['status', 'tenant_status'], 'inactive'))}>{textOf(row, ['status', 'tenant_status'])}</StatusBadge> },
    { id: 'trial_ends_at', header: 'Trial Ends', accessor: (row) => row.trial_ends_at, enableSorting: true, cell: (row) => formatDate(row.trial_ends_at) },
    { id: 'usage', header: 'Usage', cell: (row) => <span className="date-cell"><strong>{textOf(row, ['users_count'], '0')} users</strong><small>{textOf(row, ['storage_used'], '0')} storage</small></span> },
    { id: 'created_at', header: 'Created', accessor: (row) => row.created_at, enableSorting: true, cell: (row) => formatDate(row.created_at) },
    { id: 'actions', header: 'Actions', enableHiding: false, cell: (row) => (
      <TenantActionsMenu
        row={row}
        onView={() => navigate(`${PLATFORM_ROUTES.tenants}/${idOf(row)}`)}
        onEdit={() => navigate(`${PLATFORM_ROUTES.tenants}/${idOf(row)}/edit`)}
        onModal={(next) => { setSelectedTenant(row); setModal(next); }}
        onDrawer={(next) => { setSelectedTenant(row); setDrawer(next); }}
        onActivate={() => actionMutation.mutate({ action: 'activate', tenant: row, payload: { reason: 'Tenant activated from list', notify_owner: true } })}
      />
    ) }
  ], [actionMutation, navigate]);

  return (
    <section className="enterprise-module-page platform-access-page admin-master-page">
      <PageHeader
        breadcrumbs={<AdminBreadcrumbs items={['Platform', 'Tenants']} />}
        title="Tenants"
        description="Manage SaaS tenant organizations, owners, offices, subscriptions, usage, modules, security and lifecycle actions."
        actions={
          <PermissionButton guard="platform" permission="tenant.create" type="button" onClick={() => navigate(`${PLATFORM_ROUTES.tenants}/create`)}>
            <Plus size={16} aria-hidden />
            Create Tenant
          </PermissionButton>
        }
      />

      <TenantStats rows={rows} />

      <DataTable
        columns={columns}
        data={rows}
        getRowId={idOf}
        loading={listQuery.isLoading}
        error={listQuery.isError ? errorMessage(listQuery.error) : ''}
        searchValue={search}
        searchPlaceholder="Search tenants..."
        onSearchChange={setSearch}
        onOpenFilters={() => setDrawer('filters')}
        onOpenColumns={() => setModal('columns')}
        onOpenSavedViews={() => setModal('views')}
        onOpenExport={() => setModal('export')}
        selectedRowIds={selectedIds}
        onSelectionChange={setSelectedIds}
        page={page}
        total={listQuery.data?.total ?? rows.length}
        onPageChange={setPage}
        bulkActions={<div className="table-actions"><Button type="button" size="sm" variant="secondary" onClick={() => setModal('export')}>Export Selected</Button></div>}
      />

      <TenantControls
        modal={modal}
        drawer={drawer}
        tenant={selectedTenant}
        filters={filters}
        onFiltersChange={setFilters}
        onClose={() => { setModal(null); setDrawer(null); }}
        onAction={(action, payload) => selectedTenant && actionMutation.mutate({ action, tenant: selectedTenant, payload })}
      />
    </section>
  );
}

export function PlatformTenantCreatePage() {
  return <TenantFormPage />;
}

export function PlatformTenantEditPage() {
  const { id = '' } = useParams();
  return <TenantLoader id={id}>{(tenant) => <TenantFormPage tenant={tenant} />}</TenantLoader>;
}

function TenantFormPage({ tenant }: { tenant?: PlatformTenantRecord }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const form = useForm<TenantForm>({ resolver: zodResolver(tenantSchema), defaultValues: tenantDefaults(tenant) });
  const mutation = useMutation({
    mutationFn: (values: TenantForm) => tenant
      ? platformTenantsApi.update(idOf(tenant), cleanTenantPayload(values, false))
      : platformTenantsApi.create(cleanTenantPayload(values, true)),
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({ queryKey: platformQueryKeys.resource('platform-tenants') });
      navigate(`${PLATFORM_ROUTES.tenants}/${idOf(saved) || idOf(tenant)}`);
    }
  });
  const steps = ['Organization', 'Owner', 'Head Office', 'Subscription', 'Review'];
  const isEdit = Boolean(tenant);

  useEffect(() => {
    form.reset(tenantDefaults(tenant));
  }, [form, tenant]);

  function submit(values: TenantForm) {
    if (!isEdit && step < steps.length - 1) {
      setStep((current) => current + 1);
      return;
    }
    mutation.mutate(values);
  }

  return (
    <section className="enterprise-module-page platform-access-page">
      <PageHeader
        breadcrumbs={<AdminBreadcrumbs items={['Platform', 'Tenants', isEdit ? 'Edit Tenant' : 'Create Tenant']} />}
        title={isEdit ? `Edit ${textOf(tenant, ['organization_name', 'display_name'])}` : 'Create Tenant'}
        description={isEdit ? 'Update organization defaults and legal metadata.' : 'Organization, owner, head office, subscription, then review before creation.'}
        actions={<Button type="button" variant="secondary" onClick={() => navigate(PLATFORM_ROUTES.tenants)}>Back</Button>}
      />
      {!isEdit ? <WizardSteps steps={steps} active={step} onSelect={setStep} /> : null}
      {mutation.error ? <div className="surface-error">{errorMessage(mutation.error)}</div> : null}
      <form className="rbac-form-shell" onSubmit={form.handleSubmit(submit)}>
        <article className="enterprise-form">
          {(isEdit || step === 0) ? <OrganizationStep form={form} /> : null}
          {!isEdit && step === 1 ? <OwnerStep form={form} /> : null}
          {!isEdit && step === 2 ? <OfficeStep form={form} /> : null}
          {!isEdit && step === 3 ? <SubscriptionStep form={form} /> : null}
          {!isEdit && step === 4 ? <ReviewStep values={form.watch()} /> : null}
        </article>
        <aside className="rbac-side-panel">
          <h2>{isEdit ? 'Edit Scope' : steps[step]}</h2>
          <p>{isEdit ? 'Nested owner, office and subscription changes use their dedicated APIs once available.' : 'The create request uses the completed API curl shape with top-level tenant fields plus owner, office and subscription sections.'}</p>
          <RecordDetails record={{ status: form.watch('status'), slug: form.watch('slug'), plan_uuid: form.watch('plan_uuid'), trial_days: form.watch('trial_days') }} />
        </aside>
        <footer className="enterprise-form__footer rbac-sticky-footer">
          <Button type="button" variant="secondary" onClick={() => step > 0 && !isEdit ? setStep(step - 1) : navigate(PLATFORM_ROUTES.tenants)}>Cancel</Button>
          {!isEdit && step < steps.length - 1 ? (
            <Button type="submit">Next</Button>
          ) : (
            <PermissionButton guard="platform" permission={isEdit ? 'tenant.edit' : 'tenant.create'} type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : 'Save Tenant'}
            </PermissionButton>
          )}
        </footer>
      </form>
    </section>
  );
}

export function PlatformTenantViewPage() {
  const { id = '' } = useParams();
  return <TenantLoader id={id}>{(tenant) => <TenantView tenant={tenant} />}</TenantLoader>;
}

function TenantLoader({ id, children }: { id: string; children: (tenant: PlatformTenantRecord) => ReactNode }) {
  const query = useQuery({
    queryKey: platformQueryKeys.detail('platform-tenants', id),
    queryFn: () => platformTenantsApi.detail(id)
  });
  if (query.isLoading) return <div className="surface-state">Loading tenant...</div>;
  if (query.isError) return <div className="surface-error">{errorMessage(query.error)}</div>;
  if (!query.data) return <div className="empty-state">Tenant not found.</div>;
  return <>{children(query.data)}</>;
}

function TenantView({ tenant }: { tenant: PlatformTenantRecord }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [modal, setModal] = useState<TenantModal>(null);
  const [drawer, setDrawer] = useState<TenantDrawer>(null);
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'users', label: 'Owner/Users' },
    { id: 'offices', label: 'Offices' },
    { id: 'subscription', label: 'Subscription' },
    { id: 'billing', label: 'Billing' },
    { id: 'usage', label: 'Usage' },
    { id: 'modules', label: 'Modules/Features' },
    { id: 'settings', label: 'Settings' },
    { id: 'integrations', label: 'Integrations' },
    { id: 'security', label: 'Security' },
    { id: 'support', label: 'Support' },
    { id: 'files', label: 'Files' },
    { id: 'activity', label: 'Activity' }
  ];
  const mutation = useMutation({
    mutationFn: ({ action, payload }: { action: string; payload: Record<string, unknown> }) => {
      if (action === 'archive') return platformTenantsApi.archive(idOf(tenant), payload);
      if (action === 'delete') return platformTenantsApi.delete(idOf(tenant), payload);
      if (action === 'activate') return platformTenantsApi.activate(idOf(tenant), payload);
      return Promise.resolve({ data: null });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: platformQueryKeys.detail('platform-tenants', idOf(tenant)) })
  });

  return (
    <section className="enterprise-module-page platform-access-page">
      <PageHeader
        breadcrumbs={<AdminBreadcrumbs items={['Platform', 'Tenants', textOf(tenant, ['organization_name', 'display_name'])]} />}
        title={textOf(tenant, ['organization_name', 'display_name'])}
        description={`${textOf(tenant, ['slug'])} / ${textOf(tenant, ['owner_email'])} / ${formatDate(tenant.created_at)}`}
        meta={<StatusBadge tone={statusTone(textOf(tenant, ['status', 'tenant_status'], 'inactive'))}>{textOf(tenant, ['status', 'tenant_status'])}</StatusBadge>}
        tabs={<Tabs tabs={tabs} activeId={activeTab} onChange={setActiveTab} ariaLabel="Tenant tabs" />}
        actions={
          <>
            <Button type="button" variant="secondary" onClick={() => navigate(PLATFORM_ROUTES.tenants)}>Back</Button>
            <PermissionButton guard="platform" permission="tenant.edit" type="button" onClick={() => navigate(`${PLATFORM_ROUTES.tenants}/${idOf(tenant)}/edit`)}>
              <Pencil size={16} aria-hidden />
              Edit
            </PermissionButton>
            <PermissionButton guard="platform" permission="tenant.impersonate" type="button" variant="secondary" onClick={() => setModal('remoteLogin')}>
              <LogIn size={16} aria-hidden />
              Remote Login
            </PermissionButton>
          </>
        }
      />

      <section className="platform-access-summary">
        <SummaryTile icon={<Building2 />} label="Plan" value={textOf(tenant, ['current_plan', 'plan_name'])} />
        <SummaryTile icon={<CheckCircle2 />} label="Subscription" value={textOf(tenant, ['subscription_status'])} />
        <SummaryTile icon={<Users />} label="Users" value={textOf(tenant, ['users_count'], '0')} />
        <SummaryTile icon={<CalendarPlus />} label="Trial Ends" value={formatDate(tenant.trial_ends_at)} />
      </section>

      <div className="enterprise-view-actions">
        <PermissionButton guard="platform" permission="subscription.edit" type="button" size="sm" variant="secondary" onClick={() => setModal('changePlan')}>Change Plan</PermissionButton>
        <PermissionButton guard="platform" permission="subscription.edit" type="button" size="sm" variant="secondary" onClick={() => setModal('extendTrial')}>Extend Trial</PermissionButton>
        <PermissionButton guard="platform" permission="tenant.suspend" type="button" size="sm" variant="danger" onClick={() => setModal('suspend')}>Suspend</PermissionButton>
        <PermissionButton guard="platform" permission="tenant.activate" type="button" size="sm" variant="secondary" onClick={() => setModal('reactivate')}>Reactivate</PermissionButton>
        <PermissionButton guard="platform" permission="tenant.edit" type="button" size="sm" variant="secondary" onClick={() => setModal('resetOwnerPassword')}>Owner Reset</PermissionButton>
        <PermissionButton guard="platform" permission="module.edit" type="button" size="sm" variant="secondary" onClick={() => setDrawer('moduleOverride')}>Module Overrides</PermissionButton>
        <Button type="button" size="sm" variant="secondary" onClick={() => setDrawer('usageDetail')}>Usage Detail</Button>
        <Button type="button" size="sm" variant="secondary" onClick={() => setDrawer('settingsPreview')}>Settings Preview</Button>
        <PermissionButton guard="platform" permission="tenant.delete" type="button" size="sm" variant="danger" onClick={() => setModal('delete')}>Delete</PermissionButton>
      </div>

      <article className="enterprise-view-panel">
        {activeTab === 'overview' ? <SafeRecordDetails record={tenant} /> : null}
        {activeTab !== 'overview' ? <TenantRelationTab tenant={tenant} relation={relationForTab(activeTab)} /> : null}
      </article>

      <TenantControls
        modal={modal}
        drawer={drawer}
        tenant={tenant}
        onClose={() => { setModal(null); setDrawer(null); }}
        onAction={(action, payload) => mutation.mutate({ action, payload })}
      />
    </section>
  );
}

function relationForTab(tab: string) {
  if (tab === 'users') return 'users';
  if (tab === 'security') return 'security-events';
  return tab;
}

function TenantRelationTab({ tenant, relation }: { tenant: PlatformTenantRecord; relation: string }) {
  const query = useQuery({
    queryKey: platformQueryKeys.related('platform-tenants', idOf(tenant), relation),
    queryFn: () => platformTenantsApi.relation(idOf(tenant), relation)
  });
  if (query.isLoading) return <div className="surface-state">Loading {relation}...</div>;
  if (query.isError) return <div className="surface-error">{errorMessage(query.error)}</div>;
  const rows = query.data?.data ?? [];
  if (rows.length > 0) return <RecordList rows={rows} />;
  return <SafeRecordDetails record={(query.data?.raw as Record<string, unknown>) ?? {}} />;
}

function TenantControls({
  modal,
  drawer,
  tenant,
  filters = {},
  onFiltersChange,
  onClose,
  onAction
}: {
  modal: TenantModal;
  drawer: TenantDrawer;
  tenant: PlatformTenantRecord | null;
  filters?: Record<string, string>;
  onFiltersChange?: (filters: Record<string, string>) => void;
  onClose: () => void;
  onAction?: (action: string, payload: Record<string, unknown>) => void;
}) {
  return (
    <>
      <TenantFiltersDrawer open={drawer === 'filters'} filters={filters} onChange={onFiltersChange} onClose={onClose} />
      <SavedViewsModal
        open={modal === 'views'}
        onClose={onClose}
        guard="platform"
        permission="tenant.view"
        views={[{ id: 'all', name: 'All tenants', visibility: 'shared', isDefault: true }, { id: 'trials', name: 'Trials ending soon', visibility: 'personal' }]}
        activeViewId="all"
        onSelect={onClose}
        onSaveCurrent={onClose}
      />
      <ColumnManagerModal
        open={modal === 'columns'}
        onClose={onClose}
        guard="platform"
        permission="tenant.view"
        columns={['Tenant', 'Code', 'Owner', 'Business', 'Plan', 'Subscription', 'Status', 'Trial Ends', 'Usage', 'Created'].map((label) => ({ id: label.toLowerCase().replace(/\s+/g, '_'), label, visible: true }))}
        onToggle={() => undefined}
        onReset={() => undefined}
        onSave={onClose}
      />
      <ExportModal
        open={modal === 'export'}
        onClose={onClose}
        guard="platform"
        permission="tenant.view"
        columns={['Tenant', 'Slug', 'Owner', 'Business type', 'Industry', 'Plan', 'Subscription', 'Status', 'Trial ends', 'Created']}
        onExport={onClose}
      />
      <ChangePlanModal open={modal === 'changePlan'} tenant={tenant} onClose={onClose} />
      <ExtendTrialModal open={modal === 'extendTrial'} tenant={tenant} onClose={onClose} />
      <SuspendReactivateModal open={modal === 'suspend'} tenant={tenant} mode="suspend" onClose={onClose} />
      <SuspendReactivateModal open={modal === 'reactivate'} tenant={tenant} mode="reactivate" onClose={onClose} />
      <RemoteLoginModal open={modal === 'remoteLogin'} tenant={tenant} onClose={onClose} />
      <OwnerResetPasswordModal open={modal === 'resetOwnerPassword'} tenant={tenant} onClose={onClose} />
      <ModuleOverrideDrawer open={drawer === 'moduleOverride'} tenant={tenant} onClose={onClose} />
      <UsageDetailDrawer open={drawer === 'usageDetail'} tenant={tenant} onClose={onClose} />
      <SettingsPreviewDrawer open={drawer === 'settingsPreview'} tenant={tenant} onClose={onClose} />
      <ConfirmDialog
        open={modal === 'archive'}
        onClose={onClose}
        title="Archive tenant"
        description={`Archive ${textOf(tenant, ['organization_name', 'display_name'], 'this tenant')}?`}
        confirmLabel="Archive"
        reasonRequired
        guard="platform"
        permission="tenant.delete"
        onConfirm={(payload) => { onAction?.('archive', { reason: payload.reason ?? 'Tenant archived', notify_owner: true }); onClose(); }}
      />
      <ConfirmDialog
        open={modal === 'delete'}
        onClose={onClose}
        title="Delete tenant"
        description={`Soft delete ${textOf(tenant, ['organization_name', 'display_name'], 'this tenant')}. Type DELETE to confirm.`}
        confirmLabel="Delete"
        confirmTone="danger"
        typedConfirmation="DELETE"
        reasonRequired
        guard="platform"
        permission="tenant.delete"
        onConfirm={(payload) => { onAction?.('delete', { reason: payload.reason ?? 'Tenant deleted', notify_owner: true }); onClose(); }}
      />
    </>
  );
}

function TenantFiltersDrawer({ open, filters, onChange, onClose }: { open: boolean; filters: Record<string, string>; onChange?: (filters: Record<string, string>) => void; onClose: () => void }) {
  const [draft, setDraft] = useState(filters);
  useEffect(() => setDraft(filters), [filters, open]);
  const field = (name: string, label: string, input: ReactNode) => ({ name, label, input });
  return (
    <AdvancedFiltersDrawer
      open={open}
      onClose={onClose}
      guard="platform"
      permission="tenant.view"
      fields={[
        field('status', 'Tenant status', <select value={draft.status ?? ''} onChange={(event) => setDraft({ ...draft, status: event.target.value })}><option value="">Any status</option><option value="trial">Trial</option><option value="active">Active</option><option value="suspended">Suspended</option><option value="expired">Expired</option><option value="archived">Archived</option></select>),
        field('plan_id', 'Plan UUID', <input value={draft.plan_id ?? ''} onChange={(event) => setDraft({ ...draft, plan_id: event.target.value })} />),
        field('subscription_status', 'Subscription status', <select value={draft.subscription_status ?? ''} onChange={(event) => setDraft({ ...draft, subscription_status: event.target.value })}><option value="">Any subscription</option><option value="trial">Trial</option><option value="active">Active</option><option value="past_due">Past due</option><option value="cancelled">Cancelled</option></select>),
        field('trial_ending_before', 'Trial ending before', <input type="date" value={draft.trial_ending_before ?? ''} onChange={(event) => setDraft({ ...draft, trial_ending_before: event.target.value })} />),
        field('industry_id', 'Industry ID', <input value={draft.industry_id ?? ''} onChange={(event) => setDraft({ ...draft, industry_id: event.target.value })} />),
        field('business_type_id', 'Business type ID', <input value={draft.business_type_id ?? ''} onChange={(event) => setDraft({ ...draft, business_type_id: event.target.value })} />),
        field('country_id', 'Country ID', <input value={draft.country_id ?? ''} onChange={(event) => setDraft({ ...draft, country_id: event.target.value })} />),
        field('created_from', 'Created from', <input type="date" value={draft.created_from ?? ''} onChange={(event) => setDraft({ ...draft, created_from: event.target.value })} />),
        field('created_to', 'Created to', <input type="date" value={draft.created_to ?? ''} onChange={(event) => setDraft({ ...draft, created_to: event.target.value })} />)
      ]}
      onApply={() => { onChange?.(draft); onClose(); }}
      onReset={() => { setDraft({}); onChange?.({}); }}
    />
  );
}

function ChangePlanModal({ open, tenant, onClose }: { open: boolean; tenant: PlatformTenantRecord | null; onClose: () => void }) {
  const [planUuid, setPlanUuid] = useState('');
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [effectiveDate, setEffectiveDate] = useState('');
  return <TenantModalShell open={open} onClose={onClose} title="Change plan" permission="subscription.edit" submitLabel="Queue plan change" onSubmit={onClose}>
    <RecordDetails record={{ current_plan: textOf(tenant, ['current_plan', 'plan_name']), subscription_status: textOf(tenant, ['subscription_status']) }} />
    <SimpleInput label="New plan UUID" value={planUuid} onChange={setPlanUuid} />
    <label>Billing cycle<select value={billingCycle} onChange={(event) => setBillingCycle(event.target.value)}><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select></label>
    <SimpleInput label="Effective date" type="date" value={effectiveDate} onChange={setEffectiveDate} />
    <div className="surface-state">Proration preview will appear here when the subscription change endpoint is connected.</div>
  </TenantModalShell>;
}

function ExtendTrialModal({ open, tenant, onClose }: { open: boolean; tenant: PlatformTenantRecord | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [trialEndsAt, setTrialEndsAt] = useState('');
  const [reason, setReason] = useState('Sales-approved extension');
  const [notifyOwner, setNotifyOwner] = useState(true);
  const mutation = useMutation({
    mutationFn: () => platformTenantsApi.extendTrial(idOf(tenant), { trial_ends_at: trialEndsAt, reason }),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: platformQueryKeys.resource('platform-tenants') }); onClose(); }
  });
  return <TenantModalShell open={open} onClose={onClose} title="Extend trial" permission="subscription.edit" submitLabel="Extend trial" loading={mutation.isPending} error={mutation.error} onSubmit={() => mutation.mutate()}>
    <RecordDetails record={{ current_trial_end: formatDate(tenant?.trial_ends_at), notify_owner: notifyOwner }} />
    <SimpleInput label="New trial end" type="datetime-local" value={trialEndsAt} onChange={setTrialEndsAt} />
    <SimpleTextarea label="Reason" value={reason} onChange={setReason} />
    <label className="check-row"><input checked={notifyOwner} type="checkbox" onChange={(event) => setNotifyOwner(event.target.checked)} /> Notify owner</label>
  </TenantModalShell>;
}

function SuspendReactivateModal({ open, tenant, mode, onClose }: { open: boolean; tenant: PlatformTenantRecord | null; mode: 'suspend' | 'reactivate'; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [typed, setTyped] = useState('');
  const [reason, setReason] = useState(mode === 'suspend' ? 'Payment overdue' : 'Tenant access restored');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [blockLogin, setBlockLogin] = useState(mode === 'suspend');
  const [notifyOwner, setNotifyOwner] = useState(true);
  const canSubmit = reason.trim().length > 0 && (mode === 'reactivate' || typed === 'SUSPEND');
  const mutation = useMutation({
    mutationFn: () => mode === 'suspend'
      ? platformTenantsApi.suspend(idOf(tenant), { reason, notify_owner: notifyOwner, suspended_until: effectiveDate || null, block_login: blockLogin })
      : platformTenantsApi.reactivate(idOf(tenant), { reason, notify_owner: notifyOwner, effective_date: effectiveDate || undefined, block_login: false }),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: platformQueryKeys.resource('platform-tenants') }); onClose(); }
  });
  return (
    <AppModal open={open} onClose={onClose} title={mode === 'suspend' ? 'Suspend tenant' : 'Reactivate tenant'} guard="platform" permission={mode === 'suspend' ? 'tenant.suspend' : 'tenant.activate'} loading={mutation.isPending} error={mutation.error ? errorMessage(mutation.error) : null} footer={<><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="button" variant={mode === 'suspend' ? 'danger' : 'primary'} disabled={!canSubmit} onClick={() => mutation.mutate()}>{mode === 'suspend' ? 'Suspend' : 'Reactivate'}</Button></>}>
      <div className="form-grid">
        {mode === 'suspend' ? <div className="surface-error">Type SUSPEND in the field below before submitting this availability-changing action.</div> : null}
        {mode === 'suspend' ? <SimpleInput label="Type SUSPEND" value={typed} onChange={setTyped} /> : null}
        <SimpleTextarea label="Reason" value={reason} onChange={setReason} />
        <SimpleInput label={mode === 'suspend' ? 'Suspended until' : 'Effective date'} value={effectiveDate} onChange={setEffectiveDate} type="date" />
        <label className="check-row"><input checked={blockLogin} type="checkbox" disabled={mode === 'reactivate'} onChange={(event) => setBlockLogin(event.target.checked)} /> Block login</label>
        <label className="check-row"><input checked={notifyOwner} type="checkbox" onChange={(event) => setNotifyOwner(event.target.checked)} /> Notify owner</label>
      </div>
    </AppModal>
  );
}

function RemoteLoginModal({ open, tenant, onClose }: { open: boolean; tenant: PlatformTenantRecord | null; onClose: () => void }) {
  const [typed, setTyped] = useState('');
  const [reason, setReason] = useState('Debug billing setup with customer approval');
  const [duration, setDuration] = useState(30);
  const [targetUserUuid, setTargetUserUuid] = useState('');
  const mutation = useMutation({
    mutationFn: () => platformTenantsApi.impersonate(idOf(tenant), { reason, duration_minutes: duration, target_user_uuid: targetUserUuid || undefined }),
    onSuccess: onClose
  });
  const ok = typed === 'LOGIN' && reason.trim().length > 0;
  return (
    <AppModal open={open} onClose={onClose} title="Remote login" guard="platform" permission="tenant.impersonate" loading={mutation.isPending} error={mutation.error ? errorMessage(mutation.error) : null} footer={<><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="button" disabled={!ok} onClick={() => mutation.mutate()}>Start session</Button></>}>
      <div className="form-grid">
        <div className="surface-error">Remote login is a security-sensitive action. Type LOGIN to confirm customer-approved access.</div>
        <SimpleTextarea label="Reason" value={reason} onChange={setReason} />
        <SimpleInput label="Duration minutes" type="number" value={String(duration)} onChange={(value) => setDuration(Number(value))} />
        <SimpleInput label="Target user UUID" value={targetUserUuid} onChange={setTargetUserUuid} />
        <SimpleInput label="Type LOGIN" value={typed} onChange={setTyped} />
      </div>
    </AppModal>
  );
}

function OwnerResetPasswordModal({ open, tenant, onClose }: { open: boolean; tenant: PlatformTenantRecord | null; onClose: () => void }) {
  const [mode, setMode] = useState('send_link');
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [forceChange, setForceChange] = useState(true);
  return <TenantModalShell open={open} onClose={onClose} title="Owner reset password" permission="tenant.edit" submitLabel="Reset owner password" onSubmit={onClose}>
    <RecordDetails record={{ owner: textOf(tenant, ['owner_email', 'owner_name']) }} />
    <label>Mode<select value={mode} onChange={(event) => setMode(event.target.value)}><option value="send_link">Send reset link</option><option value="temporary_password">Set temporary password</option></select></label>
    {mode === 'temporary_password' ? <SimpleInput label="Temporary password" value={temporaryPassword} onChange={setTemporaryPassword} type="password" /> : null}
    <label className="check-row"><input checked={forceChange} type="checkbox" onChange={(event) => setForceChange(event.target.checked)} /> Force change on login</label>
    <div className="surface-state">Owner-specific reset endpoint is not listed in completed tenant curls; this preserves the required UI surface.</div>
  </TenantModalShell>;
}

function ModuleOverrideDrawer({ open, tenant, onClose }: { open: boolean; tenant: PlatformTenantRecord | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [moduleCode, setModuleCode] = useState('crm');
  const [enabled, setEnabled] = useState(true);
  const [limitsJson, setLimitsJson] = useState('{"users":25}');
  const [reason, setReason] = useState('Custom enterprise agreement');
  const mutation = useMutation({
    mutationFn: () => platformTenantsApi.updateModules(idOf(tenant), { modules: [{ module_code: moduleCode, enabled, limits: parseJsonObject(limitsJson), metadata: { source: 'platform_admin', reason } }] }),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: platformQueryKeys.related('platform-tenants', idOf(tenant), 'modules') }); onClose(); }
  });
  return (
    <AppDrawer open={open} onClose={onClose} title="Module override" guard="platform" permission="module.edit" size="lg" loading={mutation.isPending} error={mutation.error ? errorMessage(mutation.error) : null} footer={<><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="button" onClick={() => mutation.mutate()}>Save overrides</Button></>}>
      <div className="form-grid">
        <SimpleInput label="Module code" value={moduleCode} onChange={setModuleCode} />
        <label className="check-row"><input checked={enabled} type="checkbox" onChange={(event) => setEnabled(event.target.checked)} /> Enabled</label>
        <SimpleTextarea label="Limits JSON" value={limitsJson} onChange={setLimitsJson} />
        <SimpleTextarea label="Reason" value={reason} onChange={setReason} />
      </div>
    </AppDrawer>
  );
}

function UsageDetailDrawer({ open, tenant, onClose }: { open: boolean; tenant: PlatformTenantRecord | null; onClose: () => void }) {
  const query = useQuery({ queryKey: platformQueryKeys.related('platform-tenants', idOf(tenant), 'usage'), queryFn: () => platformTenantsApi.relation(idOf(tenant), 'usage'), enabled: open && Boolean(idOf(tenant)) });
  return <AppDrawer open={open} onClose={onClose} title="Usage detail" guard="platform" permission="tenant.view" size="lg" loading={query.isLoading} error={query.error ? errorMessage(query.error) : null}>
    <RecordList rows={query.data?.data ?? []} fallback={<SafeRecordDetails record={(query.data?.raw as Record<string, unknown>) ?? { users: tenant?.users_count, storage: tenant?.storage_used, api_requests: '-', projects: '-', invoices: '-' }} />} />
  </AppDrawer>;
}

function SettingsPreviewDrawer({ open, tenant, onClose }: { open: boolean; tenant: PlatformTenantRecord | null; onClose: () => void }) {
  const query = useQuery({ queryKey: platformQueryKeys.related('platform-tenants', idOf(tenant), 'settings'), queryFn: () => platformTenantsApi.relation(idOf(tenant), 'settings'), enabled: open && Boolean(idOf(tenant)) });
  const raw = maskSecrets((query.data?.raw as Record<string, unknown>) ?? {}) as Record<string, unknown>;
  return <AppDrawer open={open} onClose={onClose} title="Tenant settings preview" guard="platform" permission="setting.view" size="lg" loading={query.isLoading} error={query.error ? errorMessage(query.error) : null}>
    <SafeRecordDetails record={raw} />
  </AppDrawer>;
}

function maskSecrets(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(maskSecrets);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, entry]) => {
    const sensitive = ['secret', 'token', 'password', 'key', 'credential'].some((needle) => key.toLowerCase().includes(needle));
    return [key, sensitive ? '••••••••' : maskSecrets(entry)];
  }));
}

function TenantModalShell({ open, title, permission, loading, error, children, submitLabel, onSubmit, onClose }: { open: boolean; title: string; permission: string; loading?: boolean; error?: unknown; children: ReactNode; submitLabel: string; onSubmit: () => void; onClose: () => void }) {
  return (
    <AppModal open={open} onClose={onClose} title={title} guard="platform" permission={permission} loading={loading} error={error ? errorMessage(error) : null} footer={<><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="button" onClick={onSubmit}>{submitLabel}</Button></>}>
      <div className="form-grid">{children}</div>
    </AppModal>
  );
}

function TenantActionsMenu(props: {
  row: PlatformTenantRecord;
  onView: () => void;
  onEdit: () => void;
  onModal: (modal: TenantModal) => void;
  onDrawer: (drawer: TenantDrawer) => void;
  onActivate: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  const run = (fn: () => void) => { fn(); setOpen(false); };
  return (
    <div className="row-action-menu">
      <Button type="button" size="sm" variant="ghost" onClick={props.onView}><Eye size={15} aria-hidden /> View</Button>
      <Button type="button" size="sm" variant="ghost" onClick={props.onEdit}><Pencil size={15} aria-hidden /> Edit</Button>
      <button ref={ref} type="button" className="action-menu-trigger" onClick={() => setOpen((current) => !current)} aria-label="Open tenant actions"><MoreVertical size={16} aria-hidden /></button>
      <PortalActionMenu anchorRef={ref} open={open} onClose={() => setOpen(false)}>
        <div className="action-menu tenant-action-menu">
          <PermissionButton guard="platform" permission="tenant.activate" type="button" variant="ghost" onMouseDown={(event) => event.preventDefault()} onClick={() => run(props.onActivate)}><CheckCircle2 size={15} aria-hidden /> Activate</PermissionButton>
          <PermissionButton guard="platform" permission="subscription.edit" type="button" variant="ghost" onMouseDown={(event) => event.preventDefault()} onClick={() => run(() => props.onModal('changePlan'))}><Layers3 size={15} aria-hidden /> Change Plan</PermissionButton>
          <PermissionButton guard="platform" permission="subscription.edit" type="button" variant="ghost" onMouseDown={(event) => event.preventDefault()} onClick={() => run(() => props.onModal('extendTrial'))}><CalendarPlus size={15} aria-hidden /> Extend Trial</PermissionButton>
          <PermissionButton guard="platform" permission="tenant.suspend" type="button" variant="ghost" onMouseDown={(event) => event.preventDefault()} onClick={() => run(() => props.onModal('suspend'))}><ShieldAlert size={15} aria-hidden /> Suspend</PermissionButton>
          <PermissionButton guard="platform" permission="tenant.activate" type="button" variant="ghost" onMouseDown={(event) => event.preventDefault()} onClick={() => run(() => props.onModal('reactivate'))}><RotateCcw size={15} aria-hidden /> Reactivate</PermissionButton>
          <PermissionButton guard="platform" permission="tenant.impersonate" type="button" variant="ghost" onMouseDown={(event) => event.preventDefault()} onClick={() => run(() => props.onModal('remoteLogin'))}><LogIn size={15} aria-hidden /> Remote Login</PermissionButton>
          <PermissionButton guard="platform" permission="tenant.edit" type="button" variant="ghost" onMouseDown={(event) => event.preventDefault()} onClick={() => run(() => props.onModal('resetOwnerPassword'))}><KeyRound size={15} aria-hidden /> Owner Reset</PermissionButton>
          <PermissionButton guard="platform" permission="module.edit" type="button" variant="ghost" onMouseDown={(event) => event.preventDefault()} onClick={() => run(() => props.onDrawer('moduleOverride'))}><Settings size={15} aria-hidden /> Modules</PermissionButton>
          <PermissionButton guard="platform" permission="tenant.delete" type="button" variant="ghost" onMouseDown={(event) => event.preventDefault()} onClick={() => run(() => props.onModal('archive'))}><Archive size={15} aria-hidden /> Archive</PermissionButton>
          <PermissionButton guard="platform" permission="tenant.delete" type="button" variant="ghost" onMouseDown={(event) => event.preventDefault()} onClick={() => run(() => props.onModal('delete'))}><Trash2 size={15} aria-hidden /> Delete</PermissionButton>
        </div>
      </PortalActionMenu>
    </div>
  );
}

function PortalActionMenu({ anchorRef, children, onClose, open }: { anchorRef: React.RefObject<HTMLElement>; children: ReactNode; onClose: () => void; open: boolean }) {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  useEffect(() => {
    if (!open) return;
    function syncPosition() {
      const rect = anchorRef.current?.getBoundingClientRect();
      if (!rect) return;
      const menuWidth = 232;
      const estimatedMenuHeight = 382;
      const hasSpaceBelow = rect.bottom + estimatedMenuHeight + 12 <= window.innerHeight;
      const top = hasSpaceBelow ? rect.bottom + 6 : Math.max(8, rect.top - estimatedMenuHeight - 6);
      setPosition({
        top,
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
  return createPortal(<div className="action-menu-portal" style={{ left: position.left, top: position.top }}><button type="button" className="action-menu-backdrop" aria-label="Close actions menu" onClick={onClose} />{children}</div>, document.body);
}

function OrganizationStep({ form }: { form: any }) {
  return <FormSection title="Organization">
    <InputField form={form} name="organization_name" label="Organization name" />
    <InputField form={form} name="legal_name" label="Legal name" />
    <InputField form={form} name="display_name" label="Display name" />
    <InputField form={form} name="organization_code" label="Organization code" />
    <InputField form={form} name="slug" label="Slug" />
    <InputField form={form} name="business_type_id" label="Business type ID" />
    <InputField form={form} name="industry_id" label="Industry ID" />
    <SelectField form={form} name="company_size" label="Company size" options={['small', 'medium', 'large', 'enterprise']} />
    <InputField form={form} name="website" label="Website" />
    <InputField form={form} name="gst_number" label="GST number" />
    <InputField form={form} name="pan_number" label="PAN number" />
    <InputField form={form} name="registration_number" label="Registration number" />
    <InputField form={form} name="logo_file_id" label="Logo file ID" />
    <InputField form={form} name="favicon_file_id" label="Favicon file ID" />
    <InputField form={form} name="default_currency" label="Default currency" />
    <InputField form={form} name="default_timezone" label="Default timezone" />
    <SelectField form={form} name="status" label="Status" options={['trial', 'active', 'inactive', 'suspended']} />
    <div className="modal-form-span"><InputField form={form} name="description" label="Description" type="textarea" /></div>
  </FormSection>;
}

function OwnerStep({ form }: { form: any }) {
  return <FormSection title="Primary Owner">
    <InputField form={form} name="owner_first_name" label="First name" />
    <InputField form={form} name="owner_last_name" label="Last name" />
    <InputField form={form} name="owner_display_name" label="Display name" />
    <InputField form={form} name="owner_email" label="Email" type="email" />
    <InputField form={form} name="owner_mobile" label="Mobile" />
    <InputField form={form} name="owner_password" label="Password" type="password" />
    <SelectField form={form} name="owner_status" label="Status" options={['active', 'inactive', 'invited']} />
    <CheckboxField form={form} name="owner_send_invite" label="Send invite email" />
  </FormSection>;
}

function OfficeStep({ form }: { form: any }) {
  return <FormSection title="Head Office">
    <InputField form={form} name="office_name" label="Office name" />
    <InputField form={form} name="office_code" label="Office code" />
    <SelectField form={form} name="office_type" label="Office type" options={['head_office', 'branch', 'warehouse']} />
    <InputField form={form} name="address_line_1" label="Address line 1" />
    <InputField form={form} name="address_line_2" label="Address line 2" />
    <InputField form={form} name="landmark" label="Landmark" />
    <InputField form={form} name="country_id" label="Country ID" />
    <InputField form={form} name="state_id" label="State ID" />
    <InputField form={form} name="city_id" label="City ID" />
    <InputField form={form} name="postal_code" label="Postal code" />
    <InputField form={form} name="contact_person" label="Contact person" />
    <InputField form={form} name="contact_email" label="Contact email" type="email" />
    <InputField form={form} name="contact_phone" label="Contact phone" />
    <InputField form={form} name="office_gst_number" label="Office GST number" />
    <SelectField form={form} name="office_status" label="Status" options={['active', 'inactive']} />
    <div className="modal-form-span"><InputField form={form} name="working_hours_json" label="Working hours JSON" type="textarea" /></div>
  </FormSection>;
}

function SubscriptionStep({ form }: { form: any }) {
  return <FormSection title="Subscription">
    <InputField form={form} name="plan_uuid" label="Plan UUID" />
    <InputField form={form} name="trial_days" label="Trial days" type="number" />
    <SelectField form={form} name="subscription_type" label="Type" options={['trial', 'paid', 'free']} />
    <SelectField form={form} name="billing_cycle" label="Billing cycle" options={['monthly', 'yearly']} />
    <InputField form={form} name="starts_at" label="Starts at" type="datetime-local" />
    <InputField form={form} name="expires_at" label="Expires at" type="datetime-local" />
    <InputField form={form} name="trial_starts_at" label="Trial starts at" type="datetime-local" />
    <InputField form={form} name="trial_ends_at" label="Trial ends at" type="datetime-local" />
    <SelectField form={form} name="renewal_type" label="Renewal type" options={['manual', 'auto']} />
    <CheckboxField form={form} name="auto_renew" label="Auto renew" />
  </FormSection>;
}

function ReviewStep({ values }: { values: TenantForm }) {
  return <FormSection title="Review"><SafeRecordDetails record={cleanTenantPayload(values, true) as Record<string, unknown>} /></FormSection>;
}

function WizardSteps({ steps, active, onSelect }: { steps: string[]; active: number; onSelect: (step: number) => void }) {
  return <div className="audit-tabs" role="tablist" aria-label="Tenant creation steps">{steps.map((step, index) => <button key={step} type="button" role="tab" aria-selected={active === index} onClick={() => onSelect(index)}>{index + 1}. {step}</button>)}</div>;
}

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return <section className="staff-form-section"><h2>{title}</h2><div className="enterprise-form__grid">{children}</div></section>;
}

function InputField({ form, name, label, placeholder, type = 'text' }: { form: any; name: string; label: string; placeholder?: string; type?: string }) {
  const error = form.formState.errors[name]?.message;
  return <label><span>{label}</span>{type === 'textarea' ? <textarea placeholder={placeholder} {...form.register(name)} /> : <input type={type} placeholder={placeholder} {...form.register(name)} />}{error ? <strong role="alert">{String(error)}</strong> : null}</label>;
}

function SelectField({ form, name, label, options }: { form: any; name: string; label: string; options: string[] }) {
  return <label><span>{label}</span><select {...form.register(name)}>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>;
}

function CheckboxField({ form, name, label }: { form: any; name: string; label: string }) {
  return <label className="check-row"><input type="checkbox" {...form.register(name)} /><span>{label}</span></label>;
}

function SimpleInput({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string }) {
  return <label>{label}<input type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} /></label>;
}

function SimpleTextarea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label>{label}<textarea value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

function TypedGate({ word }: { word: string }) {
  const [typed, setTyped] = useState('');
  return <label>Type {word}<input value={typed} onChange={(event) => setTyped(event.target.value)} aria-invalid={typed !== word} /></label>;
}

function TenantIdentity({ row }: { row: PlatformTenantRecord }) {
  const name = textOf(row, ['organization_name', 'display_name'], 'Tenant');
  const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
  return <span className="role-name-cell">{row.logo_url ? <img className="staff-avatar staff-avatar--compact" src={row.logo_url} alt="" /> : <span className="role-avatar staff-avatar--compact">{initials || 'T'}</span>}<span><strong>{name}</strong><small>{textOf(row, ['slug'])}</small></span></span>;
}

function OwnerCell({ row }: { row: PlatformTenantRecord }) {
  const owner = (row.owner ?? {}) as PlatformTenantRecord;
  return <span className="date-cell"><strong>{textOf(owner, ['display_name'], textOf(row, ['owner_name']))}</strong><small>{textOf(owner, ['email'], textOf(row, ['owner_email']))}</small></span>;
}

function CompactStatus({ status }: { status: string }) {
  const active = ['active', 'trial', 'paid'].includes(status.toLowerCase());
  return <span className={`status-pill ${active ? 'status-pill--active' : 'status-pill--muted'}`}><i aria-hidden />{status}</span>;
}

function TenantStats({ rows }: { rows: PlatformTenantRecord[] }) {
  return <section className="platform-access-summary">
    <SummaryTile icon={<Building2 />} label="Total Tenants" value={String(rows.length)} />
    <SummaryTile icon={<CheckCircle2 />} label="Active" value={String(rows.filter((row) => textOf(row, ['status'], '').toLowerCase() === 'active').length)} />
    <SummaryTile icon={<CalendarPlus />} label="Trial" value={String(rows.filter((row) => textOf(row, ['status'], '').toLowerCase() === 'trial').length)} />
    <SummaryTile icon={<ShieldAlert />} label="Suspended" value={String(rows.filter((row) => textOf(row, ['status'], '').toLowerCase().includes('suspend')).length)} />
  </section>;
}

function SummaryTile({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <article className="summary-card"><span>{icon}</span><p>{label}</p><strong>{value}</strong></article>;
}

function AdminBreadcrumbs({ items }: { items: string[] }) {
  return <nav className="admin-breadcrumbs" aria-label="Breadcrumb">{items.map((item, index) => <span key={`${item}-${index}`}>{item}</span>)}</nav>;
}

function RecordDetails({ record }: { record: Record<string, unknown> }) {
  return <dl className="enterprise-summary-list">{Object.entries(record).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{typeof value === 'object' ? JSON.stringify(value) : String(value ?? '-')}</dd></div>)}</dl>;
}

function SafeRecordDetails({ record }: { record: Record<string, unknown> }) {
  const hidden = ['password', 'token', 'access_token', 'refresh_token', 'remember_token', 'secret'];
  return <dl className="enterprise-summary-list">{Object.entries(record).filter(([key]) => !hidden.some((item) => key.toLowerCase().includes(item))).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{typeof value === 'object' ? JSON.stringify(maskSecrets(value)) : String(value ?? '-')}</dd></div>)}</dl>;
}

function RecordList({ rows, fallback }: { rows: PlatformTenantRecord[]; fallback?: ReactNode }) {
  if (!Array.isArray(rows) || rows.length === 0) return <>{fallback ?? <div className="empty-state">No records returned.</div>}</>;
  return <div className="record-list">{rows.map((row, index) => <article key={idOf(row) || index}><strong>{textOf(row, ['display_name', 'name', 'email', 'invoice_number', 'payment_number', 'event', 'provider_name', 'module_code'], `Record ${index + 1}`)}</strong><p>{textOf(row, ['status', 'email', 'created_at', 'subscription_status', 'severity'])}</p></article>)}</div>;
}
