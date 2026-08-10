import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Archive,
  BadgeDollarSign,
  Copy,
  Eye,
  FileSpreadsheet,
  GitCompareArrows,
  MoreVertical,
  Pause,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  RotateCw,
  Tags,
  Trash2
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import { platformQueryKeys } from '@/features/platform/api/platformQueryKeys';
import { PLATFORM_ROUTES } from '@/features/platform/routes/platformRoutes';
import {
  platformSubscriptionsApi,
  type AddonPayload,
  type CatalogRecord,
  type FeaturePayload,
  type PlanPayload,
  type SubscriptionRecord
} from '@/features/platform/subscriptions/api/platformSubscriptionsApi';
import { ApiError } from '@/lib/api/apiError';
import { createListQuery } from '@/lib/api/listQuery';
import { DataTable, type DataTableColumn } from '@/shared/components/data-table';
import { AppDrawer } from '@/shared/components/drawer';
import { PageHeader, StatusBadge, Tabs } from '@/shared/components/layout';
import { AppModal } from '@/shared/components/modal';
import { Button, PermissionButton } from '@/shared/components/ui';
import { ConfirmDialog } from '@/shared/components/workflows';

type CatalogKind = 'plans' | 'features' | 'addons';
type Mode = 'list' | 'create' | 'edit' | 'view';
type SubscriptionModal = 'upgrade' | 'downgrade' | 'pause' | 'resume' | 'cancel' | 'renew' | 'addon' | 'coupon' | 'invoice' | null;
type PlanModal = 'clone' | 'archive' | 'attachFeature' | null;

const catalogMeta = {
  plans: {
    label: 'Plans',
    singular: 'Plan',
    route: PLATFORM_ROUTES.catalog.plans,
    resourceKey: 'plans',
    permission: 'plan'
  },
  features: {
    label: 'Features',
    singular: 'Feature',
    route: PLATFORM_ROUTES.catalog.features,
    resourceKey: 'features',
    permission: 'feature'
  },
  addons: {
    label: 'Add-ons',
    singular: 'Add-on',
    route: PLATFORM_ROUTES.catalog.addons,
    resourceKey: 'addons',
    permission: 'plan'
  }
} as const;

function idOf(record?: CatalogRecord | null) {
  return String(record?.uuid ?? record?.id ?? '');
}

function textOf(record: CatalogRecord | null | undefined, keys: string[], fallback = '-') {
  for (const key of keys) {
    const value = record?.[key];
    if (value !== undefined && value !== null && value !== '') return String(value);
  }
  return fallback;
}

function boolText(value: unknown) {
  return value ? 'Yes' : 'No';
}

function errorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Request failed.';
}

function money(value: unknown, currency = 'INR') {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency || 'INR',
    maximumFractionDigits: 2
  }).format(Number.isFinite(amount) ? amount : 0);
}

function statusTone(status: string): 'neutral' | 'success' | 'warning' | 'danger' | 'info' {
  if (['active', 'paid', 'success'].includes(status)) return 'success';
  if (['trial', 'pending', 'paused'].includes(status)) return 'warning';
  if (['cancelled', 'canceled', 'failed', 'archived'].includes(status)) return 'danger';
  if (['draft', 'inactive'].includes(status)) return 'neutral';
  return 'info';
}

function Badge({ value }: { value: string }) {
  return <StatusBadge tone={statusTone(value)}>{value}</StatusBadge>;
}

