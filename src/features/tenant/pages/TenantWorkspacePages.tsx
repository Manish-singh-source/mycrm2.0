import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LifeBuoy, RefreshCw, Send } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { tenantQueryKeys } from '@/features/tenant/api/tenantQueryKeys';
import { tenantWorkspaceApi, type TenantRecord } from '@/features/tenant/api/tenantWorkspaceApi';
import { TENANT_ROUTES } from '@/features/tenant/routes/tenantRoutes';
import { ApiError } from '@/lib/api/apiError';
import { DataTable, type DataTableColumn } from '@/shared/components/data-table';
import { AppDrawer } from '@/shared/components/drawer';
import { PageHeader, StatusBadge, Tabs } from '@/shared/components/layout';
import { Button } from '@/shared/components/ui';

const tenantKey = 'current';

export function TenantNotificationsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const [tab, setTab] = useState('all');
  const query = useQuery({
    queryKey: tenantQueryKeys.list(tenantKey, 'notifications-page', { tab }),
    queryFn: () => tenantWorkspaceApi.notifications.list({ per_page: 25, ...(tab === 'unread' ? { unread: true } : {}) })
  });
  const countQuery = useQuery({ queryKey: tenantQueryKeys.resource(tenantKey, 'notification-count'), queryFn: tenantWorkspaceApi.notifications.unreadCount });
  const mutation = useMutation({
    mutationFn: ({ action, id }: { action: 'read' | 'unread' | 'delete' | 'bulk'; id?: string | number }) => {
      if (action === 'read' && id) return tenantWorkspaceApi.notifications.read(id);
      if (action === 'unread' && id) return tenantWorkspaceApi.notifications.unread(id);
      if (action === 'delete' && id) return tenantWorkspaceApi.notifications.delete(id);
      return tenantWorkspaceApi.notifications.bulkRead([]);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tenantQueryKeys.all(tenantKey) });
    }
  });
  const rows = query.data?.data ?? [];
  const unread = countQuery.data?.data.unread_count ?? 0;
  return (
    <section className="enterprise-module-page">
      <PageHeader
        title="Notifications"
        description="Database notifications with unread/read state, detail view, bulk mark-read, and delete actions."
        tabs={<Tabs tabs={notificationPageTabs} activeId={tab} onChange={setTab} ariaLabel="Notification sections" />}
        meta={<StatusBadge tone={unread > 0 ? 'warning' : 'success'}>{`${unread} unread`}</StatusBadge>}
        actions={<div className="table-actions"><Button type="button" variant="secondary" onClick={() => void query.refetch()}><RefreshCw size={16} aria-hidden />Refresh</Button><Button type="button" onClick={() => mutation.mutate({ action: 'bulk' })} disabled={mutation.isPending || unread === 0}>Mark All Read</Button></div>}
      />
      <DataTable
        columns={notificationColumns((row) => navigate(TENANT_ROUTES.notificationDetail(tenantSlug, idOf(row))), mutation.mutate)}
        data={rows}
        getRowId={(row) => String(row.id)}
        loading={query.isLoading}
        error={query.error instanceof ApiError ? query.error.message : undefined}
        total={query.data?.total ?? rows.length}
      />
    </section>
  );
}

