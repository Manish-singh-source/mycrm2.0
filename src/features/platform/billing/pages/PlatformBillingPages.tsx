import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BadgeDollarSign, Eye, FileSpreadsheet, FileText, MoreVertical, Pencil, Receipt, RefreshCw, RotateCw, Send, Tags, Trash2 } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { platformQueryKeys } from '@/features/platform/api/platformQueryKeys';
import { platformBillingApi, type BillingRecord } from '@/features/platform/billing/api/platformBillingApi';
import { PLATFORM_ROUTES } from '@/features/platform/routes/platformRoutes';
import { ApiError } from '@/lib/api/apiError';
import { createListQuery } from '@/lib/api/listQuery';
import { DataTable, type DataTableColumn } from '@/shared/components/data-table';
import { AppDrawer } from '@/shared/components/drawer';
import { PageHeader, StatusBadge, Tabs } from '@/shared/components/layout';
import { AppModal } from '@/shared/components/modal';
import { Button, PermissionButton } from '@/shared/components/ui';
import { ConfirmDialog } from '@/shared/components/workflows';

type BillingKind = 'invoices' | 'payments' | 'refunds' | 'coupons';
type BillingModal = 'manualInvoice' | 'lineItemEditor' | 'sendInvoice' | 'recordPayment' | 'cancelInvoice' | 'pdfPreview' | 'gatewayResponse' | 'retryPayment' | 'refundPayment' | 'retryRefund' | 'couponRules' | 'assignPlans' | 'assignTenants' | 'disableCoupon' | null;

type InvoiceLineItem = {
  item_type: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  metadata: string;
};

type ModalField = {
  name: string;
  label: string;
  type?: string;
  options?: string[];
};

const billingMeta = {
  invoices: { label: 'Invoices', singular: 'Invoice', route: PLATFORM_ROUTES.billing.invoices, resourceKey: 'billing-invoices', permission: 'billing.invoice' },
  payments: { label: 'Payments', singular: 'Payment', route: PLATFORM_ROUTES.billing.payments, resourceKey: 'billing-payments', permission: 'billing.payment' },
  refunds: { label: 'Refunds', singular: 'Refund', route: PLATFORM_ROUTES.billing.refunds, resourceKey: 'billing-refunds', permission: 'billing.payment' },
  coupons: { label: 'Coupons', singular: 'Coupon', route: PLATFORM_ROUTES.billing.coupons, resourceKey: 'coupons', permission: 'coupon' }
} as const;

function idOf(record?: BillingRecord | null) {
  return String(record?.uuid ?? record?.id ?? '');
}

function textOf(record: BillingRecord | null | undefined, keys: string[], fallback = '-') {
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

function money(value: unknown, currency = 'INR') {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: currency || 'INR' }).format(Number.isFinite(amount) ? amount : 0);
}

function statusTone(status: string): 'neutral' | 'success' | 'warning' | 'danger' | 'info' {
  if (['paid', 'success', 'active', 'sent', 'reconciled'].includes(status)) return 'success';
  if (['draft', 'pending', 'processing'].includes(status)) return 'warning';
  if (['failed', 'cancelled', 'canceled', 'void', 'disabled'].includes(status)) return 'danger';
  return 'neutral';
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

function maskRaw(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(maskRaw);
  if (!value || typeof value !== 'object') return value;
  const sensitive = new Set(['token', 'secret', 'password', 'authorization', 'card', 'cvv', 'key', 'signature']);
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
    key,
    [...sensitive].some((item) => key.toLowerCase().includes(item)) ? '[masked]' : maskRaw(entry)
  ]));
}

function rawSummary(value: unknown): BillingRecord {
  const masked = maskRaw(value);
  if (!masked || typeof masked !== 'object' || Array.isArray(masked)) return { value: masked };
  return masked as BillingRecord;
}

