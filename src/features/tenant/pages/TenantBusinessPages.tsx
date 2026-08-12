import { useState, type FormEvent, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, FileUp, Mail, MoreVertical, Plus, Save, Trash2 } from 'lucide-react';

import { tenantBusinessApi, type BusinessRecord } from '@/features/tenant/api/tenantBusinessApi';
import { tenantQueryKeys } from '@/features/tenant/api/tenantQueryKeys';
import { ApiError } from '@/lib/api/apiError';
import type { ApiQuery } from '@/lib/api/apiTypes';
import { DataTable, type DataTableColumn } from '@/shared/components/data-table';
import { AppDrawer } from '@/shared/components/drawer';
import { PageHeader, StatusBadge, Tabs } from '@/shared/components/layout';
import { AppModal } from '@/shared/components/modal';
import { Button, PermissionButton } from '@/shared/components/ui';
import { ConfirmDialog } from '@/shared/components/workflows';

const tenantKey = 'current';

type Action =
  | null
  | 'invoice'
  | 'lineItem'
  | 'taxDiscount'
  | 'sendInvoice'
  | 'pdfPreview'
  | 'recordPayment'
  | 'cancelInvoice'
  | 'paymentDetail'
  | 'voidPayment'
  | 'receiptUpload'
  | 'expense'
  | 'expenseItem'
  | 'approveExpense'
  | 'rejectExpense'
  | 'bankAccount'
  | 'primaryBank'
  | 'uploadDocument'
  | 'previewFile'
  | 'attachExisting'
  | 'replaceFile'
  | 'folderMove'
  | 'composer'
  | 'retryCommunication'
  | 'template'
  | 'testTemplate'
  | 'reportFilters'
  | 'reportColumns'
  | 'reportChart'
  | 'reportExport'
  | 'saveReport'
  | 'reportDrill'
  | 'setting'
  | 'logoUpload'
  | 'lookupReorder'
  | 'deleteLookup'
  | 'connectIntegration'
  | 'rotateCredential'
  | 'disconnectIntegration'
  | 'fieldMapping'
  | 'backup'
  | 'restore'
  | 'securityPolicy'
  | 'auditCompare'
  | 'auditExport';

export function TenantFinanceInvoicesPage() {
  return <FinanceModule defaultTab="invoices" />;
}

export function TenantFinancePaymentsPage() {
  return <FinanceModule defaultTab="payments" />;
}

export function TenantFinanceExpensesPage() {
  return <FinanceModule defaultTab="expenses" />;
}

export function TenantFinanceBankAccountsPage() {
  return <FinanceModule defaultTab="bank-accounts" />;
}

export function TenantDocumentsPage() {
  const [tab, setTab] = useState('all');
  const [selected, setSelected] = useState<BusinessRecord | null>(null);
  const [action, setAction] = useState<Action>(null);
  const files = usePaged(`documents-${tab}`, (query) => tenantBusinessApi.documents.files(documentQuery(tab, query)));
  const folders = useQuery({ queryKey: tenantQueryKeys.resource(tenantKey, 'document-folders'), queryFn: tenantBusinessApi.documents.folders });
  const rows = tab === 'folders' ? folders.data?.data.folders ?? [] : files.rows;
  return (
    <BusinessShell
      title="Documents"
      description="All documents, uploads, shared files, recent files, previews, folder placeholders, and attachment flows."
      tabs={documentTabs}
      activeTab={tab}
      onTabChange={setTab}
      actions={<><Button type="button" onClick={() => setAction('uploadDocument')}><FileUp size={16} aria-hidden />Upload</Button><Button type="button" variant="secondary" onClick={() => setAction('attachExisting')}>Attach Existing</Button></>}
    >
      <DataTable columns={[...columns(documentColumns(tab)), actionColumn((row) => <RowMenu items={documentActions(row, setSelected, setAction)} />)]} data={rows} getRowId={idOf} loading={files.isLoading} error={files.error} total={tab === 'folders' ? rows.length : files.total} page={files.page} perPage={25} searchValue={files.search} onSearchChange={files.setSearch} onPageChange={files.setPage} />
      <BusinessActionModal action={action} record={selected} context={{ documentTab: tab }} onClose={() => { setSelected(null); setAction(null); }} />
      <RecordDrawer open={action === 'previewFile'} title="File Preview" record={selected} onClose={() => setAction(null)} />
    </BusinessShell>
  );
}

export function TenantReportsPage() {
  const [tab, setTab] = useState('dashboard');
  const [selected, setSelected] = useState<BusinessRecord | null>(null);
  const [action, setAction] = useState<Action>(null);
  const dashboard = useQuery({ queryKey: tenantQueryKeys.resource(tenantKey, 'reports-dashboard'), queryFn: tenantBusinessApi.reports.dashboard });
  const report = useQuery({ queryKey: tenantQueryKeys.report(tenantKey, tab, {}), queryFn: () => tenantBusinessApi.reports.report(tab), enabled: tab !== 'dashboard' && tab !== 'custom' });
  const custom = useQuery({ queryKey: tenantQueryKeys.resource(tenantKey, 'custom-reports'), queryFn: tenantBusinessApi.reports.custom, enabled: tab === 'custom' });
  const rows = tab === 'dashboard' ? asRows(dashboard.data?.data.dashboard?.available_reports) : tab === 'custom' ? asRows(custom.data?.data.custom_reports) : asRows(report.data?.data.rows);
  return (
    <BusinessShell title="Reports" description="CRM, HR, payroll, renewal, finance, project, task, support, and custom reports." tabs={reportTabs} activeTab={tab} onTabChange={setTab} actions={<ReportActions tab={tab} onAction={setAction} />}>
      {tab === 'dashboard' ? <DashboardBlocks dashboard={dashboard.data?.data.dashboard ?? {}} loading={dashboard.isLoading} /> : null}
      {tab !== 'dashboard' ? <DataTable columns={[...columns(visibleKeys(rows[0])), actionColumn((row) => <RowMenu items={[['Drill down', () => { setSelected(row); setAction('reportDrill'); }]]} />)]} data={rows} getRowId={idOf} loading={report.isLoading || custom.isLoading} total={rows.length} /> : null}
      <BusinessActionModal action={action} context={{ reportCode: tab }} record={selected} onClose={() => { setSelected(null); setAction(null); }} />
      <RecordDrawer open={action === 'reportDrill'} title="Report Drill Down" record={selected} onClose={() => setAction(null)} />
    </BusinessShell>
  );
}