export function TenantNotificationDetailPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { notificationId = '', tenantSlug } = useParams();
  const query = useQuery({
    queryKey: tenantQueryKeys.detail(tenantKey, 'notification', notificationId),
    queryFn: () => tenantWorkspaceApi.notifications.detail(notificationId),
    enabled: Boolean(notificationId)
  });
  const mutation = useMutation({
    mutationFn: (action: 'read' | 'unread' | 'delete') => {
      if (action === 'delete') return tenantWorkspaceApi.notifications.delete(notificationId);
      if (action === 'unread') return tenantWorkspaceApi.notifications.unread(notificationId);
      return tenantWorkspaceApi.notifications.read(notificationId);
    },
    onSuccess: async (_response, action) => {
      await queryClient.invalidateQueries({ queryKey: tenantQueryKeys.all(tenantKey) });
      if (action === 'delete') navigate(TENANT_ROUTES.notifications(tenantSlug));
    }
  });
  const notification = query.data?.data.notification;

  if (query.isLoading) return <div className="surface-state">Loading notification...</div>;
  if (query.isError) return <div className="surface-error">{errorMessage(query.error)}</div>;
  if (!notification) return <div className="empty-state">Notification not found.</div>;

  return (
    <section className="enterprise-module-page">
      <PageHeader
        title={String(notification.title ?? notification.type ?? 'Notification')}
        description={String(notification.message ?? notification.created_at ?? 'Notification detail')}
        meta={<StatusBadge tone={notification.read_at ? 'success' : 'warning'}>{notification.read_at ? 'Read' : 'Unread'}</StatusBadge>}
        actions={<div className="table-actions"><Link className="button button--secondary button--md" to={TENANT_ROUTES.notifications(tenantSlug)}>Back</Link><Button type="button" variant="secondary" onClick={() => mutation.mutate(notification.read_at ? 'unread' : 'read')} disabled={mutation.isPending}>{notification.read_at ? 'Mark Unread' : 'Mark Read'}</Button><Button type="button" variant="danger" onClick={() => mutation.mutate('delete')} disabled={mutation.isPending}>Delete</Button></div>}
      />
      <article className="settings-panel">
        <RecordDetails record={notification} />
      </article>
    </section>
  );
}
export function TenantActivityPage() {
  const [selected, setSelected] = useState<TenantRecord | null>(null);
  const query = useQuery({ queryKey: tenantQueryKeys.resource(tenantKey, 'activity'), queryFn: () => tenantWorkspaceApi.activity.list({ per_page: 25 }) });
  return (
    <section className="enterprise-module-page">
      <PageHeader title="Recent Activity" description="Tenant activity stream with compare drawer." />
      <DataTable
        columns={activityColumns(setSelected)}
        data={query.data?.data ?? []}
        getRowId={idOf}
        loading={query.isLoading}
        error={query.isError ? errorMessage(query.error) : ''}
        total={query.data?.total ?? query.data?.data.length ?? 0}
      />
      <AppDrawer open={Boolean(selected)} onClose={() => setSelected(null)} title="Activity Compare" guard="tenant" permission="activity_log.view" size="lg">
        <RecordDetails record={selected ?? {}} />
      </AppDrawer>
    </section>
  );
}

