import { useMemo, useRef, useState, type FormEvent, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CalendarPlus, Clock, Copy, Download, GitBranch, MoreVertical, Paperclip, Plus, RefreshCw, Reply, Timer, Upload, UserPlus } from 'lucide-react';

import { ApiError } from '@/lib/api/apiError';
import type { ApiQuery } from '@/lib/api/apiTypes';
import { tenantAccessApi } from '@/features/tenant/api/tenantAccessApi';
import { tenantCrmApi } from '@/features/tenant/api/tenantCrmApi';
import { tenantOperationsApi, type OperationsRecord } from '@/features/tenant/api/tenantOperationsApi';
import { tenantQueryKeys } from '@/features/tenant/api/tenantQueryKeys';
import { TENANT_ROUTES } from '@/features/tenant/routes/tenantRoutes';
import { DataTable, type DataTableColumn } from '@/shared/components/data-table';
import { AppDrawer } from '@/shared/components/drawer';
import { PageHeader, StatusBadge, Tabs } from '@/shared/components/layout';
import { AppModal } from '@/shared/components/modal';
import { Button, PermissionButton } from '@/shared/components/ui';

const tenantKey = 'current';
type Resource = 'projects' | 'tasks' | 'todo' | 'issues' | 'renewals' | 'calendar';
type ViewMode = 'list' | 'grid' | 'kanban' | 'calendar' | 'gantt' | 'dashboard' | 'my' | 'team' | 'agenda' | 'daily' | 'weekly' | 'monthly';
type ModalState =
  | null
  | 'create'
  | 'edit'
  | 'export'
  | 'quick'
  | 'assign'
  | 'status'
  | 'bulk'
  | 'archive'
  | 'member'
  | 'phase'
  | 'milestone'
  | 'completeMilestone'
  | 'logTime'
  | 'expense'
  | 'dependency'
  | 'checklist'
  | 'watcher'
  | 'timer'
  | 'recurrence'
  | 'clone'
  | 'share'
  | 'reply'
  | 'resolve'
  | 'close'
  | 'reopen'
  | 'createTask'
  | 'attachment'
  | 'renew'
  | 'reminder'
  | 'sendReminder'
  | 'cancel'
  | 'history'
  | 'event'
  | 'attendees'
  | 'room'
  | 'video'
  | 'drag'
  | 'conflict'
  | 'sync';

const resourceLabels: Record<Resource, string> = {
  projects: 'Projects',
  tasks: 'Tasks',
  todo: 'To-Do',
  issues: 'Client Issues',
  renewals: 'Renewals',
  calendar: 'Calendar'
};

export function TenantRenewalsDashboardPage() { return <DashboardPage resource="renewals" />; }
export function TenantRenewalsListPage() { return <RenewalsPage mode="list" />; }
export function TenantRenewalsCalendarPage() { return <RenewalsPage mode="calendar" />; }
export function TenantClientRenewalsPage() { return <RenewalsPage mode="list" scope="client" />; }
export function TenantVendorRenewalsPage() { return <RenewalsPage mode="list" scope="vendor" />; }
export function TenantRenewalCreatePage() { return <EditorPage resource="renewals" mode="create" />; }
export function TenantRenewalEditPage() { return <EditorPage resource="renewals" mode="edit" />; }
export function TenantRenewalViewPage() { return <RecordViewPage resource="renewals" />; }

export function TenantProjectsDashboardPage() { return <DashboardPage resource="projects" />; }
export function TenantProjectsListPage() { return <OperationalPage resource="projects" mode="list" />; }
export function TenantProjectsGridPage() { return <OperationalPage resource="projects" mode="grid" />; }
export function TenantProjectsKanbanPage() { return <OperationalPage resource="projects" mode="kanban" />; }
export function TenantProjectsGanttPage() { return <OperationalPage resource="projects" mode="gantt" />; }
export function TenantProjectsCalendarPage() { return <OperationalPage resource="projects" mode="calendar" />; }
export function TenantProjectCreatePage() { return <EditorPage resource="projects" mode="create" />; }
export function TenantProjectEditPage() { return <EditorPage resource="projects" mode="edit" />; }
export function TenantProjectViewPage() { return <RecordViewPage resource="projects" />; }

export function TenantTasksDashboardPage() { return <DashboardPage resource="tasks" />; }
export function TenantTasksListPage() { return <OperationalPage resource="tasks" mode="list" />; }
export function TenantTasksKanbanPage() { return <OperationalPage resource="tasks" mode="kanban" />; }
export function TenantTasksCalendarPage() { return <OperationalPage resource="tasks" mode="calendar" />; }
export function TenantMyTasksPage() { return <OperationalPage resource="tasks" mode="my" />; }
export function TenantTeamTasksPage() { return <OperationalPage resource="tasks" mode="team" />; }
export function TenantTaskCreatePage() { return <EditorPage resource="tasks" mode="create" />; }
export function TenantTaskEditPage() { return <EditorPage resource="tasks" mode="edit" />; }
export function TenantTaskViewPage() { return <RecordViewPage resource="tasks" />; }

export function TenantTodoDashboardPage() { return <DashboardPage resource="todo" />; }
export function TenantTodoListPage() { return <OperationalPage resource="todo" mode="list" />; }
export function TenantTodoKanbanPage() { return <OperationalPage resource="todo" mode="kanban" />; }
export function TenantTodoCalendarPage() { return <OperationalPage resource="todo" mode="calendar" />; }
export function TenantTodoCreatePage() { return <EditorPage resource="todo" mode="create" />; }
export function TenantTodoEditPage() { return <EditorPage resource="todo" mode="edit" />; }
export function TenantTodoViewPage() { return <RecordViewPage resource="todo" />; }

export function TenantIssuesDashboardPage() { return <DashboardPage resource="issues" />; }
export function TenantIssuesListPage() { return <OperationalPage resource="issues" mode="list" />; }
export function TenantIssuesKanbanPage() { return <OperationalPage resource="issues" mode="kanban" />; }
export function TenantIssueCreatePage() { return <EditorPage resource="issues" mode="create" />; }
export function TenantIssueEditPage() { return <EditorPage resource="issues" mode="edit" />; }
export function TenantIssueViewPage() { return <RecordViewPage resource="issues" />; }

export function TenantCalendarDailyPage() { return <CalendarPage view="daily" />; }
export function TenantCalendarWeeklyPage() { return <CalendarPage view="weekly" />; }
export function TenantCalendarMonthlyPage() { return <CalendarPage view="monthly" />; }
export function TenantCalendarAgendaPage() { return <CalendarPage view="agenda" />; }
export function TenantMySchedulePage() { return <CalendarPage view="my" />; }
export function TenantTeamCalendarPage() { return <CalendarPage view="team" />; }

function DashboardPage({ resource }: { resource: Exclude<Resource, 'calendar'> }) {
  const query = useQuery({ queryKey: tenantQueryKeys.resource(tenantKey, `${resource}-dashboard`), queryFn: () => apiFor(resource).dashboard() });
  const dashboard = query.data?.data.dashboard ?? {};
  const cards = Object.entries((dashboard.cards as Record<string, unknown>) ?? {});
  return (
    <section className="enterprise-module-page">
      <PageHeader title={`${resourceLabels[resource]} Dashboard`} description={`Live ${resourceLabels[resource].toLowerCase()} summary from operational tables.`} actions={<ModuleLinks resource={resource} />} />
      <div className="summary-grid">{cards.map(([key, value]) => <article className="summary-card" key={key}><span>{label(key)}</span><strong>{formatValue(key, value)}</strong></article>)}</div>
      <div className="settings-grid">
        {Object.entries(dashboard).filter(([key]) => key !== 'cards').map(([key, value]) => <RecordList key={key} title={label(key)} rows={asRows(value)} />)}
      </div>
    </section>
  );
}