function formatDate(value: unknown) {
  if (!value) return '-';
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

function totalFor(record: SubscriptionRecord) {
  return record.total_amount ?? record.payable_amount ?? record.amount ?? record.base_price ?? 0;
}

export function PlatformSubscriptionsListPage() {
  return <SubscriptionsList />;
}

export function PlatformSubscriptionViewPage() {
  const { id = '' } = useParams();
  return <SubscriptionView id={id} />;
}

export function PlatformPlansListPage() {
  return <CatalogList kind="plans" />;
}

export function PlatformPlanCreatePage() {
  return <CatalogForm kind="plans" mode="create" />;
}

export function PlatformPlanEditPage() {
  return <CatalogForm kind="plans" mode="edit" />;
}

export function PlatformPlanViewPage() {
  return <CatalogView kind="plans" />;
}

export function PlatformFeaturesListPage() {
  return <CatalogList kind="features" />;
}

export function PlatformFeatureCreatePage() {
  return <CatalogForm kind="features" mode="create" />;
}

export function PlatformFeatureEditPage() {
  return <CatalogForm kind="features" mode="edit" />;
}

export function PlatformFeatureViewPage() {
  return <CatalogView kind="features" />;
}

export function PlatformAddonsListPage() {
  return <CatalogList kind="addons" />;
}

export function PlatformAddonCreatePage() {
  return <CatalogForm kind="addons" mode="create" />;
}

export function PlatformAddonEditPage() {
  return <CatalogForm kind="addons" mode="edit" />;
}

export function PlatformAddonViewPage() {
  return <CatalogView kind="addons" />;
}

function SubscriptionsList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<SubscriptionRecord | null>(null);
  const [modal, setModal] = useState<SubscriptionModal>(null);
  const queryParams = createListQuery({ page, per_page: 25, search });
  const listQuery = useQuery({
    queryKey: platformQueryKeys.list('subscriptions', queryParams),
    queryFn: () => platformSubscriptionsApi.subscriptions.list(queryParams)
  });
  const rows = listQuery.data?.data ?? [];

  const lifecycleMutation = useMutation({
    mutationFn: ({ action, record, payload }: { action: Exclude<SubscriptionModal, null | 'invoice'>; record: SubscriptionRecord; payload: Record<string, unknown> }) => {
      const id = idOf(record);
      if (action === 'upgrade') return platformSubscriptionsApi.subscriptions.upgrade(id, payload);
      if (action === 'downgrade') return platformSubscriptionsApi.subscriptions.downgrade(id, payload);
      if (action === 'pause') return platformSubscriptionsApi.subscriptions.pause(id, payload);
      if (action === 'resume') return platformSubscriptionsApi.subscriptions.resume(id, payload);
      if (action === 'cancel') return platformSubscriptionsApi.subscriptions.cancel(id, payload);
      if (action === 'renew') return platformSubscriptionsApi.subscriptions.renew(id, payload);
      if (action === 'addon') return platformSubscriptionsApi.subscriptions.addAddon(id, payload);
      return platformSubscriptionsApi.subscriptions.applyCoupon(id, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: platformQueryKeys.resource('subscriptions') });
      setModal(null);
      setSelectedRecord(null);
    }
  });

  const invoiceMutation = useMutation({
    mutationFn: (record: SubscriptionRecord) => platformSubscriptionsApi.subscriptions.invoice(idOf(record)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: platformQueryKeys.resource('subscriptions') })
  });

  const columns = useMemo<DataTableColumn<SubscriptionRecord>[]>(
    () => [
      { id: 'subscription_number', header: 'Subscription', accessor: (row) => row.subscription_number, enableSorting: true, cell: (row) => <strong>{textOf(row, ['subscription_number'])}</strong> },
      { id: 'tenant', header: 'Tenant', accessor: (row) => row.tenant_name ?? row.organization_name, cell: (row) => textOf(row, ['tenant_name', 'organization_name', 'tenant_uuid', 'tenant_id']) },
      { id: 'plan', header: 'Plan', accessor: (row) => row.plan_name, cell: (row) => textOf(row, ['plan_name', 'plan_uuid', 'plan_id']) },
      { id: 'type', header: 'Type', accessor: (row) => row.type, cell: (row) => textOf(row, ['type']) },
      { id: 'billing_cycle', header: 'Cycle', accessor: (row) => row.billing_cycle, cell: (row) => textOf(row, ['billing_cycle']) },
      { id: 'status', header: 'Status', accessor: (row) => row.status, cell: (row) => <Badge value={textOf(row, ['status'], 'inactive')} /> },
      { id: 'expires_at', header: 'Expires', accessor: (row) => row.expires_at, cell: (row) => formatDate(row.expires_at) },
      { id: 'next_billing_at', header: 'Next Billing', accessor: (row) => row.next_billing_at, cell: (row) => formatDate(row.next_billing_at) },
      { id: 'payable_amount', header: 'Payable', accessor: (row) => Number(totalFor(row)), cell: (row) => money(totalFor(row), row.currency) },
      { id: 'auto_renew', header: 'Auto Renew', accessor: (row) => row.auto_renew, cell: (row) => boolText(row.auto_renew) },
      {
        id: 'actions',
        header: 'Actions',
        enableHiding: false,
        cell: (row) => (
          <SubscriptionRowActions
            row={row}
            onView={() => navigate(`${PLATFORM_ROUTES.subscriptions}/${idOf(row)}`)}
            onOpen={openSubscriptionModal}
          />
        )
      }
    ],
    [navigate]
  );

  function openSubscriptionModal(nextModal: SubscriptionModal, record: SubscriptionRecord) {
    setSelectedRecord(record);
    setModal(nextModal);
  }

  return (
    <section className="enterprise-module-page platform-subscriptions-page">
      <PageHeader
        title="Subscriptions"
        description="Manage subscription lifecycle, financial totals, coupons, add-ons, renewals, pauses and cancellations."
        actions={<Button type="button" variant="secondary" onClick={() => platformSubscriptionsApi.subscriptions.export()}><FileSpreadsheet size={16} aria-hidden />Export</Button>}
      />
      <SubscriptionStats rows={rows} />
      <DataTable
        columns={columns}
        data={rows}
        getRowId={idOf}
        loading={listQuery.isLoading}
        error={listQuery.isError ? errorMessage(listQuery.error) : ''}
        searchValue={search}
        searchPlaceholder="Search subscriptions..."
        onSearchChange={setSearch}
        selectedRowIds={selectedIds}
        onSelectionChange={setSelectedIds}
        page={page}
        total={listQuery.data?.total ?? rows.length}
        onPageChange={setPage}
      />

      <SubscriptionLifecycleModal
        modal={modal}
        record={selectedRecord}
        loading={lifecycleMutation.isPending}
        error={lifecycleMutation.error}
        onClose={() => setModal(null)}
        onConfirm={(action, payload) => {
          if (!selectedRecord) return;
          if (action === 'invoice') {
            invoiceMutation.mutate(selectedRecord);
            setModal(null);
            return;
          }
          lifecycleMutation.mutate({ action, record: selectedRecord, payload });
        }}
      />
    </section>
  );
}

function SubscriptionView({ id }: { id: string }) {
  const [modal, setModal] = useState<SubscriptionModal>(null);
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: platformQueryKeys.detail('subscriptions', id),
    queryFn: () => platformSubscriptionsApi.subscriptions.detail(id)
  });
  const usageQuery = useQuery({
    queryKey: platformQueryKeys.related('subscriptions', id, 'usage'),
    queryFn: () => platformSubscriptionsApi.subscriptions.usage(id),
    enabled: Boolean(id)
  });
  const historyQuery = useQuery({
    queryKey: platformQueryKeys.related('subscriptions', id, 'history'),
    queryFn: () => platformSubscriptionsApi.subscriptions.history(id),
    enabled: Boolean(id)
  });
  const mutation = useMutation({
    mutationFn: ({ action, payload }: { action: Exclude<SubscriptionModal, null | 'invoice'>; payload: Record<string, unknown> }) => {
      if (action === 'upgrade') return platformSubscriptionsApi.subscriptions.upgrade(id, payload);
      if (action === 'downgrade') return platformSubscriptionsApi.subscriptions.downgrade(id, payload);
      if (action === 'pause') return platformSubscriptionsApi.subscriptions.pause(id, payload);
      if (action === 'resume') return platformSubscriptionsApi.subscriptions.resume(id, payload);
      if (action === 'cancel') return platformSubscriptionsApi.subscriptions.cancel(id, payload);
      if (action === 'renew') return platformSubscriptionsApi.subscriptions.renew(id, payload);
      if (action === 'addon') return platformSubscriptionsApi.subscriptions.addAddon(id, payload);
      return platformSubscriptionsApi.subscriptions.applyCoupon(id, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: platformQueryKeys.resource('subscriptions') });
      setModal(null);
    }
  });

  if (query.isLoading) return <div className="surface-state">Loading subscription...</div>;
  if (query.isError) return <div className="surface-error">{errorMessage(query.error)}</div>;
  const record = query.data;
  if (!record) return <div className="empty-state">Subscription not found.</div>;

  return (
    <section className="enterprise-module-page platform-subscriptions-page">
      <PageHeader
        title={textOf(record, ['subscription_number'], 'Subscription')}
        description={`${textOf(record, ['tenant_name', 'organization_name'])} / ${textOf(record, ['plan_name'])}`}
        actions={<SubscriptionActions onOpen={setModal} />}
      />
      <SubscriptionStats rows={[record]} />
      <DetailTabs
        tabs={[
          { id: 'summary', label: 'Summary', content: <RecordDetails record={record} moneyFields={['payable_amount', 'subtotal', 'discount_amount', 'tax_amount', 'total_amount', 'amount']} /> },
          { id: 'usage', label: 'Usage', content: <RecordList rows={usageQuery.data?.data.usage ?? record.usage ?? []} /> },
          { id: 'addons', label: 'Add-ons', content: <RecordList rows={record.addons ?? []} /> },
          { id: 'invoices', label: 'Invoices', content: <RecordList rows={record.invoices ?? []} /> },
          { id: 'payments', label: 'Payments', content: <RecordList rows={record.payments ?? []} /> },
          { id: 'discounts', label: 'Discounts', content: <RecordList rows={record.coupons ?? []} /> },
          { id: 'history', label: 'History', content: <RecordList rows={[...(historyQuery.data?.data.versions ?? []), ...(historyQuery.data?.data.renewals ?? [])]} /> }
        ]}
      />
      <SubscriptionLifecycleModal
        modal={modal}
        record={record}
        loading={mutation.isPending}
        error={mutation.error}
        onClose={() => setModal(null)}
        onConfirm={(action, payload) => {
          if (action === 'invoice') {
            platformSubscriptionsApi.subscriptions.invoice(id);
            setModal(null);
            return;
          }
          mutation.mutate({ action, payload });
        }}
      />
    </section>
  );
}