export function TenantHelpCenterPage() {
  const [activeTab, setActiveTab] = useState('articles');
  const [form, setForm] = useState({ subject: '', description: '', priority: 'medium' });
  const queryClient = useQueryClient();
  const articles = useQuery({ queryKey: tenantQueryKeys.resource(tenantKey, 'help-articles'), queryFn: () => tenantWorkspaceApi.help.articles({ per_page: 25 }) });
  const faqs = useQuery({ queryKey: tenantQueryKeys.resource(tenantKey, 'help-faqs'), queryFn: tenantWorkspaceApi.help.faqs });
  const releaseNotes = useQuery({ queryKey: tenantQueryKeys.resource(tenantKey, 'help-release-notes'), queryFn: tenantWorkspaceApi.help.releaseNotes });
  const status = useQuery({ queryKey: tenantQueryKeys.resource(tenantKey, 'help-status'), queryFn: tenantWorkspaceApi.help.systemStatus });
  const contact = useMutation({
    mutationFn: () => tenantWorkspaceApi.help.contactSupport(form),
    onSuccess: async () => {
      setForm({ subject: '', description: '', priority: 'medium' });
      await queryClient.invalidateQueries({ queryKey: tenantQueryKeys.resource(tenantKey, 'help-articles') });
    }
  });
  return (
    <section className="enterprise-module-page">
      <PageHeader title="Help Center" description="Documentation, FAQs, release notes, system status, and contact support." />
      <Tabs
        tabs={[
          { id: 'articles', label: 'Articles' },
          { id: 'faqs', label: 'FAQs' },
          { id: 'release-notes', label: 'Release Notes' },
          { id: 'status', label: 'System Status' },
          { id: 'contact', label: 'Contact Support' }
        ]}
        activeId={activeTab}
        ariaLabel="Help sections"
        onChange={setActiveTab}
      />
      {activeTab === 'articles' ? <RecordList rows={articles.data?.data ?? []} loading={articles.isLoading} error={articles.isError ? errorMessage(articles.error) : ''} articleLinks /> : null}
      {activeTab === 'faqs' ? <RecordList rows={extract(faqs.data?.data, 'faqs')} loading={faqs.isLoading} error={faqs.isError ? errorMessage(faqs.error) : ''} /> : null}
      {activeTab === 'release-notes' ? <RecordList rows={extract(releaseNotes.data?.data, 'release_notes')} loading={releaseNotes.isLoading} error={releaseNotes.isError ? errorMessage(releaseNotes.error) : ''} /> : null}
      {activeTab === 'status' ? (status.isError ? <div className="surface-error">{errorMessage(status.error)}</div> : <div className="settings-panel"><h2>System Status</h2><StatusBadge tone={String(status.data?.data.status) === 'operational' ? 'success' : 'warning'}>{String(status.data?.data.status ?? 'unknown')}</StatusBadge><p>Open alerts: {String(status.data?.data.open_alerts ?? 0)}</p></div>) : null}
      {activeTab === 'contact' ? (
        <form className="settings-panel" onSubmit={(event: FormEvent) => { event.preventDefault(); contact.mutate(); }}>
          {contact.error ? <div className="surface-error">{errorMessage(contact.error)}</div> : null}
          {contact.isSuccess ? <div className="surface-state">Support request submitted.</div> : null}
          <label><span>Subject</span><input value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} required /></label>
          <label><span>Description</span><textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required /></label>
          <label><span>Priority</span><select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}><option value="low">low</option><option value="medium">medium</option><option value="high">high</option></select></label>
          <Button type="submit"><Send size={16} aria-hidden />Send</Button>
        </form>
      ) : null}
    </section>
  );
}

export function TenantHelpArticlePage() {
  const { slug = '', tenantSlug } = useParams();
  const query = useQuery({
    queryKey: tenantQueryKeys.detail(tenantKey, 'help-article', slug),
    queryFn: () => tenantWorkspaceApi.help.article(slug),
    enabled: Boolean(slug)
  });
  const article = query.data?.data.article;

  if (query.isLoading) return <div className="surface-state">Loading article...</div>;
  if (query.isError) return <div className="surface-error">{errorMessage(query.error)}</div>;
  if (!article) return <div className="empty-state">Published article not found.</div>;

  return (
    <section className="enterprise-module-page">
      <PageHeader
        title={String(article.title ?? 'Help Article')}
        description={`${String(article.audience ?? 'all')} / ${String(article.status ?? 'published')}`}
        actions={<Link className="button button--secondary button--md" to={TENANT_ROUTES.helpCenter(tenantSlug)}>Back</Link>}
      />
      <article className="settings-panel">
        <StatusBadge tone="success">{String(article.status ?? 'published')}</StatusBadge>
        <div className="surface-body">
          {String(article.body ?? article.content ?? '').split(/\n{2,}/).map((paragraph, index) => (
            <p key={`${article.slug ?? 'article'}-${index}`}>{paragraph}</p>
          ))}
        </div>
      </article>
    </section>
  );
}

export function TenantPlaceholderModulePage({ title }: { title: string }) {
  return (
    <section className="enterprise-module-page">
      <PageHeader title={title} description="This tenant module route is protected by tenant permissions and ready for the module-specific implementation." actions={<Button type="button" variant="secondary"><RefreshCw size={16} aria-hidden />Refresh</Button>} />
      <div className="empty-state">Implementation placeholder. Backend route/module structure remains ready.</div>
    </section>
  );
}