function OperationalPage({ resource, mode }: { resource: Exclude<Resource, 'renewals' | 'calendar'>; mode: ViewMode }) {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const [selected, setSelected] = useState<OperationsRecord | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  const query = useOperationalQuery(resource, mode);
  const title = `${modeTitle(mode)} ${resourceLabels[resource]}`.trim();
  const open = (row: OperationsRecord) => navigate(`${modulePath(resource, tenantSlug)}/${idOf(row)}`);

  return (
    <section className="enterprise-module-page">
      <PageHeader title={title} description={`Live ${resourceLabels[resource].toLowerCase()} ${mode} view.`} actions={<><ModuleLinks resource={resource} /><PermissionButton guard="tenant" permission={`${permissionBase(resource)}.create`} type="button" onClick={() => setModal('create')}><Plus size={16} aria-hidden />Create</PermissionButton></>} />
      {mode === 'grid' ? <RecordGrid rows={query.rows} loading={query.isLoading} onOpen={open} /> : null}
      {mode === 'kanban' ? <KanbanBoard resource={resource} onOpen={open} onMove={(row) => { setSelected(row); setModal('status'); }} /> : null}
      {mode === 'calendar' ? <CalendarGrid rows={query.rows} dateKey={resource === 'projects' ? 'due_date' : 'due_at'} onOpen={open} onMove={(row) => { setSelected(row); setModal('drag'); }} /> : null}
      {mode === 'gantt' && resource === 'projects' ? <GanttView onDependency={() => setModal('dependency')} /> : null}
      {!['grid', 'kanban', 'calendar', 'gantt'].includes(mode) ? (
        <DataTable
          columns={[...columnsFor(resource, open), actionColumn((row) => <RowActions resource={resource} row={row} onModal={(action) => { setSelected(row); setModal(action); }} onOpen={() => open(row)} />)]}
          data={query.rows}
          getRowId={idOf}
          loading={query.isLoading}
          error={query.error}
          searchValue={query.search}
          onSearchChange={query.setSearch}
          onOpenExport={() => setModal('export')}
          selectedRowIds={query.selected}
          onSelectionChange={query.setSelected}
          bulkActions={<Button type="button" size="sm" onClick={() => setModal('bulk')}>Bulk Update</Button>}
          page={query.page}
          perPage={25}
          total={query.total}
          onPageChange={query.setPage}
        />
      ) : null}
      <RecordActionModal resource={resource} action={modal} record={selected} selectedIds={query.selected} onClose={() => setModal(null)} />
      <EditorModal resource={resource} open={modal === 'create' || modal === 'edit'} record={modal === 'edit' ? selected : null} onClose={() => setModal(null)} />
      <ExportModal resource={resource} open={modal === 'export'} onClose={() => setModal(null)} />
    </section>
  );
}

function RenewalsPage({ mode, scope }: { mode: 'list' | 'calendar'; scope?: 'client' | 'vendor' }) {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const [selected, setSelected] = useState<OperationsRecord | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  const query = useRenewalQuery(scope);
  const title = scope === 'client' ? 'Client Renewals' : scope === 'vendor' ? 'Vendor Renewals' : mode === 'calendar' ? 'Renewal Calendar' : 'Renewals';
  const open = (row: OperationsRecord) => navigate(`${TENANT_ROUTES.crm.renewals(tenantSlug)}/${idOf(row)}`);
  return (
    <section className="enterprise-module-page">
      <PageHeader title={title} description="Client, vendor, contract, license, and service renewal tracking." actions={<><ModuleLinks resource="renewals" /><PermissionButton guard="tenant" permission="renewal.create" type="button" onClick={() => setModal('quick')}><Plus size={16} aria-hidden />Quick Create</PermissionButton></>} />
      {mode === 'calendar' ? <CalendarGrid rows={query.rows} dateKey="renewal_date" onOpen={open} onMove={(row) => { setSelected(row); setModal('drag'); }} /> : <DataTable columns={[...columnsFor('renewals', open), actionColumn((row) => <RowActions resource="renewals" row={row} onModal={(action) => { setSelected(row); setModal(action); }} onOpen={() => open(row)} />)]} data={query.rows} getRowId={idOf} loading={query.isLoading} error={query.error} searchValue={query.search} onSearchChange={query.setSearch} onOpenExport={() => setModal('export')} page={query.page} perPage={25} total={query.total} onPageChange={query.setPage} />}
      <EditorModal resource="renewals" open={modal === 'quick' || modal === 'edit'} record={modal === 'edit' ? selected : null} onClose={() => setModal(null)} />
      <RecordActionModal resource="renewals" action={modal} record={selected} selectedIds={[]} onClose={() => setModal(null)} />
      <ExportModal resource="renewals" open={modal === 'export'} onClose={() => setModal(null)} />
    </section>
  );
}

function CalendarPage({ view }: { view: 'daily' | 'weekly' | 'monthly' | 'agenda' | 'my' | 'team' }) {
  const [selected, setSelected] = useState<OperationsRecord | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  const query = useCalendarQuery(view);
  return (
    <section className="enterprise-module-page">
      <PageHeader title={calendarTitle(view)} description="Daily, weekly, monthly, agenda, personal, and team calendar views." actions={<><ModuleLinks resource="calendar" /><PermissionButton guard="tenant" permission="calendar.create" type="button" onClick={() => setModal('event')}><CalendarPlus size={16} aria-hidden />Event</PermissionButton></>} />
      {view === 'agenda' ? <DataTable columns={[...genericColumns(['title', 'calendar_name', 'starts_at', 'ends_at', 'location', 'status']), actionColumn((row) => <RowActions resource="calendar" row={row} onModal={(action) => { setSelected(row); setModal(action); }} onOpen={() => { setSelected(row); setModal('event'); }} />)]} data={query.rows} getRowId={idOf} loading={query.isLoading} searchValue={query.search} onSearchChange={query.setSearch} page={query.page} perPage={25} total={query.total} onPageChange={query.setPage} /> : <CalendarGrid rows={query.rows} dateKey="starts_at" onOpen={(row) => { setSelected(row); setModal('event'); }} onMove={(row) => { setSelected(row); setModal('drag'); }} />}
      <CalendarEventDrawer open={modal === 'event'} event={selected} onClose={() => setModal(null)} />
      <RecordActionModal resource="calendar" action={modal} record={selected} selectedIds={[]} onClose={() => setModal(null)} />
    </section>
  );
}

function EditorPage({ resource, mode }: { resource: Exclude<Resource, 'calendar'>; mode: 'create' | 'edit' }) {
  const { tenantSlug, id = '' } = useParams();
  const navigate = useNavigate();
  const query = useQuery({ queryKey: tenantQueryKeys.detail(tenantKey, resource, id), queryFn: () => apiFor(resource).detail(id), enabled: mode === 'edit' && Boolean(id) });
  return (
    <section className="enterprise-module-page">
      <PageHeader title={`${mode === 'create' ? 'Create' : 'Edit'} ${singular(resourceLabels[resource])}`} actions={<Link className="button button--secondary button--md" to={modulePath(resource, tenantSlug)}>List</Link>} />
      <RecordForm resource={resource} record={query.data} onSaved={() => navigate(modulePath(resource, tenantSlug))} />
    </section>
  );
}

function RecordViewPage({ resource }: { resource: Exclude<Resource, 'calendar'> }) {
  const { id = '' } = useParams();
  const query = useQuery({ queryKey: tenantQueryKeys.detail(tenantKey, resource, id), queryFn: () => apiFor(resource).detail(id), enabled: Boolean(id) });
  const [tab, setTab] = useState('details');
  const [modal, setModal] = useState<ModalState>(null);
  const root = rootRecord(resource, query.data);
  return (
    <section className="enterprise-module-page">
      <PageHeader title={recordTitle(root, resourceLabels[resource])} description={recordSubtitle(root)} actions={<><Button type="button" variant="secondary" onClick={() => setModal('edit')}>Edit</Button><Button type="button" variant="secondary" onClick={() => setModal(resource === 'renewals' ? 'history' : 'logTime')}><Clock size={16} aria-hidden />{resource === 'renewals' ? 'History' : 'Log Time'}</Button></>} />
      <Tabs tabs={tabsFor(resource).map((item) => ({ id: item[0], label: item[1] }))} activeId={tab} onChange={setTab} ariaLabel={`${resource} tabs`} />
      <ViewTab resource={resource} tab={tab} bundle={query.data} loading={query.isLoading} onModal={setModal} />
      <EditorModal resource={resource} open={modal === 'edit'} record={query.data ?? null} onClose={() => setModal(null)} />
      <RecordActionModal resource={resource} action={modal} record={root} selectedIds={[]} onClose={() => setModal(null)} bundle={query.data} />
    </section>
  );
}