export function TenantSettingsPage() {
  const [tab, setTab] = useState('general');
  const [selected, setSelected] = useState<BusinessRecord | null>(null);
  const [action, setAction] = useState<Action>(null);
  const group = useQuery({ queryKey: tenantQueryKeys.resource(tenantKey, `settings-${tab}`), queryFn: () => tenantBusinessApi.settings.group(tab), enabled: settingsGroups.includes(tab) });
  const lookups = useQuery({ queryKey: tenantQueryKeys.resource(tenantKey, 'settings-lookups'), queryFn: tenantBusinessApi.settings.lookups, enabled: tab === 'lookups' });
  const templates = usePaged('notification-templates', tenantBusinessApi.settings.templates, tab === 'templates');
  const backups = usePaged('backup-runs', tenantBusinessApi.settings.backups, tab === 'backups');
  const integrations = usePaged('tenant-integrations-settings', tenantBusinessApi.integrations.list, tab === 'integrations');
  const rows = tab === 'lookups' ? lookups.data?.data.lookups ?? [] : tab === 'templates' ? templates.rows : tab === 'backups' ? backups.rows : tab === 'integrations' ? integrations.rows : asRows(group.data?.data.settings);
  return (
    <BusinessShell title="Settings" description="General, company, branding, localization, offices, HR, CRM lookups, communication, security, integrations, storage, and backup settings." tabs={settingsTabs} activeTab={tab} onTabChange={setTab} actions={<SettingsActions tab={tab} onAction={setAction} />}>
      <DataTable columns={[...columns(settingsColumns(tab, rows[0])), actionColumn((row) => <RowMenu items={settingsActions(row, tab, setSelected, setAction)} />)]} data={rows} getRowId={idOf} loading={group.isLoading || lookups.isLoading || templates.isLoading || backups.isLoading || integrations.isLoading} total={rows.length} />
      <BusinessActionModal action={action} context={{ settingsGroup: tab }} record={selected} onClose={() => { setSelected(null); setAction(null); }} />
    </BusinessShell>
  );
}

export function TenantNotificationsCommunicationPage() {
  const [tab, setTab] = useState('notifications');
  const [selected, setSelected] = useState<BusinessRecord | null>(null);
  const [action, setAction] = useState<Action>(null);
  const logs = usePaged('communication-logs', tenantBusinessApi.communication.logs, tab === 'logs');
  const templates = usePaged('notification-templates-communication', tenantBusinessApi.settings.templates, tab === 'templates');
  return (
    <BusinessShell title="Notifications & Communication" description="Notifications, communication logs, queues, templates, retry, preview, and test-send." tabs={communicationTabs} activeTab={tab} onTabChange={setTab} actions={<Button type="button" onClick={() => setAction(tab === 'templates' ? 'template' : 'composer')}><Mail size={16} aria-hidden />Compose</Button>}>
      {tab === 'notifications' ? <NotificationCenterShortcut /> : null}
      {tab === 'logs' || tab === 'queues' ? <DataTable columns={[...columns(['channel', 'direction', 'subject', 'status', 'sent_at', 'created_at']), actionColumn((row) => <RowMenu items={[['Retry', () => { setSelected(row); setAction('retryCommunication'); }], ['Preview', () => { setSelected(row); setAction('reportDrill'); }]]} />)]} data={logs.rows} getRowId={idOf} loading={logs.isLoading} error={logs.error} total={logs.total} page={logs.page} perPage={25} searchValue={logs.search} onSearchChange={logs.setSearch} onPageChange={logs.setPage} /> : null}
      {tab === 'templates' ? <DataTable columns={[...columns(['code', 'channel', 'subject', 'status', 'updated_at']), actionColumn((row) => <RowMenu items={[['Edit', () => { setSelected(row); setAction('template'); }], ['Test send', () => { setSelected(row); setAction('testTemplate'); }], ['Preview', () => { setSelected(row); setAction('reportDrill'); }]]} />)]} data={templates.rows} getRowId={idOf} loading={templates.isLoading} total={templates.total} /> : null}
      <BusinessActionModal action={action} record={selected} context={{ communicationTab: tab }} onClose={() => { setSelected(null); setAction(null); }} />
      <RecordDrawer open={action === 'reportDrill'} title="Communication Detail" record={selected} onClose={() => setAction(null)} />
    </BusinessShell>
  );
}

export function TenantIntegrationsPage() {
  const [tab, setTab] = useState('providers');
  const [selected, setSelected] = useState<BusinessRecord | null>(null);
  const [action, setAction] = useState<Action>(null);
  const providers = usePaged('integration-providers', tenantBusinessApi.integrations.providers, tab === 'providers');
  const integrations = usePaged('tenant-integrations', tenantBusinessApi.integrations.list, tab === 'integrations');
  const webhooks = usePaged('integration-webhooks', tenantBusinessApi.integrations.webhooks, tab === 'webhooks');
  const sync = usePaged('integration-sync-jobs', tenantBusinessApi.integrations.syncJobs, tab === 'sync');
  const rows = tab === 'providers' ? providers.rows : tab === 'integrations' ? integrations.rows : tab === 'webhooks' ? webhooks.rows : sync.rows;
  return (
    <BusinessShell title="Integrations" description="Provider catalog, connected integrations, credentials, webhooks, sync jobs, field mappings, and rate limits." tabs={integrationTabs} activeTab={tab} onTabChange={setTab} actions={<Button type="button" onClick={() => setAction('connectIntegration')}><Plus size={16} aria-hidden />Connect</Button>}>
      <DataTable columns={[...columns(integrationColumns(tab)), actionColumn((row) => <RowMenu items={integrationActions(row, tab, setSelected, setAction)} />)]} data={rows} getRowId={idOf} loading={providers.isLoading || integrations.isLoading || webhooks.isLoading || sync.isLoading} error={providers.error || integrations.error || webhooks.error || sync.error} total={rows.length} />
      <BusinessActionModal action={action} record={selected} context={{ integrationTab: tab }} onClose={() => { setSelected(null); setAction(null); }} />
      <MappingDrawer open={action === 'fieldMapping'} integration={selected} onClose={() => setAction(null)} />
    </BusinessShell>
  );
}

export function TenantAuditPage() {
  const [tab, setTab] = useState('activity-logs');
  const [selected, setSelected] = useState<BusinessRecord | null>(null);
  const [action, setAction] = useState<Action>(null);
  const logs = usePaged(`audit-${tab}`, (query) => tenantBusinessApi.audit.list(tab, query));
  return (
    <BusinessShell title="Audit Logs" description="Activity, login history, system/API logs, data changes, compare drawer, and exports." tabs={auditTabs} activeTab={tab} onTabChange={setTab} actions={<Button type="button" onClick={() => setAction('auditExport')}><Download size={16} aria-hidden />Export</Button>}>
      <DataTable columns={[...columns(auditColumns(tab)), actionColumn((row) => <RowMenu items={[['Compare', () => { setSelected(row); setAction('auditCompare'); }], ['Detail', () => { setSelected(row); setAction('reportDrill'); }]]} />)]} data={logs.rows} getRowId={idOf} loading={logs.isLoading} error={logs.error} total={logs.total} page={logs.page} perPage={25} searchValue={logs.search} onSearchChange={logs.setSearch} onPageChange={logs.setPage} />
      <BusinessActionModal action={action} record={selected} context={{ auditTab: tab }} onClose={() => { setSelected(null); setAction(null); }} />
      <AuditCompareDrawer open={action === 'auditCompare'} activity={selected} onClose={() => setAction(null)} />
      <RecordDrawer open={action === 'reportDrill'} title="Audit Detail" record={selected} onClose={() => setAction(null)} />
    </BusinessShell>
  );
}

