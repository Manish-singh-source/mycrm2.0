import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader, StatusBadge } from '@/shared/components/layout';
import { Button, PermissionButton } from '@/shared/components/ui';
import { platformClient } from '@/lib/api/platformClient';
import { ApiError } from '@/lib/api/apiError';

type Tenant = { uuid: string; organization_name?: string; status?: string; steps?: number; trial_ends_at?: string; id?: number };
type Step = { step_code: string; status?: string; metadata?: Record<string, unknown> };
type ListResponse = { data: Tenant[]; meta?: { current_page?: number; last_page?: number; total?: number; per_page?: number } };

const pathId = (id: string) => encodeURIComponent(id);
const message = (error: unknown) => error instanceof ApiError ? error.message : error instanceof Error ? error.message : 'Request failed.';

function usePaged(path: string, page: number, perPage: number) {
  return useQuery({ queryKey: [path, page, perPage], queryFn: async (): Promise<ListResponse> => {
    const response = await platformClient.get<Tenant[]>(path, { query: { page, per_page: perPage } as any });
    return { data: response.data || [], meta: response.meta };
  }});
}

export function PlatformOnboardingPage() {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Tenant | null>(null);
  const [detail, setDetail] = useState<{ tenant?: Tenant; steps?: Step[] } | null>(null);
  const query = usePaged('/onboarding/tenants', page, 25);
  const detailQuery = useQuery({ queryKey: ['onboarding-detail', selected?.uuid], enabled: Boolean(selected), queryFn: async () => {
    const response = await platformClient.get<{ tenant: Tenant; steps: Step[] }>('/onboarding/tenants/' + pathId(selected!.uuid));
    setDetail(response.data);
    return response.data;
  }});
  const save = useMutation({ mutationFn: ({ step, status }: { step: string; status: string }) =>
    platformClient.put('/onboarding/tenants/' + pathId(selected!.uuid) + '/steps/' + pathId(step), { status, metadata: { source: 'onboarding_screen' } }),
    onSuccess: (response) => {
      const step = (response.data as { step: Step }).step;
      setDetail((current) => current ? { ...current, steps: [...(current.steps || []).filter((item) => item.step_code !== step.step_code), step] } : current);
      void query.refetch();
    }
  });
  const rows = query.data?.data || [];
  const meta = query.data?.meta;
  return <section className="enterprise-module-page platform-operations-page">
    <PageHeader title="Onboarding" description="Track tenant onboarding progress and update individual steps." />
    {query.isError ? <div className="surface-error">{message(query.error)}</div> : null}
    <div className="dashboard-panel">
      <table className="data-table"><thead><tr><th>Organization</th><th>Status</th><th>Recorded steps</th><th>Action</th></tr></thead>
        <tbody>{rows.map((row) => <tr key={row.uuid}><td>{row.organization_name || '-'}</td><td><StatusBadge>{row.status || 'unknown'}</StatusBadge></td><td>{row.steps ?? 0}</td><td><Button size="sm" variant="secondary" onClick={() => { setSelected(row); setDetail(null); }}>View onboarding</Button></td></tr>)}</tbody>
      </table>
      {!query.isLoading && rows.length === 0 ? <div className="empty-state">No onboarding tenants found.</div> : null}
      <footer className="enterprise-form__footer"><span>{meta?.total ?? rows.length} tenant(s)</span><span><Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button> <Button size="sm" variant="secondary" disabled={page >= (meta?.last_page || 1)} onClick={() => setPage(page + 1)}>Next</Button></span></footer>
    </div>
    {selected ? <div className="dashboard-panel">
      <PageHeader title={detail?.tenant?.organization_name || selected.organization_name || 'Tenant onboarding'} description={selected.uuid} actions={<Button variant="ghost" onClick={() => setSelected(null)}>Close</Button>} />
      {detailQuery.isLoading ? <div className="surface-state">Loading onboarding details...</div> : null}
      {detailQuery.isError ? <div className="surface-error">{message(detailQuery.error)}</div> : null}
      {(detail?.steps || []).map((step) => <div className="record-list" key={step.step_code}><article><strong>{step.step_code}</strong><span><select value={step.status || 'pending'} disabled={save.isPending} onChange={(event) => save.mutate({ step: step.step_code, status: event.target.value })}><option>pending</option><option>in_progress</option><option>completed</option><option>skipped</option></select></span></article></div>)}
      {detail && !(detail.steps || []).length ? <div className="empty-state">No onboarding steps recorded.</div> : null}
      {save.isError ? <div className="surface-error">{message(save.error)}</div> : null}
    </div> : null}
  </section>;
}