function CatalogList({ kind }: { kind: CatalogKind }) {
  const meta = catalogMeta[kind];
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<CatalogRecord | null>(null);
  const [planModal, setPlanModal] = useState<PlanModal>(null);
  const [matrixOpen, setMatrixOpen] = useState(false);
  const queryParams = createListQuery({ page, per_page: 25, search });
  const query = useQuery({
    queryKey: platformQueryKeys.list(meta.resourceKey, queryParams),
    queryFn: () => {
      if (kind === 'plans') return platformSubscriptionsApi.plans.list(queryParams);
      if (kind === 'features') return platformSubscriptionsApi.features.list(queryParams);
      return platformSubscriptionsApi.addons.list(queryParams);
    }
  });
  const rows = query.data?.data ?? [];
  const archiveMutation = useMutation({
    mutationFn: (record: CatalogRecord) =>
      kind === 'addons' ? platformSubscriptionsApi.addons.archive(idOf(record)) : platformSubscriptionsApi.plans.archive(idOf(record)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: platformQueryKeys.resource(meta.resourceKey) });
      setPlanModal(null);
    }
  });
  const cloneMutation = useMutation({
    mutationFn: ({ record, payload }: { record: CatalogRecord; payload: Record<string, unknown> }) =>
      platformSubscriptionsApi.plans.clone(idOf(record), payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: platformQueryKeys.resource(meta.resourceKey) });
      setPlanModal(null);
    }
  });
  const attachMutation = useMutation({
    mutationFn: ({ record, payload }: { record: CatalogRecord; payload: Record<string, unknown> }) =>
      platformSubscriptionsApi.plans.replaceFeatures(idOf(record), [payload]),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: platformQueryKeys.resource(meta.resourceKey) });
      setPlanModal(null);
    }
  });

  const columns = catalogColumns(kind, {
    onView: (record) => navigate(`${meta.route}/${idOf(record)}`),
    onEdit: (record) => navigate(`${meta.route}/${idOf(record)}/edit`),
    onClone: (record) => {
      setSelectedRecord(record);
      setPlanModal('clone');
    },
    onArchive: (record) => {
      setSelectedRecord(record);
      setPlanModal('archive');
    },
    onAttachFeature: (record) => {
      setSelectedRecord(record);
      setPlanModal('attachFeature');
    }
  });

  return (
    <section className="enterprise-module-page platform-catalog-page">
      <PageHeader
        title={meta.label}
        description={`Manage ${meta.label.toLowerCase()} catalog records and lifecycle controls.`}
        actions={
          <>
            {kind === 'plans' ? <Button type="button" variant="secondary" onClick={() => setMatrixOpen(true)}><FileSpreadsheet size={16} aria-hidden />Feature Matrix</Button> : null}
            <PermissionButton guard="platform" permission={`${meta.permission}.create`} type="button" onClick={() => navigate(`${meta.route}/create`)}>
              <Plus size={16} aria-hidden />Create {meta.singular}
            </PermissionButton>
          </>
        }
      />
      <CatalogStats kind={kind} rows={rows} />
      <DataTable
        columns={columns}
        data={rows}
        getRowId={idOf}
        loading={query.isLoading}
        error={query.isError ? errorMessage(query.error) : ''}
        searchValue={search}
        searchPlaceholder={`Search ${meta.label.toLowerCase()}...`}
        onSearchChange={setSearch}
        selectedRowIds={selectedIds}
        onSelectionChange={setSelectedIds}
        page={page}
        total={query.data?.total ?? rows.length}
        onPageChange={setPage}
      />
      <FeatureMatrixDrawer open={matrixOpen} plans={rows} onClose={() => setMatrixOpen(false)} />
      <PlanActionModals
        modal={planModal}
        record={selectedRecord}
        loading={archiveMutation.isPending || cloneMutation.isPending || attachMutation.isPending}
        error={archiveMutation.error ?? cloneMutation.error ?? attachMutation.error}
        onClose={() => setPlanModal(null)}
        onArchive={() => selectedRecord && archiveMutation.mutate(selectedRecord)}
        onClone={(payload) => selectedRecord && cloneMutation.mutate({ record: selectedRecord, payload })}
        onAttach={(payload) => selectedRecord && attachMutation.mutate({ record: selectedRecord, payload })}
      />
    </section>
  );
}

function CatalogForm({ kind, mode }: { kind: CatalogKind; mode: 'create' | 'edit' }) {
  const meta = catalogMeta[kind];
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const queryClient = useQueryClient();
  const detailQuery = useQuery({
    queryKey: platformQueryKeys.detail(meta.resourceKey, id),
    queryFn: () => catalogDetail(kind, id),
    enabled: mode === 'edit'
  });
  const [form, setForm] = useState<Record<string, string | boolean | number>>(() => defaultCatalogForm(kind));

  useEffect(() => {
    if (!detailQuery.data) return;
    setForm(defaultCatalogForm(kind, detailQuery.data));
  }, [detailQuery.data, kind]);

  const mutation = useMutation({
    mutationFn: () => saveCatalog(kind, id, form, mode),
    onSuccess: async (record) => {
      await queryClient.invalidateQueries({ queryKey: platformQueryKeys.resource(meta.resourceKey) });
      navigate(`${meta.route}/${idOf(record) || id}`);
    }
  });

  if (detailQuery.isLoading) return <div className="surface-state">Loading {meta.singular.toLowerCase()}...</div>;

  return (
    <section className="enterprise-module-page platform-catalog-page">
      <PageHeader
        title={`${mode === 'create' ? 'Create' : 'Edit'} ${meta.singular}`}
        description="Catalog changes are saved through documented platform APIs."
        actions={<Button type="button" variant="secondary" onClick={() => navigate(meta.route)}>Back</Button>}
      />
      {detailQuery.isError ? <div className="surface-error">{errorMessage(detailQuery.error)}</div> : null}
      {mutation.error ? <div className="surface-error">{errorMessage(mutation.error)}</div> : null}
      <form className="enterprise-form" onSubmit={(event) => { event.preventDefault(); mutation.mutate(); }}>
        <div className="enterprise-form__grid">
          {fieldsFor(kind).map((field) => (
            <label key={field.name} className={field.type === 'checkbox' ? 'check-row' : undefined}>
              {field.type === 'checkbox' ? (
                <>
                  <input type="checkbox" checked={Boolean(form[field.name])} onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.checked }))} />
                  <span>{field.label}</span>
                </>
              ) : (
                <>
                  <span>{field.label}</span>
                  {field.type === 'select' ? (
                    <select value={String(form[field.name] ?? '')} onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))}>
                      {field.options?.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  ) : field.type === 'textarea' ? (
                    <textarea value={String(form[field.name] ?? '')} onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))} />
                  ) : (
                    <input type={field.type ?? 'text'} value={String(form[field.name] ?? '')} onChange={(event) => setForm((current) => ({ ...current, [field.name]: field.type === 'number' ? Number(event.target.value) : event.target.value }))} />
                  )}
                </>
              )}
            </label>
          ))}
        </div>
        <footer className="enterprise-form__footer">
          <Button type="button" variant="secondary" onClick={() => navigate(meta.route)}>Cancel</Button>
          <PermissionButton guard="platform" permission={`${meta.permission}.${mode === 'create' ? 'create' : 'edit'}`} type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving...' : 'Save'}
          </PermissionButton>
        </footer>
      </form>
    </section>
  );
}