function DetailSummary({ record }: { record: BillingRecord }) {
  return (
    <dl className="enterprise-summary-list">
      {Object.entries(record).map(([key, value]) => (
        <div key={key}>
          <dt>{key}</dt>
          <dd>{displayValue(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '-';
  if (Array.isArray(value)) return `${value.length} item${value.length === 1 ? '' : 's'}`;
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return textOf(value as BillingRecord, ['display_name', 'name', 'title', 'uuid'], 'Details available');
  return String(value);
}

export function PlatformInvoicesListPage() { return <BillingList kind="invoices" />; }
export function PlatformInvoiceViewPage() { return <BillingView kind="invoices" />; }
export function PlatformPaymentsListPage() { return <BillingList kind="payments" />; }
export function PlatformPaymentViewPage() { return <BillingView kind="payments" />; }
export function PlatformRefundsListPage() { return <BillingList kind="refunds" />; }
export function PlatformRefundViewPage() { return <BillingView kind="refunds" />; }
export function PlatformCouponsListPage() { return <BillingList kind="coupons" />; }
export function PlatformCouponViewPage() { return <BillingView kind="coupons" />; }

function BillingList({ kind }: { kind: BillingKind }) {
  const meta = billingMeta[kind];
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<BillingRecord | null>(null);
  const [modal, setModal] = useState<BillingModal>(null);
  const queryParams = createListQuery({ page, per_page: 25, search });
  const query = useQuery({
    queryKey: platformQueryKeys.list(meta.resourceKey, queryParams),
    queryFn: () => listFor(kind, queryParams)
  });
  const rows = query.data?.data ?? [];
  const mutation = useMutation({
    mutationFn: ({ action, record, payload }: { action: BillingModal; record: BillingRecord; payload: Record<string, unknown> }) => mutateFor(kind, action, record, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: platformQueryKeys.resource(meta.resourceKey) });
      setModal(null);
      setSelectedRecord(null);
    }
  });

  useEffect(() => {
    const action = new URLSearchParams(location.search).get('action');
    if (kind === 'invoices' && action === 'manualInvoice') {
      setSelectedRecord(null);
      setModal('manualInvoice');
    }
  }, [kind, location.search]);

  const columns = useMemo(() => columnsFor(kind, {
    onView: (record) => navigate(`${meta.route}/${idOf(record)}`),
    onModal: (nextModal, record) => {
      setSelectedRecord(record);
      setModal(nextModal);
    }
  }), [kind, meta.route, navigate]);

  return (
    <section className="enterprise-module-page platform-billing-page">
      <PageHeader
        title={meta.label}
        description={`Manage platform ${meta.label.toLowerCase()} with confirmed financial workflows.`}
        actions={
          <>
            {kind === 'invoices' ? <Button type="button" variant="secondary" onClick={() => { setSelectedRecord(null); setModal('manualInvoice'); }}><Receipt size={16} aria-hidden />Manual Invoice</Button> : null}
            {kind === 'coupons' ? <Button type="button" onClick={() => { setSelectedRecord(null); setModal('couponRules'); }}><Tags size={16} aria-hidden />Coupon Rule Builder</Button> : null}
            <Button type="button" variant="secondary" onClick={() => exportFor(kind)}><FileSpreadsheet size={16} aria-hidden />Export</Button>
          </>
        }
      />
      <BillingStats kind={kind} rows={rows} />
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
      <BillingActionSurface
        modal={modal}
        kind={kind}
        record={selectedRecord}
        loading={mutation.isPending}
        error={mutation.error}
        onClose={() => setModal(null)}
        onConfirm={(payload) => {
          if (!modal) return;
          mutation.mutate({ action: modal, record: selectedRecord ?? {}, payload });
        }}
      />
    </section>
  );
}

function BillingView({ kind }: { kind: BillingKind }) {
  const meta = billingMeta[kind];
  const { id = '' } = useParams();
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<BillingModal>(null);
  const query = useQuery({ queryKey: platformQueryKeys.detail(meta.resourceKey, id), queryFn: () => detailFor(kind, id) });
  const mutation = useMutation({
    mutationFn: ({ action, record, payload }: { action: BillingModal; record: BillingRecord; payload: Record<string, unknown> }) => mutateFor(kind, action, record, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: platformQueryKeys.resource(meta.resourceKey) });
      setModal(null);
    }
  });
  if (query.isLoading) return <div className="surface-state">Loading {meta.singular.toLowerCase()}...</div>;
  if (query.isError) return <div className="surface-error">{errorMessage(query.error)}</div>;
  const record = query.data;
  if (!record) return <div className="empty-state">{meta.singular} not found.</div>;
  return (
    <section className="enterprise-module-page platform-billing-page">
      <PageHeader title={textOf(record, ['invoice_number', 'payment_number', 'refund_number', 'code', 'name'], meta.singular)} description={textOf(record, ['tenant_name', 'organization_name', 'status', 'payment_status', 'refund_status'])} actions={<ViewActions kind={kind} onModal={setModal} />} />
      <BillingStats kind={kind} rows={[record]} />
      <DetailTabs tabs={[
        { id: 'summary', label: 'Summary', content: <RecordDetails record={record} /> },
        { id: 'items', label: 'Line items', content: <RecordList rows={record.items ?? []} /> },
        { id: 'payments', label: 'Payments', content: <RecordList rows={record.payments ?? []} /> },
        { id: 'refunds', label: 'Refunds', content: <RecordList rows={record.refunds ?? []} /> },
        { id: 'redemptions', label: 'Redemptions', content: <RecordList rows={record.redemptions ?? []} /> }
      ]} />
      <BillingActionSurface modal={modal} kind={kind} record={record} loading={mutation.isPending} error={mutation.error} onClose={() => setModal(null)} onConfirm={(payload) => { if (!modal) return; mutation.mutate({ action: modal, record, payload }); }} />
    </section>
  );
}

function columnsFor(kind: BillingKind, handlers: { onView: (record: BillingRecord) => void; onModal: (modal: BillingModal, record: BillingRecord) => void }): DataTableColumn<BillingRecord>[] {
  const commonActions = { id: 'actions', header: 'Actions', enableHiding: false, cell: (row: BillingRecord) => <BillingRowActions kind={kind} row={row} handlers={handlers} /> };
  if (kind === 'invoices') return [
    { id: 'invoice_number', header: 'Invoice #', accessor: (row) => row.invoice_number, cell: (row) => <strong>{textOf(row, ['invoice_number'])}</strong> },
    { id: 'tenant', header: 'Tenant', cell: (row) => textOf(row, ['tenant_name', 'organization_name', 'tenant_id']) },
    { id: 'invoice_date', header: 'Invoice Date', cell: (row) => formatDate(row.invoice_date) },
    { id: 'due_date', header: 'Due Date', cell: (row) => formatDate(row.due_date) },
    { id: 'total', header: 'Total', cell: (row) => money(row.total ?? row.total_amount, row.currency) },
    { id: 'paid', header: 'Paid', cell: (row) => money(row.paid_amount, row.currency) },
    { id: 'balance', header: 'Balance', cell: (row) => money(row.balance ?? row.balance_amount, row.currency) },
    { id: 'status', header: 'Status', cell: (row) => <Badge value={textOf(row, ['status'], 'draft')} /> },
    commonActions
  ];
  if (kind === 'payments') return [
    { id: 'payment_number', header: 'Payment #', cell: (row) => <strong>{textOf(row, ['payment_number'])}</strong> },
    { id: 'tenant', header: 'Tenant', cell: (row) => textOf(row, ['tenant_name', 'organization_name', 'tenant_id']) },
    { id: 'invoice', header: 'Invoice', cell: (row) => textOf(row, ['invoice_number', 'platform_invoice_id']) },
    { id: 'gateway', header: 'Gateway', cell: (row) => textOf(row, ['gateway']) },
    { id: 'method', header: 'Method', cell: (row) => textOf(row, ['payment_method']) },
    { id: 'amount', header: 'Amount', cell: (row) => money(row.amount, row.currency) },
    { id: 'payment_status', header: 'Status', cell: (row) => <Badge value={textOf(row, ['payment_status', 'status'], 'pending')} /> },
    { id: 'paid_at', header: 'Paid At', cell: (row) => formatDate(row.paid_at) },
    commonActions
  ];
  if (kind === 'refunds') return [
    { id: 'refund_number', header: 'Refund #', cell: (row) => <strong>{textOf(row, ['refund_number'])}</strong> },
    { id: 'payment', header: 'Payment', cell: (row) => textOf(row, ['payment_number', 'platform_payment_id']) },
    { id: 'invoice', header: 'Invoice', cell: (row) => textOf(row, ['invoice_number', 'platform_invoice_id']) },
    { id: 'amount', header: 'Amount', cell: (row) => money(row.amount, row.currency) },
    { id: 'refund_status', header: 'Status', cell: (row) => <Badge value={textOf(row, ['refund_status', 'status'], 'pending')} /> },
    { id: 'refunded_at', header: 'Refunded At', cell: (row) => formatDate(row.refunded_at) },
    commonActions
  ];
  return [
    { id: 'code', header: 'Code', cell: (row) => <strong>{textOf(row, ['code'])}</strong> },
    { id: 'name', header: 'Name', cell: (row) => textOf(row, ['name']) },
    { id: 'discount_type', header: 'Type', cell: (row) => textOf(row, ['discount_type']) },
    { id: 'discount_value', header: 'Value', cell: (row) => textOf(row, ['discount_value']) },
    { id: 'starts_at', header: 'Starts', cell: (row) => formatDate(row.starts_at) },
    { id: 'expires_at', header: 'Expires', cell: (row) => formatDate(row.expires_at) },
    { id: 'status', header: 'Status', cell: (row) => <Badge value={textOf(row, ['status'], 'inactive')} /> },
    commonActions
  ];
}

function BillingRowActions({ kind, row, handlers }: { kind: BillingKind; row: BillingRecord; handlers: { onView: (record: BillingRecord) => void; onModal: (modal: BillingModal, record: BillingRecord) => void } }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  function run(callback: () => void) { callback(); setOpen(false); }
  return (
    <div className="action-dropdown">
      <button ref={triggerRef} type="button" className="action-menu-trigger" aria-label="Open billing actions" aria-expanded={open} onClick={() => setOpen((current) => !current)}><MoreVertical size={16} aria-hidden /></button>
      <PortalActionMenu open={open} anchorRef={triggerRef} onClose={() => setOpen(false)}>
        <div className="action-menu" role="menu">
          <button type="button" role="menuitem" onMouseDown={(event) => event.preventDefault()} onClick={() => run(() => handlers.onView(row))}><Eye size={15} aria-hidden /> View</button>
          {kind === 'invoices' ? <><PermissionButton guard="platform" permission="billing.invoice.send" type="button" role="menuitem" variant="ghost" onClick={() => run(() => handlers.onModal('sendInvoice', row))}><Send size={15} aria-hidden /> Send Invoice</PermissionButton><PermissionButton guard="platform" permission="billing.payment.create" type="button" role="menuitem" variant="ghost" onClick={() => run(() => handlers.onModal('recordPayment', row))}><BadgeDollarSign size={15} aria-hidden /> Record Payment</PermissionButton><button type="button" role="menuitem" onClick={() => run(() => handlers.onModal('pdfPreview', row))}><FileText size={15} aria-hidden /> PDF Preview</button><hr /><PermissionButton guard="platform" permission="billing.invoice.cancel" type="button" role="menuitem" variant="ghost" className="is-danger" onClick={() => run(() => handlers.onModal('cancelInvoice', row))}><Trash2 size={15} aria-hidden /> Cancel Invoice</PermissionButton></> : null}
          {kind === 'payments' ? <><button type="button" role="menuitem" onClick={() => run(() => handlers.onModal('gatewayResponse', row))}><FileSpreadsheet size={15} aria-hidden /> Gateway Response</button><PermissionButton guard="platform" permission="billing.payment.create" type="button" role="menuitem" variant="ghost" onClick={() => run(() => handlers.onModal('retryPayment', row))}><RotateCw size={15} aria-hidden /> Retry Payment</PermissionButton><PermissionButton guard="platform" permission="billing.payment.refund" type="button" role="menuitem" variant="ghost" onClick={() => run(() => handlers.onModal('refundPayment', row))}><RefreshCw size={15} aria-hidden /> Initiate Refund</PermissionButton></> : null}
          {kind === 'refunds' ? <><button type="button" role="menuitem" onClick={() => run(() => handlers.onModal('gatewayResponse', row))}><FileSpreadsheet size={15} aria-hidden /> Gateway Response</button><PermissionButton guard="platform" permission="billing.payment.refund" type="button" role="menuitem" variant="ghost" onClick={() => run(() => handlers.onModal('retryRefund', row))}><RotateCw size={15} aria-hidden /> Retry Refund</PermissionButton></> : null}
          {kind === 'coupons' ? <><PermissionButton guard="platform" permission="coupon.edit" type="button" role="menuitem" variant="ghost" onClick={() => run(() => handlers.onModal('couponRules', row))}><Pencil size={15} aria-hidden /> Rule Builder</PermissionButton><PermissionButton guard="platform" permission="coupon.edit" type="button" role="menuitem" variant="ghost" onClick={() => run(() => handlers.onModal('assignPlans', row))}><Tags size={15} aria-hidden /> Assign Plans</PermissionButton><PermissionButton guard="platform" permission="coupon.edit" type="button" role="menuitem" variant="ghost" onClick={() => run(() => handlers.onModal('assignTenants', row))}><Tags size={15} aria-hidden /> Assign Tenants</PermissionButton><PermissionButton guard="platform" permission="coupon.delete" type="button" role="menuitem" variant="ghost" className="is-danger" onClick={() => run(() => handlers.onModal('disableCoupon', row))}><Trash2 size={15} aria-hidden /> Disable Coupon</PermissionButton></> : null}
        </div>
      </PortalActionMenu>
    </div>
  );
}

function BillingActionSurface({ modal, kind, record, loading, error, onClose, onConfirm }: { modal: BillingModal; kind: BillingKind; record?: BillingRecord | null; loading: boolean; error: unknown; onClose: () => void; onConfirm: (payload: Record<string, unknown>) => void }) {
  const [payload, setPayload] = useState<Record<string, string | boolean | number>>({});
  const [typedRefund, setTypedRefund] = useState('');
  const recordId = idOf(record);
  const pdfQuery = useQuery({
    queryKey: platformQueryKeys.detail('billing-invoice-pdf', recordId),
    queryFn: () => platformBillingApi.invoices.pdf(recordId),
    enabled: modal === 'pdfPreview' && Boolean(recordId)
  });

  useEffect(() => {
    setPayload(defaultPayload(modal, record));
    setTypedRefund('');
  }, [modal, record]);

  if (!modal) return null;
  if (modal === 'manualInvoice') return <ManualInvoiceDrawer loading={loading} error={error} onClose={onClose} onConfirm={onConfirm} />;
  if (modal === 'pdfPreview') {
    return (
      <AppDrawer open onClose={onClose} title="Invoice PDF Preview" guard="platform" permission="billing.invoice.view" size="lg" loading={pdfQuery.isLoading} error={pdfQuery.isError ? errorMessage(pdfQuery.error) : null}>
        <div className="invoice-pdf-preview">
          <div>
            <strong>{textOf(record, ['invoice_number'], 'Invoice')}</strong>
            <span>{money(record?.total ?? record?.total_amount, record?.currency)}</span>
          </div>
          <DetailSummary record={rawSummary(pdfQuery.data?.data ?? pdfQuery.data ?? { endpoint: `/billing/invoices/${recordId}/pdf`, note: 'PDF metadata will render here when returned by the API.' })} />
        </div>
      </AppDrawer>
    );
  }
  if (modal === 'gatewayResponse') return <AppDrawer open onClose={onClose} title="Gateway Response" guard="platform" permission="billing.payment.view" size="lg"><DetailSummary record={rawSummary(record?.raw_response ?? record ?? {})} /></AppDrawer>;
  if (modal === 'cancelInvoice') return <ConfirmDialog open onClose={onClose} title="Cancel invoice?" description="This affects accounting records. If this invoice has been sent, type CANCEL and provide a reason before cancelling." confirmLabel="Cancel Invoice" confirmTone="danger" typedConfirmation="CANCEL" reasonRequired guard="platform" permission="billing.invoice.cancel" loading={loading} error={error ? errorMessage(error) : null} onConfirm={(values) => onConfirm({ reason: values.reason ?? payload.reason })} />;
  if (modal === 'disableCoupon') return <ConfirmDialog open onClose={onClose} title="Disable coupon?" description="Active and future redemptions may be affected. Existing redemptions remain in reporting." confirmLabel="Disable Coupon" confirmTone="danger" guard="platform" permission="coupon.delete" loading={loading} error={error ? errorMessage(error) : null} onConfirm={() => onConfirm({})} />;
  if (modal === 'refundPayment') {
    const reasonOk = String(payload.reason ?? '').trim().length > 0;
    return (
      <AppModal open onClose={onClose} title="Initiate Refund" guard="platform" permission="billing.payment.refund" size="lg" loading={loading} error={error ? errorMessage(error) : null} footer={<><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="button" variant="danger" disabled={typedRefund !== 'REFUND' || !reasonOk || loading} onClick={() => onConfirm(payload)}>Initiate Refund</Button></>}>
        <div className="surface-state">Gateway preview: {textOf(record, ['gateway'], 'selected gateway')} / max {money(record?.amount, record?.currency)}</div>
        <GenericFields fields={fieldsForModal(modal)} payload={payload} onChange={setPayload} />
        <label className="typed-confirm-field">Type REFUND<input value={typedRefund} onChange={(event) => setTypedRefund(event.target.value)} /></label>
      </AppModal>
    );
  }

  const fields = fieldsForModal(modal);
  return (
    <AppModal open onClose={onClose} title={titleFor(modal)} guard="platform" permission={permissionFor(modal, kind)} size="lg" loading={loading} error={error ? errorMessage(error) : null} footer={<><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="button" onClick={() => onConfirm(payload)} disabled={loading}>Confirm</Button></>}>
      {modal === 'couponRules' ? <div className="surface-state">Build coupon restrictions for discount, dates, redemption limits, plans and tenants.</div> : null}
      {modal === 'assignPlans' ? <div className="surface-state">Paste comma-separated plan UUIDs. This calls PUT /coupons/{`id`}/plans.</div> : null}
      {modal === 'assignTenants' ? <div className="surface-state">Paste comma-separated tenant UUIDs. This calls PUT /coupons/{`id`}/tenants.</div> : null}
      <GenericFields fields={fields} payload={payload} onChange={setPayload} />
    </AppModal>
  );
}

function BillingStats({ kind, rows }: { kind: BillingKind; rows: BillingRecord[] }) {
  const currency = rows[0]?.currency ?? 'INR';
  const total = rows.reduce((sum, row) => sum + Number(row.total ?? row.total_amount ?? row.amount ?? 0), 0);
  return <section className="platform-access-summary"><SummaryTile icon={<Receipt />} label={`Total ${billingMeta[kind].label}`} value={String(rows.length)} /><SummaryTile icon={<BadgeDollarSign />} label="Amount" value={money(total, currency)} /><SummaryTile icon={<RefreshCw />} label="Active/Success" value={String(rows.filter((row) => ['active', 'success', 'paid'].includes(textOf(row, ['status', 'payment_status', 'refund_status'], '').toLowerCase())).length)} /><SummaryTile icon={<Trash2 />} label="Failed/Cancelled" value={String(rows.filter((row) => ['failed', 'cancelled', 'canceled'].includes(textOf(row, ['status', 'payment_status', 'refund_status'], '').toLowerCase())).length)} /></section>;
}

function SummaryTile({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <article className="summary-card"><span>{icon}</span><p>{label}</p><strong>{value}</strong></article>;
}

function DetailTabs({ tabs }: { tabs: Array<{ id: string; label: string; content: ReactNode }> }) {
  const [activeId, setActiveId] = useState(tabs[0]?.id ?? '');
  const active = tabs.find((tab) => tab.id === activeId) ?? tabs[0];
  return <section className="dashboard-panel"><Tabs tabs={tabs.map((tab) => ({ id: tab.id, label: tab.label }))} activeId={active?.id ?? ''} onChange={setActiveId} ariaLabel="Billing detail tabs" /><div className="surface-body">{active?.content}</div></section>;
}

function RecordDetails({ record }: { record: BillingRecord }) {
  return <dl className="enterprise-summary-list">{Object.entries(record).filter(([, value]) => typeof value !== 'object').map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{['amount', 'total', 'total_amount', 'paid_amount', 'balance_amount', 'discount_amount', 'tax_amount'].includes(key) ? money(value, record.currency) : String(value ?? '-')}</dd></div>)}</dl>;
}

function RecordList({ rows }: { rows: BillingRecord[] }) {
  if (rows.length === 0) return <div className="empty-state">No records returned.</div>;
  return <div className="record-list">{rows.map((row, index) => <article key={idOf(row) || index}><strong>{textOf(row, ['invoice_number', 'payment_number', 'refund_number', 'code', 'name'], `Record ${index + 1}`)}</strong><p>{textOf(row, ['status', 'payment_status', 'refund_status', 'amount'])}</p></article>)}</div>;
}

function PortalActionMenu({ anchorRef, children, onClose, open }: { anchorRef: React.RefObject<HTMLElement>; children: ReactNode; onClose: () => void; open: boolean }) {
  const [position, setPosition] = useState({ left: 0, top: 0 });
  useEffect(() => { if (!open) return; const rect = anchorRef.current?.getBoundingClientRect(); if (!rect) return; const width = 240; setPosition({ left: Math.min(Math.max(12, rect.right - width), window.innerWidth - width - 12), top: Math.min(rect.bottom + 8, window.innerHeight - 12) }); }, [anchorRef, open]);
  if (!open) return null;
  return createPortal(<div className="action-menu-portal" style={{ left: position.left, top: position.top }}><button type="button" className="action-menu-backdrop" aria-label="Close actions menu" onClick={onClose} />{children}</div>, document.body);
}

function ViewActions({ kind, onModal }: { kind: BillingKind; onModal: (modal: BillingModal) => void }) {
  if (kind === 'invoices') {
    return (
      <>
        <Button type="button" variant="secondary" onClick={() => onModal('sendInvoice')}><Send size={16} aria-hidden />Send</Button>
        <Button type="button" variant="secondary" onClick={() => onModal('recordPayment')}><BadgeDollarSign size={16} aria-hidden />Record Payment</Button>
        <Button type="button" variant="secondary" onClick={() => onModal('pdfPreview')}><FileText size={16} aria-hidden />PDF Preview</Button>
        <Button type="button" variant="danger" onClick={() => onModal('cancelInvoice')}><Trash2 size={16} aria-hidden />Cancel</Button>
      </>
    );
  }
  if (kind === 'payments') {
    return (
      <>
        <Button type="button" variant="secondary" onClick={() => onModal('gatewayResponse')}><FileSpreadsheet size={16} aria-hidden />Gateway</Button>
        <Button type="button" variant="secondary" onClick={() => onModal('retryPayment')}><RotateCw size={16} aria-hidden />Retry</Button>
        <Button type="button" variant="danger" onClick={() => onModal('refundPayment')}><RefreshCw size={16} aria-hidden />Refund</Button>
      </>
    );
  }
  if (kind === 'refunds') {
    return (
      <>
        <Button type="button" variant="secondary" onClick={() => onModal('gatewayResponse')}><FileSpreadsheet size={16} aria-hidden />Gateway</Button>
        <Button type="button" variant="secondary" onClick={() => onModal('retryRefund')}><RotateCw size={16} aria-hidden />Retry</Button>
      </>
    );
  }
  return (
    <>
      <Button type="button" variant="secondary" onClick={() => onModal('couponRules')}><Pencil size={16} aria-hidden />Rules</Button>
      <Button type="button" variant="secondary" onClick={() => onModal('assignPlans')}><Tags size={16} aria-hidden />Plans</Button>
      <Button type="button" variant="secondary" onClick={() => onModal('assignTenants')}><Tags size={16} aria-hidden />Tenants</Button>
      <Button type="button" variant="danger" onClick={() => onModal('disableCoupon')}><Trash2 size={16} aria-hidden />Disable</Button>
    </>
  );
}

function GenericFields({ fields, payload, onChange }: { fields: ModalField[]; payload: Record<string, string | boolean | number>; onChange: (next: Record<string, string | boolean | number>) => void }) {
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
              {field.type === 'select' ? (
                <select value={String(payload[field.name] ?? '')} onChange={(event) => onChange({ ...payload, [field.name]: event.target.value })}>
                  {field.options?.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              ) : field.type === 'textarea' ? (
                <textarea value={String(payload[field.name] ?? '')} onChange={(event) => onChange({ ...payload, [field.name]: event.target.value })} />
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

function ManualInvoiceDrawer({ loading, error, onClose, onConfirm }: { loading: boolean; error: unknown; onClose: () => void; onConfirm: (payload: Record<string, unknown>) => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [draft, setDraft] = useState<Record<string, string | number>>({ tenant_id: '', subscription_id: '', invoice_date: today, due_date: today, currency: 'INR', status: 'draft', discount_amount: 0, tax_amount: 0 });
  const [items, setItems] = useState<InvoiceLineItem[]>([{ item_type: 'plan', description: 'Subscription plan', quantity: 1, unit_price: 0, tax_rate: 18, metadata: '{}' }]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const itemTax = items.reduce((sum, item) => sum + (item.quantity * item.unit_price * item.tax_rate) / 100, 0);
  const discount = Number(draft.discount_amount ?? 0);
  const tax = Number(draft.tax_amount || itemTax);
  const total = Math.max(0, subtotal - discount + tax);

  function submit() {
    onConfirm({
      ...draft,
      subtotal: subtotal.toFixed(2),
      tax_amount: tax.toFixed(2),
      total_amount: total.toFixed(2),
      items: items.map((item) => ({
        item_type: item.item_type,
        description: item.description,
        quantity: item.quantity.toFixed(2),
        unit_price: item.unit_price.toFixed(2),
        amount: (item.quantity * item.unit_price).toFixed(2),
        metadata: parseJson(item.metadata)
      }))
    });
  }

  return (
    <AppDrawer open onClose={onClose} title="Manual Invoice" guard="platform" permission="billing.invoice.create" size="xl" loading={loading} error={error ? errorMessage(error) : null} footer={<><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="button" onClick={submit} disabled={loading || !draft.tenant_id || items.length === 0}>Create Invoice</Button></>}>
      <div className="form-grid form-grid--two">
        {manualInvoiceFields.map((field) => (
          <label key={field.name}>
            <span>{field.label}</span>
            <input type={field.type ?? 'text'} value={String(draft[field.name] ?? '')} onChange={(event) => setDraft((current) => ({ ...current, [field.name]: field.type === 'number' ? Number(event.target.value) : event.target.value }))} />
          </label>
        ))}
      </div>
      <section className="line-item-editor-panel">
        <header>
          <h3>Line Items</h3>
          <Button type="button" variant="secondary" onClick={() => { setItems((current) => [...current, { item_type: 'custom', description: '', quantity: 1, unit_price: 0, tax_rate: 0, metadata: '{}' }]); setEditingIndex(items.length); }}>Add Item</Button>
        </header>
        <div className="record-list">
          {items.map((item, index) => (
            <article key={`${item.description}-${index}`}>
              <strong>{item.description || `Line item ${index + 1}`}</strong>
              <p>{item.item_type} / {item.quantity} x {money(item.unit_price, String(draft.currency || 'INR'))} / tax {item.tax_rate}%</p>
              <div className="inline-actions">
                <Button type="button" variant="secondary" size="sm" onClick={() => setEditingIndex(index)}>Edit</Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))}>Remove</Button>
              </div>
            </article>
          ))}
        </div>
        <dl className="enterprise-summary-list">
          <div><dt>Subtotal</dt><dd>{money(subtotal, String(draft.currency || 'INR'))}</dd></div>
          <div><dt>Discount</dt><dd>{money(discount, String(draft.currency || 'INR'))}</dd></div>
          <div><dt>Tax</dt><dd>{money(tax, String(draft.currency || 'INR'))}</dd></div>
          <div><dt>Total</dt><dd>{money(total, String(draft.currency || 'INR'))}</dd></div>
        </dl>
      </section>
      {editingIndex !== null && items[editingIndex] ? <LineItemEditor item={items[editingIndex]} currency={String(draft.currency || 'INR')} onClose={() => setEditingIndex(null)} onSave={(item) => { setItems((current) => current.map((entry, index) => index === editingIndex ? item : entry)); setEditingIndex(null); }} /> : null}
    </AppDrawer>
  );
}

function LineItemEditor({ item, currency, onClose, onSave }: { item: InvoiceLineItem; currency: string; onClose: () => void; onSave: (item: InvoiceLineItem) => void }) {
  const [draft, setDraft] = useState(item);
  const amount = draft.quantity * draft.unit_price;
  return (
    <AppModal open onClose={onClose} title="Line Item Editor" size="lg" footer={<><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="button" onClick={() => onSave(draft)}>Save Item</Button></>}>
      <div className="surface-state">Line total: {money(amount, currency)}</div>
      <div className="form-grid form-grid--two">
        <label><span>Item Type</span><select value={draft.item_type} onChange={(event) => setDraft((current) => ({ ...current, item_type: event.target.value }))}><option value="plan">plan</option><option value="addon">addon</option><option value="service">service</option><option value="custom">custom</option></select></label>
        <label><span>Description</span><input value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} /></label>
        <label><span>Quantity</span><input type="number" value={draft.quantity} onChange={(event) => setDraft((current) => ({ ...current, quantity: Number(event.target.value) }))} /></label>
        <label><span>Unit Price</span><input type="number" value={draft.unit_price} onChange={(event) => setDraft((current) => ({ ...current, unit_price: Number(event.target.value) }))} /></label>
        <label><span>Tax Rate</span><input type="number" value={draft.tax_rate} onChange={(event) => setDraft((current) => ({ ...current, tax_rate: Number(event.target.value) }))} /></label>
        <label><span>Metadata JSON</span><textarea value={draft.metadata} onChange={(event) => setDraft((current) => ({ ...current, metadata: event.target.value }))} /></label>
      </div>
    </AppModal>
  );
}

function parseJson(value: string) {
  try {
    return JSON.parse(value || '{}') as Record<string, unknown>;
  } catch {
    return { note: value };
  }
}

function parseCsv(value: unknown) {
  return String(value ?? '').split(',').map((entry) => entry.trim()).filter(Boolean);
}

const manualInvoiceFields: ModalField[] = [
  { name: 'tenant_id', label: 'Tenant UUID' },
  { name: 'subscription_id', label: 'Subscription UUID' },
  { name: 'invoice_date', label: 'Invoice Date', type: 'date' },
  { name: 'due_date', label: 'Due Date', type: 'date' },
  { name: 'currency', label: 'Currency' },
  { name: 'discount_amount', label: 'Discount', type: 'number' },
  { name: 'tax_amount', label: 'Tax Override', type: 'number' },
  { name: 'status', label: 'Status' }
];
function listFor(kind: BillingKind, query: ReturnType<typeof createListQuery>) {
  if (kind === 'invoices') return platformBillingApi.invoices.list(query);
  if (kind === 'payments') return platformBillingApi.payments.list(query);
  if (kind === 'refunds') return platformBillingApi.refunds.list(query);
  return platformBillingApi.coupons.list(query);
}

function detailFor(kind: BillingKind, id: string) {
  if (kind === 'invoices') return platformBillingApi.invoices.detail(id);
  if (kind === 'payments') return platformBillingApi.payments.detail(id);
  if (kind === 'refunds') return platformBillingApi.refunds.detail(id);
  return platformBillingApi.coupons.detail(id);
}

async function mutateFor(kind: BillingKind, action: BillingModal, record: BillingRecord, payload: Record<string, unknown>) {
  const id = idOf(record);
  if (action === 'manualInvoice') return platformBillingApi.invoices.create(payload);
  if (action === 'sendInvoice') return platformBillingApi.invoices.send(id, payload);
  if (action === 'recordPayment') return platformBillingApi.invoices.recordPayment(id, payload);
  if (action === 'cancelInvoice') return platformBillingApi.invoices.cancel(id, payload);
  if (action === 'retryPayment') return platformBillingApi.payments.retry(id, payload);
  if (action === 'refundPayment') return platformBillingApi.payments.refund(id, payload);
  if (action === 'retryRefund') return platformBillingApi.refunds.retry(id, payload);
  if (action === 'couponRules') {
    const coupon = id ? await platformBillingApi.coupons.update(id, payload) : await platformBillingApi.coupons.create(payload);
    return { data: coupon };
  }
  if (action === 'assignPlans') return platformBillingApi.coupons.restrictPlans(id, parseCsv(payload.plan_uuids));
  if (action === 'assignTenants') return platformBillingApi.coupons.restrictTenants(id, parseCsv(payload.tenant_uuids));
  if (action === 'disableCoupon') return platformBillingApi.coupons.deactivate(id);
  return { data: null };
}

function exportFor(kind: BillingKind) {
  if (kind === 'invoices') return platformBillingApi.invoices.export();
  if (kind === 'payments') return platformBillingApi.payments.export();
  if (kind === 'refunds') return platformBillingApi.refunds.export();
  return platformBillingApi.coupons.export();
}

function fieldsForModal(modal: BillingModal): ModalField[] {
  if (modal === 'sendInvoice') return [{ name: 'to', label: 'Recipients' }, { name: 'cc', label: 'CC' }, { name: 'message', label: 'Message' }, { name: 'attach_pdf', label: 'Attach PDF', type: 'checkbox' }];
  if (modal === 'recordPayment') return [{ name: 'gateway', label: 'Gateway' }, { name: 'gateway_payment_id', label: 'Gateway Payment ID' }, { name: 'payment_method', label: 'Method' }, { name: 'amount', label: 'Amount', type: 'number' }, { name: 'currency', label: 'Currency' }, { name: 'payment_status', label: 'Status', type: 'select', options: ['success', 'failed', 'pending'] }, { name: 'paid_at', label: 'Paid At', type: 'datetime-local' }, { name: 'notes', label: 'Notes' }];
  if (modal === 'retryPayment') return [{ name: 'gateway', label: 'Gateway' }, { name: 'amount', label: 'Amount', type: 'number' }, { name: 'reason', label: 'Reason' }];
  if (modal === 'refundPayment') return [{ name: 'amount', label: 'Refund Amount', type: 'number' }, { name: 'currency', label: 'Currency' }, { name: 'reason', label: 'Reason' }, { name: 'gateway', label: 'Gateway' }, { name: 'confirm_gateway_refund', label: 'Confirm gateway refund', type: 'checkbox' }];
  if (modal === 'retryRefund') return [{ name: 'gateway', label: 'Gateway' }, { name: 'reason', label: 'Retry Reason' }];
  if (modal === 'couponRules') return [{ name: 'code', label: 'Code' }, { name: 'name', label: 'Name' }, { name: 'discount_type', label: 'Discount Type', type: 'select', options: ['percent', 'fixed'] }, { name: 'discount_value', label: 'Discount Value', type: 'number' }, { name: 'starts_at', label: 'Starts At', type: 'datetime-local' }, { name: 'expires_at', label: 'Expires At', type: 'datetime-local' }, { name: 'max_redemptions', label: 'Max Redemptions', type: 'number' }, { name: 'minimum_invoice_amount', label: 'Minimum Invoice Amount', type: 'number' }, { name: 'per_tenant_limit', label: 'Per Tenant Limit', type: 'number' }, { name: 'first_payment_only', label: 'First Payment Only', type: 'checkbox' }, { name: 'status', label: 'Status', type: 'select', options: ['active', 'inactive'] }];
  if (modal === 'assignPlans') return [{ name: 'plan_uuids', label: 'Plan UUIDs', type: 'textarea' }];
  if (modal === 'assignTenants') return [{ name: 'tenant_uuids', label: 'Tenant UUIDs', type: 'textarea' }];
  return [];
}

function defaultPayload(modal: BillingModal, record?: BillingRecord | null): Record<string, string | boolean | number> {
  const now = new Date().toISOString().slice(0, 16);
  if (modal === 'sendInvoice') return { to: '', cc: '', message: 'Please find your invoice attached.', attach_pdf: true };
  if (modal === 'recordPayment') return { gateway: textOf(record, ['gateway'], 'razorpay'), gateway_payment_id: '', payment_method: 'card', amount: Number(record?.balance ?? record?.balance_amount ?? record?.amount ?? 0), currency: textOf(record, ['currency'], 'INR'), payment_status: 'success', paid_at: now, notes: '' };
  if (modal === 'retryPayment') return { gateway: textOf(record, ['gateway'], 'razorpay'), amount: Number(record?.amount ?? 0), reason: 'Retry failed payment' };
  if (modal === 'refundPayment') return { amount: Number(record?.amount ?? 0), currency: textOf(record, ['currency'], 'INR'), reason: '', gateway: textOf(record, ['gateway'], 'razorpay'), confirm_gateway_refund: false };
  if (modal === 'retryRefund') return { gateway: textOf(record, ['gateway'], 'razorpay'), reason: 'Retry failed refund' };
  if (modal === 'couponRules') return { code: textOf(record, ['code'], ''), name: textOf(record, ['name'], ''), discount_type: textOf(record, ['discount_type'], 'percent'), discount_value: Number(record?.discount_value ?? 0), starts_at: textOf(record, ['starts_at'], now), expires_at: textOf(record, ['expires_at'], ''), max_redemptions: Number(record?.max_redemptions ?? 100), minimum_invoice_amount: Number(record?.minimum_invoice_amount ?? 0), per_tenant_limit: Number(record?.per_tenant_limit ?? 1), first_payment_only: Boolean(record?.first_payment_only), status: textOf(record, ['status'], 'active') };
  if (modal === 'assignPlans') return { plan_uuids: '' };
  if (modal === 'assignTenants') return { tenant_uuids: '' };
  return {};
}

function titleFor(modal: BillingModal) {
  if (modal === 'sendInvoice') return 'Send Invoice';
  if (modal === 'recordPayment') return 'Record Payment';
  if (modal === 'retryPayment') return 'Retry Payment';
  if (modal === 'refundPayment') return 'Initiate Refund';
  if (modal === 'retryRefund') return 'Retry Refund';
  if (modal === 'couponRules') return 'Coupon Rule Builder';
  if (modal === 'assignPlans') return 'Assign Plans';
  if (modal === 'assignTenants') return 'Assign Tenants';
  return 'Billing Action';
}

function permissionFor(modal: BillingModal, kind: BillingKind) {
  if (modal === 'sendInvoice') return 'billing.invoice.send';
  if (modal === 'recordPayment' || modal === 'retryPayment') return 'billing.payment.create';
  if (modal === 'refundPayment' || modal === 'retryRefund') return 'billing.payment.refund';
  if (modal === 'couponRules' || modal === 'assignPlans' || modal === 'assignTenants') return 'coupon.edit';
  return billingMeta[kind].permission + '.view';
}
