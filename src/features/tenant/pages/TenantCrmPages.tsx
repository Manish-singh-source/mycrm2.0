import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Banknote, Copy, Download, Mail, Merge, Plus, Star, Upload, UserCheck } from 'lucide-react';

import { ApiError } from '@/lib/api/apiError';
import type { ApiQuery } from '@/lib/api/apiTypes';
import { tenantQueryKeys } from '@/features/tenant/api/tenantQueryKeys';
import { tenantAccessApi } from '@/features/tenant/api/tenantAccessApi';
import { tenantCrmApi, type CrmRecord } from '@/features/tenant/api/tenantCrmApi';
import { TENANT_ROUTES } from '@/features/tenant/routes/tenantRoutes';
import { DataTable, RowActionMenu, type DataTableColumn } from '@/shared/components/data-table';
import { AppDrawer } from '@/shared/components/drawer';
import { PageHeader, StatusBadge, Tabs } from '@/shared/components/layout';
import { AppModal } from '@/shared/components/modal';
import { Button, PermissionButton } from '@/shared/components/ui';

const tenantKey = 'current';
const partyTypeLabels = { clients: 'Client', vendors: 'Vendor', leads: 'Lead' } as const;
type PartyResource = keyof typeof partyTypeLabels;
type ModalState =
  | null
  | 'create'
  | 'edit'
  | 'contact'
  | 'address'
  | 'portal'
  | 'email'
  | 'merge'
  | 'import'
  | 'export'
  | 'bank'
  | 'rating'
  | 'document'
  | 'stage'
  | 'owner'
  | 'activity'
  | 'meeting'
  | 'lost'
  | 'convert'
  | 'duplicate';

export function TenantClientsListPage() {
  return <PartyListPage resource="clients" mode="list" />;
}

export function TenantClientsGridPage() {
  return <PartyListPage resource="clients" mode="grid" />;
}

export function TenantClientCreatePage() {
  return <PartyEditorPage resource="clients" mode="create" />;
}

export function TenantClientEditPage() {
  return <PartyEditorPage resource="clients" mode="edit" />;
}

export function TenantClientViewPage() {
  return <PartyViewPage resource="clients" />;
}

export function TenantVendorsListPage() {
  return <PartyListPage resource="vendors" mode="list" />;
}

export function TenantVendorsGridPage() {
  return <PartyListPage resource="vendors" mode="grid" />;
}

export function TenantVendorCreatePage() {
  return <PartyEditorPage resource="vendors" mode="create" />;
}

export function TenantVendorEditPage() {
  return <PartyEditorPage resource="vendors" mode="edit" />;
}

export function TenantVendorViewPage() {
  return <PartyViewPage resource="vendors" />;
}

export function TenantLeadsDashboardPage() {
  const query = useQuery({ queryKey: tenantQueryKeys.resource(tenantKey, 'leads-dashboard'), queryFn: tenantCrmApi.leads.dashboard });
  const dashboard = query.data?.data.dashboard ?? {};
  const cards = summaryCards((dashboard.cards as Record<string, unknown>) ?? {});
  return (
    <section className="enterprise-module-page">
      <PageHeader title="Leads Dashboard" description="Live lead pipeline summary from lead profile and activity tables." actions={<HeaderLinks base="leads" />} />
      <div className="summary-grid">{cards.map((card) => <article className="summary-card" key={card.label}><span>{card.label}</span><strong>{displayValue(card.value)}</strong></article>)}</div>
      <div className="settings-grid">
        <RecordList title="By Stage" rows={asRows(dashboard.by_stage)} />
        <RecordList title="By Priority" rows={asRows(dashboard.by_priority)} />
        <RecordList title="Upcoming Follow-Ups" rows={asRows(dashboard.upcoming_follow_ups)} />
      </div>
    </section>
  );
}

export function TenantLeadsListPage() {
  return <LeadListPage mode="list" />;
}

export function TenantLeadsGridPage() {
  return <LeadListPage mode="grid" />;
}

export function TenantLeadsKanbanPage() {
  const navigate = useNavigate();
  const query = useQuery({ queryKey: tenantQueryKeys.resource(tenantKey, 'leads-kanban'), queryFn: tenantCrmApi.leads.kanban });
  const columns = Object.entries(query.data?.data.kanban ?? {});
  return (
    <section className="enterprise-module-page">
      <PageHeader title="Lead Kanban" description="Pipeline cards grouped by current stage." actions={<HeaderLinks base="leads" />} />
      {query.isLoading ? <div className="surface-state">Loading kanban...</div> : null}
      <div className="kanban-board">
        {columns.length === 0 ? <div className="empty-state">No lead stages returned.</div> : null}
        {columns.map(([stage, payload]) => (
          <section className="kanban-column" key={stage}>
            <header><strong>{stage === 'null' ? 'No Stage' : `Stage ${stage}`}</strong><span>{payload.total} leads</span></header>
            {payload.leads.map((lead) => (
              <button key={idOf(lead)} type="button" className="kanban-card" onClick={() => navigate(`../leads/${idOf(lead)}`)}>
                <strong>{textOf(lead, ['display_name'], 'Lead')}</strong>
                <span>{money(lead.expected_value)} - {displayValue(lead.probability)}%</span>
              </button>
            ))}
          </section>
        ))}
      </div>
    </section>
  );
}

export function TenantLeadCreatePage() {
  return <PartyEditorPage resource="leads" mode="create" />;
}

export function TenantLeadEditPage() {
  return <PartyEditorPage resource="leads" mode="edit" />;
}

export function TenantLeadViewPage() {
  return <LeadViewPage />;
}

function PartyListPage({ resource, mode }: { resource: Exclude<PartyResource, 'leads'>; mode: 'list' | 'grid' }) {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const query = usePagedQuery(resource, tenantCrmApi[resource].list);
  const [selected, setSelected] = useState<CrmRecord | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  const title = `${partyTypeLabels[resource]}s`;
  const open = (row: CrmRecord) => navigate(idOf(row));
  return (
    <section className="enterprise-module-page">
      <PageHeader
        title={title}
        description={`Live ${title.toLowerCase()} from party and ${resource.slice(0, -1)} profile tables.`}
        actions={<><HeaderLinks base={resource} /><PermissionButton guard="tenant" permission={`${resource.slice(0, -1)}.create`} type="button" onClick={() => setModal('create')}><Plus size={16} aria-hidden />{partyTypeLabels[resource]}</PermissionButton></>}
      />
      {mode === 'grid' ? (
        <RecordGrid rows={query.rows} loading={query.isLoading} onOpen={open} />
      ) : (
        <DataTable
          columns={[...partyColumns(resource, open, (row, action) => { setSelected(row); setModal(action); }), actionColumn((row) => <RowActionMenu label={`Open actions for ${textOf(row, ['display_name', 'email'], partyTypeLabels[resource])}`} items={[{ label: 'View', onClick: () => open(row) }, { label: 'Edit', onClick: () => { setSelected(row); setModal('edit'); } }, { label: 'Email', onClick: () => { setSelected(row); setModal('email'); } }]} />)]}
          data={query.rows}
          getRowId={idOf}
          loading={query.isLoading}
          error={query.error}
          searchValue={query.search}
          onSearchChange={query.setSearch}
          onOpenImport={() => setModal('import')}
          onOpenExport={() => setModal('export')}
          page={query.page}
          perPage={25}
          total={query.total}
          onPageChange={query.setPage}
        />
      )}
      <PartyModal resource={resource} open={modal === 'create' || modal === 'edit'} record={modal === 'edit' ? selected : null} onClose={() => setModal(null)} onSaved={() => navigate(TENANT_ROUTES.crm[resource](tenantSlug))} />
      <MergeModal resource={resource} open={modal === 'merge'} onClose={() => setModal(null)} />
      <ImportExportModal resource={resource} type="import" open={modal === 'import'} onClose={() => setModal(null)} />
      <ImportExportModal resource={resource} type="export" open={modal === 'export'} onClose={() => setModal(null)} />
      <EmailDrawer open={modal === 'email'} party={selected} onClose={() => setModal(null)} />
    </section>
  );
}