function CatalogView({ kind }: { kind: CatalogKind }) {
  const meta = catalogMeta[kind];
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [matrixOpen, setMatrixOpen] = useState(false);
  const query = useQuery({
    queryKey: platformQueryKeys.detail(meta.resourceKey, id),
    queryFn: () => catalogDetail(kind, id)
  });
  const featuresQuery = useQuery({
    queryKey: platformQueryKeys.related('plans', id, 'features'),
    queryFn: () => platformSubscriptionsApi.plans.features(id),
    enabled: kind === 'plans'
  });

  if (query.isLoading) return <div className="surface-state">Loading {meta.singular.toLowerCase()}...</div>;
  if (query.isError) return <div className="surface-error">{errorMessage(query.error)}</div>;
  const record = query.data;
  if (!record) return <div className="empty-state">{meta.singular} not found.</div>;

  return (
    <section className="enterprise-module-page platform-catalog-page">
      <PageHeader
        title={textOf(record, ['name', 'code'], meta.singular)}
        description={textOf(record, ['description'], `${meta.singular} detail`)}
        actions={
          <>
            {kind === 'plans' ? <Button type="button" variant="secondary" onClick={() => setMatrixOpen(true)}><FileSpreadsheet size={16} aria-hidden />Feature Matrix</Button> : null}
            <Button type="button" variant="secondary" onClick={() => navigate(`${meta.route}/${id}/edit`)}><Pencil size={16} aria-hidden />Edit</Button>
          </>
        }
      />
      <CatalogStats kind={kind} rows={[record]} />
      <DetailTabs
        tabs={[
          { id: 'overview', label: 'Overview', content: <RecordDetails record={record} moneyFields={['base_price', 'price']} /> },
          { id: 'features', label: 'Features and limits', content: <RecordList rows={featuresQuery.data?.data.features ?? record.features ?? []} /> },
          { id: 'subscriptions', label: 'Active subscriptions', content: <RecordList rows={record.subscriptions ?? []} /> },
          { id: 'history', label: 'Change history', content: <RecordList rows={[]} /> }
        ]}
      />
      <FeatureMatrixDrawer open={matrixOpen} plans={[record]} onClose={() => setMatrixOpen(false)} />
    </section>
  );
}

function catalogColumns(kind: CatalogKind, handlers: {
  onView: (record: CatalogRecord) => void;
  onEdit: (record: CatalogRecord) => void;
  onClone: (record: CatalogRecord) => void;
  onArchive: (record: CatalogRecord) => void;
  onAttachFeature: (record: CatalogRecord) => void;
}): DataTableColumn<CatalogRecord>[] {
  if (kind === 'features') {
    return [
      { id: 'module', header: 'Module', accessor: (row) => row.module, enableSorting: true, cell: (row) => textOf(row, ['module']) },
      { id: 'name', header: 'Name', accessor: (row) => row.name, enableSorting: true, cell: (row) => <strong>{textOf(row, ['name'])}</strong> },
      { id: 'code', header: 'Code', accessor: (row) => row.code, cell: (row) => textOf(row, ['code']) },
      { id: 'data_type', header: 'Data Type', accessor: (row) => row.data_type, cell: (row) => textOf(row, ['data_type']) },
      { id: 'unit', header: 'Unit', accessor: (row) => row.unit, cell: (row) => textOf(row, ['unit']) },
      { id: 'status', header: 'Status', accessor: (row) => row.status, cell: (row) => <Badge value={textOf(row, ['status'], 'inactive')} /> },
      actionColumn(handlers)
    ];
  }
  return [
    { id: 'name', header: 'Name', accessor: (row) => row.name, enableSorting: true, cell: (row) => <strong>{textOf(row, ['name'])}</strong> },
    { id: 'code', header: 'Code', accessor: (row) => row.code, cell: (row) => textOf(row, ['code']) },
    ...(kind === 'plans'
      ? [
          { id: 'billing_cycle', header: 'Billing Cycle', accessor: (row: CatalogRecord) => row.billing_cycle, cell: (row: CatalogRecord) => textOf(row, ['billing_cycle']) },
          { id: 'base_price', header: 'Base Price', accessor: (row: CatalogRecord) => Number(row.base_price), cell: (row: CatalogRecord) => money(row.base_price, row.currency) },
          { id: 'trial_days', header: 'Trial Days', accessor: (row: CatalogRecord) => row.trial_days, cell: (row: CatalogRecord) => textOf(row, ['trial_days'], '0') },
          { id: 'is_public', header: 'Public', accessor: (row: CatalogRecord) => row.is_public, cell: (row: CatalogRecord) => boolText(row.is_public) },
          { id: 'subscription_count', header: 'Active Subs', accessor: (row: CatalogRecord) => row.active_subscription_count ?? row.subscription_count, cell: (row: CatalogRecord) => textOf(row, ['active_subscription_count', 'subscription_count'], '0') }
        ]
      : [
          { id: 'pricing_type', header: 'Pricing Type', accessor: (row: CatalogRecord) => row.pricing_type, cell: (row: CatalogRecord) => textOf(row, ['pricing_type']) },
          { id: 'price', header: 'Price', accessor: (row: CatalogRecord) => Number(row.price), cell: (row: CatalogRecord) => money(row.price, row.currency) }
        ]),
    { id: 'status', header: 'Status', accessor: (row) => row.status, cell: (row) => <Badge value={textOf(row, ['status'], 'inactive')} /> },
    actionColumn(handlers, kind)
  ];
}

function actionColumn(handlers: {
  onView: (record: CatalogRecord) => void;
  onEdit: (record: CatalogRecord) => void;
  onClone: (record: CatalogRecord) => void;
  onArchive: (record: CatalogRecord) => void;
  onAttachFeature: (record: CatalogRecord) => void;
}, kind?: CatalogKind): DataTableColumn<CatalogRecord> {
  return {
    id: 'actions',
    header: 'Actions',
    enableHiding: false,
    cell: (row) => <CatalogRowActions row={row} kind={kind} handlers={handlers} />
  };
}