export function PlatformTrialsPage() {
  const [page, setPage] = useState(1);
  const [extend, setExtend] = useState<Tenant | null>(null);
  const [date, setDate] = useState('');
  const queryClient = useQueryClient();
  const query = usePaged('/trials', page, 25);
  const mutation = useMutation({ mutationFn: async (action: { type: 'extend' | 'convert'; tenant: Tenant }) => {
    if (action.type === 'extend') return platformClient.post('/trials/' + pathId(action.tenant.uuid) + '/extend', { trial_ends_at: date, reason: 'Platform admin extension' });
    return platformClient.post('/trials/' + pathId(action.tenant.uuid) + '/convert', {});
  }, onSuccess: () => { setExtend(null); setDate(''); void queryClient.invalidateQueries({ queryKey: ['/trials'] }); void query.refetch(); }});
  const rows = query.data?.data || [];
  const meta = query.data?.meta;
  return <section className="enterprise-module-page platform-operations-page">
    <PageHeader title="Trials" description="Manage active tenant trials, extensions, and conversion to active." />
    {query.isError ? <div className="surface-error">{message(query.error)}</div> : null}
    <div className="dashboard-panel"><table className="data-table"><thead><tr><th>Organization</th><th>Status</th><th>Trial ends</th><th>Days remaining</th><th>Actions</th></tr></thead>
      <tbody>{rows.map((row) => <tr key={row.uuid}><td>{row.organization_name || '-'}</td><td><StatusBadge tone="warning">{row.status || 'trial'}</StatusBadge></td><td>{row.trial_ends_at || '-'}</td><td>{row.trial_ends_at ? Math.max(0, Math.ceil((new Date(row.trial_ends_at.replace(' ', 'T')).getTime() - Date.now()) / 86400000)) : '-'}</td><td><PermissionButton guard="platform" permission="subscription.edit" size="sm" type="button" variant="secondary" onClick={() => { setExtend(row); setDate((row.trial_ends_at || '').slice(0, 10)); }}>Extend</PermissionButton>{' '}<PermissionButton guard="platform" permission="subscription.edit" size="sm" type="button" onClick={() => { if (window.confirm('Convert this trial to active?')) mutation.mutate({ type: 'convert', tenant: row }); }}>Convert</PermissionButton></td></tr>)}</tbody>
    </table>{!query.isLoading && rows.length === 0 ? <div className="empty-state">No active trials found.</div> : null}
    <footer className="enterprise-form__footer"><span>{meta?.total ?? rows.length} trial(s)</span><span><Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button> <Button size="sm" variant="secondary" disabled={page >= (meta?.last_page || 1)} onClick={() => setPage(page + 1)}>Next</Button></span></footer></div>
    {extend ? <div className="dashboard-panel"><PageHeader title="Extend trial" description={extend.organization_name || extend.uuid} /><form className="enterprise-form" onSubmit={(event) => { event.preventDefault(); mutation.mutate({ type: 'extend', tenant: extend }); }}><label><span>Trial ends at</span><input required type="date" value={date} min={new Date().toISOString().slice(0, 10)} onChange={(event) => setDate(event.target.value)} /></label>{mutation.isError ? <div className="surface-error">{message(mutation.error)}</div> : null}<footer className="enterprise-form__footer"><Button type="button" variant="secondary" onClick={() => setExtend(null)}>Cancel</Button><PermissionButton guard="platform" permission="subscription.edit" type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Saving...' : 'Save extension'}</PermissionButton></footer></form></div> : null}
  </section>;
}
