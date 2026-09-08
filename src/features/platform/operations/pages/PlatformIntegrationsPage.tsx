import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader, StatusBadge } from '@/shared/components/layout';
import { Button, PermissionButton } from '@/shared/components/ui';
import { platformClient } from '@/lib/api/platformClient';
import { ApiError } from '@/lib/api/apiError'; import { relationshipValue } from '@/shared/utils/relationshipDisplay';

type Integration = { id?: number; uuid: string; tenant_id?: number; tenant_name?: string; organization_name?: string; provider_code?: string; provider_name?: string; name?: string; status?: string; connected_at?: string };
type Webhook = { id: number; integration_uuid?: string; integration_name?: string; event?: string; status?: string };
type Job = { id: number; tenant_integration_id?: number; sync_type?: string; direction?: string; status?: string; started_at?: string; finished_at?: string };
type Detail = { integration: Integration; credentials?: Array<{ key: string; expires_at?: string }>; webhooks?: Webhook[]; sync_jobs?: Job[] };
type Page<T> = { data: T[]; meta?: { current_page?: number; last_page?: number; total?: number } };
const id = (value: string | number) => encodeURIComponent(String(value));
const errorText = (error: unknown) => error instanceof ApiError ? error.message : error instanceof Error ? error.message : 'Request failed.';
const parseJson = (value: string) => { try { return JSON.parse(value || '{}') as Record<string, unknown>; } catch { return {}; } };