function ViewTab({ resource, tab, bundle, loading, onModal }: { resource: Exclude<Resource, 'calendar'>; tab: string; bundle?: OperationsRecord; loading?: boolean; onModal: (modal: ModalState) => void }) {
  if (loading) return <div className="surface-state">Loading details...</div>;
  if (tab === 'details') return <DetailGrid record={scrub(rootRecord(resource, bundle))} />;
  const rows = asRows((bundle as Record<string, unknown> | undefined)?.[tab]);
  const actions: Record<string, ModalState> = {
    members: 'member', phases: 'phase', milestones: 'milestone', time_logs: 'logTime', expenses: 'expense',
    checklists: 'checklist', dependencies: 'dependency', watchers: 'watcher', reminders: 'reminder', items: 'quick',
    linked_tasks: 'createTask'
  };
  return <RecordList title={label(tab)} rows={rows} action={actions[tab] ? <Button type="button" onClick={() => onModal(actions[tab])}><Plus size={16} aria-hidden />Add</Button> : undefined} />;
}

function RecordForm({ resource, record, onSaved }: { resource: Exclude<Resource, 'calendar'>; record?: OperationsRecord; onSaved: () => void }) {
  const queryClient = useQueryClient();
  const selectors = useSelectors();
  const root = rootRecord(resource, record);
  const [form, setForm] = useState<Record<string, string>>(initialForm(resource, root));
  const mutation = useMutation({
    mutationFn: () => idOf(root) ? apiFor(resource).update(idOf(root), formPayload(resource, form)) : apiFor(resource).create(formPayload(resource, form)),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: tenantQueryKeys.resource(tenantKey, resource) }); onSaved(); }
  });
  return (
    <form className="enterprise-form" onSubmit={(event: FormEvent) => { event.preventDefault(); mutation.mutate(); }}>
      <div className="form-grid form-grid--two">
        {fieldsFor(resource).map((field) => renderField(field, form, setForm, selectors))}
      </div>
      {mutation.error ? <div className="surface-error">{errorMessage(mutation.error)}</div> : null}
      <footer className="enterprise-form__footer"><Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Saving...' : 'Save'}</Button></footer>
    </form>
  );
}

function EditorModal({ resource, open, record, onClose }: { resource: Exclude<Resource, 'calendar'>; open: boolean; record?: OperationsRecord | null; onClose: () => void }) {
  return <AppModal open={open} onClose={onClose} title={`${record ? 'Edit' : 'Create'} ${singular(resourceLabels[resource])}`} size="lg"><RecordForm resource={resource} record={record ?? undefined} onSaved={onClose} /></AppModal>;
}

function RecordActionModal({ resource, action, record, selectedIds, onClose, bundle }: { resource: Resource; action: ModalState; record?: OperationsRecord | null; selectedIds: string[]; onClose: () => void; bundle?: OperationsRecord }) {
  const queryClient = useQueryClient();
  const selectors = useSelectors(Boolean(action));
  const [form, setForm] = useState<Record<string, string>>({});
  const id = idOf(record);
  const mutation = useMutation<unknown>({
    mutationFn: () => runAction(resource, action, id, form, selectedIds),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: tenantQueryKeys.resource(tenantKey, resource) }); onClose(); }
  });
  if (!action || ['create', 'edit', 'export', 'quick', 'event', 'history', 'conflict', 'sync'].includes(action)) {
    if (action === 'history') return <HistoryDrawer open record={record} bundle={bundle} onClose={onClose} />;
    if (action === 'sync') return <SyncDrawer open onClose={onClose} />;
    if (action === 'conflict') return <ConflictModal open onClose={onClose} />;
    return null;
  }
  const fields = actionFields(action, resource);
  return (
    <AppModal open onClose={onClose} title={actionTitle(action, resource)} size={fields.length > 4 ? 'lg' : 'md'} footer={<><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="button" variant={dangerActions.includes(action) ? 'danger' : 'primary'} onClick={() => mutation.mutate()} disabled={mutation.isPending}>{mutation.isPending ? 'Working...' : actionButton(action)}</Button></>}>
      {['status', 'drag'].includes(action) ? <div className="surface-state"><AlertTriangle size={16} aria-hidden />Confirm this change. If the target status requires extra fields, complete them before saving.</div> : null}
      {action === 'archive' ? <div className="surface-state"><AlertTriangle size={16} aria-hidden />Archiving hides this record from active lists. Related data remains available in history.</div> : null}
      {action === 'dependency' && resource === 'projects' ? <div className="surface-state">Gantt dependency editor. Select task dependencies from live task records.</div> : null}
      <div className="form-grid form-grid--two">{fields.map((field) => renderField(field, form, setForm, selectors))}</div>
      {action === 'timer' ? <TimerPanel task={record} /> : null}
      {action === 'attachment' ? <AttachmentPreview /> : null}
      {mutation.data ? <JobResult data={mutation.data} /> : null}
      {mutation.error ? <div className="surface-error">{errorMessage(mutation.error)}</div> : null}
    </AppModal>
  );
}

function CalendarEventDrawer({ open, event, onClose }: { open: boolean; event?: OperationsRecord | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const selectors = useSelectors(open);
  const [form, setForm] = useState<Record<string, string>>(initialEventForm(event ?? undefined));
  const mutation = useMutation({
    mutationFn: () => idOf(event) ? tenantOperationsApi.calendar.events.update(idOf(event), eventPayload(form)) : tenantOperationsApi.calendar.events.create(eventPayload(form)),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: tenantQueryKeys.resource(tenantKey, 'calendar') }); onClose(); }
  });
  return (
    <AppDrawer open={open} onClose={onClose} title={event ? 'Edit Event' : 'Quick Create Event'} size="lg" footer={<><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="button" onClick={() => mutation.mutate()} disabled={mutation.isPending}>Save Event</Button></>}>
      <div className="form-grid form-grid--two">{calendarFields.map((field) => renderField(field, form, setForm, selectors))}</div>
      <div className="quick-action-grid">
        <Button type="button" variant="secondary" disabled={!idOf(event)}><UserPlus size={16} aria-hidden />Attendees</Button>
        <Button type="button" variant="secondary" disabled={!idOf(event)}><RefreshCw size={16} aria-hidden />Recurrence</Button>
        <Button type="button" variant="secondary" disabled={!idOf(event)}><Clock size={16} aria-hidden />Reminder</Button>
        <Button type="button" variant="secondary" disabled={!idOf(event)}><CalendarPlus size={16} aria-hidden />Room</Button>
      </div>
      {mutation.error ? <div className="surface-error">{errorMessage(mutation.error)}</div> : null}
    </AppDrawer>
  );
}

function ExportModal({ resource, open, onClose }: { resource: Exclude<Resource, 'calendar'>; open: boolean; onClose: () => void }) {
  const [format, setFormat] = useState('csv');
  const mutation = useMutation({ mutationFn: () => exportFor(resource)({ format }) });
  return <AppModal open={open} onClose={onClose} title={`Export ${resourceLabels[resource]}`} footer={<><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="button" onClick={() => mutation.mutate()} disabled={mutation.isPending}><Download size={16} aria-hidden />Queue Export</Button></>}><SimpleInput label="Format" value={format} onChange={setFormat} />{mutation.data ? <JobResult data={mutation.data.data} /> : null}{mutation.error ? <div className="surface-error">{errorMessage(mutation.error)}</div> : null}</AppModal>;
}

function KanbanBoard({ resource, onOpen, onMove }: { resource: Exclude<Resource, 'renewals' | 'calendar'>; onOpen: (row: OperationsRecord) => void; onMove: (row: OperationsRecord) => void }) {
  const query = useQuery({ queryKey: tenantQueryKeys.resource(tenantKey, `${resource}-kanban`), queryFn: () => kanbanFor(resource)() });
  const columns = Object.entries((query.data?.data.kanban ?? {}) as Record<string, { total: number; rows: OperationsRecord[] }>);
  return <div className="kanban-board">{columns.length === 0 ? <div className="empty-state">No Kanban columns returned.</div> : columns.map(([key, group]) => <section className="kanban-column" key={key}><header><strong>{key === 'unassigned' ? 'Unassigned' : `Status ${key}`}</strong><span>{group.total} records</span></header>{group.rows.map((row) => <article className="kanban-card" key={idOf(row)}><button type="button" className="link-button" onClick={() => onOpen(row)}>{recordTitle(row, 'Record')}</button><span>{recordSubtitle(row)}</span><Button type="button" size="sm" variant="secondary" onClick={() => onMove(row)}>Move</Button></article>)}</section>)}</div>;
}