function LeadListPage({ mode }: { mode: 'list' | 'grid' }) {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const query = usePagedQuery('leads', tenantCrmApi.leads.list);
  const [selected, setSelected] = useState<CrmRecord | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  const open = (row: CrmRecord) => navigate(idOf(row));
  return (
    <section className="enterprise-module-page">
      <PageHeader title="Leads" description="Lead list, grid, kanban, conversion, and duplicate management." actions={<><HeaderLinks base="leads" /><PermissionButton guard="tenant" permission="lead.create" type="button" onClick={() => setModal('create')}><Plus size={16} aria-hidden />Lead</PermissionButton></>} />
      {mode === 'grid' ? (
        <RecordGrid rows={query.rows} loading={query.isLoading} onOpen={open} />
      ) : (
        <DataTable
          columns={[...genericColumns(['lead_number', 'display_name', 'email', 'expected_value', 'probability', 'expected_close_date']), actionColumn((row) => <RowActionMenu label={`Open actions for ${textOf(row, ['display_name', 'lead_number'], 'lead')}`} items={[{ label: 'View', onClick: () => open(row) }, { label: 'Owner', onClick: () => { setSelected(row); setModal('owner'); } }, { label: 'Stage', onClick: () => { setSelected(row); setModal('stage'); } }, { label: 'Won', onClick: () => { setSelected(row); setModal('convert'); } }, { label: 'Lost', danger: true, separatorBefore: true, onClick: () => { setSelected(row); setModal('lost'); } }]} />)]}
          data={query.rows}
          getRowId={idOf}
          loading={query.isLoading}
          error={query.error}
          searchValue={query.search}
          onSearchChange={query.setSearch}
          onOpenImport={() => setModal('import')}
          onOpenExport={() => setModal('export')}
          page={query.page}
          perPage={25}
          total={query.total}
          onPageChange={query.setPage}
        />
      )}
      <PartyModal resource="leads" open={modal === 'create'} record={null} onClose={() => setModal(null)} onSaved={() => navigate(TENANT_ROUTES.crm.leads(tenantSlug))} />
      <LeadActionModal action={modal} lead={selected} onClose={() => setModal(null)} />
      <MergeModal resource="leads" open={modal === 'merge'} onClose={() => setModal(null)} />
      <ImportExportModal resource="leads" type="import" open={modal === 'import'} onClose={() => setModal(null)} />
      <ImportExportModal resource="leads" type="export" open={modal === 'export'} onClose={() => setModal(null)} />
    </section>
  );
}

function PartyEditorPage({ resource, mode }: { resource: PartyResource; mode: 'create' | 'edit' }) {
  const { tenantSlug, id = '' } = useParams();
  const navigate = useNavigate();
  const query = useQuery({ queryKey: tenantQueryKeys.detail(tenantKey, resource, id), queryFn: () => tenantCrmApi[resource].detail(id), enabled: mode === 'edit' && Boolean(id) });
  return (
    <section className="enterprise-module-page">
      <PageHeader title={`${mode === 'create' ? 'Create' : 'Edit'} ${partyTypeLabels[resource]}`} />
      <PartyForm resource={resource} record={query.data as CrmRecord | undefined} onSaved={() => navigate(TENANT_ROUTES.crm[resource](tenantSlug))} />
    </section>
  );
}

function PartyViewPage({ resource }: { resource: Exclude<PartyResource, 'leads'> }) {
  const { id = '' } = useParams();
  const query = useQuery({ queryKey: tenantQueryKeys.detail(tenantKey, resource, id), queryFn: () => tenantCrmApi[resource].detail(id), enabled: Boolean(id) });
  const record = query.data as CrmRecord | undefined;
  const [tab, setTab] = useState(resource === 'clients' ? 'overview' : 'overview');
  const [modal, setModal] = useState<ModalState>(null);
  return (
    <section className="enterprise-module-page">
      <PageHeader title={bundleText(record, 'display_name', partyTypeLabels[resource])} description={bundleText(record, 'email', 'No email')} actions={<PartyViewActions resource={resource} onModal={setModal} />} />
      <Tabs tabs={(resource === 'clients' ? clientTabs : vendorTabs).map((item) => ({ id: item[0], label: item[1] }))} activeId={tab} onChange={setTab} ariaLabel={`${resource} tabs`} />
      <PartyTabPanel resource={resource} id={id} record={record} tab={tab} loading={query.isLoading} onModal={setModal} />
      <ContactModal resource={resource} parentId={id} open={modal === 'contact'} onClose={() => setModal(null)} />
      <AddressModal resource={resource} parentId={id} open={modal === 'address'} onClose={() => setModal(null)} />
      <PortalModal parentId={id} open={modal === 'portal'} contacts={asRows(record?.contacts)} onClose={() => setModal(null)} />
      <EmailDrawer open={modal === 'email'} party={record?.party as CrmRecord | undefined} onClose={() => setModal(null)} />
      <DocumentModal parentType="party" parent={record?.party as CrmRecord | undefined} open={modal === 'document'} onClose={() => setModal(null)} />
      <VendorBankModal vendorId={id} open={modal === 'bank'} onClose={() => setModal(null)} />
      <VendorRatingModal vendorId={id} open={modal === 'rating'} rating={Number((record?.profile as CrmRecord | undefined)?.rating ?? 0)} onClose={() => setModal(null)} />
    </section>
  );
}

function LeadViewPage() {
  const { id = '' } = useParams();
  const query = useQuery({ queryKey: tenantQueryKeys.detail(tenantKey, 'leads', id), queryFn: () => tenantCrmApi.leads.detail(id), enabled: Boolean(id) });
  const lead = query.data as CrmRecord | undefined;
  const [tab, setTab] = useState('overview');
  const [modal, setModal] = useState<ModalState>(null);
  return (
    <section className="enterprise-module-page">
      <PageHeader title={bundleText(lead, 'display_name', 'Lead')} description={bundleText(lead, 'email', 'No email')} actions={<LeadViewActions onModal={setModal} />} />
      <Tabs tabs={leadTabs.map((item) => ({ id: item[0], label: item[1] }))} activeId={tab} onChange={setTab} ariaLabel="Lead tabs" />
      <LeadTabPanel id={id} lead={lead} tab={tab} loading={query.isLoading} onModal={setModal} />
      <ContactModal resource="leads" parentId={id} open={modal === 'contact'} onClose={() => setModal(null)} />
      <AddressModal resource="leads" parentId={id} open={modal === 'address'} onClose={() => setModal(null)} />
      <EmailDrawer open={modal === 'email'} party={lead?.party as CrmRecord | undefined} onClose={() => setModal(null)} />
      <DocumentModal parentType="party" parent={lead?.party as CrmRecord | undefined} open={modal === 'document'} onClose={() => setModal(null)} />
      <LeadActionModal action={modal} lead={lead?.party as CrmRecord | undefined} onClose={() => setModal(null)} leadId={id} />
    </section>
  );
}