export function PlatformIntegrationsPage() {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Integration | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [tenantUuid, setTenantUuid] = useState('');
  const [providerCode, setProviderCode] = useState('');
  const [name, setName] = useState('');
  const [credentials, setCredentials] = useState('{}');
  const queryClient = useQueryClient();
  const list = useQuery({ queryKey: ['tenant-integrations', page], queryFn: async () => {
    const response = await platformClient.get<Integration[]>('/tenant-integrations', { query: { page, per_page: 25 } as any });
    return { data: response.data || [], meta: response.meta };
  }});
  const detail = useQuery({ queryKey: ['tenant-integration', selected?.uuid], enabled: Boolean(selected), queryFn: async () => (await platformClient.get<Detail>('/tenant-integrations/' + id(selected!.uuid))).data });
  const webhooks = useQuery({ queryKey: ['platform-webhooks', page], queryFn: async () => {
    const response = await platformClient.get<Webhook[]>('/webhooks', { query: { page, per_page: 25 } as any });
    return { data: response.data || [], meta: response.meta };
  }});
  const jobs = useQuery({ queryKey: ['integration-sync-jobs', page], queryFn: async () => {
    const response = await platformClient.get<Job[]>('/sync-jobs', { query: { page, per_page: 25 } as any });
    return { data: response.data || [], meta: response.meta };
  }});
  const refresh = () => { void queryClient.invalidateQueries({ queryKey: ['tenant-integrations'] }); void queryClient.invalidateQueries({ queryKey: ['tenant-integration'] }); void queryClient.invalidateQueries({ queryKey: ['platform-webhooks'] }); void queryClient.invalidateQueries({ queryKey: ['integration-sync-jobs'] }); };
  const create = useMutation({ mutationFn: () => platformClient.post('/tenant-integrations', { tenant_uuid: tenantUuid, provider_code: providerCode, name, credentials: parseJson(credentials) }), onSuccess: () => { setShowCreate(false); setTenantUuid(''); setProviderCode(''); setName(''); setCredentials('{}'); refresh(); } });
  const action = useMutation({ mutationFn: async (input: { type: string; integration: Integration }) => {
    const base = '/tenant-integrations/' + id(input.integration.uuid);
    if (input.type === 'test') return platformClient.post(base + '/test', {});
    if (input.type === 'disconnect') return platformClient.post(base + '/disconnect', {});
    return platformClient.post(base + '/credentials', { credentials: parseJson(credentials) });
  }, onSuccess: refresh });
  const rows = list.data?.data || [];
  const meta = list.data?.meta;
  return <section className="enterprise-module-page platform-operations-page">
    <PageHeader title="Integrations" description="Manage tenant integrations, credentials, mappings, webhooks, and synchronization jobs." actions={<PermissionButton guard="platform" permission="integration.create" type="button" onClick={() => setShowCreate(true)}>Create integration</PermissionButton>} />
    {list.isError ? <div className="surface-error">{errorText(list.error)}</div> : null}
    <div className="dashboard-panel"><table className="data-table"><thead><tr><th>Tenant</th><th>Provider</th><th>Name</th><th>Status</th><th>Connected</th><th>Actions</th></tr></thead><tbody>
      {rows.map((row) => <tr key={row.uuid}><td>{row.tenant_name || row.organization_name || 'Tenant'}</td><td>{row.provider_name || row.provider_code || '-'}</td><td>{row.name || '-'}</td><td><StatusBadge>{row.status || 'unknown'}</StatusBadge></td><td>{row.connected_at || '-'}</td><td><Button size="sm" variant="secondary" onClick={() => setSelected(row)}>View</Button>{' '}<PermissionButton guard="platform" permission="integration.test" size="sm" type="button" onClick={() => action.mutate({ type: 'test', integration: row })} disabled={action.isPending}>Test</PermissionButton>{' '}<PermissionButton guard="platform" permission="integration.edit" size="sm" type="button" onClick={() => { if (window.confirm('Disconnect this integration?')) action.mutate({ type: 'disconnect', integration: row }); }}>Disconnect</PermissionButton></td></tr>)}
    </tbody></table>{!list.isLoading && rows.length === 0 ? <div className="empty-state">No tenant integrations found.</div> : null}<Pager page={page} meta={meta} onPage={setPage} /></div>
    {showCreate ? <CreateForm tenantUuid={tenantUuid} providerCode={providerCode} name={name} credentials={credentials} setTenantUuid={setTenantUuid} setProviderCode={setProviderCode} setName={setName} setCredentials={setCredentials} loading={create.isPending} error={create.error} onCancel={() => setShowCreate(false)} onSubmit={() => create.mutate()} /> : null}
    {selected ? <IntegrationDetail selected={selected} data={detail.data} loading={detail.isLoading} error={detail.error} onClose={() => setSelected(null)} onRefresh={refresh} /> : null}
    <section className="dashboard-panel"><PageHeader title="Webhooks" description="Secrets are never returned; payloads are masked." /><ResourceTable rows={webhooks.data?.data || []} columns={['integration_name', 'event', 'status']} /></section>
    <section className="dashboard-panel"><PageHeader title="Sync jobs" description="Retry actions remain queued until a later status refresh." /><ResourceTable rows={jobs.data?.data || []} columns={['tenant_name', 'integration_name', 'sync_type', 'direction', 'status', 'started_at', 'finished_at']} /></section>
  </section>;
}

function CreateForm(props: any) {
  return <div className="dashboard-panel"><PageHeader title="Create tenant integration" description="Credential values are encrypted and are not returned after submission." /><form className="enterprise-form" onSubmit={(event) => { event.preventDefault(); props.onSubmit(); }}><label>Tenant UUID<input required value={props.tenantUuid} onChange={(event) => props.setTenantUuid(event.target.value)} /></label><label>Provider code<input required value={props.providerCode} onChange={(event) => props.setProviderCode(event.target.value)} /></label><label>Display name<input required value={props.name} onChange={(event) => props.setName(event.target.value)} /></label><label>Credentials JSON<textarea value={props.credentials} onChange={(event) => props.setCredentials(event.target.value)} /></label>{props.error ? <div className="surface-error">{errorText(props.error)}</div> : null}<footer className="enterprise-form__footer"><Button type="button" variant="secondary" onClick={props.onCancel}>Cancel</Button><PermissionButton guard="platform" permission="integration.create" type="submit" disabled={props.loading}>{props.loading ? 'Creating...' : 'Create'}</PermissionButton></footer></form></div>;
}