function SubscriptionRowActions({
  onOpen,
  onView,
  row
}: {
  row: SubscriptionRecord;
  onView: () => void;
  onOpen: (modal: SubscriptionModal, row: SubscriptionRecord) => void;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

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
        aria-label={`Open actions for ${textOf(row, ['subscription_number'])}`}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <MoreVertical size={16} aria-hidden />
      </button>
      <PortalActionMenu open={open} anchorRef={triggerRef} onClose={() => setOpen(false)}>
        <div className="action-menu" role="menu">
          <button type="button" role="menuitem" onMouseDown={(event) => event.preventDefault()} onClick={() => run(onView)}><Eye size={15} aria-hidden /> View</button>
          <PermissionButton guard="platform" permission="subscription.upgrade" type="button" role="menuitem" variant="ghost" onMouseDown={(event) => event.preventDefault()} onClick={() => run(() => onOpen('upgrade', row))}><GitCompareArrows size={15} aria-hidden /> Upgrade</PermissionButton>
          <PermissionButton guard="platform" permission="subscription.downgrade" type="button" role="menuitem" variant="ghost" onMouseDown={(event) => event.preventDefault()} onClick={() => run(() => onOpen('downgrade', row))}><GitCompareArrows size={15} aria-hidden /> Downgrade</PermissionButton>
          <PermissionButton guard="platform" permission="subscription.renew" type="button" role="menuitem" variant="ghost" onMouseDown={(event) => event.preventDefault()} onClick={() => run(() => onOpen('renew', row))}><RotateCw size={15} aria-hidden /> Renew</PermissionButton>
          <hr />
          <PermissionButton guard="platform" permission="subscription.edit" type="button" role="menuitem" variant="ghost" onMouseDown={(event) => event.preventDefault()} onClick={() => run(() => onOpen('pause', row))}><Pause size={15} aria-hidden /> Pause</PermissionButton>
          <PermissionButton guard="platform" permission="subscription.edit" type="button" role="menuitem" variant="ghost" onMouseDown={(event) => event.preventDefault()} onClick={() => run(() => onOpen('resume', row))}><Play size={15} aria-hidden /> Resume</PermissionButton>
          <PermissionButton guard="platform" permission="subscription.edit" type="button" role="menuitem" variant="ghost" onMouseDown={(event) => event.preventDefault()} onClick={() => run(() => onOpen('addon', row))}><Plus size={15} aria-hidden /> Add Add-on</PermissionButton>
          <PermissionButton guard="platform" permission="subscription.edit" type="button" role="menuitem" variant="ghost" onMouseDown={(event) => event.preventDefault()} onClick={() => run(() => onOpen('coupon', row))}><Tags size={15} aria-hidden /> Apply Coupon</PermissionButton>
          <hr />
          <PermissionButton guard="platform" permission="subscription.cancel" type="button" role="menuitem" variant="ghost" className="is-danger" onMouseDown={(event) => event.preventDefault()} onClick={() => run(() => onOpen('cancel', row))}><Trash2 size={15} aria-hidden /> Cancel</PermissionButton>
        </div>
      </PortalActionMenu>
    </div>
  );
}