function PartyTabPanel({ resource, id, record, tab, loading, onModal }: { resource: Exclude<PartyResource, 'leads'>; id: string; record?: CrmRecord; tab: string; loading?: boolean; onModal: (modal: ModalState) => void }) {
  const relation = relationFor(resource, tab);
  const related = useQuery({ queryKey: tenantQueryKeys.related(tenantKey, resource, id, tab), queryFn: () => relation === 'activity' ? tenantCrmApi[resource].activity(id) : tenantCrmApi[resource].related(id, relation ?? tab), enabled: Boolean(id) && Boolean(relation) });
  const shared = useSharedTab(tab, record?.party as CrmRecord | undefined);
  if (loading) return <div className="surface-state">Loading details...</div>;
  if (tab === 'overview') return <BundleOverview bundle={record} />;
  if (tab === 'contacts') return <RecordList title="Contacts" rows={asRows(record?.contacts)} action={<Button type="button" onClick={() => onModal('contact')}><Plus size={16} aria-hidden />Contact</Button>} />;
  if (tab === 'addresses') return <RecordList title="Addresses" rows={asRows(record?.addresses)} action={<Button type="button" onClick={() => onModal('address')}><Plus size={16} aria-hidden />Address</Button>} />;
  if (tab === 'bank-accounts') return <RecordList title="Bank Accounts" rows={asRows(record?.bank_accounts)} action={<Button type="button" onClick={() => onModal('bank')}><Banknote size={16} aria-hidden />Bank Account</Button>} />;
  if (tab === 'documents' || tab === 'files') return <RecordList title={label(tab)} rows={shared.rows} loading={shared.loading} action={<Button type="button" onClick={() => onModal('document')}><Upload size={16} aria-hidden />Attach File</Button>} />;
  if (tab === 'notes') return <NotesPanel parent={record?.party as CrmRecord | undefined} />;
  if (tab === 'quotations' || tab === 'services-contracts') return <ImplementationPlaceholder title={label(tab)} />;
  return <RecordList title={label(tab)} rows={rowsFromResponse(related.data?.data, relation ?? tab)} loading={related.isLoading} />;
}

function LeadTabPanel({ id, lead, tab, loading, onModal }: { id: string; lead?: CrmRecord; tab: string; loading?: boolean; onModal: (modal: ModalState) => void }) {
  const activities = useQuery({ queryKey: tenantQueryKeys.related(tenantKey, 'leads', id, 'activities'), queryFn: () => tenantCrmApi.leads.activities.list(id), enabled: Boolean(id) && ['activities', 'follow-ups', 'calls', 'meetings'].includes(tab) });
  const timeline = useQuery({ queryKey: tenantQueryKeys.related(tenantKey, 'leads', id, 'activity'), queryFn: () => tenantCrmApi.leads.activity(id), enabled: Boolean(id) && tab === 'timeline' });
  const shared = useSharedTab(tab, lead?.party as CrmRecord | undefined);
  if (loading) return <div className="surface-state">Loading lead...</div>;
  if (tab === 'overview') return <BundleOverview bundle={lead} />;
  if (tab === 'contacts') return <RecordList title="Contacts" rows={asRows(lead?.contacts)} action={<Button type="button" onClick={() => onModal('contact')}><Plus size={16} aria-hidden />Contact</Button>} />;
  if (tab === 'activities' || tab === 'follow-ups' || tab === 'calls' || tab === 'meetings') {
    const rows = filterActivities(asRows(activities.data?.data.activities), tab);
    return <RecordList title={label(tab)} rows={rows} loading={activities.isLoading} action={<Button type="button" onClick={() => onModal(tab === 'meetings' ? 'meeting' : 'activity')}><Plus size={16} aria-hidden />{tab === 'meetings' ? 'Meeting' : 'Activity'}</Button>} />;
  }
  if (tab === 'emails') return <ImplementationPlaceholder title="Emails" description="Email composition is available from the page actions. A dedicated email-log relationship table is not present for leads." />;
  if (tab === 'tasks' || tab === 'quotations') return <ImplementationPlaceholder title={label(tab)} />;
  if (tab === 'documents') return <RecordList title="Documents" rows={shared.rows} loading={shared.loading} action={<Button type="button" onClick={() => onModal('document')}><Upload size={16} aria-hidden />Attach File</Button>} />;
  if (tab === 'notes') return <NotesPanel parent={lead?.party as CrmRecord | undefined} />;
  if (tab === 'conversion-history') return <RecordList title="Conversion History" rows={asRows(lead?.conversion_history)} />;
  if (tab === 'timeline') return <RecordList title="Timeline" rows={timeline.data?.data.activity ?? []} loading={timeline.isLoading} />;
  return <RecordList title={label(tab)} rows={[]} />;
}

function PartyForm({ resource, record, onSaved }: { resource: PartyResource; record?: CrmRecord; onSaved: () => void }) {
  const queryClient = useQueryClient();
  const users = useQuery({ queryKey: tenantQueryKeys.list(tenantKey, 'crm-users'), queryFn: () => tenantAccessApi.users.list({ per_page: 100 }) });
  const lookups = useLookupOptions();
  const initial = useMemo(() => bundleToForm(resource, record), [record, resource]);
  const [form, setForm] = useState(initial);
  const mutation = useMutation({
    mutationFn: () => record ? tenantCrmApi[resource].update(idOf(record.party as CrmRecord), formToPayload(resource, form)) : tenantCrmApi[resource].create(formToPayload(resource, form)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tenantQueryKeys.resource(tenantKey, resource) });
      onSaved();
    }
  });
  function submit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate();
  }
  return (
    <form className="settings-panel" onSubmit={submit}>
      <div className="form-grid form-grid--two">
        <SimpleInput label="Display Name" value={form.display_name} onChange={(display_name) => setForm({ ...form, display_name })} required />
        <SimpleInput label="Legal Name" value={form.legal_name} onChange={(legal_name) => setForm({ ...form, legal_name })} />
        <SimpleInput label="Email" type="email" value={form.email} onChange={(email) => setForm({ ...form, email })} />
        <SimpleInput label="Phone" value={form.phone} onChange={(phone) => setForm({ ...form, phone })} />
        <SimpleInput label="Website" value={form.website} onChange={(website) => setForm({ ...form, website })} />
        <SelectInput label="Owner" value={form.owner_user_id} onChange={(owner_user_id) => setForm({ ...form, owner_user_id })} options={users.data?.data ?? []} labelKeys={['display_name', 'email']} />
        {resource === 'clients' ? <ClientFields form={form} setForm={(next) => setForm({ ...form, ...next })} users={users.data?.data ?? []} /> : null}
        {resource === 'vendors' ? <VendorFields form={form} setForm={(next) => setForm({ ...form, ...next })} users={users.data?.data ?? []} categories={lookups.vendorCategories} /> : null}
        {resource === 'leads' ? <LeadFields form={form} setForm={(next) => setForm({ ...form, ...next })} stages={lookups.leadStages} priorities={lookups.leadPriorities} /> : null}
      </div>
      {mutation.error ? <div className="surface-error">{errorMessage(mutation.error)}</div> : null}
      <div className="surface-footer"><Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Saving...' : 'Save'}</Button></div>
    </form>
  );
}

function PartyModal({ resource, open, record, onClose, onSaved }: { resource: Exclude<PartyResource, 'leads'> | 'leads'; open: boolean; record: CrmRecord | null; onClose: () => void; onSaved: () => void }) {
  return <AppModal open={open} onClose={onClose} title={`${record ? 'Edit' : 'Create'} ${partyTypeLabels[resource]}`} size="lg"><PartyForm resource={resource} record={record ?? undefined} onSaved={() => { onClose(); onSaved(); }} /></AppModal>;
}