function FinanceModule({ defaultTab }: { defaultTab: string }) {
  const [tab, setTab] = useState(defaultTab);
  const [selected, setSelected] = useState<BusinessRecord | null>(null);
  const [action, setAction] = useState<Action>(null);
  const dashboard = useQuery({ queryKey: tenantQueryKeys.resource(tenantKey, 'finance-dashboard'), queryFn: tenantBusinessApi.finance.dashboard, enabled: tab === 'dashboard' });
  const invoices = usePaged('invoices', tenantBusinessApi.finance.invoices.list, tab === 'invoices');
  const payments = usePaged('payments', tenantBusinessApi.finance.payments.list, tab === 'payments');
  const expenses = usePaged('expenses', tenantBusinessApi.finance.expenses.list, tab === 'expenses');
  const banks = usePaged('bank-accounts', tenantBusinessApi.finance.bankAccounts.list, tab === 'bank-accounts');
  const rows = tab === 'invoices' ? invoices.rows : tab === 'payments' ? payments.rows : tab === 'expenses' ? expenses.rows : tab === 'bank-accounts' ? banks.rows : [];
  return (
    <BusinessShell title="Finance" description="Invoices, payments, expenses, bank accounts, exports, document previews, and approval flows." tabs={financeTabs} activeTab={tab} onTabChange={setTab} actions={<FinanceActions tab={tab} onAction={setAction} />}>
      {tab === 'dashboard' ? <DashboardBlocks dashboard={dashboard.data?.data.dashboard ?? {}} loading={dashboard.isLoading} /> : null}
      {tab !== 'dashboard' ? (
        <DataTable columns={[...columns(financeColumns(tab)), actionColumn((row) => <RowMenu items={financeRowActions(row, tab, setSelected, setAction)} />)]} data={rows} getRowId={idOf} loading={invoices.isLoading || payments.isLoading || expenses.isLoading || banks.isLoading} error={invoices.error || payments.error || expenses.error || banks.error} total={rows.length} />
      ) : null}
      <BusinessActionModal action={action} context={{ financeTab: tab }} record={selected} onClose={() => { setSelected(null); setAction(null); }} />
      <RecordDrawer open={['pdfPreview', 'paymentDetail', 'previewFile', 'reportDrill'].includes(String(action))} title={modalTitle(action)} record={selected} onClose={() => setAction(null)} />
    </BusinessShell>
  );
}

function BusinessShell({ title, description, tabs, activeTab, onTabChange, actions, children }: { title: string; description: string; tabs: { id: string; label: string }[]; activeTab: string; onTabChange: (tab: string) => void; actions?: ReactNode; children: ReactNode }) {
  return (
    <section className="enterprise-module-page">
      <PageHeader title={title} description={description} tabs={<Tabs tabs={tabs} activeId={activeTab} onChange={onTabChange} ariaLabel={`${title} sections`} />} actions={actions} />
      {children}
    </section>
  );
}

function DashboardBlocks({ dashboard, loading }: { dashboard: Record<string, unknown>; loading?: boolean }) {
  if (loading) return <div className="surface-state">Loading dashboard...</div>;
  const cards = Object.entries((dashboard.cards as Record<string, unknown>) ?? {});
  return (
    <>
      <div className="summary-grid">{cards.map(([key, value]) => <article className="summary-card" key={key}><span>{label(key)}</span><strong>{format(value)}</strong></article>)}</div>
      <div className="settings-grid">{Object.entries(dashboard).filter(([key]) => key !== 'cards').map(([key, value]) => <RecordList key={key} title={label(key)} rows={asRows(value)} />)}</div>
    </>
  );
}

function FinanceActions({ tab, onAction }: { tab: string; onAction: (action: Action) => void }) {
  if (tab === 'invoices') return <><PermissionButton guard="tenant" permission="finance.invoice.create" type="button" onClick={() => onAction('invoice')}><Plus size={16} aria-hidden />Invoice</PermissionButton><Button type="button" variant="secondary" onClick={() => onAction('reportExport')}><Download size={16} aria-hidden />Export</Button></>;
  if (tab === 'payments') return <><Button type="button" onClick={() => onAction('recordPayment')}><Plus size={16} aria-hidden />Payment</Button><Button type="button" variant="secondary" onClick={() => onAction('reportExport')}><Download size={16} aria-hidden />Export</Button></>;
  if (tab === 'expenses') return <><Button type="button" onClick={() => onAction('expense')}><Plus size={16} aria-hidden />Expense</Button><Button type="button" variant="secondary" onClick={() => onAction('reportExport')}><Download size={16} aria-hidden />Export</Button></>;
  if (tab === 'bank-accounts') return <Button type="button" onClick={() => onAction('bankAccount')}><Plus size={16} aria-hidden />Bank Account</Button>;
  return <Button type="button" variant="secondary" onClick={() => onAction('reportExport')}><Download size={16} aria-hidden />Export</Button>;
}

function ReportActions({ tab, onAction }: { tab: string; onAction: (action: Action) => void }) {
  if (tab === 'dashboard') return <Button type="button" onClick={() => onAction('saveReport')}><Save size={16} aria-hidden />Custom Report</Button>;
  return <><Button type="button" variant="secondary" onClick={() => onAction('reportFilters')}>Filters</Button><Button type="button" variant="secondary" onClick={() => onAction('reportColumns')}>Columns</Button><Button type="button" variant="secondary" onClick={() => onAction('reportChart')}>Chart</Button><Button type="button" onClick={() => onAction('reportExport')}><Download size={16} aria-hidden />Export</Button></>;
}

function SettingsActions({ tab, onAction }: { tab: string; onAction: (action: Action) => void }) {
  if (tab === 'branding') return <Button type="button" onClick={() => onAction('logoUpload')}>Logo/Favicon</Button>;
  if (tab === 'lookups') return <><Button type="button" onClick={() => onAction('lookupReorder')}>Reorder</Button><Button type="button" variant="secondary" onClick={() => onAction('deleteLookup')}><Trash2 size={16} aria-hidden />Delete</Button></>;
  if (tab === 'templates') return <Button type="button" onClick={() => onAction('template')}><Plus size={16} aria-hidden />Template</Button>;
  if (tab === 'backups') return <><Button type="button" onClick={() => onAction('backup')}>Run Backup</Button><Button type="button" variant="secondary" onClick={() => onAction('restore')}>Restore</Button></>;
  if (tab === 'security') return <Button type="button" onClick={() => onAction('securityPolicy')}>Security Policy</Button>;
  if (tab === 'integrations') return <Button type="button" onClick={() => onAction('connectIntegration')}>Connect</Button>;
  return <Button type="button" onClick={() => onAction('setting')}><Save size={16} aria-hidden />Save Group</Button>;
}