function CatalogRowActions({
  handlers,
  kind,
  row
}: {
  row: CatalogRecord;
  kind?: CatalogKind;
  handlers: {
    onView: (record: CatalogRecord) => void;
    onEdit: (record: CatalogRecord) => void;
    onClone: (record: CatalogRecord) => void;
    onArchive: (record: CatalogRecord) => void;
    onAttachFeature: (record: CatalogRecord) => void;
  };
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

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
        aria-label={`Open actions for ${textOf(row, ['name', 'code'])}`}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <MoreVertical size={16} aria-hidden />
      </button>
      <PortalActionMenu open={open} anchorRef={triggerRef} onClose={() => setOpen(false)}>
        <div className="action-menu" role="menu">
          <button type="button" role="menuitem" onMouseDown={(event) => event.preventDefault()} onClick={() => run(() => handlers.onView(row))}><Eye size={15} aria-hidden /> View</button>
          <PermissionButton guard="platform" permission={kind === 'features' ? 'feature.edit' : 'plan.edit'} type="button" role="menuitem" variant="ghost" onMouseDown={(event) => event.preventDefault()} onClick={() => run(() => handlers.onEdit(row))}><Pencil size={15} aria-hidden /> Edit</PermissionButton>
          {kind === 'plans' ? (
            <>
              <hr />
              <PermissionButton guard="platform" permission="plan.edit" type="button" role="menuitem" variant="ghost" onMouseDown={(event) => event.preventDefault()} onClick={() => run(() => handlers.onAttachFeature(row))}><Plus size={15} aria-hidden /> Attach Feature</PermissionButton>
              <PermissionButton guard="platform" permission="plan.create" type="button" role="menuitem" variant="ghost" onMouseDown={(event) => event.preventDefault()} onClick={() => run(() => handlers.onClone(row))}><Copy size={15} aria-hidden /> Clone Plan</PermissionButton>
            </>
          ) : null}
          {kind !== 'features' ? (
            <>
              <hr />
              <PermissionButton guard="platform" permission="plan.delete" type="button" role="menuitem" variant="ghost" className="is-danger" onMouseDown={(event) => event.preventDefault()} onClick={() => run(() => handlers.onArchive(row))}><Archive size={15} aria-hidden /> Archive</PermissionButton>
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
  const [position, setPosition] = useState({ left: 0, top: 0 });

  useEffect(() => {
    if (!open) return;
    const rect = anchorRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = 240;
    setPosition({
      left: Math.min(Math.max(12, rect.right - width), window.innerWidth - width - 12),
      top: Math.min(rect.bottom + 8, window.innerHeight - 12)
    });
  }, [anchorRef, open]);

  if (!open) return null;

  return createPortal(
    <div className="action-menu-portal" style={{ left: position.left, top: position.top }}>
      <button type="button" className="action-menu-backdrop" aria-label="Close actions menu" onClick={onClose} />
      {children}
    </div>,
    document.body
  );
}

function SubscriptionActions({ onOpen }: { onOpen: (modal: SubscriptionModal) => void }) {
  return (
    <>
      <Button type="button" variant="secondary" onClick={() => onOpen('upgrade')}><GitCompareArrows size={16} aria-hidden />Change Plan</Button>
      <Button type="button" variant="secondary" onClick={() => onOpen('addon')}><Plus size={16} aria-hidden />Add Add-on</Button>
      <Button type="button" variant="secondary" onClick={() => onOpen('coupon')}><Tags size={16} aria-hidden />Apply Coupon</Button>
      <Button type="button" variant="secondary" onClick={() => onOpen('renew')}><RotateCw size={16} aria-hidden />Renew</Button>
      <Button type="button" variant="danger" onClick={() => onOpen('cancel')}><Trash2 size={16} aria-hidden />Cancel</Button>
    </>
  );
}

function SubscriptionLifecycleModal({ modal, record, loading, error, onClose, onConfirm }: {
  modal: SubscriptionModal;
  record?: SubscriptionRecord | null;
  loading: boolean;
  error: unknown;
  onClose: () => void;
  onConfirm: (action: Exclude<SubscriptionModal, null>, payload: Record<string, unknown>) => void;
}) {
  const [payload, setPayload] = useState<Record<string, string | boolean | number>>({});
  useEffect(() => {
    setPayload(defaultLifecyclePayload(modal, record));
  }, [modal, record]);
  if (!modal || !record) return null;
  const title = titleForSubscriptionModal(modal);
  const isPlanChange = modal === 'upgrade' || modal === 'downgrade';

  return (
    <AppModal
      open
      onClose={onClose}
      title={title}
      guard="platform"
      permission={permissionForSubscriptionModal(modal)}
      size="lg"
      loading={loading}
      error={error ? errorMessage(error) : null}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="button" onClick={() => onConfirm(modal, payload)} disabled={loading}>Confirm {title}</Button>
        </>
      }
    >
      {isPlanChange ? <PlanComparison record={record} payload={payload} /> : null}
      {modal === 'cancel' ? <div className="surface-error"><Trash2 size={16} aria-hidden />Cancellation can restrict tenant access. Confirm data retention and export requirements before proceeding.</div> : null}
      {modal === 'addon' ? <div className="surface-state">Preview total: {money(Number(payload.quantity ?? 0) * Number(payload.unit_price ?? 0), record.currency)}</div> : null}
      {modal === 'coupon' ? <div className="surface-state">Coupon will be validated by the API and the discount preview will be returned with subscription totals.</div> : null}
      <div className="form-grid form-grid--two">
        {fieldsForSubscriptionModal(modal).map((field) => (
          <label key={field.name} className={field.type === 'checkbox' ? 'check-row' : undefined}>
            {field.type === 'checkbox' ? (
              <>
                <input type="checkbox" checked={Boolean(payload[field.name])} onChange={(event) => setPayload((current) => ({ ...current, [field.name]: event.target.checked }))} />
                <span>{field.label}</span>
              </>
            ) : (
              <>
                <span>{field.label}</span>
                {field.type === 'select' ? (
                  <select value={String(payload[field.name] ?? '')} onChange={(event) => setPayload((current) => ({ ...current, [field.name]: event.target.value }))}>
                    {field.options?.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                ) : (
                  <input type={field.type ?? 'text'} value={String(payload[field.name] ?? '')} onChange={(event) => setPayload((current) => ({ ...current, [field.name]: field.type === 'number' ? Number(event.target.value) : event.target.value }))} />
                )}
              </>
            )}
          </label>
        ))}
      </div>
    </AppModal>
  );
}

function PlanComparison({ record, payload }: { record: SubscriptionRecord; payload: Record<string, string | boolean | number> }) {
  return (
    <div className="subscription-comparison">
      <article className="summary-card">
        <span><BadgeDollarSign size={18} aria-hidden /></span>
        <p>Current Plan</p>
        <strong>{textOf(record, ['plan_name', 'plan_uuid', 'plan_id'])}</strong>
        <small>{money(totalFor(record), record.currency)} / {textOf(record, ['billing_cycle'])}</small>
      </article>
      <article className="summary-card">
        <span><GitCompareArrows size={18} aria-hidden /></span>
        <p>Requested Plan</p>
        <strong>{String(payload.new_plan_id || 'Enter plan id')}</strong>
        <small>{String(payload.proration || 'immediate')} proration, coupon {String(payload.coupon_code || 'none')}</small>
      </article>
    </div>
  );
}

function PlanActionModals({ modal, record, loading, error, onClose, onArchive, onClone, onAttach }: {
  modal: PlanModal;
  record?: CatalogRecord | null;
  loading: boolean;
  error: unknown;
  onClose: () => void;
  onArchive: () => void;
  onClone: (payload: Record<string, unknown>) => void;
  onAttach: (payload: Record<string, unknown>) => void;
}) {
  const [payload, setPayload] = useState<Record<string, string | boolean>>({});
  useEffect(() => {
    setPayload({
      name: `${textOf(record, ['name'], 'Plan')} Copy`,
      code: `${textOf(record, ['code'], 'plan')}_copy`,
      status: 'inactive',
      copy_features: true,
      is_public: false,
      is_custom: true,
      feature_uuid: '',
      value: '',
      metadata: '{"source":"platform-ui"}',
      limit_type: 'hard'
    });
  }, [record]);
  if (!modal || !record) return null;
  if (modal === 'archive') {
    return (
      <ConfirmDialog
        open
        onClose={onClose}
        title="Archive plan?"
        description={`This plan has ${textOf(record, ['active_subscription_count', 'subscription_count'], '0')} active subscriptions. Archiving should happen only after customer migration is confirmed.`}
        confirmLabel="Archive"
        confirmTone="danger"
        typedConfirmation="ARCHIVE"
        guard="platform"
        permission="plan.delete"
        loading={loading}
        onConfirm={onArchive}
      />
    );
  }
  return (
    <AppModal
      open
      onClose={onClose}
      title={modal === 'clone' ? 'Clone Plan' : 'Attach Feature'}
      guard="platform"
      permission="plan.edit"
      loading={loading}
      error={error ? errorMessage(error) : null}
      footer={<><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="button" onClick={() => modal === 'clone' ? onClone(payload) : onAttach({ feature_uuid: payload.feature_uuid, value: payload.value, metadata: parseMetadata(payload.metadata), limit_type: payload.limit_type })}>Confirm</Button></>}
    >
      <div className="form-grid">
        {(modal === 'clone'
          ? ['name', 'code', 'status', 'copy_features', 'is_public', 'is_custom']
          : ['feature_uuid', 'value', 'metadata', 'limit_type']
        ).map((name) => (
          <label key={name} className={typeof payload[name] === 'boolean' ? 'check-row' : undefined}>
            {typeof payload[name] === 'boolean' ? (
              <><input type="checkbox" checked={Boolean(payload[name])} onChange={(event) => setPayload((current) => ({ ...current, [name]: event.target.checked }))} /><span>{labelize(name)}</span></>
            ) : (
              <><span>{labelize(name)}</span><input value={String(payload[name] ?? '')} onChange={(event) => setPayload((current) => ({ ...current, [name]: event.target.value }))} /></>
            )}
          </label>
        ))}
      </div>
    </AppModal>
  );
}

function FeatureMatrixDrawer({ open, plans, onClose }: { open: boolean; plans: CatalogRecord[]; onClose: () => void }) {
  return (
    <AppDrawer open={open} onClose={onClose} title="Feature Matrix" guard="platform" permission="plan.view" size="xl">
      <DataTable
        columns={[
          { id: 'plan', header: 'Plan', cell: (plan) => <span><strong>{textOf(plan, ['name'])}</strong><br /><small>{textOf(plan, ['code'])}</small></span> },
          { id: 'billing_cycle', header: 'Billing', cell: (plan) => textOf(plan, ['billing_cycle']) },
          { id: 'price', header: 'Price', cell: (plan) => money(plan.base_price, plan.currency) },
          { id: 'trial_days', header: 'Trial', cell: (plan) => `${textOf(plan, ['trial_days'], '0')} days` },
          { id: 'features', header: 'Features', cell: (plan) => Array.isArray(plan.features) ? plan.features.length : textOf(plan, ['features_count'], '0') },
          { id: 'active_subscriptions', header: 'Active Subs', cell: (plan) => textOf(plan, ['active_subscription_count', 'subscription_count'], '0') }
        ]}
        data={plans}
        getRowId={idOf}
        total={plans.length}
        perPage={Math.max(25, plans.length || 25)}
      />
    </AppDrawer>
  );
}

function SubscriptionStats({ rows }: { rows: SubscriptionRecord[] }) {
  const currency = rows[0]?.currency ?? 'INR';
  const total = rows.reduce((sum, row) => sum + Number(totalFor(row) ?? 0), 0);
  return (
    <section className="platform-access-summary">
      <SummaryTile icon={<BadgeDollarSign />} label="Total Subscriptions" value={String(rows.length)} />
      <SummaryTile icon={<RefreshCw />} label="Active" value={String(rows.filter((row) => row.status === 'active').length)} />
      <SummaryTile icon={<Pause />} label="Paused" value={String(rows.filter((row) => row.status === 'paused').length)} />
      <SummaryTile icon={<RotateCw />} label="Auto Renew" value={String(rows.filter((row) => row.auto_renew).length)} />
      <SummaryTile icon={<BadgeDollarSign />} label="Payable Total" value={money(total, currency)} />
    </section>
  );
}

function CatalogStats({ kind, rows }: { kind: CatalogKind; rows: CatalogRecord[] }) {
  const currency = rows[0]?.currency ?? 'INR';
  const priceKey = kind === 'addons' ? 'price' : 'base_price';
  const total = rows.reduce((sum, row) => sum + Number(row[priceKey] ?? 0), 0);
  return (
    <section className="platform-access-summary">
      <SummaryTile icon={<FileSpreadsheet />} label={`Total ${catalogMeta[kind].label}`} value={String(rows.length)} />
      <SummaryTile icon={<RefreshCw />} label="Active" value={String(rows.filter((row) => row.status === 'active').length)} />
      <SummaryTile icon={<Archive />} label="Archived" value={String(rows.filter((row) => row.status === 'archived').length)} />
      <SummaryTile icon={<BadgeDollarSign />} label="Catalog Value" value={money(total, currency)} />
      <SummaryTile icon={<Tags />} label="Public" value={String(rows.filter((row) => row.is_public).length)} />
    </section>
  );
}

function SummaryTile({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <article className="summary-card"><span>{icon}</span><p>{label}</p><strong>{value}</strong></article>;
}

function RecordDetails({ record, moneyFields = [] }: { record: CatalogRecord; moneyFields?: string[] }) {
  return (
    <dl className="enterprise-summary-list">
      {Object.entries(record).filter(([, value]) => typeof value !== 'object').map(([key, value]) => (
        <div key={key}>
          <dt>{key}</dt>
          <dd>{moneyFields.includes(key) ? money(value, record.currency) : String(value ?? '-')}</dd>
        </div>
      ))}
    </dl>
  );
}

function RecordList({ rows }: { rows: CatalogRecord[] }) {
  if (rows.length === 0) return <div className="empty-state">No records returned.</div>;
  return (
    <div className="record-list">
      {rows.map((row, index) => (
        <article key={idOf(row) || index}>
          <strong>{textOf(row, ['name', 'display_name', 'subscription_number', 'invoice_number', 'payment_number', 'code'], `Record ${index + 1}`)}</strong>
          <p>{textOf(row, ['status', 'module', 'billing_cycle', 'created_at'])}</p>
        </article>
      ))}
    </div>
  );
}

function DetailTabs({ tabs }: { tabs: Array<{ id: string; label: string; content: ReactNode }> }) {
  const [activeId, setActiveId] = useState(tabs[0]?.id ?? '');
  const active = tabs.find((tab) => tab.id === activeId) ?? tabs[0];
  return (
    <section className="dashboard-panel">
      <Tabs
        tabs={tabs.map((tab) => ({ id: tab.id, label: tab.label }))}
        activeId={active?.id ?? ''}
        onChange={setActiveId}
        ariaLabel="Detail tabs"
      />
      <div className="surface-body">{active?.content}</div>
    </section>
  );
}

function fieldsFor(kind: CatalogKind) {
  if (kind === 'features') {
    return [
      { name: 'module', label: 'Module' },
      { name: 'name', label: 'Name' },
      { name: 'code', label: 'Code' },
      { name: 'data_type', label: 'Data Type', type: 'select', options: ['integer', 'decimal', 'boolean', 'string', 'json'] },
      { name: 'unit', label: 'Unit' },
      { name: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'retired'] },
      { name: 'description', label: 'Description', type: 'textarea' }
    ];
  }
  if (kind === 'addons') {
    return [
      { name: 'name', label: 'Name' },
      { name: 'code', label: 'Code' },
      { name: 'pricing_type', label: 'Pricing Type', type: 'select', options: ['recurring', 'one_time', 'usage_based', 'tiered'] },
      { name: 'price', label: 'Price', type: 'number' },
      { name: 'currency', label: 'Currency' },
      { name: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'archived'] }
    ];
  }
  return [
    { name: 'name', label: 'Name' },
    { name: 'code', label: 'Code' },
    { name: 'billing_cycle', label: 'Billing Cycle', type: 'select', options: ['monthly', 'quarterly', 'yearly'] },
    { name: 'base_price', label: 'Base Price', type: 'number' },
    { name: 'currency', label: 'Currency' },
    { name: 'trial_days', label: 'Trial Days', type: 'number' },
    { name: 'is_custom', label: 'Custom Plan', type: 'checkbox' },
    { name: 'is_public', label: 'Public Plan', type: 'checkbox' },
    { name: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'archived'] },
    { name: 'description', label: 'Description', type: 'textarea' }
  ];
}

function fieldsForSubscriptionModal(modal: SubscriptionModal) {
  if (modal === 'upgrade' || modal === 'downgrade') {
    return [
      { name: 'new_plan_id', label: 'New Plan ID' },
      { name: 'effective_at', label: 'Effective Date', type: 'datetime-local' },
      { name: 'proration', label: 'Proration', type: 'select', options: ['immediate', 'next_cycle', 'none'] },
      { name: 'billing_cycle', label: 'Billing Cycle', type: 'select', options: ['monthly', 'quarterly', 'yearly'] },
      { name: 'coupon_code', label: 'Coupon Code' },
      { name: 'reason', label: 'Reason' }
    ];
  }
  if (modal === 'pause' || modal === 'resume') {
    return [
      { name: 'reason', label: 'Reason' },
      { name: 'effective_at', label: 'Effective Date', type: 'datetime-local' },
      { name: 'resume_at', label: 'Resume At', type: 'datetime-local' }
    ];
  }
  if (modal === 'cancel') {
    return [
      { name: 'reason', label: 'Cancellation Reason' },
      { name: 'effective_at', label: 'End Date', type: 'datetime-local' },
      { name: 'cancel_at_period_end', label: 'Cancel at period end', type: 'checkbox' },
      { name: 'data_retention_acknowledged', label: 'Data retention warning acknowledged', type: 'checkbox' }
    ];
  }
  if (modal === 'renew') {
    return [
      { name: 'renewal_starts_at', label: 'Renewal Starts', type: 'datetime-local' },
      { name: 'renewal_expires_at', label: 'Renewal Expires', type: 'datetime-local' },
      { name: 'amount', label: 'Amount', type: 'number' },
      { name: 'currency', label: 'Currency' },
      { name: 'create_invoice', label: 'Create invoice', type: 'checkbox' },
      { name: 'notes', label: 'Notes' }
    ];
  }
  if (modal === 'addon') {
    return [
      { name: 'addon_plan_id', label: 'Add-on Plan ID' },
      { name: 'quantity', label: 'Quantity', type: 'number' },
      { name: 'unit_price', label: 'Unit Price', type: 'number' },
      { name: 'starts_at', label: 'Starts At', type: 'datetime-local' },
      { name: 'ends_at', label: 'Ends At', type: 'datetime-local' },
      { name: 'status', label: 'Status', type: 'select', options: ['active', 'inactive'] }
    ];
  }
  if (modal === 'coupon') return [{ name: 'coupon_code', label: 'Coupon Code' }];
  return [];
}

function defaultLifecyclePayload(modal: SubscriptionModal, record?: SubscriptionRecord | null): Record<string, string | boolean | number> {
  const now = new Date().toISOString().slice(0, 16);
  if (modal === 'renew') return { renewal_starts_at: now, renewal_expires_at: '', amount: String(totalFor(record ?? {})), currency: record?.currency ?? 'INR', create_invoice: true, notes: 'Manual renewal' };
  if (modal === 'addon') return { addon_plan_id: '', quantity: 1, unit_price: '0.00', starts_at: now, ends_at: '', status: 'active' };
  if (modal === 'coupon') return { coupon_code: '' };
  if (modal === 'cancel') return { reason: '', effective_at: record?.expires_at ?? now, cancel_at_period_end: true, data_retention_acknowledged: false };
  if (modal === 'pause' || modal === 'resume') return { reason: '', effective_at: now, resume_at: '' };
  if (modal === 'upgrade' || modal === 'downgrade') return { new_plan_id: '', effective_at: now, proration: 'immediate', billing_cycle: record?.billing_cycle ?? 'monthly', coupon_code: '', reason: '' };
  return {};
}

function defaultCatalogForm(kind: CatalogKind, record?: CatalogRecord): Record<string, string | boolean | number> {
  if (kind === 'features') {
    return {
      module: textOf(record, ['module'], ''),
      name: textOf(record, ['name'], ''),
      code: textOf(record, ['code'], ''),
      data_type: textOf(record, ['data_type'], 'integer'),
      unit: textOf(record, ['unit'], ''),
      description: textOf(record, ['description'], ''),
      status: textOf(record, ['status'], 'active')
    };
  }
  if (kind === 'addons') {
    return {
      name: textOf(record, ['name'], ''),
      code: textOf(record, ['code'], ''),
      pricing_type: textOf(record, ['pricing_type'], 'recurring'),
      price: textOf(record, ['price'], '0.00'),
      currency: textOf(record, ['currency'], 'INR'),
      status: textOf(record, ['status'], 'active')
    };
  }
  return {
    name: textOf(record, ['name'], ''),
    code: textOf(record, ['code'], ''),
    description: textOf(record, ['description'], ''),
    billing_cycle: textOf(record, ['billing_cycle'], 'monthly'),
    base_price: textOf(record, ['base_price'], '0.00'),
    currency: textOf(record, ['currency'], 'INR'),
    trial_days: Number(record?.trial_days ?? 14),
    is_custom: Boolean(record?.is_custom),
    is_public: record?.is_public === undefined ? true : Boolean(record.is_public),
    status: textOf(record, ['status'], 'active')
  };
}

function saveCatalog(kind: CatalogKind, id: string, form: Record<string, string | boolean | number>, mode: Mode) {
  if (kind === 'features') {
    const payload = form as FeaturePayload;
    return mode === 'create' ? platformSubscriptionsApi.features.create(payload) : platformSubscriptionsApi.features.update(id, payload);
  }
  if (kind === 'addons') {
    const payload = form as AddonPayload;
    return mode === 'create' ? platformSubscriptionsApi.addons.create(payload) : platformSubscriptionsApi.addons.update(id, payload);
  }
  const payload = form as PlanPayload;
  return mode === 'create' ? platformSubscriptionsApi.plans.create(payload) : platformSubscriptionsApi.plans.update(id, payload);
}

function catalogDetail(kind: CatalogKind, id: string) {
  if (kind === 'features') return platformSubscriptionsApi.features.detail(id);
  if (kind === 'addons') return platformSubscriptionsApi.addons.detail(id);
  return platformSubscriptionsApi.plans.detail(id);
}

function titleForSubscriptionModal(modal: SubscriptionModal) {
  if (modal === 'upgrade') return 'Upgrade Subscription';
  if (modal === 'downgrade') return 'Downgrade Subscription';
  if (modal === 'pause') return 'Pause Subscription';
  if (modal === 'resume') return 'Resume Subscription';
  if (modal === 'cancel') return 'Cancel Subscription';
  if (modal === 'renew') return 'Renew Subscription';
  if (modal === 'addon') return 'Add Add-on';
  if (modal === 'coupon') return 'Apply Coupon';
  return 'Create Invoice';
}

function permissionForSubscriptionModal(modal: SubscriptionModal) {
  if (modal === 'upgrade') return 'subscription.upgrade';
  if (modal === 'downgrade') return 'subscription.downgrade';
  if (modal === 'renew') return 'subscription.renew';
  if (modal === 'cancel') return 'subscription.cancel';
  if (modal === 'invoice') return 'billing.invoice.create';
  return 'subscription.edit';
}

function labelize(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function parseMetadata(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return {};
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return { raw: value };
  }
}
