import { useState } from 'react';
import { Archive, Bell, Copy, FileText, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import type { FieldValues } from 'react-hook-form';

import { PageHeader, StatusBadge, Tabs } from '@/shared/components/layout';
import { Button, PermissionButton } from '@/shared/components/ui';
import { FilesDrawer, NotesDrawer, ReminderModal } from '@/shared/components/workflows';
import { EnterpriseModalActions } from '@/shared/module-pages/components/EnterpriseModalActions';
import type { EnterpriseActionKey, EnterpriseModuleAdapter, EnterpriseRecord } from '@/shared/module-pages/types';

type EnterpriseViewPageProps<TRow extends EnterpriseRecord, TForm extends FieldValues> = {
  adapter: EnterpriseModuleAdapter<TRow, TForm>;
  record: TRow;
  onBack: () => void;
  onEdit: () => void;
};

export function EnterpriseViewPage<TRow extends EnterpriseRecord, TForm extends FieldValues>({
  adapter,
  record,
  onBack,
  onEdit
}: EnterpriseViewPageProps<TRow, TForm>) {
  const tabs = adapter.getTabs?.(record) ?? [
    { id: 'overview', label: 'Overview' },
    { id: 'activity', label: 'Activity' }
  ];
  const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? 'overview');
  const [drawer, setDrawer] = useState<'notes' | 'files' | null>(null);
  const [modal, setModal] = useState<'reminder' | EnterpriseActionKey | null>(null);
  const status = adapter.getStatus?.(record);

  return (
    <section className="enterprise-module-page">
      <PageHeader
        eyebrow={adapter.guard}
        title={adapter.getTitle(record)}
        description={adapter.getSubtitle?.(record) as string | undefined}
        meta={status ? <StatusBadge tone={status.tone}>{status.label}</StatusBadge> : null}
        tabs={<Tabs tabs={tabs} activeId={activeTab} onChange={setActiveTab} ariaLabel={`${adapter.label} tabs`} />}
        actions={
          <>
            <Button type="button" variant="secondary" onClick={onBack}>Back</Button>
            <PermissionButton guard={adapter.guard} permission={adapter.permissions?.edit ?? ''} type="button" onClick={onEdit}>
              <Pencil size={16} aria-hidden="true" />
              Edit
            </PermissionButton>
            <Button type="button" variant="secondary" onClick={() => setDrawer('notes')}>
              <FileText size={16} aria-hidden="true" />
              Notes
            </Button>
            <Button type="button" variant="secondary" onClick={() => setDrawer('files')}>Files</Button>
            <Button type="button" variant="secondary" onClick={() => setModal('reminder')}>
              <Bell size={16} aria-hidden="true" />
              Reminder
            </Button>
          </>
        }
      />

      <div className="enterprise-view-actions">
        <Button type="button" variant="secondary" size="sm" onClick={() => setModal('assign')}>Assign</Button>
        <Button type="button" variant="secondary" size="sm" onClick={() => setModal('status')}>Change status</Button>
        <Button type="button" variant="secondary" size="sm" onClick={() => setModal('clone')}>
          <Copy size={14} aria-hidden="true" />
          Clone
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={() => setModal('archive')}>
          <Archive size={14} aria-hidden="true" />
          Archive
        </Button>
        <Button type="button" variant="danger" size="sm" onClick={() => setModal('delete')}>
          <Trash2 size={14} aria-hidden="true" />
          Delete
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setModal('activity')} aria-label="Open action menu">
          <MoreHorizontal size={16} aria-hidden="true" />
        </Button>
      </div>

      <article className="enterprise-view-panel">
        {adapter.renderTab?.(activeTab, record) ?? (
          <dl className="enterprise-summary-list">
            {Object.entries(record).map(([key, value]) => (
              <div key={key}>
                <dt>{key}</dt>
                <dd>{String(value ?? '-')}</dd>
              </div>
            ))}
          </dl>
        )}
      </article>

      <NotesDrawer open={drawer === 'notes'} onClose={() => setDrawer(null)} guard={adapter.guard} permission={adapter.permissions?.view} notes={[]} onAdd={() => undefined} />
      <FilesDrawer open={drawer === 'files'} onClose={() => setDrawer(null)} guard={adapter.guard} permission={adapter.permissions?.view} files={[]} onUpload={() => undefined} />
      <ReminderModal open={modal === 'reminder'} onClose={() => setModal(null)} guard={adapter.guard} permission={adapter.permissions?.edit} onSave={() => setModal(null)} />
      <EnterpriseModalActions
        guard={adapter.guard}
        permission={adapter.permissions?.edit}
        active={modal as EnterpriseActionKey | null}
        selectedCount={1}
        onClose={() => setModal(null)}
      />
    </section>
  );
}