function ContactModal({ resource, parentId, open, onClose }: { resource: PartyResource; parentId: string; open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(contactForm());
  const mutation = useMutation({
    mutationFn: () => tenantCrmApi[resource].contacts.create(parentId, normalizeForm(form)),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: tenantQueryKeys.detail(tenantKey, resource, parentId) }); setForm(contactForm()); onClose(); }
  });
  return (
    <AppModal open={open} onClose={onClose} title="Add Contact" footer={<ModalFooter onCancel={onClose} onSave={() => mutation.mutate()} loading={mutation.isPending} />}>
      <FormFields form={form} fields={['first_name', 'last_name', 'email', 'mobile', 'phone', 'designation', 'department', 'is_primary']} onChange={(next) => setForm({ ...form, ...next })} />
      {mutation.error ? <div className="surface-error">{errorMessage(mutation.error)}</div> : null}
    </AppModal>
  );
}

function AddressModal({ resource, parentId, open, onClose }: { resource: PartyResource; parentId: string; open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(addressForm());
  const mutation = useMutation({
    mutationFn: () => tenantCrmApi[resource].addresses.create(parentId, normalizeForm(form)),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: tenantQueryKeys.detail(tenantKey, resource, parentId) }); setForm(addressForm()); onClose(); }
  });
  return (
    <AppModal open={open} onClose={onClose} title="Add Address" footer={<ModalFooter onCancel={onClose} onSave={() => mutation.mutate()} loading={mutation.isPending} />}>
      <FormFields form={form} fields={['address_type', 'address_line_1', 'address_line_2', 'postal_code', 'is_default']} onChange={(next) => setForm({ ...form, ...next })} />
      {mutation.error ? <div className="surface-error">{errorMessage(mutation.error)}</div> : null}
    </AppModal>
  );
}

function PortalModal({ parentId, contacts, open, onClose }: { parentId: string; contacts: CrmRecord[]; open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [contactId, setContactId] = useState('');
  const selected = contacts.find((contact) => idOf(contact) === contactId);
  const mutation = useMutation({
    mutationFn: () => tenantCrmApi.clients.contacts.update(parentId, contactId, { ...selected, portal_enabled: true, create_portal_user: true }),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: tenantQueryKeys.detail(tenantKey, 'clients', parentId) }); onClose(); }
  });
  return (
    <AppModal open={open} onClose={onClose} title="Portal Access" footer={<ModalFooter onCancel={onClose} onSave={() => mutation.mutate()} loading={mutation.isPending} label="Enable Portal" />}>
      <SelectInput label="Client Contact" value={contactId} onChange={setContactId} options={contacts} labelKeys={['display_name', 'first_name', 'email']} />
      <p className="surface-state">This enables portal access and creates or updates the linked client user using the contact email.</p>
      {mutation.error ? <div className="surface-error">{errorMessage(mutation.error)}</div> : null}
    </AppModal>
  );
}

function EmailDrawer({ open, party, onClose }: { open: boolean; party?: CrmRecord | null; onClose: () => void }) {
  const [form, setForm] = useState({ to: textOf(party, ['email']), subject: '', body: '' });
  const mutation = useMutation({ mutationFn: () => tenantCrmApi.email({ ...form, party_uuid: party?.uuid }), onSuccess: onClose });
  return (
    <AppDrawer open={open} onClose={onClose} title="Send Email" size="lg" footer={<ModalFooter onCancel={onClose} onSave={() => mutation.mutate()} loading={mutation.isPending} label="Queue Email" />}>
      <div className="form-grid">
        <SimpleInput label="To" type="email" value={form.to} onChange={(to) => setForm({ ...form, to })} required />
        <SimpleInput label="Subject" value={form.subject} onChange={(subject) => setForm({ ...form, subject })} required />
        <label><span>Body</span><textarea rows={8} value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} /></label>
      </div>
      {mutation.error ? <div className="surface-error">{errorMessage(mutation.error)}</div> : null}
    </AppDrawer>
  );
}

function VendorBankModal({ vendorId, open, onClose }: { vendorId: string; open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ bank_name: '', account_number: '', ifsc_code: '', routing_number: '', is_primary: 'false' });
  const mutation = useMutation({ mutationFn: () => tenantCrmApi.vendors.bankAccounts.create(vendorId, normalizeForm(form)), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: tenantQueryKeys.detail(tenantKey, 'vendors', vendorId) }); onClose(); } });
  return <AppModal open={open} onClose={onClose} title="Vendor Bank Account" footer={<ModalFooter onCancel={onClose} onSave={() => mutation.mutate()} loading={mutation.isPending} />}><FormFields form={form} fields={Object.keys(form)} onChange={(next) => setForm({ ...form, ...next })} />{form.account_number ? <p className="surface-state">Masked preview: {mask(form.account_number)}</p> : null}{mutation.error ? <div className="surface-error">{errorMessage(mutation.error)}</div> : null}</AppModal>;
}

function VendorRatingModal({ vendorId, rating, open, onClose }: { vendorId: string; rating: number; open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState(String(rating || ''));
  const mutation = useMutation({ mutationFn: () => tenantCrmApi.vendors.update(vendorId, { profile: { rating: value } }), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: tenantQueryKeys.detail(tenantKey, 'vendors', vendorId) }); onClose(); } });
  return <AppModal open={open} onClose={onClose} title="Vendor Rating" footer={<ModalFooter onCancel={onClose} onSave={() => mutation.mutate()} loading={mutation.isPending} />}><SimpleInput label="Rating out of 5" type="number" value={value} onChange={setValue} />{mutation.error ? <div className="surface-error">{errorMessage(mutation.error)}</div> : null}</AppModal>;
}

function DocumentModal({ parentType, parent, open, onClose }: { parentType: string; parent?: CrmRecord; open: boolean; onClose: () => void }) {
  const files = useQuery({ queryKey: tenantQueryKeys.list(tenantKey, 'crm-files'), queryFn: () => tenantCrmApi.files({ per_page: 100 }), enabled: open });
  const [file, setFile] = useState('');
  const [labelValue, setLabelValue] = useState('');
  const mutation = useMutation({ mutationFn: () => tenantCrmApi.attachments.create({ file_uuid: file, attachable_type: parentType, attachable_uuid: parent?.uuid, label: labelValue }), onSuccess: onClose });
  return <AppModal open={open} onClose={onClose} title="Upload Contract/Document" footer={<ModalFooter onCancel={onClose} onSave={() => mutation.mutate()} loading={mutation.isPending} label="Attach File" />}><SelectInput label="File" value={file} onChange={setFile} options={files.data?.data ?? []} labelKeys={['original_name', 'name']} /><SimpleInput label="Document Label" value={labelValue} onChange={setLabelValue} />{files.data?.data.length === 0 ? <div className="empty-state">No uploaded files are available. Upload files from Documents first.</div> : null}{mutation.error ? <div className="surface-error">{errorMessage(mutation.error)}</div> : null}</AppModal>;
}