function CalendarGrid({ rows, dateKey, onOpen, onMove }: { rows: OperationsRecord[]; dateKey: string; onOpen: (row: OperationsRecord) => void; onMove: (row: OperationsRecord) => void }) {
  const grouped = rows.reduce<Record<string, OperationsRecord[]>>((carry, row) => {
    const date = String(row[dateKey] ?? 'No Date').slice(0, 10);
    carry[date] = [...(carry[date] ?? []), row];
    return carry;
  }, {});
  return <div className="settings-grid">{Object.entries(grouped).length === 0 ? <div className="empty-state">No calendar records returned.</div> : Object.entries(grouped).map(([date, items]) => <section className="settings-panel" key={date}><h2>{date}</h2><div className="record-list">{items.map((row) => <article key={idOf(row)}><strong>{recordTitle(row, 'Record')}</strong><p>{recordSubtitle(row)}</p><div className="inline-actions"><Button type="button" size="sm" variant="secondary" onClick={() => onOpen(row)}>Open</Button><Button type="button" size="sm" variant="secondary" onClick={() => onMove(row)}>Drag/Move</Button></div></article>)}</div></section>)}</div>;
}

function GanttView({ onDependency }: { onDependency: () => void }) {
  const query = useQuery({ queryKey: tenantQueryKeys.resource(tenantKey, 'projects-gantt'), queryFn: tenantOperationsApi.projects.gantt });
  const projects = asRows((query.data?.data.gantt as Record<string, unknown> | undefined)?.projects);
  return <section className="settings-panel"><div className="surface-actions"><h2>Project Gantt</h2><Button type="button" onClick={onDependency}><GitBranch size={16} aria-hidden />Dependency Editor</Button></div><div className="record-list">{projects.length === 0 ? <div className="empty-state">No Gantt rows returned.</div> : projects.map((project) => <article key={idOf(project)}><strong>{textOf(project, ['name'], 'Project')}</strong><p>{dateRange(project.start_date, project.due_date)} - {displayValue(project.progress)}%</p></article>)}</div></section>;
}

function RecordGrid({ rows, loading, onOpen }: { rows: OperationsRecord[]; loading?: boolean; onOpen: (row: OperationsRecord) => void }) {
  if (loading) return <div className="surface-state">Loading records...</div>;
  return <div className="settings-grid">{rows.length === 0 ? <div className="empty-state">No records found.</div> : rows.map((row) => <article className="settings-panel" key={idOf(row)}><h2>{recordTitle(row, 'Record')}</h2><p>{recordSubtitle(row)}</p><StatusBadge tone={statusTone(row.status)}>{displayValue(row.status ?? row.status_id ?? 'active')}</StatusBadge><Button type="button" size="sm" variant="secondary" onClick={() => onOpen(row)}>Open</Button></article>)}</div>;
}

type RowActionItem = { label: string; action?: ModalState; onClick?: () => void; danger?: boolean; separatorBefore?: boolean };

function RowActions({ resource, row, onModal, onOpen }: { resource: Resource; row: OperationsRecord; onModal: (action: ModalState) => void; onOpen: () => void }) {
  const common: RowActionItem[] = [{ label: 'View', onClick: onOpen }, { label: 'Edit', action: 'edit' }];
  const items: RowActionItem[] = [
    ...common,
    ...rowActionsFor(resource),
    ...(resource === 'projects' || resource === 'renewals' ? [{ label: resource === 'projects' ? 'Archive' : 'Cancel', action: resource === 'projects' ? 'archive' : 'cancel', danger: true, separatorBefore: true } as RowActionItem] : [])
  ];
  return <ActionMenu label={`Open actions for ${recordTitle(row, resourceLabels[resource])}`} items={items} onAction={onModal} />;
}

function rowActionsFor(resource: Resource): RowActionItem[] {
  if (resource === 'projects') return [
    { label: 'Add Member', action: 'member', separatorBefore: true },
    { label: 'Add Phase', action: 'phase' },
    { label: 'Add Milestone', action: 'milestone' },
    { label: 'Complete Milestone', action: 'completeMilestone' },
    { label: 'Log Time', action: 'logTime', separatorBefore: true },
    { label: 'Add Expense', action: 'expense' },
    { label: 'Dependency Editor', action: 'dependency' }
  ];
  if (resource === 'tasks') return [
    { label: 'Assign', action: 'assign', separatorBefore: true },
    { label: 'Change Status', action: 'status' },
    { label: 'Checklist', action: 'checklist' },
    { label: 'Dependency', action: 'dependency' },
    { label: 'Watcher', action: 'watcher' },
    { label: 'Timer', action: 'timer', separatorBefore: true },
    { label: 'Recurrence', action: 'recurrence' },
    { label: 'Clone', action: 'clone' },
    { label: 'Share', action: 'share' }
  ];
  if (resource === 'issues') return [
    { label: 'Assign', action: 'assign', separatorBefore: true },
    { label: 'Change Status', action: 'status' },
    { label: 'Reply', action: 'reply' },
    { label: 'Resolve', action: 'resolve' },
    { label: 'Close', action: 'close' },
    { label: 'Reopen', action: 'reopen' },
    { label: 'Create Task', action: 'createTask', separatorBefore: true },
    { label: 'Log Time', action: 'logTime' },
    { label: 'Attachment Preview', action: 'attachment' }
  ];
  if (resource === 'renewals') return [
    { label: 'Renew / Extend', action: 'renew', separatorBefore: true },
    { label: 'Schedule Reminder', action: 'reminder' },
    { label: 'Send Reminder', action: 'sendReminder' },
    { label: 'History', action: 'history' }
  ];
  if (resource === 'calendar') return [
    { label: 'Attendees', action: 'attendees', separatorBefore: true },
    { label: 'Reminder', action: 'reminder' },
    { label: 'Recurrence', action: 'recurrence' },
    { label: 'Video Meeting', action: 'video' },
    { label: 'Room Booking', action: 'room' },
    { label: 'Sync Result', action: 'sync' }
  ];
  return [];
}

function ActionMenu({ items, label, onAction }: { items: RowActionItem[]; label: string; onAction: (action: ModalState) => void }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const run = (item: RowActionItem) => {
    setOpen(false);
    if (item.onClick) item.onClick();
    if (item.action) onAction(item.action);
  };
  return (
    <div className="row-action-menu">
      <button ref={triggerRef} type="button" className="action-menu-trigger" aria-label={label} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
        <MoreVertical size={16} aria-hidden />
      </button>
      <PortalActionMenu open={open} anchorRef={triggerRef} onClose={() => setOpen(false)}>
        <div className="action-menu" role="menu">
          {items.map((item) => (
            <div key={`${item.label}-${item.action ?? 'open'}`}>
              {item.separatorBefore ? <hr /> : null}
              <button type="button" role="menuitem" className={item.danger ? 'is-danger' : undefined} onMouseDown={(event) => event.preventDefault()} onClick={() => run(item)}>{item.label}</button>
            </div>
          ))}
        </div>
      </PortalActionMenu>
    </div>
  );
}

function PortalActionMenu({ anchorRef, children, onClose, open }: { anchorRef: RefObject<HTMLElement>; children: ReactNode; onClose: () => void; open: boolean }) {
  if (!open || typeof document === 'undefined') return null;
  const rect = anchorRef.current?.getBoundingClientRect();
  const menuWidth = 232;
  const position = rect
    ? { top: rect.bottom + 8, left: Math.max(8, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8)) }
    : { top: 80, left: 80 };
  return createPortal(
    <div className="action-menu-portal" style={{ left: position.left, top: position.top }}>
      <button type="button" className="action-menu-backdrop" aria-label="Close actions menu" onClick={onClose} />
      {children}
    </div>,
    document.body
  );
}