function IntegrationDetail({ selected, data, loading, error, onClose, onRefresh }: any) {
  const [mappingJson, setMappingJson] = useState('[]');
  const [credentialJson, setCredentialJson] = useState('{}');
  const mappings = useQuery({ queryKey: ['integration-mappings', selected.uuid], enabled: Boolean(selected), queryFn: async () => (await platformClient.get<{ mappings: unknown[] }>('/tenant-integrations/' + id(selected.uuid) + '/mappings')).data });
  const limits = useQuery({ queryKey: ['integration-limits', selected.uuid], enabled: Boolean(selected), queryFn: async () => (await platformClient.get<{ rate_limits: unknown[] }>('/tenant-integrations/' + id(selected.uuid) + '/rate-limits')).data });
  const saveMappings = useMutation({ mutationFn: () => platformClient.put('/tenant-integrations/' + id(selected.uuid) + '/mappings', { mappings: JSON.parse(mappingJson) }), onSuccess: onRefresh });
  const rotate = useMutation({ mutationFn: () => platformClient.post('/tenant-integrations/' + id(selected.uuid) + '/credentials', { credentials: parseJson(credentialJson) }), onSuccess: () => setCredentialJson('{}') });
  return <div className="dashboard-panel"><PageHeader title={data?.integration?.name || selected.name || 'Integration detail'} description={[selected.provider_name, selected.tenant_name].filter(Boolean).join(' · ') || 'Integration details'} actions={<Button variant="ghost" onClick={onClose}>Close</Button>} />{loading ? <div className="surface-state">Loading integration details...</div> : null}{error ? <div className="surface-error">{errorText(error)}</div> : null}{data ? <><h3>Credential metadata</h3><ResourceTable rows={data.credentials || []} columns={['key', 'expires_at']} /><h3>Related webhooks</h3><ResourceTable rows={data.webhooks || []} columns={['event', 'status']} /><h3>Related sync jobs</h3><ResourceTable rows={data.sync_jobs || []} columns={['sync_type', 'direction', 'status']} /><h3>Field mappings</h3><textarea value={mappingJson} onChange={(event) => setMappingJson(event.target.value)} placeholder={JSON.stringify(mappings.data?.mappings || [], null, 2)} /><PermissionButton guard="platform" permission="integration.edit" type="button" disabled={saveMappings.isPending} onClick={() => saveMappings.mutate()}>Save complete mapping list</PermissionButton><h3>Rotate credentials</h3><textarea value={credentialJson} onChange={(event) => setCredentialJson(event.target.value)} /><PermissionButton guard="platform" permission="integration.edit" type="button" disabled={rotate.isPending} onClick={() => rotate.mutate()}>Rotate credentials</PermissionButton><h3>Rate limits</h3><ResourceTable rows={(limits.data?.rate_limits || []) as Array<Record<string, unknown>>} columns={['window_start', 'window_end', 'limit_count', 'used_count']} /></> : null}</div>;
}

function ResourceTable({ rows, columns }: { rows: Array<Record<string, unknown>>; columns: string[] }) {
  return <table className="data-table"><thead><tr>{columns.map((column) => <th key={column}>{column.replace(/_/g, ' ')}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={String(row.id || index)}>{columns.map((column) => <td key={column}>{String(relationshipValue(row, column, row[column]) ?? '-')}</td>)}</tr>)}</tbody></table>;
}
function Pager({ page, meta, onPage }: { page: number; meta?: { current_page?: number; last_page?: number; total?: number }; onPage: (page: number) => void }) {
  return <footer className="enterprise-form__footer"><span>{meta?.total || 0} record(s)</span><span><Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</Button>{' '}<Button size="sm" variant="secondary" disabled={page >= (meta?.last_page || 1)} onClick={() => onPage(page + 1)}>Next</Button></span></footer>;
}