function LeadActionModal({ action, lead, leadId, onClose }: { action: ModalState; lead?: CrmRecord | null; leadId?: string; onClose: () => void }) {
  const id = leadId || idOf(lead);
  const queryClient = useQueryClient();
  const users = useQuery({ queryKey: tenantQueryKeys.list(tenantKey, 'crm-users'), queryFn: () => tenantAccessApi.users.list({ per_page: 100 }), enabled: Boolean(action) });
  const clients = useQuery({ queryKey: tenantQueryKeys.list(tenantKey, 'crm-client-selector'), queryFn: () => tenantCrmApi.clients.list({ per_page: 100 }), enabled: action === 'convert' });
  const lookups = useLookupOptions(Boolean(action));
  const [form, setForm] = useState<Record<string, string>>({});
  const invalidate = async () => { await queryClient.invalidateQueries({ queryKey: tenantQueryKeys.resource(tenantKey, 'leads') }); await queryClient.invalidateQueries({ queryKey: tenantQueryKeys.detail(tenantKey, 'leads', id) }); onClose(); };
  const mutation = useMutation<unknown>({
    mutationFn: () => {
      if (action === 'owner') return tenantCrmApi.leads.update(id, { party: { owner_user_id: form.owner_user_id } });
      if (action === 'stage') return tenantCrmApi.leads.update(id, { profile: { stage_id: form.stage_id } });
      if (action === 'lost') return tenantCrmApi.leads.markLost(id, { lost_reason: form.lost_reason });
      if (action === 'convert') return tenantCrmApi.leads.convert(id, normalizeForm(form));
      if (action === 'duplicate') return tenantCrmApi.leads.duplicate(id, { lead_number: form.lead_number });
      if (action === 'activity' || action === 'meeting') return tenantCrmApi.leads.activities.create(id, { ...normalizeForm(form), activity_type: action === 'meeting' ? 'meeting' : form.activity_type || 'follow_up' });
      return Promise.resolve({});
    },
    onSuccess: invalidate
  });
  if (!['owner', 'stage', 'lost', 'convert', 'duplicate', 'activity', 'meeting'].includes(String(action))) return null;
  return (
    <AppModal open={Boolean(action)} onClose={onClose} title={leadActionTitle(action)} size={action === 'convert' ? 'lg' : 'md'} footer={<ModalFooter onCancel={onClose} onSave={() => mutation.mutate()} loading={mutation.isPending} label={action === 'convert' ? 'Mark Won / Convert' : 'Save'} />}>
      <div className="form-grid form-grid--two">
        {action === 'owner' ? <SelectInput label="Owner" value={form.owner_user_id ?? ''} onChange={(owner_user_id) => setForm({ ...form, owner_user_id })} options={users.data?.data ?? []} labelKeys={['display_name', 'email']} /> : null}
        {action === 'stage' ? <SelectInput label="Stage" value={form.stage_id ?? ''} onChange={(stage_id) => setForm({ ...form, stage_id })} options={lookups.leadStages} labelKeys={['name', 'code']} /> : null}
        {action === 'lost' ? <SimpleInput label="Lost Reason" value={form.lost_reason ?? ''} onChange={(lost_reason) => setForm({ ...form, lost_reason })} required /> : null}
        {action === 'duplicate' ? <SimpleInput label="New Lead Number" value={form.lead_number ?? ''} onChange={(lead_number) => setForm({ ...form, lead_number })} /> : null}
        {action === 'convert' ? <><SelectInput label="Existing Client" value={form.client_id ?? ''} onChange={(client_id) => setForm({ ...form, client_id })} options={clients.data?.data ?? []} labelKeys={['display_name', 'client_code', 'email']} /><SimpleInput label="New Client Code" value={form.client_code ?? ''} onChange={(client_code) => setForm({ ...form, client_code })} /><SelectInput label="Account Manager" value={form.account_manager_id ?? ''} onChange={(account_manager_id) => setForm({ ...form, account_manager_id })} options={users.data?.data ?? []} labelKeys={['display_name', 'email']} /><SimpleInput label="Conversion Note" value={form.conversion_note ?? ''} onChange={(conversion_note) => setForm({ ...form, conversion_note })} /></> : null}
        {action === 'activity' || action === 'meeting' ? <><SimpleInput label="Subject" value={form.subject ?? ''} onChange={(subject) => setForm({ ...form, subject })} required /><SimpleInput label="Activity Type" value={action === 'meeting' ? 'meeting' : form.activity_type ?? 'follow_up'} onChange={(activity_type) => setForm({ ...form, activity_type })} /><SimpleInput label="Scheduled At" type="datetime-local" value={form.scheduled_at ?? ''} onChange={(scheduled_at) => setForm({ ...form, scheduled_at })} /><SelectInput label="Assigned To" value={form.assigned_to ?? ''} onChange={(assigned_to) => setForm({ ...form, assigned_to })} options={users.data?.data ?? []} labelKeys={['display_name', 'email']} /></> : null}
      </div>
      {action === 'stage' ? <p className="surface-state">Confirming this change updates the lead stage immediately.</p> : null}
      {mutation.error ? <div className="surface-error">{errorMessage(mutation.error)}</div> : null}
    </AppModal>
  );
}

function MergeModal({ resource, open, onClose }: { resource: PartyResource; open: boolean; onClose: () => void }) {
  const query = useQuery({ queryKey: tenantQueryKeys.list(tenantKey, `${resource}-merge-selector`), queryFn: () => tenantCrmApi[resource].list({ per_page: 100 }), enabled: open });
  const [primary, setPrimary] = useState('');
  const [duplicates, setDuplicates] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const mutation = useMutation({
    mutationFn: () => resource === 'clients'
      ? tenantCrmApi.clients.merge({ primary_client_id: primary, duplicate_client_ids: duplicates, reason })
      : tenantCrmApi.leads.merge({ primary_lead_id: primary, duplicate_lead_ids: duplicates, reason }),
    onSuccess: onClose
  });
  return (
    <AppModal open={open} onClose={onClose} title={`${partyTypeLabels[resource]} Duplicate Merge Wizard`} size="lg" footer={<ModalFooter onCancel={onClose} onSave={() => mutation.mutate()} loading={mutation.isPending} label="Merge" />}>
      {resource === 'vendors' ? <ImplementationPlaceholder title="Vendor Merge" description="No vendor merge API is documented yet. Routes remain ready with vendor CRUD and tabs." /> : null}
      {resource !== 'vendors' ? <><SelectInput label="Primary Record" value={primary} onChange={setPrimary} options={query.data?.data ?? []} labelKeys={['display_name', 'lead_number', 'client_code', 'email']} /><MultiPicker title="Duplicate Records" rows={(query.data?.data ?? []).filter((row) => idOf(row) !== primary)} selectedIds={duplicates} onChange={setDuplicates} /><SimpleInput label="Merge Reason" value={reason} onChange={setReason} />{mutation.error ? <div className="surface-error">{errorMessage(mutation.error)}</div> : null}</> : null}
    </AppModal>
  );
}

function ImportExportModal({ resource, type, open, onClose }: { resource: PartyResource; type: 'import' | 'export'; open: boolean; onClose: () => void }) {
  const files = useQuery({ queryKey: tenantQueryKeys.list(tenantKey, 'crm-files'), queryFn: () => tenantCrmApi.files({ per_page: 100 }), enabled: open && type === 'import' });
  const [fileId, setFileId] = useState('');
  const [format, setFormat] = useState('csv');
  const mutation = useMutation({ mutationFn: () => type === 'import' ? tenantCrmApi[resource].import({ file_id: fileId }) : tenantCrmApi[resource].export({ format }), onSuccess: () => undefined });
  return (
    <AppModal open={open} onClose={onClose} title={`${type === 'import' ? 'Import' : 'Export'} ${partyTypeLabels[resource]}s`} footer={<ModalFooter onCancel={onClose} onSave={() => mutation.mutate()} loading={mutation.isPending} label={type === 'import' ? 'Queue Import' : 'Queue Export'} />}>
      {type === 'import' ? <SelectInput label="Import File" value={fileId} onChange={setFileId} options={files.data?.data ?? []} labelKeys={['original_name', 'name']} /> : <SimpleInput label="Format" value={format} onChange={setFormat} />}
      {mutation.data ? <JobResult data={mutation.data.data} /> : null}
      {mutation.error ? <div className="surface-error">{errorMessage(mutation.error)}</div> : null}
    </AppModal>
  );
}