function ModuleLinks({ resource }: { resource: Resource }) {
  const { tenantSlug } = useParams();
  if (resource === 'calendar') return <><Link className="button button--secondary button--md" to={`${TENANT_ROUTES.projects.calendar(tenantSlug)}/daily`}>Daily</Link><Link className="button button--secondary button--md" to={`${TENANT_ROUTES.projects.calendar(tenantSlug)}/weekly`}>Weekly</Link><Link className="button button--secondary button--md" to={`${TENANT_ROUTES.projects.calendar(tenantSlug)}/monthly`}>Monthly</Link><Link className="button button--secondary button--md" to={`${TENANT_ROUTES.projects.calendar(tenantSlug)}/agenda`}>Agenda</Link></>;
  const base = modulePath(resource, tenantSlug);
  return <><Link className="button button--secondary button--md" to={base}>List</Link><Link className="button button--secondary button--md" to={`${base}/dashboard`}>Dashboard</Link>{resource === 'projects' ? <><Link className="button button--secondary button--md" to={`${base}/grid`}>Grid</Link><Link className="button button--secondary button--md" to={`${base}/kanban`}>Kanban</Link><Link className="button button--secondary button--md" to={`${base}/gantt`}>Gantt</Link><Link className="button button--secondary button--md" to={`${base}/calendar`}>Calendar</Link></> : null}{resource === 'tasks' ? <><Link className="button button--secondary button--md" to={`${base}/kanban`}>Kanban</Link><Link className="button button--secondary button--md" to={`${base}/calendar`}>Calendar</Link><Link className="button button--secondary button--md" to={`${base}/my`}>My Tasks</Link><Link className="button button--secondary button--md" to={`${base}/team`}>Team</Link></> : null}{resource === 'todo' ? <><Link className="button button--secondary button--md" to={`${base}/kanban`}>Kanban</Link><Link className="button button--secondary button--md" to={`${base}/calendar`}>Calendar</Link></> : null}{resource === 'issues' ? <Link className="button button--secondary button--md" to={`${base}/kanban`}>Kanban</Link> : null}{resource === 'renewals' ? <><Link className="button button--secondary button--md" to={`${base}/calendar`}>Calendar</Link><Link className="button button--secondary button--md" to={TENANT_ROUTES.crm.clientRenewals(tenantSlug)}>Clients</Link><Link className="button button--secondary button--md" to={TENANT_ROUTES.crm.vendorRenewals(tenantSlug)}>Vendors</Link></> : null}</>;
}

function useOperationalQuery(resource: Exclude<Resource, 'renewals' | 'calendar'>, mode: ViewMode) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const query = useQuery({ queryKey: tenantQueryKeys.list(tenantKey, `${resource}-${mode}`, { search, page }), queryFn: () => listFor(resource, mode)({ search, page, per_page: 25 }) });
  return { rows: query.data?.data ?? [], total: query.data?.total ?? query.data?.data.length ?? 0, search, setSearch, page, setPage, selected, setSelected, isLoading: query.isLoading, error: query.error ? errorMessage(query.error) : undefined };
}

function useRenewalQuery(scope?: 'client' | 'vendor') {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const fn = scope === 'client' ? tenantOperationsApi.renewals.client : scope === 'vendor' ? tenantOperationsApi.renewals.vendor : tenantOperationsApi.renewals.list;
  const query = useQuery({ queryKey: tenantQueryKeys.list(tenantKey, `renewals-${scope ?? 'all'}`, { search, page }), queryFn: () => fn({ search, page, per_page: 25 }) });
  return { rows: query.data?.data ?? [], total: query.data?.total ?? 0, search, setSearch, page, setPage, isLoading: query.isLoading, error: query.error ? errorMessage(query.error) : undefined };
}

function useCalendarQuery(view: string) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const query = useQuery({ queryKey: tenantQueryKeys.list(tenantKey, `calendar-${view}`, { search, page }), queryFn: () => tenantOperationsApi.calendar.events.list({ search, page, per_page: 25, view: view as ApiQuery['view'] }) });
  return { rows: query.data?.data ?? [], total: query.data?.total ?? 0, search, setSearch, page, setPage, isLoading: query.isLoading };
}

function useSelectors(enabled = true) {
  const users = useQuery({ queryKey: tenantQueryKeys.list(tenantKey, 'ops-users'), queryFn: () => tenantAccessApi.users.list({ per_page: 100 }), enabled });
  const teams = useQuery({ queryKey: tenantQueryKeys.list(tenantKey, 'ops-teams'), queryFn: () => tenantAccessApi.teams.list({ per_page: 100 }), enabled });
  const clients = useQuery({ queryKey: tenantQueryKeys.list(tenantKey, 'ops-clients'), queryFn: () => tenantCrmApi.clients.list({ per_page: 100 }), enabled });
  const vendors = useQuery({ queryKey: tenantQueryKeys.list(tenantKey, 'ops-vendors'), queryFn: () => tenantCrmApi.vendors.list({ per_page: 100 }), enabled });
  const projects = useQuery({ queryKey: tenantQueryKeys.list(tenantKey, 'ops-projects'), queryFn: () => tenantOperationsApi.projects.list({ per_page: 100 }), enabled });
  const tasks = useQuery({ queryKey: tenantQueryKeys.list(tenantKey, 'ops-tasks'), queryFn: () => tenantOperationsApi.tasks.list({ per_page: 100 }), enabled });
  const calendars = useQuery({ queryKey: tenantQueryKeys.list(tenantKey, 'ops-calendars'), queryFn: () => tenantOperationsApi.calendar.calendars.list({ per_page: 100 }), enabled });
  const rooms = useQuery({ queryKey: tenantQueryKeys.list(tenantKey, 'ops-rooms'), queryFn: () => tenantOperationsApi.calendar.rooms.list(), enabled });
  const lookups = useQuery({ queryKey: tenantQueryKeys.list(tenantKey, 'ops-lookups'), queryFn: () => tenantOperationsApi.lookups({ groups: 'project_status,project_priority,task_status,task_priority,issue_status,issue_priority,renewal_status' }), enabled });
  return { users: users.data?.data ?? [], teams: teams.data?.data ?? [], clients: clients.data?.data ?? [], vendors: vendors.data?.data ?? [], projects: projects.data?.data ?? [], tasks: tasks.data?.data ?? [], calendars: calendars.data?.data ?? [], rooms: rooms.data?.data.meeting_rooms ?? [], lookups: lookups.data?.data ?? [] };
}

function renderField(field: Field, form: Record<string, string>, setForm: (form: Record<string, string>) => void, selectors: ReturnType<typeof useSelectors>) {
  const set = (value: string) => setForm({ ...form, [field.name]: value });
  if (field.type === 'textarea') return <label key={field.name}><span>{field.label}</span><textarea rows={4} value={form[field.name] ?? ''} onChange={(event) => set(event.target.value)} /></label>;
  if (field.type === 'select') return <SelectInput key={field.name} label={field.label} value={form[field.name] ?? ''} onChange={set} options={optionsFor(field.options ?? '', selectors)} labelKeys={field.labelKeys ?? ['display_name', 'name', 'title', 'email']} />;
  if (field.type === 'checkbox') return <label key={field.name} className="check-row"><input type="checkbox" checked={form[field.name] === 'true'} onChange={(event) => set(event.target.checked ? 'true' : 'false')} /><span>{field.label}</span></label>;
  return <SimpleInput key={field.name} label={field.label} type={field.type ?? 'text'} value={form[field.name] ?? ''} onChange={set} />;
}

