import { useEffect, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  Check,
  CheckCircle2,
  Cloud,
  Copy,
  DatabaseBackup,
  Download,
  FileUp,
  Globe2,
  GripVertical,
  KeyRound,
  LockKeyhole,
  Mail,
  Palette,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  Upload
} from 'lucide-react';

import { tenantBusinessApi, type BusinessRecord } from '@/features/tenant/api/tenantBusinessApi';
import { tenantQueryKeys } from '@/features/tenant/api/tenantQueryKeys';
import { ApiError } from '@/lib/api/apiError';
import type { ApiQuery } from '@/lib/api/apiTypes';
import { DataTable, RowActionMenu, type DataTableColumn } from '@/shared/components/data-table';
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
  | 'sendSms'
  | 'sendWhatsApp'
  | 'sendPush'
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
  const lookups = useQuery({ queryKey: tenantQueryKeys.resource(tenantKey, 'settings-lookups'), queryFn: tenantBusinessApi.settings.lookups, enabled: tab === 'crm' });
  const templates = usePaged('notification-templates', tenantBusinessApi.settings.templates, tab === 'communication');
  const backups = usePaged('backup-runs', tenantBusinessApi.settings.backups, tab === 'storage');
  const integrations = usePaged('tenant-integrations-settings', tenantBusinessApi.integrations.list, tab === 'integrations');
  const providers = usePaged('integration-providers-settings', tenantBusinessApi.integrations.providers, tab === 'integrations');
  const webhooks = usePaged('integration-webhooks-settings', tenantBusinessApi.integrations.webhooks, tab === 'integrations');
  const loginHistory = usePaged('settings-login-history', (query) => tenantBusinessApi.audit.list('login-history', query), tab === 'security');
  const resourceError = group.error || lookups.error || templates.error || backups.error || integrations.error || providers.error || webhooks.error || loginHistory.error;
  return (
    <section className="enterprise-module-page tenant-settings-page">
      <PageHeader
        title="Tenant Settings"
        description="Manage your organization's business preferences, branding, security, storage, communication, and integrations."
        breadcrumbs={<div className="layout-breadcrumbs">Dashboard / Settings</div>}
        meta={<SettingsHealthStrip />}
      />
      <div className="tenant-settings-layout">
        <nav className="tenant-settings-navigation" aria-label="Tenant settings navigation">
          <div className="tenant-settings-navigation__heading">Workspace settings</div>
          {settingsTabs.map((item) => {
            const Icon = item.icon;
            return (
              <button type="button" key={item.id} className={tab === item.id ? 'tenant-settings-navigation__item is-active' : 'tenant-settings-navigation__item'} aria-current={tab === item.id ? 'page' : undefined} onClick={() => setTab(item.id)}>
                <Icon size={16} aria-hidden />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <main className="tenant-settings-content">
          {resourceError ? <div className="surface-error">{errorMessage(resourceError)}</div> : null}
          {tab === 'integrations' ? (
            <TenantSettingsIntegrationsPanel rows={integrations.rows} providers={providers.rows} webhooks={webhooks.rows} loading={integrations.isLoading || providers.isLoading || webhooks.isLoading} onAction={setAction} onSelect={setSelected} />
          ) : (
            <TenantSettingsGroupPanel
              group={tab}
              rows={asRows(group.data?.data.settings)}
              loading={group.isLoading}
              error={group.isError ? errorMessage(group.error) : ''}
              lookups={lookups.data?.data.lookups ?? []}
              templates={templates.rows}
              backups={backups.rows}
              loginHistory={loginHistory.rows}
              relatedLoading={lookups.isLoading || templates.isLoading || backups.isLoading || loginHistory.isLoading}
              onAction={setAction}
              onSelect={setSelected}
            />
          )}
        </main>
      </div>
      <BusinessActionModal action={action} context={{ settingsGroup: tab }} record={selected} onClose={() => { setSelected(null); setAction(null); }} />
    </section>
  );
}

function TenantSettingsGroupPanel({ group, rows, loading, error, lookups = [], templates = [], backups = [], loginHistory = [], relatedLoading, onAction, onSelect }: { group: string; rows: BusinessRecord[]; loading?: boolean; error?: string; lookups?: BusinessRecord[]; templates?: BusinessRecord[]; backups?: BusinessRecord[]; loginHistory?: BusinessRecord[]; relatedLoading?: boolean; onAction: (action: Action) => void; onSelect: (row: BusinessRecord) => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Record<string, string>>({});
  const [savedForm, setSavedForm] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const mutation = useMutation({
    mutationFn: () => tenantBusinessApi.settings.saveGroup(group, { settings: form }),
    onSuccess: async () => {
      setSavedForm(form);
      await queryClient.invalidateQueries({ queryKey: tenantQueryKeys.resource(tenantKey, `settings-${group}`) });
    }
  });
  useEffect(() => {
    const values = Object.fromEntries(rows.map((row) => [String(row.key ?? ''), stringValue(row.value_display ?? row.value)]).filter(([key]) => key));
    const initial = { ...emptySettingsFor(group), ...values };
    setForm(initial);
    setSavedForm(initial);
    setCopied(false);
  }, [group, rows]);
  const dirty = JSON.stringify(form) !== JSON.stringify(savedForm);
  const slug = form.workspace_slug || form.slug || '';
  if (loading) return <div className="surface-state">Loading {label(group).toLowerCase()} settings...</div>;
  if (error) return <div className="surface-error">{error}</div>;
  return (
    <div className="tenant-settings-group">
      <div className="tenant-settings-group__header">
        <div>
          <span className="tenant-settings-kicker">/settings/{group}</span>
          <h2>{label(group)}</h2>
          <p>{settingsDescriptions[group]}</p>
        </div>
        {dirty ? <span className="tenant-settings-unsaved"><AlertTriangle size={15} aria-hidden />Unsaved changes</span> : <span className="tenant-settings-saved"><CheckCircle2 size={15} aria-hidden />All changes saved</span>}
      </div>

      {group === 'general' ? <GeneralHighlights form={form} slug={slug} copied={copied} onCopy={() => { void navigator.clipboard?.writeText(slug); setCopied(true); }} /> : null}
      {group === 'branding' ? <BrandPreview form={form} /> : null}
      {group === 'localization' ? <LocalizationPreview form={form} /> : null}
      {group === 'security' ? <SecurityCenter rows={loginHistory} loading={relatedLoading} form={form} onAction={onAction} /> : null}
      {group === 'storage' ? <StorageOverview form={form} backups={backups} loading={relatedLoading} onAction={onAction} onSelect={onSelect} /> : null}
      {group === 'crm' ? <CrmConfiguration lookups={lookups} loading={relatedLoading} onAction={onAction} onSelect={onSelect} /> : null}
      {group === 'communication' ? <CommunicationChannelTests onAction={onAction} /> : null}
      {group === 'communication' ? <CommunicationTemplates templates={templates} loading={relatedLoading} onAction={onAction} onSelect={onSelect} /> : null}

      <section className="settings-panel tenant-settings-card">
        <div className="tenant-settings-card__heading">
          <div>
            <h3>{settingsPrimaryCardTitle[group] ?? `${label(group)} Settings`}</h3>
            <p>{settingsPrimaryCardDescription[group] ?? 'Configure tenant-wide defaults for this group.'}</p>
          </div>
          <StatusBadge tone="info">{`API /settings/${group}`}</StatusBadge>
        </div>
        <div className="tenant-settings-form-grid">
          {(settingsFields[group] ?? []).map((field) => <TenantSettingField key={field} field={field} value={form[field] ?? ''} onChange={(value) => setForm((current) => ({ ...current, [field]: value }))} />)}
        </div>
        {mutation.error ? <div className="surface-error">{errorMessage(mutation.error)}</div> : null}
        {mutation.isSuccess && !dirty ? <div className="surface-state">Settings saved successfully.</div> : null}
        <div className="surface-footer tenant-settings-actions">
          <Button type="button" variant="secondary" disabled={!dirty || mutation.isPending} onClick={() => setForm(savedForm)}><RotateCcw size={16} aria-hidden />Discard</Button>
          <Button type="button" disabled={!dirty || mutation.isPending} onClick={() => mutation.mutate()}><Save size={16} aria-hidden />{mutation.isPending ? 'Saving...' : 'Save Changes'}</Button>
        </div>
      </section>

      {dirty ? <div className="tenant-settings-floating-warning" role="status"><span>You have unsaved changes.</span><Button type="button" size="sm" onClick={() => mutation.mutate()}>Save</Button><Button type="button" size="sm" variant="secondary" onClick={() => setForm(savedForm)}>Discard</Button></div> : null}
    </div>
  );
}

function TenantSettingField({ field, value, onChange }: { field: string; value: string; onChange: (value: string) => void }) {
  const options = settingsFieldOptions[field];
  const description = settingsFieldHints[field];
  if (settingsBooleanFields.has(field)) {
    return (
      <label className="settings-toggle tenant-settings-toggle">
        <span>{label(field)}</span>
        <input type="checkbox" checked={value === 'true'} onChange={(event) => onChange(String(event.target.checked))} />
        <strong>{value === 'true' ? 'Enabled' : 'Disabled'}</strong>
        {description ? <small>{description}</small> : null}
      </label>
    );
  }
  if (settingsTextAreaFields.has(field)) {
    return <label className="tenant-settings-field tenant-settings-field--wide"><span>{label(field)}</span><textarea value={value} onChange={(event) => onChange(event.target.value)} />{description ? <small>{description}</small> : null}</label>;
  }
  return (
    <label className="tenant-settings-field">
      <span>{label(field)}</span>
      {field.endsWith('_color') ? <input type="color" value={value || '#2563eb'} onChange={(event) => onChange(event.target.value)} /> : options ? <select value={value} onChange={(event) => onChange(event.target.value)}><option value="">Select {label(field).toLowerCase()}</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <input type={inputTypeForSetting(field)} value={value} onChange={(event) => onChange(event.target.value)} />}
      {description ? <small>{description}</small> : null}
    </label>
  );
}

function SettingsHealthStrip() {
  return (
    <div className="tenant-settings-health">
      <span><CheckCircle2 size={14} aria-hidden />Database backed</span>
      <span><ShieldCheck size={14} aria-hidden />Tenant scoped</span>
      <span><DatabaseBackup size={14} aria-hidden />API integrated</span>
    </div>
  );
}

function GeneralHighlights({ form, slug, copied, onCopy }: { form: Record<string, string>; slug: string; copied: boolean; onCopy: () => void }) {
  return (
    <div className="tenant-settings-summary-grid">
      <article className="tenant-settings-mini-card"><Building2 size={19} aria-hidden /><span>Workspace</span><strong>{form.workspace_name || 'Not configured'}</strong><p>{form.workspace_description || 'Workspace description has not been configured.'}</p></article>
      <article className="tenant-settings-mini-card"><Globe2 size={19} aria-hidden /><span>Workspace slug</span>{slug ? <div className="tenant-settings-code-row"><code>{slug}</code><Button type="button" size="sm" variant="secondary" onClick={onCopy}>{copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}{copied ? 'Copied' : 'Copy'}</Button></div> : <p>Workspace slug has not been configured.</p>}</article>
      <article className="tenant-settings-mini-card"><CheckCircle2 size={19} aria-hidden /><span>Status</span><div className="tenant-settings-badge-row"><StatusBadge tone={statusTone(form.status)}>{form.status || 'not_set'}</StatusBadge>{form.subscription_status ? <StatusBadge tone={statusTone(form.subscription_status)}>{form.subscription_status}</StatusBadge> : null}{form.billing_status ? <StatusBadge tone={statusTone(form.billing_status)}>{form.billing_status}</StatusBadge> : null}</div></article>
      <article className="tenant-settings-mini-card"><Upload size={19} aria-hidden /><span>Workspace logo</span><p>{form.workspace_logo || form.light_logo || 'No logo file is attached yet.'}</p><div className="tenant-settings-upload-actions"><Button type="button" size="sm" variant="secondary"><Upload size={14} aria-hidden />Upload</Button><Button type="button" size="sm" variant="ghost">Replace</Button><Button type="button" size="sm" variant="ghost">Remove</Button></div></article>
    </div>
  );
}

function BrandPreview({ form }: { form: Record<string, string> }) {
  const primary = form.primary_color || '#2563eb';
  const secondary = form.secondary_color || '#006d77';
  const accent = form.accent_color || '#16a34a';
  return (
    <section className="settings-panel tenant-settings-card">
      <div className="tenant-settings-card__heading"><div><h3>Theme Preview</h3><p>Preview how tenant colors affect buttons, badges, links, and cards.</p></div><StatusBadge tone={statusTone(form.dns_status)}>{form.dns_status || 'not_configured'}</StatusBadge></div>
      <div className="tenant-brand-preview" style={{ '--tenant-primary': primary, '--tenant-secondary': secondary, '--tenant-accent': accent } as CSSProperties}>
        <div><strong>{form.tenant_name || form.custom_domain || 'Tenant brand'}</strong><span>{form.custom_domain || 'No custom domain'}</span></div>
        <button type="button">Primary action</button>
        <a href="#branding">Preview link</a>
        <span>{form.dns_status || 'Pending'}</span>
      </div>
    </section>
  );
}

function LocalizationPreview({ form }: { form: Record<string, string> }) {
  return (
    <section className="settings-panel tenant-settings-card tenant-settings-preview-row">
      <CalendarClock size={20} aria-hidden />
      <div><h3>Regional Preview</h3><p>Configured date format is <strong>{form.date_format || 'not set'}</strong>, time uses <strong>{form.time_format || 'not set'}</strong>, and currency defaults to <strong>{form.currency || 'not set'}</strong>.</p></div>
    </section>
  );
}

function SecurityCenter({ rows, loading, form, onAction }: { rows: BusinessRecord[]; loading?: boolean; form: Record<string, string>; onAction: (action: Action) => void }) {
  const tableRows = rows.map((row) => [String(row.device ?? row.user_agent ?? row.event ?? 'Unknown device'), String(row.location ?? row.ip_address ?? '-'), String(row.created_at ?? row.time ?? '-'), String(row.status ?? row.severity ?? 'recorded')]);
  return (
    <section className="settings-panel tenant-settings-card">
      <div className="tenant-settings-card__heading"><div><h3>Admin Security Center</h3><p>Authentication, session, and tenant-wide security controls.</p></div><div className="table-actions"><Button type="button" size="sm" variant="danger" onClick={() => onAction('securityPolicy')}><LockKeyhole size={14} aria-hidden />Force Logout</Button><Button type="button" size="sm" variant="secondary" onClick={() => onAction('rotateCredential')}><RefreshCw size={14} aria-hidden />Regenerate Tokens</Button></div></div>
      <div className="tenant-settings-summary-grid tenant-settings-summary-grid--three">
        <article className="tenant-settings-mini-card"><ShieldCheck size={19} aria-hidden /><span>Two-factor authentication</span><strong>{form.two_factor_required === 'true' ? 'Required' : 'Optional'}</strong></article>
        <article className="tenant-settings-mini-card"><KeyRound size={19} aria-hidden /><span>Password policy</span><strong>{form.password_min_length ? `${form.password_min_length}+ characters` : 'Not configured'}</strong></article>
        <article className="tenant-settings-mini-card"><CalendarClock size={19} aria-hidden /><span>Session timeout</span><strong>{form.session_timeout_minutes ? `${form.session_timeout_minutes} minutes` : 'Not configured'}</strong></article>
      </div>
      {loading ? <div className="surface-state">Loading login activity...</div> : tableRows.length ? <SimpleSettingsTable columns={['Device', 'Location', 'Time', 'Status']} rows={tableRows} highlightFirst /> : <div className="empty-state"><h2>No login activity</h2><p>Login history will appear after tenant users sign in.</p></div>}
    </section>
  );
}

function StorageOverview({ form, backups, loading, onAction, onSelect }: { form: Record<string, string>; backups: BusinessRecord[]; loading?: boolean; onAction: (action: Action) => void; onSelect: (row: BusinessRecord) => void }) {
  const used = Number(form.storage_used_gb || 0);
  const total = Number(form.storage_limit_gb || 0);
  const lastBackup = backups[0];
  return (
    <section className="settings-panel tenant-settings-card">
      <div className="tenant-settings-card__heading"><div><h3>Storage & Backup Management</h3><p>Storage usage, backup runs, restore workflow, and retention controls.</p></div><div className="table-actions"><Button type="button" size="sm" onClick={() => onAction('backup')}><DatabaseBackup size={14} aria-hidden />Run Backup Now</Button><Button type="button" size="sm" variant="secondary" disabled={!lastBackup} onClick={() => { if (lastBackup) { onSelect(lastBackup); onAction('restore'); } }}>Restore Backup</Button></div></div>
      <div className="tenant-storage-meter"><div><strong>{used || 0} GB of {total || 0} GB</strong><span>Used storage</span></div><progress value={used} max={total || 1} aria-label="Storage used" /></div>
      <div className="tenant-settings-summary-grid tenant-settings-summary-grid--three"><article className="tenant-settings-mini-card"><Cloud size={19} aria-hidden /><span>Last Backup</span><strong>{String(lastBackup?.started_at ?? 'No backups')}</strong></article><article className="tenant-settings-mini-card"><CalendarClock size={19} aria-hidden /><span>Frequency</span><strong>{form.backup_frequency || 'Not configured'}</strong></article><article className="tenant-settings-mini-card"><CheckCircle2 size={19} aria-hidden /><span>Backup Status</span><strong>{String(lastBackup?.status ?? 'Not started')}</strong></article></div>
      {loading ? <div className="surface-state">Loading backup runs...</div> : <DataTable columns={[...columns(['backup_type', 'status', 'started_at', 'finished_at']), actionColumn((row) => <RowMenu items={[[ 'Download', () => onSelect(row) ], [ 'Restore', () => { onSelect(row); onAction('restore'); } ]]} />)]} data={backups} getRowId={idOf} total={backups.length} showToolbar={false} showPagination={false} emptyState={<div className="empty-state"><h2>No backups yet</h2><p>Run your first backup.</p></div>} />}
    </section>
  );
}

function CrmConfiguration({ lookups, loading, onAction, onSelect }: { lookups: BusinessRecord[]; loading?: boolean; onAction: (action: Action) => void; onSelect: (row: BusinessRecord) => void }) {
  const stages = lookups.filter((lookup) => String(lookup.group) === 'lead_stage');
  const lookupSummary = Object.values(lookups.reduce<Record<string, BusinessRecord>>((groups, lookup) => {
    const key = String(lookup.group ?? 'other');
    groups[key] = { group: key, type: 'CRM', count: Number(groups[key]?.count ?? 0) + 1 };
    return groups;
  }, {}));
  return (
    <section className="settings-panel tenant-settings-card">
      <div className="tenant-settings-card__heading"><div><h3>CRM Behavior</h3><p>Default pipeline, lead stages, and lookup management backed by /settings/lookups.</p></div><Button type="button" size="sm" onClick={() => onAction('setting')}><Plus size={14} aria-hidden />Add Lookup</Button></div>
      {stages.length ? <div className="tenant-stage-list" aria-label="Lead stage order">{stages.map((stage) => <div key={idOf(stage)}><GripVertical size={15} aria-hidden /><span>{String(stage.name ?? stage.code)}</span></div>)}</div> : <div className="empty-state"><h2>No lead stages configured</h2><p>Seed or create lead stage lookups to configure the pipeline.</p></div>}
      {loading ? <div className="surface-state">Loading lookups...</div> : <DataTable columns={[...columns(['group', 'type', 'count']), actionColumn((row) => <RowMenu items={[[ 'Edit', () => { onSelect(row); onAction('setting'); } ], [ 'Delete', () => { onSelect(row); onAction('deleteLookup'); } ]]} />)]} data={lookupSummary} getRowId={idOf} total={lookupSummary.length} showToolbar={false} showPagination={false} emptyState={<div className="empty-state"><h2>No lookups configured</h2><p>Create CRM lookups for sources, customer types, industries, and priorities.</p></div>} />}
    </section>
  );
}

function CommunicationChannelTests({ onAction }: { onAction: (action: Action) => void }) {
  return (
    <section className="settings-panel tenant-settings-card">
      <div className="tenant-settings-card__heading">
        <div>
          <h3>Test Notification Channels</h3>
          <p>Send controlled test messages using the tenant notification preferences saved below.</p>
        </div>
        <StatusBadge tone="info">Preference-aware</StatusBadge>
      </div>
      <div className="tenant-settings-test-grid">
        <article>
          <strong>Email</strong>
          <span>Sends through configured SMTP and writes a communication log.</span>
          <Button type="button" size="sm" onClick={() => onAction('composer')}><Mail size={14} aria-hidden />Test Email</Button>
        </article>
        <article>
          <strong>SMS</strong>
          <span>Creates a queued provider-ready SMS log when SMS is enabled.</span>
          <Button type="button" size="sm" variant="secondary" onClick={() => onAction('sendSms')}>Test SMS</Button>
        </article>
        <article>
          <strong>WhatsApp</strong>
          <span>Creates a queued provider-ready WhatsApp log when enabled.</span>
          <Button type="button" size="sm" variant="secondary" onClick={() => onAction('sendWhatsApp')}>Test WhatsApp</Button>
        </article>
        <article>
          <strong>Push</strong>
          <span>Creates an in-app notification visible in the notification center.</span>
          <Button type="button" size="sm" variant="secondary" onClick={() => onAction('sendPush')}><Bell size={14} aria-hidden />Test Push</Button>
        </article>
      </div>
    </section>
  );
}
function CommunicationTemplates({ templates, loading, onAction, onSelect }: { templates: BusinessRecord[]; loading?: boolean; onAction: (action: Action) => void; onSelect: (row: BusinessRecord) => void }) {
  return (
    <section className="settings-panel tenant-settings-card">
      <div className="tenant-settings-card__heading"><div><h3>Notification Templates</h3><p>API-ready templates from /settings/notification-templates.</p></div><Button type="button" size="sm" onClick={() => onAction('template')}><Mail size={14} aria-hidden />New Template</Button></div>
      {loading ? <div className="surface-state">Loading templates...</div> : <DataTable columns={[...columns(['code', 'subject', 'updated_at']), actionColumn((row) => <RowMenu items={[[ 'Edit', () => { onSelect(row); onAction('template'); } ], [ 'Test send', () => { onSelect(row); onAction('testTemplate'); } ]]} />)]} data={templates} getRowId={idOf} total={templates.length} showToolbar={false} showPagination={false} emptyState={<div className="empty-state"><h2>No notification templates</h2><p>Create templates for welcome, password reset, invoice, and HR messages.</p></div>} />}
    </section>
  );
}

function TenantSettingsIntegrationsPanel({ rows, providers, webhooks, loading, onAction, onSelect }: { rows: BusinessRecord[]; providers: BusinessRecord[]; webhooks: BusinessRecord[]; loading?: boolean; onAction: (action: Action) => void; onSelect: (row: BusinessRecord) => void }) {
  return (
    <div className="tenant-settings-group">
      <div className="tenant-settings-group__header"><div><span className="tenant-settings-kicker">/settings/integrations</span><h2>Integrations</h2><p>Connected apps, webhooks, credentials, and disconnect workflows.</p></div><Button type="button" onClick={() => onAction('connectIntegration')}><Plus size={16} aria-hidden />Connect App</Button></div>
      <section className="settings-panel tenant-settings-card"><div className="tenant-settings-card__heading"><div><h3>Connected Apps</h3><p>Connect tenant services and manage provider status.</p></div><StatusBadge tone="info">API-driven</StatusBadge></div><div className="tenant-integration-grid">{providers.map((provider) => { const connected = rows.find((row) => String(row.provider_code) === String(provider.code)); return <article key={idOf(provider)} className="tenant-integration-card"><PlugIcon /><div><strong>{String(provider.name ?? provider.code)}</strong><span>{connected ? String(connected.status ?? 'connected') : 'Not connected'}</span></div><Button type="button" size="sm" variant={connected ? 'danger' : 'secondary'} onClick={() => { onSelect(connected ?? provider); onAction(connected ? 'disconnectIntegration' : 'connectIntegration'); }}>{connected ? 'Disconnect' : 'Connect'}</Button></article>; })}</div>{loading ? <div className="surface-state">Loading integrations...</div> : rows.length ? <DataTable columns={[...columns(['name', 'provider_name', 'status', 'connected_at']), actionColumn((row) => <RowMenu items={settingsActions(row, 'integrations', onSelect, onAction)} />)]} data={rows} getRowId={idOf} total={rows.length} showToolbar={false} showPagination={false} /> : <div className="empty-state"><h2>No integrations connected</h2><p>Connect an application to extend your workspace.</p></div>}</section>
      <section className="settings-panel tenant-settings-card"><div className="tenant-settings-card__heading"><div><h3>API Keys</h3><p>Tenant API keys are managed through the existing profile API-token endpoint.</p></div><Button type="button" size="sm" onClick={() => onAction('rotateCredential')}><KeyRound size={14} aria-hidden />Manage</Button></div><div className="empty-state"><h2>Use profile API tokens</h2><p>Open Profile / API Tokens to generate, rotate, copy, or revoke tenant tokens.</p></div></section>
      <section className="settings-panel tenant-settings-card"><div className="tenant-settings-card__heading"><div><h3>Webhooks</h3><p>Send tenant events to external systems.</p></div><Button type="button" size="sm"><Plus size={14} aria-hidden />Add Webhook</Button></div>{webhooks.length ? <DataTable columns={[...columns(['event', 'status']), actionColumn((row) => <RowMenu items={[[ 'Edit', () => onSelect(row) ], [ 'Delete', () => onSelect(row) ]]} />)]} data={webhooks} getRowId={idOf} total={webhooks.length} showToolbar={false} showPagination={false} /> : <div className="empty-state"><h2>No webhooks configured</h2><p>Create a webhook to send tenant events to external systems.</p></div>}</section>
    </div>
  );
}
function SimpleSettingsTable({ columns: headers, rows, highlightFirst }: { columns: string[]; rows: string[][]; highlightFirst?: boolean }) {
  return <div className="tenant-simple-table"><table><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={`${row.join('-')}-${index}`} className={highlightFirst && index === 0 ? 'is-current' : undefined}>{row.map((cell, cellIndex) => <td key={`${cell}-${cellIndex}`}>{cell}</td>)}</tr>)}</tbody></table></div>;
}

function PlugIcon() {
  return <SlidersHorizontal size={18} aria-hidden />;
}

function inputTypeForSetting(field: string) {
  if (field.includes('date')) return 'date';
  if (field.includes('time')) return 'time';
  if (field.includes('email')) return 'email';
  if (field.includes('website') || field.includes('domain')) return 'url';
  if (field.includes('length') || field.includes('days') || field.includes('minutes') || field.includes('devices') || field.includes('gb')) return 'number';
  return 'text';
}
export function TenantNotificationsCommunicationPage() {
  const [tab, setTab] = useState('notifications');
  const [selected, setSelected] = useState<BusinessRecord | null>(null);
  const [action, setAction] = useState<Action>(null);
  const logs = usePaged('communication-logs', tenantBusinessApi.communication.logs, tab === 'logs');
  const templates = usePaged('notification-templates-communication', tenantBusinessApi.settings.templates, tab === 'templates');
  return (
    <BusinessShell title="Notifications & Communication" description="Notifications, communication logs, queues, templates, retry, preview, and test-send." tabs={communicationTabs} activeTab={tab} onTabChange={setTab} actions={<div className="surface-actions"><Button type="button" onClick={() => setAction(tab === 'templates' ? 'template' : 'composer')}><Mail size={16} aria-hidden />Email</Button><Button type="button" variant="secondary" onClick={() => setAction('sendSms')}>SMS</Button><Button type="button" variant="secondary" onClick={() => setAction('sendWhatsApp')}>WhatsApp</Button><Button type="button" variant="secondary" onClick={() => setAction('sendPush')}><Bell size={16} aria-hidden />Push</Button></div>}>
      {tab === 'notifications' ? <NotificationCenterShortcut /> : null}
      {tab === 'logs' || tab === 'queues' ? <DataTable columns={[...columns(['channel', 'provider', 'subject', 'status', 'failed_reason', 'sent_at', 'created_at']), actionColumn((row) => <RowMenu items={[['Retry', () => { setSelected(row); setAction('retryCommunication'); }], ['Preview', () => { setSelected(row); setAction('reportDrill'); }]]} />)]} data={logs.rows} getRowId={idOf} loading={logs.isLoading} error={logs.error} total={logs.total} page={logs.page} perPage={25} searchValue={logs.search} onSearchChange={logs.setSearch} onPageChange={logs.setPage} /> : null}
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
  const handleFieldChange = (field: string, value: string) => {
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === 'party_uuid') {
        const party = partyRows(selectors).find((row) => String(row.uuid) === value);
        const target = action === 'composer' ? party?.email : ['sendSms', 'sendWhatsApp'].includes(String(action)) ? party?.phone : undefined;
        if (target) next.to = String(target);
      }
      return next;
    });
  };
  const effectiveFields = integrationCredentialFields(fields, form, record, selectors, action);
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
        {effectiveFields.map((field) => (
          <label key={field}>
            <span>{label(field)}</span>
            {selectOptions(field, selectors) || staticOptions(field) ? (
              <select value={form[field] ?? ''} onChange={(event) => handleFieldChange(field, event.target.value)}>
                <option value="">Select {label(field)}</option>
                {(selectOptions(field, selectors) ?? staticOptions(field))?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            ) : inputType(field, action) === 'textarea' ? (
              <textarea rows={4} value={form[field] ?? ''} onChange={(event) => handleFieldChange(field, event.target.value)} />
            ) : inputType(field, action) === 'checkbox' ? (
              <select value={form[field] ?? ''} onChange={(event) => handleFieldChange(field, event.target.value)}><option value="">No</option><option value="true">Yes</option><option value="false">No</option></select>
            ) : (
              <input type={inputType(field, action)} value={form[field] ?? ''} onChange={(event) => handleFieldChange(field, event.target.value)} />
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
  if (action === 'sendSms') return tenantBusinessApi.communication.sendSms(body);
  if (action === 'sendWhatsApp') return tenantBusinessApi.communication.sendWhatsApp(body);
  if (action === 'sendPush') return tenantBusinessApi.communication.sendPush(body);
  if (action === 'retryCommunication') return tenantBusinessApi.communication.retry(id);
  if (action === 'template') return id ? tenantBusinessApi.settings.updateTemplate(id, body) : tenantBusinessApi.settings.createTemplate(body);
  if (action === 'testTemplate') return tenantBusinessApi.settings.testTemplate(id, body);
  if (action === 'saveReport') return tenantBusinessApi.reports.saveCustom(body);
  if (action === 'setting') return tenantBusinessApi.settings.saveGroup(String(context?.settingsGroup ?? 'general'), { settings: body });
  if (action === 'lookupReorder') return tenantBusinessApi.settings.reorderLookups([]);
  if (action === 'deleteLookup') return tenantBusinessApi.settings.deleteLookup(id || String(body.lookup_uuid), body);
  if (action === 'connectIntegration') return tenantBusinessApi.integrations.connect({ provider_id: record?.id ?? record?.code, name: record?.name, ...body });
  if (action === 'rotateCredential') return tenantBusinessApi.integrations.rotate(id, body);
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

function integrationCredentialFields(fields: string[], form: Record<string, string>, record: BusinessRecord | null | undefined, selectors: Record<string, BusinessRecord[]>, action: Action) {
  if (action !== 'connectIntegration' && action !== 'rotateCredential') return fields;

  const provider = integrationProviderFor(form, record, selectors);
  const credentialFields = credentialFieldsForProvider(provider);

  if (action === 'rotateCredential') return credentialFields;

  return [...fields, ...credentialFields.filter((field) => !fields.includes(field))];
}

function integrationProviderFor(form: Record<string, string>, record: BusinessRecord | null | undefined, selectors: Record<string, BusinessRecord[]>) {
  if (record?.provider_code || record?.metadata || record?.auth_type) return record;
  const providerId = form.provider_id;

  return selectors.providers?.find((provider) => String(provider.id) === providerId || String(provider.code) === providerId);
}

function credentialFieldsForProvider(provider?: BusinessRecord | null) {
  const metadata = parseMetadata(provider?.metadata);
  const template = metadata.credential_template;

  if (template && typeof template === 'object' && !Array.isArray(template)) return Object.keys(template);

  if (provider?.provider_code === 'twilio_sms' || provider?.code === 'twilio_sms') return ['account_sid', 'auth_token', 'from_number'];
  if (provider?.provider_code === 'razorpay' || provider?.code === 'razorpay') return ['key_id', 'key_secret'];
  if (provider?.provider_code === 'aws_s3' || provider?.code === 'aws_s3') return ['access_key_id', 'secret_access_key', 'region', 'bucket'];
  if (provider?.provider_code === 'smtp_mail' || provider?.code === 'smtp_mail') return ['mail_host', 'mail_port', 'mail_encryption', 'mail_username', 'mail_password', 'mail_from_address', 'mail_from_name'];

  return ['api_key', 'api_secret'];
}

function parseMetadata(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>;
  if (typeof value !== 'string' || !value) return {};

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

function initialForm(fields: string[], record: BusinessRecord | null | undefined, action: Action) {
  return Object.fromEntries(fields.map((field) => {
    if (field === 'invoice_uuid' && action === 'recordPayment') return [field, stringValue(record?.uuid)];
    if (field === 'client_party_uuid') return [field, stringValue(record?.client_party_uuid)];
    if (field === 'provider_id' && action === 'connectIntegration') return [field, stringValue(record?.id ?? record?.code ?? '')];
    if (field === 'name' && action === 'connectIntegration') return [field, stringValue(record?.name)];
    return [field, stringValue(record?.[field])];
  }));
}

function selectOptions(field: string, selectors: Record<string, BusinessRecord[]>) {
  if (field === 'party_uuid') return partyOptions(selectors);
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
    channel: ['email', 'sms', 'whatsapp', 'push', 'in_app'],
    format: ['csv', 'xlsx', 'pdf'],
    backup_type: ['manual', 'full', 'files', 'database']
  };
  return values[field]?.map((value) => ({ value, label: label(value) })) ?? null;
}

function partyRows(selectors: Record<string, BusinessRecord[]>) {
  return selectors.parties?.length ? selectors.parties : [...(selectors.clients ?? []), ...(selectors.vendors ?? [])];
}

function partyOptions(selectors: Record<string, BusinessRecord[]>) {
  return partyRows(selectors).map((row) => {
    const type = row.party_type ? label(String(row.party_type)) : selectors.vendors?.some((vendor) => vendor.uuid === row.uuid) ? 'Vendor' : 'Client';
    return { value: String(row.uuid), label: [type, row.display_name, row.email || row.phone].filter(Boolean).map(String).join(' - ') };
  });
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
  return <RowActionMenu label="Open actions" items={items.map(([labelText, action]) => ({ label: labelText, onClick: action, danger: /delete|remove|void|cancel/i.test(labelText) }))} />;
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
    case 'sendSms': return ['to', 'body', 'party_uuid'];
    case 'sendWhatsApp': return ['to', 'body', 'party_uuid'];
    case 'sendPush': return ['to', 'subject', 'body'];
    case 'template': return ['code', 'channel', 'subject', 'body', 'status'];
    case 'connectIntegration': return ['provider_id', 'name'];
    case 'rotateCredential': return [];
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
    const { provider_id, name, status, ...credentials } = body;
    const payload = action === 'connectIntegration' ? { provider_id, name } : {};
    return { ...payload, credentials: Object.fromEntries(Object.entries(credentials).filter(([, value]) => value)) };
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

function inputType(field: string, action?: Action) {
  if (['body', 'description', 'filters', 'remarks'].includes(field)) return 'textarea';
  if (field.includes('date') || field.endsWith('_at')) return field.endsWith('_at') ? 'datetime-local' : 'date';
  if (field.includes('amount') || field.includes('quantity') || field.includes('rate')) return 'number';
  if (field.includes('email') || (field === 'to' && !['sendSms', 'sendWhatsApp', 'sendPush'].includes(String(action)))) return 'email';
  if (field === 'to' && ['sendSms', 'sendWhatsApp'].includes(String(action))) return 'tel';
  if (field.includes('secret') || field.includes('token') || field.includes('api_key') || field.includes('api_secret') || field.includes('auth_token') || field.includes('password') || field.includes('secret_access_key') || field.includes('key_secret') || field.includes('account_number')) return 'password';
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
  if (['cancelled', 'void', 'rejected', 'failed', 'blocked', 'disconnected'].includes(normalized)) return 'danger';
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
  { id: 'general', label: 'General', icon: SlidersHorizontal },
  { id: 'company', label: 'Company', icon: Building2 },
  { id: 'branding', label: 'Branding', icon: Palette },
  { id: 'localization', label: 'Localization', icon: Globe2 },
  { id: 'communication', label: 'Communication', icon: Bell },
  { id: 'security', label: 'Security', icon: LockKeyhole },
  { id: 'storage', label: 'Storage', icon: Cloud },
  { id: 'hr', label: 'HR', icon: BriefcaseBusiness },
  { id: 'crm', label: 'CRM', icon: SlidersHorizontal },
  { id: 'integrations', label: 'Integrations', icon: KeyRound }
];
const settingsDescriptions: Record<string, string> = {
  general: 'Workspace identity, status, logo, and primary organization details.',
  company: 'Legal, tax, address, and business contact information.',
  branding: 'White-label colors, logos, favicon, and custom domain settings.',
  localization: 'Language, timezone, currency, date, time, and number formats.',
  communication: 'Email sender details and tenant notification preferences.',
  security: 'Authentication, password, session, and tenant security policies.',
  storage: 'Storage limits, backup preferences, and retention controls.',
  hr: 'Working hours, leave, attendance, and employee numbering defaults.',
  crm: 'CRM pipelines, lead stages, and lookup behavior.'
};

const settingsFields: Record<string, string[]> = {
  general: ['workspace_name', 'tenant_name', 'workspace_slug', 'workspace_description', 'website', 'status', 'subscription_status', 'billing_status'],
  company: ['legal_company_name', 'trade_name', 'registration_number', 'gst_number', 'pan_number', 'tax_id', 'industry', 'company_size', 'business_type', 'founded_date', 'company_email', 'phone', 'alternate_phone', 'address_line_1', 'address_line_2', 'country', 'state', 'city', 'postal_code'],
  branding: ['light_logo', 'dark_logo', 'favicon', 'primary_color', 'secondary_color', 'accent_color', 'custom_domain', 'dns_status'],
  localization: ['language', 'timezone', 'currency', 'date_format', 'time_format', 'week_start', 'number_format'],
  communication: ['sender_name', 'sender_email', 'reply_to_email', 'email_notifications', 'sms_notifications', 'whatsapp_notifications', 'push_notifications'],
  security: ['two_factor_required', 'password_min_length', 'require_uppercase', 'require_number', 'require_special_character', 'password_expiry_days', 'session_timeout_minutes', 'remember_me_days', 'maximum_devices'],
  storage: ['storage_limit_gb', 'storage_used_gb', 'retention_days', 'backup_enabled', 'backup_frequency'],
  hr: ['work_start_time', 'work_end_time', 'working_days', 'annual_leave_days', 'sick_leave_days', 'casual_leave_days', 'late_mark_grace_minutes', 'overtime_enabled', 'employee_number_format'],
  crm: ['default_lead_pipeline', 'lead_stages', 'lookup_management']
};

function emptySettingsFor(group: string): Record<string, string> {
  return Object.fromEntries((settingsFields[group] ?? []).map((field) => [field, '']));
}
const settingsFieldOptions: Record<string, Array<{ value: string; label: string }>> = {
  status: [{ value: 'active', label: 'Active' }, { value: 'trial', label: 'Trial' }, { value: 'paid', label: 'Paid' }, { value: 'suspended', label: 'Suspended' }],
  industry: [{ value: 'technology', label: 'Technology' }, { value: 'professional_services', label: 'Professional services' }, { value: 'retail', label: 'Retail' }, { value: 'manufacturing', label: 'Manufacturing' }],
  company_size: [{ value: '1-10', label: '1-10 employees' }, { value: '11-50', label: '11-50 employees' }, { value: '51-200', label: '51-200 employees' }, { value: '201+', label: '201+ employees' }],
  business_type: [{ value: 'private', label: 'Private company' }, { value: 'public', label: 'Public company' }, { value: 'nonprofit', label: 'Non-profit' }],
  dns_status: [{ value: 'verified', label: 'Verified' }, { value: 'pending', label: 'Pending' }, { value: 'not_configured', label: 'Not configured' }],
  language: [{ value: 'en', label: 'English' }, { value: 'hi', label: 'Hindi' }],
  timezone: [{ value: 'Asia/Kolkata', label: 'India Standard Time (UTC+05:30)' }, { value: 'UTC', label: 'UTC' }, { value: 'Europe/London', label: 'United Kingdom (UTC+00:00)' }, { value: 'America/New_York', label: 'Eastern Time (UTC-05:00)' }],
  currency: [{ value: 'INR', label: 'Indian Rupee (INR)' }, { value: 'USD', label: 'US Dollar (USD)' }, { value: 'EUR', label: 'Euro (EUR)' }],
  date_format: [{ value: 'DD MMM YYYY', label: 'DD MMM YYYY' }, { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' }, { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' }],
  time_format: [{ value: '12-hour', label: '12-hour' }, { value: '24-hour', label: '24-hour' }],
  week_start: [{ value: 'monday', label: 'Monday' }, { value: 'sunday', label: 'Sunday' }],
  number_format: [{ value: '1,234.56', label: '1,234.56' }, { value: '1.234,56', label: '1.234,56' }],
  backup_frequency: [{ value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' }, { value: 'monthly', label: 'Monthly' }],
  working_days: [{ value: 'monday-friday', label: 'Monday-Friday' }, { value: 'monday-saturday', label: 'Monday-Saturday' }],
  default_lead_pipeline: [{ value: 'default', label: 'Default pipeline' }, { value: 'sales', label: 'Sales pipeline' }]
};

const settingsBooleanFields = new Set(['email_notifications', 'sms_notifications', 'whatsapp_notifications', 'push_notifications', 'two_factor_required', 'require_uppercase', 'require_number', 'require_special_character', 'backup_enabled', 'overtime_enabled']);

const settingsTextAreaFields = new Set(['workspace_description', 'lead_stages', 'lookup_management']);

const settingsPrimaryCardTitle: Record<string, string> = {
  general: 'Workspace Information',
  company: 'Business Identity',
  branding: 'Logo, Colors & Domain',
  localization: 'Regional Defaults',
  communication: 'Email & Notification Preferences',
  security: 'Authentication & Session Policy',
  storage: 'Storage Defaults',
  hr: 'Employee Configuration',
  crm: 'Pipeline Defaults'
};

const settingsPrimaryCardDescription: Record<string, string> = {
  general: 'Workspace name, tenant name, slug, description, logo references, website, and lifecycle status.',
  company: 'Legal, tax, address, and official contact details for invoices, contracts, and compliance.',
  branding: 'White-label tenant identity with logo assets, favicon, live color preview, and custom domain DNS status.',
  localization: 'Language, timezone, currency, date, time, week start, and number formatting preferences.',
  communication: 'Sender identity plus email, SMS, WhatsApp, and push notification toggles.',
  security: 'Two-factor, password complexity, expiry, device limits, and session duration controls.',
  storage: 'Storage quota, retention, and scheduled backup preferences.',
  hr: 'Working hours, leave balances, attendance grace, overtime, and employee number format.',
  crm: 'Default lead pipeline, editable stage order, and lookup behavior.'
};

const settingsFieldHints: Record<string, string> = {
  workspace_slug: 'Used in tenant URLs and workspace references.',
  custom_domain: 'Example: crm.acme.com. DNS verification is shown separately.',
  lead_stages: 'Comma-separated fallback until the drag ordering API persists stages.',
  lookup_management: 'Lookup rows below are loaded from /settings/lookups.',
  password_min_length: 'Minimum password length for tenant users.',
  maximum_devices: 'Maximum active devices per user.',
  employee_number_format: 'Example: EMP-00001.'
};

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



