function NotesPanel({ parent }: { parent?: CrmRecord }) {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: tenantQueryKeys.related(tenantKey, 'notes', idOf(parent), 'party'), queryFn: () => tenantCrmApi.notes.list({ notable_type: 'party', notable_uuid: parent?.uuid }), enabled: Boolean(parent?.uuid) });
  const [note, setNote] = useState('');
  const mutation = useMutation({ mutationFn: () => tenantCrmApi.notes.create({ notable_type: 'party', notable_uuid: parent?.uuid, note }), onSuccess: async () => { setNote(''); await queryClient.invalidateQueries({ queryKey: tenantQueryKeys.related(tenantKey, 'notes', idOf(parent), 'party') }); } });
  return <section className="settings-panel"><h2>Notes</h2><div className="form-grid"><label><span>New Note</span><textarea rows={4} value={note} onChange={(event) => setNote(event.target.value)} /></label><Button type="button" onClick={() => mutation.mutate()} disabled={mutation.isPending}>Add Note</Button></div><RecordList title="Saved Notes" rows={query.data?.data.notes ?? []} loading={query.isLoading} />{mutation.error ? <div className="surface-error">{errorMessage(mutation.error)}</div> : null}</section>;
}

function useSharedTab(tab: string, parent?: CrmRecord) {
  const query = useQuery({ queryKey: tenantQueryKeys.related(tenantKey, 'attachments', idOf(parent), tab), queryFn: () => tenantCrmApi.attachments.list({ attachable_type: 'party', attachable_uuid: parent?.uuid }), enabled: Boolean(parent?.uuid) && ['documents', 'files'].includes(tab) });
  return { rows: query.data?.data.attachments ?? [], loading: query.isLoading };
}

function useLookupOptions(enabled = true) {
  const query = useQuery({ queryKey: tenantQueryKeys.list(tenantKey, 'crm-lookups'), queryFn: () => tenantCrmApi.lookups({ groups: 'lead_stage,lead_priority,vendor_category' }), enabled });
  const rows = query.data?.data ?? [];
  return {
    leadStages: rows.filter((row) => row.group === 'lead_stage'),
    leadPriorities: rows.filter((row) => row.group === 'lead_priority'),
    vendorCategories: rows.filter((row) => row.group === 'vendor_category')
  };
}

function usePagedQuery(resource: string, fn: (query?: ApiQuery) => Promise<{ data: CrmRecord[]; total: number }>) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const query = useQuery({ queryKey: tenantQueryKeys.list(tenantKey, resource, { search, page, per_page: 25 }), queryFn: () => fn({ search, page, per_page: 25 }) });
  return { rows: query.data?.data ?? [], total: query.data?.total ?? 0, search, setSearch, page, setPage, isLoading: query.isLoading, error: query.error ? errorMessage(query.error) : undefined };
}

function PartyViewActions({ resource, onModal }: { resource: Exclude<PartyResource, 'leads'>; onModal: (modal: ModalState) => void }) {
  return <><Button type="button" variant="secondary" onClick={() => onModal('contact')}><Plus size={16} aria-hidden />Contact</Button><Button type="button" variant="secondary" onClick={() => onModal('address')}><Plus size={16} aria-hidden />Address</Button>{resource === 'clients' ? <Button type="button" variant="secondary" onClick={() => onModal('portal')}><UserCheck size={16} aria-hidden />Portal</Button> : null}<Button type="button" variant="secondary" onClick={() => onModal('email')}><Mail size={16} aria-hidden />Email</Button>{resource === 'vendors' ? <><Button type="button" variant="secondary" onClick={() => onModal('bank')}><Banknote size={16} aria-hidden />Bank</Button><Button type="button" variant="secondary" onClick={() => onModal('rating')}><Star size={16} aria-hidden />Rating</Button></> : null}<Link className="button button--secondary button--md" to="edit">Edit</Link></>;
}

function LeadViewActions({ onModal }: { onModal: (modal: ModalState) => void }) {
  return <><Button type="button" variant="secondary" onClick={() => onModal('owner')}>Owner</Button><Button type="button" variant="secondary" onClick={() => onModal('stage')}>Stage</Button><Button type="button" variant="secondary" onClick={() => onModal('activity')}>Follow-Up</Button><Button type="button" variant="secondary" onClick={() => onModal('meeting')}>Meeting</Button><Button type="button" variant="secondary" onClick={() => onModal('email')}><Mail size={16} aria-hidden />Email</Button><Button type="button" onClick={() => onModal('convert')}>Mark Won</Button><Button type="button" variant="danger" onClick={() => onModal('lost')}>Lost</Button><Button type="button" variant="secondary" onClick={() => onModal('duplicate')}><Copy size={16} aria-hidden />Duplicate</Button><Link className="button button--secondary button--md" to="edit">Edit</Link></>;
}

function HeaderLinks({ base }: { base: PartyResource }) {
  const { tenantSlug } = useParams();
  const route = TENANT_ROUTES.crm[base](tenantSlug);
  return <><Link className="button button--secondary button--md" to={route}>List</Link><Link className="button button--secondary button--md" to={`${route}/grid`}>Grid</Link>{base === 'leads' ? <><Link className="button button--secondary button--md" to={`${route}/dashboard`}>Dashboard</Link><Link className="button button--secondary button--md" to={`${route}/kanban`}>Kanban</Link></> : null}</>;
}

function BundleOverview({ bundle }: { bundle?: CrmRecord }) {
  return <div className="settings-grid"><section className="settings-panel"><h2>Identity</h2><DetailGrid record={scrub((bundle?.party as CrmRecord) ?? {})} /></section><section className="settings-panel"><h2>Profile</h2><DetailGrid record={scrub((bundle?.profile as CrmRecord) ?? {})} /></section></div>;
}

function RecordGrid({ rows, loading, onOpen }: { rows: CrmRecord[]; loading?: boolean; onOpen: (row: CrmRecord) => void }) {
  if (loading) return <div className="surface-state">Loading records...</div>;
  return <div className="settings-grid">{rows.length === 0 ? <div className="empty-state">No records found.</div> : rows.map((row) => <article className="settings-panel" key={idOf(row)}><h2>{textOf(row, ['display_name', 'name'], 'Record')}</h2><p>{textOf(row, ['email', 'phone', 'lead_number', 'client_code', 'vendor_code'], '-')}</p><StatusBadge tone={statusTone(row.status)}>{textOf(row, ['status'], 'active')}</StatusBadge><Button type="button" size="sm" variant="secondary" onClick={() => onOpen(row)}>Open</Button></article>)}</div>;
}

function RecordList({ title, rows, loading, action }: { title: string; rows: CrmRecord[]; loading?: boolean; action?: ReactNode }) {
  const keys = visibleKeys(rows[0] ?? {});
  return <section className="settings-panel"><div className="surface-actions"><h2>{title}</h2>{action}</div>{loading ? <div className="surface-state">Loading...</div> : null}{!loading && rows.length === 0 ? <div className="empty-state">No records returned.</div> : null}{!loading && rows.length > 0 ? <DataTable columns={genericColumns(keys)} data={rows} getRowId={idOf} total={rows.length} /> : null}</section>;
}

function DetailGrid({ record }: { record: Record<string, unknown> }) {
  const entries = Object.entries(record).filter(([key, value]) => value !== null && value !== undefined && value !== '' && !['id', 'tenant_id', 'party_id', 'deleted_at'].includes(key));
  if (entries.length === 0) return <div className="empty-state">No displayable details returned.</div>;
  return <dl className="detail-grid">{entries.map(([key, value]) => <div key={key}><dt>{label(key)}</dt><dd>{displayValue(value)}</dd></div>)}</dl>;
}