type Field = { name: string; label: string; type?: string; options?: string; labelKeys?: string[] };
const projectFields: Field[] = [{ name: 'project_number', label: 'Project Number (unique)' }, { name: 'name', label: 'Name' }, { name: 'client_party_id', label: 'Client', type: 'select', options: 'clients', labelKeys: ['display_name', 'client_code', 'email'] }, { name: 'project_manager_id', label: 'Project Manager', type: 'select', options: 'users' }, { name: 'start_date', label: 'Start Date', type: 'date' }, { name: 'due_date', label: 'Due Date', type: 'date' }, { name: 'budget_amount', label: 'Budget Amount', type: 'number' }, { name: 'progress', label: 'Progress', type: 'number' }, { name: 'description', label: 'Description', type: 'textarea' }];
const taskFields: Field[] = [{ name: 'task_number', label: 'Task Number' }, { name: 'title', label: 'Title' }, { name: 'project_id', label: 'Project', type: 'select', options: 'projects', labelKeys: ['name', 'project_number'] }, { name: 'assigned_to', label: 'Assignee', type: 'select', options: 'users' }, { name: 'assigned_team_id', label: 'Team', type: 'select', options: 'teams' }, { name: 'start_at', label: 'Start At', type: 'datetime-local' }, { name: 'due_at', label: 'Due At', type: 'datetime-local' }, { name: 'estimated_minutes', label: 'Estimated Minutes', type: 'number' }, { name: 'progress', label: 'Progress', type: 'number' }, { name: 'description', label: 'Description', type: 'textarea' }];
const todoFields: Field[] = [{ name: 'name', label: 'Name' }, { name: 'owner_user_id', label: 'Owner', type: 'select', options: 'users' }, { name: 'team_id', label: 'Team', type: 'select', options: 'teams' }, { name: 'visibility', label: 'Visibility' }, { name: 'color', label: 'Color' }, { name: 'is_default', label: 'Default List', type: 'checkbox' }, { name: 'description', label: 'Description', type: 'textarea' }];
const issueFields: Field[] = [{ name: 'issue_number', label: 'Issue Number' }, { name: 'client_party_id', label: 'Client', type: 'select', options: 'clients', labelKeys: ['display_name', 'client_code', 'email'] }, { name: 'project_id', label: 'Project', type: 'select', options: 'projects', labelKeys: ['name', 'project_number'] }, { name: 'title', label: 'Title' }, { name: 'assigned_to', label: 'Assignee', type: 'select', options: 'users' }, { name: 'assigned_team_id', label: 'Team', type: 'select', options: 'teams' }, { name: 'due_at', label: 'Due At', type: 'datetime-local' }, { name: 'description', label: 'Description', type: 'textarea' }];
const renewalFields: Field[] = [{ name: 'renewal_number', label: 'Renewal Number' }, { name: 'party_id', label: 'Client/Vendor', type: 'select', options: 'parties', labelKeys: ['display_name', 'email'] }, { name: 'renewal_type', label: 'Renewal Type' }, { name: 'title', label: 'Title' }, { name: 'start_date', label: 'Start Date', type: 'date' }, { name: 'end_date', label: 'End Date', type: 'date' }, { name: 'renewal_date', label: 'Renewal Date', type: 'date' }, { name: 'amount', label: 'Amount', type: 'number' }, { name: 'owner_user_id', label: 'Owner', type: 'select', options: 'users' }, { name: 'auto_renew', label: 'Auto Renew', type: 'checkbox' }, { name: 'description', label: 'Description', type: 'textarea' }];
const calendarFields: Field[] = [{ name: 'calendar_id', label: 'Calendar', type: 'select', options: 'calendars', labelKeys: ['name', 'calendar_type'] }, { name: 'title', label: 'Title' }, { name: 'location', label: 'Location' }, { name: 'starts_at', label: 'Starts At', type: 'datetime-local' }, { name: 'ends_at', label: 'Ends At', type: 'datetime-local' }, { name: 'timezone', label: 'Timezone' }, { name: 'all_day', label: 'All Day', type: 'checkbox' }, { name: 'status', label: 'Status' }, { name: 'description', label: 'Description', type: 'textarea' }];

function fieldsFor(resource: Exclude<Resource, 'calendar'>) { return ({ projects: projectFields, tasks: taskFields, todo: todoFields, issues: issueFields, renewals: renewalFields } as const)[resource]; }
function actionFields(action: ModalState, resource: Resource): Field[] {
  if (action === 'assign' || action === 'bulk') return [{ name: 'assigned_to', label: 'Assignee', type: 'select', options: 'users' }, { name: 'assigned_team_id', label: 'Team', type: 'select', options: 'teams' }];
  if (action === 'status' || action === 'drag') return [{ name: 'status_id', label: 'Target Status', type: 'select', options: 'lookups' }, { name: 'progress', label: 'Progress', type: 'number' }];
  if (action === 'member') return [{ name: 'user_id', label: 'User', type: 'select', options: 'users' }, { name: 'team_id', label: 'Team', type: 'select', options: 'teams' }, { name: 'allocation_percent', label: 'Allocation %', type: 'number' }];
  if (action === 'phase') return [{ name: 'name', label: 'Phase Name' }, { name: 'start_date', label: 'Start Date', type: 'date' }, { name: 'due_date', label: 'Due Date', type: 'date' }];
  if (action === 'milestone') return [{ name: 'name', label: 'Milestone Name' }, { name: 'due_date', label: 'Due Date', type: 'date' }];
  if (action === 'completeMilestone') return [{ name: 'milestone_id', label: 'Milestone Id', type: 'number' }];
  if (action === 'logTime' || action === 'timer') return [{ name: 'user_id', label: 'User', type: 'select', options: 'users' }, { name: 'started_at', label: 'Started At', type: 'datetime-local' }, { name: 'ended_at', label: 'Ended At', type: 'datetime-local' }, { name: 'minutes', label: 'Minutes', type: 'number' }, { name: 'notes', label: 'Notes', type: 'textarea' }];
  if (action === 'expense') return [{ name: 'vendor_party_id', label: 'Vendor', type: 'select', options: 'vendors', labelKeys: ['display_name', 'vendor_code', 'email'] }, { name: 'amount', label: 'Amount', type: 'number' }, { name: 'expense_date', label: 'Expense Date', type: 'date' }];
  if (action === 'dependency') return [{ name: resource === 'projects' ? 'depends_on_task_id' : 'depends_on_task_id', label: 'Depends On Task', type: 'select', options: 'tasks', labelKeys: ['title', 'task_number'] }, { name: 'dependency_type', label: 'Dependency Type' }];
  if (action === 'checklist') return [{ name: 'title', label: 'Checklist Title' }];
  if (action === 'watcher' || action === 'attendees') return [{ name: 'user_id', label: 'User', type: 'select', options: 'users' }];
  if (action === 'recurrence') return [{ name: 'recurrence_rule', label: 'Recurrence Rule' }];
  if (action === 'clone') return [{ name: 'task_number', label: 'New Task Number' }];
  if (action === 'share') return [{ name: 'visibility', label: 'Visibility' }, { name: 'team_id', label: 'Team', type: 'select', options: 'teams' }];
  if (action === 'reply') return [{ name: 'comment', label: 'Reply', type: 'textarea' }];
  if (action === 'createTask') return taskFields.slice(0, 5);
  if (action === 'renew') return [{ name: 'new_end_date', label: 'New End Date', type: 'date' }, { name: 'renewal_date', label: 'Next Renewal Date', type: 'date' }, { name: 'remarks', label: 'Remarks' }];
  if (action === 'reminder' || action === 'sendReminder') return [{ name: 'remind_at', label: 'Remind At', type: 'datetime-local' }, { name: 'channel', label: 'Channel' }];
  if (action === 'cancel' || action === 'archive' || action === 'resolve' || action === 'close' || action === 'reopen') return [{ name: 'reason', label: 'Reason', type: 'textarea' }];
  if (action === 'room') return [{ name: 'room_id', label: 'Room', type: 'select', options: 'rooms', labelKeys: ['name', 'location'] }];
  if (action === 'video') return [{ name: 'provider', label: 'Provider' }, { name: 'meeting_url', label: 'Meeting URL' }, { name: 'passcode', label: 'Passcode' }];
  return [];
}