function BusinessActionModal({ action, record, context, onClose }: { action: Action; record?: BusinessRecord | null; context?: Record<string, unknown>; onClose: () => void }) {
  const mutation = useBusinessMutation(action, record, context, onClose);
  if (!action || ['pdfPreview', 'paymentDetail', 'previewFile', 'reportDrill', 'auditCompare', 'fieldMapping'].includes(action)) return null;
  if (placeholderActions.includes(action)) {
    return (
      <AppModal open={Boolean(action)} onClose={onClose} title={modalTitle(action)} guard="tenant" size="md" footer={<Button type="button" onClick={onClose}>Close</Button>}>
        <div className="empty-state">
          <h2>{modalTitle(action)}</h2>
          <p>{placeholderMessage(action)}</p>
        </div>
      </AppModal>
    );
  }
  const fields = fieldsFor(action);
  const confirm = confirmSpec(action, record);
  if (confirm) {
    return (
      <ConfirmDialog
        open={Boolean(action)}
        onClose={onClose}
        title={confirm.title}
        description={confirm.description(record)}
        confirmLabel={confirm.label}
        confirmTone={confirm.tone}
        typedConfirmation={confirm.typed}
        reasonRequired={confirm.reasonRequired}
        reasonLabel={confirm.reasonLabel}
        guard="tenant"
        loading={mutation.isPending}
        error={mutation.error ? errorMessage(mutation.error) : null}
        onConfirm={(payload) => mutation.mutate({ ...payload, ...confirm.extraBody?.(record, context) })}
      />
    );
  }
  return (
    <AppModal open={Boolean(action)} onClose={onClose} title={modalTitle(action)} guard="tenant" size="lg">
      {warningFor(action) ? <div className="surface-warning">{warningFor(action)}</div> : null}
      {mutation.error ? <div className="surface-error">{errorMessage(mutation.error)}</div> : null}
      <DynamicForm fields={fields} record={record} action={action} loading={mutation.isPending} onSubmit={(body) => mutation.mutate(body)} />
    </AppModal>
  );
}

function DynamicForm({ fields, record, action, loading, onSubmit }: { fields: string[]; record?: BusinessRecord | null; action: Action; loading?: boolean; onSubmit: (body: Record<string, unknown>) => void }) {
  const selectors = useSelectors();
  const [form, setForm] = useState<Record<string, string>>(() => initialForm(fields, record, action));
  const [file, setFile] = useState<File | null>(null);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (action === 'uploadDocument' && file) {
      const body = new FormData();
      body.append('file', file);
      body.append('visibility', form.visibility || 'tenant');
      onSubmit(Object.fromEntries(body.entries()));
      return;
    }
    onSubmit(normalizeForm(form, action));
  };
  return (
    <form className="settings-panel" onSubmit={submit}>
      <div className="form-grid">
        {action === 'uploadDocument' ? <label><span>File</span><input type="file" onChange={(event) => setFile(event.target.files?.[0] ?? null)} required /></label> : null}
        {fields.map((field) => (
          <label key={field}>
            <span>{label(field)}</span>
            {selectOptions(field, selectors) || staticOptions(field) ? (
              <select value={form[field] ?? ''} onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))}>
                <option value="">Select {label(field)}</option>
                {(selectOptions(field, selectors) ?? staticOptions(field))?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            ) : inputType(field) === 'textarea' ? (
              <textarea rows={4} value={form[field] ?? ''} onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))} />
            ) : inputType(field) === 'checkbox' ? (
              <select value={form[field] ?? ''} onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))}><option value="">No</option><option value="true">Yes</option><option value="false">No</option></select>
            ) : (
              <input type={inputType(field)} value={form[field] ?? ''} onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))} />
            )}
          </label>
        ))}
      </div>
      <div className="surface-footer">
        <Button type="submit" disabled={loading}>{loading ? 'Working...' : submitText(action)}</Button>
      </div>
    </form>
  );
}

function useBusinessMutation(action: Action, record: BusinessRecord | null | undefined, context: Record<string, unknown> | undefined, onClose: () => void) {
  const queryClient = useQueryClient();
  return useMutation<unknown, Error, Record<string, unknown>>({
    mutationFn: (body) => runAction(action, record, context, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tenantQueryKeys.all(tenantKey) });
      onClose();
    }
  });
}

function runAction(action: Action, record: BusinessRecord | null | undefined, context: Record<string, unknown> | undefined, body: Record<string, unknown>) {
  const id = String(record?.uuid ?? record?.id ?? body.id ?? '');
  if (action === 'invoice') return id ? tenantBusinessApi.finance.invoices.update(id, body) : tenantBusinessApi.finance.invoices.create(body);
  if (action === 'lineItem') return tenantBusinessApi.finance.invoices.addItem(id || String(body.invoice_uuid), body);
  if (action === 'taxDiscount') return tenantBusinessApi.finance.invoices.update(id, body);
  if (action === 'sendInvoice') return tenantBusinessApi.finance.invoices.send(id, body);
  if (action === 'recordPayment') return tenantBusinessApi.finance.payments.create({ invoice_uuid: record?.uuid, client_party_uuid: record?.client_party_uuid, ...body });
  if (action === 'cancelInvoice') return tenantBusinessApi.finance.invoices.cancel(id, body);
  if (action === 'voidPayment') return tenantBusinessApi.finance.payments.void(id, body);
  if (action === 'expense') return id ? tenantBusinessApi.finance.expenses.update(id, body) : tenantBusinessApi.finance.expenses.create(body);
  if (action === 'approveExpense') return tenantBusinessApi.finance.expenses.approve(id, body);
  if (action === 'rejectExpense') return tenantBusinessApi.finance.expenses.reject(id, body);
  if (action === 'bankAccount') return record?.id ? tenantBusinessApi.finance.bankAccounts.update(String(record.id), body) : tenantBusinessApi.finance.bankAccounts.create(body);
  if (action === 'primaryBank') return tenantBusinessApi.finance.bankAccounts.primary(String(record?.id ?? body.account_id), body);
  if (action === 'reportExport') {
    if (context?.reportCode) return tenantBusinessApi.reports.export(String(context.reportCode), body);
    if (context?.financeTab === 'payments') return tenantBusinessApi.finance.payments.export(body);
    if (context?.financeTab === 'expenses') return tenantBusinessApi.finance.expenses.export(body);
    return tenantBusinessApi.finance.invoices.export(body);
  }
  if (action === 'uploadDocument') {
    const form = new FormData();
    Object.entries(body).forEach(([key, value]) => form.append(key, value as string | Blob));
    return tenantBusinessApi.documents.upload(form);
  }
  if (action === 'composer') return tenantBusinessApi.communication.send(body);
  if (action === 'retryCommunication') return tenantBusinessApi.communication.retry(id);
  if (action === 'template') return id ? tenantBusinessApi.settings.updateTemplate(id, body) : tenantBusinessApi.settings.createTemplate(body);
  if (action === 'testTemplate') return tenantBusinessApi.settings.testTemplate(id, body);
  if (action === 'saveReport') return tenantBusinessApi.reports.saveCustom(body);
  if (action === 'setting') return tenantBusinessApi.settings.saveGroup(String(context?.settingsGroup ?? 'general'), { settings: body });
  if (action === 'lookupReorder') return tenantBusinessApi.settings.reorderLookups([]);
  if (action === 'deleteLookup') return tenantBusinessApi.settings.deleteLookup(id || String(body.lookup_uuid), body);
  if (action === 'connectIntegration') return tenantBusinessApi.integrations.connect({ provider_id: record?.id ?? record?.code, name: record?.name, ...body });
  if (action === 'rotateCredential') return tenantBusinessApi.integrations.rotate(id, { credentials: body });
  if (action === 'disconnectIntegration') return tenantBusinessApi.integrations.disconnect(id, body);
  if (action === 'backup') return tenantBusinessApi.settings.runBackup(body);
  if (action === 'restore') return tenantBusinessApi.settings.restoreBackup(body);
  if (action === 'auditExport') return tenantBusinessApi.audit.export(body);
  return Promise.resolve();
}

