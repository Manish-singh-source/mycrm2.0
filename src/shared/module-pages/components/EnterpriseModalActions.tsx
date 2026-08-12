import { useState } from 'react';

import {
  ActivityDrawer,
  AssignUserTeamModal,
  ConfirmDialog,
  ExportModal,
  ImportWizard,
  StatusChangeModal
} from '@/shared/components/workflows';
import type { ActivityTimelineItem } from '@/shared/components/activity';
import type { AuthGuard, Permission } from '@/features/auth/types/authTypes';
import type { EnterpriseActionKey } from '@/shared/module-pages/types';

type EnterpriseModalActionsProps = {
  guard: AuthGuard;
  permission?: Permission;
  active: EnterpriseActionKey | null;
  onClose: () => void;
  selectedCount?: number;
  onConfirm?: (action: EnterpriseActionKey, payload?: Record<string, unknown>) => void;
};

const sampleActivity: ActivityTimelineItem[] = [
  {
    id: 'created',
    actor: 'System',
    event: 'created this record',
    subject: 'Enterprise module pattern',
    occurredAt: new Date().toISOString()
  }
];

export function EnterpriseModalActions({
  guard,
  permission,
  active,
  onClose,
  selectedCount = 0,
  onConfirm
}: EnterpriseModalActionsProps) {
  const [loading] = useState(false);

  return (
    <>
      <AssignUserTeamModal
        open={active === 'assign'}
        onClose={onClose}
        guard={guard}
        permission={permission}
        userSelect={<select><option>Current owner</option><option>Sales Team Lead</option></select>}
        teamSelect={<select><option>Primary team</option><option>Support team</option></select>}
        onAssign={(payload) => {
          onConfirm?.('assign', { ...payload, reason: payload.remarks });
          onClose();
        }}
      />
      <StatusChangeModal
        open={active === 'status'}
        onClose={onClose}
        guard={guard}
        permission={permission}
        statusSelect={<select><option>Active</option><option>Inactive</option><option>Archived</option></select>}
        onSubmit={() => onClose()}
      />
      <ActivityDrawer open={active === 'activity'} onClose={onClose} guard={guard} permission={permission} items={sampleActivity} />
      <ImportWizard
        open={active === 'import'}
        onClose={onClose}
        guard={guard}
        permission={permission}
        step="upload"
        onFilesSelected={() => undefined}
        onNext={() => onClose()}
      />
      <ExportModal
        open={active === 'export'}
        onClose={onClose}
        guard={guard}
        permission={permission}
        columns={['Name', 'Status', 'Owner', 'Updated At']}
        selectedCount={selectedCount}
        onExport={() => onClose()}
      />
      <ConfirmDialog
        open={active === 'clone'}
        onClose={onClose}
        title="Clone record"
        description={`Clone ${selectedCount || 1} selected record${selectedCount === 1 ? '' : 's'}?`}
        confirmLabel="Clone"
        confirmTone="primary"
        guard={guard}
        permission={permission}
        loading={loading}
        onConfirm={(payload) => {
          onConfirm?.('clone', payload);
          onClose();
        }}
      />
      <ConfirmDialog
        open={active === 'archive'}
        onClose={onClose}
        title="Archive records"
        description={`Archive ${selectedCount || 1} selected record${selectedCount === 1 ? '' : 's'}?`}
        confirmLabel="Archive"
        guard={guard}
        permission={permission}
        reasonRequired
        onConfirm={(payload) => {
          onConfirm?.('archive', payload);
          onClose();
        }}
      />
      <ConfirmDialog
        open={active === 'restore'}
        onClose={onClose}
        title="Restore records"
        description={`Restore ${selectedCount || 1} selected record${selectedCount === 1 ? '' : 's'}?`}
        confirmLabel="Restore"
        confirmTone="primary"
        guard={guard}
        permission={permission}
        reasonRequired
        onConfirm={(payload) => {
          onConfirm?.('restore', payload);
          onClose();
        }}
      />
      <ConfirmDialog
        open={active === 'delete'}
        onClose={onClose}
        title="Delete records"
        description={`Delete ${selectedCount || 1} selected record${selectedCount === 1 ? '' : 's'}? This action should be reserved for modules whose API allows deletion.`}
        confirmLabel="Delete"
        typedConfirmation="DELETE"
        guard={guard}
        permission={permission}
        reasonRequired
        onConfirm={(payload) => {
          onConfirm?.('delete', payload);
          onClose();
        }}
      />
    </>
  );
}