function runAction(resource: Resource, action: ModalState, id: string, form: Record<string, string>, selectedIds: string[]) {
  const body = normalize(form);
  if (resource === 'projects') {
    if (action === 'archive') return tenantOperationsApi.projects.archive(id, body);
    if (action === 'member') return tenantOperationsApi.projects.childCreate(id, 'members', body);
    if (action === 'phase') return tenantOperationsApi.projects.childCreate(id, 'phases', body);
    if (action === 'milestone') return tenantOperationsApi.projects.childCreate(id, 'milestones', body);
    if (action === 'completeMilestone') return tenantOperationsApi.projects.completeMilestone(id, form.milestone_id);
    if (action === 'logTime') return tenantOperationsApi.projects.childCreate(id, 'time-logs', body);
    if (action === 'expense') return tenantOperationsApi.projects.childCreate(id, 'expenses', body);
  }
  if (resource === 'tasks') {
    if (action === 'assign') return tenantOperationsApi.tasks.assign(id, body);
    if (action === 'status' || action === 'drag') return tenantOperationsApi.tasks.status(id, body);
    if (action === 'bulk') return tenantOperationsApi.tasks.bulkUpdate({ task_ids: selectedIds, updates: body });
    if (action === 'checklist') return tenantOperationsApi.tasks.childCreate(id, 'checklists', body);
    if (action === 'dependency') return tenantOperationsApi.tasks.childCreate(id, 'dependencies', body);
    if (action === 'watcher') return tenantOperationsApi.tasks.childCreate(id, 'watchers', body);
    if (action === 'logTime' || action === 'timer') return tenantOperationsApi.tasks.childCreate(id, 'time-logs', body);
    if (action === 'clone') return tenantOperationsApi.tasks.clone(id, body);
    if (action === 'recurrence') return tenantOperationsApi.tasks.update(id, body);
    if (action === 'share') return tenantOperationsApi.tasks.update(id, body);
  }
  if (resource === 'issues') {
    if (action === 'assign') return tenantOperationsApi.issues.assign(id, body);
    if (action === 'status' || action === 'drag') return tenantOperationsApi.issues.status(id, body);
    if (action === 'resolve') return tenantOperationsApi.issues.resolve(id);
    if (action === 'close') return tenantOperationsApi.issues.close(id);
    if (action === 'reopen') return tenantOperationsApi.issues.reopen(id);
    if (action === 'logTime') return tenantOperationsApi.issues.logTime(id, body);
    if (action === 'createTask') return tenantOperationsApi.issues.createTask(id, body);
    if (action === 'reply') return tenantCrmApi.notes.create({ notable_type: 'client_issue', notable_uuid: id, note: form.comment });
  }
  if (resource === 'renewals') {
    if (action === 'renew') return tenantOperationsApi.renewals.renew(id, body);
    if (action === 'cancel') return tenantOperationsApi.renewals.cancel(id, body);
    if (action === 'reminder') return tenantOperationsApi.renewals.childCreate(id, 'reminders', body);
    if (action === 'sendReminder') return tenantOperationsApi.renewals.sendReminder(id, body);
    if (action === 'drag') return tenantOperationsApi.renewals.update(id, body);
  }
  if (resource === 'calendar') {
    if (action === 'attendees') return tenantOperationsApi.calendar.events.childCreate(id, 'attendees', { attendee_type: 'user', ...body });
    if (action === 'reminder') return tenantOperationsApi.calendar.events.childCreate(id, 'reminders', body);
    if (action === 'recurrence') return tenantOperationsApi.calendar.events.update(id, body);
    if (action === 'room') return tenantOperationsApi.calendar.events.roomBooking(id, body);
    if (action === 'video') return tenantOperationsApi.calendar.events.videoMeeting(id, body);
    if (action === 'drag') return tenantOperationsApi.calendar.events.reschedule(id, body);
  }
  if (resource === 'todo' && action === 'share') return tenantOperationsApi.todo.update(id, body);
  return Promise.resolve({});
}

const dangerActions: ModalState[] = ['archive', 'cancel', 'close'];

function actionTitle(action: ModalState, resource: Resource) { return label(`${action ?? 'action'} ${resource}`); }
function actionButton(action: ModalState) { if (action === 'archive') return 'Archive'; if (action === 'cancel') return 'Cancel Renewal'; if (action === 'drag') return 'Confirm Move'; return 'Save'; }

function apiFor(resource: Exclude<Resource, 'calendar'>) { return ({ projects: tenantOperationsApi.projects, tasks: tenantOperationsApi.tasks, todo: tenantOperationsApi.todo, issues: tenantOperationsApi.issues, renewals: tenantOperationsApi.renewals } as const)[resource]; }
function kanbanFor(resource: Exclude<Resource, 'renewals' | 'calendar'>) { return ({ projects: tenantOperationsApi.projects.kanban, tasks: tenantOperationsApi.tasks.kanban, todo: tenantOperationsApi.todo.kanban, issues: tenantOperationsApi.issues.kanban } as const)[resource]; }
function listFor(resource: Exclude<Resource, 'renewals' | 'calendar'>, mode: ViewMode) { if (resource === 'tasks' && mode === 'my') return tenantOperationsApi.tasks.my; if (resource === 'tasks' && mode === 'team') return tenantOperationsApi.tasks.team; if (resource === 'projects' && mode === 'calendar') return async () => ({ data: (await tenantOperationsApi.projects.calendar()).data.projects, total: (await tenantOperationsApi.projects.calendar()).data.projects.length }); if (resource === 'tasks' && mode === 'calendar') return async () => ({ data: (await tenantOperationsApi.tasks.calendar()).data.tasks, total: (await tenantOperationsApi.tasks.calendar()).data.tasks.length }); if (resource === 'todo' && mode === 'calendar') return async () => ({ data: (await tenantOperationsApi.todo.calendar()).data.tasks, total: (await tenantOperationsApi.todo.calendar()).data.tasks.length }); return apiFor(resource).list; }
function exportFor(resource: Exclude<Resource, 'calendar'>) { return ({ projects: tenantOperationsApi.projects.export, tasks: tenantOperationsApi.tasks.export, todo: tenantOperationsApi.todo.export, issues: tenantOperationsApi.issues.export, renewals: tenantOperationsApi.renewals.export } as const)[resource]; }

function columnsFor(resource: Resource, open: (row: OperationsRecord) => void): DataTableColumn<OperationsRecord>[] {
  const keys = { projects: ['project_number', 'name', 'client_name', 'manager_name', 'due_date', 'progress'], tasks: ['task_number', 'title', 'project_name', 'assignee_name', 'due_at', 'progress'], todo: ['name', 'owner_name', 'team_name', 'visibility', 'status'], issues: ['issue_number', 'title', 'client_name', 'assignee_name', 'due_at', 'resolved_at'], renewals: ['renewal_number', 'title', 'party_name', 'renewal_type', 'renewal_date', 'amount'], calendar: ['title', 'calendar_name', 'starts_at', 'ends_at', 'location', 'status'] }[resource];
  return genericColumns(keys).map((column) => ['name', 'title'].includes(column.id) ? { ...column, cell: (row) => <button type="button" className="link-button" onClick={() => open(row)}>{textOf(row, [column.id], 'Open')}</button> } : column);
}
function genericColumns(keys: string[]): DataTableColumn<OperationsRecord>[] { return keys.map((key) => ({ id: key, header: label(key), accessor: (row) => printable(row[key]), cell: (row) => key.includes('status') ? <StatusBadge tone={statusTone(row[key])}>{displayValue(row[key])}</StatusBadge> : formatValue(key, row[key]) })); }
function actionColumn(cell: (row: OperationsRecord) => ReactNode): DataTableColumn<OperationsRecord> { return { id: 'actions', header: 'Actions', enableHiding: false, cell }; }