function usePaged(key: string, fn: (query?: ApiQuery) => Promise<{ data: BusinessRecord[]; total: number }>, enabled = true) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const query = useQuery({ queryKey: tenantQueryKeys.list(tenantKey, key, { page, search }), queryFn: () => fn({ page, per_page: 25, search }), enabled });
  return { rows: query.data?.data ?? [], total: query.data?.total ?? 0, isLoading: query.isLoading, error: query.error instanceof ApiError ? query.error.message : undefined, page, setPage, search, setSearch };
}

function useSelectors() {
  const query = useQuery({ queryKey: tenantQueryKeys.resource(tenantKey, 'business-selectors'), queryFn: tenantBusinessApi.selectors });
  const backups = useQuery({ queryKey: tenantQueryKeys.resource(tenantKey, 'business-selector-backups'), queryFn: () => tenantBusinessApi.settings.backups({ per_page: 100 }) });
  return { ...(query.data?.data ?? {}), backups: backups.data?.data ?? [] };
}

function documentQuery(tab: string, query?: ApiQuery): ApiQuery {
  if (tab === 'shared') return { ...query, filter: { visibility: 'tenant' } };
  return query ?? {};
}

function initialForm(fields: string[], record: BusinessRecord | null | undefined, action: Action) {
  return Object.fromEntries(fields.map((field) => {
    if (field === 'invoice_uuid' && action === 'recordPayment') return [field, stringValue(record?.uuid)];
    if (field === 'client_party_uuid') return [field, stringValue(record?.client_party_uuid)];
    if (field === 'provider_id' && action === 'connectIntegration') return [field, stringValue(record?.id ?? record?.code)];
    if (field === 'name' && action === 'connectIntegration') return [field, stringValue(record?.name)];
    return [field, stringValue(record?.[field])];
  }));
}

function selectOptions(field: string, selectors: Record<string, BusinessRecord[]>) {
  if (field.includes('client_party_uuid')) return optionRows(selectors.clients, ['display_name', 'email']);
  if (field.includes('vendor_party_uuid')) return optionRows(selectors.vendors, ['display_name', 'email']);
  if (field.includes('invoice_uuid')) return optionRows(selectors.invoices, ['invoice_number', 'client_name', 'balance_amount']);
  if (field === 'owner_uuid') return ownerOptions(selectors);
  if (field.includes('project_uuid')) return optionRows(selectors.projects, ['name', 'project_number']);
  if (field.includes('provider_id')) return optionRows(selectors.providers, ['name', 'category'], 'id');
  if (field.includes('user_uuid')) return optionRows(selectors.users, ['display_name', 'email']);
  if (field.includes('account_id')) return optionRows(selectors.accounts, ['bank_name', 'account_number_masked'], 'id');
  if (field.includes('backup_uuid')) return optionRows(selectors.backups, ['backup_type', 'status', 'started_at']);
  if (field === 'category_id' || field === 'status_id') return optionRows(selectors.lookups, ['name', 'group'], 'uuid');
  return null;
}

function staticOptions(field: string) {
  const values: Record<string, string[]> = {
    status: ['draft', 'sent', 'paid', 'pending', 'active', 'inactive'],
    currency: ['INR', 'USD', 'EUR', 'GBP'],
    method: ['cash', 'bank_transfer', 'card', 'upi', 'cheque'],
    visibility: ['tenant', 'private', 'public'],
    owner_type: ['tenant', 'client', 'vendor', 'staff'],
    channel: ['email', 'sms', 'whatsapp', 'in_app'],
    format: ['csv', 'xlsx', 'pdf'],
    backup_type: ['manual', 'full', 'files', 'database']
  };
  return values[field]?.map((value) => ({ value, label: label(value) })) ?? null;
}

function optionRows(rows: BusinessRecord[] = [], labels: string[], valueKey = 'uuid') {
  return rows.map((row) => ({ value: String(row[valueKey] ?? row.uuid ?? row.id), label: labels.map((key) => row[key]).filter(Boolean).map(String).join(' - ') || recordTitle(row) }));
}

function ownerOptions(selectors: Record<string, BusinessRecord[]>) {
  return [
    { value: '', label: 'Tenant company account' },
    ...optionRows(selectors.clients, ['display_name', 'email']),
    ...optionRows(selectors.vendors, ['display_name', 'email']),
    ...optionRows(selectors.staff, ['display_name', 'employee_code'])
  ];
}

function MappingDrawer({ open, integration, onClose }: { open: boolean; integration?: BusinessRecord | null; onClose: () => void }) {
  const [rows, setRows] = useState<BusinessRecord[]>([]);
  const id = String(integration?.uuid ?? '');
  const query = useQuery({ queryKey: tenantQueryKeys.related(tenantKey, 'integrations', id, 'mappings'), queryFn: () => tenantBusinessApi.integrations.mappings(id), enabled: open && Boolean(id) });
  const mutation = useMutation({ mutationFn: () => tenantBusinessApi.integrations.saveMappings(id, rows), onSuccess: onClose });
  const mappings = rows.length ? rows : query.data?.data.mappings ?? [];
  return (
    <AppDrawer open={open} onClose={onClose} title="Field Mapping Editor" guard="tenant" size="lg">
      <div className="settings-panel">
        <div className="surface-actions"><Button type="button" onClick={() => setRows([...mappings, { entity_type: 'contact', local_field: '', external_field: '' }])}><Plus size={16} aria-hidden />Mapping</Button><Button type="button" onClick={() => mutation.mutate()} disabled={mutation.isPending}>Save</Button></div>
        <DataTable columns={columns(['entity_type', 'local_field', 'external_field'])} data={mappings} getRowId={idOf} total={mappings.length} loading={query.isLoading} />
      </div>
    </AppDrawer>
  );
}

function AuditCompareDrawer({ open, activity, onClose }: { open: boolean; activity?: BusinessRecord | null; onClose: () => void }) {
  const id = activity?.id;
  const query = useQuery({ queryKey: tenantQueryKeys.related(tenantKey, 'audit', String(id), 'compare'), queryFn: () => tenantBusinessApi.audit.compare(String(id)), enabled: open && Boolean(id) });
  const compare = query.data?.data.compare as Record<string, unknown> | undefined;
  return (
    <AppDrawer open={open} onClose={onClose} title="Audit Compare" guard="tenant" size="lg">
      <div className="settings-grid">
        <RecordList title="Changed Fields" rows={asRows(compare?.changed_fields)} />
        <RecordList title="Before" rows={objectRows(compare?.old_values)} />
        <RecordList title="After" rows={objectRows(compare?.new_values)} />
      </div>
    </AppDrawer>
  );
}