function RecordList({ articleLinks, rows, loading, error }: { articleLinks?: boolean; rows: TenantRecord[]; loading?: boolean; error?: string }) {
  if (loading) return <div className="surface-state">Loading...</div>;
  if (error) return <div className="surface-error">{error}</div>;
  if (rows.length === 0) return <div className="empty-state">No records returned.</div>;
  return (
    <div className="record-list">
      {rows.map((row) => {
        const title = String(row.title ?? row.question ?? row.name ?? row.version ?? row.slug ?? 'Record');
        const summary = String(row.answer ?? row.summary ?? row.body ?? row.content ?? row.description ?? row.status ?? '-').slice(0, 220);
        return (
          <article key={idOf(row)}>
            {articleLinks && row.slug ? <Link className="link-button" to={`articles/${row.slug}`}>{title}</Link> : <strong>{title}</strong>}
            <p>{summary}</p>
          </article>
        );
      })}
    </div>
  );
}

function RecordDetails({ record }: { record: TenantRecord }) {
  const entries = Object.entries(record).filter(([key, value]) => value !== null && value !== undefined && value !== '' && !['id', 'tenant_id'].includes(key));
  if (entries.length === 0) return <div className="empty-state">No details returned.</div>;
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

const notificationPageTabs = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' }
];

function notificationColumns(onSelect: (record: TenantRecord) => void, onAction: (payload: { action: 'read' | 'unread' | 'delete'; id?: string | number }) => void): DataTableColumn<TenantRecord>[] {
  return [
    { id: 'title', header: 'Notification', cell: (row) => <div className="notification-cell"><strong>{String(row.title ?? row.type ?? 'Notification')}</strong><span>{String(row.message ?? row.created_at ?? '-')}</span></div> },
    { id: 'status', header: 'Status', cell: (row) => <StatusBadge tone={row.read_at ? 'success' : 'warning'}>{row.read_at ? 'Read' : 'Unread'}</StatusBadge> },
    { id: 'created_at', header: 'Created', cell: (row) => String(row.created_at ?? '-') },
    { id: 'actions', header: 'Actions', enableHiding: false, cell: (row) => <div className="inline-actions"><Button type="button" size="sm" variant="secondary" onClick={() => onSelect(row)}>Open</Button><Button type="button" size="sm" variant="secondary" onClick={() => onAction({ action: row.read_at ? 'unread' : 'read', id: row.id })}>{row.read_at ? 'Unread' : 'Read'}</Button><Button type="button" size="sm" variant="danger" onClick={() => onAction({ action: 'delete', id: row.id })}>Delete</Button></div> }
  ];
}

function activityColumns(onSelect: (record: TenantRecord) => void): DataTableColumn<TenantRecord>[] {
  return [
    { id: 'event', header: 'Event', cell: (row) => <strong>{String(row.event ?? '-')}</strong> },
    { id: 'subject_type', header: 'Subject', cell: (row) => String(row.subject_type ?? '-') },
    { id: 'ip_address', header: 'IP', cell: (row) => String(row.ip_address ?? '-') },
    { id: 'created_at', header: 'Created', cell: (row) => String(row.created_at ?? '-') },
    { id: 'actions', header: 'Actions', enableHiding: false, cell: (row) => <Button type="button" size="sm" variant="secondary" onClick={() => onSelect(row)}><LifeBuoy size={14} aria-hidden />Compare</Button> }
  ];
}

function extract(payload: unknown, key: string): TenantRecord[] {
  if (!payload || typeof payload !== 'object') return [];
  const value = (payload as Record<string, unknown>)[key];
  return Array.isArray(value) ? value as TenantRecord[] : [];
}

function idOf(row: TenantRecord) {
  return String(row.uuid ?? row.id ?? row.slug ?? row.title ?? row.name ?? 'record');
}

function label(value: string) {
  return value.replace(/[-_]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function displayValue(value: unknown) {
  if (value === null || value === undefined || value === '') return '-';
  if (Array.isArray(value)) return `${value.length} item${value.length === 1 ? '' : 's'}`;
  if (typeof value === 'object') {
    const record = value as TenantRecord;
    return String(record.title ?? record.name ?? record.display_name ?? record.email ?? record.status ?? record.uuid ?? 'Details available');
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

function errorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Request failed.';
}