function ImplementationPlaceholder({ title, description }: { title: string; description?: string }) {
  return <section className="settings-panel"><div className="empty-state"><h2>{title}</h2><p>{description ?? 'This module route is ready, but no backing table/API is present yet. Once the backend contract lands, this tab can be connected without changing navigation.'}</p></div></section>;
}

function ClientFields({ form, setForm, users }: { form: Record<string, string>; setForm: (form: Record<string, string>) => void; users: CrmRecord[] }) {
  return <><SimpleInput label="Client Code" value={form.client_code} onChange={(client_code) => setForm({ ...form, client_code })} required /><SimpleInput label="Client Type" value={form.client_type} onChange={(client_type) => setForm({ ...form, client_type })} /><SimpleInput label="Credit Limit" type="number" value={form.credit_limit} onChange={(credit_limit) => setForm({ ...form, credit_limit })} /><SimpleInput label="Payment Terms Days" type="number" value={form.payment_terms_days} onChange={(payment_terms_days) => setForm({ ...form, payment_terms_days })} /><SimpleInput label="Onboarding Date" type="date" value={form.onboarding_date} onChange={(onboarding_date) => setForm({ ...form, onboarding_date })} /><SelectInput label="Account Manager" value={form.account_manager_id} onChange={(account_manager_id) => setForm({ ...form, account_manager_id })} options={users} labelKeys={['display_name', 'email']} /></>;
}

function VendorFields({ form, setForm, users, categories }: { form: Record<string, string>; setForm: (form: Record<string, string>) => void; users: CrmRecord[]; categories: CrmRecord[] }) {
  return <><SimpleInput label="Vendor Code" value={form.vendor_code} onChange={(vendor_code) => setForm({ ...form, vendor_code })} required /><SelectInput label="Vendor Category" value={form.vendor_category_id} onChange={(vendor_category_id) => setForm({ ...form, vendor_category_id })} options={categories} labelKeys={['name', 'code']} /><SimpleInput label="Payment Terms Days" type="number" value={form.payment_terms_days} onChange={(payment_terms_days) => setForm({ ...form, payment_terms_days })} /><SimpleInput label="Rating" type="number" value={form.rating} onChange={(rating) => setForm({ ...form, rating })} /><SelectInput label="Account Manager" value={form.account_manager_id} onChange={(account_manager_id) => setForm({ ...form, account_manager_id })} options={users} labelKeys={['display_name', 'email']} /></>;
}

function LeadFields({ form, setForm, stages, priorities }: { form: Record<string, string>; setForm: (form: Record<string, string>) => void; stages: CrmRecord[]; priorities: CrmRecord[] }) {
  return <><SimpleInput label="Lead Number" value={form.lead_number} onChange={(lead_number) => setForm({ ...form, lead_number })} required /><SelectInput label="Stage" value={form.stage_id} onChange={(stage_id) => setForm({ ...form, stage_id })} options={stages} labelKeys={['name', 'code']} /><SelectInput label="Priority" value={form.priority_id} onChange={(priority_id) => setForm({ ...form, priority_id })} options={priorities} labelKeys={['name', 'code']} /><SimpleInput label="Expected Value" type="number" value={form.expected_value} onChange={(expected_value) => setForm({ ...form, expected_value })} /><SimpleInput label="Probability" type="number" value={form.probability} onChange={(probability) => setForm({ ...form, probability })} /><SimpleInput label="Expected Close Date" type="date" value={form.expected_close_date} onChange={(expected_close_date) => setForm({ ...form, expected_close_date })} /></>;
}

function FormFields({ form, fields, onChange }: { form: Record<string, string>; fields: string[]; onChange: (form: Record<string, string>) => void }) {
  return <div className="form-grid form-grid--two">{fields.map((field) => <SimpleInput key={field} label={label(field)} value={form[field] ?? ''} onChange={(value) => onChange({ ...form, [field]: value })} />)}</div>;
}

function SimpleInput({ label: inputLabel, value, onChange, type = 'text', required }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return <label><span>{inputLabel}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} /></label>;
}

function SelectInput({ label: inputLabel, value, onChange, options, labelKeys }: { label: string; value: string; onChange: (value: string) => void; options: CrmRecord[]; labelKeys: string[] }) {
  return <label><span>{inputLabel}</span><select value={value} onChange={(event) => onChange(event.target.value)}><option value="">Select {inputLabel.toLowerCase()}</option>{options.map((option) => <option key={idOf(option)} value={idOf(option)}>{recordLabel(option, labelKeys)}</option>)}</select></label>;
}

function MultiPicker({ title, rows, selectedIds, onChange }: { title: string; rows: CrmRecord[]; selectedIds: string[]; onChange: (ids: string[]) => void }) {
  const toggle = (id: string) => onChange(selectedIds.includes(id) ? selectedIds.filter((item) => item !== id) : [...selectedIds, id]);
  return <section className="settings-panel"><h2>{title}</h2><div className="settings-list">{rows.map((row) => <label className="check-row" key={idOf(row)}><input type="checkbox" checked={selectedIds.includes(idOf(row))} onChange={() => toggle(idOf(row))} /><span>{recordLabel(row, ['display_name', 'lead_number', 'client_code', 'email'])}</span></label>)}</div></section>;
}

function ModalFooter({ onCancel, onSave, loading, label: saveLabel = 'Save' }: { onCancel: () => void; onSave: () => void; loading?: boolean; label?: string }) {
  return <><Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button><Button type="button" onClick={onSave} disabled={loading}>{loading ? 'Working...' : saveLabel}</Button></>;
}

function genericColumns(keys: string[]): DataTableColumn<CrmRecord>[] {
  return keys.map((key) => ({ id: key, header: label(key), accessor: (row) => printable(row[key]), cell: (row) => key.includes('status') ? <StatusBadge tone={statusTone(row[key])}>{printable(row[key])}</StatusBadge> : key.includes('amount') || key.includes('value') || key.includes('limit') ? money(row[key]) : printable(row[key]) }));
}

function partyColumns(resource: PartyResource, open: (row: CrmRecord) => void, onAction: (row: CrmRecord, action: ModalState) => void): DataTableColumn<CrmRecord>[] {
  const keys = resource === 'clients' ? ['client_code', 'display_name', 'email', 'phone', 'client_type', 'credit_limit'] : ['vendor_code', 'display_name', 'email', 'phone', 'payment_terms_days', 'rating'];
  return genericColumns(keys).map((column) => column.id === 'display_name' ? { ...column, cell: (row) => <button type="button" className="link-button" onClick={() => open(row)}>{textOf(row, ['display_name'], 'Open')}</button> } : column);
}

function actionColumn(cell: (row: CrmRecord) => ReactNode): DataTableColumn<CrmRecord> {
  return { id: 'actions', header: 'Actions', enableHiding: false, cell: (row) => <div className="inline-actions">{cell(row)}</div> };
}

function visibleKeys(row: CrmRecord) {
  const preferred = ['display_name', 'name', 'title', 'subject', 'email', 'phone', 'status', 'amount', 'expected_value', 'scheduled_at', 'created_at'];
  const keys = Object.keys(row).filter((key) => !['id', 'tenant_id', 'party_id', 'deleted_at', 'account_number_encrypted', 'routing_number_encrypted', 'metadata'].includes(key));
  return [...preferred.filter((key) => keys.includes(key)), ...keys.filter((key) => !preferred.includes(key))].slice(0, 7);
}