function NotificationCenterShortcut() {
  return <section className="settings-panel"><h2>Notification Center</h2><p className="surface-state">Use the header notification drawer for read/unread and detail actions. Communication logs and templates are available in the tabs here.</p></section>;
}

function RecordDrawer({ open, title, record, onClose }: { open: boolean; title: string; record?: BusinessRecord | null; onClose: () => void }) {
  return <AppDrawer open={open} title={title} onClose={onClose} guard="tenant" size="lg"><DetailGrid record={record ?? {}} /></AppDrawer>;
}

function RecordList({ title, rows }: { title: string; rows: BusinessRecord[] }) {
  return <article className="settings-card"><header><h3>{title}</h3></header>{rows.length ? <div className="detail-list">{rows.slice(0, 8).map((row) => <div key={idOf(row)}><strong>{recordTitle(row)}</strong><span>{recordSubtitle(row)}</span></div>)}</div> : <p className="surface-state">No records found.</p>}</article>;
}

function DetailGrid({ record }: { record: BusinessRecord }) {
  const entries = Object.entries(record).filter(([key, value]) => value !== null && value !== undefined && value !== '' && !['id', 'tenant_id', 'deleted_at', 'encrypted_value', 'account_number_encrypted', 'routing_number_encrypted'].includes(key));
  if (entries.length === 0) return <div className="empty-state">No details returned.</div>;
  return <dl className="detail-grid">{entries.map(([key, value]) => <div key={key}><dt>{label(key)}</dt><dd>{renderValue(value)}</dd></div>)}</dl>;
}

function RowMenu({ items }: { items: [string, () => void][] }) {
  return (
    <details className="row-actions-menu">
      <summary aria-label="Open actions"><MoreVertical size={16} aria-hidden /></summary>
      <div className="row-actions-menu__content">{items.map(([text, action]) => <button type="button" key={text} onClick={action}>{text}</button>)}</div>
    </details>
  );
}

function columns(keys: string[]): DataTableColumn<BusinessRecord>[] {
  return keys.map((key) => ({ id: key, header: label(key), accessor: (row) => primitive(row[key]), cell: (row) => key.includes('status') ? <StatusBadge tone={statusTone(row[key])}>{displayValue(row[key] ?? 'active')}</StatusBadge> : renderValue(row[key]) }));
}

function actionColumn(cell: (row: BusinessRecord) => ReactNode): DataTableColumn<BusinessRecord> {
  return { id: 'actions', header: '', enableHiding: false, cell };
}

function financeRowActions(row: BusinessRecord, tab: string, setSelected: (row: BusinessRecord) => void, setAction: (action: Action) => void): [string, () => void][] {
  const open = (action: Action) => () => { setSelected(row); setAction(action); };
  if (tab === 'invoices') return [['View', open('pdfPreview')], ['Edit', open('invoice')], ['Line item', open('lineItem')], ['Tax/discount', open('taxDiscount')], ['Send invoice', open('sendInvoice')], ['Record payment', open('recordPayment')], ['Cancel', open('cancelInvoice')]];
  if (tab === 'payments') return [['Detail', open('paymentDetail')], ['Void', open('voidPayment')], ['Receipt upload', open('receiptUpload')]];
  if (tab === 'expenses') return [['View', open('reportDrill')], ['Edit', open('expense')], ['Items', open('expenseItem')], ['Approve', open('approveExpense')], ['Reject', open('rejectExpense')]];
  return [['Edit', open('bankAccount')], ['Set primary', open('primaryBank')]];
}

function documentActions(row: BusinessRecord, setSelected: (row: BusinessRecord) => void, setAction: (action: Action) => void): [string, () => void][] {
  const open = (action: Action) => () => { setSelected(row); setAction(action); };
  return [['Preview', open('previewFile')], ['Attach existing', open('attachExisting')], ['Replace', open('replaceFile')], ['Move/copy', open('folderMove')]];
}

function settingsActions(row: BusinessRecord, tab: string, setSelected: (row: BusinessRecord) => void, setAction: (action: Action) => void): [string, () => void][] {
  const open = (action: Action) => () => { setSelected(row); setAction(action); };
  if (tab === 'lookups') return [['Reorder', open('lookupReorder')], ['Delete', open('deleteLookup')]];
  if (tab === 'templates') return [['Edit', open('template')], ['Test send', open('testTemplate')]];
  if (tab === 'backups') return [['Restore', open('restore')]];
  if (tab === 'integrations') return [['Rotate credentials', open('rotateCredential')], ['Field mappings', open('fieldMapping')]];
  return [['Edit', open('setting')]];
}

function integrationActions(row: BusinessRecord, tab: string, setSelected: (row: BusinessRecord) => void, setAction: (action: Action) => void): [string, () => void][] {
  const open = (action: Action) => () => { setSelected(row); setAction(action); };
  if (tab === 'providers') return [['Connect', open('connectIntegration')]];
  if (tab === 'integrations') return [['Rotate credentials', open('rotateCredential')], ['Field mappings', open('fieldMapping')], ['Rate limits', open('reportDrill')], ['Disconnect', open('disconnectIntegration')]];
  if (tab === 'sync') return [['Retry', open('retryCommunication')], ['Exception payload', open('reportDrill')]];
  return [['Raw payload', open('reportDrill')]];
}

function fieldsFor(action: Action): string[] {
  switch (action) {
    case 'invoice': return ['client_party_uuid', 'project_uuid', 'invoice_number', 'invoice_date', 'due_date', 'currency', 'status'];
    case 'lineItem': return ['item_name', 'description', 'quantity', 'unit_price', 'tax_rate'];
    case 'taxDiscount': return ['discount_amount', 'tax_amount'];
    case 'sendInvoice': return ['to', 'subject', 'body'];
    case 'recordPayment': return ['invoice_uuid', 'client_party_uuid', 'payment_number', 'amount', 'currency', 'method', 'reference', 'paid_at'];
    case 'expense': return ['vendor_party_uuid', 'project_uuid', 'expense_number', 'category_id', 'amount', 'currency', 'expense_date', 'status_id'];
    case 'bankAccount': return ['owner_type', 'owner_uuid', 'bank_name', 'account_number', 'routing_number', 'ifsc_code', 'is_primary'];
    case 'uploadDocument': return ['visibility'];
    case 'composer': return ['to', 'subject', 'body', 'party_uuid'];
    case 'template': return ['code', 'channel', 'subject', 'body', 'status'];
    case 'connectIntegration': return ['provider_id', 'name', 'api_key', 'client_secret'];
    case 'rotateCredential': return ['api_key', 'client_secret', 'refresh_token'];
    case 'backup': return ['backup_type'];
    case 'restore': return ['backup_uuid', 'reason'];
    case 'reportExport':
    case 'auditExport': return ['format', 'date_from', 'date_to'];
    case 'saveReport': return ['name', 'module', 'columns', 'filters'];
    case 'setting': return ['name', 'value'];
    case 'lookupReorder': return ['remarks'];
    case 'deleteLookup': return ['lookup_uuid', 'reason'];
    case 'testTemplate': return ['to'];
    default: return ['remarks'];
  }
}