function RecordList({ title, rows, action }: { title: string; rows: OperationsRecord[]; action?: ReactNode }) { return <section className="settings-panel"><div className="surface-actions"><h2>{title}</h2>{action}</div>{rows.length === 0 ? <div className="empty-state">No records returned.</div> : <DataTable columns={genericColumns(visibleKeys(rows[0]))} data={rows} getRowId={idOf} total={rows.length} />}</section>; }
function DetailGrid({ record }: { record: Record<string, unknown> }) { const entries = Object.entries(record).filter(([key, value]) => value !== null && value !== undefined && value !== '' && !['id', 'tenant_id', 'deleted_at'].includes(key)); return entries.length === 0 ? <div className="empty-state">No details returned.</div> : <dl className="detail-grid">{entries.map(([key, value]) => <div key={key}><dt>{label(key)}</dt><dd>{displayValue(value)}</dd></div>)}</dl>; }
function SimpleInput({ label: inputLabel, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { return <label><span>{inputLabel}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} /></label>; }
function SelectInput({ label: inputLabel, value, onChange, options, labelKeys }: { label: string; value: string; onChange: (value: string) => void; options: OperationsRecord[]; labelKeys: string[] }) { return <label><span>{inputLabel}</span><select value={value} onChange={(event) => onChange(event.target.value)}><option value="">Select {inputLabel.toLowerCase()}</option>{options.map((option) => <option key={idOf(option)} value={idOf(option)}>{recordLabel(option, labelKeys)}</option>)}</select></label>; }
function HistoryDrawer({ open, record, bundle, onClose }: { open: boolean; record?: OperationsRecord | null; bundle?: OperationsRecord; onClose: () => void }) { return <AppDrawer open={open} onClose={onClose} title="Renewal History" size="lg"><RecordList title="History" rows={asRows((bundle as Record<string, unknown> | undefined)?.history ?? record?.history)} /></AppDrawer>; }
function SyncDrawer({ open, onClose }: { open: boolean; onClose: () => void }) { return <AppDrawer open={open} onClose={onClose} title="Calendar Sync Result" size="lg"><div className="surface-state">Calendar sync results will appear here when provider sync jobs are connected.</div></AppDrawer>; }
function ConflictModal({ open, onClose }: { open: boolean; onClose: () => void }) { return <AppModal open={open} onClose={onClose} title="Conflict Warning" footer={<Button type="button" onClick={onClose}>Close</Button>}><div className="surface-error">The selected room or attendee has a scheduling conflict. Choose another time or resource.</div></AppModal>; }
function TimerPanel({ task }: { task?: OperationsRecord | null }) { return <div className="surface-state"><Timer size={16} aria-hidden />Timer ready for {recordTitle(task, 'task')}. Save a time log when complete.</div>; }
function AttachmentPreview() { return <div className="surface-state"><Paperclip size={16} aria-hidden />Attachment preview uses the shared files/attachments drawer when a file is selected.</div>; }
function JobResult({ data }: { data: unknown }) { const job = data && typeof data === 'object' && 'job' in data ? (data as { job?: OperationsRecord }).job : data; return <div className="surface-state">Job queued{job && typeof job === 'object' ? `: ${textOf(job, ['uuid', 'id', 'status'], 'pending')}` : '.'}<br />Run <code>php artisan queue:work --queue=exports,imports,default</code></div>; }

function optionsFor(key: string, selectors: ReturnType<typeof useSelectors>) { if (key === 'users') return selectors.users; if (key === 'teams') return selectors.teams; if (key === 'clients') return selectors.clients; if (key === 'vendors') return selectors.vendors; if (key === 'parties') return [...selectors.clients, ...selectors.vendors]; if (key === 'projects') return selectors.projects; if (key === 'tasks') return selectors.tasks; if (key === 'calendars') return selectors.calendars; if (key === 'rooms') return selectors.rooms; if (key === 'lookups') return selectors.lookups; return []; }
function initialForm(resource: Exclude<Resource, 'calendar'>, record: OperationsRecord) { return Object.fromEntries(fieldsFor(resource).map((field) => [field.name, textOf(record, [field.name, `${field.name.replace('_id', '')}_uuid`])])); }
function initialEventForm(event?: OperationsRecord) { return Object.fromEntries(calendarFields.map((field) => [field.name, textOf(event, [field.name, `${field.name.replace('_id', '')}_uuid`], field.name === 'timezone' ? 'Asia/Kolkata' : '')])); }
function formPayload(resource: Exclude<Resource, 'calendar'>, form: Record<string, string>) { return normalize(Object.fromEntries(fieldsFor(resource).map((field) => [field.name, form[field.name] ?? '']))); }
function eventPayload(form: Record<string, string>) { return normalize(Object.fromEntries(calendarFields.map((field) => [field.name, form[field.name] ?? '']))); }
function normalize(form: Record<string, string>) { return Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value === '' ? null : ['auto_renew', 'is_default', 'is_recurring', 'all_day', 'billable'].includes(key) ? value === 'true' : value])); }
function rootRecord(resource: Exclude<Resource, 'calendar'>, bundle?: OperationsRecord): OperationsRecord { const key = resource === 'todo' ? 'todo_list' : singular(resource); return ((bundle as Record<string, unknown> | undefined)?.[key] ?? bundle ?? {}) as OperationsRecord; }
function tabsFor(resource: Exclude<Resource, 'calendar'>) { return ({ projects: [['details', 'Details'], ['members', 'Members'], ['phases', 'Phases'], ['milestones', 'Milestones'], ['tasks', 'Tasks'], ['time_logs', 'Time Logs'], ['expenses', 'Expenses'], ['activity', 'Activity']], tasks: [['details', 'Details'], ['checklists', 'Checklists'], ['comments', 'Comments'], ['dependencies', 'Dependencies'], ['watchers', 'Watchers'], ['time_logs', 'Time Logs'], ['activity', 'Activity']], todo: [['details', 'Details'], ['tasks', 'Tasks']], issues: [['details', 'Details'], ['linked_tasks', 'Linked Tasks'], ['time_logs', 'Time Logs'], ['activity', 'Activity']], renewals: [['details', 'Details'], ['items', 'Items'], ['reminders', 'Reminders'], ['history', 'History']] } as const)[resource]; }
function modulePath(resource: Resource, tenantSlug?: string) { if (resource === 'projects') return TENANT_ROUTES.projects.projects(tenantSlug); if (resource === 'tasks') return TENANT_ROUTES.projects.tasks(tenantSlug); if (resource === 'todo') return TENANT_ROUTES.projects.todo(tenantSlug); if (resource === 'issues') return TENANT_ROUTES.support.issues(tenantSlug); if (resource === 'renewals') return TENANT_ROUTES.crm.renewals(tenantSlug); return TENANT_ROUTES.projects.calendar(tenantSlug); }
function permissionBase(resource: Resource) { return resource === 'todo' ? 'todo' : resource === 'issues' ? 'issue' : resource === 'renewals' ? 'renewal' : resource === 'projects' ? 'project' : resource === 'calendar' ? 'calendar' : 'task'; }
function modeTitle(mode: ViewMode) { return ['list'].includes(mode) ? '' : label(mode); }
function calendarTitle(view: string) { if (view === 'my') return 'My Schedule'; if (view === 'team') return 'Team Calendar'; return `${label(view)} Calendar`; }
function idOf(record?: OperationsRecord | null) { return String(record?.uuid ?? record?.id ?? ''); }
function textOf(record: unknown, keys: string[], fallback = '') { if (!record || typeof record !== 'object') return fallback; const payload = record as Record<string, unknown>; for (const key of keys) { const value = payload[key]; if (value !== null && value !== undefined && value !== '') return String(value); } return fallback; }
function recordTitle(record: unknown, fallback: string) { return textOf(record, ['name', 'title', 'display_name', 'project_number', 'task_number', 'issue_number', 'renewal_number'], fallback); }
function recordSubtitle(record: unknown) { return textOf(record, ['description', 'client_name', 'project_name', 'assignee_name', 'party_name', 'calendar_name', 'email', 'status'], '-'); }
function recordLabel(record: OperationsRecord, keys: string[]) { const primary = textOf(record, keys, recordTitle(record, 'Record')); const secondary = textOf(record, ['email', 'project_number', 'task_number', 'issue_number', 'renewal_number']); return secondary && secondary !== primary ? `${primary} (${secondary})` : primary; }
function displayValue(value: unknown): string { if (value === null || value === undefined || value === '') return '-'; if (Array.isArray(value)) return `${value.length} item${value.length === 1 ? '' : 's'}`; if (typeof value === 'boolean') return value ? 'Yes' : 'No'; if (typeof value === 'object') return recordTitle(value, 'Details available'); return String(value); }
function printable(value: unknown) { return displayValue(value); }
function formatValue(key: string, value: unknown) { if (['amount', 'budget_amount', 'total_budget', 'project_expenses'].some((part) => key.includes(part))) return money(value); if (key.includes('date') || key.endsWith('_at')) return displayValue(value).slice(0, 16); return displayValue(value); }
function money(value: unknown) { const amount = Number(value ?? 0); return Number.isFinite(amount) && amount !== 0 ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount) : '-'; }
function dateRange(start: unknown, end: unknown) { return `${displayValue(start).slice(0, 10)} to ${displayValue(end).slice(0, 10)}`; }
function label(value: string) { return value.replace(/[-_]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()); }
function singular(value: string) { return value.endsWith('s') ? value.slice(0, -1) : value; }
function asRows(value: unknown): OperationsRecord[] { return Array.isArray(value) ? value as OperationsRecord[] : []; }
function visibleKeys(row: OperationsRecord) { return Object.keys(row).filter((key) => !['id', 'tenant_id', 'deleted_at', 'metadata', 'recurrence_rule'].includes(key)).slice(0, 7); }
function scrub(record: OperationsRecord) { return Object.fromEntries(Object.entries(record).filter(([key]) => !['recurrence_rule', 'metadata'].includes(key))); }
function statusTone(value: unknown): 'neutral' | 'success' | 'warning' | 'danger' | 'info' { const status = String(value ?? '').toLowerCase(); if (['active', 'completed', 'resolved', 'closed', 'sent', 'booked', 'confirmed'].includes(status)) return 'success'; if (['pending', 'open', 'queued', 'scheduled'].includes(status)) return 'warning'; if (['failed', 'cancelled', 'overdue', 'archived'].includes(status)) return 'danger'; return 'neutral'; }
function errorMessage(error: unknown) { if (error instanceof ApiError) return error.message; if (error instanceof Error) return error.message; return 'Request failed.'; }