const clientTabs = [['overview', 'Overview'], ['contacts', 'Contacts'], ['addresses', 'Addresses'], ['projects', 'Projects'], ['quotations', 'Quotations'], ['invoices', 'Invoices'], ['payments', 'Payments'], ['renewals', 'Renewals'], ['issues', 'Support Issues'], ['files', 'Files'], ['notes', 'Notes'], ['timeline', 'Timeline']];
const vendorTabs = [['overview', 'Overview'], ['contacts', 'Contacts'], ['addresses', 'Addresses'], ['bank-accounts', 'Bank Accounts'], ['services-contracts', 'Services/Contracts'], ['expenses', 'Expenses'], ['renewals', 'Renewals'], ['documents', 'Documents'], ['notes', 'Notes'], ['activity', 'Activity']];
const leadTabs = [['overview', 'Overview'], ['contacts', 'Contacts'], ['activities', 'Activities'], ['follow-ups', 'Follow-Ups'], ['calls', 'Calls'], ['meetings', 'Meetings'], ['emails', 'Emails'], ['tasks', 'Tasks'], ['quotations', 'Quotations'], ['documents', 'Documents'], ['notes', 'Notes'], ['timeline', 'Timeline'], ['conversion-history', 'Conversion History']];

function relationFor(resource: PartyResource, tab: string) {
  if (resource === 'clients' && ['projects', 'invoices', 'payments', 'renewals', 'issues'].includes(tab)) return tab;
  if (resource === 'vendors' && ['expenses', 'renewals'].includes(tab)) return tab;
  if (tab === 'timeline' || tab === 'activity') return 'activity';
  return null;
}

function bundleToForm(resource: PartyResource, record?: CrmRecord) {
  const party = (record?.party ?? record ?? {}) as CrmRecord;
  const profile = (record?.profile ?? record ?? {}) as CrmRecord;
  return {
    display_name: textOf(party, ['display_name']),
    legal_name: textOf(party, ['legal_name']),
    email: textOf(party, ['email']),
    phone: textOf(party, ['phone']),
    website: textOf(party, ['website']),
    owner_user_id: textOf(party, ['owner_user_uuid', 'owner_user_id']),
    client_code: textOf(profile, ['client_code']),
    client_type: textOf(profile, ['client_type']),
    credit_limit: textOf(profile, ['credit_limit']),
    payment_terms_days: textOf(profile, ['payment_terms_days']),
    onboarding_date: textOf(profile, ['onboarding_date']),
    account_manager_id: textOf(profile, ['account_manager_uuid', 'account_manager_id']),
    vendor_code: textOf(profile, ['vendor_code']),
    vendor_category_id: textOf(profile, ['vendor_category_uuid', 'vendor_category_id']),
    rating: textOf(profile, ['rating']),
    lead_number: textOf(profile, ['lead_number']),
    stage_id: textOf(profile, ['stage_uuid', 'stage_id']),
    priority_id: textOf(profile, ['priority_uuid', 'priority_id']),
    expected_value: textOf(profile, ['expected_value']),
    probability: textOf(profile, ['probability']),
    expected_close_date: textOf(profile, ['expected_close_date'])
  };
}

function formToPayload(resource: PartyResource, form: Record<string, string>) {
  const partyKeys = ['display_name', 'legal_name', 'email', 'phone', 'website', 'owner_user_id'];
  const profileKeys = resource === 'clients' ? ['client_code', 'client_type', 'credit_limit', 'payment_terms_days', 'onboarding_date', 'account_manager_id'] : resource === 'vendors' ? ['vendor_code', 'vendor_category_id', 'payment_terms_days', 'rating', 'account_manager_id'] : ['lead_number', 'stage_id', 'priority_id', 'expected_value', 'probability', 'expected_close_date'];
  return { party: pick(form, partyKeys), profile: pick(form, profileKeys) };
}

function contactForm() {
  return { first_name: '', last_name: '', email: '', mobile: '', phone: '', designation: '', department: '', is_primary: 'false' };
}

function addressForm() {
  return { address_type: 'office', address_line_1: '', address_line_2: '', postal_code: '', is_default: 'false' };
}

function pick(form: Record<string, string>, keys: string[]) {
  return Object.fromEntries(keys.map((key) => [key, form[key] || null]));
}

function normalizeForm(form: Record<string, string>) {
  return Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value === '' ? null : ['is_primary', 'is_default', 'move_open_tasks', 'create_project'].includes(key) ? value === 'true' : value]));
}

function rowsFromResponse(data: unknown, key: string) {
  if (!data || typeof data !== 'object') return [];
  const payload = data as Record<string, unknown>;
  return asRows(payload[key] ?? payload.activity);
}

function filterActivities(rows: CrmRecord[], tab: string) {
  if (tab === 'activities') return rows;
  const type = tab === 'follow-ups' ? 'follow_up' : tab.slice(0, -1);
  return rows.filter((row) => String(row.activity_type ?? '').replace('-', '_') === type);
}

function asRows(value: unknown): CrmRecord[] {
  return Array.isArray(value) ? value as CrmRecord[] : [];
}

function summaryCards(payload: Record<string, unknown>) {
  return Object.entries(payload).map(([key, value]) => ({ label: label(key), value }));
}

function idOf(record?: CrmRecord | null) {
  return String(record?.uuid ?? record?.party_uuid ?? record?.id ?? '');
}

function bundleText(record: unknown, key: string, fallback: string) {
  const bundle = record as CrmRecord | undefined;
  return textOf(bundle?.party, [key], textOf(bundle, [key], fallback));
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
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return textOf(value, ['display_name', 'name', 'title', 'subject', 'email', 'status', 'uuid', 'id'], 'Details available');
  return String(value);
}

function recordLabel(record: CrmRecord, keys: string[]) {
  const primary = textOf(record, keys, textOf(record, ['uuid', 'id'], 'Record'));
  const secondary = textOf(record, ['email', 'code', 'lead_number', 'client_code', 'vendor_code']);
  return secondary && secondary !== primary ? `${primary} (${secondary})` : primary;
}

function label(value: string) {
  return value.replace(/[-_]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function statusTone(value: unknown): 'neutral' | 'success' | 'warning' | 'danger' | 'info' {
  const status = String(value ?? '').toLowerCase();
  if (['active', 'converted', 'won', 'paid', 'approved'].includes(status)) return 'success';
  if (['pending', 'queued', 'open'].includes(status)) return 'warning';
  if (['inactive', 'lost', 'failed', 'cancelled'].includes(status)) return 'danger';
  return 'neutral';
}

function money(value: unknown) {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount) || amount === 0) return '-';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

function mask(value: string) {
  return value.length <= 4 ? '****' : `${'*'.repeat(Math.max(0, value.length - 4))}${value.slice(-4)}`;
}

function scrub(record: CrmRecord) {
  return Object.fromEntries(Object.entries(record).filter(([key]) => !['account_number_encrypted', 'routing_number_encrypted', 'metadata'].includes(key)));
}

function leadActionTitle(action: ModalState) {
  if (action === 'owner') return 'Assign Owner';
  if (action === 'stage') return 'Change Lead Stage';
  if (action === 'lost') return 'Mark Lead Lost';
  if (action === 'convert') return 'Convert Lead / Mark Won';
  if (action === 'duplicate') return 'Duplicate Lead';
  if (action === 'meeting') return 'Schedule Meeting';
  return 'Activity / Follow-Up';
}

function JobResult({ data }: { data: unknown }) {
  const job = data && typeof data === 'object' && 'job' in data ? (data as { job?: CrmRecord }).job : data;
  return <div className="surface-state">Job queued{job && typeof job === 'object' ? `: ${textOf(job, ['uuid', 'id', 'status'], 'pending')}` : '.'}<br />Run <code>php artisan queue:work --queue=exports,imports,default</code></div>;
}

function errorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Request failed.';
}