type ConfirmSpec = {
  title: string;
  label: string;
  tone?: 'primary' | 'danger';
  typed?: string;
  reasonRequired?: boolean;
  reasonLabel?: string;
  description: (record?: BusinessRecord | null) => ReactNode;
  extraBody?: (record?: BusinessRecord | null, context?: Record<string, unknown>) => Record<string, unknown>;
};

function confirmSpec(action: Action, record?: BusinessRecord | null): ConfirmSpec | null {
  if (action === 'restore' && !record) return null;
  if (action === 'deleteLookup' && !record) return null;
  const specs: Partial<Record<Exclude<Action, null>, ConfirmSpec>> = {
    cancelInvoice: {
      title: 'Cancel invoice?',
      label: 'Cancel Invoice',
      tone: 'danger',
      typed: 'CANCEL',
      reasonRequired: true,
      reasonLabel: 'Cancellation reason',
      description: (record) => <>Invoice <strong>{recordTitle(record)}</strong> will be cancelled and can affect receivables, payment collection, and report totals.</>
    },
    voidPayment: {
      title: 'Void payment?',
      label: 'Void Payment',
      tone: 'danger',
      typed: 'VOID',
      reasonRequired: true,
      reasonLabel: 'Void reason',
      description: (record) => <>Payment <strong>{recordTitle(record)}</strong> will be voided. Use this only after finance review.</>
    },
    approveExpense: {
      title: 'Approve expense?',
      label: 'Approve Expense',
      tone: 'primary',
      reasonRequired: true,
      description: (record) => <>Approve expense <strong>{recordTitle(record)}</strong> and update live finance data.</>
    },
    rejectExpense: {
      title: 'Reject expense?',
      label: 'Reject Expense',
      tone: 'danger',
      reasonRequired: true,
      description: (record) => <>Reject expense <strong>{recordTitle(record)}</strong>. The rejection reason will be sent with the request.</>
    },
    primaryBank: {
      title: 'Set primary bank account?',
      label: 'Set Primary',
      tone: 'primary',
      reasonRequired: true,
      description: (record) => <>Set <strong>{recordTitle(record)}</strong> as the primary account. Existing primary account for the owner will be replaced.</>
    },
    deleteLookup: {
      title: 'Delete lookup value?',
      label: 'Delete Lookup',
      tone: 'danger',
      typed: 'DELETE',
      reasonRequired: true,
      description: (record) => <>Delete lookup <strong>{recordTitle(record)}</strong>. The backend blocks deletion if records still use it.</>
    },
    disconnectIntegration: {
      title: 'Disconnect integration?',
      label: 'Disconnect',
      tone: 'danger',
      typed: 'DISCONNECT',
      reasonRequired: true,
      description: (record) => <>Disconnect <strong>{recordTitle(record)}</strong>. Sync jobs and webhooks can stop immediately.</>
    },
    restore: {
      title: 'Restore backup?',
      label: 'Request Restore',
      tone: 'danger',
      typed: 'RESTORE',
      reasonRequired: true,
      description: (record) => <>Request restore for <strong>{recordTitle(record)}</strong>. Restore requests enter the review queue before data changes.</>,
      extraBody: (record) => ({ backup_uuid: record?.uuid })
    },
    backup: {
      title: 'Run backup?',
      label: 'Queue Backup',
      tone: 'primary',
      reasonRequired: true,
      description: () => 'Queue a backup job. Large tenants may complete through the background worker.',
      extraBody: () => ({ backup_type: 'manual' })
    }
  };
  return action ? specs[action] ?? null : null;
}

function normalizeForm(form: Record<string, string>, action: Action): Record<string, unknown> {
  const body = Object.fromEntries(Object.entries(form).filter(([, value]) => value !== '').map(([key, value]) => [key, normalizeValue(key, value)]));
  if (action === 'connectIntegration' || action === 'rotateCredential') {
    const { api_key, client_secret, refresh_token, ...rest } = body;
    return { ...rest, credentials: Object.fromEntries(Object.entries({ api_key, client_secret, refresh_token }).filter(([, value]) => value)) };
  }
  if (action === 'setting' && typeof body.name === 'string') return { [body.name]: body.value ?? '' };
  return body;
}

function normalizeValue(key: string, value: string) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (['amount', 'quantity', 'unit_price', 'tax_rate', 'discount_amount', 'tax_amount'].includes(key)) return Number(value);
  if (['columns', 'filters'].includes(key)) return value.split(',').map((item) => item.trim()).filter(Boolean);
  return value;
}

function inputType(field: string) {
  if (['body', 'description', 'filters', 'remarks'].includes(field)) return 'textarea';
  if (field.includes('date') || field.endsWith('_at')) return field.endsWith('_at') ? 'datetime-local' : 'date';
  if (field.includes('amount') || field.includes('quantity') || field.includes('rate')) return 'number';
  if (field.includes('email') || field === 'to') return 'email';
  if (field.includes('secret') || field.includes('token') || field.includes('api_key') || field.includes('account_number')) return 'password';
  if (field.startsWith('is_')) return 'checkbox';
  return 'text';
}

function financeColumns(tab: string) {
  if (tab === 'invoices') return ['invoice_number', 'client_name', 'project_name', 'invoice_date', 'due_date', 'total_amount', 'balance_amount', 'status'];
  if (tab === 'payments') return ['payment_number', 'invoice_number', 'client_name', 'amount', 'method', 'reference', 'status', 'paid_at'];
  if (tab === 'expenses') return ['expense_number', 'vendor_name', 'project_name', 'expense_date', 'amount', 'category_name', 'status_name'];
  return ['owner_type', 'bank_name', 'account_number_masked', 'ifsc_code', 'is_primary', 'updated_at'];
}

function documentColumns(tab: string) {
  return tab === 'folders' ? ['name', 'folder_type', 'created_at'] : ['original_name', 'mime_type', 'size_label', 'visibility', 'created_at'];
}

function integrationColumns(tab: string) {
  if (tab === 'providers') return ['name', 'code', 'category', 'auth_type', 'status'];
  if (tab === 'integrations') return ['name', 'provider_name', 'category', 'status', 'connected_at'];
  if (tab === 'sync') return ['sync_type', 'direction', 'status', 'started_at', 'finished_at'];
  return ['event', 'status', 'response_code', 'received_at'];
}

function settingsColumns(tab: string, row?: BusinessRecord) {
  if (tab === 'lookups') return ['group', 'code', 'name', 'status', 'sort_order'];
  if (tab === 'templates') return ['code', 'channel', 'subject', 'status', 'updated_at'];
  if (tab === 'backups') return ['backup_type', 'status', 'started_at', 'finished_at'];
  if (tab === 'integrations') return ['name', 'provider_name', 'status', 'connected_at'];
  return visibleKeys(row);
}

function auditColumns(tab: string) {
  if (tab === 'login-history') return ['event', 'severity', 'ip_address', 'created_at'];
  if (tab === 'system-api-logs') return ['method', 'path', 'status_code', 'duration_ms', 'created_at'];
  return ['event', 'subject_type', 'description', 'ip_address', 'created_at'];
}

function visibleKeys(row?: BusinessRecord) {
  return Object.keys(row ?? {}).filter((key) => !['id', 'tenant_id', 'deleted_at', 'old_values', 'new_values', 'metadata', 'payload'].includes(key)).slice(0, 7);
}

function renderValue(value: unknown): ReactNode {
  if (value === null || value === undefined || value === '') return <span className="muted">Not set</span>;
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return format(value);
  if (Array.isArray(value)) return `${value.length} records`;
  if (typeof value === 'object') return recordTitle(value as BusinessRecord);
  return String(value);
}

function displayValue(value: unknown) {
  if (value === null || value === undefined || value === '') return 'Not set';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

function primitive(value: unknown) {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? value : '';
}

function asRows(value: unknown): BusinessRecord[] {
  if (Array.isArray(value)) return value as BusinessRecord[];
  if (value && typeof value === 'object') return [value as BusinessRecord];
  return [];
}

function objectRows(value: unknown): BusinessRecord[] {
  return value && typeof value === 'object' ? Object.entries(value as Record<string, unknown>).map(([name, val]) => ({ name, value: String(val ?? 'Not set') })) : [];
}

function idOf(row: BusinessRecord) {
  return String(row.uuid ?? row.id ?? row.code ?? row.name ?? row.original_name ?? Math.random());
}

function recordTitle(row?: BusinessRecord | null) {
  return String(row?.display_name ?? row?.client_name ?? row?.vendor_name ?? row?.name ?? row?.title ?? row?.invoice_number ?? row?.payment_number ?? row?.expense_number ?? row?.original_name ?? row?.code ?? 'Record');
}

function recordSubtitle(row?: BusinessRecord | null) {
  return [row?.status, row?.status_name, row?.email, row?.created_at, row?.updated_at].filter(Boolean).map(String).join(' - ') || 'Live database record';
}

function label(key: string) {
  return key.replace(/[-_]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function format(value: unknown) {
  if (typeof value === 'number') return Number.isInteger(value) ? value.toLocaleString() : value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return String(value ?? 0);
}

function statusTone(value: unknown): 'neutral' | 'success' | 'warning' | 'danger' | 'info' {
  const normalized = String(value ?? '').toLowerCase();
  if (['active', 'paid', 'approved', 'sent', 'completed', 'success'].includes(normalized)) return 'success';
  if (['draft', 'pending', 'queued', 'retry_queued'].includes(normalized)) return 'warning';
  if (['cancelled', 'void', 'rejected', 'failed', 'disconnected'].includes(normalized)) return 'danger';
  return 'neutral';
}

function stringValue(value: unknown) {
  return value === null || value === undefined ? '' : String(value);
}

function modalTitle(action: Action) {
  return label(String(action ?? 'Action'));
}

function submitText(action: Action) {
  if (['cancelInvoice', 'voidPayment', 'approveExpense', 'rejectExpense', 'primaryBank', 'deleteLookup', 'backup', 'restore', 'auditExport', 'reportExport'].includes(String(action))) return 'Confirm';
  return 'Save';
}

function warningFor(action: Action) {
  if (action === 'bankAccount') return 'Account numbers are stored encrypted and shown back only as masked preview.';
  if (action === 'primaryBank') return 'This will replace the current primary account for the same owner.';
  if (action === 'deleteLookup') return 'The API blocks deletion when this lookup is used by records.';
  if (action === 'restore') return 'Restore requests are queued for review before data is changed.';
  if (action === 'securityPolicy') return 'Security policy changes apply to tenant users after saving.';
  if (action === 'reportExport' || action === 'auditExport') return 'Export runs are queued when the backend needs background processing.';
  return '';
}

const placeholderActions: Action[] = [
  'expenseItem',
  'receiptUpload',
  'attachExisting',
  'replaceFile',
  'folderMove',
  'reportFilters',
  'reportColumns',
  'reportChart',
  'logoUpload',
  'securityPolicy'
];

function placeholderMessage(action: Action) {
  if (action === 'expenseItem') return 'Expense item editing needs dedicated expense item update/delete endpoints. Existing expense items are still displayed from live data.';
  if (action === 'receiptUpload') return 'Receipt upload should be handled through the Documents center because tenant_payments has no receipt file column.';
  if (action === 'attachExisting') return 'Attach existing requires a target record selector. The document upload/list/download APIs are connected.';
  if (action === 'replaceFile') return 'File replacement needs a replacement history table or explicit replace API. Upload a new file from Documents for now.';
  if (action === 'folderMove') return 'Folder move/copy is ready in UI structure, but the backend only supports folder creation and file attach.';
  if (action === 'reportFilters') return 'Report filters are planned for saved custom reports. Current report tabs load live database summaries.';
  if (action === 'reportColumns') return 'Column selection is available at table level; saved report columns need custom report storage.';
  if (action === 'reportChart') return 'Chart type selection needs a persisted custom report definition. Current reports render tabular live data.';
  if (action === 'logoUpload') return 'Logo/favicon crop needs a branding file relation in tenant settings. Branding settings remain editable.';
  if (action === 'securityPolicy') return 'Security policy confirmation is shown here, but enforcement needs the tenant security policy service.';
  return 'This action is wired as a clear implementation placeholder because the backing API/table is not available yet.';
}

function errorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Request failed.';
}

const financeTabs = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'invoices', label: 'Invoices' },
  { id: 'payments', label: 'Payments' },
  { id: 'expenses', label: 'Expenses' },
  { id: 'bank-accounts', label: 'Bank Accounts' }
];

const documentTabs = [
  { id: 'all', label: 'All Documents' },
  { id: 'shared', label: 'Shared Files' },
  { id: 'recent', label: 'Recent Files' },
  { id: 'folders', label: 'Folders' }
];

const reportTabs = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'crm-summary', label: 'CRM' },
  { id: 'hr-summary', label: 'HR' },
  { id: 'payroll-summary', label: 'Payroll' },
  { id: 'renewal-summary', label: 'Renewals' },
  { id: 'finance-summary', label: 'Finance' },
  { id: 'project-summary', label: 'Projects' },
  { id: 'task-summary', label: 'Tasks' },
  { id: 'support-summary', label: 'Support' },
  { id: 'custom', label: 'Custom' }
];

const communicationTabs = [
  { id: 'notifications', label: 'Notifications' },
  { id: 'logs', label: 'Logs' },
  { id: 'queues', label: 'Queues' },
  { id: 'templates', label: 'Templates' }
];

const settingsGroups = ['general', 'company', 'branding', 'localization', 'communication', 'security', 'storage', 'hr', 'crm'];
const settingsTabs = [
  ...settingsGroups.map((id) => ({ id, label: label(id) })),
  { id: 'lookups', label: 'Lookups' },
  { id: 'templates', label: 'Templates' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'backups', label: 'Backups' }
];

const integrationTabs = [
  { id: 'providers', label: 'Providers' },
  { id: 'integrations', label: 'Tenant Integrations' },
  { id: 'webhooks', label: 'Webhooks' },
  { id: 'sync', label: 'Sync Jobs' }
];

const auditTabs = [
  { id: 'activity-logs', label: 'Activity' },
  { id: 'login-history', label: 'Login History' },
  { id: 'system-api-logs', label: 'System/API Logs' },
  { id: 'data-changes', label: 'Data Changes' }
];
